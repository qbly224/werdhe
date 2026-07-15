/* eslint-disable */
import { useState, useEffect, useRef } from 'react';

export default function RechercheGlobale({ stats, onNavigate }) {
  var [query, setQuery]       = useState('');
  var [resultats, setResultats] = useState([]);
  var [visible, setVisible]   = useState(false);
  var inputRef = useRef(null);

  // Raccourci Ctrl+K pour ouvrir la recherche
  useEffect(function() {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setVisible(true);
        setTimeout(function() {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }
      if (e.key === 'Escape') {
        setVisible(false);
        setQuery('');
      }
    }
    window.addEventListener('keydown', handleKey);
    return function() { window.removeEventListener('keydown', handleKey); };
  }, []);

  // Chercher dans les données
  useEffect(function() {
    if (!query || query.length < 2) { setResultats([]); return; }
    var q = query.toLowerCase();
    var res = [];

    // Chercher dans les logements
    (stats.logements || []).forEach(function(l) {
      if ((l.titre || '').toLowerCase().includes(q) || (l.ville || '').toLowerCase().includes(q) || (l.adresse || '').toLowerCase().includes(q)) {
        res.push({ type: 'logement', icon: '🏠', titre: l.titre, sous: l.adresse + ', ' + l.ville, action: '/dashboard/biens' });
      }
    });

    // Chercher dans les réservations
    (stats.reservations || []).forEach(function(r) {
      var nom = (r.locataire_prenom || '') + ' ' + (r.locataire_nom || '');
      if (nom.toLowerCase().includes(q) || (r.logement_titre || '').toLowerCase().includes(q)) {
        res.push({ type: 'reservation', icon: '📅', titre: nom.trim() || r.logement_titre, sous: r.logement_titre + ' · ' + r.statut, action: '/dashboard/reservations' });
      }
    });

    // Raccourcis onglets
    var onglets = [
      { mots: ['biens', 'logements', 'propriete'],  icon: '🏠', titre: 'Mes biens',       action: '/dashboard/biens' },
      { mots: ['reservation', 'demande', 'locataire'], icon: '📅', titre: 'Réservations',    action: '/dashboard/reservations' },
      { mots: ['paiement', 'loyer', 'argent'],      icon: '💳', titre: 'Paiements',        action: '/dashboard/paiements' },
      { mots: ['document', 'bail', 'contrat'],      icon: '📄', titre: 'Documents',         action: '/dashboard/documents' },
      { mots: ['message', 'chat'],                  icon: '💬', titre: 'Messages',          action: '/dashboard/messages' },
      { mots: ['reclamation', 'panne', 'probleme'], icon: '🔧', titre: 'Réclamations',      action: '/dashboard/reclamations' },
      { mots: ['preavis', 'depart', 'quitter'],     icon: '📤', titre: 'Préavis',           action: '/dashboard/preavis' },
      { mots: ['parametre', 'profil', 'compte'],    icon: '⚙️', titre: 'Paramètres',        action: '/dashboard/parametres' },
      { mots: ['alerte', 'notification'],           icon: '🔔', titre: 'Alertes',           action: '/dashboard/alertes' },
    ];

    onglets.forEach(function(o) {
      if (o.mots.some(function(m) { return m.includes(q); })) {
        res.push({ type: 'navigation', icon: o.icon, titre: o.titre, sous: 'Aller vers ' + o.titre, action: o.action });
      }
    });

    setResultats(res.slice(0, 6));
  }, [query, stats]);

  if (!visible) {
    return (
      <button
        onClick={function() { setVisible(true); setTimeout(function() { if (inputRef.current) inputRef.current.focus(); }, 100); }}
        title="Recherche globale (Ctrl+K)"
        style={{ background: '#F0F4F1', border: '0.5px solid #E0E0E0', borderRadius: 10, padding: '7px 14px', fontSize: 13, color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        🔍 <span>Rechercher...</span>
        <span style={{ marginLeft: 8, background: '#E0E0E0', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Ctrl+K</span>
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
      onClick={function(e) { if (e.target === e.currentTarget) { setVisible(false); setQuery(''); } }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

        {/* Barre de recherche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '0.5px solid #F0F0F0' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Chercher un locataire, logement, onglet..."
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: '#1B2B22', background: 'transparent' }}
            autoFocus />
          <button onClick={function() { setVisible(false); setQuery(''); }}
            style={{ background: '#F5F5F5', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#888', cursor: 'pointer' }}>
            Esc
          </button>
        </div>

        {/* Résultats */}
        {resultats.length === 0 && query.length >= 2 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: 13 }}>
            Aucun résultat pour "{query}"
          </div>
        )}

        {resultats.length === 0 && query.length < 2 && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>Raccourcis rapides</div>
            {[
              { icon: '🏠', titre: 'Mes biens',    action: '/dashboard/biens' },
              { icon: '📅', titre: 'Réservations', action: '/dashboard/reservations' },
              { icon: '💬', titre: 'Messages',     action: '/dashboard/messages' },
            ].map(function(r) {
              return (
                <div key={r.action} onClick={function() { onNavigate(r.action); setVisible(false); setQuery(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 8, cursor: 'pointer' }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = '#F0FBF0'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <span style={{ fontSize: 14, color: '#1B2B22', fontWeight: 600 }}>{r.titre}</span>
                </div>
              );
            })}
          </div>
        )}

        {resultats.map(function(r, i) {
          var typeColors = { logement: '#E8F5E9', reservation: '#E3F2FD', navigation: '#F3E5F5' };
          return (
            <div key={i}
              onClick={function() { onNavigate(r.action); setVisible(false); setQuery(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '0.5px solid #F5F5F5' }}
              onMouseEnter={function(e) { e.currentTarget.style.background = '#F8F8F8'; }}
              onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: typeColors[r.type] || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {r.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{r.titre}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{r.sous}</div>
              </div>
              <span style={{ fontSize: 12, color: '#aaa' }}>→</span>
            </div>
          );
        })}

        <div style={{ padding: '10px 16px', background: '#FAFAFA', display: 'flex', gap: 16, fontSize: 11, color: '#aaa' }}>
          <span>↵ Sélectionner</span>
          <span>Esc Fermer</span>
          <span>Ctrl+K Ouvrir</span>
        </div>
      </div>
    </div>
  );
}