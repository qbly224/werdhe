import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    role: 'locataire'
  });

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  // Mettre à jour le formulaire
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErreur('');
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    try {
      const response = await api.post('/auth/register', formData);
      const { token, user } = response.data;

      // Sauvegarder dans le context
      login(user, token);

      toast.success(`Bienvenue ${user.prenom} ! 🎉`);
      navigate('/dashboard');

    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">

          {/* Logo */}
          <div className="auth-logo">
            <h1>🏠 Werdhè</h1>
            <p>Plateforme de location immobilière en Afrique</p>
          </div>

          <h2>Créer un compte</h2>

          {/* Sélection du rôle */}
          <label>Je suis...</label>
          <div className="role-selector">
            <div
              className={`role-option ${formData.role === 'locataire' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'locataire' })}
            >
              <span>🔍</span>
              <p>Locataire</p>
            </div>
            <div
              className={`role-option ${formData.role === 'proprietaire' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'proprietaire' })}
            >
              <span>🏠</span>
              <p>Propriétaire</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div>
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Mamadou"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  placeholder="Diallo"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="mamadou@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>Téléphone</label>
            <input
              type="tel"
              name="telephone"
              placeholder="622 00 00 00"
              value={formData.telephone}
              onChange={handleChange}
            />

            <label>Mot de passe</label>
            <input
              type="password"
              name="mot_de_passe"
              placeholder="Minimum 6 caractères"
              value={formData.mot_de_passe}
              onChange={handleChange}
              required
            />

            {erreur && <p className="error">❌ {erreur}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? '⏳ Création...' : '✅ Créer mon compte'}
            </button>
          </form>

          <div className="auth-footer">
            Déjà un compte ?{' '}
            <Link to="/login">Se connecter</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;