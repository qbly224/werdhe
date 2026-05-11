import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './Reserver.css';

const Reserver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState('');

  // Type de location
  const [typeDuree, setTypeDuree] = useState('longue_duree');

  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    duree_mois: 1
  });

  // Charger les détails du logement
  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get(`/logements/${id}`);
        setLogement(res.data.logement);
      } catch (err) {
        toast.error('Logement non trouvé');
        navigate('/logements');
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id, navigate]);

  // Calculer le montant estimé
  const calculerMontant = () => {
    if (!logement) return 0;
    if (typeDuree === 'longue_duree') {
      return logement.prix_mensuel * formData.duree_mois;
    }
    if (formData.date_debut && formData.date_fin) {
      const debut = new Date(formData.date_debut);
      const fin = new Date(formData.date_fin);
      const mois = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24 * 30));
      return logement.prix_mensuel * (mois > 0 ? mois : 1);
    }
    return logement.prix_mensuel;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setSubmitting(true);

    try {
      const payload = {
        logement_id: id,
        date_debut: formData.date_debut,
        type_location: typeDuree
      };

      // Ajouter date_fin ou duree_mois selon le type
      if (typeDuree === 'courte_duree') {
        payload.date_fin = formData.date_fin;
      } else {
        payload.duree_mois = formData.duree_mois;
      }

      await api.post('/reservations', payload);
      toast.success('✅ Réservation envoyée ! En attente de confirmation.');
      navigate('/dashboard');

    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div><Navbar /><div style={{textAlign:'center',padding:'100px'}}>⏳ Chargement...</div></div>
  );

  return (
    <div>
      <Navbar />
      <div className="reserver-page">
        <div className="container">
          <div className="reserver-grid">

            {/* Formulaire */}
            <div className="reserver-form-card">
              <h1>📅 Réserver ce logement</h1>

              {erreur && <div className="error">{erreur}</div>}

              <form onSubmit={handleSubmit}>

                {/* Type de durée */}
                <div className="type-duree">
                  <button
                    type="button"
                    className={`type-btn ${typeDuree === 'longue_duree' ? 'active' : ''}`}
                    onClick={() => setTypeDuree('longue_duree')}
                  >
                    🏠 Longue durée
                    <small>Sans date de fin fixe</small>
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${typeDuree === 'courte_duree' ? 'active' : ''}`}
                    onClick={() => setTypeDuree('courte_duree')}
                  >
                    📅 Courte durée
                    <small>Avec date de fin</small>
                  </button>
                </div>

                {/* Date de début */}
                <label>Date d'entrée *</label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({
                    ...formData, date_debut: e.target.value
                  })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />

                {/* Longue durée → nombre de mois */}
                {typeDuree === 'longue_duree' && (
                  <>
                    <label>Durée estimée (mois)</label>
                    <select
                      value={formData.duree_mois}
                      onChange={(e) => setFormData({
                        ...formData, duree_mois: parseInt(e.target.value)
                      })}
                    >
                      <option value={1}>1 mois</option>
                      <option value={3}>3 mois</option>
                      <option value={6}>6 mois</option>
                      <option value={12}>1 an</option>
                      <option value={24}>2 ans</option>
                      <option value={36}>3 ans</option>
                    </select>
                    <small style={{color:'var(--gray)', fontSize:'12px'}}>
                      💡 La date de fin peut être définie plus tard avec le propriétaire
                    </small>
                  </>
                )}

                {/* Courte durée → date de fin */}
                {typeDuree === 'courte_duree' && (
                  <>
                    <label>Date de fin *</label>
                    <input
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({
                        ...formData, date_fin: e.target.value
                      })}
                      min={formData.date_debut ||
                        new Date().toISOString().split('T')[0]}
                      required
                    />
                  </>
                )}

                {/* Montant estimé */}
                <div className="montant-estime">
                  <span>💰 Montant estimé</span>
                  <strong>
                    {calculerMontant().toLocaleString()} GNF
                  </strong>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={submitting || !user}
                  style={{marginTop: '16px'}}
                >
                  {!user
                    ? 'Connectez-vous pour réserver'
                    : submitting
                    ? 'Envoi...'
                    : '📅 Envoyer la demande'}
                </button>

              </form>
            </div>

            {/* Récap logement */}
            <div className="reserver-recap">
              <div className="recap-card">
                <div className="recap-image">🏠</div>
                <div className="recap-body">
                  <h3>{logement.titre}</h3>
                  <p>📍 {logement.adresse}, {logement.ville}</p>
                  <p>🛏 {logement.nb_chambres} chambre(s)</p>
                  <p>🚿 {logement.nb_salles_bain} salle(s) de bain</p>
                  {logement.superficie && (
                    <p>📐 {logement.superficie} m²</p>
                  )}
                  <div className="recap-prix">
                    {Number(logement.prix_mensuel).toLocaleString()} GNF
                    <small>/mois</small>
                  </div>
                  <div className="recap-proprio">
                    <p>👤 Propriétaire</p>
                    <strong>
                      {logement.proprietaire_prenom} {logement.proprietaire_nom}
                    </strong>
                    <p>📞 {logement.proprietaire_telephone}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Reserver;