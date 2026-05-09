import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './LogementDetail.css';

const LogementDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState({
    date_debut: '',
    date_fin: ''
  });
  const [reservationLoading, setReservationLoading] = useState(false);

  useEffect(() => {
    chargerLogement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerLogement = async () => {
    try {
      const response = await api.get(`/logements/${id}`);
      setLogement(response.data.logement);
    } catch (err) {
      toast.error('Logement non trouvé');
      navigate('/logements');
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Connectez-vous pour réserver');
      navigate('/login');
      return;
    }
    setReservationLoading(true);
    try {
      await api.post('/reservations', {
        logement_id: id,
        date_debut: reservation.date_debut,
        date_fin: reservation.date_fin
      });
      toast.success('✅ Demande de réservation envoyée !');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur lors de la réservation');
    } finally {
      setReservationLoading(false);
    }
  };

  if (loading) return (
    <div><Navbar /><div className="detail-loading">⏳ Chargement...</div></div>
  );

  return (
    <div>
      <Navbar />
      <div className="detail-page">
        <div className="container">

          <button
            className="btn-retour"
            onClick={() => navigate('/logements')}
          >
            ← Retour aux logements
          </button>

          <div className="detail-grid">

            {/* Infos logement */}
            <div className="detail-main">

              <div className="detail-image">🏠</div>

              <div className="detail-content card">
                <div className="detail-top">
                  <div>
                    <h1>{logement.titre}</h1>
                    <p className="detail-adresse">
                      📍 {logement.adresse}, {logement.ville}, {logement.pays}
                    </p>
                  </div>
                  <span className={`badge badge-${logement.statut}`}>
                    {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
                  </span>
                </div>

                <div className="detail-specs">
                  <div className="spec">
                    <span className="spec-icon">🛏</span>
                    <span>{logement.nb_chambres} chambre(s)</span>
                  </div>
                  <div className="spec">
                    <span className="spec-icon">🚿</span>
                    <span>{logement.nb_salles_bain} salle(s) de bain</span>
                  </div>
                  {logement.superficie && (
                    <div className="spec">
                      <span className="spec-icon">📐</span>
                      <span>{logement.superficie} m²</span>
                    </div>
                  )}
                </div>

                {logement.description && (
                  <div className="detail-description">
                    <h3>Description</h3>
                    <p>{logement.description}</p>
                  </div>
                )}

                <div className="detail-proprietaire">
                  <h3>👤 Propriétaire</h3>
                  <p>{logement.proprietaire_prenom} {logement.proprietaire_nom}</p>
                  <p>📞 {logement.proprietaire_telephone}</p>
                </div>

              </div>
            </div>

            {/* Panneau réservation */}
            <div className="detail-sidebar">
              <div className="card reservation-panel">

                <div className="prix-header">
                  <span className="prix-grand">
                    {Number(logement.prix_mensuel).toLocaleString()} GNF
                  </span>
                  <span className="prix-periode">/mois</span>
                </div>

                {logement.statut === 'disponible' ? (
                  <form onSubmit={handleReservation}>
                    <label>Date de début *</label>
                    <input
                      type="date"
                      value={reservation.date_debut}
                      onChange={(e) => setReservation({
                        ...reservation,
                        date_debut: e.target.value
                      })}
                      required
                    />

                    <label>Date de fin</label>
                    <input
                      type="date"
                      value={reservation.date_fin}
                      onChange={(e) => setReservation({
                        ...reservation,
                        date_fin: e.target.value
                      })}
                    />

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={reservationLoading}
                    >
                      {reservationLoading
                        ? 'Envoi...'
                        : '📅 Demander une réservation'
                      }
                    </button>

                    {!user && (
                      <p className="login-hint">
                        Vous devez être connecté pour réserver
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="indisponible">
                    🔴 Ce logement n'est plus disponible
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LogementDetail;