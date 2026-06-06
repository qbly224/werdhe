/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import toast from 'react-hot-toast';
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
  var stats = props.stats;
  var recharger = props.recharger;
  var [showConfirm, setShowConfirm] = useState(null);
  var [modeEdit, setModeEdit] = useState(null);
  var [formEdit, setFormEdit] = useState({});

  function handleDelete(id) {
    api.delete('/logements/' + id)
      .then(function() { toast.success('Bien supprime !'); setShowConfirm(null); recharger(); })
      .catch(function() { toast.error('Erreur suppression'); });
  }

  function handleEdit(l) {
    setModeEdit(l.id);
    setFormEdit({ titre: l.titre, adresse: l.adresse, ville: l.ville, prix_mensuel: l.prix_mensuel, statut: l.statut });
  }

  function handleSave(id) {
    api.put('/logements/' + id, formEdit)
      .then(function() { toast.success('Bien modifie !'); setModeEdit(null); recharger(); })
      .catch(function() { toast.error('Erreur modification'); });
  }

  return (
    <div>
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#B71C1C' }}>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer ce bien ? Cette action est irreversible.</p>
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
          <p>{stats.logements.length} biens enregistres</p>
        </div>
        <Link to="/logements/ajouter" className="btn-green" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          + Ajouter un bien
        </Link>
      </div>

      {stats.logements.length === 0 && (
        <div className="dash-empty-state">
          <span>🏠</span>
          <h3>Aucun bien enregistre</h3>
          <p>Publiez votre premier logement pour commencer</p>
          <Link to="/logements/ajouter" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>+ Ajouter un bien</Link>
        </div>
      )}

      <div className="biens-cards-grid">
        {stats.logements.map(function(b) {
          var borderColor = b.statut === 'loue' ? '#1B6B3A' : '#F5A623';
          return (
            <div key={b.id} className="bien-card-proto" style={{ borderTop: '4px solid ' + borderColor }}>
              {modeEdit === b.id ? (
                <div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Titre</label>
                      <input type="text" value={formEdit.titre} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { titre: e.target.value })); }} />
                    </div>
                    <div className="form-group">
                      <label>Prix (GNF)</label>
                      <input type="number" value={formEdit.prix_mensuel} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { prix_mensuel: e.target.value })); }} />
                    </div>
                    <div className="form-group">
                      <label>Adresse</label>
                      <input type="text" value={formEdit.adresse} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { adresse: e.target.value })); }} />
                    </div>
                    <div className="form-group">
                      <label>Statut</label>
                      <select value={formEdit.statut} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { statut: e.target.value })); }}>
                        <option value="disponible">Disponible</option>
                        <option value="loue">Loue</option>
                        <option value="suspendu">Suspendu</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-bien-primary" onClick={function() { handleSave(b.id); }}>Sauvegarder</button>
                    <button className="btn-bien-secondary" onClick={function() { setModeEdit(null); }}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bien-card-header">
                    <div className="bien-card-left">
                      <div className="bien-card-photo">🏠</div>
                      <div>
                        <div className="bien-card-title">{b.titre}</div>
                        <div className="bien-card-addr">{b.adresse}, {b.ville}</div>
                      </div>
                    </div>
                    <span className={b.statut === 'loue' ? 'badge-occupe' : 'badge-libre'}>
                      {b.statut === 'loue' ? 'Occupe' : 'Libre'}
                    </span>
                  </div>
                  <div className="bien-card-stats">
                    <div className="bien-stat-box">
                      <div className="bien-stat-label">Loyer mensuel</div>
                      <div className="bien-stat-val" style={{ color: '#1B6B3A' }}>{GNF(b.prix_mensuel)}</div>
                    </div>
                    <div className="bien-stat-box">
                      <div className="bien-stat-label">Categorie</div>
                      <div className="bien-stat-val" style={{ fontSize: 13 }}>{b.categorie || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="bien-card-btns">
                    <button className="btn-bien-primary" onClick={function() { handleEdit(b); }}>Modifier</button>
                    <button className="btn-bien-secondary" onClick={function() { setShowConfirm(b.id); }}>Supprimer</button>
                  </div>
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
  var traiter = props.traiter;
  var user = props.user;
  return (
    <div>
      <div className="dash-page-header">
        <div><h1>Reservations</h1><p>{stats.reservations.length} reservation(s)</p></div>
      </div>
      {stats.reservations.length === 0 && (
        <div className="dash-empty-state">
          <span>📅</span><h3>Aucune reservation</h3><p>Les demandes apparaitront ici</p>
        </div>
      )}
      {stats.reservations.map(function(r) {
        return (
          <div key={r.id} className="locataire-row" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="locataire-row-name">{r.logement_titre}</div>
              <div className="locataire-row-sub">
                Du {new Date(r.date_debut).toLocaleDateString('fr-FR')}
                {r.date_fin ? ' au ' + new Date(r.date_fin).toLocaleDateString('fr-FR') : ''}
                {r.type_location === 'longue_duree' ? ' (Longue duree)' : ''}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A', marginTop: 4 }}>{GNF(r.montant_total)}</div>
              {r.locataire_nom && <div style={{ fontSize: 12, color: '#888' }}>👤 {r.locataire_prenom} {r.locataire_nom}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span className={r.statut === 'confirmee' ? 'badge-paye' : r.statut === 'annulee' ? 'badge-retard' : 'badge-libre'}>
                {r.statut === 'en_attente' ? 'En attente' : r.statut === 'confirmee' ? 'Confirmee' : r.statut === 'annulee' ? 'Annulee' : 'Terminee'}
              </span>
              {user && user.role !== 'locataire' && r.statut === 'en_attente' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-bien-primary" style={{ padding: '7px 14px' }} onClick={function() { traiter(r.id, 'confirmee'); }}>Confirmer</button>
                  <button style={{ background: '#FFEBEE', color: '#B71C1C', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }} onClick={function() { traiter(r.id, 'annulee'); }}>Refuser</button>
                </div>
              )}
            </div>
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
  var [filterStatut, setFilterStatut] = useState('tous');
  var [modalBien, setModalBien] = useState(null);
  var [selectedMode, setSelectedMode] = useState('om');
  var [processing, setProcessing] = useState(false);
  var [done, setDone] = useState(false);

  var PAY_MODES = [
    { id: 'om', label: 'Orange Money', sub: 'Paiement instantane', color: '#FF6600', text: '#fff', abbr: 'OM' },
    { id: 'mtn', label: 'MTN MoMo', sub: 'Paiement instantane', color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
    { id: 'cash', label: 'Especes', sub: 'Recu PDF genere automatiquement', icon: '💵' },
    { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank · UBA', icon: '🏦' }
  ];

  function ouvrirModal(bien) {
    setModalBien(bien);
    setSelectedMode('om');
    setProcessing(false);
    setDone(false);
  }

  function fermerModal() {
    setModalBien(null);
    setDone(false);
  }

  function confirmerPaiement() {
    setProcessing(true);
    setTimeout(function() {
      setProcessing(false);
      setDone(true);
    }, 2000);
  }

  var paiesCompletes = stats.paiements.filter(function(p) { return p.statut === 'complete'; });
  var paiesAttente = stats.paiements.filter(function(p) { return p.statut === 'en_attente'; });
  var totalEncaisse = paiesCompletes.reduce(function(s, p) { return s + Number(p.montant); }, 0);
  var totalAttente = paiesAttente.reduce(function(s, p) { return s + Number(p.montant); }, 0);
  var totalAttendu = totalEncaisse + totalAttente;
  var tauxRecouvrement = totalAttendu > 0 ? Math.round(totalEncaisse / totalAttendu * 100) : 0;

  function exporter() {
    var lignes = ['Locataire,Bien,Montant,Date,Mode,Statut'];
    stats.paiements.forEach(function(p) {
      lignes.push([p.locataire_nom || '', p.logement_titre || '', p.montant, new Date(p.created_at).toLocaleDateString('fr-FR'), p.mode_paiement, p.statut].join(','));
    });
    var blob = new Blob([lignes.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'paiements_werdhe.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Export CSV lance !');
  }

  var paiementsFiltres = stats.paiements.filter(function(p) {
    if (filterStatut === 'tous') return true;
    if (filterStatut === 'paye') return p.statut === 'complete';
    if (filterStatut === 'retard') return p.statut === 'en_attente';
    return true;
  });

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>Paiements</h1>
          <p>{stats.paiements.length} paiement(s) ce mois</p>
        </div>
        <button className="btn-green-sm" onClick={exporter}>Exporter CSV</button>
      </div>

      <div className="stats-grid-3" style={{marginBottom:'16px'}}>
        <div className="stat-card-colored" style={{background:'#E8F5E9', borderLeft:'3px solid #1B6B3A'}}>
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-val" style={{color:'#1B6B3A', fontSize:'18px'}}>{GNF(totalEncaisse)}</div>
          <div className="stat-card-label">Encaisse ce mois</div>
          <div className="stat-card-sub">Taux : {tauxRecouvrement}%</div>
        </div>
        <div className="stat-card-colored" style={{background:'#FFEBEE', borderLeft:'3px solid #E53935'}}>
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-val" style={{color:'#C62828', fontSize:'18px'}}>{GNF(totalAttente)}</div>
          <div className="stat-card-label">Impayes</div>
          <div className="stat-card-sub">{paiesAttente.length} locataire(s)</div>
        </div>
        <div className="stat-card-colored" style={{background:'#F0F4F1', borderLeft:'3px solid #888'}}>
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-val" style={{color:'#333', fontSize:'18px'}}>{GNF(totalAttendu)}</div>
          <div className="stat-card-label">Total attendu</div>
          <div className="stat-card-sub">Total du mois</div>
        </div>
      </div>

      <div className="dash-white-card" style={{marginBottom:'16px'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
          <span style={{fontSize:'13px', fontWeight:'600'}}>Progression du recouvrement</span>
          <span style={{fontSize:'13px', fontWeight:'700', color:'#1B6B3A'}}>{tauxRecouvrement}%</span>
        </div>
        <div style={{background:'#F0F0F0', borderRadius:'6px', height:'10px', overflow:'hidden'}}>
          <div style={{
            background:'linear-gradient(90deg, #1B6B3A, #34A853)',
            width: tauxRecouvrement + '%',
            height:'100%', borderRadius:'6px',
            transition:'width 0.5s'
          }} />
        </div>
      </div>

      <div style={{display:'flex', gap:'8px', marginBottom:'16px', overflowX:'auto'}}>
        {[['tous','Tous','#1B6B3A'],['paye','Payes','#1B6B3A'],['retard','En retard','#C62828']].map(function(f) {
          return (
            <button
              key={f[0]}
              onClick={function() { setFilterStatut(f[0]); }}
              style={{
                padding:'7px 16px', borderRadius:'20px',
                border: filterStatut === f[0] ? '1.5px solid ' + f[2] : '0.5px solid #E0E0E0',
                background: filterStatut === f[0] ? f[2] : '#fff',
                color: filterStatut === f[0] ? '#fff' : '#666',
                fontSize:'12px', fontWeight: filterStatut === f[0] ? 700 : 400,
                cursor:'pointer', whiteSpace:'nowrap', flexShrink:0
              }}
            >
              {f[1]}
            </button>
          );
        })}
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px'}}>
        {paiementsFiltres.length === 0 && (
          <div className="dash-empty-state">
            <span>✅</span>
            <h3>Aucun paiement dans cette categorie</h3>
          </div>
        )}
        {paiementsFiltres.map(function(p, i) {
          var estRetard = p.statut !== 'complete';
          var borderColor = p.statut === 'complete' ? '#1B6B3A' : '#E53935';
          return (
            <div key={i} style={{
              background:'#fff', borderRadius:'14px', padding:'16px',
              boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
              borderLeft:'4px solid ' + borderColor
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <div style={{width:'40px', height:'40px', background:'#F0F4F1', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0}}>🏠</div>
                  <div>
                    <div style={{fontWeight:'700', fontSize:'14px', color:'#1B2B22'}}>{p.logement_titre}</div>
                    <div style={{fontSize:'12px', color:'#888'}}>
                      {p.locataire_prenom} {p.locataire_nom}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700',
                  background: p.statut === 'complete' ? '#E8F5E9' : '#FFEBEE',
                  color: p.statut === 'complete' ? '#1B5E20' : '#B71C1C',
                  border: '0.5px solid ' + (p.statut === 'complete' ? '#A5D6A7' : '#FFCDD2'),
                  whiteSpace:'nowrap'
                }}>
                  {p.statut === 'complete' ? 'Paye' : 'En retard'}
                </span>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
                <div style={{background:'#F8F8F8', borderRadius:'8px', padding:'8px 10px'}}>
                  <div style={{fontSize:'10px', color:'#888'}}>Montant</div>
                  <div style={{fontSize:'14px', fontWeight:'700', color:'#1B6B3A'}}>{GNF(p.montant)}</div>
                </div>
                <div style={{background:'#F8F8F8', borderRadius:'8px', padding:'8px 10px'}}>
                  <div style={{fontSize:'10px', color:'#888'}}>Date</div>
                  <div style={{fontSize:'13px', fontWeight:'600', color:'#333'}}>
                    {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}
                  </div>
                </div>
              </div>

              {p.statut === 'complete' ? (
                <div style={{display:'flex', gap:'8px'}}>
                  <button style={{flex:1, background:'#F0F4F1', color:'#1B6B3A', border:'0.5px solid #A5D6A7', borderRadius:'10px', padding:'9px', fontSize:'12px', cursor:'pointer', fontWeight:'600'}}>
                    Voir la quittance
                  </button>
                  <button style={{flex:1, background:'#F5F5F5', color:'#555', border:'0.5px solid #E0E0E0', borderRadius:'10px', padding:'9px', fontSize:'12px', cursor:'pointer'}}>
                    Contacter
                  </button>
                </div>
              ) : (
                <div style={{display:'flex', gap:'8px'}}>
                  <button
                    onClick={function() { ouvrirModal(p); }}
                    style={{flex:2, background:'#1B6B3A', color:'#fff', border:'none', borderRadius:'10px', padding:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>
                    Enregistrer le paiement
                  </button>
                  <button style={{flex:1, background:'#FFEBEE', color:'#B71C1C', border:'0.5px solid #FFCDD2', borderRadius:'10px', padding:'10px', fontSize:'12px', cursor:'pointer', fontWeight:'600'}}>
                    Relancer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalBien && (
        <div
          style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', zIndex:1000}}
          onClick={function(e) { if (e.target === e.currentTarget) fermerModal(); }}
        >
          <div style={{background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 32px', width:'100%', maxWidth:'600px', margin:'0 auto', maxHeight:'90vh', overflowY:'auto'}}>

            {!done ? (
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                  <div>
                    <div style={{fontSize:'16px', fontWeight:'700', color:'#1B2B22'}}>Enregistrer un paiement</div>
                    <div style={{fontSize:'12px', color:'#888', marginTop:'2px'}}>
                      {modalBien.logement_titre} · {modalBien.locataire_prenom} {modalBien.locataire_nom}
                    </div>
                  </div>
                  <button onClick={fermerModal} style={{width:'32px', height:'32px', borderRadius:'50%', border:'none', background:'#F5F5F5', cursor:'pointer', fontSize:'16px'}} type="button">x</button>
                </div>

                <div style={{background:'#F0F4F1', borderRadius:'12px', padding:'14px', marginBottom:'18px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:'12px', color:'#555'}}>Montant du loyer</div>
                    <div style={{fontSize:'11px', color:'#888', marginTop:'2px'}}>En attente de paiement</div>
                  </div>
                  <div style={{fontSize:'22px', fontWeight:'700', color:'#1B6B3A'}}>{GNF(modalBien.montant)}</div>
                </div>

                <div style={{fontSize:'13px', fontWeight:'700', color:'#1B2B22', marginBottom:'12px'}}>Mode de paiement</div>
                {PAY_MODES.map(function(p) {
                  return (
                    <div
                      key={p.id}
                      onClick={function() { setSelectedMode(p.id); }}
                      style={{
                        display:'flex', alignItems:'center', gap:'12px',
                        padding:'12px 14px',
                        border: selectedMode === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0',
                        background: selectedMode === p.id ? '#E8F5E9' : '#fff',
                        borderRadius:'12px', marginBottom:'8px',
                        cursor:'pointer', transition:'all 0.2s'
                      }}
                    >
                      <div style={{
                        width:'40px', height:'40px',
                        background: p.color || '#E8F5E9',
                        borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: p.icon ? '20px' : '13px', fontWeight:'700',
                        color: p.text || '#1B6B3A', flexShrink:0
                      }}>
                        {p.icon || p.abbr}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'14px', fontWeight:'600', color:'#1B2B22'}}>{p.label}</div>
                        <div style={{fontSize:'11px', color:'#888'}}>{p.sub}</div>
                      </div>
                      <div style={{
                        width:'22px', height:'22px', borderRadius:'50%',
                        border: selectedMode === p.id ? 'none' : '1.5px solid #E0E0E0',
                        background: selectedMode === p.id ? '#1B6B3A' : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                      }}>
                        {selectedMode === p.id && <span style={{color:'#fff', fontSize:'12px'}}>✓</span>}
                      </div>
                    </div>
                  );
                })}

                {selectedMode === 'cash' && (
                  <div style={{background:'#FFF8E1', borderRadius:'10px', padding:'12px', marginBottom:'14px', display:'flex', gap:'8px'}}>
                    <span>ℹ️</span>
                    <span style={{fontSize:'12px', color:'#7B4F00', lineHeight:'1.5'}}>
                      Le locataire recoit une quittance PDF par SMS des que vous confirmez le paiement en especes.
                    </span>
                  </div>
                )}

                <button
                  onClick={confirmerPaiement}
                  disabled={processing}
                  type="button"
                  style={{
                    width:'100%', background: processing ? '#999' : '#1B6B3A',
                    color:'#fff', border:'none', borderRadius:'12px', padding:'14px',
                    fontSize:'15px', fontWeight:'700',
                    cursor: processing ? 'not-allowed' : 'pointer', marginTop:'6px'
                  }}
                >
                  {processing ? 'Traitement en cours...' : 'Confirmer le paiement — ' + GNF(modalBien.montant)}
                </button>
              </div>
            ) : (
              <div style={{textAlign:'center', padding:'20px 0'}}>
                <div style={{width:'70px', height:'70px', background:'#E8F5E9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'36px'}}>✅</div>
                <div style={{fontSize:'20px', fontWeight:'700', color:'#1B6B3A', marginBottom:'8px'}}>Paiement enregistre !</div>
                <div style={{fontSize:'13px', color:'#666', lineHeight:'1.6', marginBottom:'20px'}}>
                  Le loyer de <strong>{GNF(modalBien.montant)}</strong> a ete confirme.
                  Une quittance a ete generee et envoyee au locataire.
                </div>
                <div style={{background:'#F0F4F1', borderRadius:'12px', padding:'14px', marginBottom:'20px', textAlign:'left'}}>
                  <div style={{fontSize:'13px', fontWeight:'600', marginBottom:'8px'}}>Recapitulatif</div>
                  {[
                    ['Bien', modalBien.logement_titre],
                    ['Locataire', (modalBien.locataire_prenom || '') + ' ' + (modalBien.locataire_nom || '')],
                    ['Montant', GNF(modalBien.montant)],
                    ['Mode', PAY_MODES.find(function(p) { return p.id === selectedMode; }) ? PAY_MODES.find(function(p) { return p.id === selectedMode; }).label : ''],
                    ['Date', new Date().toLocaleDateString('fr-FR')],
                    ['Statut', 'Paye']
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#555', padding:'4px 0', borderBottom:'0.5px solid #F0F0F0'}}>
                        <span style={{fontWeight:'600'}}>{row[0]}</span>
                        <span>{row[1]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button style={{flex:1, background:'#F0F4F1', color:'#1B6B3A', border:'0.5px solid #A5D6A7', borderRadius:'10px', padding:'12px', fontSize:'13px', cursor:'pointer', fontWeight:'600'}} type="button">
                    Voir la quittance
                  </button>
                  <button onClick={fermerModal} type="button" style={{flex:1, background:'#1B6B3A', color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'13px', cursor:'pointer', fontWeight:'700'}}>
                    Retour a la liste
                  </button>
                </div>
              </div>
            )}
          </div>
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
  var stats = props.stats;
  return (
    <div>
      <div className="dash-page-header">
        <div><h1>Mes locations</h1></div>
        <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>Chercher un logement</Link>
      </div>
      {stats.reservations.filter(function(r) { return r.statut === 'confirmee'; }).length === 0 && (
        <div className="dash-empty-state">
          <span>🏠</span><h3>Aucune location active</h3>
          <p>Reservez un logement pour commencer</p>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>Trouver un logement</Link>
        </div>
      )}
      {stats.reservations.filter(function(r) { return r.statut === 'confirmee'; }).map(function(r) {
        return (
          <div key={r.id} className="locataire-row">
            <div className="locataire-row-left">
              <div className="locataire-avatar-proto" style={{ background: '#1565C0' }}>🏠</div>
              <div>
                <div className="locataire-row-name">{r.logement_titre}</div>
                <div className="locataire-row-sub">Depuis le {new Date(r.date_debut).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            <div className="locataire-row-right">
              <div>
                <div className="locataire-loyer">{GNF(r.montant_total)}</div>
                <div className="locataire-loyer-sub">Loyer mensuel</div>
              </div>
              <span className="badge-paye">Active</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OngletPreavis(props) {
  var user = props.user;
  var estProprietaire = user && user.role !== 'locataire';

  var MOTIFS_LOCATAIRE = [
    'Changement de ville ou de pays',
    'Achat d\'un bien immobilier',
    'Logement ne correspond plus a mes besoins',
    'Raisons professionnelles',
    'Raisons familiales',
    'Conditions du logement insatisfaisantes',
    'Autre raison'
  ];

  var MOTIFS_PROPRIO = [
    'Vente du bien immobilier',
    'Reprise du bien pour usage personnel',
    'Travaux de renovation importants',
    'Non-paiement repete des loyers',
    'Troubles de voisinage',
    'Fin de bail non renouvele',
    'Autre motif'
  ];

  var [reservations, setReservations] = useState([]);
  var [bienSelectionne, setBienSelectionne] = useState(null);
  var [motif, setMotif] = useState('');
  var [delai, setDelai] = useState('1');
  var [note, setNote] = useState('');
  var [step, setStep] = useState('form');
  var [loading, setLoading] = useState(true);

  function addDays(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  var dateFinEstimee = delai ? addDays(parseInt(delai) * 30) : '—';

  useEffect(function() {
    var ep = estProprietaire ? '/reservations/proprietaire' : '/reservations/mes-reservations';
    api.get(ep)
      .then(function(res) {
        var resaConfirmees = (res.data.reservations || []).filter(function(r) { return r.statut === 'confirmee'; });
        setReservations(resaConfirmees);
        if (resaConfirmees.length > 0) setBienSelectionne(resaConfirmees[0]);
      })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, [estProprietaire]);

  function envoyerPreavis() {
    if (!motif || !delai || !bienSelectionne) {
      toast.error('Completez tous les champs requis');
      return;
    }
    api.post('/documents/generer', {
      reservation_id: bienSelectionne.id,
      type: 'preavis'
    })
      .then(function() {
        toast.success('Preavis genere et envoye !');
        setStep('sent');
      })
      .catch(function() {
        toast.error('Erreur envoi preavis');
      });
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px', color:'#888'}}>Chargement...</div>;

  if (reservations.length === 0) {
    return (
      <div>
        <div className="dash-page-header">
          <div><h1>Preavis de depart</h1></div>
        </div>
        <div className="dash-empty-state">
          <span>📤</span>
          <h3>Aucune location active</h3>
          <p>Vous devez avoir une reservation confirmee pour envoyer un preavis</p>
        </div>
      </div>
    );
  }

  if (step === 'sent') {
    return (
      <div>
        <div className="dash-page-header">
          <div><h1>Preavis de depart</h1></div>
        </div>
        <div className="dash-white-card" style={{textAlign:'center', padding:'32px'}}>
          <div style={{fontSize:'44px', marginBottom:'14px'}}>📨</div>
          <div style={{fontSize:'17px', fontWeight:'700', color:'#1B2B22', marginBottom:'8px'}}>
            Preavis envoye avec succes !
          </div>
          <div style={{fontSize:'13px', color:'#666', lineHeight:'1.6', marginBottom:'20px'}}>
            Votre preavis a ete transmis par notification et SMS.
            La partie adverse a <strong>48h</strong> pour accuser reception.
          </div>
          <div style={{background:'#FFF8E1', borderRadius:'12px', padding:'14px', marginBottom:'20px', textAlign:'left'}}>
            <div style={{fontSize:'13px', fontWeight:'700', color:'#7B4F00', marginBottom:'10px'}}>Recapitulatif</div>
            {[
              ['Bien concerne', bienSelectionne ? bienSelectionne.logement_titre : ''],
              ['Motif', motif],
              ['Delai de preavis', delai + ' mois'],
              ['Date de depart prevue', dateFinEstimee],
              ['Statut', 'En attente d\'accuse de reception']
            ].map(function(row) {
              return (
                <div key={row[0]} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'5px 0', borderBottom:'0.5px solid #FFE082', flexWrap:'wrap', gap:'4px'}}>
                  <span style={{color:'#888'}}>{row[0]}</span>
                  <span style={{fontWeight:'600', color:'#7B4F00', textAlign:'right', maxWidth:'60%'}}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{background:'#E8F5E9', borderRadius:'10px', padding:'12px', marginBottom:'16px', textAlign:'left'}}>
            <div style={{fontSize:'12px', color:'#1B5E20', lineHeight:'1.6'}}>
              Continuez a payer votre loyer normalement jusqu'a votre date de depart officielle.
            </div>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button
              onClick={function() { setStep('form'); setMotif(''); setNote(''); }}
              style={{flex:1, background:'#F0F4F1', color:'#1B6B3A', border:'none', borderRadius:'10px', padding:'11px', fontSize:'13px', cursor:'pointer'}}
              type="button"
            >
              Nouveau preavis
            </button>
            <button
              style={{flex:1, background:'#1B6B3A', color:'#fff', border:'none', borderRadius:'10px', padding:'11px', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}
              type="button"
            >
              Telecharger PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div>
        <div className="dash-page-header">
          <div><h1>Confirmer le preavis</h1></div>
          <button className="btn-outline-green" onClick={function() { setStep('form'); }} type="button">Modifier</button>
        </div>
        <div className="dash-white-card">
          <div style={{background:'#FFEBEE', borderRadius:'10px', padding:'14px', marginBottom:'16px'}}>
            <div style={{fontSize:'13px', color:'#B71C1C', fontWeight:'600', marginBottom:'4px'}}>
              Attention — action officielle et irreversible
            </div>
            <div style={{fontSize:'12px', color:'#C62828', lineHeight:'1.6'}}>
              Une fois envoye, votre preavis est officiel et notifie immediatement l'autre partie.
            </div>
          </div>

          <div style={{background:'#F8F8F8', borderRadius:'10px', padding:'14px', marginBottom:'16px'}}>
            {[
              ['Bien', bienSelectionne ? bienSelectionne.logement_titre : ''],
              ['Motif', motif],
              ['Delai de preavis', delai + ' mois'],
              ['Date de depart estimee', dateFinEstimee],
              ['Note', note || 'Aucune note']
            ].map(function(row) {
              return (
                <div key={row[0]} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'6px 0', borderBottom:'0.5px solid #EFEFEF', flexWrap:'wrap', gap:'4px'}}>
                  <span style={{color:'#888'}}>{row[0]}</span>
                  <span style={{fontWeight:'600', color:'#333', textAlign:'right', maxWidth:'60%'}}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          <div style={{display:'flex', gap:'10px'}}>
            <button
              onClick={function() { setStep('form'); }}
              style={{flex:1, background:'#F0F0F0', color:'#555', border:'none', borderRadius:'10px', padding:'12px', fontSize:'13px', cursor:'pointer'}}
              type="button"
            >
              Modifier
            </button>
            <button
              onClick={envoyerPreavis}
              style={{flex:2, background:'#C62828', color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}
              type="button"
            >
              Confirmer l'envoi du preavis
            </button>
          </div>
        </div>
      </div>
    );
  }

  var motifs = estProprietaire ? MOTIFS_PROPRIO : MOTIFS_LOCATAIRE;

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>Preavis de depart</h1>
          <p>{estProprietaire ? 'Notifiez officiellement votre locataire' : 'Notifiez votre proprietaire'}</p>
        </div>
      </div>

      <div style={{background:'#FFF8E1', borderRadius:'12px', padding:'12px 14px', marginBottom:'16px', display:'flex', gap:'8px'}}>
        <span style={{fontSize:'16px', flexShrink:0}}>⚖️</span>
        <span style={{fontSize:'12px', color:'#7B4F00', lineHeight:'1.6'}}>
          En Guinee, le delai de preavis legal standard est generalement d'<strong>1 mois</strong> pour un logement meuble
          et <strong>3 mois</strong> pour un logement non meuble. Verifiez les conditions de votre bail.
        </span>
      </div>

      <div className="dash-form-card">
        <h3>Informations du preavis</h3>

        {reservations.length > 1 && (
          <div className="form-group">
            <label>Bien concerne *</label>
            <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
              {reservations.map(function(r) {
                return (
                  <div
                    key={r.id}
                    onClick={function() { setBienSelectionne(r); }}
                    style={{
                      display:'flex', alignItems:'center', gap:'10px', padding:'11px 12px',
                      border: bienSelectionne && bienSelectionne.id === r.id ? '2px solid #C62828' : '0.5px solid #E0E0E0',
                      background: bienSelectionne && bienSelectionne.id === r.id ? '#FFEBEE' : '#FAFAFA',
                      borderRadius:'10px', cursor:'pointer'
                    }}
                  >
                    <span style={{fontSize:'20px'}}>🏠</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px', fontWeight:'600', color:'#1B2B22'}}>{r.logement_titre}</div>
                      <div style={{fontSize:'11px', color:'#888'}}>
                        {estProprietaire ? (r.locataire_prenom + ' ' + r.locataire_nom) : r.logement_ville}
                      </div>
                    </div>
                    {bienSelectionne && bienSelectionne.id === r.id && (
                      <span style={{color:'#C62828', fontSize:'16px'}}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Motif de depart *</label>
          <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
            {motifs.map(function(m) {
              return (
                <div
                  key={m}
                  onClick={function() { setMotif(m); }}
                  style={{
                    display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px',
                    border: motif === m ? '1.5px solid #C62828' : '0.5px solid #E0E0E0',
                    background: motif === m ? '#FFEBEE' : '#FAFAFA',
                    borderRadius:'10px', cursor:'pointer'
                  }}
                >
                  <div style={{
                    width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
                    border: motif === m ? 'none' : '1.5px solid #CCC',
                    background: motif === m ? '#C62828' : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    {motif === m && <span style={{color:'#fff', fontSize:'11px'}}>✓</span>}
                  </div>
                  <span style={{fontSize:'13px', color: motif === m ? '#B71C1C' : '#555'}}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label>Delai de preavis *</label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
            {[['1','1 mois'],['2','2 mois'],['3','3 mois']].map(function(opt) {
              return (
                <button
                  key={opt[0]}
                  type="button"
                  onClick={function() { setDelai(opt[0]); }}
                  style={{
                    padding:'10px', borderRadius:'10px',
                    border: delai === opt[0] ? '2px solid #C62828' : '0.5px solid #E0E0E0',
                    background: delai === opt[0] ? '#FFEBEE' : '#FAFAFA',
                    color: delai === opt[0] ? '#B71C1C' : '#555',
                    fontSize:'13px', fontWeight: delai === opt[0] ? 700 : 400, cursor:'pointer'
                  }}
                >
                  {opt[1]}
                </button>
              );
            })}
          </div>
          {delai && (
            <div style={{background:'#FFEBEE', borderRadius:'10px', padding:'10px 14px', marginTop:'10px', display:'flex', justifyContent:'space-between'}}>
              <span style={{fontSize:'12px', color:'#B71C1C'}}>Date de depart estimee</span>
              <span style={{fontSize:'12px', fontWeight:'700', color:'#C62828'}}>{dateFinEstimee}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Message personnel (optionnel)</label>
          <textarea
            value={note}
            onChange={function(e) { setNote(e.target.value); }}
            placeholder="Ajoutez un message personnel..."
            style={{
              width:'100%', padding:'10px 12px', borderRadius:'10px',
              border:'0.5px solid #E0E0E0', fontSize:'13px',
              resize:'none', height:'80px', fontFamily:'inherit'
            }}
          />
        </div>

        <button
          type="button"
          onClick={function() { if (motif && delai) setStep('confirm'); }}
          style={{
            width:'100%', padding:'13px',
            background: motif && delai ? '#C62828' : '#CCC',
            color:'#fff', border:'none', borderRadius:'12px',
            fontSize:'14px', fontWeight:'700',
            cursor: motif && delai ? 'pointer' : 'not-allowed'
          }}
        >
          Continuer — Preparer le preavis officiel
        </button>
        {(!motif || !delai) && (
          <div style={{fontSize:'11px', color:'#C62828', textAlign:'center', marginTop:'6px'}}>
            Selectionnez un motif et un delai de preavis
          </div>
        )}
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
  var [onglet, setOnglet] = useState('/dashboard');
  var [sidebarOpen, setSidebarOpen] = useState(true);
  var [loading, setLoading] = useState(true);
  var [showNotif, setShowNotif] = useState(false);
  var [alertes, setAlertes] = useState([]);
  var [stats, setStats] = useState({ logements: [], reservations: [], paiements: [] });

  // ================================================
  // Titres et icones des onglets
  // ================================================
  var pageTitle = {
    '/dashboard': 'Tableau de bord',
    '/dashboard/biens': 'Mes biens',
    '/dashboard/preavis': 'Preavis de depart',
    '/dashboard/locataires': 'Locataires',
    '/dashboard/reservations': 'Reservations',
    '/dashboard/paiements': 'Paiements',
    '/dashboard/documents': 'Documents',
    '/dashboard/alertes': 'Alertes',
    '/dashboard/messages': 'Messages',
    '/dashboard/reclamations': 'Reclamations',
    '/dashboard/parametres': 'Parametres',
    '/dashboard/mes-locations': 'Mes locations'
  };

  var pageIcon = {
    '/dashboard': '📊',
    '/dashboard/biens': '🏠',
    '/dashboard/preavis': '📤',
    '/dashboard/locataires': '👥',
    '/dashboard/reservations': '📅',
    '/dashboard/paiements': '💳',
    '/dashboard/documents': '📄',
    '/dashboard/alertes': '🔔',
    '/dashboard/messages': '💬',
    '/dashboard/reclamations': '🔧',
    '/dashboard/parametres': '⚙️',
    '/dashboard/mes-locations': '🏠'
  };

  useEffect(function() {
    chargerDonnees();
  }, []);

  function chargerDonnees() {
    setLoading(true);
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
        api.get('/paiements/mes-paiements')
      ]).then(function(results) {
        setStats({
          logements: [],
          reservations: results[0].data.reservations || [],
          paiements: results[1].data.paiements || []
        });
      });
    }
    req.catch(console.error).finally(function() { setLoading(false); });
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
    if (onglet === '/dashboard/biens') return <OngletBiens stats={stats} recharger={chargerDonnees} />;
    if (onglet === '/dashboard/preavis') return <OngletPreavis user={user} />;
    if (onglet === '/dashboard/locataires') return <OngletLocataires stats={stats} logements={stats.logements} />;
    if (onglet === '/dashboard/reservations') return <OngletReservations stats={stats} traiter={traiterReservation} user={user} />;
    if (onglet === '/dashboard/paiements') return <OngletPaiements stats={stats} />;
    if (onglet === '/dashboard/documents') return <OngletDocuments user={user} />;
    if (onglet === '/dashboard/alertes') return <OngletAlertes />;
    if (onglet === '/dashboard/messages') return <OngletMessages />;
    if (onglet === '/dashboard/reclamations') return <OngletReclamations />;
    if (onglet === '/dashboard/parametres') return <OngletParametres user={user} />;
    if (onglet === '/dashboard/mes-locations') return <OngletMesLocations stats={stats} />;
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