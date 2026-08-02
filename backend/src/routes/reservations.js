const express = require('express');
const router = express.Router();
const db = require('../database');
const verifierToken = require('../middleware/auth');
const {
  creerReservation,
  getMesReservations,
  getReservationsProprietaire,
  traiterReservation,
  annulerReservation
} = require('../controllers/reservationController');
const { envoyerNotification } = require('./push');

// Toutes les routes réservations sont protégées
// Un utilisateur doit être connecté pour réserver

// Locataire
router.post('/', verifierToken, creerReservation);
router.get('/mes-reservations', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT r.*,
         l.titre  as logement_titre,
         l.ville  as logement_ville,
         l.adresse as logement_adresse,
         l.prix_mensuel,
         l.id     as logement_id,
         l.proprietaire_id,
         u.nom    as prop_nom,
         u.prenom as prop_prenom,
         u.telephone as prop_telephone,
         u.email  as prop_email
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u ON l.proprietaire_id = u.id
       WHERE r.locataire_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ reservations: result.rows });
  } catch (err) {
    console.error('[GET /mes-reservations]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.patch('/:id/annuler', verifierToken, annulerReservation);

// Propriétaire
router.get('/proprietaire', verifierToken, getReservationsProprietaire);
router.patch('/:id/traiter', verifierToken, traiterReservation);

// Voir une réservation par son ID (locataire ou proprio)
router.get('/:id/detail', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*,
         l.titre as logement_titre, l.ville as logement_ville,
         l.prix_mensuel, l.adresse,
         l.proprietaire_id,
         u_loc.nom    as locataire_nom,
         u_loc.prenom as locataire_prenom,
         u_loc.email  as locataire_email,
         u_loc.telephone as locataire_telephone,
         u_prop.nom    as prop_nom,
         u_prop.prenom as prop_prenom,
         u_prop.telephone as prop_tel,
         u_prop.email  as prop_email
       FROM reservations r
       JOIN logements l     ON r.logement_id   = l.id
       JOIN users u_loc     ON r.locataire_id  = u_loc.id
       JOIN users u_prop    ON l.proprietaire_id = u_prop.id
       WHERE r.id = $1
         AND (r.locataire_id = $2 OR l.proprietaire_id = $2)`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }
    res.json({ reservation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Propriétaire prend une décision sur une demande
router.patch('/:id/decision', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, motif } = req.body;

    // Vérifier que c'est bien le propriétaire du logement
    const check = await db.query(
      `SELECT r.id FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1 AND l.proprietaire_id = $2`,
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    // Correspondance décision → statut en base
    const correspondance = {
      dossier_requis : 'dossier_requis',
      acceptee       : 'acceptee',
      echanges       : 'echanges',
      refusee        : 'refusee',
      bail_en_cours  : 'bail_en_cours',
    };
    const nouveauStatut = correspondance[decision] || decision;

    await db.query(
      `UPDATE reservations
       SET statut = $1, motif_refus = $2, updated_at = NOW()
       WHERE id = $3`,
      [nouveauStatut, motif || null, id]
    );

    res.json({ message: 'Décision enregistrée', statut: nouveauStatut });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Locataire soumet son dossier (change statut en "en_examen")
router.patch('/:id/soumettre-dossier', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query(
      'SELECT id FROM reservations WHERE id = $1 AND locataire_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }
    await db.query(
      'UPDATE reservations SET statut = $1, updated_at = NOW() WHERE id = $2',
      ['en_examen', id]
    );
    res.json({ message: 'Dossier soumis', statut: 'en_examen' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Locataire paie la caution
router.patch('/:id/payer-caution', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mode_paiement } = req.body;
    const check = await db.query(
      'SELECT id FROM reservations WHERE id = $1 AND locataire_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }
    await db.query(
      `UPDATE reservations
       SET statut = 'caution_payee',
           mode_paiement_caution = $1,
           date_paiement_caution = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [mode_paiement, id]
    );
    res.json({ message: 'Caution enregistrée', statut: 'caution_payee' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Signer le bail (proprio ou locataire)
router.patch('/:id/signer-bail', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const resa = await db.query(
      `SELECT r.*, l.proprietaire_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1`,
      [id]
    );
    if (resa.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }
    const r = resa.rows[0];
    const estProprio   = req.user.id === r.proprietaire_id;
    const estLocataire = req.user.id === r.locataire_id;

    if (!estProprio && !estLocataire) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    let nouveauStatut = r.statut;
    if (estProprio) {
      nouveauStatut = 'bail_signe_proprio';
    } else if (estLocataire) {
      // Locataire signe en dernier → location confirmée
      nouveauStatut = 'confirmee';

      // Mettre le logement en "loué" automatiquement
await db.query(
  `UPDATE logements SET statut = 'loue'
   WHERE id = (SELECT logement_id FROM reservations WHERE id = $1)`,
  [id]
).catch(function(err) {
  console.warn('[Sync] Logement statut non mis à jour:', err.message);
});
console.log('[Sync] Logement mis à loué ✅');

      // Vérifier si le locataire mérite le badge après 3 locations
var nbLocations = await db.query(
  `SELECT COUNT(*) FROM reservations
   WHERE locataire_id = $1 AND statut = 'confirmee'`,
  [r.locataire_id]
);
if (parseInt(nbLocations.rows[0].count) >= 3) {
  await db.query(
    `UPDATE users SET locataire_verifie = TRUE,
       nb_locations_terminees = $1
     WHERE id = $2`,
    [parseInt(nbLocations.rows[0].count), r.locataire_id]
  );
  console.log('[Badge] Locataire vérifié:', r.locataire_id);
}
      // Marquer le logement comme loué
      await db.query(
        'UPDATE logements SET statut = $1 WHERE id = $2',
        ['loue', r.logement_id]
      );
    }

    await db.query(
      'UPDATE reservations SET statut = $1, bail_signe = TRUE, updated_at = NOW() WHERE id = $2',
      [nouveauStatut, id]
    );

    res.json({ message: 'Bail signé', statut: nouveauStatut });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Changer le statut (côté locataire uniquement pour certaines transitions)
router.patch('/:id/statut', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const statutsPermisLocataire = ['caution_requise', 'echanges'];
    const statutsPermisPropio    = ['bail_en_cours', 'echanges', 'confirmee'];

    const resa = await db.query(
      `SELECT r.*, l.proprietaire_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1`,
      [id]
    );
    if (resa.rows.length === 0) return res.status(404).json({ erreur: 'Non trouvée' });

    const r = resa.rows[0];
    const estProprio   = req.user.id === r.proprietaire_id;
    const estLocataire = req.user.id === r.locataire_id;

    const permis = estProprio ? statutsPermisPropio : statutsPermisLocataire;
    if (!permis.includes(statut)) {
      return res.status(400).json({ erreur: 'Transition non autorisée' });
    }

    await db.query(
      'UPDATE reservations SET statut = $1, updated_at = NOW() WHERE id = $2',
      [statut, id]
    );
    res.json({ message: 'Statut mis à jour', statut });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── VOIR UNE RÉSERVATION PAR SON ID ─────────────────────────────
// Utilisé par ReservationLocataire.js pour charger les données réelles
router.get('/:id', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         r.*,
         l.titre          AS logement_titre,
         l.adresse        AS logement_adresse,
         l.ville          AS logement_ville,
         l.prix_mensuel,
         l.nb_chambres,
         l.superficie,
         l.proprietaire_id,
         u_loc.nom        AS locataire_nom,
         u_loc.prenom     AS locataire_prenom,
         u_loc.email      AS locataire_email,
         u_loc.telephone  AS locataire_telephone,
         u_prop.nom       AS prop_nom,
         u_prop.prenom    AS prop_prenom,
         u_prop.email     AS prop_email,
         u_prop.telephone AS prop_tel
       FROM reservations r
       JOIN logements l    ON r.logement_id    = l.id
       JOIN users u_loc    ON r.locataire_id   = u_loc.id
       JOIN users u_prop   ON l.proprietaire_id = u_prop.id
       WHERE r.id = $1
         AND (r.locataire_id = $2 OR l.proprietaire_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }

    res.json({ reservation: result.rows[0] });

  } catch (err) {
    console.error('GET /reservations/:id', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DÉCISION DU PROPRIÉTAIRE ─────────────────────────────────────
// Accepter / Refuser / Demander le dossier
router.patch('/:id/decision', verifierToken, async (req, res) => {
  try {
    const { id }           = req.params;
    const { decision, motif } = req.body;

    const check = await db.query(
      `SELECT r.id, r.locataire_id, l.proprietaire_id, l.titre as logement_titre
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1 AND l.proprietaire_id = $2`,
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    const r = check.rows[0];

    const correspondance = {
      dossier_requis : 'dossier_requis',
      acceptee       : 'acceptee',
      echanges       : 'echanges',
      refusee        : 'refusee',
      bail_en_cours  : 'bail_en_cours',
    };
    const nouveauStatut = correspondance[decision] || decision;

    await db.query(
      `UPDATE reservations SET statut = $1, motif_refus = $2, updated_at = NOW() WHERE id = $3`,
      [nouveauStatut, motif || null, id]
    );

    // ── Notification pour le LOCATAIRE ──────────────────────────
    var titreNotif = '';
    var descNotif  = '';

    if (decision === 'acceptee') {
      titreNotif = '🎉 Candidature acceptée !';
      descNotif  = 'Votre dossier pour ' + r.logement_titre + ' a été accepté. Passez aux échanges.';
    } else if (decision === 'dossier_requis') {
      titreNotif = '📁 Dossier demandé';
      descNotif  = 'Le propriétaire de ' + r.logement_titre + ' demande votre dossier complet.';
    } else if (decision === 'refusee') {
      titreNotif = '❌ Candidature refusée';
      descNotif  = 'Votre candidature pour ' + r.logement_titre + ' n\'a pas été retenue.' + (motif ? ' Motif : ' + motif : '');
    } else if (decision === 'bail_en_cours') {
      titreNotif = '📝 Bail prêt à signer';
      descNotif  = 'Le bail pour ' + r.logement_titre + ' est prêt. Signez-le pour finaliser votre location.';
    }

    if (titreNotif) {
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
         SELECT $1, $2, r.logement_id, 'bail_bientot', $3, $4, 'haute'
         FROM reservations r WHERE r.id = $5`,
        [r.proprietaire_id, r.locataire_id, titreNotif, descNotif, id]
      ).catch(function(err) {
        console.warn('[Notif locataire] Non bloquant:', err.message);
      });
    }

    // Envoyer une notification push au locataire
    if (titreNotif) {
      envoyerNotification(r.locataire_id, titreNotif, descNotif, '/dashboard/reservations');
    }

    res.json({ message: 'Décision enregistrée', statut: nouveauStatut });

  } catch (err) {
    console.error('PATCH /reservations/:id/decision', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── CHANGER LE STATUT (transitions autorisées uniquement) ────────
// Utilisé pour : passer en caution_requise, echanges, bail_en_cours
router.patch('/:id/statut', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Récupérer la réservation et le proprio du logement
    const resa = await db.query(
      `SELECT r.*, l.proprietaire_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1`,
      [id]
    );

    if (resa.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }

    const r = resa.rows[0];
    const estProprietaire = req.user.id === r.proprietaire_id;
    const estLocataire    = req.user.id === r.locataire_id;

    // Transitions autorisées selon le rôle
    const permisProprietaire = ['bail_en_cours', 'echanges', 'confirmee'];
    const permisLocataire    = ['caution_requise', 'echanges'];

    const permis = estProprietaire ? permisProprietaire : permisLocataire;

    if (!permis.includes(statut)) {
      return res.status(400).json({ erreur: 'Transition non autorisée vers ' + statut });
    }

    await db.query(
      'UPDATE reservations SET statut = $1, updated_at = NOW() WHERE id = $2',
      [statut, id]
    );

    res.json({ message: 'Statut mis à jour', statut });

  } catch (err) {
    console.error('PATCH /reservations/:id/statut', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── LOCATAIRE SOUMET SON DOSSIER ─────────────────────────────────
// Upload du dossier locataire avec fichiers
const multer = require('multer');
const uploadDossier = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/:id/dossier', verifierToken, uploadDossier.fields([
  { name: 'cni',    maxCount: 1 },
  { name: 'emploi', maxCount: 1 },
  { name: 'paie',   maxCount: 1 },
  { name: 'garant', maxCount: 1 },
]), async (req, res) => {
  try {
    console.log('[Dossier] Fichiers reçus:', Object.keys(req.files || {}));
    console.log('[Dossier] Réservation ID:', req.params.id);
    const { id } = req.params;

    const check = await db.query(
      'SELECT id FROM reservations WHERE id = $1 AND locataire_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

   const { cloudinary } = require('../services/cloudinaryService');
    var urls = {};

    // Uploader chaque fichier sur Cloudinary
    var champs = ['cni', 'emploi', 'paie', 'garant'];
    for (var i = 0; i < champs.length; i++) {
      var champ = champs[i];
      if (!req.files || !req.files[champ] || !req.files[champ][0]) continue;

      var fichier = req.files[champ][0];
      var isImage = fichier.mimetype.startsWith('image/');
      var buffer  = fichier.buffer.toString('base64');
      var dataUri = 'data:' + fichier.mimetype + ';base64,' + buffer;

      try {
        var uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder:        'werdhe/dossiers',
          resource_type: isImage ? 'image' : 'raw',
          type:          'upload',
          access_mode:   'public',
          public_id:     'doc_' + champ + '_' + id + '_' + Date.now()
        });
        var fileUrl = uploadResult.secure_url;
        if (!isImage) {
          fileUrl = fileUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/');
        }
        urls['doc_' + champ + '_url'] = fileUrl;
        console.log('[Dossier] Upload', champ, ':', fileUrl);
      } catch (uploadErr) {
        console.warn('[Dossier] Upload', champ, 'échoué:', uploadErr.message);
      }
    }

    // Mettre à jour le statut et les URLs en base
    await db.query(
      `UPDATE reservations SET
         statut          = 'en_examen',
         doc_cni_url     = COALESCE($1, doc_cni_url),
         doc_emploi_url  = COALESCE($2, doc_emploi_url),
         doc_paie_url    = COALESCE($3, doc_paie_url),
         doc_garant_url  = COALESCE($4, doc_garant_url),
         updated_at      = NOW()
       WHERE id = $5`,
      [
        urls.doc_cni_url    || null,
        urls.doc_emploi_url || null,
        urls.doc_paie_url   || null,
        urls.doc_garant_url || null,
        id
      ]
    );

    res.json({ message: 'Dossier soumis', statut: 'en_examen', urls });

  } catch (err) {
    console.error('[POST dossier]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur : ' + err.message });
  }
});

// Route pour visualiser un document de dossier
router.get('/:id/document/:champ', verifierToken, async (req, res) => {
  try {
    const { id, champ } = req.params;

    var colonnes = {
      cni:    'doc_cni_url',
      emploi: 'doc_emploi_url',
      paie:   'doc_paie_url',
      garant: 'doc_garant_url'
    };

    var colonne = colonnes[champ];
    if (!colonne) return res.status(400).json({ erreur: 'Champ invalide' });

    var result = await db.query(
      `SELECT r.${colonne}
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1
         AND (l.proprietaire_id = $2 OR r.locataire_id = $2)`,
      [id, req.user.id]
    );

    if (!result.rows[0] || !result.rows[0][colonne]) {
      return res.status(404).json({ erreur: 'Document non trouvé' });
    }

    var url = result.rows[0][colonne];

    // Rediriger vers l'URL Cloudinary
    res.redirect(url);

  } catch (err) {
    console.error('[GET document]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── LOCATAIRE PAIE LA CAUTION ────────────────────────────────────
router.patch('/:id/payer-caution', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mode_paiement } = req.body;

    const check = await db.query(
      'SELECT id FROM reservations WHERE id = $1 AND locataire_id = $2',
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    await db.query(
      `UPDATE reservations
       SET statut                = 'caution_payee',
           mode_paiement_caution = $1,
           date_paiement_caution = NOW(),
           updated_at            = NOW()
       WHERE id = $2`,
      [mode_paiement || 'non_precise', id]
    );

    res.json({ message: 'Caution enregistrée', statut: 'caution_payee' });

  } catch (err) {
    console.error('PATCH /reservations/:id/payer-caution', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── SIGNER LE BAIL ───────────────────────────────────────────────
// Proprio signe en premier → statut bail_signe_proprio
// Locataire signe en dernier → statut confirmee + logement loué
router.patch('/:id/signer-bail', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;

    const resa = await db.query(
      `SELECT r.*, l.proprietaire_id, r.logement_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1`,
      [id]
    );

    if (resa.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }

    const r = resa.rows[0];
    const estProprietaire = req.user.id === r.proprietaire_id;
    const estLocataire    = req.user.id === r.locataire_id;

    if (!estProprietaire && !estLocataire) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    let nouveauStatut;

    if (estProprietaire) {
      // Le proprio signe → on attend la signature du locataire
      nouveauStatut = 'bail_signe_proprio';
    } else {
      // Le locataire signe → location officiellement confirmée
      nouveauStatut = 'confirmee';

      // Mettre le logement en "loué" automatiquement
await db.query(
  `UPDATE logements SET statut = 'loue'
   WHERE id = (SELECT logement_id FROM reservations WHERE id = $1)`,
  [id]
).catch(function(err) {
  console.warn('[Sync] Logement statut non mis à jour:', err.message);
});
console.log('[Sync] Logement mis à loué ✅');

      // Marquer le logement comme loué
      await db.query(
        "UPDATE logements SET statut = 'loue' WHERE id = $1",
        [r.logement_id]
      );
    }

    await db.query(
      `UPDATE reservations
       SET statut     = $1,
           bail_signe = TRUE,
           updated_at = NOW()
       WHERE id = $2`,
      [nouveauStatut, id]
    );

    res.json({ message: 'Bail signé', statut: nouveauStatut });

  } catch (err) {
    console.error('PATCH /reservations/:id/signer-bail', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;