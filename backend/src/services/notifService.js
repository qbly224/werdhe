const db = require('../database');

// Sauvegarder une notification push en base
// (le frontend la lira au prochain chargement)
async function notifier(userId, titre, corps, url) {
  try {
    await db.query(
      `INSERT INTO alertes
         (proprietaire_id, destinataire_id, logement_id,
          type, titre, description, priorite)
       VALUES ($1, $2, NULL, 'info', $3, $4, 'normale')`,
      [userId, userId, titre, corps]
    );
    console.log('[Notif]', titre, '→', userId);
  } catch (err) {
    console.warn('[Notif] Erreur:', err.message);
  }
}

module.exports = { notifier };