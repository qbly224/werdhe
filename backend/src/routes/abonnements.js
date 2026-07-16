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

    // Générer la facture
var montants = { pro: 120000, agence: 300000 };
var montant  = montants[plan] || 0;
var debut    = new Date();
var fin      = new Date();
fin.setMonth(fin.getMonth() + 1);

await db.query(
  `INSERT INTO factures_abonnements
     (user_id, plan, montant, periode_debut, periode_fin, statut)
   VALUES ($1, $2, $3, $4, $5, 'emise')`,
  [req.user.id, plan, montant, debut, fin]
).catch(console.warn);

// Envoyer la facture par email
if (process.env.RESEND_API_KEY) {
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    var userInfo = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    var u = userInfo.rows[0];
    await resend.emails.send({
      from:    'Werdhe <no-reply@werdhe.com>',
      to:      u.email,
      subject: '🧾 Facture abonnement Werdhe — Plan ' + plan.charAt(0).toUpperCase() + plan.slice(1),
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <div style="background:#1B6B3A;padding:20px;border-radius:12px 12px 0 0">
            <h2 style="color:#fff;margin:0">🏠 Werdhe — Facture</h2>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
            <p>Bonjour <b>${u.prenom} ${u.nom}</b>,</p>
            <p>Merci pour votre abonnement au plan <b>${plan}</b>.</p>
            <div style="background:#F8F8F8;border-radius:10px;padding:16px;margin:16px 0">
              <table style="width:100%;font-size:13px">
                <tr><td style="color:#888">Plan</td><td style="text-align:right;font-weight:700">${plan.charAt(0).toUpperCase() + plan.slice(1)}</td></tr>
                <tr><td style="color:#888">Période</td><td style="text-align:right">${debut.toLocaleDateString('fr-FR')} → ${fin.toLocaleDateString('fr-FR')}</td></tr>
                <tr><td style="color:#888">Montant</td><td style="text-align:right;font-weight:700;color:#1B6B3A">${new Intl.NumberFormat('fr-FR').format(montant)} GNF</td></tr>
              </table>
            </div>
            <p style="color:#888;font-size:12px">Werdhe · Plateforme immobilière Guinée</p>
          </div>
        </div>
      `
    });
  } catch (e) {
    console.warn('[Facture] Email non envoyé:', e.message);
  }
}

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

// Vérifier un code promo
router.post('/verifier-promo', verifierToken, async (req, res) => {
  try {
    var { code, plan } = req.body;
    if (!code) return res.status(400).json({ erreur: 'Code requis' });

    var result = await db.query(
      `SELECT * FROM codes_promo
       WHERE UPPER(code) = UPPER($1)
         AND actif = TRUE
         AND nb_utilisations < nb_utilisations_max
         AND (expire_at IS NULL OR expire_at > NOW())`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Code invalide ou expiré' });
    }

    var promo = result.rows[0];
    var montants = { pro: 120000, agence: 300000 };
    var montantBase    = montants[plan] || montants['pro'];
    var montantReduit  = Math.round(montantBase * (1 - promo.reduction_pct / 100));

    res.json({
      valide:         true,
      code:           promo.code,
      reduction_pct:  promo.reduction_pct,
      montant_base:   montantBase,
      montant_reduit: montantReduit,
      economie:       montantBase - montantReduit,
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Appliquer un code promo lors de la souscription
router.post('/souscrire-avec-promo', verifierToken, async (req, res) => {
  try {
    var { plan, code_promo } = req.body;
    if (!['pro', 'agence'].includes(plan)) {
      return res.status(400).json({ erreur: 'Plan invalide' });
    }

    var montants = { pro: 120000, agence: 300000 };
    var montant  = montants[plan];
    var promoUsed = null;

    if (code_promo) {
      var promo = await db.query(
        `SELECT * FROM codes_promo
         WHERE UPPER(code) = UPPER($1) AND actif = TRUE
           AND nb_utilisations < nb_utilisations_max
           AND (expire_at IS NULL OR expire_at > NOW())`,
        [code_promo]
      );
      if (promo.rows.length > 0) {
        var p = promo.rows[0];
        montant = Math.round(montant * (1 - p.reduction_pct / 100));
        promoUsed = p;
        await db.query(
          'UPDATE codes_promo SET nb_utilisations = nb_utilisations + 1 WHERE id = $1',
          [p.id]
        );
      }
    }

    var dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + 1);

    await db.query(
      `UPDATE abonnements SET plan = $1, statut = 'actif', date_fin = $2
       WHERE user_id = $3`,
      [plan, dateFin, req.user.id]
    );

    await db.query('UPDATE users SET plan = $1 WHERE id = $2', [plan, req.user.id]);

    res.json({
      message:   'Abonnement ' + plan + ' activé !',
      plan:      plan,
      montant:   montant,
      promo:     promoUsed ? promoUsed.code + ' (-' + promoUsed.reduction_pct + '%)' : null,
      date_fin:  dateFin.toLocaleDateString('fr-FR')
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;