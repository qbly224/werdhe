/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';

var SUGGESTIONS = [
  { icon: '🏠', label: 'Logements disponibles', path: '/logements' },
  { icon: '💳', label: 'Voir les tarifs',        path: '/pricing'   },
  { icon: '📞', label: 'Nous contacter',         path: '/contact'   },
];

export default function NotFound() {
  var navigate  = useNavigate();
  var location  = useLocation();
  var [compte, setCompte] = useState(10);

  // Compte à rebours → redirection auto
  useEffect(function() {
    if (compte <= 0) {
      navigate('/');
      return;
    }
    var t = setTimeout(function() { setCompte(compte - 1); }, 1000);
    return function() { clearTimeout(t); };
  }, [compte]);

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F1A12 0%, #1B2B22 50%, #1B6B3A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <SEO titre="Page non trouvée" noIndex={true} />

      {/* Cercles décoratifs */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(27,107,58,0.15)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -150, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(245,166,35,0.08)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 40, height: 40, background: '#1B6B3A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Home size={20} color="#fff" strokeWidth={2} />
        </div>
        <span style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: -0.5 }}>Werdhe</span>
      </div>

      {/* 404 géant */}
      <div style={{ position: 'relative', marginBottom: 24, zIndex: 1 }}>
        <div style={{
          fontSize: 'clamp(80px, 20vw, 160px)',
          fontWeight: 900,
          color: 'transparent',
          WebkitTextStroke: '2px rgba(255,255,255,0.15)',
          letterSpacing: -8,
          lineHeight: 1,
          userSelect: 'none',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap'
        }}>
          404
        </div>
        <div style={{ width: 140, height: 140, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <div style={{ fontSize: 60 }}>🏚️</div>
        </div>
      </div>

      {/* Texte principal */}
      <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: -0.5, position: 'relative', zIndex: 1 }}>
        Cette page n'existe pas
      </h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px', maxWidth: 420, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
        La page <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6, fontSize: 13, color: '#F5A623' }}>{location.pathname}</code> est introuvable.
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '0 0 36px', position: 'relative', zIndex: 1 }}>
        Redirection automatique dans <span style={{ color: '#F5A623', fontWeight: 700 }}>{compte}s</span>
      </p>

      {/* Boutons principaux */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <button onClick={function() { navigate(-1); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
          <ArrowLeft size={16} strokeWidth={2} /> Retour
        </button>
        <button onClick={function() { navigate('/'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={function(e) { e.currentTarget.style.background = '#134F2B'; }}
          onMouseLeave={function(e) { e.currentTarget.style.background = '#1B6B3A'; }}>
          <Home size={16} strokeWidth={2} /> Accueil
        </button>
        <button onClick={function() { navigate('/logements'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, border: 'none', background: '#F5A623', color: '#1B2B22', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={function(e) { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={function(e) { e.currentTarget.style.opacity = '1'; }}>
          <Search size={16} strokeWidth={2} /> Chercher un logement
        </button>
      </div>

      {/* Suggestions */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Pages utiles
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SUGGESTIONS.map(function(s, i) {
            return (
              <Link key={i} to={s.path}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'all .2s' }}
                onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>→</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #1B6B3A, #F5A623)',
          width: ((10 - compte) / 10 * 100) + '%',
          transition: 'width 1s linear'
        }} />
      </div>
    </div>
  );
}