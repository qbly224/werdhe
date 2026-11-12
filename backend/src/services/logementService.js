// Cycle de vie du statut d'un logement autour de la réservation :
//   disponible → reserve (caution payée) → loue (bail signé)
//   reserve → disponible (réservation refusée, annulée ou terminée)
// Les fonctions acceptent un client de transaction ou le pool (`q`).

// Statuts de réservation qui retiennent le logement (caution versée, bail en cours).
var STATUTS_RETENANT = ['caution_payee', 'bail_en_cours', 'bail_signe_proprio'];

// Passe un logement disponible en « reserve ». Sans effet sur un logement déjà réservé ou loué.
async function reserverLogement(q, logementId) {
  var res = await q.query(
    "UPDATE logements SET statut = 'reserve' WHERE id = $1 AND statut = 'disponible'",
    [logementId]
  );
  return res.rowCount > 0;
}

// Remet en « disponible » un logement « reserve » dont plus aucune réservation n'est retenue.
async function libererSiPlusReserve(q, logementId) {
  var res = await q.query(
    `UPDATE logements SET statut = 'disponible'
     WHERE id = $1 AND statut = 'reserve'
       AND NOT EXISTS (
         SELECT 1 FROM reservations
         WHERE logement_id = $1 AND statut = ANY($2::text[])
       )`,
    [logementId, STATUTS_RETENANT]
  );
  return res.rowCount > 0;
}

// Remet en « disponible » tous les logements « reserve » que plus aucune réservation ne retient
// (par exemple après l'annulation en masse des réservations d'un compte supprimé).
async function libererLogementsOrphelins(q) {
  var res = await q.query(
    `UPDATE logements l SET statut = 'disponible'
     WHERE l.statut = 'reserve'
       AND NOT EXISTS (
         SELECT 1 FROM reservations r
         WHERE r.logement_id = l.id AND r.statut = ANY($1::text[])
       )`,
    [STATUTS_RETENANT]
  );
  return res.rowCount;
}

module.exports = { STATUTS_RETENANT, reserverLogement, libererSiPlusReserve, libererLogementsOrphelins };
