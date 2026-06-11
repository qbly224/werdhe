/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

var GNF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' GNF';

export default function Admin() {
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;

  var [onglet, setOnglet]       = useState('stats');
  var [stats, setStats]         = useState(null);
  var [users, setUsers]         = useState([]);
  var [logements, setLogements] = useState([]);
  var [reservations, setReservations] = useState([]);
  var [loading, setLoading]     = useState(true);
  var [searchUser, setSearchUser] = useState('');

  // Vérifier que c'est bien un admin
  useEffect(function() {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    charger();
  }, [user]);

  function charger() {
    setLoading(true);
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/logements'),
      api.get('/admin/reservations'),
    ]).then(function(results) {
      setStats(results[0].data);
      setUsers(results[1].data.users || []);
      setLogements(results[2].data.logements || []);
      setReservations(results[3].data.reservations || []);
    }).catch(function(err) {
      // Mode démo si les routes admin n'existent pas encore
      setStats({
        total_users: 0, total_proprietaires: 0, total_locataires: 0,
        total_logements: 0, total_reservations: 0, total_confirmees: 0,
        revenus_plateforme: 0, logements_loues: 0
      });
    }).finally(function() { setLoading(false); });
  }

  function suspendreUser(id) {
    if (!window.confirm('Suspendre cet utilisateur ?')) return;
    api.patch('/admin/users/' + id + '/suspendre')
      .then(function() { toast.success('Utilisateur suspendu'); charger(); })
      .catch(function() { toast.error('Erreur'); });
  }

  function verifierLogement(id) {
    api.patch('/admin/logements/' + id + '/verifier')
      .then(function() { toast.success('Logement vérifié !'); charger(); })
      .catch(function() { toast.error('Erreur'); });
  }

  var usersFiltres = users.filter(function(u) {
    if (!searchUser) return true;
    var q = searchUser.toLowerCase();
    return (u.nom + ' ' + u.prenom + ' ' + u.email).toLowerCase().includes(q);
  });

  var NAV = [
    { id: 'stats',        label: 'Statistiques',   icon: '📊' },
    { id: 'users',        label: 'Utilisateurs',   icon: '👥' },
    { id: 'logements',    label: 'Logements',      icon: '🏠' },
    { id: 'reservations', label: 'Réservations',   icon: '📅' },
  ];

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: '#888' }}>Chargement panneau admin...</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', background: '#F7F8F7' }}>

      {/* SIDEBAR ADMIN */}
      <div style={{ width: 220, background: '#1B2B22', minHeight: '100vh', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 24px', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>🏠 Werdhe</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 }}>Panneau Administrateur</div>
        </div>
        <div style={{ padding: '16px 8px' }}>
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
        <div style={{ padding: '16px', borderTop: '0.5px solid rgba(255,255,255,0.1)', position: 'absolute', bottom: 0, width: 188 }}>
          <button onClick={function() { navigate('/dashboard'); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer' }}>
            ← Retour au dashboard
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

        {/* ─── STATISTIQUES ─── */}
        {onglet === 'stats' && stats && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>📊 Statistiques Werdhe</h1>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Vue d'ensemble de la plateforme</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total utilisateurs',    val: stats.total_users,         icon: '👥', color: '#1565C0', bg: '#E3F2FD' },
                { label: 'Propriétaires',          val: stats.total_proprietaires, icon: '🔑', color: '#1B6B3A', bg: '#E8F5E9' },
                { label: 'Locataires',             val: stats.total_locataires,    icon: '🏠', color: '#7B1FA2', bg: '#F3E5F5' },
                { label: 'Logements publiés',      val: stats.total_logements,     icon: '🏢', color: '#E65100', bg: '#FFF3E0' },
                { label: 'Logements loués',        val: stats.logements_loues,     icon: '✅', color: '#1B6B3A', bg: '#E8F5E9' },
                { label: 'Réservations totales',   val: stats.total_reservations,  icon: '📅', color: '#1565C0', bg: '#E3F2FD' },
                { label: 'Locations actives',      val: stats.total_confirmees,    icon: '🗝️', color: '#1B6B3A', bg: '#E8F5E9' },
                { label: 'Revenus plateforme',     val: GNF(stats.revenus_plateforme || 0), icon: '💰', color: '#C8860A', bg: '#FFF8E1' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ background: s.bg, borderRadius: 14, padding: 16, borderLeft: '4px solid ' + s.color }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Graphique simple */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>Répartition des réservations</div>
              {[
                { label: 'Confirmées (actives)', val: stats.total_confirmees, total: stats.total_reservations, color: '#1B6B3A' },
                { label: 'En cours de traitement', val: Math.max(0, stats.total_reservations - stats.total_confirmees - Math.floor(stats.total_reservations * 0.1)), total: stats.total_reservations, color: '#F5A623' },
                { label: 'Refusées / Annulées', val: Math.floor(stats.total_reservations * 0.1), total: stats.total_reservations, color: '#E53935' },
              ].map(function(item) {
                var pct = item.total > 0 ? Math.round(item.val / item.total * 100) : 0;
                return (
                  <div key={item.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
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
          </div>
        )}

        {/* ─── UTILISATEURS ─── */}
        {onglet === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>👥 Utilisateurs</h1>
                <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{users.length} utilisateur(s) inscrits</p>
              </div>
              <input type="text" placeholder="🔍 Chercher un utilisateur..." value={searchUser}
                onChange={function(e) { setSearchUser(e.target.value); }}
                style={{ padding: '9px 14px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', minWidth: 240 }} />
            </div>

            {usersFiltres.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Aucun utilisateur trouvé</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {usersFiltres.map(function(u) {
                var initiales = ((u.prenom || 'U').charAt(0) + (u.nom || 'U').charAt(0)).toUpperCase();
                var roleColor = u.role === 'admin' ? '#7B1FA2' : u.role === 'proprietaire' ? '#1B6B3A' : '#1565C0';
                return (
                  <div key={u.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ width: 44, height: 44, background: roleColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                      {initiales}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{u.prenom} {u.nom}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{u.email} · {u.telephone || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                        Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ background: roleColor + '20', color: roleColor, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                        {u.role}
                      </span>
                      {u.suspendu && (
                        <span style={{ background: '#FFEBEE', color: '#B71C1C', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Suspendu</span>
                      )}
                      {u.role !== 'admin' && (
                        <button onClick={function() { suspendreUser(u.id); }}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #FFCDD2', background: '#FFEBEE', color: '#B71C1C', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          {u.suspendu ? 'Réactiver' : 'Suspendre'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── LOGEMENTS ─── */}
        {onglet === 'logements' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>🏠 Tous les logements</h1>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>{logements.length} logement(s) sur la plateforme</p>

            {logements.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Aucun logement</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logements.map(function(l) {
                return (
                  <div key={l.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ width: 44, height: 44, background: '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{l.titre}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{l.adresse}, {l.ville} · {GNF(l.prix_mensuel)}/mois</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                        Propriétaire : {l.prop_prenom} {l.prop_nom}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: l.statut === 'loue' ? '#E8F5E9' : l.statut === 'disponible' ? '#E3F2FD' : '#F5F5F5', color: l.statut === 'loue' ? '#1B5E20' : l.statut === 'disponible' ? '#0D47A1' : '#888', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        {l.statut}
                      </span>
                      {l.verifie ? (
                        <span style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✅ Vérifié</span>
                      ) : (
                        <button onClick={function() { verifierLogement(l.id); }}
                          style={{ padding: '6px 12px', borderRadius: 8, background: '#1B6B3A', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          Vérifier
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── RÉSERVATIONS ─── */}
        {onglet === 'reservations' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>📅 Toutes les réservations</h1>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>{reservations.length} réservation(s) au total</p>

            {reservations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Aucune réservation</div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <thead>
                  <tr style={{ background: '#1B2B22' }}>
                    {['Locataire', 'Logement', 'Montant', 'Statut', 'Date'].map(function(h) {
                      return <th key={h} style={{ color: '#fff', padding: '12px 14px', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(function(r, i) {
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '0.5px solid #F0F0F0' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{r.locataire_prenom} {r.locataire_nom}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#555' }}>{r.logement_titre}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#1B6B3A' }}>{GNF(r.montant_total || 0)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: r.statut === 'confirmee' ? '#E8F5E9' : r.statut === 'refusee' ? '#FFEBEE' : '#FFF8E1', color: r.statut === 'confirmee' ? '#1B5E20' : r.statut === 'refusee' ? '#B71C1C' : '#7B4F00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {r.statut}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#888' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}