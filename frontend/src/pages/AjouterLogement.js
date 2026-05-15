import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './AjouterLogement.css';

const CATEGORIES = [
  {
    value: 'appartement',
    label: 'Appartement',
    icon: '🏢',
    description: 'Logement dans un immeuble',
    hasChambres: true,
    hasSallesBain: true,
    hasSuperficie: true,
    chambresMin: 1,
    chambresMax: 10
  },
  {
    value: 'studio',
    label: 'Studio',
    icon: '🏨',
    description: 'Pièce unique avec kitchenette',
    hasChambres: false,
    hasSallesBain: true,
    hasSuperficie: true,
    chambresFixed: 1
  },
  {
    value: 'maison',
    label: 'Maison',
    icon: '🏠',
    description: 'Maison individuelle',
    hasChambres: true,
    hasSallesBain: true,
    hasSuperficie: true,
    chambresMin: 1,
    chambresMax: 20
  },
  {
    value: 'villa',
    label: 'Villa',
    icon: '👑',
    description: 'Villa de standing',
    hasChambres: true,
    hasSallesBain: true,
    hasSuperficie: true,
    chambresMin: 2,
    chambresMax: 20
  },
  {
    value: 'terrain',
    label: 'Terrain',
    icon: '🏗️',
    description: 'Terrain nu ou à bâtir',
    hasChambres: false,
    hasSallesBain: false,
    hasSuperficie: true,
    chambresFixed: 0,
    sallesBainFixed: 0
  },
  {
    value: 'local_commercial',
    label: 'Local commercial',
    icon: '🏪',
    description: 'Boutique, bureau, entrepôt...',
    hasChambres: false,
    hasSallesBain: false,
    hasSuperficie: true,
    chambresFixed: 0,
    sallesBainFixed: 0
  }
];

const VILLES = [
  'Conakry', 'Kindia', 'Kankan', 'Labé',
  'Mamou', 'Boké', 'Faranah', 'N\'Zérékoré',
  'Siguiri', 'Guékédou', 'Macenta', 'Kissidougou'
];

const AjouterLogement = () => {
  const navigate = useNavigate();

  const [etape, setEtape] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState(null);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    adresse: '',
    ville: '',
    pays: 'Guinée',
    prix_mensuel: '',
    nb_chambres: 1,
    nb_salles_bain: 1,
    superficie: '',
    categorie: ''
  });

  const handleSelectCategorie = (cat) => {
    setCategorieSelectionnee(cat);
    setFormData(prev => ({
      ...prev,
      categorie: cat.value,
      nb_chambres: cat.chambresFixed !== undefined
        ? cat.chambresFixed
        : cat.chambresMin || 1,
      nb_salles_bain: cat.sallesBainFixed !== undefined
        ? cat.sallesBainFixed
        : 1
    }));
    setEtape(2);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setLoading(true);

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
      <div className="ajouter-page">
        <div className="container">

          <div className="ajouter-header">
            <h1>🏠 Publier un logement</h1>
            <p>Mettez votre bien en location sur Werdhè</p>
          </div>

          <div className="etapes-indicator">
            <div className={`etape-dot ${etape >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <small>Catégorie</small>
            </div>
            <div className="etape-ligne" />
            <div className={`etape-dot ${etape >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <small>Détails</small>
            </div>
          </div>

          {/* ÉTAPE 1 — Choix catégorie */}
          {etape === 1 && (
            <div className="etape-card">
              <h2>Quel type de bien voulez-vous louer ?</h2>
              <p className="etape-subtitle">
                Le formulaire s'adaptera selon votre choix
              </p>
              <div className="categories-grid">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    className="categorie-card"
                    onClick={() => handleSelectCategorie(cat)}
                  >
                    <span className="categorie-icon">{cat.icon}</span>
                    <strong>{cat.label}</strong>
                    <small>{cat.description}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — Formulaire adapté */}
          {etape === 2 && categorieSelectionnee && (
            <div className="etape-card">

              <div className="categorie-recap">
                <span className="categorie-recap-icon">
                  {categorieSelectionnee.icon}
                </span>
                <div>
                  <strong>{categorieSelectionnee.label}</strong>
                  <small>{categorieSelectionnee.description}</small>
                </div>
                <button
                  className="btn-changer"
                  onClick={() => setEtape(1)}
                >
                  Changer
                </button>
              </div>

              {erreur && <div className="error">{erreur}</div>}

              <form onSubmit={handleSubmit}>

                <div className="form-group">
                  <label>Titre de l'annonce *</label>
                  <input
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={handleChange}
                    placeholder={
                      categorieSelectionnee.value === 'villa'
                        ? 'Ex: Belle villa avec piscine à Kipé'
                        : categorieSelectionnee.value === 'terrain'
                        ? 'Ex: Terrain clôturé de 500m² à Ratoma'
                        : categorieSelectionnee.value === 'local_commercial'
                        ? 'Ex: Local commercial au centre ville'
                        : 'Ex: Appartement moderne au centre-ville'
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ville *</label>
                  <select
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionnez une ville</option>
                    {VILLES.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Adresse précise *</label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Ex: Kipé, Ratoma, près du rond-point"
                    required
                  />
                </div>

                <div className="form-row-3">

                  {categorieSelectionnee.hasChambres ? (
                    <div className="form-group">
                      <label>Nombre de chambres *</label>
                      <div className="counter">
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            nb_chambres: Math.max(
                              categorieSelectionnee.chambresMin || 1,
                              prev.nb_chambres - 1
                            )
                          }))}
                        >−</button>
                        <span className="counter-val">
                          {formData.nb_chambres}
                        </span>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            nb_chambres: Math.min(
                              categorieSelectionnee.chambresMax || 20,
                              prev.nb_chambres + 1
                            )
                          }))}
                        >+</button>
                      </div>
                    </div>
                  ) : categorieSelectionnee.chambresFixed === 1 ? (
                    <div className="form-group">
                      <label>Chambres</label>
                      <div className="fixed-val">🏨 Studio (1 pièce)</div>
                    </div>
                  ) : null}

                  {categorieSelectionnee.hasSallesBain && (
                    <div className="form-group">
                      <label>Salles de bain *</label>
                      <div className="counter">
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            nb_salles_bain: Math.max(1, prev.nb_salles_bain - 1)
                          }))}
                        >−</button>
                        <span className="counter-val">
                          {formData.nb_salles_bain}
                        </span>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            nb_salles_bain: prev.nb_salles_bain + 1
                          }))}
                        >+</button>
                      </div>
                    </div>
                  )}

                  {categorieSelectionnee.hasSuperficie && (
                    <div className="form-group">
                      <label>
                        Superficie (m²)
                        {categorieSelectionnee.value === 'terrain' ? ' *' : ''}
                      </label>
                      <input
                        type="number"
                        name="superficie"
                        value={formData.superficie}
                        onChange={handleChange}
                        placeholder="Ex: 75"
                        required={categorieSelectionnee.value === 'terrain'}
                        min="1"
                      />
                    </div>
                  )}

                </div>

                <div className="form-group">
                  <label>Prix mensuel (GNF) *</label>
                  <div className="prix-input">
                    <input
                      type="number"
                      name="prix_mensuel"
                      value={formData.prix_mensuel}
                      onChange={handleChange}
                      placeholder="Ex: 500000"
                      required
                      min="1"
                    />
                    <span className="prix-devise">GNF / mois</span>
                  </div>
                  {formData.prix_mensuel && (
                    <small className="prix-affiche">
                      💰 {Number(formData.prix_mensuel).toLocaleString()} GNF par mois
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={
                      categorieSelectionnee.value === 'terrain'
                        ? 'Ex: Terrain clôturé, titre foncier disponible...'
                        : categorieSelectionnee.value === 'local_commercial'
                        ? 'Ex: Local au rez-de-chaussée, idéal pour boutique...'
                        : 'Ex: Appartement lumineux, bien ventilé, eau et électricité...'
                    }
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEtape(1)}
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Publication...' : '🚀 Publier le logement'}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AjouterLogement;