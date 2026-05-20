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

    {/* Stats cards */}
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

    {/* Deux colonnes */}
    <div className="dash-two-cols">

      {/* Paiements récents */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3>💰 Paiements récents</h3>
        </div>
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

      {/* Aperçu des biens */}
      {user?.role !== 'locataire' && (
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>🏠 Aperçu des biens</h3>
          </div>
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
          <div className="biens-table">
            <div className="table-header">
              <span>Bien</span>
              <span>Localisation</span>
              <span>Prix/mois</span>
              <span>Statut</span>
              <span>Photos</span>
              <span>Actions</span>
            </div>
            {stats.logements.map(l => {
              const photos = l.photos
                ? (typeof l.photos === 'string'
                    ? JSON.parse(l.photos) : l.photos)
                : [];
              return (
                <div key={l.id} className="table-row">
                  <span className="table-titre">{l.titre}</span>
                  <span>{l.ville}</span>
                  <span>{Number(l.prix_mensuel).toLocaleString()} GNF</span>
                  <span>
                    <span className={`badge badge-${l.statut}`}>
                      {l.statut === 'disponible' ? '✅ Disponible'
                        : l.statut === 'loue' ? '🔴 Loué' : '⏸ Suspendu'}
                    </span>
                  </span>
                  <span>📸 {photos.length} photo(s)</span>
                  <span className="table-actions">
                    <Link
                      to={`/logements/${l.id}`}
                      className="btn-action btn-voir"
                    >👁 Voir</Link>
                    <button
                      className="btn-action btn-photos"
                      onClick={() => setLogementSelectionne(
                        logementSelectionne?.id === l.id ? null : l
                      )}
                    >📸 Photos</button>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Section upload photos */}
          {logementSelectionne && (
            <div className="photos-section">
              <h3>
                📸 Photos de : {logementSelectionne.titre}
                <button
                  className="btn-fermer"
                  onClick={() => setLogementSelectionne(null)}
                >✕</button>
              </h3>
              <PhotoUpload
                logementId={logementSelectionne.id}
                photosInitiales={
                  logementSelectionne.photos
                    ? (typeof logementSelectionne.photos === 'string'
                        ? JSON.parse(logementSelectionne.photos)
                        : logementSelectionne.photos)
                    : []
                }
                onUpdate={recharger}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ================================
// ONGLET : LOCATAIRES
// ================================
const OngletLocataires = ({ stats }) => {
  // Extraire les locataires uniques depuis les réservations
  const locataires = stats.reservations.reduce((acc, r) => {
    if (r.locataire_nom && !acc.find(l => l.email === r.locataire_email)) {
      acc.push({
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
          <p>{locataires.length} locataire(s)</p>
        </div>
      </div>

      {locataires.length === 0 ? (
        <div className="dash-empty-state">
          <span>👥</span>
          <h3>Aucun locataire pour le moment</h3>
          <p>Vos locataires apparaîtront ici dès qu'une réservation sera confirmée</p>
        </div>
      ) : (
        <div className="locataires-grid">
          {locataires.map((l, i) => (
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
                <p>👤 {r.locataire_prenom} {r.locataire_nom}
                  — {r.locataire_telephone}</p>
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
                  <button
                    className="btn btn-primary"
                    onClick={() => traiterReservation(r.id, 'confirmee')}
                  >✅ Confirmer</button>
                  <button
                    className="btn btn-danger"
                    onClick={() => traiterReservation(r.id, 'annulee')}
                  >❌ Refuser</button>
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
        <div className="table-header">
          <span>Facture</span>
          <span>Logement</span>
          <span>Mode</span>
          <span>Montant</span>
          <span>Date</span>
          <span>Statut</span>
        </div>
        {stats.paiements.map(p => (
          <div key={p.id} className="table-row">
            <span className="facture-num">{p.numero_facture}</span>
            <span>{p.logement_titre}</span>
            <span>
              {p.mode_paiement === 'en_ligne' ? '💳 En ligne' : '💵 Espèces'}
            </span>
            <span className="montant-cell">
              {Number(p.montant).toLocaleString()} GNF
            </span>
            <span>
              {new Date(p.created_at).toLocaleDateString('fr-FR')}
            </span>
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
        <p>Les factures générées apparaîtront ici</p>
      </div>
    ) : (
      <div className="factures-list">
        {stats.paiements
          .filter(p => p.statut === 'complete')
          .map(p => (
            <div key={p.id} className="facture-card">
              <div className="facture-icon">📄</div>
              <div className="facture-info">
                <strong>{p.numero_facture}</strong>
                <span>🏠 {p.logement_titre} — {p.logement_ville}</span>
                <span>
                  💳 {p.mode_paiement === 'en_ligne' ? 'En ligne' : 'Espèces'}
                </span>
                <span>
                  📅 {new Date(p.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="facture-montant">
                <strong>{Number(p.montant).toLocaleString()} GNF</strong>
                <span className="badge badge-complete">✅ Payée</span>
              </div>
            </div>
          ))
        }
      </div>
    )}
  </div>
);

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
      <Link to="/logements" className="btn btn-primary">
        🔍 Chercher un logement
      </Link>
    </div>

    {stats.reservations.filter(r => r.statut === 'confirmee').length === 0 ? (
      <div className="dash-empty-state">
        <span>🏠</span>
        <h3>Aucune location active</h3>
        <p>Recherchez et réservez un logement pour commencer</p>
        <Link to="/logements" className="btn btn-primary">
          🔍 Trouver un logement
        </Link>
      </div>
    ) : (
      <div className="locations-grid">
        {stats.reservations
          .filter(r => r.statut === 'confirmee')
          .map(r => (
            <div key={r.id} className="location-card">
              <div className="location-icon">🏠</div>
              <div className="location-info">
                <h4>{r.logement_titre}</h4>
                <p>📍 {r.logement_ville}</p>
                <p>📅 Depuis le {new Date(r.date_debut).toLocaleDateString('fr-FR')}</p>
                <p>💰 {Number(r.montant_total).toLocaleString()} GNF</p>
                <p>👤 {r.proprietaire_prenom} {r.proprietaire_nom}
                  — {r.proprietaire_telephone}</p>
              </div>
              <span className="badge badge-confirmee">✅ Active</span>
            </div>
          ))
        }
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
    logements: [],
    reservations: [],
    paiements: []
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
        setStats({
          logements: [],
          reservations: resaRes.data.reservations,
          paiements: paiRes.data.paiements
        });
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
      toast.success(statut === 'confirmee'
        ? '✅ Réservation confirmée !'
        : '❌ Réservation annulée');
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

  // Rendu de l'onglet actif
  const renderOnglet = () => {
    switch (onglet) {
      case '/dashboard':
        return <OngletOverview stats={stats} user={user} />;
      case '/dashboard/biens':
        return <OngletBiens stats={stats} recharger={chargerDonnees} />;
      case '/dashboard/locataires':
        return <OngletLocataires stats={stats} />;
      case '/dashboard/reservations':
        return <OngletReservations
          stats={stats}
          traiterReservation={traiterReservation}
          user={user}
        />;
      case '/dashboard/paiements':
        return <OngletPaiements stats={stats} />;
      case '/dashboard/factures':
        return <OngletFactures stats={stats} />;
      case '/dashboard/mes-locations':
        return <OngletMesLocations stats={stats} />;
      case '/dashboard/documents':
        return <OngletDocuments user={user} />;  
      case '/dashboard/parametres':
        return <OngletParametres user={user} />;
      default:
        return <OngletOverview stats={stats} user={user} />;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar ongletActif={onglet} setOnglet={setOnglet} />
      <div className="dashboard-main">
        {renderOnglet()}
      </div>
    </div>
  );
};
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
      const res = await api.get(`/documents/${doc.id}/telecharger`, {
        responseType: 'blob'
      });
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

  const icones = {
    facture: '🧾',
    quittance: '📋',
    contrat_bail: '📜',
    etat_lieux: '🏠',
    autre: '📄'
  };

  const labels = {
    facture: 'Facture',
    quittance: 'Quittance',
    contrat_bail: 'Contrat de bail',
    etat_lieux: 'État des lieux',
    autre: 'Autre document'
  };

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

      {/* Formulaire génération */}
      {showGenerer && (
        <div className="doc-form-card">
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
                  onChange={e => setGenForm({...genForm, reservation_id: e.target.value})}
                  required>
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
              <button type="submit" className="btn btn-primary">
                ✨ Générer et envoyer par email
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setShowGenerer(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire upload manuel */}
      {showUpload && (
        <div className="doc-form-card">
          <h3>📎 Ajouter un document manuellement</h3>
          <form onSubmit={handleUploadManuel}>
            <div className="form-row-2" style={{gap:'16px'}}>
              <div>
                <label>Titre du document *</label>
                <input type="text" placeholder="Ex: Contrat signé"
                  value={uploadForm.titre}
                  onChange={e => setUploadForm({...uploadForm, titre: e.target.value})}
                  required />
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
              <input type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e => setFichierManuel(e.target.files[0])}
                required />
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
              <button type="submit" className="btn btn-primary">
                📎 Uploader
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => setShowUpload(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="doc-filtres">
        {['', 'facture', 'quittance', 'contrat_bail', 'etat_lieux', 'autre'].map(t => (
          <button key={t}
            className={`filtre-btn ${filtreType === t ? 'active' : ''}`}
            onClick={() => setFiltreType(t)}>
            {t === '' ? '📁 Tous' : `${icones[t]} ${labels[t]}s`}
          </button>
        ))}
      </div>

      {/* Liste documents */}
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
                  {labels[doc.type]} •
                  {doc.logement_titre ? ` 🏠 ${doc.logement_titre}` : ''}
                  {doc.logement_ville ? `, ${doc.logement_ville}` : ''}
                </span>
                <span>
                  📅 {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  {doc.est_manuel && ' • 📎 Ajouté manuellement'}
                  {doc.email_envoye && ' • 📧 Email envoyé'}
                </span>
              </div>
              <div className="doc-statut">
                <span className={`badge badge-${doc.statut === 'envoye' ? 'confirmee' : 'en_attente'}`}>
                  {doc.statut === 'genere' ? '📄 Généré'
                    : doc.statut === 'envoye' ? '📧 Envoyé'
                    : doc.statut === 'signe' ? '✅ Signé'
                    : '❌ Annulé'}
                </span>
              </div>
              <div className="doc-actions">
                {!doc.est_manuel && (
                  <button className="btn-doc btn-telecharger"
                    onClick={() => handleTelecharger(doc)}
                    title="Télécharger">
                    ⬇️ Télécharger
                  </button>
                )}
                <button className="btn-doc btn-email"
                  onClick={() => handleRenvoyerEmail(doc.id)}
                  title="Renvoyer par email">
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
export default Dashboard;