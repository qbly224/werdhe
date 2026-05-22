import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';

const CarteGoogle = ({ logement }) => {
  const [infoOuverte, setInfoOuverte] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || ''
  });

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
    return (
      <div style={{
        background: '#fff3e0',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        color: '#e65100',
        fontSize: '14px'
      }}>
        <span>⚠️ Google Maps non disponible. </span>
        
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
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
    }}>
      <GoogleMap
        mapContainerStyle={{ height: '350px', width: '100%' }}
        center={centre}
        zoom={16}
        options={{
          mapTypeId: 'hybrid',
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true
        }}
      >
        <Marker
          position={centre}
          onClick={() => setInfoOuverte(true)}
        >
          {infoOuverte && (
            <InfoWindow
              position={centre}
              onCloseClick={() => setInfoOuverte(false)}
            >
              <div style={{
                maxWidth: '200px',
                fontFamily: 'Arial, sans-serif'
              }}>
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