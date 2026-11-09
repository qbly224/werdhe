-- Migration : le bail devient un acte à signer (étape 5 de la refonte des documents).
--
-- À exécuter manuellement sur la base Supabase AVANT de déployer le code
-- correspondant (routes/actes.js, services/bailService.js).
-- Transactionnelle : tout passe ou rien.

BEGIN;

-- Identité des parties, saisie une seule fois puis préremplie aux baux suivants
-- (naissance, pièce d'identité, adresse, profession, téléphone).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS identite jsonb;

-- Le bail est un acte comme l'avenant ou la caution (source_id = la réservation :
-- un seul bail actif par location grâce à l'index unique existant).
ALTER TABLE actes DROP CONSTRAINT IF EXISTS actes_type_check;
ALTER TABLE actes ADD CONSTRAINT actes_type_check
  CHECK (type IN ('avenant', 'decompte', 'cautionnement', 'bail'));

COMMIT;

-- ── ROLLBACK (à exécuter à part, seulement si besoin) ───────────────────
-- BEGIN;
-- DELETE FROM actes WHERE type = 'bail' AND statut <> 'genere';  -- (les actes générés sont verrouillés)
-- ALTER TABLE actes DROP CONSTRAINT IF EXISTS actes_type_check;
-- ALTER TABLE actes ADD CONSTRAINT actes_type_check CHECK (type IN ('avenant','decompte','cautionnement'));
-- ALTER TABLE public.users DROP COLUMN IF EXISTS identite;
-- COMMIT;
