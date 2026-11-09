const crypto = require('crypto');
const E = require('./etatDesLieuxService');
const T = require('./documentTemplates');

// ================================================
// ACTES À SIGNER : avenant, décompte de restitution, cautionnement.
// Logique pure (sans accès base) : types, validation du contenu modifiable,
// empreinte du contenu signé, identité et mention du garant.
// Les bornes de saisie sont celles testées au pire cas sur la page A4.
// ================================================

const TYPES = {
  avenant:       { doc: 'avenant',       signataires: ['proprietaire', 'locataire'] },
  decompte:      { doc: 'decompte',      signataires: ['proprietaire', 'locataire'] },
  cautionnement: { doc: 'cautionnement', signataires: ['proprietaire', 'locataire', 'garant'] }
};

const LIM = {
  clauseLibre: 200, retenues: 8, libelle: 40, commentaire: 60, note: 120,
  lien: 30, nom: 60, telephone: 24, email: 80, mois: 60, montantMax: 100000000000
};

const REGEX_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

function propre(s, max) { return E.propre(s, max); }

function dateValide(v) {
  if (!REGEX_DATE.test(String(v || ''))) return null;
  var d = new Date(v + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function entierPositif(v, max, nom) {
  var n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max || Math.round(n) !== n) throw new Error(nom + ' invalide (nombre entier entre 0 et ' + max + ')');
  return n;
}

function ajouterMois(date, n) {
  var d = new Date(date); var jour = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
  var fin = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(jour, fin));
  return d;
}

// ── Contenu initial ─────────────────────────────────────────

// Avenant : tout vient de l'accord déjà conclu ; seules une clause libre et la
// date d'effet restent modifiables.
function donneesAvenant(renouv, resa, historique) {
  var dateFinApres = resa.date_fin ? new Date(resa.date_fin) : null;
  var dateFinAvant = renouv.date_fin_avant ? new Date(renouv.date_fin_avant)
    : (dateFinApres ? ajouterMois(dateFinApres, -renouv.nouvelle_duree_mois) : null);
  var loyerApres = renouv.nouveau_prix != null ? Number(renouv.nouveau_prix) : Number(resa.montant_total);
  var loyerAvant = renouv.loyer_avant != null ? Number(renouv.loyer_avant) : null;
  return {
    renouvellement_id: renouv.id,
    duree_ajoutee_mois: renouv.nouvelle_duree_mois,
    loyer_avant: loyerAvant,
    loyer_apres: loyerApres,
    date_fin_avant: dateFinAvant ? dateFinAvant.toISOString().slice(0, 10) : null,
    date_fin_apres: dateFinApres ? dateFinApres.toISOString().slice(0, 10) : null,
    historique: (historique || []).slice(0, 8).map(function (h) {
      return { at: new Date(h.created_at).toISOString().slice(0, 10), par: h.par, duree: h.nouvelle_duree_mois,
        prix: h.nouveau_prix != null ? Number(h.nouveau_prix) : null, issue: h.statut };
    }),
    clause_libre: '',
    date_effet: (dateFinAvant || new Date()).toISOString().slice(0, 10)
  };
}

// Décompte : le dépôt de garantie (1 mois de loyer) moins des retenues justifiées
// par l'état des lieux de sortie comparé à l'entrée. Une ligne de retenue est
// proposée pour chaque dégradation, à 0 : le bailleur chiffre ce qu'il retient.
function donneesDecompte(depot, edlSortie) {
  var degr = E.degradations(edlSortie.grille);
  return {
    edl_sortie_id: edlSortie.id,
    depot: Math.round(Number(depot) || 0),
    delai_jours: 30,
    constats: degr.slice(0, LIM.retenues).map(function (it) {
      return { item_id: it.id, libelle: it.piece + ' · ' + it.element, entree: it.entree, sortie: it.etat };
    }),
    retenues: degr.slice(0, LIM.retenues).map(function (it) {
      return { item_id: it.id, libelle: propre(it.piece + ' · ' + it.element, LIM.libelle), montant: 0, commentaire: '' };
    }),
    note: '',
    total_retenues: 0,
    a_restituer: Math.round(Number(depot) || 0)
  };
}

function donneesCautionnement(resa) {
  var loyer = Math.round(Number(resa.montant_total) || 0);
  return {
    nature: 'solidaire',
    montant_max: loyer * 12,
    duree_mois: Math.min(parseInt(resa.duree_mois, 10) || 12, LIM.mois),
    lien: '',
    garant: { email: '', nom: '', telephone: '' }
  };
}

// ── Validation du contenu modifiable ────────────────────────

function normaliserDonnees(type, client, actuel) {
  client = client || {};
  var d = Object.assign({}, actuel);

  if (type === 'avenant') {
    if (client.clause_libre !== undefined) d.clause_libre = propre(client.clause_libre, LIM.clauseLibre);
    if (client.date_effet !== undefined) {
      if (!dateValide(client.date_effet)) throw new Error('Date d\'effet invalide');
      d.date_effet = client.date_effet;
    }
    return d;
  }

  if (type === 'decompte') {
    if (client.retenues !== undefined) {
      if (!Array.isArray(client.retenues) || client.retenues.length > LIM.retenues) throw new Error('Trop de retenues (' + LIM.retenues + ' maximum)');
      d.retenues = client.retenues.map(function (r) {
        var libelle = propre(r && r.libelle, LIM.libelle);
        if (!libelle) throw new Error('Chaque retenue doit avoir un libellé');
        return {
          item_id: r && typeof r.item_id === 'string' ? r.item_id.slice(0, 60) : null,
          libelle: libelle,
          montant: entierPositif(r.montant === '' || r.montant == null ? 0 : r.montant, d.depot, 'Montant de la retenue « ' + libelle + ' »'),
          commentaire: propre(r.commentaire, LIM.commentaire)
        };
      });
    }
    if (client.note !== undefined) d.note = propre(client.note, LIM.note);
    d.total_retenues = d.retenues.reduce(function (s, r) { return s + r.montant; }, 0);
    if (d.total_retenues > d.depot) throw new Error('Les retenues ne peuvent pas dépasser le dépôt de garantie');
    d.a_restituer = d.depot - d.total_retenues;
    return d;
  }

  if (type === 'cautionnement') {
    if (client.nature !== undefined) {
      if (['solidaire', 'simple'].indexOf(client.nature) === -1) throw new Error('Nature de la caution invalide');
      d.nature = client.nature;
    }
    if (client.montant_max !== undefined) {
      d.montant_max = entierPositif(client.montant_max, LIM.montantMax, 'Montant maximal');
      if (d.montant_max < 1) throw new Error('Montant maximal invalide');
    }
    if (client.duree_mois !== undefined) {
      d.duree_mois = entierPositif(client.duree_mois, LIM.mois, 'Durée');
      if (d.duree_mois < 1) throw new Error('Durée invalide');
    }
    if (client.lien !== undefined) d.lien = propre(client.lien, LIM.lien);
    if (client.garant !== undefined) {
      var g = client.garant || {};
      var email = propre(g.email, LIM.email).toLowerCase();
      if (email && !REGEX_EMAIL.test(email)) throw new Error('Adresse e-mail du garant invalide');
      d.garant = { email: email, nom: propre(g.nom, LIM.nom), telephone: propre(g.telephone, LIM.telephone) };
    }
    return d;
  }

  throw new Error('Type d\'acte inconnu');
}

// Message d'erreur si l'acte n'est pas prêt à être envoyé à signature.
function erreurAvantEnvoi(type, d) {
  if (type === 'cautionnement') {
    if (!d.garant || !REGEX_EMAIL.test(d.garant.email || '')) return 'Indiquez l\'adresse e-mail du garant : il reçoit le lien pour signer';
    if (!(d.montant_max >= 1) || !(d.duree_mois >= 1)) return 'Indiquez le montant maximal et la durée de la caution';
  }
  return null;
}

// ── Empreinte du contenu signé ──────────────────────────────

// Sérialisation canonique (clés triées) : la base JSONB réordonne les clés, l'empreinte
// ne doit pas en dépendre.
function canonique(v) {
  if (Array.isArray(v)) return '[' + v.map(canonique).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; })
      .map(function (k) { return JSON.stringify(k) + ':' + canonique(v[k]); }).join(',') + '}';
  }
  return JSON.stringify(v === undefined ? null : v);
}

function empreinteActe(acte, role, extra) {
  var canon = canonique({ type: acte.type, version: acte.version, role: role, donnees: acte.donnees, extra: extra == null ? null : extra });
  return crypto.createHash('sha256').update(canon, 'utf8').digest('hex');
}

// ── Garant (signe sans compte, via un lien à usage unique) ──

function nouveauJeton() {
  var jeton = crypto.randomBytes(32).toString('hex');
  return { jeton: jeton, hash: hashJeton(jeton), expire: new Date(Date.now() + 14 * 86400000).toISOString() };
}

function hashJeton(jeton) {
  return crypto.createHash('sha256').update(String(jeton), 'utf8').digest('hex');
}

function mentionAttendue(d) {
  return 'Bon pour caution ' + (d.nature === 'simple' ? 'simple' : 'solidaire') + ' de la somme de ' +
    T.enLettres(d.montant_max) + ' francs guinéens, pour une durée de ' + d.duree_mois + ' mois.';
}

function normaliserMention(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function mentionValide(saisie, d) {
  return normaliserMention(saisie) === normaliserMention(mentionAttendue(d));
}

function identiteGarant(raw) {
  raw = raw || {};
  var nom = propre(raw.nom, 80);
  if (nom.length < 3) throw new Error('Indiquez votre nom complet');
  var naissance = dateValide(raw.naissance);
  if (!naissance) throw new Error('Indiquez votre date de naissance');
  var age = (Date.now() - naissance.getTime()) / (365.25 * 86400000);
  if (age < 18 || age > 110) throw new Error('Date de naissance invalide (majeur requis)');
  var cni = propre(raw.cni, 30);
  if (cni.length < 3) throw new Error('Indiquez le numéro de votre pièce d\'identité');
  var adresse = propre(raw.adresse, 120);
  if (adresse.length < 5) throw new Error('Indiquez votre adresse');
  var profession = propre(raw.profession, 50);
  if (profession.length < 2) throw new Error('Indiquez votre profession');
  var telephone = propre(raw.telephone, LIM.telephone);
  if (telephone.length < 6) throw new Error('Indiquez votre numéro de téléphone');
  return { nom: nom, naissance: raw.naissance, cni: cni, adresse: adresse, profession: profession, telephone: telephone };
}

// Tous les signataires attendus ont-ils signé ?
function toutesSignatures(acte) {
  return (acte.signataires || []).every(function (r) { return acte.signatures && acte.signatures[r]; });
}

module.exports = {
  TYPES, LIM,
  donneesAvenant, donneesDecompte, donneesCautionnement,
  normaliserDonnees, erreurAvantEnvoi, empreinteActe,
  nouveauJeton, hashJeton, mentionAttendue, mentionValide, identiteGarant, toutesSignatures,
  REGEX_EMAIL
};
