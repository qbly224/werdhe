import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import './SiteHeader.css';

// Liens du menu : sections de l'accueil (ancres) et pages. Sur une autre page que l'accueil,
// les ancres renvoient vers « /#section ».
var LIENS = [
  { cle: 'fonctionnalites', ancre: 'fonctionnalites' },
  { cle: 'commentCaMarche', ancre: 'comment' },
  { cle: 'carte',           chemin: '/logements?vue=carte' },
  { cle: 'tarifs',          chemin: '/pricing' },
  { cle: 'faq',             ancre: 'faq' },
];

// En-tête commun des pages publiques (remplace les quatorze modèles propres à chaque page).
export default function SiteHeader() {
  var t = useTranslation('public').t;
  var auth = useAuth();
  var user = auth.user;
  var loc = useLocation();
  var navigate = useNavigate();
  var [ouvert, setOuvert] = useState(false);
  var surAccueil = loc.pathname === '/';

  function href(l) { return l.ancre ? (surAccueil ? '#' + l.ancre : '/#' + l.ancre) : l.chemin; }
  function suivre(e, l) {
    setOuvert(false);
    if (l.chemin) { e.preventDefault(); navigate(l.chemin); }
  }
  var initiales = user ? ((user.prenom || '').charAt(0) + (user.nom || '').charAt(0)).toUpperCase() : '';

  return (
    <header className="ds-header">
      <div className="ds-header__bar">
        <Link to="/" style={{ textDecoration: 'none' }} aria-label="Werdhe"><Logo size={34} showText={true} darkBg={false} /></Link>

        <nav className="ds-header__nav" aria-label="Navigation principale">
          {LIENS.map(function(l) {
            return <a key={l.cle} href={href(l)} onClick={function(e) { suivre(e, l); }} aria-current={l.chemin && loc.pathname === l.chemin.split('?')[0] ? 'page' : undefined}>{t('landingPage.nav.' + l.cle)}</a>;
          })}
        </nav>

        <div className="ds-header__actions">
          <LanguageSwitcher />
          {user ? (
            <Link to="/dashboard" className="ds-header__user ds-header__hide">
              <span className="ds-header__avatar">{initiales}</span>{user.prenom}
            </Link>
          ) : (
            <>
              <Link to="/login" className="ds-btn ds-btn--secondary ds-btn--sm ds-header__hide">{t('landingPage.nav.connexion')}</Link>
              <Link to="/inscription" className="ds-btn ds-btn--primary ds-btn--sm ds-header__hide">{t('landingPage.nav.demarrer')}</Link>
            </>
          )}
          <button className="ds-header__burger" onClick={function() { setOuvert(!ouvert); }} aria-expanded={ouvert} aria-label="Menu">
            {ouvert ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {ouvert && (
        <div className="ds-header__menu">
          {LIENS.map(function(l) {
            return <a key={l.cle} href={href(l)} onClick={function(e) { suivre(e, l); }}>{t('landingPage.nav.' + l.cle)}</a>;
          })}
          {user
            ? <Link to="/dashboard" className="ds-btn ds-btn--primary" onClick={function() { setOuvert(false); }}>{user.prenom}</Link>
            : <>
                <Link to="/login" className="ds-btn ds-btn--secondary" onClick={function() { setOuvert(false); }}>{t('landingPage.nav.connexion')}</Link>
                <Link to="/inscription" className="ds-btn ds-btn--primary" onClick={function() { setOuvert(false); }}>{t('landingPage.nav.demarrer')}</Link>
              </>}
        </div>
      )}
    </header>
  );
}
