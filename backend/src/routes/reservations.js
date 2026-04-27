const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  creerReservation,
  getMesReservations,
  getReservationsProprietaire,
  traiterReservation,
  annulerReservation
} = require('../controllers/reservationController');

// Toutes les routes réservations sont protégées
// Un utilisateur doit être connecté pour réserver

// Locataire
router.post('/', verifierToken, creerReservation);
router.get('/mes-reservations', verifierToken, getMesReservations);
router.patch('/:id/annuler', verifierToken, annulerReservation);

// Propriétaire
router.get('/proprietaire', verifierToken, getReservationsProprietaire);
router.patch('/:id/traiter', verifierToken, traiterReservation);

module.exports = router;