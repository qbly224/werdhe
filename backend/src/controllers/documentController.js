const db = require('../database');
const { genererDocument } = require('../services/documentService');
const { envoyerEmailDocument } = require('../services/emailService');
const multer = require('multer');
const path = require('path');

// ================================
// GÉNÉRER UN DOCUMENT MANUELLEMENT
// ================================
const genererDocumentManuel = async (req, res) => {
  try {
    const { reservation_id, type } = req.body;

    if (!['facture', 'quittance', 'contrat_bail'].includes(type)) {
      return res.status(400).json({ erreur: 'Type de document invalide' });
    }

    // Récupérer toutes les infos de la réservation
    const result = await db.query(
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
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }

    const r = result.rows[0];

    // Vérifier que c'est bien le propriétaire ou locataire
    if (r.proprietaire_id !== req.user.id && r.locataire_id !== req.user.id) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    const genResult = await genererDocument({
      type,
      reservation_id,
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
      periode: { debut: r.date_debut, fin: r.date_fin },
      montant: r.montant_total,
      mode_paiement: 'especes',
      duree_mois: r.duree_mois,
      type_location: r.type_location,
      envoyer_email: true
    });

    if (!genResult.success) {
      return res.status(500).json({ erreur: genResult.erreur });
    }

    res.status(201).json({
      message: `✅ ${type === 'facture' ? 'Facture' : type === 'quittance' ? 'Quittance' : 'Contrat'} généré(e) et envoyé(e) par email !`,
      document: genResult.document,
      numero: genResult.numero
    });

  } catch (err) {
    console.error('Erreur génération document:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR MES DOCUMENTS
// ================================
const getMesDocuments = async (req, res) => {
  try {
    const { type } = req.query;

    let query = `
      SELECT d.*,
        u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
        u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
        l.titre as logement_titre, l.ville as logement_ville
       FROM documents d
       LEFT JOIN users u_prop ON d.proprietaire_id = u_prop.id
       LEFT JOIN users u_loc ON d.locataire_id = u_loc.id
       LEFT JOIN logements l ON d.logement_id = l.id
       WHERE (d.proprietaire_id = $1 OR d.locataire_id = $1)
    `;

    const params = [req.user.id];
    if (type) {
      query += ` AND d.type = $2`;
      params.push(type);
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      message: `✅ ${result.rows.length} document(s)`,
      documents: result.rows
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// TÉLÉCHARGER UN DOCUMENT (HTML)
// ================================
const telechargerDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM documents
       WHERE id = $1
       AND (proprietaire_id = $2 OR locataire_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Document non trouvé' });
    }

    const doc = result.rows[0];

    // Envoyer le HTML avec headers pour forcer le téléchargement
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.titre.replace(/\s+/g, '_')}.html"`
    );
    res.send(doc.contenu_html);

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// RENVOYER PAR EMAIL
// ================================
const renvoyerEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT d.*, u.email, u.prenom
       FROM documents d
       JOIN users u ON d.locataire_id = u.id
       WHERE d.id = $1
       AND (d.proprietaire_id = $2 OR d.locataire_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Document non trouvé' });
    }

    const doc = result.rows[0];

    await envoyerEmailDocument({
      email: doc.email,
      prenom: doc.prenom,
      typeDocument: doc.type,
      numeroDocument: doc.titre,
      htmlDocument: doc.contenu_html,
      nomFichier: `${doc.titre.replace(/\s+/g, '_')}.html`
    });

    await db.query(
      'UPDATE documents SET email_envoye = TRUE, email_envoye_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ message: '✅ Document renvoyé par email !' });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// UPLOAD DOCUMENT MANUEL
// ================================
const uploadManuel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = [
      'application/pdf',
      'image/jpeg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (types.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté'), false);
    }
  }
});

const uploaderDocumentManuel = async (req, res) => {
  try {
    const { titre, type, logement_id, locataire_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ erreur: 'Aucun fichier reçu' });
    }

    // Convertir en base64 pour stocker
    const contenu = req.file.buffer.toString('base64');
    const nomFichier = req.file.originalname;

    const result = await db.query(
      `INSERT INTO documents
        (type, titre, logement_id, proprietaire_id, locataire_id,
         nom_fichier, est_manuel, statut, contenu_html)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'genere', $7)
       RETURNING *`,
      [
        type || 'autre',
        titre || nomFichier,
        logement_id || null,
        req.user.id,
        locataire_id || null,
        nomFichier,
        contenu
      ]
    );

    res.status(201).json({
      message: '✅ Document uploadé avec succès !',
      document: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur upload manuel:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  genererDocumentManuel,
  getMesDocuments,
  telechargerDocument,
  renvoyerEmail,
  uploadManuel,
  uploaderDocumentManuel
};