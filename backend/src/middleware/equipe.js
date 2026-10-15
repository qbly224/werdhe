const db = require('../database');

// Résout le "propriétaire effectif" de la requête : pour un membre actif
// d'une équipe agence, c'est le compte agence lui-même (biens, réservations,
// paiements, abonnement partagés) ; sinon, c'est l'utilisateur connecté.
async function resoudreProprietaireEffectif(req, res, next) {
  try {
    var result = await db.query(
      `SELECT agence_id FROM membres_equipe WHERE user_id = $1 AND statut = 'actif' LIMIT 1`,
      [req.user.id]
    );
    req.proprietaireEffectifId = result.rows.length > 0 ? result.rows[0].agence_id : req.user.id;
  } catch (err) {
    req.proprietaireEffectifId = req.user.id;
  }
  next();
}

module.exports = resoudreProprietaireEffectif;
