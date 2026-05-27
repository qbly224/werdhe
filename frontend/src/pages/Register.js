import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const roleInitial = searchParams.get('role') || 'proprietaire';

  const [role, setRole] = useState(roleInitial);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [cgu, setCgu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  function getPasswordStrength(pwd) {
    if (pwd.length === 0) return 0;
    if (pwd.length < 4) return 1;
    if (pwd.length < 8) return 2;
    if (pwd.length < 12) return 3;
    return 4;
  }

  var strength = getPasswordStrength(password);
  var strengthLabel = ['', 'Tres faible', 'Faible', 'Moyen', 'Fort'];
  var strengthColor = ['', '#E53935', '#E53935', '#FB8C00', '#1B6B3A'];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cgu) { setErreur('Veuillez accepter les conditions d\'utilisation'); return; }
    setLoading(true);
    setErreur('');
    try {
      await api.post('/auth/register', {
        nom: nom,
        prenom: prenom,
        email: email,
        telephone: telephone,
        mot_de_passe: password,
        role: role
      });
      toast.success('Compte cree ! Completez votre profil');
      navigate(role === 'proprietaire' ? '/onboarding/proprietaire' : '/onboarding/locataire');
    } catch (err) {
      setErreur(err.response && err.response.data
        ? err.response.data.erreur
        : 'Erreur lors de la creation du compte');
    } finally {
      setLoading(false);
    }
  }

  var isProprietaire = role === 'proprietaire';

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
          <h2>Creer votre compte</h2>
          <p>Gratuit · Sans carte bancaire</p>
        </div>

        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'12px', color:'#888', fontWeight:'500', marginBottom:'8px'}}>
            Je m'inscris en tant que
          </div>
          <div className="auth-roles">
            <div
              className={'auth-role-card ' + (isProprietaire ? 'selected-green' : '')}
              onClick={function() { setRole('proprietaire'); }}
            >
              <div className="auth-role-icon" style={{background: isProprietaire ? '#fff' : '#E8F5E9'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2.5" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <div className="auth-role-title">Proprietaire</div>
              <div className="auth-role-desc">Je gere des biens locatifs</div>
            </div>
            <div
              className={'auth-role-card ' + (!isProprietaire ? 'selected-blue' : '')}
              onClick={function() { setRole('locataire'); }}
            >
              <div className="auth-role-icon" style={{background: !isProprietaire ? '#fff' : '#E3F2FD'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div className="auth-role-title">Locataire</div>
              <div className="auth-role-desc">Je cherche un logement</div>
            </div>
          </div>
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
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
            <div className="auth-field" style={{marginBottom:'0'}}>
              <label>Prenom</label>
              <input type="text" placeholder="Alpha"
                value={prenom}
                onChange={function(e) { setPrenom(e.target.value); }}
                required />
            </div>
            <div className="auth-field" style={{marginBottom:'0'}}>
              <label>Nom</label>
              <input type="text" placeholder="Barry"
                value={nom}
                onChange={function(e) { setNom(e.target.value); }}
                required />
            </div>
          </div>
          <div style={{marginBottom:'13px'}}></div>

          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="vous@email.com"
              value={email}
              onChange={function(e) { setEmail(e.target.value); }}
              required />
          </div>

          <div className="auth-field">
            <label>Telephone</label>
            <div className="auth-tel-wrap">
              <div className="auth-tel-prefix">
                <span>🇬🇳</span>
                <span>+224</span>
              </div>
              <input
                type="tel"
                placeholder="622 00 00 00"
                className="auth-tel-input"
                value={telephone}
                onChange={function(e) { setTelephone(e.target.value); }}
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="Minimum 8 caracteres"
              value={password}
              onChange={function(e) { setPassword(e.target.value); }}
              required
            />
            {password.length > 0 && (
              <div>
                <div className="auth-strength-bar">
                  <div className={'auth-strength-segment ' + (strength >= 1 ? (strength <= 2 ? 'weak' : strength === 3 ? 'medium' : 'strong') : '')} />
                  <div className={'auth-strength-segment ' + (strength >= 2 ? (strength <= 2 ? 'weak' : strength === 3 ? 'medium' : 'strong') : '')} />
                  <div className={'auth-strength-segment ' + (strength >= 3 ? (strength === 3 ? 'medium' : 'strong') : '')} />
                  <div className={'auth-strength-segment ' + (strength >= 4 ? 'strong' : '')} />
                </div>
                <div className="auth-strength-label" style={{color: strengthColor[strength]}}>
                  {strengthLabel[strength]}
                </div>
              </div>
            )}
          </div>

          <div className="auth-cgu">
            <input
              type="checkbox"
              id="cgu"
              checked={cgu}
              onChange={function(e) { setCgu(e.target.checked); }}
            />
            <label htmlFor="cgu">
              J'accepte les{' '}
              <a href="/cgu">Conditions d'utilisation</a>
              {' '}et la{' '}
              <a href="/confidentialite">Politique de confidentialite</a>
            </label>
          </div>

          <button
            type="submit"
            className={isProprietaire ? 'auth-btn-green' : 'auth-btn-blue'}
            style={{marginBottom:'12px'}}
            disabled={loading}
          >
            {loading ? 'Creation...' : 'Creer mon compte'}
          </button>
        </form>

        <p className="auth-link-text">
          Deja un compte ?{' '}
          <Link to="/login">Se connecter</Link>
        </p>

      </div>
    </div>
  );
}