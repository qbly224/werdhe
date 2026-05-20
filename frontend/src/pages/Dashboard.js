import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
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
const OngletBiens = ({ stats, recharger }) => (
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
        <p>Publiez votre premier logement pour commencer à recevoir des locataires</p>
        <Link to="/logements/ajouter" className="btn btn-primary">
          + Ajouter mon premier bien
        </Link>
      </div>
    ) : (
      <div className="biens-table">
        <div className="table-header">
          <span>Bien</span>
          <span>Localisation</span>
          <span>Catégorie</span>
          <span>Prix/mois</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>
        {stats.logements.map(l => (
          <div key={l.id} className="table-row">
            <span className="table-titre">{l.titre}</span>
            <span>{l.ville}</span>
            <span>{l.categorie || 'N/A'}</span>
            <span>{Number(l.prix_mensuel).toLocaleString()} GNF</span>
            <span>
              <span className={`badge badge-${l.statut}`}>
                {l.statut === 'disponible' ? '✅ Disponible'
                  : l.statut === 'loue' ? '🔴 Loué'
                  : '⏸ Suspendu'}
              </span>
            </span>
            <span className="table-actions">
              <Link
                to={`/logements/${l.id}`}
                className="btn-action btn-voir"
              >
                👁 Voir
              </Link>
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

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

export default Dashboard;