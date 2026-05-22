import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CarteLeaflet.css';

// Fix icônes Leaflet avec React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icônes personnalisées selon statut
const creerIcone = (statut) => {
  const couleur = statut === 'disponible' ? '#2E7D32' : '#c62828';
  return L.divIcon({
    className: 'marqueur-custom',
    html: `
      <div style="
        background: ${couleur};
        width: 32px; height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">🏠</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Composant pour recentrer la carte quand les logements changent
const RecentrerCarte = ({ logements }) => {
  const map = useMap();
  useEffect(() => {
    if (logements.length > 0) {
      const valides = logements.filter(l => l.latitude && l.longitude);
      if (valides.length > 0) {
        const bounds = L.latLngBounds(
          valides.map(l => [l.latitude, l.longitude])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [logements, map]);
  return null;
};

const CATEGORIE_INFO = {
  villa_luxe: { icon: '👑', label: 'Villa luxe' },
  villa_standard: { icon: '🏰', label: 'Villa' },
  maison_moderne: { icon: '🏠', label: 'Maison' },
  maison_banco: { icon: '🛖', label: 'Maison trad.' },
  maison_chantier: { icon: '🏗️', label: 'En construction' },
  concession: { icon: '🏘️', label: 'Concession' },
  appartement: { icon: '🏢', label: 'Appartement' },
  duplex: { icon: '🏬', label: 'Duplex' },
  studio_moderne: { icon: '🏨', label: 'Studio' },
  chambre_habitant: { icon: '🛏️', label: 'Chambre' },
  boutique: { icon: '🏪', label: 'Boutique' },
  bureau: { icon: '💼', label: 'Bureau' },
  local_commercial: { icon: '🏬', label: 'Local comm.' }
};

const CarteLeaflet = ({ logements, hauteur = '500px' }) => {
  // Centre par défaut : Conakry
  const centre = [9.6412, -13.5784];
  const zoom = 12;

  const logementsValides = logements.filter(
    l => l.latitude && l.longitude &&
    !isNaN(l.latitude) && !isNaN(l.longitude)
  );

  const photos = (logement) => {
    if (!logement.photos) return [];
    return typeof logement.photos === 'string'
      ? JSON.parse(logement.photos)
      : logement.photos;
  };

  return (
    <div className="carte-container" style={{ height: hauteur }}>
      <MapContainer
        center={centre}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Fond de carte OpenStreetMap */}
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recentrer automatiquement */}
        <RecentrerCarte logements={logementsValides} />

        {/* Marqueurs */}
        {logementsValides.map(logement => {
          const cat = CATEGORIE_INFO[logement.categorie] || { icon: '🏠', label: 'Logement' };
          const photosList = photos(logement);

          return (
            <Marker
              key={logement.id}
              position={[logement.latitude, logement.longitude]}
              icon={creerIcone(logement.statut)}
            >
              <Popup className="popup-logement" maxWidth={280}>
                <div className="popup-content">

                  {/* Photo ou icône */}
                  {photosList.length > 0 ? (
                    <img
                      src={photosList[0].url}
                      alt="logement"
                      className="popup-photo"
                    />
                  ) : (
                    <div className="popup-no-photo">{cat.icon}</div>
                  )}

                  <div className="popup-body">
                    <div className="popup-categorie">
                      {cat.icon} {cat.label}
                    </div>
                    <h4 className="popup-titre">{logement.titre}</h4>
                    <p className="popup-adresse">
                      📍 {logement.adresse}, {logement.ville}
                    </p>

                    <div className="popup-details">
                      {logement.nb_chambres > 0 && (
                        <span>🛏 {logement.nb_chambres} ch.</span>
                      )}
                      {logement.nb_salles_bain > 0 && (
                        <span>🚿 {logement.nb_salles_bain} sdb.</span>
                      )}
                      {logement.superficie && (
                        <span>📐 {logement.superficie}m²</span>
                      )}
                    </div>

                    <div className="popup-footer">
                      <span className="popup-prix">
                        {Number(logement.prix_mensuel).toLocaleString()} GNF
                        <small>/mois</small>
                      </span>
                      <Link
                        to={`/logements/${logement.id}`}
                        className="popup-btn"
                      >
                        Voir →
                      </Link>
                    </div>

                    <span className={`popup-statut ${logement.statut}`}>
                      {logement.statut === 'disponible'
                        ? '✅ Disponible' : '🔴 Loué'}
                    </span>
                  </div>

                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Légende */}
      <div className="carte-legende">
        <div className="legende-item">
          <span className="legende-dot disponible"></span>
          Disponible ({logementsValides.filter(l => l.statut === 'disponible').length})
        </div>
        <div className="legende-item">
          <span className="legende-dot loue"></span>
          Loué ({logementsValides.filter(l => l.statut === 'loue').length})
        </div>
        <div className="legende-total">
          {logementsValides.length} bien(s) sur la carte
        </div>
      </div>
    </div>
  );
};

export default CarteLeaflet;