import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Navbar from '../components/Navbar';
import PhotoUpload from '../components/PhotoUpload';
import toast from 'react-hot-toast';
import './AjouterLogement.css';
import { MapPin, Home, Building2, Building, Warehouse, Store, BedDouble, DoorOpen, Landmark, Hotel, ShoppingBag, Sparkles, Camera, AlertTriangle, Crown, Castle, Tent, Construction, Fence, Layers, TriangleAlert, Briefcase, Zap } from 'lucide-react';

// NOTE : label/description sont traduits à l'affichage via t('ajouterLogement.categories.types.<value>.*'),
// et groupe via t('ajouterLogement.categories.groupes.<groupe>'). value/groupe restent des identifiants stables.
var CATEGORIES = [
  {
    groupe: 'villas',
    types: [
      { value: 'villa_luxe',     icon: <Crown      size={22} strokeWidth={1.5} color="#7B1FA2" />, hasChambres: true,  chambresMin: 4, chambresMax: 20, hasSallesBain: true,  hasSuperficie: true  },
      { value: 'villa_standard', icon: <Castle     size={22} strokeWidth={1.5} color="#1B6B3A" />, hasChambres: true,  chambresMin: 3, chambresMax: 10, hasSallesBain: true,  hasSuperficie: true  },
    ]
  },
  {
    groupe: 'maisons',
    types: [
      { value: 'maison_moderne',   icon: <Home       size={22} strokeWidth={1.5} color="#1565C0" />, hasChambres: true,  chambresMin: 1, chambresMax: 15, hasSallesBain: true,  hasSuperficie: true  },
      { value: 'maison_banco',     icon: <Tent       size={22} strokeWidth={1.5} color="#E65100" />, hasChambres: true,  chambresMin: 1, chambresMax: 8,  hasSallesBain: true,  hasSuperficie: true  },
      { value: 'maison_chantier',  icon: <Construction size={22} strokeWidth={1.5} color="#888"  />, hasChambres: true,  chambresMin: 1, chambresMax: 10, hasSallesBain: true,  hasSuperficie: true  },
      { value: 'concession',       icon: <Fence      size={22} strokeWidth={1.5} color="#1B6B3A" />, hasChambres: true,  chambresMin: 1, chambresMax: 30, hasSallesBain: true,  hasSuperficie: true  },
    ]
  },
  {
    groupe: 'appartements',
    types: [
      { value: 'appartement',      icon: <Building2  size={22} strokeWidth={1.5} color="#1565C0" />, hasChambres: true,  chambresMin: 1, chambresMax: 8,  hasSallesBain: true,  hasSuperficie: true  },
      { value: 'duplex',           icon: <Layers     size={22} strokeWidth={1.5} color="#7B1FA2" />, hasChambres: true,  chambresMin: 2, chambresMax: 8,  hasSallesBain: true,  hasSuperficie: true  },
      { value: 'logement_social',  icon: <Landmark   size={22} strokeWidth={1.5} color="#37474F" />, hasChambres: true,  chambresMin: 1, chambresMax: 5,  hasSallesBain: true,  hasSuperficie: true  },
    ]
  },
  {
    groupe: 'chambresStudios',
    types: [
      { value: 'studio_moderne',    icon: <Hotel      size={22} strokeWidth={1.5} color="#1B6B3A" />, hasChambres: false, chambresFixed: 1,               hasSallesBain: true,  hasSuperficie: true  },
      { value: 'chambre_habitant',  icon: <BedDouble  size={22} strokeWidth={1.5} color="#E65100" />, hasChambres: false, chambresFixed: 1,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'chambre_cour',      icon: <DoorOpen   size={22} strokeWidth={1.5} color="#888"    />, hasChambres: false, chambresFixed: 1,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'habitat_precaire',  icon: <TriangleAlert size={22} strokeWidth={1.5} color="#B71C1C" />, hasChambres: true,  chambresMin: 0, chambresMax: 5,  hasSallesBain: false, hasSuperficie: false },
    ]
  },
  {
    groupe: 'locauxCommerciaux',
    types: [
      { value: 'boutique',          icon: <Store      size={22} strokeWidth={1.5} color="#E65100" />, hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'bureau',            icon: <Briefcase  size={22} strokeWidth={1.5} color="#1565C0" />, hasChambres: true,  chambresMin: 0, chambresMax: 20, hasSallesBain: false, hasSuperficie: true  },
      { value: 'entrepot',          icon: <Warehouse  size={22} strokeWidth={1.5} color="#37474F" />, hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'local_commercial',  icon: <Building   size={22} strokeWidth={1.5} color="#7B1FA2" />, hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
      { value: 'centre_commercial', icon: <ShoppingBag size={22} strokeWidth={1.5} color="#1B6B3A" />, hasChambres: false, chambresFixed: 0,               hasSallesBain: false, hasSuperficie: true  },
    ]
  },
];
// Sous-préfectures par préfecture (liste statique)
var SOUS_PREFECTURES = {
  // Kindia
  'Kindia':     ['Bantignel', 'Damakania', 'Fermessadou Pompo', 'Friguiagbé', 'Kolente', 'Mambia', 'Molota', 'Souguéta'],
  // Boké
  'Boké':       ['Boké centre', 'Dabiss', 'Kolaboui', 'Malapouyah', 'Sangarédi', 'Sansalé'],
  // Kankan
  'Kankan':     ['Balandougou', 'Djankana', 'Gbérédou-Baranama', 'Karifamoriah', 'Koumana', 'Missamana', 'Sabadou-Baranama'],
  // Labé
  'Labé':       ['Dalaba', 'Hafia', 'Komba', 'Laïné', 'Lélouma', 'Mali', 'Pita', 'Tougué'],
  // Mamou
  'Mamou':      ['Dounet', 'Konkouré', 'Mamou centre', 'Niagara', 'Saramoussayah', 'Soyah', 'Tolo'],
  // Faranah
  'Faranah':    ['Banian', 'Faranah centre', 'Kobikoro', 'Passayah', 'Sandenia', 'Songoyah', 'Tiro'],
  // N'Zérékoré
  'N\'Zérékoré': ['Bossou', 'Gouécké', 'Laine', 'Nzoo', 'Palé', 'Samoé', 'Yalenzou'],
};
const AjouterLogement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('profil');

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

  // Estimation de loyer (étape Détails)
  const [estimation, setEstimation] = useState(null);
  const [estimationLoading, setEstimationLoading] = useState(false);

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
  }, [formData.prefecture_id, formData.region_id]);
    // Charger sous-préfectures quand préfecture change (hors Conakry)
    useEffect(function() {
    if (!formData.prefecture_id || formData.region_id === '1') {
      setSousPrefectures([]);
      return;
    }
    // Chercher le nom de la préfecture sélectionnée
    var prefNom = prefectures.find(function(p) { return String(p.id) === String(formData.prefecture_id); });
    if (prefNom && SOUS_PREFECTURES[prefNom.nom]) {
      setSousPrefectures(SOUS_PREFECTURES[prefNom.nom].map(function(nom, i) { return { id: i, nom: nom }; }));
    } else {
      // Fallback API
      api.get('/localisation/sous-prefectures/' + formData.prefecture_id)
        .then(function(res) { setSousPrefectures(res.data.sous_prefectures || []); })
        .catch(function() { setSousPrefectures([]); });
    }
  }, [formData.prefecture_id, formData.region_id, prefectures]);

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

  // Estimer le loyer à partir de la ville résolue + catégorie + taille
  const villeResolue = () => {
    const region = regions.find(r => r.id === parseInt(formData.region_id));
    const prefecture = prefectures.find(p => p.id === parseInt(formData.prefecture_id));
    return prefecture?.nom || region?.nom || '';
  };

  const lancerEstimation = () => {
    const ville = villeResolue();
    if (!ville) return;
    setEstimationLoading(true);
    api.post('/estimation/loyer', {
      ville,
      categorie: formData.categorie,
      nb_chambres: formData.nb_chambres,
      superficie: formData.superficie
    })
      .then(res => setEstimation(res.data))
      .catch(() => setEstimation(null))
      .finally(() => setEstimationLoading(false));
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
      toast.success(t('ajouterLogement.toastLogementCree'));
      setEtape(5); // Aller à l'étape photos
    } catch (err) {
      setErreur(err.response?.data?.erreur || t('ajouterLogement.erreurAjout'));
    } finally {
      setLoading(false);
    }
  };

  const ETAPES = [
    t('ajouterLogement.etapesIndicateur.categorie'),
    t('ajouterLogement.etapesIndicateur.localisation'),
    t('ajouterLogement.etapesIndicateur.details'),
    t('ajouterLogement.etapesIndicateur.equipements'),
    t('ajouterLogement.etapesIndicateur.photos'),
  ];

  return (
    <div>
      <Navbar />
      <div className="ajouter-page">
        <div className="container">

          <div className="ajouter-header">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 800, color: '#1B2B22', margin: 0 }}>
              <Home size={24} strokeWidth={1.5} color="#1B6B3A" /> {t('ajouterLogement.header.titre')}
            </h1>
            <p>{t('ajouterLogement.header.sousTitre')}</p>
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
              <h2>{t('ajouterLogement.etape1.titre')}</h2>
              <p className="etape-subtitle">{t('ajouterLogement.etape1.sousTitre')}</p>
              {CATEGORIES.map(groupe => (
                <div key={groupe.groupe} className="groupe-categorie">
                  <h3 className="groupe-titre">{t('ajouterLogement.categories.groupes.' + groupe.groupe)}</h3>
                  <div className="categories-grid">
                    {groupe.types.map(cat => (
                      <button key={cat.value} className="categorie-card"
                        onClick={() => handleSelectCategorie(cat)}>
                        <span className="categorie-icon">{cat.icon}</span>
                        <strong>{t('ajouterLogement.categories.types.' + cat.value + '.label')}</strong>
                        <small>{t('ajouterLogement.categories.types.' + cat.value + '.description')}</small>
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
                  <strong>{categorieSelectionnee && t('ajouterLogement.categories.types.' + categorieSelectionnee.value + '.label')}</strong>
                  <small>{categorieSelectionnee && t('ajouterLogement.categories.types.' + categorieSelectionnee.value + '.description')}</small>
                </div>
                <button className="btn-changer" onClick={() => setEtape(1)}>{t('ajouterLogement.etape2.changer')}</button>
              </div>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 4px' }}>
                <MapPin size={20} strokeWidth={1.5} color="#1B6B3A" /> {t('ajouterLogement.etape2.titre')}
              </h2>
              <p className="etape-subtitle">{t('ajouterLogement.etape2.sousTitre')}</p>

              {/* Type de logement — auto depuis étape 1 */}
              {categorieSelectionnee && (
                <div className="form-group">
                  <label>{t('ajouterLogement.etape2.typeLogement')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#E8F5E9', borderRadius: 10, border: '1.5px solid #A5D6A7' }}>
                    <span>{categorieSelectionnee.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{t('ajouterLogement.categories.types.' + categorieSelectionnee.value + '.label')}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{t('ajouterLogement.categories.types.' + categorieSelectionnee.value + '.description')}</div>
                    </div>
                  </div>
                </div>
              )}
              {/* Région */}
              <div className="form-group">
                <label>{t('ajouterLogement.etape2.region')}</label>
                <select name="region_id" value={formData.region_id} onChange={handleChange} required>
                  <option value="">{t('ajouterLogement.etape2.selectionnezRegion')}</option>
                  {regions.map(function(r) {
                    return <option key={r.id} value={r.id}>{r.nom}</option>;
                  })}
                </select>
              </div>

              {/* Ville / Préfecture */}
              {prefectures.length > 0 && (
                <div className="form-group">
                  <label>{formData.region_id === '1' ? t('ajouterLogement.etape2.ville') : t('ajouterLogement.etape2.prefecture')}</label>
                  <select name="prefecture_id" value={formData.prefecture_id} onChange={handleChange} required>
                    <option value="">{t('ajouterLogement.etape2.selectionnez')}</option>
                    {prefectures.map(function(p) {
                      return <option key={p.id} value={p.id}>{p.nom}</option>;
                    })}
                  </select>
                </div>
              )}
              {/* Sous-préfecture (hors Conakry) */}
              {sousPrefectures.length > 0 && (
                <div className="form-group">
                  <label>{t('ajouterLogement.etape2.sousPrefecture')}</label>
                  <select name="sous_prefecture" value={formData.sous_prefecture} onChange={handleChange}>
                    <option value="">{t('ajouterLogement.etape2.selectionnezSousPrefecture')}</option>
                    {sousPrefectures.map(function(sp) {
                      return <option key={sp.id} value={sp.nom}>{sp.nom}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Commune */}
              {communes.length > 0 && (
                <div className="form-group">
                  <label>{t('ajouterLogement.etape2.commune')}</label>
                  <select name="commune_id" value={formData.commune_id} onChange={handleChange}>
                    <option value="">{t('ajouterLogement.etape2.selectionnezCommune')}</option>
                    {communes.map(function(c) {
                      return <option key={c.id} value={c.id}>{c.nom}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Quartier */}
              <div className="form-group">
                <label>{t('ajouterLogement.etape2.quartier')}</label>
                <input type="text" name="quartier" value={formData.quartier}
                  onChange={handleChange}
                  placeholder={t('ajouterLogement.etape2.quartierPlaceholder')} required />
              </div>

              {/* Point de repère */}
              <div className="form-group">
                <label>{t('ajouterLogement.etape2.pointRepere')}</label>
                <input type="text" name="point_repere" value={formData.point_repere || ''}
                  onChange={handleChange}
                  placeholder={t('ajouterLogement.etape2.pointReperePlaceholder')} />
              </div>

              {/* Adresse détaillée */}
              <div className="form-group">
                <label>{t('ajouterLogement.etape2.adresse')}</label>
                <input type="text" name="adresse" value={formData.adresse}
                  onChange={handleChange}
                  placeholder={t('ajouterLogement.etape2.adressePlaceholder')} required />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEtape(1)}>{t('ajouterLogement.etape2.retour')}</button>
                <button type="button" className="btn btn-primary"
                  onClick={() => { setEtape(3); lancerEstimation(); }}>{t('ajouterLogement.etape2.continuer')}</button>
              </div>
              {erreur && <div className="error" style={{marginTop:'12px'}}>{erreur}</div>}
            </div>
          )}

          {/* ÉTAPE 3 — Détails */}
          {etape === 3 && (
            <div className="etape-card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 4px' }}>
                <Home size={20} strokeWidth={1.5} color="#1B6B3A" /> {t('ajouterLogement.etape3.titre')}
              </h2>
              <p className="etape-subtitle">{t('ajouterLogement.etape3.sousTitre')}</p>

              <div className="form-group">
                <label>{t('ajouterLogement.etape3.titreAnnonce')}</label>
                <input type="text" name="titre" value={formData.titre}
                  onChange={handleChange}
                  placeholder={t('ajouterLogement.etape3.titreAnnoncePlaceholder')} required />
              </div>

              <div className="form-group">
                <label>{t('ajouterLogement.etape3.description')}</label>
                <textarea name="description" value={formData.description}
                  onChange={handleChange} rows={4}
                  placeholder={t('ajouterLogement.etape3.descriptionPlaceholder')} />
              </div>

              <div className="form-row-2">
                {categorieSelectionnee?.hasSuperficie && (
                  <div className="form-group">
                    <label>{t('ajouterLogement.etape3.superficie')}</label>
                    <input type="number" name="superficie" min="0" value={formData.superficie}
                      onChange={handleChange}
                      onBlur={lancerEstimation}
                      placeholder={t('ajouterLogement.etape3.superficiePlaceholder')} />
                  </div>
                )}
                {categorieSelectionnee?.hasChambres !== false && (
                  <div className="form-group">
                    <label>{t('ajouterLogement.etape3.nbChambres')}</label>
                    <input type="number" name="nb_chambres" min="0" value={formData.nb_chambres}
                      onChange={handleChange}
                      onBlur={lancerEstimation} />
                  </div>
                )}
                {categorieSelectionnee?.hasSallesBain && (
                  <div className="form-group">
                    <label>{t('ajouterLogement.etape3.sallesBain')}</label>
                    <input type="number" name="nb_salles_bain" min="0" value={formData.nb_salles_bain}
                      onChange={handleChange} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>{t('ajouterLogement.etape3.loyerMensuel')}</label>
                <input type="number" name="prix_mensuel" min="0" value={formData.prix_mensuel}
                  onChange={handleChange}
                  placeholder={t('ajouterLogement.etape3.loyerMensuelPlaceholder')} required />
              </div>

              {estimationLoading && (
                <div style={{ fontSize: 13, color: '#888', marginTop: -8, marginBottom: 16 }}>{t('ajouterLogement.etape3.estimationEnCours')}</div>
              )}

              {!estimationLoading && estimation && (
                <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12, padding: '14px 16px', marginTop: -8, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Sparkles size={18} strokeWidth={1.5} color="#1B6B3A" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>
                      {t('ajouterLogement.etape3.loyerSuggere', {
                        bas: Number(estimation.estimation_basse).toLocaleString('fr-FR'),
                        haut: Number(estimation.estimation_haute).toLocaleString('fr-FR')
                      })}
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                      {estimation.nb_comparables > 0
                        ? t('ajouterLogement.etape3.baseSurComparables', { count: estimation.nb_comparables })
                        : t('ajouterLogement.etape3.estimationStatistique')}
                    </div>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, prix_mensuel: String(estimation.estimation_moyenne) }))}
                      style={{ marginTop: 8, background: 'none', border: 'none', color: '#1B6B3A', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                      {t('ajouterLogement.etape3.utiliser', { prix: Number(estimation.estimation_moyenne).toLocaleString('fr-FR') })}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEtape(2)}>{t('ajouterLogement.etape3.retour')}</button>
                <button type="button" className="btn btn-primary"
                  onClick={() => {
                    if (!formData.titre || !formData.prix_mensuel) {
                      setErreur(t('ajouterLogement.etape3.erreurTitrePrix')); return;
                    }
                    setErreur(''); setEtape(4);
                  }}>{t('ajouterLogement.etape3.continuer')}</button>
              </div>
              {erreur && <div className="error" style={{marginTop:'12px'}}>{erreur}</div>}
            </div>
          )}

          {/* ÉTAPE 4 — Équipements */}
          {etape === 4 && (
            <div className="etape-card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} strokeWidth={1.8} />
                {t('ajouterLogement.etape4.titre')}
              </h2>
              {erreur && <div className="error">{erreur}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>{t('ajouterLogement.etape4.accesEau')}</label>
                    <select name="acces_eau" value={formData.acces_eau} onChange={handleChange}>
                      <option value="">{t('ajouterLogement.etape4.selectionnez')}</option>
                      <option value="robinet_interieur">{t('ajouterLogement.etape4.robinetInterieur')}</option>
                      <option value="robinet_exterieur">{t('ajouterLogement.etape4.robinetExterieur')}</option>
                      <option value="puits">{t('ajouterLogement.etape4.puits')}</option>
                      <option value="forage">{t('ajouterLogement.etape4.forage')}</option>
                      <option value="public">{t('ajouterLogement.etape4.bornePublique')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('ajouterLogement.etape4.electricite')}</label>
                    <select name="electricite" value={formData.electricite} onChange={handleChange}>
                      <option value="">{t('ajouterLogement.etape4.selectionnez')}</option>
                      <option value="secteur">{t('ajouterLogement.etape4.secteur')}</option>
                      <option value="solaire">{t('ajouterLogement.etape4.solaire')}</option>
                      <option value="groupe">{t('ajouterLogement.etape4.groupeElectrogene')}</option>
                      <option value="sans">{t('ajouterLogement.etape4.sansElectricite')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('ajouterLogement.etape4.typeToit')}</label>
                    <select name="type_toit" value={formData.type_toit} onChange={handleChange}>
                      <option value="">{t('ajouterLogement.etape4.selectionnez')}</option>
                      <option value="dalle">{t('ajouterLogement.etape4.dalle')}</option>
                      <option value="tole">{t('ajouterLogement.etape4.tole')}</option>
                      <option value="chaume">{t('ajouterLogement.etape4.chaume')}</option>
                      <option value="autre">{t('ajouterLogement.etape4.autre')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('ajouterLogement.etape4.typeSol')}</label>
                    <select name="type_sol" value={formData.type_sol} onChange={handleChange}>
                      <option value="">{t('ajouterLogement.etape4.selectionnez')}</option>
                      <option value="carreaux">{t('ajouterLogement.etape4.carreaux')}</option>
                      <option value="ciment">{t('ajouterLogement.etape4.ciment')}</option>
                      <option value="terre">{t('ajouterLogement.etape4.terre')}</option>
                      <option value="autre">{t('ajouterLogement.etape4.autre')}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('ajouterLogement.etape4.statutFoncier')}</label>
                  <select name="statut_foncier" value={formData.statut_foncier} onChange={handleChange}>
                    <option value="titre_foncier">{t('ajouterLogement.etape4.titreFoncier')}</option>
                    <option value="permis_habiter">{t('ajouterLogement.etape4.permisHabiter')}</option>
                    <option value="accord_coutumier">{t('ajouterLogement.etape4.accordCoutumier')}</option>
                    <option value="sous_seing_prive">{t('ajouterLogement.etape4.sousSeingPrive')}</option>
                    <option value="non_precise">{t('ajouterLogement.etape4.nonPrecise')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('ajouterLogement.etape4.equipementsDisponibles')}</label>
                  <div className="equipements-grid">
                    {[
                      { name: 'parking', label: t('ajouterLogement.etape4.parking') },
                      { name: 'jardin', label: t('ajouterLogement.etape4.jardin') },
                      { name: 'climatisation', label: t('ajouterLogement.etape4.climatisation') },
                      { name: 'gardien', label: t('ajouterLogement.etape4.gardien') }
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
                  <button type="button" className="btn btn-secondary" onClick={() => setEtape(3)}>{t('ajouterLogement.etape4.retour')}</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t('ajouterLogement.etape4.publication') : t('ajouterLogement.etape4.publierEtAjouterPhotos')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ÉTAPE 5 — Photos */}
          {etape === 5 && logementCree && (
            <div className="etape-card">
              <div className="photos-etape-header">
                <span style={{ display: 'flex' }}><Camera size={40} strokeWidth={1.5} color="#1B6B3A" /></span>
                <div>
                  <h2>{t('ajouterLogement.etape5.titre')} <span style={{ color: '#E53935', fontSize: 14 }}>*</span></h2>
                  <p>{t('ajouterLogement.etape5.sousTitre')}</p>
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
    <AlertTriangle size={16} strokeWidth={1.5} color="#F5A623" /> {t('ajouterLogement.etape5.avertissementPhoto')}
  </div>
)}
<button
  type="button"
  className="btn btn-secondary"
  onClick={function() { navigate('/dashboard'); }}
  style={{ opacity: 0.6, fontSize: 12 }}
>
  {t('ajouterLogement.etape5.terminerSansPhoto')}
</button>
<button
  type="button"
  className="btn btn-primary"
  disabled={photosAjoutees.length === 0}
  onClick={function() {
    if (photosAjoutees.length === 0) {
      toast.error(t('ajouterLogement.etape5.toastAjoutezPhotoAvant'));
      return;
    }
    navigate('/dashboard');
    toast.success(t('ajouterLogement.etape5.toastLogementPublie', { count: photosAjoutees.length }));
  }}
  style={{ opacity: photosAjoutees.length === 0 ? 0.5 : 1 }}
>
  {photosAjoutees.length === 0 ? t('ajouterLogement.etape5.ajoutezPhotoDabord') : t('ajouterLogement.etape5.publierPhotos', { count: photosAjoutees.length })}
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