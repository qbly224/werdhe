const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  envoyerMessage, getConversations,
  getMessages, getNonLus, uploadMessage
} = require('../controllers/messagesController');

// Voir toutes mes conversations
router.get('/conversations', verifierToken, getConversations);

// Voir les messages avec un interlocuteur
router.get('/:interlocuteur_id', verifierToken, getMessages);

// Envoyer un message (texte ou fichier)
router.post('/', verifierToken, uploadMessage.single('fichier'), envoyerMessage);

// Compter les non lus
router.get('/non-lus/count', verifierToken, getNonLus);

module.exports = router;