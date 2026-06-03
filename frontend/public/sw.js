/* eslint-disable no-restricted-globals */
// ================================================
// SERVICE WORKER — Mode hors-ligne Werdhe
// Cache les ressources essentielles pour
// permettre l'utilisation sans internet
// ================================================

var CACHE_NOM = 'werdhe-v1';

// Ressources à mettre en cache pour le mode hors-ligne
var RESSOURCES_CACHE = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/manifest.json'
];

// Installation : mettre en cache les ressources essentielles
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NOM).then(function(cache) {
      console.log('[SW] Mise en cache des ressources essentielles');
      return cache.addAll(RESSOURCES_CACHE).catch(function(err) {
        console.warn('[SW] Certaines ressources non cachées:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(noms) {
      return Promise.all(
        noms.filter(function(nom) { return nom !== CACHE_NOM; })
          .map(function(nom) {
            console.log('[SW] Suppression ancien cache:', nom);
            return caches.delete(nom);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch : stratégie Network First avec fallback cache
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Ne pas intercepter les requêtes API
  if (url.pathname.startsWith('/api') ||
      url.hostname.includes('onrender.com') ||
      url.hostname.includes('cloudinary.com') ||
      url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Mettre en cache la réponse fraîche
        if (response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NOM).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Pas de réseau → utiliser le cache
        return caches.match(event.request).then(function(cached) {
          if (cached) {
            console.log('[SW] Hors-ligne → cache:', event.request.url);
            return cached;
          }
          // Page principale en fallback
          return caches.match('/index.html');
        });
      })
  );
});

// Background Sync — synchroniser les actions hors-ligne au retour du réseau
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
  if (event.tag === 'sync-paiements') {
    event.waitUntil(syncPaiements());
  }
});

async function syncMessages() {
  console.log('[SW] Synchronisation des messages hors-ligne...');
  // La logique de sync sera dans l'app via IndexedDB
}

async function syncPaiements() {
  console.log('[SW] Synchronisation des paiements hors-ligne...');
}