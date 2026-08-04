/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

export default function Admin() {
  var navigate  = useNavigate();
  var auth      = useAuth();
  var user      = auth.user;

  var [onglet, setOnglet]           = useState('stats');
  var [stats, setStats]             = useState(null);
  var [users, setUsers]             = useState([]);
  var [logements, setLogements]     = useState([]);
  var [reservations, setReservations] = useState([]);
  var [preavis, setPreavis]         = useState([]);
  var [revenus, setRevenus] = useState(null);
  var [alertes, setAlertes]         = useState([]);
  var [loading, setLoading]         = useState(true);
  var [searchUser, setSearchUser]   = useState('');
  var [filterRole, setFilterRole]   = useState('tous');
  var [filterStatut, setFilterStatut] = useState('tous');
  var intervalRef = useRef(null);
  var [codesPromo, setCodesPromo]   = useState([]);
  var [logsAudit, setLogsAudit]     = useState([]);
  var [showPromoForm, setShowPromoForm] = useState(false);
  var [promoForm, setPromoForm]     = useState({ code: '', reduction_pct: 20, nb_utilisations_max: 100 });

  useEffect(function() {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    charger();

    // Refresh automatique toutes les 30 secondes
    intervalRef.current = setInterval(charger, 30000);
    return function() { clearInterval(intervalRef.current); };
  }, [user]);

  function charger() {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/logements'),
      api.get('/admin/reservations'),
      api.get('/admin/preavis').catch(function() { return { data: { preavis: [] } }; }),
      api.get('/admin/revenus').catch(function() { return { data: null }; }),
      api.get('/alertes').catch(function() { return { data: { alertes: [] } }; }),
      api.get('/admin/codes-promo').catch(function() { return { data: { codes: [] } }; }),
      api.get('/admin/logs').catch(function() { return { data: { logs: [] } }; }),
    ]).then(function(results) {
      setStats(results[0].data);
      setUsers(results[1].data.users || []);
      setLogements(results[2].data.logements || []);
      setReservations(results[3].data.reservations || []);
      setPreavis(results[4].data.preavis || []);
      setRevenus(results[5].data || null);
      setAlertes(results[5].data.alertes || []);
      setCodesPromo(results[6].data.codes || []);
      setLogsAudit(results[7].data.logs   || []);
    }).catch(function(err) {
      console.error('[Admin] Erreur chargement:', err.message);
    }).finally(function() { setLoading(false); });
  }

  function suspendreUser(id, estSuspendu) {
    if (!window.confirm(estSuspendu ? 'Réactiver cet utilisateur ?' : 'Suspendre cet utilisateur ?')) return;
    api.patch('/admin/users/' + id + '/suspendre')
      .then(function() {
        toast.success(estSuspendu ? 'Utilisateur réactivé' : 'Utilisateur suspendu');
        charger();
      })
      .catch(function() { toast.error('Erreur'); });
  }

  function verifierLogement(id) {
    api.patch('/admin/logements/' + id + '/verifier')
      .then(function() { toast.success('Logement vérifié !'); charger(); })
      .catch(function() { toast.error('Erreur'); });
  }

  function supprimerLogement(id) {
    if (!window.confirm('Supprimer ce logement ?')) return;
    api.delete('/logements/' + id)
      .then(function() { toast.success('Logement supprimé'); charger(); })
      .catch(function() { toast.error('Erreur'); });
  }

  var usersFiltres = users.filter(function(u) {
    var matchSearch = !searchUser || (u.nom + ' ' + u.prenom + ' ' + u.email).toLowerCase().includes(searchUser.toLowerCase());
    var matchRole   = filterRole === 'tous' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  var reservationsFiltrees = reservations.filter(function(r) {
    return filterStatut === 'tous' || r.statut === filterStatut;
  });

var NAV = [
  { id: 'stats',        label: 'Vue d\'ensemble', icon: '📊' },
  { id: 'users',        label: 'Utilisateurs',    icon: '👥' },
  { id: 'logements',    label: 'Logements',       icon: '🏠' },
  { id: 'reservations', label: 'Réservations',    icon: '📅' },
  { id: 'abonnements',  label: 'Abonnements',     icon: '💳' },
  { id: 'promos',       label: 'Codes Promo',     icon: '🎟️' },
  { id: 'logs',         label: 'Logs Audit',      icon: '📋' },
  { id: 'alertes',      label: 'Alertes',         icon: '🔔' },
];

  var cfgStatuts = {
    en_attente:         { label: 'En attente',      color: '#F5A623', bg: '#FFF8E1' },
    dossier_requis:     { label: 'Dossier requis',  color: '#1565C0', bg: '#E3F2FD' },
    en_examen:          { label: 'En examen',       color: '#7B1FA2', bg: '#F3E5F5' },
    acceptee:           { label: 'Acceptée',        color: '#1B6B3A', bg: '#E8F5E9' },
    echanges:           { label: 'Échanges',        color: '#1565C0', bg: '#E3F2FD' },
    caution_requise:    { label: 'Caution requise', color: '#E65100', bg: '#FFF3E0' },
    caution_payee:      { label: 'Caution payée',   color: '#1B6B3A', bg: '#E8F5E9' },
    bail_en_cours:      { label: 'Bail en cours',   color: '#7B1FA2', bg: '#F3E5F5' },
    bail_signe_proprio: { label: 'Bail signé',      color: '#7B1FA2', bg: '#F3E5F5' },
    confirmee:          { label: 'Active 🗝️',       color: '#1B6B3A', bg: '#E8F5E9' },
    refusee:            { label: 'Refusée',         color: '#B71C1C', bg: '#FFEBEE' },
    terminee:           { label: 'Terminée',        color: '#888',    bg: '#F5F5F5' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 32 }}>🏠</div>
        <div style={{ color: '#888' }}>Chargement panneau admin...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', background: '#F7F8F7' }}>

      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <div className="admin-sidebar" style={{ width: 220, background: '#1B2B22', minHeight: '100vh', padding: '0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>🏠 Werdhe</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 }}>Panneau Admin</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: '#34A853', borderRadius: '50%' }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Sync toutes les 30s</span>
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(function(n) {
            var actif = onglet === n.id;
            return (
              <button key={n.id} onClick={function() { setOnglet(n.id); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: actif ? 'rgba(255,255,255,0.12)' : 'transparent', color: actif ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: actif ? 700 : 400, cursor: 'pointer', marginBottom: 4, textAlign: 'left' }}>
                <span>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '16px' }}>
          <button onClick={charger}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer', marginBottom: 8 }}>
            🔄 Actualiser maintenant
          </button>
          <button onClick={function() { navigate('/dashboard'); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer' }}>
            ← Retour dashboard
          </button>
        </div>
      </div>

      {/* ── CONTENU ───────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: 'clamp(12px, 3vw, 24px)', overflowY: 'auto', width: '100%', minWidth: 0 }}>
  {/* Menu mobile admin */}
  <div style={{ display: 'none' }} className="admin-mobile-menu">
    <div style={{ background: '#1B2B22', padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, borderRadius: 10 }}>
      {NAV.map(function(n) {
        return (
          <button key={n.id} onClick={function() { setOnglet(n.id); }}
            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: onglet === n.id ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: onglet === n.id ? 700 : 400 }}>
            {n.icon} {n.label}
          </button>
        );
      })}
    </div>
  </div>

        {/* ═══ VUE D'ENSEMBLE ═══════════════════════════════════ */}
        {onglet === 'stats' && stats && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>📊 Vue d'ensemble</h1>
                <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
                  Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={charger}
                style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                🔄 Actualiser
              </button>
            </div>

            {/* KPIs principaux */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Utilisateurs',      val: stats.total_users,         icon: '👥', color: '#1565C0', bg: '#E3F2FD' },
                { label: 'Propriétaires',     val: stats.total_proprietaires, icon: '🔑', color: '#1B6B3A', bg: '#E8F5E9' },
                { label: 'Locataires',        val: stats.total_locataires,    icon: '🏠', color: '#7B1FA2', bg: '#F3E5F5' },
                { label: 'Logements publiés', val: stats.total_logements,     icon: '🏢', color: '#E65100', bg: '#FFF3E0' },
                { label: 'Logements loués',   val: stats.logements_loues,     icon: '✅', color: '#1B6B3A', bg: '#E8F5E9' },
                { label: 'Réservations',      val: stats.total_reservations,  icon: '📅', color: '#1565C0', bg: '#E3F2FD' },
                { label: 'Locations actives', val: stats.total_confirmees,    icon: '🗝️', color: '#1B6B3A', bg: '#E8F5E9' },
                { label: 'Revenus (5%)',      val: GNF(stats.revenus_plateforme || 0), icon: '💰', color: '#C8860A', bg: '#FFF8E1' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ background: s.bg, borderRadius: 14, padding: 16, borderLeft: '4px solid ' + s.color }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
            {/* Abonnements */}
<div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: 16 }}>
  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>Abonnements actifs</div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
    {[
      { label: 'Gratuit',  val: stats.abonnements.gratuit, color: '#888',    bg: '#F5F5F5' },
      { label: 'Essai',    val: stats.abonnements.essai,   color: '#E65100', bg: '#FFF3E0' },
      { label: 'Pro',      val: stats.abonnements.pro,     color: '#1B6B3A', bg: '#E8F5E9' },
      { label: 'Agence',   val: stats.abonnements.agence,  color: '#7B1FA2', bg: '#F3E5F5' },
    ].map(function(a, i) {
      return (
        <div key={i} style={{ background: a.bg, borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: a.color }}>{a.val}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{a.label}</div>
        </div>
      );
    })}
  </div>
</div>

{/* Graphique inscriptions */}
{stats.evolution && stats.evolution.length > 0 && (
  <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>Inscriptions (6 mois)</div>
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
      {stats.evolution.map(function(m, i) {
        var max = Math.max.apply(null, stats.evolution.map(function(x) { return Number(x.nb_users); }));
        var pct = max > 0 ? Number(m.nb_users) / max : 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#1B6B3A', fontWeight: 700 }}>{m.nb_users}</div>
            <div style={{ width: '100%', background: '#1B6B3A', borderRadius: '4px 4px 0 0', height: Math.max(4, Math.round(pct * 80)) + 'px', transition: 'height .5s' }} />
            <div style={{ fontSize: 9, color: '#888', textAlign: 'center' }}>{m.mois}</div>
          </div>
        );
      })}
    </div>
  </div>
)}

{/* Logs récents */}
{stats.logs_recents && stats.logs_recents.length > 0 && (
  <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>Activité récente</div>
    {stats.logs_recents.map(function(l, i) {
      return (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '0.5px solid #F5F5F5', alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, background: l.action.includes('admin') ? '#F5A623' : '#1B6B3A', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{l.prenom} {l.nom}</span>
            <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{l.action}</span>
          </div>
          <div style={{ fontSize: 11, color: '#aaa' }}>
            {new Date(l.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    })}
  </div>
)}

            {/* Graphique réservations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>Répartition réservations</div>
                {[
                  { label: 'Locations actives',      val: stats.total_confirmees,                                                                                                          color: '#1B6B3A' },
                  { label: 'En cours de traitement', val: Math.max(0, stats.total_reservations - stats.total_confirmees - Math.floor(stats.total_reservations * 0.1)), color: '#F5A623' },
                  { label: 'Refusées / Annulées',   val: Math.floor(stats.total_reservations * 0.1),                                                                  color: '#E53935' },
                ].map(function(item) {
                  var pct = stats.total_reservations > 0 ? Math.round(item.val / stats.total_reservations * 100) : 0;
                  return (
                    <div key={item.label} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                        <span style={{ color: '#555' }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: item.color }}>{item.val} ({pct}%)</span>
                      </div>
                      <div style={{ background: '#F0F0F0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{ background: item.color, width: pct + '%', height: '100%', borderRadius: 4, transition: 'width .5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>Alertes récentes</div>
                {alertes.slice(0, 5).map(function(a, i) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{a.type === 'loyer_retard' ? '⚠️' : '📋'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>{a.titre}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  );
                })}
                {alertes.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>Aucune alerte</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ UTILISATEURS ════════════════════════════════════ */}
        {onglet === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>👥 Utilisateurs</h1>
                <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{usersFiltres.length} / {users.length} utilisateur(s)</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input type="text" placeholder="🔍 Rechercher..." value={searchUser}
                  onChange={function(e) { setSearchUser(e.target.value); }}
                  style={{ padding: '9px 14px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
                <select value={filterRole} onChange={function(e) { setFilterRole(e.target.value); }}
                  style={{ padding: '9px 14px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="tous">Tous les rôles</option>
                  <option value="locataire">Locataires</option>
                  <option value="proprietaire">Propriétaires</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {usersFiltres.map(function(u) {
                var initiales = ((u.prenom || 'U').charAt(0) + (u.nom || 'U').charAt(0)).toUpperCase();
                var roleColor = u.role === 'admin' ? '#7B1FA2' : u.role === 'proprietaire' ? '#1B6B3A' : '#1565C0';
                var nbResasUser = reservations.filter(function(r) { return r.locataire_id === u.id || r.proprietaire_id === u.id; }).length;
                return (
                  <div key={u.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: u.suspendu ? 0.6 : 1 }}>
                    <div style={{ width: 44, height: 44, background: roleColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                      {initiales}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{u.prenom} {u.nom}</span>
                        {u.suspendu && <span style={{ background: '#FFEBEE', color: '#B71C1C', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Suspendu</span>}
                        {u.plan && u.plan !== 'gratuit' && <span style={{ background: '#E8F5E9', color: '#1B6B3A', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{u.plan}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{u.email} · {u.telephone || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                        Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')} · {nbResasUser} réservation(s)
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ background: roleColor + '20', color: roleColor, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                        {u.role}
                      </span>
                      {u.role !== 'admin' && (
                        <button onClick={function() { suspendreUser(u.id, u.suspendu); }}
                          style={{ padding: '6px 12px', borderRadius: 8, border: u.suspendu ? '0.5px solid #A5D6A7' : '0.5px solid #FFCDD2', background: u.suspendu ? '#E8F5E9' : '#FFEBEE', color: u.suspendu ? '#1B5E20' : '#B71C1C', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          {u.suspendu ? '✅ Réactiver' : '🚫 Suspendre'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ LOGEMENTS ═══════════════════════════════════════ */}
        {onglet === 'logements' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>🏠 Logements</h1>
                <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{logements.length} logement(s) sur la plateforme</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logements.map(function(l) {
                var nbResas = reservations.filter(function(r) { return r.logement_id === l.id; }).length;
                return (
                  <div key={l.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ width: 44, height: 44, background: l.statut === 'loue' ? '#E8F5E9' : '#FFF8E1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{l.titre}</span>
                        {l.verifie && <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>✅ Vérifié</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{l.adresse}, {l.ville} · {GNF(l.prix_mensuel)}/mois</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                        Propriétaire : {l.prop_prenom} {l.prop_nom} · {nbResas} réservation(s)
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: l.statut === 'loue' ? '#E8F5E9' : '#E3F2FD', color: l.statut === 'loue' ? '#1B5E20' : '#0D47A1', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        {l.statut}
                      </span>
                      {!l.verifie && (
                        <button onClick={function() { verifierLogement(l.id); }}
                          style={{ padding: '6px 12px', borderRadius: 8, background: '#1B6B3A', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          ✅ Vérifier
                        </button>
                      )}
                      <button onClick={function() { supprimerLogement(l.id); }}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ RÉSERVATIONS ════════════════════════════════════ */}
        {onglet === 'reservations' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>📅 Réservations</h1>
                <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{reservationsFiltrees.length} / {reservations.length} réservation(s)</p>
              </div>
              <select value={filterStatut} onChange={function(e) { setFilterStatut(e.target.value); }}
                style={{ padding: '9px 14px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="tous">Tous les statuts</option>
                {Object.keys(cfgStatuts).map(function(s) {
                  return <option key={s} value={s}>{cfgStatuts[s].label}</option>;
                })}
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1B2B22' }}>
                    {['Locataire', 'Logement', 'Propriétaire', 'Montant', 'Statut', 'Date'].map(function(h) {
                      return <th key={h} style={{ color: '#fff', padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {reservationsFiltrees.map(function(r, i) {
                    var cfg = cfgStatuts[r.statut] || { label: r.statut, color: '#888', bg: '#F5F5F5' };
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '0.5px solid #F0F0F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1B2B22' }}>{r.locataire_prenom} {r.locataire_nom}</td>
                        <td style={{ padding: '10px 14px', color: '#555' }}>{r.logement_titre}</td>
                        <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>{r.prop_prenom} {r.prop_nom}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1B6B3A' }}>{GNF(r.montant_total || 0)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ REVENUS ════════════════════════════════════ */}
{onglet === 'revenus' && (
  <div>
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>💰 Revenus Werdhe</h1>
      <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Commissions et abonnements</p>
    </div>

    {!revenus && (
      <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement des revenus...</div>
    )}

    {revenus && (
      <div>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Commissions ce mois',     val: GNF(revenus.commissions.total_commissions || 0),   icon: '💰', color: '#1B6B3A', bg: '#E8F5E9' },
            { label: 'Commissions encaissées',   val: GNF(revenus.commissions.encaisse || 0),            icon: '✅', color: '#1B6B3A', bg: '#E8F5E9' },
            { label: 'Commissions en attente',   val: GNF(revenus.commissions.en_attente || 0),          icon: '⏳', color: '#E65100', bg: '#FFF3E0' },
            { label: 'Revenus abonnements',      val: GNF(revenus.abonnements.revenus_abonnements || 0), icon: '📋', color: '#1565C0', bg: '#E3F2FD' },
            { label: 'Abonnés Pro',              val: revenus.abonnements.nb_pro || 0,                   icon: '⭐', color: '#1B6B3A', bg: '#E8F5E9' },
            { label: 'Abonnés Agence',           val: revenus.abonnements.nb_agence || 0,                icon: '🏢', color: '#7B1FA2', bg: '#F3E5F5' },
          ].map(function(s, i) {
            return (
              <div key={i} style={{ background: s.bg, borderRadius: 14, padding: 16, borderLeft: '4px solid ' + s.color }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Évolution 6 mois */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>Évolution des commissions (6 mois)</div>
          {revenus.evolution.length === 0 && (
            <div style={{ color: '#888', fontSize: 13 }}>Aucune commission pour le moment.</div>
          )}
          {revenus.evolution.map(function(m, i) {
            var max = Math.max.apply(null, revenus.evolution.map(function(x) { return Number(x.commissions); }));
            var pct = max > 0 ? Math.round(Number(m.commissions) / max * 100) : 0;
            var moisLabel = new Date(m.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: '#555', textTransform: 'capitalize' }}>{moisLabel}</span>
                  <span style={{ fontWeight: 700, color: '#1B6B3A' }}>{GNF(m.commissions)}</span>
                </div>
                <div style={{ background: '#F0F0F0', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #1B6B3A, #34A853)', width: pct + '%', height: '100%', borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
)}

        {/* ═══ ALERTES ═════════════════════════════════════════ */}
        {onglet === 'alertes' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>🔔 Alertes plateforme</h1>
              <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{alertes.length} alerte(s)</p>
            </div>

            {alertes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#fff', borderRadius: 14 }}>
                ✅ Aucune alerte active
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alertes.map(function(a, i) {
                var couleur = a.priorite === 'haute' ? '#E53935' : a.type === 'loyer_retard' ? '#F5A623' : '#1565C0';
                return (
                  <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid ' + couleur, display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{a.type === 'loyer_retard' ? '⚠️' : a.type === 'bail_bientot' ? '📋' : '🔔'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{a.titre}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{a.description}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                        {new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span style={{ background: couleur + '20', color: couleur, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, alignSelf: 'flex-start', flexShrink: 0 }}>
                      {a.priorite || 'normale'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ABONNEMENTS ════════════════════════════════════════ */}
{onglet === 'abonnements' && (
  <div>
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>💳 Abonnements</h1>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {users.filter(function(u) { return u.role !== 'admin'; }).map(function(u) {
        return (
          <div key={u.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{u.prenom} {u.nom}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{u.email} · {u.role}</div>
            </div>
            <select
              value={u.plan || 'gratuit'}
              onChange={function(e) {
                var newPlan = e.target.value;
                api.patch('/admin/users/' + u.id + '/plan', { plan: newPlan })
                  .then(function() {
                    toast.success('Plan mis à jour !');
                    charger();
                  })
                  .catch(function() { toast.error('Erreur'); });
              }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="gratuit">Gratuit</option>
              <option value="pro">Pro</option>
              <option value="agence">Agence</option>
            </select>
          </div>
        );
      })}
    </div>
  </div>
)}

{/* ═══ CODES PROMO ═════════════════════════════════════════ */}
{onglet === 'promos' && (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>🎟️ Codes Promo</h1>
      <button onClick={function() { setShowPromoForm(!showPromoForm); }}
        style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        + Nouveau code
      </button>
    </div>

    {showPromoForm && (
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Code *</label>
            <input type="text" placeholder="PROMO2026" value={promoForm.code}
              onChange={function(e) { setPromoForm(Object.assign({}, promoForm, { code: e.target.value.toUpperCase() })); }}
              style={{ padding: '9px 12px', border: '1.5px solid #E0E0E0', borderRadius: 8, fontSize: 13, width: '100%', fontFamily: 'monospace', letterSpacing: 1 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Réduction %</label>
            <input type="number" min="1" max="100" value={promoForm.reduction_pct}
              onChange={function(e) { setPromoForm(Object.assign({}, promoForm, { reduction_pct: e.target.value })); }}
              style={{ padding: '9px 12px', border: '1.5px solid #E0E0E0', borderRadius: 8, fontSize: 13, width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Nb max utilisations</label>
            <input type="number" value={promoForm.nb_utilisations_max}
              onChange={function(e) { setPromoForm(Object.assign({}, promoForm, { nb_utilisations_max: e.target.value })); }}
              style={{ padding: '9px 12px', border: '1.5px solid #E0E0E0', borderRadius: 8, fontSize: 13, width: '100%' }} />
          </div>
        </div>
        <button
          onClick={function() {
            api.post('/admin/codes-promo', promoForm)
              .then(function() {
                toast.success('Code créé !');
                setShowPromoForm(false);
                setPromoForm({ code: '', reduction_pct: 20, nb_utilisations_max: 100 });
                charger();
              })
              .catch(function(err) { toast.error(err.response?.data?.erreur || 'Erreur'); });
          }}
          style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          Créer le code
        </button>
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {codesPromo.map(function(c) {
        return (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: c.actif ? 1 : 0.5 }}>
            <div style={{ background: '#F0FBF0', border: '1.5px dashed #A5D6A7', borderRadius: 8, padding: '6px 14px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#1B6B3A', letterSpacing: 1 }}>{c.code}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>-{c.reduction_pct}% sur le plan {c.plan_cible}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {c.nb_utilisations}/{c.nb_utilisations_max} utilisations
                {c.expire_at && ' · Expire le ' + new Date(c.expire_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: c.actif ? '#E8F5E9' : '#F5F5F5', color: c.actif ? '#1B5E20' : '#888', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                {c.actif ? 'Actif' : 'Inactif'}
              </span>
              <button
                onClick={function() {
                  api.patch('/admin/codes-promo/' + c.id + '/toggle')
                    .then(function() { charger(); })
                    .catch(function() { toast.error('Erreur'); });
                }}
                style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #E0E0E0', background: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: c.actif ? '#B71C1C' : '#1B6B3A' }}>
                {c.actif ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

{/* ═══ LOGS AUDIT ══════════════════════════════════════════ */}
{onglet === 'logs' && (
  <div>
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>📋 Logs d'audit</h1>
      <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{logsAudit.length} entrée(s)</p>
    </div>
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      {logsAudit.map(function(l, i) {
        var actionColor = l.action.includes('admin') ? '#F5A623'
          : l.action.includes('connexion') ? '#1B6B3A'
          : l.action.includes('suspend') ? '#E53935'
          : '#1565C0';
        return (
          <div key={l.id} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderBottom: '0.5px solid #F5F5F5', alignItems: 'flex-start', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
            <div style={{ width: 8, height: 8, background: actionColor, borderRadius: '50%', flexShrink: 0, marginTop: 5 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{l.prenom || '?'} {l.nom || ''}</span>
                <span style={{ background: actionColor + '20', color: actionColor, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{l.action}</span>
              </div>
              {l.email && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{l.email}</div>}
              {l.ip_address && <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>IP: {l.ip_address}</div>}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', flexShrink: 0, textAlign: 'right' }}>
              {new Date(l.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}<br/>
              {new Date(l.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

      </div>
    </div>
  );
}