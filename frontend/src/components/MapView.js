/* eslint-disable */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { urlPremierePhoto } from '../utils/photos';
import { CATEGORIE_INFO, CATEGORIE_DEFAUT } from './CarteLogement';

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

// Regroupe les points proches à l'écran (distance en pixels, pas en mètres) pour
// que les pins se séparent naturellement en zoomant, comme sur une vraie carte.
var SEUIL_REGROUPEMENT_PX = 46;
function regrouperParPixel(map, points) {
  var restants = points.slice();
  var groupes = [];
  while (restants.length) {
    var pivot = restants.shift();
    var pivotPx = map.project([parseFloat(pivot.longitude), parseFloat(pivot.latitude)]);
    var groupe = [pivot];
    restants = restants.filter(function(l) {
      var px = map.project([parseFloat(l.longitude), parseFloat(l.latitude)]);
      var dist = Math.hypot(px.x - pivotPx.x, px.y - pivotPx.y);
      if (dist < SEUIL_REGROUPEMENT_PX) { groupe.push(l); return false; }
      return true;
    });
    groupes.push(groupe);
  }
  return groupes;
}

export default function MapView({ logements, onSelectLogement }) {
  var t            = useTranslation('logements').t;
  var mapRef       = useRef(null);
  var mapInstance  = useRef(null);
  var markersRef   = useRef([]);
  var popupsRef    = useRef([]);
  var popupOuvert  = useRef(null);
  var debounceRef  = useRef(null);
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
      style:     'mapbox://styles/mapbox/dark-v11',
      center:    [-12.0, 10.5],
      zoom:      6.5,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', function() { setMapReady(true); });
    mapInstance.current = map;

    return function() {
      markersRef.current.forEach(function(m) { m.remove(); });
      markersRef.current = [];
      popupsRef.current.forEach(function(p) { p.remove(); });
      popupsRef.current = [];
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  // Ajuster le cadrage une seule fois quand la liste de logements change
  useEffect(function() {
    if (!mapReady || !mapInstance.current || !pointsGeolocalises.length) return;
    var bounds = new mapboxgl.LngLatBounds();
    pointsGeolocalises.forEach(function(l) {
      bounds.extend([parseFloat(l.longitude), parseFloat(l.latitude)]);
    });
    try { mapInstance.current.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 600 }); }
    catch (e) {}
  }, [mapReady, logements]);

  // Dessiner les pins (regroupés par proximité à l'écran) et les ré-dessiner
  // quand on zoome ou qu'on déplace la carte, pour que les groupes se séparent
  useEffect(function() {
    if (!mapReady || !mapInstance.current) return;
    var map = mapInstance.current;

    function dessiner() {
      markersRef.current.forEach(function(m) { m.remove(); });
      markersRef.current = [];
      popupsRef.current.forEach(function(p) { p.remove(); });
      popupsRef.current = [];
      popupOuvert.current = null;

      var groupes = regrouperParPixel(map, pointsGeolocalises);

      groupes.forEach(function(groupe) {
        var disponible = groupe.some(function(l) { return l.statut === 'disponible'; });
        var representant = groupe.slice().sort(function(a, b) { return a.prix_mensuel - b.prix_mensuel; })[0];
        var lat = parseFloat(representant.latitude);
        var lng = parseFloat(representant.longitude);
        var photoUrl = urlPremierePhoto(representant.photos);
        var couleurGlow = disponible ? 'rgba(54,210,120,' : 'rgba(180,180,180,';

        var el = document.createElement('div');
        el.style.cssText = 'width:52px;height:52px;cursor:pointer;';
        el.innerHTML =
          '<div style="width:52px;height:52px;border-radius:50%;position:relative;overflow:hidden;' +
            'background:linear-gradient(135deg,#3A5A48,#1E3528);' +
            'box-shadow:0 0 0 3px #122018,0 0 0 5px ' + couleurGlow + '0.55),0 0 18px 3px ' + couleurGlow + '0.45);' +
            'display:flex;align-items:center;justify-content:center;transition:transform .15s ease;">' +
            (photoUrl
              ? '<img src="' + photoUrl + '" style="width:100%;height:100%;object-fit:cover" />'
              : svgInline('maison', 20, '#9FD8B6')) +
          '</div>' +
          (groupe.length > 1
            ? '<div style="position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 4px;background:#F5A623;color:#1B1200;font-size:10.5px;font-weight:800;border-radius:10px;display:flex;align-items:center;justify-content:center;border:2px solid #122018;font-family:system-ui;">' + groupe.length + '</div>'
            : '');

        var pinEl = el.firstElementChild;

        var catInfo = CATEGORIE_INFO[representant.categorie] || CATEGORIE_DEFAUT;
        var photoHtml = photoUrl
          ? '<img src="' + photoUrl + '" style="width:100%;height:100%;object-fit:cover;display:block" />'
          : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#3A5A48,#1E3528);display:flex;align-items:center;justify-content:center;">' + svgInline('maison', 30, '#9FD8B6') + '</div>';
        var pillStatut = disponible
          ? '<span style="font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:20px;background:#36D278;color:#07210F">' + t('carteLogement.statut.disponible') + '</span>'
          : '<span style="font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:20px;background:rgba(255,255,255,0.75);color:#1B1200">' + t('carteLogement.statut.loue') + '</span>';

        var titreHtml = groupe.length > 1
          ? t('mapView.popup.biensIci', { count: groupe.length })
          : representant.titre;
        var statsHtml = groupe.length > 1
          ? '<span style="font-size:11px;color:#B9C2B9">' + t('mapView.popup.aPartirDe') + '</span>'
          : '' +
            (representant.nb_chambres ? '<span style="font-size:11px;color:#B9C2B9;margin-right:10px">' + svgInline('lit', 11) + ' ' + t('mapView.popup.chambresAbrev', { count: representant.nb_chambres }) + '</span>' : '') +
            (representant.superficie ? '<span style="font-size:11px;color:#B9C2B9">' + svgInline('surface', 11) + ' ' + parseFloat(representant.superficie) + 'm²</span>' : '');

        var popupHtml = '' +
          '<div style="font-family:system-ui;width:220px;background:#15241D;border-radius:14px;overflow:hidden;color:#F3EEE2">' +
            '<div style="height:112px;position:relative">' +
              photoHtml +
              '<div style="position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between">' +
                '<span style="font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:20px;background:rgba(14,24,19,0.72)">' + t(catInfo.label_key) + '</span>' +
                pillStatut +
              '</div>' +
            '</div>' +
            '<div style="padding:11px 13px 13px">' +
              '<div style="font-size:13.5px;font-weight:700;margin-bottom:4px;line-height:1.3">' + titreHtml + '</div>' +
              '<div style="font-size:11px;color:#B9C2B9;margin-bottom:7px">' + svgInline('localisation', 11) + ' ' + representant.ville + '</div>' +
              '<div style="margin-bottom:8px">' + statsHtml + '</div>' +
              '<div style="font-size:15px;font-weight:800;color:#F5A623">' +
                new Intl.NumberFormat('fr-FR').format(representant.prix_mensuel) + ' ' + t('mapView.popup.prixParMois') +
              '</div>' +
            '</div>' +
          '</div>';

        var popup = new mapboxgl.Popup({ offset: 30, closeButton: false, closeOnClick: false, anchor: 'bottom', maxWidth: '240px' })
          .setLngLat([lng, lat])
          .setHTML(popupHtml);
        popupsRef.current.push(popup);

        var estOuvert = false;
        function ouvrirApercu() {
          if (popupOuvert.current && popupOuvert.current !== popup) popupOuvert.current.remove();
          popup.addTo(map);
          popupOuvert.current = popup;
          estOuvert = true;
        }
        function fermerApercu() {
          popup.remove();
          if (popupOuvert.current === popup) popupOuvert.current = null;
          estOuvert = false;
        }

        el.addEventListener('mouseenter', function() {
          if (pinEl) pinEl.style.transform = 'scale(1.08)';
          ouvrirApercu();
        });
        el.addEventListener('mouseleave', function() {
          if (pinEl) pinEl.style.transform = 'scale(1)';
          fermerApercu();
        });
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          if (groupe.length > 1) {
            map.easeTo({ center: [lng, lat], zoom: Math.min(map.getZoom() + 3, 15), duration: 500 });
            return;
          }
          if (!estOuvert) { ouvrirApercu(); return; }
          if (onSelectLogement) onSelectLogement(representant);
        });

        var marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.push(marker);
      });
    }

    dessiner();

    function dessinerApresDelai() {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(dessiner, 150);
    }
    map.on('zoomend', dessinerApresDelai);
    map.on('moveend', dessinerApresDelai);

    return function() {
      clearTimeout(debounceRef.current);
      map.off('zoomend', dessinerApresDelai);
      map.off('moveend', dessinerApresDelai);
    };
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
      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(21,36,29,0.85)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#D8D8D8', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', gap: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#36D278', borderRadius: '50%' }} /> {t('mapView.legende.disponible')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, background: '#B4B4B4', borderRadius: '50%' }} /> {t('mapView.legende.occupe')}
        </span>
        <span style={{ color: '#B9C2B9' }}>{t('mapView.legende.nbLogements', { count: pointsGeolocalises.length })}</span>
      </div>
    </div>
  );
}
