import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import './Login.css';

const MotDePasseOublie = () => {
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
      setErreur(err.response?.data?.erreur || 'Erreur serveur');
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
            <h1>🔑 Mot de passe oublié</h1>
            <p>Entrez votre email pour recevoir un nouveau mot de passe</p>
          </div>

          {erreur && <div className="error">{erreur}</div>}

          {resultat ? (
            // Afficher le résultat
            <div className="resultat-oublie">
              <p className="success">✅ {resultat.message}</p>
              {resultat.mot_de_passe_temporaire && (
                <div className="mdp-temp">
                  <p>Votre mot de passe temporaire :</p>
                  <strong>{resultat.mot_de_passe_temporaire}</strong>
                  <p className="hint">{resultat.instruction}</p>
                </div>
              )}
              <Link to="/login" className="btn btn-primary btn-full">
                Se connecter
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Envoi...' : 'Réinitialiser mon mot de passe'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <Link to="/login">← Retour à la connexion</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MotDePasseOublie;