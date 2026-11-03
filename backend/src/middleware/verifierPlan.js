const db = require('../database');

const { PLANS } = require('../config/plans');

// Récupérer le plan d'un utilisateur
async function getPlan(userId) {
  try {
    var result = await db.query(
      `SELECT u.plan,
              (a.source = 'offert' AND a.offert_jusqu_au IS NOT NULL AND a.offert_jusqu_au < CURRENT_DATE) AS offre_echue
       FROM users u LEFT JOIN abonnements a ON a.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    var ligne = result.rows[0];
    if (!ligne) return 'gratuit';

    // Un accès offert échu ne donne plus aucun droit, sans attendre le CRON
    // quotidien (qui peut avoir manqué son passage) : on le clôture à la volée.
    if (ligne.offre_echue) {
      require('../services/adminAbonnementService').expirerOffre(userId)
        .catch(function(err) { console.warn('[getPlan] Expiration accès offert:', err.message); });
      return 'gratuit';
    }
    return ligne.plan;
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