const express = require('express');
const router = express.Router();
const {
  register,
  login,
  demanderReset,
  resetMotDePasse
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', demanderReset);
router.post('/reset-password', resetMotDePasse);

module.exports = router;