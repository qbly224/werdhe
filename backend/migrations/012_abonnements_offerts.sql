-- Migration : abonnements offerts, paiements manuels et historique des actions admin.
--
-- À exécuter manuellement sur la base Supabase (SQL editor) AVANT de déployer
-- le code qui utilise ces colonnes. Transactionnelle : tout passe ou rien.
-- Retour arrière : voir le bloc ROLLBACK en bas de fichier.

BEGIN;

-- ── 1. Un seul abonnement par propriétaire ──────────────────────────────
-- (l'état « offert » ne doit jamais être ambigu entre plusieurs lignes)
CREATE UNIQUE INDEX IF NOT EXISTS uq_abonnements_user ON abonnements(user_id);

-- ── 2. Source de l'abonnement et offre ───────────────────────────────────
ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS source                  varchar(10) NOT NULL DEFAULT 'paye',
  ADD COLUMN IF NOT EXISTS offert_jusqu_au         date,                 -- NULL = illimité
  ADD COLUMN IF NOT EXISTS offert_motif            varchar(20),
  ADD COLUMN IF NOT EXISTS offert_par              uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS offert_rappel_j7_envoye boolean NOT NULL DEFAULT false;

UPDATE abonnements SET source = 'essai' WHERE statut = 'essai';

ALTER TABLE abonnements
  ADD CONSTRAINT abonnements_source_check
    CHECK (source IN ('paye', 'essai', 'offert')),
  ADD CONSTRAINT abonnements_offert_motif_check
    CHECK (offert_motif IN ('collaborateur', 'partenaire', 'pilote', 'geste_commercial')),
  ADD CONSTRAINT abonnements_offert_coherence CHECK (
    (source = 'offert' AND plan <> 'gratuit' AND offert_motif IS NOT NULL AND offert_par IS NOT NULL)
    OR
    (source <> 'offert' AND offert_motif IS NULL AND offert_par IS NULL AND offert_jusqu_au IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_abonnements_offerts_fin
  ON abonnements(offert_jusqu_au) WHERE source = 'offert';

-- ── 3. Factures : paiements enregistrés à la main par un admin ──────────
ALTER TABLE factures_abonnements
  ADD COLUMN IF NOT EXISTS origine        varchar(10) NOT NULL DEFAULT 'en_ligne',
  ADD COLUMN IF NOT EXISTS enregistre_par uuid REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE factures_abonnements
  ADD CONSTRAINT factures_origine_check
    CHECK (origine IN ('en_ligne', 'manuel')),
  ADD CONSTRAINT factures_manuel_coherence CHECK (
    origine <> 'manuel'
    OR (enregistre_par IS NOT NULL
        AND operateur IN ('orange_money', 'mtn_momo', 'especes', 'virement'))
  );

-- Empêche d'enregistrer deux fois le même paiement (double clic, double saisie)
CREATE UNIQUE INDEX IF NOT EXISTS uq_factures_reference_externe
  ON factures_abonnements(reference_externe) WHERE reference_externe IS NOT NULL;

-- ── 4. Historique des actions admin (ajout seul) ────────────────────────
CREATE TABLE IF NOT EXISTS admin_actions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id             uuid REFERENCES users(id) ON DELETE RESTRICT,   -- NULL = système (expiration auto)
  cible_id             uuid NOT NULL,                                  -- sans FK : la trace survit à la suppression du compte
  action               varchar(30) NOT NULL
                         CHECK (action IN ('changer_plan', 'offrir', 'revoquer', 'paiement_manuel', 'expiration_auto')),
  ancien_etat          jsonb NOT NULL,
  nouvel_etat          jsonb NOT NULL,
  motif                text,                                           -- interne, jamais envoyé au propriétaire
  message_proprietaire text,                                           -- texte envoyé par e-mail, conservé pour trace
  created_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (admin_id IS NOT NULL OR action = 'expiration_auto')
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_cible ON admin_actions(cible_id, created_at DESC);

CREATE OR REPLACE FUNCTION admin_actions_immuable() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'admin_actions est en ajout seul';
END $$;

DROP TRIGGER IF EXISTS trg_admin_actions_immuable ON admin_actions;
CREATE TRIGGER trg_admin_actions_immuable
  BEFORE UPDATE OR DELETE ON admin_actions
  FOR EACH ROW EXECUTE FUNCTION admin_actions_immuable();

-- ── 5. RLS : aucune écriture possible depuis l'API Supabase publique ────
-- Le backend se connecte avec le rôle postgres (qui contourne le RLS) et les
-- utilisateurs ont leur propre JWT, pas Supabase Auth : auth.uid() ne
-- correspond à aucune ligne. On verrouille donc l'écriture pour anon et
-- authenticated ; la vraie protection reste côté serveur (routes admin).
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY abonnements_no_insert ON abonnements AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY abonnements_no_update ON abonnements AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY abonnements_no_delete ON abonnements AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY factures_abo_no_insert ON factures_abonnements AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY factures_abo_no_update ON factures_abonnements AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY factures_abo_no_delete ON factures_abonnements AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

REVOKE INSERT, UPDATE, DELETE ON abonnements, factures_abonnements FROM anon, authenticated;
REVOKE ALL ON admin_actions FROM anon, authenticated;

COMMIT;

-- ── ROLLBACK (à exécuter à part, seulement si besoin) ───────────────────
-- BEGIN;
-- DROP TABLE IF EXISTS admin_actions;
-- DROP FUNCTION IF EXISTS admin_actions_immuable();
-- DROP POLICY IF EXISTS abonnements_no_insert ON abonnements;
-- DROP POLICY IF EXISTS abonnements_no_update ON abonnements;
-- DROP POLICY IF EXISTS abonnements_no_delete ON abonnements;
-- DROP POLICY IF EXISTS factures_abo_no_insert ON factures_abonnements;
-- DROP POLICY IF EXISTS factures_abo_no_update ON factures_abonnements;
-- DROP POLICY IF EXISTS factures_abo_no_delete ON factures_abonnements;
-- DROP INDEX IF EXISTS uq_factures_reference_externe;
-- ALTER TABLE factures_abonnements DROP CONSTRAINT IF EXISTS factures_manuel_coherence, DROP CONSTRAINT IF EXISTS factures_origine_check,
--   DROP COLUMN IF EXISTS enregistre_par, DROP COLUMN IF EXISTS origine;
-- DROP INDEX IF EXISTS idx_abonnements_offerts_fin;
-- ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_offert_coherence, DROP CONSTRAINT IF EXISTS abonnements_offert_motif_check,
--   DROP CONSTRAINT IF EXISTS abonnements_source_check, DROP COLUMN IF EXISTS offert_rappel_j7_envoye, DROP COLUMN IF EXISTS offert_par,
--   DROP COLUMN IF EXISTS offert_motif, DROP COLUMN IF EXISTS offert_jusqu_au, DROP COLUMN IF EXISTS source;
-- DROP INDEX IF EXISTS uq_abonnements_user;
-- COMMIT;
