// Source unique des limites et fonctionnalités de chaque plan.
// Middleware, CRON, chatbot et pages publiques (via GET /abonnements/plans)
// lisent ces valeurs : ne jamais les recopier ailleurs.
var PLANS = {
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

// Prix de base (GNF / mois)
var PRIX_MENSUEL = { pro: 120000, agence: 300000 };

function limiteBiens(plan) {
  return (PLANS[plan] || PLANS.gratuit).max_biens;
}

// Infinity n'est pas sérialisable en JSON : « illimité » est exposé en null.
function limitesPubliques() {
  var sortie = {};
  Object.keys(PLANS).forEach(function(plan) {
    sortie[plan] = {
      max_biens:   PLANS[plan].max_biens === Infinity ? null : PLANS[plan].max_biens,
      max_membres: PLANS[plan].max_membres,
    };
  });
  return sortie;
}

module.exports = { PLANS, PRIX_MENSUEL, limiteBiens, limitesPubliques };
