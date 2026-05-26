import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const roleInitial = searchParams.get('role') || 'proprietaire';

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    role: roleInitial
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function setRole(r) {
    setFormData({ ...formData, role: r });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      const res = await api.post('/auth/register', formData);
      login(res.data.user, res.data.token);
      toast.success('Compte cree ! Bienvenue sur Werdhe');
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la creation du compte');
    } finally {
      setLoading(false);
    }
  }

  const isProprietaire = formData.role === 'proprietaire';
  const couleurPrimaire = isProprietaire ? '#1B6B3A' : '#1A4FA0';
  const couleurBg = isProprietaire ? '#f0faf3' : '#f0f4fb';

  return (
    <div className="register-page">

      <nav className="register-nav">
        <Link to="/" className="register-nav-logo">
          <div className="register-logo-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span>Werdhe</span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <Link to="/logements" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Logements</Link>
          <Link to="/login" className="register-nav-outline">Se connecter</Link>
        </div>
      </nav>

      <div className="register-body">

        <div className="register-left">
          <div className="register-left-inner">

            <div className="register-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Rejoignez Werdhe gratuitement
            </div>

            <h1 className="register-title">
              {isProprietaire
                ? 'Gerez vos biens en toute simplicite'
                : 'Trouvez votre logement ideal'}
            </h1>

            <p className="register-desc">
              {isProprietaire
                ? 'Publiez vos logements, suivez vos loyers et generez des documents officiels en quelques clics.'
                : 'Recherchez, reservez et payez votre loyer directement depuis la plateforme.'}
            </p>

            <div className="register-avantages">
              {isProprietaire ? (
                <>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">Gestion complete des biens</div>
                      <div className="register-avantage-desc">Publiez, modifiez, suspendez vos logements</div>
                    </div>
                  </div>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">Alertes automatiques</div>
                      <div className="register-avantage-desc">Loyers en retard, baux expirants</div>
                    </div>
                  </div>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">Documents officiels</div>
                      <div className="register-avantage-desc">Baux, quittances, factures generes automatiquement</div>
                    </div>
                  </div>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">Paiements flexibles</div>
                      <div className="register-avantage-desc">Especes, Orange Money, MTN MoMo</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">Recherche avancee</div>
                      <div className="register-avantage-desc">Filtrez par quartier, budget, type de bien</div>
                    </div>
                  </div>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">Reservation en ligne</div>
                      <div className="register-avantage-desc">Reservez sans intermediaire</div>
                    </div>
                  </div>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">Factures automatiques</div>
                      <div className="register-avantage-desc">Recevez vos quittances par email</div>
                    </div>
                  </div>
                  <div className="register-avantage">
                    <div className="register-avantage-check" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <div className="register-avantage-title">100% gratuit</div>
                      <div className="register-avantage-desc">L'espace locataire est toujours gratuit</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="register-switch-role">
              <span>
                {isProprietaire ? 'Vous cherchez un logement ?' : 'Vous etes proprietaire ?'}
              </span>
              <button
                type="button"
                onClick={function() { setRole(isProprietaire ? 'locataire' : 'proprietaire'); }}
                style={{color: isProprietaire ? '#1A4FA0' : '#1B6B3A', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:'500', textDecoration:'underline'}}
              >
                {isProprietaire ? 'Espace locataire' : 'Espace proprietaire'}
              </button>
            </div>

          </div>
        </div>

        <div className="register-right" style={{background: couleurBg}}>
          <div className="register-card">

            <div className="register-role-selector">
              <button
                type="button"
                className={'register-role-btn ' + (isProprietaire ? 'register-role-active-green' : '')}
                onClick={function() { setRole('proprietaire'); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                Proprietaire
              </button>
              <button
                type="button"
                className={'register-role-btn ' + (!isProprietaire ? 'register-role-active-blue' : '')}
                onClick={function() { setRole('locataire'); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Locataire
              </button>
            </div>

            <div className="register-card-header">
              <h2>Creer votre compte</h2>
              <p>Gratuit, sans carte bancaire</p>
            </div>

            {erreur && (
              <div className="register-erreur">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {erreur}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="register-row">
                <div className="register-field">
                  <label>Prenom *</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder="Mamadou"
                    required
                  />
                </div>
                <div className="register-field">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Diallo"
                    required
                  />
                </div>
              </div>

              <div className="register-field">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div className="register-field">
                <label>Telephone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="622 000 000"
                />
              </div>

              <div className="register-field">
                <label>Mot de passe *</label>
                <input
                  type="password"
                  name="mot_de_passe"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  placeholder="Minimum 6 caracteres"
                  required
                />
              </div>

              <button
                type="submit"
                className="register-submit"
                style={{background: couleurPrimaire}}
                disabled={loading}
              >
                {loading ? 'Creation en cours...' : 'Creer mon compte'}
              </button>
            </form>

            <div className="register-login-link">
              Deja un compte ?
              <Link to="/login" style={{color: couleurPrimaire, fontWeight:'500', marginLeft:'4px'}}>
                Se connecter
              </Link>
            </div>

            <div className="register-guarantees">
              <span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Gratuit sans CB
              </span>
              <span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Donnees securisees
              </span>
              <span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                100% Guinee
              </span>
            </div>

          </div>
        </div>

      </div>

      <footer className="register-footer">
        <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
          <div className="register-logo-icon" style={{width:'22px',height:'22px',borderRadius:'5px'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <span style={{fontSize:'13px',fontWeight:'500',color:'#333'}}>Werdhe</span>
        </div>
        <div style={{display:'flex',gap:'14px'}}>
          <span style={{fontSize:'11px',color:'#aaa',cursor:'pointer'}}>Confidentialite</span>
          <span style={{fontSize:'11px',color:'#aaa',cursor:'pointer'}}>CGU</span>
          <span style={{fontSize:'11px',color:'#aaa',cursor:'pointer'}}>Contact</span>
        </div>
        <span style={{fontSize:'11px',color:'#aaa'}}>2026 Werdhe · Conakry</span>
      </footer>

    </div>
  );
}