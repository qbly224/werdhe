import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import './Login.css';

const MotDePasseOublie = () => {
  const { t } = useTranslation('public');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    try {
      const response = await api.post('/auth/mot-de-passe-oublie', { email });
      setResultat(response.data);
    } catch (err) {
      setErreur(err.response?.data?.erreur || t('motDePasseOublie.erreurServeur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">

          <div className="auth-header">
            <h1>🔑 {t('motDePasseOublie.titre')}</h1>
            <p>{t('motDePasseOublie.sousTitre')}</p>
          </div>

          {erreur && <div className="error">{erreur}</div>}

          {resultat ? (
            // Afficher le résultat
            <div className="resultat-oublie">
              <p className="success">✅ {resultat.message}</p>
              {resultat.mot_de_passe_temporaire && (
                <div className="mdp-temp">
                  <p>{t('motDePasseOublie.motDePasseTemporaire')}</p>
                  <strong>{resultat.mot_de_passe_temporaire}</strong>
                  <p className="hint">{resultat.instruction}</p>
                </div>
              )}
              <Link to="/login" className="btn btn-primary btn-full">
                {t('motDePasseOublie.seConnecter')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>{t('motDePasseOublie.champEmail')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('motDePasseOublie.placeholderEmail')}
                required
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? t('motDePasseOublie.envoiEnCours') : t('motDePasseOublie.reinitialiser')}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <Link to="/login">← {t('motDePasseOublie.retourConnexion')}</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MotDePasseOublie;