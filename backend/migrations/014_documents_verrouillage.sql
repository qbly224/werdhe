-- Migration : documents verrouillés après génération (étape 1 de la refonte des documents).
--
-- À exécuter manuellement sur la base Supabase AVANT de déployer le code
-- correspondant (documentService.js, documentController.js).
-- Transactionnelle : tout passe ou rien.
--
-- Principe : un document « généré » reçoit verrouille_at + une empreinte
-- SHA-256. Un trigger refuse ensuite toute modification de son contenu et
-- toute suppression. Seuls restent possibles : l'envoi par e-mail (compteurs)
-- et l'annulation (le document reste visible, marqué « annulé »).

BEGIN;

-- ── Nouvelles colonnes ──────────────────────────────────────────────────
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS numero        varchar(40),
  ADD COLUMN IF NOT EXISTS donnees       jsonb,
  ADD COLUMN IF NOT EXISTS hash_sha256   char(64),
  ADD COLUMN IF NOT EXISTS verrouille_at timestamptz,
  ADD COLUMN IF NOT EXISTS annule_at     timestamptz,
  ADD COLUMN IF NOT EXISTS annule_motif  text,
  ADD COLUMN IF NOT EXISTS remplace_par  uuid REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version       integer NOT NULL DEFAULT 1;

-- Statuts : brouillon → a_valider → signe → genere (verrouillé) ; annule.
-- « envoye » reste accepté pour les documents existants.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_statut_check;
ALTER TABLE documents ADD CONSTRAINT documents_statut_check
  CHECK (statut IN ('brouillon', 'a_valider', 'signe', 'genere', 'envoye', 'annule'));

-- Numérotation : une séquence remplace « les 5 derniers chiffres de l'horodatage »
-- (risque de doublon). Le numéro final est PREFIXE-ANNEE-NNNNNN, formaté côté code.
-- La séquence démarre à 100000 : les nouveaux numéros (6 chiffres) ne peuvent pas
-- entrer en collision avec les anciens (5 chiffres).
CREATE SEQUENCE IF NOT EXISTS documents_numero_seq START 100000;

-- ── Reprise des documents existants : tous verrouillés ──────────────────
-- (avant la création du trigger, sinon il refuserait la mise à jour)
UPDATE documents
SET verrouille_at = (created_at AT TIME ZONE 'UTC'),
    hash_sha256   = encode(sha256(convert_to(coalesce(contenu_html, ''), 'UTF8')), 'hex'),
    numero        = substring(titre FROM '[A-Z]{3,4}-[0-9]{4}-[0-9]{5}')
WHERE verrouille_at IS NULL
  AND statut IN ('genere', 'envoye', 'signe');

-- Deux anciens documents pourraient partager un numéro (5 derniers chiffres
-- de l'horodatage) : on ne garde le numéro que s'il est unique.
UPDATE documents d
SET numero = NULL
WHERE numero IS NOT NULL
  AND (SELECT count(*) FROM documents x WHERE x.numero = d.numero) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_numero ON documents(numero) WHERE numero IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_reservation_type ON documents(reservation_id, type);

-- ── Verrou : un document généré ne change plus ──────────────────────────
CREATE OR REPLACE FUNCTION documents_verrou() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.verrouille_at IS NOT NULL THEN
      RAISE EXCEPTION 'Document verrouillé : suppression impossible (utilisez l''annulation)';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.verrouille_at IS NOT NULL THEN
    -- Le contenu, l'identité et l'empreinte sont figés.
    IF NEW.type          IS DISTINCT FROM OLD.type
    OR NEW.titre         IS DISTINCT FROM OLD.titre
    OR NEW.numero        IS DISTINCT FROM OLD.numero
    OR NEW.contenu_html  IS DISTINCT FROM OLD.contenu_html
    OR NEW.donnees       IS DISTINCT FROM OLD.donnees
    OR NEW.hash_sha256   IS DISTINCT FROM OLD.hash_sha256
    OR NEW.verrouille_at IS DISTINCT FROM OLD.verrouille_at
    OR NEW.version       IS DISTINCT FROM OLD.version
    OR NEW.est_manuel    IS DISTINCT FROM OLD.est_manuel
    OR NEW.created_at    IS DISTINCT FROM OLD.created_at
    OR NEW.proprietaire_id IS DISTINCT FROM OLD.proprietaire_id
    OR NEW.locataire_id    IS DISTINCT FROM OLD.locataire_id
    THEN
      RAISE EXCEPTION 'Document verrouillé : modification impossible';
    END IF;

    -- Les liens vers d'autres tables peuvent seulement être mis à NULL
    -- (ON DELETE SET NULL d'une réservation, d'un bien ou d'un paiement supprimé).
    IF (NEW.reservation_id IS DISTINCT FROM OLD.reservation_id AND NEW.reservation_id IS NOT NULL)
    OR (NEW.logement_id    IS DISTINCT FROM OLD.logement_id    AND NEW.logement_id    IS NOT NULL)
    OR (NEW.paiement_id    IS DISTINCT FROM OLD.paiement_id    AND NEW.paiement_id    IS NOT NULL)
    THEN
      RAISE EXCEPTION 'Document verrouillé : liens non modifiables';
    END IF;

    -- Seule transition de statut permise : vers « annule » (et pas de retour).
    IF NEW.statut IS DISTINCT FROM OLD.statut AND NEW.statut <> 'annule' THEN
      RAISE EXCEPTION 'Document verrouillé : seul le statut « annulé » est possible';
    END IF;
    IF OLD.statut = 'annule' AND NEW.statut <> 'annule' THEN
      RAISE EXCEPTION 'Document annulé : définitif';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_documents_verrou ON documents;
CREATE TRIGGER trg_documents_verrou
  BEFORE UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION documents_verrou();

-- ── Journal des documents (ajout seul) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS document_evenements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type        varchar(30) NOT NULL
              CHECK (type IN ('cree', 'genere', 'telecharge', 'envoye_email', 'annule', 'verifie')),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  details     jsonb,
  ip_adresse  varchar(64),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_evenements_doc ON document_evenements(document_id, created_at);

-- Pas de modification d'une ligne du journal. La suppression reste possible
-- uniquement par cascade (un document verrouillé ne peut pas être supprimé).
CREATE OR REPLACE FUNCTION document_evenements_immuable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'document_evenements est en ajout seul';
END $$;
DROP TRIGGER IF EXISTS trg_document_evenements_immuable ON document_evenements;
CREATE TRIGGER trg_document_evenements_immuable
  BEFORE UPDATE ON document_evenements
  FOR EACH ROW EXECUTE FUNCTION document_evenements_immuable();

-- Même protection que les autres tables sensibles : le client Supabase (clés
-- anon/authenticated) n'y touche pas, seul le backend (rôle serveur) y accède.
ALTER TABLE document_evenements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON document_evenements FROM anon, authenticated;

COMMIT;

-- ── ROLLBACK (à exécuter à part, seulement si besoin) ───────────────────
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_documents_verrou ON documents;
-- DROP FUNCTION IF EXISTS documents_verrou();
-- DROP TABLE IF EXISTS document_evenements;
-- DROP FUNCTION IF EXISTS document_evenements_immuable();
-- DROP INDEX IF EXISTS idx_documents_numero;
-- DROP INDEX IF EXISTS idx_documents_reservation_type;
-- ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_statut_check;
-- ALTER TABLE documents ADD CONSTRAINT documents_statut_check CHECK (statut IN ('genere','envoye','signe','annule'));
-- ALTER TABLE documents DROP COLUMN IF EXISTS numero, DROP COLUMN IF EXISTS donnees, DROP COLUMN IF EXISTS hash_sha256,
--   DROP COLUMN IF EXISTS verrouille_at, DROP COLUMN IF EXISTS annule_at, DROP COLUMN IF EXISTS annule_motif,
--   DROP COLUMN IF EXISTS remplace_par, DROP COLUMN IF EXISTS version;
-- DROP SEQUENCE IF EXISTS documents_numero_seq;
-- COMMIT;
