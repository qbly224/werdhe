const db = require('../database');
const emailService = require('./emailService');
const {
  appliquerLimitePlan,
  envoyerFactureParEmail,
} = require('./abonnementService');

var MOTIFS = ['collaborateur', 'partenaire', 'pilote', 'geste_commercial'];
var DUREES_MOIS = [1, 3, 6, 12];
var MOYENS = ['orange_money', 'mtn_momo', 'especes', 'virement'];
var CYCLE_PAR_DUREE = { 1: 'mensuel', 3: 'trimestriel', 6: 'semestriel', 12: 'annuel' };
var REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Colonnes de l'abonnement ; offert_jusqu_au est lu en texte pour éviter
// qu'un décalage de fuseau ne le fasse glisser d'un jour dans le JSON.
var COLONNES_ABO = `a.id, a.plan, a.statut, a.source, a.cycle, a.date_fin, a.essai_termine,
  to_char(a.offert_jusqu_au, 'YYYY-MM-DD') AS offert_jusqu_au, a.offert_motif, a.offert_par`;

function erreur(statutHttp, message) {
  var e = new Error(message);
  e.statutHttp = statutHttp;
  return e;
}

function texteFacultatif(valeur, max) {
  if (valeur === undefined || valeur === null) return null;
  var t = String(valeur).trim();
  if (!t) return null;
  if (t.length > max) throw erreur(400, 'Texte trop long (' + max + ' caractères maximum)');
  return t;
}

async function enTransaction(fn) {
  var client = await db.connect();
  try {
    await client.query('BEGIN');
    var resultat = await fn(client);
    await client.query('COMMIT');
    return resultat;
  } catch (err) {
    await client.query('ROLLBACK').catch(function() {});
    throw err;
  } finally {
    client.release();
  }
}

// Verrouille le compte et son abonnement le temps de la transaction, pour que
// deux actions admin simultanées ne se marchent pas dessus.
async function chargerCible(client, userId) {
  if (!REGEX_UUID.test(String(userId))) throw erreur(404, 'Compte introuvable');
  var u = await client.query(
    `SELECT id, nom, prenom, email, role, plan, abonnement_bloque
     FROM users WHERE id = $1 FOR UPDATE`, [userId]);
  if (u.rows.length === 0) throw erreur(404, 'Compte introuvable');
  var user = u.rows[0];
  if (user.role !== 'proprietaire' && user.role !== 'les_deux') {
    throw erreur(400, 'Seuls les comptes propriétaires ont un abonnement');
  }
  var a = await client.query(
    `SELECT ${COLONNES_ABO} FROM abonnements a WHERE a.user_id = $1 FOR UPDATE`, [userId]);
  return { user: user, abo: a.rows[0] || null };
}

async function lireEtat(client, userId) {
  var r = await client.query(
    `SELECT u.plan, u.abonnement_bloque, a.statut, a.source, a.date_fin, a.cycle,
            to_char(a.offert_jusqu_au, 'YYYY-MM-DD') AS offert_jusqu_au, a.offert_motif
     FROM users u LEFT JOIN abonnements a ON a.user_id = u.id WHERE u.id = $1`, [userId]);
  return r.rows[0];
}

async function tracer(client, t) {
  await client.query(
    `INSERT INTO admin_actions (admin_id, cible_id, action, ancien_etat, nouvel_etat, motif, message_proprietaire)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [t.adminId || null, t.cibleId, t.action, JSON.stringify(t.ancien), JSON.stringify(t.nouvel), t.motif || null, t.message || null]
  );
}

// Écrit l'état de l'abonnement (création si absent) et le plan du compte, dans
// la même transaction : les droits d'accès lisent users.plan.
async function ecrireAbonnement(client, userId, a) {
  await client.query(
    `INSERT INTO abonnements
       (user_id, plan, statut, source, cycle, date_fin, offert_jusqu_au, offert_motif, offert_par, essai_termine)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id) DO UPDATE SET
       plan = EXCLUDED.plan, statut = EXCLUDED.statut, source = EXCLUDED.source, cycle = EXCLUDED.cycle,
       date_fin = EXCLUDED.date_fin, offert_jusqu_au = EXCLUDED.offert_jusqu_au,
       offert_motif = EXCLUDED.offert_motif, offert_par = EXCLUDED.offert_par,
       essai_termine = abonnements.essai_termine OR EXCLUDED.essai_termine,
       rappel_j3_envoye = FALSE, rappel_j5_envoye = FALSE, rappel_j7_avant_envoye = FALSE,
       rappel_j3_avant_envoye = FALSE, rappel_j1_avant_envoye = FALSE, offert_rappel_j7_envoye = FALSE`,
    [userId, a.plan, a.statut || 'actif', a.source, a.cycle || 'mensuel', a.date_fin || null,
     a.offert_jusqu_au || null, a.offert_motif || null, a.offert_par || null, !!a.essai_termine]
  );
  await client.query('UPDATE users SET plan = $1, abonnement_bloque = FALSE WHERE id = $2', [a.plan, userId]);
}

async function alerter(userId, titre, description) {
  await db.query(
    `INSERT INTO alertes (proprietaire_id, destinataire_id, type, titre, description, priorite)
     VALUES ($1, $1, 'autre', $2, $3, 'haute')`,
    [userId, titre, description]
  ).catch(function(err) { console.warn('[Admin abonnement] alerte:', err.message); });
}

function notifier(promesse) {
  promesse.catch(function(err) { console.warn('[Admin abonnement] e-mail:', err.message); });
}

// ════════════════════════════════════════════════════════
// Lecture : fiche abonnement d'un propriétaire
// ════════════════════════════════════════════════════════
async function detail(userId) {
  if (!REGEX_UUID.test(String(userId))) throw erreur(404, 'Compte introuvable');
  var u = await db.query(
    `SELECT id, nom, prenom, email, telephone, role, plan, abonnement_bloque FROM users WHERE id = $1`, [userId]);
  if (u.rows.length === 0) throw erreur(404, 'Compte introuvable');
  if (u.rows[0].role !== 'proprietaire' && u.rows[0].role !== 'les_deux') {
    throw erreur(400, 'Seuls les comptes propriétaires ont un abonnement');
  }

  var [abo, biens, factures, historique] = await Promise.all([
    db.query(
      `SELECT ${COLONNES_ABO}, (adm.prenom || ' ' || adm.nom) AS offert_par_nom
       FROM abonnements a LEFT JOIN users adm ON adm.id = a.offert_par WHERE a.user_id = $1`, [userId]),
    db.query(
      `SELECT COUNT(*)::int AS nb_biens, COUNT(*) FILTER (WHERE masque_limite_plan = TRUE)::int AS biens_masques
       FROM logements WHERE proprietaire_id = $1`, [userId]),
    db.query(
      `SELECT id, plan, montant, cycle, periode_debut, periode_fin, statut, operateur, reference_externe, origine, created_at
       FROM factures_abonnements WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [userId]),
    db.query(
      `SELECT h.id, h.action, h.admin_id, (adm.prenom || ' ' || adm.nom) AS admin_nom,
              h.ancien_etat, h.nouvel_etat, h.motif, h.message_proprietaire, h.created_at
       FROM admin_actions h LEFT JOIN users adm ON adm.id = h.admin_id
       WHERE h.cible_id = $1 ORDER BY h.created_at DESC LIMIT 50`, [userId]),
  ]);

  return {
    proprietaire: u.rows[0],
    abonnement:   abo.rows[0] || null,
    nb_biens:     biens.rows[0].nb_biens,
    biens_masques: biens.rows[0].biens_masques,
    factures:     factures.rows,
    historique:   historique.rows,
  };
}

// ════════════════════════════════════════════════════════
// Offrir l'accès à un plan, avec une durée et un motif
// ════════════════════════════════════════════════════════
async function offrir(p) {
  if (p.plan !== 'pro' && p.plan !== 'agence') throw erreur(400, 'Plan invalide : pro ou agence');
  var illimite = String(p.duree) === 'illimite';
  var mois = illimite ? null : parseInt(p.duree, 10);
  if (!illimite && DUREES_MOIS.indexOf(mois) === -1) throw erreur(400, 'Durée invalide : 1, 3, 6, 12 mois ou illimité');
  if (!p.motif) throw erreur(400, 'Le motif est obligatoire');
  if (MOTIFS.indexOf(p.motif) === -1) throw erreur(400, 'Motif invalide');
  var message = texteFacultatif(p.message_proprietaire, 1000);

  var sortie = await enTransaction(async function(client) {
    var cible = await chargerCible(client, p.userId);
    var ancien = await lireEtat(client, p.userId);

    var payeEnCours = cible.abo && cible.abo.source === 'paye' && cible.user.plan !== 'gratuit'
      && cible.abo.statut === 'actif' && (!cible.abo.date_fin || new Date(cible.abo.date_fin) > new Date());
    if (payeEnCours) {
      throw erreur(409, "Ce compte a un abonnement payé en cours : l'offrir ferait perdre les jours déjà payés. Rétrogradez-le d'abord.");
    }

    var jusquau = null;
    if (!illimite) {
      var d = await client.query(`SELECT to_char(CURRENT_DATE + make_interval(months => $1), 'YYYY-MM-DD') AS d`, [mois]);
      jusquau = d.rows[0].d;
    }

    await ecrireAbonnement(client, p.userId, {
      plan: p.plan, statut: 'actif', source: 'offert', cycle: 'mensuel', date_fin: null,
      offert_jusqu_au: jusquau, offert_motif: p.motif, offert_par: p.adminId,
      essai_termine: cible.abo ? cible.abo.essai_termine : false,
    });
    var nouvel = await lireEtat(client, p.userId);
    await tracer(client, { adminId: p.adminId, cibleId: p.userId, action: 'offrir', ancien: ancien, nouvel: nouvel, motif: p.motif, message: message });
    return { user: cible.user, jusquau: jusquau };
  });

  await appliquerLimitePlan(p.userId, p.plan);
  notifier(emailService.emailAccesOffert(sortie.user, { plan: p.plan, jusquau: sortie.jusquau, message: message }));
  await alerter(p.userId, 'Accès ' + p.plan + ' offert', sortie.jusquau
    ? 'Werdhe vous offre le plan ' + p.plan + ' jusqu\'au ' + sortie.jusquau.split('-').reverse().join('/') + '.'
    : 'Werdhe vous offre le plan ' + p.plan + ', sans limite de durée.');

  return { message: 'Accès ' + p.plan + ' offert' };
}

// ════════════════════════════════════════════════════════
// Révoquer un accès offert : retour au plan gratuit
// ════════════════════════════════════════════════════════
async function revoquer(p) {
  var motif = texteFacultatif(p.motif, 500);
  var message = texteFacultatif(p.message_proprietaire, 1000);

  var sortie = await enTransaction(async function(client) {
    var cible = await chargerCible(client, p.userId);
    if (!cible.abo || cible.abo.source !== 'offert') throw erreur(409, "Ce compte n'a pas d'accès offert à révoquer");
    var ancien = await lireEtat(client, p.userId);
    await ecrireAbonnement(client, p.userId, {
      plan: 'gratuit', statut: 'actif', source: 'paye', cycle: 'mensuel', date_fin: null,
      essai_termine: cible.abo.essai_termine,
    });
    var nouvel = await lireEtat(client, p.userId);
    await tracer(client, { adminId: p.adminId, cibleId: p.userId, action: 'revoquer', ancien: ancien, nouvel: nouvel, motif: motif, message: message });
    return { user: cible.user, ancienPlan: cible.abo.plan };
  });

  var nbMasques = await appliquerLimitePlan(p.userId, 'gratuit');
  notifier(emailService.emailAccesRevoque(sortie.user, { plan: sortie.ancienPlan, message: message, nbMasques: nbMasques, motifFin: 'revoque' }));
  await alerter(p.userId, 'Accès offert terminé', 'Votre compte repasse au plan Gratuit. Vos données sont conservées.');

  return { message: 'Accès offert révoqué' };
}

// ════════════════════════════════════════════════════════
// Changer le plan : correction d'une offre, ou rétrogradation
// (toute montée de plan passe par offrir ou le paiement manuel)
// ════════════════════════════════════════════════════════
async function changerPlan(p) {
  if (['gratuit', 'pro', 'agence'].indexOf(p.plan) === -1) throw erreur(400, 'Plan invalide');
  var motif = texteFacultatif(p.motif, 500);

  await enTransaction(async function(client) {
    var cible = await chargerCible(client, p.userId);
    if (cible.user.plan === p.plan) throw erreur(400, 'Le compte est déjà sur ce plan');
    var ancien = await lireEtat(client, p.userId);

    if (cible.abo && cible.abo.source === 'offert') {
      if (p.plan === 'gratuit') throw erreur(400, "Pour retirer un accès offert, utilisez « Révoquer »");
      await client.query('UPDATE abonnements SET plan = $1 WHERE user_id = $2', [p.plan, p.userId]);
      await client.query('UPDATE users SET plan = $1 WHERE id = $2', [p.plan, p.userId]);
    } else {
      if (p.plan !== 'gratuit') {
        throw erreur(400, "Pour passer ce compte à un plan payant, utilisez « Offrir l'accès » ou « Enregistrer un paiement manuel »");
      }
      await ecrireAbonnement(client, p.userId, {
        plan: 'gratuit', statut: 'actif', source: 'paye', cycle: 'mensuel', date_fin: null,
        essai_termine: cible.abo ? cible.abo.essai_termine : false,
      });
    }
    var nouvel = await lireEtat(client, p.userId);
    await tracer(client, { adminId: p.adminId, cibleId: p.userId, action: 'changer_plan', ancien: ancien, nouvel: nouvel, motif: motif });
  });

  await appliquerLimitePlan(p.userId, p.plan);
  return { message: 'Plan mis à jour' };
}

// ════════════════════════════════════════════════════════
// Enregistrer un paiement reçu hors ligne (espèces, virement, mobile money)
// ════════════════════════════════════════════════════════
async function paiementManuel(p) {
  if (p.plan !== 'pro' && p.plan !== 'agence') throw erreur(400, 'Plan invalide : pro ou agence');
  var mois = parseInt(p.duree, 10);
  if (DUREES_MOIS.indexOf(mois) === -1) throw erreur(400, 'Durée invalide : 1, 3, 6 ou 12 mois');
  var montant = Math.round(Number(p.montant));
  if (!Number.isFinite(montant) || montant <= 0 || montant > 1000000000) throw erreur(400, 'Montant invalide');
  if (MOYENS.indexOf(p.moyen) === -1) throw erreur(400, 'Moyen de paiement invalide');
  var reference = texteFacultatif(p.reference, 100);
  if (!reference && p.moyen !== 'especes') throw erreur(400, 'La référence du paiement est obligatoire (sauf espèces)');

  var sortie;
  try {
    sortie = await enTransaction(async function(client) {
      var cible = await chargerCible(client, p.userId);
      var ancien = await lireEtat(client, p.userId);

      // Renouvellement du même plan encore payé : la période repart de sa fin
      var prolonge = cible.abo && cible.abo.source === 'paye' && cible.abo.statut === 'actif'
        && cible.user.plan === p.plan && cible.abo.date_fin && new Date(cible.abo.date_fin) > new Date();
      var periode = await client.query(
        `SELECT d AS debut, d + make_interval(months => $2) AS fin
         FROM (SELECT COALESCE($1::timestamp, NOW()::timestamp) AS d) x`,
        [prolonge ? cible.abo.date_fin : null, mois]);
      var debut = periode.rows[0].debut;
      var fin = periode.rows[0].fin;

      await ecrireAbonnement(client, p.userId, {
        plan: p.plan, statut: 'actif', source: 'paye', cycle: CYCLE_PAR_DUREE[mois], date_fin: fin,
        essai_termine: true,
      });
      var abo = await client.query('SELECT id FROM abonnements WHERE user_id = $1', [p.userId]);
      var facture = await client.query(
        `INSERT INTO factures_abonnements
           (user_id, abonnement_id, plan, montant, periode_debut, periode_fin, statut, cycle,
            reference_externe, operateur, origine, enregistre_par)
         VALUES ($1, $2, $3, $4, $5, $6, 'payee', $7, $8, $9, 'manuel', $10)
         RETURNING id, plan, montant, cycle, periode_debut, periode_fin`,
        [p.userId, abo.rows[0].id, p.plan, montant, debut, fin, CYCLE_PAR_DUREE[mois], reference, p.moyen, p.adminId]
      );
      var nouvel = await lireEtat(client, p.userId);
      nouvel.facture_id = facture.rows[0].id;
      nouvel.montant = montant;
      nouvel.moyen = p.moyen;
      nouvel.reference = reference;
      await tracer(client, { adminId: p.adminId, cibleId: p.userId, action: 'paiement_manuel', ancien: ancien, nouvel: nouvel, motif: null });
      return { facture: facture.rows[0] };
    });
  } catch (err) {
    if (err.code === '23505') throw erreur(409, 'Cette référence de paiement est déjà enregistrée');
    throw err;
  }

  await appliquerLimitePlan(p.userId, p.plan);
  var f = sortie.facture;
  envoyerFactureParEmail(p.userId, f.plan, f.montant, f.cycle, f.periode_debut, f.periode_fin).catch(console.warn);
  return { message: 'Paiement enregistré', facture: f };
}

// ════════════════════════════════════════════════════════
// Expiration des accès offerts (CRON quotidien, et à la demande)
// ════════════════════════════════════════════════════════
async function expirerOffre(userId) {
  var sortie = await enTransaction(async function(client) {
    var a = await client.query(
      `SELECT ${COLONNES_ABO} FROM abonnements a
       WHERE a.user_id = $1 AND a.source = 'offert' AND a.offert_jusqu_au IS NOT NULL AND a.offert_jusqu_au < CURRENT_DATE
       FOR UPDATE`, [userId]);
    if (a.rows.length === 0) return null;
    var u = await client.query('SELECT id, nom, prenom, email FROM users WHERE id = $1 FOR UPDATE', [userId]);
    var ancien = await lireEtat(client, userId);
    await ecrireAbonnement(client, userId, {
      plan: 'gratuit', statut: 'actif', source: 'paye', cycle: 'mensuel', date_fin: null,
      essai_termine: a.rows[0].essai_termine,
    });
    var nouvel = await lireEtat(client, userId);
    await tracer(client, { adminId: null, cibleId: userId, action: 'expiration_auto', ancien: ancien, nouvel: nouvel, motif: 'Accès offert arrivé à échéance' });
    return { user: u.rows[0], ancienPlan: a.rows[0].plan };
  });
  if (!sortie) return false;

  var nbMasques = await appliquerLimitePlan(userId, 'gratuit');
  notifier(emailService.emailAccesRevoque(sortie.user, { plan: sortie.ancienPlan, nbMasques: nbMasques, motifFin: 'echeance' }));
  await alerter(userId, 'Accès offert terminé', 'Votre accès offert est arrivé à échéance : votre compte repasse au plan Gratuit. Vos données sont conservées.');
  return true;
}

async function traiterOffresExpirees() {
  var expirees = await db.query(
    `SELECT user_id FROM abonnements
     WHERE source = 'offert' AND offert_jusqu_au IS NOT NULL AND offert_jusqu_au < CURRENT_DATE`);
  var nbExpirees = 0;
  for (var row of expirees.rows) {
    try {
      if (await expirerOffre(row.user_id)) nbExpirees++;
    } catch (err) {
      console.error('[Offres offertes] Expiration de ' + row.user_id + ':', err.message);
    }
  }

  // Rappel J-7 : tous les accès offerts qui se terminent d'ici 7 jours, une seule fois
  var aRappeler = await db.query(
    `SELECT a.id, a.user_id, a.plan, to_char(a.offert_jusqu_au, 'YYYY-MM-DD') AS jusquau,
            (a.offert_jusqu_au - CURRENT_DATE) AS jours, u.nom, u.prenom, u.email
     FROM abonnements a JOIN users u ON u.id = a.user_id
     WHERE a.source = 'offert' AND a.offert_jusqu_au IS NOT NULL
       AND a.offert_jusqu_au >= CURRENT_DATE AND a.offert_jusqu_au <= CURRENT_DATE + 7
       AND a.offert_rappel_j7_envoye = FALSE`);
  for (var r of aRappeler.rows) {
    try {
      await db.query('UPDATE abonnements SET offert_rappel_j7_envoye = TRUE WHERE id = $1', [r.id]);
      notifier(emailService.emailAccesOffertBientotTermine(r, { plan: r.plan, jusquau: r.jusquau, jours: r.jours }));
      await alerter(r.user_id, 'Accès offert : fin dans ' + r.jours + ' jour' + (r.jours > 1 ? 's' : ''),
        'Votre accès offert au plan ' + r.plan + ' se termine le ' + r.jusquau.split('-').reverse().join('/') + '.');
    } catch (err) {
      console.error('[Offres offertes] Rappel J-7 pour ' + r.user_id + ':', err.message);
    }
  }

  return { expirees: nbExpirees, rappels: aRappeler.rows.length };
}

module.exports = {
  detail, offrir, revoquer, changerPlan, paiementManuel,
  expirerOffre, traiterOffresExpirees,
};
