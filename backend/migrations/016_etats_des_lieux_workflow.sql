-- Migration : état des lieux interactif avec parcours de validation et signature
-- (étape 3 de la refonte des documents).
--
-- À exécuter manuellement sur la base Supabase AVANT de déployer le code
-- correspondant (routes/etatsDesLieux.js, documentService.js).
-- Transactionnelle : tout passe ou rien. La table etats_des_lieux est vide en
-- production : aucune reprise de données.
--
-- Parcours : brouillon (le rédacteur remplit) → a_valider (envoyé et signé par
-- le rédacteur) → signe (l'autre partie a signé) → genere (document verrouillé).

BEGIN;

ALTER TABLE etats_des_lieux
  ADD COLUMN IF NOT EXISTS logement_id               uuid REFERENCES logements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS redacteur_id              uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS statut                    varchar(20) NOT NULL DEFAULT 'brouillon',
  ADD COLUMN IF NOT EXISTS grille                    jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS releves                   jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS observations_generales    text,
  ADD COLUMN IF NOT EXISTS reserves                  text,
  ADD COLUMN IF NOT EXISTS signature_redacteur       jsonb,
  ADD COLUMN IF NOT EXISTS signature_autre           jsonb,
  ADD COLUMN IF NOT EXISTS corrections               jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS document_id               uuid REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entree_id                 uuid REFERENCES etats_des_lieux(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version                   integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at                timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS genere_at                 timestamptz;

ALTER TABLE etats_des_lieux DROP CONSTRAINT IF EXISTS etats_des_lieux_statut_check;
ALTER TABLE etats_des_lieux ADD CONSTRAINT etats_des_lieux_statut_check
  CHECK (statut IN ('brouillon', 'a_valider', 'signe', 'genere', 'annule'));

-- Un seul état des lieux actif par location et par type (entrée / sortie).
CREATE UNIQUE INDEX IF NOT EXISTS idx_edl_actif_par_type
  ON etats_des_lieux(reservation_id, type) WHERE statut <> 'annule';
CREATE INDEX IF NOT EXISTS idx_edl_reservation ON etats_des_lieux(reservation_id);

-- Un état des lieux généré est figé (son document l'est aussi) : plus aucune
-- modification, plus de suppression, sauf mise à NULL des liens (suppression d'une
-- location, d'un bien ou d'un utilisateur) et rattachement du document au moment
-- de la génération.
CREATE OR REPLACE FUNCTION etats_des_lieux_fige() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.statut = 'genere' AND EXISTS (SELECT 1 FROM reservations r WHERE r.id = OLD.reservation_id) THEN
      RAISE EXCEPTION 'État des lieux généré : suppression impossible';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.statut = 'genere' THEN
    IF NEW.grille IS DISTINCT FROM OLD.grille
    OR NEW.releves IS DISTINCT FROM OLD.releves
    OR NEW.observations_generales IS DISTINCT FROM OLD.observations_generales
    OR NEW.reserves IS DISTINCT FROM OLD.reserves
    OR NEW.signature_redacteur IS DISTINCT FROM OLD.signature_redacteur
    OR NEW.signature_autre IS DISTINCT FROM OLD.signature_autre
    OR NEW.statut IS DISTINCT FROM OLD.statut
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.version IS DISTINCT FROM OLD.version
    OR NEW.photos IS DISTINCT FROM OLD.photos
    THEN
      RAISE EXCEPTION 'État des lieux généré : modification impossible';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_edl_fige ON etats_des_lieux;
CREATE TRIGGER trg_edl_fige
  BEFORE UPDATE OR DELETE ON etats_des_lieux
  FOR EACH ROW EXECUTE FUNCTION etats_des_lieux_fige();

-- (RLS déjà actif sur etats_des_lieux ; on ferme l'accès direct aux clients Supabase.)
REVOKE ALL ON etats_des_lieux FROM anon, authenticated;

COMMIT;

-- ── ROLLBACK (à exécuter à part, seulement si besoin) ───────────────────
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_edl_fige ON etats_des_lieux;
-- DROP FUNCTION IF EXISTS etats_des_lieux_fige();
-- DROP INDEX IF EXISTS idx_edl_actif_par_type;
-- DROP INDEX IF EXISTS idx_edl_reservation;
-- ALTER TABLE etats_des_lieux DROP CONSTRAINT IF EXISTS etats_des_lieux_statut_check;
-- ALTER TABLE etats_des_lieux DROP COLUMN IF EXISTS logement_id, DROP COLUMN IF EXISTS redacteur_id,
--   DROP COLUMN IF EXISTS statut, DROP COLUMN IF EXISTS grille, DROP COLUMN IF EXISTS releves,
--   DROP COLUMN IF EXISTS observations_generales, DROP COLUMN IF EXISTS reserves,
--   DROP COLUMN IF EXISTS signature_redacteur, DROP COLUMN IF EXISTS signature_autre,
--   DROP COLUMN IF EXISTS corrections, DROP COLUMN IF EXISTS document_id, DROP COLUMN IF EXISTS entree_id,
--   DROP COLUMN IF EXISTS version, DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS genere_at;
-- COMMIT;
