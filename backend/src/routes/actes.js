const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../database');
const verifierToken = require('../middleware/auth');
const A = require('../services/acteService');
const E = require('../services/etatDesLieuxService');
const { genererDocument, apercuDocument, enregistrerEvenement } = require('../services/documentService');
const { envoyerEmailDocument } = require('../services/emailService');
const { esc } = require('../services/documentTemplates');
const { activerLocation } = require('../services/bailService');

// ================================================
// ACTES À SIGNER : avenant, décompte de restitution, cautionnement.
// Même parcours que l'état des lieux :
//   brouillon  : le bailleur (rédacteur) prépare le contenu
//   a_valider  : envoyé et signé par le rédacteur ; les autres signent
//   signe      : toutes les signatures sont là
//   genere     : document verrouillé
// Le garant d'un cautionnement signe sans compte, via un lien à usage unique.
// ================================================

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE = process.env.FRONTEND_URL || 'https://www.werdhe.com';
const STATUTS_RESA = {
  bail: ['caution_payee', 'bail_en_cours'],
  avenant: ['confirmee', 'terminee'],
  decompte: ['confirmee', 'terminee'],
  cautionnement: ['acceptee', 'caution_requise', 'caution_payee', 'bail_en_cours', 'bail_signe_proprio', 'confirmee']
};

const SQL_ACTE = `SELECT a.*,
    r.locataire_id, r.statut AS resa_statut, r.date_debut, r.date_fin, r.montant_total, r.duree_mois,
    l.id AS logement_pk, l.proprietaire_id, l.titre AS logement_titre, l.adresse, l.ville,
    l.superficie, l.nb_chambres, l.nb_salles_bain, l.categorie, l.quartier, l.parking, l.jardin, l.climatisation, l.gardien,
    u_prop.nom AS prop_nom, u_prop.prenom AS prop_prenom, u_prop.email AS prop_email, u_prop.telephone AS prop_tel,
    u_loc.nom AS loc_nom, u_loc.prenom AS loc_prenom, u_loc.email AS loc_email, u_loc.telephone AS loc_tel
  FROM actes a
  JOIN reservations r ON r.id = a.reservation_id
  JOIN logements l ON l.id = r.logement_id
  JOIN users u_prop ON u_prop.id = l.proprietaire_id
  JOIN users u_loc ON u_loc.id = r.locataire_id`;

const SQL_RESERVATION = `SELECT r.*, l.id AS logement_pk, l.proprietaire_id, l.titre AS logement_titre, l.adresse, l.ville,
    l.superficie, l.nb_chambres, l.nb_salles_bain, l.categorie, l.quartier, l.parking, l.jardin, l.climatisation, l.gardien,
    u_prop.nom AS prop_nom, u_prop.prenom AS prop_prenom, u_prop.email AS prop_email, u_prop.telephone AS prop_tel,
    u_loc.nom AS loc_nom, u_loc.prenom AS loc_prenom, u_loc.email AS loc_email, u_loc.telephone AS loc_tel
  FROM reservations r
  JOIN logements l ON l.id = r.logement_id
  JOIN users u_prop ON u_prop.id = l.proprietaire_id
  JOIN users u_loc ON u_loc.id = r.locataire_id
  WHERE r.id = $1`;

const limiteurPublic = rateLimit({
  windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false,
  message: { erreur: 'Trop de tentatives, réessayez dans quelques minutes' }
});

function roleDe(a, userId) {
  if (userId === a.locataire_id) return 'locataire';
  if (userId === a.proprietaire_id) return 'proprietaire';
  return null;
}

function droitsDe(a, userId) {
  const role = roleDe(a, userId);
  const redacteur = a.redacteur_id === userId;
  const st = a.statut;
  const attendu = (a.signataires || []).indexOf(role) !== -1;
  return {
    modifier: redacteur && st === 'brouillon',
    envoyer: redacteur && st === 'brouillon',
    retirer: redacteur && st === 'a_valider',
    signer: !redacteur && st === 'a_valider' && attendu && !(a.signatures || {})[role],
    corriger: !redacteur && st === 'a_valider',
    generer: redacteur && st === 'signe',
    // Un bail signé par les deux parties active la location : il ne s'abandonne plus.
    annuler: redacteur && (a.type === 'bail' ? ['brouillon', 'a_valider'] : ['brouillon', 'a_valider', 'signe']).includes(st),
    telecharger: st === 'genere' && !!a.document_id,
    renvoyer_lien: redacteur && a.type === 'cautionnement' && st === 'a_valider' && !(a.signatures || {}).garant
  };
}

function vue(a, userId) {
  const g = a.garant || {};
  return {
    id: a.id, type: a.type, reservation_id: a.reservation_id, statut: a.statut, version: a.version,
    logement: { titre: a.logement_titre, adresse: a.adresse, ville: a.ville },
    ma_role: roleDe(a, userId),
    redacteur: { role: 'proprietaire', nom: a.prop_prenom + ' ' + a.prop_nom },
    locataire: { nom: a.loc_prenom + ' ' + a.loc_nom },
    donnees: a.donnees, signataires: a.signataires, signatures: a.signatures || {},
    corrections: a.corrections || [],
    garant_lien: a.type === 'cautionnement' ? { envoye_at: g.lien_envoye_at || null, expire_at: g.token_expire_at || null, signe: !!(a.signatures || {}).garant } : null,
    mention_attendue: a.type === 'cautionnement' ? A.mentionAttendue(a.donnees) : null,
    document_id: a.document_id, genere_at: a.genere_at, created_at: a.created_at,
    droits: droitsDe(a, userId)
  };
}

async function charger(req, res) {
  if (!UUID.test(String(req.params.id || ''))) { res.status(404).json({ erreur: 'Acte non trouvé' }); return null; }
  const r = await db.query(SQL_ACTE + ' WHERE a.id = $1', [req.params.id]);
  if (r.rows.length === 0 || !roleDe(r.rows[0], req.user.id)) { res.status(404).json({ erreur: 'Acte non trouvé' }); return null; }
  return r.rows[0];
}

async function alerter(a, destinataireId, titre, description) {
  if (!destinataireId) return;
  try {
    await db.query(
      `INSERT INTO alertes (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
       VALUES ($1, $2, $3, 'autre', $4, $5, 'haute')`,
      [a.proprietaire_id, destinataireId, a.logement_pk, titre, description]
    );
  } catch (err) { console.warn('[actes] alerte non créée:', err.message); }
}

const LIBELLE = { avenant: 'Avenant au bail', decompte: 'Décompte de restitution', cautionnement: 'Acte de cautionnement', bail: 'Contrat de bail' };

function paramsDocument(a, extra) {
  return Object.assign({
    type: A.TYPES[a.type].doc, reservation_id: a.reservation_id,
    logement: { id: a.logement_pk, titre: a.logement_titre, adresse: a.adresse, ville: a.ville, superficie: a.superficie, nb_chambres: a.nb_chambres, nb_salles_bain: a.nb_salles_bain,
      categorie: a.categorie, quartier: a.quartier, parking: a.parking, jardin: a.jardin, climatisation: a.climatisation, gardien: a.gardien },
    proprietaire: { id: a.proprietaire_id, nom: a.prop_nom, prenom: a.prop_prenom, email: a.prop_email, telephone: a.prop_tel },
    locataire: { id: a.locataire_id, nom: a.loc_nom, prenom: a.loc_prenom, email: a.loc_email, telephone: a.loc_tel },
    acte: { type: a.type, donnees: a.donnees, signatures: a.signatures || {}, signataires: a.signataires },
    envoyer_email: false
  }, extra || {});
}

// Le bail signé reste consigné dans signatures_bail (preuve historique lue par d'autres parties du code).
async function consignerSignatureBail(a, role, userId, sig, ip) {
  try {
    await db.query(
      `INSERT INTO signatures_bail (reservation_id, signataire_id, role, nom_complet, ip_adresse, user_agent, hash_signature)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [a.reservation_id, userId, role, sig.nom_complet, ip || '', 'acte-bail', sig.hash]
    );
  } catch (err) { console.warn('[bail] signatures_bail non écrite:', err.message); }
}

function erreurMetier(res, err) { return res.status(400).json({ erreur: err.message }); }

// Ajoute une signature de façon atomique (deux signataires peuvent signer en même
// temps) et passe l'acte à « signé » quand toutes les signatures sont là.
async function ajouterSignature(acteId, role, fabriquerSignature) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT * FROM actes WHERE id = $1 FOR UPDATE', [acteId]);
    const a = r.rows[0];
    if (!a || a.statut !== 'a_valider') { await client.query('ROLLBACK'); return { erreur: 409, message: 'Cet acte n\'attend plus de signature' }; }
    if ((a.signataires || []).indexOf(role) === -1) { await client.query('ROLLBACK'); return { erreur: 403, message: 'Signature non attendue' }; }
    if ((a.signatures || {})[role]) { await client.query('ROLLBACK'); return { erreur: 409, message: 'Déjà signé' }; }
    const sig = fabriquerSignature(a);
    const signatures = Object.assign({}, a.signatures, { [role]: sig });
    const complet = A.toutesSignatures({ signataires: a.signataires, signatures: signatures });
    const garant = role === 'garant' && a.garant ? Object.assign({}, a.garant, { token_hash: null, signe_at: sig.signe_at }) : a.garant;
    await client.query(
      `UPDATE actes SET signatures = $2, statut = $3, garant = $4, updated_at = NOW() WHERE id = $1`,
      [acteId, JSON.stringify(signatures), complet ? 'signe' : 'a_valider', garant ? JSON.stringify(garant) : null]
    );
    await client.query('COMMIT');
    return { ok: true, complet: complet };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (x) { /* déjà annulé */ }
    throw err;
  } finally { client.release(); }
}

async function envoyerLienGarant(a, jeton) {
  const g = (a.donnees || {}).garant || {};
  if (!process.env.RESEND_API_KEY || !g.email) return false;
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const lien = SITE + '/signer/' + jeton;
    const envoi = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
      to: g.email,
      subject: 'Votre signature est demandée : acte de cautionnement · ' + a.logement_titre,
      html: '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">' +
        '<p>Bonjour' + (g.nom ? ' <b>' + esc(g.nom) + '</b>' : '') + ',</p>' +
        '<p><b>' + esc(a.prop_prenom + ' ' + a.prop_nom) + '</b> vous demande de vous porter caution pour <b>' + esc(a.loc_prenom + ' ' + a.loc_nom) + '</b>, locataire de <b>' + esc(a.logement_titre) + '</b>.</p>' +
        '<p>Relisez l\'acte puis signez en ligne, sans créer de compte. Le lien est personnel, à usage unique et valable 14 jours.</p>' +
        '<p><a href="' + esc(lien) + '" style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Lire et signer l\'acte →</a></p>' +
        '<p style="font-size:12px;color:#888">Si vous ne connaissez pas cette personne, ignorez ce message : rien ne sera signé sans votre action.</p></div>'
    });
    if (envoi && envoi.error) throw new Error(envoi.error.message);
    return true;
  } catch (err) {
    console.warn('[actes] lien du garant non envoyé:', err.message);
    return false;
  }
}

// ─── LISTE POUR UNE LOCATION + CE QU'ON PEUT CRÉER ───────────────
router.get('/reservation/:reservation_id', verifierToken, async (req, res) => {
  try {
    const rid = req.params.reservation_id;
    if (!UUID.test(String(rid))) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    const resa = await db.query(SQL_RESERVATION, [rid]);
    if (resa.rows.length === 0) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    const r = resa.rows[0];
    const role = r.locataire_id === req.user.id ? 'locataire' : (r.proprietaire_id === req.user.id ? 'proprietaire' : null);
    if (!role) return res.status(403).json({ erreur: 'Non autorisé' });

    const liste = await db.query(SQL_ACTE + ` WHERE a.reservation_id = $1 AND a.statut <> 'annule' ORDER BY a.created_at DESC`, [rid]);
    const actes = liste.rows.map(function (a) { return vue(a, req.user.id); });

    let suggestions = { avenants: [], decompte: null, cautionnement: false, bail: false };
    if (role === 'proprietaire') {
      const dejaAvenant = new Set(actes.filter(function (x) { return x.type === 'avenant'; }).map(function (x) { return x.donnees.renouvellement_id; }));
      if (STATUTS_RESA.avenant.includes(r.statut)) {
        const rn = await db.query(
          `SELECT id, nouvelle_duree_mois, nouveau_prix, updated_at FROM renouvellements_bail WHERE reservation_id = $1 AND statut = 'accepte' ORDER BY updated_at DESC`, [rid]);
        suggestions.avenants = rn.rows.filter(function (x) { return !dejaAvenant.has(x.id); });
      }
      if (STATUTS_RESA.decompte.includes(r.statut) && !actes.some(function (x) { return x.type === 'decompte'; })) {
        const edl = await db.query(`SELECT id FROM etats_des_lieux WHERE reservation_id = $1 AND type = 'sortie' AND statut = 'genere'`, [rid]);
        if (edl.rows.length) suggestions.decompte = { edl_id: edl.rows[0].id };
      }
      suggestions.cautionnement = STATUTS_RESA.cautionnement.includes(r.statut);
      suggestions.bail = STATUTS_RESA.bail.includes(r.statut) && !actes.some(function (x) { return x.type === 'bail'; });
    }
    res.json({ actes: actes, suggestions: suggestions, logement: { titre: r.logement_titre }, ma_role: role });
  } catch (err) {
    console.error('[GET /actes/reservation]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── GARANT : PAGE PUBLIQUE (sans compte, lien à usage unique) ───
async function acteDuJeton(jeton) {
  const r = await db.query(
    SQL_ACTE + ` WHERE a.garant ->> 'token_hash' = $1 AND a.type = 'cautionnement' AND a.statut = 'a_valider'`,
    [A.hashJeton(jeton)]
  );
  const a = r.rows[0];
  if (!a || !a.garant || new Date(a.garant.token_expire_at) < new Date() || (a.signatures || {}).garant) return null;
  return a;
}

router.get('/public/:jeton', limiteurPublic, async (req, res) => {
  try {
    const a = await acteDuJeton(String(req.params.jeton || '').slice(0, 100));
    if (!a) return res.status(404).json({ erreur: 'Ce lien est invalide, expiré ou déjà utilisé' });
    res.json({
      logement: { titre: a.logement_titre, adresse: a.adresse, ville: a.ville },
      bailleur: a.prop_prenom + ' ' + a.prop_nom, locataire: a.loc_prenom + ' ' + a.loc_nom,
      donnees: { nature: a.donnees.nature, montant_max: a.donnees.montant_max, duree_mois: a.donnees.duree_mois, lien: a.donnees.lien, garant: { nom: (a.donnees.garant || {}).nom || '' } },
      mention_attendue: A.mentionAttendue(a.donnees),
      expire_at: a.garant.token_expire_at,
      apercu_html: apercuDocument(paramsDocument(a))
    });
  } catch (err) {
    console.error('[GET /actes/public]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.post('/public/:jeton/signer', limiteurPublic, async (req, res) => {
  try {
    const a = await acteDuJeton(String(req.params.jeton || '').slice(0, 100));
    if (!a) return res.status(404).json({ erreur: 'Ce lien est invalide, expiré ou déjà utilisé' });
    const b = req.body || {};
    let identite;
    try { identite = A.identiteGarant(b.identite); } catch (err) { return erreurMetier(res, err); }
    if (!A.mentionValide(b.mention, a.donnees)) return res.status(400).json({ erreur: 'Recopiez exactement la mention manuscrite affichée' });

    const resultat = await ajouterSignature(a.id, 'garant', function (acte) {
      const sig = E.validerSignature(b.signature, { prenom: '', nom: identite.nom }, req.ip, 'garant',
        A.empreinteActe(acte, 'garant', { identite: identite, mention: A.mentionAttendue(acte.donnees) }));
      sig.identite = identite;
      sig.mention = A.mentionAttendue(acte.donnees);
      return sig;
    }).catch(function (err) { return { erreur: 400, message: err.message }; });
    if (!resultat.ok) return res.status(resultat.erreur).json({ erreur: resultat.message });

    await alerter(a, a.proprietaire_id, 'Le garant a signé · ' + a.logement_titre, identite.nom + ' a signé l\'acte de cautionnement.' + (resultat.complet ? ' Vous pouvez générer le document final.' : ''));
    await alerter(a, a.locataire_id, 'Le garant a signé · ' + a.logement_titre, identite.nom + ' a signé l\'acte de cautionnement.');
    res.json({ message: 'Signature enregistrée. Merci.' });
  } catch (err) {
    console.error('[POST /actes/public/signer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── MON IDENTITÉ (préremplit les formulaires de bail) ───────────
router.get('/identite', verifierToken, async (req, res) => {
  try {
    const r = await db.query('SELECT identite FROM public.users WHERE id = $1', [req.user.id]);
    res.json({ identite: (r.rows[0] && r.rows[0].identite) || null });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DÉTAIL ET APERÇU ────────────────────────────────────────────
router.get('/:id', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    res.json({ acte: vue(a, req.user.id) });
  } catch (err) {
    console.error('[GET /actes/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.get('/:id/apercu', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    res.json({ html: apercuDocument(paramsDocument(a)) });
  } catch (err) {
    console.error('[GET /actes/:id/apercu]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── CRÉER (brouillon, bailleur) ─────────────────────────────────
router.post('/', verifierToken, async (req, res) => {
  try {
    const { reservation_id, type, source_id } = req.body || {};
    if (!A.TYPES[type]) return res.status(400).json({ erreur: 'Type d\'acte inconnu' });
    if (!UUID.test(String(reservation_id || ''))) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    const resa = await db.query(SQL_RESERVATION, [reservation_id]);
    if (resa.rows.length === 0) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    const r = resa.rows[0];
    if (r.locataire_id !== req.user.id && r.proprietaire_id !== req.user.id) return res.status(403).json({ erreur: 'Non autorisé' });
    if (r.proprietaire_id !== req.user.id) return res.status(403).json({ erreur: 'Seul le bailleur prépare cet acte' });
    if (!STATUTS_RESA[type].includes(r.statut)) return res.status(409).json({ erreur: 'Cet acte n\'est pas possible à cette étape de la location' });

    let donnees, source = null;
    if (type === 'avenant') {
      if (!UUID.test(String(source_id || ''))) return res.status(400).json({ erreur: 'Choisissez le renouvellement concerné' });
      const rn = await db.query(`SELECT * FROM renouvellements_bail WHERE id = $1 AND reservation_id = $2`, [source_id, reservation_id]);
      if (rn.rows.length === 0) return res.status(404).json({ erreur: 'Renouvellement non trouvé' });
      if (rn.rows[0].statut !== 'accepte') return res.status(409).json({ erreur: 'Seul un renouvellement accepté donne lieu à un avenant' });
      const histo = await db.query(
        `SELECT *, CASE WHEN proposeur_id = $2 THEN 'proprietaire' ELSE 'locataire' END AS par
         FROM renouvellements_bail WHERE reservation_id = $1 AND statut IN ('accepte', 'contre_propose') ORDER BY created_at`,
        [reservation_id, r.proprietaire_id]);
      donnees = A.donneesAvenant(rn.rows[0], r, histo.rows);
      source = rn.rows[0].id;
    } else if (type === 'decompte') {
      const edl = await db.query(`SELECT id, grille FROM etats_des_lieux WHERE reservation_id = $1 AND type = 'sortie' AND statut = 'genere'`, [reservation_id]);
      if (edl.rows.length === 0) return res.status(409).json({ erreur: 'Le décompte s\'appuie sur l\'état des lieux de sortie : générez-le d\'abord' });
      donnees = A.donneesDecompte(r.montant_total, edl.rows[0]);
      source = edl.rows[0].id;
    } else if (type === 'bail') {
      const prof = await db.query('SELECT identite FROM public.users WHERE id = $1', [req.user.id]);
      donnees = A.donneesBail(r, prof.rows[0] && prof.rows[0].identite);
      source = r.id; // un seul bail actif par location (index unique type + source)
    } else {
      donnees = A.donneesCautionnement(r);
    }

    let id;
    try {
      const ins = await db.query(
        `INSERT INTO actes (type, reservation_id, logement_id, redacteur_id, source_id, statut, donnees, signataires)
         VALUES ($1, $2, $3, $4, $5, 'brouillon', $6, $7) RETURNING id`,
        [type, reservation_id, r.logement_pk, req.user.id, source, JSON.stringify(donnees), JSON.stringify(A.TYPES[type].signataires)]
      );
      id = ins.rows[0].id;
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ erreur: 'Cet acte existe déjà pour cette origine' });
      throw e;
    }
    // Le bail en préparation fait passer la location à « bail en cours ».
    if (type === 'bail' && r.statut === 'caution_payee') {
      await db.query(`UPDATE reservations SET statut = 'bail_en_cours', updated_at = NOW() WHERE id = $1`, [r.id]);
    }
    const a = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [id])).rows[0];
    res.status(201).json({ acte: vue(a, req.user.id) });
  } catch (err) {
    console.error('[POST /actes]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── MODIFIER LE BROUILLON ───────────────────────────────────────
router.put('/:id', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    if (!droitsDe(a, req.user.id).modifier) return res.status(403).json({ erreur: 'Cet acte n\'est plus modifiable' });
    const b = req.body || {};
    if (parseInt(b.version, 10) !== a.version) return res.status(409).json({ erreur: 'L\'acte a changé, rechargez la page', version: a.version });
    let donnees;
    try { donnees = A.normaliserDonnees(a.type, b.donnees, a.donnees); } catch (err) { return erreurMetier(res, err); }
    const maj = await db.query(
      `UPDATE actes SET donnees = $2, version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $3 AND statut = 'brouillon' RETURNING id`,
      [a.id, JSON.stringify(donnees), a.version]
    );
    if (maj.rows.length === 0) return res.status(409).json({ erreur: 'L\'acte a changé, rechargez la page' });
    const frais = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [a.id])).rows[0];
    res.json({ acte: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[PUT /actes/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── ENVOYER À SIGNATURE (le rédacteur signe) ────────────────────
router.post('/:id/envoyer', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    if (!droitsDe(a, req.user.id).envoyer) return res.status(403).json({ erreur: 'Envoi impossible à cette étape' });
    const manque = A.erreurAvantEnvoi(a.type, a.donnees);
    if (manque) return res.status(400).json({ erreur: manque });

    let sig;
    try { sig = E.validerSignature(req.body && req.body.signature, { prenom: a.prop_prenom, nom: a.prop_nom }, req.ip, 'proprietaire', A.empreinteActe(a, 'proprietaire')); }
    catch (err) { return erreurMetier(res, err); }

    let garant = null, jeton = null;
    if (a.type === 'cautionnement') {
      const j = A.nouveauJeton(); jeton = j.jeton;
      garant = { token_hash: j.hash, token_expire_at: j.expire, lien_envoye_at: new Date().toISOString() };
    }
    const maj = await db.query(
      `UPDATE actes SET statut = 'a_valider', signatures = $2, garant = $3, updated_at = NOW()
       WHERE id = $1 AND statut = 'brouillon' AND version = $4 RETURNING id`,
      [a.id, JSON.stringify({ proprietaire: sig }), garant ? JSON.stringify(garant) : null, a.version]
    );
    if (maj.rows.length === 0) return res.status(409).json({ erreur: 'L\'acte a changé, rechargez la page' });

    await alerter(a, a.locataire_id, LIBELLE[a.type] + ' à signer · ' + a.logement_titre,
      a.prop_prenom + ' ' + a.prop_nom + ' a préparé et signé ce document. Relisez-le puis signez.');
    if (a.type === 'bail') {
      // Le bailleur a signé : la location passe à « bail signé par le propriétaire »,
      // et son identité est conservée pour les prochains baux.
      await db.query(`UPDATE reservations SET statut = 'bail_signe_proprio', updated_at = NOW() WHERE id = $1`, [a.reservation_id]);
      await db.query('UPDATE public.users SET identite = $2 WHERE id = $1', [req.user.id, JSON.stringify(a.donnees.identite_proprietaire || {})]).catch(function () {});
      await consignerSignatureBail(a, 'proprietaire', req.user.id, sig, req.ip);
    }
    let lienEnvoye = false;
    if (jeton) lienEnvoye = await envoyerLienGarant(a, jeton);

    const frais = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [a.id])).rows[0];
    res.json({ acte: vue(frais, req.user.id), lien_garant: jeton ? SITE + '/signer/' + jeton : null, lien_garant_envoye: lienEnvoye });
  } catch (err) {
    console.error('[POST /actes/:id/envoyer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── RENVOYER LE LIEN AU GARANT (nouveau lien, l'ancien ne sert plus) ─
router.post('/:id/garant/renvoyer', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    if (!droitsDe(a, req.user.id).renvoyer_lien) return res.status(403).json({ erreur: 'Action impossible à cette étape' });
    const b = req.body || {};
    let donnees = a.donnees;
    if (b.email !== undefined) {
      try { donnees = A.normaliserDonnees(a.type, { garant: Object.assign({}, a.donnees.garant, { email: b.email }) }, a.donnees); }
      catch (err) { return erreurMetier(res, err); }
    }
    const j = A.nouveauJeton();
    await db.query(
      `UPDATE actes SET donnees = $2, garant = $3, updated_at = NOW() WHERE id = $1 AND statut = 'a_valider'`,
      [a.id, JSON.stringify(donnees), JSON.stringify({ token_hash: j.hash, token_expire_at: j.expire, lien_envoye_at: new Date().toISOString() })]
    );
    const envoye = await envoyerLienGarant(Object.assign({}, a, { donnees: donnees }), j.jeton);
    const frais = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [a.id])).rows[0];
    res.json({ acte: vue(frais, req.user.id), lien_garant: SITE + '/signer/' + j.jeton, lien_garant_envoye: envoye });
  } catch (err) {
    console.error('[POST /actes/:id/garant/renvoyer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── RETIRER / CORRIGER : retour en brouillon, signatures effacées ─
async function retourBrouillon(a, correction) {
  await db.query(
    `UPDATE actes SET statut = 'brouillon', signatures = '{}'::jsonb, garant = NULL,
       corrections = COALESCE(corrections, '[]'::jsonb) || $2::jsonb, version = version + 1, updated_at = NOW()
     WHERE id = $1 AND statut = 'a_valider'`,
    [a.id, JSON.stringify(correction ? [correction] : [])]
  );
  if (a.type === 'bail') {
    await db.query(`UPDATE reservations SET statut = 'bail_en_cours', updated_at = NOW() WHERE id = $1 AND statut = 'bail_signe_proprio'`, [a.reservation_id]);
    await db.query(`DELETE FROM signatures_bail WHERE reservation_id = $1 AND user_agent = 'acte-bail'`, [a.reservation_id]).catch(function () {});
  }
}

router.post('/:id/retirer', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    if (!droitsDe(a, req.user.id).retirer) return res.status(403).json({ erreur: 'Action impossible à cette étape' });
    await retourBrouillon(a, null);
    const frais = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [a.id])).rows[0];
    res.json({ acte: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /actes/:id/retirer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.post('/:id/corriger', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    if (!droitsDe(a, req.user.id).corriger) return res.status(403).json({ erreur: 'Action impossible à cette étape' });
    const motif = E.propre(req.body && req.body.motif, 300);
    if (motif.length < 3) return res.status(400).json({ erreur: 'Indiquez ce qu\'il faut corriger' });
    await retourBrouillon(a, { par: req.user.id, role: roleDe(a, req.user.id), motif: motif, at: new Date().toISOString() });
    await alerter(a, a.redacteur_id, 'Correction demandée · ' + LIBELLE[a.type] + ' · ' + a.logement_titre, motif);
    const frais = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [a.id])).rows[0];
    res.json({ acte: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /actes/:id/corriger]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── SIGNER (l'autre partie, depuis son compte) ──────────────────
router.post('/:id/signer', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    if (!droitsDe(a, req.user.id).signer) return res.status(403).json({ erreur: 'Signature impossible à cette étape' });
    const role = roleDe(a, req.user.id);
    const utilisateur = role === 'proprietaire' ? { prenom: a.prop_prenom, nom: a.prop_nom } : { prenom: a.loc_prenom, nom: a.loc_nom };

    // Bail : le locataire renseigne son identité (elle fait partie de ce qu'il signe).
    let identite = null;
    if (a.type === 'bail' && role === 'locataire') {
      try { identite = A.identiteGarant(Object.assign({}, (req.body && req.body.identite) || {}, { nom: a.loc_prenom + ' ' + a.loc_nom })); }
      catch (err) { return erreurMetier(res, err); }
    }

    let sigPosee = null;
    const resultat = await ajouterSignature(a.id, role, function (acte) {
      const sig = E.validerSignature(req.body && req.body.signature, utilisateur, req.ip, role, A.empreinteActe(acte, role, identite ? { identite: identite } : null));
      if (identite) sig.identite = identite;
      sigPosee = sig;
      return sig;
    }).catch(function (err) { return { erreur: 400, message: err.message }; });
    if (!resultat.ok) return res.status(resultat.erreur).json({ erreur: resultat.message });

    if (a.type === 'bail') {
      // Dernière signature du bail : la location est confirmée, puis le document est généré.
      const prof = Object.assign({}, identite); delete prof.nom;
      await db.query('UPDATE public.users SET identite = $2 WHERE id = $1', [req.user.id, JSON.stringify(prof)]).catch(function () {});
      await consignerSignatureBail(a, 'locataire', req.user.id, sigPosee, req.ip);
      if (resultat.complet) {
        await activerLocation({ id: a.reservation_id, locataire_id: a.locataire_id, logement_id: a.logement_pk });
        await alerter(a, a.redacteur_id, 'Bail signé : location confirmée · ' + a.logement_titre,
          a.loc_prenom + ' ' + a.loc_nom + ' a signé le bail. La location est active.');
        const gen = await genererActe(a.id, a.redacteur_id, req.ip);
        if (!gen.ok) console.warn('[bail] génération automatique différée:', gen.erreur);
      }
    } else {
      await alerter(a, a.redacteur_id, LIBELLE[a.type] + ' signé · ' + a.logement_titre,
        a.loc_prenom + ' ' + a.loc_nom + ' a signé.' + (resultat.complet ? ' Toutes les signatures sont là : générez le document final.' : ''));
    }
    const frais = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [a.id])).rows[0];
    res.json({ acte: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /actes/:id/signer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── GÉNÉRER LE DOCUMENT FINAL (verrouillé) ──────────────────────
// Logique partagée entre la route et la génération automatique du bail.
async function genererActe(acteId, userId, ip) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const verrou = await client.query('SELECT id FROM actes WHERE id = $1 FOR UPDATE', [UUID.test(String(acteId || '')) ? acteId : '00000000-0000-0000-0000-000000000000']);
    const a = verrou.rows.length ? (await client.query(SQL_ACTE + ' WHERE a.id = $1', [acteId])).rows[0] : null;
    if (!a || !roleDe(a, userId)) { await client.query('ROLLBACK'); return { status: 404, erreur: 'Acte non trouvé' }; }
    if (!droitsDe(a, userId).generer) { await client.query('ROLLBACK'); return { status: 403, erreur: 'Génération impossible à cette étape' }; }
    if (!A.toutesSignatures(a)) { await client.query('ROLLBACK'); return { status: 409, erreur: 'Toutes les signatures sont nécessaires' }; }

    // Chaque signature doit porter sur le contenu actuel.
    for (const role of a.signataires) {
      const s = a.signatures[role];
      const extra = role === 'garant' ? { identite: s.identite, mention: s.mention } : (s.identite ? { identite: s.identite } : null);
      if (s.hash !== A.empreinteActe(a, role, extra)) {
        await client.query('ROLLBACK');
        return { status: 409, erreur: 'Le contenu a changé depuis les signatures : elles doivent être refaites' };
      }
    }

    const gen = await genererDocument(paramsDocument(a, { auteur_id: userId }));
    if (!gen.success) { await client.query('ROLLBACK'); return { status: 500, erreur: 'Le document n\'a pas pu être généré, réessayez' }; }
    await client.query(`UPDATE actes SET statut = 'genere', document_id = $2, genere_at = NOW(), updated_at = NOW() WHERE id = $1`, [a.id, gen.document.id]);
    await client.query('COMMIT');

    // Envoi du document aux autres parties (non bloquant)
    const destinataires = [{ email: a.loc_email, prenom: a.loc_prenom }];
    if (a.type === 'bail') destinataires.push({ email: a.prop_email, prenom: a.prop_prenom });
    const garantEmail = ((a.donnees || {}).garant || {}).email;
    if (a.type === 'cautionnement' && garantEmail) destinataires.push({ email: garantEmail, prenom: (a.signatures.garant.identite || {}).nom || '' });
    for (const d of destinataires) {
      try {
        const envoye = await envoyerEmailDocument({ email: d.email, prenom: d.prenom, typeDocument: gen.document.type, numeroDocument: gen.numero, htmlDocument: gen.document.contenu_html, nomFichier: gen.numero + '.html' });
        if (envoye !== false) {
          await db.query('UPDATE documents SET email_envoye = TRUE, email_envoye_at = NOW() WHERE id = $1', [gen.document.id]);
          await enregistrerEvenement(gen.document.id, 'envoye_email', userId, { destinataire: d.email }, ip);
        }
      } catch (mailErr) { console.warn('[actes] e-mail non envoyé:', mailErr.message); }
    }
    await alerter(a, a.locataire_id, LIBELLE[a.type] + ' finalisé · ' + a.logement_titre, 'Le document ' + gen.numero + ' est disponible dans vos documents.');

    const frais = (await db.query(SQL_ACTE + ' WHERE a.id = $1', [a.id])).rows[0];
    return { ok: true, acte: frais, numero: gen.numero };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (x) { /* déjà annulé */ }
    console.error('[actes] génération:', err.message);
    return { status: 500, erreur: 'Erreur serveur' };
  } finally { client.release(); }
}

router.post('/:id/generer', verifierToken, async (req, res) => {
  const r = await genererActe(req.params.id, req.user.id, req.ip);
  if (!r.ok) return res.status(r.status).json({ erreur: r.erreur });
  res.json({ acte: vue(r.acte, req.user.id), numero: r.numero });
});

// ─── ABANDONNER (avant génération) ───────────────────────────────
router.post('/:id/annuler', verifierToken, async (req, res) => {
  try {
    const a = await charger(req, res); if (!a) return;
    if (!droitsDe(a, req.user.id).annuler) return res.status(403).json({ erreur: 'Abandon impossible à cette étape' });
    await db.query(`UPDATE actes SET statut = 'annule', garant = NULL, updated_at = NOW() WHERE id = $1 AND statut IN ('brouillon','a_valider','signe')`, [a.id]);
    if (a.type === 'bail') {
      await db.query(`UPDATE reservations SET statut = 'caution_payee', updated_at = NOW() WHERE id = $1 AND statut IN ('bail_en_cours', 'bail_signe_proprio')`, [a.reservation_id]);
      await db.query(`DELETE FROM signatures_bail WHERE reservation_id = $1 AND user_agent = 'acte-bail'`, [a.reservation_id]).catch(function () {});
    }
    if (a.statut !== 'brouillon') await alerter(a, a.locataire_id, LIBELLE[a.type] + ' abandonné · ' + a.logement_titre, 'Le bailleur a abandonné ce document avant sa finalisation.');
    res.json({ message: 'Acte abandonné' });
  } catch (err) {
    console.error('[POST /actes/:id/annuler]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
