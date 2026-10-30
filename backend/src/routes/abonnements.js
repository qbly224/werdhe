const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');
const resoudreProprietaireEffectif = require('../middleware/equipe');
const { getPlan, FONCTIONNALITES } = require('../middleware/verifierPlan');
const djomyService = require('../services/djomyService');
const { remettreEnLigneBiens, activerAbonnementPaye, marquerFactureEchouee } = require('../services/abonnementService');

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

function genererReference() {
  return 'WRD-ABO-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ─── MON ABONNEMENT ACTUEL ───────────────────────────────────────
router.get('/mon-plan', verifierToken, resoudreProprietaireEffectif, async (req, res) => {
  try {
    var proprietaireId = req.proprietaireEffectifId;
    var plan   = await getPlan(proprietaireId);
    var droits = FONCTIONNALITES[plan] || FONCTIONNALITES.gratuit;

    var nbBiens = await db.query(
      'SELECT COUNT(*) FROM logements WHERE proprietaire_id = $1',
      [proprietaireId]
    );

    var abonnement = await db.query(
      `SELECT * FROM abonnements WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [proprietaireId]
    );

    var abo = abonnement.rows[0] || null;
    var joursRestants = null;
    if (abo && abo.date_fin) {
      joursRestants = Math.ceil((new Date(abo.date_fin) - new Date()) / (1000 * 60 * 60 * 24));
    }

    var biensMasques = await db.query(
      'SELECT COUNT(*) FROM logements WHERE proprietaire_id = $1 AND masque_limite_plan = TRUE',
      [proprietaireId]
    );

    res.json({
      plan:            plan,
      droits:          droits,
      nb_biens:        parseInt(nbBiens.rows[0].count),
      biens_masques:   parseInt(biensMasques.rows[0].count),
      abonnement:      abo,
      jours_restants:  joursRestants,
      prix:            PRIX_MENSUEL,
      cycles:          CYCLES,
      est_membre_equipe: proprietaireId !== req.user.id,
    });
  } catch (err) {
    console.error('[GET /mon-plan]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── HISTORIQUE DES FACTURES ──────────────────────────────────────
router.get('/factures', verifierToken, resoudreProprietaireEffectif, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT id, plan, montant, cycle, periode_debut, periode_fin, statut,
              operateur, reference_externe, created_at
       FROM factures_abonnements
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.proprietaireEffectifId]
    );
    res.json({ factures: result.rows });
  } catch (err) {
    console.error('[GET /factures]', err.message);
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
           rappel_j3_envoye = FALSE, rappel_j5_envoye = FALSE,
           rappel_j7_avant_envoye = FALSE, rappel_j3_avant_envoye = FALSE, rappel_j1_avant_envoye = FALSE
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
    await remettreEnLigneBiens(req.user.id, plan);

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

// ─── SOUSCRIRE / RENOUVELER UN ABONNEMENT (paiement Djomy) ───────
router.post('/souscrire', verifierToken, async (req, res) => {
  try {
    var { plan, cycle, telephone, code_promo } = req.body;
    if (!['pro', 'agence'].includes(plan)) {
      return res.status(400).json({ erreur: 'Plan invalide' });
    }
    if (!telephone) {
      return res.status(400).json({ erreur: 'Numéro de téléphone requis' });
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
         (user_id, plan, montant, periode_debut, periode_fin, statut, cycle, telephone)
       VALUES ($1, $2, $3, $4, $5, 'en_attente', $6, $7)
       RETURNING *`,
      [req.user.id, plan, montant, debut, fin, cycleChoisi, telephone]
    );

    var frontendUrl = process.env.FRONTEND_URL || 'https://werdhe.com';
    var returnUrl = frontendUrl + '/dashboard?paiement_abonnement=' + facture.rows[0].id;

    var gateway;
    try {
      gateway = await djomyService.initierPaiementGateway({
        montant: montant,
        telephone: telephone,
        description: 'Abonnement Werdhe - ' + plan,
        reference: reference,
        returnUrl: returnUrl,
        metadata: { facture_id: facture.rows[0].id, type: 'abonnement' }
      });
    } catch (erreurDjomy) {
      await db.query('DELETE FROM factures_abonnements WHERE id = $1', [facture.rows[0].id]);
      throw erreurDjomy;
    }

    await db.query('UPDATE factures_abonnements SET reference_externe = $1 WHERE id = $2', [gateway.transactionId, facture.rows[0].id]);

    res.json({
      success:      true,
      facture_id:   facture.rows[0].id,
      montant:      montant,
      redirectUrl:  gateway.redirectUrl,
      transactionId: gateway.transactionId
    });
  } catch (err) {
    console.error('[Abonnement souscrire]', err.message);
    res.status(err.validation ? 400 : 500).json({ erreur: err.validation ? err.message : 'Erreur lors de l\'initiation du paiement' });
  }
});

// ─── VÉRIFIER LE STATUT D'UNE FACTURE (appelé par le front après retour) ─
router.get('/djomy/statut/:facture_id', verifierToken, async (req, res) => {
  try {
    var { facture_id } = req.params;
    var result = await db.query(
      `SELECT * FROM factures_abonnements WHERE id = $1 AND user_id = $2`,
      [facture_id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Facture non trouvée' });
    }

    var f = result.rows[0];
    if (f.statut !== 'en_attente' || !f.reference_externe) {
      return res.json({ statut: f.statut, facture: f });
    }

    var statutDjomy = await djomyService.recupererStatutPaiement(f.reference_externe);

    if (statutDjomy.status === 'SUCCESS') {
      var activee = await activerAbonnementPaye(facture_id);
      if (activee) f = activee;
    } else if (statutDjomy.status === 'FAILED' || statutDjomy.status === 'CANCELLED') {
      await marquerFactureEchouee(facture_id);
      f.statut = 'echec';
    }

    res.json({ statut: f.statut, facture: f });
  } catch (err) {
    console.error('[Abonnement statut Djomy]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
