const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database');
const verifierToken = require('../middleware/auth');
const { obtenirDroits } = require('../middleware/verifierPlan');
const { emailInvitationEquipe } = require('../services/emailService');

// ─── VOIR MON ÉQUIPE (compte agence) ──────────────────────────────
router.get('/', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT m.id, m.email, m.statut, m.created_at,
              u.prenom, u.nom
       FROM membres_equipe m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.agence_id = $1 AND m.statut != 'revoque'
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );
    res.json({ membres: result.rows });
  } catch (err) {
    console.error('[GET /equipe]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── INVITER UN MEMBRE (plan Agence uniquement) ───────────────────
router.post('/inviter', verifierToken, async (req, res) => {
  try {
    var { email } = req.body;
    if (!email) return res.status(400).json({ erreur: 'Email requis' });
    email = String(email).trim().toLowerCase();

    var droits = await obtenirDroits(req.user.id);
    if (!droits.multi_users) {
      return res.status(403).json({
        erreur: 'Les comptes multi-utilisateurs sont réservés au plan Agence.',
        code: 'MULTI_USERS_INDISPONIBLE'
      });
    }

    var actuel = await db.query(
      `SELECT COUNT(*) FROM membres_equipe WHERE agence_id = $1 AND statut != 'revoque'`,
      [req.user.id]
    );
    if (parseInt(actuel.rows[0].count) >= droits.max_membres) {
      return res.status(403).json({
        erreur: 'Limite de ' + droits.max_membres + ' membres atteinte pour votre équipe.',
        code: 'LIMITE_MEMBRES_ATTEINTE'
      });
    }

    var proprietaire = await db.query('SELECT prenom, nom, email FROM users WHERE id = $1', [req.user.id]);
    var moi = proprietaire.rows[0];
    if (email === moi.email.toLowerCase()) {
      return res.status(400).json({ erreur: 'Vous ne pouvez pas vous inviter vous-même.' });
    }

    var token = crypto.randomBytes(32).toString('hex');
    var userExistant = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);

    var result = await db.query(
      `INSERT INTO membres_equipe (agence_id, user_id, email, statut, token_invitation)
       VALUES ($1, $2, $3, 'invite', $4)
       ON CONFLICT (agence_id, email) DO UPDATE SET token_invitation = $4, statut = 'invite'
       RETURNING *`,
      [req.user.id, userExistant.rows[0] ? userExistant.rows[0].id : null, email, token]
    );

    var lien = (process.env.FRONTEND_URL || 'https://werdhe.com') + '/equipe/rejoindre?token=' + token;
    emailInvitationEquipe(email, moi, lien).catch(console.warn);

    res.status(201).json({ message: 'Invitation envoyée !', membre: result.rows[0] });
  } catch (err) {
    console.error('[POST /equipe/inviter]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── RÉVOQUER UN MEMBRE ────────────────────────────────────────────
router.delete('/:id', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `UPDATE membres_equipe SET statut = 'revoque'
       WHERE id = $1 AND agence_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Membre non trouvé' });
    }
    res.json({ message: 'Membre retiré de l\'équipe' });
  } catch (err) {
    console.error('[DELETE /equipe/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── VOIR UNE INVITATION (public, pour affichage avant connexion) ──
router.get('/invitation/:token', async (req, res) => {
  try {
    var result = await db.query(
      `SELECT m.email, m.statut, u.prenom as agence_prenom, u.nom as agence_nom
       FROM membres_equipe m
       JOIN users u ON m.agence_id = u.id
       WHERE m.token_invitation = $1`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Invitation introuvable ou expirée' });
    }
    res.json({ invitation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── ACCEPTER UNE INVITATION (authentifié) ─────────────────────────
router.post('/invitation/:token/accepter', verifierToken, async (req, res) => {
  try {
    var invitation = await db.query(
      `SELECT * FROM membres_equipe WHERE token_invitation = $1`,
      [req.params.token]
    );
    if (invitation.rows.length === 0) {
      return res.status(404).json({ erreur: 'Invitation introuvable ou expirée' });
    }
    var inv = invitation.rows[0];
    if (inv.statut === 'revoque') {
      return res.status(410).json({ erreur: 'Cette invitation a été révoquée' });
    }

    var moi = await db.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    if (moi.rows[0].email.toLowerCase() !== inv.email.toLowerCase()) {
      return res.status(403).json({
        erreur: 'Cette invitation a été envoyée à une autre adresse email (' + inv.email + ').'
      });
    }

    await db.query(
      `UPDATE membres_equipe SET user_id = $1, statut = 'actif' WHERE id = $2`,
      [req.user.id, inv.id]
    );

    res.json({ message: 'Vous avez rejoint l\'équipe !' });
  } catch (err) {
    console.error('[POST /equipe/invitation/:token/accepter]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
