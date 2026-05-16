const express = require('express');
const router = express.Router();
const {
  getRegions,
  getPrefectures,
  getCommunes
} = require('../controllers/localisationController');

router.get('/regions', getRegions);
router.get('/prefectures/:region_id', getPrefectures);
router.get('/communes/:prefecture_id', getCommunes);

module.exports = router;