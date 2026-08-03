const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');

// ─── TABLEAU FINANCIER COMPLET ────────────────────────────────────
router.get('/financier', verifierToken, async (req, res) => {
  try {
    var userId = req.user.id;

    var [
      resumeMois,
      evolution12Mois,
      parBien,
      paiementsRecents,
      tauxOccupation
    ] = await Promise.all([

      // Résumé du mois en cours
      db.query(`
        SELECT
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'complete'), 0)  as encaisse,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'en_attente'), 0) as en_attente,
          COUNT(p.id) FILTER (WHERE p.statut = 'complete')                   as nb_paiements,
          COUNT(DISTINCT r.locataire_id)                                      as nb_locataires
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN logements l ON r.logement_id = l.id
        WHERE l.proprietaire_id = $1
          AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
      `, [userId]),

      // Évolution sur 12 mois
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', p.created_at), 'YYYY-MM') as mois,
          TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon YY')  as mois_label,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'complete'), 0) as revenus,
          COUNT(p.id) FILTER (WHERE p.statut = 'complete')                  as nb_paiements,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'en_attente'), 0) as impayes
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN logements l ON r.logement_id = l.id
        WHERE l.proprietaire_id = $1
          AND p.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', p.created_at)
        ORDER BY DATE_TRUNC('month', p.created_at) ASC
      `, [userId]),

      // Revenus par bien
      db.query(`
        SELECT
          l.id,
          l.titre,
          l.prix_mensuel,
          l.statut,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'complete'), 0) as total_encaisse,
          COUNT(p.id) FILTER (WHERE p.statut = 'complete')                  as nb_paiements,
          COUNT(DISTINCT r.locataire_id)                                     as nb_locataires
        FROM logements l
        LEFT JOIN reservations r ON r.logement_id = l.id
        LEFT JOIN paiements p ON p.reservation_id = r.id
        WHERE l.proprietaire_id = $1
        GROUP BY l.id, l.titre, l.prix_mensuel, l.statut
        ORDER BY total_encaisse DESC
      `, [userId]),

      // 10 derniers paiements
      db.query(`
        SELECT
          p.*,
          l.titre as logement_titre,
          u.nom   as locataire_nom,
          u.prenom as locataire_prenom
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN logements l ON r.logement_id = l.id
        JOIN users u ON r.locataire_id = u.id
        WHERE l.proprietaire_id = $1
        ORDER BY p.created_at DESC
        LIMIT 15
      `, [userId]),

      // Taux occupation mensuel 6 mois
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', g.mois), 'Mon YY') as mois_label,
          TO_CHAR(DATE_TRUNC('month', g.mois), 'YYYY-MM') as mois,
          COUNT(DISTINCT l.id) as total_biens,
          COUNT(DISTINCT r.logement_id) FILTER (
            WHERE r.statut = 'confirmee'
              AND r.date_debut <= g.mois
              AND (r.date_fin IS NULL OR r.date_fin >= g.mois)
          ) as biens_loues
        FROM generate_series(
          DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
          DATE_TRUNC('month', NOW()),
          '1 month'::interval
        ) AS g(mois)
        CROSS JOIN logements l
        LEFT JOIN reservations r ON r.logement_id = l.id
        WHERE l.proprietaire_id = $1
        GROUP BY DATE_TRUNC('month', g.mois)
        ORDER BY DATE_TRUNC('month', g.mois) ASC
      `, [userId]),
    ]);

    // Calculer le total annuel
    var totalAnnuel = evolution12Mois.rows.reduce(function(s, m) {
      return s + Number(m.revenus);
    }, 0);

    res.json({
      resume: {
        ...resumeMois.rows[0],
        total_annuel: totalAnnuel,
      },
      evolution:     evolution12Mois.rows,
      par_bien:      parBien.rows,
      paiements:     paiementsRecents.rows,
      occupation:    tauxOccupation.rows,
    });

  } catch (err) {
    console.error('[GET /rapports/financier]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;