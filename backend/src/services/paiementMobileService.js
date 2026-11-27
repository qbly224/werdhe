const db = require('../database');
const { genererDocument } = require('./documentService');
const { emailPaiementDeclare } = require('./emailService');
const { envoyerPush } = require('../routes/push');
const { OPERATEURS, DELAI_ANNULATION_MS } = require('../config/paiementMobile');

// ═══════════════════════════════════════════════════════════════════
// PAIEMENT MOBILE DÉCLARÉ — logique métier partagée (routes + CRON)
// Règle d'or : un paiement « declare » n'est jamais compté comme payé.
// ═══════════════════════════════════════════════════════════════════

var MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function cleMois(annee, mois0) { return annee + '-' + String(mois0 + 1).padStart(2, '0'); }

// Premier jour du mois (UTC) → 'YYYY-MM-01'
function premierDuMois(annee, mois0) { return cleMois(annee, mois0) + '-01'; }

// Ajoute n mois à (annee, mois0) → { annee, mois0 }
function ajouterMois(annee, mois0, n) {
  var total = annee * 12 + mois0 + n;
  return { annee: Math.floor(total / 12), mois0: total % 12 };
}

function libelleMois(annee, mois0) { return MOIS_FR[mois0] + ' ' + annee; }

// Mois (clé 'YYYY-MM') couverts pour un bail :
//  - anciens paiements (espèces, en ligne…) : le mois où ils ont été enregistrés, comme les CRON ;
//  - déclarations mobiles : [periode_debut, periode_debut + nb_mois[, selon leur statut.
// Retourne { declares, confirmes, anciens } (trois Set de clés).
async function moisCouverts(reservationId) {
  var r = await db.query(
    `SELECT mode_paiement, statut, nb_mois,
            to_char(periode_debut, 'YYYY-MM-DD') AS periode_debut,
            to_char(created_at, 'YYYY-MM') AS mois_creation
       FROM paiements
      WHERE reservation_id = $1 AND statut IN ('complete', 'confirme', 'declare')`,
    [reservationId]
  );
  var res = { declares: new Set(), confirmes: new Set(), anciens: new Set() };
  r.rows.forEach(function(p) {
    if (p.mode_paiement !== 'mobile_money_declare') {
      if (p.statut === 'complete') res.anciens.add(p.mois_creation);
      return;
    }
    var annee = parseInt(p.periode_debut.slice(0, 4), 10);
    var mois0 = parseInt(p.periode_debut.slice(5, 7), 10) - 1;
    for (var i = 0; i < p.nb_mois; i++) {
      var m = ajouterMois(annee, mois0, i);
      (p.statut === 'confirme' ? res.confirmes : res.declares).add(cleMois(m.annee, m.mois0));
    }
  });
  return res;
}

// Premier mois (à partir du mois en cours) qui n'est couvert ni par un paiement ni par une déclaration.
async function premierMoisAPayer(reservationId, maintenant) {
  var d = maintenant || new Date();
  var couverts = await moisCouverts(reservationId);
  var annee = d.getUTCFullYear(), mois0 = d.getUTCMonth();
  for (var i = 0; i < 36; i++) {
    var m = ajouterMois(annee, mois0, i);
    var cle = cleMois(m.annee, m.mois0);
    if (!couverts.declares.has(cle) && !couverts.confirmes.has(cle) && !couverts.anciens.has(cle)) {
      return { annee: m.annee, mois0: m.mois0, debut: premierDuMois(m.annee, m.mois0), couverts: couverts };
    }
  }
  return null;
}

// Bail + bien + locataire + propriétaire (même structure que les autres documents).
async function contexteBail(reservationId) {
  var r = await db.query(
    `SELECT r.id, r.statut, r.montant_total, r.date_debut, r.date_fin, r.duree_mois, r.type_location, r.locataire_id,
            l.id AS logement_id, l.titre AS logement_titre, l.adresse AS logement_adresse, l.ville AS logement_ville,
            l.superficie, l.nb_chambres, l.nb_salles_bain, l.proprietaire_id,
            ul.nom AS loc_nom, ul.prenom AS loc_prenom, ul.email AS loc_email, ul.telephone AS loc_tel,
            up.nom AS prop_nom, up.prenom AS prop_prenom, up.email AS prop_email, up.telephone AS prop_tel
       FROM reservations r
       JOIN logements l ON l.id = r.logement_id
       JOIN users ul ON ul.id = r.locataire_id
       JOIN users up ON up.id = l.proprietaire_id
      WHERE r.id = $1`,
    [reservationId]
  );
  return r.rows[0] || null;
}

function formaterGnf(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; }

function libellePeriode(periodeDebut, nbMois) {
  var annee = parseInt(String(periodeDebut).slice(0, 4), 10);
  var mois0 = parseInt(String(periodeDebut).slice(5, 7), 10) - 1;
  var fin = ajouterMois(annee, mois0, nbMois - 1);
  return nbMois === 1 ? libelleMois(annee, mois0) : libelleMois(annee, mois0) + ' à ' + libelleMois(fin.annee, fin.mois0);
}

// ─── Notification au propriétaire : nouvelle déclaration (in-app + e-mail + push) ───
async function notifierDeclaration(paiement, ctx) {
  var operateur = (OPERATEURS[paiement.operateur] || {}).label || paiement.operateur;
  var periode = libellePeriode(paiement.periode_debut, paiement.nb_mois);
  try {
    await db.query(
      `INSERT INTO alertes (proprietaire_id, locataire_id, logement_id, type, titre, description, priorite, statut, lu)
       VALUES ($1, $2, $3, 'paiement_declare', $4, $5, 'haute', 'active', FALSE)`,
      [
        ctx.proprietaire_id, ctx.locataire_id, ctx.logement_id,
        'Paiement mobile à vérifier',
        ctx.loc_prenom + ' ' + ctx.loc_nom + ' déclare avoir payé ' + formaterGnf(paiement.montant) +
          ' (' + operateur + ', code ' + paiement.code_transaction + ') pour ' + ctx.logement_titre
      ]
    );
  } catch (err) { console.warn('[paiement mobile] alerte propriétaire non créée:', err.message); }

  envoyerPush(ctx.proprietaire_id, 'Paiement mobile à vérifier',
    ctx.loc_prenom + ' déclare avoir payé ' + formaterGnf(paiement.montant) + '.', '/dashboard/paiements').catch(console.warn);

  try {
    await emailPaiementDeclare(
      { email: ctx.prop_email, prenom: ctx.prop_prenom },
      { prenom: ctx.loc_prenom, nom: ctx.loc_nom },
      {
        montant: paiement.montant, logement_titre: ctx.logement_titre, operateur_label: operateur,
        code_transaction: paiement.code_transaction, periode_libelle: periode,
      }
    );
  } catch (err) { console.warn('[paiement mobile] e-mail propriétaire non envoyé:', err.message); }
}

async function alerteLocataire(ctx, type, titre, description) {
  try {
    await db.query(
      `INSERT INTO alertes (locataire_id, logement_id, destinataire_id, type, titre, description, priorite, statut, lu)
       VALUES ($1, $2, $1, $3, $4, $5, 'normale', 'active', FALSE)`,
      [ctx.locataire_id, ctx.logement_id, type, titre, description]
    );
  } catch (err) { console.warn('[paiement mobile] alerte locataire non créée:', err.message); }
}

// ─── Confirmation : quittance(s) par e-mail + notification au locataire ───
// On « réserve » d'abord l'envoi (quittance_envoyee_le) de façon atomique : à partir de là le
// propriétaire ne peut plus annuler (garde-fou en base), et un second passage ne renvoie rien.
async function finaliserConfirmation(paiementId) {
  var claim = await db.query(
    `UPDATE paiements SET quittance_envoyee_le = NOW()
      WHERE id = $1 AND statut = 'confirme' AND quittance_envoyee_le IS NULL
      RETURNING *`,
    [paiementId]
  );
  if (claim.rows.length === 0) return false;
  var p = claim.rows[0];
  var ctx = await contexteBail(p.reservation_id);
  if (!ctx) return false;

  var debut = await db.query(`SELECT to_char(periode_debut, 'YYYY-MM-DD') AS d FROM paiements WHERE id = $1`, [p.id]);
  var d0 = debut.rows[0].d;
  var an = parseInt(d0.slice(0, 4), 10), m0 = parseInt(d0.slice(5, 7), 10) - 1;

  // Une quittance par mois couvert (loyer mensuel), chacune envoyée au locataire par e-mail.
  for (var i = 0; i < p.nb_mois; i++) {
    var m = ajouterMois(an, m0, i);
    var res = await genererDocument({
      type: 'quittance',
      reservation_id: ctx.id,
      paiement_id: p.id,
      logement: { id: ctx.logement_id, titre: ctx.logement_titre, adresse: ctx.logement_adresse, ville: ctx.logement_ville,
                  superficie: ctx.superficie, nb_chambres: ctx.nb_chambres, nb_salles_bain: ctx.nb_salles_bain },
      proprietaire: { id: ctx.proprietaire_id, nom: ctx.prop_nom, prenom: ctx.prop_prenom, email: ctx.prop_email, telephone: ctx.prop_tel },
      locataire: { id: ctx.locataire_id, nom: ctx.loc_nom, prenom: ctx.loc_prenom, email: ctx.loc_email, telephone: ctx.loc_tel },
      periode: { debut: ctx.date_debut, fin: ctx.date_fin },
      montant: Number(ctx.montant_total),
      mode_paiement: p.operateur,
      mois: m.mois0 + 1,
      annee: m.annee,
      duree_mois: ctx.duree_mois,
      type_location: ctx.type_location,
      auteur_id: ctx.proprietaire_id,
      envoyer_email: true,
    });
    if (!res || res.success === false) console.error('[paiement mobile] quittance non générée pour', p.id, res && res.erreur);
  }

  await alerteLocataire(ctx, 'paiement_confirme', 'Paiement confirmé',
    'Votre propriétaire a confirmé la réception de ' + formaterGnf(p.montant) + '. Votre quittance a été envoyée par e-mail.');
  envoyerPush(ctx.locataire_id, 'Paiement confirmé', 'Votre loyer de ' + formaterGnf(p.montant) + ' est confirmé. Quittance envoyée par e-mail.', '/dashboard/paiements').catch(console.warn);
  return true;
}

// ─── Contestation : notification au locataire ───
async function finaliserContestation(paiementId) {
  var r = await db.query(`SELECT * FROM paiements WHERE id = $1 AND statut = 'conteste'`, [paiementId]);
  if (r.rows.length === 0) return false;
  var p = r.rows[0];
  var ctx = await contexteBail(p.reservation_id);
  if (!ctx) return false;
  await alerteLocataire(ctx, 'paiement_conteste', 'Paiement contesté',
    ctx.prop_prenom + ' n\'a pas reçu votre paiement de ' + formaterGnf(p.montant) + ' (code ' + p.code_transaction + '). Répondez-lui dans la messagerie.');
  envoyerPush(ctx.locataire_id, 'Paiement contesté', ctx.prop_prenom + ' n\'a pas reçu votre paiement. Répondez dans la messagerie.', '/dashboard/messages').catch(console.warn);
  return true;
}

// ─── Programmation différée (fenêtre d'annulation) ───
// Les minuteurs sont en mémoire ; le CRON « balayerQuittances » reprend les confirmations
// oubliées (redémarrage du serveur). Les contestations n'ont pas de reprise : la notification
// du locataire est alors simplement perdue, jamais envoyée deux fois.
var minuteurs = new Map();

function programmer(paiementId, action) {
  annulerProgrammation(paiementId);
  var t = setTimeout(function() {
    minuteurs.delete(paiementId);
    var tache = action === 'confirmer' ? finaliserConfirmation : finaliserContestation;
    tache(paiementId).catch(function(err) { console.error('[paiement mobile] finalisation', action, err.message); });
  }, DELAI_ANNULATION_MS);
  if (t.unref) t.unref();
  minuteurs.set(paiementId, t);
}

function annulerProgrammation(paiementId) {
  var t = minuteurs.get(paiementId);
  if (t) { clearTimeout(t); minuteurs.delete(paiementId); }
}

// CRON (chaque minute) : confirmations dont la quittance n'est pas partie après la fenêtre d'annulation.
async function balayerQuittances() {
  var r = await db.query(
    `SELECT id FROM paiements
      WHERE mode_paiement = 'mobile_money_declare' AND statut = 'confirme'
        AND quittance_envoyee_le IS NULL AND decide_le < NOW() - INTERVAL '15 seconds'
      LIMIT 20`
  );
  for (var i = 0; i < r.rows.length; i++) {
    await finaliserConfirmation(r.rows[i].id).catch(function(err) { console.error('[paiement mobile] balayage', err.message); });
  }
  return r.rows.length;
}

module.exports = {
  moisCouverts, premierMoisAPayer, contexteBail, libellePeriode, formaterGnf,
  notifierDeclaration, finaliserConfirmation, finaliserContestation,
  programmer, annulerProgrammation, balayerQuittances,
};
