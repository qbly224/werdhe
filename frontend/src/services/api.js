import axios from 'axios';
import toast from 'react-hot-toast'; 

var API_URL = process.env.REACT_APP_API_URL || 'https://api.werdhe.com';

var api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000 // une API qui ne répond jamais ne doit pas bloquer l'UI indéfiniment
});

// ── Cache local des lectures publiques ──────────────────────────────
// Sur une connexion faible ou instable, une requête GET peut échouer
// alors que la même donnée a déjà été chargée il y a quelques minutes.
// On garde les dernières réponses des lectures publiques non sensibles
// pour pouvoir continuer à afficher quelque chose hors-ligne.
var CACHE_PREFIX  = 'werdhe-cache:';
var CACHE_TTL_MS  = 6 * 60 * 60 * 1000; // 6h

function urlCachable(url) {
  url = url || '';
  return /^\/logements(\/|\?|$)/.test(url) ||
         /^\/stats\/publiques/.test(url) ||
         /^\/blog\/articles/.test(url);
}

function lireCache(url) {
  try {
    var brut = localStorage.getItem(CACHE_PREFIX + url);
    if (!brut) return null;
    var entree = JSON.parse(brut);
    if (Date.now() - entree.horodatage > CACHE_TTL_MS) return null;
    return entree.donnees;
  } catch (e) { return null; }
}

function ecrireCache(url, donnees) {
  try {
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ donnees: donnees, horodatage: Date.now() }));
  } catch (e) { /* quota plein ou stockage indisponible : tant pis, pas bloquant */ }
}

// ── Envoyer le token JWT à chaque requête ──────────────────────────
api.interceptors.request.use(function(config) {
  var token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  // Les envois de fichiers (photos, documents) peuvent prendre bien plus
  // de 20s sur une connexion mobile lente : on leur laisse plus de marge.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.timeout = 120000;
  }
  return config;
});

// ── Réessai + repli sur le cache en cas d'échec transitoire ─────────
// Sur une connexion faible/instable, une coupure courte ou un délai
// dépassé n'est pas forcément une vraie panne : on retente une fois,
// puis on sert la dernière donnée connue si la lecture est cachable.
async function gererErreur(error) {
  var config = error.config || {};
  var estTransitoire = !error.response || error.response.status >= 500;

  if (config.method === 'get' && estTransitoire && !config.__dejaReessaye) {
    config.__dejaReessaye = true;
    try {
      await new Promise(function(r) { setTimeout(r, 1200); });
      return await api.request(config);
    } catch (erreurReessai) {
      error = erreurReessai;
      estTransitoire = !error.response || error.response.status >= 500;
    }
  }

  if (config.method === 'get' && estTransitoire && urlCachable(config.url)) {
    var cache = lireCache(config.url);
    if (cache) {
      return { data: cache, status: 200, statusText: 'OK (cache local)', headers: {}, config: config, depuisCache: true };
    }
  }

  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.error('Session expirée. Reconnectez-vous.');
    window.location.href = '/login';
  }
  return Promise.reject(error);
}

// ── Après chaque mutation → déclencher un refresh global ───────────
api.interceptors.response.use(
  function(response) {
    var methode = response.config.method;
    if (methode === 'get' && urlCachable(response.config.url)) {
      ecrireCache(response.config.url, response.data);
    }
    if (['post', 'patch', 'put', 'delete'].includes(methode)) {
      // Identifier quelle ressource a changé
      var url = response.config.url || '';
      var event = 'refresh';
      if (url.includes('/logements'))    event = 'logement';
      if (url.includes('/reservations')) event = 'reservation';
      if (url.includes('/paiements'))    event = 'paiement';
      if (url.includes('/messages'))     event = 'message';
      if (url.includes('/alertes'))      event = 'alerte';
      if (url.includes('/preavis'))      event = 'preavis';

      // Délai court pour laisser le backend finir
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('werdhe:refresh', { detail: { source: event } }));
        window.dispatchEvent(new CustomEvent('werdhe:' + event));
      }, 600);
    }
    return response;
  },
  gererErreur
);

export default api;