const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  register,
  login,
  demanderReset,
  resetMotDePasse,
  getProfil,
  modifierProfil,
  changerMotDePasse
} = require('../controllers/authController');

// Publiques
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', demanderReset);
router.post('/reset-password', resetMotDePasse);

// Protégées
router.get('/profil', verifierToken, getProfil);
router.put('/profil', verifierToken, modifierProfil);
router.put('/changer-mot-de-passe', verifierToken, changerMotDePasse);

module.exports = router;