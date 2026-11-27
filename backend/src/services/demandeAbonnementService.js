const crypto = require('crypto');
const db = require('../database');
const emailService = require('./emailService');
const adminAbonnements = require('./adminAbonnementService');
const { PRIX_MENSUEL } = require('../config/plans');
const cfg = require('../config/paiementAbonnement');

// Demandes d'abonnement payées par Orange Money (paiement manuel).
// Les droits (propriétaire / admin) sont contrôlés dans les routes ; ici : règles métier et montants.

var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1 : lisible par téléphone
var REFERENCE_VALIDE = /^[A-Za-z0-9][A-Za-z0-9 ._\-\/:#]{3,99}$/;

function erreur(statutHttp, message, extra) {
  var e = new Error(message);
  e.statutHttp = statutHttp;
  if (extra) e.extra = extra;
  return e;
}

function genererCode() {
  var octets = crypto.randomBytes(6);
  var s = '';
  for (var i = 0; i < 6; i++) s += ALPHABET_CODE[octets[i] % ALPHABET_CODE.length];
  return 'WRD-ABO-' + s;
}

// Le montant est TOUJOURS calculé ici : jamais lu depuis le formulaire.
function montantPour(plan, duree, reductionPromoPct) {
  var brut = PRIX_MENSUEL[plan] * duree * (1 - cfg.REDUCTIONS[duree]);
  var net = reductionPromoPct ? brut * (1 - reductionPromoPct / 100) : brut;
  return Math.round(net);
}

async function promoValide(code) {
  var r = await db.query(
    `SELECT id, code, reduction_pct FROM codes_promo
      WHERE UPPER(code) = UPPER($1) AND actif = TRUE
        AND nb_utilisations < nb_utilisations_max
        AND (expire_at IS NULL OR expire_at > NOW())`, [code]);
  return r.rows[0] || null;
}

function apercu(d) {
  return {
    id: d.id, code: d.code, plan: d.plan, duree_mois: d.duree_mois, montant: Number(d.montant),
    reference_paiement: d.reference_paiement, numero_expediteur: d.numero_expediteur,
    statut: d.statut, motif_refus: d.motif_refus, cree_le: d.cree_le, traite_le: d.traite_le,
  };
}

// Informations affichées au propriétaire : numéro à payer, son profil (pré-remplissage), demande en cours.
async function infos(userId) {
  var u = await db.query('SELECT prenom, nom, email, telephone, role, plan FROM users WHERE id = $1', [userId]);
  if (u.rows.length === 0) throw erreur(404, 'Compte introuvable');
  var d = await db.query(
    `SELECT * FROM demandes_abonnement WHERE user_id = $1 ORDER BY cree_le DESC LIMIT 5`, [userId]);
  var enAttente = d.rows.filter(function(x) { return x.statut === 'en_attente'; })[0];
  return {
    operateur: 'Orange Money',
    numero: cfg.NUMERO,
    numero_affiche: cfg.NUMERO_AFFICHE,
    profil: { prenom: u.rows[0].prenom, nom: u.rows[0].nom, email: u.rows[0].email, telephone: u.rows[0].telephone || '' },
    tarifs: { prix_mensuel: PRIX_MENSUEL, reductions: cfg.REDUCTIONS },
    demande_en_attente: enAttente ? apercu(enAttente) : null,
    dernieres: d.rows.map(apercu),
  };
}

async function creer(p) {
  if (p.plan !== 'pro' && p.plan !== 'agence') throw erreur(400, 'Plan invalide');
  var duree = parseInt(p.duree, 10);
  if (cfg.REDUCTIONS[duree] === undefined) throw erreur(400, 'Durée invalide : 1, 3, 6 ou 12 mois');
  var reference = String(p.reference || '').trim().replace(/\s+/g, ' ');
  if (!REFERENCE_VALIDE.test(reference)) {
    throw erreur(400, 'Référence du paiement invalide : 4 à 100 caractères (lettres, chiffres, . - _ / :).');
  }
  var numero = null;
  if (p.numero_expediteur !== undefined && p.numero_expediteur !== null && String(p.numero_expediteur).trim() !== '') {
    numero = String(p.numero_expediteur).trim();
    if (!/^[0-9+ .\-()]{8,20}$/.test(numero)) throw erreur(400, 'Numéro de téléphone invalide');
  }

  var u = await db.query('SELECT id, prenom, nom, email, telephone, role, suspendu FROM users WHERE id = $1', [p.userId]);
  var user = u.rows[0];
  if (!user || user.suspendu === true) throw erreur(403, 'Compte indisponible');
  if (user.role !== 'proprietaire' && user.role !== 'les_deux') throw erreur(403, 'Réservé aux propriétaires');

  var promo = null;
  if (p.code_promo) {
    promo = await promoValide(String(p.code_promo).trim());
    if (!promo) throw erreur(400, 'Code promo invalide ou expiré');
  }
  var montant = montantPour(p.plan, duree, promo ? promo.reduction_pct : 0);

  for (var essai = 0; essai < 5; essai++) {
    try {
      var r = await db.query(
        `INSERT INTO demandes_abonnement (user_id, code, plan, duree_mois, montant, code_promo, reference_paiement, numero_expediteur)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [p.userId, genererCode(), p.plan, duree, montant, promo ? promo.code : null, reference, numero]);
      var demande = r.rows[0];
      // E-mails : l'échec d'un envoi ne doit jamais faire échouer la demande (elle est déjà enregistrée).
      emailService.emailDemandeAbonnementAdmin(user, demande).catch(console.warn);
      emailService.emailDemandeAbonnementRecue(user, demande).catch(console.warn);
      return { demande: apercu(demande) };
    } catch (err) {
      if (err.code !== '23505') throw err;
      if (err.constraint === 'uq_demandes_abo_une_en_attente') {
        throw erreur(409, 'Vous avez déjà une demande en attente de vérification.', { code: 'deja_en_attente' });
      }
      if (err.constraint === 'uq_demandes_abo_reference') {
        throw erreur(409, 'Cette référence de paiement a déjà été utilisée dans une demande.', { code: 'reference_utilisee' });
      }
      // collision du code court : on retente avec un autre code
    }
  }
  throw erreur(500, 'Impossible de créer la demande, réessayez');
}

async function annuler(userId, id) {
  if (!UUID.test(String(id))) throw erreur(404, 'Demande introuvable');
  var r = await db.query(
    `UPDATE demandes_abonnement SET statut = 'annulee'
      WHERE id = $1 AND user_id = $2 AND statut = 'en_attente' RETURNING id`, [id, userId]);
  if (r.rows.length === 0) throw erreur(409, 'Cette demande ne peut plus être annulée.');
  return { message: 'Demande annulée' };
}

// ─── Administration ────────────────────────────────────────────────
async function lister(statut) {
  var filtre = ['en_attente', 'confirmee', 'refusee', 'annulee'].indexOf(statut) !== -1 ? statut : null;
  var r = await db.query(
    `SELECT d.*, u.prenom, u.nom, u.email, u.telephone, u.plan AS plan_actuel
       FROM demandes_abonnement d JOIN users u ON u.id = d.user_id
      ${filtre ? 'WHERE d.statut = $1' : ''}
      ORDER BY (d.statut = 'en_attente') DESC, d.cree_le DESC
      LIMIT 100`, filtre ? [filtre] : []);
  return {
    demandes: r.rows.map(function(d) {
      return Object.assign(apercu(d), {
        user_id: d.user_id, prenom: d.prenom, nom: d.nom, email: d.email, telephone: d.telephone,
        plan_actuel: d.plan_actuel, code_promo: d.code_promo,
      });
    }),
  };
}

async function confirmer(p) {
  if (!UUID.test(String(p.id))) throw erreur(404, 'Demande introuvable');
  // « Réserve » la demande : deux clics (ou deux admins) ne peuvent pas l'activer deux fois.
  var claim = await db.query(
    `UPDATE demandes_abonnement SET statut = 'confirmee', traite_par = $2, traite_le = NOW()
      WHERE id = $1 AND statut = 'en_attente' RETURNING *`, [p.id, p.adminId]);
  if (claim.rows.length === 0) throw erreur(409, 'Cette demande a déjà été traitée.');
  var d = claim.rows[0];

  var res;
  try {
    // Même circuit que « Enregistrer un paiement » côté admin : abonnement actif, facture, e-mail de facture.
    res = await adminAbonnements.paiementManuel({
      adminId: p.adminId, userId: d.user_id, plan: d.plan, duree: d.duree_mois,
      montant: Number(d.montant), moyen: 'orange_money', reference: d.reference_paiement,
    });
  } catch (err) {
    await db.query(
      `UPDATE demandes_abonnement SET statut = 'en_attente', traite_par = NULL, traite_le = NULL WHERE id = $1`, [d.id]
    ).catch(function(e) { console.error('[Demande abonnement] remise en attente impossible', e.message); });
    throw err;
  }

  await db.query('UPDATE demandes_abonnement SET facture_id = $2 WHERE id = $1', [d.id, res.facture.id]).catch(console.warn);
  if (d.code_promo) {
    await db.query('UPDATE codes_promo SET nb_utilisations = nb_utilisations + 1 WHERE UPPER(code) = UPPER($1)', [d.code_promo]).catch(console.warn);
  }
  return { message: 'Abonnement activé', facture: res.facture };
}

async function refuser(p) {
  if (!UUID.test(String(p.id))) throw erreur(404, 'Demande introuvable');
  var motif = String(p.motif || '').trim();
  if (motif.length < 3) throw erreur(400, 'Indiquez le motif du refus (3 caractères minimum).');
  if (motif.length > 500) throw erreur(400, 'Motif trop long (500 caractères maximum).');
  var r = await db.query(
    `UPDATE demandes_abonnement SET statut = 'refusee', motif_refus = $3, traite_par = $2, traite_le = NOW()
      WHERE id = $1 AND statut = 'en_attente' RETURNING *`, [p.id, p.adminId, motif]);
  if (r.rows.length === 0) throw erreur(409, 'Cette demande a déjà été traitée.');
  var u = await db.query('SELECT prenom, nom, email FROM users WHERE id = $1', [r.rows[0].user_id]);
  if (u.rows[0]) emailService.emailDemandeAbonnementRefusee(u.rows[0], r.rows[0]).catch(console.warn);
  return { message: 'Demande refusée' };
}

module.exports = { infos, creer, annuler, lister, confirmer, refuser, montantPour };
