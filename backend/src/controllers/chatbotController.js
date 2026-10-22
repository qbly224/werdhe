const jwt = require('jsonwebtoken');
const db = require('../database');
const chatbotService = require('../services/chatbotService');
const { uploaderImageChatbot } = require('../services/cloudinaryService');

var MAX_MESSAGES = 16;   // historique envoyé à chaque appel
var MAX_LONGUEUR = 2000; // caractères par message

// Le chat fonctionne pour tout le monde ; seuls les comptes connectés ont
// leur historique sauvegardé. On décode le token s'il existe, sans jamais
// rejeter la requête s'il est absent ou invalide (contrairement à
// verifierToken).
function utilisateurConnecte(req) {
  var authHeader = req.headers['authorization'];
  var token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function envoyerMessage(req, res) {
  try {
    var messages;
    try {
      messages = JSON.parse(req.body.messages || '[]');
    } catch (e) {
      return res.status(400).json({ erreur: 'messages invalide' });
    }
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

    var image = req.file ? { buffer: req.file.buffer, mimeType: req.file.mimetype } : null;
    var user = utilisateurConnecte(req);
    var conversationId = req.body.conversation_id || null;
    var imageUrl = null;

    // Persistance best-effort : un souci de base ne doit jamais empêcher le
    // chat lui-même de fonctionner.
    if (user) {
      try {
        if (image) {
          imageUrl = await uploaderImageChatbot(image.buffer, image.mimeType);
        }
        if (conversationId) {
          var verif = await db.query(
            'SELECT id FROM chatbot_conversations WHERE id = $1 AND user_id = $2',
            [conversationId, user.id]
          );
          if (verif.rows.length === 0) conversationId = null;
        }
        if (!conversationId) {
          var titre = messages[messages.length - 1].content.slice(0, 80);
          var creation = await db.query(
            'INSERT INTO chatbot_conversations (user_id, titre) VALUES ($1, $2) RETURNING id',
            [user.id, titre]
          );
          conversationId = creation.rows[0].id;
        }
        await db.query(
          `INSERT INTO chatbot_messages (conversation_id, role, contenu, image_url) VALUES ($1, 'user', $2, $3)`,
          [conversationId, messages[messages.length - 1].content, imageUrl]
        );
      } catch (persistErr) {
        console.error('[chatbot] persistance message utilisateur:', persistErr.message);
        conversationId = null;
      }
    }

    var resultat = await chatbotService.repondre(messages, locale, image);

    if (user && conversationId) {
      db.query(
        `INSERT INTO chatbot_messages (conversation_id, role, contenu) VALUES ($1, 'assistant', $2)`,
        [conversationId, resultat.reply]
      ).catch(function(err) { console.error('[chatbot] persistance réponse:', err.message); });
      db.query('UPDATE chatbot_conversations SET updated_at = NOW() WHERE id = $1', [conversationId])
        .catch(function(err) { console.error('[chatbot] updated_at:', err.message); });
    }

    res.json({
      reply: resultat.reply,
      logements: resultat.logements,
      conversation_id: user ? conversationId : null,
      image_url: imageUrl
    });
  } catch (err) {
    console.error('[POST /chatbot/message]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
}

// ─── HISTORIQUE (comptes connectés uniquement) ─────────────────────
async function listerSessions(req, res) {
  try {
    var result = await db.query(
      `SELECT c.id, c.titre, c.created_at, c.updated_at
       FROM chatbot_conversations c
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('[GET /chatbot/sessions]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
}

async function getSession(req, res) {
  try {
    var conv = await db.query(
      'SELECT id FROM chatbot_conversations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (conv.rows.length === 0) {
      return res.status(404).json({ erreur: 'Conversation non trouvée' });
    }

    var messages = await db.query(
      'SELECT role, contenu, image_url, created_at FROM chatbot_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ messages: messages.rows });
  } catch (err) {
    console.error('[GET /chatbot/sessions/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
}

module.exports = { envoyerMessage, listerSessions, getSession };
