/* eslint-disable */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

var MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN;

// Mini-carte à un seul repère, pour localiser précisément un bien sur sa
// fiche — satellite + rues pour un rendu réaliste, sans popup ni contrôles
// superflus puisqu'il n'y a qu'un seul point à montrer.
export default function MiniCarteLogement({ latitude, longitude, hauteur }) {
  var t       = useTranslation('logements').t;
  var mapRef  = useRef(null);
  var mapInstance = useRef(null);

  var lat = latitude != null ? parseFloat(latitude) : null;
  var lng = longitude != null ? parseFloat(longitude) : null;
  var geolocalise = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

  useEffect(function() {
    if (!MAPBOX_TOKEN || !geolocalise || mapInstance.current) return;

    var map = new mapboxgl.Map({
      container:        mapRef.current,
      style:             'mapbox://styles/mapbox/satellite-streets-v12',
      center:            [lng, lat],
      zoom:              15,
      interactive:       true,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    var el = document.createElement('div');
    el.style.cssText = 'width:22px;height:22px;border-radius:50% 50% 50% 0;background:#F5A623;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);transform:rotate(-45deg);';
    new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);

    mapInstance.current = map;
    return function() { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [lat, lng, geolocalise]);

  if (!MAPBOX_TOKEN || !geolocalise) return null;

  return (
    <div ref={mapRef} style={{ height: hauteur || 220, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
  );
}
