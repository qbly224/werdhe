-- La colonne `masque` est référencée depuis le PR #22 (masquage manuel
-- d'une annonce par l'admin) par GET /logements, GET/PATCH
-- /admin/logements/:id/masquer et getLogement, mais n'avait jamais été
-- réellement créée en base — toute recherche publique de logements
-- échouait donc avec une erreur SQL ("column l.masque does not exist"),
-- silencieusement renvoyée comme une liste vide côté frontend.
ALTER TABLE logements
  ADD COLUMN IF NOT EXISTS masque BOOLEAN DEFAULT FALSE;
