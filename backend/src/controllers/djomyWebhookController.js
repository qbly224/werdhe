const djomyService = require('../services/djomyService');
const { confirmerPaiementDjomy } = require('./paiementController');
const { activerAbonnementPaye, marquerFactureEchouee } = require('../services/abonnementService');
const db = require('../database');

// ================================================
// Webhook signé Djomy — point d'entrée unique pour les deux types de
// paiement (loyer locataire→propriétaire et abonnement Werdhe). On
// distingue via le préfixe du merchantPaymentReference généré par
// Werdhe à l'initiation : WRD-RESA-... (loyer) / WRD-ABO-... (abonnement).
// En-tête attendu : X-Webhook-Signature: v1:<hmac-sha256-hex>
// ================================================
async function webhookDjomy(req, res) {
  try {
    const signature = req.headers['x-webhook-signature'];
    const corpsBrut = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});

    if (!djomyService.verifierSignatureWebhook(corpsBrut, signature)) {
      console.warn('[webhook djomy] signature invalide ou absente');
      return res.status(401).json({ erreur: 'Signature invalide' });
    }

    const evenement = req.body || {};
    // V1 : data = {transactionId, status, merchantPaymentReference, ...}
    // V2 : data = {payment: {...}} ou {payout: {...}}
    const donnees = (evenement.data && evenement.data.payment) || evenement.data;

    if (!donnees || !donnees.merchantPaymentReference || !donnees.transactionId) {
      // Événement sans rapport avec un paiement qu'on sache router (ex: payout) → on acquitte.
      return res.status(200).json({ recu: true });
    }

    const reference = String(donnees.merchantPaymentReference);
    const statutDjomy = donnees.status;

    if (reference.indexOf('WRD-RESA-') === 0) {
      await confirmerPaiementDjomy(donnees.transactionId, statutDjomy);
    } else if (reference.indexOf('WRD-ABO-') === 0) {
      await routerPaiementAbonnement(donnees.transactionId, statutDjomy);
    } else {
      console.warn('[webhook djomy] référence non reconnue:', reference);
    }

    res.status(200).json({ recu: true });
  } catch (err) {
    console.error('[webhook djomy]', err.message);
    // On acquitte malgré l'erreur interne (déjà loggée) pour éviter un
    // déluge de re-essais Djomy sur une erreur qui ne se résoudra pas toute seule.
    res.status(200).json({ recu: true });
  }
}

async function routerPaiementAbonnement(transactionId, statutDjomyBrut) {
  const facture = await db.query(
    `SELECT id FROM factures_abonnements WHERE reference_externe = $1`,
    [transactionId]
  );
  if (facture.rows.length === 0) {
    console.warn('[webhook djomy] facture abonnement introuvable pour transactionId:', transactionId);
    return;
  }

  const factureId = facture.rows[0].id;
  if (statutDjomyBrut === 'SUCCESS') {
    await activerAbonnementPaye(factureId);
  } else if (statutDjomyBrut === 'FAILED' || statutDjomyBrut === 'CANCELLED') {
    await marquerFactureEchouee(factureId);
  }
}

module.exports = { webhookDjomy };
