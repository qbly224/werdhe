import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie !');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          🏠 Werdhè
        </Link>

        {/* Liens de navigation */}
        <div className="navbar-links">
          <Link to="/logements">Logements</Link>

          {user ? (
            // Utilisateur connecté
            <>
              <Link to="/dashboard">
                Mon espace
              </Link>
              <span className="navbar-user">
                👤 {user.prenom}
              </span>
              <button
                className="btn btn-danger"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </>
          ) : (
            // Utilisateur non connecté
            <>
              <Link to="/login" className="btn btn-primary">
                Connexion
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;