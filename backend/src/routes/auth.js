const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /auth/register → Inscription
router.post('/register', register);

// POST /auth/login → Connexion
router.post('/login', login);

module.exports = router;