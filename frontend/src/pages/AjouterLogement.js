import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import PhotoUpload from '../components/PhotoUpload';
import toast from 'react-hot-toast';
import './AjouterLogement.css';
import { MapPin, Home, Building2, Building, Warehouse, Store, BedDouble, DoorOpen, Landmark, Hotel, ShoppingBag, Factory } from 'lucide-react';

var CATEGORIES = [
  {
    groupe: 'Villas',
    types: [
      { value: 'villa_luxe',     label: 'Villa de luxe',        icon: <Building2  size={22} strokeWidth={1.5} color="#7B1FA2" />, description: '4+ chambres, piscine, jardin, gardien',             hasChambres: true,  chambresMin: 4, chambresMax: 20, hasSallesBain: true,  hasSuperficie: true  },
      { value: 'villa_standard', label: 'Villa standard',       icon: <Building2  size={22} strokeWidth={1.5} color="#1B6B3A" />, description: '3-4 chambres, cour, clôture',                       hasChambres: true,  chambresMin: 3, chambresMax: 10, hasSallesBain: true,  hasSuperficie: true  },
    ]
  },
  {
    groupe: 'Maisons',
    types: [
      { value: 'maison_moderne',   label: 'Maison moderne',          icon: <Home       size={22} strokeWidth={1.5} color="#1565C0" />, description: 'Construction en dur, parpaings/ciment',              hasChambres: true,  chambresMin: 1, chambresMax: 15, hasSallesBain: true,  hasSuperficie: true  },
      { value: 'maison_banco',     label: 'Maison traditionnelle',   icon: <Home       size={22} strokeWidth={1.5} color="#E65100" />, description: 'Murs en banco, toit en tôle ou chaume',             hasChambres: true,  chambresMin: 1, chambresMax: 8,  hasSallesBain: true,  hasSuperficie: true  },
      { value: 'maison_chantier',  label: 'Maison en construction',  icon: <Building   size={22} strokeWidth={1.5} color="#888"    />, description: 'Rez-de-chaussée habitable, étage en attente',       hasChambres: true,  chambresMin: 1, chambresMax: 10, hasSallesBain: true,  hasSuperficie: true  },
      { value: 'concession',       label: 'Concession familiale',    icon: <Landmark   size={22} strokeWidth={1.5} color="#1B6B3A" />, description: 'Plusieurs logements autour d\'une cour commune',   hasChambres: true,  chambresMin: 1, chambresMax: 30, hasSallesBain: true,  hasSuperficie: true  },
    ]
  },
  {
    groupe: 'Appartements',
    types: [
      { value: 'appartement',      label: 'Appartement',             icon: <Building2  size={22} strokeWidth={1.5} color="#1565C0" />, description: 'Logement dans un immeuble collectif',               hasChambres: true,  chambresMin: 1, chambresMax: 8,  hasSallesBain: true,  hasSuperficie: true  },
      { value: 'duplex',           label: 'Duplex',                  icon: <Building2  size={22} strokeWidth={1.5} color="#7B1FA2" />, description: 'Appartement sur deux niveaux',                      hasChambres: true,  chambresMin: 2, chambresMax: 8,  hasSallesBain: true,  hasSuperficie: true  },
      { value: 'logement_social',  label: 'Logement social',         icon: <Building   size={22} strokeWidth={1.5} color="#37474F" />, description: 'Programme Sonapi, Addoha...',                       hasChambres: true,  chambresMin: 1, chambresMax: 5,  hasSallesBain: true,  hasSuperficie: true  },
    ]
  },
  {
    groupe: 'Chambres & Studios',
    types: [
      { value: 'studio_moderne',    label: 'Studio moderne',         icon: <Hotel      size={22} strokeWidth={1.5} color="#1B6B3A" />, description: '1 pièce + sanitaires internes',                     hasChambres: false, chambresFixed: 1,               hasSallesBain: true,  hasSuperficie: true  },
      { value: 'chambre_habitant',  label: "Chambre chez l'habitant",icon: <BedDouble  size={22} strokeWidth={1.5} color="#E65100" />, description: 'Une pièce, sanitaires communs',                     hasChambres: false, chambresFixed: 1,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'chambre_cour',      label: 'Chambre en cour commune',icon: <DoorOpen   size={22} strokeWidth={1.5} color="#888"    />, description: 'Petit espace dans une concession',                  hasChambres: false, chambresFixed: 1,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'habitat_precaire',  label: 'Habitat précaire',       icon: <Home       size={22} strokeWidth={1.5} color="#B71C1C" />, description: 'Construction en tôles/planches',                    hasChambres: true,  chambresMin: 0, chambresMax: 5,  hasSallesBain: false, hasSuperficie: false },
    ]
  },
  {
    groupe: 'Locaux commerciaux',
    types: [
      { value: 'boutique',          label: 'Boutique / Échoppe',     icon: <Store      size={22} strokeWidth={1.5} color="#E65100" />, description: 'Vente de détail, marché',                           hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'bureau',            label: 'Bureau',                 icon: <Warehouse  size={22} strokeWidth={1.5} color="#1565C0" />, description: 'Activités administratives',                         hasChambres: true,  chambresMin: 0, chambresMax: 20, hasSallesBain: false, hasSuperficie: true  },
      { value: 'entrepot',          label: 'Entrepôt / Hangar',      icon: <Factory    size={22} strokeWidth={1.5} color="#37474F" />, description: 'Stockage de marchandises',                          hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'local_commercial',  label: 'Local commercial',       icon: <Building   size={22} strokeWidth={1.5} color="#7B1FA2" />, description: 'RDC d\'immeuble, usage mixte',                     hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'centre_commercial', label: 'Centre commercial',      icon: <ShoppingBag size={22} strokeWidth={1.5} color="#1B6B3A" />, description: 'Diamond Plaza, grandes surfaces...',               hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
    ]
  },
];

const AjouterLogement = () => {
  const navigate = useNavigate();

  const [etape, setEtape] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState(null);

  // ID du logement créé (pour upload photos)
  const [logementCree, setLogementCree] = useState(null);
  const [photosAjoutees, setPhotosAjoutees] = useState([]);

  // Localisation
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes]             = useState([]);
  const [sousPrefectures, setSousPrefectures] = useState([]);

  const [formData, setFormData] = useState({
    titre: '', description: '', adresse: '', quartier: '', point_repere: '',
    region_id: '', prefecture_id: '', commune_id: '', sous_prefecture: '',
    ville: '', pays: 'Guinée', prix_mensuel: '',
    nb_chambres: '', nb_salles_bain: '', superficie: '',
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
    // Charger sous-préfectures quand préfecture change (hors Conakry)
  useEffect(function() {
    if (!formData.prefecture_id || formData.region_id === '1') {
      setSousPrefectures([]);
      return;
    }
    api.get('/localisation/sous-prefectures/' + formData.prefecture_id)
      .then(function(res) { setSousPrefectures(res.data.sous_prefectures || []); })
      .catch(function() { setSousPrefectures([]); });
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
      toast.success('Logement créé ! Ajoutez maintenant des photos.');
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
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 800, color: '#1B2B22', margin: 0 }}>
              <Home size={24} strokeWidth={1.5} color="#1B6B3A" /> Publier un logement
            </h1>
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
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 4px' }}>
                <MapPin size={20} strokeWidth={1.5} color="#1B6B3A" /> Localisation du bien
              </h2>
              <p className="etape-subtitle">Soyez précis pour aider les locataires à vous trouver</p>

              {/* Type de logement */}
              <div className="form-group">
                <label>Type de logement *</label>
                <select name="categorie" value={formData.categorie} onChange={handleChange} required>
                  <option value="">Sélectionnez un type</option>
                  {CATEGORIES.map(function(c) {
                    return <option key={c.value} value={c.value}>{c.label}</option>;
                  })}
                </select>
              </div>

              {/* Région */}
              <div className="form-group">
                <label>Région *</label>
                <select name="region_id" value={formData.region_id} onChange={handleChange} required>
                  <option value="">Sélectionnez une région</option>
                  {regions.map(function(r) {
                    return <option key={r.id} value={r.id}>{r.nom}</option>;
                  })}
                </select>
              </div>

              {/* Ville / Préfecture */}
              {prefectures.length > 0 && (
                <div className="form-group">
                  <label>{formData.region_id === '1' ? 'Ville *' : 'Préfecture *'}</label>
                  <select name="prefecture_id" value={formData.prefecture_id} onChange={handleChange} required>
                    <option value="">Sélectionnez</option>
                    {prefectures.map(function(p) {
                      return <option key={p.id} value={p.id}>{p.nom}</option>;
                    })}
                  </select>
                </div>
              )}
              {/* Sous-préfecture (hors Conakry) */}
              {sousPrefectures.length > 0 && (
                <div className="form-group">
                  <label>Sous-préfecture</label>
                  <select name="sous_prefecture" value={formData.sous_prefecture} onChange={handleChange}>
                    <option value="">Sélectionnez une sous-préfecture</option>
                    {sousPrefectures.map(function(sp) {
                      return <option key={sp.id} value={sp.nom}>{sp.nom}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Commune */}
              {communes.length > 0 && (
                <div className="form-group">
                  <label>Commune</label>
                  <select name="commune_id" value={formData.commune_id} onChange={handleChange}>
                    <option value="">Sélectionnez une commune</option>
                    {communes.map(function(c) {
                      return <option key={c.id} value={c.id}>{c.nom}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Quartier */}
              <div className="form-group">
                <label>Quartier *</label>
                <input type="text" name="quartier" value={formData.quartier}
                  onChange={handleChange}
                  placeholder="Ex: Ratoma, Kaloum, Hafia..." required />
              </div>

              {/* Point de repère */}
              <div className="form-group">
                <label>Point de repère</label>
                <input type="text" name="point_repere" value={formData.point_repere || ''}
                  onChange={handleChange}
                  placeholder="Ex: Face à la mosquée, près du marché central..." />
              </div>

              {/* Adresse détaillée */}
              <div className="form-group">
                <label>Adresse détaillée *</label>
                <input type="text" name="adresse" value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Ex: Rue KA-001, maison bleue à gauche" required />
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
                      <option value="robinet_interieur">Robinet intérieur</option>
                      <option value="robinet_exterieur">Robinet extérieur</option>
                      <option value="puits">Puits</option>
                      <option value="forage">Forage</option>
                      <option value="public">Borne publique</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Électricité</label>
                    <select name="electricite" value={formData.electricite} onChange={handleChange}>
                      <option value="">Sélectionnez</option>
                      <option value="secteur">Secteur (EDG)</option>
                      <option value="solaire">Panneau solaire</option>
                      <option value="groupe">Groupe électrogène</option>
                      <option value="sans">Sans électricité</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Type de toit</label>
                    <select name="type_toit" value={formData.type_toit} onChange={handleChange}>
                      <option value="">Sélectionnez</option>
                      <option value="dalle">Dalle (béton)</option>
                      <option value="tole">Tôle</option>
                      <option value="chaume">Chaume</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Type de sol</label>
                    <select name="type_sol" value={formData.type_sol} onChange={handleChange}>
                      <option value="">Sélectionnez</option>
                      <option value="carreaux">Carreaux</option>
                      <option value="ciment">Ciment</option>
                      <option value="terre">Terre</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Statut foncier</label>
                  <select name="statut_foncier" value={formData.statut_foncier} onChange={handleChange}>
                    <option value="titre_foncier">Titre foncier</option>
                    <option value="permis_habiter">Permis d'habiter</option>
                    <option value="accord_coutumier">Accord coutumier</option>
                    <option value="sous_seing_prive">Sous-seing privé</option>
                    <option value="non_precise">Non précisé</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Équipements disponibles</label>
                  <div className="equipements-grid">
                    {[
                      { name: 'parking', label: 'Parking' },
                      { name: 'jardin', label: 'Jardin / Cour' },
                      { name: 'climatisation', label: 'Climatisation' },
                      { name: 'gardien', label: 'Gardien' }
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
                    {loading ? 'Publication...' : 'Publier et ajouter des photos'}
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
                  <h2>Ajoutez des photos <span style={{ color: '#E53935', fontSize: 14 }}>*</span></h2>
                  <p>Au moins 1 photo requise · Les logements avec photos reçoivent 3× plus de candidatures</p>
                </div>
              </div>

              <PhotoUpload
                logementId={logementCree.id}
                photosInitiales={[]}
                onUpdate={function(nouvPhotos) {
                  setPhotosAjoutees(nouvPhotos);
                }}
              />

              <div className="form-actions" style={{marginTop: '24px'}}>
                {photosAjoutees.length === 0 && (
  <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#7B4F00', display: 'flex', alignItems: 'center', gap: 8 }}>
    <span>⚠️</span> Ajoutez au moins une photo pour publier votre logement.
  </div>
)}
<button
  type="button"
  className="btn btn-secondary"
  onClick={function() { navigate('/dashboard'); }}
  style={{ opacity: 0.6, fontSize: 12 }}
>
  Terminer sans photo (déconseillé)
</button>
<button
  type="button"
  className="btn btn-primary"
  disabled={photosAjoutees.length === 0}
  onClick={function() {
    if (photosAjoutees.length === 0) {
      toast.error('Ajoutez au moins une photo avant de publier !');
      return;
    }
    navigate('/dashboard');
    toast.success('Logement publié avec ' + photosAjoutees.length + ' photo(s) !');
  }}
  style={{ opacity: photosAjoutees.length === 0 ? 0.5 : 1 }}
>
  {photosAjoutees.length === 0 ? 'Ajoutez une photo d\'abord' : 'Publier - ' + photosAjoutees.length + ' photo(s)'}
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