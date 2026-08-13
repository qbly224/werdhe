/* eslint-disable */
export default function Logo({ size = 32, showText = true, darkBg = false, variant = 'default' }) {
  var s = size;
  var gold   = '#F5A623';
  var dark   = '#14251A';
  var iconBg = variant === 'gold' ? gold : dark;
  var iconFg = variant === 'gold' ? dark : gold;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(s * 0.3) }}>
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="13" fill={iconBg} />
        <path d="M18 14 L24 9 L30 14 L30 20 L18 20 Z" fill={iconFg} />
        <rect x="22.5" y="20" width="3" height="16" rx="1" fill={iconFg} />
        <rect x="22.5" y="28" width="7" height="3" rx="1" fill={iconFg} />
        <rect x="22.5" y="33" width="5" height="3" rx="1" fill={iconFg} />
      </svg>
      {showText && (
        <span style={{ fontWeight: 800, fontSize: Math.round(s * 0.55), color: darkBg ? '#fff' : '#14251A', letterSpacing: -0.5 }}>
          Werdhe
        </span>
      )}
    </div>
  );
}