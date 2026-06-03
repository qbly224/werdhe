const db = require('../database');
const { envoyerEmailDocument } = require('./emailService');

// ================================================
// STYLES CSS COMMUNS à tous les documents
// ================================================
function stylesCommuns() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      color: #222;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1B6B3A;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #1B6B3A;
    }
    .logo-sub { font-size: 12px; color: #888; }
    .doc-title {
      text-align: right;
      font-size: 22px;
      font-weight: 700;
      color: #1B6B3A;
    }
    .doc-numero { font-size: 13px; color: #888; }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .partie-box {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 14px;
      border-left: 4px solid #1B6B3A;
    }
    .partie-box.locataire { border-left-color: #1565C0; }
    .partie-label {
      font-size: 11px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .partie-nom { font-size: 16px; font-weight: 700; color: #1B2B22; }
    .partie-info { font-size: 12px; color: #555; margin-top: 2px; }
    .montant-box {
      background: linear-gradient(135deg, #1B6B3A, #2E7D32);
      color: #fff;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      margin: 20px 0;
    }
    .montant-label { font-size: 12px; opacity: 0.8; }
    .montant-val { font-size: 30px; font-weight: 800; margin: 6px 0; }
    .montant-sub { font-size: 12px; opacity: 0.7; }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .details-table th {
      background: #1B6B3A;
      color: #fff;
      padding: 10px 14px;
      text-align: left;
      font-size: 12px;
    }
    .details-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    .details-table tr:nth-child(even) td { background: #f8f9fa; }
    .section-titre {
      font-size: 14px;
      font-weight: 700;
      color: #1B6B3A;
      margin: 20px 0 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e0e0e0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .badge-vert { background: #E8F5E9; color: #1B5E20; }
    .badge-rouge { background: #FFEBEE; color: #B71C1C; }
    .badge-bleu { background: #E3F2FD; color: #0D47A1; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #aaa;
    }
    .signature-zone {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 40px;
    }
    .signature-box {
      border: 1px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      min-height: 80px;
      text-align: center;
    }
    .signature-label { font-size: 12px; color: #888; margin-bottom: 8px; }
    .alerte-box {
      background: #FFEBEE;
      border: 1px solid #FFCDD2;
      border-radius: 8px;
      padding: 14px;
      margin: 16px 0;
    }
    .alerte-titre { font-size: 14px; font-weight: 700; color: #B71C1C; }
    .alerte-txt { font-size: 13px; color: #555; margin-top: 4px; }
    .info-box {
      background: #E3F2FD;
      border-left: 4px solid #1565C0;
      padding: 14px;
      margin: 16px 0;
      border-radius: 0 8px 8px 0;
    }
    @media print {
      body { padding: 20px; }
    }
  `;
}

// ================================================
// EN-TÊTE COMMUNE à tous les documents
// ================================================
function headerHTML(titre, numero, date) {
  return `
    <div class="header">
      <div>
        <div class="logo">🏠 Werdhe</div>
        <div class="logo-sub">Plateforme Immobiliere Guinee</div>
        <div class="logo-sub">Conakry, Guinee</div>
      </div>
      <div>
        <div class="doc-title">${titre}</div>
        <div class="doc-numero">N° ${numero}</div>
        <div class="doc-numero">Date : ${date}</div>
      </div>
    </div>
  `;
}

// ================================================
// SECTION PARTIES (proprio + locataire)
// ================================================
function partiesHTML(proprietaire, locataire) {
  return `
    <div class="parties">
      <div class="partie-box">
        <div class="partie-label">Proprietaire / Bailleur</div>
        <div class="partie-nom">${proprietaire.prenom} ${proprietaire.nom}</div>
        <div class="partie-info">📞 ${proprietaire.telephone || 'N/A'}</div>
        <div class="partie-info">✉️ ${proprietaire.email || 'N/A'}</div>
      </div>
      <div class="partie-box locataire">
        <div class="partie-label">Locataire / Preneur</div>
        <div class="partie-nom">${locataire.prenom} ${locataire.nom}</div>
        <div class="partie-info">📞 ${locataire.telephone || 'N/A'}</div>
        <div class="partie-info">✉️ ${locataire.email || 'N/A'}</div>
      </div>
    </div>
  `;
}

// ================================================
// PIED DE PAGE commun
// ================================================
function footerHTML(numero, date) {
  return `
    <div class="footer">
      <span>Document genere par Werdhe · werdhe.com</span>
      <span>${numero} · ${date}</span>
    </div>
  `;
}

// ================================================
// TEMPLATE : FACTURE
// ================================================
function genererHTMLFacture(data) {
  var { numero, date, proprietaire, locataire, logement, montant, mode_paiement, mois, annee } = data;
  var nomMois = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  var periodeLabel = mois ? nomMois[mois - 1] + ' ' + annee : date;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${numero}</title>
  <style>${stylesCommuns()}</style>
</head>
<body>
  ${headerHTML('FACTURE DE LOYER', numero, date)}
  ${partiesHTML(proprietaire, locataire)}

  <div class="montant-box">
    <div class="montant-label">Montant total a regler</div>
    <div class="montant-val">${Number(montant).toLocaleString('fr-FR')} GNF</div>
    <div class="montant-sub">Periode : ${periodeLabel}</div>
  </div>

  <div class="section-titre">Détail du bien loue</div>
  <table class="details-table">
    <tr><th>Designation</th><th>Montant</th></tr>
    <tr><td>Loyer mensuel — ${logement.titre}</td><td>${Number(montant).toLocaleString('fr-FR')} GNF</td></tr>
    <tr><td>Adresse : ${logement.adresse}, ${logement.ville}</td><td>—</td></tr>
    ${logement.nb_chambres ? `<tr><td>Chambres</td><td>${logement.nb_chambres}</td></tr>` : ''}
    ${logement.superficie ? `<tr><td>Superficie</td><td>${logement.superficie} m²</td></tr>` : ''}
  </table>

  <div class="section-titre">Mode de paiement</div>
  <p>
    <span class="badge badge-bleu">
      ${mode_paiement === 'orange_money' ? '🟠 Orange Money'
        : mode_paiement === 'mtn_momo' ? '🟡 MTN MoMo'
        : '💵 Especes'}
    </span>
  </p>

  <div class="info-box">
    <strong>Cette facture est a regler avant le 5 du mois.</strong><br/>
    Tout retard peut entrainer des penalites selon les termes du bail.
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// TEMPLATE : QUITTANCE DE LOYER
// ================================================
function genererHTMLQuittance(data) {
  var { numero, date, proprietaire, locataire, logement, montant, mode_paiement, mois, annee } = data;
  var nomMois = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  var periodeLabel = mois ? nomMois[mois - 1] + ' ' + annee : date;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Quittance ${numero}</title>
  <style>${stylesCommuns()}</style>
</head>
<body>
  ${headerHTML('QUITTANCE DE LOYER', numero, date)}

  <div style="background:#E8F5E9;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
    <div style="font-size:13px;color:#555;">Je soussigne(e)</div>
    <div style="font-size:20px;font-weight:700;color:#1B2B22;margin:6px 0;">
      ${proprietaire.prenom} ${proprietaire.nom}
    </div>
    <div style="font-size:13px;color:#555;">
      proprietaire du logement ci-dessous, donne quittance a
    </div>
    <div style="font-size:18px;font-weight:700;color:#1B6B3A;margin:6px 0;">
      ${locataire.prenom} ${locataire.nom}
    </div>
    <div style="font-size:13px;color:#555;">
      pour le paiement du loyer du mois de <strong>${periodeLabel}</strong>
    </div>
  </div>

  <div class="montant-box">
    <div class="montant-label">Somme recue</div>
    <div class="montant-val">${Number(montant).toLocaleString('fr-FR')} GNF</div>
    <div class="montant-sub">
      ${mode_paiement === 'orange_money' ? 'Via Orange Money'
        : mode_paiement === 'mtn_momo' ? 'Via MTN MoMo'
        : 'En especes'}
    </div>
  </div>

  <div class="section-titre">Bien concerne</div>
  <table class="details-table">
    <tr><td><strong>Logement</strong></td><td>${logement.titre}</td></tr>
    <tr><td><strong>Adresse</strong></td><td>${logement.adresse}, ${logement.ville}</td></tr>
    ${logement.nb_chambres ? `<tr><td><strong>Chambres</strong></td><td>${logement.nb_chambres}</td></tr>` : ''}
    ${logement.superficie ? `<tr><td><strong>Superficie</strong></td><td>${logement.superficie} m²</td></tr>` : ''}
    <tr><td><strong>Periode</strong></td><td>${periodeLabel}</td></tr>
    <tr><td><strong>Date de paiement</strong></td><td>${date}</td></tr>
  </table>

  <div class="signature-zone">
    <div class="signature-box">
      <div class="signature-label">Signature du proprietaire</div>
      <div style="margin-top:40px;font-size:13px;color:#888;">
        ${proprietaire.prenom} ${proprietaire.nom}
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Signature du locataire</div>
      <div style="margin-top:40px;font-size:13px;color:#888;">
        ${locataire.prenom} ${locataire.nom}
      </div>
    </div>
  </div>

  <div class="info-box" style="margin-top:20px;">
    Cette quittance est un document officiel attestant la reception du loyer.
    Elle est generee automatiquement par la plateforme Werdhe.
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// TEMPLATE : CONTRAT DE BAIL
// ================================================
function genererHTMLContratBail(data) {
  var { numero, date, proprietaire, locataire, logement, montant, duree_mois, type_location, periode } = data;
  var dateDebut = periode && periode.debut
    ? new Date(periode.debut).toLocaleDateString('fr-FR')
    : date;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Contrat de Bail ${numero}</title>
  <style>${stylesCommuns()}</style>
</head>
<body>
  ${headerHTML('CONTRAT DE BAIL', numero, date)}

  <div style="text-align:center;margin-bottom:20px;">
    <div style="font-size:13px;color:#888;">Entre les soussignes</div>
  </div>

  ${partiesHTML(proprietaire, locataire)}

  <div class="section-titre">Article 1 — Objet du bail</div>
  <p>
    Le present contrat porte sur la location du logement suivant :
    <strong>${logement.titre}</strong>, situe au
    <strong>${logement.adresse}, ${logement.ville}, Guinee</strong>.
    ${logement.superficie ? 'Superficie : <strong>' + logement.superficie + ' m²</strong>.' : ''}
    ${logement.nb_chambres ? logement.nb_chambres + ' chambre(s).' : ''}
    ${logement.nb_salles_bain ? logement.nb_salles_bain + ' salle(s) de bain.' : ''}
  </p>

  <div class="section-titre">Article 2 — Duree du bail</div>
  <p>
    Le bail est consenti pour une duree de
    <strong>${duree_mois ? duree_mois + ' mois' : 'duree indeterminee'}</strong>,
    ${type_location === 'longue_duree' ? 'a titre de location longue duree' : 'a titre de location courte duree'},
    prenant effet a compter de la <strong>date de signature du present contrat</strong>.
  </p>
  <p style="margin-top:8px;">
    Date de debut prevue : <strong>${dateDebut}</strong>
  </p>

  <div class="info-box">
    <strong>Important :</strong> Le bail prend effet uniquement a partir de la date
    de signature des deux parties. La reservation est conditionnee
    a la signature de ce contrat.
  </div>

  <div class="section-titre">Article 3 — Loyer et charges</div>
  <p>
    Le loyer mensuel est fixe a
    <strong>${Number(montant).toLocaleString('fr-FR')} GNF</strong> par mois,
    payable le 1er de chaque mois.
    Une quittance de loyer sera generee automatiquement chaque mois.
  </p>

  <div class="montant-box">
    <div class="montant-label">Loyer mensuel</div>
    <div class="montant-val">${Number(montant).toLocaleString('fr-FR')} GNF</div>
    <div class="montant-sub">Payable le 1er de chaque mois</div>
  </div>

  <div class="section-titre">Article 4 — Depot de garantie</div>
  <p>
    Un depot de garantie equivalent a
    <strong>${Number(montant).toLocaleString('fr-FR')} GNF</strong> (1 mois de loyer)
    est verse par le locataire a la signature du present contrat.
    Il sera restitue dans un delai de 30 jours apres la restitution du logement,
    deduction faite des eventuelles reparations.
  </p>

  <div class="section-titre">Article 5 — Obligations du locataire</div>
  <p>Le locataire s'engage a :</p>
  <ul style="margin:8px 0 8px 20px;font-size:13px;color:#555;">
    <li>Payer le loyer a bonne date chaque mois</li>
    <li>Occuper le logement en bon pere de famille</li>
    <li>Signaler tout probleme ou panne au proprietaire</li>
    <li>Ne pas sous-louer sans accord ecrit du proprietaire</li>
    <li>Respecter les regles de voisinage</li>
  </ul>

  <div class="section-titre">Article 6 — Obligations du proprietaire</div>
  <p>Le proprietaire s'engage a :</p>
  <ul style="margin:8px 0 8px 20px;font-size:13px;color:#555;">
    <li>Remettre le logement en bon etat d'usage</li>
    <li>Assurer la jouissance paisible du logement</li>
    <li>Effectuer les reparations urgentes necessaires</li>
    <li>Delivrer une quittance de loyer chaque mois</li>
  </ul>

  <div class="section-titre">Article 7 — Preavis et resiliation</div>
  <p>
    En cas de depart, le locataire devra notifier un preavis d'au moins
    <strong>1 mois</strong> avant la date de depart souhaitee,
    via la plateforme Werdhe ou par ecrit.
  </p>

  <div class="section-titre">Article 8 — Signatures</div>
  <p style="margin-bottom:20px;">
    Fait a ${logement.ville}, le ${date}.
    En deux exemplaires, dont un pour chaque partie.
  </p>

  <div class="signature-zone">
    <div class="signature-box">
      <div class="signature-label">Le Proprietaire / Bailleur</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">
        ${proprietaire.prenom} ${proprietaire.nom}<br/>
        📞 ${proprietaire.telephone || 'N/A'}
      </div>
      <div style="margin-top:20px;font-size:12px;color:#aaa;">Signature</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:10px;"></div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Le Locataire / Preneur</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">
        ${locataire.prenom} ${locataire.nom}<br/>
        📞 ${locataire.telephone || 'N/A'}
      </div>
      <div style="margin-top:20px;font-size:12px;color:#aaa;">Signature</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:10px;"></div>
    </div>
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// TEMPLATE : ETAT DES LIEUX
// ================================================
function genererHTMLEtatDesLieux(data) {
  var { numero, date, proprietaire, locataire, logement, type_etat } = data;
  var typeLabel = type_etat === 'sortie' ? 'SORTIE' : 'ENTREE';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Etat des lieux ${typeLabel} ${numero}</title>
  <style>${stylesCommuns()}
    .room-table { width:100%; border-collapse:collapse; margin:10px 0; }
    .room-table th { background:#1B6B3A; color:#fff; padding:8px 12px; font-size:12px; text-align:left; }
    .room-table td { padding:8px 12px; border-bottom:1px solid #eee; font-size:13px; }
    .room-table tr:nth-child(even) td { background:#f8f9fa; }
    .etat-box { display:inline-block; width:20px; height:20px; border:2px solid #ccc; border-radius:4px; margin-right:6px; vertical-align:middle; }
  </style>
</head>
<body>
  ${headerHTML('ETAT DES LIEUX D\'ENTREE' + (type_etat === 'sortie' ? ' ET DE SORTIE' : ''), numero, date)}
  ${partiesHTML(proprietaire, locataire)}

  <div style="background:#FFF3E0;border-radius:8px;padding:14px;margin-bottom:20px;">
    <strong>Type :</strong>
    <span class="badge badge-${type_etat === 'sortie' ? 'rouge' : 'vert'}">
      Etat des lieux d'${type_etat === 'sortie' ? 'sortie' : 'entree'}
    </span>
    &nbsp;&nbsp;
    <strong>Date :</strong> ${date}
    &nbsp;&nbsp;
    <strong>Logement :</strong> ${logement.titre}
  </div>

  <div class="section-titre">Pieces et equipements</div>
  <table class="room-table">
    <tr>
      <th>Piece / Element</th>
      <th>Etat</th>
      <th>Observations</th>
    </tr>
    <tr><td>Salon / Sejour</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>
    <tr><td>Cuisine</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>
    ${logement.nb_chambres >= 1 ? '<tr><td>Chambre 1</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>' : ''}
    ${logement.nb_chambres >= 2 ? '<tr><td>Chambre 2</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>' : ''}
    ${logement.nb_salles_bain >= 1 ? '<tr><td>Salle de bain</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>' : ''}
    <tr><td>Toilettes</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>
    <tr><td>Electricite</td><td>☐ Fonctionnel &nbsp; ☐ Probleme</td><td>&nbsp;</td></tr>
    <tr><td>Eau / Plomberie</td><td>☐ Fonctionnel &nbsp; ☐ Probleme</td><td>&nbsp;</td></tr>
    <tr><td>Portes et fenetres</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>
    <tr><td>Sol / Carrelage</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>
    <tr><td>Murs / Peinture</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>
    <tr><td>Plafond</td><td>☐ Bon &nbsp; ☐ Moyen &nbsp; ☐ Mauvais</td><td>&nbsp;</td></tr>
    <tr><td>Cle / Acces</td><td>☐ Remis &nbsp; ☐ Non remis</td><td>&nbsp;</td></tr>
    <tr><td>Observations generales</td><td colspan="2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>
  </table>

  <div class="signature-zone">
    <div class="signature-box">
      <div class="signature-label">Le Proprietaire</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">${proprietaire.prenom} ${proprietaire.nom}</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:20px;"></div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Le Locataire</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">${locataire.prenom} ${locataire.nom}</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:20px;"></div>
    </div>
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// TEMPLATE : MISE EN DEMEURE
// ================================================
function genererHTMLMiseEnDemeure(data) {
  var { numero, date, proprietaire, locataire, logement, montant, mois_retard } = data;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Mise en demeure ${numero}</title>
  <style>${stylesCommuns()}</style>
</head>
<body>
  ${headerHTML('MISE EN DEMEURE', numero, date)}

  <div style="text-align:right;margin-bottom:20px;">
    <div style="font-size:13px;">
      ${proprietaire.prenom} ${proprietaire.nom}<br/>
      ${proprietaire.email || ''}<br/>
      ${proprietaire.telephone || ''}<br/>
      ${logement.ville}, le ${date}
    </div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:13px;">A l'attention de :</div>
    <div style="font-weight:700;font-size:15px;margin:6px 0;">
      ${locataire.prenom} ${locataire.nom}
    </div>
    <div style="font-size:13px;color:#555;">
      Locataire — ${logement.titre}, ${logement.adresse}, ${logement.ville}
    </div>
  </div>

  <div style="text-align:center;margin:20px 0;">
    <div style="font-weight:700;font-size:16px;text-decoration:underline;">
      LETTRE DE MISE EN DEMEURE
    </div>
    <div style="font-size:13px;color:#555;">Objet : Impaye de loyer</div>
  </div>

  <div class="alerte-box">
    <div class="alerte-titre">⚠️ Retard de paiement detecte</div>
    <div class="alerte-txt">
      Montant du en retard :
      <strong>${Number(montant).toLocaleString('fr-FR')} GNF</strong>
      ${mois_retard ? '(' + mois_retard + ' mois de retard)' : ''}
    </div>
  </div>

  <p style="margin:16px 0;">Monsieur / Madame ${locataire.nom},</p>

  <p>
    Je me permets de vous adresser la presente mise en demeure concernant le non-paiement
    de votre loyer pour le bien situe au <strong>${logement.adresse}, ${logement.ville}</strong>.
  </p>

  <p style="margin-top:14px;">
    Malgre mes relances anterieures, le montant de
    <strong>${Number(montant).toLocaleString('fr-FR')} GNF</strong>
    correspondant au loyer reste impaye a ce jour.
  </p>

  <div style="background:#FFEBEE;border:2px solid #E53935;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
    <div style="font-weight:700;font-size:14px;color:#B71C1C;">
      Vous etes mis(e) en demeure de regler la somme de
    </div>
    <div style="font-size:28px;font-weight:800;color:#B71C1C;margin:8px 0;">
      ${Number(montant).toLocaleString('fr-FR')} GNF
    </div>
    <div style="font-size:13px;color:#B71C1C;">
      dans un delai de <strong>7 jours</strong> a compter de la reception de ce courrier.
    </div>
  </div>

  <p>
    A defaut de paiement dans ce delai, je me verrai dans l'obligation d'engager
    toutes les procedures legales necessaires au recouvrement de cette somme,
    y compris une procedure d'expulsion conformement a la legislation guineenne.
  </p>

  <p style="margin-top:14px;">
    Dans l'attente d'un reglement rapide de cette situation,
    je vous prie d'agreer, Monsieur / Madame, mes salutations distinguees.
  </p>

  <div class="signature-zone" style="margin-top:30px;">
    <div class="signature-box">
      <div class="signature-label">Le Proprietaire</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">${proprietaire.prenom} ${proprietaire.nom}</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:20px;"></div>
    </div>
    <div></div>
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// TEMPLATE : PREAVIS DE DEPART
// ================================================
function genererHTMLPreavis(data) {
  var { numero, date, proprietaire, locataire, logement, date_depart } = data;
  var dateDepartLabel = date_depart
    ? new Date(date_depart).toLocaleDateString('fr-FR')
    : 'A definir';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Preavis de depart ${numero}</title>
  <style>${stylesCommuns()}</style>
</head>
<body>
  ${headerHTML('LETTRE DE PREAVIS DE DEPART', numero, date)}

  <div style="text-align:right;margin-bottom:20px;">
    <div style="font-size:13px;">
      ${locataire.prenom} ${locataire.nom}<br/>
      ${locataire.email || ''}<br/>
      ${locataire.telephone || ''}<br/>
      ${logement.ville}, le ${date}
    </div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:13px;">A l'attention de :</div>
    <div style="font-weight:700;font-size:15px;margin:6px 0;">
      ${proprietaire.prenom} ${proprietaire.nom}
    </div>
    <div style="font-size:13px;color:#555;">Proprietaire — ${logement.titre}</div>
  </div>

  <div style="text-align:center;margin:20px 0;">
    <div style="font-weight:700;font-size:16px;text-decoration:underline;">
      LETTRE DE PREAVIS DE DEPART
    </div>
    <div style="font-size:13px;color:#555;">
      Objet : Resiliation de bail — Depart du ${dateDepartLabel}
    </div>
  </div>

  <p>Monsieur / Madame ${proprietaire.nom},</p>

  <p style="margin-top:14px;">
    Par la presente, je vous informe de ma decision de quitter le logement situe au
    <strong>${logement.adresse}, ${logement.ville}</strong>
    que j'occupe en qualite de locataire.
  </p>

  <div style="background:#E8F5E9;border:2px solid #1B6B3A;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
    <div style="font-size:13px;color:#555;">Date de depart prevue</div>
    <div style="font-size:28px;font-weight:800;color:#1B6B3A;margin:8px 0;">
      ${dateDepartLabel}
    </div>
    <div style="font-size:12px;color:#888;">Preavis de 1 mois respecte</div>
  </div>

  <p>
    Je m'engage a restituer les cles et a laisser le logement dans un etat
    propre et en bon etat d'entretien a la date indiquee ci-dessus.
    Je demande la realisation d'un etat des lieux de sortie contradictoirement
    avec vous ou votre representant.
  </p>

  <p style="margin-top:14px;">
    Concernant le depot de garantie, je souhaite qu'il me soit restitue
    dans un delai de 30 jours apres la remise des cles,
    conformement aux termes du contrat de bail.
  </p>

  <p style="margin-top:14px;">
    Je vous remercie de bien vouloir accuser reception de ce courrier
    et de me confirmer les modalites de l'etat des lieux de sortie.
  </p>

  <p style="margin-top:14px;">
    Veuillez agreer, Monsieur / Madame, mes salutations distinguees.
  </p>

  <div class="signature-zone" style="margin-top:30px;">
    <div class="signature-box">
      <div class="signature-label">Le Locataire</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">${locataire.prenom} ${locataire.nom}</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:20px;"></div>
    </div>
    <div></div>
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// TEMPLATE : RAPPORT FINANCIER
// ================================================
function genererHTMLRapportFinancier(data) {
  var { numero, date, proprietaire, logement, montant, mois, annee, paiements } = data;
  var nomMois = ['Janvier','Fevrier','Mars','Avril','Mai','Juin',
    'Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  var periodeLabel = mois ? nomMois[mois - 1] + ' ' + annee : 'Annee ' + annee;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport Financier ${numero}</title>
  <style>${stylesCommuns()}</style>
</head>
<body>
  ${headerHTML('RAPPORT FINANCIER', numero, date)}

  <div class="partie-box" style="margin-bottom:20px;">
    <div class="partie-label">Proprietaire</div>
    <div class="partie-nom">${proprietaire.prenom} ${proprietaire.nom}</div>
    <div class="partie-info">Periode : ${periodeLabel}</div>
    ${logement ? `<div class="partie-info">Bien : ${logement.titre}</div>` : ''}
  </div>

  <div class="montant-box">
    <div class="montant-label">Total encaisse</div>
    <div class="montant-val">${Number(montant).toLocaleString('fr-FR')} GNF</div>
    <div class="montant-sub">Periode : ${periodeLabel}</div>
  </div>

  ${paiements && paiements.length > 0 ? `
  <div class="section-titre">Detail des paiements</div>
  <table class="details-table">
    <tr>
      <th>Locataire</th>
      <th>Bien</th>
      <th>Montant</th>
      <th>Date</th>
      <th>Statut</th>
    </tr>
    ${paiements.map(function(p) {
      return '<tr>' +
        '<td>' + (p.locataire || 'N/A') + '</td>' +
        '<td>' + (p.bien || 'N/A') + '</td>' +
        '<td>' + Number(p.montant).toLocaleString('fr-FR') + ' GNF</td>' +
        '<td>' + (p.date || 'N/A') + '</td>' +
        '<td><span class="badge badge-' + (p.statut === 'paye' ? 'vert' : 'rouge') + '">' +
          (p.statut === 'paye' ? 'Paye' : 'En retard') +
        '</span></td>' +
      '</tr>';
    }).join('')}
  </table>` : ''}

  <div class="info-box">
    Ce rapport est genere automatiquement par la plateforme Werdhe
    et reflete les paiements enregistres sur la periode selectionnee.
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// TEMPLATE : CAUTION / DEPOT DE GARANTIE
// ================================================
function genererHTMLCaution(data) {
  var { numero, date, proprietaire, locataire, logement, montant } = data;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Caution ${numero}</title>
  <style>${stylesCommuns()}</style>
</head>
<body>
  ${headerHTML('CONTRAT DE CAUTION', numero, date)}
  ${partiesHTML(proprietaire, locataire)}

  <div class="section-titre">Objet</div>
  <p>
    Le present contrat atteste du versement d'un depot de garantie (caution)
    par <strong>${locataire.prenom} ${locataire.nom}</strong>
    au proprietaire <strong>${proprietaire.prenom} ${proprietaire.nom}</strong>
    pour le logement : <strong>${logement.titre}</strong>,
    ${logement.adresse}, ${logement.ville}.
  </p>

  <div class="montant-box">
    <div class="montant-label">Depot de garantie verse</div>
    <div class="montant-val">${Number(montant).toLocaleString('fr-FR')} GNF</div>
    <div class="montant-sub">Equivalent a 1 mois de loyer</div>
  </div>

  <div class="section-titre">Conditions de restitution</div>
  <p>
    Le depot de garantie sera restitue dans un delai de
    <strong>30 jours</strong> apres la remise des cles,
    deduction faite des eventuels frais de remise en etat du logement
    constates lors de l'etat des lieux de sortie.
  </p>

  <div class="section-titre">Conditions de retenue</div>
  <ul style="margin:8px 0 8px 20px;font-size:13px;color:#555;">
    <li>Loyers impayes ou charges dues</li>
    <li>Degradations au-dela de l'usure normale</li>
    <li>Nettoyage necessaire du logement</li>
    <li>Cles non restituees</li>
  </ul>

  <div class="signature-zone">
    <div class="signature-box">
      <div class="signature-label">Le Proprietaire — recoit la caution</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">${proprietaire.prenom} ${proprietaire.nom}</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:20px;"></div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Le Locataire — verse la caution</div>
      <div style="margin-top:10px;font-size:12px;color:#555;">${locataire.prenom} ${locataire.nom}</div>
      <div style="height:40px;border-bottom:1px solid #ccc;margin-top:20px;"></div>
    </div>
  </div>

  ${footerHTML(numero, date)}
</body>
</html>`;
}

// ================================================
// FONCTION PRINCIPALE — GENERER ET SAUVEGARDER
// Dispatch vers le bon template selon le type
// ================================================
const genererDocument = async ({
  type, reservation_id, paiement_id,
  proprietaire, locataire, logement,
  periode, montant, mode_paiement,
  duree_mois, type_location,
  mois, annee,
  date_depart, type_etat, mois_retard, paiements,
  envoyer_email = true
}) => {
  try {
    var date = new Date().toLocaleDateString('fr-FR');
    var timestamp = Date.now();

    // Prefixes pour les numéros de documents
    var prefixes = {
      facture: 'FAC',
      quittance: 'QUI',
      contrat_bail: 'BAIL',
      etat_lieux: 'EDL',
      mise_en_demeure: 'MED',
      rapport_financier: 'RAP',
      caution: 'CAU',
      preavis: 'PRE'
    };

    var numero = (prefixes[type] || 'WRD') + '-' +
      new Date().getFullYear() + '-' +
      String(timestamp).slice(-5);

    // Données communes à tous les templates
    var dataCommune = {
      numero, date,
      proprietaire, locataire, logement,
      periode, montant, mode_paiement,
      mois, annee,
      date_depart, type_etat,
      mois_retard, paiements,
      duree_mois, type_location
    };

    // Générer le HTML selon le type de document
    var htmlDocument = '';
    var titre = '';

    if (type === 'facture') {
      htmlDocument = genererHTMLFacture(dataCommune);
      var nomMoisF = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
      titre = 'Facture ' + numero + (mois ? ' — ' + nomMoisF[mois - 1] + ' ' + annee : '');

    } else if (type === 'quittance') {
      htmlDocument = genererHTMLQuittance(dataCommune);
      var nomMoisQ = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
      titre = 'Quittance ' + numero + (mois ? ' — ' + nomMoisQ[mois - 1] + ' ' + annee : '');

    } else if (type === 'contrat_bail') {
      htmlDocument = genererHTMLContratBail(dataCommune);
      titre = 'Contrat de bail ' + numero;

    } else if (type === 'etat_lieux') {
      htmlDocument = genererHTMLEtatDesLieux(dataCommune);
      titre = 'Etat des lieux ' + (type_etat === 'sortie' ? 'sortie' : 'entree') + ' ' + numero;

    } else if (type === 'mise_en_demeure') {
      htmlDocument = genererHTMLMiseEnDemeure(dataCommune);
      titre = 'Mise en demeure ' + numero;

    } else if (type === 'rapport_financier') {
      htmlDocument = genererHTMLRapportFinancier(dataCommune);
      titre = 'Rapport financier ' + numero;

    } else if (type === 'caution') {
      htmlDocument = genererHTMLCaution(dataCommune);
      titre = 'Caution ' + numero;

    } else if (type === 'preavis') {
      htmlDocument = genererHTMLPreavis(dataCommune);
      titre = 'Preavis de depart ' + numero;

    } else {
      return { success: false, erreur: 'Type de document non reconnu : ' + type };
    }

    // Sauvegarder en base de données
    var result = await db.query(
      `INSERT INTO documents
        (type, titre, reservation_id, paiement_id, logement_id,
         proprietaire_id, locataire_id, contenu_html, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'genere')
       RETURNING *`,
      [
        type, titre,
        reservation_id || null,
        paiement_id || null,
        logement ? logement.id : null,
        proprietaire ? proprietaire.id : null,
        locataire ? locataire.id : null,
        htmlDocument
      ]
    );

    var document = result.rows[0];

    // Envoyer par email au locataire si demandé
    if (envoyer_email && locataire && locataire.email) {
      try {
        await envoyerEmailDocument({
          email: locataire.email,
          prenom: locataire.prenom,
          typeDocument: type,
          numeroDocument: numero,
          htmlDocument: htmlDocument,
          nomFichier: numero + '.html'
        });

        await db.query(
          `UPDATE documents
           SET statut = 'envoye', email_envoye = TRUE, email_envoye_at = NOW()
           WHERE id = $1`,
          [document.id]
        );
      } catch (emailErr) {
        // Email non bloquant : le document est quand même sauvegardé
        console.warn('Email non envoye (non bloquant):', emailErr.message);
      }
    }

    return { success: true, document, numero };

  } catch (err) {
    console.error('Erreur generation document:', err);
    return { success: false, erreur: err.message };
  }
};

module.exports = { genererDocument };