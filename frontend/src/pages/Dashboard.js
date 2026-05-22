import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import PhotoUpload from '../components/PhotoUpload';
import toast from 'react-hot-toast';
import './Dashboard.css';

// ================================
// ONGLET : TABLEAU DE BORD
// ================================
const OngletOverview = ({ stats, user }) => (
  <div className="dash-content">
    <div className="dash-page-header">
      <div>
        <h1>Tableau de bord</h1>
        <p>Bienvenue {user?.prenom}, voici un aperçu de votre activité</p>
      </div>
    </div>

    <div className="stats-row">
      {user?.role !== 'locataire' && (
        <>
          <div className="stat-box">
            <div className="stat-box-icon" style={{background:'#e3f2fd'}}>🏠</div>
            <div>
              <span className="stat-box-val">{stats.logements.length}</span>
              <span className="stat-box-lbl">Total des biens</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-box-icon" style={{background:'#e8f5e9'}}>✅</div>
            <div>
              <span className="stat-box-val">
                {stats.logements.filter(l => l.statut === 'loue').length}
              </span>
              <span className="stat-box-lbl">Biens loués</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-box-icon" style={{background:'#fff3e0'}}>🔓</div>
            <div>
              <span className="stat-box-val">
                {stats.logements.filter(l => l.statut === 'disponible').length}
              </span>
              <span className="stat-box-lbl">Disponibles</span>
            </div>
          </div>
        </>
      )}
      <div className="stat-box">
        <div className="stat-box-icon" style={{background:'#f3e5f5'}}>💰</div>
        <div>
          <span className="stat-box-val">
            {stats.paiements
              .filter(p => p.statut === 'complete')
              .reduce((sum, p) => sum + Number(p.montant), 0)
              .toLocaleString()}
          </span>
          <span className="stat-box-lbl">GNF reçus</span>
        </div>
      </div>
    </div>

    <div className="dash-two-cols">
      <div className="dash-card">
        <div className="dash-card-header"><h3>💰 Paiements récents</h3></div>
        {stats.paiements.length === 0 ? (
          <p className="dash-empty">Aucun paiement pour le moment</p>
        ) : (
          stats.paiements.slice(0, 5).map(p => (
            <div key={p.id} className="dash-list-item">
              <div className="dash-list-icon">💵</div>
              <div className="dash-list-info">
                <strong>{p.logement_titre}</strong>
                <span>{p.logement_ville}</span>
              </div>
              <div className="dash-list-right">
                <strong>{Number(p.montant).toLocaleString()} GNF</strong>
                <span className={`badge badge-${p.statut}`}>
                  {p.statut === 'complete' ? 'Payé' : 'En attente'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {user?.role !== 'locataire' && (
        <div className="dash-card">
          <div className="dash-card-header"><h3>🏠 Aperçu des biens</h3></div>
          {stats.logements.length === 0 ? (
            <p className="dash-empty">Aucun bien pour le moment</p>
          ) : (
            stats.logements.slice(0, 5).map(l => (
              <div key={l.id} className="dash-list-item">
                <div className="dash-list-icon">🏠</div>
                <div className="dash-list-info">
                  <strong>{l.titre}</strong>
                  <span>{l.ville}</span>
                </div>
                <div className="dash-list-right">
                  <strong>{Number(l.prix_mensuel).toLocaleString()} GNF</strong>
                  <span className={`badge badge-${l.statut}`}>
                    {l.statut === 'disponible' ? 'Disponible' : 'Loué'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  </div>
);

// ================================
// ONGLET : MES BIENS
// ================================
const OngletBiens = ({ stats, recharger }) => {
  const [logementSelectionne, setLogementSelectionne] = useState(null);
  const [modeEdit, setModeEdit] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  const handleEdit = (logement) => {
    setModeEdit(logement.id);
    setFormEdit({
      titre: logement.titre,
      adresse: logement.adresse,
      ville: logement.ville,
      prix_mensuel: logement.prix_mensuel,
      nb_chambres: logement.nb_chambres,
      nb_salles_bain: logement.nb_salles_bain,
      superficie: logement.superficie || '',
      statut: logement.statut,
      description: logement.description || ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/logements/${id}`, formEdit);
      toast.success('✅ Bien modifié !');
      setModeEdit(null);
      recharger();
    } catch (err) {
      toast.error('Erreur modification');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/logements/${id}`);
      toast.success('✅ Bien supprimé !');
      setShowConfirmDelete(null);
      recharger();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur suppression');
    }
  };

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div>
          <h1>🏠 Mes biens</h1>
          <p>{stats.logements.length} bien(s) enregistré(s)</p>
        </div>
        <Link to="/logements/ajouter" className="btn btn-primary">
          + Ajouter un bien
        </Link>
      </div>

      {/* Modal confirmation suppression */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>⚠️ Confirmer la suppression</h3>
            <p>
              Voulez-vous vraiment supprimer ce bien ?
              Cette action est <strong>irréversible</strong>.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger"
                onClick={() => handleDelete(showConfirmDelete)}>
                🗑️ Supprimer définitivement
              </button>
              <button className="btn btn-secondary"
                onClick={() => setShowConfirmDelete(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {stats.logements.length === 0 ? (
        <div className="dash-empty-state">
          <span>🏠</span>
          <h3>Vous n'avez pas encore de bien</h3>
          <p>Publiez votre premier logement</p>
          <Link to="/logements/ajouter" className="btn btn-primary">
            + Ajouter mon premier bien
          </Link>
        </div>
      ) : (
        <div>
          {stats.logements.map(l => {
            const photos = l.photos
              ? (typeof l.photos === 'string' ? JSON.parse(l.photos) : l.photos)
              : [];
            const isEditing = modeEdit === l.id;

            return (
              <div key={l.id} className="bien-card">

                {/* En-tête du bien */}
                <div className="bien-header">
                  <div className="bien-photo-mini">
                    {photos.length > 0
                      ? <img src={photos[0].url} alt={l.titre} />
                      : <span>🏠</span>}
                  </div>
                  <div className="bien-info-main">
                    <h4>{l.titre}</h4>
                    <p>📍 {l.adresse}, {l.ville}</p>
                    <p>💰 {Number(l.prix_mensuel).toLocaleString()} GNF/mois</p>
                  </div>
                  <div className="bien-actions">
                    <span className={`badge badge-${l.statut}`}>
                      {l.statut === 'disponible' ? '✅ Disponible'
                        : l.statut === 'loue' ? '🔴 Loué' : '⏸ Suspendu'}
                    </span>
                    <div className="bien-btns">
                      <button className="btn-action btn-voir"
                        onClick={() => handleEdit(isEditing ? null : l)}>
                        {isEditing ? '✕ Fermer' : '✏️ Modifier'}
                      </button>
                      <button className="btn-action btn-photos"
                        onClick={() => setLogementSelectionne(
                          logementSelectionne?.id === l.id ? null : l
                        )}>
                        📸 Photos ({photos.length})
                      </button>
                      <button className="btn-action btn-supprimer-bien"
                        onClick={() => setShowConfirmDelete(l.id)}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Formulaire modification */}
                {isEditing && (
                  <div className="bien-edit-form">
                    <h4>✏️ Modifier le bien</h4>
                    <div className="form-row-2">
                      <div>
                        <label>Titre</label>
                        <input type="text" value={formEdit.titre}
                          onChange={e => setFormEdit({...formEdit, titre: e.target.value})} />
                      </div>
                      <div>
                        <label>Prix mensuel (GNF)</label>
                        <input type="number" value={formEdit.prix_mensuel}
                          onChange={e => setFormEdit({...formEdit, prix_mensuel: e.target.value})} />
                      </div>
                      <div>
                        <label>Adresse</label>
                        <input type="text" value={formEdit.adresse}
                          onChange={e => setFormEdit({...formEdit, adresse: e.target.value})} />
                      </div>
                      <div>
                        <label>Ville</label>
                        <input type="text" value={formEdit.ville}
                          onChange={e => setFormEdit({...formEdit, ville: e.target.value})} />
                      </div>
                      <div>
                        <label>Chambres</label>
                        <input type="number" value={formEdit.nb_chambres} min="0"
                          onChange={e => setFormEdit({...formEdit, nb_chambres: e.target.value})} />
                      </div>
                      <div>
                        <label>Salles de bain</label>
                        <input type="number" value={formEdit.nb_salles_bain} min="0"
                          onChange={e => setFormEdit({...formEdit, nb_salles_bain: e.target.value})} />
                      </div>
                      <div>
                        <label>Superficie (m²)</label>
                        <input type="number" value={formEdit.superficie}
                          onChange={e => setFormEdit({...formEdit, superficie: e.target.value})} />
                      </div>
                      <div>
                        <label>Statut</label>
                        <select value={formEdit.statut}
                          onChange={e => setFormEdit({...formEdit, statut: e.target.value})}>
                          <option value="disponible">✅ Disponible</option>
                          <option value="loue">🔴 Loué</option>
                          <option value="suspendu">⏸ Suspendu</option>
                        </select>
                      </div>
                    </div>
                    <div style={{marginTop:'12px'}}>
                      <label>Description</label>
                      <textarea value={formEdit.description} rows={3}
                        onChange={e => setFormEdit({...formEdit, description: e.target.value})}
                        style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px'}} />
                    </div>
                    <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
                      <button className="btn btn-primary"
                        onClick={() => handleSaveEdit(l.id)}>
                        💾 Sauvegarder
                      </button>
                      <button className="btn btn-secondary"
                        onClick={() => setModeEdit(null)}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Section upload photos */}
                {logementSelectionne?.id === l.id && (
                  <div className="bien-photos-section">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                      <h4>📸 Photos de : {l.titre}</h4>
                      <button className="btn-fermer"
                        onClick={() => setLogementSelectionne(null)}>✕</button>
                    </div>
                    <PhotoUpload
                      logementId={l.id}
                      photosInitiales={photos}
                      onUpdate={recharger}
                    />
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ================================
// ONGLET : LOCATAIRES
// ================================
const OngletLocataires = ({ stats, logements }) => {
  const [showForm, setShowForm] = useState(false);
  const [locatairesManue, setLocatairesManue] = useState([]);
  const [modeEdit, setModeEdit] = useState(null);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', telephone: '', email: '',
    cni: '', profession: '', logement_id: '',
    date_entree: '', loyer_mensuel: '', caution: '', notes: ''
  });

  useEffect(() => {
    chargerLocataires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chargerLocataires = async () => {
    try {
      const res = await api.get('/locataires-manuels');
      setLocatairesManue(res.data.locataires);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modeEdit) {
        await api.put(`/locataires-manuels/${modeEdit}`, formData);
        toast.success('✅ Locataire modifié !');
      } else {
        await api.post('/locataires-manuels', formData);
        toast.success('✅ Locataire ajouté !');
      }
      setShowForm(false);
      setModeEdit(null);
      resetForm();
      chargerLocataires();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur');
    }
  };

  const handleEdit = (loc) => {
    setModeEdit(loc.id);
    setFormData({
      nom: loc.nom, prenom: loc.prenom,
      telephone: loc.telephone || '',
      email: loc.email || '',
      cni: loc.cni || '',
      profession: loc.profession || '',
      logement_id: loc.logement_id || '',
      date_entree: loc.date_entree ? loc.date_entree.split('T')[0] : '',
      loyer_mensuel: loc.loyer_mensuel || '',
      caution: loc.caution || '',
      notes: loc.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce locataire ?')) return;
    try {
      await api.delete(`/locataires-manuels/${id}`);
      toast.success('✅ Locataire supprimé !');
      chargerLocataires();
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '', prenom: '', telephone: '', email: '',
      cni: '', profession: '', logement_id: '',
      date_entree: '', loyer_mensuel: '', caution: '', notes: ''
    });
  };

  // Fusionner locataires manuels + locataires via réservations
  const locatairesReservations = stats.reservations.reduce((acc, r) => {
    if (r.locataire_nom && !acc.find(l => l.email === r.locataire_email)) {
      acc.push({
        type: 'compte',
        nom: r.locataire_nom,
        prenom: r.locataire_prenom,
        telephone: r.locataire_telephone,
        email: r.locataire_email,
        logement: r.logement_titre,
        statut: r.statut
      });
    }
    return acc;
  }, []);

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div>
          <h1>👥 Locataires</h1>
          <p>{locatairesManue.length + locatairesReservations.length} locataire(s)</p>
        </div>
        <button className="btn btn-primary"
          onClick={() => {
            setModeEdit(null);
            resetForm();
            setShowForm(!showForm);
          }}>
          + Ajouter un locataire
        </button>
      </div>

      {/* Formulaire ajout/modification */}
      {showForm && (
        <div className="doc-form-card" style={{marginBottom:'24px'}}>
          <h3>{modeEdit ? '✏️ Modifier le locataire' : '+ Nouveau locataire'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div>
                <label>Prénom *</label>
                <input type="text" placeholder="Mamadou"
                  value={formData.prenom}
                  onChange={e => setFormData({...formData, prenom: e.target.value})}
                  required />
              </div>
              <div>
                <label>Nom *</label>
                <input type="text" placeholder="Diallo"
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  required />
              </div>
              <div>
                <label>Téléphone</label>
                <input type="tel" placeholder="622 000 000"
                  value={formData.telephone}
                  onChange={e => setFormData({...formData, telephone: e.target.value})} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" placeholder="mamadou@email.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label>CNI / Pièce d'identité</label>
                <input type="text" placeholder="N° CNI"
                  value={formData.cni}
                  onChange={e => setFormData({...formData, cni: e.target.value})} />
              </div>
              <div>
                <label>Profession</label>
                <input type="text" placeholder="Commerçant, Fonctionnaire..."
                  value={formData.profession}
                  onChange={e => setFormData({...formData, profession: e.target.value})} />
              </div>
              <div>
                <label>Attribuer un logement</label>
                <select value={formData.logement_id}
                  onChange={e => setFormData({...formData, logement_id: e.target.value})}>
                  <option value="">Sélectionnez un logement (optionnel)</option>
                  {logements.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.titre} — {l.ville}
                      {l.statut === 'loue' ? ' (Loué)' : ' (Disponible)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Date d'entrée</label>
                <input type="date" value={formData.date_entree}
                  onChange={e => setFormData({...formData, date_entree: e.target.value})} />
              </div>
              <div>
                <label>Loyer mensuel (GNF)</label>
                <input type="number" placeholder="500000"
                  value={formData.loyer_mensuel}
                  onChange={e => setFormData({...formData, loyer_mensuel: e.target.value})} />
              </div>
              <div>
                <label>Caution (GNF)</label>
                <input type="number" placeholder="1000000"
                  value={formData.caution}
                  onChange={e => setFormData({...formData, caution: e.target.value})} />
              </div>
            </div>
            <div style={{marginTop:'12px'}}>
              <label>Notes</label>
              <textarea placeholder="Observations, remarques..."
                value={formData.notes} rows={2}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px'}} />
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
              <button type="submit" className="btn btn-primary">
                {modeEdit ? '💾 Sauvegarder' : '+ Ajouter'}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => { setShowForm(false); setModeEdit(null); }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locataires via réservations */}
      {locatairesReservations.length > 0 && (
        <div style={{marginBottom:'24px'}}>
          <h3 style={{fontSize:'15px', fontWeight:'700', color:'#1B5E20', marginBottom:'12px'}}>
            📱 Locataires avec compte Werdhè
          </h3>
          <div className="locataires-grid">
            {locatairesReservations.map((l, i) => (
              <div key={i} className="locataire-card">
                <div className="locataire-avatar">
                  {l.prenom?.charAt(0)}{l.nom?.charAt(0)}
                </div>
                <div className="locataire-info">
                  <strong>{l.prenom} {l.nom}</strong>
                  <span>📞 {l.telephone}</span>
                  <span>📧 {l.email}</span>
                  <span>🏠 {l.logement}</span>
                </div>
                <span className={`badge badge-${l.statut}`}>
                  {l.statut === 'confirmee' ? '✅ Actif' : '⏳ En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locataires manuels */}
      <h3 style={{fontSize:'15px', fontWeight:'700', color:'#1B5E20', marginBottom:'12px'}}>
        📋 Locataires ajoutés manuellement
      </h3>

      {locatairesManue.length === 0 ? (
        <div className="dash-empty-state">
          <span>👥</span>
          <h3>Aucun locataire manuel</h3>
          <p>Ajoutez des locataires qui n'ont pas de compte Werdhè</p>
        </div>
      ) : (
        <div className="locataires-manuels-liste">
          {locatairesManue.map(loc => (
            <div key={loc.id} className="locataire-manuel-card">
              <div className="locataire-avatar" style={{background:'#FF8F00'}}>
                {loc.prenom?.charAt(0)}{loc.nom?.charAt(0)}
              </div>
              <div className="locataire-manuel-info">
                <strong>{loc.prenom} {loc.nom}</strong>
                <div className="locataire-details">
                  {loc.telephone && <span>📞 {loc.telephone}</span>}
                  {loc.email && <span>📧 {loc.email}</span>}
                  {loc.cni && <span>🪪 {loc.cni}</span>}
                  {loc.profession && <span>💼 {loc.profession}</span>}
                  {loc.logement_titre && (
                    <span>🏠 {loc.logement_titre}, {loc.logement_ville}</span>
                  )}
                  {loc.loyer_mensuel && (
                    <span>💰 {Number(loc.loyer_mensuel).toLocaleString()} GNF/mois</span>
                  )}
                  {loc.date_entree && (
                    <span>📅 Depuis le {new Date(loc.date_entree).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                {loc.notes && (
                  <p style={{fontSize:'12px', color:'#888', marginTop:'6px',fontStyle:'italic'}}>
                    📝 {loc.notes}
                  </p>
                )}
              </div>
              <div className="locataire-manuel-actions">
                <span className={`badge badge-${loc.statut === 'actif' ? 'confirmee' : loc.statut === 'en_retard' ? 'annulee' : 'en_attente'}`}>
                  {loc.statut === 'actif' ? '✅ Actif'
                    : loc.statut === 'en_retard' ? '⚠️ En retard'
                    : '🏁 Parti'}
                </span>
                <div style={{display:'flex', gap:'6px', marginTop:'8px'}}>
                  <button className="btn-action btn-voir"
                    onClick={() => handleEdit(loc)}>
                    ✏️ Modifier
                  </button>
                  <button className="btn-action btn-supprimer-bien"
                    onClick={() => handleDelete(loc.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================================
// ONGLET : RÉSERVATIONS
// ================================
const OngletReservations = ({ stats, traiterReservation, user }) => (
  <div className="dash-content">
    <div className="dash-page-header">
      <div>
        <h1>📅 Réservations</h1>
        <p>{stats.reservations.length} réservation(s)</p>
      </div>
    </div>

    {stats.reservations.length === 0 ? (
      <div className="dash-empty-state">
        <span>📅</span>
        <h3>Aucune réservation</h3>
        <p>Les demandes de réservation apparaîtront ici</p>
      </div>
    ) : (
      <div className="reservations-list">
        {stats.reservations.map(r => (
          <div key={r.id} className="reservation-item">
            <div className="reservation-main">
              <h4>{r.logement_titre}</h4>
              <p>📍 {r.logement_ville}</p>
              <p>📅 Début : {new Date(r.date_debut).toLocaleDateString('fr-FR')}</p>
              {r.date_fin && (
                <p>📅 Fin : {new Date(r.date_fin).toLocaleDateString('fr-FR')}</p>
              )}
              {r.type_location === 'longue_duree' && (
                <p>🏠 Longue durée — {r.duree_mois} mois</p>
              )}
              <p>💰 {Number(r.montant_total).toLocaleString()} GNF</p>
              {r.locataire_nom && (
                <p>👤 {r.locataire_prenom} {r.locataire_nom} — {r.locataire_telephone}</p>
              )}
            </div>
            <div className="reservation-actions-col">
              <span className={`badge badge-${r.statut}`}>
                {r.statut === 'en_attente' && '⏳ En attente'}
                {r.statut === 'confirmee' && '✅ Confirmée'}
                {r.statut === 'annulee' && '❌ Annulée'}
                {r.statut === 'terminee' && '🏁 Terminée'}
              </span>
              {user?.role !== 'locataire' && r.statut === 'en_attente' && (
                <div className="action-buttons">
                  <button className="btn btn-primary"
                    onClick={() => traiterReservation(r.id, 'confirmee')}>
                    ✅ Confirmer
                  </button>
                  <button className="btn btn-danger"
                    onClick={() => traiterReservation(r.id, 'annulee')}>
                    ❌ Refuser
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ================================
// ONGLET : PAIEMENTS
// ================================
const OngletPaiements = ({ stats }) => (
  <div className="dash-content">
    <div className="dash-page-header">
      <div>
        <h1>💰 Paiements</h1>
        <p>{stats.paiements.length} paiement(s)</p>
      </div>
    </div>

    {stats.paiements.length === 0 ? (
      <div className="dash-empty-state">
        <span>💰</span>
        <h3>Aucun paiement</h3>
        <p>Les paiements apparaîtront ici</p>
      </div>
    ) : (
      <div className="paiements-table">
        <div className="table-header" style={{gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr'}}>
          <span>Facture</span>
          <span>Logement</span>
          <span>Mode</span>
          <span>Montant</span>
          <span>Date</span>
          <span>Statut</span>
        </div>
        {stats.paiements.map(p => (
          <div key={p.id} className="table-row" style={{gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr'}}>
            <span className="facture-num">{p.numero_facture}</span>
            <span>{p.logement_titre}</span>
            <span>{p.mode_paiement === 'en_ligne' ? '💳 En ligne' : '💵 Espèces'}</span>
            <span className="montant-cell">{Number(p.montant).toLocaleString()} GNF</span>
            <span>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
            <span>
              <span className={`badge badge-${p.statut}`}>
                {p.statut === 'complete' ? '✅ Payé'
                  : p.statut === 'en_attente' ? '⏳ En attente'
                  : '❌ Échoué'}
              </span>
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ================================
// ONGLET : FACTURES
// ================================
const OngletFactures = ({ stats }) => (
  <div className="dash-content">
    <div className="dash-page-header">
      <div>
        <h1>📄 Factures</h1>
        <p>{stats.paiements.filter(p => p.statut === 'complete').length} facture(s)</p>
      </div>
    </div>

    {stats.paiements.filter(p => p.statut === 'complete').length === 0 ? (
      <div className="dash-empty-state">
        <span>📄</span>
        <h3>Aucune facture</h3>
        <p>Les factures apparaîtront après chaque paiement</p>
      </div>
    ) : (
      <div className="factures-list">
        {stats.paiements.filter(p => p.statut === 'complete').map(p => (
          <div key={p.id} className="facture-card">
            <div className="facture-icon">📄</div>
            <div className="facture-info">
              <strong>{p.numero_facture}</strong>
              <span>🏠 {p.logement_titre} — {p.logement_ville}</span>
              <span>💳 {p.mode_paiement === 'en_ligne' ? 'En ligne' : 'Espèces'}</span>
              <span>📅 {new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="facture-montant">
              <strong>{Number(p.montant).toLocaleString()} GNF</strong>
              <span className="badge badge-complete">✅ Payée</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ================================
// ONGLET : DOCUMENTS
// ================================
const OngletDocuments = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState('');
  const [reservations, setReservations] = useState([]);
  const [showGenerer, setShowGenerer] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [genForm, setGenForm] = useState({ reservation_id: '', type: 'contrat_bail' });
  const [uploadForm, setUploadForm] = useState({ titre: '', type: 'autre' });
  const [fichierManuel, setFichierManuel] = useState(null);

  useEffect(() => {
    chargerDocuments();
    chargerReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtreType]);

  const chargerDocuments = async () => {
    setLoading(true);
    try {
      const params = filtreType ? { type: filtreType } : {};
      const res = await api.get('/documents', { params });
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chargerReservations = async () => {
    try {
      const endpoint = user?.role === 'locataire'
        ? '/reservations/mes-reservations'
        : '/reservations/proprietaire';
      const res = await api.get(endpoint);
      setReservations(res.data.reservations.filter(r => r.statut === 'confirmee'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents/generer', genForm);
      toast.success('✅ Document généré et envoyé par email !');
      setShowGenerer(false);
      chargerDocuments();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur');
    }
  };

  const handleUploadManuel = async (e) => {
    e.preventDefault();
    if (!fichierManuel) { toast.error('Sélectionnez un fichier'); return; }
    const formData = new FormData();
    formData.append('fichier', fichierManuel);
    formData.append('titre', uploadForm.titre);
    formData.append('type', uploadForm.type);
    try {
      await api.post('/documents/upload-manuel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('✅ Document uploadé !');
      setShowUpload(false);
      chargerDocuments();
    } catch (err) {
      toast.error('Erreur upload');
    }
  };

  const handleTelecharger = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/telecharger`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.titre.replace(/\s+/g, '_')}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('✅ Téléchargement lancé !');
    } catch (err) {
      toast.error('Erreur téléchargement');
    }
  };

  const handleRenvoyerEmail = async (id) => {
    try {
      await api.post(`/documents/${id}/renvoyer-email`);
      toast.success('✅ Document renvoyé par email !');
    } catch (err) {
      toast.error('Erreur envoi email');
    }
  };

  const icones = { facture:'🧾', quittance:'📋', contrat_bail:'📜', etat_lieux:'🏠', autre:'📄' };
  const labels = { facture:'Facture', quittance:'Quittance', contrat_bail:'Contrat de bail', etat_lieux:'État des lieux', autre:'Autre document' };

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div>
          <h1>📄 Documents</h1>
          <p>{documents.length} document(s)</p>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
          <button className="btn btn-secondary"
            onClick={() => { setShowUpload(!showUpload); setShowGenerer(false); }}>
            📎 Ajouter manuellement
          </button>
          <button className="btn btn-primary"
            onClick={() => { setShowGenerer(!showGenerer); setShowUpload(false); }}>
            ✨ Générer un document
          </button>
        </div>
      </div>

      {showGenerer && (
        <div className="doc-form-card" style={{marginBottom:'20px'}}>
          <h3>✨ Générer un document</h3>
          <form onSubmit={handleGenerer}>
            <div className="form-row-2" style={{gap:'16px'}}>
              <div>
                <label>Type de document *</label>
                <select value={genForm.type}
                  onChange={e => setGenForm({...genForm, type: e.target.value})}>
                  <option value="facture">🧾 Facture de loyer</option>
                  <option value="quittance">📋 Quittance de loyer</option>
                  <option value="contrat_bail">📜 Contrat de bail</option>
                </select>
              </div>
              <div>
                <label>Réservation concernée *</label>
                <select value={genForm.reservation_id}
                  onChange={e => setGenForm({...genForm, reservation_id: e.target.value})} required>
                  <option value="">Sélectionnez une réservation</option>
                  {reservations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.logement_titre} — {new Date(r.date_debut).toLocaleDateString('fr-FR')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
              <button type="submit" className="btn btn-primary">✨ Générer et envoyer</button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setShowGenerer(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {showUpload && (
        <div className="doc-form-card" style={{marginBottom:'20px'}}>
          <h3>📎 Ajouter un document manuellement</h3>
          <form onSubmit={handleUploadManuel}>
            <div className="form-row-2" style={{gap:'16px'}}>
              <div>
                <label>Titre *</label>
                <input type="text" placeholder="Ex: Contrat signé"
                  value={uploadForm.titre}
                  onChange={e => setUploadForm({...uploadForm, titre: e.target.value})} required />
              </div>
              <div>
                <label>Catégorie</label>
                <select value={uploadForm.type}
                  onChange={e => setUploadForm({...uploadForm, type: e.target.value})}>
                  <option value="facture">🧾 Facture</option>
                  <option value="quittance">📋 Quittance</option>
                  <option value="contrat_bail">📜 Contrat de bail</option>
                  <option value="etat_lieux">🏠 État des lieux</option>
                  <option value="autre">📄 Autre</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:'12px'}}>
              <label>Fichier (PDF, Word, Image) *</label>
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e => setFichierManuel(e.target.files[0])} required />
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
              <button type="submit" className="btn btn-primary">📎 Uploader</button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setShowUpload(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="doc-filtres">
        {['', 'facture', 'quittance', 'contrat_bail', 'etat_lieux', 'autre'].map(t => (
          <button key={t}
            className={`filtre-btn ${filtreType === t ? 'active' : ''}`}
            onClick={() => setFiltreType(t)}>
            {t === '' ? '📁 Tous' : `${icones[t]} ${labels[t]}s`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dash-empty">⏳ Chargement...</div>
      ) : documents.length === 0 ? (
        <div className="dash-empty-state">
          <span>📄</span>
          <h3>Aucun document</h3>
          <p>Vos documents apparaîtront ici automatiquement après chaque paiement</p>
        </div>
      ) : (
        <div className="documents-liste">
          {documents.map(doc => (
            <div key={doc.id} className="document-item">
              <div className="doc-icone">{icones[doc.type] || '📄'}</div>
              <div className="doc-info">
                <strong>{doc.titre}</strong>
                <span>
                  {labels[doc.type]}
                  {doc.logement_titre ? ` • 🏠 ${doc.logement_titre}` : ''}
                  {doc.logement_ville ? `, ${doc.logement_ville}` : ''}
                </span>
                <span>
                  📅 {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  {doc.est_manuel && ' • 📎 Manuel'}
                  {doc.email_envoye && ' • 📧 Email envoyé'}
                </span>
              </div>
              <div className="doc-statut">
                <span className={`badge badge-${doc.statut === 'envoye' ? 'confirmee' : 'en_attente'}`}>
                  {doc.statut === 'genere' ? '📄 Généré'
                    : doc.statut === 'envoye' ? '📧 Envoyé'
                    : doc.statut === 'signe' ? '✅ Signé' : '❌ Annulé'}
                </span>
              </div>
              <div className="doc-actions">
                {!doc.est_manuel && (
                  <button className="btn-doc btn-telecharger"
                    onClick={() => handleTelecharger(doc)}>
                    ⬇️ Télécharger
                  </button>
                )}
                <button className="btn-doc btn-email"
                  onClick={() => handleRenvoyerEmail(doc.id)}>
                  📧 Email
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================================
// ONGLET : PARAMÈTRES
// ================================
const OngletParametres = ({ user }) => (
  <div className="dash-content">
    <div className="dash-page-header">
      <div>
        <h1>⚙️ Paramètres</h1>
        <p>Gérez votre compte et vos préférences</p>
      </div>
    </div>
    <div className="parametres-grid">
      <Link to="/profil" className="param-card">
        <span className="param-icon">👤</span>
        <div>
          <strong>Mon profil</strong>
          <p>Modifier mes informations personnelles</p>
        </div>
        <span className="param-arrow">→</span>
      </Link>
      <Link to="/profil" className="param-card">
        <span className="param-icon">🔐</span>
        <div>
          <strong>Mot de passe</strong>
          <p>Changer mon mot de passe</p>
        </div>
        <span className="param-arrow">→</span>
      </Link>
      <div className="param-card param-info">
        <span className="param-icon">ℹ️</span>
        <div>
          <strong>Mon compte</strong>
          <p>Email : {user?.email}</p>
          <p>Rôle : {user?.role}</p>
        </div>
      </div>
    </div>
  </div>
);

// ================================
// ONGLET : MES LOCATIONS (locataire)
// ================================
const OngletMesLocations = ({ stats }) => (
  <div className="dash-content">
    <div className="dash-page-header">
      <div>
        <h1>🏠 Mes locations</h1>
        <p>Logements que vous louez actuellement</p>
      </div>
      <Link to="/logements" className="btn btn-primary">🔍 Chercher un logement</Link>
    </div>
    {stats.reservations.filter(r => r.statut === 'confirmee').length === 0 ? (
      <div className="dash-empty-state">
        <span>🏠</span>
        <h3>Aucune location active</h3>
        <p>Recherchez et réservez un logement pour commencer</p>
        <Link to="/logements" className="btn btn-primary">🔍 Trouver un logement</Link>
      </div>
    ) : (
      <div className="locations-grid">
        {stats.reservations.filter(r => r.statut === 'confirmee').map(r => (
          <div key={r.id} className="location-card">
            <div className="location-icon">🏠</div>
            <div className="location-info">
              <h4>{r.logement_titre}</h4>
              <p>📍 {r.logement_ville}</p>
              <p>📅 Depuis le {new Date(r.date_debut).toLocaleDateString('fr-FR')}</p>
              <p>💰 {Number(r.montant_total).toLocaleString()} GNF</p>
            </div>
            <span className="badge badge-confirmee">✅ Active</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ================================
// DASHBOARD PRINCIPAL
// ================================
const Dashboard = () => {
  const { user } = useAuth();
  const [onglet, setOnglet] = useState('/dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    logements: [], reservations: [], paiements: []
  });

  useEffect(() => {
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      if (user?.role === 'proprietaire' || user?.role === 'les_deux') {
        const [logRes, resaRes, paiRes] = await Promise.all([
          api.get('/logements/proprietaire/mes-logements'),
          api.get('/reservations/proprietaire'),
          api.get('/paiements/proprietaire')
        ]);
        setStats({
          logements: logRes.data.logements,
          reservations: resaRes.data.reservations,
          paiements: paiRes.data.paiements
        });
      } else {
        const [resaRes, paiRes] = await Promise.all([
          api.get('/reservations/mes-reservations'),
          api.get('/paiements/mes-paiements')
        ]);
        setStats({ logements: [], reservations: resaRes.data.reservations, paiements: paiRes.data.paiements });
      }
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const traiterReservation = async (id, statut) => {
    try {
      await api.patch(`/reservations/${id}/traiter`, { statut });
      toast.success(statut === 'confirmee' ? '✅ Réservation confirmée !' : '❌ Réservation annulée');
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur lors du traitement');
    }
  };

  if (loading) return (
    <div className="dashboard-wrapper">
      <div className="dash-loading">⏳ Chargement...</div>
    </div>
  );

  const renderOnglet = () => {
    switch (onglet) {
      case '/dashboard': return <OngletOverview stats={stats} user={user} />;
      case '/dashboard/biens': return <OngletBiens stats={stats} recharger={chargerDonnees} />;
      case '/dashboard/locataires': return <OngletLocataires stats={stats} logements={stats.logements} />;
      case '/dashboard/reservations': return <OngletReservations stats={stats} traiterReservation={traiterReservation} user={user} />;
      case '/dashboard/paiements': return <OngletPaiements stats={stats} />;
      case '/dashboard/factures': return <OngletFactures stats={stats} />;
      case '/dashboard/documents': return <OngletDocuments user={user} />;
      case '/dashboard/mes-locations': return <OngletMesLocations stats={stats} />;
      case '/dashboard/parametres': return <OngletParametres user={user} />;
      default: return <OngletOverview stats={stats} user={user} />;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar ongletActif={onglet} setOnglet={setOnglet} />
      <div className="dashboard-main">{renderOnglet()}</div>
    </div>
  );
};

export default Dashboard;