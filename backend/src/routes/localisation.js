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
// ─── SOUS-PRÉFECTURES ─────────────────────────────────────────────
router.get('/sous-prefectures/:prefecture_id', async (req, res) => {
  try {
    var result = await db.query(
      `SELECT id, nom FROM sous_prefectures
       WHERE prefecture_id = $1 ORDER BY nom ASC`,
      [req.params.prefecture_id]
    );
    res.json({ sous_prefectures: result.rows });
  } catch (err) {
    // Table n'existe pas encore — retourner vide sans erreur
    res.json({ sous_prefectures: [] });
  }
});
module.exports = router;