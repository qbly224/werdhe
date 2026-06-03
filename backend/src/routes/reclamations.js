const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  creerReclamation, getReclamations,
  getTimeline, mettreAJourStatut,
  ajouterCommentaire, uploadPhoto
} = require('../controllers/reclamationsController');

// Voir mes réclamations
router.get('/', verifierToken, getReclamations);

// Créer une réclamation avec photo
router.post('/', verifierToken, uploadPhoto.single('photo'), creerReclamation);

// Timeline d'une réclamation
router.get('/:id/timeline', verifierToken, getTimeline);

// Mettre à jour le statut (proprio)
router.patch('/:id/statut', verifierToken, mettreAJourStatut);

// Ajouter un commentaire avec photo optionnelle
router.post('/:id/commentaire', verifierToken, uploadPhoto.single('photo'), ajouterCommentaire);

module.exports = router;