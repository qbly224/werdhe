// Service de génération PDF
// Utilise HTML → PDF via puppeteer

// ================================
// TEMPLATE CSS COMMUN
// ================================
const cssCommun = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Arial', sans-serif;
    color: #333;
    font-size: 14px;
    line-height: 1.5;
  }
  .document {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 3px solid #2E7D32;
  }
  .logo {
    font-size: 28px;
    font-weight: 900;
    color: #2E7D32;
    letter-spacing: 1px;
  }
  .logo small {
    display: block;
    font-size: 12px;
    color: #888;
    font-weight: 400;
    letter-spacing: 0;
  }
  .doc-info { text-align: right; }
  .doc-numero {
    font-size: 18px;
    font-weight: 700;
    color: #2E7D32;
  }
  .doc-date { font-size: 13px; color: #888; margin-top: 4px; }
  .titre-doc {
    text-align: center;
    font-size: 22px;
    font-weight: 800;
    color: #1B5E20;
    margin: 30px 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }
  .partie-box {
    background: #f9f9f9;
    border-left: 4px solid #2E7D32;
    padding: 16px;
    border-radius: 0 8px 8px 0;
  }
  .partie-box h4 {
    font-size: 12px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }
  .partie-box strong {
    font-size: 16px;
    color: #222;
    display: block;
    margin-bottom: 4px;
  }
  .partie-box p { font-size: 13px; color: #666; }
  .section {
    margin-bottom: 24px;
  }
  .section h3 {
    font-size: 14px;
    text-transform: uppercase;
    color: #2E7D32;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 6px;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  th {
    background: #2E7D32;
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-size: 13px;
  }
  td {
    padding: 10px 14px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
  }
  tr:nth-child(even) td { background: #fafafa; }
  .total-row td {
    font-weight: 700;
    font-size: 16px;
    background: #e8f5e9 !important;
    color: #1B5E20;
    border-top: 2px solid #2E7D32;
  }
  .montant-grand {
    text-align: center;
    background: #e8f5e9;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }
  .montant-grand .chiffre {
    font-size: 36px;
    font-weight: 900;
    color: #1B5E20;
  }
  .montant-grand .devise { font-size: 16px; color: #888; }
  .badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }
  .badge-paye { background: #e8f5e9; color: #2E7D32; }
  .badge-attente { background: #fff3e0; color: #e65100; }
  .footer {
    margin-top: 50px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 12px;
    color: #bbb;
  }
  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 40px;
  }
  .signature-box {
    text-align: center;
  }
  .signature-box .label {
    font-size: 13px;
    color: #888;
    margin-bottom: 40px;
  }
  .signature-line {
    border-top: 1px solid #333;
    padding-top: 8px;
    font-size: 13px;
    color: #555;
  }
  .article {
    margin-bottom: 16px;
  }
  .article h4 {
    font-weight: 700;
    margin-bottom: 6px;
    color: #2E7D32;
  }
  .article p {
    font-size: 13px;
    color: #555;
    text-align: justify;
  }
`;

// ================================
// TEMPLATE FACTURE
// ================================
const genererHTMLFacture = (data) => {
  const {
    numero, date, locataire, proprietaire,
    logement, periode, montant, mode_paiement, statut
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>${cssCommun}</style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <div>
            <div class="logo">🏠 Werdhè<small>Plateforme de Location Immobilière</small></div>
          </div>
          <div class="doc-info">
            <div class="doc-numero">${numero}</div>
            <div class="doc-date">Émise le ${date}</div>
            <div style="margin-top:8px">
              <span class="badge ${statut === 'complete' ? 'badge-paye' : 'badge-attente'}">
                ${statut === 'complete' ? '✅ PAYÉE' : '⏳ EN ATTENTE'}
              </span>
            </div>
          </div>
        </div>

        <div class="titre-doc">Facture de Loyer</div>

        <div class="parties">
          <div class="partie-box">
            <h4>Propriétaire (Vendeur)</h4>
            <strong>${proprietaire.prenom} ${proprietaire.nom}</strong>
            <p>📞 ${proprietaire.telephone || 'N/A'}</p>
            <p>📧 ${proprietaire.email || 'N/A'}</p>
          </div>
          <div class="partie-box">
            <h4>Locataire (Acheteur)</h4>
            <strong>${locataire.prenom} ${locataire.nom}</strong>
            <p>📞 ${locataire.telephone || 'N/A'}</p>
            <p>📧 ${locataire.email || 'N/A'}</p>
          </div>
        </div>

        <div class="section">
          <h3>Détails du bien loué</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Localisation</th>
                <th>Période</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${logement.titre}</td>
                <td>${logement.adresse}, ${logement.ville}</td>
                <td>
                  Du ${new Date(periode.debut).toLocaleDateString('fr-FR')}
                  ${periode.fin ? 'au ' + new Date(periode.fin).toLocaleDateString('fr-FR') : '(longue durée)'}
                </td>
                <td>${Number(montant).toLocaleString()} GNF</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td>${Number(montant).toLocaleString()} GNF</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="montant-grand">
          <div class="chiffre">${Number(montant).toLocaleString()}</div>
          <div class="devise">Francs Guinéens (GNF)</div>
          <div style="margin-top:8px; font-size:13px; color:#666">
            Mode de paiement : ${mode_paiement === 'en_ligne' ? '💳 En ligne' : '💵 Espèces'}
          </div>
        </div>

        <div class="footer">
          <p>Werdhè — Plateforme de location immobilière en Guinée</p>
          <p>Ce document est généré automatiquement et constitue une preuve de paiement valide.</p>
          <p style="margin-top:4px; color:#ddd">${numero} | ${date}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ================================
// TEMPLATE QUITTANCE DE LOYER
// ================================
const genererHTMLQuittance = (data) => {
  const {
    numero, date, locataire, proprietaire,
    logement, periode, montant, mode_paiement
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>${cssCommun}</style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <div>
            <div class="logo">🏠 Werdhè<small>Plateforme de Location Immobilière</small></div>
          </div>
          <div class="doc-info">
            <div class="doc-numero">QUI-${numero}</div>
            <div class="doc-date">Émise le ${date}</div>
          </div>
        </div>

        <div class="titre-doc">Quittance de Loyer</div>

        <div class="section">
          <p style="font-size:15px; text-align:center; color:#555; margin-bottom:24px">
            Je soussigné(e), <strong>${proprietaire.prenom} ${proprietaire.nom}</strong>,
            propriétaire du logement désigné ci-dessous, déclare avoir reçu de
            <strong>${locataire.prenom} ${locataire.nom}</strong>,
            locataire, la somme de :
          </p>

          <div class="montant-grand">
            <div class="chiffre">${Number(montant).toLocaleString()}</div>
            <div class="devise">Francs Guinéens (GNF)</div>
          </div>

          <p style="font-size:15px; text-align:center; color:#555; margin-top:24px">
            Au titre du loyer du logement pour la période du
            <strong>${new Date(periode.debut).toLocaleDateString('fr-FR')}</strong>
            ${periode.fin
              ? 'au <strong>' + new Date(periode.fin).toLocaleDateString('fr-FR') + '</strong>'
              : '(location longue durée)'}.
          </p>
        </div>

        <div class="parties" style="margin-top:30px">
          <div class="partie-box">
            <h4>Propriétaire</h4>
            <strong>${proprietaire.prenom} ${proprietaire.nom}</strong>
            <p>📞 ${proprietaire.telephone || 'N/A'}</p>
            <p>📧 ${proprietaire.email || 'N/A'}</p>
          </div>
          <div class="partie-box">
            <h4>Locataire</h4>
            <strong>${locataire.prenom} ${locataire.nom}</strong>
            <p>📞 ${locataire.telephone || 'N/A'}</p>
            <p>📧 ${locataire.email || 'N/A'}</p>
          </div>
        </div>

        <div class="section">
          <h3>Logement concerné</h3>
          <table>
            <tbody>
              <tr><td><strong>Adresse</strong></td><td>${logement.adresse}, ${logement.ville}</td></tr>
              <tr><td><strong>Type</strong></td><td>${logement.titre}</td></tr>
              <tr><td><strong>Mode de paiement</strong></td>
                <td>${mode_paiement === 'en_ligne' ? '💳 En ligne' : '💵 Espèces'}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="label">Signature du Propriétaire</div>
            <div class="signature-line">${proprietaire.prenom} ${proprietaire.nom}</div>
          </div>
          <div class="signature-box">
            <div class="label">Signature du Locataire</div>
            <div class="signature-line">${locataire.prenom} ${locataire.nom}</div>
          </div>
        </div>

        <div class="footer">
          <p>Werdhè — Quittance de loyer officielle</p>
          <p>QUI-${numero} | ${date}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ================================
// TEMPLATE CONTRAT DE BAIL
// ================================
const genererHTMLContratBail = (data) => {
  const {
    numero, date, locataire, proprietaire,
    logement, date_debut, date_fin, montant,
    duree_mois, type_location
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>${cssCommun}</style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <div>
            <div class="logo">🏠 Werdhè<small>Plateforme de Location Immobilière</small></div>
          </div>
          <div class="doc-info">
            <div class="doc-numero">BAIL-${numero}</div>
            <div class="doc-date">Établi le ${date}</div>
          </div>
        </div>

        <div class="titre-doc">Contrat de Bail d'Habitation</div>

        <div class="parties">
          <div class="partie-box">
            <h4>Le Bailleur (Propriétaire)</h4>
            <strong>${proprietaire.prenom} ${proprietaire.nom}</strong>
            <p>📞 ${proprietaire.telephone || 'N/A'}</p>
            <p>📧 ${proprietaire.email || 'N/A'}</p>
          </div>
          <div class="partie-box">
            <h4>Le Preneur (Locataire)</h4>
            <strong>${locataire.prenom} ${locataire.nom}</strong>
            <p>📞 ${locataire.telephone || 'N/A'}</p>
            <p>📧 ${locataire.email || 'N/A'}</p>
          </div>
        </div>

        <div class="section">
          <h3>Article 1 — Désignation des locaux</h3>
          <div class="article">
            <p>
              Le bailleur loue au preneur, qui accepte, le bien immobilier
              suivant : <strong>${logement.titre}</strong>, situé au
              <strong>${logement.adresse}, ${logement.ville}, Guinée</strong>.
              ${logement.superficie ? 'Superficie : <strong>' + logement.superficie + ' m²</strong>.' : ''}
              ${logement.nb_chambres > 0 ? 'Composé de <strong>' + logement.nb_chambres + ' chambre(s)</strong>' +
                (logement.nb_salles_bain > 0 ? ' et <strong>' + logement.nb_salles_bain + ' salle(s) de bain</strong>' : '') + '.' : ''}
            </p>
          </div>
        </div>

        <div class="section">
          <h3>Article 2 — Durée du contrat</h3>
          <div class="article">
            <p>
              Le présent contrat est conclu pour une durée de
              <strong>${type_location === 'longue_duree'
                ? (duree_mois + ' mois à compter du ' + new Date(date_debut).toLocaleDateString('fr-FR'))
                : ('du ' + new Date(date_debut).toLocaleDateString('fr-FR') +
                   ' au ' + new Date(date_fin).toLocaleDateString('fr-FR'))
              }</strong>.
              ${type_location === 'longue_duree'
                ? 'Le contrat sera renouvelé tacitement chaque mois sauf préavis.'
                : 'À l\'expiration du terme, le présent contrat prend fin de plein droit.'}
            </p>
          </div>
        </div>

        <div class="section">
          <h3>Article 3 — Loyer et charges</h3>
          <div class="article">
            <p>
              Le loyer mensuel est fixé à
              <strong>${Number(montant).toLocaleString()} Francs Guinéens (GNF)</strong>,
              payable le premier de chaque mois. Le paiement peut être effectué
              en espèces ou par voie électronique via la plateforme Werdhè.
            </p>
          </div>
        </div>

        <div class="section">
          <h3>Article 4 — Obligations du bailleur</h3>
          <div class="article">
            <p>
              Le bailleur s'engage à : délivrer le logement en bon état d'usage,
              assurer la jouissance paisible du logement, effectuer les réparations
              nécessaires autres que locatives, et fournir quittance de loyer à chaque paiement.
            </p>
          </div>
        </div>

        <div class="section">
          <h3>Article 5 — Obligations du preneur</h3>
          <div class="article">
            <p>
              Le preneur s'engage à : payer le loyer aux termes convenus,
              user paisiblement des locaux, ne pas sous-louer sans accord écrit
              du bailleur, restituer le logement en bon état à la fin du bail,
              et respecter le règlement de l'immeuble.
            </p>
          </div>
        </div>

        <div class="section">
          <h3>Article 6 — Résiliation</h3>
          <div class="article">
            <p>
              Chaque partie peut mettre fin au contrat moyennant un préavis
              d'un (1) mois notifié par écrit ou via la plateforme Werdhè.
              En cas de non-paiement du loyer, le bailleur pourra résilier
              le contrat après mise en demeure restée sans effet.
            </p>
          </div>
        </div>

        <div class="section">
          <h3>Article 7 — Droit applicable</h3>
          <div class="article">
            <p>
              Le présent contrat est soumis au droit guinéen.
              Tout litige sera soumis aux juridictions compétentes
              de la République de Guinée.
            </p>
          </div>
        </div>

        <p style="text-align:center; margin-top:30px; color:#888; font-size:13px">
          Fait à ${logement.ville}, le ${date}, en deux (2) exemplaires originaux.
        </p>

        <div class="signatures">
          <div class="signature-box">
            <div class="label">Le Bailleur<br><small>(Propriétaire)</small></div>
            <div class="signature-line">${proprietaire.prenom} ${proprietaire.nom}</div>
          </div>
          <div class="signature-box">
            <div class="label">Le Preneur<br><small>(Locataire)</small></div>
            <div class="signature-line">${locataire.prenom} ${locataire.nom}</div>
          </div>
        </div>

        <div class="footer">
          <p>Werdhè — Contrat de bail officiel</p>
          <p>BAIL-${numero} | ${date}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  genererHTMLFacture,
  genererHTMLQuittance,
  genererHTMLContratBail
};