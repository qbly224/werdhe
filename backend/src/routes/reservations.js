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

// Toutes les routes réservations sont protégées
// Un utilisateur doit être connecté pour réserver

// Locataire
router.post('/', verifierToken, creerReservation);
router.get('/mes-reservations', verifierToken, getMesReservations);
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
    const { id } = req.params;
    const { decision, motif } = req.body;

    // Vérifier que c'est bien le propriétaire du logement concerné
    const check = await db.query(
      `SELECT r.id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1 AND l.proprietaire_id = $2`,
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    // Correspondance décision → statut stocké en base
    const statuts = {
      dossier_requis : 'dossier_requis',
      acceptee       : 'acceptee',
      echanges       : 'echanges',
      refusee        : 'refusee',
    };

    const nouveauStatut = statuts[decision];
    if (!nouveauStatut) {
      return res.status(400).json({ erreur: 'Décision invalide : ' + decision });
    }

    await db.query(
      `UPDATE reservations
       SET statut      = $1,
           motif_refus = $2,
           updated_at  = NOW()
       WHERE id = $3`,
      [nouveauStatut, motif || null, id]
    );

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
    console.error('PATCH /reservations/:id/soumettre-dossier', err.message);
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