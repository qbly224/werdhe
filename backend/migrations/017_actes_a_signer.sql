-- Migration : actes à signer (étape 4 de la refonte des documents).
--
-- À exécuter manuellement sur la base Supabase AVANT de déployer le code
-- correspondant (routes/actes.js, documentService.js, routes/renouvellements.js).
-- Transactionnelle : tout passe ou rien.
--
-- Trois documents partagent le même parcours (brouillon → à valider → signé →
-- généré et verrouillé) : l'avenant de renouvellement, le décompte de
-- restitution de caution et l'acte de cautionnement (garant sans compte).

BEGIN;

-- Valeurs « avant » d'un renouvellement, figées à son acceptation (pour l'avenant :
-- tableau avant / après). Les renouvellements déjà acceptés n'en ont pas (NULL).
ALTER TABLE renouvellements_bail
  ADD COLUMN IF NOT EXISTS date_fin_avant timestamp,
  ADD COLUMN IF NOT EXISTS loyer_avant    numeric;

-- Nouveaux types de documents.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN ('facture', 'quittance', 'contrat_bail', 'etat_lieux', 'mise_en_demeure',
                  'rapport_financier', 'caution', 'preavis', 'autre',
                  'avenant', 'decompte', 'cautionnement'));

-- Le journal consigne aussi les signatures posées hors compte (garant).
ALTER TABLE document_evenements DROP CONSTRAINT IF EXISTS document_evenements_type_check;
ALTER TABLE document_evenements ADD CONSTRAINT document_evenements_type_check
  CHECK (type IN ('cree', 'genere', 'telecharge', 'envoye_email', 'annule', 'verifie',
                  'accuse_reception', 'rappel', 'signature'));

CREATE TABLE IF NOT EXISTS actes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type           varchar(20) NOT NULL CHECK (type IN ('avenant', 'decompte', 'cautionnement')),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  logement_id    uuid REFERENCES logements(id) ON DELETE SET NULL,
  redacteur_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  source_id      uuid,                                   -- renouvellement ou état des lieux de sortie à l'origine
  statut         varchar(20) NOT NULL DEFAULT 'brouillon'
                 CHECK (statut IN ('brouillon', 'a_valider', 'signe', 'genere', 'annule')),
  donnees        jsonb NOT NULL DEFAULT '{}'::jsonb,     -- contenu modifiable avant envoi
  signataires    jsonb NOT NULL DEFAULT '[]'::jsonb,     -- rôles attendus : proprietaire, locataire, garant
  signatures     jsonb NOT NULL DEFAULT '{}'::jsonb,     -- une signature par rôle
  corrections    jsonb NOT NULL DEFAULT '[]'::jsonb,
  garant         jsonb,                                  -- { email, nom, telephone, token_hash, token_expire_at, lien_envoye_at }
  document_id    uuid REFERENCES documents(id) ON DELETE SET NULL,
  version        integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  genere_at      timestamptz
);

-- Un seul avenant par renouvellement et un seul décompte par état des lieux de sortie.
CREATE UNIQUE INDEX IF NOT EXISTS idx_actes_source_unique
  ON actes(type, source_id) WHERE source_id IS NOT NULL AND statut <> 'annule';
CREATE INDEX IF NOT EXISTS idx_actes_reservation ON actes(reservation_id);
CREATE INDEX IF NOT EXISTS idx_actes_garant_token
  ON actes((garant ->> 'token_hash')) WHERE garant IS NOT NULL;

-- Un acte généré est figé (son document l'est aussi).
CREATE OR REPLACE FUNCTION actes_fige() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.statut = 'genere' AND EXISTS (SELECT 1 FROM reservations r WHERE r.id = OLD.reservation_id) THEN
      RAISE EXCEPTION 'Acte généré : suppression impossible';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.statut = 'genere' THEN
    IF NEW.donnees IS DISTINCT FROM OLD.donnees
    OR NEW.signatures IS DISTINCT FROM OLD.signatures
    OR NEW.signataires IS DISTINCT FROM OLD.signataires
    OR NEW.statut IS DISTINCT FROM OLD.statut
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.version IS DISTINCT FROM OLD.version
    OR NEW.garant IS DISTINCT FROM OLD.garant
    THEN
      RAISE EXCEPTION 'Acte généré : modification impossible';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_actes_fige ON actes;
CREATE TRIGGER trg_actes_fige
  BEFORE UPDATE OR DELETE ON actes
  FOR EACH ROW EXECUTE FUNCTION actes_fige();

ALTER TABLE actes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON actes FROM anon, authenticated;

COMMIT;

-- ── ROLLBACK (à exécuter à part, seulement si besoin) ───────────────────
-- BEGIN;
-- DROP TABLE IF EXISTS actes;
-- DROP FUNCTION IF EXISTS actes_fige();
-- ALTER TABLE renouvellements_bail DROP COLUMN IF EXISTS date_fin_avant, DROP COLUMN IF EXISTS loyer_avant;
-- ALTER TABLE document_evenements DROP CONSTRAINT IF EXISTS document_evenements_type_check;
-- ALTER TABLE document_evenements ADD CONSTRAINT document_evenements_type_check
--   CHECK (type IN ('cree','genere','telecharge','envoye_email','annule','verifie','accuse_reception','rappel'));
-- ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
-- ALTER TABLE documents ADD CONSTRAINT documents_type_check
--   CHECK (type IN ('facture','quittance','contrat_bail','etat_lieux','mise_en_demeure','rapport_financier','caution','preavis','autre'));
-- COMMIT;
