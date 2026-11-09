const db = require('../database');
const crypto = require('crypto');
const {
  genererDocument, genererPdfDepuisHtml, injecterSignaturesBail, injecterAccuseReception,
  verifierIntegrite, enregistrerEvenement
} = require('../services/documentService');
const { envoyerEmailDocument } = require('../services/emailService');
const { obtenirDroits } = require('../middleware/verifierPlan');
const multer = require('multer');

// ================================================
// TYPES DE DOCUMENTS ACCEPTES
// Propriétaire peut générer tous les types
// Locataire peut générer : quittance, etat_lieux, preavis
// ================================================
var TYPES_PROPRIO = [
  'facture', 'quittance', 'contrat_bail',
  'mise_en_demeure',
  'rapport_financier', 'caution'
];

var TYPES_LOCATAIRE = [
  'quittance'
];
// Les préavis et les états des lieux ne se génèrent plus ici : ils passent par
// leur propre parcours (aperçu, signatures, accusé de réception) qui crée le document.

// Réservation avec les infos du logement, du propriétaire et du locataire,
// nécessaires à tous les modèles de documents.
const SQL_RESERVATION_DOCUMENT = `SELECT
    r.*,
    -- Infos logement
    l.id as logement_id,
    l.titre as logement_titre,
    l.adresse, l.ville,
    l.prix_mensuel,
    l.nb_chambres,
    l.nb_salles_bain,
    l.superficie,
    l.proprietaire_id,
    -- Infos propriétaire
    u_prop.nom as prop_nom,
    u_prop.prenom as prop_prenom,
    u_prop.email as prop_email,
    u_prop.telephone as prop_tel,
    -- Infos locataire
    u_loc.nom as loc_nom,
    u_loc.prenom as loc_prenom,
    u_loc.email as loc_email,
    u_loc.telephone as loc_tel
  FROM reservations r
  JOIN logements l ON r.logement_id = l.id
  JOIN users u_prop ON l.proprietaire_id = u_prop.id
  JOIN users u_loc ON r.locataire_id = u_loc.id
  WHERE r.id = $1`;

function paramsGeneration(r, type, mois, annee, extra) {
  extra = extra || {};
  return {
    type,
    reservation_id: r.id,
    logement: {
      id: r.logement_id,
      titre: r.logement_titre,
      adresse: r.adresse,
      ville: r.ville,
      superficie: r.superficie,
      nb_chambres: r.nb_chambres,
      nb_salles_bain: r.nb_salles_bain
    },
    proprietaire: {
      id: r.proprietaire_id,
      nom: r.prop_nom,
      prenom: r.prop_prenom,
      email: r.prop_email,
      telephone: r.prop_tel
    },
    locataire: {
      id: r.locataire_id,
      nom: r.loc_nom,
      prenom: r.loc_prenom,
      email: r.loc_email,
      telephone: r.loc_tel
    },
    periode: {
      debut: r.date_debut,
      fin: r.date_fin
    },
    montant: r.montant_total || r.prix_mensuel,
    mode_paiement: 'especes',
    duree_mois: r.duree_mois,
    type_location: r.type_location,
    // Pour quittance mensuelle : mois/année spécifique
    mois: mois || new Date().getMonth() + 1,
    annee: annee || new Date().getFullYear(),
    date_depart: extra.date_depart,
    type_etat: extra.type_etat,
    mois_retard: extra.mois_retard,
    auteur_id: extra.auteur_id || null,
    envoyer_email: true
  };
}

// HTML servi au téléchargement / à l'e-mail : le document stocké est figé,
// on y insère seulement ce qui vit ailleurs (signatures électroniques du
// bail, tampon « ANNULÉ »). L'empreinte reste celle du document stocké.
async function htmlPourSortie(doc) {
  var html = doc.contenu_html;

  if (doc.type === 'contrat_bail' && doc.reservation_id) {
    const signatures = await db.query(
      `SELECT role, nom_complet, ip_adresse, signe_at, hash_signature FROM signatures_bail
       WHERE reservation_id = $1 ORDER BY signe_at`,
      [doc.reservation_id]
    ).catch(function() { return { rows: [] }; });
    html = injecterSignaturesBail(html, signatures.rows);
  }

  if (doc.type === 'preavis') {
    const accuse = await db.query(
      `SELECT p.accuse_at, u.prenom || ' ' || u.nom AS nom
       FROM preavis p LEFT JOIN users u ON u.id = p.accuse_par
       WHERE p.document_id = $1`,
      [doc.id]
    ).catch(function() { return { rows: [] }; });
    if (accuse.rows[0]) html = injecterAccuseReception(html, accuse.rows[0]);
  }

  if (doc.statut === 'annule') {
    var tampon = '<div style="position:fixed;top:42%;left:0;right:0;text-align:center;font:800 120px Arial,sans-serif;' +
      'color:rgba(179,38,30,.22);transform:rotate(-22deg);pointer-events:none;z-index:99">ANNULÉ</div>';
    html = html.includes('</body>') ? html.replace('</body>', tampon + '</body>') : html + tampon;
  }
  return html;
}

// ================================================
// GÉNÉRER UN DOCUMENT
// ================================================
const genererDocumentManuel = async (req, res) => {
  try {
    const { reservation_id, type, mois, annee } = req.body;
    var extra = { auteur_id: req.user.id };

    if (type === 'etat_lieux') {
      extra.type_etat = req.body.type_etat === 'sortie' ? 'sortie' : 'entree';
    }
    var moisNum = mois ? parseInt(mois, 10) : null;
    var anneeNum = annee ? parseInt(annee, 10) : null;
    if ((moisNum !== null && (moisNum < 1 || moisNum > 12)) || (anneeNum !== null && (anneeNum < 2020 || anneeNum > 2100))) {
      return res.status(400).json({ erreur: 'Période invalide' });
    }

    // Vérifier que le type est valide selon le rôle
    var typesAutorises = req.user.role === 'locataire'
      ? TYPES_LOCATAIRE
      : TYPES_PROPRIO;

    if (!typesAutorises.includes(type)) {
      return res.status(400).json({
        erreur: 'Type de document non autorise pour votre role'
      });
    }

    // Récupérer toutes les infos via la réservation
    const result = await db.query(SQL_RESERVATION_DOCUMENT, [reservation_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation non trouvee' });
    }

    const r = result.rows[0];

    // Vérifier que l'utilisateur est proprio ou locataire de cette réservation
    if (r.proprietaire_id !== req.user.id && r.locataire_id !== req.user.id) {
      return res.status(403).json({ erreur: 'Non autorise' });
    }

    // La génération manuelle de documents (bail, quittance, etc.) par le
    // propriétaire est réservée aux plans Pro/Agence — le locataire peut
    // toujours générer les siens (quittance, état des lieux, préavis).
    if (req.user.role !== 'locataire') {
      var droitsProprio = await obtenirDroits(r.proprietaire_id);
      if (!droitsProprio.documents_pdf) {
        return res.status(403).json({
          erreur: 'Les baux et quittances PDF ne sont disponibles qu\'avec les plans Pro ou Agence.',
          code: 'DOCUMENTS_PDF_INDISPONIBLE'
        });
      }
    }

    // Construire les données pour la génération
    const genResult = await genererDocument(paramsGeneration(r, type, moisNum, anneeNum, extra));

    if (!genResult.success) {
      return res.status(500).json({ erreur: genResult.erreur });
    }

    // Message de succès selon le type
    var messages = {
      facture: 'Facture générée et envoyée !',
      quittance: 'Quittance générée et envoyée !',
      contrat_bail: 'Contrat de bail généré et envoyé !',
      etat_lieux: 'État des lieux généré !',
      mise_en_demeure: 'Mise en demeure générée !',
      rapport_financier: 'Rapport financier généré !',
      caution: 'Attestation de dépôt de garantie générée !',
      preavis: 'Préavis généré !'
    };

    res.status(201).json({
      message: messages[type] || 'Document genere !',
      document: genResult.document,
      numero: genResult.numero
    });

  } catch (err) {
    console.error('Erreur generation document:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur : ' + err.message });
  }
};

// ================================================
// GÉNERER QUITTANCES MENSUELLES AUTOMATIQUES
// Appelé chaque mois pour toutes les réservations actives
// ================================================
const genererQuittancesMensuelles = async (req, res) => {
  try {
    // Récupérer toutes les réservations confirmées actives
    const reservations = await db.query(
      `SELECT
          r.*,
          l.id as logement_id, l.titre as logement_titre,
          l.adresse, l.ville, l.prix_mensuel,
          l.nb_chambres, l.nb_salles_bain, l.superficie,
          l.proprietaire_id,
          u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
          u_prop.email as prop_email, u_prop.telephone as prop_tel,
          u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
          u_loc.email as loc_email, u_loc.telephone as loc_tel
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       WHERE r.statut = 'confirmee'
       AND r.bail_signe = TRUE
       AND (r.date_fin IS NULL OR r.date_fin > NOW())
       AND u_prop.plan IN ('pro', 'agence')`
    );

    var moisActuel = new Date().getMonth() + 1;
    var anneeActuelle = new Date().getFullYear();
    var nbGeneres = 0;

    for (var r of reservations.rows) {
      // Vérifier si la quittance du mois n'existe pas déjà
      var existe = await db.query(
        `SELECT id FROM documents
         WHERE reservation_id = $1
         AND type = 'quittance'
         AND EXTRACT(MONTH FROM created_at) = $2
         AND EXTRACT(YEAR FROM created_at) = $3`,
        [r.id, moisActuel, anneeActuelle]
      );

      if (existe.rows.length === 0) {
        // Générer la quittance du mois
        await genererDocument({
          type: 'quittance',
          reservation_id: r.id,
          logement: {
            id: r.logement_id, titre: r.logement_titre,
            adresse: r.adresse, ville: r.ville,
            superficie: r.superficie,
            nb_chambres: r.nb_chambres,
            nb_salles_bain: r.nb_salles_bain
          },
          proprietaire: {
            id: r.proprietaire_id,
            nom: r.prop_nom, prenom: r.prop_prenom,
            email: r.prop_email, telephone: r.prop_tel
          },
          locataire: {
            id: r.locataire_id,
            nom: r.loc_nom, prenom: r.loc_prenom,
            email: r.loc_email, telephone: r.loc_tel
          },
          periode: { debut: r.date_debut, fin: r.date_fin },
          montant: r.prix_mensuel,
          mois: moisActuel,
          annee: anneeActuelle,
          envoyer_email: true
        });
        nbGeneres++;
      }
    }

    res.json({
      message: nbGeneres + ' quittance(s) generee(s) pour ' +
        moisActuel + '/' + anneeActuelle,
      nb_generes: nbGeneres
    });

  } catch (err) {
    console.error('Erreur quittances mensuelles:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// SIGNER LE BAIL → Active la réservation
// C'est uniquement après la signature que le bail commence
// ================================================
const signerBail = async (req, res) => {
  try {
    const { reservation_id } = req.body;

    // Vérifier que la réservation existe et appartient au proprio
    const resa = await db.query(
      `SELECT r.*, l.proprietaire_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (resa.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation non trouvee' });
    }

    if (resa.rows[0].proprietaire_id !== req.user.id) {
      return res.status(403).json({
        erreur: 'Seul le proprietaire peut valider la signature du bail'
      });
    }

    // Marquer le bail comme signé et activer la location
    await db.query(
      `UPDATE reservations
       SET bail_signe = TRUE,
           date_signature_bail = NOW(),
           statut = 'confirmee'
       WHERE id = $1`,
      [reservation_id]
    );

    // Mettre le logement en statut "loue"
    await db.query(
      'UPDATE logements SET statut = $1 WHERE id = $2',
      ['loue', resa.rows[0].logement_id]
    );

    res.json({
      message: 'Bail signe ! La location commence officiellement.',
      date_signature: new Date().toISOString()
    });

  } catch (err) {
    console.error('Erreur signature bail:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// VOIR MES DOCUMENTS
// ================================================
const getMesDocuments = async (req, res) => {
  try {
    const { type } = req.query;

    let query = `
      SELECT d.id, d.type, d.titre, d.numero, d.statut, d.reservation_id, d.paiement_id,
        d.logement_id, d.proprietaire_id, d.locataire_id, d.est_manuel, d.nom_fichier,
        d.email_envoye, d.email_envoye_at, d.created_at, d.verrouille_at, d.annule_at,
        d.annule_motif, d.hash_sha256,
        l.titre as logement_titre,
        l.ville as logement_ville
       FROM documents d
       LEFT JOIN logements l ON d.logement_id = l.id
       WHERE (d.proprietaire_id = $1 OR d.locataire_id = $1)
    `;

    const params = [req.user.id];

    if (type) {
      query += ' AND d.type = $2';
      params.push(type);
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      documents: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// TÉLÉCHARGER UN DOCUMENT
// ================================================
const telechargerDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format === 'pdf' ? 'pdf' : 'html';

    const result = await db.query(
      `SELECT * FROM documents
       WHERE id = $1
       AND (proprietaire_id = $2 OR locataire_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Document non trouve' });
    }

    const doc = result.rows[0];
    if (!doc.contenu_html) {
      return res.status(404).json({ erreur: 'Contenu du document non disponible' });
    }

    var html = await htmlPourSortie(doc);

    const nomFichier = doc.titre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    enregistrerEvenement(doc.id, 'telecharge', req.user.id, { format: format }, req.ip);

    if (format === 'pdf') {
      try {
        const pdfBuffer = await genererPdfDepuisHtml(html);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}.pdf"`);
        return res.send(pdfBuffer);
      } catch (pdfErr) {
        console.error('[PDF]', pdfErr.message);
        // Repli sur le HTML si la génération PDF échoue (ex: Chromium indisponible)
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}.html"`);
    res.send(html);

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// TÉLÉCHARGER LE BAIL D'UNE LOCATION
// La signature électronique ne crée aucun document : le contrat est généré
// à la demande la première fois (puis réutilisé), et le certificat de
// signature y est ajouté au téléchargement.
// ================================================
const telechargerBailReservation = async (req, res) => {
  try {
    const reservationId = req.params.reservation_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(reservationId))) {
      return res.status(404).json({ erreur: 'Reservation non trouvee' });
    }

    const result = await db.query(SQL_RESERVATION_DOCUMENT, [reservationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation non trouvee' });
    }
    const r = result.rows[0];
    if (r.proprietaire_id !== req.user.id && r.locataire_id !== req.user.id) {
      return res.status(403).json({ erreur: 'Non autorise' });
    }

    const signatures = await db.query(
      'SELECT 1 FROM signatures_bail WHERE reservation_id = $1 LIMIT 1', [reservationId]
    ).catch(function() { return { rows: [] }; });
    if (!r.bail_signe && signatures.rows.length === 0) {
      return res.status(409).json({ erreur: "Le bail n'a pas encore été signé" });
    }

    var doc = (await db.query(
      `SELECT id FROM documents
       WHERE reservation_id = $1 AND type = 'contrat_bail' AND statut <> 'annule'
       ORDER BY created_at DESC LIMIT 1`, [reservationId]
    )).rows[0];

    if (!doc) {
      const gen = await genererDocument(Object.assign(paramsGeneration(r, 'contrat_bail'), { envoyer_email: false }));
      if (!gen.success) {
        return res.status(500).json({ erreur: gen.erreur || 'Impossible de générer le bail' });
      }
      doc = gen.document;
    }

    req.params.id = doc.id;
    return telechargerDocument(req, res);
  } catch (err) {
    console.error('Erreur téléchargement bail:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// ENVOYER PAR E-MAIL
// Un document verrouillé ne se modifie pas : on peut seulement le renvoyer.
// Destinataire par défaut : l'autre partie ; à défaut (rapport financier,
// par exemple), l'utilisateur lui-même.
// ================================================
const renvoyerEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM documents
       WHERE id = $1 AND (proprietaire_id = $2 OR locataire_id = $2)`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Document non trouvé' });
    }
    const doc = result.rows[0];
    if (doc.est_manuel || !doc.contenu_html) {
      return res.status(400).json({ erreur: 'Ce document importé ne peut pas être renvoyé par e-mail' });
    }

    const autreId = doc.proprietaire_id === req.user.id ? doc.locataire_id : doc.proprietaire_id;
    const dest = await db.query(
      'SELECT email, prenom FROM users WHERE id = $1',
      [autreId || req.user.id]
    );
    if (dest.rows.length === 0 || !dest.rows[0].email) {
      return res.status(400).json({ erreur: 'Aucune adresse e-mail pour ce document' });
    }

    const envoye = await envoyerEmailDocument({
      email: dest.rows[0].email,
      prenom: dest.rows[0].prenom,
      typeDocument: doc.type,
      numeroDocument: doc.numero || doc.titre,
      htmlDocument: await htmlPourSortie(doc),
      nomFichier: (doc.numero || 'document') + '.html'
    });
    if (envoye === false) {
      return res.status(502).json({ erreur: "L'e-mail n'a pas pu être envoyé, réessayez plus tard" });
    }

    await db.query(
      'UPDATE documents SET email_envoye = TRUE, email_envoye_at = NOW() WHERE id = $1',
      [id]
    );
    await enregistrerEvenement(doc.id, 'envoye_email', req.user.id, { destinataire: dest.rows[0].email }, req.ip);

    res.json({ message: 'Document envoyé par e-mail !' });

  } catch (err) {
    console.error('Erreur envoi e-mail document:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// ANNULER UN DOCUMENT
// Un document généré ne se corrige pas : on l'annule (il reste visible,
// marqué « annulé ») puis on en génère un nouveau.
// ================================================
const annulerDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const motif = String(req.body.motif || '').trim().slice(0, 300);
    if (motif.length < 3) {
      return res.status(400).json({ erreur: "Indiquez le motif de l'annulation" });
    }

    const result = await db.query(
      `SELECT d.*, r.bail_signe FROM documents d
       LEFT JOIN reservations r ON r.id = d.reservation_id
       WHERE d.id = $1 AND (d.proprietaire_id = $2 OR d.locataire_id = $2)`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Document non trouvé' });
    }
    const doc = result.rows[0];
    if (doc.statut === 'annule') {
      return res.status(409).json({ erreur: 'Ce document est déjà annulé' });
    }
    if (doc.est_manuel) {
      return res.status(400).json({ erreur: 'Un fichier importé ne peut pas être annulé ici' });
    }
    if (doc.type === 'contrat_bail' && doc.bail_signe) {
      return res.status(409).json({ erreur: 'Un bail signé par les deux parties ne peut pas être annulé' });
    }

    // Un préavis ne peut être retiré que par son auteur, et plus une fois que
    // le destinataire en a accusé réception.
    var preavisLie = null;
    if (doc.type === 'preavis') {
      preavisLie = (await db.query(
        'SELECT id, auteur_id, statut FROM preavis WHERE document_id = $1', [doc.id]
      )).rows[0];
      if (preavisLie && preavisLie.statut !== 'envoye') {
        return res.status(409).json({ erreur: 'Ce préavis a déjà fait l\'objet d\'un accusé de réception : il ne peut plus être annulé' });
      }
      if (preavisLie && preavisLie.auteur_id !== req.user.id) {
        return res.status(403).json({ erreur: 'Seul l\'auteur du préavis peut l\'annuler' });
      }
    }

    const maj = await db.query(
      `UPDATE documents SET statut = 'annule', annule_at = NOW(), annule_motif = $2
       WHERE id = $1 RETURNING id, statut, annule_at, annule_motif`,
      [id, motif]
    );
    if (preavisLie) {
      await db.query("UPDATE preavis SET statut = 'termine' WHERE id = $1 AND statut = 'envoye'", [preavisLie.id]);
    }
    await enregistrerEvenement(doc.id, 'annule', req.user.id, { motif: motif }, req.ip);

    res.json({ message: 'Document annulé', document: maj.rows[0] });
  } catch (err) {
    console.error('Erreur annulation document:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// VÉRIFIER L'AUTHENTICITÉ D'UN DOCUMENT (public, via le QR code)
// Ne renvoie aucune donnée personnelle : type, date, statut, intégrité.
// ================================================
const verifierDocument = async (req, res) => {
  try {
    const numero = String(req.params.numero || '').toUpperCase().slice(0, 40);
    if (!/^[A-Z]{3,4}-\d{4}-\d{5,}$/.test(numero)) {
      return res.status(404).json({ trouve: false });
    }
    const result = await db.query(
      `SELECT type, numero, statut, created_at, verrouille_at, annule_at, hash_sha256, contenu_html, est_manuel
       FROM documents WHERE numero = $1`,
      [numero]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ trouve: false });
    }
    const d = result.rows[0];
    res.json({
      trouve: true,
      numero: d.numero,
      type: d.type,
      statut: d.statut,
      annule: d.statut === 'annule',
      genere_le: d.verrouille_at || d.created_at,
      annule_le: d.annule_at,
      integre: d.est_manuel ? null : verifierIntegrite(d),
      empreinte: d.hash_sha256 ? d.hash_sha256.slice(0, 16) + '…' : null
    });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// UPLOAD MANUEL
// ================================================
const uploadManuel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = [
      'application/pdf', 'image/jpeg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (types.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporte'), false);
    }
  }
});

const uploaderDocumentManuel = async (req, res) => {
  try {
    const { titre, type, logement_id, locataire_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ erreur: 'Aucun fichier recu' });
    }

    const contenu = req.file.buffer.toString('base64');
    const nomFichier = req.file.originalname;

    const result = await db.query(
      `INSERT INTO documents
        (type, titre, logement_id, proprietaire_id, locataire_id,
         nom_fichier, est_manuel, statut, contenu_html, hash_sha256, verrouille_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'genere', $7, $8, NOW())
       RETURNING *`,
      [
        type || 'autre',
        titre || nomFichier,
        logement_id || null,
        req.user.id,
        locataire_id || null,
        nomFichier,
        contenu,
        crypto.createHash('sha256').update(contenu, 'utf8').digest('hex')
      ]
    );

    res.status(201).json({
      message: 'Document uploade avec succes !',
      document: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur upload manuel:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  genererDocumentManuel,
  genererQuittancesMensuelles,
  signerBail,
  getMesDocuments,
  telechargerDocument,
  telechargerBailReservation,
  renvoyerEmail,
  annulerDocument,
  verifierDocument,
  uploadManuel,
  uploaderDocumentManuel
};