-- Migration : préavis liés à un document verrouillé, avec accusé de réception daté
-- (étape 2 de la refonte des documents).
--
-- À exécuter manuellement sur la base Supabase AVANT de déployer le code
-- correspondant (routes/preavis.js, documentService.js, cronService.js).
-- Transactionnelle : tout passe ou rien.

BEGIN;

ALTER TABLE preavis
  ADD COLUMN IF NOT EXISTS document_id      uuid REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accuse_at        timestamptz,
  ADD COLUMN IF NOT EXISTS accuse_par       uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rappel_envoye_at timestamptz;

-- Un seul préavis actif (envoyé ou accusé) par location : évite les doublons
-- (double clic, deux onglets) qui créaient deux lettres contradictoires.
CREATE UNIQUE INDEX IF NOT EXISTS idx_preavis_actif_par_reservation
  ON preavis(reservation_id) WHERE statut IN ('envoye', 'accuse');

CREATE INDEX IF NOT EXISTS idx_preavis_document ON preavis(document_id);

-- Le journal des documents accepte l'accusé de réception et le rappel à 48 h.
ALTER TABLE document_evenements DROP CONSTRAINT IF EXISTS document_evenements_type_check;
ALTER TABLE document_evenements ADD CONSTRAINT document_evenements_type_check
  CHECK (type IN ('cree', 'genere', 'telecharge', 'envoye_email', 'annule', 'verifie',
                  'accuse_reception', 'rappel'));

COMMIT;

-- ── ROLLBACK (à exécuter à part, seulement si besoin) ───────────────────
-- BEGIN;
-- DROP INDEX IF EXISTS idx_preavis_actif_par_reservation;
-- DROP INDEX IF EXISTS idx_preavis_document;
-- ALTER TABLE preavis DROP COLUMN IF EXISTS document_id, DROP COLUMN IF EXISTS accuse_at,
--   DROP COLUMN IF EXISTS accuse_par, DROP COLUMN IF EXISTS rappel_envoye_at;
-- ALTER TABLE document_evenements DROP CONSTRAINT IF EXISTS document_evenements_type_check;
-- ALTER TABLE document_evenements ADD CONSTRAINT document_evenements_type_check
--   CHECK (type IN ('cree','genere','telecharge','envoye_email','annule','verifie'));
-- COMMIT;
