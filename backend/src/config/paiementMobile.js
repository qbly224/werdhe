// Paiement mobile (Orange Money / MTN Mobile Money) : configuration et règles partagées.

// Le paiement mobile direct (depuis Werdhe) n'est pas encore intégré : le prestataire n'est pas choisi.
// Ce drapeau permet de l'activer plus tard sans refaire l'interface. Variable d'environnement
// PAIEMENT_MOBILE_DIRECT_ACTIF=true pour l'activer ; faux par défaut.
const PAIEMENT_MOBILE_DIRECT_ACTIF = String(process.env.PAIEMENT_MOBILE_DIRECT_ACTIF || '').toLowerCase() === 'true';

const OPERATEURS = {
  orange_money: { label: 'Orange Money' },
  mtn_momo:     { label: 'MTN Mobile Money' },
};

// Délai pendant lequel le propriétaire peut annuler sa décision (confirmer / contester) avant que la
// quittance ne parte par e-mail et que le locataire soit prévenu.
const DELAI_ANNULATION_MS = 10 * 1000;

const NB_MOIS_MAX = 3;

// Numéro guinéen : 9 chiffres commençant par 6. On accepte la saisie avec espaces, points, tirets
// et l'indicatif (+224 / 00224 / 224) et on renvoie les 9 chiffres, ou null si invalide.
function normaliserNumero(valeur) {
  if (valeur === undefined || valeur === null) return null;
  var chiffres = String(valeur).replace(/[\s.\-()]/g, '');
  chiffres = chiffres.replace(/^\+?224/, '').replace(/^00224/, '');
  return /^6\d{8}$/.test(chiffres) ? chiffres : null;
}

// Code de transaction : lettres, chiffres, point, tiret, soulignement ; 4 à 40 caractères.
function normaliserCode(valeur) {
  var code = String(valeur || '').trim();
  return /^[A-Za-z0-9._-]{4,40}$/.test(code) ? code : null;
}

module.exports = { PAIEMENT_MOBILE_DIRECT_ACTIF, OPERATEURS, DELAI_ANNULATION_MS, NB_MOIS_MAX, normaliserNumero, normaliserCode };
