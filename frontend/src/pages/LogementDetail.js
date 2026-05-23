import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import './LogementDetail.css';

const CATEGORIES = {
  villa_luxe:        { icon: '👑', label: 'Villa de luxe' },
  villa_standard:    { icon: '🏰', label: 'Villa standard' },
  maison_moderne:    { icon: '🏠', label: 'Maison moderne' },
  maison_banco:      { icon: '🛖', label: 'Maison traditionnelle' },
  maison_chantier:   { icon: '🏗️', label: 'En construction' },
  concession:        { icon: '🏘️', label: 'Concession' },
  appartement:       { icon: '🏢', label: 'Appartement' },
  duplex:            { icon: '🏬', label: 'Duplex' },
  logement_social:   { icon: '🏛️', label: 'Logement social' },
  studio_moderne:    { icon: '🏨', label: 'Studio' },
  chambre_habitant:  { icon: '🛏️', label: 'Chambre' },
  chambre_cour:      { icon: '🚪', label: 'Chambre cour' },
  habitat_precaire:  { icon: '🏚️', label: 'Habitat précaire' },
  boutique:          { icon: '🏪', label: 'Boutique' },
  bureau:            { icon: '💼', label: 'Bureau' },
  entrepot:          { icon: '🏭', label: 'Entrepôt' },
  local_commercial:  { icon: '🏬', label: 'Local commercial' },
  centre_commercial: { icon: '🛍️', label: 'Centre commercial' }
};

export default function LogementDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoActive, setPhotoActive] = useState(0);

  useEffect(() => {
    api.get('/logements/' + id)
      .then(res => setLogement(res.data.logement))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <p style={{textAlign:'center',padding:'100px'}}>Chargement...</p>
      </div>
    );
  }

  if (!logement) {
    return (
      <div>
        <Navbar />
        <p style={{textAlign:'center',padding:'100px'}}>Logement non trouve</p>
      </div>
    );
  }

  const cat = CATEGORIES[logement.categorie] || { icon: '🏠', label: 'Logement' };

  const photos = logement.photos
    ? (typeof logement.photos === 'string' ? JSON.parse(logement.photos) : logement.photos)
    : [];

  const equipements = [];
  if (logement.sanitaires_type === 'interne') equipements.push('🚿 Sanitaires internes');
  if (logement.sanitaires_type === 'externe') equipements.push('🚿 Sanitaires externes');
  if (logement.sanitaires_type === 'commun') equipements.push('🚿 Sanitaires communs');
  if (logement.acces_eau === 'robinet_interieur') equipements.push('🚰 Robinet intérieur');
  if (logement.acces_eau === 'robinet_exterieur') equipements.push('🚰 Robinet extérieur');
  if (logement.acces_eau === 'puits') equipements.push('🚰 Puits');
  if (logement.acces_eau === 'forage') equipements.push('🚰 Forage');
  if (logement.electricite === 'secteur') equipements.push('⚡ Secteur EDG');
  if (logement.electricite === 'solaire') equipements.push('☀️ Panneau solaire');
  if (logement.electricite === 'groupe') equipements.push('🔋 Groupe électrogène');
  if (logement.type_toit === 'dalle') equipements.push('🏢 Toit dalle béton');
  if (logement.type_toit === 'tole') equipements.push('🏠 Toit en tôle');
  if (logement.type_toit === 'chaume') equipements.push('🛖 Toit en chaume');
  if (logement.type_sol === 'carreaux') equipements.push('✨ Sol carrelé');
  if (logement.type_sol === 'ciment') equipements.push('🏗️ Sol cimenté');
  if (logement.type_sol === 'terre') equipements.push('🌱 Sol en terre');
  if (logement.parking) equipements.push('🚗 Parking');
  if (logement.jardin) equipements.push('🌿 Jardin');
  if (logement.climatisation) equipements.push('❄️ Climatisation');
  if (logement.gardien) equipements.push('👮 Gardien');

  const lat = logement.latitude;
  const lng = logement.longitude;
  const osmUrl = 'https://www.openstreetmap.org/export/embed.html?bbox='
    + (lng - 0.01) + ',' + (lat - 0.01) + ',' + (lng + 0.01) + ',' + (lat + 0.01)
    + '&layer=mapnik&marker=' + lat + ',' + lng;
  const osmLink = 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lng + '&zoom=17';

  return (
    <div>
      <Navbar />
      <div className="detail-page">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/logements">← Retour aux logements</Link>
          </div>
          <div className="detail-grid">

            <div className="detail-gauche">

              <div className="galerie">
                {photos.length > 0 && (
                  <div>
                    <div className="galerie-principale">
                      <img src={photos[photoActive].url} alt="logement" />
                      <span className={'detail-statut ' + logement.statut}>
                        {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
                      </span>
                    </div>
                    {photos.length > 1 && (
                      <div className="galerie-miniatures">
                        {photos.map((p, i) => (
                          <img
                            key={i}
                            src={p.url}
                            alt={'vue ' + (i + 1)}
                            className={photoActive === i ? 'active' : ''}
                            onClick={() => setPhotoActive(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {photos.length === 0 && (
                  <div className="galerie-vide">
                    <span>{cat.icon}</span>
                    <span className={'detail-statut ' + logement.statut}>
                      {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
                    </span>
                  </div>
                )}
              </div>

              <div className="detail-card">
                <div className="detail-categorie-badge">{cat.icon} {cat.label}</div>
                <h1 className="detail-titre">{logement.titre}</h1>
                <p className="detail-adresse">📍 {logement.adresse}, {logement.ville}, Guinée</p>

                <div className="detail-caract">
                  {logement.nb_chambres > 0 && (
                    <div className="caract-item">
                      <span className="caract-icon">🛏</span>
                      <span>{logement.nb_chambres}</span>
                      <small>Chambre(s)</small>
                    </div>
                  )}
                  {logement.nb_salles_bain > 0 && (
                    <div className="caract-item">
                      <span className="caract-icon">🚿</span>
                      <span>{logement.nb_salles_bain}</span>
                      <small>Salle(s) de bain</small>
                    </div>
                  )}
                  {logement.superficie && (
                    <div className="caract-item">
                      <span className="caract-icon">📐</span>
                      <span>{logement.superficie}</span>
                      <small>m²</small>
                    </div>
                  )}
                </div>

                {logement.description && (
                  <div className="detail-section">
                    <h3>📝 Description</h3>
                    <p>{logement.description}</p>
                  </div>
                )}

                {equipements.length > 0 && (
                  <div className="detail-section">
                    <h3>⚡ Équipements</h3>
                    <div className="equipements-liste">
                      {equipements.map((eq, i) => (
                        <span key={i}>{eq}</span>
                      ))}
                    </div>
                  </div>
                )}

                {logement.statut_foncier && logement.statut_foncier !== 'non_precise' && (
                  <div className="detail-section">
                    <h3>📜 Statut foncier</h3>
                    <span className="statut-foncier-badge">
                      {logement.statut_foncier === 'titre_foncier' && '📜 Titre foncier'}
                      {logement.statut_foncier === 'permis_habiter' && "🏛️ Permis d'habiter"}
                      {logement.statut_foncier === 'accord_coutumier' && '🤝 Accord coutumier'}
                      {logement.statut_foncier === 'sous_seing_prive' && '✍️ Sous-seing privé'}
                    </span>
                  </div>
                )}

                {lat && lng && (
                  <div className="detail-section">
                    <h3>🗺️ Localisation</h3>
                    <div className="carte-iframe-container">
                      <iframe
                        title="carte"
                        width="100%"
                        height="300"
                        frameBorder="0"
                        scrolling="no"
                        src={osmUrl}
                        style={{ borderRadius: '10px', border: '1px solid #ddd' }}
                      />
                    </div>
                    
                      href={osmLink}
                      target="_blank"
                      rel="noreferrer"
                      className="osm-link"
                    >
                      🗺️ Agrandir sur OpenStreetMap
                    </a>
                  </div>
                )}

              </div>
            </div>

            <div className="detail-droite">
              <div className="detail-sticky-card">
                <div className="detail-prix">
                  {Number(logement.prix_mensuel).toLocaleString()} GNF
                  <small>/mois</small>
                </div>
                <div className="proprio-box">
                  <div className="proprio-avatar">
                    {logement.proprietaire_prenom && logement.proprietaire_prenom.charAt(0)}
                    {logement.proprietaire_nom && logement.proprietaire_nom.charAt(0)}
                  </div>
                  <div>
                    <strong>{logement.proprietaire_prenom} {logement.proprietaire_nom}</strong>
                    <p>📞 {logement.proprietaire_telephone || 'N/A'}</p>
                  </div>
                </div>
                {logement.statut === 'disponible' && user && (