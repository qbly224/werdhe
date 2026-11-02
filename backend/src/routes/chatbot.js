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

// Diagnostic temporaire : liste les modèles Gemini réellement disponibles
// pour notre clé API, pour trouver un modèle de repli valide sans deviner
// depuis des sources tierces peu fiables. Protégé par un secret dédié,
// à retirer une fois le bon modèle identifié.
router.get('/_debug/models', async function(req, res) {
  if (!process.env.DEBUG_MODELS_SECRET || req.headers['x-debug-secret'] !== process.env.DEBUG_MODELS_SECRET) {
    return res.status(404).end();
  }
  try {
    var r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY);
    var data = await r.json();
    var modeles = (data.models || [])
      .filter(function(m) { return (m.supportedGenerationMethods || []).includes('generateContent'); })
      .map(function(m) { return m.name; });
    res.json({ modeles: modeles });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Historique — comptes connectés uniquement
router.get('/sessions', verifierToken, listerSessions);
router.get('/sessions/:id', verifierToken, getSession);

module.exports = router;
