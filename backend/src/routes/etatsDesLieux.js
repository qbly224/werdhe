const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const db = require('../database');
const verifierToken = require('../middleware/auth');
const S = require('../services/etatDesLieuxService');
const { genererDocument, enregistrerEvenement } = require('../services/documentService');
const { envoyerEmailDocument } = require('../services/emailService');

// ================================================
// ÉTAT DES LIEUX : parcours en 4 étapes
//   brouillon  : le rédacteur remplit (grille, relevés, observations, photos)
//   a_valider  : envoyé et signé par le rédacteur ; l'autre partie relit
//   signe      : l'autre partie a signé (avec ses réserves éventuelles)
//   genere     : document verrouillé (PDF), plus aucune modification
// Chaque signature est posée par la personne connectée, depuis son compte.
// ================================================

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUTS_ENTREE = ['bail_en_cours', 'bail_signe_proprio', 'confirmee', 'terminee'];
const STATUTS_SORTIE = ['confirmee', 'terminee'];

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: function (req, file, cb) {
    ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true) : cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP'), false);
  }
});

const SQL_EDL = `SELECT e.*,
    r.locataire_id, r.statut AS resa_statut, r.date_debut, r.date_fin,
    l.id AS logement_pk, l.proprietaire_id, l.titre AS logement_titre, l.adresse, l.ville,
    l.superficie, l.nb_chambres, l.nb_salles_bain,
    u_prop.nom AS prop_nom, u_prop.prenom AS prop_prenom, u_prop.email AS prop_email, u_prop.telephone AS prop_tel,
    u_loc.nom AS loc_nom, u_loc.prenom AS loc_prenom, u_loc.email AS loc_email, u_loc.telephone AS loc_tel
  FROM etats_des_lieux e
  JOIN reservations r ON r.id = e.reservation_id
  JOIN logements l ON l.id = r.logement_id
  JOIN users u_prop ON u_prop.id = l.proprietaire_id
  JOIN users u_loc ON u_loc.id = r.locataire_id
  WHERE e.id = $1`;

const SQL_RESERVATION = `SELECT r.*, l.id AS logement_pk, l.proprietaire_id, l.titre AS logement_titre, l.adresse, l.ville,
    l.superficie, l.nb_chambres, l.nb_salles_bain
  FROM reservations r JOIN logements l ON l.id = r.logement_id WHERE r.id = $1`;

function roleDe(e, userId) {
  if (userId === e.locataire_id) return 'locataire';
  if (userId === e.proprietaire_id) return 'proprietaire';
  return null;
}

// Droits de l'utilisateur sur un état des lieux selon son étape.
function droitsDe(e, userId) {
  const estRedacteur = e.redacteur_id === userId;
  const st = e.statut;
  return {
    modifier: estRedacteur && st === 'brouillon',
    envoyer: estRedacteur && st === 'brouillon',
    retirer: estRedacteur && st === 'a_valider',
    signer: !estRedacteur && st === 'a_valider',
    corriger: !estRedacteur && st === 'a_valider',
    generer: estRedacteur && st === 'signe',
    annuler: estRedacteur && ['brouillon', 'a_valider', 'signe'].includes(st),
    telecharger: st === 'genere' && !!e.document_id
  };
}

function vue(e, userId) {
  const role = roleDe(e, userId);
  const autre = e.redacteur_id === e.proprietaire_id
    ? { role: 'locataire', nom: e.loc_prenom + ' ' + e.loc_nom }
    : { role: 'proprietaire', nom: e.prop_prenom + ' ' + e.prop_nom };
  const redacteur = e.redacteur_id === e.proprietaire_id
    ? { role: 'proprietaire', nom: e.prop_prenom + ' ' + e.prop_nom }
    : { role: 'locataire', nom: e.loc_prenom + ' ' + e.loc_nom };
  return {
    id: e.id, reservation_id: e.reservation_id, type: e.type, statut: e.statut, version: e.version,
    logement: { titre: e.logement_titre, adresse: e.adresse, ville: e.ville },
    ma_role: role, redacteur: redacteur, autre_partie: autre,
    grille: e.grille, releves: e.releves,
    observations_generales: e.observations_generales || '', reserves: e.reserves || '',
    photos: e.photos || [],
    signature_redacteur: e.signature_redacteur, signature_autre: e.signature_autre,
    corrections: e.corrections || [],
    degradations: S.degradations(e.grille).map(function (it) { return it.id; }),
    avec_comparaison: (e.grille || []).some(function (it) { return it.entree; }),
    document_id: e.document_id, genere_at: e.genere_at, created_at: e.created_at, updated_at: e.updated_at,
    droits: droitsDe(e, userId)
  };
}

// Charge l'état des lieux et vérifie que l'utilisateur est l'une des deux parties.
async function charger(req, res) {
  if (!UUID.test(String(req.params.id || ''))) { res.status(404).json({ erreur: 'État des lieux non trouvé' }); return null; }
  const r = await db.query(SQL_EDL, [req.params.id]);
  if (r.rows.length === 0 || !roleDe(r.rows[0], req.user.id)) {
    res.status(404).json({ erreur: 'État des lieux non trouvé' });
    return null;
  }
  return r.rows[0];
}

async function alerter(e, destinataireId, titre, description) {
  try {
    await db.query(
      `INSERT INTO alertes (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
       VALUES ($1, $2, $3, 'autre', $4, $5, 'haute')`,
      [e.proprietaire_id, destinataireId, e.logement_pk, titre, description]
    );
  } catch (err) {
    console.warn('[EDL] alerte non créée:', err.message);
  }
}

function autreId(e, userId) {
  return userId === e.proprietaire_id ? e.locataire_id : e.proprietaire_id;
}

function libelleType(type) { return type === 'sortie' ? 'de sortie' : 'd\'entrée'; }

function ip(req) { return req.ip || null; }

function erreurMetier(res, err) {
  // Les erreurs de validation du service sont destinées à l'utilisateur.
  return res.status(400).json({ erreur: err.message });
}

// ─── LISTE POUR UNE LOCATION ─────────────────────────────────────
router.get('/reservation/:reservation_id', verifierToken, async (req, res) => {
  try {
    const rid = req.params.reservation_id;
    if (!UUID.test(String(rid))) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    const resa = await db.query(SQL_RESERVATION, [rid]);
    if (resa.rows.length === 0) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    const r = resa.rows[0];
    if (r.locataire_id !== req.user.id && r.proprietaire_id !== req.user.id) return res.status(403).json({ erreur: 'Non autorisé' });

    const liste = await db.query(
      `SELECT id FROM etats_des_lieux WHERE reservation_id = $1 AND statut <> 'annule' ORDER BY created_at`, [rid]
    );
    const etats = [];
    for (const row of liste.rows) {
      const e = (await db.query(SQL_EDL, [row.id])).rows[0];
      if (e) etats.push(vue(e, req.user.id));
    }
    const existe = function (type) { return etats.some(function (x) { return x.type === type; }); };
    res.json({
      etats: etats,
      logement: { titre: r.logement_titre, adresse: r.adresse, ville: r.ville },
      peut_creer: {
        entree: !existe('entree') && STATUTS_ENTREE.includes(r.statut),
        sortie: !existe('sortie') && STATUTS_SORTIE.includes(r.statut)
      }
    });
  } catch (err) {
    console.error('[GET /etats-des-lieux/reservation]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DÉTAIL ──────────────────────────────────────────────────────
router.get('/:id', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    res.json({ etat: vue(e, req.user.id) });
  } catch (err) {
    console.error('[GET /etats-des-lieux/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── CRÉER (brouillon) ───────────────────────────────────────────
router.post('/', verifierToken, async (req, res) => {
  try {
    const { reservation_id } = req.body || {};
    const type = req.body && req.body.type === 'sortie' ? 'sortie' : 'entree';
    if (!UUID.test(String(reservation_id || ''))) return res.status(404).json({ erreur: 'Réservation non trouvée' });

    const resa = await db.query(SQL_RESERVATION, [reservation_id]);
    if (resa.rows.length === 0) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    const r = resa.rows[0];
    if (r.locataire_id !== req.user.id && r.proprietaire_id !== req.user.id) return res.status(403).json({ erreur: 'Non autorisé' });
    if (!(type === 'sortie' ? STATUTS_SORTIE : STATUTS_ENTREE).includes(r.statut)) {
      return res.status(409).json({ erreur: type === 'sortie'
        ? 'L\'état des lieux de sortie se fait une fois la location active'
        : 'L\'état des lieux d\'entrée se fait à partir de la signature du bail' });
    }

    const existant = await db.query(
      `SELECT id FROM etats_des_lieux WHERE reservation_id = $1 AND type = $2 AND statut <> 'annule'`, [reservation_id, type]
    );
    if (existant.rows.length) return res.status(409).json({ erreur: 'Un état des lieux ' + libelleType(type) + ' existe déjà pour cette location', id: existant.rows[0].id });

    // Sortie : on repart des lignes de l'entrée généré pour pouvoir comparer.
    let grille = S.genererGrille(r), entreeId = null;
    if (type === 'sortie') {
      const entree = await db.query(
        `SELECT id, grille FROM etats_des_lieux WHERE reservation_id = $1 AND type = 'entree' AND statut = 'genere'`, [reservation_id]
      );
      if (entree.rows.length) { grille = S.grilleDepuisEntree(entree.rows[0].grille); entreeId = entree.rows[0].id; }
    }

    let id;
    try {
      const ins = await db.query(
        `INSERT INTO etats_des_lieux (reservation_id, logement_id, type, redacteur_id, statut, grille, entree_id)
         VALUES ($1, $2, $3, $4, 'brouillon', $5, $6) RETURNING id`,
        [reservation_id, r.logement_pk, type, req.user.id, JSON.stringify(grille), entreeId]
      );
      id = ins.rows[0].id;
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ erreur: 'Un état des lieux ' + libelleType(type) + ' existe déjà pour cette location' });
      throw e;
    }
    const e = (await db.query(SQL_EDL, [id])).rows[0];
    res.status(201).json({ etat: vue(e, req.user.id) });
  } catch (err) {
    console.error('[POST /etats-des-lieux]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── MODIFIER LE BROUILLON ───────────────────────────────────────
router.put('/:id', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).modifier) return res.status(403).json({ erreur: 'Cet état des lieux n\'est plus modifiable par vous' });
    const b = req.body || {};
    if (parseInt(b.version, 10) !== e.version) {
      return res.status(409).json({ erreur: 'L\'état des lieux a changé, rechargez la page', version: e.version });
    }

    let grille = e.grille, releves = e.releves, obsGen = e.observations_generales;
    try {
      if (b.grille !== undefined) grille = S.fusionnerGrille(e.grille, b.grille);
      if (b.releves !== undefined) releves = S.normaliserReleves(b.releves);
      if (b.observations_generales !== undefined) obsGen = S.propre(b.observations_generales, S.LIMITES.obsGenerales);
    } catch (err) { return erreurMetier(res, err); }

    const maj = await db.query(
      `UPDATE etats_des_lieux SET grille = $2, releves = $3, observations_generales = $4,
         version = version + 1, updated_at = NOW()
       WHERE id = $1 AND version = $5 AND statut = 'brouillon' RETURNING id`,
      [e.id, JSON.stringify(grille), JSON.stringify(releves), obsGen || null, e.version]
    );
    if (maj.rows.length === 0) return res.status(409).json({ erreur: 'L\'état des lieux a changé, rechargez la page' });
    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.json({ etat: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[PUT /etats-des-lieux/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── PHOTOS (brouillon, rédacteur) ───────────────────────────────
router.post('/:id/photos', verifierToken, function (req, res, next) {
  uploadPhoto.single('photo')(req, res, function (err) {
    if (err) return res.status(400).json({ erreur: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).modifier) return res.status(403).json({ erreur: 'Photos modifiables uniquement par le rédacteur, en brouillon' });
    if (!req.file) return res.status(400).json({ erreur: 'Aucune photo reçue' });
    const photos = e.photos || [];
    if (photos.length >= S.LIMITES.photos) return res.status(400).json({ erreur: S.LIMITES.photos + ' photos maximum' });
    const itemId = req.body.item_id ? String(req.body.item_id) : null;
    if (itemId && !e.grille.some(function (it) { return it.id === itemId; })) return res.status(400).json({ erreur: 'Ligne inconnue' });

    const { cloudinary } = require('../services/cloudinaryService');
    const dataUri = 'data:' + req.file.mimetype + ';base64,' + req.file.buffer.toString('base64');
    let up;
    try {
      up = await cloudinary.uploader.upload(dataUri, {
        folder: 'werdhe/etats-des-lieux', resource_type: 'image',
        public_id: 'edl_' + e.id + '_' + Date.now(),
        transformation: [{ width: 1400, height: 1400, crop: 'limit', quality: 'auto' }]
      });
    } catch (upErr) {
      console.warn('[EDL] upload photo échoué:', upErr.message);
      return res.status(502).json({ erreur: 'La photo n\'a pas pu être enregistrée, réessayez' });
    }
    const photo = { id: crypto.randomBytes(6).toString('hex'), url: up.secure_url, public_id: up.public_id, item_id: itemId, at: new Date().toISOString() };
    const maj = await db.query(
      `UPDATE etats_des_lieux SET photos = COALESCE(photos, '[]'::jsonb) || $2::jsonb, version = version + 1, updated_at = NOW()
       WHERE id = $1 AND statut = 'brouillon' RETURNING id`,
      [e.id, JSON.stringify([photo])]
    );
    if (maj.rows.length === 0) return res.status(409).json({ erreur: 'L\'état des lieux a changé, rechargez la page' });
    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.status(201).json({ etat: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /etats-des-lieux/:id/photos]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.delete('/:id/photos/:photoId', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).modifier) return res.status(403).json({ erreur: 'Non autorisé' });
    const photos = e.photos || [];
    const cible = photos.find(function (p) { return p.id === req.params.photoId; });
    if (!cible) return res.status(404).json({ erreur: 'Photo non trouvée' });
    const reste = photos.filter(function (p) { return p.id !== cible.id; });
    await db.query(
      `UPDATE etats_des_lieux SET photos = $2, version = version + 1, updated_at = NOW() WHERE id = $1 AND statut = 'brouillon'`,
      [e.id, JSON.stringify(reste)]
    );
    try { await require('../services/cloudinaryService').cloudinary.uploader.destroy(cible.public_id); } catch (x) { /* non bloquant */ }
    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.json({ etat: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[DELETE /etats-des-lieux/:id/photos]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── ENVOYER À L'AUTRE PARTIE (le rédacteur signe) ───────────────
router.post('/:id/envoyer', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).envoyer) return res.status(403).json({ erreur: 'Envoi impossible à cette étape' });
    if (!S.grilleComplete(e.grille)) return res.status(400).json({ erreur: 'Renseignez l\'état de chaque ligne avant d\'envoyer' });

    const utilisateur = req.user.id === e.proprietaire_id ? { prenom: e.prop_prenom, nom: e.prop_nom } : { prenom: e.loc_prenom, nom: e.loc_nom };
    let sig;
    try { sig = S.construireSignature(req.body && req.body.signature, utilisateur, ip(req), e, roleDe(e, req.user.id)); }
    catch (err) { return erreurMetier(res, err); }

    const maj = await db.query(
      `UPDATE etats_des_lieux SET statut = 'a_valider', signature_redacteur = $2, signature_autre = NULL, reserves = NULL, updated_at = NOW()
       WHERE id = $1 AND statut = 'brouillon' AND version = $3 RETURNING id`,
      [e.id, JSON.stringify(sig), e.version]
    );
    if (maj.rows.length === 0) return res.status(409).json({ erreur: 'L\'état des lieux a changé, rechargez la page' });

    const dest = autreId(e, req.user.id);
    const nom = (req.user.id === e.proprietaire_id ? e.prop_prenom + ' ' + e.prop_nom : e.loc_prenom + ' ' + e.loc_nom);
    await alerter(e, dest, 'État des lieux ' + libelleType(e.type) + ' à signer · ' + e.logement_titre,
      nom + ' a rempli et signé l\'état des lieux. Relisez-le, ajoutez vos réserves puis signez.');
    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.json({ etat: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /etats-des-lieux/:id/envoyer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── RETIRER L'ENVOI (le rédacteur reprend la main) ──────────────
router.post('/:id/retirer', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).retirer) return res.status(403).json({ erreur: 'Action impossible à cette étape' });
    await db.query(
      `UPDATE etats_des_lieux SET statut = 'brouillon', signature_redacteur = NULL, signature_autre = NULL, reserves = NULL,
         version = version + 1, updated_at = NOW() WHERE id = $1 AND statut = 'a_valider'`, [e.id]
    );
    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.json({ etat: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /etats-des-lieux/:id/retirer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DEMANDER UNE CORRECTION (l'autre partie) ────────────────────
router.post('/:id/corriger', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).corriger) return res.status(403).json({ erreur: 'Action impossible à cette étape' });
    const motif = S.propre(req.body && req.body.motif, 300);
    if (motif.length < 3) return res.status(400).json({ erreur: 'Indiquez ce qu\'il faut corriger' });

    const entree = { par: req.user.id, role: roleDe(e, req.user.id), motif: motif, at: new Date().toISOString() };
    // Les signatures posées ne valent plus : on ne signe jamais un texte qui a bougé.
    await db.query(
      `UPDATE etats_des_lieux SET statut = 'brouillon', signature_redacteur = NULL, signature_autre = NULL, reserves = NULL,
         corrections = COALESCE(corrections, '[]'::jsonb) || $2::jsonb, version = version + 1, updated_at = NOW()
       WHERE id = $1 AND statut = 'a_valider'`, [e.id, JSON.stringify([entree])]
    );
    await alerter(e, e.redacteur_id, 'Correction demandée sur l\'état des lieux · ' + e.logement_titre, motif);
    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.json({ etat: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /etats-des-lieux/:id/corriger]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── SIGNER (l'autre partie, avec ses réserves éventuelles) ──────
router.post('/:id/signer', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).signer) return res.status(403).json({ erreur: 'Signature impossible à cette étape' });
    const reserves = S.propre(req.body && req.body.reserves, S.LIMITES.reserves);

    const utilisateur = req.user.id === e.proprietaire_id ? { prenom: e.prop_prenom, nom: e.prop_nom } : { prenom: e.loc_prenom, nom: e.loc_nom };
    let sig;
    try { sig = S.construireSignature(req.body && req.body.signature, utilisateur, ip(req), e, roleDe(e, req.user.id), reserves); }
    catch (err) { return erreurMetier(res, err); }

    const maj = await db.query(
      `UPDATE etats_des_lieux SET statut = 'signe', signature_autre = $2, reserves = $3, updated_at = NOW()
       WHERE id = $1 AND statut = 'a_valider' AND version = $4 RETURNING id`,
      [e.id, JSON.stringify(sig), reserves || null, e.version]
    );
    if (maj.rows.length === 0) return res.status(409).json({ erreur: 'L\'état des lieux a changé, rechargez la page' });

    const nom = (req.user.id === e.proprietaire_id ? e.prop_prenom + ' ' + e.prop_nom : e.loc_prenom + ' ' + e.loc_nom);
    await alerter(e, e.redacteur_id, 'État des lieux signé · ' + e.logement_titre,
      nom + ' a signé' + (reserves ? ' avec des réserves' : '') + '. Vous pouvez maintenant générer le document final.');
    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.json({ etat: vue(frais, req.user.id) });
  } catch (err) {
    console.error('[POST /etats-des-lieux/:id/signer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── GÉNÉRER LE DOCUMENT FINAL (verrouillé) ──────────────────────
router.post('/:id/generer', verifierToken, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const verrou = await client.query(`SELECT id FROM etats_des_lieux WHERE id = $1 FOR UPDATE`, [req.params.id && UUID.test(req.params.id) ? req.params.id : '00000000-0000-0000-0000-000000000000']);
    const e = verrou.rows.length ? (await client.query(SQL_EDL, [req.params.id])).rows[0] : null;
    if (!e || !roleDe(e, req.user.id)) { await client.query('ROLLBACK'); return res.status(404).json({ erreur: 'État des lieux non trouvé' }); }
    if (!droitsDe(e, req.user.id).generer) { await client.query('ROLLBACK'); return res.status(403).json({ erreur: 'Génération impossible à cette étape' }); }
    if (!e.signature_redacteur || !e.signature_autre) { await client.query('ROLLBACK'); return res.status(409).json({ erreur: 'Les deux signatures sont nécessaires' }); }
    // Les signatures doivent porter sur le contenu actuel.
    const roleR = e.signature_redacteur.role, roleA = e.signature_autre.role;
    if (e.signature_redacteur.hash !== S.empreinteContenu(e, roleR, '') || e.signature_autre.hash !== S.empreinteContenu(e, roleA, e.reserves || '')) {
      await client.query('ROLLBACK');
      return res.status(409).json({ erreur: 'Le contenu a changé depuis les signatures : elles doivent être refaites' });
    }

    const sigs = {};
    sigs[roleR] = e.signature_redacteur; sigs[roleA] = e.signature_autre;
    const gen = await genererDocument({
      type: 'etat_lieux', reservation_id: e.reservation_id, type_etat: e.type,
      logement: { id: e.logement_pk, titre: e.logement_titre, adresse: e.adresse, ville: e.ville, superficie: e.superficie, nb_chambres: e.nb_chambres, nb_salles_bain: e.nb_salles_bain },
      proprietaire: { id: e.proprietaire_id, nom: e.prop_nom, prenom: e.prop_prenom, email: e.prop_email, telephone: e.prop_tel },
      locataire: { id: e.locataire_id, nom: e.loc_nom, prenom: e.loc_prenom, email: e.loc_email, telephone: e.loc_tel },
      edl: {
        grille: e.grille, releves: e.releves, observations_generales: e.observations_generales, reserves: e.reserves,
        reserves_role: roleA,
        signatures: sigs, nb_photos: (e.photos || []).length,
        degradations: S.degradations(e.grille).map(function (it) { return it.id; })
      },
      auteur_id: req.user.id, envoyer_email: false
    });
    if (!gen.success) { await client.query('ROLLBACK'); return res.status(500).json({ erreur: 'Le document n\'a pas pu être généré, réessayez' }); }

    await client.query(
      `UPDATE etats_des_lieux SET statut = 'genere', document_id = $2, genere_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [e.id, gen.document.id]
    );
    await client.query('COMMIT');

    // Envoi du document à l'autre partie (non bloquant) + alerte.
    const dest = autreId(e, req.user.id);
    const destinataire = dest === e.proprietaire_id ? { email: e.prop_email, prenom: e.prop_prenom } : { email: e.loc_email, prenom: e.loc_prenom };
    try {
      const envoye = await envoyerEmailDocument({
        email: destinataire.email, prenom: destinataire.prenom, typeDocument: 'etat_lieux',
        numeroDocument: gen.numero, htmlDocument: gen.document.contenu_html, nomFichier: gen.numero + '.html'
      });
      if (envoye !== false) {
        await db.query('UPDATE documents SET email_envoye = TRUE, email_envoye_at = NOW() WHERE id = $1', [gen.document.id]);
        await enregistrerEvenement(gen.document.id, 'envoye_email', req.user.id, { destinataire: destinataire.email }, ip(req));
      }
    } catch (mailErr) { console.warn('[EDL] e-mail non envoyé:', mailErr.message); }
    await alerter(e, dest, 'État des lieux ' + libelleType(e.type) + ' finalisé · ' + e.logement_titre,
      'Le document ' + gen.numero + ' est disponible dans vos documents.');

    const frais = (await db.query(SQL_EDL, [e.id])).rows[0];
    res.json({ etat: vue(frais, req.user.id), numero: gen.numero });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (x) { /* déjà annulé */ }
    console.error('[POST /etats-des-lieux/:id/generer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// ─── ABANDONNER (avant génération) ───────────────────────────────
router.post('/:id/annuler', verifierToken, async (req, res) => {
  try {
    const e = await charger(req, res); if (!e) return;
    if (!droitsDe(e, req.user.id).annuler) return res.status(403).json({ erreur: 'Abandon impossible à cette étape' });
    await db.query(`UPDATE etats_des_lieux SET statut = 'annule', updated_at = NOW() WHERE id = $1 AND statut IN ('brouillon','a_valider','signe')`, [e.id]);
    if (e.statut !== 'brouillon') {
      await alerter(e, autreId(e, req.user.id), 'État des lieux abandonné · ' + e.logement_titre, 'Le rédacteur a abandonné cet état des lieux avant sa finalisation.');
    }
    res.json({ message: 'État des lieux abandonné' });
  } catch (err) {
    console.error('[POST /etats-des-lieux/:id/annuler]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
