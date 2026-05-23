import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CarteLeaflet from '../components/CarteLeaflet';
import './LogementDetail.css';

const CATEGORIE_INFO = {
  villa_luxe:        { icon: '👑', label: 'Villa de luxe' },
  villa_standard:    { icon: '🏰', label: 'Villa standard' },
  maison_moderne:    { icon: '🏠', label: 'Maison moderne' },
  maison_banco:      { icon: '🛖', label: 'Maison traditionnelle' },
  maison_chantier:   { icon: '🏗️', label: 'Maison en construction' },
  concession:        { icon: '🏘️', label: 'Concession familiale' },
  appartement:       { icon: '🏢', label: 'Appartement' },
  duplex:            { icon: '🏬', label: 'Duplex' },
  logement_social:   { icon: '🏛️', label: 'Logement social' },
  studio_moderne:    { icon: '🏨', label: 'Studio moderne' },
  chambre_habitant:  { icon: '🛏️', label: 'Chambre chez l\'habitant' },
  chambre_cour:      { icon: '🚪', label: 'Chambre en cour commune' },
  habitat_precaire:  { icon: '🏚️', label: 'Habitat précaire' },
  boutique:          { icon: '🏪', label: 'Boutique' },
  bureau:            { icon: '💼', label: 'Bureau' },
  entrepot:          { icon: '🏭', label: 'Entrepôt' },
  local_commercial:  { icon: '🏬', label: 'Local commercial' },
  centre_commercial: { icon: '🛍️', label: 'Centre commercial' }
};

// ================================
// FONCTIONS HELPER (évite ternaires imbriqués)
// ================================
const getEtatIcon = (etat) => {
  if (etat === 'neuf') return '✨';
  if (etat === 'bon_etat') return '✅';
  if (etat === 'a_renover') return '🔧';
  if (etat === 'en_construction') return '🏗️';
  return '⚠️';
};

const getEtatLabel = (etat) => {
  if (etat === 'neuf') return 'Neuf';
  if (etat === 'bon_etat') return 'Bon état';
  if (etat === 'a_renover') return 'À rénover';
  if (etat === 'en_construction') return 'En construction';
  return 'Vétuste';
};

const getSanitairesLabel = (type) => {
  if (type === 'interne') return 'Sanitaires internes';
  if (type === 'externe') return 'Sanitaires externes';
  if (type === 'commun') return 'Sanitaires communs';
  return 'Sans sanitaires';
};

const getEauLabel = (acces) => {
  if (acces === 'robinet_interieur') return 'Robinet intérieur';
  if (acces === 'robinet_exterieur') return 'Robinet extérieur';
  if (acces === 'puits') return 'Puits';
  if (acces === 'forage') return 'Forage';
  return 'Borne publique';
};

const getElectriciteLabel = (elec) => {
  if (elec === 'secteur') return 'Secteur EDG';
  if (elec === 'solaire') return 'Solaire';
  if (elec === 'groupe') return 'Groupe électrogène';
  return 'Sans électricité';
};

const getToitLabel = (toit) => {
  if (toit === 'dalle') return 'Dalle béton';
  if (toit === 'tole') return 'Tôle';
  if (toit === 'chaume') return 'Chaume';
  return 'Autre';
};

const getSolLabel = (sol) => {
  if (sol === 'carreaux') return 'Carreaux';
  if (sol === 'ciment') return 'Ciment';
  if (sol === 'terre') return 'Terre';
  return 'Autre';
};

const getStatutFoncierLabel = (statut) => {
  if (statut === 'titre_foncier') return '📜 Titre foncier';
  if (statut === 'permis_habiter') return "🏛️ Permis d'habiter";
  if (statut === 'accord_coutumier') return '🤝 Accord coutumier';
  return '✍️ Sous-seing privé';
};

// ================================
// COMPOSANT BOUTON RÉSERVATION
// ================================
const BoutonReservation = ({ logement, user }) => {
  if (logement.statut !== 'disponible') {
    return (
      <div className="loue-badge">
        🔴 Ce logement est actuellement loué
      </div>
    );
  }
  if (user) {
    return (
      <Link
        to={`/logements/${logement.id}/reserver`}
        className="btn btn-primary btn-full-detail"
      >
        📅 Réserver ce logement
      </Link>
    );
  }
  return (
    <Link
      to="/login"
      className="btn btn-secondary btn-full-detail"
    >
      🔐 Connectez-vous pour réserver
    </Link>
  );
};

// ================================
// COMPOSANT PRINCIPAL
// ================================
const LogementDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoActive, setPhotoActive] = useState(0);

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get(`/logements/${id}`);
        setLogement(res.data.logement);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px' }}>
          ⏳ Chargement...
        </div>
      </div>
    );
  }

  if (!logement) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px' }}>
          ❌ Logement non trouvé
        </div>
      </div>
    );
  }

  const cat = CATEGORIE_INFO[logement.categorie] || { icon: '🏠', label: 'Logement' };

  const photos = logement.photos
    ? (typeof logement.photos === 'string'
        ? JSON.parse(logement.photos)
        : logement.photos)
    : [];

  return (
    <div>
      <Navbar />
      <div className="detail-page">
        <div className="container">

          <div className="breadcrumb">
            <Link to="/logements">← Retour aux logements</Link>
          </div>

          <div className="detail-grid">

            {/* Colonne gauche */}
            <div className="detail-gauche">

              {/* Galerie */}
              <div className="galerie">
                {photos.length > 0 ? (
                  <div>
                    <div className="galerie-principale">
                      <img src={photos[photoActive].url} alt="logement" />
                      <span className={`detail-statut ${logement.statut}`}>
                        {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
                      </span>
                    </div>
                    {photos.length > 1 && (
                      <div className="galerie-miniatures">
                        {photos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo.url}
                            alt={`vue ${i + 1}`}
                            className={photoActive === i ? 'active' : ''}
                            onClick={() => setPhotoActive(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="galerie-vide">
                    <span>{cat.icon}</span>
                    <span className={`detail-statut ${logement.statut}`}>
                      {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
                    </span>
                  </div>
                )}
              </div>

              {/* Détails */}
              <div className="detail-card">

                <div className="detail-categorie-badge">
                  {cat.icon} {cat.label}
                </div>

                <h1 className="detail-titre">{logement.titre}</h1>

                <p className="detail-adresse">
                  📍 {logement.adresse}, {logement.ville}, Guinée
                </p>

                {/* Caractéristiques */}
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
                  {logement.etat && (
                    <div className="caract-item">
                      <span className="caract-icon">{getEtatIcon(logement.etat)}</span>
                      <small>{getEtatLabel(logement.etat)}</small>
                    </div>
                  )}
                </div>

                {/* Description */}
                {logement.description && (
                  <div className="detail-section">
                    <h3>📝 Description</h3>
                    <p>{logement.description}</p>
                  </div>
                )}

                {/* Équipements */}
                <div className="detail-section">
                  <h3>⚡ Équipements</h3>
                  <div className="equipements-liste">
                    {logement.sanitaires_type && (
                      <span>🚿 {getSanitairesLabel(logement.sanitaires_type)}</span>
                    )}
                    {logement.acces_eau && (
                      <span>🚰 {getEauLabel(logement.acces_eau)}</span>
                    )}
                    {logement.electricite && (
                      <span>⚡ {getElectriciteLabel(logement.electricite)}</span>
                    )}
                    {logement.type_toit && (
                      <span>🏠 Toit : {getToitLabel(logement.type_toit)}</span>
                    )}
                    {logement.type_sol && (
                      <span>🏗️ Sol : {getSolLabel(logement.type_sol)}</span>
                    )}
                    {logement.parking && <span>🚗 Parking</span>}
                    {logement.jardin && <span>🌿 Jardin / Cour</span>}
                    {logement.climatisation && <span>❄️ Climatisation</span>}
                    {logement.gardien && <span>👮 Gardien</span>}
                  </div>
                </div>

                {/* Statut foncier */}
                {logement.statut_foncier && logement.statut_foncier !== 'non_precise' && (
                  <div className="detail-section">
                    <h3>📜 Statut foncier</h3>
                    <span className="statut-foncier-badge">
                      {getStatutFoncierLabel(logement.statut_foncier)}
                    </span>
                  </div>
                )}

                {/* Carte Leaflet */}
                {logement.latitude && logement.longitude && (
                  <div className="detail-section">
                    <h3>🗺️ Localisation</h3>
                    <CarteLeaflet logements={[logement]} hauteur="300px" />
                    
                      href={`https://www.openstreetmap.org/?mlat=${logement.latitude}&mlon=${logement.longitude}&zoom=17`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        marginTop: '10px',
                        color: '#2E7D32',
                        fontWeight: 600,
                        fontSize: '13px',
                        textDecoration: 'none'
                      }}
                    >
                      🗺️ Agrandir sur OpenStreetMap →
                    </a>
                  </div>
                )}

              </div>
            </div>

            {/* Colonne droite */}
            <div className="detail-droite">
              <div className="detail-sticky-card">

                <div className="detail-prix">
                  {Number(logement.prix_mensuel).toLocaleString()} GNF
                  <small>/mois</small>
                </div>

                <div className="proprio-box">
                  <div className="proprio-avatar">
                    {logement.proprietaire_prenom?.charAt(0)}
                    {logement.proprietaire_nom?.charAt(0)}
                  </div>
                  <div>
                    <strong>
                      {logement.proprietaire_prenom} {logement.proprietaire_nom}
                    </strong>
                    <p>📞 {logement.proprietaire_telephone || 'N/A'}</p>
                  </div>
                </div>

                <BoutonReservation logement={logement} user={user} />

                <button
                  className="btn-partager"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Lien copié !');
                  }}
                >
                  🔗 Copier le lien
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LogementDetail;