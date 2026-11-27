import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Building2, Home, Key, Users } from 'lucide-react';
import HeroQuittance from './HeroQuittance';
import './HeroAccueil.css';

// Photos du héros. Toutes en portrait, affichées dans un cadre de même proportion (3/4) :
// aucun recadrage agressif, aucun zoom. Chaque photo existe en plusieurs largeurs (WebP + JPEG).
var PHOTOS = [
  { base: 'villa-moderne', largeurs: [480, 810],       w: 810,  h: 1080, alt: 'villa',    tag: 'landingPage.slides.2.tag' },
  { base: 'vue-aerienne',  largeurs: [480, 800, 1105], w: 1105, h: 1424, alt: 'aerienne', tag: 'landingPage.slides.0.tag' },
  { base: 'bungalow',      largeurs: [480, 800, 1086], w: 1086, h: 1448, alt: 'bungalow', tag: 'landingPage.slides.3.tag' },
];
var TAILLES = '(min-width: 1100px) 560px, (min-width: 768px) 46vw, (min-width: 520px) 480px, 92vw';
var DUREE = 6000;

function srcset(p, ext) {
  return p.largeurs.map(function(l) { return '/img/hero/' + p.base + '-' + l + '.' + ext + ' ' + l + 'w'; }).join(', ');
}

// Héros de la page d'accueil : texte et recherche d'un côté, photo réelle de l'autre (en colonne sur mobile).
export default function HeroAccueil() {
  var t = useTranslation('public').t;
  var navigate = useNavigate();
  var [actif, setActif] = useState(0);
  var [pause, setPause] = useState(false);
  var [recherche, setRecherche] = useState('');

  useEffect(function() {
    var reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (pause || reduit) return;
    var id = setInterval(function() { setActif(function(i) { return (i + 1) % PHOTOS.length; }); }, DUREE);
    return function() { clearInterval(id); };
  }, [pause]);

  function rechercher(e) {
    e.preventDefault();
    navigate(recherche.trim() ? '/logements?search=' + encodeURIComponent(recherche.trim()) : '/logements');
  }

  var badges = [
    { icone: <Building2 size={15} strokeWidth={1.75} aria-hidden="true" />, label: t('landingPage.quickBadges.appartements') },
    { icone: <Home size={15} strokeWidth={1.75} aria-hidden="true" />,      label: t('landingPage.quickBadges.villas') },
    { icone: <Key size={15} strokeWidth={1.75} aria-hidden="true" />,       label: t('landingPage.quickBadges.studios') },
    { icone: <Users size={15} strokeWidth={1.75} aria-hidden="true" />,     label: t('landingPage.quickBadges.colocations') },
  ];

  return (
    <section className="hx" aria-labelledby="hx-titre">
      <div className="hx__grille">
        <div className="hx__texte">
          <h1 id="hx-titre" className="hx__titre">{t('landingPage.slides.0.titre')}</h1>
          <p className="hx__sous">{t('landingPage.slides.0.sous')}</p>

          <form className="hx__recherche" onSubmit={rechercher} role="search">
            <Search size={19} strokeWidth={1.75} className="hx__loupe" aria-hidden="true" />
            <label htmlFor="hx-recherche" className="hx__sr">{t('landingPage.hero.rechercheLabel')}</label>
            <input id="hx-recherche" type="search" value={recherche} onChange={function(e) { setRecherche(e.target.value); }}
              placeholder={t('landingPage.search.placeholderUnique')} autoComplete="off" enterKeyHint="search" />
            <button type="submit">{t('landingPage.search.rechercher')}</button>
          </form>
          <p className="hx__exemple">{t('landingPage.search.exemple')}</p>

          <div className="hx__badges">
            {badges.map(function(b, i) {
              return <button key={i} type="button" className="hx__badge" onClick={function() { navigate('/logements'); }}>{b.icone}{b.label}</button>;
            })}
          </div>
        </div>

        <div className="hx__visuel" onMouseEnter={function() { setPause(true); }} onMouseLeave={function() { setPause(false); }}
          onFocus={function() { setPause(true); }} onBlur={function() { setPause(false); }}>
          <div className="hx__cadre" role="group" aria-roledescription="carousel" aria-label={t('landingPage.hero.carrouselLabel')}>
            {PHOTOS.map(function(p, i) {
              var visible = i === actif;
              return (
                <div key={p.base} className={'hx__photo' + (visible ? ' on' : '')} aria-hidden={!visible}>
                <picture>
                  <source type="image/webp" srcSet={srcset(p, 'webp')} sizes={TAILLES} />
                  <img src={'/img/hero/' + p.base + '-' + p.largeurs[p.largeurs.length > 2 ? 1 : 0] + '.jpg'} srcSet={srcset(p, 'jpg')} sizes={TAILLES}
                    width={p.w} height={p.h} alt={visible ? t('landingPage.hero.alt.' + p.alt) : ''}
                    loading={i === 0 ? 'eager' : 'lazy'} fetchpriority={i === 0 ? 'high' : 'auto'} decoding="async" />
                </picture>
                </div>
              );
            })}
            <span className="hx__legende">{t(PHOTOS[actif].tag)}</span>
            <div className="hx__points">
              {PHOTOS.map(function(p, i) {
                return (
                  <button key={p.base} type="button" className={'hx__point' + (i === actif ? ' on' : '')}
                    aria-label={t('landingPage.hero.photoN', { n: i + 1, total: PHOTOS.length })} aria-current={i === actif ? 'true' : undefined}
                    onClick={function() { setActif(i); }} />
                );
              })}
            </div>
          </div>
          <HeroQuittance />
        </div>
      </div>
    </section>
  );
}
