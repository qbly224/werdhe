/* eslint-disable */
import { useState, useEffect, useRef } from 'react';

// Anime un nombre de 0 (ou de sa valeur précédente) vers `cible`,
// en easeOutCubic. Réutilisé partout où un chiffre clé (stat, prix,
// compteur de résultats) doit "compter" au lieu d'apparaître figé.
export default function useCompteurAnime(cible, duree) {
  var d = duree || 1200;
  var [valeur, setValeur] = useState(0);
  var rafRef = useRef(null);
  var departRef = useRef(0);

  useEffect(function() {
    var depart = departRef.current;
    var debut = Date.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function step() {
      var ecoule = Date.now() - debut;
      var pct = Math.min(ecoule / d, 1);
      var ease = 1 - Math.pow(1 - pct, 3);
      var v = Math.round(depart + (cible - depart) * ease);
      setValeur(v);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        departRef.current = cible;
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return function() { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cible, d]);

  return valeur;
}
