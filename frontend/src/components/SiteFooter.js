import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import './SiteFooter.css';

var NAV = [['accueil', '/'], ['logements', '/logements'], ['tarifs', '/pricing'], ['blog', '/blog'], ['estimation', '/estimation'], ['aPropos', '/a-propos']];
var RAPIDES = [['creerCompte', '/inscription'], ['contact', '/contact'], ['faq', '/a-propos#faq'], ['cgu', '/cgu'], ['confidentialite', '/confidentialite']];

// Tri du plus court au plus long libellé (dans la langue affichée).
function parLongueur(liens, t, prefixe) {
  return liens.slice().sort(function(a, b) { return t(prefixe + a[0]).length - t(prefixe + b[0]).length; });
}

// Pied de page commun des pages publiques.
export default function SiteFooter() {
  var t = useTranslation('public').t;
  var F = 'landingPage.footer.';
  return (
    <footer className="ds-footer">
      <div className="ds-footer__body">
        <div className="ds-footer__col">
          <Logo size={32} showText={true} darkBg={true} />
          <p>{t(F + 'desc')}</p>
        </div>
        <nav className="ds-footer__col" aria-label={t(F + 'navTitle')}>
          <h2>{t(F + 'navTitle')}</h2>
          <ul>{parLongueur(NAV, t, F + 'nav.').map(function(l) { return <li key={l[1]}><Link to={l[1]}>{t(F + 'nav.' + l[0])}</Link></li>; })}</ul>
        </nav>
        <nav className="ds-footer__col" aria-label={t(F + 'quickTitle')}>
          <h2>{t(F + 'quickTitle')}</h2>
          <ul>{parLongueur(RAPIDES, t, F + 'quick.').map(function(l) { return <li key={l[1]}><Link to={l[1]}>{t(F + 'quick.' + l[0])}</Link></li>; })}</ul>
        </nav>
        <div className="ds-footer__col">
          <h2>{t(F + 'infosTitle')}</h2>
          <div className="ds-footer__info">
            <span>{t(F + 'adresse')}</span>
            <span>{t(F + 'horaires')}<br />{t(F + 'support')}</span>
            <Link to="/contact" className="ds-btn ds-btn--secondary ds-btn--sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)', justifySelf: 'start', marginTop: 6 }}>{t(F + 'contactBtn')}</Link>
          </div>
        </div>
      </div>
      <div className="ds-footer__bottom">
        <span>{t(F + 'copyright')}</span>
        <span>contact@werdhe.com</span>
      </div>
    </footer>
  );
}
