-- `masque` est testé dans le WHERE de CHAQUE recherche publique de
-- logements (GET /logements) et n'était pas indexé depuis sa création
-- (migration 007) : scan séquentiel systématique sur une table vouée à
-- grossir.
CREATE INDEX IF NOT EXISTS idx_logements_masque ON logements (masque);

-- `categorie` est un filtre courant de la recherche publique.
CREATE INDEX IF NOT EXISTS idx_logements_categorie ON logements (categorie);

-- `reservations.logement_id` sert de jointure (ex. admin.js, liste des
-- logements avec leur nombre de réservations) et n'était pas indexé.
CREATE INDEX IF NOT EXISTS idx_reservations_logement ON reservations (logement_id);
