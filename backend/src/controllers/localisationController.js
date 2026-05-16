const db = require('../database');

// Récupérer toutes les régions
const getRegions = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM regions ORDER BY nom'
    );
    res.json({ regions: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// Récupérer les préfectures d'une région
const getPrefectures = async (req, res) => {
  try {
    const { region_id } = req.params;
    const result = await db.query(
      'SELECT * FROM prefectures WHERE region_id = $1 ORDER BY nom',
      [region_id]
    );
    res.json({ prefectures: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// Récupérer les communes d'une préfecture
const getCommunes = async (req, res) => {
  try {
    const { prefecture_id } = req.params;
    const result = await db.query(
      'SELECT * FROM communes WHERE prefecture_id = $1 ORDER BY nom',
      [prefecture_id]
    );
    res.json({ communes: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = { getRegions, getPrefectures, getCommunes };