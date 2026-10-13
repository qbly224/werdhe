const express = require('express');
const router  = express.Router();
const db      = require('../database');

// ════════════════════════════════════════════════════════
// STATISTIQUES PUBLIQUES — page d'accueil (sans authentification)
// ════════════════════════════════════════════════════════
router.get('/public', async (req, res) => {
  try {
    var [logements, users, villes] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM logements`),
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE role = 'proprietaire' OR role = 'les_deux') as proprietaires,
          COUNT(*) FILTER (WHERE role = 'locataire' OR role = 'les_deux') as locataires
        FROM users
        WHERE role != 'admin' AND (suspendu IS NULL OR suspendu = FALSE)
      `),
      db.query(`SELECT COUNT(DISTINCT ville) as total FROM logements WHERE ville IS NOT NULL AND ville != ''`),
    ]);

    res.json({
      logements_disponibles: Number(logements.rows[0].total),
      utilisateurs_actifs:   Number(users.rows[0].total),
      proprietaires_actifs:  Number(users.rows[0].proprietaires),
      locataires_actifs:     Number(users.rows[0].locataires),
      villes_couvertes:      Number(villes.rows[0].total),
    });
  } catch (err) {
    console.error('[GET /stats/public]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
