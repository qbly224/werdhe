/* eslint-disable */
import { useState, useEffect } from 'react';

// Un chiffre qui "roule" mécaniquement vers sa valeur cible, comme un
// compteur kilométrique — pas un simple fade/compte, un vrai mouvement.
function OdometerDigit({ digit }) {
  return (
    <span className="odo-digit">
      <span className="odo-track" style={{ transform: 'translateY(-' + (digit * 10) + '%)' }}>
        {'0123456789'.split('').map(function(n, i) { return <span key={i} className="odo-cell">{n}</span>; })}
      </span>
    </span>
  );
}

// Nombre complet (avec séparateurs de milliers/suffixe) composé de
// chiffres-odomètre indépendants ; ils arrivent à des vitesses visuelles
// légèrement différentes selon la distance à parcourir, ce qui donne le
// petit effet mécanique "qui se cale" propre à un vrai compteur.
export default function OdometerNumber(props) {
  var value  = props.value || 0;
  var locale = props.locale || 'fr-FR';
  var [shown, setShown] = useState(0);

  useEffect(function() {
    var t = setTimeout(function() { setShown(value); }, 60);
    return function() { clearTimeout(t); };
  }, [value]);

  var formatted = new Intl.NumberFormat(locale).format(shown);
  var chars = formatted.split('');

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', fontVariantNumeric: 'tabular-nums', ...(props.style || {}) }}>
      {props.prefix}
      {chars.map(function(c, i) {
        if (c >= '0' && c <= '9') return <OdometerDigit key={i} digit={Number(c)} />;
        return <span key={i} style={{ display: 'inline-block', width: '0.32em' }}>{c}</span>;
      })}
      {props.suffix && <span style={{ marginLeft: '0.12em' }}>{props.suffix}</span>}
    </span>
  );
}
