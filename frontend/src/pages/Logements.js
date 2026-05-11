import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CarteLogement from '../components/CarteLogement';
import './Logements.css';

// Catégories avec icônes et labels
const CATEGORIES = [
  { value: '', label: 'Tous', icon: '🏘️' },
  { value: 'appartement', label: 'Appartement', icon: '🏢' },
  { value: 'studio', label: 'Studio', icon: '🏨' },
  { value: 'maison', label: 'Maison', icon: '🏠' },
  { value: 'villa', label: 'Villa', icon: '👑' },
  { value: 'terrain', label: 'Terrain', icon: '🏗️' },
  { value: 'local_commercial', label: 'Local commercial', icon: '🏪' }
];

const Logements = () => {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtres, setFiltres] = useState({
    ville: '',
    prix_min: '',
    prix_max: '',
    nb_chambres: '',
    categorie: ''
  });

  useEffect(() => {
    chargerLogements();
  }, []);

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
    setFiltres({
      ville: '',
      prix_min: '',
      prix_max: '',
      nb_chambres: '',
      categorie: ''
    });
    chargerLogements();
  };

  // Filtrer par catégorie directement
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

        {/* Filtres par catégorie */}
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

              <input
                type="text"
                placeholder="🏙 Ville (ex: Conakry)"
                value={filtres.ville}
                onChange={(e) => setFiltres({...filtres, ville: e.target.value})}
              />

              <input
                type="number"
                placeholder="💰 Prix min (GNF)"
                value={filtres.prix_min}
                onChange={(e) => setFiltres({...filtres, prix_min: e.target.value})}
              />

              <input
                type="number"
                placeholder="💰 Prix max (GNF)"
                value={filtres.prix_max}
                onChange={(e) => setFiltres({...filtres, prix_max: e.target.value})}
              />

              <select
                value={filtres.nb_chambres}
                onChange={(e) => setFiltres({...filtres, nb_chambres: e.target.value})}
              >
                <option value="">🛏 Chambres</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>

              <button type="submit" className="btn btn-primary">
                Rechercher
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
              >
                Réinitialiser
              </button>

            </form>
          </div>
        </div>

        {/* Résultats */}
        <div className="container">
          <div className="logements-header">
            <h3>
              {loading
                ? 'Chargement...'
                : `${logements.length} logement(s) trouvé(s)`
              }
              {filtres.categorie && (
                <span className="filtre-actif">
                  {CATEGORIES.find(c => c.value === filtres.categorie)?.icon}{' '}
                  {CATEGORIES.find(c => c.value === filtres.categorie)?.label}
                </span>
              )}
            </h3>
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
          ) : (
            <div className="logements-grid">
              {logements.map(logement => (
                <CarteLogement key={logement.id} logement={logement} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Logements;