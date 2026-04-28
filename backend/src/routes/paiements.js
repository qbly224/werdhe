const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  effectuerPaiement,
  confirmerPaiementEspeces,
  getMesPaiements,
  getPaiementsProprietaire,
  getFacture
} = require('../controllers/paiementController');

// Toutes les routes paiements sont protégées

// Locataire
router.post('/', verifierToken, effectuerPaiement);
router.get('/mes-paiements', verifierToken, getMesPaiements);

// Propriétaire
router.get('/proprietaire', verifierToken, getPaiementsProprietaire);
router.patch('/:id/confirmer-especes', verifierToken, confirmerPaiementEspeces);

// Facture (accessible aux deux parties)
router.get('/facture/:numero', verifierToken, getFacture);

module.exports = router;