const express = require('express');
const router = express.Router();
const db = require('../database');
const verifierToken = require('../middleware/auth');
const { verifierFonctionnalite } = require('../middleware/verifierPlan');
const { envoyerEmailSupport } = require('../services/emailService');

// ─── CONTACTER LE SUPPORT PRIORITAIRE (plan Agence) ───────────────
router.post('/contacter', verifierToken, verifierFonctionnalite('support_prioritaire'), async (req, res) => {
  try {
    var { sujet, message } = req.body;
    if (!sujet || !message) {
      return res.status(400).json({ erreur: 'Sujet et message sont obligatoires' });
    }

    var user = await db.query(
      'SELECT nom, prenom, email, telephone, plan FROM users WHERE id = $1',
      [req.user.id]
    );

    var ok = await envoyerEmailSupport(user.rows[0], sujet, message);
    if (!ok) {
      return res.status(500).json({ erreur: 'Impossible d\'envoyer le message pour le moment' });
    }

    res.json({ message: 'Message envoyé à l\'équipe Werdhe !' });
  } catch (err) {
    console.error('[POST /support/contacter]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
