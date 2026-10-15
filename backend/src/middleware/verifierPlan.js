const db = require('../database');

// Fonctionnalités par plan
var FONCTIONNALITES = {
  gratuit: {
    max_biens:            2,
    mobile_money:         false,
    documents_pdf:        false,
    annuaire:             false,
    rapports:             false,
    alertes_auto:         false,
    multi_users:          false,
    max_membres:          0,
    rapport_mensuel:      false,
    support_prioritaire:  false,
  },
  pro: {
    max_biens:            25,
    mobile_money:         true,
    documents_pdf:        true,
    annuaire:             true,
    rapports:             true,
    alertes_auto:         true,
    multi_users:          false,
    max_membres:          0,
    rapport_mensuel:      false,
    support_prioritaire:  false,
  },
  agence: {
    max_biens:            Infinity,
    mobile_money:         true,
    documents_pdf:        true,
    annuaire:             true,
    rapports:             true,
    alertes_auto:         true,
    multi_users:          true,
    max_membres:          5,
    rapport_mensuel:      true,
    support_prioritaire:  true,
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

// Récupérer les droits (fonctionnalités) d'un utilisateur, par son id
async function obtenirDroits(userId) {
  var plan = await getPlan(userId);
  return FONCTIONNALITES[plan] || FONCTIONNALITES.gratuit;
}

// Middleware : vérifier une fonctionnalité
function verifierFonctionnalite(fonctionnalite) {
  return async function(req, res, next) {
    try {
      var plan = await getPlan(req.proprietaireEffectifId || req.user.id);
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
    var proprietaireId = req.proprietaireEffectifId || req.user.id;
    var plan = await getPlan(proprietaireId);
    var droits = FONCTIONNALITES[plan] || FONCTIONNALITES.gratuit;

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

module.exports = { verifierFonctionnalite, verifierLimiteBiens, getPlan, obtenirDroits, FONCTIONNALITES };