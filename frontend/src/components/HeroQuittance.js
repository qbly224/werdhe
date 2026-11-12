import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import './HeroQuittance.css';

var PREFIX = 'landingPage.heroDoc.';
var SIGNATURE = 'M4 28 C 14 4, 22 3, 24 20 S 32 32, 42 16 S 54 5, 58 21 S 68 32, 80 14 C 86 7, 94 11, 90 21 S 104 32, 114 12';

// Motif de QR décoratif (pseudo-aléatoire fixe, ce n'est pas un vrai code).
function motifQr() {
  var seed = 7, rects = [];
  for (var y = 0; y < 21; y++) {
    for (var x = 0; x < 21; x++) {
      var coin = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      var on;
      if (coin) {
        var fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y;
        on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      } else {
        seed = (seed * 9301 + 49297) % 233280;
        on = seed / 233280 > 0.5;
      }
      if (on) rects.push(<rect key={x + '-' + y} x={x} y={y} width="1" height="1" fill="#1B2B22" />);
    }
  }
  return rects;
}
var QR = motifQr();

// Illustration décorative du héros (grands écrans) : exemple de quittance qui se signe et se verrouille.
export default function HeroQuittance() {
  var t = useTranslation('public').t;
  return (
    <div className="hq" aria-hidden="true">
      <div className="hq-card">
        <div className="hq-head">
          <div><div className="hq-titre">{t(PREFIX + 'titre')}</div><div className="hq-num">QIT-2026-100482</div></div>
          <span className="hq-ex">{t(PREFIX + 'exemple')}</span>
        </div>
        <div className="hq-row hq-r1"><span>{t(PREFIX + 'locataire')}</span><b>Mamadou Diallo</b></div>
        <div className="hq-row hq-r2"><span>{t(PREFIX + 'logement')}</span><b>{t(PREFIX + 'valLogement')}</b></div>
        <div className="hq-row hq-r3 total"><span>{t(PREFIX + 'loyer')}</span><b>{t(PREFIX + 'valLoyer')}</b></div>
        <div className="hq-zone">
          <div>
            <svg className="hq-sig" viewBox="0 0 118 40"><path d={SIGNATURE} /></svg>
            <div className="hq-lbl">{t(PREFIX + 'signature')}</div>
          </div>
          <svg className="hq-qr" viewBox="0 0 21 21">{QR}</svg>
          <div className="hq-stamp"><Lock size={12} strokeWidth={2.4} />{t(PREFIX + 'signe')}</div>
        </div>
      </div>
    </div>
  );
}
