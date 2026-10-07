/* eslint-disable */
import {
  LayoutDashboard, Home, Users, CalendarCheck,
  CreditCard, FileText, Bell, MessageCircle,
  Wrench, Send, Settings, TrendingUp, Clock, Zap, LogOut
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

var NAV_PROPRIO = [
  { path: '/dashboard',              icon: LayoutDashboard, labelKey: 'tableauDeBord'  },
  { path: '/dashboard/biens',        icon: Home,            labelKey: 'mesBiens'       },
  { path: '/dashboard/locataires',   icon: Users,           labelKey: 'locataires'     },
  { path: '/dashboard/reservations', icon: CalendarCheck,   labelKey: 'candidatures'   },
  { path: '/dashboard/paiements',    icon: CreditCard,      labelKey: 'paiements'      },
  { path: '/dashboard/documents',    icon: FileText,        labelKey: 'documents'      },
  { path: '/dashboard/alertes',      icon: Bell,            labelKey: 'alertes'        },
  { path: '/dashboard/messages',     icon: MessageCircle,   labelKey: 'messages'       },
  { path: '/dashboard/rapports',     icon: TrendingUp,      labelKey: 'rapports'       },
  { path: '/dashboard/reclamations', icon: Wrench,          labelKey: 'reclamations'   },
  { path: '/dashboard/preavis',      icon: Send,            labelKey: 'preavis'        },
  { path: '/dashboard/parametres',   icon: Settings,        labelKey: 'parametres'     },
];

var NAV_LOCATAIRE = [
  { path: '/dashboard',               icon: LayoutDashboard, labelKey: 'tableauDeBord'  },
  { path: '/dashboard/mes-locations', icon: Home,            labelKey: 'mesLocations'   },
  { path: '/dashboard/reservations',  icon: CalendarCheck,   labelKey: 'candidatures'   },
  { path: '/dashboard/paiements',     icon: CreditCard,      labelKey: 'paiements'      },
  { path: '/dashboard/documents',     icon: FileText,        labelKey: 'documents'      },
  { path: '/dashboard/messages',      icon: MessageCircle,   labelKey: 'messages'       },
  { path: '/dashboard/reclamations',  icon: Wrench,          labelKey: 'reclamations'   },
  { path: '/dashboard/preavis',       icon: Send,            labelKey: 'preavis'        },
  { path: '/dashboard/historique',    icon: Clock,           labelKey: 'historique'     },
  { path: '/dashboard/parametres',    icon: Settings,        labelKey: 'parametres'     },
];

export default function Sidebar({ ongletActif, setOnglet, open, alertes }) {
  var auth = useAuth();
  var user = auth.user;
  var t    = useTranslation('dashboard').t;
  var nav  = user && (user.role === 'proprietaire' || user.role === 'les_deux') ? NAV_PROPRIO : NAV_LOCATAIRE;
  var nbNonLus = alertes ? alertes.filter(function(a) { return !a.lu; }).length : 0;
  var initiales = user ? ((user.prenom || '').charAt(0) + (user.nom || '').charAt(0)).toUpperCase() : 'U';

  return (
        <div className={'sidebar-desktop' + (open ? ' open' : '')} style={{
    }}>

      {/* Logo */}
      <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid #F0F0F0', flexShrink: 0, gap: 10 }}>
        <div style={{ width: 36, height: 36, background: '#1B2B22', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Logo size={36} showText={false} variant="gold" />
        </div>
        {open && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1B2B22', letterSpacing: -0.3 }}>Werdhe</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>
              {user && (user.role === 'proprietaire' || user.role === 'les_deux') ? t('sidebar.espaceProprietaire') : t('sidebar.espaceLocataire')}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {nav.map(function(item) {
          var actif = ongletActif === item.path;
          var Icon  = item.icon;
          var badge = (item.path === '/dashboard/messages' || item.path === '/dashboard/alertes') ? nbNonLus : 0;
          var label = t('sidebar.nav.' + item.labelKey);

          return (
            <button key={item.path}
              onClick={function() { setOnglet(item.path); }}
              title={label}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center',
                gap: 10,
                padding: open ? '10px 12px' : '10px',
                marginBottom: 2,
                borderRadius: 10, border: 'none',
                cursor: 'pointer',
                background: actif ? '#E8F5E9' : 'transparent',
                color: actif ? '#1B6B3A' : '#777',
                transition: 'all .15s',
                justifyContent: open ? 'flex-start' : 'center',
                position: 'relative',
                textAlign: 'left',
              }}
              onMouseEnter={function(e) { if (!actif) { e.currentTarget.style.background = '#F5F6FA'; e.currentTarget.style.color = '#1B2B22'; }}}
              onMouseLeave={function(e) { if (!actif) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#777'; }}}>

              {/* Icône */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Icon size={19} strokeWidth={actif ? 2 : 1.5} />
                {badge > 0 && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#E53935', borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {badge > 9 ? '9+' : badge}
                  </div>
                )}
              </div>

              {/* Label */}
              {open && (
                <span style={{ fontSize: 13, fontWeight: actif ? 700 : 500, whiteSpace: 'nowrap', flex: 1 }}>
                  {label}
                </span>
              )}

              {/* Point actif */}
              {open && actif && (
                <div style={{ width: 5, height: 5, background: '#1B6B3A', borderRadius: '50%', flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Badge plan */}
      {open && user && user.plan && user.plan !== 'gratuit' && (
        <div style={{ margin: '0 8px 8px', background: user.plan === 'agence' ? '#F3E5F5' : '#E8F5E9', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={12} strokeWidth={2} color={user.plan === 'agence' ? '#7B1FA2' : '#1B6B3A'} />
          <span style={{ fontSize: 11, color: user.plan === 'agence' ? '#7B1FA2' : '#1B6B3A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('sidebar.plan', { plan: user.plan })}
          </span>
        </div>
      )}

      {/* Profil en bas */}
      <div style={{ padding: open ? '12px 12px' : '12px 8px', borderTop: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
              <div style={{ fontSize: 10, color: '#aaa' }}>
                {user ? user.role : ''}
              </div>
            </div>
            <button onClick={auth.logout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4, display: 'flex', alignItems: 'center' }}
              title={t('sidebar.deconnexion')}>
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}