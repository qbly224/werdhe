// ================================================
// MODÈLES DE DOCUMENTS : une feuille A4 par document
// (le bail est une feuille recto-verso : 2 faces).
//
// Chaque fonction reçoit les données déjà chargées et renvoie une page HTML
// complète. Règles communes :
//  - toute valeur venant d'un utilisateur passe par esc() (pas d'injection HTML) ;
//  - les textes libres sont bornés (cl()) pour que la page ne déborde jamais ;
//  - le jeton EMPREINTE_JETON est remplacé par l'empreinte SHA-256 à la génération.
// ================================================

const EMPREINTE_JETON = '__EMPREINTE_SHA256__';
const URL_VERIF = 'https://www.werdhe.com/verifier/';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// ── Utilitaires ─────────────────────────────────────────────
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Borne un texte (longueur maximale) puis l'échappe.
function cl(v, max) {
  var s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  if (s.length > max) s = s.slice(0, max - 1).trimEnd() + '…';
  return esc(s);
}

function gnf(n) {
  var x = Math.round(Number(n) || 0);
  return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' GNF';
}

function nomComplet(p) {
  return cl(((p && p.prenom) || '') + ' ' + ((p && p.nom) || ''), 48);
}

function dateFR(d) {
  var x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return '';
  return x.toLocaleDateString('fr-FR', { timeZone: 'Africa/Conakry', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function dateLongue(d) {
  var x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return '';
  return x.toLocaleDateString('fr-FR', { timeZone: 'Africa/Conakry', day: 'numeric', month: 'long', year: 'numeric' });
}

function dateHeureFR(d) {
  var x = d instanceof Date ? d : new Date(d);
  return dateFR(x) + ' à ' + x.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Conakry', hour: '2-digit', minute: '2-digit' });
}

function ajouterJours(d, n) {
  var x = new Date(d); x.setDate(x.getDate() + n); return x;
}

function libelleMode(m) {
  var t = { orange_money: 'Orange Money', mtn_momo: 'MTN MoMo', especes: 'Espèces', djomy: 'Paiement en ligne (Djomy)', carte: 'Carte bancaire' };
  return t[m] || 'Paiement enregistré';
}

// Montant en toutes lettres (français), jusqu'aux milliards.
var U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
var DIZ = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
function sousCent(n, fin) {
  if (n < 17) return U[n];
  if (n < 20) return 'dix-' + U[n - 10];
  if (n < 70) {
    var d = Math.floor(n / 10), u = n % 10;
    if (u === 0) return DIZ[d];
    if (u === 1) return DIZ[d] + ' et un';
    return DIZ[d] + '-' + U[u];
  }
  if (n < 80) { var r = n - 60; return r === 11 ? 'soixante et onze' : 'soixante-' + sousCent(r, fin); }
  if (n === 80) return fin ? 'quatre-vingts' : 'quatre-vingt';
  return 'quatre-vingt-' + sousCent(n - 80, fin);
}
function sousMille(n, fin) {
  var c = Math.floor(n / 100), r = n % 100, s = '';
  if (c === 1) s = 'cent';
  else if (c > 1) s = U[c] + ' cent' + (r === 0 && fin ? 's' : '');
  if (r > 0) s += (s ? ' ' : '') + sousCent(r, fin);
  return s;
}
function enLettres(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return 'zéro';
  var parts = [];
  var md = Math.floor(n / 1e9), mi = Math.floor((n % 1e9) / 1e6), mm = Math.floor((n % 1e6) / 1e3), u = n % 1e3;
  if (md) parts.push(sousMille(md, true) + ' milliard' + (md > 1 ? 's' : ''));
  if (mi) parts.push(sousMille(mi, true) + ' million' + (mi > 1 ? 's' : ''));
  if (mm) parts.push(mm === 1 ? 'mille' : sousMille(mm, false) + ' mille');
  if (u) parts.push(sousMille(u, true));
  return parts.join(' ');
}

// ── Feuille de style commune (A4, impression) ───────────────
function styles() {
  return `
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12.5px; line-height: 1.45; color: #1A211D; background: #E6ECE8; }
  .page { width: 210mm; height: 297mm; padding: 11mm 13mm 9mm; background: #fff; display: flex; flex-direction: column; overflow: hidden; margin: 0 auto; position: relative; page-break-after: always; break-after: page; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  @media screen { .page { margin: 16px auto; box-shadow: 0 6px 24px rgba(10,30,18,.18); } }
  .top { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; border-bottom: 3px solid #1B6B3A; margin-bottom: 14px; flex: none; }
  .logo { font-size: 23px; font-weight: 800; color: #1B6B3A; display: flex; align-items: center; gap: 8px; letter-spacing: -.01em; }
  .logo svg { width: 24px; height: 24px; flex: none; }
  .logo small { display: block; font-size: 10px; font-weight: 500; color: #6B766F; letter-spacing: 0; margin-top: -2px; }
  .type { text-align: right; }
  .type b { display: block; font-size: 17px; letter-spacing: .02em; color: #1B6B3A; line-height: 1.2; }
  .type span { font-size: 10.5px; color: #6B766F; }
  .corps { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
  .box { border: 1px solid #DDE3DF; border-radius: 6px; padding: 8px 11px; font-size: 12px; overflow-wrap: anywhere; }
  .box small { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .09em; color: #6B766F; font-weight: 700; margin-bottom: 2px; }
  .box b { font-size: 13.5px; }
  .h { font-size: 10.5px; text-transform: uppercase; letter-spacing: .1em; font-weight: 700; color: #1B6B3A; margin: 11px 0 5px; padding-bottom: 3px; border-bottom: 1px solid #DDE3DF; }
  p { margin: 0 0 7px; overflow-wrap: anywhere; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; color: #6B766F; padding: 4px 7px; border-bottom: 1.5px solid #1A211D; }
  td { padding: 4px 7px; border-bottom: 1px solid #DDE3DF; vertical-align: top; overflow-wrap: anywhere; }
  .r { text-align: right; font-variant-numeric: tabular-nums; } .c { text-align: center; }
  .big { text-align: center; border: 2px solid #1B6B3A; border-radius: 8px; padding: 9px 12px; margin: 10px 0; background: #EAF5EE; }
  .big small { display: block; color: #55655B; font-size: 10.5px; }
  .big b { display: block; font-size: 27px; color: #1B6B3A; font-variant-numeric: tabular-nums; line-height: 1.2; }
  .big.rouge { border-color: #B3261E; background: #FBEDEB; } .big.rouge b { color: #B3261E; }
  .pill { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 10.5px; font-weight: 700; background: #DFF1E5; color: #14582E; }
  .pill.a { background: #FBEBD0; color: #8A4F05; } .pill.r { background: #FADAD6; color: #9A1E17; }
  .note { font-size: 10px; color: #6B766F; }
  .cb { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #1A211D; border-radius: 3px; vertical-align: -2px; }
  .cb.on { background: #1B6B3A; border-color: #1B6B3A; position: relative; }
  .cb.on::after { content: ''; position: absolute; left: 3px; top: 0px; width: 3px; height: 7px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
  .grille td { padding: 2.5px 6px; font-size: 11px; line-height: 1.3; }
  .grille th { padding: 3px 6px; }
  tr.deg td { background: #FFF3E0; }
  .sigimg { display: block; height: 44px; max-width: 100%; object-fit: contain; margin: 3px 0 1px; }
  .sign.trois { grid-template-columns: 1fr 1fr 1fr; }
  .sign.trois .sig { padding: 7px 9px; }
  .lines span { display: block; border-bottom: 1px solid #C9D1CC; height: 21px; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: auto; padding-top: 12px; flex: none; }
  .sig { border: 1px solid #DDE3DF; border-radius: 6px; padding: 8px 11px; min-height: 92px; font-size: 11px; overflow: hidden; }
  .sig small { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .09em; color: #6B766F; font-weight: 700; }
  .sig .ink { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 19px; color: #1B3F8F; margin: 5px 0 2px; line-height: 1.15; overflow-wrap: anywhere; }
  .sig .meta { font-family: 'Courier New', monospace; font-size: 8.5px; color: #6B766F; line-height: 1.35; }
  .sig .nom { font-size: 12px; font-weight: 600; margin-top: 4px; overflow-wrap: anywhere; }
  .sig .vide { height: 44px; border-bottom: 1px solid #9AA39E; margin-top: 8px; }
  .foot { display: flex; gap: 10px; align-items: center; padding-top: 9px; margin-top: 10px; border-top: 1px solid #DDE3DF; font-size: 9px; color: #6B766F; line-height: 1.4; flex: none; }
  .foot .qr { width: 40px; height: 40px; flex: none; } .foot .qr svg { width: 40px; height: 40px; display: block; }
  .foot code { font-family: 'Courier New', monospace; font-size: 8.5px; word-break: break-all; }
  .art { font-size: 11.5px; } .art p { margin-bottom: 5px; } .art ul { margin: 2px 0 6px 16px; } .art li { margin-bottom: 1px; }
  `;
}

var LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#1B6B3A"/><path d="M6 17v-6l6-4.5 6 4.5v6" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';

function entete(titre, numero, date) {
  return '<div class="top"><div class="logo">' + LOGO + '<div>Werdhe<small>Plateforme immobilière · Guinée</small></div></div>' +
    '<div class="type"><b>' + esc(titre) + '</b><span>N° ' + esc(numero) + ' · ' + esc(date) + '</span></div></div>';
}

function pied(d) {
  var qr = d.qr ? '<div class="qr">' + d.qr + '</div>' : '';
  return '<div class="foot">' + qr + '<div>Document généré le ' + esc(d.dateHeure) + ' par Werdhe · authenticité vérifiable sur <b>' +
    esc(URL_VERIF.replace('https://', '')) + esc(d.numero) + '</b><br><code>SHA-256 : ' + EMPREINTE_JETON + '</code>' +
    (d.pied_note ? '<br>' + d.pied_note : '') + '</div></div>';
}

function document_(titreDoc, pages) {
  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>' +
    '<title>' + esc(titreDoc) + '</title><style>' + styles() + '</style></head><body>' + pages.join('') + '</body></html>';
}

function page(contenu) { return '<section class="page">' + contenu + '</section>'; }

function bienLigne(l) {
  var bits = [];
  if (l.superficie) bits.push(esc(l.superficie) + ' m²');
  if (l.nb_chambres) bits.push(esc(l.nb_chambres) + ' chambre' + (l.nb_chambres > 1 ? 's' : ''));
  if (l.nb_salles_bain) bits.push(esc(l.nb_salles_bain) + ' salle' + (l.nb_salles_bain > 1 ? 's' : '') + ' de bain');
  return '<b>' + cl(l.titre, 70) + '</b><br>' + cl(l.adresse, 90) + ', ' + cl(l.ville, 40) + (bits.length ? '<br>' + bits.join(' · ') : '');
}

function boitesParties(p, l, libP, libL) {
  return '<div class="grid2"><div class="box"><small>' + libP + '</small><b>' + nomComplet(p) + '</b><br>' +
    cl(p.telephone || '', 24) + (p.telephone && p.email ? ' · ' : '') + cl(p.email || '', 40) + '</div>' +
    '<div class="box"><small>' + libL + '</small><b>' + nomComplet(l) + '</b><br>' +
    cl(l.telephone || '', 24) + (l.telephone && l.email ? ' · ' : '') + cl(l.email || '', 40) + '</div></div>';
}

function periodeLibelle(d) {
  return d.mois ? MOIS[d.mois - 1] + ' ' + d.annee : d.date;
}

// ── 1. FACTURE (acquittée) ─────────────────────────────────
function facture(d) {
  var corps = '<div class="corps">' +
    '<div class="big"><small>Montant payé</small><b>' + gnf(d.montant) + '</b><small><span class="pill">Payé</span> · ' + esc(d.dateHeure) + '</small></div>' +
    boitesParties(d.proprietaire, d.locataire, 'Encaissé pour (bailleur)', 'Payé par (locataire)') +
    '<table><tr><th>Désignation</th><th class="r">Montant</th></tr>' +
    '<tr><td>Loyer · ' + cl(periodeLibelle(d), 30) + ' · ' + cl(d.logement.titre, 60) + '</td><td class="r">' + gnf(d.montant) + '</td></tr>' +
    '<tr><td><b>Total</b></td><td class="r"><b>' + gnf(d.montant) + '</b></td></tr></table>' +
    '<div class="h">Bien loué</div><p>' + bienLigne(d.logement) + '</p>' +
    '<div class="h">Paiement</div><table><tr><td>Mode</td><td class="r">' + esc(libelleMode(d.mode_paiement)) + '</td></tr>' +
    '<tr><td>Date de valeur</td><td class="r">' + esc(d.date) + '</td></tr></table>' +
    '<p class="note" style="margin-top:10px">Pour attester du paiement du loyer, voir la quittance de loyer correspondante.</p>' +
    '<div style="flex:1"></div></div>';
  return document_('Facture ' + d.numero, [page(entete('FACTURE ACQUITTÉE', d.numero, d.date) + corps + pied(d))]);
}

// ── 2. QUITTANCE ───────────────────────────────────────────
function quittance(d) {
  var per = periodeLibelle(d);
  var corps = '<div class="corps">' +
    boitesParties(d.proprietaire, d.locataire, 'Le bailleur', 'Le locataire') +
    '<div class="h">Logement</div><p>' + bienLigne(d.logement) + '</p>' +
    '<div class="h">Période</div><p><b>' + cl(per, 30) + '</b></p>' +
    '<table><tr><th>Détail</th><th class="r">Montant</th></tr>' +
    '<tr><td>Loyer</td><td class="r">' + gnf(d.montant) + '</td></tr>' +
    '<tr><td><b>Total reçu</b></td><td class="r"><b>' + gnf(d.montant) + '</b></td></tr></table>' +
    '<div class="big"><small>Reçu de ' + nomComplet(d.locataire) + ' la somme de</small><b>' + gnf(d.montant) + '</b>' +
    '<small>' + esc(enLettres(d.montant)) + ' francs guinéens</small></div>' +
    '<p>Payé le <b>' + esc(d.date) + '</b> · mode : <b>' + esc(libelleMode(d.mode_paiement)) + '</b>. La présente quittance atteste du paiement du loyer de la période indiquée et n\'emporte pas renonciation aux sommes éventuellement dues pour d\'autres périodes.</p>' +
    '<div style="flex:1"></div>' +
    '<div class="sign" style="grid-template-columns:1fr"><div class="sig" style="min-height:64px"><small>Pour le bailleur</small>' +
    '<div class="ink">Établie électroniquement par Werdhe pour ' + nomComplet(d.proprietaire) + '</div><div class="meta">' + esc(d.dateHeure) + '</div></div></div></div>';
  return document_('Quittance ' + d.numero, [page(entete('QUITTANCE DE LOYER', d.numero, d.date) + corps + pied(d))]);
}

// ── 3. CONTRAT DE BAIL (une feuille, recto-verso) ──────────
// Les signatures électroniques sont insérées dans les zones prévues au
// téléchargement (SIG_PROPRIETAIRE / SIG_LOCATAIRE) à partir de signatures_bail.
function bail(d) {
  if (d.acte) return bailActe(d);
  var debut = d.periode && d.periode.debut ? dateFR(d.periode.debut) : d.date;
  var duree = d.duree_mois ? d.duree_mois + ' mois' : 'durée indéterminée';
  var rectoCorps = '<div class="corps">' +
    boitesParties(d.proprietaire, d.locataire, 'Le bailleur', 'Le preneur') +
    '<div class="h">Le bien loué</div><p>' + bienLigne(d.logement) + '</p>' +
    '<div class="h">Durée et loyer</div><table>' +
    '<tr><td>Nature de la location</td><td class="r">' + (d.type_location === 'longue_duree' ? 'Longue durée' : 'Courte durée') + '</td></tr>' +
    '<tr><td>Durée</td><td class="r">' + esc(duree) + '</td></tr>' +
    '<tr><td>Date de début prévue</td><td class="r">' + esc(debut) + '</td></tr>' +
    '<tr><td>Loyer mensuel</td><td class="r"><b>' + gnf(d.montant) + '</b></td></tr>' +
    '<tr><td>Paiement</td><td class="r">le 1<sup>er</sup> de chaque mois, via Werdhe ou en espèces</td></tr>' +
    '<tr><td>Dépôt de garantie</td><td class="r">1 mois de loyer, soit ' + gnf(d.montant) + '</td></tr></table>' +
    '<div class="h">Effet du contrat</div>' +
    '<p>Le bail prend effet à la date de signature du présent contrat par les deux parties ; la réservation est conditionnée à cette signature. Les conditions générales figurant au verso font partie intégrante du contrat. Un état des lieux d\'entrée contradictoire sera établi à la remise des clés.</p>' +
    '<div class="h">Mentions particulières (à compléter avant signature)</div><div class="lines"><span></span><span></span><span></span></div>' +
    '<p class="note" style="margin-top:8px">Fait à ' + cl(d.logement.ville, 40) + ', le ' + esc(d.date) + ', en deux exemplaires, un pour chaque partie.</p>' +
    '<div class="sign">' +
    '<div class="sig"><small>Le bailleur · lu et approuvé</small><div class="nom">' + nomComplet(d.proprietaire) + '</div><!--SIG_PROPRIETAIRE--><div class="vide"></div></div>' +
    '<div class="sig"><small>Le preneur · lu et approuvé</small><div class="nom">' + nomComplet(d.locataire) + '</div><!--SIG_LOCATAIRE--><div class="vide"></div></div>' +
    '</div></div>';
  var recto = page(entete('CONTRAT DE BAIL · recto', d.numero, d.date) + rectoCorps + pied(Object.assign({}, d, { pied_note: 'Feuille recto-verso : conditions générales au verso.' })));

  var versoCorps = '<div class="corps art">' +
    '<div class="h">Article 1 · Usage et jouissance</div><p>Le logement est loué à usage d\'habitation. Le bailleur remet le bien en bon état d\'usage et en assure la jouissance paisible pendant toute la durée du bail.</p>' +
    '<div class="h">Article 2 · Loyer, charges et quittances</div><p>Le loyer est payable le 1<sup>er</sup> de chaque mois. Une quittance est délivrée pour chaque loyer payé. Tout retard peut donner lieu à relance puis à mise en demeure par la plateforme Werdhe.</p>' +
    '<div class="h">Article 3 · Dépôt de garantie</div><p>Le dépôt de garantie est versé à la signature. Il est restitué dans un délai de 30 jours après la remise des clés, déduction faite des loyers ou charges impayés et des réparations locatives justifiées par la comparaison des états des lieux d\'entrée et de sortie.</p>' +
    '<div class="h">Article 4 · Obligations du locataire</div><ul><li>Payer le loyer et les charges aux échéances convenues ;</li><li>user paisiblement du logement et l\'entretenir en bon père de famille ;</li><li>signaler sans délai toute panne ou dégradation au bailleur ;</li><li>ne pas sous-louer ni céder le bail sans accord écrit du bailleur ;</li><li>respecter le voisinage et les règles de l\'immeuble.</li></ul>' +
    '<div class="h">Article 5 · Obligations du bailleur</div><ul><li>Délivrer le logement en bon état d\'usage et conforme à sa description ;</li><li>assurer la jouissance paisible du logement ;</li><li>effectuer les réparations urgentes et celles qui ne sont pas locatives ;</li><li>délivrer une quittance de loyer à chaque paiement.</li></ul>' +
    '<div class="h">Article 6 · Préavis et fin du bail</div><p>Chaque partie peut mettre fin au bail en notifiant un préavis, via la plateforme Werdhe ou par écrit, dans les délais prévus par la loi applicable et, à défaut, au moins un mois avant la date de départ. À la fin du bail, un état des lieux de sortie est établi et les clés sont restituées.</p>' +
    '<div class="h">Article 7 · Renouvellement</div><p>Le bail peut être renouvelé d\'un commun accord. Les nouvelles conditions (durée, loyer) font l\'objet d\'une proposition acceptée par écrit des deux parties, avant la fin du bail en cours.</p>' +
    '<div class="h">Article 8 · Preuve et signature électronique</div><p>Les parties reconnaissent la valeur de preuve des signatures électroniques recueillies sur Werdhe (nom saisi, date et heure, adresse IP, empreinte du document). Le présent contrat est soumis au droit guinéen ; à défaut d\'accord amiable, les tribunaux compétents de Guinée sont seuls compétents.</p>' +
    '<div style="flex:1"></div>' +
    '<div class="foot"><div>Contrat ' + esc(d.numero) + ' · verso · conditions générales · werdhe.com</div></div></div>';
  var verso = page(entete('CONTRAT DE BAIL · verso', d.numero, 'Conditions générales') + versoCorps);

  return document_('Contrat de bail ' + d.numero, [recto, verso]);
}

// Bail préparé et signé dans Werdhe (acte « bail ») : conditions particulières choisies
// par le bailleur, identités des parties, signatures des deux côtés.
function blocIdentite(nom, id, contact) {
  id = id || {};
  return '<b>' + nom + '</b><br>' +
    (id.naissance ? 'Né(e) le ' + esc(dateFR(id.naissance + 'T00:00:00Z')) + ' · pièce n° ' + cl(id.cni, 30) + '<br>' : '') +
    (id.adresse ? cl(id.adresse, 70) + '<br>' : '') +
    (id.profession ? cl(id.profession, 40) + ' · ' : '') + cl(contact, 60);
}

function bailActe(d) {
  var x = d.acte.donnees, sg = d.acte.signatures || {}, l = d.logement;
  var idLoc = (sg.locataire && sg.locataire.identite) || null;
  var equip = [];
  if (l.parking) equip.push('parking'); if (l.jardin) equip.push('jardin'); if (l.climatisation) equip.push('climatisation'); if (l.gardien) equip.push('gardien');
  var cb = function (on, lib) { return '<span class="cb' + (on ? ' on' : '') + '"></span> ' + lib; };
  var charges = Number(x.charges) || 0;
  var fin = x.date_fin_prevue ? dateFR(x.date_fin_prevue + 'T00:00:00Z') : '';

  var recto = '<div class="corps">' +
    '<div class="grid2"><div class="box"><small>Le bailleur</small>' + blocIdentite(nomComplet(d.proprietaire), x.identite_proprietaire, (d.proprietaire.telephone || '') + (d.proprietaire.email ? ' · ' + d.proprietaire.email : '')) + '</div>' +
    '<div class="box"><small>Le preneur</small>' + (idLoc ? blocIdentite(nomComplet(d.locataire), idLoc, (d.locataire.telephone || idLoc.telephone || '') + (d.locataire.email ? ' · ' + d.locataire.email : '')) : '<b>' + nomComplet(d.locataire) + '</b><br>' + cl(d.locataire.telephone || '', 24) + (d.locataire.email ? ' · ' + cl(d.locataire.email, 40) : '') + '<br><span class="note">Identité renseignée par le preneur à la signature.</span>') + '</div></div>' +
    '<div class="h">Le bien loué</div><p>' + bienLigne(l) + (l.categorie || l.quartier ? '<br>' + (l.categorie ? cl(l.categorie, 30) : '') + (l.categorie && l.quartier ? ' · ' : '') + (l.quartier ? 'quartier ' + cl(l.quartier, 40) : '') : '') + (equip.length ? '<br>Équipements : ' + equip.join(', ') : '') + '<br>Usage d\'habitation.</p>' +
    '<div class="h">Durée, loyer et charges</div><table>' +
    '<tr><td>Nature de la location</td><td class="r">' + (x.type_location === 'courte_duree' ? 'Courte durée' : 'Longue durée') + '</td></tr>' +
    '<tr><td>Durée</td><td class="r">' + esc(x.duree_mois) + ' mois</td></tr>' +
    '<tr><td>Date de début</td><td class="r">' + esc(dateFR(x.date_debut + 'T00:00:00Z')) + (fin ? ' · fin prévue le ' + esc(fin) : '') + '</td></tr>' +
    '<tr><td>Loyer mensuel</td><td class="r"><b>' + gnf(x.loyer) + '</b></td></tr>' +
    '<tr><td>Charges mensuelles</td><td class="r">' + gnf(charges) + (charges ? ' · total ' + gnf(Number(x.loyer) + charges) : '') + '</td></tr>' +
    '<tr><td>Paiement</td><td class="r">le ' + esc(x.jour_paiement) + ' de chaque mois, via Werdhe ou en espèces</td></tr>' +
    '<tr><td>Dépôt de garantie</td><td class="r">1 mois de loyer, soit ' + gnf(x.depot) + '</td></tr></table>' +
    '<div class="h">Clauses particulières</div>' +
    '<p>' + cb(x.clauses && x.clauses.meuble, 'Logement meublé') + ' &nbsp; ' + cb(x.clauses && x.clauses.animaux, 'Animaux admis') + ' &nbsp; ' + cb(x.clauses && x.clauses.sous_location, 'Sous-location autorisée') + ' &nbsp; ' + cb(x.clauses && x.clauses.assurance, 'Assurance habitation exigée') + '</p>' +
    (x.clause_libre ? '<p><b>Clause libre :</b> ' + cl(x.clause_libre, 200) + '</p>' : '') +
    '<p class="note">Le bail prend effet à la signature des deux parties. Les conditions générales (verso) font partie intégrante du contrat ; en cas de contradiction, les conditions particulières prévalent. Un état des lieux d\'entrée contradictoire sera établi à la remise des clés. Fait à ' + cl(l.ville, 40) + ', le ' + esc(d.date) + '.</p>' +
    '<div class="sign">' + boiteSignature(sg.proprietaire, 'Le bailleur · lu et approuvé') + boiteSignature(sg.locataire, 'Le preneur · lu et approuvé') + '</div></div>';
  var p1 = page(entete('CONTRAT DE BAIL · recto', d.numero, d.date) + recto + pied(Object.assign({}, d, { pied_note: 'Feuille recto-verso : conditions générales au verso.' })));

  var verso = '<div class="corps art">' +
    '<div class="h">Article 1 · Usage et jouissance</div><p>Le logement est loué à usage d\'habitation. Le bailleur remet le bien en bon état d\'usage et en assure la jouissance paisible pendant toute la durée du bail.</p>' +
    '<div class="h">Article 2 · Loyer, charges et quittances</div><p>Le loyer et les charges sont payables le ' + esc(x.jour_paiement) + ' de chaque mois. Une quittance est délivrée pour chaque loyer payé. Tout retard peut donner lieu à relance puis à mise en demeure par la plateforme Werdhe.</p>' +
    '<div class="h">Article 3 · Dépôt de garantie</div><p>Le dépôt de garantie est versé avant la signature. Il est restitué dans un délai de 30 jours après la remise des clés, déduction faite des loyers ou charges impayés et des réparations locatives justifiées par la comparaison des états des lieux d\'entrée et de sortie.</p>' +
    '<div class="h">Article 4 · Obligations du locataire</div><ul><li>Payer le loyer et les charges aux échéances convenues ;</li><li>user paisiblement du logement et l\'entretenir en bon père de famille ;</li><li>signaler sans délai toute panne ou dégradation au bailleur ;</li><li>ne pas sous-louer ni céder le bail, sauf si la clause particulière l\'autorise ;</li><li>respecter le voisinage et les règles de l\'immeuble.</li></ul>' +
    '<div class="h">Article 5 · Obligations du bailleur</div><ul><li>Délivrer le logement en bon état d\'usage et conforme à sa description ;</li><li>assurer la jouissance paisible du logement ;</li><li>effectuer les réparations urgentes et celles qui ne sont pas locatives ;</li><li>délivrer une quittance de loyer à chaque paiement.</li></ul>' +
    '<div class="h">Article 6 · Préavis et fin du bail</div><p>Chaque partie peut mettre fin au bail en notifiant un préavis, via la plateforme Werdhe ou par écrit, dans les délais prévus par la loi applicable et, à défaut, au moins un mois avant la date de départ. À la fin du bail, un état des lieux de sortie est établi et les clés sont restituées.</p>' +
    '<div class="h">Article 7 · Renouvellement et modification</div><p>Le bail peut être renouvelé ou modifié d\'un commun accord, par avenant signé des deux parties avant la fin du bail en cours.</p>' +
    '<div class="h">Article 8 · Preuve et signature électronique</div><p>Les parties reconnaissent la valeur de preuve des signatures électroniques recueillies sur Werdhe (signature dessinée ou nom saisi, date et heure, adresse IP, empreinte du document). Le présent contrat est soumis au droit guinéen ; à défaut d\'accord amiable, les tribunaux compétents de Guinée sont seuls compétents.</p>' +
    '<div style="flex:1"></div><div class="foot"><div>Contrat ' + esc(d.numero) + ' · verso · conditions générales · werdhe.com</div></div></div>';
  var p2 = page(entete('CONTRAT DE BAIL · verso', d.numero, 'Conditions générales') + verso);
  return document_('Contrat de bail ' + d.numero, [p1, p2]);
}

// ── 4. ÉTAT DES LIEUX (grille à remplir, une page) ─────────
function etatDesLieuxVierge(d) {
  var sortie = d.type_etat === 'sortie';
  var l = d.logement, lignes = [];
  function piece(nom, elements) { elements.forEach(function (e) { lignes.push(nom + ' · ' + e); }); }
  piece('Entrée', ['porte et serrure']);
  piece('Séjour', ['sol', 'murs et peinture', 'fenêtres']);
  piece('Cuisine', ['évier et robinet', 'plan de travail']);
  var nbCh = Math.min(Math.max(parseInt(l.nb_chambres, 10) || 1, 1), 4);
  for (var i = 1; i <= nbCh; i++) piece('Chambre ' + (nbCh > 1 ? i : ''), ['sol et murs', 'placard et ouvrants']);
  var nbSdb = Math.min(Math.max(parseInt(l.nb_salles_bain, 10) || 1, 1), 2);
  for (var j = 1; j <= nbSdb; j++) piece('Salle de bain ' + (nbSdb > 1 ? j : ''), ['douche, lavabo']);
  piece('WC', ['chasse d\'eau']);
  piece('Installations', ['électricité (prises, interrupteurs)', 'eau (pression, fuites)']);
  var rows = lignes.slice(0, 24).map(function (n) {
    return '<tr><td>' + esc(n.replace(/\s+·/, ' ·')) + '</td><td class="c"><span class="cb"></span></td><td class="c"><span class="cb"></span></td><td class="c"><span class="cb"></span></td><td class="c"><span class="cb"></span></td><td></td></tr>';
  }).join('');
  var corps = '<div class="corps">' +
    '<div class="grid2" style="margin-bottom:8px"><div class="box"><small>Bien</small>' + bienLigne(l) + '<br>Bailleur : ' + nomComplet(d.proprietaire) + ' · Preneur : ' + nomComplet(d.locataire) + '</div>' +
    '<div class="box"><small>Relevés et remise des clés</small>Eau : ______________ m³<br>Électricité : ______________ kWh<br>Clés remises : ______ · Badge / télécommande : ______</div></div>' +
    '<table><tr><th>Pièce · élément</th><th class="c">Neuf</th><th class="c">Bon</th><th class="c">Usé</th><th class="c">Mauvais</th><th style="width:30%">Observation</th></tr>' + rows + '</table>' +
    '<div class="h">Observations générales et réserves</div><div class="lines"><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
    '<div class="sign"><div class="sig"><small>Le bailleur</small><div class="vide"></div><div class="meta">' + nomComplet(d.proprietaire) + '</div></div>' +
    '<div class="sig"><small>Le preneur</small><div class="vide"></div><div class="meta">' + nomComplet(d.locataire) + '</div></div></div></div>';
  return document_('État des lieux ' + d.numero, [page(entete('ÉTAT DES LIEUX D\'' + (sortie ? 'SORTIE' : 'ENTRÉE'), d.numero, d.date) + corps + pied(d))]);
}

// État des lieux rempli et signé (généré depuis le parcours interactif).
function etatDesLieuxRempli(d) {
  var sortie = d.type_etat === 'sortie';
  var edl = d.edl, l = d.logement, rel = edl.releves || {};
  var grille = edl.grille || [];
  var compare = grille.some(function (it) { return it.entree; });
  var degr = edl.degradations || [];
  var LIB = { neuf: 'Neuf', bon: 'Bon', use: 'Usé', mauvais: 'Mauvais' };

  var rows = grille.slice(0, 20).map(function (it) {
    var deg = degr.indexOf(it.id) !== -1;
    return '<tr' + (deg ? ' class="deg"' : '') + '><td>' + cl(it.piece + ' · ' + it.element, 40) + '</td>' +
      ['neuf', 'bon', 'use', 'mauvais'].map(function (k) { return '<td class="c"><span class="cb' + (it.etat === k ? ' on' : '') + '"></span></td>'; }).join('') +
      (compare ? '<td class="c note">' + (it.entree ? esc(LIB[it.entree] || '') : '—') + '</td>' : '') +
      '<td>' + cl(it.obs || '', 40) + (deg ? '<span class="pill a" style="margin-left:4px">▼</span>' : '') + '</td></tr>';
  }).join('');

  var sig = function (role, libelle) {
    var s = (edl.signatures || {})[role];
    if (!s) return '<div class="sig"><small>' + libelle + '</small><div class="vide"></div></div>';
    var quand = new Date(s.signe_at).toLocaleString('fr-FR', { timeZone: 'Africa/Conakry', dateStyle: 'short', timeStyle: 'short' });
    return '<div class="sig"><small>' + libelle + ' · lu et approuvé</small>' +
      (s.mode === 'dessin' && s.image ? '<img class="sigimg" alt="" src="' + esc(s.image) + '"><div class="nom">' + cl(s.nom_complet, 40) + '</div>' : '<div class="ink">' + cl(s.nom_complet, 40) + '</div>') +
      '<div class="meta">' + esc(quand) + ' · IP ' + cl(s.ip || '—', 40) + '<br>empreinte ' + esc(String(s.hash || '').slice(0, 14)) + '…</div></div>';
  };
  var libReserves = edl.reserves ? 'Réserves ' + (edl.reserves_role === 'proprietaire' ? 'du bailleur' : (edl.reserves_role === 'locataire' ? 'du preneur' : '')) : '';
  var corps = '<div class="corps">' +
    '<div class="grid2" style="margin-bottom:6px"><div class="box"><small>Bien</small>' + bienLigne(l) + '<br>Bailleur : ' + cl((d.proprietaire.prenom || '') + ' ' + (d.proprietaire.nom || ''), 30) + '<br>Preneur : ' + cl((d.locataire.prenom || '') + ' ' + (d.locataire.nom || ''), 30) + '</div>' +
    '<div class="box"><small>Relevés et remise des clés</small>Eau : <b>' + cl(rel.eau || '—', 16) + '</b> m³ · Électricité : <b>' + cl(rel.electricite || '—', 16) + '</b> kWh<br>Clés remises : <b>' + (rel.cles == null ? '—' : esc(rel.cles)) + '</b> · Badge / télécommande : <b>' + (rel.badge == null ? '—' : esc(rel.badge)) + '</b>' +
    (edl.nb_photos ? '<br>' + esc(edl.nb_photos) + ' photo' + (edl.nb_photos > 1 ? 's' : '') + ' jointe' + (edl.nb_photos > 1 ? 's' : '') + ' (dans Werdhe)' : '') + '</div></div>' +
    '<table class="grille" style="table-layout:fixed"><colgroup><col style="width:' + (compare ? '28' : '30') + '%"><col style="width:6%"><col style="width:6%"><col style="width:6%"><col style="width:8%">' + (compare ? '<col style="width:9%">' : '') + '<col></colgroup><tr><th>Pièce · élément</th><th class="c">Neuf</th><th class="c">Bon</th><th class="c">Usé</th><th class="c">Mauvais</th>' + (compare ? '<th class="c">Entrée</th>' : '') + '<th>Observation</th></tr>' + rows + '</table>' +
    (sortie && compare ? '<p class="note" style="margin-top:4px">' + (degr.length ? '<b>' + degr.length + ' élément' + (degr.length > 1 ? 's' : '') + ' dégradé' + (degr.length > 1 ? 's' : '') + '</b> par rapport à l\'état des lieux d\'entrée (surlignés, ▼).' : 'Aucune dégradation par rapport à l\'état des lieux d\'entrée.') + '</p>' : '') +
    '<div class="h" style="margin-top:7px">Observations générales</div><p style="margin-bottom:3px">' + (edl.observations_generales ? cl(edl.observations_generales, 160) : '<span class="note">Aucune observation.</span>') + '</p>' +
    '<div class="h" style="margin-top:5px">Réserves</div><p style="margin-bottom:3px">' + (edl.reserves ? '<b>' + libReserves + ' :</b> ' + cl(edl.reserves, 160) : '<span class="note">Aucune réserve.</span>') + '</p>' +
    '<div class="sign">' + sig('proprietaire', 'Le bailleur') + sig('locataire', 'Le preneur') + '</div></div>';
  return document_('État des lieux ' + d.numero, [page(entete('ÉTAT DES LIEUX D\'' + (sortie ? 'SORTIE' : 'ENTRÉE'), d.numero, d.date) + corps + pied(d))]);
}

function etatDesLieux(d) {
  return d.edl ? etatDesLieuxRempli(d) : etatDesLieuxVierge(d);
}

// ── 5. MISE EN DEMEURE ─────────────────────────────────────
function miseEnDemeure(d) {
  var limite = dateLongue(ajouterJours(d.dateGeneration, 7));
  var corps = '<div class="corps">' +
    '<div style="text-align:right;margin-bottom:8px;font-size:12px"><b>' + nomComplet(d.proprietaire) + '</b><br>' + cl(d.proprietaire.telephone || '', 24) + ' · ' + cl(d.proprietaire.email || '', 40) + '<br>' + cl(d.logement.ville, 40) + ', le ' + esc(d.date) + '</div>' +
    '<div class="box" style="max-width:360px;margin-bottom:10px"><small>Destinataire</small><b>' + nomComplet(d.locataire) + '</b><br>Locataire de : ' + cl(d.logement.titre, 60) + ', ' + cl(d.logement.adresse, 70) + ', ' + cl(d.logement.ville, 40) + '</div>' +
    '<p><b>Objet : loyer impayé · mise en demeure de payer</b></p>' +
    '<p>Madame, Monsieur ' + cl(d.locataire.nom, 40) + ',</p>' +
    '<p>Malgré mes relances précédentes, la somme ci-dessous, correspondant à un loyer du logement que vous occupez, reste impayée à ce jour' + (d.mois_retard ? ' (' + esc(d.mois_retard) + ' mois de retard)' : '') + '.</p>' +
    '<table><tr><th>Désignation</th><th class="r">Montant dû</th></tr><tr><td>Loyer impayé · ' + cl(d.logement.titre, 60) + '</td><td class="r"><b>' + gnf(d.montant) + '</b></td></tr></table>' +
    '<div class="big rouge"><small>Vous êtes mis(e) en demeure de régler la somme de</small><b>' + gnf(d.montant) + '</b><small>au plus tard le <b style="display:inline;font-size:inherit;color:inherit">' + esc(limite) + '</b> (7 jours à compter de la réception de ce courrier)</small></div>' +
    '<p>À défaut de règlement dans ce délai, je me réserve la possibilité d\'engager les démarches prévues au contrat de bail et par la législation applicable.</p>' +
    '<p>Le paiement peut être effectué en ligne à tout moment depuis votre espace Werdhe. Si vous rencontrez une difficulté, je vous invite à me contacter afin d\'examiner un échéancier.</p>' +
    '<p>Dans l\'attente de votre règlement, je vous prie d\'agréer, Madame, Monsieur, mes salutations distinguées.</p>' +
    '<div class="sign"><div class="sig"><small>Le bailleur</small><div class="ink">' + nomComplet(d.proprietaire) + '</div><div class="meta">Établi électroniquement le ' + esc(d.dateHeure) + '</div></div>' +
    '<div class="sig"><small>Remise au destinataire</small><div class="meta" style="margin-top:6px">Envoyée par e-mail et alerte Werdhe.<br>La date de lecture est enregistrée dans le journal du document.</div></div></div></div>';
  return document_('Mise en demeure ' + d.numero, [page(entete('MISE EN DEMEURE', d.numero, d.date) + corps + pied(d))]);
}

// ── 6. PRÉAVIS (donné par le locataire ou par le bailleur) ──
// Le cadre « Accusé de réception » est complété au téléchargement avec la date
// d'accusé enregistrée (jeton ACCUSE) : le document stocké ne change pas.
function preavis(d) {
  var parBailleur = d.auteur === 'proprietaire';
  var auteur = parBailleur ? d.proprietaire : d.locataire;
  var dest = parBailleur ? d.locataire : d.proprietaire;
  var dep = d.date_depart ? new Date(d.date_depart) : null;
  var valide = dep && !isNaN(dep.getTime());
  var depLabel = valide ? dateLongue(dep) : 'à convenir';
  var jours = valide ? Math.round((dep - d.dateGeneration) / 86400000) : null;
  var min = d.delai_minimum_jours;
  var adresse = cl(d.logement.titre, 60) + ', ' + cl(d.logement.adresse, 70) + ', ' + cl(d.logement.ville, 40);
  var motif = d.motif ? '<p><b>Motif :</b> ' + cl(d.motif, 120) + '</p>' : '';
  var note = d.note ? '<p>' + cl(d.note, 300) + '</p>' : '';

  var introLoc = '<p>Par la présente, je vous informe de ma décision de quitter le logement situé ' + cl(d.logement.adresse, 70) + ', ' + cl(d.logement.ville, 40) + ', que j\'occupe en qualité de locataire. Je libérerai les lieux à la date indiquée ci-dessous.</p>';
  var introBail = '<p>Par la présente, je vous informe de ma décision de mettre fin au bail du logement situé ' + cl(d.logement.adresse, 70) + ', ' + cl(d.logement.ville, 40) + ', que vous occupez en qualité de locataire. Vous êtes invité(e) à libérer les lieux à la date indiquée ci-dessous.</p>';
  var suiteLoc = '<p>Je restituerai les clés et laisserai le logement propre et en bon état d\'entretien à cette date. Je demande la réalisation d\'un état des lieux de sortie contradictoire avec vous ou votre représentant, et la restitution du dépôt de garantie dans le délai prévu au contrat de bail, soit 30 jours après la remise des clés.</p>';
  var suiteBail = '<p>Un état des lieux de sortie contradictoire sera réalisé à cette date et les clés devront être remises. Le dépôt de garantie vous sera restitué dans le délai prévu au contrat de bail, soit 30 jours après la remise des clés, déduction faite des sommes justifiées.</p>';

  var corps = '<div class="corps">' +
    '<div style="text-align:right;margin-bottom:8px;font-size:12px"><b>' + nomComplet(auteur) + '</b><br>' + (parBailleur ? 'Bailleur' : adresse) + '<br>' + cl(auteur.telephone || '', 24) + ' · ' + cl(auteur.email || '', 40) + '<br>' + cl(d.logement.ville, 40) + ', le ' + esc(d.date) + '</div>' +
    '<div class="box" style="max-width:360px;margin-bottom:10px"><small>Destinataire</small><b>' + nomComplet(dest) + '</b><br>' + (parBailleur ? 'Locataire de : ' + adresse : 'Bailleur du logement') + '</div>' +
    '<p><b>Objet : ' + (parBailleur ? 'congé donné par le bailleur' : 'congé du logement') + (valide ? ', départ le ' + esc(depLabel) : '') + '</b></p>' +
    '<p>Madame, Monsieur ' + cl(dest.nom, 40) + ',</p>' +
    (parBailleur ? introBail : introLoc) +
    '<div class="big"><small>Date de départ (date limite du préavis)</small><b>' + esc(depLabel) + '</b>' +
    (jours !== null && jours >= 0 ? '<small>' + jours + ' jour' + (jours > 1 ? 's' : '') + ' après l\'envoi de ce préavis' + (min ? ' · délai minimal : ' + min + ' jours' : '') + '</small>' : '') + '</div>' +
    motif + note +
    (parBailleur ? suiteBail : suiteLoc) +
    '<p>Je vous remercie de bien vouloir accuser réception de ce courrier.</p>' +
    '<p>Veuillez agréer, Madame, Monsieur, mes salutations distinguées.</p>' +
    '<div class="sign"><div class="sig"><small>L\'auteur du préavis</small><div class="ink">' + nomComplet(auteur) + '</div><div class="meta">Établi et signé électroniquement le ' + esc(d.dateHeure) + '</div></div>' +
    '<div class="sig"><small>Accusé de réception · ' + nomComplet(dest) + '</small><!--ACCUSE--><div class="meta" style="margin-top:6px">En attente d\'accusé de réception.<br>Notifié par e-mail et alerte Werdhe ; la date de réception est enregistrée dans le journal du document.</div></div></div></div>';
  return document_('Préavis ' + d.numero, [page(entete(parBailleur ? 'CONGÉ DONNÉ PAR LE BAILLEUR' : 'LETTRE DE PRÉAVIS', d.numero, d.date) + corps + pied(d))]);
}

function injecterAccuseReception(html, accuse) {
  if (!accuse || !accuse.accuse_at) return String(html);
  var quand = new Date(accuse.accuse_at).toLocaleString('fr-FR', { timeZone: 'Africa/Conakry', dateStyle: 'long', timeStyle: 'short' });
  var bloc = '<div class="ink">Reçu</div><div class="meta">Accusé de réception le ' + esc(quand) + (accuse.nom ? '<br>par ' + cl(accuse.nom, 48) : '') + '</div>';
  return String(html).replace(/<!--ACCUSE--><div class="meta"[^>]*>[\s\S]*?<\/div>/, bloc);
}

// ── 7. RAPPORT FINANCIER ───────────────────────────────────
function rapportFinancier(d) {
  var per = d.mois ? MOIS[d.mois - 1] + ' ' + d.annee : 'Année ' + d.annee;
  var liste = Array.isArray(d.paiements) ? d.paiements : [];
  var MAX = 14, montrees = liste.slice(0, MAX), reste = liste.length - montrees.length;
  var nbRetard = liste.filter(function (p) { return p.statut !== 'paye'; }).length;
  var kpi = function (t, v) { return '<div class="box"><small>' + t + '</small><b style="font-size:17px;color:#1B6B3A">' + v + '</b></div>'; };
  var corps = '<div class="corps">' +
    '<div class="box" style="margin-bottom:10px"><small>Propriétaire</small><b>' + nomComplet(d.proprietaire) + '</b> · période : <b>' + cl(per, 30) + '</b>' + (d.logement && d.logement.titre ? ' · bien : ' + cl(d.logement.titre, 60) : '') + '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">' +
    kpi('Total encaissé', gnf(d.montant)) + kpi('Paiements', liste.length) + kpi('En retard', nbRetard) + '</div>' +
    (montrees.length ? '<div class="h">Détail des paiements</div><table><tr><th>Locataire</th><th>Bien</th><th class="r">Montant</th><th>Date</th><th>Statut</th></tr>' +
      montrees.map(function (p) {
        return '<tr><td>' + cl(p.locataire || '—', 32) + '</td><td>' + cl(p.bien || '—', 36) + '</td><td class="r">' + gnf(p.montant) + '</td><td>' + cl(p.date || '—', 14) + '</td><td><span class="pill' + (p.statut === 'paye' ? '' : ' r') + '">' + (p.statut === 'paye' ? 'Payé' : 'En retard') + '</span></td></tr>';
      }).join('') + '</table>' + (reste > 0 ? '<p class="note" style="margin-top:6px">… et ' + reste + ' autre' + (reste > 1 ? 's' : '') + ' paiement' + (reste > 1 ? 's' : '') + ' non détaillé' + (reste > 1 ? 's' : '') + ' ici (total ci-dessus complet).</p>' : '')
      : '<p class="note">Aucun paiement enregistré sur la période.</p>') +
    '<div style="flex:1"></div><p class="note">Instantané figé à la date de génération : il reflète les paiements enregistrés sur Werdhe pour la période.</p></div>';
  return document_('Rapport financier ' + d.numero, [page(entete('RAPPORT FINANCIER', d.numero, d.date) + corps + pied(d))]);
}

// ── 8. ATTESTATION DE DÉPÔT DE GARANTIE (type « caution ») ─
function caution(d) {
  var corps = '<div class="corps">' +
    boitesParties(d.proprietaire, d.locataire, 'Le bailleur (reçoit le dépôt)', 'Le locataire (verse le dépôt)') +
    '<div class="h">Objet</div><p>La présente attestation constate le versement d\'un dépôt de garantie par <b>' + nomComplet(d.locataire) + '</b> à <b>' + nomComplet(d.proprietaire) + '</b> pour le logement : ' + bienLigne(d.logement) + '</p>' +
    '<div class="big"><small>Dépôt de garantie versé</small><b>' + gnf(d.montant) + '</b><small>' + esc(enLettres(d.montant)) + ' francs guinéens · équivalent à 1 mois de loyer</small></div>' +
    '<div class="h">Conditions de restitution</div><p>Le dépôt de garantie est restitué dans un délai de <b>30 jours</b> après la remise des clés, déduction faite des sommes justifiées par l\'état des lieux de sortie :</p>' +
    '<ul style="margin:0 0 6px 16px"><li>loyers ou charges impayés ;</li><li>dégradations au-delà de l\'usure normale ;</li><li>nettoyage nécessaire du logement ;</li><li>clés non restituées.</li></ul>' +
    '<p class="note">Cette attestation ne constitue pas un acte de cautionnement par un tiers garant.</p>' +
    '<div class="sign"><div class="sig"><small>Le bailleur · reçoit le dépôt</small><div class="nom">' + nomComplet(d.proprietaire) + '</div><div class="vide"></div></div>' +
    '<div class="sig"><small>Le locataire · verse le dépôt</small><div class="nom">' + nomComplet(d.locataire) + '</div><div class="vide"></div></div></div></div>';
  return document_('Attestation de dépôt de garantie ' + d.numero, [page(entete('ATTESTATION DE DÉPÔT DE GARANTIE', d.numero, d.date) + corps + pied(d))]);
}

// ── Signature électronique du bail (insérée au téléchargement) ─
function blocSignature(s) {
  var quand = new Date(s.signe_at).toLocaleString('fr-FR', { timeZone: 'Africa/Conakry', dateStyle: 'short', timeStyle: 'short' });
  return '<div class="ink">' + cl(s.nom_complet, 40) + '</div><div class="meta">' + esc(quand) + ' · IP ' + cl(s.ip_adresse || '—', 40) +
    (s.hash_signature ? '<br>empreinte ' + esc(String(s.hash_signature).slice(0, 14)) + '…' : '') + '</div>';
}

function injecterSignaturesBail(html, signatures) {
  var out = String(html);
  (signatures || []).forEach(function (s) {
    var jeton = s.role === 'proprietaire' ? '<!--SIG_PROPRIETAIRE-->' : '<!--SIG_LOCATAIRE-->';
    // La signature saisie remplace la mention imprimée du nom dans le cadre.
    var cadre = new RegExp('<div class="nom">[^<]*</div>' + jeton.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    out = out.replace(cadre, blocSignature(s));
  });
  return out;
}

// ── Boîte de signature d'un acte (dessinée ou nom tapé) ─────
function boiteSignature(sig, libelle) {
  if (!sig) return '<div class="sig"><small>' + libelle + '</small><div class="vide"></div></div>';
  var quand = new Date(sig.signe_at).toLocaleString('fr-FR', { timeZone: 'Africa/Conakry', dateStyle: 'short', timeStyle: 'short' });
  return '<div class="sig"><small>' + libelle + '</small>' +
    (sig.mode === 'dessin' && sig.image ? '<img class="sigimg" alt="" src="' + esc(sig.image) + '"><div class="nom">' + cl(sig.nom_complet, 36) + '</div>' : '<div class="ink">' + cl(sig.nom_complet, 36) + '</div>') +
    '<div class="meta">' + esc(quand) + ' · IP ' + cl(sig.ip || '—', 40) + '<br>empreinte ' + esc(String(sig.hash || '').slice(0, 14)) + '…</div></div>';
}

// ── 9. AVENANT DE RENOUVELLEMENT ────────────────────────────
function avenant(d) {
  var a = d.acte, x = a.donnees, sg = a.signatures || {};
  var lib = function (par) { return par === 'proprietaire' ? 'du bailleur' : 'du preneur'; };
  var loyerAvant = x.loyer_avant == null ? '—' : gnf(x.loyer_avant);
  var loyerLigne = x.loyer_avant != null && Number(x.loyer_avant) === Number(x.loyer_apres) ? 'inchangé (' + gnf(x.loyer_apres) + ')' : '<b>' + gnf(x.loyer_apres) + '</b>';
  var histo = (x.historique || []).map(function (h) {
    return '<tr><td>' + esc(dateFR(h.at)) + '</td><td>Proposition ' + lib(h.par) + ' : ' + esc(h.duree) + ' mois' + (h.prix != null ? ' à ' + gnf(h.prix) : '') + '</td><td class="r">' +
      (h.issue === 'accepte' ? '<span class="pill">acceptée</span>' : (h.issue === 'contre_propose' ? 'contre-proposée' : esc(h.issue))) + '</td></tr>';
  }).join('');
  var corps = '<div class="corps">' +
    boitesParties(d.proprietaire, d.locataire, 'Le bailleur', 'Le preneur') +
    '<p>Les parties conviennent de modifier le bail du logement <b>' + cl(d.logement.titre, 70) + '</b> (' + cl(d.logement.adresse, 70) + ', ' + cl(d.logement.ville, 40) + ') comme suit. <b>Toutes les autres clauses du bail restent inchangées.</b></p>' +
    '<table><tr><th>Point modifié</th><th>Avant</th><th>Après</th></tr>' +
    '<tr><td>Durée</td><td>—</td><td><b>prolongation de ' + esc(x.duree_ajoutee_mois) + ' mois</b></td></tr>' +
    '<tr><td>Fin du bail</td><td>' + (x.date_fin_avant ? esc(dateFR(x.date_fin_avant)) : '—') + '</td><td><b>' + (x.date_fin_apres ? esc(dateFR(x.date_fin_apres)) : '—') + '</b></td></tr>' +
    '<tr><td>Loyer mensuel</td><td>' + loyerAvant + '</td><td>' + loyerLigne + '</td></tr></table>' +
    '<p style="margin-top:8px">Date d\'effet de l\'avenant : <b>' + esc(dateLongue(x.date_effet + 'T00:00:00Z')) + '</b>.</p>' +
    (x.clause_libre ? '<div class="h">Clause particulière</div><p>' + cl(x.clause_libre, 200) + '</p>' : '') +
    (histo ? '<div class="h">Historique de la négociation (sur Werdhe)</div><table>' + histo + '</table>' : '') +
    '<div class="sign">' + boiteSignature(sg.proprietaire, 'Le bailleur · lu et approuvé') + boiteSignature(sg.locataire, 'Le preneur · lu et approuvé') + '</div></div>';
  return document_('Avenant ' + d.numero, [page(entete('AVENANT AU BAIL', d.numero, d.date) + corps + pied(d))]);
}

// ── 10. DÉCOMPTE DE RESTITUTION DE CAUTION ──────────────────
function decompte(d) {
  var a = d.acte, x = a.donnees, sg = a.signatures || {};
  var LIB = { neuf: 'Neuf', bon: 'Bon', use: 'Usé', mauvais: 'Mauvais' };
  var constats = {}; (x.constats || []).forEach(function (c) { constats[c.item_id] = c; });
  var lignes = (x.retenues || []).map(function (r) {
    var c = r.item_id ? constats[r.item_id] : null;
    return '<tr><td>' + cl(r.libelle, 40) + '</td><td>' + (c ? esc(LIB[c.entree] || '') + ' → ' + esc(LIB[c.sortie] || '') : '—') + '</td><td>' + cl(r.commentaire || '', 60) + '</td><td class="r">' + gnf(r.montant) + '</td></tr>';
  }).join('');
  var corps = '<div class="corps">' +
    boitesParties(d.proprietaire, d.locataire, 'Le bailleur', 'L\'ancien locataire') +
    '<p>Logement : ' + cl(d.logement.titre, 70) + ', ' + cl(d.logement.adresse, 60) + ', ' + cl(d.logement.ville, 40) + '.</p>' +
    '<div class="h">Dépôt de garantie versé</div><table><tr><td>Dépôt de garantie (1 mois de loyer)</td><td class="r"><b>' + gnf(x.depot) + '</b></td></tr></table>' +
    '<div class="h">Retenues justifiées par l\'état des lieux de sortie (comparé à l\'entrée)</div>' +
    (lignes ? '<table><tr><th>Élément</th><th>Entrée → sortie</th><th>Commentaire</th><th class="r">Retenue</th></tr>' + lignes +
      '<tr><td colspan="3"><b>Total des retenues</b></td><td class="r"><b>' + gnf(x.total_retenues) + '</b></td></tr></table>'
      : '<p class="note">Aucune retenue : aucun élément dégradé ni somme due.</p>') +
    '<div class="big"><small>Somme à restituer au locataire</small><b>' + gnf(x.a_restituer) + '</b><small>= ' + gnf(x.depot) + ' − ' + gnf(x.total_retenues) + ' · à virer sous ' + esc(x.delai_jours) + ' jours après la remise des clés</small></div>' +
    (x.note ? '<p>' + cl(x.note, 120) + '</p>' : '') +
    '<p class="note">Les photos et constats d\'entrée et de sortie sont consultables dans Werdhe, avec les états des lieux signés.</p>' +
    '<div class="sign">' + boiteSignature(sg.proprietaire, 'Le bailleur · établit le décompte') + boiteSignature(sg.locataire, 'Le locataire · accepte le décompte') + '</div></div>';
  return document_('Décompte de restitution ' + d.numero, [page(entete('DÉCOMPTE DE RESTITUTION', d.numero, d.date) + corps + pied(d))]);
}

// ── 11. ACTE DE CAUTIONNEMENT (garant) ──────────────────────
function cautionnement(d) {
  var a = d.acte, x = a.donnees, sg = a.signatures || {};
  var g = sg.garant, id = (g && g.identite) || {};
  var prevu = x.garant || {};
  var identite = '<b>' + cl(id.nom || prevu.nom || '—', 50) + '</b><br>' +
    (id.naissance ? 'Né(e) le ' + esc(dateFR(id.naissance + 'T00:00:00Z')) + ' · pièce n° ' + cl(id.cni, 30) + '<br>' + cl(id.adresse, 70) + '<br>' + cl(id.profession, 40) + ' · ' + cl(id.telephone, 24) : '') +
    (x.lien ? '<br>Lien avec le preneur : ' + cl(x.lien, 30) : '');
  var corps = '<div class="corps">' +
    '<div class="grid2"><div class="box"><small>La caution (garant)</small>' + identite + '</div>' +
    '<div class="box"><small>Le preneur garanti et le bail</small><b>' + nomComplet(d.locataire) + '</b><br>Bailleur : ' + nomComplet(d.proprietaire) + '<br>' + cl(d.logement.titre, 60) + ', ' + cl(d.logement.adresse, 50) + ', ' + cl(d.logement.ville, 30) + '</div></div>' +
    '<div class="h">Engagement</div><table>' +
    '<tr><td>Nature</td><td class="r">Caution <b>' + (x.nature === 'simple' ? 'simple' : 'solidaire') + '</b></td></tr>' +
    '<tr><td>Montant maximal garanti</td><td class="r"><b>' + gnf(x.montant_max) + '</b></td></tr>' +
    '<tr><td>En toutes lettres</td><td class="r">' + esc(enLettres(x.montant_max)) + ' francs guinéens</td></tr>' +
    '<tr><td>Durée de l\'engagement</td><td class="r">' + esc(x.duree_mois) + ' mois</td></tr>' +
    '<tr><td>Sommes couvertes</td><td class="r">loyers, charges, réparations locatives</td></tr></table>' +
    '<p style="margin-top:10px">Je soussigné(e) <b>' + cl(id.nom || prevu.nom || '—', 50) + '</b> me porte caution' + (x.nature === 'simple' ? '' : ' solidaire') + ' des obligations de <b>' + nomComplet(d.locataire) + '</b> envers <b>' + nomComplet(d.proprietaire) + '</b>, dans la limite du montant et de la durée ci-dessus. J\'ai pris connaissance du bail et de ses conditions.</p>' +
    '<div class="box" style="margin-top:6px"><small>Mention recopiée par la caution</small><span style="font-family:Georgia,serif;font-style:italic;font-size:12.5px">' + cl((g && g.mention) || '—', 300) + '</span></div>' +
    '<div class="sign trois">' + boiteSignature(g, 'La caution') + boiteSignature(sg.locataire, 'Le preneur') + boiteSignature(sg.proprietaire, 'Le bailleur') + '</div></div>';
  return document_('Acte de cautionnement ' + d.numero, [page(entete('ACTE DE CAUTIONNEMENT', d.numero, d.date) + corps + pied(d))]);
}

var MODELES = {
  facture: facture, quittance: quittance, contrat_bail: bail, etat_lieux: etatDesLieux,
  mise_en_demeure: miseEnDemeure, preavis: preavis, rapport_financier: rapportFinancier, caution: caution,
  avenant: avenant, decompte: decompte, cautionnement: cautionnement
};

module.exports = {
  MODELES, EMPREINTE_JETON, URL_VERIF, MOIS,
  esc, cl, gnf, enLettres, dateFR, dateLongue, dateHeureFR, injecterSignaturesBail, injecterAccuseReception
};
