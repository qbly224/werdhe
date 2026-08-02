import api from './api';

// Convertir la clé VAPID base64 en Uint8Array
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var arr     = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr;
}

// Enregistrer le service worker et s'abonner
export async function activerNotificationsPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Non supporté sur ce navigateur');
      return false;
    }

    // Demander la permission
    var permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Permission refusée');
      return false;
    }

    // Enregistrer le service worker
    var registration = await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;

    // Récupérer la clé publique VAPID
    var res = await api.get('/push/vapid-public-key');
    var publicKey = res.data.publicKey;

    // S'abonner
    var subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Envoyer la subscription au backend
    await api.post('/push/subscribe', subscription.toJSON());
    console.log('[Push] Abonné avec succès !');
    return true;

  } catch (err) {
    console.error('[Push] Erreur:', err.message);
    return false;
  }
}

// Vérifier si déjà abonné
export async function estAbonne() {
  try {
    if (!('serviceWorker' in navigator)) return false;
    var registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    var sub = await registration.pushManager.getSubscription();
    return !!sub;
  } catch (err) {
    return false;
  }
}

// Se désabonner
export async function desactiverNotifications() {
  try {
    var registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    var sub = await registration.pushManager.getSubscription();
    if (sub) {
      await api.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
  } catch (err) {
    console.error('[Push] Erreur désabonnement:', err.message);
  }
}