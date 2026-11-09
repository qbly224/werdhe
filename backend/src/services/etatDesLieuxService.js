const crypto = require('crypto');

// ================================================
// ÉTAT DES LIEUX : logique métier (sans accès base)
//
// La grille tient sur une page A4 : les bornes ci-dessous sont les mêmes que
// celles testées pour le modèle de document (documentTemplates.etatDesLieux).
// ================================================

const ETATS = ['neuf', 'bon', 'use', 'mauvais'];
const RANG = { neuf: 0, bon: 1, use: 2, mauvais: 3 };
const LIBELLES_ETAT = { neuf: 'Neuf', bon: 'Bon', use: 'Usé', mauvais: 'Mauvais' };

const LIMITES = {
  elements: 20,           // lignes de la grille
  obsElement: 40,         // observation d'une ligne
  piece: 18,              // pièce d'une ligne ajoutée à la main
  element: 22,            // élément d'une ligne ajoutée à la main (pièce + élément tiennent sur une ligne du document)
  obsGenerales: 160,
  reserves: 160,
  releve: 16,             // relevé d'eau / d'électricité
  cles: 20,
  photos: 12,
  signatureImage: 150000  // caractères (data URL PNG)
};

function slug(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function propre(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Grille par défaut d'un bien (selon son nombre de chambres et de salles de bain).
function genererGrille(logement) {
  var items = [];
  function piece(nom, elements) {
    elements.forEach(function (e) {
      items.push({ id: slug(nom) + '-' + slug(e), piece: nom, element: e, etat: null, obs: '', perso: false });
    });
  }
  piece('Entrée', ['porte et serrure']);
  piece('Séjour', ['sol', 'murs et peinture', 'fenêtres']);
  piece('Cuisine', ['évier et robinet', 'plan de travail']);
  var nbCh = Math.min(Math.max(parseInt(logement && logement.nb_chambres, 10) || 1, 1), 4);
  for (var i = 1; i <= nbCh; i++) piece(nbCh > 1 ? 'Chambre ' + i : 'Chambre', ['sol et murs', 'placard et ouvrants']);
  var nbSdb = Math.min(Math.max(parseInt(logement && logement.nb_salles_bain, 10) || 1, 1), 2);
  for (var j = 1; j <= nbSdb; j++) piece(nbSdb > 1 ? 'Salle de bain ' + j : 'Salle de bain', ['douche, lavabo']);
  piece('WC', ['chasse d\'eau']);
  piece('Installations', ['électricité', 'eau et plomberie']);
  return items.slice(0, LIMITES.elements);
}

// État des lieux de sortie : mêmes lignes que l'entrée, états à renseigner,
// l'état d'entrée est conservé pour la comparaison.
function grilleDepuisEntree(grilleEntree) {
  return (grilleEntree || []).map(function (it) {
    return { id: it.id, piece: it.piece, element: it.element, etat: null, obs: '', perso: !!it.perso, entree: it.etat || null };
  });
}

// Fusionne la grille envoyée par le client dans la grille actuelle :
// - seules les lignes existantes (par id) voient leur état et leur observation changer ;
// - les lignes ajoutées à la main (id « perso-… ») peuvent être créées ou retirées ;
// - les lignes d'origine ne peuvent pas être supprimées.
function fusionnerGrille(actuelle, envoyee) {
  if (!Array.isArray(envoyee)) throw new Error('Grille invalide');
  var parId = {};
  envoyee.forEach(function (it) { if (it && typeof it.id === 'string') parId[it.id] = it; });

  var resultat = [];
  actuelle.forEach(function (it) {
    var recu = parId[it.id];
    if (it.perso && !recu) return; // ligne ajoutée puis retirée
    var etat = recu && recu.etat != null && recu.etat !== '' ? String(recu.etat) : (recu ? null : it.etat);
    if (etat !== null && ETATS.indexOf(etat) === -1) throw new Error('État invalide pour « ' + it.element + ' »');
    resultat.push(Object.assign({}, it, {
      etat: recu ? etat : it.etat,
      obs: recu ? propre(recu.obs, LIMITES.obsElement) : it.obs
    }));
  });

  envoyee.forEach(function (it) {
    if (!it || typeof it.id !== 'string' || !/^perso-[a-z0-9]{4,12}$/.test(it.id)) return;
    if (resultat.some(function (r) { return r.id === it.id; })) return;
    var piece = propre(it.piece, LIMITES.piece), element = propre(it.element, LIMITES.element);
    if (!piece || !element) throw new Error('Pièce et élément obligatoires pour une ligne ajoutée');
    var etat = it.etat != null && it.etat !== '' ? String(it.etat) : null;
    if (etat !== null && ETATS.indexOf(etat) === -1) throw new Error('État invalide pour « ' + element + ' »');
    resultat.push({ id: it.id, piece: piece, element: element, etat: etat, obs: propre(it.obs, LIMITES.obsElement), perso: true, entree: null });
  });

  if (resultat.length > LIMITES.elements) throw new Error('Trop de lignes (' + LIMITES.elements + ' maximum pour tenir sur une page)');
  return resultat;
}

function normaliserReleves(r) {
  r = r || {};
  var entier = function (v) {
    if (v === '' || v == null) return null;
    var n = parseInt(v, 10);
    if (!(n >= 0 && n <= LIMITES.cles)) throw new Error('Nombre invalide (0 à ' + LIMITES.cles + ')');
    return n;
  };
  return {
    eau: propre(r.eau, LIMITES.releve),
    electricite: propre(r.electricite, LIMITES.releve),
    cles: entier(r.cles),
    badge: entier(r.badge)
  };
}

function grilleComplete(grille) {
  return Array.isArray(grille) && grille.length > 0 && grille.every(function (it) { return ETATS.indexOf(it.etat) !== -1; });
}

// Lignes dont l'état s'est dégradé entre l'entrée et la sortie.
function degradations(grille) {
  return (grille || []).filter(function (it) {
    return it.entree && ETATS.indexOf(it.entree) !== -1 && ETATS.indexOf(it.etat) !== -1 && RANG[it.etat] > RANG[it.entree];
  });
}

// Empreinte du contenu au moment de la signature : toute modification
// ultérieure change l'empreinte, donc invalide la signature.
function empreinteContenu(edl, role, reserves) {
  var canon = JSON.stringify({
    type: edl.type, version: edl.version, role: role,
    grille: (edl.grille || []).map(function (it) { return [it.id, it.piece, it.element, it.etat, it.obs, it.entree || null]; }),
    releves: edl.releves || {},
    observations_generales: edl.observations_generales || '',
    reserves: reserves != null ? reserves : (edl.reserves || ''),
    photos: (edl.photos || []).map(function (p) { return p.url; })
  });
  return crypto.createHash('sha256').update(canon, 'utf8').digest('hex');
}

// Valide et normalise une signature (dessinée ou nom tapé).
function construireSignature(corps, utilisateur, ip, edl, role, reserves) {
  corps = corps || {};
  if (corps.accepte !== true) throw new Error('Cochez « lu et approuvé » pour signer');
  var mode = corps.mode === 'dessin' ? 'dessin' : 'texte';
  var sig = { mode: mode, role: role, signe_at: new Date().toISOString(), ip: ip || null };

  if (mode === 'dessin') {
    var img = String(corps.image || '');
    if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(img) || img.length > LIMITES.signatureImage) {
      throw new Error('Signature dessinée invalide');
    }
    if (img.length < 400) throw new Error('Signature dessinée vide');
    sig.image = img;
    sig.nom_complet = propre((utilisateur.prenom || '') + ' ' + (utilisateur.nom || ''), 80);
  } else {
    var nom = propre(corps.nom, 80);
    if (nom.length < 3) throw new Error('Tapez votre nom complet pour signer');
    sig.nom_complet = nom;
  }
  sig.hash = empreinteContenu(edl, role, reserves);
  return sig;
}

module.exports = {
  ETATS, RANG, LIBELLES_ETAT, LIMITES,
  genererGrille, grilleDepuisEntree, fusionnerGrille, normaliserReleves,
  grilleComplete, degradations, empreinteContenu, construireSignature, propre
};
