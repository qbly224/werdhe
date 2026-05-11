import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    if (motDePasse !== confirmation) {
      return setErreur('Les mots de passe ne correspondent pas');
    }

    if (motDePasse.length < 6) {
      return setErreur('Le mot de passe doit faire au moins 6 caractères');
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        nouveau_mot_de_passe: motDePasse
      });

      toast.success('✅ Mot de passe mis à jour !');
      navigate('/login');

    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Lien invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <Navbar />
        <div className="auth-container">
          <div className="auth-card">
            <div className="error">Lien invalide. <Link to="/forgot-password">Faire une nouvelle demande</Link></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🔑 Nouveau mot de passe</h1>
            <p>Choisissez un nouveau mot de passe sécurisé</p>
          </div>

          {erreur && <div className="error">{erreur}</div>}

          <form onSubmit={handleSubmit}>
            <label>Nouveau mot de passe *</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Minimum 6 caractères"
              required
            />

            <label>Confirmer le mot de passe *</label>
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Répétez le mot de passe"
              required
            />

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Mise à jour...' : '✅ Mettre à jour'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;