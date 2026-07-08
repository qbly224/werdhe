const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');

// ════════════════════════════════════════════════════════
// MIDDLEWARE — Accès admin uniquement
// Toi seul avec role='admin' en base peux accéder
// ════════════════════════════════════════════════════════
function verifierAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ erreur: 'Accès réservé à l\'administrateur Werdhe' });
}

// ════════════════════════════════════════════════════════
// STATISTIQUES GÉNÉRALES
// ════════════════════════════════════════════════════════
router.get('/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var [users, logements, reservations, paiements, signalements, inscriptionsParMois, logementsParMois, villesActives] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN role='proprietaire' THEN 1 END) as proprio,
          COUNT(CASE WHEN role='locataire' THEN 1 END) as locataire,
          COUNT(CASE WHEN suspendu = TRUE THEN 1 END) as suspendus,
          COUNT(CASE WHEN verifie = TRUE THEN 1 END) as verifies
        FROM users
      `),
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN statut='loue' THEN 1 END) as loues,
          COUNT(CASE WHEN statut='disponible' THEN 1 END) as disponibles,
          COUNT(CASE WHEN masque = TRUE THEN 1 END) as masques,
          COUNT(CASE WHEN verifie = TRUE THEN 1 END) as verifies
        FROM logements
      `),
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN statut='confirmee' THEN 1 END) as confirmees,
          COUNT(CASE WHEN statut='en_attente' THEN 1 END) as en_attente,
          COUNT(CASE WHEN statut='refusee' THEN 1 END) as refusees
        FROM reservations
      `),
      db.query(`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(montant), 0) as volume,
          COUNT(CASE WHEN mode_paiement='orange_money' THEN 1 END) as orange_money,
          COUNT(CASE WHEN mode_paiement='mtn_momo' THEN 1 END) as mtn_momo,
          COUNT(CASE WHEN mode_paiement='especes' THEN 1 END) as especes
        FROM paiements
        WHERE statut = 'complete'
      `),
      db.query("SELECT COUNT(*) as total, COUNT(CASE WHEN statut='ouvert' THEN 1 END) as ouverts FROM signalements"),
      // Inscriptions des 6 derniers mois
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as mois,
          COUNT(*) as total
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `),
      // Logements publiés par mois
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as mois,
          COUNT(*) as total
        FROM logements
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `),
      // Villes les plus actives
      db.query(`
        SELECT ville, COUNT(*) as total
        FROM logements
        WHERE ville IS NOT NULL
        GROUP BY ville
        ORDER BY total DESC
        LIMIT 5
      `),
    ]);

    res.json({
      users:               users.rows[0],
      logements:           logements.rows[0],
      reservations:        reservations.rows[0],
      paiements:           paiements.rows[0],
      signalements:        signalements.rows[0],
      inscriptions_mois:   inscriptionsParMois.rows,
      logements_mois:      logementsParMois.rows,
      villes_actives:      villesActives.rows,
    });
  } catch (err) {
    console.error('Admin stats:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ════════════════════════════════════════════════════════
// UTILISATEURS
// ════════════════════════════════════════════════════════
router.get('/users', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { role, statut, search } = req.query;
    var conditions = ['1=1'];
    var params = [];
    var idx = 1;

    if (role && role !== 'tous') {
      conditions.push(`u.role = $${idx}`);
      params.push(role); idx++;
    }
    if (statut === 'suspendus') {
      conditions.push('u.suspendu = TRUE');
    } else if (statut === 'actifs') {
      conditions.push('(u.suspendu IS NULL OR u.suspendu = FALSE)');
    }
    if (search) {
      conditions.push(`(LOWER(u.nom) LIKE LOWER($${idx}) OR LOWER(u.prenom) LIKE LOWER($${idx}) OR LOWER(u.email) LIKE LOWER($${idx}))`);
      params.push('%' + search + '%'); idx++;
    }

    var result = await db.query(
      `SELECT
         u.id, u.nom, u.prenom, u.email, u.telephone, u.role,
         u.suspendu, u.verifie, u.created_at,
         COUNT(DISTINCT l.id) as nb_logements,
         COUNT(DISTINCT r.id) as nb_reservations
       FROM users u
       LEFT JOIN logements l ON l.proprietaire_id = u.id
       LEFT JOIN reservations r ON r.locataire_id = u.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      params
    );

    res.json({ users: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Admin users:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Suspendre / Réactiver un utilisateur
router.patch('/users/:id/suspendre', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var current = await db.query('SELECT suspendu, role FROM users WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    if (current.rows[0].role === 'admin') return res.status(400).json({ erreur: 'Impossible de suspendre un admin' });
    var newVal = !(current.rows[0].suspendu);
    await db.query('UPDATE users SET suspendu = $1 WHERE id = $2', [newVal, req.params.id]);
    res.json({ message: newVal ? 'Compte suspendu' : 'Compte réactivé', suspendu: newVal });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Vérifier l'identité d'un propriétaire → badge "Propriétaire Vérifié"
router.patch('/users/:id/verifier', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { verifie } = req.body;
    await db.query('UPDATE users SET verifie = $1 WHERE id = $2', [verifie !== false, req.params.id]);
    res.json({ message: verifie !== false ? 'Propriétaire vérifié ✅' : 'Vérification retirée' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Détail d'un utilisateur
router.get('/users/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var user = await db.query(
      `SELECT u.*,
         COUNT(DISTINCT l.id) as nb_logements,
         COUNT(DISTINCT r.id) as nb_reservations,
         COALESCE(SUM(p.montant), 0) as total_paiements
       FROM users u
       LEFT JOIN logements l ON l.proprietaire_id = u.id
       LEFT JOIN reservations r ON r.locataire_id = u.id
       LEFT JOIN paiements p ON (p.locataire_id = u.id OR p.proprietaire_id = u.id) AND p.statut = 'complete'
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.params.id]
    );
    if (user.rows.length === 0) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ════════════════════════════════════════════════════════
// LOGEMENTS
// ════════════════════════════════════════════════════════
router.get('/logements', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { statut, search, ville } = req.query;
    var conditions = ['1=1'];
    var params = [];
    var idx = 1;

    if (statut && statut !== 'tous') {
      if (statut === 'masques') {
        conditions.push('l.masque = TRUE');
      } else {
        conditions.push(`l.statut = $${idx}`);
        params.push(statut); idx++;
      }
    }
    if (ville) {
      conditions.push(`LOWER(l.ville) LIKE LOWER($${idx})`);
      params.push('%' + ville + '%'); idx++;
    }
    if (search) {
      conditions.push(`(LOWER(l.titre) LIKE LOWER($${idx}) OR LOWER(l.adresse) LIKE LOWER($${idx}))`);
      params.push('%' + search + '%'); idx++;
    }

    var result = await db.query(
      `SELECT l.*,
         u.nom as prop_nom, u.prenom as prop_prenom,
         u.email as prop_email, u.telephone as prop_tel,
         u.verifie as prop_verifie,
         COUNT(DISTINCT r.id) as nb_reservations
       FROM logements l
       JOIN users u ON l.proprietaire_id = u.id
       LEFT JOIN reservations r ON r.logement_id = l.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY l.id, u.id
       ORDER BY l.created_at DESC`,
      params
    );

    res.json({ logements: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Admin logements:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Masquer / Afficher un logement
router.patch('/logements/:id/masquer', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var current = await db.query('SELECT masque FROM logements WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ erreur: 'Logement non trouvé' });
    var newVal = !(current.rows[0].masque);
    await db.query('UPDATE logements SET masque = $1 WHERE id = $2', [newVal, req.params.id]);
    res.json({ message: newVal ? 'Annonce masquée' : 'Annonce visible', masque: newVal });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Vérifier un logement
router.patch('/logements/:id/verifier', verifierToken, verifierAdmin, async (req, res) => {
  try {
    await db.query('UPDATE logements SET verifie = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Logement vérifié ✅' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Supprimer un logement frauduleux
router.delete('/logements/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM logements WHERE id = $1', [req.params.id]);
    res.json({ message: 'Logement supprimé définitivement' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ════════════════════════════════════════════════════════
// PAIEMENTS
// ════════════════════════════════════════════════════════
router.get('/paiements', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { mode, search, page = 1 } = req.query;
    var conditions = ['1=1'];
    var params = [];
    var idx = 1;

    if (mode && mode !== 'tous') {
      conditions.push(`p.mode_paiement = $${idx}`);
      params.push(mode); idx++;
    }
    if (search) {
      conditions.push(`(LOWER(u_loc.nom) LIKE LOWER($${idx}) OR LOWER(u_loc.email) LIKE LOWER($${idx}) OR LOWER(l.titre) LIKE LOWER($${idx}))`);
      params.push('%' + search + '%'); idx++;
    }

    var offset = (Number(page) - 1) * 50;
    var result = await db.query(
      `SELECT
         p.*,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom, u_loc.email as loc_email,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
         l.titre as logement_titre, l.ville as logement_ville
       FROM paiements p
       LEFT JOIN users u_loc  ON p.locataire_id   = u_loc.id
       LEFT JOIN users u_prop ON p.proprietaire_id = u_prop.id
       LEFT JOIN reservations r ON p.reservation_id = r.id
       LEFT JOIN logements l ON r.logement_id = l.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.created_at DESC
       LIMIT 50 OFFSET $${idx}`,
      [...params, offset]
    );

    var total = await db.query(
      `SELECT COUNT(*), COALESCE(SUM(p.montant), 0) as volume
       FROM paiements p
       LEFT JOIN users u_loc ON p.locataire_id = u_loc.id
       LEFT JOIN reservations r ON p.reservation_id = r.id
       LEFT JOIN logements l ON r.logement_id = l.id
       WHERE ${conditions.join(' AND ')}`,
      params
    );

    res.json({
      paiements: result.rows,
      total: parseInt(total.rows[0].count),
      volume: parseFloat(total.rows[0].volume)
    });
  } catch (err) {
    console.error('Admin paiements:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ════════════════════════════════════════════════════════
// DOCUMENTS / FACTURES
// ════════════════════════════════════════════════════════
router.get('/documents', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { type, search } = req.query;
    var conditions = ['1=1'];
    var params = [];
    var idx = 1;

    if (type && type !== 'tous') {
      conditions.push(`d.type = $${idx}`);
      params.push(type); idx++;
    }
    if (search) {
      conditions.push(`(LOWER(d.titre) LIKE LOWER($${idx}) OR LOWER(u_loc.email) LIKE LOWER($${idx}))`);
      params.push('%' + search + '%'); idx++;
    }

    var result = await db.query(
      `SELECT d.*,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
         l.titre as logement_titre
       FROM documents d
       LEFT JOIN users u_loc  ON d.locataire_id   = u_loc.id
       LEFT JOIN users u_prop ON d.proprietaire_id = u_prop.id
       LEFT JOIN logements l  ON d.logement_id     = l.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY d.created_at DESC
       LIMIT 100`,
      params
    );

    res.json({ documents: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Télécharger un document (admin)
router.get('/documents/:id/telecharger', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ erreur: 'Document non trouvé' });
    var doc = result.rows[0];
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.titre.replace(/\s+/g, '_')}.html"`);
    res.send(doc.contenu_html);
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ════════════════════════════════════════════════════════
// SIGNALEMENTS
// ════════════════════════════════════════════════════════
router.get('/signalements', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { statut } = req.query;
    var conditions = statut && statut !== 'tous' ? [`s.statut = '${statut}'`] : ['1=1'];

    var result = await db.query(
      `SELECT s.*,
         u_sig.nom as signaleteur_nom, u_sig.prenom as signaleteur_prenom,
         u_sig.email as signaleteur_email,
         u_cib.nom as cible_nom, u_cib.prenom as cible_prenom,
         u_cib.role as cible_role
       FROM signalements s
       LEFT JOIN users u_sig ON s.signaleteur_id = u_sig.id
       LEFT JOIN users u_cib ON s.cible_id = u_cib.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.created_at DESC`
    );

    res.json({ signalements: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Traiter un signalement
router.patch('/signalements/:id/traiter', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { action, note } = req.body;
    // action: 'fermer' | 'suspendre_cible' | 'supprimer_annonce'
    var sig = await db.query('SELECT * FROM signalements WHERE id = $1', [req.params.id]);
    if (sig.rows.length === 0) return res.status(404).json({ erreur: 'Signalement non trouvé' });

    await db.query(
      'UPDATE signalements SET statut = $1, note_admin = $2, traite_at = NOW() WHERE id = $3',
      ['ferme', note || 'Traité par l\'admin', req.params.id]
    );

    if (action === 'suspendre_cible' && sig.rows[0].cible_id) {
      await db.query('UPDATE users SET suspendu = TRUE WHERE id = $1', [sig.rows[0].cible_id]);
    }
    if (action === 'supprimer_annonce' && sig.rows[0].logement_id) {
      await db.query('DELETE FROM logements WHERE id = $1', [sig.rows[0].logement_id]);
    }

    res.json({ message: 'Signalement traité' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

router.get('/reservations', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT r.*,
         l.titre as logement_titre,
         l.id as logement_id,
         u_loc.nom as locataire_nom,
         u_loc.prenom as locataire_prenom,
         u_loc.id as locataire_id,
         u_prop.nom as prop_nom,
         u_prop.prenom as prop_prenom,
         u_prop.id as proprietaire_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       ORDER BY r.created_at DESC
       LIMIT 200`
    );
    res.json({ reservations: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Tous les préavis
router.get('/preavis', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT p.*,
         l.titre as logement_titre,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       ORDER BY p.created_at DESC
       LIMIT 50`
    );
    res.json({ preavis: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;