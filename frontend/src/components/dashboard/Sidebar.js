import {
  LayoutDashboard, Home, Users, CalendarCheck,
  CreditCard, FileText, Bell, MessageCircle,
  Wrench, Send, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

// Navigation propriétaire
var NAV_PROPRIETAIRE = [
  { path: '/dashboard',              icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Tableau de bord' },
  { path: '/dashboard/biens',        icon: <Home            size={20} strokeWidth={1.5} />, label: 'Mes biens'       },
  { path: '/dashboard/locataires',   icon: <Users           size={20} strokeWidth={1.5} />, label: 'Locataires'     },
  { path: '/dashboard/reservations', icon: <CalendarCheck   size={20} strokeWidth={1.5} />, label: 'Candidatures reçues' },
  { path: '/dashboard/paiements',    icon: <CreditCard      size={20} strokeWidth={1.5} />, label: 'Paiements'      },
  { path: '/dashboard/documents',    icon: <FileText        size={20} strokeWidth={1.5} />, label: 'Documents'      },
  { path: '/dashboard/alertes',      icon: <Bell            size={20} strokeWidth={1.5} />, label: 'Alertes'        },
  { path: '/dashboard/messages',     icon: <MessageCircle   size={20} strokeWidth={1.5} />, label: 'Messages'       },
  { path: '/dashboard/reclamations', icon: <Wrench          size={20} strokeWidth={1.5} />, label: 'Réclamations'  },
  { path: '/dashboard/preavis',      icon: <Send            size={20} strokeWidth={1.5} />, label: 'Préavis'        },
  { path: '/dashboard/parametres',   icon: <Settings        size={20} strokeWidth={1.5} />, label: 'Paramètres'    },
];

// Navigation locataire
var NAV_LOCATAIRE = [
  { path: '/dashboard',               icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Tableau de bord'  },
  { path: '/dashboard/mes-locations', icon: <Home            size={20} strokeWidth={1.5} />, label: 'Mes locations'    },
  { path: '/dashboard/reservations',  icon: <CalendarCheck   size={20} strokeWidth={1.5} />, label: 'Mes Candidatures' },
  { path: '/dashboard/paiements',     icon: <CreditCard      size={20} strokeWidth={1.5} />, label: 'Paiements'       },
  { path: '/dashboard/documents',     icon: <FileText        size={20} strokeWidth={1.5} />, label: 'Documents'       },
  { path: '/dashboard/messages',      icon: <MessageCircle   size={20} strokeWidth={1.5} />, label: 'Messages'        },
  { path: '/dashboard/reclamations',  icon: <Wrench          size={20} strokeWidth={1.5} />, label: 'Réclamations'   },
  { path: '/dashboard/preavis',       icon: <Send            size={20} strokeWidth={1.5} />, label: 'Préavis'         },
  { path: '/dashboard/parametres',    icon: <Settings        size={20} strokeWidth={1.5} />, label: 'Paramètres'     },
];

export default function Sidebar(props) {
  var ongletActif = props.ongletActif;
  var setOnglet = props.setOnglet;
  var open = props.open;
  var auth = useAuth();
  var user = auth.user;
  var logout = auth.logout;

  var nav = user && user.role === 'locataire' ? NAV_LOCATAIRE : NAV_PROPRIETAIRE;

  var initiales = '';
  if (user) {
    initiales = (user.prenom ? user.prenom.charAt(0) : '') + (user.nom ? user.nom.charAt(0) : '');
  }

  return (
    <div className={'sidebar-desktop' + (open ? ' open' : '')} style={{
      width: open ? 240 : 70,
      background: 'linear-gradient(180deg, #1B6B3A 0%, #134F2B 100%)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      flexShrink: 0,
      boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      overflow: 'hidden'
    }}>

      <div style={{padding:'20px 16px', borderBottom:'1px solid rgba(255,255,255,0.1)', flexShrink:0}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{
            width:38, height:38, background:'#F5A623',
            borderRadius:10, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:20, flexShrink:0
          }}>🏠</div>
          {open && (
            <div>
              <div style={{color:'#fff', fontWeight:800, fontSize:16, letterSpacing:0.5, whiteSpace:'nowrap'}}>Werdhe</div>
              <div style={{color:'rgba(255,255,255,0.6)', fontSize:11}}>Gestion Locative</div>
            </div>
          )}
        </div>
      </div>

      <nav style={{flex:1, padding:'12px 8px', overflowY:'auto', overflowX:'hidden'}}>
        {nav.map(function(item) {
          var isActive = ongletActif === '/dashboard/' + item.id || (item.id === 'dashboard' && ongletActif === '/dashboard');
          return (
            <div
              key={item.id}
              onClick={function() { setOnglet('/dashboard/' + item.id); }}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'11px 12px', borderRadius:10, marginBottom:4,
                cursor:'pointer',
                background: isActive ? 'rgba(245,166,35,0.2)' : 'transparent',
                borderLeft: isActive ? '3px solid #F5A623' : '3px solid transparent',
                transition:'all 0.2s',
                color: isActive ? '#F5A623' : 'rgba(255,255,255,0.75)',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{fontSize:18, flexShrink:0}}>{item.icon}</span>
              {open && (
                <span className="sidebar-label" style={{fontSize:14, fontWeight: isActive ? 600 : 400}}>
                  {item.label}
                </span>
              )}
              {open && item.badge && (
                <span style={{
                  marginLeft:'auto', background:'#E53935', color:'#fff',
                  borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700
                }}>3</span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{padding:'14px 12px', borderTop:'1px solid rgba(255,255,255,0.1)', flexShrink:0}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{
            width:34, height:34, background:'#F5A623',
            borderRadius:'50%', display:'flex', alignItems:'center',
            justifyContent:'center', fontWeight:700, color:'#1B6B3A',
            fontSize:14, flexShrink:0, cursor:'pointer'
          }}
          onClick={function() { setOnglet('/dashboard/parametres'); }}
          >
            {initiales}
          </div>
          {open && (
            <div style={{flex:1, overflow:'hidden'}}>
              <div style={{color:'#fff', fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                {user ? user.prenom + ' ' + user.nom : 'Utilisateur'}
              </div>
              <div
                style={{color:'rgba(255,255,255,0.5)', fontSize:11, cursor:'pointer'}}
                onClick={function(e) { e.stopPropagation(); logout(); }}
              >
                Deconnexion
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}