const express = require('express');
const db = require('../database');
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
// ← Remplacé par la version avec filtres avancés
router.get('/', async (req, res) => {
  try {
    const {
      ville, categorie,
      prix_min, prix_max,
      nb_chambres, superficie_min,
      search, page = 1, limit = 20
    } = req.query;

    var conditions = ['l.statut = $1'];
    var params     = ['disponible'];
    var idx        = 2;

    if (ville) {
      conditions.push(`LOWER(l.ville) LIKE LOWER($${idx})`);
      params.push('%' + ville + '%'); idx++;
    }
    if (categorie) {
      conditions.push(`l.categorie = $${idx}`);
      params.push(categorie); idx++;
    }
    if (prix_min) {
      conditions.push(`l.prix_mensuel >= $${idx}`);
      params.push(Number(prix_min)); idx++;
    }
    if (prix_max) {
      conditions.push(`l.prix_mensuel <= $${idx}`);
      params.push(Number(prix_max)); idx++;
    }
    if (nb_chambres) {
      conditions.push(`l.nb_chambres >= $${idx}`);
      params.push(Number(nb_chambres)); idx++;
    }
    if (superficie_min) {
      conditions.push(`l.superficie >= $${idx}`);
      params.push(Number(superficie_min)); idx++;
    }
    if (search) {
      conditions.push(
        `(LOWER(l.titre) LIKE LOWER($${idx})
          OR LOWER(l.adresse) LIKE LOWER($${idx})
          OR LOWER(l.description) LIKE LOWER($${idx}))`
      );
      params.push('%' + search + '%'); idx++;
    }

    var offset = (Number(page) - 1) * Number(limit);
    var where  = conditions.join(' AND ');

    var result = await db.query(
      `SELECT l.*,
         u.nom as prop_nom, u.prenom as prop_prenom,
         u.telephone as prop_tel
       FROM logements l
       JOIN users u ON l.proprietaire_id = u.id
       WHERE ${where}
       ORDER BY l.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), offset]
    );

    var total = await db.query(
      `SELECT COUNT(*) FROM logements l WHERE ${where}`,
      params
    );

    res.json({
      logements: result.rows,
      total:     parseInt(total.rows[0].count),
      page:      Number(page),
      pages:     Math.ceil(parseInt(total.rows[0].count) / Number(limit))
    });

  } catch (err) {
    console.error('GET /logements', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ← Cette ligne reste inchangée
router.get('/:id', getLogement);

// Routes protégées (token JWT obligatoire)
// Seuls les utilisateurs connectés peuvent faire ces actions
router.get('/proprietaire/mes-logements', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT l.*,
         -- Infos préavis actif
         p.id        as preavis_id,
         p.statut    as preavis_statut,
         p.date_sortie_estimee,
         p.delai_mois,
         -- Infos locataire actuel
         u.prenom    as locataire_prenom,
         u.nom       as locataire_nom,
         u.telephone as locataire_tel
       FROM logements l
       LEFT JOIN reservations r
         ON r.logement_id = l.id AND r.statut = 'confirmee'
       LEFT JOIN preavis p
         ON p.reservation_id = r.id AND p.statut = 'envoye'
       LEFT JOIN users u ON r.locataire_id = u.id
       WHERE l.proprietaire_id = $1
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json({ logements: result.rows });
  } catch (err) {
    console.error('[GET mes-logements]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Libérer un bien immédiatement (sans préavis)
router.patch('/:id/liberer', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que c'est bien le proprio
    const check = await db.query(
      'SELECT id FROM logements WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    // Terminer la réservation active
    await db.query(
      `UPDATE reservations SET statut = 'terminee', updated_at = NOW()
       WHERE logement_id = $1 AND statut = 'confirmee'`,
      [id]
    );

    // Terminer le préavis actif si existant
    await db.query(
      `UPDATE preavis SET statut = 'termine'
       WHERE reservation_id IN (
         SELECT id FROM reservations WHERE logement_id = $1
       ) AND statut = 'envoye'`,
      [id]
    );

    // Remettre le logement disponible
    await db.query(
      `UPDATE logements SET statut = 'disponible' WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Bien libéré avec succès', statut: 'disponible' });

  } catch (err) {
    console.error('[PATCH /logements/:id/liberer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});
router.post('/', verifierToken, ajouterLogement);
const { verifierLimiteBiens, verifierFonctionnalite } = require('../middleware/verifierPlan');

// Ajouter un bien — vérifier la limite du plan
router.post('/', verifierToken, verifierLimiteBiens, async (req, res) => {
  // ... code existant ...
});
router.put('/:id', verifierToken, modifierLogement);
router.delete('/:id', verifierToken, supprimerLogement);

module.exports = router;