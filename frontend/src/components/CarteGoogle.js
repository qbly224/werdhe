import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';

const CarteGoogle = ({ logement }) => {
  const [infoOuverte, setInfoOuverte] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || ''
  });

  // Si pas de coordonnées → ne pas afficher
  if (!logement?.latitude || !logement?.longitude) {
    return (
      <div style={{
        background: '#f5f5f5',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        color: '#888'
      }}>
        🗺️ Localisation non disponible pour ce bien
      </div>
    );
  }

  const centre = {
    lat: parseFloat(logement.latitude),
    lng: parseFloat(logement.longitude)
  };

  if (loadError) {
    // Fallback sur Leaflet si Google Maps échoue
    return (
      <div style={{
        background: '#fff3e0',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        color: '#e65100',
        fontSize: '14px'
      }}>
        ⚠️ Google Maps non disponible.
        
          href={`https://www.openstreetmap.org/?mlat=${logement.latitude}&mlon=${logement.longitude}&zoom=16`}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#2E7D32', fontWeight: 700, marginLeft: '8px' }}
        >
          Voir sur OpenStreetMap →
        </a>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        height: '350px',
        background: '#f5f5f5',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888'
      }}>
        ⏳ Chargement de la carte...
      </div>
    );
  }

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <GoogleMap
        mapContainerStyle={{ height: '350px', width: '100%' }}
        center={centre}
        zoom={16}
        options={{
          mapTypeId: 'hybrid',       // Vue satellite + noms de rues
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true
        }}
      >
        <Marker
          position={centre}
          onClick={() => setInfoOuverte(true)}
          icon={{
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                <path d="M20 0 C9 0 0 9 0 20 C0 35 20 50 20 50 C20 50 40 35 40 20 C40 9 31 0 20 0Z"
                  fill="#2E7D32" stroke="white" stroke-width="2"/>
                <text x="20" y="25" text-anchor="middle" font-size="18">🏠</text>
              </svg>
            `),
            scaledSize: { width: 40, height: 50 }
          }}
        >
          {infoOuverte && (
            <InfoWindow
              position={centre}
              onCloseClick={() => setInfoOuverte(false)}
            >
              <div style={{ maxWidth: '200px', fontFamily: 'Arial, sans-serif' }}>
                <strong style={{ color: '#1B5E20', fontSize: '14px' }}>
                  {logement.titre}
                </strong>
                <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                  📍 {logement.adresse}, {logement.ville}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1B5E20' }}>
                  {Number(logement.prix_mensuel).toLocaleString()} GNF/mois
                </p>
              </div>
            </InfoWindow>
          )}
        </Marker>
      </GoogleMap>

      {/* Lien OpenStreetMap en complément */}
      <div style={{
        background: '#f9f9f9',
        padding: '10px 16px',
        fontSize: '12px',
        color: '#888',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>📍 {logement.adresse}, {logement.ville}, Guinée</span>
        
          href={`https://www.openstreetmap.org/?mlat=${logement.latitude}&mlon=${logement.longitude}&zoom=16`}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#2E7D32', fontWeight: 600, textDecoration: 'none' }}
        >
          Voir sur OSM →
        </a>
      </div>
    </div>
  );
};

export default CarteGoogle;