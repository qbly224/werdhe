/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

var INDICATIFS = [
  { code: '+224', pays: 'Guinée', flag: '🇬🇳' },
  { code: '+221', pays: 'Sénégal', flag: '🇸🇳' },
  { code: '+223', pays: 'Mali', flag: '🇲🇱' },
  { code: '+225', pays: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: '+33',  pays: 'France', flag: '🇫🇷' },
  { code: '+241',  pays: 'Gabon', flag: 'GA' },
];

export default function LoginTelephone() {
  var navigate   = useNavigate();
  var auth       = useAuth();

  var [etape, setEtape]           = useState('telephone'); // telephone | otp | infos
  var [indicatif, setIndicatif]   = useState('+224');
  var [telephone, setTelephone]   = useState('');
  var [telComplet, setTelComplet] = useState('');
  var [otp, setOtp]               = useState(['', '', '', '', '', '']);
  var [loading, setLoading]       = useState(false);
  var [timer, setTimer]           = useState(0);
  var [codeDevMode, setCodeDevMode] = useState('');
  var [nom, setNom]               = useState('');
  var [prenom, setPrenom]         = useState('');
  var [role, setRole]             = useState('locataire');

  var inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Timer pour renvoyer le code
  useEffect(function() {
    if (timer > 0) {
      var t = setTimeout(function() { setTimer(timer - 1); }, 1000);
      return function() { clearTimeout(t); };
    }
  }, [timer]);

  function envoyerOTP() {
    if (telephone.length < 6) { toast.error('Numéro invalide'); return; }
    var tel = indicatif + telephone.replace(/^0/, '');
    setTelComplet(tel);
    setLoading(true);

    api.post('/auth/telephone/envoyer-otp', { telephone: tel })
      .then(function(res) {
        toast.success('Code envoyé !');
        setEtape('otp');
        setTimer(60);
        // Mode dev : afficher le code automatiquement
        if (res.data.code_dev) {
          setCodeDevMode(res.data.code_dev);
          toast('Code dev : ' + res.data.code_dev, { icon: '🔑', duration: 10000 });
          var digits = res.data.code_dev.split('');
          setOtp(digits);
        }
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur envoi');
      })
      .finally(function() { setLoading(false); });
  }

  function verifierOTP() {
    var code = otp.join('');
    if (code.length !== 6) { toast.error('Entrez les 6 chiffres'); return; }
    setLoading(true);

    api.post('/auth/telephone/verifier-otp', { telephone: telComplet, code: code })
      .then(function(res) {
        if (res.data.nouveau_utilisateur) {
          setEtape('infos');
          return;
        }
        // Connexion réussie
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user',  JSON.stringify(res.data.user));
        auth.login && auth.login(res.data.user, res.data.token);
        toast.success('Bienvenue ' + res.data.user.prenom + ' !');
        navigate('/dashboard');
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Code invalide');
      })
      .finally(function() { setLoading(false); });
  }

  function creerCompte() {
    if (!nom.trim()) { toast.error('Entrez votre nom'); return; }
    var code = otp.join('');
    setLoading(true);

    api.post('/auth/telephone/verifier-otp', {
      telephone: telComplet,
      code:      code,
      nom:       nom,
      prenom:    prenom,
      role:      role
    })
      .then(function(res) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user',  JSON.stringify(res.data.user));
        auth.login && auth.login(res.data.user, res.data.token);
        toast.success('Compte créé ! Bienvenue ' + (prenom || nom) + ' !');
        navigate('/dashboard');
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur');
      })
      .finally(function() { setLoading(false); });
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    var newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs[index + 1].current && inputRefs[index + 1].current.focus();
    if (!value && index > 0) inputRefs[index - 1].current && inputRefs[index - 1].current.focus();
  }

  function handleOtpPaste(e) {
    var pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs[5].current && inputRefs[5].current.focus();
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#F7F8F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: '#1B6B3A', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>
            🏠
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', marginBottom: 6 }}>
            {etape === 'telephone' ? 'Connexion par téléphone'
             : etape === 'otp'      ? 'Entrez votre code'
             : 'Créer votre compte'}
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {etape === 'telephone' ? 'Entrez votre numéro de téléphone'
             : etape === 'otp'      ? 'Code envoyé au ' + telComplet
             : 'Quelques informations pour finir'}
          </div>
        </div>

        {/* ── ÉTAPE 1 : TÉLÉPHONE ─────────────────────────── */}
        {etape === 'telephone' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>
              Numéro de téléphone
            </div>

            {/* Sélecteur indicatif */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
  <select
    value={indicatif}
    onChange={function(e) { setIndicatif(e.target.value); }}
    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 13, background: '#FAFAFA', outline: 'none' }}>
    {INDICATIFS.map(function(i) {
      return (
        <option key={i.code} value={i.code}>
          {i.flag} {i.pays} ({i.code})
        </option>
      );
    })}
  </select>
  <input
    type="tel"
    placeholder="Ex: 621 41 42 85"
    value={telephone}
    onChange={function(e) { setTelephone(e.target.value.replace(/\D/g, '')); }}
    onKeyDown={function(e) { if (e.key === 'Enter') envoyerOTP(); }}
    style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 16, outline: 'none', fontFamily: 'monospace', letterSpacing: 2, boxSizing: 'border-box' }}
    autoFocus />
</div>

            {/* Prévisualisation du numéro */}
            {telephone && (
              <div style={{ background: '#F0FBF0', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#1B6B3A', fontWeight: 600 }}>
                📱 {indicatif} {telephone}
              </div>
            )}

            <button
              onClick={envoyerOTP}
              disabled={loading || telephone.length < 6}
              style={{ width: '100%', background: loading || telephone.length < 6 ? '#CCC' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: loading || telephone.length < 6 ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Envoi...' : 'Recevoir le code →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
              Ou{' '}
              <span style={{ color: '#1B6B3A', fontWeight: 600, cursor: 'pointer' }} onClick={function() { navigate('/login'); }}>
                connexion par email
              </span>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : CODE OTP ──────────────────────────── */}
        {etape === 'otp' && (
          <div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {otp.map(function(digit, i) {
                return (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={function(e) { handleOtpChange(i, e.target.value); }}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    onKeyDown={function(e) {
                      if (e.key === 'Backspace' && !digit && i > 0) {
                        inputRefs[i - 1].current && inputRefs[i - 1].current.focus();
                      }
                      if (e.key === 'Enter') verifierOTP();
                    }}
                    style={{
                      width: 44, height: 52,
                      textAlign: 'center',
                      fontSize: 22, fontWeight: 700,
                      borderRadius: 10,
                      border: digit ? '2px solid #1B6B3A' : '1.5px solid #E0E0E0',
                      background: digit ? '#F0FBF0' : '#FAFAFA',
                      outline: 'none',
                      fontFamily: 'monospace',
                      color: '#1B2B22',
                      transition: 'all .15s'
                    }} />
                );
              })}
            </div>

            <button
              onClick={verifierOTP}
              disabled={loading || otp.join('').length !== 6}
              style={{ width: '100%', background: otp.join('').length === 6 ? '#1B6B3A' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed', marginBottom: 14 }}>
              {loading ? '⏳ Vérification...' : '✅ Confirmer le code'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
              {timer > 0 ? (
                <span>Renvoyer dans <b style={{ color: '#1B6B3A' }}>{timer}s</b></span>
              ) : (
                <span
                  style={{ color: '#1B6B3A', fontWeight: 600, cursor: 'pointer' }}
                  onClick={function() { setOtp(['','','','','','']); envoyerOTP(); }}>
                  Renvoyer le code
                </span>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span
                style={{ fontSize: 12, color: '#888', cursor: 'pointer' }}
                onClick={function() { setEtape('telephone'); setOtp(['','','','','','']); }}>
                ← Changer de numéro
              </span>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : INFOS COMPTE (nouveau) ────────────── */}
        {etape === 'infos' && (
          <div>
            <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1B5E20', fontWeight: 600 }}>
              ✅ Numéro vérifié : {telComplet}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Prénom</div>
                <input
                  type="text"
                  placeholder="Mamadou"
                  value={prenom}
                  onChange={function(e) { setPrenom(e.target.value); }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Nom *</div>
                <input
                  type="text"
                  placeholder="Diallo"
                  value={nom}
                  onChange={function(e) { setNom(e.target.value); }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600 }}>Je suis *</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { val: 'locataire',   label: '🏠 Locataire',    sub: 'Je cherche un logement' },
                  { val: 'proprietaire', label: '🔑 Propriétaire', sub: 'Je loue des biens' },
                ].map(function(r) {
                  return (
                    <div key={r.val} onClick={function() { setRole(r.val); }}
                      style={{ padding: 12, borderRadius: 10, border: role === r.val ? '2px solid #1B6B3A' : '1.5px solid #E0E0E0', background: role === r.val ? '#E8F5E9' : '#FAFAFA', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: role === r.val ? '#1B5E20' : '#1B2B22' }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{r.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={creerCompte}
              disabled={loading || !nom.trim()}
              style={{ width: '100%', background: nom.trim() ? '#1B6B3A' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: nom.trim() ? 'pointer' : 'not-allowed' }}>
              {loading ? '⏳ Création...' : '🚀 Créer mon compte'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}