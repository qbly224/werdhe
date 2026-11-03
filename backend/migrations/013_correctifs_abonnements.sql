-- Migration : correctifs liés aux abonnements impayés.
--
-- À exécuter manuellement sur la base Supabase (SQL editor) AVANT de déployer
-- le code correspondant (cronService.js, abonnementService.js).
-- Transactionnelle : tout passe ou rien.

BEGIN;

-- Le CRON 7 écrit statut = 'impaye' au blocage J+5, valeur que la contrainte
-- d'origine (actif/expire/essai) refusait : le blocage échouait en erreur.
ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_statut_check;
ALTER TABLE abonnements ADD CONSTRAINT abonnements_statut_check
  CHECK (statut IN ('actif', 'expire', 'essai', 'impaye'));

-- Statut d'un bien avant son masquage automatique (limite de plan dépassée),
-- pour le restaurer à l'identique (un bien loué ne redevient pas « disponible »).
ALTER TABLE logements ADD COLUMN IF NOT EXISTS statut_avant_masque varchar(20);

COMMIT;

-- ── ROLLBACK (à exécuter à part, seulement si besoin) ───────────────────
-- BEGIN;
-- ALTER TABLE logements DROP COLUMN IF EXISTS statut_avant_masque;
-- ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_statut_check;
-- ALTER TABLE abonnements ADD CONSTRAINT abonnements_statut_check CHECK (statut IN ('actif', 'expire', 'essai'));
-- COMMIT;
