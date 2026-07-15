const db = require('../database');

async function log(userId, action, details, ipAddress) {
  try {
    await db.query(
      `INSERT INTO logs_audit (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId || null, action, JSON.stringify(details || {}), ipAddress || null]
    );
  } catch (err) {
    // Les logs ne doivent jamais bloquer l'application
    console.warn('[Audit] Erreur log:', err.message);
  }
}

module.exports = { log };