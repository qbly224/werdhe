const db = require('../database');

// ================================================
// CONFIGURATION APIs Mobile Money
// ================================================
var CONFIG = {
  orange: {
    baseUrl: process.env.ORANGE_MONEY_URL || 'https://api.orange.com/orange-money-webpayment/dev/v1',
    merchantKey: process.env.ORANGE_MERCHANT_KEY || 'DEMO_KEY',
    merchantSecret: process.env.ORANGE_MERCHANT_SECRET || 'DEMO_SECRET',
    currency: 'GNF',
    mode: process.env.ORANGE_MODE || 'simulation'
  },
  mtn: {
    baseUrl: process.env.MTN_MOMO_URL || 'https://sandbox.momodeveloper.mtn.com',
    apiKey: process.env.MTN_API_KEY || 'DEMO_KEY',
    apiSecret: process.env.MTN_API_SECRET || 'DEMO_SECRET',
    subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY || 'DEMO_SUB_KEY',
    currency: 'GNF',
    mode: process.env.MTN_MODE || 'simulation'
  }
};

// ================================================
// UTILITAIRES
// ================================================
function genererReference() {
  return 'WRD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function validerTelephone(tel) {
  var propre = tel.replace(/\s+/g, '').replace(/^(\+224|00224)/, '');
  if (!/^\d{9}$/.test(propre)) return null;
  return '224' + propre;
}

// ================================================
// INITIER PAIEMENT ORANGE MONEY
// ================================================
async function initierOrangeMoney(req, res) {
  try {
    var { reservation_id, telephone, montant } = req.body;

    if (!telephone || !montant) {
      return res.status(400).json({ erreur: 'Telephone et montant requis' });
    }

    var telFormate = validerTelephone(telephone);
    if (!telFormate) {
      return res.status(400).json({ erreur: 'Numero de telephone invalide. Format: 6XX XXX XXX' });
    }

    var reference = genererReference();

    // Vérifier que la réservation existe
    var resaResult = await db.query(
      'SELECT * FROM reservations WHERE id = $1 AND locataire_id = $2',
      [reservation_id, req.user.id]
    );

    if (resaResult.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation non trouvee' });
    }

    // Enregistrer la tentative de paiement
    var paiementResult = await db.query(
      `INSERT INTO paiements
        (reservation_id, locataire_id, logement_id, montant, mode_paiement, statut, reference_externe, metadata)
       VALUES ($1, $2, $3, $4, 'mobile_money', 'en_attente', $5, $6)
       RETURNING *`,
      [
        reservation_id,
        req.user.id,
        resaResult.rows[0].logement_id,
        montant,
        reference,
        JSON.stringify({ operateur: 'orange', telephone: telFormate })
      ]
    );

    if (CONFIG.orange.mode === 'simulation') {
      // MODE SIMULATION
      res.json({
        success: true,
        reference: reference,
        paiement_id: paiementResult.rows[0].id,
        message: 'Simulation : Un code USSD a ete envoye au ' + telephone,
        simulation: true,
        instructions: [
          'Composez *144*1*4# sur votre telephone Orange',
          'Entrez votre code PIN Orange Money',
          'Confirmez le paiement de ' + Number(montant).toLocaleString('fr-FR') + ' GNF',
          'Attendez la confirmation SMS'
        ]
      });
    } else {
      // MODE REEL - Orange Money Guinea API
      var fetch = require('node-fetch');
      var tokenRes = await fetch(CONFIG.orange.baseUrl + '/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials&client_id=' + CONFIG.orange.merchantKey + '&client_secret=' + CONFIG.orange.merchantSecret
      });
      var tokenData = await tokenRes.json();

      var payRes = await fetch(CONFIG.orange.baseUrl + '/webpayment', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + tokenData.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchant_key: CONFIG.orange.merchantKey,
          currency: 'GNF',
          order_id: reference,
          amount: montant,
          return_url: process.env.FRONTEND_URL + '/dashboard',
          cancel_url: process.env.FRONTEND_URL + '/dashboard',
          notif_url: process.env.BACKEND_URL + '/paiements/webhook/orange'
            + (process.env.ORANGE_WEBHOOK_SECRET ? '?secret=' + process.env.ORANGE_WEBHOOK_SECRET : ''),
          lang: 'fr',
          reference: reference
        })
      });
      var payData = await payRes.json();

      res.json({
        success: true,
        reference: reference,
        paiement_id: paiementResult.rows[0].id,
        payment_url: payData.payment_url,
        message: 'Redirection vers Orange Money...'
      });
    }
  } catch (err) {
    console.error('Erreur Orange Money:', err.message);
    res.status(500).json({ erreur: 'Erreur lors de l\'initiation du paiement Orange Money' });
  }
}

// ================================================
// INITIER PAIEMENT MTN MOMO
// ================================================
async function initierMTNMomo(req, res) {
  try {
    var { reservation_id, telephone, montant } = req.body;

    if (!telephone || !montant) {
      return res.status(400).json({ erreur: 'Telephone et montant requis' });
    }

    var telFormate = validerTelephone(telephone);
    if (!telFormate) {
      return res.status(400).json({ erreur: 'Numero de telephone invalide. Format: 6XX XXX XXX' });
    }

    var reference = genererReference();

    var resaResult = await db.query(
      'SELECT * FROM reservations WHERE id = $1 AND locataire_id = $2',
      [reservation_id, req.user.id]
    );

    if (resaResult.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation non trouvee' });
    }

    var paiementResult = await db.query(
      `INSERT INTO paiements
        (reservation_id, locataire_id, logement_id, montant, mode_paiement, statut, reference_externe, metadata)
       VALUES ($1, $2, $3, $4, 'mobile_money', 'en_attente', $5, $6)
       RETURNING *`,
      [
        reservation_id,
        req.user.id,
        resaResult.rows[0].logement_id,
        montant,
        reference,
        JSON.stringify({ operateur: 'mtn', telephone: telFormate })
      ]
    );

    if (CONFIG.mtn.mode === 'simulation') {
      res.json({
        success: true,
        reference: reference,
        paiement_id: paiementResult.rows[0].id,
        message: 'Simulation : Demande envoyee au ' + telephone,
        simulation: true,
        instructions: [
          'Composez *156# sur votre telephone MTN',
          'Choisissez "Payer un marchand"',
          'Entrez le code marchand Werdhe : WRD001',
          'Entrez le montant : ' + Number(montant).toLocaleString('fr-FR') + ' GNF',
          'Confirmez avec votre PIN MoMo'
        ]
      });
    } else {
      // MODE REEL - MTN MoMo Collections API
      var fetch = require('node-fetch');
      var { v4: uuidv4 } = require('uuid');
      var externalId = uuidv4();

      var tokenRes = await fetch(CONFIG.mtn.baseUrl + '/collection/token/', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(CONFIG.mtn.apiKey + ':' + CONFIG.mtn.apiSecret).toString('base64'),
          'Ocp-Apim-Subscription-Key': CONFIG.mtn.subscriptionKey
        }
      });
      var tokenData = await tokenRes.json();

      await fetch(CONFIG.mtn.baseUrl + '/collection/v1_0/requesttopay', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + tokenData.access_token,
          'X-Reference-Id': externalId,
          'X-Target-Environment': 'production',
          'Ocp-Apim-Subscription-Key': CONFIG.mtn.subscriptionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: String(montant),
          currency: 'GNF',
          externalId: reference,
          payer: { partyIdType: 'MSISDN', partyId: telFormate },
          payerMessage: 'Loyer Werdhe - ' + reference,
          payeeNote: 'Paiement loyer via Werdhe'
        })
      });

      res.json({
        success: true,
        reference: reference,
        external_id: externalId,
        paiement_id: paiementResult.rows[0].id,
        message: 'Demande envoyee. Approuvez sur votre telephone MTN.'
      });
    }
  } catch (err) {
    console.error('Erreur MTN MoMo:', err.message);
    res.status(500).json({ erreur: 'Erreur lors de l\'initiation du paiement MTN MoMo' });
  }
}

// ================================================
// CONFIRMER UN PAIEMENT (simulation)
// ================================================
async function confirmerPaiement(req, res) {
  try {
    var { paiement_id } = req.params;

    // Seul le locataire propriétaire du paiement peut le confirmer (mode simulation),
    // et uniquement vers 'complete' - pas de statut arbitraire venant du client.
    var result = await db.query(
      `UPDATE paiements
       SET statut = 'complete', date_paiement = NOW()
       WHERE id = $1 AND locataire_id = $2 AND statut = 'en_attente'
       RETURNING *`,
      [paiement_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Paiement non trouve' });
    }

    var p = result.rows[0];
    if (p.reservation_id) {
      await db.query(
        'UPDATE reservations SET statut = $1 WHERE id = $2',
        ['confirmee', p.reservation_id]
      );
    }

    res.json({ success: true, paiement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur confirmation paiement' });
  }
}

// ================================================
// WEBHOOK ORANGE MONEY
// ================================================
async function webhookOrange(req, res) {
  try {
    if (process.env.ORANGE_WEBHOOK_SECRET && req.query.secret !== process.env.ORANGE_WEBHOOK_SECRET) {
      return res.status(403).json({ erreur: 'Secret webhook invalide' });
    }

    var { order_id, status, txnid } = req.body;

    if (status === 'SUCCESS') {
      await db.query(
        `UPDATE paiements
         SET statut = 'complete', date_paiement = NOW(), reference_externe = $1
         WHERE reference_externe = $2`,
        [txnid || order_id, order_id]
      );
    }

    res.json({ status: 'OK' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur webhook' });
  }
}

// ================================================
// WEBHOOK MTN MOMO
// ================================================
async function webhookMTN(req, res) {
  try {
    if (process.env.MTN_WEBHOOK_SECRET && req.query.secret !== process.env.MTN_WEBHOOK_SECRET) {
      return res.status(403).json({ erreur: 'Secret webhook invalide' });
    }

    var { externalId, status } = req.body;

    if (status === 'SUCCESSFUL') {
      await db.query(
        `UPDATE paiements
         SET statut = 'complete', date_paiement = NOW()
         WHERE reference_externe = $1`,
        [externalId]
      );
    }

    res.json({ status: 'OK' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur webhook MTN' });
  }
}

// ================================================
// VERIFIER STATUT PAIEMENT
// ================================================
async function verifierStatut(req, res) {
  try {
    var { paiement_id } = req.params;
    var result = await db.query(
      'SELECT * FROM paiements WHERE id = $1 AND locataire_id = $2',
      [paiement_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Paiement non trouve' });
    }

    res.json({ paiement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur verification' });
  }
}

module.exports = {
  initierOrangeMoney,
  initierMTNMomo,
  confirmerPaiement,
  webhookOrange,
  webhookMTN,
  verifierStatut
};