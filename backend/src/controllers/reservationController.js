const db = require('../database');

// ================================
// CRÉER UNE RÉSERVATION
// ================================
// Accessible uniquement aux locataires
const creerReservation = async (req, res) => {
  try {
    const { logement_id, date_debut, date_fin } = req.body;

    // 1. Vérifier le rôle
    if (req.user.role !== 'locataire' && req.user.role !== 'les_deux') {
      return res.status(403).json({
        erreur: 'Seuls les locataires peuvent faire une réservation'
      });
    }

    // 2. Vérifier les champs obligatoires
    if (!logement_id || !date_debut) {
      return res.status(400).json({
        erreur: 'Le logement et la date de début sont obligatoires'
      });
    }

    // 3. Vérifier que le logement existe et est disponible
    const logement = await db.query(
      'SELECT * FROM logements WHERE id = $1 AND statut = $2',
      [logement_id, 'disponible']
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Logement non trouvé ou non disponible'
      });
    }

    const l = logement.rows[0];

    // 4. Vérifier que le locataire ne réserve pas son propre logement
    if (l.proprietaire_id === req.user.id) {
      return res.status(400).json({
        erreur: 'Vous ne pouvez pas réserver votre propre logement'
      });
    }

    // 5. Calculer le montant total
    // Si pas de date_fin → on prend 1 mois par défaut
    let montant_total = l.prix_mensuel;

    if (date_fin) {
      const debut = new Date(date_debut);
      const fin = new Date(date_fin);
      // Calculer le nombre de mois entre les deux dates
      const diffMois = Math.ceil(
        (fin - debut) / (1000 * 60 * 60 * 24 * 30)
      );
      montant_total = l.prix_mensuel * (diffMois > 0 ? diffMois : 1);
    }

    // 6. Créer la réservation
    const result = await db.query(
      `INSERT INTO reservations 
        (logement_id, locataire_id, date_debut, date_fin, montant_total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [logement_id, req.user.id, date_debut, date_fin, montant_total]
    );

    res.status(201).json({
      message: '✅ Réservation créée avec succès ! En attente de confirmation.',
      reservation: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur création réservation:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR MES RÉSERVATIONS (locataire)
// ================================
const getMesReservations = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        r.*,
        l.titre as logement_titre,
        l.adresse as logement_adresse,
        l.ville as logement_ville,
        l.prix_mensuel,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.telephone as proprietaire_telephone
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u ON l.proprietaire_id = u.id
       WHERE r.locataire_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: `✅ ${result.rows.length} réservation(s)`,
      reservations: result.rows
    });

  } catch (err) {
    console.error('Erreur mes réservations:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR LES RÉSERVATIONS DE MES LOGEMENTS (propriétaire)
// ================================
const getReservationsProprietaire = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        r.*,
        l.titre as logement_titre,
        l.adresse as logement_adresse,
        l.ville as logement_ville,
        u.nom as locataire_nom,
        u.prenom as locataire_prenom,
        u.telephone as locataire_telephone,
        u.email as locataire_email
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u ON r.locataire_id = u.id
       WHERE l.proprietaire_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: `✅ ${result.rows.length} réservation(s) sur vos logements`,
      reservations: result.rows
    });

  } catch (err) {
    console.error('Erreur réservations propriétaire:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// CONFIRMER OU REFUSER UNE RÉSERVATION (propriétaire)
// ================================
const traiterReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    // statut peut être : 'confirmee' ou 'annulee'

    // 1. Vérifier que le statut est valide
    if (!['confirmee', 'annulee'].includes(statut)) {
      return res.status(400).json({
        erreur: 'Statut invalide. Utilisez confirmee ou annulee'
      });
    }

    // 2. Vérifier que la réservation appartient bien à un logement du propriétaire
    const reservation = await db.query(
      `SELECT r.* FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1 AND l.proprietaire_id = $2`,
      [id, req.user.id]
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Réservation non trouvée ou non autorisée'
      });
    }

    // 3. Mettre à jour le statut de la réservation
    const result = await db.query(
      `UPDATE reservations SET statut = $1 WHERE id = $2 RETURNING *`,
      [statut, id]
    );

    // 4. Si confirmée → mettre le logement en statut "loue"
    if (statut === 'confirmee') {
      await db.query(
        `UPDATE logements SET statut = 'loue' WHERE id = $1`,
        [reservation.rows[0].logement_id]
      );
    }

    res.json({
      message: `✅ Réservation ${statut === 'confirmee' ? 'confirmée' : 'annulée'} !`,
      reservation: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur traitement réservation:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// ANNULER UNE RÉSERVATION (locataire)
// ================================
const annulerReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la réservation appartient au locataire
    const reservation = await db.query(
      'SELECT * FROM reservations WHERE id = $1 AND locataire_id = $2',
      [id, req.user.id]
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Réservation non trouvée ou non autorisée'
      });
    }

    // On ne peut annuler qu'une réservation en attente
    if (reservation.rows[0].statut !== 'en_attente') {
      return res.status(400).json({
        erreur: 'Seules les réservations en attente peuvent être annulées'
      });
    }

    await db.query(
      `UPDATE reservations SET statut = 'annulee' WHERE id = $1`,
      [id]
    );

    res.json({ message: '✅ Réservation annulée avec succès !' });

  } catch (err) {
    console.error('Erreur annulation réservation:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  creerReservation,
  getMesReservations,
  getReservationsProprietaire,
  traiterReservation,
  annulerReservation
};