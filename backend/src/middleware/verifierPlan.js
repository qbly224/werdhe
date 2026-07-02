const db = require('../database');

// Fonctionnalités par plan
var FONCTIONNALITES = {
  gratuit: {
    max_biens:        2,
    mobile_money:     false,
    documents_pdf:    false,
    annuaire:         false,
    rapports:         false,
    multi_users:      false,
  },
  pro: {
    max_biens:        25,
    mobile_money:     true,
    documents_pdf:    true,
    annuaire:         true,
    rapports:         true,
    multi_users:      false,
  },
  agence: {
    max_biens:        Infinity,
    mobile_money:     true,
    documents_pdf:    true,
    annuaire:         true,
    rapports:         true,
    multi_users:      true,
  }
};

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

// Middleware : vérifier une fonctionnalité
function verifierFonctionnalite(fonctionnalite) {
  return async function(req, res, next) {
    try {
      var plan = await getPlan(req.user.id);
      var droits = FONCTIONNALITES[plan] || FONCTIONNALITES.gratuit;

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
    var plan = await getPlan(req.user.id);
    var droits = FONCTIONNALITES[plan] || FONCTIONNALITES.gratuit;

    var result = await db.query(
      'SELECT COUNT(*) FROM logements WHERE proprietaire_id = $1',
      [req.user.id]
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

module.exports = { verifierFonctionnalite, verifierLimiteBiens, getPlan, FONCTIONNALITES };