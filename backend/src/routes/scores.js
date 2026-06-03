const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const { getScore, recalculerMonScore } = require('../controllers/scoresController');

// Voir mon score
router.get('/mon-score', verifierToken, getScore);

// Voir le score d'un autre utilisateur
router.get('/:user_id', verifierToken, getScore);

// Recalculer mon score
router.post('/recalculer', verifierToken, recalculerMonScore);

module.exports = router;