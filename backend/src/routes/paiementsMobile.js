const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const router = express.Router();
const db = require('../database');
const verifierToken = require('../middleware/auth');
const resoudreProprietaireEffectif = require('../middleware/equipe');
const { uploadCapturePaiement, uploaderCapturePaiement } = require('../services/cloudinaryService');
const cfg = require('../config/paiementMobile');
const svc = require('../services/paiementMobileService');

// ═══════════════════════════════════════════════════════════════════
// PAIEMENT MOBILE DÉCLARÉ (Orange Money / MTN Mobile Money)
// Le paiement mobile automatique n'est pas encore intégré. Le locataire déclare un paiement
// fait hors de Werdhe ; le propriétaire le confirme ou le conteste. Tous les droits sont
// vérifiés ici (côté serveur), jamais seulement dans l'interface.
// ═══════════════════════════════════════════════════════════════════

var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var MAX_DECLARATIONS_EN_ATTENTE = 5;

var limiteurDeclaration = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { erreur: 'Trop de tentatives. Réessayez plus tard.' },
});

// ─── Contrôles d'accès ───────────────────────────────────────────
// Propriétaire (ou membre actif d'une équipe agence : proprietaireEffectifId = le compte agence).
function exigerProprietaire(req, res, next) {
  var r = req.user && req.user.role;
  var estMembre = req.proprietaireEffectifId && req.proprietaireEffectifId !== req.user.id;
  if (r === 'proprietaire' || r === 'les_deux' || estMembre) return next();
  return res.status(403).json({ erreur: 'Réservé aux propriétaires.' });
}
function exigerLocataire(req, res, next) {
  var r = req.user && req.user.role;
  if (r === 'locataire' || r === 'les_deux') return next();
  return res.status(403).json({ erreur: 'Réservé aux locataires.' });
}

function opLabel(op) { return (cfg.OPERATEURS[op] || {}).label || op; }

// Paramètres du propriétaire (valeurs par défaut si jamais enregistrés).
async function parametresDe(proprietaireId) {
  var r = await db.query(
    `SELECT orange_money_actif, orange_money_numero, mtn_momo_actif, mtn_momo_numero
       FROM parametres_paiement_proprietaire WHERE proprietaire_id = $1`, [proprietaireId]);
  return r.rows[0] || { orange_money_actif: false, orange_money_numero: null, mtn_momo_actif: false, mtn_momo_numero: null };
}
function operateursActifs(p) {
  var l = [];
  if (p.orange_money_actif && p.orange_money_numero) l.push({ operateur: 'orange_money', label: opLabel('orange_money'), numero: p.orange_money_numero });
  if (p.mtn_momo_actif && p.mtn_momo_numero) l.push({ operateur: 'mtn_momo', label: opLabel('mtn_momo'), numero: p.mtn_momo_numero });
  return l;
}

function erreurBase(res, err, contexte) {
  // 23505 : doublon ; 23514 : règle de la base (garde-fou) ; le reste : erreur serveur.
  if (err.code === '23505') return res.status(409).json({ erreur: 'Ce code de transaction a déjà été déclaré pour ce bail.', code: 'doublon_code' });
  if (err.code === '23514') return res.status(409).json({ erreur: err.message });
  console.error('[paiements/mobile ' + contexte + ']', err.message);
  return res.status(500).json({ erreur: 'Erreur serveur' });
}

// ═════════════ PROPRIÉTAIRE : opérateurs acceptés ═══════════════════
router.get('/parametres', verifierToken, resoudreProprietaireEffectif, exigerProprietaire, async (req, res) => {
  try {
    var p = await parametresDe(req.proprietaireEffectifId);
    res.json({ parametres: p, direct_actif: cfg.PAIEMENT_MOBILE_DIRECT_ACTIF });
  } catch (err) { erreurBase(res, err, 'GET parametres'); }
});

var schemaParametres = Joi.object({
  orange_money_actif: Joi.boolean().required(),
  orange_money_numero: Joi.string().max(30).allow('', null),
  mtn_momo_actif: Joi.boolean().required(),
  mtn_momo_numero: Joi.string().max(30).allow('', null),
});

router.put('/parametres', verifierToken, resoudreProprietaireEffectif, exigerProprietaire, async (req, res) => {
  try {
    var { error, value } = schemaParametres.validate(req.body);
    if (error) return res.status(400).json({ erreur: error.details[0].message });
    var actuel = await parametresDe(req.proprietaireEffectifId);

    var maj = {};
    var ops = [['orange_money', 'Orange Money'], ['mtn_momo', 'MTN Mobile Money']];
    for (var i = 0; i < ops.length; i++) {
      var cle = ops[i][0], nom = ops[i][1];
      var actif = value[cle + '_actif'];
      var numero = cfg.normaliserNumero(value[cle + '_numero']);
      if (actif && !numero) {
        return res.status(400).json({
          erreur: 'Numéro de réception ' + nom + ' invalide : 9 chiffres commençant par 6.',
          champ: cle + '_numero',
        });
      }
      maj[cle + '_actif'] = actif;
      // Opérateur désactivé : on garde le dernier numéro valide, pour le retrouver si on le réactive.
      maj[cle + '_numero'] = numero || actuel[cle + '_numero'] || null;
    }

    await db.query(
      `INSERT INTO parametres_paiement_proprietaire
         (proprietaire_id, orange_money_actif, orange_money_numero, mtn_momo_actif, mtn_momo_numero, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (proprietaire_id) DO UPDATE SET
         orange_money_actif = EXCLUDED.orange_money_actif, orange_money_numero = EXCLUDED.orange_money_numero,
         mtn_momo_actif = EXCLUDED.mtn_momo_actif, mtn_momo_numero = EXCLUDED.mtn_momo_numero, updated_at = NOW()`,
      [req.proprietaireEffectifId, maj.orange_money_actif, maj.orange_money_numero, maj.mtn_momo_actif, maj.mtn_momo_numero]
    );
    res.json({ parametres: await parametresDe(req.proprietaireEffectifId) });
  } catch (err) { erreurBase(res, err, 'PUT parametres'); }
});

// ═════════════ LOCATAIRE : écran « Payer mon loyer » ════════════════
router.get('/ecran/:reservationId', verifierToken, exigerLocataire, async (req, res) => {
  try {
    if (!UUID.test(req.params.reservationId)) return res.status(400).json({ erreur: 'Identifiant invalide' });
    var ctx = await svc.contexteBail(req.params.reservationId);
    // 404 (et non 403) pour ne rien révéler d'un bail qui n'est pas le sien.
    if (!ctx || ctx.locataire_id !== req.user.id) return res.status(404).json({ erreur: 'Bail introuvable' });
    if (ctx.statut !== 'confirmee') return res.status(409).json({ erreur: 'Ce bail n\'est pas actif.' });

    var [params, mois, decl, attente] = await Promise.all([
      parametresDe(ctx.proprietaire_id),
      svc.premierMoisAPayer(ctx.id),
      db.query(
        `SELECT id, statut, montant, operateur, nb_mois, to_char(periode_debut, 'YYYY-MM-DD') AS periode_debut, declare_le
           FROM paiements WHERE reservation_id = $1 AND mode_paiement = 'mobile_money_declare'
          ORDER BY declare_le DESC LIMIT 5`, [ctx.id]),
      db.query(`SELECT operateur FROM paiement_mobile_attente WHERE user_id = $1`, [req.user.id]),
    ]);

    res.json({
      reservation_id: ctx.id,
      bien: ctx.logement_titre,
      proprietaire: { prenom: ctx.prop_prenom, nom: ctx.prop_nom },
      loyer: Number(ctx.montant_total),
      periode: mois ? { debut: mois.debut, libelle: svc.libellePeriode(mois.debut, 1) } : null,
      echeance: mois ? mois.debut : null, // le loyer est payable le 1er du mois
      tout_paye: !mois,
      operateurs: operateursActifs(params),
      direct_actif: cfg.PAIEMENT_MOBILE_DIRECT_ACTIF,
      attente: attente.rows.map(function(a) { return a.operateur; }),
      declarations: decl.rows.map(function(d) {
        return Object.assign({}, d, { montant: Number(d.montant), operateur_label: opLabel(d.operateur), periode_libelle: svc.libellePeriode(d.periode_debut, d.nb_mois) });
      }),
    });
  } catch (err) { erreurBase(res, err, 'GET ecran'); }
});

// « Me prévenir quand c'est disponible »
router.post('/attente', verifierToken, exigerLocataire, async (req, res) => {
  try {
    var { error, value } = Joi.object({ operateur: Joi.string().valid('orange_money', 'mtn_momo').required() }).validate(req.body);
    if (error) return res.status(400).json({ erreur: error.details[0].message });
    await db.query(
      `INSERT INTO paiement_mobile_attente (user_id, operateur) VALUES ($1, $2) ON CONFLICT (user_id, operateur) DO NOTHING`,
      [req.user.id, value.operateur]);
    res.status(201).json({ ok: true });
  } catch (err) { erreurBase(res, err, 'POST attente'); }
});

// ═════════════ LOCATAIRE : déclarer un paiement ═════════════════════
function lireMultipart(req, res, next) {
  uploadCapturePaiement.single('capture')(req, res, function(err) {
    if (err) return res.status(400).json({ erreur: err.message || 'Fichier invalide' });
    next();
  });
}

// Signature réelle du fichier (le type MIME envoyé par le navigateur ne suffit pas).
function typeImageReel(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf[0] === 0x89 && buf.slice(1, 4).toString() === 'PNG') return 'image/png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

var schemaDeclaration = Joi.object({
  reservation_id: Joi.string().pattern(UUID).required(),
  operateur: Joi.string().valid('orange_money', 'mtn_momo').required(),
  nb_mois: Joi.number().integer().min(1).max(cfg.NB_MOIS_MAX).required(),
  code_transaction: Joi.string().required(),
});

router.post('/declarer', verifierToken, exigerLocataire, limiteurDeclaration, lireMultipart, async (req, res) => {
  try {
    var { error, value } = schemaDeclaration.validate(req.body, { convert: true });
    if (error) return res.status(400).json({ erreur: 'Données invalides : ' + error.details[0].message });
    var code = cfg.normaliserCode(value.code_transaction);
    if (!code) return res.status(400).json({ erreur: 'Code de transaction invalide : 4 à 40 caractères (lettres, chiffres, point, tiret).', champ: 'code_transaction' });

    var ctx = await svc.contexteBail(value.reservation_id);
    if (!ctx || ctx.locataire_id !== req.user.id) return res.status(404).json({ erreur: 'Bail introuvable' });
    if (ctx.statut !== 'confirmee') return res.status(409).json({ erreur: 'Ce bail n\'est pas actif.' });

    var params = await parametresDe(ctx.proprietaire_id);
    var actifs = operateursActifs(params);
    if (!actifs.some(function(o) { return o.operateur === value.operateur; })) {
      return res.status(409).json({ erreur: 'Votre propriétaire n\'accepte pas ' + opLabel(value.operateur) + ' pour ce bien.', code: 'operateur_non_accepte' });
    }

    var existe = await db.query(
      `SELECT 1 FROM paiements WHERE reservation_id = $1 AND mode_paiement = 'mobile_money_declare' AND upper(btrim(code_transaction)) = upper($2)`,
      [ctx.id, code]);
    if (existe.rows.length > 0) return res.status(409).json({ erreur: 'Ce code de transaction a déjà été déclaré pour ce bail.', code: 'doublon_code' });

    var enAttente = await db.query(
      `SELECT COUNT(*) AS n FROM paiements WHERE reservation_id = $1 AND mode_paiement = 'mobile_money_declare' AND statut = 'declare'`, [ctx.id]);
    if (Number(enAttente.rows[0].n) >= MAX_DECLARATIONS_EN_ATTENTE) {
      return res.status(409).json({ erreur: 'Vous avez déjà ' + MAX_DECLARATIONS_EN_ATTENTE + ' déclarations en attente de confirmation pour ce bail.', code: 'trop_de_declarations' });
    }

    // Période : premier mois non couvert ; les mois suivants ne doivent pas l'être non plus.
    var debut = await svc.premierMoisAPayer(ctx.id);
    if (!debut) return res.status(409).json({ erreur: 'Aucun loyer à payer pour ce bail.' });
    var deja = debut.couverts;
    for (var i = 1; i < value.nb_mois; i++) {
      var an = debut.annee + Math.floor((debut.mois0 + i) / 12), m0 = (debut.mois0 + i) % 12;
      var cle = an + '-' + String(m0 + 1).padStart(2, '0');
      if (deja.declares.has(cle) || deja.confirmes.has(cle) || deja.anciens.has(cle)) {
        return res.status(409).json({ erreur: 'Un des mois demandés est déjà payé ou déclaré. Réduisez le nombre de mois.', code: 'mois_deja_couvert' });
      }
    }

    // Capture facultative : téléversée seulement maintenant que tout est valide.
    var captureUrl = null;
    if (req.file) {
      var type = typeImageReel(req.file.buffer);
      if (!type) return res.status(400).json({ erreur: 'La capture doit être une image JPG, PNG ou WEBP.', champ: 'capture' });
      try { captureUrl = await uploaderCapturePaiement(req.file.buffer, type); }
      catch (e) { console.error('[paiements/mobile] capture non téléversée:', e.message); return res.status(502).json({ erreur: 'La capture n\'a pas pu être envoyée. Réessayez ou envoyez sans capture.' }); }
    }

    var montant = Number(ctx.montant_total) * value.nb_mois;
    var ins = await db.query(
      `INSERT INTO paiements
         (reservation_id, locataire_id, proprietaire_id, montant, mode_paiement, statut,
          operateur, code_transaction, capture_url, nb_mois, periode_debut, date_paiement)
       VALUES ($1, $2, $3, $4, 'mobile_money_declare', 'declare', $5, $6, $7, $8, $9, NULL)
       RETURNING id, statut, montant, operateur, code_transaction, nb_mois, declare_le`,
      [ctx.id, ctx.locataire_id, ctx.proprietaire_id, montant, value.operateur, code, captureUrl, value.nb_mois, debut.debut]);
    var p = ins.rows[0];

    svc.notifierDeclaration(Object.assign({}, p, { periode_debut: debut.debut }), ctx).catch(console.warn);

    res.status(201).json({
      paiement: {
        id: p.id, statut: p.statut, montant: Number(p.montant), operateur: p.operateur, operateur_label: opLabel(p.operateur),
        nb_mois: p.nb_mois, periode_libelle: svc.libellePeriode(debut.debut, p.nb_mois), declare_le: p.declare_le,
      },
    });
  } catch (err) { erreurBase(res, err, 'POST declarer'); }
});

// ═════════════ PROPRIÉTAIRE : vérifier les déclarations ═════════════
router.get('/a-verifier', verifierToken, resoudreProprietaireEffectif, exigerProprietaire, async (req, res) => {
  try {
    var r = await db.query(
      `SELECT p.id, p.montant, p.operateur, p.code_transaction, p.capture_url, p.nb_mois,
              to_char(p.periode_debut, 'YYYY-MM-DD') AS periode_debut, p.declare_le,
              u.prenom AS locataire_prenom, u.nom AS locataire_nom, l.titre AS logement_titre
         FROM paiements p
         JOIN reservations r ON r.id = p.reservation_id
         JOIN logements l ON l.id = r.logement_id
         JOIN users u ON u.id = p.locataire_id
        WHERE p.proprietaire_id = $1 AND p.mode_paiement = 'mobile_money_declare' AND p.statut = 'declare'
        ORDER BY p.declare_le ASC`, [req.proprietaireEffectifId]);
    res.json({
      declarations: r.rows.map(function(d) {
        return Object.assign({}, d, { montant: Number(d.montant), operateur_label: opLabel(d.operateur), periode_libelle: svc.libellePeriode(d.periode_debut, d.nb_mois) });
      }),
      total: r.rows.length,
      delai_annulation_ms: cfg.DELAI_ANNULATION_MS,
    });
  } catch (err) { erreurBase(res, err, 'GET a-verifier'); }
});

// Charge une déclaration du propriétaire effectif (404 sinon : rien n'est révélé).
async function declarationDuProprietaire(req, res) {
  if (!UUID.test(req.params.id)) { res.status(400).json({ erreur: 'Identifiant invalide' }); return null; }
  var r = await db.query(
    `SELECT p.id, p.statut, p.quittance_envoyee_le, u.prenom AS locataire_prenom
       FROM paiements p JOIN users u ON u.id = p.locataire_id
      WHERE p.id = $1 AND p.proprietaire_id = $2 AND p.mode_paiement = 'mobile_money_declare'`,
    [req.params.id, req.proprietaireEffectifId]);
  if (r.rows.length === 0) { res.status(404).json({ erreur: 'Déclaration introuvable' }); return null; }
  return r.rows[0];
}

router.patch('/:id/confirmer', verifierToken, resoudreProprietaireEffectif, exigerProprietaire, async (req, res) => {
  try {
    var d = await declarationDuProprietaire(req, res); if (!d) return;
    var r = await db.query(
      `UPDATE paiements SET statut = 'confirme', date_paiement = NOW()
        WHERE id = $1 AND statut IN ('declare', 'conteste') RETURNING id, statut`, [d.id]);
    if (r.rows.length === 0) return res.status(409).json({ erreur: 'Cette déclaration n\'est plus en attente.' });
    svc.programmer(d.id, 'confirmer');
    res.json({ paiement: r.rows[0], locataire_prenom: d.locataire_prenom, delai_annulation_ms: cfg.DELAI_ANNULATION_MS });
  } catch (err) { erreurBase(res, err, 'PATCH confirmer'); }
});

router.patch('/:id/contester', verifierToken, resoudreProprietaireEffectif, exigerProprietaire, async (req, res) => {
  try {
    var d = await declarationDuProprietaire(req, res); if (!d) return;
    var r = await db.query(
      `UPDATE paiements SET statut = 'conteste' WHERE id = $1 AND statut = 'declare' RETURNING id, statut`, [d.id]);
    if (r.rows.length === 0) return res.status(409).json({ erreur: 'Cette déclaration n\'est plus en attente.' });
    svc.programmer(d.id, 'contester');
    res.json({ paiement: r.rows[0], locataire_prenom: d.locataire_prenom, delai_annulation_ms: cfg.DELAI_ANNULATION_MS });
  } catch (err) { erreurBase(res, err, 'PATCH contester'); }
});

// Annuler la dernière décision : retour à « declare ». Impossible une fois la quittance partie.
router.patch('/:id/annuler', verifierToken, resoudreProprietaireEffectif, exigerProprietaire, async (req, res) => {
  try {
    var d = await declarationDuProprietaire(req, res); if (!d) return;
    if (d.quittance_envoyee_le) {
      return res.status(409).json({ erreur: 'La quittance est déjà partie par e-mail : cette confirmation est définitive.', code: 'quittance_partie' });
    }
    svc.annulerProgrammation(d.id);
    var r = await db.query(
      `UPDATE paiements SET statut = 'declare', date_paiement = NULL
        WHERE id = $1 AND statut IN ('confirme', 'conteste') AND quittance_envoyee_le IS NULL RETURNING id, statut`, [d.id]);
    if (r.rows.length === 0) {
      return res.status(409).json({ erreur: 'Cette décision ne peut plus être annulée.', code: 'annulation_impossible' });
    }
    res.json({ paiement: r.rows[0] });
  } catch (err) { erreurBase(res, err, 'PATCH annuler'); }
});

module.exports = router;
