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

const {
  initierOrangeMoney,
  initierMTNMomo,
  confirmerPaiement,
  webhookOrange,
  webhookMTN,
  verifierStatut
} = require('../controllers/mobilemoneyController');

// Mobile Money
router.post('/orange-money/initier', verifierToken, initierOrangeMoney);
router.post('/mtn-momo/initier', verifierToken, initierMTNMomo);
router.patch('/confirmer/:paiement_id', verifierToken, confirmerPaiement);
router.get('/statut/:paiement_id', verifierToken, verifierStatut);

// Webhooks (sans token)
router.post('/webhook/orange', webhookOrange);
router.post('/webhook/mtn', webhookMTN);

module.exports = router;