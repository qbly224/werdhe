const db = require('../database');
const PDFDocument = require('pdfkit');

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(Number(n)) + ' GNF'; };

// Génère le rapport financier PDF d'un propriétaire et renvoie un Buffer.
// Réutilisé par la route GET /rapports/financier/pdf et par le CRON
// d'envoi automatique du rapport mensuel (plan Agence).
async function genererRapportFinancierPDF(userId) {
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
  var moisActuel   = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return new Promise(function(resolve, reject) {
    var doc = new PDFDocument({ margin: 50, size: 'A4' });
    var chunks = [];
    doc.on('data', function(chunk) { chunks.push(chunk); });
    doc.on('end', function() { resolve(Buffer.concat(chunks)); });
    doc.on('error', reject);

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

      doc.rect(x, barY, barWidth, barH).fill(pct > 0.8 ? '#1B6B3A' : pct > 0.4 ? '#34A853' : '#A5D6A7');

      doc.fontSize(7).fillColor('#888').font('Helvetica')
         .text(m.mois.trim().slice(0, 3), x, startY + 4, { width: barWidth, align: 'center' });
    });

    doc.moveTo(startX - 5, startY).lineTo(startX + (evolution.rows.length * 40), startY)
       .strokeColor('#E0E0E0').lineWidth(0.5).stroke();

    // ── REVENUS PAR BIEN ──────────────────────────────────────────
    doc.fontSize(14).fillColor('#1B2B22').font('Helvetica-Bold')
       .text('Revenus par logement', 50, 400);

    var yBien = 420;
    parBien.rows.forEach(function(b) {
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
    if (yBien > 600) { doc.addPage(); yBien = 50; }

    var tableY = yBien + 20;
    doc.fontSize(14).fillColor('#1B2B22').font('Helvetica-Bold')
       .text('Historique des paiements', 50, tableY);

    tableY += 20;

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
      doc.text(p.mode_paiement || '-',                           393, tableY + 6, { width: 60 });
      doc.fillColor(statutColor).font('Helvetica-Bold')
         .text(GNF(p.montant),                                   458, tableY + 6, { width: 80, align: 'right' });

      tableY += 20;
    });

    doc.rect(50, tableY - (paiements.rows.length * 20) - 22, 495, (paiements.rows.length * 20) + 22)
       .strokeColor('#E0E0E0').lineWidth(0.5).stroke();

    // ── PIED DE PAGE ──────────────────────────────────────────────
    var pageHeight = doc.page.height;
    doc.rect(0, pageHeight - 40, 595, 40).fill('#1B2B22');
    doc.fontSize(8).fillColor('rgba(255,255,255,0.5)').font('Helvetica')
       .text('© 2026 Werdhe · Plateforme Immobilière Guinée · werdhe.com', 50, pageHeight - 27, { align: 'center', width: 495 });

    doc.end();
  });
}

module.exports = { genererRapportFinancierPDF };
