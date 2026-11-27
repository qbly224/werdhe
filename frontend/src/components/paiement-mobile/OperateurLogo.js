import { useState } from 'react';

// Logo d'un opérateur. Les logos officiels se déposent dans /public/logos/ :
//   orange-money.svg (ou .png) et mtn-momo.svg (ou .png).
// Tant qu'un fichier est absent, on affiche un carré de couleur avec les initiales.
var CONFIG = {
  orange_money: { fichier: 'orange-money', fond: '#FF6600', texte: '#fff', initiales: 'OM' },
  mtn_momo:     { fichier: 'mtn-momo',     fond: '#FFCC00', texte: '#1B2B22', initiales: 'MoMo' },
};
var EXTENSIONS = ['svg', 'png'];

export default function OperateurLogo(props) {
  var cfg = CONFIG[props.operateur] || { fichier: '', fond: '#E3E8E0', texte: '#1B2B22', initiales: '?' };
  var taille = props.taille || 44;
  var [essai, setEssai] = useState(0);
  var enSecours = !cfg.fichier || essai >= EXTENSIONS.length;

  if (enSecours) {
    return (
      <span className="pm-logo pm-logo--secours" aria-hidden="true"
        style={{ width: taille, height: taille, background: cfg.fond, color: cfg.texte, fontSize: taille * 0.3 }}>
        {cfg.initiales}
      </span>
    );
  }
  return (
    <img className="pm-logo" src={'/logos/' + cfg.fichier + '.' + EXTENSIONS[essai]} alt="" aria-hidden="true"
      width={taille} height={taille} style={{ width: taille, height: taille }}
      onError={function() { setEssai(essai + 1); }} />
  );
}
