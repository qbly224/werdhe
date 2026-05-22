const db = require('../database');
const { geocoderAdresse } = require('../services/geocodingService');
const db = require('../database');

const CATEGORIES_VALIDES = [
  'villa_luxe', 'villa_standard',
  'maison_moderne', 'maison_banco', 'maison_chantier', 'concession',
  'appartement', 'duplex', 'logement_social',
  'studio_moderne', 'chambre_habitant', 'chambre_cour', 'habitat_precaire',
  'boutique', 'bureau', 'entrepot', 'local_commercial', 'centre_commercial'
];

// ================================
// AJOUTER UN LOGEMENT
// ================================
const ajouterLogement = async (req, res) => {
  try {
    const {
      titre, description, adresse, ville, quartier,
      pays, prix_mensuel, nb_chambres, nb_salles_bain,
      superficie, categorie, region_id, prefecture_id, commune_id,
      etat, type_toit, type_sol, acces_eau, electricite,
      statut_foncier, sanitaires_type, parking, jardin,
      climatisation, gardien
    } = req.body;

    if (req.user.role !== 'proprietaire' && req.user.role !== 'les_deux') {
      return res.status(403).json({
        erreur: 'Seuls les propriétaires peuvent ajouter un logement'
      });
    }

    if (!titre || !adresse || !ville || !prix_mensuel) {
      return res.status(400).json({
        erreur: 'Titre, adresse, ville et prix sont obligatoires'
      });
    }

    if (categorie && !CATEGORIES_VALIDES.includes(categorie)) {
      return res.status(400).json({
        erreur: `Catégorie invalide : ${categorie}`
      });
    }

    const result = await db.query(
      `INSERT INTO logements
        (proprietaire_id, titre, description, adresse, ville, quartier,
         pays, prix_mensuel, nb_chambres, nb_salles_bain, superficie,
         categorie, region_id, prefecture_id, commune_id,
         etat, type_toit, type_sol, acces_eau, electricite,
         statut_foncier, sanitaires_type, parking, jardin,
         climatisation, gardien, photos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
               $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'[]')
       RETURNING *`,
      [
        req.user.id, titre, description, adresse, ville, quartier || null,
        pays || 'Guinée', prix_mensuel,
        nb_chambres !== undefined ? nb_chambres : 1,
        nb_salles_bain !== undefined ? nb_salles_bain : 1,
        superficie || null,
        categorie || 'appartement',
        region_id || null, prefecture_id || null, commune_id || null,
        etat || 'bon_etat', type_toit || null, type_sol || null,
        acces_eau || null, electricite || null,
        statut_foncier || 'non_precise',
        sanitaires_type || 'interne',
        parking || false, jardin || false,
        climatisation || false, gardien || false
      ]
    );
// Géocoder l'adresse automatiquement
const coords = await geocoderAdresse(adresse, ville);
await db.query(
  'UPDATE logements SET latitude = $1, longitude = $2 WHERE id = $3',
  [coords.latitude, coords.longitude, result.rows[0].id]
);
result.rows[0].latitude = coords.latitude;
result.rows[0].longitude = coords.longitude;
    res.status(201).json({
      message: '✅ Logement ajouté avec succès !',
      logement: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur ajout logement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur : ' + err.message });
  }
};

// ================================
// VOIR TOUS LES LOGEMENTS DISPONIBLES
// ================================
const getLogements = async (req, res) => {
  try {
    const { ville, prix_max, prix_min, nb_chambres, categorie } = req.query;

    let query = `
      SELECT l.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.telephone as proprietaire_telephone
      FROM logements l
      JOIN users u ON l.proprietaire_id = u.id
      WHERE l.statut = 'disponible'
    `;

    const params = [];
    let i = 1;

    if (ville) { query += ` AND LOWER(l.ville) = LOWER($${i})`; params.push(ville); i++; }
    if (prix_min) { query += ` AND l.prix_mensuel >= $${i}`; params.push(prix_min); i++; }
    if (prix_max) { query += ` AND l.prix_mensuel <= $${i}`; params.push(prix_max); i++; }
    if (nb_chambres) { query += ` AND l.nb_chambres >= $${i}`; params.push(nb_chambres); i++; }
    if (categorie) { query += ` AND l.categorie = $${i}`; params.push(categorie); i++; }

    query += ' ORDER BY l.created_at DESC';

    const result = await db.query(query, params);
    res.json({
      message: `✅ ${result.rows.length} logement(s) trouvé(s)`,
      logements: result.rows
    });

  } catch (err) {
    console.error('Erreur récupération logements:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR UN LOGEMENT EN DÉTAIL
// ================================
const getLogement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT l.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.telephone as proprietaire_telephone
       FROM logements l
       JOIN users u ON l.proprietaire_id = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement non trouvé' });
    }

    res.json({ logement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// MES LOGEMENTS
// ================================
const getMesLogements = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM logements
       WHERE proprietaire_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({
      message: `✅ ${result.rows.length} logement(s)`,
      logements: result.rows
    });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// MODIFIER UN LOGEMENT
// ================================
const modifierLogement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre, description, adresse, ville, prix_mensuel,
      nb_chambres, nb_salles_bain, superficie, statut, categorie
    } = req.body;

    const logement = await db.query(
      'SELECT * FROM logements WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement non trouvé ou non autorisé' });
    }

    const result = await db.query(
      `UPDATE logements SET
        titre = COALESCE($1, titre),
        description = COALESCE($2, description),
        adresse = COALESCE($3, adresse),
        ville = COALESCE($4, ville),
        prix_mensuel = COALESCE($5, prix_mensuel),
        nb_chambres = COALESCE($6, nb_chambres),
        nb_salles_bain = COALESCE($7, nb_salles_bain),
        superficie = COALESCE($8, superficie),
        statut = COALESCE($9, statut),
        categorie = COALESCE($10, categorie)
       WHERE id = $11 RETURNING *`,
      [titre, description, adresse, ville, prix_mensuel,
       nb_chambres, nb_salles_bain, superficie, statut, categorie, id]
    );

    res.json({ message: '✅ Logement modifié !', logement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// SUPPRIMER UN LOGEMENT
// ================================
const supprimerLogement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM logements WHERE id = $1 AND proprietaire_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement non trouvé ou non autorisé' });
    }

    res.json({ message: '✅ Logement supprimé !' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  ajouterLogement, getLogements, getLogement,
  getMesLogements, modifierLogement, supprimerLogement
};