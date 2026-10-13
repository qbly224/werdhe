const express = require('express');
const router  = express.Router();
const db      = require('../database');

// ════════════════════════════════════════════════════════
// STATISTIQUES PUBLIQUES — page d'accueil (sans authentification)
// ════════════════════════════════════════════════════════
router.get('/public', async (req, res) => {
  try {
    var [logements, users] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM logements`),
      db.query(`
        SELECT COUNT(*) as total FROM users
        WHERE role != 'admin' AND (suspendu IS NULL OR suspendu = FALSE)
      `),
    ]);

    res.json({
      logements_disponibles: Number(logements.rows[0].total),
      utilisateurs_actifs:   Number(users.rows[0].total),
    });
  } catch (err) {
    console.error('[GET /stats/public]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
