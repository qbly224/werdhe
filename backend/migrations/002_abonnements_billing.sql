-- Migration : essai gratuit 1 mois, cycles de facturation, paiement Mobile Money
-- de l'abonnement, relances J+3/J+5 et blocage d'accès.
--
-- À exécuter manuellement sur la base Supabase (SQL editor) AVANT de déployer
-- le code qui utilise ces colonnes (backend/src/routes/abonnements.js,
-- backend/src/services/cronService.js, backend/src/routes/auth.js).
-- Toutes les instructions sont idempotentes (IF NOT EXISTS) : sans danger si
-- une colonne existe déjà.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS abonnement_bloque BOOLEAN DEFAULT FALSE;

ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS cycle VARCHAR(20) DEFAULT 'mensuel',
  ADD COLUMN IF NOT EXISTS essai_termine BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rappel_j3_envoye BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rappel_j5_envoye BOOLEAN DEFAULT FALSE;

ALTER TABLE factures_abonnements
  ADD COLUMN IF NOT EXISTS cycle VARCHAR(20) DEFAULT 'mensuel',
  ADD COLUMN IF NOT EXISTS reference_externe VARCHAR(100),
  ADD COLUMN IF NOT EXISTS operateur VARCHAR(20),
  ADD COLUMN IF NOT EXISTS telephone VARCHAR(30);
