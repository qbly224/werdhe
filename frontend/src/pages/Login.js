/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Phone } from 'lucide-react';
import Logo from '../components/Logo';

// Photos de résidences guinéennes / africaines modernes via Unsplash
var SLIDES_LOGIN = [
  {
    img:   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=85&fit=crop',
    titre: 'Bienvenue sur Werdhe',
    sous:  'La plateforme immobilière de référence en Guinée',
  },
  {
    img:   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&fit=crop',
    titre: 'Gérez vos biens',
    sous:  'Candidatures, baux et paiements depuis un seul endroit',
  },
  {
    img:   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85&fit=crop',
    titre: 'Trouvez votre logement',
    sous:  'Des centaines de biens disponibles à Conakry et partout en Guinée',
  },
];

export default function Login() {
  var navigate  = useNavigate();
  var { login } = useAuth();
  var [email, setEmail]         = useState('');
  var [password, setPassword]   = useState('');
  var [showPwd, setShowPwd]     = useState(false);
  var [loading, setLoading]     = useState(false);
  var [erreur, setErreur]       = useState('');
  var [remember, setRemember]   = useState(false);
  var [slideActif, setSlideActif] = useState(0);
  var [compteurs, setCompteurs] = useState({ logements: 0, utilisateurs: 0, villes: 0 });

  var emailValide = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Compteurs animés
  useEffect(function() {
    var start    = Date.now();
    var duration = 2000;
    var targets  = { logements: 47, utilisateurs: 124, villes: 5 };
    var raf = requestAnimationFrame(function step() {
      var pct  = Math.min((Date.now() - start) / duration, 1);
      var ease = 1 - Math.pow(1 - pct, 3);
      setCompteurs({
        logements:    Math.round(targets.logements    * ease),
        utilisateurs: Math.round(targets.utilisateurs * ease),
        villes:       Math.round(targets.villes       * ease),
      });
      if (pct < 1) requestAnimationFrame(step);
    });
    return function() { cancelAnimationFrame(raf); };
  }, []);

  // Slideshow automatique
  useEffect(function() {
    var interval = setInterval(function() {
      setSlideActif(function(i) { return (i + 1) % SLIDES_LOGIN.length; });
    }, 6000);
    return function() { clearInterval(interval); };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setErreur('Remplissez tous les champs'); return; }
    setLoading(true);
    setErreur('');
    try {
      var res = await api.post('/auth/login', { email, mot_de_passe: password });
      if (res.data.requires_2fa) {
        toast('Code 2FA envoyé à votre email', { icon: '🔐' });
        navigate('/admin/2fa', { state: { user_id: res.data.user_id, email } });
        return;
      }
      login(res.data.user, res.data.token);
      toast.success('Bon retour ' + res.data.user.prenom + ' !');
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response && err.response.data ? err.response.data.erreur : 'Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ─── FOND PLEIN ÉCRAN (slides) ────────────────────────── */}
      {SLIDES_LOGIN.map(function(slide, i) {
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity: slideActif === i ? 1 : 0, transition: 'opacity 1.5s ease', zIndex: 0 }}>
            <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
        );
      })}

      {/* Overlay dégradé */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }} />

      {/* ─── TEXTE BAS GAUCHE ─────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 48, left: 48, zIndex: 2, maxWidth: 380 }} className="login-left-text">
        <div style={{ marginBottom: 16 }}>
          <Logo size={38} showText={true} darkBg={true} variant="gold" />
        </div>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.2, textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
          {SLIDES_LOGIN[slideActif].titre}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', lineHeight: 1.6 }}>
          {SLIDES_LOGIN[slideActif].sous}
        </p>

        {/* Compteurs */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { val: compteurs.logements + '+',    label: 'Logements'    },
            { val: compteurs.utilisateurs + '+',  label: 'Utilisateurs' },
            { val: compteurs.villes + ' villes',  label: 'Couvertes'    },
          ].map(function(s, i) {
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#F5A623' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Indicateurs slides */}
        <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {SLIDES_LOGIN.map(function(_, i) {
            return (
              <button key={i} onClick={function() { setSlideActif(i); }}
                style={{ width: slideActif === i ? 24 : 7, height: 7, borderRadius: 4, border: 'none', background: slideActif === i ? '#F5A623' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all .4s', padding: 0 }} />
            );
          })}
        </div>
      </div>

      {/* ─── FORMULAIRE FLOTTANT (droite) ─────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440, margin: '24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
        className="login-card">

        {/* Logo dans la carte */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <Logo size={36} showText={true} darkBg={false} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 4px', letterSpacing: -0.5, textAlign: 'center' }}>
          Connectez-vous
        </h1>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 22px', textAlign: 'center' }}>
          Accédez à votre espace Werdhe
        </p>

        {/* Google */}
        <button onClick={function() { window.location.href = 'https://api.werdhe.com/auth/google'; }}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#1B2B22', cursor: 'pointer', marginBottom: 8 }}>
          <svg width="17" height="17" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        <Link to="/login-telephone"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#1B2B22', textDecoration: 'none', marginBottom: 18 }}>
          <Phone size={15} strokeWidth={1.5} color="#555" /> Continuer par téléphone
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 0.5, background: '#E0E0E0' }} />
          <span style={{ fontSize: 11, color: '#bbb' }}>ou par email</span>
          <div style={{ flex: 1, height: 0.5, background: '#E0E0E0' }} />
        </div>

        {erreur && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: '#B71C1C' }}>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} color="#bbb" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="email" placeholder="vous@email.com" value={email} autoComplete="email"
                onChange={function(e) { setEmail(e.target.value); setErreur(''); }}
                style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid ' + (email.length > 0 ? (emailValide ? '#1B6B3A' : '#E53935') : '#E8E8E8'), borderRadius: 10, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'border-color .2s' }} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mot de passe</label>
              <Link to="/forgot-password" style={{ fontSize: 11, color: '#1B6B3A', textDecoration: 'none', fontWeight: 600 }}>Oublié ?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={14} color="#bbb" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="Votre mot de passe" value={password} autoComplete="current-password"
                onChange={function(e) { setPassword(e.target.value); setErreur(''); }}
                style={{ width: '100%', padding: '11px 40px 11px 36px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
              <button type="button" onClick={function() { setShowPwd(!showPwd); }}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0 }}>
                {showPwd ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <input type="checkbox" id="remember" checked={remember} onChange={function(e) { setRemember(e.target.checked); }}
              style={{ width: 15, height: 15, accentColor: '#1B6B3A', cursor: 'pointer' }} />
            <label htmlFor="remember" style={{ fontSize: 12, color: '#666', cursor: 'pointer' }}>Se souvenir de moi</label>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#aaa' : '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, boxShadow: loading ? 'none' : '0 4px 16px rgba(27,107,58,0.3)' }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Connexion...</>
              : <>Se connecter <ArrowRight size={15} strokeWidth={2.5} /></>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#888', margin: 0 }}>
          Pas encore de compte ?{' '}
          <Link to="/inscription" style={{ color: '#1B6B3A', fontWeight: 700, textDecoration: 'none' }}>Créer un compte gratuit</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) {
          .login-left-text { display: none !important; }
          .login-card { margin: 16px auto !important; max-width: calc(100% - 32px) !important; }
        }
        input:focus { border-color: #1B6B3A !important; box-shadow: 0 0 0 3px rgba(27,107,58,0.08) !important; }
        button { transition: opacity .15s, transform .1s; }
        button:hover:not(:disabled) { opacity: 0.92; }
      `}</style>
    </div>
  );
}