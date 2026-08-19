/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Home, CalendarCheck, MessageCircle, CreditCard,
  FileText, Bell, Wrench, Send, Settings, MapPin,
  TrendingUp, Users, ArrowRight, Clock, X
} from 'lucide-react';
import api from '../../services/api';

export default function RechercheGlobale({ stats, onNavigate }) {
  var [query, setQuery]         = useState('');
  var [resultats, setResultats] = useState([]);
  var [visible, setVisible]     = useState(false);
  var [selIndex, setSelIndex]   = useState(0);
  var [loading, setLoading]     = useState(false);
  var inputRef  = useRef(null);
  var timerRef  = useRef(null);

  // Ctrl+K pour ouvrir
  useEffect(function() {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setVisible(true);
        setTimeout(function() { if (inputRef.current) inputRef.current.focus(); }, 100);
      }
      if (e.key === 'Escape') { setVisible(false); setQuery(''); }
    }
    window.addEventListener('keydown', handleKey);
    return function() { window.removeEventListener('keydown', handleKey); };
  }, []);

  // Navigation clavier dans les résultats
  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelIndex(function(i) { return Math.min(i + 1, resultats.length - 1); });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelIndex(function(i) { return Math.max(i - 1, 0); });
    } else if (e.key === 'Enter' && resultats[selIndex]) {
      selectionner(resultats[selIndex]);
    }
  }

  function selectionner(r) {
    if (r.href) {
      window.location.href = r.href;
    } else {
      onNavigate(r.action);
    }
    setVisible(false);
    setQuery('');
  }

  // Recherche
  useEffect(function() {
    setSelIndex(0);
    if (!query || query.length < 2) { setResultats([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(function() {
      var q   = query.toLowerCase();
      var res = [];

      // ─── Logements dashboard ───────────────────────────────
      (stats.logements || []).forEach(function(l) {
        if ((l.titre || '').toLowerCase().includes(q) || (l.ville || '').toLowerCase().includes(q)) {
          res.push({
            type: 'logement',
            icone: <Home size={16} strokeWidth={1.5} />,
            couleur: '#1B6B3A', bg: '#E8F5E9',
            titre: l.titre,
            sous:  l.adresse + ', ' + l.ville + ' · ' + new Intl.NumberFormat('fr-FR').format(l.prix_mensuel) + ' GNF',
            action: '/dashboard/biens',
            badge: 'Logement',
          });
        }
      });

      // ─── Réservations / locataires ─────────────────────────
      (stats.reservations || []).forEach(function(r) {
        var nom = ((r.locataire_prenom || '') + ' ' + (r.locataire_nom || '')).trim();
        if (nom.toLowerCase().includes(q) || (r.logement_titre || '').toLowerCase().includes(q)) {
          res.push({
            type: 'reservation',
            icone: <CalendarCheck size={16} strokeWidth={1.5} />,
            couleur: '#1565C0', bg: '#E3F2FD',
            titre: nom || r.logement_titre,
            sous:  r.logement_titre + ' · ' + r.statut,
            action: '/dashboard/reservations',
            badge: 'Candidature',
          });
        }
      });

      // ─── Paiements ─────────────────────────────────────────
      (stats.paiements || []).forEach(function(p) {
        if ((p.logement_titre || '').toLowerCase().includes(q)) {
          res.push({
            type: 'paiement',
            icone: <CreditCard size={16} strokeWidth={1.5} />,
            couleur: '#7B1FA2', bg: '#F3E5F5',
            titre: p.logement_titre,
            sous:  new Intl.NumberFormat('fr-FR').format(p.montant) + ' GNF · ' + new Date(p.created_at).toLocaleDateString('fr-FR'),
            action: '/dashboard/paiements',
            badge: 'Paiement',
          });
        }
      });

      // ─── Navigation ────────────────────────────────────────
      var pages = [
        { mots: ['biens','logement','propriete','bien'],     icone: <Home          size={16} strokeWidth={1.5}/>, titre: 'Mes biens',       action: '/dashboard/biens',        couleur: '#1B6B3A', bg: '#E8F5E9'  },
        { mots: ['candidature','reservation','demande'],     icone: <CalendarCheck size={16} strokeWidth={1.5}/>, titre: 'Candidatures',    action: '/dashboard/reservations', couleur: '#1565C0', bg: '#E3F2FD'  },
        { mots: ['paiement','loyer','argent'],               icone: <CreditCard    size={16} strokeWidth={1.5}/>, titre: 'Paiements',       action: '/dashboard/paiements',    couleur: '#7B1FA2', bg: '#F3E5F5'  },
        { mots: ['document','bail','contrat','quittance'],   icone: <FileText      size={16} strokeWidth={1.5}/>, titre: 'Documents',       action: '/dashboard/documents',    couleur: '#E65100', bg: '#FFF3E0'  },
        { mots: ['message','chat','conversation'],           icone: <MessageCircle size={16} strokeWidth={1.5}/>, titre: 'Messages',        action: '/dashboard/messages',     couleur: '#1B6B3A', bg: '#E8F5E9'  },
        { mots: ['alerte','notification'],                   icone: <Bell          size={16} strokeWidth={1.5}/>, titre: 'Alertes',         action: '/dashboard/alertes',      couleur: '#E53935', bg: '#FFEBEE'  },
        { mots: ['rapport','statistique','graphique'],       icone: <TrendingUp    size={16} strokeWidth={1.5}/>, titre: 'Rapports',        action: '/dashboard/rapports',     couleur: '#1565C0', bg: '#E3F2FD'  },
        { mots: ['reclamation','panne','probleme'],          icone: <Wrench        size={16} strokeWidth={1.5}/>, titre: 'Réclamations',    action: '/dashboard/reclamations', couleur: '#888',    bg: '#F5F5F5'  },
        { mots: ['preavis','depart','quitter'],              icone: <Send          size={16} strokeWidth={1.5}/>, titre: 'Préavis',         action: '/dashboard/preavis',      couleur: '#37474F', bg: '#ECEFF1'  },
        { mots: ['parametre','profil','compte','mdp'],       icone: <Settings      size={16} strokeWidth={1.5}/>, titre: 'Paramètres',      action: '/dashboard/parametres',   couleur: '#555',    bg: '#F5F5F5'  },
        { mots: ['historique','ancien','passe'],             icone: <Clock         size={16} strokeWidth={1.5}/>, titre: 'Historique',      action: '/dashboard/historique',   couleur: '#1B6B3A', bg: '#E8F5E9'  },
        { mots: ['locataire','tenant'],                      icone: <Users         size={16} strokeWidth={1.5}/>, titre: 'Locataires',      action: '/dashboard/locataires',   couleur: '#1565C0', bg: '#E3F2FD'  },
      ];
      pages.forEach(function(p) {
        if (p.mots.some(function(m) { return m.includes(q) || q.includes(m); })) {
          res.push({ type: 'navigation', icone: p.icone, couleur: p.couleur, bg: p.bg, titre: p.titre, sous: 'Aller vers ' + p.titre, action: p.action, badge: 'Page' });
        }
      });

      setResultats(res.slice(0, 8));

      // ─── Recherche API logements publics ───────────────────
      setLoading(true);
      api.get('/logements?search=' + encodeURIComponent(query) + '&limit=3')
        .then(function(r) {
          var logementsPublics = (r.data.logements || []).map(function(l) {
            return {
              type: 'logement_public',
              icone: <MapPin size={16} strokeWidth={1.5} />,
              couleur: '#1B6B3A', bg: '#E8F5E9',
              titre: l.titre,
              sous: l.adresse + ', ' + l.ville + ' · ' + new Intl.NumberFormat('fr-FR').format(l.prix_mensuel) + ' GNF/mois',
              href: '/logements/' + l.id,
              badge: 'Annonce',
            };
          });
          setResultats(function(prev) {
            var combined = prev.concat(logementsPublics);
            var uniq = combined.filter(function(r, i, arr) {
              return arr.findIndex(function(x) { return x.titre === r.titre && x.type === r.type; }) === i;
            });
            return uniq.slice(0, 8);
          });
        })
        .catch(function() {})
        .finally(function() { setLoading(false); });

    }, 250);
  }, [query, stats]);

  // Bouton fermé
  if (!visible) {
    return (
      <button
        onClick={function() { setVisible(true); setTimeout(function() { if (inputRef.current) inputRef.current.focus(); }, 100); }}
        style={{ background: '#F5F6FA', border: '1px solid #E8E8E8', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s' }}
        onMouseEnter={function(e) { e.currentTarget.style.borderColor = '#1B6B3A'; e.currentTarget.style.color = '#1B6B3A'; }}
        onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#888'; }}>
        <Search size={14} strokeWidth={1.5} />
        <span>Rechercher...</span>
        <span style={{ background: '#E0E0E0', borderRadius: 5, padding: '2px 6px', fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>Ctrl+K</span>
      </button>
    );
  }

  // Modal ouverte
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
      onClick={function(e) { if (e.target === e.currentTarget) { setVisible(false); setQuery(''); } }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden', margin: '0 16px' }}>

        {/* Barre de saisie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
          <Search size={18} strokeWidth={1.5} color={loading ? '#1B6B3A' : '#888'} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Chercher logement, locataire, page..."
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#1B2B22', background: 'transparent' }}
            autoFocus />
          {query && (
            <button onClick={function() { setQuery(''); setResultats([]); inputRef.current && inputRef.current.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 2, display: 'flex' }}>
              <X size={16} strokeWidth={2} />
            </button>
          )}
          <button onClick={function() { setVisible(false); setQuery(''); }}
            style={{ background: '#F5F5F5', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#888', cursor: 'pointer', flexShrink: 0 }}>
            Esc
          </button>
        </div>

        {/* Raccourcis si vide */}
        {query.length < 2 && (
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Raccourcis</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { icone: <Home size={15} strokeWidth={1.5} />,          titre: 'Mes biens',      action: '/dashboard/biens',        bg: '#E8F5E9', couleur: '#1B6B3A' },
                { icone: <CalendarCheck size={15} strokeWidth={1.5} />, titre: 'Candidatures',   action: '/dashboard/reservations', bg: '#E3F2FD', couleur: '#1565C0' },
                { icone: <MessageCircle size={15} strokeWidth={1.5} />, titre: 'Messages',       action: '/dashboard/messages',     bg: '#F3E5F5', couleur: '#7B1FA2' },
                { icone: <TrendingUp    size={15} strokeWidth={1.5} />, titre: 'Rapports',       action: '/dashboard/rapports',     bg: '#FFF3E0', couleur: '#E65100' },
              ].map(function(r, i) {
                return (
                  <button key={i} onClick={function() { onNavigate(r.action); setVisible(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: '#FAFAFA', cursor: 'pointer', textAlign: 'left', transition: 'background .15s' }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = r.bg; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = '#FAFAFA'; }}>
                    <div style={{ width: 28, height: 28, background: r.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.couleur, flexShrink: 0 }}>
                      {r.icone}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{r.titre}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Aucun résultat */}
        {query.length >= 2 && resultats.length === 0 && !loading && (
          <div style={{ padding: '28px 20px', textAlign: 'center', color: '#888', fontSize: 14 }}>
            <Search size={28} strokeWidth={1} color="#E0E0E0" style={{ display: 'block', margin: '0 auto 10px' }} />
            Aucun résultat pour <strong>"{query}"</strong>
          </div>
        )}

        {/* Résultats */}
        {resultats.length > 0 && (
          <div>
            {resultats.map(function(r, i) {
              var actif = i === selIndex;
              return (
                <div key={i}
                  onClick={function() { selectionner(r); }}
                  onMouseEnter={function() { setSelIndex(i); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', background: actif ? '#F5F6FA' : 'transparent', borderBottom: '0.5px solid #F5F5F5', transition: 'background .1s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.couleur, flexShrink: 0 }}>
                    {r.icone}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.titre}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sous}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ background: r.bg, color: r.couleur, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{r.badge}</span>
                    <ArrowRight size={14} strokeWidth={1.5} color="#ccc" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '10px 16px', background: '#FAFAFA', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 16, fontSize: 11, color: '#aaa' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>↑↓ Naviguer</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>↵ Sélectionner</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Esc Fermer</span>
          {loading && <span style={{ marginLeft: 'auto', color: '#1B6B3A', fontWeight: 600 }}>Recherche...</span>}
        </div>
      </div>
    </div>
  );
}