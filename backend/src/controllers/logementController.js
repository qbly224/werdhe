const db = require('../database');

// ================================
// AJOUTER UN LOGEMENT
// ================================
// Accessible uniquement aux propriétaires
const ajouterLogement = async (req, res) => {
  try {
    const {
      titre,
      description,
      adresse,
      ville,
      pays,
      prix_mensuel,
      nb_chambres,
      nb_salles_bain,
      superficie
    } = req.body;

    // Vérifier que l'utilisateur est bien un propriétaire
    // req.user est injecté par le middleware JWT
    if (req.user.role !== 'proprietaire' && req.user.role !== 'les_deux') {
      return res.status(403).json({
        erreur: 'Seuls les propriétaires peuvent ajouter un logement'
      });
    }

    // Vérifier les champs obligatoires
    if (!titre || !adresse || !ville || !prix_mensuel) {
      return res.status(400).json({
        erreur: 'Titre, adresse, ville et prix sont obligatoires'
      });
    }

    // Insérer en base de données
    const result = await db.query(
      `INSERT INTO logements 
        (proprietaire_id, titre, description, adresse, ville, pays, 
         prix_mensuel, nb_chambres, nb_salles_bain, superficie)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,  // ID du propriétaire récupéré depuis le token JWT
        titre,
        description,
        adresse,
        ville,
        pays || 'Guinée',
        prix_mensuel,
        nb_chambres || 1,
        nb_salles_bain || 1,
        superficie
      ]
    );

    res.status(201).json({
      message: '✅ Logement ajouté avec succès !',
      logement: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur ajout logement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR TOUS LES LOGEMENTS DISPONIBLES
// ================================
// Accessible à tous (même sans compte)
const getLogements = async (req, res) => {
  try {
    // Récupérer les filtres de recherche depuis l'URL
    // Ex: /logements?ville=Conakry&prix_max=500000
    const { ville, prix_max, prix_min, nb_chambres } = req.query;

    // Construction dynamique de la requête SQL selon les filtres
    let query = `
      SELECT 
        l.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.telephone as proprietaire_telephone
      FROM logements l
      JOIN users u ON l.proprietaire_id = u.id
      WHERE l.statut = 'disponible'
    `;

    const params = [];
    let paramIndex = 1;

    // Ajouter les filtres dynamiquement
    if (ville) {
      query += ` AND LOWER(l.ville) = LOWER($${paramIndex})`;
      params.push(ville);
      paramIndex++;
    }

    if (prix_min) {
      query += ` AND l.prix_mensuel >= $${paramIndex}`;
      params.push(prix_min);
      paramIndex++;
    }

    if (prix_max) {
      query += ` AND l.prix_mensuel <= $${paramIndex}`;
      params.push(prix_max);
      paramIndex++;
    }

    if (nb_chambres) {
      query += ` AND l.nb_chambres >= $${paramIndex}`;
      params.push(nb_chambres);
      paramIndex++;
    }

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
      `SELECT 
        l.*,
        u.nom as proprietaire_nom,
        u.prenom as proprietaire_prenom,
        u.telephone as proprietaire_telephone
       FROM logements l
       JOIN users u ON l.proprietaire_id = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Logement non trouvé'
      });
    }

    res.json({ logement: result.rows[0] });

  } catch (err) {
    console.error('Erreur récupération logement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR SES PROPRES LOGEMENTS
// ================================
// Un propriétaire voit uniquement ses logements
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
    console.error('Erreur mes logements:', err.message);
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
      titre,
      description,
      adresse,
      ville,
      prix_mensuel,
      nb_chambres,
      nb_salles_bain,
      superficie,
      statut
    } = req.body;

    // Vérifier que le logement appartient bien à ce propriétaire
    const logement = await db.query(
      'SELECT * FROM logements WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Logement non trouvé ou non autorisé'
      });
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
        statut = COALESCE($9, statut)
       WHERE id = $10
       RETURNING *`,
      [titre, description, adresse, ville, prix_mensuel,
       nb_chambres, nb_salles_bain, superficie, statut, id]
    );

    res.json({
      message: '✅ Logement modifié avec succès !',
      logement: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur modification logement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// SUPPRIMER UN LOGEMENT
// ================================
const supprimerLogement = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le logement appartient bien à ce propriétaire
    const result = await db.query(
      'DELETE FROM logements WHERE id = $1 AND proprietaire_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Logement non trouvé ou non autorisé'
      });
    }

    res.json({ message: '✅ Logement supprimé avec succès !' });

  } catch (err) {
    console.error('Erreur suppression logement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  ajouterLogement,
  getLogements,
  getLogement,
  getMesLogements,
  modifierLogement,
  supprimerLogement
};