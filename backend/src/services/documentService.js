const db = require('../database');
const {
  genererHTMLFacture,
  genererHTMLQuittance,
  genererHTMLContratBail
} = require('./pdfService');
const { envoyerEmailDocument } = require('./emailService');

// ================================
// GÉNÉRER ET SAUVEGARDER UN DOCUMENT
// ================================
const genererDocument = async ({
  type, reservation_id, paiement_id,
  proprietaire, locataire, logement,
  periode, montant, mode_paiement,
  duree_mois, type_location, envoyer_email = true
}) => {
  try {
    const date = new Date().toLocaleDateString('fr-FR');
    const timestamp = Date.now();

    // Générer le numéro unique
    const prefixes = {
      facture: 'WRD',
      quittance: 'QUI',
      contrat_bail: 'BAIL'
    };
    const numero = `${prefixes[type]}-${new Date().getFullYear()}-${String(timestamp).slice(-5)}`;

    // Générer le HTML selon le type
    let htmlDocument = '';
    let titre = '';

    const dataCommune = {
      numero, date, proprietaire, locataire,
      logement, periode, montant, mode_paiement
    };

    if (type === 'facture') {
      htmlDocument = genererHTMLFacture({
        ...dataCommune, statut: 'complete'
      });
      titre = `Facture ${numero}`;
    } else if (type === 'quittance') {
      htmlDocument = genererHTMLQuittance(dataCommune);
      titre = `Quittance ${numero}`;
    } else if (type === 'contrat_bail') {
      htmlDocument = genererHTMLContratBail({
        ...dataCommune,
        date_debut: periode.debut,
        date_fin: periode.fin,
        duree_mois, type_location
      });
      titre = `Contrat de bail ${numero}`;
    }

    // Sauvegarder en base de données
    const result = await db.query(
      `INSERT INTO documents
        (type, titre, reservation_id, paiement_id, logement_id,
         proprietaire_id, locataire_id, contenu_html, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'genere')
       RETURNING *`,
      [
        type, titre, reservation_id || null,
        paiement_id || null, logement.id,
        proprietaire.id, locataire.id, htmlDocument
      ]
    );

    const document = result.rows[0];

    // Envoyer par email si demandé
    if (envoyer_email && locataire.email) {
      await envoyerEmailDocument({
        email: locataire.email,
        prenom: locataire.prenom,
        typeDocument: type,
        numeroDocument: numero,
        htmlDocument,
        nomFichier: `${numero}.html`
      });

      await db.query(
        `UPDATE documents SET
          statut = 'envoye',
          email_envoye = TRUE,
          email_envoye_at = NOW()
         WHERE id = $1`,
        [document.id]
      );
    }

    return { success: true, document, numero };

  } catch (err) {
    console.error('Erreur génération document:', err);
    return { success: false, erreur: err.message };
  }
};

module.exports = { genererDocument };