/* eslint-disable */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Le tableau de bord (components/.../Dashboard.js) a déjà son propre
// indicateur de connexion plus détaillé : on évite de superposer les deux.
function estMasque(pathname) {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
}

export default function ConnexionBanner() {
  var t = useTranslation('public').t;
  var location = useLocation();
  var [enLigne, setEnLigne] = useState(navigator.onLine);
  var [montrerRetablie, setMontrerRetablie] = useState(false);

  useEffect(function() {
    function surRetour() {
      setEnLigne(true);
      setMontrerRetablie(true);
      setTimeout(function() { setMontrerRetablie(false); }, 3000);
    }
    function surPerte() {
      setEnLigne(false);
      setMontrerRetablie(false);
    }
    window.addEventListener('online', surRetour);
    window.addEventListener('offline', surPerte);
    return function() {
      window.removeEventListener('online', surRetour);
      window.removeEventListener('offline', surPerte);
    };
  }, []);

  if (estMasque(location.pathname)) return null;
  if (enLigne && !montrerRetablie) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '8px 16px', fontSize: 12.5, fontWeight: 600, textAlign: 'center',
      color: '#fff', background: enLigne ? '#1B6B3A' : '#8A5A00',
      transition: 'background .3s',
    }}>
      {enLigne
        ? <><Wifi size={14} strokeWidth={2} /> {t('connexion.retablie')}</>
        : <><WifiOff size={14} strokeWidth={2} /> {t('connexion.horsLigne')}</>}
    </div>
  );
}
