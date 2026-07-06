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
// Paiements du locataire connecté
router.get('/mes-paiements', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT p.*,
         l.titre as logement_titre,
         l.adresse as logement_adresse
       FROM paiements p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       WHERE r.locataire_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ paiements: result.rows });
  } catch (err) {
    console.error('[GET /mes-paiements]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

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