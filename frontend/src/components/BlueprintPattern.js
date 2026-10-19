/* eslint-disable */
// Texture "plan architectural" réutilisable : grille fine façon plan de
// masse, pour habiller les fonds sombres/clairs d'une identité immobilière
// au lieu d'un simple aplat de couleur.
export default function BlueprintPattern({ opacity = 0.05, color = '#F5A623', size = 64, id }) {
  var patternId = 'blueprint-' + (id || size + '-' + opacity);
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
          <path d={'M' + size + ' 0 L0 0 0 ' + size} fill="none" stroke={color} strokeWidth="0.75" opacity={opacity} />
          <circle cx="0" cy="0" r="1.4" fill={color} opacity={opacity * 1.8} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={'url(#' + patternId + ')'} />
    </svg>
  );
}

// Motif décoratif "plan d'étage" — porte en arc + quelques traits de cloison,
// pour les coins de hero plutôt qu'un plein pavage. Remplace avantageusement
// les émojis/illustrations génériques.
export function PlanMasseMotif({ opacity = 0.12, color = '#F5A623', width = 260, height = 220, style }) {
  return (
    <svg width={width} height={height} viewBox="0 0 260 220" fill="none" style={style} aria-hidden="true">
      <g opacity={opacity} stroke={color} strokeWidth="1.4">
        <rect x="10" y="10" width="110" height="90" rx="2" />
        <rect x="130" y="10" width="120" height="60" rx="2" />
        <rect x="10" y="110" width="70" height="100" rx="2" />
        <rect x="90" y="130" width="160" height="80" rx="2" />
        {/* portes en arc */}
        <path d="M120 60 A 20 20 0 0 1 120 100" strokeDasharray="3 3" />
        <path d="M80 160 A 24 24 0 0 0 80 208" strokeDasharray="3 3" />
        {/* cotations */}
        <line x1="10" y1="104" x2="120" y2="104" strokeWidth="0.6" />
        <line x1="130" y1="76" x2="250" y2="76" strokeWidth="0.6" />
      </g>
    </svg>
  );
}
