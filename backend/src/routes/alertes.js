const express    = require('express');
const router     = express.Router();
const db         = require('../database');  // ← MANQUAIT
const verifierToken = require('../middleware/auth');
const {
  getAlertes,
  traiterAlerte,
  creerSignalement,
  traiterSignalement
} = require('../controllers/alerteController');

// Alertes proprio
router.get('/', verifierToken, getAlertes);

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
    var nonLues = result.rows.filter(function(a) { return !a.lu; }).length;
    res.json({ alertes: result.rows, non_lues: nonLues });
  } catch (err) {
    console.error('[GET /alertes/mes-alertes]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.patch('/:id', verifierToken, traiterAlerte);
router.post('/signalements', verifierToken, creerSignalement);
router.patch('/signalements/:id', verifierToken, traiterSignalement);

// Marquer toutes les alertes du locataire comme lues
router.patch('/mes-alertes/lues', verifierToken, async (req, res) => {
  try {
    await db.query(
      `UPDATE alertes SET lu = TRUE
       WHERE destinataire_id = $1 AND lu = FALSE`,
      [req.user.id]
    );
    res.json({ message: 'Alertes marquées comme lues' });
  } catch (err) {
    console.error('[PATCH alertes/lues]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Marquer toutes les alertes proprio comme lues
router.patch('/lues', verifierToken, async (req, res) => {
  try {
    await db.query(
      `UPDATE alertes SET lu = TRUE
       WHERE proprietaire_id = $1 AND lu = FALSE
         AND (destinataire_id IS NULL)`,
      [req.user.id]
    );
    res.json({ message: 'Alertes marquées comme lues' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;