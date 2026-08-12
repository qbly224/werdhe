const express    = require('express');
const router     = express.Router();
const db         = require('../database');
const webpush    = require('web-push');
const verifierToken = require('../middleware/auth');

// Configurer web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:contact@werdhe.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('[Push] VAPID configuré ✅');
} else {
  console.warn('[Push] Clés VAPID manquantes — notifications push désactivées');
}

// ─── RETOURNER LA CLÉ PUBLIQUE ────────────────────────────────────
router.get('/vapid-public-key', function(req, res) {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ─── SAUVEGARDER UNE SUBSCRIPTION ────────────────────────────────
router.post('/subscribe', verifierToken, async (req, res) => {
  try {
    var { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ erreur: 'Subscription invalide' });
    }

    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint)
       DO UPDATE SET p256dh = $3, auth = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ message: 'Subscription enregistrée' });
  } catch (err) {
    console.error('[Push subscribe]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── SUPPRIMER UNE SUBSCRIPTION ──────────────────────────────────
router.delete('/unsubscribe', verifierToken, async (req, res) => {
  try {
    var { endpoint } = req.body;
    await db.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [req.user.id, endpoint]
    );
    res.json({ message: 'Subscription supprimée' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── FONCTION UTILITAIRE : envoyer une notification ──────────────
async function envoyerNotification(userId, titre, corps, url) {
  try {
    var subs = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    var payload = JSON.stringify({
      titre:  titre,
      corps:  corps,
      url:    url || '/dashboard',
      icon:   '/logo192.png',
      badge:  '/logo192.png'
    });

    for (var sub of subs.rows) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        console.log('[Push] Envoyé à', userId);
      } catch (pushErr) {
        if (pushErr.statusCode === 410) {
          // Subscription expirée → supprimer
          await db.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
          console.log('[Push] Subscription expirée supprimée');
        } else {
          console.warn('[Push] Erreur:', pushErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('[Push] Erreur globale:', err.message);
  }
}
// ─── FONCTION HELPER — Envoyer une notif push ─────────────────────
async function envoyerPush(userId, titre, corps, url) {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) return;
    var subs = await db.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    if (subs.rows.length === 0) return;

    var payload = JSON.stringify({
      titre: titre,
      corps: corps,
      url:   url || '/dashboard',
    });

    await Promise.all(subs.rows.map(function(s) {
      return webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      ).catch(function(err) {
        if (err.statusCode === 410) {
          // Subscription expirée — supprimer
          db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [s.endpoint]).catch(console.warn);
        }
      });
    }));

    console.log('[Push] ✅ Notification envoyée à user:', userId);
  } catch (err) {
    console.warn('[Push] Erreur:', err.message);
  }
}

module.exports.envoyerPush = envoyerPush;
module.exports = { router, envoyerNotification };