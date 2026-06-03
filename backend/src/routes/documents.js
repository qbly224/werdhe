const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  genererDocumentManuel,
  genererQuittancesMensuelles,
  signerBail,
  getMesDocuments,
  telechargerDocument,
  renvoyerEmail,
  uploadManuel,
  uploaderDocumentManuel
} = require('../controllers/documentController');

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

// Télécharger un document
router.get('/:id/telecharger', verifierToken, telechargerDocument);

// Renvoyer par email
router.post('/:id/renvoyer-email', verifierToken, renvoyerEmail);

// Upload manuel d'un fichier
router.post(
  '/upload-manuel',
  verifierToken,
  uploadManuel.single('fichier'),
  uploaderDocumentManuel
);

module.exports = router;