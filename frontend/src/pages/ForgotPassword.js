/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

var SLIDES = [
  { img: '/img/residences/vue-aerienne-conakry.jpg', titre: 'Pas de panique', sous: 'Récupérez l\'accès à votre compte en quelques instants' },
  { img: '/img/residences/villa-conakry.jpg',         titre: 'Vos biens vous attendent', sous: 'Retrouvez vos logements, candidatures et paiements' },
  { img: '/img/residences/bungalow-residence.jpg',     titre: 'En toute sécurité', sous: 'Un lien de réinitialisation valable 1 heure, envoyé par email' },
];

export default function ForgotPassword() {
  var [email, setEmail]     = useState('');
  var [loading, setLoading] = useState(false);
  var [envoye, setEnvoye]   = useState(false);
  var [erreur, setErreur]   = useState('');
  var [slideActif, setSlideActif] = useState(0);

  var emailValide = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(function() {
    var interval = setInterval(function() {
      setSlideActif(function(i) { return (i + 1) % SLIDES.length; });
    }, 6000);
    return function() { clearInterval(interval); };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!emailValide) return;
    setLoading(true);
    setErreur('');
    api.post('/auth/forgot-password', { email })
      .then(function() { setEnvoye(true); })
      .catch(function() { setErreur('Erreur lors de l\'envoi. Réessayez.'); })
      .finally(function() { setLoading(false); });
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* Fond plein écran (slides) */}
      {SLIDES.map(function(slide, i) {
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity: slideActif === i ? 1 : 0, transition: 'opacity 1.5s ease', zIndex: 0 }}>
            <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }} />

      {/* Texte bas gauche */}
      <div style={{ position: 'absolute', bottom: 48, left: 48, zIndex: 2, maxWidth: 380 }} className="fp-left-text">
        <div style={{ marginBottom: 16 }}>
          <Logo size={38} showText={true} darkBg={true} variant="gold" />
        </div>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.2, textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
          {SLIDES[slideActif].titre}
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
          {SLIDES[slideActif].sous}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {SLIDES.map(function(_, i) {
            return (
              <button key={i} onClick={function() { setSlideActif(i); }}
                style={{ width: slideActif === i ? 24 : 7, height: 7, borderRadius: 4, border: 'none', background: slideActif === i ? '#F5A623' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all .4s', padding: 0 }} />
            );
          })}
        </div>
      </div>

      {/* Carte flottante */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440, margin: '24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
        className="fp-card">

        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <Logo size={36} showText={true} darkBg={false} />
        </div>

        {envoye ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <CheckCircle2 size={28} strokeWidth={2} color="#1B6B3A" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 8px' }}>Email envoyé !</h1>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, margin: '0 0 4px' }}>
              Vérifiez votre boîte mail (<b>{email}</b>) et cliquez sur le lien reçu pour choisir un nouveau mot de passe.
            </p>
            <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 24px' }}>Le lien expire dans 1 heure.</p>
            <Link to="/login"
              style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', boxSizing: 'border-box' }}>
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 4px', letterSpacing: -0.5, textAlign: 'center' }}>
              Mot de passe oublié ?
            </h1>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 26px', textAlign: 'center' }}>
              Entrez votre email, on vous envoie un lien de réinitialisation
            </p>

            {erreur && (
              <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: '#B71C1C' }}>
                {erreur}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="#bbb" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="email" placeholder="mamadou@email.com" value={email} autoComplete="email" autoFocus
                    onChange={function(e) { setEmail(e.target.value); setErreur(''); }}
                    style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid ' + (email.length > 0 ? (emailValide ? '#1B6B3A' : '#E53935') : '#E8E8E8'), borderRadius: 10, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'border-color .2s' }} />
                </div>
              </div>

              <button type="submit" disabled={loading || !emailValide}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading || !emailValide ? '#ccc' : '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading || !emailValide ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18, boxShadow: loading || !emailValide ? 'none' : '0 4px 16px rgba(27,107,58,0.3)' }}>
                {loading
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Envoi en cours...</>
                  : <>Envoyer le lien <ArrowRight size={15} strokeWidth={2.5} /></>
                }
              </button>
            </form>

            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: '#1B6B3A', fontWeight: 700, textDecoration: 'none' }}>
              <ArrowLeft size={14} strokeWidth={2} /> Retour à la connexion
            </Link>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 768px) {
          .fp-left-text { display: none !important; }
          .fp-card { margin: 16px auto !important; max-width: calc(100% - 32px) !important; }
        }
        input:focus { border-color: #1B6B3A !important; box-shadow: 0 0 0 3px rgba(27,107,58,0.08) !important; }
        button { transition: opacity .15s, transform .1s; }
        button:hover:not(:disabled) { opacity: 0.92; }
      `}</style>
    </div>
  );
}
