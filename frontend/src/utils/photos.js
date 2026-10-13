// Les photos d'un logement sont stockées en JSONB et peuvent contenir un
// mélange d'anciennes entrées (chaîne d'URL brute) et de nouvelles entrées
// (objet { url, public_id }). Cette fonction normalise les deux formats.
export function urlPremierePhoto(photos) {
  if (!photos || photos.length === 0) return null;
  var p = photos[0];
  if (typeof p === 'string') return p;
  return (p && p.url) || null;
}
