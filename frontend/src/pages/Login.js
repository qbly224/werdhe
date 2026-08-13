/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Phone } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
  var navigate  = useNavigate();
  var { login } = useAuth();
  var [email, setEmail]       = useState('');
  var [password, setPassword] = useState('');
  var [showPwd, setShowPwd]   = useState(false);
  var [loading, setLoading]   = useState(false);
  var [erreur, setErreur]     = useState('');
  var [remember, setRemember] = useState(false);
  var [compteurs, setCompteurs] = useState({ logements: 0, utilisateurs: 0, villes: 0 });

  var emailValide = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>

      {/* ─── PANNEAU GAUCHE — image fond Guinée ─────────────────── */}
      <div className="login-panel-left" style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>

        {/* Photo fond */}
        <img src="/accueil.jpg" alt="Guinée" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />

        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(10,28,16,0.88) 0%, rgba(27,107,58,0.78) 60%, rgba(15,36,23,0.85) 100%)' }} />

        {/* Contenu */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 340, width: '100%' }}>

          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <Logo size={44} showText={true} darkBg={true} variant="gold" />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.25 }}>
            La plateforme immobilière<br />de référence en Guinée
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', lineHeight: 1.65 }}>
            Connectez propriétaires et locataires directement. Sans intermédiaire, sans frais cachés.
          </p>

          {/* Compteurs animés */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
            {[
              { val: compteurs.logements + '+',    label: 'Logements'    },
              { val: compteurs.utilisateurs + '+',  label: 'Utilisateurs' },
              { val: compteurs.villes + ' villes',  label: 'Couvertes'    },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '14px 8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#F5A623', letterSpacing: -0.5 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Badge Guinée */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 20, padding: '6px 14px' }}>
            <div style={{ width: 6, height: 6, background: '#F5A623', borderRadius: '50%' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Made in Guinea</span>
          </div>
        </div>
      </div>

      {/* ─── PANNEAU DROIT — formulaire ──────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#F7F8F7', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo mobile uniquement */}
          <div className="login-mobile-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
            <Logo size={36} showText={true} darkBg={false} />
          </div>

          {/* Titre */}
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#1B2B22', margin: '0 0 6px', letterSpacing: -0.5, lineHeight: 1.2 }}>
            Connectez-vous à votre<br />espace Werdhe
          </h1>
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>
            Accédez à votre tableau de bord
          </p>

          {/* Google */}
          <button onClick={function() { window.location.href = 'https://api.werdhe.com/auth/google'; }}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#1B2B22', cursor: 'pointer', marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <Link to="/login-telephone"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#1B2B22', textDecoration: 'none', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Phone size={16} strokeWidth={1.5} color="#555" /> Continuer par téléphone
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 0.5, background: '#E0E0E0' }} />
            <span style={{ fontSize: 12, color: '#aaa' }}>ou par email</span>
            <div style={{ flex: 1, height: 0.5, background: '#E0E0E0' }} />
          </div>

          {/* Erreur */}
          {erreur && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B71C1C' }}>
              {erreur}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Adresse email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#aaa" strokeWidth={1.5} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" placeholder="vous@email.com" value={email} autoComplete="email"
                  onChange={function(e) { setEmail(e.target.value); setErreur(''); }}
                  style={{ width: '100%', padding: '11px 12px 11px 38px', border: '1.5px solid ' + (email.length > 0 ? (emailValide ? '#1B6B3A' : '#E53935') : '#E0E0E0'), borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Mot de passe</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: '#1B6B3A', textDecoration: 'none', fontWeight: 600 }}>Mot de passe oublié ?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#aaa" strokeWidth={1.5} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type={showPwd ? 'text' : 'password'} placeholder="Votre mot de passe" value={password} autoComplete="current-password"
                  onChange={function(e) { setPassword(e.target.value); setErreur(''); }}
                  style={{ width: '100%', padding: '11px 40px 11px 38px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
                <button type="button" onClick={function() { setShowPwd(!showPwd); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0 }}>
                  {showPwd ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="remember" checked={remember} onChange={function(e) { setRemember(e.target.checked); }}
                style={{ width: 16, height: 16, accentColor: '#1B6B3A', cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>Se souvenir de moi</label>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#aaa' : '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {loading
                ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Connexion...</>
                : <>Se connecter <ArrowRight size={16} strokeWidth={2.5} /></>
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#888', margin: 0 }}>
            Pas encore de compte ?{' '}
            <Link to="/inscription" style={{ color: '#1B6B3A', fontWeight: 700, textDecoration: 'none' }}>Créer un compte gratuit</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) { .login-panel-left { display: none !important; } }
        @media (min-width: 769px) { .login-mobile-header { display: none !important; } }
        input:focus { border-color: #1B6B3A !important; box-shadow: 0 0 0 3px rgba(27,107,58,0.08) !important; }
      `}</style>
    </div>
  );
}