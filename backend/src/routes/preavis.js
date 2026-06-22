const express  = require('express');
const router   = express.Router();
const db       = require('../database');
const verifierToken = require('../middleware/auth');
const { Resend } = require('resend');

var resend = new Resend(process.env.RESEND_API_KEY);

// ─── CRÉER ET ENVOYER UN PRÉAVIS ─────────────────────────────────
router.post('/', verifierToken, async (req, res) => {
  try {
    const { reservation_id, motif, delai_mois, note, type } = req.body;
    const auteurId = req.user.id;

    if (!reservation_id || !motif || !delai_mois) {
      return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
    }

    // Récupérer les infos de la réservation
    const resa = await db.query(
      `SELECT r.*,
         l.titre as logement_titre, l.adresse, l.ville, l.proprietaire_id,
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

    const r       = resa.rows[0];
    const delaiMs = parseInt(delai_mois) * 30 * 24 * 60 * 60 * 1000;
    const dateSortie = new Date(Date.now() + delaiMs).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // Déterminer expéditeur et destinataire selon le type
    const estLocataire  = type === 'locataire';
    const expediteurNom = estLocataire ? r.loc_prenom + ' ' + r.loc_nom : r.prop_prenom + ' ' + r.prop_nom;
    const destEmail     = estLocataire ? r.prop_email  : r.loc_email;
    const destPrenom    = estLocataire ? r.prop_prenom : r.loc_prenom;
    const destNom       = estLocataire ? r.prop_nom    : r.loc_nom;
    const destTel       = estLocataire ? r.prop_tel    : r.loc_tel;

    // Sauvegarder le préavis en base
    const preavisResult = await db.query(
      `INSERT INTO preavis
         (reservation_id, auteur_id, type, motif, delai_mois, note, date_sortie_estimee, statut)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7 || ' days')::INTERVAL, 'envoye')
       RETURNING *`,
      [reservation_id, auteurId, type, motif, delai_mois, note || null, parseInt(delai_mois) * 30]
    );

    const preavis = preavisResult.rows[0];

    // 1. EMAIL au destinataire
    const sujetEmail = estLocataire
      ? `📤 Préavis de départ — ${r.logement_titre}`
      : `📋 Préavis de résiliation — ${r.logement_titre}`;

    const contenuEmail = `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
        <div style="background:#1B6B3A;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0;font-size:20px">🏠 Werdhe</h2>
          <div style="color:rgba(255,255,255,0.75);font-size:12px;margin-top:4px">Plateforme immobilière Guinée</div>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
          <p style="margin:0 0 16px">Bonjour <b>${destPrenom}</b>,</p>
          <p style="margin:0 0 16px">
            ${estLocataire
              ? `<b>${expediteurNom}</b> vous a envoyé un préavis de départ pour le logement <b>${r.logement_titre}</b>.`
              : `Votre locataire <b>${expediteurNom}</b> vous informe de son départ du logement <b>${r.logement_titre}</b>.`
            }
          </p>
          <div style="background:#FFF8E1;border:1px solid #FFE082;border-radius:10px;padding:16px;margin:16px 0">
            <div style="font-size:14px;font-weight:700;color:#7B4F00;margin-bottom:10px">📋 Détails du préavis</div>
            ${[
              ['Logement',             r.logement_titre],
              ['Motif',                motif],
              ['Délai',                delai_mois + ' mois'],
              ['Date de sortie estimée', dateSortie],
              [estLocataire ? 'Locataire' : 'Propriétaire', expediteurNom],
            ].map(function(row) {
              return `<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:0.5px solid #FFE082">
                <span style="color:#888">${row[0]}</span>
                <span style="font-weight:600;color:#7B4F00">${row[1]}</span>
              </div>`;
            }).join('')}
          </div>
          ${note ? `<p style="margin:0 0 16px;font-style:italic;color:#555">"${note}"</p>` : ''}
          <p style="margin:0 0 16px">Accusez réception depuis votre tableau de bord Werdhe dans les <b>48 heures</b>.</p>
          <a href="https://werdhe.com/dashboard"
             style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
            Accéder à mon espace →
          </a>
          <p style="margin:20px 0 0;color:#888;font-size:12px">
            ${estLocataire
              ? 'Continuez à payer vos loyers normalement jusqu\'à la date de sortie. Un état des lieux de sortie sera planifié avec le propriétaire.'
              : 'Continuez à encaisser les loyers normalement. L\'état des lieux de sortie sera planifié automatiquement dans ' + delai_mois + ' mois.'}
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from:    'Werdhe <no-reply@werdhe.com>',
      to:      destEmail,
      subject: sujetEmail,
      html:    contenuEmail
    });

    // 2. NOTIFICATION dans la plateforme (table alertes)
    await db.query(
      `INSERT INTO alertes
         (proprietaire_id, logement_id, type, titre, description, priorite)
       VALUES ($1, $2, $3, $4, $5, 'haute')`,
      [
        r.proprietaire_id,
        r.logement_id,
        'bail_bientot',
        estLocataire
          ? 'Préavis de départ reçu — ' + r.logement_titre
          : 'Préavis envoyé à ' + r.loc_prenom + ' ' + r.loc_nom,
        'Date de sortie estimée : ' + dateSortie + ' · Délai : ' + delai_mois + ' mois'
      ]
    );

    // 3. Générer le document PDF (via documentService)
    try {
      const { genererDocument } = require('../services/documentService');
      await genererDocument({
        type:          'preavis',
        reservation_id: reservation_id,
        proprietaire:  { id: r.proprietaire_id, nom: r.prop_nom, prenom: r.prop_prenom, email: r.prop_email, telephone: r.prop_tel },
        locataire:     { id: r.locataire_id,    nom: r.loc_nom,  prenom: r.loc_prenom,  email: r.loc_email,  telephone: r.loc_tel },
        logement:      { id: r.logement_id, titre: r.logement_titre, adresse: r.adresse, ville: r.ville },
        montant:       r.montant_total,
        date_depart:   new Date(Date.now() + delaiMs),
        envoyer_email: false // déjà envoyé manuellement ci-dessus
      });
    } catch (docErr) {
      console.warn('[Préavis] Document non généré (non bloquant):', docErr.message);
    }

    res.status(201).json({
      message:      'Préavis envoyé ! Email + notification envoyés au destinataire.',
      preavis:      preavis,
      date_sortie:  dateSortie,
      dest_prenom:  destPrenom,
      dest_nom:     destNom
    });

  } catch (err) {
    console.error('[POST /preavis]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur : ' + err.message });
  }
});

// ─── LISTE MES PRÉAVIS ───────────────────────────────────────────
router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
         r.logement_id, l.titre as logement_titre,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom, u_loc.telephone as loc_tel,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom, u_prop.telephone as prop_tel
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.auteur_id = $1 OR r.locataire_id = $1 OR l.proprietaire_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ preavis: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;