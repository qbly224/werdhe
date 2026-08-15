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
    var [
      users, logements, reservations,
      paiements, alertes, evolution,
      abonnements, logsRecents
    ] = await Promise.all([

      // Stats users
      db.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'proprietaire' OR role = 'les_deux') as total_proprietaires,
          COUNT(*) FILTER (WHERE role = 'locataire') as total_locataires,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as nouveaux_7j,
          COUNT(*) FILTER (WHERE suspendu = TRUE) as suspendus
        FROM users WHERE role != 'admin'
      `),

      // Stats logements
      db.query(`
        SELECT
          COUNT(*) as total_logements,
          COUNT(*) FILTER (WHERE statut = 'loue') as logements_loues,
          COUNT(*) FILTER (WHERE statut = 'disponible') as logements_disponibles,
          COUNT(*) FILTER (WHERE verifie = TRUE) as logements_verifies,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as nouveaux_7j
        FROM logements
      `),

      // Stats réservations
      db.query(`
        SELECT
          COUNT(*) as total_reservations,
          COUNT(*) FILTER (WHERE statut = 'confirmee') as total_confirmees,
          COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
          COUNT(*) FILTER (WHERE statut = 'refusee') as refusees,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as nouvelles_7j
        FROM reservations
      `),

      // Stats paiements (depuis la table paiements directement)
      db.query(`
        SELECT
          COALESCE(SUM(montant) FILTER (WHERE statut = 'complete'), 0) as revenus_plateforme,
          COALESCE(SUM(montant) FILTER (WHERE statut = 'complete'), 0) as revenus_encaisses,
          COUNT(*) FILTER (WHERE statut = 'complete') as nb_commissions,
          COALESCE(SUM(montant), 0) as volume_total
        FROM paiements
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),

      // Alertes actives
      db.query(`
        SELECT COUNT(*) as total_alertes,
          COUNT(*) FILTER (WHERE priorite = 'haute') as alertes_hautes,
          COUNT(*) FILTER (WHERE lu = FALSE) as non_lues
        FROM alertes
      `),

      // Évolution inscriptions 6 mois
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as mois,
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mois_key,
          COUNT(*) as nb_users,
          COUNT(*) FILTER (WHERE role = 'proprietaire' OR role = 'les_deux') as nb_proprios,
          COUNT(*) FILTER (WHERE role = 'locataire') as nb_locataires
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
          AND role != 'admin'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `),

      // Abonnements actifs
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE plan = 'pro' AND statut = 'actif') as nb_pro,
          COUNT(*) FILTER (WHERE plan = 'agence' AND statut = 'actif') as nb_agence,
          COUNT(*) FILTER (WHERE plan = 'gratuit') as nb_gratuit,
          COUNT(*) FILTER (WHERE statut = 'essai') as nb_essai
        FROM abonnements
      `),

      // 10 derniers logs d'audit
      db.query(`
        SELECT l.*, u.nom, u.prenom, u.email
        FROM logs_audit l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      total_users:          Number(users.rows[0].total_users),
      total_proprietaires:  Number(users.rows[0].total_proprietaires),
      total_locataires:     Number(users.rows[0].total_locataires),
      nouveaux_users_7j:    Number(users.rows[0].nouveaux_7j),
      users_suspendus:      Number(users.rows[0].suspendus),
      total_logements:      Number(logements.rows[0].total_logements),
      logements_loues:      Number(logements.rows[0].logements_loues),
      logements_disponibles: Number(logements.rows[0].logements_disponibles),
      logements_verifies:   Number(logements.rows[0].logements_verifies),
      nouveaux_logements_7j: Number(logements.rows[0].nouveaux_7j),
      total_reservations:   Number(reservations.rows[0].total_reservations),
      total_confirmees:     Number(reservations.rows[0].total_confirmees),
      reservations_attente: Number(reservations.rows[0].en_attente),
      reservations_refusees: Number(reservations.rows[0].refusees),
      nouvelles_resas_7j:   Number(reservations.rows[0].nouvelles_7j),
      revenus_plateforme:   Number(paiements.rows[0].revenus_plateforme),
      revenus_encaisses:    Number(paiements.rows[0].revenus_encaisses),
      volume_total:         Number(paiements.rows[0].volume_total),
      total_alertes:        Number(alertes.rows[0].total_alertes),
      alertes_hautes:       Number(alertes.rows[0].alertes_hautes),
      abonnements: {
        pro:     Number(abonnements.rows[0].nb_pro),
        agence:  Number(abonnements.rows[0].nb_agence),
        gratuit: Number(abonnements.rows[0].nb_gratuit),
        essai:   Number(abonnements.rows[0].nb_essai),
      },
      evolution:   evolution.rows,
      logs_recents: logsRecents.rows,
    });

  } catch (err) {
    console.error('[GET /admin/stats]', err.message);
    res.status(500).json({ erreur: err.message });
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
         u.suspendu, u.abonnement_bloque, u.verifie, u.locataire_verifie, u.plan,
         u.note_moyenne, u.nb_notations, u.created_at,
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

// Débloquer manuellement un compte bloqué pour abonnement impayé
router.patch('/users/:id/debloquer-abonnement', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var current = await db.query('SELECT abonnement_bloque FROM users WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });

    await db.query('UPDATE users SET abonnement_bloque = FALSE WHERE id = $1', [req.params.id]);
    await db.query(
      `UPDATE abonnements SET statut = 'actif', rappel_j3_envoye = FALSE, rappel_j5_envoye = FALSE
       WHERE user_id = $1`,
      [req.params.id]
    );

    res.json({ message: 'Accès débloqué' });
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
    var conditions = statut && statut !== 'tous' ? 's.statut = $1' : '1=1';
    var params = statut && statut !== 'tous' ? [statut] : [];

    var result = await db.query(
      `SELECT s.*,
         u_sig.nom as signaleteur_nom, u_sig.prenom as signaleteur_prenom,
         u_sig.email as signaleteur_email,
         u_cib.nom as cible_nom, u_cib.prenom as cible_prenom,
         u_cib.role as cible_role
       FROM signalements s
       LEFT JOIN users u_sig ON s.signaleteur_id = u_sig.id
       LEFT JOIN users u_cib ON s.cible_id = u_cib.id
       WHERE ${conditions}
       ORDER BY s.created_at DESC`,
      params
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

// Revenus et statistiques financières
router.get('/revenus', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var [commissions, abonnements, evolution] = await Promise.all([

      // Total paiements
      db.query(`
        SELECT
          COUNT(*) as nb_commissions,
          COALESCE(SUM(montant), 0) as total_commissions,
          COALESCE(SUM(CASE WHEN statut = 'complete' THEN montant END), 0) as encaisse,
          COALESCE(SUM(CASE WHEN statut = 'en_attente' THEN montant END), 0) as en_attente
        FROM paiements
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),

      // Revenus abonnements
      db.query(`
        SELECT
          COUNT(*) as nb_abonnes,
          COALESCE(SUM(montant), 0) as revenus_abonnements,
          COUNT(CASE WHEN plan = 'pro' THEN 1 END) as nb_pro,
          COUNT(CASE WHEN plan = 'agence' THEN 1 END) as nb_agence
        FROM factures_abonnements
        WHERE statut = 'emise'
          AND created_at >= NOW() - INTERVAL '30 days'
      `),

      // Évolution sur 6 mois
      db.query(`
        SELECT
          DATE_TRUNC('month', created_at) as mois,
          COALESCE(SUM(montant_commission), 0) as commissions,
          COUNT(*) as nb_paiements
        FROM paiements
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mois ASC
      `)
    ]);

    res.json({
      commissions:        commissions.rows[0],
      abonnements:        abonnements.rows[0],
      evolution:          evolution.rows,
    });

  } catch (err) {
    console.error('[GET /admin/revenus]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});
// ─── GESTION CODES PROMO ──────────────────────────────────────────
router.get('/codes-promo', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      'SELECT * FROM codes_promo ORDER BY created_at DESC'
    );
    res.json({ codes: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

router.post('/codes-promo', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { code, reduction_pct, plan_cible, nb_utilisations_max, expire_at } = req.body;
    var result = await db.query(
      `INSERT INTO codes_promo (code, reduction_pct, plan_cible, nb_utilisations_max, expire_at)
       VALUES (UPPER($1), $2, $3, $4, $5) RETURNING *`,
      [code, reduction_pct, plan_cible || 'pro', nb_utilisations_max || 100, expire_at || null]
    );
    res.status(201).json({ message: 'Code créé !', code: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

router.patch('/codes-promo/:id/toggle', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      'UPDATE codes_promo SET actif = NOT actif WHERE id = $1 RETURNING actif',
      [req.params.id]
    );
    res.json({ actif: result.rows[0].actif });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── LOGS D'AUDIT ─────────────────────────────────────────────────
router.get('/logs', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT l.*, u.nom, u.prenom, u.email, u.role
       FROM logs_audit l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT 50`
    );
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── CHANGER LE PLAN D'UN USER ────────────────────────────────────
router.patch('/users/:id/plan', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { plan } = req.body;
    if (!['gratuit', 'pro', 'agence'].includes(plan)) {
      return res.status(400).json({ erreur: 'Plan invalide' });
    }
    await db.query('UPDATE users SET plan = $1 WHERE id = $2', [plan, req.params.id]);
    await db.query(`
      INSERT INTO abonnements (user_id, plan, statut)
      VALUES ($1, $2, 'actif')
      ON CONFLICT (user_id) DO UPDATE SET plan = $2, statut = 'actif'
    `, [req.params.id, plan]).catch(console.warn);
    res.json({ message: 'Plan mis à jour !' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});
// ─── STATS TEMPS RÉEL ────────────────────────────────────────────
router.get('/stats/live', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var [activite, alertesCritiques, inscriptionsAujourdhui, paiementsAujourdhui, candidaturesAujourdhui] = await Promise.all([

      // 10 dernières actions toutes tables confondues
      db.query(`
        SELECT 'inscription' as type, prenom || ' ' || nom as detail, created_at
        FROM users WHERE role != 'admin'
        UNION ALL
        SELECT 'candidature', l.titre, r.created_at
        FROM reservations r JOIN logements l ON r.logement_id = l.id
        UNION ALL
        SELECT 'logement', titre, created_at FROM logements
        UNION ALL
        SELECT 'paiement', montant::text || ' GNF', created_at FROM paiements
        ORDER BY created_at DESC
        LIMIT 5
      `),

      // Alertes critiques
      db.query(`
        SELECT COUNT(*) as nb
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        WHERE p.statut = 'en_attente'
          AND p.created_at < NOW() - INTERVAL '5 days'
      `),

      // Inscriptions aujourd'hui
      db.query(`
        SELECT COUNT(*) as nb FROM users
        WHERE DATE(created_at) = CURRENT_DATE AND role != 'admin'
      `),

      // Paiements aujourd'hui
      db.query(`
        SELECT COUNT(*) as nb, COALESCE(SUM(montant), 0) as total
        FROM paiements
        WHERE DATE(created_at) = CURRENT_DATE AND statut = 'complete'
      `),

      // Candidatures aujourd'hui
      db.query(`
        SELECT COUNT(*) as nb FROM reservations
        WHERE DATE(created_at) = CURRENT_DATE
      `),
    ]);

    res.json({
      timestamp:              new Date().toISOString(),
      activite:               activite.rows,
      alertes_critiques:      Number(alertesCritiques.rows[0].nb),
      inscriptions_aujourdhui: Number(inscriptionsAujourdhui.rows[0].nb),
      paiements_aujourdhui:   {
        nb:    Number(paiementsAujourdhui.rows[0].nb),
        total: Number(paiementsAujourdhui.rows[0].total),
      },
      candidatures_aujourdhui: Number(candidaturesAujourdhui.rows[0].nb),
    });

  } catch (err) {
    console.error('[GET /admin/stats/live]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});
module.exports = router;