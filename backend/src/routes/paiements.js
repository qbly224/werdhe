const express = require('express');
const router  = require('express').Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');
const resoudreProprietaireEffectif = require('../middleware/equipe');
const {
  effectuerPaiement,
  confirmerPaiementEspeces,
  getMesPaiements,
  getPaiementsProprietaire,
  getFacture,
  initierPaiementDjomy,
  verifierStatutDjomy
} = require('../controllers/paiementController');
const { webhookDjomy } = require('../controllers/djomyWebhookController');

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
router.get('/proprietaire', verifierToken, resoudreProprietaireEffectif, getPaiementsProprietaire);
router.patch('/:id/confirmer-especes', verifierToken, confirmerPaiementEspeces);

// Facture (accessible aux deux parties)
router.get('/facture/:numero', verifierToken, getFacture);

// Paiement du loyer via Djomy (Orange Money / MTN MoMo / Kulu / carte,
// avec redirection vers la page de paiement hébergée par Djomy)
router.post('/djomy/initier', verifierToken, initierPaiementDjomy);
router.get('/djomy/statut/:id', verifierToken, verifierStatutDjomy);

// Webhook signé Djomy (sans token — authentifié par signature HMAC),
// partagé entre les paiements de loyer et d'abonnement
router.post('/webhook/djomy', webhookDjomy);

module.exports = router;