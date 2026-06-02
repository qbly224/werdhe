import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import './Reserver.css';

const Reserver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState('');
  const [reservationCreee, setReservationCreee] = useState(null);
  const [showModalPaiement, setShowModalPaiement] = useState(false);

  const [typeDuree, setTypeDuree] = useState('longue_duree');
  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    duree_mois: 1
  });

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get('/logements/' + id);
        setLogement(res.data.logement);
      } catch (err) {
        toast.error('Logement non trouve');
        navigate('/logements');
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id, navigate]);

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

      if (typeDuree === 'courte_duree') {
        payload.date_fin = formData.date_fin;
      } else {
        payload.duree_mois = formData.duree_mois;
      }

      const res = await api.post('/reservations', payload);
      const resa = res.data.reservation;
      resa.logement_titre = logement.titre;
      resa.montant_total = calculerMontant();
      setReservationCreee(resa);
      toast.success('Reservation creee ! Choisissez votre mode de paiement.');

    } catch (err) {
      setErreur(
        err.response && err.response.data
          ? err.response.data.erreur
          : 'Erreur lors de la reservation'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{textAlign:'center', padding:'100px'}}>Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="reserver-page">
        <div className="container">
          <div className="reserver-grid">

            <div className="reserver-form-card">
              <h1>Reserver ce logement</h1>

              {erreur && (
                <div className="error">{erreur}</div>
              )}

              {!reservationCreee && (
                <form onSubmit={handleSubmit}>

                  <div className="type-duree">
                    <button
                      type="button"
                      className={'type-btn ' + (typeDuree === 'longue_duree' ? 'active' : '')}
                      onClick={function() { setTypeDuree('longue_duree'); }}
                    >
                      Longue duree
                      <small>Sans date de fin fixe</small>
                    </button>
                    <button
                      type="button"
                      className={'type-btn ' + (typeDuree === 'courte_duree' ? 'active' : '')}
                      onClick={function() { setTypeDuree('courte_duree'); }}
                    >
                      Courte duree
                      <small>Avec date de fin</small>
                    </button>
                  </div>

                  <label>Date d'entree *</label>
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={function(e) { setFormData({ ...formData, date_debut: e.target.value }); }}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />

                  {typeDuree === 'longue_duree' && (
                    <div>
                      <label>Duree estimee (mois)</label>
                      <select
                        value={formData.duree_mois}
                        onChange={function(e) { setFormData({ ...formData, duree_mois: parseInt(e.target.value) }); }}
                      >
                        <option value={1}>1 mois</option>
                        <option value={3}>3 mois</option>
                        <option value={6}>6 mois</option>
                        <option value={12}>1 an</option>
                        <option value={24}>2 ans</option>
                        <option value={36}>3 ans</option>
                      </select>
                    </div>
                  )}

                  {typeDuree === 'courte_duree' && (
                    <div>
                      <label>Date de fin *</label>
                      <input
                        type="date"
                        value={formData.date_fin}
                        onChange={function(e) { setFormData({ ...formData, date_fin: e.target.value }); }}
                        min={formData.date_debut || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  )}

                  <div className="montant-estime">
                    <span>Montant estime</span>
                    <strong>{calculerMontant().toLocaleString()} GNF</strong>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={submitting || !user}
                    style={{marginTop:'16px'}}
                  >
                    {!user
                      ? 'Connectez-vous pour reserver'
                      : submitting
                      ? 'Envoi...'
                      : 'Envoyer la demande'}
                  </button>

                </form>
              )}

              {reservationCreee && (
                <div>
                  <div style={{
                    background:'#E8F5E9', borderRadius:'12px',
                    padding:'16px', marginBottom:'20px', textAlign:'center'
                  }}>
                    <div style={{fontSize:'32px', marginBottom:'8px'}}>✅</div>
                    <div style={{fontSize:'16px', fontWeight:'700', color:'#1B5E20', marginBottom:'4px'}}>
                      Reservation envoyee !
                    </div>
                    <div style={{fontSize:'13px', color:'#555', lineHeight:'1.5'}}>
                      En attente de confirmation du proprietaire.
                      Finalisez en payant votre premier loyer.
                    </div>
                  </div>

                  <div style={{
                    background:'#F8F9FA', borderRadius:'10px',
                    padding:'14px', marginBottom:'16px'
                  }}>
                    <div style={{fontSize:'12px', color:'#888', marginBottom:'4px'}}>Montant du premier loyer</div>
                    <div style={{fontSize:'22px', fontWeight:'800', color:'#1B6B3A'}}>
                      {Number(calculerMontant()).toLocaleString()} GNF
                    </div>
                    <div style={{fontSize:'12px', color:'#888'}}>{logement.titre}</div>
                  </div>

                  <button
                    type="button"
                    onClick={function() { setShowModalPaiement(true); }}
                    style={{
                      width:'100%', padding:'14px',
                      background:'linear-gradient(135deg, #FF6600, #FFCC00)',
                      color:'#fff', border:'none', borderRadius:'10px',
                      fontSize:'15px', fontWeight:'700', cursor:'pointer',
                      marginBottom:'10px'
                    }}
                  >
                    Payer par Mobile Money
                  </button>

                  <button
                    type="button"
                    onClick={function() { navigate('/dashboard'); }}
                    style={{
                      width:'100%', padding:'12px',
                      background:'#F0F4F1', color:'#1B6B3A',
                      border:'none', borderRadius:'10px',
                      fontSize:'14px', fontWeight:'600', cursor:'pointer'
                    }}
                  >
                    Payer plus tard (especes)
                  </button>
                </div>
              )}

            </div>

            <div className="reserver-recap">
              <div className="recap-card">
                <div className="recap-image">🏠</div>
                <div className="recap-body">
                  <h3>{logement.titre}</h3>
                  <p>📍 {logement.adresse}, {logement.ville}</p>
                  <p>🛏 {logement.nb_chambres} chambre(s)</p>
                  <p>🚿 {logement.nb_salles_bain} salle(s) de bain</p>
                  {logement.superficie && (
                    <p>📐 {logement.superficie} m2</p>
                  )}
                  <div className="recap-prix">
                    {Number(logement.prix_mensuel).toLocaleString()} GNF
                    <small>/mois</small>
                  </div>
                  <div className="recap-proprio">
                    <p>Proprietaire</p>
                    <strong>
                      {logement.proprietaire_prenom} {logement.proprietaire_nom}
                    </strong>
                    <p>{logement.proprietaire_telephone}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showModalPaiement && reservationCreee && (
        <ModalPaiementMobile
          reservation={reservationCreee}
          montant={calculerMontant()}
          onClose={function() { setShowModalPaiement(false); }}
          onSuccess={function() {
            setShowModalPaiement(false);
            toast.success('Paiement effectue ! Redirection vers votre espace...');
            setTimeout(function() { navigate('/dashboard'); }, 2000);
          }}
        />
      )}

    </div>
  );
};

export default Reserver;