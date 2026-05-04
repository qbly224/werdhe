import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CarteLogement from '../components/CarteLogement';
import './Logements.css';

const Logements = () => {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres de recherche
  const [filtres, setFiltres] = useState({
    ville: '',
    prix_min: '',
    prix_max: '',
    nb_chambres: ''
  });

  // Charger les logements au démarrage
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

  // Appliquer les filtres
  const handleRecherche = (e) => {
    e.preventDefault();
    // Supprimer les filtres vides
    const params = Object.fromEntries(
      Object.entries(filtres).filter(([_, v]) => v !== '')
    );
    chargerLogements(params);
  };

  // Réinitialiser les filtres
  const handleReset = () => {
    setFiltres({ ville: '', prix_min: '', prix_max: '', nb_chambres: '' });
    chargerLogements();
  };

  return (
    <div>
      <Navbar />

      <div className="logements-page">

        {/* Barre de recherche */}
        <div className="recherche-bar">
          <div className="container">
            <h2>🔍 Rechercher un logement</h2>
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
            </h3>
          </div>

          {loading ? (
            <div className="loading">⏳ Chargement des logements...</div>
          ) : logements.length === 0 ? (
            <div className="empty">
              <p>😔 Aucun logement trouvé</p>
              <button
                className="btn btn-primary"
                onClick={handleReset}
              >
                Voir tous les logements
              </button>
            </div>
          ) : (
            <div className="logements-grid">
              {logements.map(logement => (
                <CarteLogement
                  key={logement.id}
                  logement={logement}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Logements;