-- Le flux Orange Money / MTN MoMo (mobilemoneyController.js) insère
-- mode_paiement = 'mobile_money', valeur que la contrainte CHECK en place
-- n'autorisait pas ('en_ligne' / 'especes' seulement) : chaque initiation
-- de paiement mobile money échouait donc systématiquement en base,
-- renvoyée comme une erreur 500 générique côté client. On élargit la
-- contrainte pour accepter des valeurs distinctes par opérateur
-- (orange_money / mtn_momo), déjà celles attendues à l'affichage par
-- documentService.js.
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_mode_paiement_check;
ALTER TABLE paiements ADD CONSTRAINT paiements_mode_paiement_check
  CHECK (mode_paiement IN ('en_ligne', 'especes', 'orange_money', 'mtn_momo'));

-- Empêche la création de deux paiements "en_attente" pour la même
-- réservation (double clic, double onglet, requête rejouée) : backstop
-- au niveau base en plus de la vérification applicative.
CREATE UNIQUE INDEX IF NOT EXISTS idx_paiements_reservation_en_attente
  ON paiements (reservation_id)
  WHERE statut = 'en_attente';

-- Empêche un locataire de créer une deuxième réservation active sur le
-- même logement (statuts hors refusee/annulee/terminee = "en cours").
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_locataire_logement_active
  ON reservations (logement_id, locataire_id)
  WHERE statut NOT IN ('refusee', 'annulee', 'terminee');
