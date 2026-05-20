const db = require('../database');
const { supprimerPhoto } = require('../services/cloudinaryService');

// ================================
// UPLOADER DES PHOTOS
// ================================
const uploaderPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le logement appartient au propriétaire
    const logement = await db.query(
      'SELECT * FROM logements WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Logement non trouvé ou non autorisé'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        erreur: 'Aucune photo reçue'
      });
    }

    // Récupérer les URLs et public_ids des photos uploadées
    const nouvelles_photos = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));

    // Récupérer les photos existantes
    const photosExistantes = logement.rows[0].photos || [];

    // Fusionner anciennes et nouvelles photos
    const toutesLesPhotos = [...photosExistantes, ...nouvelles_photos];

    // Mettre à jour en base de données
    await db.query(
      'UPDATE logements SET photos = $1 WHERE id = $2',
      [JSON.stringify(toutesLesPhotos), id]
    );

    res.json({
      message: `✅ ${req.files.length} photo(s) ajoutée(s) !`,
      photos: toutesLesPhotos
    });

  } catch (err) {
    console.error('Erreur upload photos:', err.message);
    res.status(500).json({ erreur: 'Erreur lors de l\'upload' });
  }
};

// ================================
// RÉCUPÉRER LES PHOTOS D'UN LOGEMENT
// ================================
const getPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT photos FROM logements WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement non trouvé' });
    }

    const photos = result.rows[0].photos || [];
    res.json({ photos });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// SUPPRIMER UNE PHOTO
// ================================
const supprimerUnePhoto = async (req, res) => {
  try {
    const { id, publicId } = req.params;

    // Vérifier que le logement appartient au propriétaire
    const logement = await db.query(
      'SELECT * FROM logements WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Logement non trouvé ou non autorisé'
      });
    }

    // Supprimer de Cloudinary
    const decodedPublicId = decodeURIComponent(publicId);
    await supprimerPhoto(decodedPublicId);

    // Supprimer de la base de données
    const photos = logement.rows[0].photos || [];
    const nouvellesPhotos = photos.filter(
      p => p.public_id !== decodedPublicId
    );

    await db.query(
      'UPDATE logements SET photos = $1 WHERE id = $2',
      [JSON.stringify(nouvellesPhotos), id]
    );

    res.json({
      message: '✅ Photo supprimée !',
      photos: nouvellesPhotos
    });

  } catch (err) {
    console.error('Erreur suppression photo:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// DÉFINIR LA PHOTO PRINCIPALE
// ================================
const definirPhotoPrincipale = async (req, res) => {
  try {
    const { id } = req.params;
    const { public_id } = req.body;

    const logement = await db.query(
      'SELECT * FROM logements WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement non trouvé' });
    }

    const photos = logement.rows[0].photos || [];

    // Mettre la photo sélectionnée en première position
    const photoIndex = photos.findIndex(p => p.public_id === public_id);
    if (photoIndex > 0) {
      const [photo] = photos.splice(photoIndex, 1);
      photos.unshift(photo);
    }

    await db.query(
      'UPDATE logements SET photos = $1 WHERE id = $2',
      [JSON.stringify(photos), id]
    );

    res.json({
      message: '✅ Photo principale définie !',
      photos
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  uploaderPhotos,
  getPhotos,
  supprimerUnePhoto,
  definirPhotoPrincipale
};