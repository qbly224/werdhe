const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../database');
const { envoyerEmailDocument } = require('./emailService');
const T = require('./documentTemplates');

// ================================================
// DOCUMENTS : génération, empreinte, verrouillage
//
// Un document généré est verrouillé en base (trigger documents_verrou,
// migration 014) : son contenu ne change plus. On peut seulement le
// télécharger, l'envoyer par e-mail ou l'annuler.
// ================================================

var PREFIXES = {
  facture: 'FAC', quittance: 'QUI', contrat_bail: 'BAIL', etat_lieux: 'EDL',
  mise_en_demeure: 'MED', rapport_financier: 'RAP', caution: 'CAU', preavis: 'PRE'
};

function sha256(texte) {
  return crypto.createHash('sha256').update(String(texte), 'utf8').digest('hex');
}

// Empreinte d'un document : SHA-256 du HTML dans lequel l'empreinte elle-même
// est remplacée par un jeton (sinon elle se contiendrait).
function calculerEmpreinte(html, empreinteAffichee) {
  var base = String(html || '');
  if (empreinteAffichee) base = base.split(empreinteAffichee).join(T.EMPREINTE_JETON);
  return sha256(base);
}

// Vérifie qu'un document stocké n'a pas été altéré.
function verifierIntegrite(doc) {
  if (!doc || !doc.hash_sha256) return false;
  return calculerEmpreinte(doc.contenu_html, doc.hash_sha256) === doc.hash_sha256;
}

async function numeroSuivant(type) {
  var r = await db.query("SELECT nextval('documents_numero_seq') AS n");
  var n = String(r.rows[0].n).padStart(6, '0');
  return (PREFIXES[type] || 'WRD') + '-' + new Date().getFullYear() + '-' + n;
}

async function enregistrerEvenement(documentId, type, userId, details, ip) {
  try {
    await db.query(
      `INSERT INTO document_evenements (document_id, type, user_id, details, ip_adresse)
       VALUES ($1, $2, $3, $4, $5)`,
      [documentId, type, userId || null, details ? JSON.stringify(details) : null, ip || null]
    );
  } catch (err) {
    // Le journal ne doit jamais bloquer l'action principale.
    console.warn('[documents] journal non écrit:', err.message);
  }
}

function titreDocument(type, numero, p) {
  var preavisLib = p.auteur === 'proprietaire' ? 'Congé donné par le bailleur ' : 'Préavis de départ ';
  var mois = p.mois ? T.MOIS[p.mois - 1] + ' ' + p.annee : '';
  var libelles = {
    facture: 'Facture ' + numero + (mois ? ' · ' + mois : ''),
    quittance: 'Quittance ' + numero + (mois ? ' · ' + mois : ''),
    contrat_bail: 'Contrat de bail ' + numero,
    etat_lieux: 'État des lieux ' + (p.type_etat === 'sortie' ? 'de sortie ' : 'd\'entrée ') + numero,
    mise_en_demeure: 'Mise en demeure ' + numero,
    rapport_financier: 'Rapport financier ' + numero,
    caution: 'Dépôt de garantie ' + numero,
    preavis: preavisLib + numero
  };
  return libelles[type];
}

// ================================================
// FONCTION PRINCIPALE : GÉNÉRER, FIGER ET SAUVEGARDER
// ================================================
const genererDocument = async ({
  type, reservation_id, paiement_id,
  proprietaire, locataire, logement,
  periode, montant, mode_paiement,
  duree_mois, type_location,
  mois, annee,
  date_depart, type_etat, mois_retard, paiements,
  auteur, motif, note, delai_minimum_jours, edl,
  auteur_id = null,
  envoyer_email = true
}) => {
  try {
    var modele = T.MODELES[type];
    if (!modele) return { success: false, erreur: 'Type de document non reconnu : ' + type };

    var maintenant = new Date();
    var numero = await numeroSuivant(type);
    var qr = await QRCode.toString(T.URL_VERIF + numero, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });

    var donnees = {
      numero: numero,
      date: T.dateFR(maintenant),
      dateHeure: T.dateHeureFR(maintenant),
      dateGeneration: maintenant,
      qr: qr,
      proprietaire: proprietaire || {}, locataire: locataire || {}, logement: logement || {},
      periode: periode, montant: montant, mode_paiement: mode_paiement,
      duree_mois: duree_mois, type_location: type_location,
      mois: mois, annee: annee,
      date_depart: date_depart, type_etat: type_etat, mois_retard: mois_retard, paiements: paiements,
      auteur: auteur, motif: motif, note: note, delai_minimum_jours: delai_minimum_jours, edl: edl
    };

    var htmlAvecJeton = modele(donnees);
    var hash = sha256(htmlAvecJeton);
    var html = htmlAvecJeton.split(T.EMPREINTE_JETON).join(hash);
    var titre = titreDocument(type, numero, { mois: mois, annee: annee, type_etat: type_etat, auteur: auteur });

    // Données d'entrée conservées (sans le QR ni l'horodatage objet) pour audit.
    var snapshot = Object.assign({}, donnees);
    delete snapshot.qr; delete snapshot.dateGeneration;

    var result = await db.query(
      `INSERT INTO documents
        (type, titre, numero, reservation_id, paiement_id, logement_id,
         proprietaire_id, locataire_id, contenu_html, donnees, hash_sha256,
         statut, verrouille_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'genere', NOW())
       RETURNING *`,
      [
        type, titre, numero,
        reservation_id || null,
        paiement_id || null,
        logement ? logement.id : null,
        proprietaire ? proprietaire.id : null,
        locataire ? locataire.id : null,
        html, JSON.stringify(snapshot), hash
      ]
    );

    var document = result.rows[0];
    await enregistrerEvenement(document.id, 'genere', auteur_id, { type: type, numero: numero });

    // Envoi par e-mail au locataire si demandé (non bloquant)
    if (envoyer_email && locataire && locataire.email) {
      try {
        var envoye = await envoyerEmailDocument({
          email: locataire.email,
          prenom: locataire.prenom,
          typeDocument: type,
          numeroDocument: numero,
          htmlDocument: html,
          nomFichier: numero + '.html'
        });
        if (envoye === false) throw new Error('envoi refusé par le service e-mail');
        var maj = await db.query(
          `UPDATE documents SET email_envoye = TRUE, email_envoye_at = NOW()
           WHERE id = $1 RETURNING *`,
          [document.id]
        );
        document = maj.rows[0] || document;
        await enregistrerEvenement(document.id, 'envoye_email', auteur_id, { destinataire: locataire.email });
      } catch (emailErr) {
        console.warn('E-mail non envoyé (non bloquant):', emailErr.message);
      }
    }

    return { success: true, document, numero };

  } catch (err) {
    console.error('Erreur génération document:', err.message, err.stack);
    return { success: false, erreur: err.message };
  }
};

// ================================================
// APERÇU : rend le document sans rien enregistrer (ni numéro, ni empreinte).
// Sert à relire avant d'envoyer ; l'aperçu porte un filigrane « APERÇU ».
// ================================================
function apercuDocument(params) {
  var modele = T.MODELES[params.type];
  if (!modele) return null;
  var maintenant = new Date();
  var donnees = Object.assign({}, params, {
    numero: 'APERÇU',
    date: T.dateFR(maintenant),
    dateHeure: T.dateHeureFR(maintenant),
    dateGeneration: maintenant,
    qr: '',
    proprietaire: params.proprietaire || {}, locataire: params.locataire || {}, logement: params.logement || {}
  });
  var html = modele(donnees).split(T.EMPREINTE_JETON).join('généré à l\'envoi');
  var filigrane = '<div style="position:fixed;top:40%;left:0;right:0;text-align:center;font:800 130px Arial,sans-serif;' +
    'color:rgba(27,107,58,.10);transform:rotate(-22deg);pointer-events:none;z-index:99">APERÇU</div>';
  return html.replace('</body>', filigrane + '</body>');
}

// ================================================
// CONVERTIR UN DOCUMENT HTML EN PDF (Chromium)
// Le format de page vient du CSS (@page A4, marge 0) : un document = une
// feuille A4 (le bail : deux faces).
// ================================================
async function genererPdfDepuisHtml(html) {
  const chromium = require('@sparticuz/chromium');
  const puppeteer = require('puppeteer-core');

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  genererDocument, genererPdfDepuisHtml,
  calculerEmpreinte, verifierIntegrite, enregistrerEvenement, apercuDocument,
  injecterSignaturesBail: T.injecterSignaturesBail,
  injecterAccuseReception: T.injecterAccuseReception
};
