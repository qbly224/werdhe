/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import toast from 'react-hot-toast';
import OngletPreavisComponent from '../components/OngletPreavis';
import OngletPaiementsComponent from '../components/OngletPaiements';
import './Dashboard.css';

// ================================================
// UTILITAIRE — Formater les montants en GNF
// ================================================
var GNF = function(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' GNF';
};

// ================================================
// TYPES DE DOCUMENTS disponibles
// ================================================
var DOCS_TYPES = [
  { icon: '📝', titre: 'Nouveau bail', desc: 'Generer un contrat de location', color: '#1B6B3A', type: 'contrat_bail' },
  { icon: '🧾', titre: 'Quittance de loyer', desc: 'Generer une quittance officielle', color: '#1565C0', type: 'quittance' },
  { icon: '📋', titre: 'Etat des lieux', desc: 'Entree ou sortie du locataire', color: '#E65100', type: 'etat_lieux' },
  { icon: '📜', titre: 'Mise en demeure', desc: 'Pour loyer impaye', color: '#B71C1C', type: 'mise_en_demeure' },
  { icon: '📊', titre: 'Rapport financier', desc: "Revenus du mois ou de l'annee", color: '#4A148C', type: 'rapport_financier' },
  { icon: '🔏', titre: 'Caution / Depot', desc: 'Contrat de caution solidaire', color: '#00695C', type: 'caution' },
  { icon: '📤', titre: 'Preavis de depart', desc: 'Lettre de preavis locataire', color: '#37474F', type: 'preavis' }
];

// ================================================
// COMPOSANT : Badge Score de Confiance
// ================================================
function BadgeScore({ userId }) {
  var [score, setScore] = useState(null);

  useEffect(function() {
    api.get('/scores/mon-score')
      .then(function(res) { setScore(res.data.score); })
      .catch(console.error);
  }, [userId]);

  if (!score) return null;

  var couleur = score.score >= 80 ? '#F5A623'
    : score.score >= 65 ? '#1B6B3A'
    : score.score >= 50 ? '#1565C0'
    : '#888';

  var badgeLabel = {
    elite: 'Elite',
    excellent: 'Excellent',
    fiable: 'Fiable',
    nouveau: 'Nouveau'
  };

  return (
    <div style={{
      background: couleur + '15', border: '1px solid ' + couleur + '40',
      borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: couleur, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '18px'
      }}>
        {score.score}
      </div>
      <div>
        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B2B22' }}>
          Score de confiance
        </div>
        <div style={{ fontSize: '12px', color: couleur, fontWeight: '600' }}>
          {badgeLabel[score.badge] || 'Nouveau'}
        </div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          {score.nb_paiements_a_temps || 0} paiements a temps
          {score.nb_reclamations_resolues > 0 && ' · ' + score.nb_reclamations_resolues + ' reclamations resolues'}
        </div>
      </div>
    </div>
  );
}

// ================================================
// COMPOSANT : Panneau de notifications
// ================================================
function NotifPanel(props) {
  var alertes = props.alertes;
  var onClose = props.onClose;
  return (
    <div className="notif-panel">
      <div className="notif-header">
        <span>Notifications</span>
        <span style={{ cursor: 'pointer', color: '#1B6B3A', fontSize: 12 }} onClick={onClose}>Fermer</span>
      </div>
      {alertes.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: 13 }}>
          Aucune notification
        </div>
      )}
      {alertes.map(function(a, i) {
        return (
          <div key={i} className="notif-item">
            <div className="notif-item-icon">
              {a.type === 'loyer_retard' ? '⚠️' : a.type === 'bail_bientot' ? '📋' : '🔔'}
            </div>
            <div>
              <div className="notif-item-text">{a.titre}</div>
              <div className="notif-item-time">{new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Vue d'ensemble (tableau de bord principal)
// ================================================
function OngletOverview(props) {
  var stats = props.stats;
  var user = props.user;
  var alertes = props.alertes;

  var totalLoyers = stats.logements
    .filter(function(b) { return b.statut === 'loue'; })
    .reduce(function(s, b) { return s + Number(b.prix_mensuel); }, 0);
  var biensOccupes = stats.logements.filter(function(b) { return b.statut === 'loue'; }).length;
  var biensLibres = stats.logements.filter(function(b) { return b.statut === 'disponible'; }).length;
  var loiersPercus = stats.paiements
    .filter(function(p) { return p.statut === 'complete'; })
    .reduce(function(s, p) { return s + Number(p.montant); }, 0);
  var tauxOccup = stats.logements.length > 0
    ? Math.round(biensOccupes / stats.logements.length * 100) : 0;

  var statsCards = user && user.role !== 'locataire' ? [
    { label: 'Revenus du mois', value: GNF(loiersPercus), sub: 'Encaisses ce mois', color: '#1B6B3A', bg: '#E8F5E9', icon: '💰' },
    { label: 'Biens occupes', value: biensOccupes + '/' + stats.logements.length, sub: biensLibres + ' bien(s) libre(s)', color: '#1565C0', bg: '#E3F2FD', icon: '🏠' },
    { label: 'Loyer en retard', value: alertes.filter(function(a) { return a.type === 'loyer_retard'; }).length + ' locataire(s)', sub: 'A relancer', color: '#B71C1C', bg: '#FFEBEE', icon: '⚠️' },
    { label: "Taux d'occupation", value: tauxOccup + '%', sub: 'Performance du mois', color: '#E65100', bg: '#FFF3E0', icon: '📈' }
  ] : [
    { label: 'Mes reservations', value: String(stats.reservations.length), sub: 'Total', color: '#1565C0', bg: '#E3F2FD', icon: '📅' },
    { label: 'Paiements effectues', value: String(stats.paiements.filter(function(p) { return p.statut === 'complete'; }).length), sub: 'Ce mois', color: '#1B6B3A', bg: '#E8F5E9', icon: '💰' }
  ];

  return (
    <div>
      <div className="stats-grid-4">
        {statsCards.map(function(s, i) {
          return (
            <div key={i} className="stat-card-colored" style={{ background: s.bg, borderLeft: '4px solid ' + s.color }}>
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-val" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="dash-two-cols">
        <div className="dash-white-card">
          <div className="dash-card-head">
            <h3>Alertes actives</h3>
            <span className="dash-badge-red">{alertes.length}</span>
          </div>
          {alertes.length === 0 && (
            <p style={{ color: '#888', fontSize: 13 }}>Aucune alerte. Tout est en ordre !</p>
          )}
          {alertes.slice(0, 3).map(function(a, i) {
            var bg = a.type === 'loyer_retard' ? '#FFEBEE' : a.type === 'bail_bientot' ? '#FFF3E0' : '#E3F2FD';
            return (
              <div key={i} className="alerte-item-dash" style={{ background: bg }}>
                <span style={{ fontSize: 22 }}>
                  {a.type === 'loyer_retard' ? '⚠️' : a.type === 'bail_bientot' ? '📋' : '🔧'}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{a.titre}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dash-white-card">
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1B2B22' }}>Mes biens</h3>
          {stats.logements.length === 0 && (
            <p style={{ color: '#888', fontSize: 13 }}>Aucun bien enregistre.</p>
          )}
          {stats.logements.slice(0, 4).map(function(b, i) {
            return (
              <div key={i} className="bien-list-item">
                <div className="bien-list-left">
                  <span style={{ fontSize: 22 }}>🏠</span>
                  <div>
                    <div className="bien-list-info-title">{b.titre}</div>
                    <div className="bien-list-info-sub">{GNF(b.prix_mensuel)}/mois</div>
                  </div>
                </div>
                <span className={b.statut === 'loue' ? 'badge-occupe' : 'badge-libre'}>
                  {b.statut === 'loue' ? 'Occupe' : 'Libre'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ================================================
// ONGLET : Mes biens
// ================================================
function OngletBiens(props) {
  var stats    = props.stats;
  var recharger = props.recharger;
  var user     = props.user;
  var setOnglet = props.setOnglet;
  var estProprio = user && (user.role === 'proprietaire' || user.role === 'les_deux');

  var [showConfirm, setShowConfirm] = useState(null);
  var [modeEdit, setModeEdit]       = useState(null);
  var [formEdit, setFormEdit]       = useState({});
  var [reservationsActives, setReservationsActives] = useState([]);

  // Charger les réservations pour avoir les infos locataires
  useEffect(function() {
    if (!estProprio) return;
    api.get('/reservations/proprietaire')
      .then(function(res) {
        setReservationsActives(
          (res.data.reservations || []).filter(function(r) {
            return r.statut === 'confirmee';
          })
        );
      })
      .catch(console.error);
  }, [estProprio]);

  function getLocataireInfo(logementId) {
    return reservationsActives.find(function(r) { return r.logement_id === logementId; });
  }

  function handleDelete(id) {
    api.delete('/logements/' + id)
      .then(function() { toast.success('Bien supprimé !'); setShowConfirm(null); recharger(); })
      .catch(function() { toast.error('Erreur suppression'); });
  }

  function handleSave(id) {
    api.put('/logements/' + id, formEdit)
      .then(function() { toast.success('Bien modifié !'); setModeEdit(null); recharger(); })
      .catch(function() { toast.error('Erreur modification'); });
  }

  // ── VUE LOCATAIRE ─────────────────────────────────────────────
  if (!estProprio) {
    var locationsActives = stats.reservations.filter(function(r) { return r.statut === 'confirmee'; });
    return (
      <div>
        <div className="dash-page-header">
          <div><h1>Mes locations</h1><p>{locationsActives.length} location(s) active(s)</p></div>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>
            Chercher un logement
          </Link>
        </div>

        {locationsActives.length === 0 && (
          <div className="dash-empty-state">
            <span>🏠</span>
            <h3>Aucune location active</h3>
            <p>Réservez un logement pour commencer</p>
            <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Trouver un logement
            </Link>
          </div>
        )}

        {locationsActives.map(function(r) {
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #1B6B3A' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: '#E8F5E9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏠</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>{r.logement_titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                    📍 {r.logement_ville} · Depuis le {r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B6B3A', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.montant_total || r.prix_mensuel)} GNF/mois
                  </div>
                </div>
                <div style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  • Active
                </div>
              </div>

              {/* Boutons locataire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link to={'/reservation/' + r.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '0.5px solid #A5D6A7' }}>
                  📋 Détails
                </Link>
                <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E3F2FD', color: '#1565C0', fontSize: 13, fontWeight: 600, border: '0.5px solid #90CAF9', cursor: 'pointer' }}>
                  📄 Documents
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── VUE PROPRIÉTAIRE ──────────────────────────────────────────
  return (
    <div>
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#B71C1C' }}>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer ce bien ? Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="btn-green" style={{ background: '#B71C1C' }} onClick={function() { handleDelete(showConfirm); }}>Supprimer</button>
              <button className="btn-outline-green" onClick={function() { setShowConfirm(null); }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="dash-page-header">
        <div>
          <h1>Mes biens</h1>
          <p>{stats.logements.length} bien(s) en gestion</p>
        </div>
        <Link to="/logements/ajouter" className="btn-green" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          + Ajouter un bien
        </Link>
      </div>

      {stats.logements.length === 0 && (
        <div className="dash-empty-state">
          <span>🏠</span>
          <h3>Aucun bien enregistré</h3>
          <Link to="/logements/ajouter" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
            + Ajouter mon premier bien
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stats.logements.map(function(b) {
          var estOccupe  = b.statut === 'loue';
          var locataire  = estOccupe ? getLocataireInfo(b.id) : null;
          var preavisActif = b.preavis_actif || false;
          var borderColor = preavisActif ? '#E53935' : estOccupe ? '#1B6B3A' : '#F5A623';

          // Mode édition
          if (modeEdit === b.id) {
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #1565C0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>Modifier — {b.titre}</div>
                <div className="form-row-2">
                  <div className="form-group"><label>Titre</label><input type="text" value={formEdit.titre} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { titre: e.target.value })); }} /></div>
                  <div className="form-group"><label>Prix (GNF)</label><input type="number" value={formEdit.prix_mensuel} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { prix_mensuel: e.target.value })); }} /></div>
                  <div className="form-group"><label>Adresse</label><input type="text" value={formEdit.adresse} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { adresse: e.target.value })); }} /></div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select value={formEdit.statut} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { statut: e.target.value })); }}>
                      <option value="disponible">Disponible</option>
                      <option value="loue">Loué</option>
                      <option value="suspendu">Suspendu</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-bien-primary" onClick={function() { handleSave(b.id); }}>Sauvegarder</button>
                  <button className="btn-bien-secondary" onClick={function() { setModeEdit(null); }}>Annuler</button>
                </div>
              </div>
            );
          }

          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + borderColor }}>

              {/* En-tête bien */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: estOccupe ? '#E8F5E9' : '#FFF8E1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {b.categorie && b.categorie.includes('villa') ? '🏡' : b.categorie && b.categorie.includes('studio') ? '🏢' : '🏠'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>{b.titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                    {locataire
                      ? locataire.locataire_prenom + ' ' + locataire.locataire_nom + ' · Depuis le ' + (locataire.date_debut ? new Date(locataire.date_debut).toLocaleDateString('fr-FR') : 'N/A')
                      : (b.adresse ? b.adresse + ', ' : '') + (b.ville || '')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B6B3A', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(b.prix_mensuel)} GNF/mois
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {preavisActif ? (
                    <div style={{ background: '#FFEBEE', color: '#B71C1C', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      ⚠️ Préavis envoyé
                    </div>
                  ) : estOccupe ? (
                    <div style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      • Occupé
                    </div>
                  ) : (
                    <div style={{ background: '#FFF8E1', color: '#C8860A', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      Libre
                    </div>
                  )}
                </div>
              </div>

              {/* Bannière préavis actif */}
              {preavisActif && (
                <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#B71C1C' }}>
                  <span>📋</span>
                  <span>
                    Préavis de départ envoyé à <b>{locataire && locataire.locataire_prenom + ' ' + locataire.locataire_nom}</b>. En attente d'accusé de réception.
                    {' '}<span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={function() { if (setOnglet) setOnglet('/dashboard/preavis'); }}>Voir le préavis</span>
                  </span>
                </div>
              )}

              {/* Boutons selon statut */}
              {estOccupe ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button onClick={function() { if (setOnglet) setOnglet('/dashboard/messages'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', border: '0.5px solid #A5D6A7', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    💬 Messagerie
                  </button>
                  <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#E3F2FD', color: '#1565C0', border: '0.5px solid #90CAF9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    📄 Documents
                  </button>
                  {!preavisActif && (
                    <button onClick={function() { if (setOnglet) setOnglet('/dashboard/preavis'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      📤 Préavis
                    </button>
                  )}
                  {preavisActif && (
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#F5F5F5', color: '#888', border: '0.5px solid #E0E0E0', fontSize: 12, cursor: 'not-allowed' }} disabled>
                      ⚠️ Préavis envoyé
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button className="btn-bien-primary" onClick={function() {
                    setModeEdit(b.id);
                    setFormEdit({ titre: b.titre, adresse: b.adresse, prix_mensuel: b.prix_mensuel, statut: b.statut });
                  }}>
                    ✏️ Modifier
                  </button>
                  <button className="btn-bien-secondary" onClick={function() { setShowConfirm(b.id); }}>
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================================================
// ONGLET : Locataires
// ================================================
function OngletLocataires(props) {
  var stats = props.stats;
  var logements = props.logements;
  var [showForm, setShowForm] = useState(false);
  var [locatairesManue, setLocatairesManue] = useState([]);
  var [modeEdit, setModeEdit] = useState(null);
  var [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '', logement_id: '', loyer_mensuel: '', date_entree: '' });

  useEffect(function() {
    api.get('/locataires-manuels')
      .then(function(res) { setLocatairesManue(res.data.locataires); })
      .catch(console.error);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    var req = modeEdit
      ? api.put('/locataires-manuels/' + modeEdit, form)
      : api.post('/locataires-manuels', form);
    req.then(function() {
      toast.success(modeEdit ? 'Locataire modifie !' : 'Locataire ajoute !');
      setShowForm(false);
      setModeEdit(null);
      setForm({ nom: '', prenom: '', telephone: '', email: '', logement_id: '', loyer_mensuel: '', date_entree: '' });
      api.get('/locataires-manuels').then(function(res) { setLocatairesManue(res.data.locataires); });
    }).catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur'); });
  }

  function handleDelete(id) {
    if (!window.confirm('Supprimer ce locataire ?')) return;
    api.delete('/locataires-manuels/' + id)
      .then(function() {
        toast.success('Locataire supprime !');
        api.get('/locataires-manuels').then(function(res) { setLocatairesManue(res.data.locataires); });
      }).catch(function() { toast.error('Erreur'); });
  }

  var locatairesReservations = stats.reservations.reduce(function(acc, r) {
    if (r.locataire_nom && !acc.find(function(l) { return l.email === r.locataire_email; })) {
      acc.push({ nom: r.locataire_nom, prenom: r.locataire_prenom, telephone: r.locataire_telephone, email: r.locataire_email, logement: r.logement_titre, loyer: r.montant_total, statut: r.statut });
    }
    return acc;
  }, []);

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>Locataires</h1>
          <p>{locatairesReservations.length + locatairesManue.length} locataire(s)</p>
        </div>
        <button className="btn-green" onClick={function() { setShowForm(!showForm); setModeEdit(null); setForm({ nom: '', prenom: '', telephone: '', email: '', logement_id: '', loyer_mensuel: '', date_entree: '' }); }}>
          + Ajouter un locataire
        </button>
      </div>

      {showForm && (
        <div className="dash-form-card">
          <h3>{modeEdit ? 'Modifier le locataire' : 'Nouveau locataire'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group"><label>Prenom *</label><input type="text" value={form.prenom} onChange={function(e) { setForm(Object.assign({}, form, { prenom: e.target.value })); }} required /></div>
              <div className="form-group"><label>Nom *</label><input type="text" value={form.nom} onChange={function(e) { setForm(Object.assign({}, form, { nom: e.target.value })); }} required /></div>
              <div className="form-group"><label>Telephone</label><input type="tel" value={form.telephone} onChange={function(e) { setForm(Object.assign({}, form, { telephone: e.target.value })); }} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={function(e) { setForm(Object.assign({}, form, { email: e.target.value })); }} /></div>
              <div className="form-group">
                <label>Logement</label>
                <select value={form.logement_id} onChange={function(e) { setForm(Object.assign({}, form, { logement_id: e.target.value })); }}>
                  <option value="">Aucun</option>
                  {logements.map(function(l) { return <option key={l.id} value={l.id}>{l.titre}</option>; })}
                </select>
              </div>
              <div className="form-group"><label>Loyer (GNF)</label><input type="number" value={form.loyer_mensuel} onChange={function(e) { setForm(Object.assign({}, form, { loyer_mensuel: e.target.value })); }} /></div>
              <div className="form-group"><label>Date d'entree</label><input type="date" value={form.date_entree} onChange={function(e) { setForm(Object.assign({}, form, { date_entree: e.target.value })); }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green">{modeEdit ? 'Sauvegarder' : 'Ajouter'}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {locatairesReservations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>Locataires via Werdhe</h3>
          {locatairesReservations.map(function(l, i) {
            var initiales = (l.prenom ? l.prenom.charAt(0) : '') + (l.nom ? l.nom.charAt(0) : '');
            return (
              <div key={i} className="locataire-row">
                <div className="locataire-row-left">
                  <div className="locataire-avatar-proto">{initiales}</div>
                  <div>
                    <div className="locataire-row-name">{l.prenom} {l.nom}</div>
                    <div className="locataire-row-sub">{l.logement}</div>
                  </div>
                </div>
                <div className="locataire-row-right">
                  <div>
                    <div className="locataire-loyer">{GNF(l.loyer)}/mois</div>
                  </div>
                  <button className="btn-outline-green">Voir fiche</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>Locataires manuels</h3>
      {locatairesManue.length === 0 && !showForm && (
        <div className="dash-empty-state">
          <span>👥</span>
          <h3>Aucun locataire manuel</h3>
          <p>Ajoutez des locataires sans compte Werdhe</p>
        </div>
      )}
      {locatairesManue.map(function(l) {
        var initiales = (l.prenom ? l.prenom.charAt(0) : '') + (l.nom ? l.nom.charAt(0) : '');
        return (
          <div key={l.id} className="locataire-row" style={{ borderLeft: '4px solid #F5A623' }}>
            <div className="locataire-row-left">
              <div className="locataire-avatar-proto" style={{ background: '#F5A623', color: '#1B6B3A' }}>{initiales}</div>
              <div>
                <div className="locataire-row-name">{l.prenom} {l.nom}</div>
                <div className="locataire-row-sub">
                  {l.telephone && '📞 ' + l.telephone}
                  {l.logement_titre && ' · 🏠 ' + l.logement_titre}
                </div>
              </div>
            </div>
            <div className="locataire-row-right">
              {l.loyer_mensuel && (
                <div>
                  <div className="locataire-loyer">{GNF(l.loyer_mensuel)}/mois</div>
                </div>
              )}
              <button className="btn-outline-green" onClick={function() {
                setModeEdit(l.id);
                setForm({ nom: l.nom, prenom: l.prenom, telephone: l.telephone || '', email: l.email || '', logement_id: l.logement_id || '', loyer_mensuel: l.loyer_mensuel || '', date_entree: l.date_entree ? l.date_entree.split('T')[0] : '' });
                setShowForm(true);
              }}>Modifier</button>
              <button style={{ background: '#FFEBEE', color: '#B71C1C', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }} onClick={function() { handleDelete(l.id); }}>Supprimer</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Reservations
// ================================================
function OngletReservations(props) {
  var stats = props.stats;
  var user = props.user;
  var recharger = props.recharger;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');

  // ── LOCATAIRE : liste des réservations avec lien vers le flux ─────
  if (!estProprietaire) {
    var reservationsLoc = stats.reservations || [];

    var statutsLoc = {
      en_attente          : { label: '⏳ En attente de réponse',      couleur: '#F5A623', bg: '#FFF8E1', action: 'Suivre ma demande',       urgent: true  },
      dossier_requis      : { label: '📁 Dossier demandé',             couleur: '#1565C0', bg: '#E3F2FD', action: 'Soumettre mon dossier',   urgent: true  },
      en_examen           : { label: '🔍 Dossier en cours d\'examen',  couleur: '#7B1FA2', bg: '#F3E5F5', action: 'Voir l\'avancement',      urgent: false },
      acceptee            : { label: '✅ Candidature acceptée',         couleur: '#1B6B3A', bg: '#E8F5E9', action: 'Démarrer les échanges',  urgent: true  },
      echanges            : { label: '💬 En discussion',               couleur: '#1565C0', bg: '#E3F2FD', action: 'Voir la discussion',      urgent: false },
      caution_requise     : { label: '🔒 Caution à payer',             couleur: '#E65100', bg: '#FFF3E0', action: 'Payer la caution',        urgent: true  },
      caution_payee       : { label: '🛡️ Caution versée',              couleur: '#1B6B3A', bg: '#E8F5E9', action: 'Voir l\'avancement',      urgent: false },
      bail_en_cours       : { label: '📝 Bail à signer',               couleur: '#7B1FA2', bg: '#F3E5F5', action: 'Signer le bail',         urgent: true  },
      bail_signe_proprio  : { label: '✍️ À mon tour de signer',        couleur: '#7B1FA2', bg: '#F3E5F5', action: 'Signer maintenant',      urgent: true  },
      confirmee           : { label: '🗝️ Location active',             couleur: '#1B6B3A', bg: '#E8F5E9', action: 'Voir le récapitulatif',  urgent: false },
      refusee             : { label: '❌ Candidature refusée',          couleur: '#B71C1C', bg: '#FFEBEE', action: null,                     urgent: false },
    };

    return (
      <div>
        <div className="dash-page-header">
          <div>
            <h1>Mes réservations</h1>
            <p>{reservationsLoc.length} réservation(s)</p>
          </div>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>
            + Chercher un logement
          </Link>
        </div>

        {reservationsLoc.length === 0 && (
          <div className="dash-empty-state">
            <span>📅</span>
            <h3>Aucune réservation</h3>
            <p>Trouvez un logement et envoyez une demande au propriétaire</p>
            <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Trouver un logement
            </Link>
          </div>
        )}

        {reservationsLoc.map(function(r) {
          var cfg = statutsLoc[r.statut] || { label: r.statut, couleur: '#888', bg: '#F5F5F5', action: 'Voir', urgent: false };
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + cfg.couleur }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 3 }}>
                    {r.logement_titre}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {r.date_debut ? 'Demande du ' + new Date(r.created_at).toLocaleDateString('fr-FR') : 'Demande en cours'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A', marginTop: 4 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.montant_total || r.prix_mensuel || 0)} GNF / mois
                  </div>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.couleur, flexShrink: 0, marginLeft: 10 }}>
                  {cfg.label}
                </span>
              </div>

              {cfg.urgent && (
                <div style={{ background: '#FFF8E1', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: '#7B4F00', fontWeight: 600 }}>
                  ⚡ Une action est attendue de votre part
                </div>
              )}

              {cfg.action && (
                <Link
                  to={'/reservation/' + r.id}
                  style={{ display: 'block', width: '100%', background: cfg.urgent ? '#1B6B3A' : '#F0F0F0', color: cfg.urgent ? '#fff' : '#555', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: cfg.urgent ? 700 : 400, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
                  {cfg.action} →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── PROPRIÉTAIRE : liste + détail inline (pas de navigation) ──────
  return <OngletReservationsProprio stats={stats} recharger={recharger} user={user} />;
}

// ─── Séparé pour garder le code propre ────────────────────────────
function OngletReservationsProprio(props) {
  var stats = props.stats;
  var recharger = props.recharger;
  var user = props.user;
  var [selectionne, setSelectionne] = useState(null);
  var [motifRefus, setMotifRefus] = useState('');
  var [msgs, setMsgs] = useState([]);
  var [newMsg, setNewMsg] = useState('');
  var [bailSigne, setBailSigne] = useState(false);

  // Polling toutes les 10s pour mettre à jour le statut

  var rechargerRef = useRef(recharger);
useEffect(function() { rechargerRef.current = recharger; }, [recharger]);
useEffect(function() {
  var interval = setInterval(function() {
    if (rechargerRef.current) rechargerRef.current();
  }, 10000);
  return function() { clearInterval(interval); };
}, []);

  // Quand la liste se met à jour, mettre à jour aussi la vue détail
  useEffect(function() {
    if (selectionne) {
      var updated = (stats.reservations || []).find(function(r) { return r.id === selectionne.id; });
      if (updated && updated.statut !== selectionne.statut) {
        setSelectionne(updated);
      }
    }
  }, [stats.reservations]);

  // Charger les messages quand on ouvre la discussion
  useEffect(function() {
    if (selectionne && selectionne.locataire_id && ['acceptee', 'echanges'].includes(selectionne.statut)) {
      api.get('/messages/' + selectionne.locataire_id)
        .then(function(res) { setMsgs(res.data.messages || []); })
        .catch(console.error);
    }
  }, [selectionne && selectionne.statut]);

  function action(endpoint, body, msgSucces) {
    api.patch('/reservations/' + selectionne.id + endpoint, body)
      .then(function(res) {
        toast.success(msgSucces);
        setMotifRefus('');
        if (recharger) recharger();
      })
      .catch(function(err) {
       var msg = err.response && err.response.data && err.response.data.erreur
       ? err.response.data.erreur
       : 'Erreur serveur';
       toast.error(msg);
       console.error('Détail erreur:', err.response && err.response.data);
      });
  }

  function signerBail() {
    api.patch('/reservations/' + selectionne.id + '/signer-bail', { role: 'proprietaire' })
      .then(function() {
        setBailSigne(true);
        toast.success('Bail signé ! En attente de la signature du locataire.');
        if (recharger) recharger();
      })
      .catch(function() {
        setBailSigne(true);
        toast.success('Bail signé !');
      });
  }

  function envoyerMessage() {
    if (!newMsg.trim()) return;
    api.post('/messages', {
      destinataire_id: selectionne.locataire_id,
      reservation_id: selectionne.id,
      contenu: newMsg
    })
      .then(function(res) {
        setMsgs(function(prev) { return prev.concat(res.data.data || { contenu: newMsg, expedition_id: user && user.id, created_at: new Date().toISOString() }); });
        setNewMsg('');
      })
      .catch(function() { toast.error('Erreur envoi'); });
  }

  var reservations = stats.reservations || [];
  var actionsRequises = reservations.filter(function(r) {
    return ['en_attente', 'en_examen', 'caution_payee', 'bail_en_cours'].includes(r.statut);
  });

  var cfgStatuts = {
    en_attente         : { label: '📩 Nouvelle demande',            couleur: '#E53935', urgent: true  },
    dossier_requis     : { label: '⏳ Attente du dossier',           couleur: '#F5A623', urgent: false },
    en_examen          : { label: '📋 Dossier à examiner',           couleur: '#7B1FA2', urgent: true  },
    acceptee           : { label: '✅ Acceptée',                      couleur: '#1B6B3A', urgent: false },
    echanges           : { label: '💬 Discussion en cours',          couleur: '#1565C0', urgent: false },
    caution_requise    : { label: '⏳ Caution en attente',            couleur: '#F5A623', urgent: false },
    caution_payee      : { label: '✅ Caution reçue',                 couleur: '#1B6B3A', urgent: true  },
    bail_en_cours      : { label: '📝 Bail à signer',                couleur: '#7B1FA2', urgent: true  },
    bail_signe_proprio : { label: '⏳ Attente signature locataire',  couleur: '#F5A623', urgent: false },
    confirmee          : { label: '🗝️ Location active',              couleur: '#1B6B3A', urgent: false },
    refusee            : { label: '❌ Refusée',                       couleur: '#888',    urgent: false },
  };

  // ── VUE DÉTAIL ──────────────────────────────────────────────────
  if (selectionne) {
    var r = selectionne;
    var loyer = Number(r.montant_total || r.prix_mensuel || 0);

    return (
      <div>
        {/* Bouton retour */}
        <button
          onClick={function() { setSelectionne(null); setBailSigne(false); setMotifRefus(''); setMsgs([]); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#1B6B3A', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
          ← Retour à la liste
        </button>

        {/* En-tête locataire */}
        <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                {r.locataire_prenom} {r.locataire_nom}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 }}>
                {r.logement_titre} · {new Intl.NumberFormat('fr-FR').format(loyer)} GNF/mois
              </div>
              {r.locataire_telephone && (
                <a href={'tel:' + r.locataire_telephone} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, display: 'block' }}>
                  📞 {r.locataire_telephone}
                </a>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
              {cfgStatuts[r.statut] ? cfgStatuts[r.statut].label : r.statut}
            </div>
          </div>
        </div>

        {/* ─ NOUVELLE DEMANDE ─ */}
        {r.statut === 'en_attente' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>📩 Demande reçue</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                ['Logement', r.logement_titre],
                ['Loyer', new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF/mois'],
                ['Date souhaitée', r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : 'Non précisée'],
                ['Durée', r.duree_mois ? r.duree_mois + ' mois' : 'Non précisée'],
                ['Reçue le', new Date(r.created_at).toLocaleDateString('fr-FR')],
                ['Email', r.locataire_email || 'N/A'],
              ].map(function(row) {
                return (
                  <div key={row[0]} style={{ background: '#F8F8F8', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>{row[0]}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{row[1]}</div>
                  </div>
                );
              })}
            </div>

            {r.message_locataire && (
              <div style={{ background: '#F0F7FF', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 600 }}>Message du locataire</div>
                <div style={{ fontSize: 13, color: '#333', fontStyle: 'italic' }}>"{r.message_locataire}"</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={function() { action('/decision', { decision: 'dossier_requis' }, 'Dossier demandé ! Le locataire va uploader ses documents.'); }}
                style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                📁 Demander le dossier complet
              </button>
              <button
                onClick={function() { action('/decision', { decision: 'acceptee' }, 'Candidature acceptée ! Le locataire est notifié.'); }}
                style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #A5D6A7', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                ✅ Accepter directement (sans dossier)
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={motifRefus}
                  onChange={function(e) { setMotifRefus(e.target.value); }}
                  placeholder="Motif du refus (obligatoire)"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
                <button
                  onClick={function() {
                    if (!motifRefus.trim()) { toast.error('Indiquez un motif de refus'); return; }
                    action('/decision', { decision: 'refusee', motif: motifRefus }, 'Candidature refusée. Le locataire est notifié.');
                  }}
                  style={{ background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ❌ Refuser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─ EXAMINER LE DOSSIER ─ */}
{r.statut === 'en_examen' && (
  <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>
      📋 Dossier soumis par {r.locataire_prenom}
    </div>

    {/* Documents avec liens de téléchargement */}
    <div style={{ marginBottom: 16 }}>
      {[
        { label: 'Pièce d\'identité (CNI)',  url: r.doc_cni_url,    ok: true },
        { label: 'Attestation d\'emploi',    url: r.doc_emploi_url, ok: true },
        { label: 'Fiches de paie (3 mois)', url: r.doc_paie_url,   ok: Boolean(r.doc_paie_url) },
        { label: 'Contact garant',          url: r.doc_garant_url, ok: Boolean(r.doc_garant_url) },
      ].map(function(d) {
        return (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #F5F5F5' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{d.ok ? '✅' : '⏳'}</span>
            <span style={{ fontSize: 13, color: d.ok ? '#1B2B22' : '#888', flex: 1 }}>{d.label}</span>
            {d.ok && d.url && (
              <a href={d.url} target="_blank" rel="noreferrer"
                style={{ padding: '5px 12px', borderRadius: 8, background: '#E8F5E9', color: '#1B6B3A', textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '0.5px solid #A5D6A7', flexShrink: 0 }}>
                Voir →
              </a>
            )}
            {d.ok && !d.url && (
              <span style={{ fontSize: 11, color: '#1B6B3A', fontWeight: 600 }}>Soumis ✓</span>
            )}
          </div>
        );
      })}
    </div>

    {/* Infos locataire */}
    <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 600 }}>Informations du candidat</div>
      {[
        ['Nom complet', r.locataire_prenom + ' ' + r.locataire_nom],
        ['Email',       r.locataire_email || 'N/A'],
        ['Téléphone',  r.locataire_telephone || 'N/A'],
        ['Logement',   r.logement_titre],
        ['Loyer',      GNF(loyer) + '/mois'],
        ['Date souhaitée', r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : 'N/A'],
        ['Durée',      r.duree_mois ? r.duree_mois + ' mois' : 'N/A'],
      ].map(function(row) {
        return (
          <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid #EFEFEF' }}>
            <span style={{ color: '#888' }}>{row[0]}</span>
            <span style={{ fontWeight: 600, color: '#1B2B22' }}>{row[1]}</span>
          </div>
        );
      })}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={function() { action('/decision', { decision: 'acceptee' }, 'Dossier validé ! Candidature acceptée.'); }}
        style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        ✅ Valider le dossier — Accepter la candidature
      </button>
      <button onClick={function() { action('/decision', { decision: 'dossier_requis' }, 'Informations complémentaires demandées.'); }}
        style={{ background: '#E3F2FD', color: '#1565C0', border: '1px solid #90CAF9', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        💬 Demander des informations complémentaires
      </button>
      <div style={{ display: 'flex', gap: 10 }}>
        <input type="text" value={motifRefus} onChange={function(e) { setMotifRefus(e.target.value); }}
          placeholder="Motif du refus"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
        <button onClick={function() {
          if (!motifRefus.trim()) { toast.error('Indiquez un motif'); return; }
          action('/decision', { decision: 'refusee', motif: motifRefus }, 'Candidature refusée.');
        }}
          style={{ background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ❌ Refuser
        </button>
      </div>
    </div>
  </div>
)}

        {/* ─ ÉCHANGES CHAT ─ */}
        {(r.statut === 'acceptee' || r.statut === 'echanges') && (
          <div>
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <span>🎉</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>Candidature acceptée !</div>
                <div style={{ fontSize: 12, color: '#2E7D32' }}>Discutez des conditions. Le locataire paiera la caution quand il sera prêt.</div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#1B6B3A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  {((r.locataire_prenom || 'L').charAt(0) + (r.locataire_nom || 'L').charAt(0)).toUpperCase()}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{r.locataire_prenom} {r.locataire_nom}</div>
              </div>
              <div style={{ height: 240, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: '#F8F9F8' }}>
                {msgs.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, paddingTop: 30 }}>Commencez la discussion</div>
                )}
                {msgs.map(function(m, i) {
                  var isMoi = m.expedition_id === (user && user.id);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMoi ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: isMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMoi ? '#1B6B3A' : '#fff', color: isMoi ? '#fff' : '#1B2B22', fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        {m.contenu}
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '10px 12px', background: '#fff', borderTop: '0.5px solid #F0F0F0', display: 'flex', gap: 8 }}>
                <input
                  value={newMsg}
                  onChange={function(e) { setNewMsg(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }}
                  placeholder="Écrivez un message..."
                  style={{ flex: 1, padding: '9px 14px', borderRadius: 20, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: '#F8F8F8' }} />
                <button onClick={envoyerMessage} style={{ width: 38, height: 38, borderRadius: '50%', background: '#1B6B3A', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>↗</button>
              </div>
            </div>
          </div>
        )}

        {/* ─ CAUTION EN ATTENTE ─ */}
        {r.statut === 'caution_requise' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>
              {r.locataire_prenom} est en train de payer la caution
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              Vous serez notifié(e) dès que le paiement de <strong>{new Intl.NumberFormat('fr-FR').format(loyer)} GNF</strong> est confirmé.
            </div>
          </div>
        )}

        {/* ─ CAUTION REÇUE → PRÉPARER LE BAIL ─ */}
        {r.statut === 'caution_payee' && (
          <div>
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <span>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>
                  Caution reçue : {new Intl.NumberFormat('fr-FR').format(loyer)} GNF
                </div>
                <div style={{ fontSize: 12, color: '#2E7D32' }}>
                  Préparez maintenant le bail pour les deux signatures.
                </div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>
                Le bail sera généré avec :
              </div>
              {[
                'Identités des deux parties',
                'Adresse complète du logement',
                'Loyer mensuel : ' + new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF',
                'Date de début et durée du bail',
                'Caution versée : ' + new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF ✅',
              ].map(function(item) {
                return (
                  <div key={item} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 13, color: '#555' }}>
                    <span style={{ color: '#1B6B3A' }}>✓</span>
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={function() { action('/statut', { statut: 'bail_en_cours' }, 'Bail généré ! Les deux parties peuvent signer.'); }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              📝 Générer et préparer le bail
            </button>
          </div>
        )}

        {/* ─ BAIL À SIGNER ─ */}
        {r.statut === 'bail_en_cours' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>📝 Bail prêt à signer</div>
            <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Locataire', r.locataire_prenom + ' ' + r.locataire_nom],
                ['Logement', r.logement_titre],
                ['Loyer', new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF/mois'],
                ['Début', r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : 'N/A'],
                ['Durée', r.duree_mois ? r.duree_mois + ' mois' : 'N/A'],
                ['Caution', new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF ✅'],
              ].map(function(row) {
                return (
                  <div key={row[0]} style={{ fontSize: 11, color: '#666' }}>
                    <b>{row[0]} :</b> {row[1]}
                  </div>
                );
              })}
            </div>
            <div onClick={function() { if (!bailSigne) signerBail(); }}
              style={{ padding: 16, border: bailSigne ? '1.5px solid #1B6B3A' : '1.5px dashed #1B6B3A', background: bailSigne ? '#E8F5E9' : '#F0FBF0', borderRadius: 12, textAlign: 'center', cursor: bailSigne ? 'default' : 'pointer', marginBottom: 14 }}>
              {bailSigne ? (
                <div>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B6B3A' }}>Vous avez signé !</div>
                  <div style={{ fontSize: 12, color: '#2E7D32', marginTop: 4 }}>En attente de la signature du locataire...</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✍️</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B6B3A' }}>Appuyer pour signer le bail</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Signature numérique sécurisée</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─ EN ATTENTE SIGNATURE LOCATAIRE ─ */}
        {r.statut === 'bail_signe_proprio' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>
              En attente de la signature de {r.locataire_prenom}
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              Vous avez signé. Le locataire doit maintenant signer à son tour. La page se met à jour automatiquement.
            </div>
          </div>
        )}

        {/* ─ LOCATION ACTIVE ─ */}
        {r.statut === 'confirmee' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🗝️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1B6B3A' }}>Location active</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
                {r.locataire_prenom} {r.locataire_nom} occupe votre logement.
              </div>
            </div>
            {[
              ['Locataire',       r.locataire_prenom + ' ' + r.locataire_nom],
              ['Téléphone',       r.locataire_telephone || 'N/A'],
              ['Logement',        r.logement_titre],
              ['Loyer mensuel',   new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF'],
              ['Caution versée',  new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#1B2B22' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ─ REFUSÉE ─ */}
        {r.statut === 'refusee' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#B71C1C' }}>Demande refusée</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Le locataire a été notifié du refus.</div>
          </div>
        )}
      </div>
    );
  }

  // ── VUE LISTE ────────────────────────────────────────────────────
  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>Réservations</h1>
          <p>{reservations.length} réservation(s)</p>
        </div>
      </div>

      {actionsRequises.length > 0 && (
        <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#B71C1C' }}>
              {actionsRequises.length} action(s) requise(s) de votre part
            </div>
            <div style={{ fontSize: 12, color: '#C62828' }}>
              Répondez aux demandes en attente pour ne pas faire patienter vos locataires.
            </div>
          </div>
        </div>
      )}

      {reservations.length === 0 && (
        <div className="dash-empty-state">
          <span>📅</span>
          <h3>Aucune demande reçue</h3>
          <p>Les demandes de réservation apparaîtront ici</p>
        </div>
      )}

      {reservations.map(function(r) {
        var cfg = cfgStatuts[r.statut] || { label: r.statut, couleur: '#888', urgent: false };
        return (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + (cfg.urgent ? '#E53935' : '#1B6B3A') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 38, height: 38, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {((r.locataire_prenom || 'L').charAt(0) + (r.locataire_nom || 'L').charAt(0)).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>
                      {r.locataire_prenom} {r.locataire_nom}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>{r.locataire_telephone}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>🏠 {r.logement_titre}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A', marginTop: 3 }}>
                  {new Intl.NumberFormat('fr-FR').format(r.montant_total || r.prix_mensuel || 0)} GNF/mois
                </div>
              </div>
              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.urgent ? '#FFEBEE' : '#E8F5E9', color: cfg.couleur, flexShrink: 0, marginLeft: 10 }}>
                {cfg.label}
              </span>
            </div>
            {cfg.urgent && (
              <div style={{ background: '#FFF8E1', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: '#7B4F00', fontWeight: 600 }}>
                ⚡ Votre intervention est requise
              </div>
            )}
            <button
              onClick={function() { setSelectionne(r); }}
              style={{ width: '100%', background: cfg.urgent ? '#1B6B3A' : '#F0F0F0', color: cfg.urgent ? '#fff' : '#555', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: cfg.urgent ? 700 : 400, cursor: 'pointer' }}>
              {cfg.urgent ? '⚡ Répondre maintenant →' : 'Voir le détail →'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Paiements
// ================================================

function OngletPaiements(props) {
  var stats = props.stats;
  var user = props.user;
  var estLocataire = user && user.role === 'locataire';
  if (estLocataire) return <PaiementsLocataire stats={stats} />;
  return <PaiementsProprietaire stats={stats} />;
}

function PaiementsProprietaire(props) {
  var stats = props.stats;
  var [filterStatut, setFilterStatut] = useState('tous');
  var [modal, setModal] = useState(null);
  var [selectedMode, setSelectedMode] = useState('om');
  var [processing, setProcessing] = useState(false);
  var [done, setDone] = useState(false);
  var [biensList, setBiensList] = useState(null);
  var PAY_MODES = [
    { id: 'om', label: 'Orange Money', sub: 'Instantane', color: '#FF6600', text: '#fff', abbr: 'OM' },
    { id: 'mtn', label: 'MTN MoMo', sub: 'Instantane', color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
    { id: 'cash', label: 'Especes', sub: 'Recu PDF auto', icon: '💵' },
    { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank', icon: '🏦' }
  ];
  useEffect(function() {
    var bl = stats.logements.map(function(l) {
      var dp = stats.paiements.find(function(p) { return String(p.logement_id) === String(l.id) && p.statut === 'complete'; });
      var ea = stats.paiements.find(function(p) { return String(p.logement_id) === String(l.id) && p.statut === 'en_attente'; });
      return { id: l.id, nom: l.titre, locataire: '—', quartier: l.ville, loyer: Number(l.prix_mensuel), statut: l.statut === 'loue' ? (dp ? 'paye' : ea ? 'en_retard' : 'impaye') : 'impaye', jours: ea ? 5 : 0, icon: '🏠' };
    });
    if (bl.length === 0) bl = [
      { id: '1', nom: 'Villa Ratoma', locataire: 'Mamadou Diallo', quartier: 'Ratoma', loyer: 2500000, statut: 'en_retard', jours: 12, icon: '🏠' },
      { id: '2', nom: 'Appart Kaloum 2', locataire: 'Fatoumata Camara', quartier: 'Kaloum', loyer: 1800000, statut: 'impaye', jours: 3, icon: '🏢' },
      { id: '3', nom: 'Studio Matam', locataire: 'Sekou Konate', quartier: 'Matam', loyer: 900000, statut: 'paye', jours: 0, icon: '🏠' }
    ];
    setBiensList(bl);
  }, [stats]);
  if (!biensList) return null;
  function ouvrirModal(b) { setModal(b); setSelectedMode('om'); setProcessing(false); setDone(false); }
  function fermerModal() { setModal(null); setDone(false); }
  function confirmerPaiement() {
    setProcessing(true);
    setTimeout(function() { setProcessing(false); setDone(true); setBiensList(function(prev) { return prev.map(function(b) { return b.id === modal.id ? Object.assign({}, b, { statut: 'paye', jours: 0 }) : b; }); }); }, 2000);
  }
  var totalAttendu = biensList.reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalPercu = biensList.filter(function(b) { return b.statut === 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalImpaye = biensList.filter(function(b) { return b.statut !== 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var tauxRecouv = totalAttendu > 0 ? Math.round(totalPercu / totalAttendu * 100) : 0;
  var moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  var filtered = filterStatut === 'tous' ? biensList : biensList.filter(function(b) { return b.statut === filterStatut; });
  var SCFG = { paye: { label: 'Paye', bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7', bar: '#1B6B3A' }, impaye: { label: 'Non paye', bg: '#FFEBEE', color: '#B71C1C', border: '#FFCDD2', bar: '#E53935' }, en_retard: { label: 'En retard', bg: '#FFF8E1', color: '#7B4F00', border: '#FFE082', bar: '#C8860A' } };
  return (
    <div style={{fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#1B6B3A',borderRadius:'14px',padding:'14px 18px',marginBottom:'18px'}}>
        <div style={{color:'#fff',fontWeight:'700',fontSize:'16px'}}>Gestion des paiements</div>
        <div style={{color:'rgba(255,255,255,.7)',fontSize:'12px',marginTop:'2px'}}>{moisActuel} · {biensList.length} biens</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'18px'}}>
        {[{label:'Encaisse',val:GNF(totalPercu),sub:'Taux : '+tauxRecouv+'%',bg:'#E8F5E9',border:'#1B6B3A',color:'#1B6B3A'},{label:'Impayes',val:GNF(totalImpaye),sub:biensList.filter(function(b){return b.statut!=='paye';}).length+' locataire(s)',bg:'#FFEBEE',border:'#E53935',color:'#C62828'},{label:'Attendu',val:GNF(totalAttendu),sub:'Total du mois',bg:'#F0F4F1',border:'#888',color:'#333'}].map(function(k){return(<div key={k.label} style={{background:k.bg,borderRadius:'12px',padding:'12px 14px',borderLeft:'3px solid '+k.border}}><div style={{fontSize:'11px',color:k.color,marginBottom:'4px'}}>{k.label}</div><div style={{fontSize:'15px',fontWeight:'700',color:k.color}}>{k.val}</div><div style={{fontSize:'10px',color:k.color,marginTop:'2px',opacity:0.7}}>{k.sub}</div></div>);})}
      </div>
      <div style={{background:'#fff',borderRadius:'12px',padding:'14px 16px',marginBottom:'16px',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span style={{fontSize:'13px',fontWeight:'600'}}>Taux de recouvrement</span><span style={{fontSize:'13px',fontWeight:'700',color:'#1B6B3A'}}>{tauxRecouv}%</span></div>
        <div style={{background:'#F0F0F0',borderRadius:'6px',height:'10px',overflow:'hidden'}}><div style={{background:'linear-gradient(90deg,#1B6B3A,#34A853)',width:tauxRecouv+'%',height:'100%',borderRadius:'6px',transition:'width .5s'}}/></div>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
        {[['tous','Tous','#1B6B3A'],['paye','Payes','#1B6B3A'],['impaye','Non payes','#C62828'],['en_retard','En retard','#C8860A']].map(function(f){return(<button key={f[0]} type="button" onClick={function(){setFilterStatut(f[0]);}} style={{padding:'7px 16px',borderRadius:'20px',fontSize:'12px',cursor:'pointer',border:filterStatut===f[0]?'1.5px solid '+f[2]:'0.5px solid #E0E0E0',background:filterStatut===f[0]?f[2]:'#fff',color:filterStatut===f[0]?'#fff':'#666',fontWeight:filterStatut===f[0]?700:400}}>{f[1]}</button>);})}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
        {filtered.length===0&&<div style={{textAlign:'center',padding:'30px',color:'#888'}}>Aucun bien dans cette categorie</div>}
        {filtered.map(function(b){var s=SCFG[b.statut]||SCFG.impaye;return(<div key={b.id} style={{background:'#fff',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(0,0,0,.04)',borderLeft:'4px solid '+s.bar}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{display:'flex',gap:'10px',alignItems:'center'}}><div style={{width:'40px',height:'40px',background:'#F0F4F1',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{b.icon}</div><div><div style={{fontWeight:'700',fontSize:'14px',color:'#1B2B22'}}>{b.nom}</div><div style={{fontSize:'12px',color:'#888'}}>{b.locataire} · {b.quartier}</div></div></div>
            <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',background:s.bg,color:s.color,border:'0.5px solid '+s.border}}>{s.label}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
            <div style={{background:'#F8F8F8',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'#888'}}>Loyer mensuel</div><div style={{fontSize:'14px',fontWeight:'700',color:'#1B6B3A'}}>{GNF(b.loyer)}</div></div>
            <div style={{background:'#F8F8F8',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'#888'}}>Situation</div><div style={{fontSize:'13px',fontWeight:'600',color:s.color}}>{b.statut==='paye'?'Paye ce mois':b.statut==='en_retard'?'Retard : '+b.jours+' jours':'Non paye'}</div></div>
          </div>
          {b.statut==='paye'?(<div style={{display:'flex',gap:'8px'}}><button type="button" style={{flex:1,background:'#F0F4F1',color:'#1B6B3A',border:'0.5px solid #A5D6A7',borderRadius:'10px',padding:'9px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>Voir quittance</button><button type="button" style={{flex:1,background:'#F5F5F5',color:'#555',border:'0.5px solid #E0E0E0',borderRadius:'10px',padding:'9px',fontSize:'13px',cursor:'pointer'}}>Contacter</button></div>):(<div style={{display:'flex',gap:'8px'}}><button type="button" onClick={function(){ouvrirModal(b);}} style={{flex:2,background:'#1B6B3A',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>Enregistrer le paiement</button><button type="button" style={{flex:1,background:'#FFEBEE',color:'#B71C1C',border:'0.5px solid #FFCDD2',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>Relancer</button></div>)}
        </div>);})}
      </div>
      {modal&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'flex-end',zIndex:1000}} onClick={function(e){if(e.target===e.currentTarget)fermerModal();}}>
        <div style={{background:'#fff',borderRadius:'20px 20px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:'600px',margin:'0 auto',maxHeight:'90vh',overflowY:'auto'}}>
          {!done?(<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><div><div style={{fontSize:'16px',fontWeight:'700'}}>Enregistrer un paiement</div><div style={{fontSize:'12px',color:'#888'}}>{modal.nom} · {modal.locataire}</div></div><button type="button" onClick={fermerModal} style={{width:'32px',height:'32px',borderRadius:'50%',border:'none',background:'#F5F5F5',cursor:'pointer'}}>x</button></div>
            <div style={{background:'#F0F4F1',borderRadius:'12px',padding:'14px',marginBottom:'18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:'12px',color:'#555'}}>Montant du loyer</div></div><div style={{fontSize:'22px',fontWeight:'700',color:'#1B6B3A'}}>{GNF(modal.loyer)}</div></div>
            <div style={{fontSize:'13px',fontWeight:'700',marginBottom:'12px'}}>Mode de paiement</div>
            {PAY_MODES.map(function(p){return(<div key={p.id} onClick={function(){setSelectedMode(p.id);}} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',border:selectedMode===p.id?'2px solid #1B6B3A':'0.5px solid #E0E0E0',background:selectedMode===p.id?'#E8F5E9':'#fff',borderRadius:'12px',marginBottom:'8px',cursor:'pointer'}}><div style={{width:'40px',height:'40px',background:p.color||'#E8F5E9',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:p.icon?'20px':'13px',fontWeight:'700',color:p.text||'#1B6B3A'}}>{p.icon||p.abbr}</div><div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'600'}}>{p.label}</div><div style={{fontSize:'11px',color:'#888'}}>{p.sub}</div></div><div style={{width:'22px',height:'22px',borderRadius:'50%',border:selectedMode===p.id?'none':'1.5px solid #E0E0E0',background:selectedMode===p.id?'#1B6B3A':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedMode===p.id&&<span style={{color:'#fff',fontSize:'12px'}}>✓</span>}</div></div>);})}
            <button type="button" onClick={confirmerPaiement} disabled={processing} style={{width:'100%',background:processing?'#999':'#1B6B3A',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'700',cursor:processing?'not-allowed':'pointer',marginTop:'6px'}}>{processing?'Traitement...':'Confirmer — '+GNF(modal.loyer)}</button>
          </div>):(<div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{width:'70px',height:'70px',background:'#E8F5E9',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'36px'}}>✅</div>
            <div style={{fontSize:'20px',fontWeight:'700',color:'#1B6B3A',marginBottom:'8px'}}>Paiement enregistre !</div>
            <div style={{fontSize:'13px',color:'#666',marginBottom:'20px'}}>Quittance envoyee au locataire.</div>
            <div style={{display:'flex',gap:'10px'}}><button type="button" style={{flex:1,background:'#F0F4F1',color:'#1B6B3A',border:'0.5px solid #A5D6A7',borderRadius:'10px',padding:'12px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>Voir quittance</button><button type="button" onClick={fermerModal} style={{flex:1,background:'#1B6B3A',color:'#fff',border:'none',borderRadius:'10px',padding:'12px',fontSize:'13px',cursor:'pointer',fontWeight:'700'}}>Retour</button></div>
          </div>)}
        </div>
      </div>)}
    </div>
  );
}

function PaiementsLocataire(props) {
  var stats = props.stats;
  var PAY_MODES = [
    { id: 'om', label: 'Orange Money', sub: 'Instantane', color: '#FF6600', text: '#fff', abbr: 'OM' },
    { id: 'mtn', label: 'MTN MoMo', sub: 'Instantane', color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
    { id: 'cash', label: 'Especes', sub: 'Recu PDF auto', icon: '💵' },
    { id: 'bank', label: 'Virement', sub: 'BICIGUI · Ecobank', icon: '🏦' }
  ];
  var [nbMois, setNbMois] = useState(1);
  var [mode, setMode] = useState('om');
  var [stepPay, setStepPay] = useState('select');
  var [logement, setLogement] = useState(null);
  useEffect(function() {
    var r = (stats.reservations||[]).find(function(r){return r.statut==='confirmee';});
    if(r){setLogement({nom:r.logement_titre||'Mon logement',proprio:(r.proprietaire_prenom||'')+' '+(r.proprietaire_nom||''),propIni:((r.proprietaire_prenom||'').charAt(0)+(r.proprietaire_nom||'').charAt(0)).toUpperCase()||'P',quartier:r.logement_ville||'Conakry',loyer:Number(r.montant_total)||1500000,debut:r.date_debut?new Date(r.date_debut).toLocaleDateString('fr-FR'):'—',fin:r.date_fin?new Date(r.date_fin).toLocaleDateString('fr-FR'):'—'});}
    else{setLogement({nom:'Appartement F3 - Ratoma',proprio:'Mamadou Barry',propIni:'MB',quartier:'Ratoma, Conakry',loyer:1500000,debut:'1 juillet 2025',fin:'30 juin 2026'});}
  }, [stats]);
  if (!logement) return null;
  var addMonths = function(n){var d=new Date();d.setMonth(d.getMonth()+n);return d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});};
  var moisActuel = new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  var total = logement.loyer * nbMois;
  var historique = (stats.paiements||[]).slice(0,3).map(function(p){return{mois:new Date(p.created_at).toLocaleDateString('fr-FR',{month:'long',year:'numeric'}),montant:Number(p.montant),mode:p.mode_paiement==='en_ligne'?'En ligne':'Especes'};});
  if(historique.length===0){historique=[{mois:'Mois precedent',montant:logement.loyer,mode:'Orange Money'},{mois:'Il y a 2 mois',montant:logement.loyer,mode:'Especes'},{mois:'Il y a 3 mois',montant:logement.loyer,mode:'MTN MoMo'}];}
  return (
    <div style={{fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#1A4FA0',borderRadius:'14px',padding:'16px 18px',marginBottom:'18px'}}><div style={{color:'#fff',fontWeight:'700',fontSize:'16px'}}>Mes paiements</div><div style={{color:'rgba(255,255,255,.75)',fontSize:'12px',marginTop:'2px'}}>{moisActuel}</div></div>
      <div style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'14px',boxShadow:'0 2px 10px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'14px'}}>
          <div style={{width:'52px',height:'52px',background:'#E3F2FD',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>🏢</div>
          <div style={{flex:1}}><div style={{fontWeight:'700',fontSize:'14px',color:'#1B2B22'}}>{logement.nom}</div><div style={{fontSize:'12px',color:'#888',marginTop:'2px'}}>📍 {logement.quartier}</div><div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px'}}><div style={{width:'26px',height:'26px',background:'#1B6B3A',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'10px',fontWeight:'700'}}>{logement.propIni}</div><span style={{fontSize:'12px',color:'#555'}}>{logement.proprio}</span></div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:'16px',fontWeight:'700',color:'#1A4FA0'}}>{GNF(logement.loyer)}</div><div style={{fontSize:'10px',color:'#888'}}>/ mois</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
          {[['Debut',logement.debut],['Fin',logement.fin],['Caution',GNF(logement.loyer)]].map(function(row){return <div key={row[0]} style={{background:'#F8F8F8',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'#888'}}>{row[0]}</div><div style={{fontSize:'11px',fontWeight:'600',color:'#333',marginTop:'2px'}}>{row[1]}</div></div>;})}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:stepPay==='success'?'#E8F5E9':'#FFEBEE',borderRadius:'10px',marginBottom:'14px',border:'0.5px solid '+(stepPay==='success'?'#A5D6A7':'#FFCDD2')}}>
          <div><div style={{fontSize:'13px',fontWeight:'700',color:stepPay==='success'?'#1B6B3A':'#B71C1C'}}>{stepPay==='success'?'Loyer paye — '+moisActuel:'Loyer impaye — '+moisActuel}</div><div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{stepPay==='success'?'Quittance envoyee':'Du depuis 3 jours'}</div></div>
          <div style={{fontSize:'16px',fontWeight:'700',color:stepPay==='success'?'#1B6B3A':'#C62828'}}>{GNF(logement.loyer)}</div>
        </div>
        <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'8px'}}>Historique recent</div>
        {historique.map(function(h,i){return(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'#F8F8F8',borderRadius:'8px',marginBottom:'6px'}}><div><div style={{fontSize:'12px',fontWeight:'600'}}>{h.mois}</div><div style={{fontSize:'11px',color:'#888'}}>{h.mode}</div></div><div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'12px',fontWeight:'700',color:'#1B6B3A'}}>{GNF(h.montant)}</span><span style={{background:'#E8F5E9',color:'#1B5E20',padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:'700'}}>Paye</span></div></div>);})}
      </div>
      {stepPay!=='success'?(<div style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'14px',boxShadow:'0 2px 10px rgba(0,0,0,.06)'}}>
        <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>Effectuer un paiement</div>
        <div style={{marginBottom:'18px'}}>
          <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'10px'}}>Nombre de mois a payer</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginBottom:'10px'}}>
            {[[1,'1 mois'],[2,'2 mois'],[3,'3 mois'],[6,'6 mois'],[12,'1 an']].map(function(opt){return(<button key={opt[0]} type="button" onClick={function(){setNbMois(opt[0]);}} style={{padding:'10px 4px',borderRadius:'10px',fontSize:'13px',cursor:'pointer',border:nbMois===opt[0]?'2px solid #1A4FA0':'0.5px solid #E0E0E0',background:nbMois===opt[0]?'#E3F2FD':'#FAFAFA',color:nbMois===opt[0]?'#0D47A1':'#555',fontWeight:nbMois===opt[0]?700:400}}>{opt[1]}</button>);})}
          </div>
          <div style={{background:'#E3F2FD',borderRadius:'10px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:'12px',color:'#0D47A1',fontWeight:'600'}}>Periode couverte</div><div style={{fontSize:'11px',color:'#1565C0',marginTop:'2px'}}>{moisActuel} vers {addMonths(nbMois-1)}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:'11px',color:'#888'}}>{nbMois} x {GNF(logement.loyer)}</div><div style={{fontSize:'18px',fontWeight:'700',color:'#1A4FA0'}}>{GNF(total)}</div></div>
          </div>
        </div>
        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'10px'}}>Mode de paiement</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {PAY_MODES.map(function(p){return(<div key={p.id} onClick={function(){setMode(p.id);}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 12px',cursor:'pointer',border:mode===p.id?'2px solid #1A4FA0':'0.5px solid #E0E0E0',background:mode===p.id?'#E3F2FD':'#fff',borderRadius:'10px'}}><div style={{width:'34px',height:'34px',background:p.color||'#E8F5E9',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:p.icon?'18px':'11px',fontWeight:'700',color:p.text||'#1B6B3A',flexShrink:0}}>{p.icon||p.abbr}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'12px',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.label}</div><div style={{fontSize:'10px',color:'#888'}}>{p.sub}</div></div>{mode===p.id&&<span style={{color:'#1A4FA0',fontSize:'14px',flexShrink:0}}>✓</span>}</div>);})}
          </div>
        </div>
        <div style={{background:'#F8F8F8',borderRadius:'10px',padding:'12px 14px',marginBottom:'14px'}}>
          <div style={{fontSize:'12px',fontWeight:'600',marginBottom:'8px'}}>Recapitulatif</div>
          {[['Bien',logement.nom],['Mois payes',nbMois+' mois'],['Mode',(PAY_MODES.find(function(p){return p.id===mode;})||{}).label],['Total',GNF(total)]].map(function(row){return(<div key={row[0]} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'4px 0',borderBottom:'0.5px solid #EFEFEF'}}><span style={{color:'#888'}}>{row[0]}</span><span style={{fontWeight:'600',color:row[0]==='Total'?'#1A4FA0':'#333'}}>{row[1]}</span></div>);})}
        </div>
        <button type="button" onClick={function(){setStepPay('success');toast.success('Paiement effectue ! Quittance generee.');}} style={{width:'100%',background:'#1A4FA0',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'700',cursor:'pointer'}}>Confirmer — {GNF(total)}</button>
      </div>):(<div style={{background:'#E8F5E9',borderRadius:'14px',padding:'20px',textAlign:'center',boxShadow:'0 2px 10px rgba(0,0,0,.06)'}}><div style={{fontSize:'40px',marginBottom:'10px'}}>🎉</div><div style={{fontSize:'16px',fontWeight:'700',color:'#1B6B3A',marginBottom:'6px'}}>Paiement effectue !</div><div style={{fontSize:'13px',color:'#2E7D32',marginBottom:'16px'}}>{GNF(total)} · {nbMois} mois · Quittance envoyee</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}><button type="button" style={{background:'#fff',color:'#1B6B3A',border:'0.5px solid #A5D6A7',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>Voir quittance</button><button type="button" onClick={function(){setStepPay('select');setNbMois(1);}} style={{background:'#1B6B3A',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer',fontWeight:'700'}}>Retour</button></div></div>)}
    </div>
  );
}

// ================================================
// ONGLET : Preavis
// ================================================

function OngletPreavis(props) {
  var user      = props.user;
  var setOnglet = props.setOnglet;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');
  var [step, setStep]       = useState('form');
  var [motif, setMotif]     = useState('');
  var [delai, setDelai]     = useState('');
  var [note, setNote]       = useState('');
  var [bien, setBien]       = useState(null);
  var [biens, setBiens]     = useState([]);
  var [reservation, setReservation] = useState(null);
  var [resultat, setResultat] = useState(null);
  var [loading, setLoading] = useState(false);

  var addDays = function(n) {
    var d = new Date(); d.setDate(d.getDate() + n);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  var motifsList = estProprietaire
    ? ['Vente du bien immobilier', 'Reprise pour usage personnel', 'Travaux de rénovation importants', 'Non-paiement répété des loyers', 'Troubles de voisinage', 'Fin de bail non renouvelé', 'Autre motif']
    : ['Changement de ville ou de pays', 'Achat d\'un bien immobilier', 'Logement inadapté à mes besoins', 'Raisons professionnelles', 'Raisons familiales', 'Conditions du logement insatisfaisantes', 'Autre raison'];

  useEffect(function() {
    if (estProprietaire) {
      api.get('/reservations/proprietaire')
        .then(function(res) {
          setBiens((res.data.reservations || []).filter(function(r) { return r.statut === 'confirmee'; }));
        }).catch(console.error);
    } else {
      api.get('/reservations/mes-reservations')
        .then(function(res) {
          setReservation((res.data.reservations || []).find(function(r) { return r.statut === 'confirmee'; }));
        }).catch(console.error);
    }
  }, [estProprietaire]);

  function envoyer() {
    var reservationId = estProprietaire ? (bien && bien.id) : (reservation && reservation.id);
    
    console.log('=== PREAVIS DEBUG ===');
    console.log('reservationId:', reservationId);
    console.log('motif:', motif);
    console.log('delai:', delai);
    console.log('type:', estProprietaire ? 'proprietaire' : 'locataire');
    console.log('reservation:', reservation);
    if (!reservationId) { toast.error('Aucune réservation active trouvée'); return; }
    setLoading(true);
    api.post('/preavis', {
      reservation_id: reservationId,
      motif:          motif,
      delai_mois:     parseInt(delai),
      note:           note,
      type:           estProprietaire ? 'proprietaire' : 'locataire'
    })
    .then(function(res) {
      setResultat(res.data);
      setStep('sent');
      toast.success('Préavis envoyé ! Email + notification envoyés.');
    })
    .catch(function(err) {
      toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur envoi préavis');
    })
    .finally(function() { setLoading(false); });
  }

  function telechargerPDF() {
    // Générer et télécharger le document préavis
    api.get('/documents?type=preavis')
      .then(function(res) {
        var docs = res.data.documents || [];
        if (docs.length > 0) {
          var doc = docs[0];
          return api.get('/documents/' + doc.id + '/telecharger', { responseType: 'blob' })
            .then(function(r) {
              var url  = window.URL.createObjectURL(new Blob([r.data], { type: 'text/html' }));
              var link = document.createElement('a');
              link.href = url;
              link.download = 'Preavis_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.html';
              document.body.appendChild(link);
              link.click();
              link.remove();
              toast.success('PDF téléchargé !');
            });
        } else {
          // Générer un PDF minimal depuis les données locales
          var contenu = `
            <html><head><meta charset="UTF-8"><title>Préavis</title>
            <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto}
            h1{color:#1B6B3A}.box{background:#FFF8E1;border:1px solid #FFE082;border-radius:8px;padding:16px;margin:16px 0}
            .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid #FFE082;font-size:14px}</style></head>
            <body>
              <h1>🏠 Werdhe — Préavis de départ</h1>
              <p>Date : ${new Date().toLocaleDateString('fr-FR')}</p>
              <div class="box">
                <div class="row"><span>Motif</span><b>${motif}</b></div>
                <div class="row"><span>Délai</span><b>${delai} mois</b></div>
                <div class="row"><span>Date de sortie estimée</span><b>${addDays(parseInt(delai) * 30)}</b></div>
              </div>
              ${note ? '<p style="font-style:italic">"' + note + '"</p>' : ''}
              <p>Généré par Werdhe · werdhe.com</p>
            </body></html>
          `;
          var blob = new Blob([contenu], { type: 'text/html' });
          var url  = window.URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'Preavis_Werdhe.html';
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success('Préavis téléchargé !');
        }
      })
      .catch(function() { toast.error('Erreur téléchargement'); });
  }

  function contacter() {
    if (setOnglet) setOnglet('/dashboard/messages');
    else window.location.href = '/dashboard/messages';
  }

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>📤 Préavis de départ</h1>
          <p>{estProprietaire ? 'Notifier un locataire' : 'Notifier votre propriétaire'}</p>
        </div>
        {step !== 'form' && (
          <button className="btn-outline-green" onClick={function() { setStep('form'); setMotif(''); setDelai(''); setNote(''); setBien(null); setResultat(null); }}>
            + Nouveau préavis
          </button>
        )}
      </div>

      {/* ── ÉCRAN ENVOYÉ ─────────────────────────────────────── */}
      {step === 'sent' && resultat && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, background: estProprietaire ? '#FFF3E0' : '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 32 }}>
              {estProprietaire ? '📤' : '✅'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: estProprietaire ? '#C62828' : '#1B6B3A', marginBottom: 8 }}>
              {estProprietaire ? 'Préavis officiel envoyé' : 'Préavis envoyé !'}
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              {estProprietaire
                ? <span><b>{resultat.dest_prenom} {resultat.dest_nom}</b> a été notifié par SMS et email. Il a <b>48h</b> pour accuser réception.</span>
                : <span>Votre propriétaire a été notifié par email et notification. Il a <b>48h</b> pour accuser réception.</span>
              }
            </div>
          </div>

          {/* Récap préavis */}
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7B4F00', marginBottom: 10 }}>📋 {estProprietaire ? 'Préavis officiel' : 'Votre préavis officiel'}</div>
            {[
              estProprietaire ? ['Bien', bien && bien.logement_titre] : ['Logement', reservation && reservation.logement_titre],
              estProprietaire ? ['Locataire notifié', resultat.dest_prenom + ' ' + resultat.dest_nom] : null,
              estProprietaire ? ['Contact', resultat.dest_tel || 'N/A'] : null,
              ['Motif', motif],
              [estProprietaire ? 'Délai accordé' : 'Délai de préavis', delai + ' mois'],
              ['Date de sortie estimée', resultat.date_sortie || addDays(parseInt(delai) * 30)],
              ['Statut', '⏳ En attente d\'accusé de réception'],
            ].filter(Boolean).map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#7B4F00', textAlign: 'right' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          {/* Info suite */}
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#1B5E20', display: 'flex', gap: 6 }}>
            <span>ℹ️</span>
            <span style={{ lineHeight: 1.5 }}>
              {estProprietaire
                ? 'Continuez à encaisser les loyers normalement jusqu\'à la date de sortie. L\'état des lieux de sortie sera planifié automatiquement dans ' + delai + ' mois.'
                : 'Continuez à payer vos loyers normalement jusqu\'à la date de sortie. Un état des lieux de sortie sera planifié avec le propriétaire.'}
            </span>
          </div>

          {/* Boutons actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={contacter}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: '#F5F5F5', color: '#555', border: '0.5px solid #E0E0E0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              💬 {estProprietaire ? 'Contacter le locataire' : 'Contacter le proprio'}
            </button>
            <button onClick={telechargerPDF}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: estProprietaire ? '#C62828' : '#1B6B3A', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              📄 Télécharger PDF
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION AVANT ENVOI ─────────────────────────── */}
      {step === 'confirm' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>⚠️ Confirmer l'envoi du préavis</div>
          <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: '#B71C1C', fontWeight: 600 }}>
            Action officielle et irréversible. Le destinataire recevra un email + une notification sur la plateforme.
          </div>
          {[
            estProprietaire ? ['Bien', bien && bien.logement_titre] : ['Logement', reservation && reservation.logement_titre],
            ['Motif', motif],
            ['Délai', delai + ' mois'],
            ['Date de sortie estimée', addDays(parseInt(delai) * 30)],
            note ? ['Message', note] : null,
          ].filter(Boolean).map(function(row) {
            return (
              <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '0.5px solid #f0f0f0', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: '#888' }}>{row[0]}</span>
                <span style={{ fontWeight: 600, color: '#333', textAlign: 'right', maxWidth: '60%' }}>{row[1]}</span>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={function() { setStep('form'); }}
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer' }}>← Modifier</button>
            <button onClick={envoyer} disabled={loading}
              style={{ flex: 2, background: loading ? '#999' : (estProprietaire ? '#C62828' : '#1B6B3A'), color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Envoi en cours...' : '📤 Envoyer le préavis officiel'}
            </button>
          </div>
        </div>
      )}

      {/* ── FORMULAIRE ───────────────────────────────────────── */}
      {step === 'form' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#7B4F00', display: 'flex', gap: 6 }}>
            <span>⚖️</span>
            <span>Le préavis sera envoyé officiellement par email et notification à la partie concernée.</span>
          </div>

          {/* Sélection bien (proprio) */}
          {estProprietaire && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>Bien concerné *</div>
              {biens.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>Aucune location active</div>}
              {biens.map(function(b) {
                return (
                  <div key={b.id} onClick={function() { setBien(b); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: bien && bien.id === b.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: bien && bien.id === b.id ? '#E8F5E9' : '#FAFAFA', borderRadius: 10, marginBottom: 8, cursor: 'pointer' }}>
                    <span style={{ fontSize: 20 }}>🏠</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.logement_titre}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{b.locataire_prenom} {b.locataire_nom} · {b.locataire_telephone}</div>
                    </div>
                    {bien && bien.id === b.id && <span style={{ color: '#1B6B3A', fontWeight: 700 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Motif */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>Motif de départ *</div>
            {motifsList.map(function(m) {
              return (
                <div key={m} onClick={function() { setMotif(m); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: motif === m ? '1.5px solid #1B6B3A' : '0.5px solid #E0E0E0', background: motif === m ? '#E8F5E9' : '#FAFAFA', borderRadius: 10, marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: motif === m ? 'none' : '1.5px solid #CCC', background: motif === m ? '#1B6B3A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {motif === m && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: motif === m ? '#1B5E20' : '#555' }}>{m}</span>
                </div>
              );
            })}
          </div>

          {/* Délai */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>
              {estProprietaire ? 'Délai accordé au locataire *' : 'Délai de préavis *'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['1', '1 mois'], ['2', '2 mois'], ['3', '3 mois']].map(function(opt) {
                return (
                  <button key={opt[0]} onClick={function() { setDelai(opt[0]); }}
                    style={{ padding: 10, borderRadius: 10, border: delai === opt[0] ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: delai === opt[0] ? '#E8F5E9' : '#FAFAFA', color: delai === opt[0] ? '#1B5E20' : '#555', fontSize: 13, fontWeight: delai === opt[0] ? 700 : 400, cursor: 'pointer' }}>
                    {opt[1]}
                  </button>
                );
              })}
            </div>
            {delai && (
              <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#555' }}>📅 Date de sortie estimée</span>
                <span style={{ fontWeight: 700, color: '#1B6B3A' }}>{addDays(parseInt(delai) * 30)}</span>
              </div>
            )}
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>Message (optionnel)</div>
            <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
              placeholder={estProprietaire ? 'Message pour expliquer la situation au locataire...' : 'Message personnel pour votre propriétaire...'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 80, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <button
            onClick={function() {
              var ok = motif && delai && (!estProprietaire || bien);
              if (!ok) { toast.error('Sélectionnez ' + (estProprietaire && !bien ? 'un bien, ' : '') + (motif ? '' : 'un motif et ') + (!delai ? 'un délai' : '')); return; }
              setStep('confirm');
            }}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            📋 Préparer le préavis officiel →
          </button>
        </div>
      )}
    </div>
  );
}

// ================================================
// ONGLET : Alertes
// ================================================

function OngletAlertes() {
  var [data, setData] = useState({ alertes: [], signalements: [] });
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    api.get('/alertes')
      .then(function(res) { setData(res.data); })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, []);

  function traiter(id, statut) {
    api.patch('/alertes/' + id, { statut: statut })
      .then(function() {
        toast.success('Alerte mise a jour !');
        setData(function(prev) {
          return Object.assign({}, prev, { alertes: prev.alertes.filter(function(a) { return a.id !== id; }) });
        });
      }).catch(function() { toast.error('Erreur'); });
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</div>;

  var total = data.alertes.length + (data.signalements ? data.signalements.length : 0);

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="dash-page-header">
        <div><h1>Alertes</h1><p>{total} alerte(s) active(s)</p></div>
      </div>
      {total === 0 && (
        <div className="dash-empty-state">
          <span>✅</span><h3>Aucune alerte</h3><p>Tout est en ordre !</p>
        </div>
      )}
      {data.alertes.map(function(a) {
        var borderColor = a.type === 'loyer_retard' ? '#E53935' : a.type === 'bail_bientot' ? '#F5A623' : '#1565C0';
        var btnLabel = a.type === 'loyer_retard' ? 'Relancer' : a.type === 'bail_bientot' ? 'Renouveler' : 'Traiter';
        return (
          <div key={a.id} className="alerte-card-proto" style={{ borderLeft: '5px solid ' + borderColor }}>
            <div className="alerte-card-icon">
              {a.type === 'loyer_retard' ? '⚠️' : a.type === 'bail_bientot' ? '📋' : '🔔'}
            </div>
            <div className="alerte-card-body">
              <div className="alerte-card-title">{a.titre}</div>
              <div className="alerte-card-sub">{a.description}</div>
            </div>
            <button className="alerte-card-btn" onClick={function() { traiter(a.id, 'traitee'); }}>
              {btnLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Documents
// ================================================
function OngletDocuments(props) {
  var user = props.user;
  var [reservations, setReservations] = useState([]);
  var [documents, setDocuments] = useState([]);
  var [showForm, setShowForm] = useState(false);
  var [genForm, setGenForm] = useState({ reservation_id: '', type: 'contrat_bail' });
  var [showUpload, setShowUpload] = useState(false);
  var [uploadForm, setUploadForm] = useState({ titre: '', type: 'autre' });
  var [fichier, setFichier] = useState(null);

  useEffect(function() {
    api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); }).catch(console.error);
    var ep = user && user.role === 'locataire' ? '/reservations/mes-reservations' : '/reservations/proprietaire';
    api.get(ep).then(function(res) { setReservations((res.data.reservations || []).filter(function(r) { return r.statut === 'confirmee'; })); }).catch(console.error);
  }, [user]);

  function generer(e) {
    e.preventDefault();
    api.post('/documents/generer', genForm)
      .then(function() {
        toast.success('Document genere !');
        setShowForm(false);
        api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); });
      })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur'); });
  }

  function telecharger(doc) {
    api.get('/documents/' + doc.id + '/telecharger', { responseType: 'blob' })
      .then(function(res) {
        var url = window.URL.createObjectURL(new Blob([res.data]));
        var link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.titre.replace(/\s+/g, '_') + '.html');
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Telechargement lance !');
      }).catch(function() { toast.error('Erreur telechargement'); });
  }

  // Types selon le rôle
  var typesAffiches = user && user.role === 'locataire'
    ? DOCS_TYPES.filter(function(d) { return ['quittance', 'etat_lieux', 'preavis'].includes(d.type); })
    : DOCS_TYPES;

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>Documents</h1><p>{documents.length} document(s)</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline-green" onClick={function() { setShowUpload(!showUpload); setShowForm(false); }}>Ajouter</button>
          <button className="btn-green" onClick={function() { setShowForm(!showForm); setShowUpload(false); }}>Generer</button>
        </div>
      </div>

      <div className="docs-grid-proto">
        {typesAffiches.map(function(d, i) {
          return (
            <div key={i} className="doc-card-proto">
              <div className="doc-card-icon">{d.icon}</div>
              <div className="doc-card-title">{d.titre}</div>
              <div className="doc-card-desc">{d.desc}</div>
              <button
                className="doc-card-btn"
                style={{ background: d.color }}
                onClick={function() { setGenForm(Object.assign({}, genForm, { type: d.type })); setShowForm(true); setShowUpload(false); }}
              >Generer</button>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="dash-form-card" style={{ marginTop: 16 }}>
          <h3>Generer un document</h3>
          <form onSubmit={generer}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Type de document</label>
                <select value={genForm.type} onChange={function(e) { setGenForm(Object.assign({}, genForm, { type: e.target.value })); }}>
                  {typesAffiches.map(function(d) { return <option key={d.type} value={d.type}>{d.titre}</option>; })}
                </select>
              </div>
              <div className="form-group">
                <label>Reservation concernee *</label>
                <select value={genForm.reservation_id} onChange={function(e) { setGenForm(Object.assign({}, genForm, { reservation_id: e.target.value })); }} required>
                  <option value="">Selectionnez une reservation</option>
                  {reservations.map(function(r) {
                    return <option key={r.id} value={r.id}>{r.logement_titre} - {new Date(r.date_debut).toLocaleDateString('fr-FR')}</option>;
                  })}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green">Generer et envoyer</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {documents.length > 0 && (
        <div className="dash-white-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 14 }}>Historique des documents</h3>
          {documents.map(function(doc) {
            var icone = doc.type === 'facture' ? '🧾' : doc.type === 'quittance' ? '📋' : doc.type === 'contrat_bail' ? '📝' : doc.type === 'etat_lieux' ? '🏠' : doc.type === 'mise_en_demeure' ? '⚠️' : doc.type === 'preavis' ? '📤' : '📄';
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                <span style={{ fontSize: 24 }}>{icone}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{doc.titre}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <button className="btn-outline-green" onClick={function() { telecharger(doc); }}>Telecharger</button>
                <button className="btn-bien-secondary" style={{ padding: '6px 12px' }} onClick={function() {
                  api.post('/documents/' + doc.id + '/renvoyer-email')
                    .then(function() { toast.success('Email envoye !'); })
                    .catch(function() { toast.error('Erreur'); });
                }}>Email</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================================================
// ONGLET : Messagerie avec fichiers
// ================================================
function OngletMessages() {
  var auth = useAuth();
  var user = auth.user;
  var [conversations, setConversations] = useState([]);
  var [convActive, setConvActive] = useState(null);
  var [messages, setMessages] = useState([]);
  var [message, setMessage] = useState('');
  var [loading, setLoading] = useState(true);
  var [fichier, setFichier] = useState(null);

  useEffect(function() {
    api.get('/messages/conversations')
      .then(function(res) { setConversations(res.data.conversations || []); })
      .catch(function() {
        // Fallback si le backend n'a pas encore les routes messages
        setConversations([]);
      })
      .finally(function() { setLoading(false); });
  }, []);

  function chargerMessages(interlocuteurId) {
    setConvActive(interlocuteurId);
    setMessages([]);
    api.get('/messages/' + interlocuteurId)
      .then(function(res) { setMessages(res.data.messages || []); })
      .catch(console.error);
  }

  function envoyerMessage() {
    if (!message.trim() && !fichier) return;
    if (!convActive) return;

    var formData = new FormData();
    formData.append('destinataire_id', convActive);
    if (message.trim()) formData.append('contenu', message);
    if (fichier) formData.append('fichier', fichier);

    api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function(res) {
        setMessages(function(prev) { return prev.concat(res.data.data); });
        setMessage('');
        setFichier(null);
        toast.success('Message envoye !');
      })
      .catch(function() { toast.error('Erreur envoi'); });
  }

  var convCourante = conversations.find(function(c) { return c.interlocuteur_id === convActive; });

  if (loading) {
    return (
      <div>
        <div className="dash-page-header"><div><h1>Messages</h1></div></div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Chargement...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div>
        <div className="dash-page-header"><div><h1>Messages</h1><p>Partagez textes, photos et documents</p></div></div>
        <div className="dash-empty-state">
          <span>💬</span>
          <h3>Aucune conversation</h3>
          <p>{user && user.role === 'locataire' ? 'Reservez un logement pour contacter le proprietaire' : 'Les messages de vos locataires apparaitront ici'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-page-header"><div><h1>Messages</h1><p>Partagez textes, photos et documents</p></div></div>
      <div className="messages-container">
        <div className="messages-list">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 13, color: '#1B2B22' }}>
            Conversations ({conversations.length})
          </div>
          {conversations.map(function(c) {
            var initiales = ((c.prenom || '').charAt(0) + (c.nom || '').charAt(0)).toUpperCase();
            var nonLus = parseInt(c.non_lus) || 0;
            return (
              <div key={c.interlocuteur_id}
                className={'message-thread-item ' + (convActive === c.interlocuteur_id ? 'active' : '')}
                onClick={function() { chargerMessages(c.interlocuteur_id); }}>
                <div className="msg-avatar">{initiales}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="msg-thread-name">{c.prenom} {c.nom}</div>
                    {nonLus > 0 && (
                      <span style={{ background: '#E53935', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>{nonLus}</span>
                    )}
                  </div>
                  <div className="msg-thread-preview">
                    {c.type === 'photo' ? '📷 Photo' : c.type === 'document' ? '📎 Document' : (c.contenu || 'Nouvelle conversation')}
                  </div>
                  {c.logement_titre && <div style={{ fontSize: '11px', color: '#1B6B3A' }}>{c.logement_titre}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="messages-chat">
          {!convActive && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '14px' }}>
              Selectionnez une conversation
            </div>
          )}
          {convActive && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="messages-chat-header">
                {convCourante && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="msg-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {((convCourante.prenom || '').charAt(0) + (convCourante.nom || '').charAt(0)).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{convCourante.prenom} {convCourante.nom}</div>
                      {convCourante.logement_titre && <div style={{ fontSize: 11, color: '#888' }}>{convCourante.logement_titre}</div>}
                    </div>
                    {convCourante.telephone && (
                      <a href={'tel:' + convCourante.telephone}
                        style={{ marginLeft: 'auto', background: '#E8F5E9', color: '#1B6B3A', borderRadius: '20px', padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        Appeler
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="messages-chat-body">
                {messages.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, padding: '40px 20px' }}>Demarrez la conversation...</div>}
                {messages.map(function(m) {
                  var estMoi = m.expedition_id === (user && user.id);
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: estMoi ? 'flex-end' : 'flex-start' }}>
                      <div className={'msg-bubble ' + (estMoi ? 'msg-bubble-sent' : 'msg-bubble-received')}>
                        {m.type === 'photo' && m.fichier_url && (
                          <img src={m.fichier_url} alt="photo" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer', marginBottom: m.contenu ? '8px' : '0' }} onClick={function() { window.open(m.fichier_url, '_blank'); }} />
                        )}
                        {m.type === 'document' && m.fichier_url && (
                          <a href={m.fichier_url} target="_blank" rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: estMoi ? '#fff' : '#1B6B3A', textDecoration: 'none', padding: '8px', background: estMoi ? 'rgba(255,255,255,0.15)' : '#f0f0f0', borderRadius: '8px', fontSize: '13px' }}>
                            <span>📎</span><span>{m.fichier_nom || 'Document'}</span>
                          </a>
                        )}
                        {m.contenu && <div>{m.contenu}</div>}
                        <div style={{ fontSize: '10px', marginTop: '4px', opacity: '0.7', textAlign: 'right' }}>
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {fichier && (
                <div style={{ padding: '8px 16px', background: '#E8F5E9', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '13px', color: '#1B5E20' }}>{fichier.type.startsWith('image/') ? '📷' : '📎'} {fichier.name}</span>
                  <button type="button" onClick={function() { setFichier(null); }} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontWeight: '700' }}>x</button>
                </div>
              )}

              <div className="messages-chat-input">
                <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={function(e) { if (e.target.files && e.target.files[0]) setFichier(e.target.files[0]); }} />
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F0F4F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer' }}>📎</div>
                </label>
                <input type="text" placeholder="Ecrire un message..." value={message}
                  onChange={function(e) { setMessage(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }} />
                <button className="btn-send" onClick={envoyerMessage} type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================
// ONGLET : Reclamations avec timeline
// ================================================
function OngletReclamations() {
  var auth = useAuth();
  var user = auth.user;
  var [reclamations, setReclamations] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showForm, setShowForm] = useState(false);
  var [activeTimeline, setActiveTimeline] = useState(null);
  var [timeline, setTimeline] = useState([]);
  var [form, setForm] = useState({ titre: '', description: '', categorie: 'autre', priorite: 'normale', logement_id: '' });
  var [photo, setPhoto] = useState(null);
  var [commentaire, setCommentaire] = useState('');
  var [logements, setLogements] = useState([]);

  useEffect(function() {
    charger();
    if (user && user.role === 'locataire') {
      api.get('/reservations/mes-reservations')
        .then(function(res) {
          var logs = (res.data.reservations || [])
            .filter(function(r) { return r.statut === 'confirmee'; })
            .map(function(r) { return { id: r.logement_id, titre: r.logement_titre }; });
          setLogements(logs);
        })
        .catch(console.error);
    }
  }, [user]);

  function charger() {
    setLoading(true);
    api.get('/reclamations')
      .then(function(res) { setReclamations(res.data.reclamations || []); })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }

  function voirTimeline(id) {
    setActiveTimeline(id);
    api.get('/reclamations/' + id + '/timeline')
      .then(function(res) { setTimeline(res.data.timeline || []); })
      .catch(console.error);
  }

  function soumettre(e) {
    e.preventDefault();
    var fd = new FormData();
    fd.append('titre', form.titre);
    fd.append('description', form.description);
    fd.append('categorie', form.categorie);
    fd.append('priorite', form.priorite);
    fd.append('logement_id', form.logement_id);
    if (photo) fd.append('photo', photo);
    api.post('/reclamations', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function() { toast.success('Reclamation envoyee !'); setShowForm(false); setForm({ titre: '', description: '', categorie: 'autre', priorite: 'normale', logement_id: '' }); setPhoto(null); charger(); })
      .catch(function() { toast.error('Erreur'); });
  }

  function changerStatut(id, statut) {
    api.patch('/reclamations/' + id + '/statut', { statut: statut, commentaire: commentaire })
      .then(function() { toast.success('Statut mis a jour !'); setCommentaire(''); charger(); if (activeTimeline === id) voirTimeline(id); })
      .catch(function() { toast.error('Erreur'); });
  }

  var categorieLabels = {
    panne_eau: 'Panne eau', panne_electricite: 'Panne electricite',
    panne_equipement: 'Panne equipement', securite: 'Securite',
    nuisances: 'Nuisances', autre: 'Autre'
  };

  var statutColors = { ouverte: '#E53935', en_cours: '#F5A623', resolue: '#1B6B3A', fermee: '#888' };
  var statutLabels = { ouverte: 'Ouverte', en_cours: 'En cours', resolue: 'Resolue', fermee: 'Fermee' };

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>Reclamations</h1><p>{reclamations.length} reclamation(s)</p></div>
        {user && user.role === 'locataire' && (
          <button className="btn-green" onClick={function() { setShowForm(!showForm); }}>+ Signaler un probleme</button>
        )}
      </div>

      {showForm && user && user.role === 'locataire' && (
        <div className="dash-form-card">
          <h3>Signaler un probleme</h3>
          <form onSubmit={soumettre}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Logement *</label>
                <select value={form.logement_id} onChange={function(e) { setForm(Object.assign({}, form, { logement_id: e.target.value })); }} required>
                  <option value="">Selectionnez</option>
                  {logements.map(function(l) { return <option key={l.id} value={l.id}>{l.titre}</option>; })}
                </select>
              </div>
              <div className="form-group">
                <label>Categorie</label>
                <select value={form.categorie} onChange={function(e) { setForm(Object.assign({}, form, { categorie: e.target.value })); }}>
                  {Object.entries(categorieLabels).map(function(entry) { return <option key={entry[0]} value={entry[0]}>{entry[1]}</option>; })}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Titre du probleme *</label>
              <input type="text" value={form.titre} placeholder="Ex: Fuite d'eau dans la cuisine" onChange={function(e) { setForm(Object.assign({}, form, { titre: e.target.value })); }} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows="3" value={form.description} placeholder="Decrivez le probleme..."
                onChange={function(e) { setForm(Object.assign({}, form, { description: e.target.value })); }}
                style={{ padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', width: '100%' }} />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Priorite</label>
                <select value={form.priorite} onChange={function(e) { setForm(Object.assign({}, form, { priorite: e.target.value })); }}>
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute - Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Photo (optionnel)</label>
                <input type="file" accept="image/*" onChange={function(e) { if (e.target.files[0]) setPhoto(e.target.files[0]); }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green">Envoyer</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Chargement...</div>}

      {!loading && reclamations.length === 0 && (
        <div className="dash-empty-state">
          <span>✅</span><h3>Aucune reclamation</h3><p>Tout est en ordre !</p>
        </div>
      )}

      {reclamations.map(function(r) {
        var couleur = statutColors[r.statut] || '#888';
        return (
          <div key={r.id} style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '5px solid ' + couleur }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: '#1B2B22' }}>{r.titre}</span>
                  <span style={{ background: couleur + '20', color: couleur, borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>{statutLabels[r.statut]}</span>
                  <span style={{ background: '#f0f0f0', color: '#555', borderRadius: '20px', padding: '2px 10px', fontSize: '11px' }}>{categorieLabels[r.categorie]}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {r.logement_titre}
                  {user && user.role !== 'locataire' && r.loc_nom && <span> · {r.loc_prenom} {r.loc_nom}</span>}
                  <span> · {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {r.description && <div style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>{r.description}</div>}
                {r.photo_url && (
                  <img src={r.photo_url} alt="reclamation" style={{ maxHeight: '120px', borderRadius: '8px', cursor: 'pointer', marginTop: '8px' }} onClick={function() { window.open(r.photo_url, '_blank'); }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button className="btn-outline-green" onClick={function() { if (activeTimeline === r.id) { setActiveTimeline(null); } else { voirTimeline(r.id); } }}>
                  {activeTimeline === r.id ? 'Fermer' : 'Timeline'}
                </button>
                {user && user.role !== 'locataire' && r.statut !== 'resolue' && r.statut !== 'fermee' && (
                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                    {r.statut === 'ouverte' && (
                      <button className="btn-green" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={function() { changerStatut(r.id, 'en_cours'); }}>En cours</button>
                    )}
                    <button className="btn-green" style={{ fontSize: '12px', padding: '6px 12px', background: '#1565C0' }} onClick={function() { changerStatut(r.id, 'resolue'); }}>Resolue</button>
                  </div>
                )}
              </div>
            </div>

            {activeTimeline === r.id && (
              <div style={{ marginTop: '14px', borderTop: '1px solid #f0f0f0', paddingTop: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B2B22', marginBottom: '10px' }}>Timeline</div>
                {timeline.map(function(t) {
                  return (
                    <div key={t.id} style={{ display: 'flex', gap: 10, marginBottom: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: t.type === 'creation' ? '#E8F5E9' : t.type === 'statut_change' ? '#FFF3E0' : '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                        {t.type === 'creation' ? '🔧' : t.type === 'statut_change' ? '🔄' : '💬'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', color: '#333' }}>{t.contenu}</div>
                        {t.photo_url && <img src={t.photo_url} alt="photo" style={{ maxHeight: '80px', borderRadius: '6px', marginTop: '4px', cursor: 'pointer' }} onClick={function() { window.open(t.photo_url, '_blank'); }} />}
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{t.prenom} {t.nom} · {new Date(t.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: '10px', display: 'flex', gap: 8 }}>
                  <input type="text" placeholder="Ajouter un commentaire..." value={commentaire}
                    onChange={function(e) { setCommentaire(e.target.value); }}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', margin: 0 }} />
                  <button className="btn-green" style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={function() {
                      api.post('/reclamations/' + r.id + '/commentaire', { commentaire: commentaire })
                        .then(function() { toast.success('Commentaire ajoute !'); setCommentaire(''); voirTimeline(r.id); })
                        .catch(function() { toast.error('Erreur'); });
                    }}>Envoyer</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Parametres
// ================================================
function OngletParametres(props) {
  var user = props.user;
  var auth = useAuth();
  var navigate = useNavigate();
  var [section, setSection] = useState(null);
  var [formProfil, setFormProfil] = useState({ prenom: user ? user.prenom : '', nom: user ? user.nom : '', email: user ? user.email : '', telephone: user ? user.telephone || '' : '' });
  var [formMdp, setFormMdp] = useState({ ancien: '', nouveau: '', confirmer: '' });
  var [notifs, setNotifs] = useState({ email: true, sms: true, loyers: true, bails: true, pannes: false });
  var [langue, setLangue] = useState('fr');
  var [saving, setSaving] = useState(false);

  function saveProfil(e) {
    e.preventDefault();
    setSaving(true);
    api.put('/auth/profil', formProfil)
      .then(function() { toast.success('Profil mis a jour !'); setSection(null); })
      .catch(function() { toast.error('Erreur mise a jour'); })
      .finally(function() { setSaving(false); });
  }

  function saveMdp(e) {
    e.preventDefault();
    if (formMdp.nouveau !== formMdp.confirmer) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (formMdp.nouveau.length < 6) { toast.error('Minimum 6 caracteres'); return; }
    setSaving(true);
    api.put('/auth/changer-mot-de-passe', { ancien_mot_de_passe: formMdp.ancien, nouveau_mot_de_passe: formMdp.nouveau })
      .then(function() { toast.success('Mot de passe change !'); setFormMdp({ ancien: '', nouveau: '', confirmer: '' }); setSection(null); })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur'); })
      .finally(function() { setSaving(false); });
  }

  var menuItems = [
    { id: 'profil', icon: '👤', titre: 'Mon profil', desc: 'Modifier mes informations personnelles' },
    { id: 'mdp', icon: '🔐', titre: 'Mot de passe', desc: 'Changer mon mot de passe' },
    { id: 'notifs', icon: '🔔', titre: 'Notifications', desc: 'Gerer mes preferences de notifications' },
    { id: 'langue', icon: '🌐', titre: 'Langue', desc: 'Francais (Guinee)' }
  ];

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>Parametres</h1></div>
        {section && <button className="btn-outline-green" onClick={function() { setSection(null); }}>Retour</button>}
      </div>

      {!section && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
          <BadgeScore userId={user && user.id} />
          {menuItems.map(function(item) {
            return (
              <div key={item.id} onClick={function() { setSection(item.id); }}
                style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateX(0)'; }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1B2B22' }}>{item.titre}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
              </div>
            );
          })}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 600 }}>Informations du compte</div>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Email : {user && user.email}</div>
            <div style={{ fontSize: 14, color: '#333' }}>Role : {user && user.role}</div>
          </div>
      {user && user.role === 'admin' && (
        <button
          onClick={function() { window.location.href = '/admin'; }}
          style={{ background: '#1B2B22', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ⚙️ Panneau administrateur
        </button>
      )}
          <button onClick={function() { auth.logout(); }}
            style={{ background: '#FFEBEE', color: '#B71C1C', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Se deconnecter
          </button>
        </div>
      )}

      {section === 'profil' && (
        <div className="dash-form-card" style={{ maxWidth: 560 }}>
          <h3>Modifier mon profil</h3>
          <form onSubmit={saveProfil}>
            <div className="form-row-2">
              <div className="form-group"><label>Prenom</label><input type="text" value={formProfil.prenom} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { prenom: e.target.value })); }} required /></div>
              <div className="form-group"><label>Nom</label><input type="text" value={formProfil.nom} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { nom: e.target.value })); }} required /></div>
            </div>
            <div className="form-group"><label>Email</label><input type="email" value={formProfil.email} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { email: e.target.value })); }} required /></div>
            <div className="form-group"><label>Telephone</label><input type="tel" placeholder="+224 622 00 00 00" value={formProfil.telephone} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { telephone: e.target.value })); }} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green" disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setSection(null); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {section === 'mdp' && (
        <div className="dash-form-card" style={{ maxWidth: 480 }}>
          <h3>Changer le mot de passe</h3>
          <form onSubmit={saveMdp}>
            <div className="form-group"><label>Mot de passe actuel</label><input type="password" value={formMdp.ancien} onChange={function(e) { setFormMdp(Object.assign({}, formMdp, { ancien: e.target.value })); }} required /></div>
            <div className="form-group"><label>Nouveau mot de passe</label><input type="password" placeholder="Minimum 6 caracteres" value={formMdp.nouveau} onChange={function(e) { setFormMdp(Object.assign({}, formMdp, { nouveau: e.target.value })); }} required /></div>
            <div className="form-group"><label>Confirmer</label><input type="password" value={formMdp.confirmer} onChange={function(e) { setFormMdp(Object.assign({}, formMdp, { confirmer: e.target.value })); }} required /></div>
            {formMdp.nouveau && formMdp.confirmer && formMdp.nouveau !== formMdp.confirmer && (
              <div style={{ fontSize: 12, color: '#B71C1C', marginBottom: 10 }}>Les mots de passe ne correspondent pas</div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green" disabled={saving}>{saving ? 'Changement...' : 'Changer'}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setSection(null); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {section === 'notifs' && (
        <div className="dash-form-card" style={{ maxWidth: 480 }}>
          <h3>Preferences de notifications</h3>
          {[
            { key: 'email', label: 'Notifications par email' },
            { key: 'sms', label: 'Notifications par SMS' },
            { key: 'loyers', label: 'Alertes loyers en retard' },
            { key: 'bails', label: 'Alertes baux expirants' },
            { key: 'pannes', label: 'Signalements de pannes' }
          ].map(function(n) {
            return (
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{n.label}</div>
                <div onClick={function() { setNotifs(function(prev) { var next = Object.assign({}, prev); next[n.key] = !next[n.key]; return next; }); }}
                  style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: notifs[n.key] ? '#1B6B3A' : '#e0e0e0', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notifs[n.key] ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-green" onClick={function() { toast.success('Preferences sauvegardees !'); setSection(null); }}>Sauvegarder</button>
            <button className="btn-outline-green" onClick={function() { setSection(null); }}>Annuler</button>
          </div>
        </div>
      )}

      {section === 'langue' && (
        <div className="dash-form-card" style={{ maxWidth: 480 }}>
          <h3>Langue de l'interface</h3>
          {[{ code: 'fr', label: 'Francais (Guinee)', flag: '🇬🇳' }, { code: 'fr-fr', label: 'Francais (France)', flag: '🇫🇷' }, { code: 'en', label: 'English', flag: '🇬🇧' }].map(function(l) {
            return (
              <div key={l.code} onClick={function() { setLangue(l.code); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', border: langue === l.code ? '2px solid #1B6B3A' : '1px solid #e0e0e0', background: langue === l.code ? '#E8F5E9' : '#fff', marginBottom: 8, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 24 }}>{l.flag}</span>
                <span style={{ fontSize: 14, fontWeight: langue === l.code ? 600 : 400 }}>{l.label}</span>
                {langue === l.code && <span style={{ marginLeft: 'auto', color: '#1B6B3A', fontWeight: 700 }}>✓</span>}
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-green" onClick={function() { toast.success('Langue sauvegardee !'); setSection(null); }}>Sauvegarder</button>
            <button className="btn-outline-green" onClick={function() { setSection(null); }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================
// ONGLET : Mes locations (locataire)
// ================================================
function OngletMesLocations(props) {
  var stats    = props.stats;
  var setOnglet = props.setOnglet;
  var locationsActives = stats.reservations.filter(function(r) { return r.statut === 'confirmee'; });

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>Mes locations</h1><p>{locationsActives.length} location(s) active(s)</p></div>
        <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>
          Chercher un logement
        </Link>
      </div>

      {locationsActives.length === 0 && (
        <div className="dash-empty-state">
          <span>🏠</span>
          <h3>Aucune location active</h3>
          <p>Réservez un logement pour commencer</p>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Trouver un logement
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {locationsActives.map(function(r) {
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #1B6B3A' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: '#E8F5E9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏠</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>{r.logement_titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                    Depuis le {r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B6B3A', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.montant_total || r.prix_mensuel)} GNF
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}> / mois</span>
                  </div>
                </div>
                <div style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  Active
                </div>
              </div>

              {/* Boutons locataire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link to={'/reservation/' + r.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '0.5px solid #A5D6A7' }}>
                  📋 Détails
                </Link>
                <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E3F2FD', color: '#1565C0', fontSize: 13, fontWeight: 600, border: '0.5px solid #90CAF9', cursor: 'pointer' }}>
                  📄 Documents
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================================================
// COMPOSANT PRINCIPAL : Dashboard
// ================================================
export default function Dashboard() {
  var auth = useAuth();
  var user = auth.user;
  var navigate = useNavigate();

  var [onglet, setOnglet] = useState('/dashboard');
  var [sidebarOpen, setSidebarOpen] = useState(true);
  var [loading, setLoading] = useState(true);
  var [showNotif, setShowNotif] = useState(false);
  var [alertes, setAlertes] = useState([]);
  var [stats, setStats] = useState({ logements: [], reservations: [], paiements: [] });

  var premierChargement = useRef(true);
  // ================================================
  // Titres et icones des onglets
  // ================================================
  var pageTitle = {
    '/dashboard': 'Tableau de bord',
    '/dashboard/biens': 'Mes biens',
    '/dashboard/locataires': 'Locataires',
    '/dashboard/reservations': 'Reservations',
    '/dashboard/paiements': 'Paiements',
    '/dashboard/documents': 'Documents',
    '/dashboard/alertes': 'Alertes',
    '/dashboard/messages': 'Messages',
    '/dashboard/reclamations': 'Reclamations',
    '/dashboard/preavis': 'Preavis de depart',
    '/dashboard/parametres': 'Parametres',
    '/dashboard/mes-locations': 'Mes locations'
  };

  var pageIcon = {
    '/dashboard': '📊',
    '/dashboard/biens': '🏠',
    '/dashboard/locataires': '👥',
    '/dashboard/reservations': '📅',
    '/dashboard/paiements': '💳',
    '/dashboard/documents': '📄',
    '/dashboard/alertes': '🔔',
    '/dashboard/messages': '💬',
    '/dashboard/reclamations': '🔧',
    '/dashboard/preavis': '📤',
    '/dashboard/parametres': '⚙️',
    '/dashboard/mes-locations': '🏠'
  };

  useEffect(function() {
  // Lire l'onglet sauvegardé depuis ReservationLocataire
  var savedOnglet = localStorage.getItem('dashboardOnglet');
  if (savedOnglet) {
    setOnglet(savedOnglet);
    localStorage.removeItem('dashboardOnglet');
  }
  chargerDonnees();
}, []);

  function chargerDonnees() {
    // Affiche le chargement SEULEMENT la première fois
    if (premierChargement.current) {
      setLoading(true);
  }
    var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');
    var req;
    if (estProprietaire) {
      req = Promise.all([
        api.get('/logements/proprietaire/mes-logements'),
        api.get('/reservations/proprietaire'),
        api.get('/paiements/proprietaire'),
        api.get('/alertes')
      ]).then(function(results) {
        setStats({
          logements: results[0].data.logements || [],
          reservations: results[1].data.reservations || [],
          paiements: results[2].data.paiements || []
        });
        setAlertes(results[3].data.alertes || []);
      });
    } else {
      req = Promise.all([
        api.get('/reservations/mes-reservations'),
        api.get('/paiements/mes-paiements'),
        api.get('/alertes/mes-alertes').catch(function() { return { data: { alertes: [] } }; })
      ]).then(function(results) {
        setStats({
          logements:    [],
          reservations: results[0].data.reservations || [],
          paiements:    results[1].data.paiements    || []
        });
        setAlertes(results[2].data.alertes || []);
      });
    }
    req.catch(console.error).finally(function() { 
      setLoading(false);
      premierChargement.current = false;
     });
  }

  function traiterReservation(id, statut) {
    api.patch('/reservations/' + id + '/traiter', { statut: statut })
      .then(function() { toast.success(statut === 'confirmee' ? 'Reservation confirmee !' : 'Reservation annulee'); chargerDonnees(); })
      .catch(function() { toast.error('Erreur'); });
  }

  // ================================================
  // Rendu de l'onglet actif
  // ================================================
  function renderOnglet() {
    if (onglet === '/dashboard') return <OngletOverview stats={stats} user={user} alertes={alertes} />;
    if (onglet === '/dashboard/biens') return <OngletBiens stats={stats} recharger={chargerDonnees} user={user} setOnglet={setOnglet} />;
    if (onglet === '/dashboard/locataires') return <OngletLocataires stats={stats} logements={stats.logements} />;
    if (onglet === '/dashboard/reservations') return <OngletReservations stats={stats} traiter={traiterReservation} user={user} navigate={navigate} recharger={chargerDonnees} />;
    if (onglet === '/dashboard/paiements') return <OngletPaiementsComponent />;
    if (onglet === '/dashboard/preavis') return <OngletPreavis user={user} setOnglet={setOnglet} />;
    if (onglet === '/dashboard/documents') return <OngletDocuments user={user} />;
    if (onglet === '/dashboard/alertes') return <OngletAlertes />;
    if (onglet === '/dashboard/messages') return <OngletMessages />;
    if (onglet === '/dashboard/reclamations') return <OngletReclamations />;
    if (onglet === '/dashboard/parametres') return <OngletParametres user={user} />;
    if (onglet === '/dashboard/mes-locations') return <OngletMesLocations stats={stats} setOnglet={setOnglet} />;
    return <OngletOverview stats={stats} user={user} alertes={alertes} />;
  }

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dash-loading">Chargement de votre espace...</div>
      </div>
    );
  }

  var sidebarWidth = sidebarOpen ? 240 : 70;

  return (
    <div className="dashboard-wrapper">
      <Sidebar ongletActif={onglet} setOnglet={setOnglet} open={sidebarOpen} />

      <div className="dashboard-main" style={{ marginLeft: sidebarWidth }}>
        <div className="dash-header">
          <div className="dash-header-left">
            <button className="dash-toggle-btn" onClick={function() { setSidebarOpen(!sidebarOpen); }} type="button">
              ☰
            </button>
            <div className="dash-header-title">
              <h1>{pageIcon[onglet] || '📊'} {pageTitle[onglet] || 'Tableau de bord'}</h1>
              <p>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="dash-header-right">
            <div className="dash-om-badge">Orange Money connecte</div>
            <button className="dash-notif-btn" type="button" onClick={function() { setShowNotif(!showNotif); }}>
              🔔
              {alertes.length > 0 && <div className="dash-notif-badge">{alertes.length}</div>}
            </button>
          </div>
        </div>

        {showNotif && (
          <div style={{ position: 'relative' }}>
            <NotifPanel alertes={alertes} onClose={function() { setShowNotif(false); }} />
          </div>
        )}

        <div className="dash-scroll">
          {renderOnglet()}
        </div>
      </div>
    </div>
  );
}