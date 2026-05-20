const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const { upload } = require('../services/cloudinaryService');
const {
  uploaderPhotos,
  getPhotos,
  supprimerUnePhoto,
  definirPhotoPrincipale
} = require('../controllers/photoController');

// Voir les photos (public)
router.get('/:id/photos', getPhotos);

// Uploader des photos (protégé)
// upload.array('photos', 10) = accepte jusqu'à 10 photos
router.post(
  '/:id/photos',
  verifierToken,
  upload.array('photos', 10),
  uploaderPhotos
);

// Supprimer une photo (protégé)
router.delete('/:id/photos/:publicId', verifierToken, supprimerUnePhoto);

// Définir photo principale (protégé)
router.patch('/:id/photos/principale', verifierToken, definirPhotoPrincipale);

module.exports = router;