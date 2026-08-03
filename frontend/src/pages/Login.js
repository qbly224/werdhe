import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  function remplirTest(role) {
    if (role === 'proprio') {
      setEmail('mamadou@werdhe.com');
      setPassword('motdepasse123');
    } else {
      setEmail('fatoumata@werdhe.com');
      setPassword('motdepasse123');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      const res = await api.post('/auth/login', {
        email: email,
        mot_de_passe: password
      });
      login(res.data.user, res.data.token);
      toast.success('Bon retour ' + res.data.user.prenom + ' !');
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response && err.response.data
        ? err.response.data.erreur
        : 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h2>Bon retour sur Werdhe</h2>
          <p>Proprietaire ou locataire, connectez-vous a votre espace</p>
        </div>

        <button className="auth-btn-outline" style={{marginBottom:'8px'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          onClick={function() { window.location.href = 'https://api.werdhe.com/auth/google'; }}
        </button>
        
        <button
         onClick={function() { navigate('/login-telephone'); }}
         style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#1B2B22', cursor: 'pointer' }}>
         <span>📞</span> Continuer par numéro de téléphone
        </button>

        <div className="auth-divider">
          <span>ou par email</span>
        </div>

        {erreur && (
          <div className="auth-erreur">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="vous@email.com"
              value={email}
              onChange={function(e) { setEmail(e.target.value); }}
              required
            />
          </div>

          <div className="auth-field" style={{marginBottom:'6px'}}>
            <label>Mot de passe</label>
            <div className="auth-input-wrap">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                required
                style={{paddingRight:'36px'}}
              />
              <span
                className="auth-input-icon"
                onClick={function() { setShowPwd(!showPwd); }}
              >
                {showPwd ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Masquer">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Afficher">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </span>
            </div>
          </div>

          <div style={{textAlign:'right', marginBottom:'14px'}}>
            <Link to="/forgot-password" style={{fontSize:'12px', color:'#1B6B3A', textDecoration:'none'}}>
              Mot de passe oublie ?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-btn-green"
            style={{marginBottom:'12px'}}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-mm-grid">
          <button
            className="auth-mm-btn"
            type="button"
            onClick={function() { remplirTest('proprio'); }}
          >
            <div className="auth-mm-logo" style={{background:'#FF6600'}}>OM</div>
            <div className="auth-mm-label">Orange Money</div>
          </button>
          <button
            className="auth-mm-btn"
            type="button"
            onClick={function() { remplirTest('locataire'); }}
          >
            <div className="auth-mm-logo" style={{background:'#FFCC00', color:'#1B2B22'}}>MM</div>
            <div className="auth-mm-label">MTN MoMo</div>
          </button>
        </div>

        <p className="auth-link-text">
          Pas de compte ?{' '}
          <Link to="/register">S'inscrire gratuitement</Link>
        </p>

      </div>
    </div>
  );
}