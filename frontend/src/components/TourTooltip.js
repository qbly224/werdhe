/* eslint-disable */
import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

export default function TourTooltip({ actif, etapeActuelle, etape, totalEtapes, suivant, passer, terminer }) {
  var [pos, setPos] = useState({ top: 0, left: 0 });
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    if (!actif || !etapeActuelle) { setVisible(false); return; }

    function calculerPosition() {
      var cible = document.querySelector(etapeActuelle.cible);
      if (!cible) {
        // Élément non trouvé — centrer
        setPos({ top: '50%', left: '50%', center: true });
        setVisible(true);
        return;
      }

      var rect    = cible.getBoundingClientRect();
      var padding = 12;
      var pos     = etapeActuelle.position || 'bottom';
      var newPos  = {};

      if (pos === 'bottom') {
        newPos = { top: rect.bottom + padding, left: rect.left + rect.width / 2, anchor: 'top-center' };
      } else if (pos === 'top') {
        newPos = { top: rect.top - padding, left: rect.left + rect.width / 2, anchor: 'bottom-center' };
      } else if (pos === 'right') {
        newPos = { top: rect.top + rect.height / 2, left: rect.right + padding, anchor: 'left-center' };
      } else if (pos === 'left') {
        newPos = { top: rect.top + rect.height / 2, left: rect.left - padding, anchor: 'right-center' };
      }

      setPos(newPos);
      setVisible(true);

      // Scroller vers l'élément
      cible.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    var t = setTimeout(calculerPosition, 100);
    window.addEventListener('resize', calculerPosition);
    return function() { clearTimeout(t); window.removeEventListener('resize', calculerPosition); };
  }, [actif, etapeActuelle]);

  if (!actif || !etapeActuelle || !visible) return null;

  // Calculer la transformation selon l'ancrage
  var transform = 'translate(-50%, 0)';
  if (pos.anchor === 'bottom-center') transform = 'translate(-50%, -100%)';
  if (pos.anchor === 'left-center')   transform = 'translate(0, -50%)';
  if (pos.anchor === 'right-center')  transform = 'translate(-100%, -50%)';
  if (pos.center) transform = 'translate(-50%, -50%)';

  return (
    <>
      {/* Overlay semi-transparent */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9990, pointerEvents: 'none' }} />

      {/* Spotlight sur l'élément cible */}
      <SpotlightElement cible={etapeActuelle.cible} />

      {/* Tooltip */}
      <div style={{
        position: 'fixed',
        top:      pos.top,
        left:     pos.left,
        transform: transform,
        zIndex:   9999,
        background: '#fff',
        borderRadius: 16,
        padding: '20px 22px',
        maxWidth: 300,
        boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
        border: '2px solid #1B6B3A',
        animation: 'fadeInUp 0.2s ease-out',
      }}>
        {/* Progression */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalEtapes }).map(function(_, i) {
              return (
                <div key={i} style={{ width: i === etape ? 18 : 6, height: 6, borderRadius: 3, background: i === etape ? '#1B6B3A' : '#E0E0E0', transition: 'all .3s' }} />
              );
            })}
          </div>
          <button onClick={passer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 2, display: 'flex', alignItems: 'center' }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Contenu */}
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1B2B22', margin: '0 0 8px' }}>
          {etapeActuelle.titre}
        </h3>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: '0 0 18px' }}>
          {etapeActuelle.desc}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={passer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#aaa', padding: 0 }}>
            Passer le tutoriel
          </button>
          <button onClick={suivant}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {etape === totalEtapes - 1 ? 'Terminer' : 'Suivant'}
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
}

function SpotlightElement({ cible }) {
  var [rect, setRect] = useState(null);

  useEffect(function() {
    var el = document.querySelector(cible);
    if (!el) return;
    var r = el.getBoundingClientRect();
    setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
  }, [cible]);

  if (!rect) return null;

  return (
    <div style={{
      position: 'fixed',
      top:    rect.top,
      left:   rect.left,
      width:  rect.width,
      height: rect.height,
      borderRadius: 12,
      zIndex: 9991,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
      border: '2px solid #1B6B3A',
      pointerEvents: 'none',
      transition: 'all .3s ease',
    }} />
  );
}