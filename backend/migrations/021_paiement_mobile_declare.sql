-- Migration 021 : paiement mobile « déclaré » (Orange Money / MTN Mobile Money).
-- Le paiement mobile automatique n'est pas encore intégré. En attendant :
--   * le propriétaire choisit les opérateurs qu'il accepte et son numéro de réception ;
--   * le locataire déclare un paiement mobile (code de transaction obligatoire) ;
--   * le propriétaire confirme ou conteste la déclaration.
-- Un paiement « declare » n'est JAMAIS compté comme payé : seul « confirme » l'est
-- (le code applicatif doit donc compter 'complete' ET 'confirme' comme payés).
--
-- Additive et rejouable : aucune colonne ni donnée existante n'est modifiée ;
-- les deux contraintes CHECK remplacées (mode_paiement, statut, alertes.type) sont élargies,
-- jamais restreintes. Un script d'annulation se trouve en bas du fichier (commenté).

-- ─── 1. Paramètres de paiement du propriétaire ─────────────────────────────
-- Table séparée de « users » (qui porte le mot de passe haché) : jamais renvoyée par un SELECT * d'utilisateur.
-- Clé = propriétaire effectif (le compte agence pour ses membres d'équipe).
CREATE TABLE IF NOT EXISTS parametres_paiement_proprietaire (
  proprietaire_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  orange_money_actif   BOOLEAN NOT NULL DEFAULT FALSE,
  orange_money_numero  VARCHAR(9),
  mtn_momo_actif       BOOLEAN NOT NULL DEFAULT FALSE,
  mtn_momo_numero      VARCHAR(9),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Numéro guinéen : 9 chiffres commençant par 6 (la même règle est validée côté serveur).
  CONSTRAINT ppp_orange_numero_format CHECK (orange_money_numero IS NULL OR orange_money_numero ~ '^6[0-9]{8}$'),
  CONSTRAINT ppp_mtn_numero_format    CHECK (mtn_momo_numero IS NULL OR mtn_momo_numero ~ '^6[0-9]{8}$'),
  -- Un opérateur actif exige un numéro valide.
  CONSTRAINT ppp_orange_actif_numero  CHECK (NOT orange_money_actif OR orange_money_numero IS NOT NULL),
  CONSTRAINT ppp_mtn_actif_numero     CHECK (NOT mtn_momo_actif OR mtn_momo_numero IS NOT NULL)
);
ALTER TABLE parametres_paiement_proprietaire ENABLE ROW LEVEL SECURITY;

-- ─── 2. Paiements : méthode, statuts et champs de la déclaration ───────────
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_mode_paiement_check;
ALTER TABLE paiements ADD CONSTRAINT paiements_mode_paiement_check
  CHECK (mode_paiement::text = ANY (ARRAY[
    'en_ligne', 'especes', 'orange_money', 'mtn_momo', 'djomy', 'mobile_money_declare'
  ]::text[]));

ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_statut_check;
ALTER TABLE paiements ADD CONSTRAINT paiements_statut_check
  CHECK (statut::text = ANY (ARRAY[
    'en_attente', 'complete', 'echoue', 'declare', 'confirme', 'conteste'
  ]::text[]));

ALTER TABLE paiements ADD COLUMN IF NOT EXISTS operateur             VARCHAR(20);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS code_transaction      VARCHAR(40);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS capture_url           TEXT;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS nb_mois               SMALLINT;
-- Premier mois couvert (1er du mois). Le paiement couvre [periode_debut, periode_debut + nb_mois mois[.
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS periode_debut         DATE;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS declare_le            TIMESTAMP;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS decide_le             TIMESTAMP;
-- Renseigné quand la quittance est partie par e-mail : l'annulation d'une confirmation n'est plus permise.
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS quittance_envoyee_le  TIMESTAMP;

ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_operateur_check;
ALTER TABLE paiements ADD CONSTRAINT paiements_operateur_check
  CHECK (operateur IS NULL OR operateur IN ('orange_money', 'mtn_momo'));

ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_nb_mois_check;
ALTER TABLE paiements ADD CONSTRAINT paiements_nb_mois_check
  CHECK (nb_mois IS NULL OR nb_mois BETWEEN 1 AND 3);

-- Les captures sont déposées sur Cloudinary : aucune autre origine n'est acceptée.
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_capture_url_check;
ALTER TABLE paiements ADD CONSTRAINT paiements_capture_url_check
  CHECK (capture_url IS NULL OR capture_url ~ '^https://res\.cloudinary\.com/');

-- Une déclaration est complète : opérateur, code de transaction, nombre de mois, période.
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_declaration_complete;
ALTER TABLE paiements ADD CONSTRAINT paiements_declaration_complete
  CHECK (mode_paiement::text <> 'mobile_money_declare' OR (
    operateur IS NOT NULL
    AND code_transaction IS NOT NULL AND char_length(btrim(code_transaction)) BETWEEN 4 AND 40
    AND nb_mois IS NOT NULL
    AND periode_debut IS NOT NULL
  ));

-- Les statuts déclaratifs n'existent que pour cette méthode, et cette méthode n'a que ces statuts.
-- Les autres méthodes gardent exactement leurs statuts actuels.
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_statuts_declaratifs;
ALTER TABLE paiements ADD CONSTRAINT paiements_statuts_declaratifs
  CHECK ((statut::text IN ('declare', 'confirme', 'conteste')) = (mode_paiement::text = 'mobile_money_declare'));

-- Doublon : même bail + même code de transaction (insensible à la casse et aux espaces de bord).
CREATE UNIQUE INDEX IF NOT EXISTS idx_paiements_declaration_doublon
  ON paiements (reservation_id, upper(btrim(code_transaction)))
  WHERE mode_paiement = 'mobile_money_declare';

-- Bloc « À vérifier » du propriétaire.
CREATE INDEX IF NOT EXISTS idx_paiements_a_verifier
  ON paiements (proprietaire_id, created_at DESC)
  WHERE statut = 'declare';

-- Relances (CRON) : y a-t-il une déclaration pour cette période ?
CREATE INDEX IF NOT EXISTS idx_paiements_declaration_periode
  ON paiements (reservation_id, periode_debut)
  WHERE mode_paiement = 'mobile_money_declare';

-- ─── 3. Garde-fous au niveau base (valables quel que soit le rôle de connexion) ─
-- Les utilisateurs de Werdhe ne sont pas des comptes Supabase Auth : les droits « qui peut faire quoi »
-- sont appliqués par l'API. Ce déclencheur garantit en plus, dans la base elle-même, que :
--   * une déclaration naît au statut « declare », pour le vrai locataire du bail et le vrai propriétaire du bien,
--     avec un montant = loyer mensuel × nb_mois ;
--   * une fois envoyée, ses champs ne changent plus ;
--   * seules les transitions prévues sont possibles.
CREATE OR REPLACE FUNCTION paiements_garde_declaration() RETURNS trigger AS $$
DECLARE
  v_loc UUID; v_prop UUID; v_loyer NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.mode_paiement::text <> 'mobile_money_declare' THEN RETURN NEW; END IF;
    IF NEW.statut::text <> 'declare' THEN
      RAISE EXCEPTION 'Une déclaration de paiement naît au statut declare' USING ERRCODE = 'check_violation';
    END IF;
    SELECT r.locataire_id, l.proprietaire_id, r.montant_total
      INTO v_loc, v_prop, v_loyer
      FROM reservations r JOIN logements l ON l.id = r.logement_id
     WHERE r.id = NEW.reservation_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Bail introuvable pour cette déclaration' USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF NEW.locataire_id IS DISTINCT FROM v_loc OR NEW.proprietaire_id IS DISTINCT FROM v_prop THEN
      RAISE EXCEPTION 'La déclaration doit porter sur le bail du locataire et le bien du propriétaire concernés'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.montant IS DISTINCT FROM v_loyer * NEW.nb_mois THEN
      RAISE EXCEPTION 'Montant incohérent : il doit valoir le loyer mensuel x nombre de mois'
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.declare_le := COALESCE(NEW.declare_le, NOW());
    NEW.decide_le := NULL;
    NEW.quittance_envoyee_le := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF OLD.mode_paiement::text <> 'mobile_money_declare' AND NEW.mode_paiement::text <> 'mobile_money_declare' THEN
    RETURN NEW;
  END IF;
  IF OLD.mode_paiement IS DISTINCT FROM NEW.mode_paiement THEN
    RAISE EXCEPTION 'La méthode d''un paiement ne change pas' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.reservation_id IS DISTINCT FROM OLD.reservation_id
     OR NEW.locataire_id IS DISTINCT FROM OLD.locataire_id
     OR NEW.proprietaire_id IS DISTINCT FROM OLD.proprietaire_id
     OR NEW.montant IS DISTINCT FROM OLD.montant
     OR NEW.operateur IS DISTINCT FROM OLD.operateur
     OR NEW.code_transaction IS DISTINCT FROM OLD.code_transaction
     OR NEW.capture_url IS DISTINCT FROM OLD.capture_url
     OR NEW.nb_mois IS DISTINCT FROM OLD.nb_mois
     OR NEW.periode_debut IS DISTINCT FROM OLD.periode_debut
     OR NEW.declare_le IS DISTINCT FROM OLD.declare_le THEN
    RAISE EXCEPTION 'Une déclaration envoyée ne peut plus être modifiée' USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.statut IS DISTINCT FROM OLD.statut THEN
    IF NOT (
      (OLD.statut = 'declare'  AND NEW.statut IN ('confirme', 'conteste'))
      OR (OLD.statut = 'conteste' AND NEW.statut IN ('declare', 'confirme'))
      OR (OLD.statut = 'confirme' AND NEW.statut = 'declare' AND OLD.quittance_envoyee_le IS NULL)
    ) THEN
      RAISE EXCEPTION 'Transition de statut interdite : % -> %', OLD.statut, NEW.statut
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.decide_le := CASE WHEN NEW.statut = 'declare' THEN NULL ELSE NOW() END;
  END IF;

  IF OLD.quittance_envoyee_le IS NOT NULL AND NEW.quittance_envoyee_le IS NULL THEN
    RAISE EXCEPTION 'La quittance est déjà partie : cette confirmation est définitive' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.quittance_envoyee_le IS NOT NULL AND NEW.statut::text <> 'confirme' THEN
    RAISE EXCEPTION 'Une quittance ne part que pour un paiement confirmé' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paiements_garde_declaration ON paiements;
CREATE TRIGGER trg_paiements_garde_declaration
  BEFORE INSERT OR UPDATE ON paiements
  FOR EACH ROW EXECUTE FUNCTION paiements_garde_declaration();

-- ─── 4. « Me prévenir quand c'est disponible » ─────────────────────────────
CREATE TABLE IF NOT EXISTS paiement_mobile_attente (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operateur   VARCHAR(20) NOT NULL CHECK (operateur IN ('orange_money', 'mtn_momo')),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT paiement_mobile_attente_unique UNIQUE (user_id, operateur)
);
ALTER TABLE paiement_mobile_attente ENABLE ROW LEVEL SECURITY;

-- ─── 5. Notifications in-app (table alertes) ───────────────────────────────
ALTER TABLE alertes DROP CONSTRAINT IF EXISTS alertes_type_check;
ALTER TABLE alertes ADD CONSTRAINT alertes_type_check
  CHECK (type::text = ANY (ARRAY[
    'loyer_retard', 'bail_expire', 'bail_bientot', 'panne', 'autre',
    'paiement_declare', 'paiement_confirme', 'paiement_conteste'
  ]::text[]));

-- ─── Annulation (à n'utiliser qu'avant tout usage réel) ────────────────────
-- DROP TRIGGER IF EXISTS trg_paiements_garde_declaration ON paiements;
-- DROP FUNCTION IF EXISTS paiements_garde_declaration();
-- DROP INDEX IF EXISTS idx_paiements_declaration_doublon, idx_paiements_a_verifier, idx_paiements_declaration_periode;
-- ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_statuts_declaratifs, DROP CONSTRAINT IF EXISTS paiements_declaration_complete,
--   DROP CONSTRAINT IF EXISTS paiements_capture_url_check, DROP CONSTRAINT IF EXISTS paiements_nb_mois_check, DROP CONSTRAINT IF EXISTS paiements_operateur_check;
-- ALTER TABLE paiements DROP COLUMN IF EXISTS operateur, DROP COLUMN IF EXISTS code_transaction, DROP COLUMN IF EXISTS capture_url,
--   DROP COLUMN IF EXISTS nb_mois, DROP COLUMN IF EXISTS periode_debut, DROP COLUMN IF EXISTS declare_le,
--   DROP COLUMN IF EXISTS decide_le, DROP COLUMN IF EXISTS quittance_envoyee_le;
-- (puis recréer paiements_mode_paiement_check / paiements_statut_check / alertes_type_check avec leurs anciennes listes,
--  après avoir supprimé les lignes mode_paiement = 'mobile_money_declare')
-- DROP TABLE IF EXISTS paiement_mobile_attente, parametres_paiement_proprietaire;
