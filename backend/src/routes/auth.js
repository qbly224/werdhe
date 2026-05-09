const express = require('express');
const router = express.Router();
const { register, login, motDePasseOublie } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/mot-de-passe-oublie', motDePasseOublie);

module.exports = router;