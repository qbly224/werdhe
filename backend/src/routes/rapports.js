const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// ─── TABLEAU FINANCIER COMPLET ────────────────────────────────────
router.get('/financier', verifierToken, async (req, res) => {
  try {
    var userId = req.user.id;
    var periode    = req.query.periode || '12mois';
var intervalDB = {
  '3mois':  '3 months',
  '6mois':  '6 months',
  '12mois': '12 months',
  'annee':  '12 months',
}[periode] || '12 months';

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
      // Stats candidatures
db.query(`
  SELECT
    COUNT(*) as total_candidatures,
    COUNT(*) FILTER (WHERE r.statut = 'confirmee') as acceptees,
    COUNT(*) FILTER (WHERE r.statut = 'refusee')   as refusees,
    COUNT(*) FILTER (WHERE r.statut = 'en_attente') as en_attente,
    ROUND(COUNT(*) FILTER (WHERE r.statut = 'confirmee')::decimal
      / NULLIF(COUNT(*), 0) * 100, 1) as taux_acceptation
  FROM reservations r
  JOIN logements l ON r.logement_id = l.id
  WHERE l.proprietaire_id = $1
`, [req.user.id]),

// Meilleur mois
db.query(`
  SELECT
    TO_CHAR(DATE_TRUNC('month', p.created_at), 'Month YYYY') as mois,
    SUM(p.montant) as total
  FROM paiements p
  JOIN reservations r ON p.reservation_id = r.id
  JOIN logements l ON r.logement_id = l.id
  WHERE l.proprietaire_id = $1 AND p.statut = 'complete'
  GROUP BY DATE_TRUNC('month', p.created_at)
  ORDER BY total DESC
  LIMIT 1
`, [req.user.id]),
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
// ─── EXPORT PDF RAPPORT FINANCIER ────────────────────────────────
router.get('/financier/pdf', verifierToken, async (req, res) => {
  try {
    var userId = req.user.id;

    // Récupérer les données
    var [user, resume, evolution, parBien, paiements] = await Promise.all([
      db.query('SELECT nom, prenom, email FROM users WHERE id = $1', [userId]),

      db.query(`
        SELECT
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'complete'), 0)   as encaisse,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'en_attente'), 0) as en_attente,
          COUNT(p.id) FILTER (WHERE p.statut = 'complete')                    as nb_paiements,
          COUNT(DISTINCT r.locataire_id)                                       as nb_locataires
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN logements l ON r.logement_id = l.id
        WHERE l.proprietaire_id = $1
          AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
      `, [userId]),

      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', p.created_at), 'Month YYYY') as mois,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'complete'), 0) as revenus,
          COUNT(p.id) FILTER (WHERE p.statut = 'complete') as nb_paiements
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN logements l ON r.logement_id = l.id
        WHERE l.proprietaire_id = $1
          AND p.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', p.created_at)
        ORDER BY DATE_TRUNC('month', p.created_at) ASC
      `, [userId]),

      db.query(`
        SELECT l.titre, l.prix_mensuel,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'complete'), 0) as total_encaisse
        FROM logements l
        LEFT JOIN reservations r ON r.logement_id = l.id
        LEFT JOIN paiements p ON p.reservation_id = r.id
        WHERE l.proprietaire_id = $1
        GROUP BY l.id, l.titre, l.prix_mensuel
        ORDER BY total_encaisse DESC
        LIMIT 10
      `, [userId]),

      db.query(`
        SELECT p.montant, p.statut, p.mode_paiement, p.created_at,
          l.titre as logement_titre,
          u.nom as loc_nom, u.prenom as loc_prenom
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN logements l ON r.logement_id = l.id
        JOIN users u ON r.locataire_id = u.id
        WHERE l.proprietaire_id = $1
        ORDER BY p.created_at DESC
        LIMIT 20
      `, [userId]),
    ]);

    var proprietaire = user.rows[0];
    var r            = resume.rows[0];
    var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(Number(n)) + ' GNF'; };
    var moisActuel   = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // ─── GÉNÉRATION PDF ──────────────────────────────────────────
    var doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      'attachment; filename="werdhe-rapport-' + new Date().toISOString().slice(0, 7) + '.pdf"'
    );
    doc.pipe(res);

    // ── EN-TÊTE ──────────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill('#1B2B22');
    doc.fontSize(22).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text('WERDHE', 50, 25);
    doc.fontSize(11).fillColor('rgba(255,255,255,0.6)').font('Helvetica')
       .text('Plateforme Immobilière Guinée', 50, 50);
    doc.fontSize(11).fillColor('#F5A623')
       .text('RAPPORT FINANCIER', 380, 30, { align: 'right', width: 165 });
    doc.fontSize(10).fillColor('rgba(255,255,255,0.7)')
       .text(moisActuel.toUpperCase(), 380, 48, { align: 'right', width: 165 });

    doc.moveDown(3);

    // ── INFOS PROPRIÉTAIRE ────────────────────────────────────────
    doc.fontSize(10).fillColor('#888')
       .text('Propriétaire', 50, 100);
    doc.fontSize(13).fillColor('#1B2B22').font('Helvetica-Bold')
       .text(proprietaire.prenom + ' ' + proprietaire.nom, 50, 114);
    doc.fontSize(10).fillColor('#888').font('Helvetica')
       .text(proprietaire.email, 50, 130);
    doc.fontSize(10).fillColor('#888')
       .text('Généré le ' + new Date().toLocaleDateString('fr-FR'), 350, 114, { align: 'right', width: 195 });

    // Ligne séparatrice
    doc.moveTo(50, 150).lineTo(545, 150).strokeColor('#E0E0E0').lineWidth(1).stroke();

    // ── KPIs ─────────────────────────────────────────────────────
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#1B2B22').font('Helvetica-Bold')
       .text('Résumé du mois', 50, 165);

    var kpis = [
      { label: 'Encaissé',       val: GNF(r.encaisse),    color: '#1B6B3A' },
      { label: 'En attente',     val: GNF(r.en_attente),  color: '#E65100' },
      { label: 'Nb paiements',   val: String(r.nb_paiements), color: '#1565C0' },
      { label: 'Nb locataires',  val: String(r.nb_locataires), color: '#7B1FA2' },
    ];

    kpis.forEach(function(k, i) {
      var x = 50 + (i * 125);
      doc.rect(x, 185, 115, 60).fillAndStroke('#F7F8F7', '#E0E0E0');
      doc.fontSize(9).fillColor('#888').font('Helvetica')
         .text(k.label, x + 8, 193, { width: 100 });
      doc.fontSize(13).fillColor(k.color).font('Helvetica-Bold')
         .text(k.val, x + 8, 210, { width: 100 });
    });

    // ── ÉVOLUTION 12 MOIS ─────────────────────────────────────────
    doc.fontSize(14).fillColor('#1B2B22').font('Helvetica-Bold')
       .text('Évolution des revenus (12 mois)', 50, 265);

    var maxRevenu = Math.max.apply(null, evolution.rows.map(function(m) { return Number(m.revenus); }));
    var barWidth  = 35;
    var barMaxH   = 80;
    var startX    = 50;
    var startY    = 375;

    evolution.rows.forEach(function(m, i) {
      var x      = startX + (i * (barWidth + 5));
      var pct    = maxRevenu > 0 ? Number(m.revenus) / maxRevenu : 0;
      var barH   = Math.max(2, Math.round(pct * barMaxH));
      var barY   = startY - barH;

      // Barre
      doc.rect(x, barY, barWidth, barH).fill(pct > 0.8 ? '#1B6B3A' : pct > 0.4 ? '#34A853' : '#A5D6A7');

      // Label mois (2 lettres)
      doc.fontSize(7).fillColor('#888').font('Helvetica')
         .text(m.mois.trim().slice(0, 3), x, startY + 4, { width: barWidth, align: 'center' });
    });

    // Axe horizontal
    doc.moveTo(startX - 5, startY).lineTo(startX + (evolution.rows.length * 40), startY)
       .strokeColor('#E0E0E0').lineWidth(0.5).stroke();

    // ── REVENUS PAR BIEN ──────────────────────────────────────────
    doc.fontSize(14).fillColor('#1B2B22').font('Helvetica-Bold')
       .text('Revenus par logement', 50, 400);

    var yBien = 420;
    parBien.rows.forEach(function(b, i) {
      if (yBien > 700) return;
      var pct = maxRevenu > 0 ? Number(b.total_encaisse) / maxRevenu : 0;
      doc.fontSize(10).fillColor('#1B2B22').font('Helvetica')
         .text(b.titre.slice(0, 30), 50, yBien, { width: 200 });
      doc.fontSize(10).fillColor('#1B6B3A').font('Helvetica-Bold')
         .text(GNF(b.total_encaisse), 260, yBien, { width: 130 });
      doc.rect(395, yBien + 2, 150, 8).fill('#F0F0F0');
      doc.rect(395, yBien + 2, Math.round(pct * 150), 8).fill('#1B6B3A');
      yBien += 22;
    });

    // ── TABLEAU PAIEMENTS ─────────────────────────────────────────
    var newPage = false;
    if (yBien > 600) { doc.addPage(); yBien = 50; newPage = true; }

    var tableY = yBien + 20;
    doc.fontSize(14).fillColor('#1B2B22').font('Helvetica-Bold')
       .text('Historique des paiements', 50, tableY);

    tableY += 20;

    // En-tête tableau
    doc.rect(50, tableY, 495, 22).fill('#1B2B22');
    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('Locataire',   58,  tableY + 7, { width: 110 });
    doc.text('Logement',    173, tableY + 7, { width: 130 });
    doc.text('Date',        308, tableY + 7, { width: 80 });
    doc.text('Mode',        393, tableY + 7, { width: 60 });
    doc.text('Montant',     458, tableY + 7, { width: 80, align: 'right' });

    tableY += 22;

    paiements.rows.forEach(function(p, i) {
      if (tableY > 750) return;
      var bg = i % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
      doc.rect(50, tableY, 495, 20).fill(bg);

      var statutColor = p.statut === 'complete' ? '#1B6B3A' : '#E65100';
      doc.fontSize(9).fillColor('#1B2B22').font('Helvetica');
      doc.text((p.loc_prenom + ' ' + p.loc_nom).slice(0, 18),   58,  tableY + 6, { width: 110 });
      doc.text(p.logement_titre.slice(0, 22),                    173, tableY + 6, { width: 130 });
      doc.text(new Date(p.created_at).toLocaleDateString('fr-FR'), 308, tableY + 6, { width: 80 });
      doc.text(p.mode_paiement || '—',                           393, tableY + 6, { width: 60 });
      doc.fillColor(statutColor).font('Helvetica-Bold')
         .text(GNF(p.montant),                                   458, tableY + 6, { width: 80, align: 'right' });

      tableY += 20;
    });

    // Bordure tableau
    doc.rect(50, tableY - (paiements.rows.length * 20) - 22, 495, (paiements.rows.length * 20) + 22)
       .strokeColor('#E0E0E0').lineWidth(0.5).stroke();

    // ── PIED DE PAGE ──────────────────────────────────────────────
    var pageHeight = doc.page.height;
    doc.rect(0, pageHeight - 40, 595, 40).fill('#1B2B22');
    doc.fontSize(8).fillColor('rgba(255,255,255,0.5)').font('Helvetica')
       .text('© 2026 Werdhe — Plateforme Immobilière Guinée — werdhe.com', 50, pageHeight - 27, { align: 'center', width: 495 });

    doc.end();

  } catch (err) {
    console.error('[GET /rapports/financier/pdf]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ erreur: err.message });
    }
  }
});
// ─── SITEMAP.XML ─────────────────────────────────────────────────
router.get('/sitemap', async (req, res) => {
  try {
    var logements = await db.query(
      `SELECT id, updated_at FROM logements
       WHERE statut = 'disponible'
       ORDER BY updated_at DESC
       LIMIT 1000`
    );

    var urls = [
      { loc: 'https://werdhe.com/',         changefreq: 'daily',   priority: '1.0' },
      { loc: 'https://werdhe.com/logements', changefreq: 'hourly',  priority: '0.9' },
      { loc: 'https://werdhe.com/pricing',   changefreq: 'monthly', priority: '0.7' },
    ];

    logements.rows.forEach(function(l) {
      urls.push({
        loc:        'https://werdhe.com/logements/' + l.id,
        changefreq: 'weekly',
        priority:   '0.8',
        lastmod:    new Date(l.updated_at || l.created_at).toISOString().slice(0, 10)
      });
    });

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    urls.forEach(function(u) {
      xml += '  <url>\n';
      xml += '    <loc>' + u.loc + '</loc>\n';
      if (u.lastmod) xml += '    <lastmod>' + u.lastmod + '</lastmod>\n';
      xml += '    <changefreq>' + u.changefreq + '</changefreq>\n';
      xml += '    <priority>' + u.priority + '</priority>\n';
      xml += '  </url>\n';
    });
    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);

  } catch (err) {
    res.status(500).send('Erreur génération sitemap');
  }
});
// ─── OVERVIEW PROPRIÉTAIRE ────────────────────────────────────────
router.get('/overview', verifierToken, async (req, res) => {
  try {
    var userId = req.user.id;

    var [kpis, biens, candidatures, alertes, evenements, revenus6mois] = await Promise.all([

      // KPIs du mois vs mois précédent
      db.query(`
        SELECT
          COALESCE(SUM(p.montant) FILTER (
            WHERE p.statut = 'complete'
            AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
          ), 0) as revenus_mois,
          COALESCE(SUM(p.montant) FILTER (
            WHERE p.statut = 'complete'
            AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          ), 0) as revenus_mois_precedent,
          COUNT(DISTINCT l.id) as total_biens,
          COUNT(DISTINCT l.id) FILTER (WHERE l.statut = 'loue') as biens_loues,
          COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'en_attente') as candidatures_attente,
          COUNT(DISTINCT r.id) FILTER (
            WHERE r.statut = 'en_attente'
            AND r.created_at >= NOW() - INTERVAL '7 days'
          ) as nouvelles_candidatures_7j
        FROM logements l
        LEFT JOIN reservations r ON r.logement_id = l.id
        LEFT JOIN paiements p ON p.reservation_id = r.id
        WHERE l.proprietaire_id = $1
      `, [userId]),

      // Biens avec statut locataire
      db.query(`
        SELECT l.*,
          u.prenom as loc_prenom, u.nom as loc_nom,
          u.telephone as loc_telephone,
          r.id as reservation_id, r.statut as reservation_statut,
          r.date_fin,
          COALESCE(
            (SELECT MAX(p.created_at) FROM paiements p WHERE p.reservation_id = r.id AND p.statut = 'complete'),
            NULL
          ) as dernier_paiement
        FROM logements l
        LEFT JOIN reservations r ON r.logement_id = l.id AND r.statut = 'confirmee'
        LEFT JOIN users u ON r.locataire_id = u.id
        WHERE l.proprietaire_id = $1
        ORDER BY l.created_at DESC
        LIMIT 8
      `, [userId]),

      // Dernières candidatures
      db.query(`
        SELECT r.*,
          l.titre as logement_titre, l.prix_mensuel,
          u.prenom as loc_prenom, u.nom as loc_nom,
          u.telephone as loc_telephone, u.email as loc_email,
          u.score_confiance
        FROM reservations r
        JOIN logements l ON r.logement_id = l.id
        JOIN users u ON r.locataire_id = u.id
        WHERE l.proprietaire_id = $1
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [userId]),

      // Alertes non lues
      db.query(`
        SELECT * FROM alertes
        WHERE proprietaire_id = $1 AND lu = FALSE
        ORDER BY created_at DESC
        LIMIT 5
      `, [userId]),

      // Prochains événements (baux expirant, loyers à venir)
      db.query(`
        SELECT
          'bail_expire' as type,
          l.titre as logement_titre,
          r.date_fin as date_evenement,
          u.prenom as loc_prenom
        FROM reservations r
        JOIN logements l ON r.logement_id = l.id
        JOIN users u ON r.locataire_id = u.id
        WHERE l.proprietaire_id = $1
          AND r.statut = 'confirmee'
          AND r.date_fin IS NOT NULL
          AND r.date_fin BETWEEN NOW() AND NOW() + INTERVAL '60 days'
        ORDER BY r.date_fin ASC
        LIMIT 3
      `, [userId]),

      // Revenus 6 mois
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon') as mois,
          COALESCE(SUM(p.montant) FILTER (WHERE p.statut = 'complete'), 0) as revenus
        FROM paiements p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN logements l ON r.logement_id = l.id
        WHERE l.proprietaire_id = $1
          AND p.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', p.created_at)
        ORDER BY DATE_TRUNC('month', p.created_at) ASC
      `, [userId]),
    ]);

    var k = kpis.rows[0];
    var tendanceRevenus = Number(k.revenus_mois_precedent) > 0
      ? Math.round((Number(k.revenus_mois) - Number(k.revenus_mois_precedent)) / Number(k.revenus_mois_precedent) * 100)
      : 0;

    res.json({
      kpis: {
        revenus_mois:             Number(k.revenus_mois),
        revenus_mois_precedent:   Number(k.revenus_mois_precedent),
        tendance_revenus:         tendanceRevenus,
        total_biens:              Number(k.total_biens),
        biens_loues:              Number(k.biens_loues),
        taux_occupation:          Number(k.total_biens) > 0
          ? Math.round(Number(k.biens_loues) / Number(k.total_biens) * 100) : 0,
        candidatures_attente:     Number(k.candidatures_attente),
        nouvelles_candidatures_7j: Number(k.nouvelles_candidatures_7j),
      },
      biens:        biens.rows,
      candidatures: candidatures.rows,
      alertes:      alertes.rows,
      evenements:   evenements.rows,
      revenus6mois: revenus6mois.rows,
      candidatures:  candidatures.rows[0],
      meilleur_mois: meilleurMois.rows[0] || null,
    });

  } catch (err) {
    console.error('[GET /rapports/overview]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});
module.exports = router;