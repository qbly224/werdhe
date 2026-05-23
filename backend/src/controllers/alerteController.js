const db = require('../database');

// ================================
// GÉNÉRER LES ALERTES AUTOMATIQUES
// ================================
// Vérifie loyers en retard et bails expirants
const genererAlertes = async (proprietaireId) => {
  try {
    // 1. Loyers en retard (locataires manuels)
    const retards = await db.query(
      `SELECT lm.*, l.titre as logement_titre
       FROM locataires_manuels lm
       JOIN logements l ON lm.logement_id = l.id
       WHERE lm.proprietaire_id = $1
       AND lm.statut = 'actif'
       AND lm.date_entree IS NOT NULL
       AND lm.loyer_mensuel IS NOT NULL`,
      [proprietaireId]
    );

    for (const loc of retards.rows) {
      const joursDepuisEntree = Math.floor(
        (new Date() - new Date(loc.date_entree)) / (1000 * 60 * 60 * 24)
      );
      const joursRetard = joursDepuisEntree % 30;

      if (joursRetard > 5) {
        // Vérifier si alerte existe déjà
        const existe = await db.query(
          `SELECT id FROM alertes
           WHERE proprietaire_id = $1
           AND logement_id = $2
           AND type = 'loyer_retard'
           AND statut = 'active'
           AND created_at > NOW() - INTERVAL '30 days'`,
          [proprietaireId, loc.logement_id]
        );

        if (existe.rows.length === 0) {
          await db.query(
            `INSERT INTO alertes
              (proprietaire_id, logement_id, type, titre, description, priorite)
             VALUES ($1, $2, 'loyer_retard', $3, $4, 'haute')`,
            [
              proprietaireId,
              loc.logement_id,
              loc.prenom + ' ' + loc.nom + ' — Loyer en retard de ' + joursRetard + ' jours',
              'Bien concerne : ' + loc.logement_titre
            ]
          );
        }
      }
    }

    // 2. Bails bientôt expirants (dans les 60 jours)
    const bails = await db.query(
      `SELECT lm.*, l.titre as logement_titre
       FROM locataires_manuels lm
       JOIN logements l ON lm.logement_id = l.id
       WHERE lm.proprietaire_id = $1
       AND lm.date_sortie IS NOT NULL
       AND lm.date_sortie BETWEEN NOW() AND NOW() + INTERVAL '60 days'
       AND lm.statut = 'actif'`,
      [proprietaireId]
    );

    for (const bail of bails.rows) {
      const joursRestants = Math.floor(
        (new Date(bail.date_sortie) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const existe = await db.query(
        `SELECT id FROM alertes
         WHERE proprietaire_id = $1
         AND logement_id = $2
         AND type = 'bail_bientot'
         AND statut = 'active'`,
        [proprietaireId, bail.logement_id]
      );

      if (existe.rows.length === 0) {
        await db.query(
          `INSERT INTO alertes
            (proprietaire_id, logement_id, type, titre, description, priorite)
           VALUES ($1, $2, 'bail_bientot', $3, $4, 'normale')`,
          [
            proprietaireId,
            bail.logement_id,
            'Bail de ' + bail.prenom + ' ' + bail.nom + ' expire dans ' + joursRestants + ' jours',
            'Bien concerne : ' + bail.logement_titre
          ]
        );
      }
    }

  } catch (err) {
    console.error('Erreur generation alertes:', err.message);
  }
};

// ================================
// RÉCUPÉRER LES ALERTES
// ================================
const getAlertes = async (req, res) => {
  try {
    await genererAlertes(req.user.id);

    const alertes = await db.query(
      `SELECT a.*,
        l.titre as logement_titre,
        l.ville as logement_ville
       FROM alertes a
       LEFT JOIN logements l ON a.logement_id = l.id
       WHERE a.proprietaire_id = $1
       AND a.statut = 'active'
       ORDER BY
         CASE a.priorite WHEN 'haute' THEN 1 WHEN 'normale' THEN 2 ELSE 3 END,
         a.created_at DESC`,
      [req.user.id]
    );

    const signalements = await db.query(
      `SELECT s.*,
        l.titre as logement_titre,
        u.nom as locataire_nom,
        u.prenom as locataire_prenom
       FROM signalements s
       JOIN logements l ON s.logement_id = l.id
       LEFT JOIN users u ON s.locataire_id = u.id
       WHERE s.proprietaire_id = $1
       AND s.statut != 'resolu'
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );

    res.json({
      alertes: alertes.rows,
      signalements: signalements.rows,
      total: alertes.rows.length + signalements.rows.length
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// TRAITER UNE ALERTE
// ================================
const traiterAlerte = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    await db.query(
      `UPDATE alertes SET statut = $1
       WHERE id = $2 AND proprietaire_id = $3`,
      [statut, id, req.user.id]
    );

    res.json({ message: 'Alerte mise a jour !' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// CRÉER UN SIGNALEMENT (locataire)
// ================================
const creerSignalement = async (req, res) => {
  try {
    const { logement_id, type, titre, description } = req.body;

    const logement = await db.query(
      'SELECT proprietaire_id FROM logements WHERE id = $1',
      [logement_id]
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement non trouve' });
    }

    const result = await db.query(
      `INSERT INTO signalements
        (logement_id, locataire_id, proprietaire_id, type, titre, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        logement_id,
        req.user.id,
        logement.rows[0].proprietaire_id,
        type || 'autre',
        titre,
        description
      ]
    );

    await db.query(
      `INSERT INTO alertes
        (proprietaire_id, logement_id, type, titre, description, priorite)
       VALUES ($1, $2, 'panne', $3, $4, 'normale')`,
      [
        logement.rows[0].proprietaire_id,
        logement_id,
        'Signalement : ' + titre,
        description || ''
      ]
    );

    res.status(201).json({
      message: 'Signalement envoye !',
      signalement: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// TRAITER UN SIGNALEMENT
// ================================
const traiterSignalement = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    await db.query(
      `UPDATE signalements SET statut = $1
       WHERE id = $2 AND proprietaire_id = $3`,
      [statut, id, req.user.id]
    );

    res.json({ message: 'Signalement mis a jour !' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  getAlertes,
  traiterAlerte,
  creerSignalement,
  traiterSignalement
};