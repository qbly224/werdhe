/* eslint-disable */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard } from 'lucide-react';
import Logo from './Logo';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  var auth     = useAuth();
  var user     = auth.user;
  var navigate = useNavigate();

  function handleLogout() {
    auth.logout();
    toast.success('Déconnexion réussie');
    navigate('/');
  }

  return (
    <nav style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Logo size={34} showText={true} darkBg={false} />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/logements" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 500 }}>
          Logements
        </Link>
        {user ? (
          <>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 500 }}>
              <LayoutDashboard size={15} strokeWidth={1.5} /> Mon espace
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#F5F6FA', borderRadius: 20, fontSize: 13 }}>
              <div style={{ width: 26, height: 26, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {((user.prenom || '').charAt(0) + (user.nom || '').charAt(0)).toUpperCase()}
              </div>
              <span style={{ color: '#1B2B22', fontWeight: 600 }}>{user.prenom}</span>
            </div>
            <button onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#FFEBEE', color: '#B71C1C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <LogOut size={14} strokeWidth={1.5} /> Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              Connexion
            </Link>
            <Link to="/inscription" style={{ padding: '8px 14px', borderRadius: 8, background: '#1B6B3A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              S'inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}