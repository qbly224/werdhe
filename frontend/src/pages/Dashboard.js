/* eslint-disable */
/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import toast from 'react-hot-toast';
import './Dashboard.css';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

var DOCS_TYPES = [
  { icon: '📝', titre: 'Nouveau bail', desc: 'Generer un contrat de location', color: '#1B6B3A', type: 'contrat_bail' },
  { icon: '🧾', titre: 'Quittance de loyer', desc: 'Generer une quittance officielle', color: '#1565C0', type: 'quittance' },
  { icon: '📋', titre: 'Etat des lieux', desc: 'Entree ou sortie du locataire', color: '#E65100', type: 'etat_lieux' },
  { icon: '📜', titre: 'Mise en demeure', desc: 'Pour loyer impaye', color: '#B71C1C', type: 'autre' },
  { icon: '📊', titre: 'Rapport financier', desc: "Revenus du mois ou de l'annee", color: '#4A148C', type: 'autre' },
  { icon: '🔏', titre: 'Caution / Depot', desc: 'Contrat de caution solidaire', color: '#1B6B3A', type: 'autre' }
];

function NotifPanel(props) {
  var alertes = props.alertes;
  var onClose = props.onClose;
  return (
    <div className="notif-panel">
      <div className="notif-header">
        <span>Notifications</span>
        <span style={{cursor:'pointer', color:'#1B6B3A', fontSize:12}} onClick={onClose}>Fermer</span>
      </div>
      {alertes.length === 0 && (
        <div style={{padding:'20px', textAlign:'center', color:'#888', fontSize:13}}>Aucune notification</div>
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

function OngletOverview(props) {
  var stats = props.stats;
  // eslint-disable-next-line no-unused-vars
  var user = props.user;
  var alertes = props.alertes;

  // eslint-disable-next-line no-unused-vars
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
            <div key={i} className="stat-card-colored" style={{background: s.bg, borderLeft: '4px solid ' + s.color}}>
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-val" style={{color: s.color}}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="dash-two-cols">
        <div className="dash-white-card">
          <div className="dash-card-head">
            <h3>🔔 Alertes actives</h3>
            <span className="dash-badge-red">{alertes.length}</span>
          </div>
          {alertes.length === 0 && (
            <p style={{color:'#888', fontSize:13}}>Aucune alerte. Tout est en ordre !</p>
          )}
          {alertes.slice(0, 3).map(function(a, i) {
            var bg = a.type === 'loyer_retard' ? '#FFEBEE' : a.type === 'bail_bientot' ? '#FFF3E0' : '#E3F2FD';
            return (
              <div key={i} className="alerte-item-dash" style={{background: bg}}>
                <span style={{fontSize:22}}>
                  {a.type === 'loyer_retard' ? '⚠️' : a.type === 'bail_bientot' ? '📋' : '🔧'}
                </span>
                <div>
                  <div style={{fontSize:13, fontWeight:600, color:'#1B2B22'}}>{a.titre}</div>
                  <div style={{fontSize:11, color:'#888', marginTop:2}}>{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dash-white-card">
          <h3 style={{margin:'0 0 16px', fontSize:15, fontWeight:700, color:'#1B2B22'}}>🏠 Mes biens</h3>
          {stats.logements.length === 0 && (
            <p style={{color:'#888', fontSize:13}}>Aucun bien enregistre.</p>
          )}
          {stats.logements.slice(0, 4).map(function(b, i) {
            return (
              <div key={i} className="bien-list-item">
                <div className="bien-list-left">
                  <span style={{fontSize:22}}>🏠</span>
                  <div>
                    <div className="bien-list-info-title">{b.titre}</div>
                    <div className="bien-list-info-sub">{GNF(b.prix_mensuel)}/mois</div>
                  </div>
                </div>
                <span className={b.statut === 'loue' ? 'badge-occupe' : 'badge-libre'}>
                  {b.statut === 'loue' ? '● Occupe' : '○ Libre'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
            <h3 style={{color:'#B71C1C'}}>Confirmer la suppression</h3>
            <p>Voulez-vous vraiment supprimer ce bien ? Cette action est irreversible.</p>
            <div className="modal-actions">
              <button className="btn-green" style={{background:'#B71C1C'}} onClick={function() { handleDelete(showConfirm); }}>Supprimer</button>
              <button className="btn-outline-green" onClick={function() { setShowConfirm(null); }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="dash-page-header">
        <div>
          <h1>🏠 Mes biens</h1>
          <p>{stats.logements.length} biens enregistres</p>
        </div>
        <Link to="/logements/ajouter" className="btn-green" style={{textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6}}>
          + Ajouter un bien
        </Link>
      </div>

      {stats.logements.length === 0 && (
        <div className="dash-empty-state">
          <span>🏠</span>
          <h3>Aucun bien enregistre</h3>
          <p>Publiez votre premier logement pour commencer</p>
          <Link to="/logements/ajouter" className="btn-green" style={{textDecoration:'none', display:'inline-block'}}>+ Ajouter un bien</Link>
        </div>
      )}

      <div className="biens-cards-grid">
        {stats.logements.map(function(b, i) {
          var borderColor = b.statut === 'loue' ? '#1B6B3A' : '#F5A623';
          return (
            <div key={b.id} className="bien-card-proto" style={{borderTop: '4px solid ' + borderColor}}>
              {modeEdit === b.id ? (
                <div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Titre</label>
                      <input type="text" value={formEdit.titre} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, {titre: e.target.value})); }} />
                    </div>
                    <div className="form-group">
                      <label>Prix (GNF)</label>
                      <input type="number" value={formEdit.prix_mensuel} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, {prix_mensuel: e.target.value})); }} />
                    </div>
                    <div className="form-group">
                      <label>Adresse</label>
                      <input type="text" value={formEdit.adresse} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, {adresse: e.target.value})); }} />
                    </div>
                    <div className="form-group">
                      <label>Statut</label>
                      <select value={formEdit.statut} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, {statut: e.target.value})); }}>
                        <option value="disponible">Disponible</option>
                        <option value="loue">Loue</option>
                        <option value="suspendu">Suspendu</option>
                      </select>
                    </div>
                  </div>
                  <div style={{display:'flex', gap:8}}>
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
                      {b.statut === 'loue' ? '● Occupe' : '○ Libre'}
                    </span>
                  </div>
                  <div className="bien-card-stats">
                    <div className="bien-stat-box">
                      <div className="bien-stat-label">Loyer mensuel</div>
                      <div className="bien-stat-val" style={{color:'#1B6B3A'}}>{GNF(b.prix_mensuel)}</div>
                    </div>
                    <div className="bien-stat-box">
                      <div className="bien-stat-label">Categorie</div>
                      <div className="bien-stat-val" style={{fontSize:13}}>{b.categorie || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="bien-card-btns">
                    <button className="btn-bien-primary" onClick={function() { handleEdit(b); }}>✏️ Modifier</button>
                    <button className="btn-bien-secondary" onClick={function() { setShowConfirm(b.id); }}>🗑️ Supprimer</button>
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

function OngletLocataires(props) {
  var stats = props.stats;
  var logements = props.logements;
  var [showForm, setShowForm] = useState(false);
  var [locatairesManue, setLocatairesManue] = useState([]);
  var [modeEdit, setModeEdit] = useState(null);
  var [form, setForm] = useState({ nom:'', prenom:'', telephone:'', email:'', logement_id:'', loyer_mensuel:'', date_entree:'' });

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
      setForm({ nom:'', prenom:'', telephone:'', email:'', logement_id:'', loyer_mensuel:'', date_entree:'' });
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
          <h1>👥 Locataires</h1>
          <p>{locatairesReservations.length + locatairesManue.length} locataire(s)</p>
        </div>
        <button className="btn-green" onClick={function() { setShowForm(!showForm); setModeEdit(null); setForm({ nom:'', prenom:'', telephone:'', email:'', logement_id:'', loyer_mensuel:'', date_entree:'' }); }}>
          + Ajouter un locataire
        </button>
      </div>

      {showForm && (
        <div className="dash-form-card">
          <h3>{modeEdit ? 'Modifier le locataire' : 'Nouveau locataire'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group"><label>Prenom *</label><input type="text" value={form.prenom} onChange={function(e) { setForm(Object.assign({}, form, {prenom: e.target.value})); }} required /></div>
              <div className="form-group"><label>Nom *</label><input type="text" value={form.nom} onChange={function(e) { setForm(Object.assign({}, form, {nom: e.target.value})); }} required /></div>
              <div className="form-group"><label>Telephone</label><input type="tel" value={form.telephone} onChange={function(e) { setForm(Object.assign({}, form, {telephone: e.target.value})); }} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={function(e) { setForm(Object.assign({}, form, {email: e.target.value})); }} /></div>
              <div className="form-group">
                <label>Attribuer un logement</label>
                <select value={form.logement_id} onChange={function(e) { setForm(Object.assign({}, form, {logement_id: e.target.value})); }}>
                  <option value="">Aucun</option>
                  {logements.map(function(l) { return <option key={l.id} value={l.id}>{l.titre}</option>; })}
                </select>
              </div>
              <div className="form-group"><label>Loyer (GNF)</label><input type="number" value={form.loyer_mensuel} onChange={function(e) { setForm(Object.assign({}, form, {loyer_mensuel: e.target.value})); }} /></div>
              <div className="form-group"><label>Date d'entree</label><input type="date" value={form.date_entree} onChange={function(e) { setForm(Object.assign({}, form, {date_entree: e.target.value})); }} /></div>
            </div>
            <div style={{display:'flex', gap:10}}>
              <button type="submit" className="btn-green">{modeEdit ? 'Sauvegarder' : 'Ajouter'}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {locatairesReservations.length > 0 && (
        <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14, fontWeight:700, color:'#1B2B22', marginBottom:10}}>Locataires via Werdhe</h3>
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
                    <div className="locataire-loyer-sub">Loyer mensuel</div>
                  </div>
                  <button className="btn-outline-green">Voir fiche</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{fontSize:14, fontWeight:700, color:'#1B2B22', marginBottom:10}}>Locataires manuels</h3>
      {locatairesManue.length === 0 && !showForm && (
        <div className="dash-empty-state">
          <span>👥</span>
          <h3>Aucun locataire manuel</h3>
          <p>Ajoutez des locataires sans compte Werdhe</p>
        </div>
      )}
      {locatairesManue.map(function(l, i) {
        var initiales = (l.prenom ? l.prenom.charAt(0) : '') + (l.nom ? l.nom.charAt(0) : '');
        return (
          <div key={l.id} className="locataire-row" style={{borderLeft:'4px solid #F5A623'}}>
            <div className="locataire-row-left">
              <div className="locataire-avatar-proto" style={{background:'#F5A623', color:'#1B6B3A'}}>{initiales}</div>
              <div>
                <div className="locataire-row-name">{l.prenom} {l.nom}</div>
                <div className="locataire-row-sub">
                  {l.telephone && ('📞 ' + l.telephone)}
                  {l.logement_titre && (' · 🏠 ' + l.logement_titre)}
                </div>
              </div>
            </div>
            <div className="locataire-row-right">
              {l.loyer_mensuel && (
                <div>
                  <div className="locataire-loyer">{GNF(l.loyer_mensuel)}/mois</div>
                  <div className="locataire-loyer-sub">Loyer mensuel</div>
                </div>
              )}
              <button className="btn-outline-green" onClick={function() {
                setModeEdit(l.id);
                setForm({ nom: l.nom, prenom: l.prenom, telephone: l.telephone || '', email: l.email || '', logement_id: l.logement_id || '', loyer_mensuel: l.loyer_mensuel || '', date_entree: l.date_entree ? l.date_entree.split('T')[0] : '' });
                setShowForm(true);
              }}>Modifier</button>
              <button style={{background:'#FFEBEE', color:'#B71C1C', border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, cursor:'pointer', fontWeight:600}} onClick={function() { handleDelete(l.id); }}>Supprimer</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OngletReservations(props) {
  var stats = props.stats;
  var traiter = props.traiter;
  // eslint-disable-next-line no-unused-vars
  var user = props.user;
  return (
    <div>
      <div className="dash-page-header">
        <div><h1>📅 Reservations</h1><p>{stats.reservations.length} reservation(s)</p></div>
      </div>
      {stats.reservations.length === 0 && (
        <div className="dash-empty-state">
          <span>📅</span><h3>Aucune reservation</h3><p>Les demandes apparaitront ici</p>
        </div>
      )}
      {stats.reservations.map(function(r) {
        return (
          <div key={r.id} className="locataire-row" style={{flexWrap:'wrap', gap:12, alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <div className="locataire-row-name">{r.logement_titre}</div>
              <div className="locataire-row-sub">
                Du {new Date(r.date_debut).toLocaleDateString('fr-FR')}
                {r.date_fin ? ' au ' + new Date(r.date_fin).toLocaleDateString('fr-FR') : ''}
                {r.type_location === 'longue_duree' ? ' (Longue duree)' : ''}
              </div>
              <div style={{fontSize:13, fontWeight:700, color:'#1B6B3A', marginTop:4}}>{GNF(r.montant_total)}</div>
              {r.locataire_nom && <div style={{fontSize:12, color:'#888'}}>👤 {r.locataire_prenom} {r.locataire_nom} — {r.locataire_telephone}</div>}
            </div>
            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
              <span className={r.statut === 'confirmee' ? 'badge-paye' : r.statut === 'annulee' ? 'badge-retard' : 'badge-libre'}>
                {r.statut === 'en_attente' ? '⏳ En attente' : r.statut === 'confirmee' ? '✅ Confirmee' : r.statut === 'annulee' ? '❌ Annulee' : '🏁 Terminee'}
              </span>
              {user && user.role !== 'locataire' && r.statut === 'en_attente' && (
                <div style={{display:'flex', gap:8}}>
                  <button className="btn-bien-primary" style={{padding:'7px 14px'}} onClick={function() { traiter(r.id, 'confirmee'); }}>Confirmer</button>
                  <button style={{background:'#FFEBEE', color:'#B71C1C', border:'none', borderRadius:8, padding:'7px 12px', fontSize:13, cursor:'pointer', fontWeight:600}} onClick={function() { traiter(r.id, 'annulee'); }}>Refuser</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OngletPaiements(props) {
  var stats = props.stats;
  var paiesCompletes = stats.paiements.filter(function(p) { return p.statut === 'complete'; });
  var paiesAttente = stats.paiements.filter(function(p) { return p.statut === 'en_attente'; });
  var totalEncaisse = paiesCompletes.reduce(function(s, p) { return s + Number(p.montant); }, 0);
  var totalAttente = paiesAttente.reduce(function(s, p) { return s + Number(p.montant); }, 0);
  var totalAttendu = totalEncaisse + totalAttente;

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

  return (
    <div>
      <div className="stats-grid-3">
        {[
          { label: 'Encaisse ce mois', value: GNF(totalEncaisse), color: '#1B6B3A', bg: '#E8F5E9', icon: '✅' },
          { label: 'En attente', value: GNF(totalAttente), color: '#E65100', bg: '#FFEBEE', icon: '⏳' },
          { label: 'Total attendu', value: GNF(totalAttendu), color: '#1565C0', bg: '#E3F2FD', icon: '📊' }
        ].map(function(s, i) {
          return (
            <div key={i} className="stat-card-colored" style={{background: s.bg, borderLeft: '4px solid ' + s.color}}>
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-val" style={{color: s.color}}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="dash-white-card">
        <div className="dash-card-head">
          <h3>Historique des paiements</h3>
          <button className="btn-green-sm" onClick={exporter}>📥 Exporter</button>
        </div>
        {stats.paiements.length === 0 && <p style={{color:'#888', fontSize:13}}>Aucun paiement.</p>}
        {stats.paiements.length > 0 && (
          <div style={{overflowX:'auto'}}>
            <table className="table-proto">
              <thead>
                <tr>
                  {['Locataire', 'Bien', 'Montant', 'Date', 'Mode', 'Statut'].map(function(h) {
                    return <th key={h}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {stats.paiements.map(function(p, i) {
                  return (
                    <tr key={i}>
                      <td style={{fontWeight:600, color:'#1B2B22'}}>{p.locataire_prenom} {p.locataire_nom}</td>
                      <td style={{color:'#555'}}>{p.logement_titre}</td>
                      <td style={{fontWeight:700, color:'#1B6B3A'}}>{GNF(p.montant)}</td>
                      <td style={{color:'#555'}}>{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{color:'#555'}}>{p.mode_paiement === 'en_ligne' ? 'En ligne' : 'Especes'}</td>
                      <td>
                        <span className={p.statut === 'complete' ? 'badge-paye' : 'badge-retard'}>
                          {p.statut === 'complete' ? '✓ Paye' : '⚠ En retard'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OngletAlertes(props) {
  // eslint-disable-next-line no-unused-vars
  var user = props.user;
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

  if (loading) return <div style={{padding:40, textAlign:'center', color:'#888'}}>Chargement...</div>;

  var total = data.alertes.length + data.signalements.length;

  return (
    <div style={{maxWidth:700}}>
      <div className="dash-page-header">
        <div><h1>🔔 Alertes</h1><p>{total} alerte(s) active(s)</p></div>
      </div>
      {total === 0 && (
        <div className="dash-empty-state">
          <span>✅</span><h3>Aucune alerte</h3><p>Tout est en ordre !</p>
        </div>
      )}
      {data.alertes.map(function(a, i) {
        var borderColor = a.type === 'loyer_retard' ? '#E53935' : a.type === 'bail_bientot' ? '#F5A623' : '#1565C0';
        var btnLabel = a.type === 'loyer_retard' ? '📤 Relancer' : a.type === 'bail_bientot' ? '📋 Renouveler' : '🔔 Traiter';
        return (
          <div key={a.id} className="alerte-card-proto" style={{borderLeft: '5px solid ' + borderColor}}>
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
      {data.signalements.length > 0 && (
        <div>
          <h3 style={{fontSize:14, fontWeight:700, color:'#1B2B22', margin:'20px 0 10px'}}>Signalements de pannes</h3>
          {data.signalements.map(function(s, i) {
            return (
              <div key={s.id} className="alerte-card-proto" style={{borderLeft:'5px solid #1565C0'}}>
                <div className="alerte-card-icon">🔧</div>
                <div className="alerte-card-body">
                  <div className="alerte-card-title">{s.titre}</div>
                  <div className="alerte-card-sub">{s.logement_titre}{s.locataire_nom ? ' — ' + s.locataire_prenom + ' ' + s.locataire_nom : ''}</div>
                </div>
                <button className="alerte-card-btn" onClick={function() {
                  api.patch('/alertes/signalements/' + s.id, { statut: 'resolu' })
                    .then(function() { toast.success('Resolu !'); api.get('/alertes').then(function(res) { setData(res.data); }).catch(console.error); })
                    .catch(function() { toast.error('Erreur'); });
                }}>🔧 Suivre</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OngletDocuments(props) {
  // eslint-disable-next-line no-unused-vars
  var user = props.user;
  var [reservations, setReservations] = useState([]);
  var [documents, setDocuments] = useState([]);
  var [showForm, setShowForm] = useState(false);
  var [genForm, setGenForm] = useState({ reservation_id: '', type: 'contrat_bail' });
  var [showUpload, setShowUpload] = useState(false);
  var [uploadForm, setUploadForm] = useState({ titre: '', type: 'autre' });
  var [fichier, setFichier] = useState(null);

  useEffect(function() {
    api.get('/documents').then(function(res) { setDocuments(res.data.documents); }).catch(console.error);
    var ep = user && user.role === 'locataire' ? '/reservations/mes-reservations' : '/reservations/proprietaire';
    api.get(ep).then(function(res) { setReservations(res.data.reservations.filter(function(r) { return r.statut === 'confirmee'; })); }).catch(console.error);
  }, [user]);

  function generer(e) {
    e.preventDefault();
    api.post('/documents/generer', genForm)
      .then(function() { toast.success('Document genere !'); setShowForm(false); api.get('/documents').then(function(res) { setDocuments(res.data.documents); }); })
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
      }).catch(function() { toast.error('Erreur'); });
  }

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>📄 Documents</h1><p>{documents.length} document(s)</p></div>
        <div style={{display:'flex', gap:10}}>
          <button className="btn-outline-green" onClick={function() { setShowUpload(!showUpload); setShowForm(false); }}>📎 Ajouter</button>
          <button className="btn-green" onClick={function() { setShowForm(!showForm); setShowUpload(false); }}>✨ Generer</button>
        </div>
      </div>

      <div className="docs-grid-proto">
        {DOCS_TYPES.map(function(d, i) {
          return (
            <div key={i} className="doc-card-proto">
              <div className="doc-card-icon">{d.icon}</div>
              <div className="doc-card-title">{d.titre}</div>
              <div className="doc-card-desc">{d.desc}</div>
              <button
                className="doc-card-btn"
                style={{background: d.color}}
                onClick={function() {
                  setGenForm(Object.assign({}, genForm, {type: d.type}));
                  setShowForm(true);
                  setShowUpload(false);
                }}
              >Generer</button>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="dash-form-card" style={{marginTop:16}}>
          <h3>Generer un document</h3>
          <form onSubmit={generer}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Type</label>
                <select value={genForm.type} onChange={function(e) { setGenForm(Object.assign({}, genForm, {type: e.target.value})); }}>
                  {DOCS_TYPES.map(function(d) { return <option key={d.type} value={d.type}>{d.titre}</option>; })}
                </select>
              </div>
              <div className="form-group">
                <label>Reservation</label>
                <select value={genForm.reservation_id} onChange={function(e) { setGenForm(Object.assign({}, genForm, {reservation_id: e.target.value})); }} required>
                  <option value="">Selectionnez</option>
                  {reservations.map(function(r) { return <option key={r.id} value={r.id}>{r.logement_titre} - {new Date(r.date_debut).toLocaleDateString('fr-FR')}</option>; })}
                </select>
              </div>
            </div>
            <div style={{display:'flex', gap:10}}>
              <button type="submit" className="btn-green">Generer et envoyer</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {documents.length > 0 && (
        <div className="dash-white-card" style={{marginTop:16}}>
          <h3 style={{marginBottom:14}}>Historique des documents</h3>
          {documents.map(function(doc) {
            var icone = doc.type === 'facture' ? '🧾' : doc.type === 'quittance' ? '📋' : doc.type === 'contrat_bail' ? '📝' : '📄';
            return (
              <div key={doc.id} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #F5F5F5'}}>
                <span style={{fontSize:24}}>{icone}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:600, color:'#1B2B22'}}>{doc.titre}</div>
                  <div style={{fontSize:11, color:'#888'}}>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <button className="btn-outline-green" onClick={function() { telecharger(doc); }}>Telecharger</button>
                <button className="btn-bien-secondary" style={{padding:'6px 12px'}} onClick={function() {
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

function OngletMessages() {
  var auth = useAuth();
  var user = auth.user;
  var [conversations, setConversations] = useState([]);
  var [convActive, setConvActive] = useState(null);
  var [messages, setMessages] = useState([]);
  var [message, setMessage] = useState('');
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    chargerConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chargerConversations() {
    api.get('/reservations/' + (user && user.role === 'locataire' ? 'mes-reservations' : 'proprietaire'))
      .then(function(res) {
        var convs = [];
        var seen = {};
        res.data.reservations.forEach(function(r) {
          var cle = user && user.role === 'locataire' ? r.proprietaire_id : r.locataire_id;
          if (cle && !seen[cle]) {
            seen[cle] = true;
            var nom = user && user.role === 'locataire'
              ? (r.proprietaire_prenom + ' ' + r.proprietaire_nom)
              : (r.locataire_prenom + ' ' + r.locataire_nom);
            var initiales = nom.split(' ').map(function(n) { return n ? n.charAt(0) : ''; }).join('').toUpperCase();
            convs.push({
              id: cle,
              nom: nom,
              initiales: initiales,
              bien: r.logement_titre,
              telephone: user && user.role === 'locataire' ? r.proprietaire_telephone : r.locataire_telephone,
              dernierMsg: 'Cliquez pour demarrer la conversation',
              heure: ''
            });
          }
        });
        setConversations(convs);
        if (convs.length > 0) setConvActive(convs[0].id);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }

  function envoyerMessage() {
    if (!message.trim()) return;
    var now = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    setMessages(function(prev) {
      return prev.concat({ id: prev.length + 1, texte: message, envoye: true, heure: now });
    });
    setConversations(function(prev) {
      return prev.map(function(c) {
        if (c.id !== convActive) return c;
        return Object.assign({}, c, { dernierMsg: message, heure: now });
      });
    });
    setMessage('');
  }

  var convCourante = conversations.find(function(c) { return c.id === convActive; });

  if (loading) {
    return (
      <div>
        <div className="dash-page-header"><div><h1>Messages</h1></div></div>
        <div style={{textAlign:'center', padding:'40px', color:'#888'}}>Chargement...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div>
        <div className="dash-page-header"><div><h1>Messages</h1><p>Messagerie avec vos locataires</p></div></div>
        <div className="dash-empty-state">
          <span>💬</span>
          <h3>Aucune conversation</h3>
          <p>
            {user && user.role === 'locataire'
              ? 'Reservez un logement pour contacter le proprietaire'
              : 'Les messages de vos locataires apparaitront ici'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>Messages</h1><p>Messagerie avec vos locataires</p></div>
      </div>
      <div className="messages-container">
        <div className="messages-list">
          <div style={{padding:'14px 16px', borderBottom:'1px solid #f0f0f0', fontWeight:700, fontSize:13, color:'#1B2B22'}}>
            Conversations ({conversations.length})
          </div>
          {conversations.map(function(c) {
            return (
              <div
                key={c.id}
                className={'message-thread-item ' + (convActive === c.id ? 'active' : '')}
                onClick={function() {
                  setConvActive(c.id);
                  if (messages.length === 0) {
                    setMessages([{
                      id: 1,
                      texte: 'Bonjour ! Comment puis-je vous aider ?',
                      envoye: true,
                      heure: '...'
                    }]);
                  }
                }}
              >
                <div className="msg-avatar">{c.initiales}</div>
                <div style={{flex:1, overflow:'hidden'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div className="msg-thread-name">{c.nom}</div>
                    {c.heure && <div className="msg-thread-time">{c.heure}</div>}
                  </div>
                  <div className="msg-thread-preview">{c.dernierMsg}</div>
                  <div style={{fontSize:11, color:'#1B6B3A', marginTop:2}}>{c.bien}</div>
                  {c.telephone && (
                    <div style={{fontSize:11, color:'#aaa'}}>📞 {c.telephone}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="messages-chat">
          <div className="messages-chat-header">
            {convCourante && (
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div className="msg-avatar" style={{width:34, height:34, fontSize:12}}>
                  {convCourante.initiales}
                </div>
                <div>
                  <div style={{fontWeight:700, fontSize:14, color:'#1B2B22'}}>{convCourante.nom}</div>
                  <div style={{fontSize:12, color:'#888'}}>{convCourante.bien}</div>
                </div>
                {convCourante.telephone && (
                  
                    href={'tel:' + convCourante.telephone}
                    style={{marginLeft:'auto', background:'#E8F5E9', color:'#1B6B3A', borderRadius:'20px', padding:'6px 14px', fontSize:12, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4}}
                  >
                    📞 Appeler
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="messages-chat-body">
            {messages.length === 0 && (
              <div style={{textAlign:'center', color:'#ccc', fontSize:13, padding:'40px 20px'}}>
                Demarrez la conversation...
              </div>
            )}
            {messages.map(function(m) {
              return (
                <div key={m.id} className={'msg-bubble ' + (m.envoye ? 'msg-bubble-sent' : 'msg-bubble-received')}>
                  {m.texte}
                  <div style={{fontSize:10, marginTop:4, opacity:0.7, textAlign:'right'}}>{m.heure}</div>
                </div>
              );
            })}
          </div>

          <div className="messages-chat-input">
            <input
              type="text"
              placeholder="Ecrire un message..."
              value={message}
              onChange={function(e) { setMessage(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }}
            />
            <button className="btn-send" onClick={envoyerMessage} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OngletParametres(props) {
  var user = props.user;
  var auth = useAuth();
  var [section, setSection] = useState(null);
  var [formProfil, setFormProfil] = useState({
    prenom: user ? user.prenom : '',
    nom: user ? user.nom : '',
    email: user ? user.email : '',
    telephone: user ? user.telephone : ''
  });
  var [formMdp, setFormMdp] = useState({ ancien: '', nouveau: '', confirmer: '' });
  var [notifs, setNotifs] = useState({ email: true, sms: true, loyers: true, bails: true, pannes: false });
  var [langue, setLangue] = useState('fr');
  var [saving, setSaving] = useState(false);
  var [msgSucces, setMsgSucces] = useState('');

  function saveProfil(e) {
    e.preventDefault();
    setSaving(true);
    api.put('/auth/profil', formProfil)
      .then(function() {
        setMsgSucces('Profil mis a jour !');
        toast.success('Profil mis a jour !');
        setTimeout(function() { setMsgSucces(''); setSection(null); }, 2000);
      })
      .catch(function() { toast.error('Erreur mise a jour'); })
      .finally(function() { setSaving(false); });
  }

  function saveMdp(e) {
    e.preventDefault();
    if (formMdp.nouveau !== formMdp.confirmer) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (formMdp.nouveau.length < 6) { toast.error('Minimum 6 caracteres'); return; }
    setSaving(true);
    api.put('/auth/changer-mot-de-passe', { ancien_mot_de_passe: formMdp.ancien, nouveau_mot_de_passe: formMdp.nouveau })
      .then(function() {
        toast.success('Mot de passe change !');
        setFormMdp({ ancien: '', nouveau: '', confirmer: '' });
        setTimeout(function() { setSection(null); }, 1500);
      })
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
        <div>
          <h1>⚙️ Parametres</h1>
        </div>
        {section && (
          <button className="btn-outline-green" onClick={function() { setSection(null); }}>
            ← Retour
          </button>
        )}
      </div>

      {!section && (
        <div style={{display:'flex', flexDirection:'column', gap:12, maxWidth:560}}>
          {menuItems.map(function(item) {
            return (
              <div
                key={item.id}
                onClick={function() { setSection(item.id); }}
                style={{background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:16, cursor:'pointer', transition:'all 0.15s'}}
                onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
              >
                <span style={{fontSize:28}}>{item.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:15, fontWeight:600, color:'#1B2B22'}}>{item.titre}</div>
                  <div style={{fontSize:13, color:'#888'}}>{item.desc}</div>
                </div>
                <span style={{fontSize:18, color:'#ccc'}}>→</span>
              </div>
            );
          })}

          <div style={{background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginTop:4}}>
            <div style={{fontSize:12, color:'#888', marginBottom:10, fontWeight:600}}>Informations du compte</div>
            <div style={{fontSize:14, color:'#333', marginBottom:4}}>📧 {user && user.email}</div>
            <div style={{fontSize:14, color:'#333', marginBottom:4}}>👤 Role : {user && user.role}</div>
            {user && user.telephone && <div style={{fontSize:14, color:'#333'}}>📞 {user.telephone}</div>}
          </div>

          <button
            onClick={function() { auth.logout(); }}
            style={{background:'#FFEBEE', color:'#B71C1C', border:'none', borderRadius:12, padding:'14px', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4}}
          >
            🚪 Se deconnecter
          </button>
        </div>
      )}

      {section === 'profil' && (
        <div className="dash-form-card" style={{maxWidth:560}}>
          <h3>👤 Modifier mon profil</h3>
          {msgSucces && (
            <div style={{background:'#E8F5E9', color:'#1B5E20', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13}}>
              ✅ {msgSucces}
            </div>
          )}
          <form onSubmit={saveProfil}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Prenom</label>
                <input type="text" value={formProfil.prenom}
                  onChange={function(e) { setFormProfil(Object.assign({}, formProfil, {prenom: e.target.value})); }} required />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input type="text" value={formProfil.nom}
                  onChange={function(e) { setFormProfil(Object.assign({}, formProfil, {nom: e.target.value})); }} required />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={formProfil.email}
                onChange={function(e) { setFormProfil(Object.assign({}, formProfil, {email: e.target.value})); }} required />
            </div>
            <div className="form-group">
              <label>Telephone</label>
              <input type="tel" placeholder="+224 622 00 00 00" value={formProfil.telephone || ''}
                onChange={function(e) { setFormProfil(Object.assign({}, formProfil, {telephone: e.target.value})); }} />
            </div>
            <div style={{display:'flex', gap:10}}>
              <button type="submit" className="btn-green" disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button type="button" className="btn-outline-green" onClick={function() { setSection(null); }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {section === 'mdp' && (
        <div className="dash-form-card" style={{maxWidth:480}}>
          <h3>🔐 Changer le mot de passe</h3>
          <form onSubmit={saveMdp}>
            <div className="form-group">
              <label>Mot de passe actuel</label>
              <input type="password" value={formMdp.ancien}
                onChange={function(e) { setFormMdp(Object.assign({}, formMdp, {ancien: e.target.value})); }} required />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" placeholder="Minimum 6 caracteres" value={formMdp.nouveau}
                onChange={function(e) { setFormMdp(Object.assign({}, formMdp, {nouveau: e.target.value})); }} required />
            </div>
            <div className="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input type="password" value={formMdp.confirmer}
                onChange={function(e) { setFormMdp(Object.assign({}, formMdp, {confirmer: e.target.value})); }} required />
            </div>
            {formMdp.nouveau && formMdp.confirmer && formMdp.nouveau !== formMdp.confirmer && (
              <div style={{fontSize:12, color:'#B71C1C', marginBottom:10}}>
                ⚠️ Les mots de passe ne correspondent pas
              </div>
            )}
            <div style={{display:'flex', gap:10}}>
              <button type="submit" className="btn-green" disabled={saving}>
                {saving ? 'Changement...' : 'Changer le mot de passe'}
              </button>
              <button type="button" className="btn-outline-green" onClick={function() { setSection(null); }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {section === 'notifs' && (
        <div className="dash-form-card" style={{maxWidth:480}}>
          <h3>🔔 Preferences de notifications</h3>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {[
              { key: 'email', label: 'Notifications par email', desc: 'Recevoir les alertes par email' },
              { key: 'sms', label: 'Notifications par SMS', desc: 'Recevoir les alertes par SMS (+224)' },
              { key: 'loyers', label: 'Alertes loyers en retard', desc: 'Etre notifie si un loyer est en retard' },
              { key: 'bails', label: 'Alertes baux expirants', desc: 'Etre notifie 60 jours avant expiration' },
              { key: 'pannes', label: 'Signalements de pannes', desc: 'Recevoir les signalements des locataires' }
            ].map(function(n) {
              return (
                <div key={n.key} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f0f0f0'}}>
                  <div>
                    <div style={{fontSize:14, fontWeight:600, color:'#1B2B22'}}>{n.label}</div>
                    <div style={{fontSize:12, color:'#888'}}>{n.desc}</div>
                  </div>
                  <div
                    onClick={function() { setNotifs(function(prev) { var next = Object.assign({}, prev); next[n.key] = !next[n.key]; return next; }); }}
                    style={{
                      width:44, height:24, borderRadius:12, cursor:'pointer',
                      background: notifs[n.key] ? '#1B6B3A' : '#e0e0e0',
                      position:'relative', transition:'background 0.2s', flexShrink:0
                    }}
                  >
                    <div style={{
                      width:18, height:18, borderRadius:'50%', background:'#fff',
                      position:'absolute', top:3,
                      left: notifs[n.key] ? 23 : 3,
                      transition:'left 0.2s',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex', gap:10, marginTop:16}}>
            <button className="btn-green" onClick={function() { toast.success('Preferences sauvegardees !'); setSection(null); }}>
              Sauvegarder
            </button>
            <button className="btn-outline-green" onClick={function() { setSection(null); }}>Annuler</button>
          </div>
        </div>
      )}

      {section === 'langue' && (
        <div className="dash-form-card" style={{maxWidth:480}}>
          <h3>🌐 Langue de l'interface</h3>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              { code: 'fr', label: 'Francais (Guinee)', flag: '🇬🇳' },
              { code: 'fr-fr', label: 'Francais (France)', flag: '🇫🇷' },
              { code: 'en', label: 'English', flag: '🇬🇧' }
            ].map(function(l) {
              return (
                <div
                  key={l.code}
                  onClick={function() { setLangue(l.code); }}
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'14px 16px', borderRadius:10, cursor:'pointer',
                    border: langue === l.code ? '2px solid #1B6B3A' : '1px solid #e0e0e0',
                    background: langue === l.code ? '#E8F5E9' : '#fff',
                    transition:'all 0.15s'
                  }}
                >
                  <span style={{fontSize:24}}>{l.flag}</span>
                  <span style={{fontSize:14, fontWeight: langue === l.code ? 600 : 400, color:'#1B2B22'}}>{l.label}</span>
                  {langue === l.code && (
                    <span style={{marginLeft:'auto', color:'#1B6B3A', fontWeight:700}}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{display:'flex', gap:10, marginTop:16}}>
            <button className="btn-green" onClick={function() { toast.success('Langue sauvegardee !'); setSection(null); }}>
              Sauvegarder
            </button>
            <button className="btn-outline-green" onClick={function() { setSection(null); }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OngletMesLocations(props) {
  var stats = props.stats;
  return (
    <div>
      <div className="dash-page-header">
        <div><h1>🏠 Mes locations</h1></div>
        <Link to="/logements" className="btn-green" style={{textDecoration:'none'}}>🔍 Chercher</Link>
      </div>
      {stats.reservations.filter(function(r) { return r.statut === 'confirmee'; }).length === 0 && (
        <div className="dash-empty-state">
          <span>🏠</span><h3>Aucune location active</h3>
          <p>Reservez un logement pour commencer</p>
          <Link to="/logements" className="btn-green" style={{textDecoration:'none', display:'inline-block'}}>Trouver un logement</Link>
        </div>
      )}
      {stats.reservations.filter(function(r) { return r.statut === 'confirmee'; }).map(function(r) {
        return (
          <div key={r.id} className="locataire-row">
            <div className="locataire-row-left">
              <div className="locataire-avatar-proto" style={{background:'#1565C0'}}>🏠</div>
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
              <span className="badge-paye">✅ Active</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  var auth = useAuth();
  var user = auth.user;
  var [onglet, setOnglet] = useState('/dashboard');
  var [sidebarOpen, setSidebarOpen] = useState(true);
  var [loading, setLoading] = useState(true);
  var [showNotif, setShowNotif] = useState(false);
  var [alertes, setAlertes] = useState([]);
  var [stats, setStats] = useState({ logements: [], reservations: [], paiements: [] });

  useEffect(function() {
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chargerDonnees() {
    setLoading(true);
    var req;
    if (user && (user.role === 'proprietaire' || user.role === 'les_deux')) {
      req = Promise.all([
        api.get('/logements/proprietaire/mes-logements'),
        api.get('/reservations/proprietaire'),
        api.get('/paiements/proprietaire'),
        api.get('/alertes')
      ]).then(function(results) {
        setStats({ logements: results[0].data.logements, reservations: results[1].data.reservations, paiements: results[2].data.paiements });
        setAlertes(results[3].data.alertes || []);
      });
    } else {
      req = Promise.all([
        api.get('/reservations/mes-reservations'),
        api.get('/paiements/mes-paiements')
      ]).then(function(results) {
        setStats({ logements: [], reservations: results[0].data.reservations, paiements: results[1].data.paiements });
      });
    }
    req.catch(console.error).finally(function() { setLoading(false); });
  }

  function traiterReservation(id, statut) {
    api.patch('/reservations/' + id + '/traiter', { statut: statut })
      .then(function() { toast.success(statut === 'confirmee' ? 'Reservation confirmee !' : 'Reservation annulee'); chargerDonnees(); })
      .catch(function() { toast.error('Erreur'); });
  }

  var pageTitle = {
    '/dashboard': 'Tableau de bord',
    '/dashboard/biens': 'Mes biens',
    '/dashboard/locataires': 'Locataires',
    '/dashboard/reservations': 'Reservations',
    '/dashboard/paiements': 'Paiements',
    '/dashboard/documents': 'Documents',
    '/dashboard/alertes': 'Alertes',
    '/dashboard/messages': 'Messages',
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
    '/dashboard/parametres': '⚙️',
    '/dashboard/mes-locations': '🏠'
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dash-loading">Chargement...</div>
      </div>
    );
  }

  function renderOnglet() {
    if (onglet === '/dashboard') return <OngletOverview stats={stats} user={user} alertes={alertes} />;
    if (onglet === '/dashboard/biens') return <OngletBiens stats={stats} recharger={chargerDonnees} />;
    if (onglet === '/dashboard/locataires') return <OngletLocataires stats={stats} logements={stats.logements} />;
    if (onglet === '/dashboard/reservations') return <OngletReservations stats={stats} traiter={traiterReservation} user={user} />;
    if (onglet === '/dashboard/paiements') return <OngletPaiements stats={stats} />;
    if (onglet === '/dashboard/documents') return <OngletDocuments user={user} />;
    if (onglet === '/dashboard/alertes') return <OngletAlertes user={user} />;
    if (onglet === '/dashboard/messages') return <OngletMessages />;
    if (onglet === '/dashboard/parametres') return <OngletParametres user={user} />;
    if (onglet === '/dashboard/mes-locations') return <OngletMesLocations stats={stats} />;
    return <OngletOverview stats={stats} user={user} alertes={alertes} />;
  }

  var sidebarWidth = sidebarOpen ? 240 : 70;

  return (
    <div className="dashboard-wrapper">
      <Sidebar ongletActif={onglet} setOnglet={setOnglet} open={sidebarOpen} />

      <div className="dashboard-main" style={{marginLeft: sidebarWidth}}>
        <div className="dash-header">
          <div className="dash-header-left">
            <button className="dash-toggle-btn" onClick={function() { setSidebarOpen(!sidebarOpen); }} type="button">
              ☰
            </button>
            <div className="dash-header-title">
              <h1>{pageIcon[onglet] || '📊'} {pageTitle[onglet] || 'Tableau de bord'}</h1>
              <p>{new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
            </div>
          </div>
          <div className="dash-header-right">
            <div className="dash-om-badge">🌐 Orange Money connecte</div>
            <button className="dash-notif-btn" type="button" onClick={function() { setShowNotif(!showNotif); }}>
              🔔
              {alertes.length > 0 && <div className="dash-notif-badge">{alertes.length}</div>}
            </button>
          </div>
        </div>

        {showNotif && (
          <div style={{position:'relative'}}>
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