const cron      = require('node-cron');
const db        = require('../database');
const { Resend } = require('resend');

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

    console.log('[CRON] ' + result.rows.length + ' renouvellement(s) notifié(s)');
  } catch (err) {
    console.error('[CRON] Erreur renouvellements:', err.message);
  }
});

console.log('[CRON] Service de rappels démarré ✅');
module.exports = {};