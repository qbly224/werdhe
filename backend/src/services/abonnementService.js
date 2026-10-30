const db = require('../database');
const { FONCTIONNALITES } = require('../middleware/verifierPlan');

// Remettre en ligne les biens masqués automatiquement lors d'une précédente
// expiration, dans la limite autorisée par le nouveau plan.
async function remettreEnLigneBiens(userId, plan) {
  try {
    var limite = FONCTIONNALITES[plan] ? FONCTIONNALITES[plan].max_biens : 0;
    if (!limite) return;
    await db.query(
      `UPDATE logements SET statut = 'disponible', masque_limite_plan = FALSE
       WHERE id IN (
         SELECT id FROM logements
         WHERE proprietaire_id = $1 AND masque_limite_plan = TRUE
         ORDER BY created_at DESC
         LIMIT $2
       )`,
      [userId, limite === Infinity ? 100000 : limite]
    );
  } catch (err) {
    console.warn('[Abonnement] Remise en ligne biens:', err.message);
  }
}

async function envoyerFactureParEmail(userId, plan, montant, cycle, debut, fin) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    var userInfo = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    var u = userInfo.rows[0];
    if (!u) return;
    await resend.emails.send({
      from:    process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
      to:      u.email,
      subject: 'Facture abonnement Werdhe, plan ' + plan.charAt(0).toUpperCase() + plan.slice(1),
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <div style="background:#1B6B3A;padding:20px;border-radius:12px 12px 0 0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:34px;height:34px;"><img src="https://werdhe.com/logo192.png" width="34" height="34" alt="Werdhe" style="display:block;border-radius:9px;width:34px;height:34px;" /></td><td style="padding-left:9px;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:17px;color:#fff;">Werdhe · Facture</td></tr></table>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
            <p>Bonjour <b>${u.prenom} ${u.nom}</b>,</p>
            <p>Merci pour votre abonnement au plan <b>${plan}</b>.</p>
            <div style="background:#F8F8F8;border-radius:10px;padding:16px;margin:16px 0">
              <table style="width:100%;font-size:13px">
                <tr><td style="color:#888">Plan</td><td style="text-align:right;font-weight:700">${plan.charAt(0).toUpperCase() + plan.slice(1)}</td></tr>
                <tr><td style="color:#888">Cycle</td><td style="text-align:right">${cycle}</td></tr>
                <tr><td style="color:#888">Période</td><td style="text-align:right">${new Date(debut).toLocaleDateString('fr-FR')} → ${new Date(fin).toLocaleDateString('fr-FR')}</td></tr>
                <tr><td style="color:#888">Montant</td><td style="text-align:right;font-weight:700;color:#1B6B3A">${new Intl.NumberFormat('fr-FR').format(montant)} GNF</td></tr>
              </table>
            </div>
            <p style="color:#888;font-size:12px">Werdhe · Plateforme immobilière Guinée</p>
          </div>
        </div>
      `
    });
  } catch (e) {
    console.warn('[Facture abonnement] Email non envoyé:', e.message);
  }
}

// ================================================
// Active l'abonnement correspondant à une facture Djomy payée.
// Idempotent : si la facture n'est plus 'en_attente' (déjà traitée par
// un appel précédent du webhook ou de la vérification de statut), ne
// fait rien et renvoie null.
// ================================================
async function activerAbonnementPaye(factureId) {
  var factureRes = await db.query(
    `UPDATE factures_abonnements SET statut = 'payee'
     WHERE id = $1 AND statut = 'en_attente' RETURNING *`,
    [factureId]
  );
  if (factureRes.rows.length === 0) return null;

  var f = factureRes.rows[0];

  var maj = await db.query(
    `UPDATE abonnements
     SET plan = $1, statut = 'actif', date_fin = $2, cycle = $3,
         essai_termine = TRUE, rappel_j3_envoye = FALSE, rappel_j5_envoye = FALSE,
         rappel_j7_avant_envoye = FALSE, rappel_j3_avant_envoye = FALSE, rappel_j1_avant_envoye = FALSE
     WHERE user_id = $4`,
    [f.plan, f.periode_fin, f.cycle, f.user_id]
  );
  if (maj.rowCount === 0) {
    await db.query(
      `INSERT INTO abonnements (user_id, plan, statut, date_fin, cycle, essai_termine)
       VALUES ($1, $2, 'actif', $3, $4, TRUE)`,
      [f.user_id, f.plan, f.periode_fin, f.cycle]
    );
  }

  await db.query('UPDATE users SET plan = $1, abonnement_bloque = FALSE WHERE id = $2', [f.plan, f.user_id]);
  await remettreEnLigneBiens(f.user_id, f.plan);
  envoyerFactureParEmail(f.user_id, f.plan, f.montant, f.cycle, f.periode_debut, f.periode_fin).catch(console.warn);

  return f;
}

// Marque une facture d'abonnement en échec (paiement annulé/échoué côté Djomy).
async function marquerFactureEchouee(factureId) {
  await db.query(
    `UPDATE factures_abonnements SET statut = 'echec' WHERE id = $1 AND statut = 'en_attente'`,
    [factureId]
  );
}

module.exports = { activerAbonnementPaye, marquerFactureEchouee, remettreEnLigneBiens };
