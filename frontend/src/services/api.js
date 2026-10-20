import axios from 'axios';
import toast from 'react-hot-toast'; 

var API_URL = process.env.REACT_APP_API_URL || 'https://api.werdhe.com';

var api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000 // une API qui ne répond jamais ne doit pas bloquer l'UI indéfiniment
});

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

// ── Après chaque mutation → déclencher un refresh global ───────────
api.interceptors.response.use(
  function(response) {
    var methode = response.config.method;
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
  function(error) {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.error('Session expirée. Reconnectez-vous.');
    window.location.href = '/login';
  }
  return Promise.reject(error);
}
);

export default api;