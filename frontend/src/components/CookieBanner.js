/* eslint-disable */
import { useState, useEffect } from 'react';
import { Cookie, X, Check, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CookieBanner() {
  var t = useTranslation('public').t;
  var [visible, setVisible]     = useState(false);
  var [details, setDetails]     = useState(false);
  var [prefs, setPrefs]         = useState({ essentiel: true, analytique: false, marketing: false });

  useEffect(function() {
    var consent = localStorage.getItem('werdhe-cookies');
    if (!consent) setTimeout(function() { setVisible(true); }, 1500);
  }, []);

  function accepterTout() {
    localStorage.setItem('werdhe-cookies', JSON.stringify({ essentiel: true, analytique: true, marketing: false }));
    setVisible(false);
  }

  function refuserTout() {
    localStorage.setItem('werdhe-cookies', JSON.stringify({ essentiel: true, analytique: false, marketing: false }));
    setVisible(false);
  }

  function sauvegarderPrefs() {
    localStorage.setItem('werdhe-cookies', JSON.stringify(prefs));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 480, margin: '0 auto', zIndex: 9998, animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ background: '#1B2B22', borderRadius: 18, padding: '20px 22px', boxShadow: '0 16px 48px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(245,166,35,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cookie size={18} strokeWidth={1.5} color="#F5A623" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t('cookieBanner.titre')}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t('cookieBanner.sousTitre')}</div>
          </div>
          <button onClick={refuserTout}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Message */}
        {!details && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 16px' }}>
            {t('cookieBanner.message')}{' '}
            <Link to="/confidentialite" style={{ color: '#F5A623', textDecoration: 'none' }}>{t('cookieBanner.enSavoirPlus')}</Link>
          </p>
        )}

        {/* Détails préférences */}
        {details && (
          <div style={{ marginBottom: 16 }}>
            {[
              { key: 'essentiel',  label: t('cookieBanner.categories.essentiel.label'),     desc: t('cookieBanner.categories.essentiel.desc'),     locked: true  },
              { key: 'analytique', label: t('cookieBanner.categories.analytique.label'),    desc: t('cookieBanner.categories.analytique.desc'), locked: false },
              { key: 'marketing',  label: t('cookieBanner.categories.marketing.label'),      desc: t('cookieBanner.categories.marketing.desc'),  locked: false },
            ].map(function(item) {
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <button
                    disabled={item.locked}
                    onClick={function() {
                      if (!item.locked) setPrefs(function(p) { return Object.assign({}, p, { [item.key]: !p[item.key] }); });
                    }}
                    style={{
                      width: 42, height: 24, borderRadius: 12, border: 'none', cursor: item.locked ? 'default' : 'pointer',
                      background: prefs[item.key] ? '#1B6B3A' : 'rgba(255,255,255,0.15)',
                      transition: 'background .2s', position: 'relative', flexShrink: 0,
                    }}>
                    <div style={{
                      position: 'absolute', top: 3, left: prefs[item.key] ? 20 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left .2s',
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {details ? (
            <button onClick={sauvegarderPrefs}
              style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} strokeWidth={2.5} /> {t('cookieBanner.sauvegarder')}
            </button>
          ) : (
            <>
              <button onClick={refuserTout}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>
                {t('cookieBanner.refuser')}
              </button>
              <button onClick={function() { setDetails(true); }}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Settings size={13} strokeWidth={1.5} /> {t('cookieBanner.personnaliser')}
              </button>
              <button onClick={accepterTout}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#F5A623', color: '#1B2B22', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                {t('cookieBanner.accepter')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}