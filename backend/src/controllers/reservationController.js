const db = require('../database');
const emailService = require('../services/emailService');
// ================================
// CRÉER UNE RÉSERVATION
// ================================
// Accessible uniquement aux locataires
const creerReservation = async (req, res) => {
  try {
    const {
      logement_id,
      date_debut,
      date_fin,
      duree_mois,
      type_location
    } = req.body;

    // 1. Vérifier le rôle
    if (req.user.role !== 'locataire' && req.user.role !== 'les_deux') {
      return res.status(403).json({
        erreur: 'Seuls les locataires peuvent faire une réservation'
      });
    }

    // 2. Seule la date de début est obligatoire
    if (!logement_id || !date_debut) {
      return res.status(400).json({
        erreur: 'Le logement et la date de début sont obligatoires'
      });
    }

    // 3. Vérifier que le logement existe et est disponible
    const logement = await db.query(
      `SELECT l.*, u.prenom as prop_prenom, u.nom as prop_nom, u.email as prop_email
       FROM logements l
       JOIN users u ON l.proprietaire_id = u.id
       WHERE l.id = $1 AND l.statut = $2`,
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
    // montant_total = loyer mensuel (pas multiplié par la durée)
    // La durée est stockée séparément dans duree_mois
    let duree_calculee = duree_mois || 1;
    if (date_fin) {
      const debut = new Date(date_debut);
      const fin   = new Date(date_fin);
      duree_calculee = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24 * 30));
    }
    let montant_total = l.prix_mensuel; 
    // Toujours 1 mois de loyer

    // 6. Déterminer le type de location
    const typeLocation = type_location ||
      (date_fin ? 'courte_duree' : 'longue_duree');

    // 7. Créer la réservation
    const result = await db.query(
      `INSERT INTO reservations
        (logement_id, locataire_id, date_debut, date_fin,
         montant_total, duree_mois, type_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        logement_id,
        req.user.id,
        date_debut,
        date_fin || null,
        montant_total,
        duree_calculee,
        typeLocation
      ]
    );
    // Notifier le propriétaire par email
    emailService.emailNouvelleCandidature(
      { prenom: l.prop_prenom, nom: l.prop_nom, email: l.prop_email },
      { prenom: req.user.prenom, nom: req.user.nom, email: req.user.email, telephone: req.user.telephone },
      { titre: l.titre, ville: l.ville }
    ).catch(console.warn);

    res.status(201).json({
      message: typeLocation === 'longue_duree'
        ? '✅ Réservation longue durée créée ! En attente de confirmation.'
        : '✅ Réservation créée ! En attente de confirmation.',
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
        l.titre          as logement_titre,
        l.adresse        as logement_adresse,
        l.ville          as logement_ville,
        l.prix_mensuel,
        l.id             as logement_id,
        l.proprietaire_id,
        u.nom            as locataire_nom,
        u.prenom         as locataire_prenom,
        u.telephone      as locataire_telephone,
        u.email          as locataire_email,
        u.id             as locataire_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u ON r.locataire_id = u.id
       WHERE l.proprietaire_id = $1
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
        l.prix_mensuel,
        l.id as logement_id,
        l.proprietaire_id,
        u.nom as locataire_nom,
        u.prenom as locataire_prenom,
        u.telephone as locataire_telephone,
        u.email as locataire_email,
        u.id as locataire_id
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