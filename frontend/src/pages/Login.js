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
  const [mdp, setMdp] = useState('');
  const [showMdp, setShowMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  function remplirProprio() {
    setEmail('mamadou@werdhe.com');
    setMdp('motdepasse123');
  }

  function remplirLocataire() {
    setEmail('fatoumata@werdhe.com');
    setMdp('motdepasse123');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      const res = await api.post('/auth/login', { email: email, mot_de_passe: mdp });
      login(res.data.user, res.data.token);
      toast.success('Bon retour ' + res.data.user.prenom + ' !');
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response && err.response.data ? err.response.data.erreur : 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>

        <h2 className="auth-title">Bon retour sur Werdhe</h2>
        <p className="auth-subtitle">Proprietaire ou locataire, connectez-vous a votre espace</p>

        <button className="auth-btn-social" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        <button className="auth-btn-social" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2.5" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.86-1.73a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Continuer par numero de telephone
        </button>

        <div className="auth-divider">ou par email</div>

        {erreur && (
          <div className="auth-erreur">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={function(e) { setEmail(e.target.value); }}
              placeholder="vous@email.com"
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-row">
              <label>Mot de passe</label>
              <Link to="/forgot-password" className="auth-forgot">Mot de passe oublie ?</Link>
            </div>
            <div className="auth-input-wrap">
              <input
                type={showMdp ? 'text' : 'password'}
                value={mdp}
                onChange={function(e) { setMdp(e.target.value); }}
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={function() { setShowMdp(!showMdp); }}
                aria-label={showMdp ? 'Masquer' : 'Afficher'}
              >
                {showMdp ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn-green" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-mobile-money">
          <div className="auth-mm-btn" onClick={remplirProprio} role="button" tabIndex={0}>
            <div className="auth-mm-logo" style={{background:'#FF6600'}}>OM</div>
            <div className="auth-mm-label">Orange Money</div>
          </div>
          <div className="auth-mm-btn" onClick={remplirLocataire} role="button" tabIndex={0}>
            <div className="auth-mm-logo" style={{background:'#FFCC00',color:'#1B2B22'}}>MM</div>
            <div className="auth-mm-label">MTN MoMo</div>
          </div>
        </div>

        <p className="auth-switch">
          Pas de compte ?{' '}
          <Link to="/register" className="auth-switch-link">S'inscrire gratuitement</Link>
        </p>

      </div>
    </div>
  );
}