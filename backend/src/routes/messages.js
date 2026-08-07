const express = require('express');
const router = express.Router();
const db            = require('../database');
const verifierToken = require('../middleware/auth');
const {
  envoyerMessage, getConversations,
  getMessages, getNonLus, uploadMessage
} = require('../controllers/messagesController');

// Voir toutes mes conversations
router.get('/conversations', verifierToken, getConversations);

// Voir les messages avec un interlocuteur
router.get('/:interlocuteurId', verifierToken, async (req, res) => {
  try {
    var { interlocuteurId } = req.params;

    // Marquer les messages reçus comme lus
    await db.query(
      `UPDATE messages SET lu = TRUE, lu_at = NOW()
       WHERE expedition_id = $1 AND destinataire_id = $2 AND lu = FALSE`,
      [interlocuteurId, req.user.id]
    );

    var result = await db.query(
      `SELECT m.*,
         r.contenu as reply_contenu_msg,
         u_reply.prenom as reply_auteur,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT('emoji', mr.emoji, 'nb', mr.nb)
           ) FILTER (WHERE mr.emoji IS NOT NULL),
           '[]'
         ) as reactions
       FROM messages m
       LEFT JOIN messages r ON m.reply_to = r.id
       LEFT JOIN users u_reply ON r.expedition_id = u_reply.id
       LEFT JOIN (
         SELECT message_id, emoji, COUNT(*) as nb
         FROM message_reactions
         GROUP BY message_id, emoji
       ) mr ON mr.message_id = m.id
       WHERE (m.expedition_id = $1 AND m.destinataire_id = $2)
          OR (m.expedition_id = $2 AND m.destinataire_id = $1)
       GROUP BY m.id, r.contenu, u_reply.prenom
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.user.id, interlocuteurId]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('[GET /messages/:id]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// Envoyer un message (texte ou fichier)
router.post('/', verifierToken, uploadMessage.single('fichier'), envoyerMessage);

// Email si destinataire pas connecté récemment
if (result.rows[0] && destinataire && destinataire.email) {
  emailService.emailNouveauMessage(
    destinataire,
    { prenom: req.user.prenom, nom: req.user.nom },
    contenu || 'Fichier joint'
  ).catch(console.warn);
}

// Compter les non lus
router.get('/non-lus/count', verifierToken, getNonLus);

// ─── MARQUER COMME LU ────────────────────────────────────────────
router.patch('/lus/:interlocuteurId', verifierToken, async (req, res) => {
  try {
    await db.query(
      `UPDATE messages SET lu = TRUE, lu_at = NOW()
       WHERE expedition_id = $1 AND destinataire_id = $2 AND lu = FALSE`,
      [req.params.interlocuteurId, req.user.id]
    );
    res.json({ message: 'Messages marqués comme lus' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── RÉAGIR À UN MESSAGE ─────────────────────────────────────────
router.post('/:id/reaction', verifierToken, async (req, res) => {
  try {
    var { emoji } = req.body;
    if (!emoji) return res.status(400).json({ erreur: 'Emoji requis' });

    // Toggle : si déjà réagi avec ce même emoji → supprimer
    var existing = await db.query(
      'SELECT id FROM message_reactions WHERE message_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length > 0) {
      await db.query(
        'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      return res.json({ message: 'Réaction supprimée' });
    }

    await db.query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = $3`,
      [req.params.id, req.user.id, emoji]
    );

    res.status(201).json({ message: 'Réaction ajoutée' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── RÉACTIONS D'UN MESSAGE ───────────────────────────────────────
router.get('/:id/reactions', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT emoji, COUNT(*) as nb,
         BOOL_OR(user_id = $2) as ma_reaction
       FROM message_reactions
       WHERE message_id = $1
       GROUP BY emoji`,
      [req.params.id, req.user.id]
    );
    res.json({ reactions: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;