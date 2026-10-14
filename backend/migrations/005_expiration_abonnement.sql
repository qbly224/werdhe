-- Migration : alertes J-7/J-3/J-1 avant expiration de l'abonnement, et
-- masquage automatique des biens excédentaires quand l'abonnement expire.
--
-- À exécuter manuellement sur la base Supabase (SQL editor) AVANT de déployer
-- le code qui utilise ces colonnes (backend/src/services/cronService.js,
-- backend/src/routes/abonnements.js).
-- Toutes les instructions sont idempotentes (IF NOT EXISTS) : sans danger si
-- une colonne existe déjà.

-- Rappels AVANT expiration (distincts des rappel_j3_envoye/rappel_j5_envoye
-- existants, qui concernent les relances APRÈS expiration d'un abonnement
-- impayé).
ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS rappel_j7_avant_envoye BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rappel_j3_avant_envoye BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rappel_j1_avant_envoye BOOLEAN DEFAULT FALSE;

-- Marque les biens masqués automatiquement parce que le propriétaire a
-- dépassé la limite de son plan après expiration de l'abonnement, pour
-- pouvoir les remettre en ligne automatiquement lors du renouvellement.
ALTER TABLE logements
  ADD COLUMN IF NOT EXISTS masque_limite_plan BOOLEAN DEFAULT FALSE;
