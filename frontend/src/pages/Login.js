import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: ''
  });

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      login(user, token);
      toast.success(`Bon retour ${user.prenom} ! 👋`);
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Email ou mot de passe incorrect');
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
            <h1>🔐 Connexion</h1>
            <p>Accédez à votre espace Werdhè</p>
          </div>

          {erreur && <div className="error">{erreur}</div>}

          <form onSubmit={handleSubmit}>
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="mamadou@email.com"
              required
            />

            <label>Mot de passe *</label>
            <input
              type="password"
              name="mot_de_passe"
              value={formData.mot_de_passe}
              onChange={handleChange}
              placeholder="Votre mot de passe"
              required
            />

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <div style={{textAlign: 'center', marginTop: '12px'}}>
  <Link to="/forgot-password" style={{color: 'var(--gray)', fontSize: '13px'}}>
    Mot de passe oublié ?
  </Link>
</div>
          </form>

          <div className="test-accounts">
            <p>Comptes de test :</p>
            <button
              className="btn-test"
              onClick={() => setFormData({
                email: 'mamadou@werdhe.com',
                mot_de_passe: 'motdepasse123'
              })}
            >
              👤 Propriétaire
            </button>
            <button
              className="btn-test"
              onClick={() => setFormData({
                email: 'fatoumata@werdhe.com',
                mot_de_passe: 'motdepasse123'
              })}
            >
              👤 Locataire
            </button>
          </div>

          <div className="auth-footer">
            <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
            <span> · </span>
            <Link to="/register">S'inscrire gratuitement</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;