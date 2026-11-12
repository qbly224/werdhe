-- Migration 019 : statut de logement « reserve ».
-- Un logement passe en « reserve » dès qu'un locataire a versé sa caution, jusqu'à la
-- signature du bail (« loue ») ou l'abandon de la réservation (retour à « disponible »).
-- Idempotente : peut être rejouée sans effet.

ALTER TABLE logements DROP CONSTRAINT IF EXISTS logements_statut_check;
ALTER TABLE logements ADD CONSTRAINT logements_statut_check
  CHECK (statut::text = ANY (ARRAY['disponible', 'reserve', 'loue', 'suspendu']::text[]));
