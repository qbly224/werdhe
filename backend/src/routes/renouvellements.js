const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');

// ─── PROPOSER UN RENOUVELLEMENT ──────────────────────────────────
router.post('/', verifierToken, async (req, res) => {
  try {
    var { reservation_id, nouveau_prix, nouvelle_duree_mois, message } = req.body;

    if (!reservation_id || !nouvelle_duree_mois) {
      return res.status(400).json({ erreur: 'reservation_id et nouvelle_duree_mois requis' });
    }

    // Vérifier que c'est bien une location active
    var resa = await db.query(
      `SELECT r.*, l.proprietaire_id, l.titre as logement_titre,
         u_loc.email as loc_email, u_loc.prenom as loc_prenom,
         u_prop.email as prop_email, u_prop.prenom as prop_prenom
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.id = $1 AND r.statut = 'confirmee'`,
      [reservation_id]
    );

    if (resa.rows.length === 0) {
      return res.status(404).json({ erreur: 'Location active non trouvée' });
    }

    var r = resa.rows[0];
    var estProprio = req.user.id === r.proprietaire_id;

    if (!estProprio) {
      return res.status(403).json({ erreur: 'Seul le propriétaire peut proposer un renouvellement' });
    }

    // Calculer la nouvelle date de fin
    var nouvelleDateFin = new Date();
    nouvelleDateFin.setMonth(nouvelleDateFin.getMonth() + parseInt(nouvelle_duree_mois));

    // Supprimer tout renouvellement en attente pour cette réservation
    await db.query(
      `UPDATE renouvellements_bail SET statut = 'expire'
       WHERE reservation_id = $1 AND statut = 'en_attente'`,
      [reservation_id]
    );

    // Créer le renouvellement
    var result = await db.query(
      `INSERT INTO renouvellements_bail
         (reservation_id, proposeur_id, nouveau_prix, nouvelle_duree_mois, nouvelle_date_fin, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [reservation_id, req.user.id, nouveau_prix || r.montant_total, nouvelle_duree_mois, nouvelleDateFin, message || null]
    );

    // Notifier le locataire
    await db.query(
      `INSERT INTO alertes
         (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
       VALUES ($1, $2, $3, 'bail_bientot', $4, $5, 'haute')`,
      [
        r.proprietaire_id,
        r.locataire_id,
        r.logement_id,
        '🔄 Proposition de renouvellement — ' + r.logement_titre,
        'Le propriétaire propose un renouvellement de ' + nouvelle_duree_mois + ' mois.'
          + (nouveau_prix ? ' Nouveau loyer : ' + new Intl.NumberFormat('fr-FR').format(nouveau_prix) + ' GNF/mois.' : '')
      ]
    );

    // Email au locataire
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from:    'Werdhe <no-reply@werdhe.com>',
          to:      r.loc_email,
          subject: '🔄 Proposition de renouvellement — ' + r.logement_titre,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <div style="background:#1565C0;padding:20px;border-radius:12px 12px 0 0">
                <h2 style="color:#fff;margin:0">🏠 Werdhe — Renouvellement</h2>
              </div>
              <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                <p>Bonjour <b>${r.loc_prenom}</b>,</p>
                <p><b>${r.prop_prenom}</b> vous propose de renouveler votre bail pour <b>${r.logement_titre}</b>.</p>
                <div style="background:#E3F2FD;border-radius:10px;padding:16px;margin:16px 0">
                  <div style="font-size:13px;color:#555">Durée proposée</div>
                  <div style="font-size:22px;font-weight:800;color:#1565C0">${nouvelle_duree_mois} mois</div>
                  ${nouveau_prix ? '<div style="font-size:13px;color:#555;margin-top:8px">Nouveau loyer : <b style="color:#1565C0">' + new Intl.NumberFormat('fr-FR').format(nouveau_prix) + ' GNF/mois</b></div>' : ''}
                  ${message ? '<div style="font-size:13px;color:#666;margin-top:8px;font-style:italic">"' + message + '"</div>' : ''}
                </div>
                <a href="https://werdhe.com/dashboard"
                   style="display:inline-block;background:#1565C0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
                  Répondre à la proposition →
                </a>
              </div>
            </div>
          `
        });
      } catch (e) {
        console.warn('[Renouvellement] Email non envoyé:', e.message);
      }
    }

    res.status(201).json({ message: 'Proposition envoyée !', renouvellement: result.rows[0] });

  } catch (err) {
    console.error('[POST /renouvellements]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── RÉPONDRE (ACCEPTER / REFUSER) ──────────────────────────────
router.patch('/:id/repondre', verifierToken, async (req, res) => {
  try {
    var { id }      = req.params;
    var { reponse } = req.body; // 'accepte' ou 'refuse'

    if (!['accepte', 'refuse'].includes(reponse)) {
      return res.status(400).json({ erreur: 'Réponse invalide (accepte ou refuse)' });
    }

    var renouv = await db.query(
      `SELECT rn.*,
         r.locataire_id, r.montant_total,
         l.proprietaire_id, l.titre as logement_titre,
         u_prop.email as prop_email, u_prop.prenom as prop_prenom
       FROM renouvellements_bail rn
       JOIN reservations r ON rn.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE rn.id = $1 AND rn.statut = 'en_attente'`,
      [id]
    );

    if (renouv.rows.length === 0) {
      return res.status(404).json({ erreur: 'Proposition non trouvée ou déjà traitée' });
    }

    var rn = renouv.rows[0];

    if (req.user.id !== rn.locataire_id) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    // Mettre à jour le statut
    await db.query(
      `UPDATE renouvellements_bail SET statut = $1, updated_at = NOW() WHERE id = $2`,
      [reponse, id]
    );

    if (reponse === 'accepte') {
      // Mettre à jour la réservation avec la nouvelle durée et prix
      await db.query(
        `UPDATE reservations SET
           date_fin    = $1,
           duree_mois  = duree_mois + $2,
           montant_total = COALESCE($3, montant_total),
           updated_at  = NOW()
         WHERE id = $4`,
        [rn.nouvelle_date_fin, rn.nouvelle_duree_mois, rn.nouveau_prix, rn.reservation_id]
      );

      // Notifier le proprio
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, logement_id, type, titre, description, priorite)
         SELECT $1, l.id, 'bail_bientot', $2, $3, 'haute'
         FROM reservations r JOIN logements l ON r.logement_id = l.id
         WHERE r.id = $4`,
        [
          rn.proprietaire_id,
          '✅ Renouvellement accepté — ' + rn.logement_titre,
          'Le locataire a accepté le renouvellement de ' + rn.nouvelle_duree_mois + ' mois.',
          rn.reservation_id
        ]
      );

      // Email au proprio
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = require('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Werdhe <no-reply@werdhe.com>',
            to:   rn.prop_email,
            subject: '✅ Renouvellement accepté — ' + rn.logement_titre,
            html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <div style="background:#1B6B3A;padding:20px;border-radius:12px 12px 0 0">
                <h2 style="color:#fff;margin:0">🏠 Werdhe</h2>
              </div>
              <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                <p>Bonjour <b>${rn.prop_prenom}</b>,</p>
                <p>Votre proposition de renouvellement pour <b>${rn.logement_titre}</b> a été <b style="color:#1B6B3A">acceptée</b> !</p>
                <div style="background:#E8F5E9;border-radius:8px;padding:14px;margin:16px 0">
                  <div style="font-size:13px;color:#555">Nouveau bail</div>
                  <div style="font-size:18px;font-weight:700;color:#1B6B3A">+${rn.nouvelle_duree_mois} mois</div>
                </div>
                <a href="https://werdhe.com/dashboard" style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Voir mon dashboard →</a>
              </div>
            </div>`
          });
        } catch (e) { console.warn('[Renouvellement] Email:', e.message); }
      }
    }

    res.json({ message: reponse === 'accepte' ? 'Renouvellement accepté !' : 'Renouvellement refusé.', statut: reponse });

  } catch (err) {
    console.error('[PATCH /renouvellements/:id/repondre]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── MES RENOUVELLEMENTS EN ATTENTE ──────────────────────────────
router.get('/en-attente', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT rn.*,
         l.titre as logement_titre, l.proprietaire_id,
         u_prop.prenom as prop_prenom, u_prop.nom as prop_nom
       FROM renouvellements_bail rn
       JOIN reservations r ON rn.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.locataire_id = $1 AND rn.statut = 'en_attente'
       ORDER BY rn.created_at DESC`,
      [req.user.id]
    );
    res.json({ renouvellements: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;