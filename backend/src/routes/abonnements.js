const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');
const { getPlan, FONCTIONNALITES } = require('../middleware/verifierPlan');

// Prix de base (GNF / mois) et cycles de facturation disponibles
var PRIX_MENSUEL = { pro: 120000, agence: 300000 };
var CYCLES = {
  mensuel:    { mois: 1,  reduction: 0    },
  semestriel: { mois: 6,  reduction: 0.10 },
  annuel:     { mois: 12, reduction: 0.20 },
};

function calculerMontant(plan, cycle) {
  var infosCycle = CYCLES[cycle] || CYCLES.mensuel;
  return Math.round(PRIX_MENSUEL[plan] * infosCycle.mois * (1 - infosCycle.reduction));
}

function validerTelephone(tel) {
  var propre = String(tel || '').replace(/\s+/g, '').replace(/^(\+224|00224)/, '');
  if (!/^\d{9}$/.test(propre)) return null;
  return '224' + propre;
}

function genererReference() {
  return 'WRD-AB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

async function envoyerFactureParEmail(userId, plan, montant, cycle, debut, fin) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    var userInfo = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    var u = userInfo.rows[0];
    if (!u) return;
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
                <tr><td style="color:#888">Cycle</td><td style="text-align:right">${cycle}</td></tr>
                <tr><td style="color:#888">Période</td><td style="text-align:right">${new Date(debut).toLocaleDateString('fr-FR')} → ${new Date(fin).toLocaleDateString('fr-FR')}</td></tr>
                <tr><td style="color:#888">Montant</td><td style="text-align:right;font-weight:700;color:#1B6B3A">${new Intl.NumberFormat('fr-FR').format(montant)} GNF</td></tr>
              </table>
            </div>
            <p style="color:#888;font-size:12px">Werdhe · Plateforme immobilière Guinée</p>
          </div>
        </div>
      `
    });
  } catch (e) {
    console.warn('[Facture abonnement] Email non envoyé:', e.message);
  }
}

// ─── MON ABONNEMENT ACTUEL ───────────────────────────────────────
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

    var abo = abonnement.rows[0] || null;
    var joursRestants = null;
    if (abo && abo.date_fin) {
      joursRestants = Math.ceil((new Date(abo.date_fin) - new Date()) / (1000 * 60 * 60 * 24));
    }

    res.json({
      plan:            plan,
      droits:          droits,
      nb_biens:        parseInt(nbBiens.rows[0].count),
      abonnement:      abo,
      jours_restants:  joursRestants,
      prix:            PRIX_MENSUEL,
      cycles:          CYCLES,
    });
  } catch (err) {
    console.error('[GET /mon-plan]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DÉMARRER L'ESSAI GRATUIT 1 MOIS (Pro ou Agence) ─────────────
router.post('/essai', verifierToken, async (req, res) => {
  try {
    var { plan } = req.body;
    if (!['pro', 'agence'].includes(plan)) {
      return res.status(400).json({ erreur: 'Plan invalide' });
    }

    var user = await db.query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
    var planActuel = user.rows[0] ? user.rows[0].plan : 'gratuit';
    if (planActuel !== 'gratuit') {
      return res.status(400).json({ erreur: 'Vous avez déjà un abonnement actif' });
    }

    var essaiExistant = await db.query(
      `SELECT id FROM abonnements WHERE user_id = $1 AND essai_termine = TRUE`,
      [req.user.id]
    );
    if (essaiExistant.rows.length > 0) {
      return res.status(400).json({ erreur: 'Vous avez déjà utilisé votre essai gratuit' });
    }

    var dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + 30);

    var maj = await db.query(
      `UPDATE abonnements
       SET plan = $1, statut = 'essai', date_fin = $2, essai_termine = TRUE,
           rappel_j3_envoye = FALSE, rappel_j5_envoye = FALSE
       WHERE user_id = $3`,
      [plan, dateFin, req.user.id]
    );

    if (maj.rowCount === 0) {
      await db.query(
        `INSERT INTO abonnements (user_id, plan, statut, date_fin, essai_termine)
         VALUES ($1, $2, 'essai', $3, TRUE)`,
        [req.user.id, plan, dateFin]
      );
    }

    await db.query('UPDATE users SET plan = $1, abonnement_bloque = FALSE WHERE id = $2', [plan, req.user.id]);

    res.json({
      message:  'Essai ' + plan + ' démarré ! 30 jours gratuits.',
      plan:     plan,
      date_fin: dateFin.toLocaleDateString('fr-FR')
    });
  } catch (err) {
    console.error('[POST /essai]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── VALIDER UN CODE PROMO (public, lecture seule) ───────────────
router.get('/valider-code', async (req, res) => {
  try {
    var code = req.query.code;
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
    res.json({
      valide:        true,
      reduction_pct: promo.reduction_pct,
      plan_cible:    promo.plan_cible || 'Pro & Agence',
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── INITIER LE PAIEMENT DE L'ABONNEMENT (Mobile Money) ──────────
async function initierPaiement(req, res, operateur) {
  try {
    var { plan, cycle, telephone, code_promo } = req.body;
    if (!['pro', 'agence'].includes(plan)) {
      return res.status(400).json({ erreur: 'Plan invalide' });
    }

    var telFormate = validerTelephone(telephone);
    if (!telFormate) {
      return res.status(400).json({ erreur: 'Numéro de téléphone invalide. Format: 6XX XXX XXX' });
    }

    var cycleChoisi = CYCLES[cycle] ? cycle : 'mensuel';
    var montant = calculerMontant(plan, cycleChoisi);

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
        await db.query('UPDATE codes_promo SET nb_utilisations = nb_utilisations + 1 WHERE id = $1', [p.id]).catch(console.warn);
      }
    }

    var reference = genererReference();
    var debut = new Date();
    var fin   = new Date();
    fin.setMonth(fin.getMonth() + CYCLES[cycleChoisi].mois);

    var facture = await db.query(
      `INSERT INTO factures_abonnements
         (user_id, plan, montant, periode_debut, periode_fin, statut, cycle, reference_externe, operateur, telephone)
       VALUES ($1, $2, $3, $4, $5, 'en_attente', $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, plan, montant, debut, fin, cycleChoisi, reference, operateur, telFormate]
    );

    res.json({
      success:     true,
      reference:   reference,
      facture_id:  facture.rows[0].id,
      montant:     montant,
      simulation:  true,
      message:     'Simulation : demande envoyée au ' + telephone,
      instructions: operateur === 'orange'
        ? [
            'Composez *144*1*4# sur votre téléphone Orange',
            'Entrez votre code PIN Orange Money',
            'Confirmez le paiement de ' + new Intl.NumberFormat('fr-FR').format(montant) + ' GNF',
            'Attendez la confirmation SMS'
          ]
        : [
            'Composez *156# sur votre téléphone MTN',
            'Choisissez "Payer un marchand"',
            'Entrez le code marchand Werdhe : WRD001',
            'Entrez le montant : ' + new Intl.NumberFormat('fr-FR').format(montant) + ' GNF',
            'Confirmez avec votre PIN MoMo'
          ]
    });
  } catch (err) {
    console.error('[Abonnement initier]', err.message);
    res.status(500).json({ erreur: 'Erreur lors de l\'initiation du paiement' });
  }
}

router.post('/orange-money/initier', verifierToken, function(req, res) { initierPaiement(req, res, 'orange'); });
router.post('/mtn-momo/initier',     verifierToken, function(req, res) { initierPaiement(req, res, 'mtn'); });
router.post('/souscrire', verifierToken, function(req, res) {
  var operateur = req.body.operateur || 'orange';
  initierPaiement(req, res, operateur);
});
// ─── ROUTE UNIFIÉE (appelée par la page Pricing) ─────────────────
router.post('/souscrire', verifierToken, function(req, res) {
  var operateur = req.body.operateur || 'orange';
  initierPaiement(req, res, operateur);
});
// ─── CONFIRMER LE PAIEMENT (simulation) ──────────────────────────
router.patch('/confirmer/:facture_id', verifierToken, async (req, res) => {
  try {
    var { facture_id } = req.params;

    var result = await db.query(
      `UPDATE factures_abonnements
       SET statut = 'payee'
       WHERE id = $1 AND user_id = $2 AND statut = 'en_attente'
       RETURNING *`,
      [facture_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Facture non trouvée' });
    }

    var f = result.rows[0];

    var maj = await db.query(
      `UPDATE abonnements
       SET plan = $1, statut = 'actif', date_fin = $2, cycle = $3,
           essai_termine = TRUE, rappel_j3_envoye = FALSE, rappel_j5_envoye = FALSE
       WHERE user_id = $4`,
      [f.plan, f.periode_fin, f.cycle, req.user.id]
    );

    if (maj.rowCount === 0) {
      await db.query(
        `INSERT INTO abonnements (user_id, plan, statut, date_fin, cycle, essai_termine)
         VALUES ($1, $2, 'actif', $3, $4, TRUE)`,
        [req.user.id, f.plan, f.periode_fin, f.cycle]
      );
    }

    await db.query('UPDATE users SET plan = $1, abonnement_bloque = FALSE WHERE id = $2', [f.plan, req.user.id]);

    envoyerFactureParEmail(req.user.id, f.plan, f.montant, f.cycle, f.periode_debut, f.periode_fin).catch(console.warn);

    res.json({
      success:  true,
      message:  'Paiement confirmé ! Abonnement ' + f.plan + ' activé.',
      plan:     f.plan,
      date_fin: new Date(f.periode_fin).toLocaleDateString('fr-FR')
    });
  } catch (err) {
    console.error('[Abonnement confirmer]', err.message);
    res.status(500).json({ erreur: 'Erreur confirmation paiement' });
  }
});
// ─── WEBHOOK SIMULATION (confirme après 30s en dev) ──────────────
router.post('/webhook/confirmer', async (req, res) => {
  try {
    var { reference, statut } = req.body;
    if (!reference) return res.status(400).json({ erreur: 'Référence manquante' });

    var facture = await db.query(
      `SELECT * FROM factures_abonnements WHERE reference_externe = $1`,
      [reference]
    );
    if (facture.rows.length === 0) {
      return res.status(404).json({ erreur: 'Facture non trouvée' });
    }
    var f = facture.rows[0];

    if (statut === 'succes') {
      await db.query(
        `UPDATE factures_abonnements SET statut = 'payee' WHERE reference_externe = $1`,
        [reference]
      );
      var maj = await db.query(
        `UPDATE abonnements SET plan = $1, statut = 'actif', date_fin = $2, cycle = $3,
         essai_termine = TRUE WHERE user_id = $4`,
        [f.plan, f.periode_fin, f.cycle, f.user_id]
      );
      if (maj.rowCount === 0) {
        await db.query(
          `INSERT INTO abonnements (user_id, plan, statut, date_fin, cycle, essai_termine)
           VALUES ($1, $2, 'actif', $3, $4, TRUE)`,
          [f.user_id, f.plan, f.periode_fin, f.cycle]
        );
      }
      await db.query(
        'UPDATE users SET plan = $1, abonnement_bloque = FALSE WHERE id = $2',
        [f.plan, f.user_id]
      );
      envoyerFactureParEmail(f.user_id, f.plan, f.montant, f.cycle, f.periode_debut, f.periode_fin).catch(console.warn);
    } else {
      await db.query(
        `UPDATE factures_abonnements SET statut = 'echec' WHERE reference_externe = $1`,
        [reference]
      );
    }
    res.json({ recu: true });
  } catch (err) {
    console.error('[Webhook]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});
module.exports = router;
