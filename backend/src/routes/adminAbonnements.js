const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');
const adminAbonnements = require('../services/adminAbonnementService');

// Le rôle est relu en base : un JWT d'admin encore valide ne suffit pas si le
// compte a perdu son rôle ou a été suspendu depuis son émission.
async function exigerAdmin(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
    }
    var r = await db.query('SELECT role, suspendu FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0 || r.rows[0].role !== 'admin' || r.rows[0].suspendu === true) {
      return res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
    }
    next();
  } catch (err) {
    console.error('[Admin abonnements] vérification admin:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
}

function gerer(action) {
  return async function(req, res) {
    try {
      await action(req, res);
    } catch (err) {
      if (err.statutHttp) return res.status(err.statutHttp).json({ erreur: err.message });
      console.error('[Admin abonnements]', req.method, req.originalUrl, err.message);
      res.status(500).json({ erreur: 'Erreur serveur' });
    }
  };
}

var garde = [verifierToken, exigerAdmin];

router.get('/proprietaires/:id/abonnement', garde, gerer(async function(req, res) {
  res.json(await adminAbonnements.detail(req.params.id));
}));

router.patch('/proprietaires/:id/plan', garde, gerer(async function(req, res) {
  res.json(await adminAbonnements.changerPlan({
    adminId: req.user.id, userId: req.params.id, plan: req.body.plan, motif: req.body.motif,
  }));
}));

router.post('/proprietaires/:id/offrir', garde, gerer(async function(req, res) {
  res.json(await adminAbonnements.offrir({
    adminId: req.user.id, userId: req.params.id,
    plan: req.body.plan, duree: req.body.duree, motif: req.body.motif,
    message_proprietaire: req.body.message_proprietaire,
  }));
}));

router.post('/proprietaires/:id/revoquer', garde, gerer(async function(req, res) {
  res.json(await adminAbonnements.revoquer({
    adminId: req.user.id, userId: req.params.id,
    motif: req.body.motif, message_proprietaire: req.body.message_proprietaire,
  }));
}));

router.post('/proprietaires/:id/paiement-manuel', garde, gerer(async function(req, res) {
  res.json(await adminAbonnements.paiementManuel({
    adminId: req.user.id, userId: req.params.id,
    plan: req.body.plan, duree: req.body.duree, montant: req.body.montant,
    moyen: req.body.moyen, reference: req.body.reference,
  }));
}));

module.exports = router;
