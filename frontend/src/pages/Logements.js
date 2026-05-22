import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CarteLogement from '../components/CarteLogement';
import CarteLeaflet from '../components/CarteLeaflet';
import './Logements.css';

const CATEGORIES = [
  { value: '', label: 'Tous', icon: '🏘️' },
  { value: 'villa_luxe', label: 'Villa luxe', icon: '👑' },
  { value: 'villa_standard', label: 'Villa', icon: '🏰' },
  { value: 'maison_moderne', label: 'Maison', icon: '🏠' },
  { value: 'maison_banco', label: 'Maison trad.', icon: '🛖' },
  { value: 'concession', label: 'Concession', icon: '🏘️' },
  { value: 'appartement', label: 'Appartement', icon: '🏢' },
  { value: 'duplex', label: 'Duplex', icon: '🏬' },
  { value: 'studio_moderne', label: 'Studio', icon: '🏨' },
  { value: 'chambre_habitant', label: 'Chambre', icon: '🛏️' },
  { value: 'boutique', label: 'Boutique', icon: '🏪' },
  { value: 'bureau', label: 'Bureau', icon: '💼' },
  { value: 'local_commercial', label: 'Local comm.', icon: '🏬' }
];

const Logements = () => {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState('liste'); // 'liste' ou 'carte'

  const [filtres, setFiltres] = useState({
    ville: '', prix_min: '', prix_max: '',
    nb_chambres: '', categorie: ''
  });

  useEffect(() => { chargerLogements(); }, []);

  const chargerLogements = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/logements', { params });
      setLogements(response.data.logements);
    } catch (err) {
      console.error('Erreur chargement logements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecherche = (e) => {
    e.preventDefault();
    const params = Object.fromEntries(
      Object.entries(filtres).filter(([_, v]) => v !== '')
    );
    chargerLogements(params);
  };

  const handleReset = () => {
    setFiltres({ ville: '', prix_min: '', prix_max: '', nb_chambres: '', categorie: '' });
    chargerLogements();
  };

  const handleCategorie = (cat) => {
    const nouveauxFiltres = { ...filtres, categorie: cat };
    setFiltres(nouveauxFiltres);
    const params = Object.fromEntries(
      Object.entries(nouveauxFiltres).filter(([_, v]) => v !== '')
    );
    chargerLogements(params);
  };

  return (
    <div>
      <Navbar />
      <div className="logements-page">

        {/* Barre catégories */}
        <div className="categories-bar">
          <div className="container">
            <div className="categories-list">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  className={`cat-btn ${filtres.categorie === cat.value ? 'active' : ''}`}
                  onClick={() => handleCategorie(cat.value)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="recherche-bar">
          <div className="container">
            <form onSubmit={handleRecherche} className="recherche-form">
              <input type="text" placeholder="🏙 Ville (ex: Conakry)"
                value={filtres.ville}
                onChange={(e) => setFiltres({...filtres, ville: e.target.value})} />
              <input type="number" placeholder="💰 Prix min (GNF)"
                value={filtres.prix_min}
                onChange={(e) => setFiltres({...filtres, prix_min: e.target.value})} />
              <input type="number" placeholder="💰 Prix max (GNF)"
                value={filtres.prix_max}
                onChange={(e) => setFiltres({...filtres, prix_max: e.target.value})} />
              <select value={filtres.nb_chambres}
                onChange={(e) => setFiltres({...filtres, nb_chambres: e.target.value})}>
                <option value="">🛏 Chambres</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              <button type="submit" className="btn btn-primary">Rechercher</button>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                Réinitialiser
              </button>
            </form>
          </div>
        </div>

        {/* Contenu */}
        <div className="container">

          {/* Header avec toggle vue */}
          <div className="logements-header">
            <h3>
              {loading ? 'Chargement...' : `${logements.length} logement(s) trouvé(s)`}
              {filtres.categorie && (
                <span className="filtre-actif">
                  {CATEGORIES.find(c => c.value === filtres.categorie)?.icon}{' '}
                  {CATEGORIES.find(c => c.value === filtres.categorie)?.label}
                </span>
              )}
            </h3>

            {/* Toggle liste / carte */}
            <div className="vue-toggle">
              <button
                className={`vue-btn ${vue === 'liste' ? 'active' : ''}`}
                onClick={() => setVue('liste')}
              >
                ▦ Liste
              </button>
              <button
                className={`vue-btn ${vue === 'carte' ? 'active' : ''}`}
                onClick={() => setVue('carte')}
              >
                🗺️ Carte
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">⏳ Chargement des logements...</div>
          ) : logements.length === 0 ? (
            <div className="empty">
              <p>😔 Aucun logement trouvé</p>
              <button className="btn btn-primary" onClick={handleReset}>
                Voir tous les logements
              </button>
            </div>
          ) : vue === 'liste' ? (
            <div className="logements-grid">
              {logements.map(logement => (
                <CarteLogement key={logement.id} logement={logement} />
              ))}
            </div>
          ) : (
            /* VUE CARTE */
            <div className="vue-carte-container">
              <CarteLeaflet logements={logements} hauteur="600px" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Logements;