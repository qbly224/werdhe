const express = require('express');
const router = express.Router();
const verifierToken = require('../middleware/auth');
const {
  creerLocataire,
  getMesLocataires,
  modifierLocataire,
  supprimerLocataire,
  attribuerLogement
} = require('../controllers/locataireManuelController');

router.get('/', verifierToken, getMesLocataires);
router.post('/', verifierToken, creerLocataire);
router.put('/:id', verifierToken, modifierLocataire);
router.delete('/:id', verifierToken, supprimerLocataire);
router.patch('/:id/attribuer', verifierToken, attribuerLogement);

module.exports = router;