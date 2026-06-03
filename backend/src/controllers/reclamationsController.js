const db = require('../database');
const cloudinary = require('../services/cloudinaryService');
const multer = require('multer');

// ================================================
// UPLOAD PHOTO pour réclamations
// ================================================
const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seulement les images sont acceptees'), false);
    }
  }
});

// ================================================
// CRÉER UNE RÉCLAMATION (locataire)
// ================================================
const creerReclamation = async (req, res) => {
  try {
    var { titre, description, categorie, priorite, logement_id, reservation_id } = req.body;
    var locataireId = req.user.id;
    var photoUrl = null;

    if (!titre) {
      return res.status(400).json({ erreur: 'Titre requis' });
    }

    // Uploader la photo si fournie
    if (req.file) {
      var buffer = req.file.buffer.toString('base64');
      var dataUri = 'data:' + req.file.mimetype + ';base64,' + buffer;
      var uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'werdhe/reclamations',
        public_id: 'recl_' + Date.now()
      });
      photoUrl = uploadResult.secure_url;
    }

    // Trouver le proprio du logement
    var logement = await db.query(
      'SELECT proprietaire_id FROM logements WHERE id = $1',
      [logement_id]
    );

    if (logement.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement non trouve' });
    }

    var proprietaireId = logement.rows[0].proprietaire_id;

    // Créer la réclamation
    var result = await db.query(
      `INSERT INTO reclamations
        (locataire_id, proprietaire_id, logement_id, reservation_id,
         titre, description, categorie, priorite, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        locataireId, proprietaireId, logement_id,
        reservation_id || null, titre, description || null,
        categorie || 'autre', priorite || 'normale', photoUrl
      ]
    );

    var reclamation = result.rows[0];

    // Ajouter l'événement "création" dans la timeline
    await db.query(
      `INSERT INTO reclamations_timeline
        (reclamation_id, auteur_id, type, contenu, nouveau_statut, photo_url)
       VALUES ($1, $2, 'creation', $3, 'ouverte', $4)`,
      [reclamation.id, locataireId, 'Reclamation ouverte : ' + titre, photoUrl]
    );

    // Créer une alerte pour le propriétaire
    await db.query(
      `INSERT INTO alertes
        (proprietaire_id, logement_id, type, titre, description, priorite)
       VALUES ($1, $2, 'panne', $3, $4, $5)`,
      [
        proprietaireId, logement_id,
        'Reclamation : ' + titre,
        description || 'Le locataire a signale un probleme',
        priorite || 'normale'
      ]
    );

    res.status(201).json({
      message: 'Reclamation envoyee au proprietaire !',
      reclamation: reclamation
    });

  } catch (err) {
    console.error('Erreur creation reclamation:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// VOIR MES RÉCLAMATIONS
// Locataire voit les siennes, proprio voit celles de ses biens
// ================================================
const getReclamations = async (req, res) => {
  try {
    var userId = req.user.id;
    var role = req.user.role;
    var { statut } = req.query;

    var whereClause = role === 'locataire'
      ? 'r.locataire_id = $1'
      : 'r.proprietaire_id = $1';

    var query = `
      SELECT r.*,
        l.titre as logement_titre, l.adresse as logement_adresse,
        u_loc.nom as loc_nom, u_loc.prenom as loc_prenom, u_loc.telephone as loc_tel,
        u_prop.nom as prop_nom, u_prop.prenom as prop_prenom
      FROM reclamations r
      JOIN logements l ON r.logement_id = l.id
      JOIN users u_loc ON r.locataire_id = u_loc.id
      JOIN users u_prop ON r.proprietaire_id = u_prop.id
      WHERE ${whereClause}
    `;

    var params = [userId];

    if (statut) {
      query += ' AND r.statut = $2';
      params.push(statut);
    }

    query += ' ORDER BY r.created_at DESC';

    var result = await db.query(query, params);

    res.json({
      reclamations: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Erreur get reclamations:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// TIMELINE D'UNE RÉCLAMATION
// ================================================
const getTimeline = async (req, res) => {
  try {
    var { id } = req.params;
    var userId = req.user.id;

    // Vérifier accès
    var recl = await db.query(
      'SELECT * FROM reclamations WHERE id = $1 AND (locataire_id = $2 OR proprietaire_id = $2)',
      [id, userId]
    );

    if (recl.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reclamation non trouvee' });
    }

    // Récupérer la timeline
    var timeline = await db.query(
      `SELECT t.*,
         u.nom, u.prenom, u.role
       FROM reclamations_timeline t
       LEFT JOIN users u ON t.auteur_id = u.id
       WHERE t.reclamation_id = $1
       ORDER BY t.created_at ASC`,
      [id]
    );

    res.json({
      reclamation: recl.rows[0],
      timeline: timeline.rows
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// METTRE À JOUR LE STATUT (proprio)
// + ajouter dans la timeline
// ================================================
const mettreAJourStatut = async (req, res) => {
  try {
    var { id } = req.params;
    var { statut, commentaire } = req.body;
    var userId = req.user.id;

    var statutsValides = ['en_cours', 'resolue', 'fermee'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ erreur: 'Statut invalide' });
    }

    // Vérifier que c'est le proprio
    var recl = await db.query(
      'SELECT * FROM reclamations WHERE id = $1 AND proprietaire_id = $2',
      [id, userId]
    );

    if (recl.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorise' });
    }

    var ancienStatut = recl.rows[0].statut;

    // Mettre à jour le statut
    await db.query(
      'UPDATE reclamations SET statut = $1, updated_at = NOW() WHERE id = $2',
      [statut, id]
    );

    // Ajouter dans la timeline
    await db.query(
      `INSERT INTO reclamations_timeline
        (reclamation_id, auteur_id, type, contenu, ancien_statut, nouveau_statut)
       VALUES ($1, $2, 'statut_change', $3, $4, $5)`,
      [
        id, userId,
        commentaire || ('Statut change en : ' + statut),
        ancienStatut, statut
      ]
    );

    // Mettre à jour le score du proprio (réactivité)
    if (statut === 'resolue') {
      await db.query(
        `UPDATE scores_confiance
         SET nb_reclamations_resolues = nb_reclamations_resolues + 1,
             updated_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      // Recalculer le score
      await recalculerScore(userId);
    }

    res.json({ message: 'Statut mis a jour ! Timeline mise a jour.' });

  } catch (err) {
    console.error('Erreur update statut:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// AJOUTER UN COMMENTAIRE dans la timeline
// ================================================
const ajouterCommentaire = async (req, res) => {
  try {
    var { id } = req.params;
    var { commentaire } = req.body;
    var userId = req.user.id;
    var photoUrl = null;

    // Vérifier accès
    var recl = await db.query(
      'SELECT * FROM reclamations WHERE id = $1 AND (locataire_id = $2 OR proprietaire_id = $2)',
      [id, userId]
    );

    if (recl.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorise' });
    }

    if (req.file) {
      var buffer = req.file.buffer.toString('base64');
      var dataUri = 'data:' + req.file.mimetype + ';base64,' + buffer;
      var uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'werdhe/reclamations', public_id: 'recl_com_' + Date.now()
      });
      photoUrl = uploadResult.secure_url;
    }

    await db.query(
      `INSERT INTO reclamations_timeline
        (reclamation_id, auteur_id, type, contenu, photo_url)
       VALUES ($1, $2, 'commentaire', $3, $4)`,
      [id, userId, commentaire, photoUrl]
    );

    res.json({ message: 'Commentaire ajoute a la timeline !' });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// RECALCULER LE SCORE DE CONFIANCE
// ================================================
async function recalculerScore(userId) {
  try {
    var score = await db.query(
      'SELECT * FROM scores_confiance WHERE user_id = $1',
      [userId]
    );

    if (score.rows.length === 0) return;

    var s = score.rows[0];
    var total = 50; // Score de base

    // +2 points par paiement à l'heure
    total += Math.min(s.nb_paiements_a_temps * 2, 30);
    // -5 points par retard
    total -= Math.min(s.nb_paiements_retard * 5, 30);
    // +3 points par réclamation résolue
    total += Math.min(s.nb_reclamations_resolues * 3, 15);
    // +2 points par location complète
    total += Math.min(s.nb_locations_completes * 2, 10);
    // Bonus taux de réponse
    if (s.taux_reponse >= 90) total += 5;

    // Limiter entre 0 et 100
    total = Math.max(0, Math.min(100, total));

    // Déterminer le badge
    var badge = 'nouveau';
    if (total >= 80) badge = 'elite';
    else if (total >= 65) badge = 'excellent';
    else if (total >= 50) badge = 'fiable';

    await db.query(
      `UPDATE scores_confiance
       SET score = $1, badge = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [total, badge, userId]
    );
  } catch (err) {
    console.error('Erreur calcul score:', err.message);
  }
}

module.exports = {
  creerReclamation,
  getReclamations,
  getTimeline,
  mettreAJourStatut,
  ajouterCommentaire,
  uploadPhoto,
  recalculerScore
};