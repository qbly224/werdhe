import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const MENU_PROPRIETAIRE = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { path: '/dashboard/biens', label: 'Mes biens', icon: '🏠' },
  { path: '/dashboard/locataires', label: 'Locataires', icon: '👥' },
  { path: '/dashboard/reservations', label: 'Réservations', icon: '📅' },
  { path: '/dashboard/paiements', label: 'Paiements', icon: '💰' },
  { path: '/dashboard/factures', label: 'Factures', icon: '📄' },
  { path: '/dashboard/parametres', label: 'Paramètres', icon: '⚙️' }
];

const MENU_LOCATAIRE = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { path: '/dashboard/mes-locations', label: 'Mes locations', icon: '🏠' },
  { path: '/dashboard/reservations', label: 'Réservations', icon: '📅' },
  { path: '/dashboard/paiements', label: 'Mes paiements', icon: '💰' },
  { path: '/dashboard/factures', label: 'Mes factures', icon: '📄' },
  { path: '/dashboard/parametres', label: 'Paramètres', icon: '⚙️' }
];

const Sidebar = ({ ongletActif, setOnglet }) => {
  const { user, logout } = useAuth();

  const menu = user?.role === 'locataire'
    ? MENU_LOCATAIRE
    : MENU_PROPRIETAIRE;

  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/">🏠 Werdhè</Link>
        <small>Gestion Immobilière</small>
      </div>

      {/* Profil utilisateur */}
      <div className="sidebar-profil">
        <div className="sidebar-avatar">
          {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
        </div>
        <div className="sidebar-user-info">
          <strong>{user?.prenom} {user?.nom}</strong>
          <span>
            {user?.role === 'proprietaire' && '🏠 Propriétaire'}
            {user?.role === 'locataire' && '🔍 Locataire'}
            {user?.role === 'les_deux' && '🔄 Prop. & Loc.'}
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="sidebar-nav">
        {menu.map(item => (
          <button
            key={item.path}
            className={`sidebar-item ${ongletActif === item.path ? 'active' : ''}`}
            onClick={() => setOnglet(item.path)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer sidebar */}
      <div className="sidebar-footer">
        <button
          className="sidebar-item"
          onClick={() => setOnglet('/dashboard/parametres')}
        >
          <span className="sidebar-icon">👤</span>
          <span>Mon profil</span>
        </button>
        <button className="sidebar-item sidebar-logout" onClick={logout}>
          <span className="sidebar-icon">🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>

    </div>
  );
};

export default Sidebar;