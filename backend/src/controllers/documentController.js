const db = require('../database');
const { genererDocument } = require('../services/documentService');
const { envoyerEmailDocument } = require('../services/emailService');
const multer = require('multer');

// ================================================
// TYPES DE DOCUMENTS ACCEPTES
// Propriétaire peut générer tous les types
// Locataire peut générer : quittance, etat_lieux, preavis
// ================================================
var TYPES_PROPRIO = [
  'facture', 'quittance', 'contrat_bail',
  'etat_lieux', 'mise_en_demeure',
  'rapport_financier', 'caution', 'preavis'
];

var TYPES_LOCATAIRE = [
  'quittance', 'etat_lieux', 'preavis'
];

// ================================================
// GÉNÉRER UN DOCUMENT
// ================================================
const genererDocumentManuel = async (req, res) => {
  try {
    const { reservation_id, type, mois, annee } = req.body;

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
    const result = await db.query(
      `SELECT
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
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation non trouvee' });
    }

    const r = result.rows[0];

    // Vérifier que l'utilisateur est proprio ou locataire de cette réservation
    if (r.proprietaire_id !== req.user.id && r.locataire_id !== req.user.id) {
      return res.status(403).json({ erreur: 'Non autorise' });
    }

    // Construire les données pour la génération
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
      envoyer_email: true
    });

    if (!genResult.success) {
      return res.status(500).json({ erreur: genResult.erreur });
    }

    // Message de succès selon le type
    var messages = {
      facture: 'Facture generee et envoyee !',
      quittance: 'Quittance generee et envoyee !',
      contrat_bail: 'Contrat de bail genere et envoye !',
      etat_lieux: 'Etat des lieux genere !',
      mise_en_demeure: 'Mise en demeure generee !',
      rapport_financier: 'Rapport financier genere !',
      caution: 'Contrat de caution genere !',
      preavis: 'Preavis genere et envoye !'
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
       AND (r.date_fin IS NULL OR r.date_fin > NOW())`
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
      SELECT d.*,
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

// ================================================
// RENVOYER PAR EMAIL
// ================================================
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
      return res.status(404).json({ erreur: 'Document non trouve' });
    }

    const doc = result.rows[0];

    await envoyerEmailDocument({
      email: doc.email,
      prenom: doc.prenom,
      typeDocument: doc.type,
      numeroDocument: doc.titre,
      htmlDocument: doc.contenu_html,
      nomFichier: doc.titre.replace(/\s+/g, '_') + '.html'
    });

    await db.query(
      'UPDATE documents SET email_envoye = TRUE, email_envoye_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ message: 'Document renvoye par email !' });

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
  renvoyerEmail,
  uploadManuel,
  uploaderDocumentManuel
};