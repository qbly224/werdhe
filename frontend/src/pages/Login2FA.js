/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Shield, RefreshCw } from 'lucide-react';

export default function Login2FA() {
  var navigate  = useNavigate();
  var location  = useLocation();
  var auth      = useAuth();

  var userId    = location.state && location.state.user_id;
  var email     = location.state && location.state.email;

  var [otp, setOtp]         = useState(['', '', '', '', '', '']);
  var [loading, setLoading] = useState(false);
  var [timer, setTimer]     = useState(600); // 10 minutes
  var inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(function() {
    if (!userId) { navigate('/login'); return; }
    inputRefs[0].current && inputRefs[0].current.focus();
  }, []);

  useEffect(function() {
    if (timer <= 0) return;
    var t = setInterval(function() { setTimer(function(p) { return p - 1; }); }, 1000);
    return function() { clearInterval(t); };
  }, [timer]);

  var minutes = Math.floor(timer / 60);
  var seconds = timer % 60;

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    var newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs[index + 1].current && inputRefs[index + 1].current.focus();
    if (!value && index > 0) inputRefs[index - 1].current && inputRefs[index - 1].current.focus();
  }

  function handlePaste(e) {
    var pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs[5].current && inputRefs[5].current.focus();
    }
  }

  function verifier() {
    var code = otp.join('');
    if (code.length !== 6) { toast.error('Entrez les 6 chiffres'); return; }
    setLoading(true);

    api.post('/auth/admin/verifier-2fa', { user_id: userId, code: code })
      .then(function(res) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user',  JSON.stringify(res.data.user));
        if (auth.login) auth.login(res.data.user, res.data.token);
        toast.success('Connexion admin réussie 🔐');
        navigate('/dashboard');
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Code invalide');
        setOtp(['', '', '', '', '', '']);
        inputRefs[0].current && inputRefs[0].current.focus();
      })
      .finally(function() { setLoading(false); });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F1A12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'system-ui' }}>
      <div style={{ background: '#1B2B22', borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, background: '#F5A623', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={30} color="#1B2B22" strokeWidth={2} />
          </div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
            Vérification en 2 étapes
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Code envoyé à<br/>
            <span style={{ color: '#F5A623', fontWeight: 600 }}>{email}</span>
          </p>
        </div>

        {/* Champs OTP */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
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
                onPaste={i === 0 ? handlePaste : undefined}
                onKeyDown={function(e) {
                  if (e.key === 'Backspace' && !digit && i > 0) {
                    inputRefs[i - 1].current && inputRefs[i - 1].current.focus();
                  }
                  if (e.key === 'Enter') verifier();
                }}
                style={{
                  width: 48, height: 56,
                  textAlign: 'center',
                  fontSize: 24, fontWeight: 700,
                  borderRadius: 12,
                  border: digit ? '2px solid #F5A623' : '1.5px solid rgba(255,255,255,0.15)',
                  background: digit ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.05)',
                  outline: 'none',
                  color: '#fff',
                  fontFamily: 'monospace',
                  transition: 'all .15s',
                  caretColor: '#F5A623'
                }} />
            );
          })}
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {timer > 0 ? (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Code valide encore{' '}
              <span style={{ color: timer < 60 ? '#E53935' : '#F5A623', fontWeight: 700 }}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </span>
          ) : (
            <span style={{ color: '#E53935', fontSize: 13 }}>Code expiré — reconnectez-vous</span>
          )}
        </div>

        {/* Bouton confirmer */}
        <button
          onClick={verifier}
          disabled={loading || otp.join('').length !== 6 || timer <= 0}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: otp.join('').length === 6 && timer > 0 ? '#F5A623' : 'rgba(255,255,255,0.1)',
            color: otp.join('').length === 6 && timer > 0 ? '#1B2B22' : 'rgba(255,255,255,0.3)',
            fontSize: 15,
            fontWeight: 800,
            cursor: otp.join('').length === 6 && timer > 0 ? 'pointer' : 'not-allowed',
            marginBottom: 12,
            transition: 'all .2s'
          }}>
          {loading ? '⏳ Vérification...' : '🔐 Confirmer'}
        </button>

        <button
          onClick={function() { navigate('/login'); }}
          style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer' }}>
          ← Retour à la connexion
        </button>
      </div>
    </div>
  );
}