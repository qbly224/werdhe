const crypto = require('crypto');

// ================================================
// DJOMY — Agrégateur de paiement (Orange Money, MTN MoMo, carte...)
// Remplace les intégrations directes Orange/MTN par un seul flux API.
// Doc : https://sandbox.djomy.africa/app/developer
// ================================================

var BASE_URL      = process.env.DJOMY_API_URL || 'https://sandbox-api.djomy.africa';
var CLIENT_ID     = process.env.DJOMY_CLIENT_ID;
var CLIENT_SECRET = process.env.DJOMY_CLIENT_SECRET;

// Jeton d'accès mis en cache en mémoire (durée de vie côté Djomy : 3600s).
// On le renouvelle un peu avant son expiration pour ne jamais tomber pile
// sur un token périmé au milieu d'un appel.
var jetonCache = { valeur: null, expireLe: 0 };

function genererXApiKey() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('DJOMY_CLIENT_ID / DJOMY_CLIENT_SECRET manquants côté serveur');
  }
  var signature = crypto.createHmac('sha256', CLIENT_SECRET).update(CLIENT_ID).digest('hex');
  return CLIENT_ID + ':' + signature;
}

// Node.js 18+ a fetch natif — pas besoin de node-fetch
async function appelerDjomy(chemin, options) {
  options = options || {};
  var entetes = Object.assign({
    'X-API-KEY': genererXApiKey(),
    'Content-Type': 'application/json',
  }, options.avecToken ? { Authorization: 'Bearer ' + (await obtenirAccessToken()) } : {}, options.entetes || {});

  var reponse = await fetch(BASE_URL + chemin, {
    method: options.methode || 'GET',
    headers: entetes,
    body: options.corps ? JSON.stringify(options.corps) : undefined,
  });

  var donnees = await reponse.json().catch(function() { return null; });

  if (!reponse.ok || !donnees || donnees.success === false) {
    var messageErreur = (donnees && (donnees.message || (donnees.error && donnees.error.message))) || ('Djomy HTTP ' + reponse.status);
    var err = new Error(messageErreur);
    err.statutHttp = reponse.status;
    err.reponseDjomy = donnees;
    throw err;
  }

  return donnees.data;
}

async function obtenirAccessToken() {
  var maintenant = Date.now();
  if (jetonCache.valeur && jetonCache.expireLe > maintenant) {
    return jetonCache.valeur;
  }

  var reponse = await fetch(BASE_URL + '/v1/auth', {
    method: 'POST',
    headers: { 'X-API-KEY': genererXApiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  var donnees = await reponse.json().catch(function() { return null; });

  if (!reponse.ok || !donnees || !donnees.data || !donnees.data.accessToken) {
    throw new Error('Authentification Djomy échouée : ' + (donnees && donnees.message || reponse.status));
  }

  jetonCache.valeur = donnees.data.accessToken;
  // On rafraîchit 2 minutes avant l'expiration annoncée par Djomy.
  jetonCache.expireLe = maintenant + (donnees.data.expiresIn - 120) * 1000;
  return jetonCache.valeur;
}

// ================================================
// Normalise un numéro guinéen vers le format international attendu
// par Djomy (ex: 00224623707722).
// ================================================
function formaterNumeroInternational(tel) {
  var propre = String(tel || '').replace(/\s+/g, '').replace(/^(\+224|00224|224)/, '');
  if (!/^\d{9}$/.test(propre)) return null;
  return '00224' + propre;
}

// ================================================
// Initier un paiement avec redirection vers le portail Djomy.
// payeur peut choisir Orange Money, MTN MoMo, Kulu ou carte sur la
// page hébergée par Djomy : Werdhe n'a pas à gérer ce choix.
// ================================================
async function initierPaiementGateway(params) {
  var numeroFormate = formaterNumeroInternational(params.telephone);
  if (!numeroFormate) {
    var err = new Error('Numéro de téléphone invalide. Format attendu : 6XX XXX XXX');
    err.validation = true;
    throw err;
  }

  var donnees = await appelerDjomy('/v1/payments/gateway', {
    methode: 'POST',
    avecToken: true,
    corps: {
      amount: params.montant,
      countryCode: 'GN',
      payerNumber: numeroFormate,
      description: params.description,
      merchantPaymentReference: params.reference,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl || params.returnUrl,
      metadata: params.metadata || undefined,
    },
  });

  return {
    transactionId: donnees.transactionId,
    statut: donnees.status,
    redirectUrl: donnees.redirectUrl,
  };
}

// ================================================
// Consulter le statut d'un paiement par son transactionId.
// ================================================
async function recupererStatutPaiement(transactionId) {
  var donnees = await appelerDjomy('/v1/payments/' + encodeURIComponent(transactionId) + '/status', {
    avecToken: true,
  });
  return donnees;
}

// ================================================
// Vérifier la signature d'un webhook entrant.
// En-tête attendu : X-Webhook-Signature: v1:<hmac-sha256-hex>
// Signature = HMAC-SHA256(corps_brut_json, clientSecret)
// ================================================
function verifierSignatureWebhook(corpsBrut, enteteSignature) {
  if (!enteteSignature || !CLIENT_SECRET) return false;
  var parties = String(enteteSignature).split(':');
  if (parties.length !== 2) return false;
  var signatureRecue = parties[1];
  var signatureAttendue = crypto.createHmac('sha256', CLIENT_SECRET).update(corpsBrut).digest('hex');

  // Comparaison à temps constant pour éviter une attaque par timing.
  var bufRecu = Buffer.from(signatureRecue, 'hex');
  var bufAttendu = Buffer.from(signatureAttendue, 'hex');
  if (bufRecu.length !== bufAttendu.length) return false;
  return crypto.timingSafeEqual(bufRecu, bufAttendu);
}

module.exports = {
  initierPaiementGateway,
  recupererStatutPaiement,
  verifierSignatureWebhook,
  formaterNumeroInternational,
};
