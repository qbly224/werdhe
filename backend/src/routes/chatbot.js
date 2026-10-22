const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const chatbotService = require('../services/chatbotService');

// Garde-fou de coût : l'API Claude est facturée à l'usage. 20 messages/10min
// absorbe une vraie conversation sans ouvrir la porte à un abus coûteux.
var limiteurChatbot = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { erreur: 'Trop de messages envoyés à l\'assistant. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

var MAX_MESSAGES = 16;      // historique envoyé à chaque appel
var MAX_LONGUEUR = 2000;    // caractères par message

router.post('/message', limiteurChatbot, async (req, res) => {
  try {
    var messages = req.body.messages;
    var locale = req.body.locale === 'en' ? 'en' : 'fr';

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ erreur: 'messages requis' });
    }
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (!m || typeof m.content !== 'string' || !m.content.trim()) {
        return res.status(400).json({ erreur: 'Message invalide' });
      }
      if (m.content.length > MAX_LONGUEUR) {
        return res.status(400).json({ erreur: 'Message trop long' });
      }
    }

    var resultat = await chatbotService.repondre(messages, locale);
    res.json(resultat);
  } catch (err) {
    console.error('[POST /chatbot/message]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
