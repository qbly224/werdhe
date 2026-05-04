import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    logements: [],
    reservations: [],
    paiements: []
  });
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState('overview');

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      // Charger les données selon le rôle
      if (user.role === 'proprietaire' || user.role === 'les_deux') {
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

  // Confirmer une réservation (propriétaire)
  const traiterReservation = async (id, statut) => {
    try {
      await api.patch(`/reservations/${id}/traiter`, { statut });
      toast.success(statut === 'confirmee'
        ? '✅ Réservation confirmée !'
        : '❌ Réservation annulée'
      );
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur lors du traitement');
    }
  };

  if (loading) return (
    <div>
      <Navbar />
      <div className="dashboard-loading">⏳ Chargement...</div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="dashboard">
        <div className="container">

          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1>Bonjour, {user.prenom} 👋</h1>
              <p>
                {user.role === 'proprietaire' && '🏠 Espace Propriétaire'}
                {user.role === 'locataire' && '🔍 Espace Locataire'}
                {user.role === 'les_deux' && '🔄 Espace Propriétaire & Locataire'}
              </p>
            </div>
            {(user.role === 'proprietaire' || user.role === 'les_deux') && (
              <Link to="/logements/ajouter" className="btn btn-primary">
                + Ajouter un logement
              </Link>
            )}
          </div>

          {/* Statistiques rapides */}
          <div className="stats-cards">
            {(user.role === 'proprietaire' || user.role === 'les_deux') && (
              <div className="stat-card-dash">
                <span className="stat-icon">🏠</span>
                <span className="stat-val">{stats.logements.length}</span>
                <span className="stat-lbl">Logement(s)</span>
              </div>
            )}
            <div className="stat-card-dash">
              <span className="stat-icon">📅</span>
              <span className="stat-val">{stats.reservations.length}</span>
              <span className="stat-lbl">Réservation(s)</span>
            </div>
            <div className="stat-card-dash">
              <span className="stat-icon">💰</span>
              <span className="stat-val">{stats.paiements.length}</span>
              <span className="stat-lbl">Paiement(s)</span>
            </div>
            <div className="stat-card-dash">
              <span className="stat-icon">✅</span>
              <span className="stat-val">
                {stats.paiements.filter(p => p.statut === 'complete').length}
              </span>
              <span className="stat-lbl">Facture(s)</span>
            </div>
          </div>

          {/* Onglets */}
          <div className="onglets">
            <button
              className={`onglet ${onglet === 'reservations' ? 'active' : ''}`}
              onClick={() => setOnglet('reservations')}
            >
              📅 Réservations
            </button>
            {(user.role === 'proprietaire' || user.role === 'les_deux') && (
              <button
                className={`onglet ${onglet === 'logements' ? 'active' : ''}`}
                onClick={() => setOnglet('logements')}
              >
                🏠 Mes logements
              </button>
            )}
            <button
              className={`onglet ${onglet === 'paiements' ? 'active' : ''}`}
              onClick={() => setOnglet('paiements')}
            >
              💰 Paiements
            </button>
          </div>

          {/* Contenu onglets */}
          <div className="onglet-content">

            {/* Réservations */}
            {onglet === 'reservations' && (
              <div>
                <h2>📅 Réservations</h2>
                {stats.reservations.length === 0 ? (
                  <p className="empty-msg">Aucune réservation pour le moment.</p>
                ) : (
                  stats.reservations.map(r => (
                    <div key={r.id} className="reservation-card">
                      <div className="reservation-info">
                        <h4>{r.logement_titre}</h4>
                        <p>📍 {r.logement_ville}</p>
                        <p>📅 Du {new Date(r.date_debut).toLocaleDateString('fr-FR')}
                          {r.date_fin && ` au ${new Date(r.date_fin).toLocaleDateString('fr-FR')}`}
                        </p>
                        <p>💰 {Number(r.montant_total).toLocaleString()} GNF</p>
                        {r.locataire_nom && (
                          <p>👤 {r.locataire_prenom} {r.locataire_nom} — {r.locataire_telephone}</p>
                        )}
                      </div>
                      <div className="reservation-actions">
                        <span className={`badge badge-${r.statut}`}>
                          {r.statut === 'en_attente' && '⏳ En attente'}
                          {r.statut === 'confirmee' && '✅ Confirmée'}
                          {r.statut === 'annulee' && '❌ Annulée'}
                          {r.statut === 'terminee' && '🏁 Terminée'}
                        </span>
                        {user.role !== 'locataire' && r.statut === 'en_attente' && (
                          <div className="action-buttons">
                            <button
                              className="btn btn-primary"
                              onClick={() => traiterReservation(r.id, 'confirmee')}
                            >
                              ✅ Confirmer
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => traiterReservation(r.id, 'annulee')}
                            >
                              ❌ Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Mes logements */}
            {onglet === 'logements' && (
              <div>
                <h2>🏠 Mes logements</h2>
                {stats.logements.length === 0 ? (
                  <div className="empty-msg">
                    <p>Vous n'avez pas encore de logement.</p>
                    <Link to="/logements/ajouter" className="btn btn-primary">
                      + Ajouter mon premier logement
                    </Link>
                  </div>
                ) : (
                  stats.logements.map(l => (
                    <div key={l.id} className="logement-card-dash">
                      <div>
                        <h4>{l.titre}</h4>
                        <p>📍 {l.adresse}, {l.ville}</p>
                        <p>💰 {Number(l.prix_mensuel).toLocaleString()} GNF/mois</p>
                      </div>
                      <span className={`badge badge-${l.statut}`}>
                        {l.statut === 'disponible' && '✅ Disponible'}
                        {l.statut === 'loue' && '🔴 Loué'}
                        {l.statut === 'suspendu' && '⏸ Suspendu'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Paiements */}
            {onglet === 'paiements' && (
              <div>
                <h2>💰 Paiements & Factures</h2>
                {stats.paiements.length === 0 ? (
                  <p className="empty-msg">Aucun paiement pour le moment.</p>
                ) : (
                  stats.paiements.map(p => (
                    <div key={p.id} className="paiement-card">
                      <div>
                        <h4>Facture {p.numero_facture}</h4>
                        <p>🏠 {p.logement_titre} — {p.logement_ville}</p>
                        <p>💳 {p.mode_paiement === 'en_ligne' ? 'En ligne' : 'Espèces'}</p>
                        <p>📅 {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="paiement-right">
                        <span className="paiement-montant">
                          {Number(p.montant).toLocaleString()} GNF
                        </span>
                        <span className={`badge badge-${p.statut}`}>
                          {p.statut === 'complete' && '✅ Payé'}
                          {p.statut === 'en_attente' && '⏳ En attente'}
                          {p.statut === 'echoue' && '❌ Échoué'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;