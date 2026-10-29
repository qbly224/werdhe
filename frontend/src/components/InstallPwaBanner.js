/* eslint-disable */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Share, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

var CLE_REPORT = 'werdhe-pwa-install-reporte';
var DELAI_REAFFICHAGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

function dejaInstallee() {
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.navigator.standalone === true) return true; // Safari iOS
  return false;
}

// iPadOS 13+ se présente en "Macintosh" dans le user-agent (bureau demandé
// par défaut) : seul un vrai Mac n'a pas d'écran tactile.
function estIOS() {
  var ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function recemmentReporte() {
  try {
    var brut = localStorage.getItem(CLE_REPORT);
    if (!brut) return false;
    return Date.now() - parseInt(brut, 10) < DELAI_REAFFICHAGE_MS;
  } catch (e) { return false; }
}

function estMasque(pathname) {
  return pathname.startsWith('/admin');
}

export default function InstallPwaBanner() {
  var t = useTranslation('public').t;
  var location = useLocation();
  var [promptEvent, setPromptEvent] = useState(null);
  var [visible, setVisible] = useState(false);
  var [plateformeIOS, setPlateformeIOS] = useState(false);

  useEffect(function() {
    if (dejaInstallee() || recemmentReporte()) return;

    if (estIOS()) {
      setPlateformeIOS(true);
      var minuteurIOS = setTimeout(function() { setVisible(true); }, 4000);
      return function() { clearTimeout(minuteurIOS); };
    }

    function surPropositionInstall(e) {
      e.preventDefault();
      setPromptEvent(e);
      setTimeout(function() { setVisible(true); }, 2000);
    }
    window.addEventListener('beforeinstallprompt', surPropositionInstall);
    return function() { window.removeEventListener('beforeinstallprompt', surPropositionInstall); };
  }, []);

  useEffect(function() {
    function surInstallee() {
      setVisible(false);
      toast.success(t('pwa.toastInstalle'));
    }
    window.addEventListener('appinstalled', surInstallee);
    return function() { window.removeEventListener('appinstalled', surInstallee); };
  }, [t]);

  function reporter() {
    setVisible(false);
    try { localStorage.setItem(CLE_REPORT, String(Date.now())); } catch (e) {}
  }

  function installer() {
    if (!promptEvent) return;
    promptEvent.prompt();
    promptEvent.userChoice.then(function(resultat) {
      if (resultat.outcome !== 'accepted') { reporter(); } else { setVisible(false); }
      setPromptEvent(null);
    });
  }

  if (!visible || estMasque(location.pathname)) return null;

  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#1B2B22', color: '#fff', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 9997, maxWidth: 400, width: 'calc(100% - 32px)' }}>
      <div style={{ flexShrink: 0 }}><Download size={26} strokeWidth={1.5} color="#fff" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{t('pwa.installerWerdhe')}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {plateformeIOS
            ? <>{t('pwa.instructionsIOS.avant')} <Share size={11} strokeWidth={2} style={{ display: 'inline', verticalAlign: -1 }} /> {t('pwa.instructionsIOS.apres')}</>
            : t('pwa.accesRapide')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {!plateformeIOS && (
          <button onClick={installer}
            style={{ background: '#F5A623', border: 'none', color: '#1B2B22', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t('pwa.installer')}
          </button>
        )}
        <button onClick={reporter} aria-label={t('pwa.fermer')}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
