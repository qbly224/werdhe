const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
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
} = require('../controllers/documentController');

// Vérifier l'authenticité d'un document (public : lien du QR code)
router.get('/verifier/:numero', verifierDocument);

// Voir mes documents (proprio + locataire)
router.get('/', verifierToken, getMesDocuments);

// Générer un document (tous types)
router.post('/generer', verifierToken, genererDocumentManuel);

// Générer les quittances mensuelles automatiques
// (à appeler par un CRON job ou manuellement)
router.post('/quittances-mensuelles', verifierToken, genererQuittancesMensuelles);

// Signer un bail (proprio uniquement)
// Active officiellement la location
router.post('/signer-bail', verifierToken, signerBail);

// Télécharger le bail d'une location (généré à la demande s'il n'existe pas)
router.get('/bail/:reservation_id/telecharger', verifierToken, telechargerBailReservation);

// Télécharger un document
router.get('/:id/telecharger', verifierToken, telechargerDocument);

// Envoyer / renvoyer par email
router.post('/:id/renvoyer-email', verifierToken, renvoyerEmail);

// Annuler un document généré (il ne se modifie pas)
router.post('/:id/annuler', verifierToken, annulerDocument);

// Upload manuel d'un fichier
router.post(
  '/upload-manuel',
  verifierToken,
  uploadManuel.single('fichier'),
  uploaderDocumentManuel
);

module.exports = router;