/* eslint-disable */
// Service Worker Werdhe — Mode hors-ligne + Cache

var CACHE_NAME    = 'werdhe-v1';
var CACHE_STATIC  = 'werdhe-static-v1';
var CACHE_DYNAMIC = 'werdhe-dynamic-v1';

// Ressources à mettre en cache immédiatement
var STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/favicon.ico',
];

// ─── INSTALLATION ─────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  console.log('[SW] Installation...');
  e.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function() {
        return Promise.resolve(); // Ne pas bloquer si une ressource manque
      });
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATION ──────────────────────────────────────────────────
self.addEventListener('activate', function(e) {
  console.log('[SW] Activation...');
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          return k !== CACHE_STATIC && k !== CACHE_DYNAMIC;
        }).map(function(k) {
          console.log('[SW] Suppression ancien cache:', k);
          return caches.delete(k);
        })
      );
    })
  );
  return self.clients.claim();
});

// ─── STRATÉGIE DE CACHE ───────────────────────────────────────────
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Ignorer les requêtes non-GET et les API
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'api.werdhe.com') return;
  if (url.hostname.includes('cloudinary')) return;
  if (url.protocol === 'chrome-extension:') return;

  // Stratégie : Cache First pour les assets statiques
  if (url.pathname.startsWith('/static/') || url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(response) {
          if (!response || response.status !== 200) return response;
          var clone = response.clone();
          caches.open(CACHE_STATIC).then(function(cache) {
            cache.put(e.request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Stratégie : Network First pour les pages HTML
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_DYNAMIC).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/offline.html');
        });
      })
    );
    return;
  }
});

// ─── NOTIFICATIONS PUSH ───────────────────────────────────────────
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) {
    data = { titre: 'Werdhe', corps: e.data ? e.data.text() : '' };
  }
  var options = {
    body:    data.corps || 'Nouvelle notification',
    icon:    '/logo192.png',
    badge:   '/logo192.png',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/dashboard' },
    actions: [
      { action: 'voir',   title: 'Voir'   },
      { action: 'fermer', title: 'Fermer' }
    ]
  };
  e.waitUntil(
    self.registration.showNotification(data.titre || 'Werdhe', options)
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  if (e.action === 'fermer') return;
  var url = (e.notification.data && e.notification.data.url) || '/dashboard';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var c of list) {
        if (c.url.includes('werdhe.com') && 'focus' in c) {
          c.focus();
          c.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow('https://werdhe.com' + url);
    })
  );
});

// ─── SYNC EN ARRIÈRE-PLAN ─────────────────────────────────────────
self.addEventListener('sync', function(e) {
  if (e.tag === 'sync-messages') {
    console.log('[SW] Sync messages en arrière-plan');
  }
});