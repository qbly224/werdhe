const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');

// Un renouvellement se négocie : le propriétaire propose (durée, loyer,
// message), le locataire accepte, refuse ou contre-propose, et le propriétaire
// répond à son tour. Chaque contre-proposition remplace la précédente.

var REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

function erreur(statutHttp, message) {
  var e = new Error(message);
  e.statutHttp = statutHttp;
  return e;
}

function validerDuree(valeur) {
  var n = parseInt(valeur, 10);
  if (!Number.isInteger(n) || n < 1 || n > 60) throw erreur(400, 'Durée invalide : entre 1 et 60 mois');
  return n;
}

function validerPrix(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return null;
  var n = Number(valeur);
  if (!Number.isFinite(n) || n <= 0 || n > 10000000000) throw erreur(400, 'Loyer invalide');
  return Math.round(n);
}

function texteMessage(valeur) {
  if (valeur === undefined || valeur === null) return null;
  var t = String(valeur).trim();
  if (t.length > 1000) throw erreur(400, 'Message trop long (1000 caractères maximum)');
  return t || null;
}

function ajouterMois(date, mois) {
  var d = new Date(date);
  var jour = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + mois);
  var dernierJour = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(jour, dernierJour));
  return d;
}

// Le renouvellement prolonge le bail à partir de sa fin réelle : renouveler
// avant l'échéance ne doit jamais raccourcir la durée restante.
function debutDeProlongation(resa) {
  var maintenant = new Date();
  var fin = null;
  if (resa.date_fin) fin = new Date(resa.date_fin);
  else if (resa.date_debut && resa.duree_mois) fin = ajouterMois(resa.date_debut, resa.duree_mois);
  return fin && fin > maintenant ? fin : maintenant;
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

function gerer(action) {
  return async function(req, res) {
    try {
      await action(req, res);
    } catch (err) {
      if (err.statutHttp) return res.status(err.statutHttp).json({ erreur: err.message });
      console.error('[renouvellements]', req.method, req.originalUrl, err.message);
      res.status(500).json({ erreur: 'Erreur serveur' });
    }
  };
}

var SELECT_PROPOSITION = `
  SELECT rn.*,
    r.locataire_id, r.logement_id, r.montant_total, r.date_debut, r.date_fin, r.duree_mois, r.statut AS statut_resa,
    l.proprietaire_id, l.titre AS logement_titre,
    up.email AS prop_email, up.prenom AS prop_prenom, up.nom AS prop_nom,
    ul.email AS loc_email,  ul.prenom AS loc_prenom,  ul.nom AS loc_nom
  FROM renouvellements_bail rn
  JOIN reservations r ON rn.reservation_id = r.id
  JOIN logements l    ON r.logement_id = l.id
  JOIN users up       ON up.id = l.proprietaire_id
  JOIN users ul       ON ul.id = r.locataire_id`;

// Qui doit répondre : l'autre partie que celle qui a fait la proposition.
// Une proposition sans auteur (anciennes données) vient du propriétaire.
function proposeParProprietaire(rn) {
  return !rn.proposeur_id || rn.proposeur_id === rn.proprietaire_id;
}
function destinataireId(rn) {
  return proposeParProprietaire(rn) ? rn.locataire_id : rn.proprietaire_id;
}

async function chargerPropositionEnAttente(id, userId) {
  if (!REGEX_UUID.test(String(id))) throw erreur(404, 'Proposition non trouvée ou déjà traitée');
  var res = await db.query(SELECT_PROPOSITION + ` WHERE rn.id = $1 AND rn.statut = 'en_attente'`, [id]);
  if (res.rows.length === 0) throw erreur(404, 'Proposition non trouvée ou déjà traitée');
  var rn = res.rows[0];
  if (userId !== destinataireId(rn)) throw erreur(403, "Seule l'autre partie peut répondre à cette proposition");
  return rn;
}

async function alerter(rn, destinataire, titre, description) {
  await db.query(
    `INSERT INTO alertes (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
     VALUES ($1, $2, $3, 'bail_bientot', $4, $5, 'haute')`,
    [rn.proprietaire_id, destinataire, rn.logement_id, titre, description]
  ).catch(function(err) { console.warn('[renouvellements] alerte:', err.message); });
}

async function envoyerEmail(destinataire, sujet, titreBandeau, couleur, corpsHtml) {
  if (!process.env.RESEND_API_KEY || !destinataire) return;
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
      to: destinataire,
      subject: sujet,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <div style="background:${couleur};padding:20px;border-radius:12px 12px 0 0">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:34px;height:34px;"><img src="https://werdhe.com/logo192.png" width="34" height="34" alt="Werdhe" style="display:block;border-radius:9px;width:34px;height:34px;" /></td><td style="padding-left:9px;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:17px;color:#fff;">${titreBandeau}</td></tr></table>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">${corpsHtml}
          <a href="https://werdhe.com/dashboard" style="display:inline-block;background:${couleur};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Ouvrir mon tableau de bord →</a>
        </div></div>`
    });
  } catch (e) {
    console.warn('[Renouvellement] Email non envoyé:', e.message);
  }
}

function echapper(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resume(duree, prix) {
  return duree + ' mois' + (prix ? ', loyer ' + GNF(prix) + ' GNF/mois' : '');
}

// ─── PROPOSER UN RENOUVELLEMENT (propriétaire) ────────────────────
router.post('/', verifierToken, gerer(async function(req, res) {
  var reservationId = req.body.reservation_id;
  if (!reservationId || !req.body.nouvelle_duree_mois) {
    throw erreur(400, 'reservation_id et nouvelle_duree_mois requis');
  }
  if (!REGEX_UUID.test(String(reservationId))) throw erreur(404, 'Location active non trouvée');
  var duree = validerDuree(req.body.nouvelle_duree_mois);
  var prix = validerPrix(req.body.nouveau_prix);
  var message = texteMessage(req.body.message);

  var resa = await db.query(
    `SELECT r.*, l.proprietaire_id, l.titre AS logement_titre,
       u_loc.email AS loc_email, u_loc.prenom AS loc_prenom,
       u_prop.prenom AS prop_prenom
     FROM reservations r
     JOIN logements l ON r.logement_id = l.id
     JOIN users u_loc ON r.locataire_id = u_loc.id
     JOIN users u_prop ON l.proprietaire_id = u_prop.id
     WHERE r.id = $1 AND r.statut = 'confirmee'`, [reservationId]);
  if (resa.rows.length === 0) throw erreur(404, 'Location active non trouvée');
  var r = resa.rows[0];
  if (req.user.id !== r.proprietaire_id) throw erreur(403, 'Seul le propriétaire peut proposer un renouvellement');

  var nouvelleDateFin = ajouterMois(debutDeProlongation(r), duree);

  var cree = await enTransaction(async function(client) {
    await client.query(
      `UPDATE renouvellements_bail SET statut = 'expire', updated_at = NOW()
       WHERE reservation_id = $1 AND statut = 'en_attente'`, [reservationId]);
    return client.query(
      `INSERT INTO renouvellements_bail
         (reservation_id, proposeur_id, nouveau_prix, nouvelle_duree_mois, nouvelle_date_fin, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [reservationId, req.user.id, prix || r.montant_total, duree, nouvelleDateFin, message]);
  });

  await alerter(r, r.locataire_id, 'Proposition de renouvellement pour ' + r.logement_titre,
    'Le propriétaire propose un renouvellement de ' + resume(duree, prix) + '. Vous pouvez accepter, refuser ou faire une contre-proposition.');
  envoyerEmail(r.loc_email, 'Proposition de renouvellement pour ' + r.logement_titre, 'Werdhe · Renouvellement', '#1565C0',
    `<p>Bonjour <b>${echapper(r.loc_prenom)}</b>,</p>
     <p><b>${echapper(r.prop_prenom)}</b> vous propose de renouveler votre bail pour <b>${echapper(r.logement_titre)}</b>.</p>
     <div style="background:#E3F2FD;border-radius:10px;padding:16px;margin:16px 0">
       <div style="font-size:13px;color:#555">Durée proposée</div>
       <div style="font-size:22px;font-weight:800;color:#1565C0">${duree} mois</div>
       ${prix ? '<div style="font-size:13px;color:#555;margin-top:8px">Nouveau loyer : <b style="color:#1565C0">' + GNF(prix) + ' GNF/mois</b></div>' : ''}
       ${message ? '<div style="font-size:13px;color:#666;margin-top:8px;font-style:italic">"' + echapper(message) + '"</div>' : ''}
     </div>
     <p style="font-size:13px;color:#666">Vous pouvez accepter, refuser, ou proposer d'autres conditions.</p>`);

  res.status(201).json({ message: 'Proposition envoyée !', renouvellement: cree.rows[0] });
}));

// ─── RÉPONDRE : ACCEPTER OU REFUSER (l'autre partie) ──────────────
router.patch('/:id/repondre', verifierToken, gerer(async function(req, res) {
  var reponse = req.body.reponse;
  if (['accepte', 'refuse'].indexOf(reponse) === -1) throw erreur(400, 'Réponse invalide (accepte ou refuse)');
  var rn = await chargerPropositionEnAttente(req.params.id, req.user.id);
  var proposeurEtaitProprio = proposeParProprietaire(rn);
  var autrePartie = proposeurEtaitProprio ? rn.proprietaire_id : rn.locataire_id;
  var emailAutre = proposeurEtaitProprio ? rn.prop_email : rn.loc_email;
  var prenomAutre = proposeurEtaitProprio ? rn.prop_prenom : rn.loc_prenom;
  var qui = proposeurEtaitProprio ? 'Le locataire' : 'Le propriétaire';

  await enTransaction(async function(client) {
    var claim = await client.query(
      `UPDATE renouvellements_bail SET statut = $1, updated_at = NOW()
       WHERE id = $2 AND statut = 'en_attente' RETURNING id`, [reponse, rn.id]);
    if (claim.rows.length === 0) throw erreur(404, 'Proposition non trouvée ou déjà traitée');

    if (reponse === 'accepte') {
      var resa = await client.query(`SELECT * FROM reservations WHERE id = $1 FOR UPDATE`, [rn.reservation_id]);
      if (resa.rows.length === 0 || resa.rows[0].statut !== 'confirmee') {
        throw erreur(409, "Cette location n'est plus active");
      }
      var nouvelleFin = ajouterMois(debutDeProlongation(resa.rows[0]), rn.nouvelle_duree_mois);
      await client.query(
        `UPDATE reservations SET date_fin = $1, duree_mois = COALESCE(duree_mois, 0) + $2,
           montant_total = COALESCE($3, montant_total), updated_at = NOW()
         WHERE id = $4`,
        [nouvelleFin, rn.nouvelle_duree_mois, rn.nouveau_prix, rn.reservation_id]);
      await client.query(
        `UPDATE renouvellements_bail SET statut = 'expire', updated_at = NOW()
         WHERE reservation_id = $1 AND statut = 'en_attente' AND id <> $2`, [rn.reservation_id, rn.id]);
    }
  });

  if (reponse === 'accepte') {
    await alerter(rn, autrePartie, 'Renouvellement accepté pour ' + rn.logement_titre,
      qui + ' a accepté le renouvellement : ' + resume(rn.nouvelle_duree_mois, rn.nouveau_prix) + '.');
    envoyerEmail(emailAutre, 'Renouvellement accepté pour ' + rn.logement_titre, 'Werdhe · Renouvellement', '#1B6B3A',
      `<p>Bonjour <b>${echapper(prenomAutre)}</b>,</p>
       <p>Le renouvellement du bail de <b>${echapper(rn.logement_titre)}</b> a été <b style="color:#1B6B3A">accepté</b> :</p>
       <div style="background:#E8F5E9;border-radius:8px;padding:14px;margin:16px 0">
         <div style="font-size:18px;font-weight:700;color:#1B6B3A">+${rn.nouvelle_duree_mois} mois</div>
         ${rn.nouveau_prix ? '<div style="font-size:13px;color:#555;margin-top:6px">Loyer : ' + GNF(rn.nouveau_prix) + ' GNF/mois</div>' : ''}
       </div>`);
  } else {
    await alerter(rn, autrePartie, 'Renouvellement refusé pour ' + rn.logement_titre,
      qui + ' a refusé la proposition de renouvellement (' + resume(rn.nouvelle_duree_mois, rn.nouveau_prix) + ').');
  }

  res.json({ message: reponse === 'accepte' ? 'Renouvellement accepté !' : 'Renouvellement refusé.', statut: reponse });
}));

// ─── CONTRE-PROPOSER (l'autre partie propose d'autres conditions) ──
router.post('/:id/contre-proposer', verifierToken, gerer(async function(req, res) {
  var duree = validerDuree(req.body.nouvelle_duree_mois);
  var prix = validerPrix(req.body.nouveau_prix);
  var message = texteMessage(req.body.message);
  var rn = await chargerPropositionEnAttente(req.params.id, req.user.id);
  var proposeurEtaitProprio = proposeParProprietaire(rn);
  var autrePartie = proposeurEtaitProprio ? rn.proprietaire_id : rn.locataire_id;
  var emailAutre = proposeurEtaitProprio ? rn.prop_email : rn.loc_email;
  var prenomAutre = proposeurEtaitProprio ? rn.prop_prenom : rn.loc_prenom;
  var qui = proposeurEtaitProprio ? 'Le locataire' : 'Le propriétaire';

  var nouvelle = await enTransaction(async function(client) {
    var claim = await client.query(
      `UPDATE renouvellements_bail SET statut = 'contre_propose', updated_at = NOW()
       WHERE id = $1 AND statut = 'en_attente' RETURNING id`, [rn.id]);
    if (claim.rows.length === 0) throw erreur(404, 'Proposition non trouvée ou déjà traitée');
    var resa = await client.query(`SELECT * FROM reservations WHERE id = $1`, [rn.reservation_id]);
    if (resa.rows.length === 0 || resa.rows[0].statut !== 'confirmee') throw erreur(409, "Cette location n'est plus active");
    return client.query(
      `INSERT INTO renouvellements_bail
         (reservation_id, proposeur_id, nouveau_prix, nouvelle_duree_mois, nouvelle_date_fin, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [rn.reservation_id, req.user.id, prix || rn.montant_total, duree,
       ajouterMois(debutDeProlongation(resa.rows[0]), duree), message]);
  });

  await alerter(rn, autrePartie, 'Contre-proposition de renouvellement pour ' + rn.logement_titre,
    qui + ' propose d\'autres conditions : ' + resume(duree, prix) + '.');
  envoyerEmail(emailAutre, 'Contre-proposition de renouvellement pour ' + rn.logement_titre, 'Werdhe · Renouvellement', '#1565C0',
    `<p>Bonjour <b>${echapper(prenomAutre)}</b>,</p>
     <p>${qui} propose d'autres conditions pour le renouvellement de <b>${echapper(rn.logement_titre)}</b> :</p>
     <div style="background:#E3F2FD;border-radius:10px;padding:16px;margin:16px 0">
       <div style="font-size:22px;font-weight:800;color:#1565C0">${duree} mois</div>
       ${prix ? '<div style="font-size:13px;color:#555;margin-top:8px">Loyer : <b style="color:#1565C0">' + GNF(prix) + ' GNF/mois</b></div>' : ''}
       ${message ? '<div style="font-size:13px;color:#666;margin-top:8px;font-style:italic">"' + echapper(message) + '"</div>' : ''}
     </div>`);

  res.status(201).json({ message: 'Contre-proposition envoyée !', renouvellement: nouvelle.rows[0] });
}));

// ─── PROPOSITIONS EN COURS (je suis le propriétaire ou le locataire) ─
// a_traiter = true : c'est à moi de répondre ; false : j'attends la réponse
async function propositionsEnCours(userId) {
  var res = await db.query(
    SELECT_PROPOSITION + `
     WHERE rn.statut = 'en_attente' AND r.statut = 'confirmee'
       AND (r.locataire_id = $1 OR l.proprietaire_id = $1)
     ORDER BY rn.created_at DESC`, [userId]);
  return res.rows.map(function(rn) {
    var parProprio = proposeParProprietaire(rn);
    return {
      id: rn.id,
      reservation_id: rn.reservation_id,
      logement_id: rn.logement_id,
      logement_titre: rn.logement_titre,
      nouveau_prix: rn.nouveau_prix,
      nouvelle_duree_mois: rn.nouvelle_duree_mois,
      nouvelle_date_fin: rn.nouvelle_date_fin,
      message: rn.message,
      created_at: rn.created_at,
      loyer_actuel: rn.montant_total,
      propose_par: parProprio ? 'proprietaire' : 'locataire',
      a_traiter: destinataireId(rn) === userId,
      proprietaire_id: rn.proprietaire_id,
      prop_prenom: rn.prop_prenom, prop_nom: rn.prop_nom,
      loc_prenom: rn.loc_prenom, loc_nom: rn.loc_nom,
      // Prénom et nom de la personne qui a fait la proposition
      auteur_prenom: parProprio ? rn.prop_prenom : rn.loc_prenom,
      auteur_nom: parProprio ? rn.prop_nom : rn.loc_nom,
    };
  });
}

router.get('/en-cours', verifierToken, gerer(async function(req, res) {
  res.json({ renouvellements: await propositionsEnCours(req.user.id) });
}));

// Propositions auxquelles je dois répondre
router.get('/en-attente', verifierToken, gerer(async function(req, res) {
  var toutes = await propositionsEnCours(req.user.id);
  res.json({ renouvellements: toutes.filter(function(p) { return p.a_traiter; }) });
}));

module.exports = router;
