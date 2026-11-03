const db = require('../database');

const { PLANS } = require('../config/plans');

// Récupérer le plan d'un utilisateur
async function getPlan(userId) {
  try {
    var result = await db.query(
      `SELECT plan FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] ? result.rows[0].plan : 'gratuit';
  } catch (err) {
    return 'gratuit';
  }
}

// Récupérer les droits (fonctionnalités) d'un utilisateur, par son id
async function obtenirDroits(userId) {
  var plan = await getPlan(userId);
  return PLANS[plan] || PLANS.gratuit;
}

// Middleware : vérifier une fonctionnalité
function verifierFonctionnalite(fonctionnalite) {
  return async function(req, res, next) {
    try {
      var plan = await getPlan(req.proprietaireEffectifId || req.user.id);
      var droits = PLANS[plan] || PLANS.gratuit;

      if (!droits[fonctionnalite]) {
        return res.status(403).json({
          erreur: 'Fonctionnalité non disponible dans votre plan',
          fonctionnalite: fonctionnalite,
          plan_actuel: plan,
          upgrade_requis: plan === 'gratuit' ? 'pro' : 'agence'
        });
      }
      next();
    } catch (err) {
      next();
    }
  };
}

// Middleware : vérifier la limite de biens
async function verifierLimiteBiens(req, res, next) {
  try {
    var proprietaireId = req.proprietaireEffectifId || req.user.id;
    var plan = await getPlan(proprietaireId);
    var droits = PLANS[plan] || PLANS.gratuit;

    var result = await db.query(
      'SELECT COUNT(*) FROM logements WHERE proprietaire_id = $1',
      [proprietaireId]
    );
    var nbBiens = parseInt(result.rows[0].count);

    if (nbBiens >= droits.max_biens) {
      return res.status(403).json({
        erreur: 'Limite de biens atteinte pour votre plan ' + plan,
        limite: droits.max_biens,
        nb_biens: nbBiens,
        plan_actuel: plan,
        upgrade_requis: plan === 'gratuit' ? 'pro' : 'agence'
      });
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = { verifierFonctionnalite, verifierLimiteBiens, getPlan, obtenirDroits };