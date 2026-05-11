import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    try {
      await api.post('/auth/forgot-password', { email });
      setEnvoye(true);
    } catch (err) {
      setErreur('Erreur lors de l\'envoi. Réessayez.');
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
            <h1>🔐 Mot de passe oublié</h1>
            <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>

          {envoye ? (
            <div className="success-box">
              <p>📧 Email envoyé !</p>
              <p>Vérifiez votre boîte mail et cliquez sur le lien reçu.</p>
              <p>Le lien expire dans <strong>1 heure</strong>.</p>
              <Link to="/login" className="btn btn-primary btn-full" style={{marginTop: '16px', display: 'block', textAlign: 'center'}}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {erreur && <div className="error">{erreur}</div>}

              <label>Votre email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mamadou@email.com"
                required
              />

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : '📧 Envoyer le lien'}
              </button>

              <div className="auth-footer">
                <Link to="/login">← Retour à la connexion</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;