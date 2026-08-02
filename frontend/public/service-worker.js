// Service Worker Werdhe — Notifications Push

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

// Recevoir une notification push
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) { data = { titre: 'Werdhe', corps: e.data ? e.data.text() : '' }; }

  var options = {
    body:    data.corps || 'Vous avez une nouvelle notification',
    icon:    data.icon  || '/logo192.png',
    badge:   data.badge || '/logo192.png',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/dashboard' },
    actions: [
      { action: 'voir', title: 'Voir', icon: '/logo192.png' },
      { action: 'fermer', title: 'Fermer' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.titre || 'Werdhe', options)
  );
});

// Clic sur la notification
self.addEventListener('notificationclick', function(e) {
  e.notification.close();

  if (e.action === 'fermer') return;

  var url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/dashboard';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes('werdhe.com') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('https://werdhe.com' + url);
      }
    })
  );
});