/* eslint-disable */
import { useEffect, useRef, useState } from 'react';

// Coordonnées des villes de Guinée
var COORDS_GUINEE = {
  'conakry':     [9.6412, -13.5784],
  'kindia':      [10.0540, -12.8672],
  'kankan':      [10.3854, -9.3054],
  'labé':        [11.3190, -12.2847],
  'labe':        [11.3190, -12.2847],
  'nzérékoré':   [7.7562,  -8.8165],
  'nzerekore':   [7.7562,  -8.8165],
  'boké':        [10.9322, -14.2906],
  'boke':        [10.9322, -14.2906],
  'mamou':       [10.3742, -12.0834],
  'faranah':     [10.0356, -10.7460],
  'kissidougou': [9.1852,  -10.1241],
  'guékédou':    [8.5559,  -10.1308],
  'macenta':     [8.5524,  -9.4720],
  'koundara':    [12.4889, -13.3020],
  'gaoual':      [11.7526, -13.2106],
  'pita':        [11.0752, -12.3978],
  'télimélé':    [10.9062, -13.0294],
  'dubreka':     [9.7882,  -13.5157],
  'coyah':       [9.7145,  -13.3802],
  'forecariah':  [9.4333,  -13.0833],
  'boffa':       [10.1833, -14.0333],
  'fria':        [10.3667, -13.5500],
  'kolaboui':    [10.8500, -14.0500],
  'ratoma':      [9.6159,  -13.6137],
  'kaloum':      [9.5127,  -13.7130],
  'matam':       [9.5600,  -13.6800],
  'dixinn':      [9.5769,  -13.6567],
  'matoto':      [9.6167,  -13.5833],
};

function getCoords(ville) {
  if (!ville) return null;
  var key = ville.toLowerCase().trim();
  return COORDS_GUINEE[key] || null;
}

export default function MapView({ logements, onSelectLogement }) {
  var mapRef       = useRef(null);
  var mapInstance  = useRef(null);
  var markersLayer = useRef(null);
  var [mapReady, setMapReady] = useState(false);

  // Initialiser la carte
  useEffect(function() {
    if (mapInstance.current) return;

    import('leaflet').then(function(L) {
      if (mapInstance.current) return;

      var map = L.map(mapRef.current, {
        center:  [10.5, -12.0],
        zoom:    7,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current  = map;
      setMapReady(true);
    });

    return function() {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Ajouter les marqueurs
  useEffect(function() {
    if (!mapReady || !mapInstance.current) return;

    import('leaflet').then(function(L) {
      markersLayer.current.clearLayers();

      var bounds = [];

      logements.forEach(function(l) {
        var coords = getCoords(l.ville);
        if (!coords) return;

        // Ajouter un léger offset pour éviter superposition
        var lat = coords[0] + (Math.random() - 0.5) * 0.02;
        var lng = coords[1] + (Math.random() - 0.5) * 0.02;

        var couleur = l.statut === 'loue' ? '#888' : '#1B6B3A';

        // Icône personnalisée
        var icon = L.divIcon({
          className: '',
          html: `
            <div style="
              background: ${couleur};
              color: #fff;
              border-radius: 20px;
              padding: 4px 10px;
              font-size: 11px;
              font-weight: 700;
              font-family: system-ui;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              border: 2px solid #fff;
              cursor: pointer;
            ">
              ${new Intl.NumberFormat('fr-FR').format(l.prix_mensuel)} GNF
            </div>
          `,
          iconAnchor: [40, 16],
        });

        var marker = L.marker([lat, lng], { icon: icon });

        // Popup
        var photoHtml = l.photos && l.photos.length > 0
          ? `<img src="${l.photos[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
          : `<div style="height:90px;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:28px;">🏠</div>`;

        marker.bindPopup(`
          <div style="font-family:system-ui;width:200px;padding:4px">
            ${photoHtml}
            <div style="font-size:13px;font-weight:700;color:#1B2B22;margin-bottom:4px">${l.titre}</div>
            <div style="font-size:11px;color:#888;margin-bottom:6px">📍 ${l.ville}</div>
            <div style="font-size:15px;font-weight:800;color:#1B6B3A;margin-bottom:8px">
              ${new Intl.NumberFormat('fr-FR').format(l.prix_mensuel)} GNF/mois
            </div>
            ${l.nb_chambres ? `<span style="font-size:11px;color:#555">🛏️ ${l.nb_chambres} ch. </span>` : ''}
            ${l.superficie ? `<span style="font-size:11px;color:#555">📐 ${l.superficie}m²</span>` : ''}
            <div style="margin-top:10px">
              <a href="/logements/${l.id}"
                style="display:block;background:#1B6B3A;color:#fff;padding:8px;border-radius:8px;text-align:center;text-decoration:none;font-size:12px;font-weight:700;">
                Voir le logement →
              </a>
            </div>
          </div>
        `, { maxWidth: 220 });

        marker.on('click', function() {
          if (onSelectLogement) onSelectLogement(l);
        });

        markersLayer.current.addLayer(marker);
        bounds.push([lat, lng]);
      });

      // Centrer sur les marqueurs
      if (bounds.length > 0) {
        try { mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 }); }
        catch (e) {}
      }
    });
  }, [mapReady, logements]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height: 460, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#555', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', gap: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#1B6B3A', borderRadius: '50%' }} /> Disponible
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#888', borderRadius: '50%' }} /> Occupé
        </span>
        <span style={{ color: '#888' }}>{logements.length} logement(s)</span>
      </div>
    </div>
  );
}