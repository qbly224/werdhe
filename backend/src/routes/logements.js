const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  ajouterLogement,
  getLogements,
  getLogement,
  getMesLogements,
  modifierLogement,
  supprimerLogement
} = require('../controllers/logementController');

// Routes publiques (sans token)
// N'importe qui peut voir les logements disponibles
router.get('/', getLogements);
router.get('/:id', getLogement);

// Routes protégées (token JWT obligatoire)
// Seuls les utilisateurs connectés peuvent faire ces actions
router.get('/proprietaire/mes-logements', verifierToken, getMesLogements);
router.post('/', verifierToken, ajouterLogement);
router.put('/:id', verifierToken, modifierLogement);
router.delete('/:id', verifierToken, supprimerLogement);

module.exports = router;