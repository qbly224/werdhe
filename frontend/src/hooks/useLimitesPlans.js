import { useState, useEffect } from 'react';
import api from '../services/api';

// Limites de biens par plan, lues depuis le serveur (backend/src/config/plans.js),
// la seule source de vérité. Renvoie un objet directement utilisable comme
// options d'interpolation i18n : t('cle', limites) avec {{gratuit}} et {{pro}}.
// Tant que ni le cache local ni le serveur n'ont répondu, affiche « … ».
var CLE_CACHE = 'werdhe_limites_plans';
var enMemoire = null;
var requete = null;

function lireCache() {
  try { return JSON.parse(localStorage.getItem(CLE_CACHE)); } catch (e) { return null; }
}

function charger() {
  if (!requete) {
    requete = api.get('/abonnements/plans')
      .then(function(res) {
        enMemoire = res.data.plans;
        try { localStorage.setItem(CLE_CACHE, JSON.stringify(enMemoire)); } catch (e) {}
        return enMemoire;
      })
      .catch(function() { requete = null; return null; });
  }
  return requete;
}

function enLimites(plans) {
  function max(plan) {
    var n = plans && plans[plan] ? plans[plan].max_biens : undefined;
    return n === undefined || n === null ? '…' : n;
  }
  return { gratuit: max('gratuit'), pro: max('pro') };
}

export default function useLimitesPlans() {
  var [plans, setPlans] = useState(enMemoire || lireCache());

  useEffect(function() {
    var actif = true;
    charger().then(function(p) { if (actif && p) setPlans(p); });
    return function() { actif = false; };
  }, []);

  return enLimites(plans);
}
