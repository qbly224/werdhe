const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  genererDocumentManuel,
  getMesDocuments,
  telechargerDocument,
  renvoyerEmail,
  uploadManuel,
  uploaderDocumentManuel
} = require('../controllers/documentController');

// Voir mes documents
router.get('/', verifierToken, getMesDocuments);

// Générer un document
router.post('/generer', verifierToken, genererDocumentManuel);

// Télécharger un document
router.get('/:id/telecharger', verifierToken, telechargerDocument);

// Renvoyer par email
router.post('/:id/renvoyer-email', verifierToken, renvoyerEmail);

// Upload manuel
router.post(
  '/upload-manuel',
  verifierToken,
  uploadManuel.single('fichier'),
  uploaderDocumentManuel
);

module.exports = router;