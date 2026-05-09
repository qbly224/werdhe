import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './AjouterLogement.css';

const AjouterLogement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    adresse: '',
    ville: '',
    pays: 'Guinée',
    prix_mensuel: '',
    nb_chambres: '1',
    nb_salles_bain: '1',
    superficie: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    try {
      await api.post('/logements', formData);
      toast.success('✅ Logement ajouté avec succès !');
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="ajouter-container">
        <div className="ajouter-card">

          <div className="ajouter-header">
            <h1>🏠 Ajouter un logement</h1>
            <p>Remplissez les informations de votre bien</p>
          </div>

          {erreur && <div className="error">{erreur}</div>}

          <form onSubmit={handleSubmit}>

            <label>Titre de l'annonce *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Ex: Appartement moderne à Kaloum"
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez votre logement..."
              rows="4"
            />

            <div className="form-row">
              <div>
                <label>Adresse *</label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Rue, quartier..."
                  required
                />
              </div>
              <div>
                <label>Ville *</label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Conakry"
                  required
                />
              </div>
            </div>

            <label>Pays</label>
            <input
              type="text"
              name="pays"
              value={formData.pays}
              onChange={handleChange}
              placeholder="Guinée"
            />

            <label>Prix mensuel (GNF) *</label>
            <input
              type="number"
              name="prix_mensuel"
              value={formData.prix_mensuel}
              onChange={handleChange}
              placeholder="Ex: 500000"
              required
            />

            <div className="form-row">
              <div>
                <label>Nombre de chambres</label>
                <select
                  name="nb_chambres"
                  value={formData.nb_chambres}
                  onChange={handleChange}
                >
                  {[1,2,3,4,5,6].map(n => (
                    <option key={n} value={n}>{n} chambre(s)</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Salles de bain</label>
                <select
                  name="nb_salles_bain"
                  value={formData.nb_salles_bain}
                  onChange={handleChange}
                >
                  {[1,2,3,4].map(n => (
                    <option key={n} value={n}>{n} salle(s)</option>
                  ))}
                </select>
              </div>
            </div>

            <label>Superficie (m²)</label>
            <input
              type="number"
              name="superficie"
              value={formData.superficie}
              onChange={handleChange}
              placeholder="Ex: 65"
            />

            <div className="ajouter-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Ajout en cours...' : '✅ Publier le logement'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AjouterLogement;