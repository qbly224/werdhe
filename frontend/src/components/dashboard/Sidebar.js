/* eslint-disable */
import {
  LayoutDashboard, Home, Users, CalendarCheck,
  CreditCard, FileText, Bell, MessageCircle,
  Wrench, Send, Settings, TrendingUp, Clock,
  Zap, LogOut, Plus, ChevronRight
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

var NAV_PROPRIO = [
  { path: '/dashboard',               icon: LayoutDashboard, label: 'Tableau de bord'    },
  { path: '/dashboard/biens',         icon: Home,            label: 'Mes biens'          },
  { path: '/dashboard/locataires',    icon: Users,           label: 'Locataires'         },
  { path: '/dashboard/reservations',  icon: CalendarCheck,   label: 'Candidatures'       },
  { path: '/dashboard/paiements',     icon: CreditCard,      label: 'Paiements'          },
  { path: '/dashboard/documents',     icon: FileText,        label: 'Documents'          },
  { path: '/dashboard/alertes',       icon: Bell,            label: 'Alertes'            },
  { path: '/dashboard/messages',      icon: MessageCircle,   label: 'Messages'           },
  { path: '/dashboard/rapports',      icon: TrendingUp,      label: 'Rapports'           },
  { path: '/dashboard/reclamations',  icon: Wrench,          label: 'Réclamations'       },
  { path: '/dashboard/preavis',       icon: Send,            label: 'Préavis'            },
];

var NAV_LOCATAIRE = [
  { path: '/dashboard',               icon: LayoutDashboard, label: 'Tableau de bord'   },
  { path: '/dashboard/mes-locations', icon: Home,            label: 'Mes locations'     },
  { path: '/dashboard/reservations',  icon: CalendarCheck,   label: 'Mes Candidatures'  },
  { path: '/dashboard/paiements',     icon: CreditCard,      label: 'Paiements'         },
  { path: '/dashboard/documents',     icon: FileText,        label: 'Documents'         },
  { path: '/dashboard/messages',      icon: MessageCircle,   label: 'Messages'          },
  { path: '/dashboard/reclamations',  icon: Wrench,          label: 'Réclamations'      },
  { path: '/dashboard/preavis',       icon: Send,            label: 'Préavis'           },
  { path: '/dashboard/historique',    icon: Clock,           label: 'Mon historique'    },
  { path: '/dashboard/parametres',    icon: Settings,        label: 'Paramètres'        },
];

export default function Sidebar({ ongletActif, setOnglet, open, alertes }) {
  var auth  = useAuth();
  var user  = auth.user;
  var nav   = user && (user.role === 'proprietaire' || user.role === 'les_deux') ? NAV_PROPRIO : NAV_LOCATAIRE;
  var nbNonLus = alertes ? alertes.filter(function(a) { return !a.lu; }).length : 0;

  var initiales = user ? ((user.prenom || '').charAt(0) + (user.nom || '').charAt(0)).toUpperCase() : 'U';

  return (
    <div className={'sidebar ' + (open ? 'sidebar-open' : 'sidebar-closed')} style={{
      position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000,
      background: '#fff',
      borderRight: '1px solid #F0F0F0',
      display: 'flex', flexDirection: 'column',
      width: open ? 220 : 64,
      transition: 'width .25s ease',
      overflow: 'hidden',
      boxShadow: open ? '2px 0 12px rgba(0,0,0,0.06)' : 'none',
    }}>

      {/* Logo */}
      <div style={{ padding: open ? '18px 16px' : '18px 12px', borderBottom: '1px solid #F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
        <div style={{ width: 36, height: 36, background: '#1B2B22', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Logo size={36} showText={false} variant="gold" />
        </div>
        {open && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1B2B22', letterSpacing: -0.3 }}>Werdhe</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>
              {user && (user.role === 'proprietaire' || user.role === 'les_deux') ? 'Espace propriétaire' : 'Espace locataire'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {nav.map(function(item) {
          var actif   = ongletActif === item.path;
          var Icon    = item.icon;
          var isMsg   = item.path === '/dashboard/messages';
          var isAlerte = item.path === '/dashboard/alertes';
          var badge   = isMsg || isAlerte ? nbNonLus : 0;

          return (
            <button key={item.path}
              onClick={function() { setOnglet(item.path); }}
              title={!open ? item.label : ''}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 10, padding: open ? '9px 12px' : '9px', marginBottom: 2,
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: actif ? '#E8F5E9' : 'transparent',
                color: actif ? '#1B6B3A' : '#666',
                transition: 'all .15s',
                justifyContent: open ? 'flex-start' : 'center',
                position: 'relative',
              }}
              onMouseEnter={function(e) { if (!actif) e.currentTarget.style.background = '#F7F8F7'; }}
              onMouseLeave={function(e) { if (!actif) e.currentTarget.style.background = 'transparent'; }}>

              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Icon size={19} strokeWidth={actif ? 2 : 1.5} />
                {badge > 0 && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#E53935', borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {badge > 9 ? '9+' : badge}
                  </div>
                )}
              </div>

              {open && (
                <span style={{ fontSize: 13, fontWeight: actif ? 700 : 500, whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                  {item.label}
                </span>
              )}
              {open && actif && (
                <div style={{ width: 4, height: 4, background: '#1B6B3A', borderRadius: '50%', flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Plan badge */}
      {open && user && user.plan && user.plan !== 'gratuit' && (
        <div style={{ margin: '0 8px 8px', background: user.plan === 'agence' ? '#F3E5F5' : '#E8F5E9', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={13} strokeWidth={2} color={user.plan === 'agence' ? '#7B1FA2' : '#1B6B3A'} />
          <span style={{ fontSize: 11, color: user.plan === 'agence' ? '#7B1FA2' : '#1B6B3A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Plan {user.plan}
          </span>
        </div>
      )}

      {/* Profil en bas */}
      <div style={{ padding: open ? '12px 12px' : '12px 8px', borderTop: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 12, flexShrink: 0, cursor: 'pointer' }}
          onClick={function() { setOnglet('/dashboard/parametres'); }}>
          {initiales}
        </div>
        {open && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2B22', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user ? user.prenom + ' ' + user.nom : ''}
              </div>
              <div style={{ fontSize: 10, color: '#aaa' }}>{user ? user.email : ''}</div>
            </div>
            <button onClick={auth.logout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4, display: 'flex', alignItems: 'center' }}
              title="Déconnexion">
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}