const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verifierToken = require('../middleware/auth');
const { uploadChatbot } = require('../services/cloudinaryService');
const { envoyerMessage, listerSessions, getSession } = require('../controllers/chatbotController');

// Garde-fou de coût : l'API Gemini est facturée à l'usage au-delà du palier
// gratuit. 20 messages/10min absorbe une vraie conversation sans ouvrir la
// porte à un abus coûteux.
var limiteurChatbot = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { erreur: 'Trop de messages envoyés à l\'assistant. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/message', limiteurChatbot, uploadChatbot.single('image'), envoyerMessage);

// Historique — comptes connectés uniquement
router.get('/sessions', verifierToken, listerSessions);
router.get('/sessions/:id', verifierToken, getSession);

module.exports = router;
