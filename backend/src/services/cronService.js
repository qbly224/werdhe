const cron      = require('node-cron');
const db        = require('../database');
const { Resend } = require('resend');
const emailService = require('./emailService');

var resend = new Resend(process.env.RESEND_API_KEY);

// ════════════════════════════════════════════════════════
// CRON 1 — Rappels loyer J-3
// Tourne tous les jours à 8h du matin
// ════════════════════════════════════════════════════════
cron.schedule('0 8 * * *', async function() {
  console.log('[CRON] Rappels loyer J-3 — ' + new Date().toLocaleDateString('fr-FR'));
  try {
    // Trouver les locations dont le loyer est dû dans 3 jours
    var result = await db.query(
      `SELECT
         r.id as reservation_id,
         r.locataire_id,
         r.montant_total as loyer,
         l.titre as logement_titre,
         l.adresse,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_loc.email as loc_email,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
         u_prop.email as prop_email
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.statut = 'confirmee'
         AND r.bail_signe = TRUE
         AND EXTRACT(DAY FROM NOW()) = 28`
      // Le 28 de chaque mois = 3 jours avant le 1er du mois suivant
    );

    for (var r of result.rows) {
      // Email au locataire
      await resend.emails.send({
        from: 'Werdhe <no-reply@werdhe.com>',
        to: r.loc_email,
        subject: '🔔 Rappel : votre loyer est dû dans 3 jours',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#1B6B3A;padding:20px;border-radius:10px 10px 0 0">
              <h2 style="color:#fff;margin:0">🏠 Werdhe</h2>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e0e0e0">
              <p>Bonjour <b>${r.loc_prenom}</b>,</p>
              <p>Votre loyer pour <b>${r.logement_titre}</b> est dû dans <b>3 jours</b> (le 1er du mois).</p>
              <div style="background:#E8F5E9;padding:16px;border-radius:8px;margin:16px 0;text-align:center">
                <div style="font-size:24px;font-weight:800;color:#1B6B3A">${new Intl.NumberFormat('fr-FR').format(r.loyer)} GNF</div>
                <div style="color:#555;font-size:13px">à régler avant le 1er du mois</div>
              </div>
              <p>Payez directement depuis votre <a href="https://werdhe.com/dashboard" style="color:#1B6B3A">tableau de bord Werdhe</a>.</p>
              <p style="color:#888;font-size:12px">Werdhe · Plateforme immobilière Guinée</p>
            </div>
          </div>
        `
      });

      // Créer une alerte dans la DB
      await db.query(
        `INSERT INTO alertes (proprietaire_id, logement_id, type, titre, description, priorite)
         SELECT l.proprietaire_id, r.logement_id, 'loyer_retard',
           'Rappel loyer J-3',
           '${r.loc_prenom} ${r.loc_nom} — loyer de ${new Intl.NumberFormat('fr-FR').format(r.loyer)} GNF dû dans 3 jours',
           'normale'
         FROM reservations r
         JOIN logements l ON r.logement_id = l.id
         WHERE r.id = '${r.reservation_id}'`,
        []
      );

      // Email de rappel au locataire
emailService.emailRappelLoyer(
  { prenom: r.locataire_prenom, email: r.locataire_email },
  { titre: r.logement_titre },
  r.prix_mensuel
).catch(console.warn);

      console.log('[CRON] Rappel envoyé à ' + r.loc_email);
    }

    console.log('[CRON] ' + result.rows.length + ' rappel(s) envoyé(s)');
  } catch (err) {
    console.error('[CRON] Erreur rappels loyer:', err.message);
  }
});

// ════════════════════════════════════════════════════════
// CRON 2 — Renouvellements de bail à J-30
// Tourne tous les jours à 9h
// ════════════════════════════════════════════════════════
cron.schedule('0 9 * * *', async function() {
  console.log('[CRON] Vérification renouvellements bail — ' + new Date().toLocaleDateString('fr-FR'));
  try {
    var result = await db.query(
      `SELECT
         r.id, r.date_fin, r.duree_mois, r.montant_total,
         l.titre as logement_titre, l.proprietaire_id,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom, u_loc.email as loc_email,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom, u_prop.email as prop_email
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.statut = 'confirmee'
         AND r.date_fin IS NOT NULL
         AND r.date_fin BETWEEN NOW() AND NOW() + INTERVAL '30 days'
         AND r.renouvellement_notifie IS DISTINCT FROM TRUE`
    );

    for (var r of result.rows) {
      var dateFin = new Date(r.date_fin).toLocaleDateString('fr-FR');

      // Notifier le propriétaire
      await resend.emails.send({
        from: 'Werdhe <no-reply@werdhe.com>',
        to: r.prop_email,
        subject: '📋 Bail expirant dans 30 jours — ' + r.logement_titre,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#1B6B3A;padding:20px;border-radius:10px 10px 0 0">
              <h2 style="color:#fff;margin:0">🏠 Werdhe</h2>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e0e0e0">
              <p>Bonjour <b>${r.prop_prenom}</b>,</p>
              <p>Le bail de <b>${r.loc_prenom} ${r.loc_nom}</b> pour <b>${r.logement_titre}</b> expire le <b>${dateFin}</b>.</p>
              <p>Connectez-vous pour décider du renouvellement :</p>
              <a href="https://werdhe.com/dashboard" style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Gérer le renouvellement →</a>
            </div>
          </div>
        `
      });

      // Notifier le locataire
      await resend.emails.send({
        from: 'Werdhe <no-reply@werdhe.com>',
        to: r.loc_email,
        subject: '📋 Votre bail expire dans 30 jours',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <div style="background:#1B6B3A;padding:20px;border-radius:10px 10px 0 0">
              <h2 style="color:#fff;margin:0">🏠 Werdhe</h2>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e0e0e0">
              <p>Bonjour <b>${r.loc_prenom}</b>,</p>
              <p>Votre bail pour <b>${r.logement_titre}</b> expire le <b>${dateFin}</b>.</p>
              <p>Si vous souhaitez rester, contactez votre propriétaire via Werdhe.</p>
              <a href="https://werdhe.com/dashboard" style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Mon tableau de bord →</a>
            </div>
          </div>
        `
      });

      // Marquer comme notifié
      await db.query(
        'UPDATE reservations SET renouvellement_notifie = TRUE WHERE id = $1',
        [r.id]
      );

      // Alerte dans le dashboard
      await db.query(
        `INSERT INTO alertes (proprietaire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, (SELECT logement_id FROM reservations WHERE id = $2), 'bail_bientot',
           'Bail expirant dans 30 jours',
           $3, 'haute')`,
        [r.proprietaire_id, r.id, r.logement_titre + ' — ' + r.loc_prenom + ' ' + r.loc_nom + ' · Expire le ' + dateFin]
      );
    }

    emailService.emailBailExpirant(
  { prenom: r.locataire_prenom, email: r.locataire_email },
  { prenom: r.prop_prenom, telephone: r.prop_telephone, email: r.prop_email },
  { titre: r.logement_titre },
  r.date_fin
).catch(console.warn);

    console.log('[CRON] ' + result.rows.length + ' renouvellement(s) notifié(s)');
  } catch (err) {
    console.error('[CRON] Erreur renouvellements:', err.message);
  }
});

console.log('[CRON] Service de rappels démarré ✅');

// ════════════════════════════════════════════════════════
// CRON 3 — Rappel préavis J-5
// Tourne tous les jours à 10h
// ════════════════════════════════════════════════════════
cron.schedule('0 10 * * *', async function() {
  console.log('[CRON] Vérification préavis J-5 — ' + new Date().toLocaleDateString('fr-FR'));
  try {
    var result = await db.query(
      `SELECT
         p.*,
         r.locataire_id,
         l.titre as logement_titre, l.proprietaire_id,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom, u_loc.email as loc_email,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom, u_prop.email as prop_email
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.statut = 'envoye'
         AND p.date_sortie_estimee IS NOT NULL
         AND p.date_sortie_estimee::date = (CURRENT_DATE + INTERVAL '5 days')::date`
    );

    for (var p of result.rows) {
      var dateSortie = new Date(p.date_sortie_estimee).toLocaleDateString('fr-FR');

      // Email au locataire
      try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from:    'Werdhe <no-reply@werdhe.com>',
          to:      p.loc_email,
          subject: '⚠️ Rappel — Votre départ est dans 5 jours',
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <div style="background:#C62828;padding:20px;border-radius:12px 12px 0 0">
                <h2 style="color:#fff;margin:0">🏠 Werdhe — Rappel important</h2>
              </div>
              <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                <p>Bonjour <b>${p.loc_prenom}</b>,</p>
                <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
                  <div style="font-size:32px;font-weight:800;color:#C62828">J-5</div>
                  <div style="color:#555;font-size:13px">Votre départ de <b>${p.logement_titre}</b> est prévu le <b>${dateSortie}</b></div>
                </div>
                <p>Pensez à :</p>
                <ul style="color:#555;font-size:13px;line-height:2">
                  <li>Préparer vos affaires</li>
                  <li>Remettre les clés au propriétaire</li>
                  <li>Planifier l'état des lieux de sortie</li>
                </ul>
                <a href="https://werdhe.com/dashboard"
                   style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
                  Accéder à mon espace →
                </a>
              </div>
            </div>
          `
        });
        console.log('[CRON J-5] Email envoyé à ' + p.loc_email);
      } catch (emailErr) {
        console.warn('[CRON J-5] Email non envoyé:', emailErr.message);
      }

      // Notification plateforme pour les deux
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2, 'loyer_retard', $3, $4, 'haute')`,
        [
          p.proprietaire_id,
          (await db.query('SELECT logement_id FROM reservations WHERE id = $1', [p.reservation_id])).rows[0].logement_id,
          '⚠️ Départ imminent J-5 — ' + p.logement_titre,
          p.loc_prenom + ' ' + p.loc_nom + ' · Sortie prévue le ' + dateSortie
        ]
      );

      // Notif locataire
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2, $3, 'loyer_retard', $4, $5, 'haute')`,
        [
          p.proprietaire_id,
          p.locataire_id,
          (await db.query('SELECT logement_id FROM reservations WHERE id = $1', [p.reservation_id])).rows[0].logement_id,
          '⚠️ Votre départ est dans 5 jours',
          'Logement : ' + p.logement_titre + ' · Date de sortie : ' + dateSortie
        ]
      );
    }

    console.log('[CRON J-5] ' + result.rows.length + ' rappel(s) envoyé(s)');
  } catch (err) {
    console.error('[CRON J-5] Erreur:', err.message);
  }
});

// ════════════════════════════════════════════════════════
// CRON 4 — Mise en demeure automatique J+5 loyer impayé
// Tourne tous les jours à 7h
// ════════════════════════════════════════════════════════
cron.schedule('0 7 * * *', async function() {
  console.log('[CRON] Vérification loyers impayés J+5');
  try {
    // Trouver les locations actives dont le loyer du mois courant n'est pas payé
    // et dont on est le 5 du mois (J+5 après le 1er)
    var jour = new Date().getDate();
    if (jour !== 5) return; // On ne lance que le 5 du mois

    var result = await db.query(
      `SELECT
         r.id as reservation_id,
         r.locataire_id,
         r.montant_total as loyer,
         l.titre as logement_titre,
         l.proprietaire_id,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_loc.email as loc_email, u_loc.telephone as loc_tel,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
         u_prop.email as prop_email
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.statut = 'confirmee'
         AND r.bail_signe = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM paiements p
           WHERE p.reservation_id = r.id
             AND p.statut = 'complete'
             AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
         )`
    );

    for (var loc of result.rows) {
      // Envoyer mise en demeure par email
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = require('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          // Email au locataire
          await resend.emails.send({
            from:    'Werdhe <no-reply@werdhe.com>',
            to:      loc.loc_email,
            subject: '⚠️ Mise en demeure — Loyer impayé',
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <div style="background:#B71C1C;padding:20px;border-radius:12px 12px 0 0">
                  <h2 style="color:#fff;margin:0">⚠️ Mise en demeure</h2>
                </div>
                <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                  <p>Bonjour <b>${loc.loc_prenom}</b>,</p>
                  <p>Votre loyer du mois en cours pour <b>${loc.logement_titre}</b> n'a pas été reçu.</p>
                  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:16px;margin:16px 0">
                    <div style="font-size:20px;font-weight:700;color:#B71C1C">
                      ${new Intl.NumberFormat('fr-FR').format(loc.loyer)} GNF
                    </div>
                    <div style="color:#555;font-size:13px">à régler immédiatement</div>
                  </div>
                  <p>Sans règlement sous <b>48h</b>, une procédure de résiliation pourra être engagée.</p>
                  <a href="https://werdhe.com/dashboard"
                     style="display:inline-block;background:#B71C1C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
                    Payer maintenant →
                  </a>
                </div>
              </div>
            `
          });

          // Email au propriétaire
          await resend.emails.send({
            from:    'Werdhe <no-reply@werdhe.com>',
            to:      loc.prop_email,
            subject: '⚠️ Loyer impayé — ' + loc.logement_titre,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <div style="background:#E65100;padding:20px;border-radius:12px 12px 0 0">
                  <h2 style="color:#fff;margin:0">🏠 Werdhe — Alerte loyer</h2>
                </div>
                <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                  <p>Bonjour <b>${loc.prop_prenom}</b>,</p>
                  <p>Le loyer de <b>${loc.loc_prenom} ${loc.loc_nom}</b> pour <b>${loc.logement_titre}</b> n'a pas été payé ce mois-ci.</p>
                  <p>Une mise en demeure automatique a été envoyée au locataire.</p>
                  <a href="https://werdhe.com/dashboard"
                     style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
                    Voir mon dashboard →
                  </a>
                </div>
              </div>
            `
          });
        } catch (emailErr) {
          console.warn('[CRON J+5] Email:', emailErr.message);
        }
      }

      // Alerte dans le dashboard propriétaire
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2, 'loyer_retard', $3, $4, 'haute')`,
        [
          loc.proprietaire_id,
          (await db.query('SELECT logement_id FROM reservations WHERE id = $1', [loc.reservation_id])).rows[0].logement_id,
          '⚠️ Loyer impayé J+5 — ' + loc.logement_titre,
          loc.loc_prenom + ' ' + loc.loc_nom + ' · Mise en demeure envoyée automatiquement'
        ]
      ).catch(console.warn);
    }

    console.log('[CRON J+5]', result.rows.length, 'mise(s) en demeure envoyée(s)');
  } catch (err) {
    console.error('[CRON J+5] Erreur:', err.message);
  }
});

// ════════════════════════════════════════════════════════
// CRON 5 — Nettoyage OTP expirés (toutes les heures)
// ════════════════════════════════════════════════════════
cron.schedule('0 * * * *', async function() {
  try {
    var result = await db.query(
      'DELETE FROM otp_telephone WHERE expire_at < NOW() OR utilise = TRUE'
    );
    if (result.rowCount > 0) {
      console.log('[CRON] ' + result.rowCount + ' OTP expirés supprimés');
    }
  } catch (err) {
    console.warn('[CRON OTP]', err.message);
  }
});

// ════════════════════════════════════════════════════════
// CRON 6 — Nettoyage logs anciens (tous les dimanches)
// ════════════════════════════════════════════════════════
cron.schedule('0 2 * * 0', async function() {
  try {
    var result = await db.query(
      'DELETE FROM logs_audit WHERE created_at < NOW() - INTERVAL \'90 days\''
    );
    console.log('[CRON] ' + result.rowCount + ' logs anciens supprimés');
  } catch (err) {
    console.warn('[CRON Logs]', err.message);
  }
});

// ════════════════════════════════════════════════════════
// CRON 7 — Relances abonnement impayé J+3 puis J+5 (blocage)
// Tourne tous les jours à 8h30
// ════════════════════════════════════════════════════════
cron.schedule('30 8 * * *', async function() {
  console.log('[CRON] Vérification abonnements impayés — ' + new Date().toLocaleDateString('fr-FR'));
  try {
    // Relance J+3 : abonnement échu depuis exactement 3 jours
    var rappelsJ3 = await db.query(
      `SELECT a.id, a.user_id, a.plan, u.nom, u.prenom, u.email
       FROM abonnements a
       JOIN users u ON a.user_id = u.id
       WHERE a.statut IN ('actif', 'essai')
         AND a.date_fin::date = (CURRENT_DATE - INTERVAL '3 days')::date
         AND a.rappel_j3_envoye IS NOT TRUE`
    );

    for (var r3 of rappelsJ3.rows) {
      try {
        await resend.emails.send({
          from:    'Werdhe <no-reply@werdhe.com>',
          to:      r3.email,
          subject: '⏰ Votre abonnement Werdhe a expiré',
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <div style="background:#F5A623;padding:20px;border-radius:10px 10px 0 0">
                <h2 style="color:#1B2B22;margin:0">🏠 Werdhe</h2>
              </div>
              <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e0e0e0">
                <p>Bonjour <b>${r3.prenom}</b>,</p>
                <p>Votre abonnement <b>${r3.plan}</b> est arrivé à échéance il y a 3 jours.</p>
                <p>Réglez votre abonnement par Mobile Money pour continuer à profiter de toutes les fonctionnalités.</p>
                <p style="color:#B71C1C;font-weight:700">Sans règlement, votre accès sera bloqué dans 2 jours.</p>
                <a href="https://werdhe.com/dashboard/parametres" style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Régler mon abonnement →</a>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.warn('[CRON Abonnement J+3] Email non envoyé:', emailErr.message);
      }

      await db.query('UPDATE abonnements SET rappel_j3_envoye = TRUE WHERE id = $1', [r3.id]);

      await db.query(
        `INSERT INTO alertes (proprietaire_id, destinataire_id, type, titre, description, priorite)
         VALUES ($1, $1, 'abonnement_impaye', $2, $3, 'haute')`,
        [r3.user_id, '⏰ Abonnement expiré depuis 3 jours', 'Plan ' + r3.plan + ' — réglez pour éviter le blocage']
      ).catch(console.warn);
    }

    // Relance finale + blocage J+5 : abonnement échu depuis exactement 5 jours
    var blocagesJ5 = await db.query(
      `SELECT a.id, a.user_id, a.plan, u.nom, u.prenom, u.email
       FROM abonnements a
       JOIN users u ON a.user_id = u.id
       WHERE a.statut IN ('actif', 'essai')
         AND a.date_fin::date = (CURRENT_DATE - INTERVAL '5 days')::date
         AND a.rappel_j5_envoye IS NOT TRUE`
    );

    for (var r5 of blocagesJ5.rows) {
      try {
        await resend.emails.send({
          from:    'Werdhe <no-reply@werdhe.com>',
          to:      r5.email,
          subject: '🔒 Accès Werdhe bloqué — abonnement impayé',
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <div style="background:#B71C1C;padding:20px;border-radius:10px 10px 0 0">
                <h2 style="color:#fff;margin:0">🔒 Accès bloqué</h2>
              </div>
              <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e0e0e0">
                <p>Bonjour <b>${r5.prenom}</b>,</p>
                <p>Votre abonnement <b>${r5.plan}</b> est resté impayé 5 jours après son échéance.</p>
                <p>Votre accès à Werdhe est désormais bloqué. Contactez <a href="mailto:contact@werdhe.com">contact@werdhe.com</a> ou réglez votre abonnement pour le réactiver.</p>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.warn('[CRON Abonnement J+5] Email non envoyé:', emailErr.message);
      }

      await db.query(
        `UPDATE abonnements SET rappel_j5_envoye = TRUE, statut = 'impaye' WHERE id = $1`,
        [r5.id]
      );
      await db.query(
        `UPDATE users SET plan = 'gratuit', abonnement_bloque = TRUE WHERE id = $1`,
        [r5.user_id]
      );

      await db.query(
        `INSERT INTO alertes (proprietaire_id, destinataire_id, type, titre, description, priorite)
         VALUES ($1, $1, 'abonnement_impaye', $2, $3, 'haute')`,
        [r5.user_id, '🔒 Accès bloqué — abonnement impayé', 'Plan ' + r5.plan + ' — contactez le support pour réactiver']
      ).catch(console.warn);
    }

    console.log('[CRON Abonnements] ' + rappelsJ3.rows.length + ' relance(s) J+3, ' + blocagesJ5.rows.length + ' blocage(s) J+5');
  } catch (err) {
    console.error('[CRON Abonnements] Erreur:', err.message);
  }
});

module.exports = {};