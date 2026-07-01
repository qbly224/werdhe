const express  = require('express');
const router   = express.Router();
const db       = require('../database');
const verifierToken = require('../middleware/auth');

// ─── CRÉER ET ENVOYER UN PRÉAVIS ─────────────────────────────────
router.post('/', verifierToken, async (req, res) => {
  try {
    const { reservation_id, motif, delai_mois, note, type } = req.body;

    if (!reservation_id || !motif || !delai_mois) {
      return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
    }

    // ── 1. Récupérer les infos ─────────────────────────────────
    console.log('[Préavis] Récupération réservation:', reservation_id);
    const resa = await db.query(
      `SELECT r.*,
         l.titre as logement_titre, l.adresse, l.ville, l.proprietaire_id,
         l.id as logement_id,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_loc.email as loc_email, u_loc.telephone as loc_tel,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
         u_prop.email as prop_email, u_prop.telephone as prop_tel
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (resa.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }

    const r          = resa.rows[0];
    const delaiJours = parseInt(delai_mois) * 30;
    const dateSortie = new Date(Date.now() + delaiJours * 24 * 60 * 60 * 1000)
      .toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    const estLocataire  = type === 'locataire';
    const expediteurNom = estLocataire
      ? r.loc_prenom + ' ' + r.loc_nom
      : r.prop_prenom + ' ' + r.prop_nom;
    const destEmail  = estLocataire ? r.prop_email  : r.loc_email;
    const destPrenom = estLocataire ? r.prop_prenom : r.loc_prenom;
    const destNom    = estLocataire ? r.prop_nom    : r.loc_nom;

    console.log('[Préavis] Destinataire:', destEmail);

    // ── 2. Sauvegarder en base ────────────────────────────────
    console.log('[Préavis] Insertion en base...');
    const preavisResult = await db.query(
      `INSERT INTO preavis
         (reservation_id, auteur_id, type, motif, delai_mois,
          note, date_sortie_estimee, statut)
       VALUES ($1, $2, $3, $4, $5, $6,
         NOW() + ($7 * INTERVAL '1 day'), 'envoye')
       RETURNING *`,
      [
        reservation_id, req.user.id, type, motif,
        parseInt(delai_mois), note || null, delaiJours
      ]
    );
    console.log('[Préavis] Sauvegardé en base ✅');

    // ── 3. Email (non bloquant) ───────────────────────────────
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = require('resend');
        const resend     = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from:    'Werdhe <no-reply@werdhe.com>',
          to:      destEmail,
          subject: estLocataire
            ? '📤 Préavis de départ — ' + r.logement_titre
            : '📋 Préavis de résiliation — ' + r.logement_titre,
          html: `
            <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
              <div style="background:#1B6B3A;padding:20px;border-radius:12px 12px 0 0">
                <h2 style="color:#fff;margin:0">🏠 Werdhe</h2>
              </div>
              <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                <p>Bonjour <b>${destPrenom}</b>,</p>
                <p>${estLocataire
                  ? '<b>' + expediteurNom + '</b> vous a envoyé un préavis de départ pour <b>' + r.logement_titre + '</b>.'
                  : 'Votre locataire <b>' + expediteurNom + '</b> vous informe de son départ de <b>' + r.logement_titre + '</b>.'
                }</p>
                <div style="background:#FFF8E1;border:1px solid #FFE082;border-radius:8px;padding:14px;margin:16px 0">
                  <div style="font-size:13px;margin-bottom:8px;font-weight:700;color:#7B4F00">Détails du préavis</div>
                  <table style="width:100%;font-size:12px">
                    <tr><td style="color:#888">Logement</td><td style="text-align:right;font-weight:600">${r.logement_titre}</td></tr>
                    <tr><td style="color:#888">Motif</td><td style="text-align:right;font-weight:600">${motif}</td></tr>
                    <tr><td style="color:#888">Délai</td><td style="text-align:right;font-weight:600">${delai_mois} mois</td></tr>
                    <tr><td style="color:#888">Date de sortie</td><td style="text-align:right;font-weight:600">${dateSortie}</td></tr>
                  </table>
                </div>
                ${note ? '<p style="font-style:italic;color:#555">"' + note + '"</p>' : ''}
                <p>Accusez réception depuis votre tableau de bord dans les <b>48h</b>.</p>
                <a href="https://werdhe.com/dashboard"
                   style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
                  Accéder à mon espace →
                </a>
              </div>
            </div>
          `
        });
        console.log('[Préavis] Email envoyé à', destEmail, '✅');
      } catch (emailErr) {
        console.warn('[Préavis] Email non envoyé (non bloquant):', emailErr.message);
      }
    } else {
      console.warn('[Préavis] RESEND_API_KEY manquant — email ignoré');
    }

    // ── 4. Notification plateforme (non bloquante) ────────────
   // ── 4. Notifications (proprio + destinataire) ─────────────
    try {
      // D'abord récupérer le locataire_id depuis la réservation
      var resaInfo = await db.query(
        'SELECT locataire_id FROM reservations WHERE id = $1',
        [reservation_id]
      );
      var locataireId = resaInfo.rows[0] && resaInfo.rows[0].locataire_id;

      // Alerte pour le proprio (dashboard proprio)
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2, 'bail_bientot', $3, $4, 'haute')`,
        [
          r.proprietaire_id,
          r.logement_id,
          estLocataire
            ? 'Préavis reçu — ' + r.logement_titre
            : 'Préavis envoyé à ' + r.loc_prenom + ' ' + r.loc_nom,
          'Date de sortie : ' + dateSortie
        ]
      );

      // Alerte pour le DESTINATAIRE avec destinataire_id
      var destinataireId = estLocataire ? r.proprietaire_id : locataireId;

      if (destinataireId) {
        await db.query(
          `INSERT INTO alertes
             (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
           VALUES ($1, $2, $3, 'bail_bientot', $4, $5, 'haute')`,
          [
            r.proprietaire_id,
            destinataireId,
            r.logement_id,
            estLocataire
              ? '📤 Préavis reçu — ' + r.logement_titre
              : '📋 Préavis de votre propriétaire — ' + r.logement_titre,
            'Date de sortie estimée : ' + dateSortie + ' · Motif : ' + motif
          ]
        );
        console.log('[Préavis] Alerte créée pour destinataire:', destinataireId);
      }

      console.log('[Préavis] Notifications créées ✅');
    } catch (alerteErr) {
      console.warn('[Préavis] Notification échouée (non bloquant):', alerteErr.message);
    }

    // ── 5. Réponse succès ─────────────────────────────────────
    res.status(201).json({
      message:     'Préavis envoyé avec succès !',
      preavis:     preavisResult.rows[0],
      date_sortie: dateSortie,
      dest_prenom: destPrenom,
      dest_nom:    destNom
    });

  } catch (err) {
    console.error('[POST /preavis] ERREUR:', err.message);
    console.error('[POST /preavis] STACK:', err.stack);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── LISTE MES PRÉAVIS ───────────────────────────────────────────
router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
         l.titre as logement_titre,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.auteur_id = $1
          OR r.locataire_id = $1
          OR l.proprietaire_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ preavis: result.rows });
  } catch (err) {
    console.error('[GET /preavis]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── RÉPONDRE À UN PRÉAVIS (accepter ou renouveler) ──────────────
router.patch('/:id/repondre', verifierToken, async (req, res) => {
  try {
    const { id }      = req.params;
    const { reponse, message } = req.body;
    // reponse = 'accepte' ou 'renouveler'

    const preavis = await db.query(
      `SELECT p.*,
         r.locataire_id,
         l.titre as logement_titre, l.proprietaire_id,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom, u_loc.email as loc_email,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom, u_prop.email as prop_email
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.id = $1`,
      [id]
    );

    if (preavis.rows.length === 0) {
      return res.status(404).json({ erreur: 'Préavis non trouvé' });
    }

    const p = preavis.rows[0];

    // Vérifier que l'utilisateur est bien le destinataire
    var estDestinataire = req.user.id === p.locataire_id || req.user.id === p.proprietaire_id;
    var estAuteur       = req.user.id === p.auteur_id;
    if (!estDestinataire || estAuteur) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    if (reponse === 'accepte') {
      // Marquer le préavis comme accusé
      await db.query(
        `UPDATE preavis SET statut = 'accuse' WHERE id = $1`,
        [id]
      );

      // Notifier l'auteur
      var titreNotif = p.type === 'locataire'
        ? '✅ ' + p.prop_prenom + ' ' + p.prop_nom + ' a accepté votre préavis'
        : '✅ ' + p.loc_prenom + ' ' + p.loc_nom + ' a accepté le préavis de départ';

      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2,
           (SELECT logement_id FROM reservations WHERE id = $3),
           'bail_bientot', $4, $5, 'haute')`,
        [
          p.proprietaire_id,
          p.auteur_id,
          p.reservation_id,
          titreNotif,
          'Le départ est confirmé pour ' + new Date(p.date_sortie_estimee).toLocaleDateString('fr-FR')
        ]
      );

      // Email à l'auteur
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = require('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          var destEmail = p.type === 'locataire' ? p.loc_email : p.prop_email;
          await resend.emails.send({
            from:    'Werdhe <no-reply@werdhe.com>',
            to:      destEmail,
            subject: '✅ Préavis accepté — ' + p.logement_titre,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <div style="background:#1B6B3A;padding:20px;border-radius:12px 12px 0 0">
                  <h2 style="color:#fff;margin:0">🏠 Werdhe</h2>
                </div>
                <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                  <p>Votre préavis pour <b>${p.logement_titre}</b> a été <b style="color:#1B6B3A">accepté</b>.</p>
                  <div style="background:#E8F5E9;border-radius:8px;padding:14px;margin:16px 0">
                    <div style="font-size:13px;color:#555">Date de sortie confirmée</div>
                    <div style="font-size:20px;font-weight:700;color:#1B6B3A">${new Date(p.date_sortie_estimee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                  ${message ? '<p style="font-style:italic;color:#666">Message : "' + message + '"</p>' : ''}
                  <a href="https://werdhe.com/dashboard" style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Voir mon espace →</a>
                </div>
              </div>
            `
          });
        } catch (e) {
          console.warn('[Réponse préavis] Email non envoyé:', e.message);
        }
      }

      return res.json({ message: 'Préavis accepté', statut: 'accuse' });
    }

    if (reponse === 'renouveler') {
      // Marquer le préavis comme annulé (changement d'avis)
      await db.query(
        `UPDATE preavis SET statut = 'termine' WHERE id = $1`,
        [id]
      );

      // Notifier l'auteur
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2,
           (SELECT logement_id FROM reservations WHERE id = $3),
           'bail_bientot', $4, $5, 'haute')`,
        [
          p.proprietaire_id,
          p.auteur_id,
          p.reservation_id,
          '🔄 Demande de renouvellement — ' + p.logement_titre,
          (p.type === 'locataire' ? p.prop_prenom + ' ' + p.prop_nom : p.loc_prenom + ' ' + p.loc_nom) +
            ' souhaite renouveler le bail' + (message ? ' : "' + message + '"' : '')
        ]
      );

      return res.json({ message: 'Demande de renouvellement envoyée', statut: 'termine' });
    }

    res.status(400).json({ erreur: 'Réponse invalide (accepte ou renouveler)' });

  } catch (err) {
    console.error('[PATCH /preavis/:id/repondre]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── PRÉAVIS REÇUS ────────────────────────────────────────────────
router.get('/recus', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
         l.titre as logement_titre,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.auteur_id != $1
         AND (r.locataire_id = $1 OR l.proprietaire_id = $1)
         AND p.statut = 'envoye'
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ preavis: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;