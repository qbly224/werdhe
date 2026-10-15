/* eslint-disable */
export default function Logo({ size = 32, showText = true, darkBg = false, variant = 'default' }) {
  var s = size;
  var gold   = '#F5A623';
  var dark   = '#0F1E14';
  var green  = '#1B6B3A';
  var iconBg = variant === 'gold' ? gold : dark;
  var iconFg = variant === 'gold' ? dark : gold;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(s * 0.3) }}>
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill={iconBg} />
        <polygon points="10,38 10,23 24,11 38,23 38,38" fill="none" stroke={iconFg} strokeWidth="2.8" strokeLinejoin="round" />
        <rect x="19" y="26" width="10" height="12" rx="1.5" fill={iconFg} />
        <circle cx="36" cy="13" r="5" fill="none" stroke={iconFg} strokeWidth="2.2" />
        <circle cx="36" cy="13" r="1.8" fill={iconFg} />
        <line x1="36" y1="18" x2="36" y2="26" stroke={iconFg} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="36" y1="21.5" x2="40" y2="21.5" stroke={iconFg} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="36" y1="25" x2="40" y2="25" stroke={iconFg} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="6" y1="44" x2="42" y2="44" stroke={green} strokeWidth="3" strokeLinecap="round" />
      </svg>
      {showText && (
        <span style={{ fontWeight: 800, fontSize: Math.round(s * 0.55), color: darkBg ? '#fff' : '#14251A', letterSpacing: -0.5 }}>
          Werdhe
        </span>
      )}
    </div>
  );
}