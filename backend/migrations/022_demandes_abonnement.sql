-- Migration 022 : demandes d'abonnement payées par Orange Money (paiement manuel).
-- Le paiement en ligne de l'abonnement n'est pas disponible. En attendant :
--   * le propriétaire paie sur le numéro Orange Money de Werdhe ;
--   * il remplit un formulaire (plan, durée, référence du paiement) → une demande « en_attente » ;
--   * un administrateur vérifie la réception puis confirme : l'abonnement est activé
--     (réutilise le paiement manuel admin : facture + abonnement) ; ou refuse avec un motif.
--
-- Additive et rejouable : une seule nouvelle table, aucune table existante modifiée.
-- Annulation en bas du fichier (commentée).

CREATE TABLE IF NOT EXISTS demandes_abonnement (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code                VARCHAR(20) NOT NULL UNIQUE,                 -- code court affiché : WRD-ABO-XXXXXX
  plan                VARCHAR(10) NOT NULL CHECK (plan IN ('pro', 'agence')),
  duree_mois          SMALLINT NOT NULL CHECK (duree_mois IN (1, 3, 6, 12)),
  montant             NUMERIC(14,0) NOT NULL CHECK (montant > 0),  -- calculé par le serveur, jamais par le client
  code_promo          VARCHAR(20),
  reference_paiement  VARCHAR(100) NOT NULL,                       -- référence / ID de transaction Orange Money
  numero_expediteur   VARCHAR(30),                                 -- numéro qui a envoyé l'argent (facultatif)
  statut              VARCHAR(12) NOT NULL DEFAULT 'en_attente'
                        CHECK (statut IN ('en_attente', 'confirmee', 'refusee', 'annulee')),
  motif_refus         TEXT,
  traite_par          UUID REFERENCES users(id) ON DELETE RESTRICT,
  traite_le           TIMESTAMP,
  facture_id          UUID REFERENCES factures_abonnements(id) ON DELETE SET NULL,
  cree_le             TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT demandes_abo_reference_non_vide CHECK (length(btrim(reference_paiement)) >= 4),
  -- Une demande traitée par un admin porte son auteur et sa date ; une demande en attente n'en porte pas.
  CONSTRAINT demandes_abo_traitement_coherent CHECK (
    (statut = 'en_attente' AND traite_par IS NULL AND traite_le IS NULL)
    OR (statut = 'annulee')
    OR (statut IN ('confirmee', 'refusee') AND traite_par IS NOT NULL AND traite_le IS NOT NULL)
  ),
  CONSTRAINT demandes_abo_refus_motif CHECK (statut <> 'refusee' OR (motif_refus IS NOT NULL AND length(btrim(motif_refus)) > 0))
);

-- Une seule demande en attente par propriétaire (évite les doublons par double clic).
CREATE UNIQUE INDEX IF NOT EXISTS uq_demandes_abo_une_en_attente
  ON demandes_abonnement(user_id) WHERE statut = 'en_attente';

-- Une même référence de paiement ne peut servir qu'une fois (hors demandes refusées/annulées,
-- pour permettre de corriger une faute de frappe).
CREATE UNIQUE INDEX IF NOT EXISTS uq_demandes_abo_reference
  ON demandes_abonnement(lower(btrim(reference_paiement))) WHERE statut IN ('en_attente', 'confirmee');

CREATE INDEX IF NOT EXISTS idx_demandes_abo_statut_date ON demandes_abonnement(statut, cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_demandes_abo_user ON demandes_abonnement(user_id, cree_le DESC);

-- Même modèle de sécurité que les autres tables : RLS activée sans politique (le backend se connecte
-- en « postgres » et contourne la RLS ; les droits sont vérifiés côté serveur).
ALTER TABLE demandes_abonnement ENABLE ROW LEVEL SECURITY;

-- ─── Annulation ─────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS demandes_abonnement;
