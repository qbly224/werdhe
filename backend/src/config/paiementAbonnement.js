// Paiement de l'abonnement par Orange Money « manuel » : le propriétaire envoie l'argent au numéro
// ci-dessous, puis remplit un formulaire ; un administrateur vérifie et active l'abonnement.

// Numéro Orange Money qui reçoit les abonnements (9 chiffres, sans indicatif). Surchargeable par
// la variable d'environnement ABONNEMENT_NUMERO_ORANGE_MONEY.
const chiffres = String(process.env.ABONNEMENT_NUMERO_ORANGE_MONEY || '622133331').replace(/\D/g, '').replace(/^224/, '');
const NUMERO = /^6\d{8}$/.test(chiffres) ? chiffres : '622133331';

// +224 622 13 33 31
function formaterNumero(n) {
  return '+224 ' + n.slice(0, 3) + ' ' + n.slice(3, 5) + ' ' + n.slice(5, 7) + ' ' + n.slice(7, 9);
}

// Durées proposées (en mois) et réduction appliquée, identiques aux cycles de la page Tarifs
// (6 mois : -10 %, 12 mois : -20 %).
const REDUCTIONS = { 1: 0, 3: 0, 6: 0.10, 12: 0.20 };

// Adresse qui reçoit l'e-mail de chaque nouvelle demande.
function emailAdmin() {
  return process.env.ADMIN_NOTIF_EMAIL || process.env.SUPPORT_EMAIL || 'contact@werdhe.com';
}

module.exports = { NUMERO, NUMERO_AFFICHE: formaterNumero(NUMERO), REDUCTIONS, emailAdmin };
