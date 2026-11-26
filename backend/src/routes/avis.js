const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const router = express.Router();
const db = require('../database');
const verifierToken = require('../middleware/auth');
const audit = require('../services/auditService');

const MAX_EPINGLES = 3;

function verifierAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ erreur: 'Accès réservé à l\'administrateur Werdhe' });
}

// Au plus 10 dépôts / modifications par heure et par IP.
const limiteurEcriture = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erreur: 'Trop de tentatives. Réessayez plus tard.' },
});

const schemaAvis = Joi.object({
  note:  Joi.number().integer().min(1).max(5).required(),
  texte: Joi.string().trim().min(10).max(1000).required(),
});

const schemaModeration = Joi.object({
  statut:  Joi.string().valid('en_attente', 'approuve', 'masque'),
  epingle: Joi.boolean(),
  reponse: Joi.string().trim().max(1000).allow('', null),
}).min(1);

// « Aïssatou B. » : prénom + initiale, jamais l'e-mail ni le nom complet.
function nomPublic(prenom, nom) {
  var p = (prenom || '').trim();
  var n = (nom || '').trim();
  if (p && n) return p + ' ' + n.charAt(0).toUpperCase() + '.';
  return p || n || 'Utilisateur Werdhe';
}

// ─── PUBLIC : note moyenne + avis approuvés (épinglés d'abord) ───
router.get('/public', async (req, res) => {
  try {
    var [liste, resume] = await Promise.all([
      db.query(
        `SELECT a.id, a.note, a.texte, a.epingle, a.reponse, a.reponse_at, a.created_at,
                u.prenom, u.nom, u.role
         FROM avis_werdhe a
         JOIN users u ON u.id = a.user_id
         WHERE a.statut = 'approuve'
         ORDER BY a.epingle DESC, a.created_at DESC
         LIMIT 50`
      ),
      db.query(`SELECT COUNT(*) AS total, ROUND(AVG(note)::numeric, 1) AS moyenne FROM avis_werdhe WHERE statut = 'approuve'`),
    ]);
    res.json({
      total:   Number(resume.rows[0].total),
      moyenne: resume.rows[0].moyenne === null ? null : Number(resume.rows[0].moyenne),
      avis: liste.rows.map(function(a) {
        return {
          id: a.id, note: a.note, texte: a.texte, epingle: a.epingle,
          reponse: a.reponse, reponse_at: a.reponse_at, created_at: a.created_at,
          auteur: nomPublic(a.prenom, a.nom),
          role: a.role === 'proprietaire' ? 'proprietaire' : a.role === 'locataire' ? 'locataire' : 'les_deux',
        };
      }),
    });
  } catch (err) {
    console.error('[GET /avis/public]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── MON AVIS (connecté) ─────────────────────────────────────────
router.get('/mon-avis', verifierToken, async (req, res) => {
  try {
    var r = await db.query(
      `SELECT id, note, texte, statut, reponse, created_at, updated_at FROM avis_werdhe WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ avis: r.rows[0] || null });
  } catch (err) {
    console.error('[GET /avis/mon-avis]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DÉPOSER / MODIFIER MON AVIS ─────────────────────────────────
// Un seul avis par compte. Toute création ou modification repasse « en attente ».
router.post('/', verifierToken, limiteurEcriture, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ erreur: 'Le compte administrateur ne dépose pas d\'avis.' });
    }
    var { error, value } = schemaAvis.validate(req.body);
    if (error) return res.status(400).json({ erreur: error.details[0].message });

    var r = await db.query(
      `INSERT INTO avis_werdhe (user_id, note, texte)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET note = EXCLUDED.note, texte = EXCLUDED.texte,
             statut = 'en_attente', epingle = FALSE, updated_at = NOW()
       RETURNING id, note, texte, statut, reponse, created_at, updated_at`,
      [req.user.id, value.note, value.texte]
    );
    res.status(201).json({ avis: r.rows[0] });
  } catch (err) {
    console.error('[POST /avis]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── RETIRER MON AVIS ────────────────────────────────────────────
router.delete('/mon-avis', verifierToken, async (req, res) => {
  try {
    await db.query(`DELETE FROM avis_werdhe WHERE user_id = $1`, [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /avis/mon-avis]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ═════════════ ADMIN ═════════════════════════════════════════════
router.get('/admin/liste', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var r = await db.query(
      `SELECT a.id, a.note, a.texte, a.statut, a.epingle, a.reponse, a.reponse_at, a.created_at, a.updated_at,
              u.prenom, u.nom, u.email, u.role
       FROM avis_werdhe a
       JOIN users u ON u.id = a.user_id
       ORDER BY (a.statut = 'en_attente') DESC, a.created_at DESC`
    );
    var compte = { en_attente: 0, approuve: 0, masque: 0 };
    r.rows.forEach(function(a) { compte[a.statut] = (compte[a.statut] || 0) + 1; });
    res.json({ avis: r.rows, compte: compte });
  } catch (err) {
    console.error('[GET /avis/admin/liste]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.patch('/admin/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { error, value } = schemaModeration.validate(req.body);
    if (error) return res.status(400).json({ erreur: error.details[0].message });

    var actuel = await db.query(`SELECT statut, epingle FROM avis_werdhe WHERE id = $1`, [req.params.id]);
    if (actuel.rows.length === 0) return res.status(404).json({ erreur: 'Avis introuvable' });
    var a = actuel.rows[0];

    var statutFinal  = value.statut !== undefined ? value.statut : a.statut;
    var epingleFinal = value.epingle !== undefined ? value.epingle : a.epingle;

    // On n'épingle qu'un avis publié ; masquer ou remettre en attente retire l'épingle.
    if (value.epingle === true && statutFinal !== 'approuve') {
      return res.status(409).json({ erreur: 'Approuvez l\'avis avant de l\'épingler.' });
    }
    if (statutFinal !== 'approuve') epingleFinal = false;
    if (epingleFinal && !a.epingle) {
      var n = await db.query(`SELECT COUNT(*) AS n FROM avis_werdhe WHERE epingle = TRUE AND id <> $1`, [req.params.id]);
      if (Number(n.rows[0].n) >= MAX_EPINGLES) {
        return res.status(409).json({ erreur: 'Maximum ' + MAX_EPINGLES + ' avis épinglés : désépinglez-en un d\'abord.' });
      }
    }

    var sets = ['statut = $1', 'epingle = $2', 'updated_at = NOW()'];
    var params = [statutFinal, epingleFinal];
    if (value.reponse !== undefined) {
      var rep = value.reponse ? value.reponse : null;
      params.push(rep);
      sets.push('reponse = $' + params.length);
      sets.push(rep ? 'reponse_at = NOW()' : 'reponse_at = NULL');
    }
    params.push(req.params.id);
    var r = await db.query(
      `UPDATE avis_werdhe SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, note, texte, statut, epingle, reponse, reponse_at`,
      params
    );
    await audit.log(req.user.id, 'avis_moderation', Object.assign({ avis_id: req.params.id }, value), req.ip);
    res.json({ avis: r.rows[0] });
  } catch (err) {
    console.error('[PATCH /avis/admin/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.delete('/admin/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var r = await db.query(`DELETE FROM avis_werdhe WHERE id = $1 RETURNING id`, [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ erreur: 'Avis introuvable' });
    await audit.log(req.user.id, 'avis_suppression', { avis_id: req.params.id }, req.ip);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /avis/admin/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
