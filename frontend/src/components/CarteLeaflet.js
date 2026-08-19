/* eslint-disable */
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CarteLeaflet.css';
import { MapPin, BedDouble, Maximize2, Navigation } from 'lucide-react';

// Fix icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

// Marqueur SVG custom (sans emoji)
function creerMarqueur(statut, prix) {
  var couleur = statut === 'disponible' ? '#1B6B3A' : '#E53935';
  var label   = prix ? GNF(prix) + ' GNF' : '';
  return L.divIcon({
    className: '',
    html: [
      '<div style="position:relative;display:flex;flex-direction:column;align-items:center;">',
        '<div style="',
          'background:', couleur, ';',
          'color:#fff;',
          'font-size:10px;font-weight:700;',
          'padding:3px 7px;',
          'border-radius:20px;',
          'white-space:nowrap;',
          'box-shadow:0 2px 8px rgba(0,0,0,0.25);',
          'border:2px solid #fff;',
          'margin-bottom:2px;',
        '">', label || (statut === 'disponible' ? 'Disponible' : 'Loué'), '</div>',
        '<div style="',
          'width:0;height:0;',
          'border-left:6px solid transparent;',
          'border-right:6px solid transparent;',
          'border-top:8px solid ', couleur, ';',
        '"></div>',
      '</div>',
    ].join(''),
    iconSize:   [80, 40],
    iconAnchor: [40, 40],
    popupAnchor:[0, -42],
  });
}

// Marqueur géolocalisation
var marqUser = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#1565C0;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(21,101,192,0.25);"></div>',
  iconSize:   [14, 14],
  iconAnchor: [7, 7],
});

// Recentrer automatiquement sur les logements
function RecentrerCarte({ logements }) {
  var map = useMap();
  useEffect(function() {
    var valides = logements.filter(function(l) { return l.latitude && l.longitude; });
    if (valides.length > 0) {
      var bounds = L.latLngBounds(valides.map(function(l) { return [l.latitude, l.longitude]; }));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [logements, map]);
  return null;
}

// Marqueur position utilisateur
function MarqueurUser({ pos }) {
  if (!pos) return null;
  return <Marker position={pos} icon={marqUser} />;
}

var CATEGORIES = {
  villa_luxe:       'Villa luxe',
  villa_standard:   'Villa',
  maison_moderne:   'Maison moderne',
  maison_banco:     'Maison traditionnelle',
  appartement:      'Appartement',
  duplex:           'Duplex',
  studio_moderne:   'Studio',
  chambre_habitant: 'Chambre',
  bureau:           'Bureau',
  local_commercial: 'Local commercial',
  boutique:         'Boutique',
  concession:       'Concession',
};

export default function CarteLeaflet({ logements, hauteur }) {
  var [posUser, setPosUser]       = useState(null);
  var [geoLoading, setGeoLoading] = useState(false);
  var [filtre, setFiltre]         = useState('tous');

  var logementsValides = logements.filter(function(l) {
    return l.latitude && l.longitude && !isNaN(l.latitude) && !isNaN(l.longitude);
  });

  var logementsFiltres = logementsValides.filter(function(l) {
    if (filtre === 'disponible') return l.statut === 'disponible';
    if (filtre === 'loue')       return l.statut === 'loue';
    return true;
  });

  function getPhotos(l) {
    if (!l.photos) return [];
    try {
      var p = typeof l.photos === 'string' ? JSON.parse(l.photos) : l.photos;
      return p.map(function(x) { return typeof x === 'string' ? x : (x.url || ''); });
    } catch(e) { return []; }
  }

  function geolocaliser() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      function(pos) { setPosUser([pos.coords.latitude, pos.coords.longitude]); setGeoLoading(false); },
      function()    { setGeoLoading(false); },
      { timeout: 8000 }
    );
  }

  var nbDispo = logementsValides.filter(function(l) { return l.statut === 'disponible'; }).length;
  var nbLoue  = logementsValides.filter(function(l) { return l.statut === 'loue'; }).length;

  return (
    <div style={{ position: 'relative', height: hauteur || '500px', borderRadius: 16, overflow: 'hidden', border: '1px solid #E0E0E0' }}>

      {/* Barre filtres */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: 6, background: '#fff', borderRadius: 30, padding: '4px 6px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        {[
          { val: 'tous',       label: 'Tous (' + logementsValides.length + ')'  },
          { val: 'disponible', label: 'Disponibles (' + nbDispo + ')'           },
          { val: 'loue',       label: 'Loués (' + nbLoue + ')'                  },
        ].map(function(f) {
          return (
            <button key={f.val} onClick={function() { setFiltre(f.val); }}
              style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filtre === f.val ? 700 : 500, background: filtre === f.val ? '#1B6B3A' : 'transparent', color: filtre === f.val ? '#fff' : '#555', transition: 'all .15s' }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Bouton géolocalisation */}
      <button onClick={geolocaliser} disabled={geoLoading}
        style={{ position: 'absolute', bottom: 60, right: 10, zIndex: 1000, width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid #E0E0E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', color: geoLoading ? '#aaa' : '#1B6B3A' }}>
        <Navigation size={16} strokeWidth={1.5} />
      </button>

      {/* Carte */}
      <MapContainer center={[9.6412, -13.5784]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecentrerCarte logements={logementsValides} />
        <MarqueurUser pos={posUser} />

        {logementsFiltres.map(function(l) {
          var photos = getPhotos(l);
          var cat    = CATEGORIES[l.categorie] || 'Logement';
          var photo  = photos[0] || null;

          return (
            <Marker key={l.id} position={[l.latitude, l.longitude]} icon={creerMarqueur(l.statut, l.prix_mensuel)}>
              <Popup className="popup-werdhe" maxWidth={280} minWidth={240}>
                <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                  {/* Photo */}
                  {photo ? (
                    <img src={photo} alt={l.titre}
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '10px 10px 0 0', display: 'block' }} />
                  ) : (
                    <div style={{ height: 80, background: '#E8F5E9', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={28} strokeWidth={1} color="#1B6B3A" />
                    </div>
                  )}

                  {/* Contenu */}
                  <div style={{ padding: '12px 14px 14px' }}>
                    {/* Badge statut + catégorie */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <span style={{ background: l.statut === 'disponible' ? '#E8F5E9' : '#FFEBEE', color: l.statut === 'disponible' ? '#1B6B3A' : '#E53935', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                        {l.statut === 'disponible' ? 'Disponible' : 'Loué'}
                      </span>
                      <span style={{ background: '#F5F5F5', color: '#888', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
                        {cat}
                      </span>
                    </div>

                    {/* Titre */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 4, lineHeight: 1.3 }}>{l.titre}</div>

                    {/* Adresse */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888', marginBottom: 10 }}>
                      <MapPin size={11} strokeWidth={1.5} />
                      {l.adresse}, {l.ville}
                    </div>

                    {/* Détails */}
                    {(l.nb_chambres || l.superficie) && (
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        {l.nb_chambres > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#555' }}>
                            <BedDouble size={13} strokeWidth={1.5} /> {l.nb_chambres} ch.
                          </span>
                        )}
                        {l.superficie && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#555' }}>
                            <Maximize2 size={13} strokeWidth={1.5} /> {l.superficie}m²
                          </span>
                        )}
                      </div>
                    )}

                    {/* Prix + bouton */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#1B6B3A' }}>{GNF(l.prix_mensuel)}</span>
                        <span style={{ fontSize: 11, color: '#888', marginLeft: 3 }}>GNF/mois</span>
                      </div>
                      <Link to={'/logements/' + l.id}
                        style={{ background: '#1B6B3A', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Voir
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Légende */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, background: '#fff', borderRadius: 10, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#1B6B3A', borderRadius: '50%' }} />
          <span style={{ color: '#555' }}>Disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#E53935', borderRadius: '50%' }} />
          <span style={{ color: '#555' }}>Loué</span>
        </div>
        <div style={{ width: 1, height: 14, background: '#E0E0E0' }} />
        <span style={{ color: '#888', fontWeight: 600 }}>{logementsFiltres.length} bien(s)</span>
      </div>
    </div>
  );
}