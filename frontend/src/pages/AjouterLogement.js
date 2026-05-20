import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import PhotoUpload from '../components/PhotoUpload';
import toast from 'react-hot-toast';
import './AjouterLogement.css';

const CATEGORIES = [
  {
    groupe: '🏰 Villas',
    types: [
      { value: 'villa_luxe', label: 'Villa de luxe', icon: '👑',
        description: '4+ chambres, piscine, jardin, gardien',
        hasChambres: true, chambresMin: 4, chambresMax: 20,
        hasSallesBain: true, hasSuperficie: true },
      { value: 'villa_standard', label: 'Villa standard', icon: '🏰',
        description: '3-4 chambres, cour, clôture',
        hasChambres: true, chambresMin: 3, chambresMax: 10,
        hasSallesBain: true, hasSuperficie: true }
    ]
  },
  {
    groupe: '🏠 Maisons',
    types: [
      { value: 'maison_moderne', label: 'Maison moderne', icon: '🏠',
        description: 'Construction en dur, parpaings/ciment',
        hasChambres: true, chambresMin: 1, chambresMax: 15,
        hasSallesBain: true, hasSuperficie: true },
      { value: 'maison_banco', label: 'Maison traditionnelle', icon: '🛖',
        description: 'Murs en banco, toit en tôle ou chaume',
        hasChambres: true, chambresMin: 1, chambresMax: 8,
        hasSallesBain: true, hasSuperficie: true },
      { value: 'maison_chantier', label: 'Maison en construction', icon: '🏗️',
        description: 'Rez-de-chaussée habitable, étage en attente',
        hasChambres: true, chambresMin: 1, chambresMax: 10,
        hasSallesBain: true, hasSuperficie: true },
      { value: 'concession', label: 'Concession familiale', icon: '🏘️',
        description: 'Plusieurs logements autour d\'une cour commune',
        hasChambres: true, chambresMin: 1, chambresMax: 30,
        hasSallesBain: true, hasSuperficie: true }
    ]
  },
  {
    groupe: '🏢 Appartements',
    types: [
      { value: 'appartement', label: 'Appartement (F2, F3, F4...)', icon: '🏢',
        description: 'Logement dans un immeuble collectif',
        hasChambres: true, chambresMin: 1, chambresMax: 8,
        hasSallesBain: true, hasSuperficie: true },
      { value: 'duplex', label: 'Duplex', icon: '🏬',
        description: 'Appartement sur deux niveaux',
        hasChambres: true, chambresMin: 2, chambresMax: 8,
        hasSallesBain: true, hasSuperficie: true },
      { value: 'logement_social', label: 'Logement social', icon: '🏛️',
        description: 'Programme Sonapi, Addoha...',
        hasChambres: true, chambresMin: 1, chambresMax: 5,
        hasSallesBain: true, hasSuperficie: true }
    ]
  },
  {
    groupe: '🏨 Chambres & Studios',
    types: [
      { value: 'studio_moderne', label: 'Studio moderne', icon: '🏨',
        description: '1 pièce + sanitaires internes',
        hasChambres: false, chambresFixed: 1,
        hasSallesBain: true, hasSuperficie: true },
      { value: 'chambre_habitant', label: 'Chambre chez l\'habitant', icon: '🛏️',
        description: 'Une pièce, sanitaires communs',
        hasChambres: false, chambresFixed: 1,
        hasSallesBain: false, hasSuperficie: true },
      { value: 'chambre_cour', label: 'Chambre en cour commune', icon: '🚪',
        description: 'Petit espace dans une concession',
        hasChambres: false, chambresFixed: 1,
        hasSallesBain: false, hasSuperficie: true },
      { value: 'habitat_precaire', label: 'Habitat précaire', icon: '🏚️',
        description: 'Construction en tôles/planches',
        hasChambres: true, chambresMin: 0, chambresMax: 5,
        hasSallesBain: false, hasSuperficie: false }
    ]
  },
  {
    groupe: '🏪 Locaux commerciaux',
    types: [
      { value: 'boutique', label: 'Boutique / Échoppe', icon: '🏪',
        description: 'Vente de détail, marché',
        hasChambres: false, chambresFixed: 0,
        hasSallesBain: false, hasSuperficie: true },
      { value: 'bureau', label: 'Bureau', icon: '💼',
        description: 'Activités administratives',
        hasChambres: true, chambresMin: 0, chambresMax: 20,
        hasSallesBain: false, hasSuperficie: true },
      { value: 'entrepot', label: 'Entrepôt / Hangar', icon: '🏭',
        description: 'Stockage de marchandises',
        hasChambres: false, chambresFixed: 0,
        hasSallesBain: false, hasSuperficie: true },
      { value: 'local_commercial', label: 'Local commercial', icon: '🏬',
        description: 'RDC d\'immeuble, usage mixte',
        hasChambres: false, chambresFixed: 0,
        hasSallesBain: false, hasSuperficie: true },
      { value: 'centre_commercial', label: 'Centre commercial', icon: '🛍️',
        description: 'Diamond Plaza, grandes surfaces...',
        hasChambres: false, chambresFixed: 0,
        hasSallesBain: false, hasSuperficie: true }
    ]
  }
];

const VILLES = [
  'Conakry', 'Kindia', 'Kankan', 'Labé', 'Mamou',
  'Boké', 'Faranah', 'N\'Zérékoré', 'Siguiri',
  'Guékédou', 'Macenta', 'Kissidougou', 'Coyah',
  'Dubréka', 'Forécariah', 'Dalaba', 'Pita', 'Dabola'
];

const AjouterLogement = () => {
  const navigate = useNavigate();

  const [etape, setEtape] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState(null);

  // ID du logement créé (pour upload photos)
  const [logementCree, setLogementCree] = useState(null);

  // Localisation
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);

  const [formData, setFormData] = useState({
    titre: '', description: '', adresse: '', quartier: '',
    region_id: '', prefecture_id: '', commune_id: '',
    ville: '', pays: 'Guinée', prix_mensuel: '',
    nb_chambres: 1, nb_salles_bain: 1, superficie: '',
    categorie: '', etat: 'bon_etat', type_toit: '',
    type_sol: '', acces_eau: '', electricite: '',
    statut_foncier: 'non_precise', sanitaires_type: 'interne',
    parking: false, jardin: false, climatisation: false, gardien: false
  });

  useEffect(() => {
    api.get('/localisation/regions')
      .then(res => setRegions(res.data.regions))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.region_id) {
      api.get(`/localisation/prefectures/${formData.region_id}`)
        .then(res => {
          setPrefectures(res.data.prefectures);
          setCommunes([]);
          setFormData(prev => ({ ...prev, prefecture_id: '', commune_id: '' }));
        }).catch(console.error);
    }
  }, [formData.region_id]);

  useEffect(() => {
    if (formData.prefecture_id) {
      api.get(`/localisation/communes/${formData.prefecture_id}`)
        .then(res => {
          setCommunes(res.data.communes);
          setFormData(prev => ({ ...prev, commune_id: '' }));
        }).catch(console.error);
    }
  }, [formData.prefecture_id]);

  const handleSelectCategorie = (cat) => {
    setCategorieSelectionnee(cat);
    setFormData(prev => ({
      ...prev,
      categorie: cat.value,
      nb_chambres: cat.chambresFixed !== undefined ? cat.chambresFixed : cat.chambresMin || 1,
      nb_salles_bain: cat.hasSallesBain ? 1 : 0
    }));
    setEtape(2);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Soumettre le logement → aller à l'étape photos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setLoading(true);

    try {
      const region = regions.find(r => r.id === parseInt(formData.region_id));
      const prefecture = prefectures.find(p => p.id === parseInt(formData.prefecture_id));
      const payload = {
        ...formData,
        ville: prefecture?.nom || region?.nom || formData.ville || 'Guinée'
      };

      const res = await api.post('/logements', payload);
      setLogementCree(res.data.logement);
      toast.success('✅ Logement créé ! Ajoutez maintenant des photos.');
      setEtape(5); // Aller à l'étape photos
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const ETAPES = ['Catégorie', 'Localisation', 'Détails', 'Équipements', 'Photos'];

  return (
    <div>
      <Navbar />
      <div className="ajouter-page">
        <div className="container">

          <div className="ajouter-header">
            <h1>🏠 Publier un logement</h1>
            <p>Mettez votre bien en location sur Werdhè</p>
          </div>

          {/* Indicateur étapes */}
          <div className="etapes-indicator">
            {ETAPES.map((label, i) => (
              <div key={i} style={{display:'flex', alignItems:'center'}}>
                <div className={`etape-dot ${etape >= i + 1 ? 'active' : ''}`}>
                  <span>{i + 1}</span>
                  <small>{label}</small>
                </div>
                {i < ETAPES.length - 1 && <div className="etape-ligne" />}
              </div>
            ))}
          </div>

          {/* ÉTAPE 1 — Catégorie */}
          {etape === 1 && (
            <div className="etape-card">
              <h2>Quel type de bien voulez-vous louer ?</h2>
              <p className="etape-subtitle">Le formulaire s'adaptera selon votre choix</p>
              {CATEGORIES.map(groupe => (
                <div key={groupe.groupe} className="groupe-categorie">
                  <h3 className="groupe-titre">{groupe.groupe}</h3>
                  <div className="categories-grid">
                    {groupe.types.map(cat => (
                      <button key={cat.value} className="categorie-card"
                        onClick={() => handleSelectCategorie(cat)}>
                        <span className="categorie-icon">{cat.icon}</span>
                        <strong>{cat.label}</strong>
                        <small>{cat.description}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ÉTAPE 2 — Localisation */}
          {etape === 2 && (
            <div className="etape-card">
              <div className="categorie-recap">
                <span className="categorie-recap-icon">{categorieSelectionnee?.icon}</span>
                <div>
                  <strong>{categorieSelectionnee?.label}</strong>
                  <small>{categorieSelectionnee?.description}</small>
                </div>
                <button className="btn-changer" onClick={() => setEtape(1)}>Changer</button>
              </div>

              <h2>📍 Localisation du bien</h2>
              <p className="etape-subtitle">Soyez précis pour aider les locataires</p>

              <div className="form-group">
                <label>Région *</label>
                <select name="region_id" value={formData.region_id}
                  onChange={handleChange} required>
                  <option value="">Sélectionnez une région</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              </div>

              {prefectures.length > 0 && (
                <div className="form-group">
                  <label>{formData.region_id === '1' ? 'Commune de Conakry *' : 'Préfecture *'}</label>
                  <select name="prefecture_id" value={formData.prefecture_id}
                    onChange={handleChange} required>
                    <option value="">Sélectionnez</option>
                    {prefectures.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {communes.length > 0 && (
                <div className="form-group">
                  <label>Quartier</label>
                  <select name="commune_id" value={formData.commune_id} onChange={handleChange}>
                    <option value="">Sélectionnez (optionnel)</option>
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Ville (si hors liste) *</label>
                <select name="ville" value={formData.ville} onChange={handleChange}>
                  <option value="">Sélectionnez ou laissez vide</option>
                  {VILLES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quartier / Lieu-dit (précision)</label>
                <input type="text" name="quartier" value={formData.quartier}
                  onChange={handleChange}
                  placeholder="Ex: Près du marché, derrière la mosquée..." />
              </div>

              <div className="form-group">
                <label>Adresse précise *</label>
                <input type="text" name="adresse" value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Ex: Rue KA-001, face à la pharmacie" required />
              </div>

              {erreur && <div className="error">{erreur}</div>}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEtape(1)}>← Retour</button>
                <button type="button" className="btn btn-primary"
                  onClick={() => {
                    if (!formData.adresse) { setErreur('Adresse obligatoire'); return; }
                    setErreur(''); setEtape(3);
                  }}>Continuer →</button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — Détails */}
          {etape === 3 && (
            <div className="etape-card">
              <h2>📋 Détails du logement</h2>
              {erreur && <div className="error">{erreur}</div>}

              <div className="form-group">
                <label>Titre de l'annonce *</label>
                <input type="text" name="titre" value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Appartement moderne au centre-ville" required />
              </div>

              <div className="form-row-3">
                {/* Chambres */}
                {categorieSelectionnee?.hasChambres ? (
                  <div className="form-group">
                    <label>Chambres</label>
                    <div className="counter">
                      <button type="button" className="counter-btn"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          nb_chambres: Math.max(categorieSelectionnee.chambresMin ?? 0, prev.nb_chambres - 1)
                        }))}>−</button>
                      <span className="counter-val">{formData.nb_chambres}</span>
                      <button type="button" className="counter-btn"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          nb_chambres: Math.min(categorieSelectionnee.chambresMax || 30, prev.nb_chambres + 1)
                        }))}>+</button>
                    </div>
                  </div>
                ) : categorieSelectionnee?.chambresFixed === 1 ? (
                  <div className="form-group">
                    <label>Chambres</label>
                    <div className="fixed-val">🏨 1 pièce</div>
                  </div>
                ) : null}

                {/* Salles de bain */}
                {categorieSelectionnee?.hasSallesBain && (
                  <div className="form-group">
                    <label>Salles de bain</label>
                    <div className="counter">
                      <button type="button" className="counter-btn"
                        onClick={() => setFormData(prev => ({
                          ...prev, nb_salles_bain: Math.max(0, prev.nb_salles_bain - 1)
                        }))}>−</button>
                      <span className="counter-val">{formData.nb_salles_bain}</span>
                      <button type="button" className="counter-btn"
                        onClick={() => setFormData(prev => ({
                          ...prev, nb_salles_bain: prev.nb_salles_bain + 1
                        }))}>+</button>
                    </div>
                  </div>
                )}

                {/* Superficie */}
                {categorieSelectionnee?.hasSuperficie && (
                  <div className="form-group">
                    <label>Superficie (m²)</label>
                    <input type="number" name="superficie" value={formData.superficie}
                      onChange={handleChange} placeholder="Ex: 75" min="0" />
                  </div>
                )}
              </div>

              {/* Sanitaires */}
              <div className="form-group">
                <label>Type de sanitaires</label>
                <select name="sanitaires_type" value={formData.sanitaires_type} onChange={handleChange}>
                  <option value="interne">🚿 Internes (dans le logement)</option>
                  <option value="externe">🚿 Externes (dans la cour)</option>
                  <option value="commun">👥 Communs (partagés)</option>
                  <option value="aucun">❌ Aucun</option>
                </select>
              </div>

              {/* État */}
              <div className="form-group">
                <label>État du logement *</label>
                <div className="etat-grid">
                  {[
                    { value: 'neuf', label: 'Neuf', icon: '✨' },
                    { value: 'bon_etat', label: 'Bon état', icon: '✅' },
                    { value: 'a_renover', label: 'À rénover', icon: '🔧' },
                    { value: 'en_construction', label: 'En construction', icon: '🏗️' },
                    { value: 'vetuste', label: 'Vétuste', icon: '⚠️' }
                  ].map(e => (
                    <button key={e.value} type="button"
                      className={`etat-btn ${formData.etat === e.value ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, etat: e.value }))}>
                      {e.icon} {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div className="form-group">
                <label>Prix mensuel (GNF) *</label>
                <div className="prix-input">
                  <input type="number" name="prix_mensuel" value={formData.prix_mensuel}
                    onChange={handleChange} placeholder="Ex: 500000" required min="1" />
                  <span className="prix-devise">GNF / mois</span>
                </div>
                {formData.prix_mensuel && (
                  <small className="prix-affiche">
                    💰 {Number(formData.prix_mensuel).toLocaleString()} GNF par mois
                  </small>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre logement : environnement, points forts, accès..."
                  rows={4} />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEtape(2)}>← Retour</button>
                <button type="button" className="btn btn-primary"
                  onClick={() => {
                    if (!formData.titre || !formData.prix_mensuel) {
                      setErreur('Titre et prix obligatoires'); return;
                    }
                    setErreur(''); setEtape(4);
                  }}>Continuer →</button>
              </div>
              {erreur && <div className="error" style={{marginTop:'12px'}}>{erreur}</div>}
            </div>
          )}

          {/* ÉTAPE 4 — Équipements */}
          {etape === 4 && (
            <div className="etape-card">
              <h2>⚡ Équipements et statut foncier</h2>
              {erreur && <div className="error">{erreur}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Accès à l'eau</label>
                    <select name="acces_eau" value={formData.acces_eau} onChange={handleChange}>
                      <option value="">Sélectionnez</option>
                      <option value="robinet_interieur">🚰 Robinet intérieur</option>
                      <option value="robinet_exterieur">🚰 Robinet extérieur</option>
                      <option value="puits">🪣 Puits</option>
                      <option value="forage">⛽ Forage</option>
                      <option value="public">🏛️ Borne publique</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Électricité</label>
                    <select name="electricite" value={formData.electricite} onChange={handleChange}>
                      <option value="">Sélectionnez</option>
                      <option value="secteur">⚡ Secteur (EDG)</option>
                      <option value="solaire">☀️ Panneau solaire</option>
                      <option value="groupe">🔋 Groupe électrogène</option>
                      <option value="sans">❌ Sans électricité</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Type de toit</label>
                    <select name="type_toit" value={formData.type_toit} onChange={handleChange}>
                      <option value="">Sélectionnez</option>
                      <option value="dalle">🏢 Dalle (béton)</option>
                      <option value="tole">🏠 Tôle</option>
                      <option value="chaume">🛖 Chaume</option>
                      <option value="autre">❓ Autre</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Type de sol</label>
                    <select name="type_sol" value={formData.type_sol} onChange={handleChange}>
                      <option value="">Sélectionnez</option>
                      <option value="carreaux">✨ Carreaux</option>
                      <option value="ciment">🏗️ Ciment</option>
                      <option value="terre">🌱 Terre</option>
                      <option value="autre">❓ Autre</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Statut foncier</label>
                  <select name="statut_foncier" value={formData.statut_foncier} onChange={handleChange}>
                    <option value="titre_foncier">📜 Titre foncier</option>
                    <option value="permis_habiter">🏛️ Permis d'habiter</option>
                    <option value="accord_coutumier">🤝 Accord coutumier</option>
                    <option value="sous_seing_prive">✍️ Sous-seing privé</option>
                    <option value="non_precise">❓ Non précisé</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Équipements disponibles</label>
                  <div className="equipements-grid">
                    {[
                      { name: 'parking', label: '🚗 Parking' },
                      { name: 'jardin', label: '🌿 Jardin / Cour' },
                      { name: 'climatisation', label: '❄️ Climatisation' },
                      { name: 'gardien', label: '👮 Gardien' }
                    ].map(eq => (
                      <label key={eq.name} className="checkbox-label">
                        <input type="checkbox" name={eq.name}
                          checked={formData[eq.name]} onChange={handleChange} />
                        <span>{eq.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setEtape(3)}>← Retour</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Publication...' : '🚀 Publier et ajouter des photos'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ÉTAPE 5 — Photos */}
          {etape === 5 && logementCree && (
            <div className="etape-card">
              <div className="photos-etape-header">
                <span>📸</span>
                <div>
                  <h2>Ajoutez des photos</h2>
                  <p>Les photos augmentent vos chances de trouver un locataire</p>
                </div>
              </div>

              <PhotoUpload
                logementId={logementCree.id}
                photosInitiales={[]}
                onUpdate={() => {}}
              />

              <div className="form-actions" style={{marginTop: '24px'}}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Passer cette étape
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  ✅ Terminer la publication
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AjouterLogement;