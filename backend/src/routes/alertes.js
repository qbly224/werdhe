const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  getAlertes,
  traiterAlerte,
  creerSignalement,
  traiterSignalement
} = require('../controllers/alerteController');

router.get('/', verifierToken, getAlertes);

// Alertes pour le locataire connecté
router.get('/mes-alertes', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT * FROM alertes
       WHERE destinataire_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ alertes: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.patch('/:id', verifierToken, traiterAlerte);
router.post('/signalements', verifierToken, creerSignalement);
router.patch('/signalements/:id', verifierToken, traiterSignalement);

// Alertes destinées au locataire connecté
router.get('/mes-alertes', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT * FROM alertes
       WHERE destinataire_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ alertes: result.rows });
  } catch (err) {
    console.error('[GET /alertes/mes-alertes]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;