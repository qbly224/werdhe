-- Intégration Djomy (agrégateur Orange Money / MTN MoMo / Kulu / carte)
-- en remplacement des intégrations directes Orange/MTN du loyer et de la
-- simulation USSD de l'abonnement. On ajoute 'djomy' à la contrainte
-- existante sans retirer les anciennes valeurs (lignes historiques).
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_mode_paiement_check;
ALTER TABLE paiements ADD CONSTRAINT paiements_mode_paiement_check
  CHECK (mode_paiement IN ('en_ligne', 'especes', 'orange_money', 'mtn_momo', 'djomy'));
