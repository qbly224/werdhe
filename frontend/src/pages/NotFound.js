/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, CreditCard, Phone } from 'lucide-react';
import SEO from '../components/SEO';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useTranslation } from 'react-i18next';

function getSuggestions(t) {
  return [
    { icon: Home,       label: t('notFound.suggestions.logements'), path: '/logements' },
    { icon: CreditCard, label: t('notFound.suggestions.tarifs'),    path: '/pricing'   },
    { icon: Phone,      label: t('notFound.suggestions.contact'),   path: '/contact'   },
  ];
}

// Page introuvable : un titre, une phrase, un bouton principal et quelques liens.
export default function NotFound() {
  var t           = useTranslation('public').t;
  var SUGGESTIONS = getSuggestions(t);
  var navigate    = useNavigate();
  var location    = useLocation();
  var [compte, setCompte] = useState(10);

  // Compte à rebours → redirection automatique vers l'accueil
  useEffect(function() {
    if (compte <= 0) {
      navigate('/');
      return;
    }
    var id = setTimeout(function() { setCompte(compte - 1); }, 1000);
    return function() { clearTimeout(id); };
  }, [compte]);

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--surface-soft)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO titre={t('notFound.seoTitre')} noIndex={true} />
      <SiteHeader />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 16px', textAlign: 'center' }}>
        <div className="ds-eyebrow" style={{ marginBottom: 12 }}>404</div>
        <h1 className="ds-title" style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: '0 0 12px' }}>
          {t('notFound.titre')}
        </h1>
        <p className="ds-muted" style={{ fontSize: 15, margin: '0 0 6px', maxWidth: 440, lineHeight: 1.6 }}>
          {t('notFound.pagePrefixe')} <code className="ds-mono" style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6, fontSize: 13 }}>{location.pathname}</code> {t('notFound.pageIntrouvable')}
        </p>
        <p className="ds-muted" style={{ fontSize: 13, margin: '0 0 28px' }}>
          {t('notFound.redirectionAuto')} <strong>{compte}s</strong>
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
          <button className="ds-btn ds-btn--primary" onClick={function() { navigate('/'); }}>{t('notFound.accueil')}</button>
          <button className="ds-btn ds-btn--secondary" onClick={function() { navigate(-1); }}>{t('notFound.retour')}</button>
        </div>

        <div style={{ width: '100%', maxWidth: 420, textAlign: 'left' }}>
          <p className="ds-eyebrow" style={{ marginBottom: 10 }}>{t('notFound.pagesUtiles')}</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {SUGGESTIONS.map(function(s, i) {
              return (
                <Link key={i} to={s.path} className="ds-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', color: 'var(--text-primary)' }}>
                  <s.icon size={18} strokeWidth={1.5} color="var(--green)" />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
