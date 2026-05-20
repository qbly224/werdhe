const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage
// Les photos sont automatiquement uploadées sur Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'werdhe/logements',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      // Redimensionner automatiquement pour optimiser
      { width: 1200, height: 800, crop: 'fill', quality: 'auto' }
    ]
  }
});

// Middleware multer avec validation
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max par photo
    files: 10                   // 10 photos max
  },
  fileFilter: (req, file, cb) => {
    const typesAutorises = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (typesAutorises.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP'), false);
    }
  }
});

// Supprimer une photo de Cloudinary
const supprimerPhoto = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.error('Erreur suppression photo:', err);
    return false;
  }
};

module.exports = { upload, supprimerPhoto, cloudinary };