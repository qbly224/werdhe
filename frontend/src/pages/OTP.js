import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './auth.css';

export default function OTP() {
  var navigate = useNavigate();
  var location = useLocation();
  var role = (location.state && location.state.role) || 'proprietaire';
  var ref0 = useRef(null);
  var ref1 = useRef(null);
  var ref2 = useRef(null);
  var ref3 = useRef(null);
  var ref4 = useRef(null);
  var ref5 = useRef(null);
  var refs = [ref0, ref1, ref2, ref3, ref4, ref5];

  var [digits, setDigits] = useState(['', '', '', '', '', '']);
  var [timer, setTimer] = useState(150);
  var [loading, setLoading] = useState(false);

  useEffect(function() {
    if (ref0.current) ref0.current.focus();
  }, []);

  useEffect(function() {
    if (timer <= 0) return;
    var t = setTimeout(function() { setTimer(timer - 1); }, 1000);
    return function() { clearTimeout(t); };
  }, [timer]);

  function formatTimer(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    var newDigits = digits.slice();
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < 5) {
      refs[index + 1].current.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current.focus();
    }
  }

  function handleVerify() {
    var code = digits.join('');
    if (code.length < 6) return;
    setLoading(true);
    setTimeout(function() {
      setLoading(false);
      if (role === 'proprietaire') {
        navigate('/onboarding/proprietaire');
      } else {
        navigate('/onboarding/locataire');
      }
    }, 1000);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <button
          className="auth-back-btn"
          onClick={function() { navigate(-1); }}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Retour
        </button>

        <div className="auth-header">
          <div style={{width:'52px',height:'52px',background:'#E8F5E9',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <h2>Code de verification</h2>
          <p>Code envoye par SMS au<br/>
            <strong style={{color:'#111'}}>+224 622 00 00 00</strong>
          </p>
        </div>

        <div className="auth-otp-inputs">
          {digits.map(function(d, i) {
            return (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                className={'auth-otp-input ' + (d ? 'filled' : '')}
                onChange={function(e) { handleChange(i, e.target.value); }}
                onKeyDown={function(e) { handleKeyDown(i, e); }}
              />
            );
          })}
        </div>

        <div className="auth-otp-timer">
          {timer > 0 ? (
            <span>Expire dans <span>{formatTimer(timer)}</span></span>
          ) : (
            <span style={{color:'#C62828'}}>Code expire</span>
          )}
        </div>

        <button
          className="auth-btn-green"
          style={{marginBottom:'10px'}}
          onClick={handleVerify}
          disabled={loading || digits.join('').length < 6}
          type="button"
        >
          {loading ? 'Verification...' : 'Verifier le code'}
        </button>

        <p className="auth-link-text">
          Pas recu ?{' '}
          <span onClick={function() { setTimer(150); setDigits(['','','','','','']); }}>
            Renvoyer le code
          </span>
        </p>

      </div>
    </div>
  );
}