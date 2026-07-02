const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');
const { getPlan, FONCTIONNALITES } = require('../middleware/verifierPlan');

// Mon abonnement actuel
router.get('/mon-plan', verifierToken, async (req, res) => {
  try {
    var plan   = await getPlan(req.user.id);
    var droits = FONCTIONNALITES[plan] || FONCTIONNALITES.gratuit;

    var nbBiens = await db.query(
      'SELECT COUNT(*) FROM logements WHERE proprietaire_id = $1',
      [req.user.id]
    );

    var abonnement = await db.query(
      `SELECT * FROM abonnements WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    res.json({
      plan:         plan,
      droits:       droits,
      nb_biens:     parseInt(nbBiens.rows[0].count),
      abonnement:   abonnement.rows[0] || null,
    });
  } catch (err) {
    console.error('[GET /mon-plan]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Démarrer l'essai Pro 14 jours
router.post('/essai-pro', verifierToken, async (req, res) => {
  try {
    var user = await db.query(
      'SELECT plan FROM users WHERE id = $1', [req.user.id]
    );

    var planActuel = user.rows[0] ? user.rows[0].plan : 'gratuit';
    if (planActuel !== 'gratuit') {
      return res.status(400).json({ erreur: 'Essai déjà utilisé ou plan déjà actif' });
    }

    // Vérifier que l'essai n'a pas déjà été utilisé
    var essaiExistant = await db.query(
      `SELECT id FROM abonnements WHERE user_id = $1 AND essai_termine = TRUE`,
      [req.user.id]
    );
    if (essaiExistant.rows.length > 0) {
      return res.status(400).json({ erreur: 'Vous avez déjà utilisé votre essai gratuit' });
    }

    var dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + 14);

    await db.query(
      `UPDATE abonnements SET plan = 'pro', statut = 'essai',
         date_fin = $1 WHERE user_id = $2`,
      [dateFin, req.user.id]
    );

    await db.query(
      `UPDATE users SET plan = 'pro' WHERE id = $1`,
      [req.user.id]
    );

    res.json({
      message: 'Essai Pro démarré ! 14 jours gratuits.',
      date_fin: dateFin.toLocaleDateString('fr-FR')
    });
  } catch (err) {
    console.error('[POST /essai-pro]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Souscrire à un plan (simulation paiement)
router.post('/souscrire', verifierToken, async (req, res) => {
  try {
    var { plan } = req.body;
    if (!['pro', 'agence'].includes(plan)) {
      return res.status(400).json({ erreur: 'Plan invalide' });
    }

    var dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);

    await db.query(
      `INSERT INTO abonnements (user_id, plan, statut, date_fin)
       VALUES ($1, $2, 'actif', $3)
       ON CONFLICT (user_id) DO UPDATE
         SET plan = $2, statut = 'actif', date_fin = $3`,
      [req.user.id, plan, dateFin]
    ).catch(function() {
      // Si pas de contrainte unique, faire un UPDATE simple
      return db.query(
        `UPDATE abonnements SET plan = $1, statut = 'actif', date_fin = $2
         WHERE user_id = $3`,
        [plan, dateFin, req.user.id]
      );
    });

    await db.query(
      `UPDATE users SET plan = $1 WHERE id = $2`,
      [plan, req.user.id]
    );

    res.json({
      message: 'Abonnement ' + plan + ' activé !',
      plan: plan,
      date_fin: dateFin.toLocaleDateString('fr-FR')
    });
  } catch (err) {
    console.error('[POST /souscrire]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;