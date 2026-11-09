const db = require('../database');
const { calculerScore } = require('./scoreService');

// ================================================
// ACTIVATION D'UNE LOCATION : effets de la dernière signature du bail.
// Même comportement qu'avant (anciennement inline dans reservations.js) :
// location confirmée, logement « loué », score du locataire, badge après 3 locations.
// ================================================

async function activerLocation(reservation, client) {
  const q = client || db;
  await q.query(
    'UPDATE reservations SET statut = $1, bail_signe = TRUE, updated_at = NOW() WHERE id = $2',
    ['confirmee', reservation.id]
  );

  // Recalculer le score du locataire (non bloquant)
  calculerScore(reservation.locataire_id).catch(console.warn);

  // Mettre le logement en « loué » automatiquement
  await q.query('UPDATE logements SET statut = $1 WHERE id = $2', ['loue', reservation.logement_id])
    .catch(function (err) { console.warn('[Sync] Logement statut non mis à jour:', err.message); });

  // Badge locataire vérifié après 3 locations
  const nb = await q.query(
    `SELECT COUNT(*) FROM reservations WHERE locataire_id = $1 AND statut = 'confirmee'`,
    [reservation.locataire_id]
  );
  if (parseInt(nb.rows[0].count, 10) >= 3) {
    await q.query(
      `UPDATE users SET locataire_verifie = TRUE, nb_locations_terminees = $1 WHERE id = $2`,
      [parseInt(nb.rows[0].count, 10), reservation.locataire_id]
    );
  }
}

module.exports = { activerLocation };
