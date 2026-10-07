/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

var SLIDES = [
  { img: '/img/residences/immeuble-moderne.jpg',      titre: 'Un dernier pas', sous: 'Choisissez un nouveau mot de passe robuste pour sécuriser votre compte' },
  { img: '/img/residences/vue-aerienne-conakry.jpg',   titre: 'Presque terminé', sous: 'Vous pourrez vous reconnecter immédiatement après' },
];

export default function ResetPassword() {
  var [searchParams] = useSearchParams();
  var token    = searchParams.get('token');
  var navigate = useNavigate();

  var [motDePasse, setMotDePasse]     = useState('');
  var [confirmation, setConfirmation] = useState('');
  var [showPwd, setShowPwd]           = useState(false);
  var [loading, setLoading]           = useState(false);
  var [erreur, setErreur]             = useState('');
  var [slideActif, setSlideActif]     = useState(0);

  var pwdForce = motDePasse.length === 0 ? 0
    : motDePasse.length < 6 ? 1
    : motDePasse.length < 10 ? 2
    : /[A-Z]/.test(motDePasse) && /[0-9]/.test(motDePasse) ? 4 : 3;
  var pwdLabels = ['', 'Trop court', 'Faible', 'Moyen', 'Fort'];
  var pwdColors = ['', '#E53935', '#FB8C00', '#1565C0', '#1B6B3A'];

  useEffect(function() {
    var interval = setInterval(function() {
      setSlideActif(function(i) { return (i + 1) % SLIDES.length; });
    }, 6000);
    return function() { clearInterval(interval); };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setErreur('');

    if (motDePasse !== confirmation) { setErreur('Les mots de passe ne correspondent pas'); return; }
    if (motDePasse.length < 6) { setErreur('Le mot de passe doit faire au moins 6 caractères'); return; }

    setLoading(true);
    api.post('/auth/reset-password', { token, nouveau_mot_de_passe: motDePasse })
      .then(function() {
        toast.success('Mot de passe mis à jour !');
        navigate('/login');
      })
      .catch(function(err) {
        setErreur(err.response && err.response.data ? err.response.data.erreur : 'Lien invalide ou expiré');
      })
      .finally(function() { setLoading(false); });
  }

  var carteStyle = { position: 'relative', zIndex: 2, width: '100%', maxWidth: 440, margin: '24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#1B2B22' }}>
        <div style={Object.assign({}, carteStyle, { maxWidth: 420, margin: '24px' })}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <Logo size={36} showText={true} darkBg={false} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>Lien invalide</h1>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 22px', lineHeight: 1.6 }}>
              Ce lien de réinitialisation n'est plus valable. Faites une nouvelle demande.
            </p>
            <Link to="/forgot-password"
              style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', boxSizing: 'border-box' }}>
              Nouvelle demande <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {SLIDES.map(function(slide, i) {
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity: slideActif === i ? 1 : 0, transition: 'opacity 1.5s ease', zIndex: 0 }}>
            <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }} />

      <div style={{ position: 'absolute', bottom: 48, left: 48, zIndex: 2, maxWidth: 380 }} className="rp-left-text">
        <div style={{ marginBottom: 16 }}>
          <Logo size={38} showText={true} darkBg={true} variant="gold" />
        </div>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.2, textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
          {SLIDES[slideActif].titre}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
          {SLIDES[slideActif].sous}
        </p>
      </div>

      <div style={carteStyle} className="rp-card">
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <Logo size={36} showText={true} darkBg={false} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <ShieldCheck size={24} strokeWidth={2} color="#1B6B3A" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 4px', letterSpacing: -0.5 }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Choisissez un mot de passe sécurisé</p>
        </div>

        {erreur && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: '#B71C1C' }}>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} color="#bbb" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 caractères" value={motDePasse} autoFocus
                onChange={function(e) { setMotDePasse(e.target.value); }}
                style={{ width: '100%', padding: '11px 40px 11px 36px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
              <button type="button" onClick={function() { setShowPwd(!showPwd); }}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0 }}>
                {showPwd ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
              </button>
            </div>
            {motDePasse.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(function(i) {
                    return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwdForce ? pwdColors[pwdForce] : '#E0E0E0', transition: 'all .2s' }} />;
                  })}
                </div>
                <div style={{ fontSize: 11, color: pwdColors[pwdForce], fontWeight: 600 }}>{pwdLabels[pwdForce]}</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirmer</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} color="#bbb" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="Répétez le mot de passe" value={confirmation}
                onChange={function(e) { setConfirmation(e.target.value); }}
                style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid ' + (confirmation.length > 0 ? (confirmation === motDePasse ? '#1B6B3A' : '#E53935') : '#E8E8E8'), borderRadius: 10, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#aaa' : '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18, boxShadow: loading ? 'none' : '0 4px 16px rgba(27,107,58,0.3)' }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Mise à jour...</>
              : <>Mettre à jour <ArrowRight size={15} strokeWidth={2.5} /></>
            }
          </button>
        </form>

        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: '#1B6B3A', fontWeight: 700, textDecoration: 'none' }}>
          <ArrowLeft size={14} strokeWidth={2} /> Retour à la connexion
        </Link>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) {
          .rp-left-text { display: none !important; }
          .rp-card { margin: 16px auto !important; max-width: calc(100% - 32px) !important; }
        }
        input:focus { border-color: #1B6B3A !important; box-shadow: 0 0 0 3px rgba(27,107,58,0.08) !important; }
        button { transition: opacity .15s, transform .1s; }
        button:hover:not(:disabled) { opacity: 0.92; }
      `}</style>
    </div>
  );
}
