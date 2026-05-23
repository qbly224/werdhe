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
router.patch('/:id', verifierToken, traiterAlerte);
router.post('/signalements', verifierToken, creerSignalement);
router.patch('/signalements/:id', verifierToken, traiterSignalement);

module.exports = router;