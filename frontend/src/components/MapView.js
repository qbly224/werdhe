/* eslint-disable */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { urlPremierePhoto } from '../utils/photos';

var MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN;

// Icônes inline (lucide-react) pour les popups Mapbox, qui attendent du HTML brut
var ICONES_SVG = {
  maison:       '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  localisation: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  lit:          '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  surface:      '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',
};
function svgInline(nom, taille, couleur) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + taille + '" height="' + taille + '" viewBox="0 0 24 24" fill="none" stroke="' + (couleur || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-2px">' + ICONES_SVG[nom] + '</svg>';
}

export default function MapView({ logements, onSelectLogement }) {
  var t            = useTranslation('logements').t;
  var mapRef       = useRef(null);
  var mapInstance  = useRef(null);
  var markersRef   = useRef([]);
  var [mapReady, setMapReady] = useState(false);

  // Logements réellement géolocalisés (coordonnées enregistrées au moment de la publication)
  var pointsGeolocalises = (logements || []).filter(function(l) {
    return l.latitude != null && l.longitude != null && !isNaN(parseFloat(l.latitude)) && !isNaN(parseFloat(l.longitude));
  });

  // Initialiser la carte
  useEffect(function() {
    if (!MAPBOX_TOKEN || mapInstance.current) return;

    var map = new mapboxgl.Map({
      container: mapRef.current,
      style:     'mapbox://styles/mapbox/satellite-streets-v12',
      center:    [-12.0, 10.5],
      zoom:      6.5,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', function() { setMapReady(true); });
    mapInstance.current = map;

    return function() {
      markersRef.current.forEach(function(m) { m.remove(); });
      markersRef.current = [];
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  // Ajouter les marqueurs
  useEffect(function() {
    if (!mapReady || !mapInstance.current) return;

    markersRef.current.forEach(function(m) { m.remove(); });
    markersRef.current = [];

    var bounds = new mapboxgl.LngLatBounds();

    pointsGeolocalises.forEach(function(l) {
      var lat = parseFloat(l.latitude);
      var lng = parseFloat(l.longitude);
      var couleur = l.statut === 'loue' ? '#888' : '#1B6B3A';

      var el = document.createElement('div');
      el.style.cssText = 'background:' + couleur + ';color:#fff;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;font-family:system-ui;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;cursor:pointer;';
      el.textContent = new Intl.NumberFormat('fr-FR').format(l.prix_mensuel) + ' GNF';
      el.addEventListener('click', function() { if (onSelectLogement) onSelectLogement(l); });

      var photoUrl = urlPremierePhoto(l.photos);
      var photoHtml = photoUrl
        ? '<img src="' + photoUrl + '" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />'
        : '<div style="height:90px;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;color:#1B6B3A;">' + svgInline('maison', 32) + '</div>';

      var popupHtml = '' +
        '<div style="font-family:system-ui;width:200px;padding:4px">' +
          photoHtml +
          '<div style="font-size:13px;font-weight:700;color:#1B2B22;margin-bottom:4px">' + l.titre + '</div>' +
          '<div style="font-size:11px;color:#888;margin-bottom:6px">' + svgInline('localisation', 11) + ' ' + l.ville + '</div>' +
          '<div style="font-size:15px;font-weight:800;color:#1B6B3A;margin-bottom:8px">' +
            new Intl.NumberFormat('fr-FR').format(l.prix_mensuel) + ' ' + t('mapView.popup.prixParMois') +
          '</div>' +
          (l.nb_chambres ? '<span style="font-size:11px;color:#555">' + svgInline('lit', 11) + ' ' + t('mapView.popup.chambresAbrev', { count: l.nb_chambres }) + ' </span>' : '') +
          (l.superficie ? '<span style="font-size:11px;color:#555">' + svgInline('surface', 11) + ' ' + parseFloat(l.superficie) + 'm²</span>' : '') +
          '<div style="margin-top:10px">' +
            '<a href="/logements/' + l.id + '" style="display:block;background:#1B6B3A;color:#fff;padding:8px;border-radius:8px;text-align:center;text-decoration:none;font-size:12px;font-weight:700;">' +
              t('mapView.popup.voirLeLogement') +
            '</a>' +
          '</div>' +
        '</div>';

      var marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 16, maxWidth: '220px' }).setHTML(popupHtml))
        .addTo(mapInstance.current);

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });

    if (!bounds.isEmpty()) {
      try { mapInstance.current.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 600 }); }
      catch (e) {}
    }
  }, [mapReady, logements, t]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ height: 460, borderRadius: 16, background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#888', fontSize: 13, padding: 24 }}>
        {t('mapView.tokenManquant')}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height: 460, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#555', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', gap: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#1B6B3A', borderRadius: '50%' }} /> {t('mapView.legende.disponible')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#888', borderRadius: '50%' }} /> {t('mapView.legende.occupe')}
        </span>
        <span style={{ color: '#888' }}>{t('mapView.legende.nbLogements', { count: pointsGeolocalises.length })}</span>
      </div>
    </div>
  );
}
