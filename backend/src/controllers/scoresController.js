const db = require('../database');
const { recalculerScore } = require('./reclamationsController');

// ================================================
// VOIR LE SCORE D'UN UTILISATEUR
// ================================================
const getScore = async (req, res) => {
  try {
    var userId = req.params.user_id || req.user.id;

    var result = await db.query(
      `SELECT s.*, u.nom, u.prenom, u.role
       FROM scores_confiance s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Créer un score par défaut
      var newScore = await db.query(
        `INSERT INTO scores_confiance (user_id, score, badge)
         VALUES ($1, 50, 'nouveau') RETURNING *`,
        [userId]
      );
      return res.json({ score: newScore.rows[0] });
    }

    res.json({ score: result.rows[0] });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// RECALCULER MON SCORE
// Appelé après chaque paiement, réclamation, etc.
// ================================================
const recalculerMonScore = async (req, res) => {
  try {
    var userId = req.user.id;

    // Compter les paiements à l'heure vs en retard
    var paiements = await db.query(
      `SELECT
         COUNT(CASE WHEN statut = 'complete' THEN 1 END) as a_temps,
         COUNT(CASE WHEN statut = 'en_retard' THEN 1 END) as en_retard
       FROM paiements
       WHERE locataire_id = $1`,
      [userId]
    );

    // Compter les réclamations résolues (si proprio)
    var reclamations = await db.query(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN statut = 'resolue' THEN 1 END) as resolues
       FROM reclamations
       WHERE proprietaire_id = $1`,
      [userId]
    );

    // Compter les locations complètes
    var locations = await db.query(
      `SELECT COUNT(*) as total
       FROM reservations
       WHERE (locataire_id = $1 OR logement_id IN (
         SELECT id FROM logements WHERE proprietaire_id = $1
       ))
       AND statut = 'terminee'`,
      [userId]
    );

    var p = paiements.rows[0];
    var r = reclamations.rows[0];
    var l = locations.rows[0];

    // Mettre à jour les stats
    await db.query(
      `UPDATE scores_confiance SET
         nb_paiements_a_temps = $1,
         nb_paiements_retard = $2,
         nb_reclamations = $3,
         nb_reclamations_resolues = $4,
         nb_locations_completes = $5,
         updated_at = NOW()
       WHERE user_id = $6`,
      [
        parseInt(p.a_temps) || 0,
        parseInt(p.en_retard) || 0,
        parseInt(r.total) || 0,
        parseInt(r.resolues) || 0,
        parseInt(l.total) || 0,
        userId
      ]
    );

    // Recalculer le score final
    await recalculerScore(userId);

    // Retourner le nouveau score
    var newScore = await db.query(
      'SELECT * FROM scores_confiance WHERE user_id = $1',
      [userId]
    );

    res.json({
      message: 'Score recalcule !',
      score: newScore.rows[0]
    });

  } catch (err) {
    console.error('Erreur recalcul score:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = { getScore, recalculerMonScore };