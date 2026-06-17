/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

// ─── GRAPHIQUE EN BARRES CSS ──────────────────────────────────────
function BarChart({ data, color }) {
  if (!data || data.length === 0) return <div style={{ color: '#888', fontSize: 13 }}>Aucune donnée</div>;
  var max = Math.max.apply(null, data.map(function(d) { return Number(d.total); }));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, paddingTop: 10 }}>
      {data.map(function(d, i) {
        var h = max > 0 ? Math.round(Number(d.total) / max * 80) : 0;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ fontSize: 11, color: color || '#1B6B3A', fontWeight: 700, marginBottom: 4 }}>{d.total}</div>
            <div style={{ width: '100%', height: h + '%', minHeight: 4, background: color || '#1B6B3A', borderRadius: '4px 4px 0 0', opacity: 0.85 }} />
            <div style={{ fontSize: 9, color: '#888', marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>{d.mois || d.ville}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── BADGE STATUT ─────────────────────────────────────────────────
function Badge({ label, color }) {
  var cfg = {
    vert:   { bg: '#E8F5E9', color: '#1B5E20' },
    rouge:  { bg: '#FFEBEE', color: '#B71C1C' },
    bleu:   { bg: '#E3F2FD', color: '#0D47A1' },
    orange: { bg: '#FFF3E0', color: '#E65100' },
    violet: { bg: '#F3E5F5', color: '#6A1B9A' },
    gris:   { bg: '#F5F5F5', color: '#555' },
  };
  var s = cfg[color] || cfg.gris;
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {label}
    </span>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────
export default function Admin() {
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;

  var [onglet, setOnglet] = useState('stats');
  var [stats, setStats] = useState(null);
  var [users, setUsers] = useState([]);
  var [logements, setLogements] = useState([]);
  var [paiements, setPaiements] = useState([]);
  var [documents, setDocuments] = useState([]);
  var [signalements, setSignalements] = useState([]);
  var [loading, setLoading] = useState(true);
  var [loadingOnglet, setLoadingOnglet] = useState(false);

  // Filtres
  var [searchUser, setSearchUser] = useState('');
  var [roleFilter, setRoleFilter] = useState('tous');
  var [statutFilter, setStatutFilter] = useState('tous');
  var [searchLogement, setSearchLogement] = useState('');
  var [statutLogement, setStatutLogement] = useState('tous');
  var [searchPaiement, setSearchPaiement] = useState('');
  var [modePaiement, setModePaiement] = useState('tous');
  var [typeDoc, setTypeDoc] = useState('tous');
  var [statutSig, setStatutSig] = useState('tous');

  // Vérification accès admin
  useEffect(function() {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    chargerStats();
  }, [user]);

  function chargerStats() {
    setLoading(true);
    api.get('/admin/stats')
      .then(function(res) { setStats(res.data); })
      .catch(function() {
        setStats({
          users: { total: 0, proprio: 0, locataire: 0, suspendus: 0 },
          logements: { total: 0, loues: 0, disponibles: 0 },
          reservations: { total: 0, confirmees: 0 },
          paiements: { volume: 0, total: 0 },
          signalements: { total: 0, ouverts: 0 },
          inscriptions_mois: [],
          logements_mois: [],
          villes_actives: []
        });
      })
      .finally(function() { setLoading(false); });
  }

  function chargerOnglet(tab) {
    setLoadingOnglet(true);
    var appel;
    if (tab === 'users') {
      var p = new URLSearchParams({ role: roleFilter, statut: statutFilter });
      if (searchUser) p.append('search', searchUser);
      appel = api.get('/admin/users?' + p).then(function(r) { setUsers(r.data.users || []); });
    } else if (tab === 'logements') {
      var p = new URLSearchParams({ statut: statutLogement });
      if (searchLogement) p.append('search', searchLogement);
      appel = api.get('/admin/logements?' + p).then(function(r) { setLogements(r.data.logements || []); });
    } else if (tab === 'paiements') {
      var p = new URLSearchParams({ mode: modePaiement });
      if (searchPaiement) p.append('search', searchPaiement);
      appel = api.get('/admin/paiements?' + p).then(function(r) { setPaiements(r.data.paiements || []); });
    } else if (tab === 'documents') {
      appel = api.get('/admin/documents?type=' + typeDoc).then(function(r) { setDocuments(r.data.documents || []); });
    } else if (tab === 'signalements') {
      appel = api.get('/admin/signalements?statut=' + statutSig).then(function(r) { setSignalements(r.data.signalements || []); });
    } else {
      setLoadingOnglet(false); return;
    }
    appel.catch(console.error).finally(function() { setLoadingOnglet(false); });
  }

  useEffect(function() { if (onglet !== 'stats') chargerOnglet(onglet); }, [onglet, roleFilter, statutFilter, searchUser, statutLogement, searchLogement, modePaiement, searchPaiement, typeDoc, statutSig]);

  // Actions utilisateurs
  function suspendreUser(id, nom) {
    if (!window.confirm('Suspendre / réactiver le compte de ' + nom + ' ?')) return;
    api.patch('/admin/users/' + id + '/suspendre')
      .then(function(r) { toast.success(r.data.message); chargerOnglet('users'); })
      .catch(function() { toast.error('Erreur'); });
  }

  function verifierUser(id, val) {
    api.patch('/admin/users/' + id + '/verifier', { verifie: val })
      .then(function(r) { toast.success(r.data.message); chargerOnglet('users'); })
      .catch(function() { toast.error('Erreur'); });
  }

  // Actions logements
  function masquerLogement(id, titre) {
    if (!window.confirm('Masquer / afficher : ' + titre + ' ?')) return;
    api.patch('/admin/logements/' + id + '/masquer')
      .then(function(r) { toast.success(r.data.message); chargerOnglet('logements'); })
      .catch(function() { toast.error('Erreur'); });
  }

  function supprimerLogement(id, titre) {
    if (!window.confirm('SUPPRIMER définitivement : ' + titre + ' ? Cette action est irréversible.')) return;
    api.delete('/admin/logements/' + id)
      .then(function() { toast.success('Logement supprimé'); chargerOnglet('logements'); })
      .catch(function() { toast.error('Erreur'); });
  }

  function verifierLogement(id) {
    api.patch('/admin/logements/' + id + '/verifier')
      .then(function() { toast.success('Logement vérifié ✅'); chargerOnglet('logements'); })
      .catch(function() { toast.error('Erreur'); });
  }

  // Signalement
  function traiterSignalement(id, action) {
    api.patch('/admin/signalements/' + id + '/traiter', { action: action })
      .then(function() { toast.success('Signalement traité'); chargerOnglet('signalements'); })
      .catch(function() { toast.error('Erreur'); });
  }

  var NAV = [
    { id: 'stats',        label: 'Tableau de bord', icon: '📊' },
    { id: 'users',        label: 'Utilisateurs',    icon: '👥' },
    { id: 'logements',    label: 'Logements',       icon: '🏠' },
    { id: 'paiements',    label: 'Paiements',       icon: '💰' },
    { id: 'documents',    label: 'Documents',       icon: '📄' },
    { id: 'signalements', label: 'Signalements',    icon: '🚨' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏠</div>
          <div style={{ fontSize: 16, color: '#888' }}>Chargement panneau admin Werdhe...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', background: '#F7F8F7' }}>

      {/* ═══ SIDEBAR ═══════════════════════════════════════════════ */}
      <div style={{ width: 220, background: '#1B2B22', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>🏠 Werdhe</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 }}>Panneau Administrateur</div>
          <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Connecté en tant que</div>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{user && user.prenom + ' ' + user.nom}</div>
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(function(n) {
            var actif = onglet === n.id;
            var badge = n.id === 'signalements' && stats && stats.signalements && stats.signalements.ouverts > 0
              ? stats.signalements.ouverts : null;
            return (
              <button key={n.id}
                onClick={function() { setOnglet(n.id); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: actif ? 'rgba(255,255,255,0.12)' : 'transparent', color: actif ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: actif ? 700 : 400, cursor: 'pointer', marginBottom: 3, textAlign: 'left', borderLeft: actif ? '3px solid #4CAF50' : '3px solid transparent', transition: 'all .15s' }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {badge && <span style={{ background: '#E53935', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 12, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <button onClick={function() { navigate('/dashboard'); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 12, cursor: 'pointer', marginBottom: 6 }}>
            ← Retour au dashboard
          </button>
          <button onClick={function() { auth.logout(); }}
            style={{ width: '100%', background: 'rgba(229,57,53,0.15)', color: '#EF9A9A', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 12, cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
      </div>

      {/* ═══ CONTENU PRINCIPAL ═════════════════════════════════════ */}
      <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto', maxHeight: '100vh' }}>

        {/* ─── TABLEAU DE BORD STATS ─── */}
        {onglet === 'stats' && stats && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2B22', margin: 0 }}>Tableau de bord</h1>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                Vue d'ensemble de la plateforme Werdhe · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* KPIs principaux */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Utilisateurs',        val: stats.users.total,              icon: '👥', color: '#1565C0', bg: '#E3F2FD', sub: stats.users.suspendus + ' suspendu(s)' },
                { label: 'Propriétaires',        val: stats.users.proprio,            icon: '🔑', color: '#1B6B3A', bg: '#E8F5E9', sub: stats.users.verifies + ' vérifié(s)' },
                { label: 'Locataires',           val: stats.users.locataire,          icon: '🏠', color: '#7B1FA2', bg: '#F3E5F5', sub: 'Inscrits' },
                { label: 'Logements',            val: stats.logements.total,          icon: '🏢', color: '#E65100', bg: '#FFF3E0', sub: stats.logements.loues + ' loué(s)' },
                { label: 'Réservations',         val: stats.reservations.total,       icon: '📅', color: '#1565C0', bg: '#E3F2FD', sub: stats.reservations.confirmees + ' actives' },
                { label: 'Volume paiements',     val: GNF(stats.paiements.volume),   icon: '💰', color: '#C8860A', bg: '#FFF8E1', sub: stats.paiements.total + ' transactions' },
                { label: 'Signalements',         val: stats.signalements.total,       icon: '🚨', color: stats.signalements.ouverts > 0 ? '#B71C1C' : '#1B6B3A', bg: stats.signalements.ouverts > 0 ? '#FFEBEE' : '#E8F5E9', sub: stats.signalements.ouverts + ' ouvert(s)' },
                { label: 'Revenus Werdhe (5%)',  val: GNF(stats.paiements.volume * 0.05), icon: '📈', color: '#1B6B3A', bg: '#E8F5E9', sub: 'Commission plateforme' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '16px', borderLeft: '4px solid ' + s.color }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: '#333', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Graphiques */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>📈 Nouvelles inscriptions / mois</div>
                <BarChart data={stats.inscriptions_mois} color="#1565C0" />
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>🏠 Logements publiés / mois</div>
                <BarChart data={stats.logements_mois} color="#1B6B3A" />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>📍 Villes les plus actives</div>
              {stats.villes_actives.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>Aucune donnée</div>}
              {stats.villes_actives.map(function(v, i) {
                var max = stats.villes_actives[0] ? Number(stats.villes_actives[0].total) : 1;
                var pct = Math.round(Number(v.total) / max * 100);
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: '#1B2B22' }}>{v.ville}</span>
                      <span style={{ color: '#888' }}>{v.total} logement(s)</span>
                    </div>
                    <div style={{ background: '#F0F0F0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ background: '#1B6B3A', width: pct + '%', height: '100%', borderRadius: 4 }} />
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
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>👥 Gestion des utilisateurs</h1>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{users.length} utilisateur(s)</div>
            </div>

            {/* Filtres */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" placeholder="🔍 Rechercher..." value={searchUser}
                onChange={function(e) { setSearchUser(e.target.value); }}
                style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
              {[['tous', 'Tous'], ['proprietaire', 'Propriétaires'], ['locataire', 'Locataires']].map(function(f) {
                return (
                  <button key={f[0]} onClick={function() { setRoleFilter(f[0]); }}
                    style={{ padding: '7px 14px', borderRadius: 20, border: roleFilter === f[0] ? '1.5px solid #1B6B3A' : '0.5px solid #E0E0E0', background: roleFilter === f[0] ? '#1B6B3A' : '#fff', color: roleFilter === f[0] ? '#fff' : '#555', fontSize: 12, fontWeight: roleFilter === f[0] ? 700 : 400, cursor: 'pointer' }}>
                    {f[1]}
                  </button>
                );
              })}
              {[['tous', 'Tous statuts'], ['actifs', 'Actifs'], ['suspendus', 'Suspendus']].map(function(f) {
                return (
                  <button key={f[0]} onClick={function() { setStatutFilter(f[0]); }}
                    style={{ padding: '7px 14px', borderRadius: 20, border: statutFilter === f[0] ? '1.5px solid #E53935' : '0.5px solid #E0E0E0', background: statutFilter === f[0] ? '#FFEBEE' : '#fff', color: statutFilter === f[0] ? '#B71C1C' : '#555', fontSize: 12, fontWeight: statutFilter === f[0] ? 700 : 400, cursor: 'pointer' }}>
                    {f[1]}
                  </button>
                );
              })}
            </div>

            {loadingOnglet && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement...</div>}
            {!loadingOnglet && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {users.map(function(u) {
                  var initiales = ((u.prenom || 'U').charAt(0) + (u.nom || 'U').charAt(0)).toUpperCase();
                  var roleColor = u.role === 'admin' ? 'violet' : u.role === 'proprietaire' ? 'vert' : 'bleu';
                  return (
                    <div key={u.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderLeft: u.suspendu ? '4px solid #E53935' : '4px solid transparent' }}>
                      <div style={{ width: 44, height: 44, background: u.role === 'proprietaire' ? '#1B6B3A' : '#1565C0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                        {initiales}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{u.prenom} {u.nom}</span>
                          <Badge label={u.role} color={roleColor} />
                          {u.verifie && <Badge label="✅ Vérifié" color="vert" />}
                          {u.suspendu && <Badge label="⛔ Suspendu" color="rouge" />}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>{u.email} · {u.telephone || 'N/A'}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                          Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                          {u.role === 'proprietaire' && (' · ' + u.nb_logements + ' logement(s)')}
                          {u.role === 'locataire' && (' · ' + u.nb_reservations + ' réservation(s)')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {u.role === 'proprietaire' && !u.verifie && (
                          <button onClick={function() { verifierUser(u.id, true); }}
                            style={{ padding: '6px 12px', borderRadius: 8, background: '#E8F5E9', color: '#1B5E20', border: '0.5px solid #A5D6A7', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            ✅ Vérifier identité
                          </button>
                        )}
                        {u.role === 'proprietaire' && u.verifie && (
                          <button onClick={function() { verifierUser(u.id, false); }}
                            style={{ padding: '6px 12px', borderRadius: 8, background: '#F5F5F5', color: '#888', border: '0.5px solid #E0E0E0', fontSize: 11, cursor: 'pointer' }}>
                            Retirer badge
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button onClick={function() { suspendreUser(u.id, u.prenom + ' ' + u.nom); }}
                            style={{ padding: '6px 12px', borderRadius: 8, background: u.suspendu ? '#E8F5E9' : '#FFEBEE', color: u.suspendu ? '#1B5E20' : '#B71C1C', border: u.suspendu ? '0.5px solid #A5D6A7' : '0.5px solid #FFCDD2', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            {u.suspendu ? '✅ Réactiver' : '⛔ Suspendre'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {users.length === 0 && !loadingOnglet && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Aucun utilisateur trouvé</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── LOGEMENTS ─── */}
        {onglet === 'logements' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>🏠 Gestion des logements</h1>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{logements.length} logement(s)</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" placeholder="🔍 Titre, adresse..." value={searchLogement}
                onChange={function(e) { setSearchLogement(e.target.value); }}
                style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
              {[['tous', 'Tous'], ['disponible', 'Disponibles'], ['loue', 'Loués'], ['masques', 'Masqués']].map(function(f) {
                return (
                  <button key={f[0]} onClick={function() { setStatutLogement(f[0]); }}
                    style={{ padding: '7px 14px', borderRadius: 20, border: statutLogement === f[0] ? '1.5px solid #1B6B3A' : '0.5px solid #E0E0E0', background: statutLogement === f[0] ? '#1B6B3A' : '#fff', color: statutLogement === f[0] ? '#fff' : '#555', fontSize: 12, fontWeight: statutLogement === f[0] ? 700 : 400, cursor: 'pointer' }}>
                    {f[1]}
                  </button>
                );
              })}
            </div>
            {loadingOnglet && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement...</div>}
            {!loadingOnglet && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {logements.map(function(l) {
                  return (
                    <div key={l.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderLeft: l.masque ? '4px solid #E53935' : '4px solid transparent' }}>
                      <div style={{ width: 44, height: 44, background: '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏠</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{l.titre}</span>
                          {l.verifie && <Badge label="✅ Vérifié" color="vert" />}
                          {l.masque && <Badge label="👁️‍🗨️ Masqué" color="rouge" />}
                          <Badge label={l.statut} color={l.statut === 'loue' ? 'vert' : l.statut === 'disponible' ? 'bleu' : 'gris'} />
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>{l.adresse}, {l.ville} · {GNF(l.prix_mensuel)}/mois</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                          Proprio : {l.prop_prenom} {l.prop_nom} {l.prop_verifie ? '✅' : ''} · {l.nb_reservations} réservation(s)
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {!l.verifie && (
                          <button onClick={function() { verifierLogement(l.id); }}
                            style={{ padding: '6px 12px', borderRadius: 8, background: '#E8F5E9', color: '#1B5E20', border: '0.5px solid #A5D6A7', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            ✅ Vérifier
                          </button>
                        )}
                        <button onClick={function() { masquerLogement(l.id, l.titre); }}
                          style={{ padding: '6px 12px', borderRadius: 8, background: '#FFF3E0', color: '#E65100', border: '0.5px solid #FFCC80', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          {l.masque ? '👁️ Afficher' : '🚫 Masquer'}
                        </button>
                        <button onClick={function() { supprimerLogement(l.id, l.titre); }}
                          style={{ padding: '6px 12px', borderRadius: 8, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
                {logements.length === 0 && !loadingOnglet && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Aucun logement trouvé</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── PAIEMENTS ─── */}
        {onglet === 'paiements' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>💰 Gestion des paiements</h1>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{paiements.length} paiement(s) affiché(s)</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" placeholder="🔍 Locataire, logement..." value={searchPaiement}
                onChange={function(e) { setSearchPaiement(e.target.value); }}
                style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
              {[['tous','Tous modes'], ['orange_money','Orange Money'], ['mtn_momo','MTN MoMo'], ['especes','Espèces'], ['virement','Virement']].map(function(f) {
                return (
                  <button key={f[0]} onClick={function() { setModePaiement(f[0]); }}
                    style={{ padding: '7px 14px', borderRadius: 20, border: modePaiement === f[0] ? '1.5px solid #1B6B3A' : '0.5px solid #E0E0E0', background: modePaiement === f[0] ? '#1B6B3A' : '#fff', color: modePaiement === f[0] ? '#fff' : '#555', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {f[1]}
                  </button>
                );
              })}
            </div>
            {loadingOnglet && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement...</div>}
            {!loadingOnglet && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <thead>
                    <tr style={{ background: '#1B2B22' }}>
                      {['Locataire','Propriétaire','Logement','Montant','Mode','Statut','Date'].map(function(h) {
                        return <th key={h} style={{ color: '#fff', padding: '11px 13px', fontSize: 12, textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map(function(p, i) {
                      return (
                        <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '0.5px solid #F0F0F0' }}>
                          <td style={{ padding: '10px 13px', fontSize: 12, color: '#1B2B22', fontWeight: 600 }}>{p.loc_prenom} {p.loc_nom}</td>
                          <td style={{ padding: '10px 13px', fontSize: 12, color: '#555' }}>{p.prop_prenom} {p.prop_nom}</td>
                          <td style={{ padding: '10px 13px', fontSize: 12, color: '#555' }}>{p.logement_titre || 'N/A'}</td>
                          <td style={{ padding: '10px 13px', fontSize: 12, fontWeight: 700, color: '#1B6B3A', whiteSpace: 'nowrap' }}>{GNF(p.montant)}</td>
                          <td style={{ padding: '10px 13px', fontSize: 11 }}>
                            <Badge label={p.mode_paiement === 'orange_money' ? '🟠 OM' : p.mode_paiement === 'mtn_momo' ? '🟡 MTN' : p.mode_paiement === 'especes' ? '💵 Espèces' : '🏦 Virement'} color="gris" />
                          </td>
                          <td style={{ padding: '10px 13px' }}>
                            <Badge label={p.statut === 'complete' ? 'Payé' : 'En attente'} color={p.statut === 'complete' ? 'vert' : 'orange'} />
                          </td>
                          <td style={{ padding: '10px 13px', fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      );
                    })}
                    {paiements.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#888' }}>Aucun paiement trouvé</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── DOCUMENTS / FACTURES ─── */}
        {onglet === 'documents' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>📄 Documents & Factures</h1>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{documents.length} document(s)</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {[['tous','Tous'], ['facture','Factures'], ['quittance','Quittances'], ['contrat_bail','Baux'], ['etat_lieux','États des lieux'], ['mise_en_demeure','Mises en demeure']].map(function(f) {
                return (
                  <button key={f[0]} onClick={function() { setTypeDoc(f[0]); }}
                    style={{ padding: '7px 14px', borderRadius: 20, border: typeDoc === f[0] ? '1.5px solid #1B6B3A' : '0.5px solid #E0E0E0', background: typeDoc === f[0] ? '#1B6B3A' : '#fff', color: typeDoc === f[0] ? '#fff' : '#555', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {f[1]}
                  </button>
                );
              })}
            </div>
            {loadingOnglet && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement...</div>}
            {!loadingOnglet && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {documents.map(function(d) {
                  var icone = d.type === 'facture' ? '🧾' : d.type === 'quittance' ? '📋' : d.type === 'contrat_bail' ? '📝' : d.type === 'etat_lieux' ? '🏠' : d.type === 'mise_en_demeure' ? '⚠️' : '📄';
                  return (
                    <div key={d.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{icone}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{d.titre}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                          {d.loc_prenom} {d.loc_nom} · {d.prop_prenom} {d.prop_nom} · {d.logement_titre || 'N/A'}
                        </div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <Badge label={d.type} color="bleu" />
                      <a href={'/api/admin/documents/' + d.id + '/telecharger'} target="_blank" rel="noreferrer"
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#E3F2FD', color: '#1565C0', border: '0.5px solid #90CAF9', fontSize: 11, cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}>
                        Télécharger
                      </a>
                    </div>
                  );
                })}
                {documents.length === 0 && !loadingOnglet && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Aucun document</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── SIGNALEMENTS ─── */}
        {onglet === 'signalements' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B22', margin: 0 }}>🚨 Signalements</h1>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{signalements.length} signalement(s)</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: 8 }}>
              {[['tous','Tous'], ['ouvert','Ouverts 🔴'], ['ferme','Fermés ✅']].map(function(f) {
                return (
                  <button key={f[0]} onClick={function() { setStatutSig(f[0]); }}
                    style={{ padding: '7px 16px', borderRadius: 20, border: statutSig === f[0] ? '1.5px solid #E53935' : '0.5px solid #E0E0E0', background: statutSig === f[0] ? '#FFEBEE' : '#fff', color: statutSig === f[0] ? '#B71C1C' : '#555', fontSize: 12, cursor: 'pointer', fontWeight: statutSig === f[0] ? 700 : 400 }}>
                    {f[1]}
                  </button>
                );
              })}
            </div>
            {loadingOnglet && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement...</div>}
            {!loadingOnglet && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {signalements.map(function(s) {
                  var ouvert = s.statut === 'ouvert';
                  return (
                    <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid ' + (ouvert ? '#E53935' : '#1B6B3A') }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{s.motif || s.titre || 'Signalement'}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                            Signalé par : <b>{s.signaleteur_prenom} {s.signaleteur_nom}</b> ({s.signaleteur_email})
                          </div>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            Cible : <b>{s.cible_prenom} {s.cible_nom}</b> ({s.cible_role})
                          </div>
                          {s.description && (
                            <div style={{ fontSize: 13, color: '#555', marginTop: 6, fontStyle: 'italic' }}>"{s.description}"</div>
                          )}
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <Badge label={ouvert ? '🔴 Ouvert' : '✅ Fermé'} color={ouvert ? 'rouge' : 'vert'} />
                      </div>
                      {ouvert && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          <button onClick={function() { traiterSignalement(s.id, 'fermer'); }}
                            style={{ padding: '7px 14px', borderRadius: 8, background: '#E8F5E9', color: '#1B5E20', border: '0.5px solid #A5D6A7', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            ✅ Fermer le dossier
                          </button>
                          <button onClick={function() { traiterSignalement(s.id, 'suspendre_cible'); }}
                            style={{ padding: '7px 14px', borderRadius: 8, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            ⛔ Suspendre l'utilisateur cible
                          </button>
                          {s.logement_id && (
                            <button onClick={function() { traiterSignalement(s.id, 'supprimer_annonce'); }}
                              style={{ padding: '7px 14px', borderRadius: 8, background: '#FFF3E0', color: '#E65100', border: '0.5px solid #FFCC80', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                              🗑️ Supprimer l'annonce
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {signalements.length === 0 && !loadingOnglet && (
                  <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>Aucun signalement</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>La plateforme est saine</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}