/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Users, ChevronRight, Star, ArrowRight, Building2, Key, Search } from 'lucide-react';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import useLimitesPlans from '../hooks/useLimitesPlans';
import LanguageSwitcher from '../components/LanguageSwitcher';
import OdometerNumber from '../components/OdometerNumber';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import CommentCaMarche from '../components/CommentCaMarche';
import Fonctionnalites from '../components/Fonctionnalites';
import HeroQuittance from '../components/HeroQuittance';

function getStats(t) {
  return [
    { valeur: '100+', label: t('landingPage.stats.logementsDisponibles') },
    { valeur: '80+', label: t('landingPage.stats.utilisateursActifs')   },
    { valeur: '99%',    label: t('landingPage.stats.locatairesSatisfaits')  },
    { valeur: '0 GNF',  label: t('landingPage.stats.pourLesLocataires')   },
  ];
}

function getTemoignages(t) {
  return [
    {
      nom:       'Mamadou Diallo',
      role:      t('landingPage.testimonials.mamadou.role'),
      note:      5,
      texte:     t('landingPage.testimonials.mamadou.texte'),
      initiales: 'MD',
      couleur:   '#1B6B3A'
    },
    {
      nom:       'Fatoumata Camara',
      role:      t('landingPage.testimonials.fatoumata.role'),
      note:      5,
      texte:     t('landingPage.testimonials.fatoumata.texte'),
      initiales: 'FC',
      couleur:   '#1565C0'
    },
    {
      nom:       'Ibrahima Bah',
      role:      t('landingPage.testimonials.ibrahima.role'),
      note:      5,
      texte:     t('landingPage.testimonials.ibrahima.texte'),
      initiales: 'IB',
      couleur:   '#7B1FA2'
    },
  ];
}

function getFaqLanding(t, limites) {
  return [
    { q: t('landingPage.faq.0.q'),      r: t('landingPage.faq.0.r') },
    { q: t('landingPage.faq.1.q'),       r: t('landingPage.faq.1.r') },
    { q: t('landingPage.faq.2.q'),          r: t('landingPage.faq.2.r') },
    { q: t('landingPage.faq.3.q'),              r: t('landingPage.faq.3.r') },
    { q: t('landingPage.faq.4.q'),              r: t('landingPage.faq.4.r', limites) },
  ];
}

function FaqLanding() {
  var t = useTranslation('public').t;
  var [open, setOpen] = useState(null);
  var limites = useLimitesPlans();
  var FAQ_LANDING = getFaqLanding(t, limites);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {FAQ_LANDING.map(function(item, i) {
        var estOpen = open === i;
        return (
          <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: estOpen ? '1px solid #A5D6A7' : '1px solid transparent' }}>
            <button onClick={function() { setOpen(estOpen ? null : i); }}
              style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{item.q}</span>
              <span style={{ color: '#1B6B3A', fontSize: 20, flexShrink: 0 }}>{estOpen ? '−' : '+'}</span>
            </button>
            {estOpen && (
              <div style={{ padding: '0 18px 16px', fontSize: 14, color: '#555', lineHeight: 1.7, borderTop: '0.5px solid #F0F0F0', paddingTop: 12 }}>
                {item.r}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function getSlides(t) {
  return [
    {
      img:    '/img/residences/vue-aerienne-conakry.jpg',
      titre:  t('landingPage.slides.0.titre'),
      sous:   t('landingPage.slides.0.sous'),
      tag:    t('landingPage.slides.0.tag'),
    },
    {
      img:    '/img/residences/villa-conakry.jpg',
      titre:  t('landingPage.slides.1.titre'),
      sous:   t('landingPage.slides.1.sous'),
      tag:    t('landingPage.slides.1.tag'),
    },
    {
      img:    '/img/residences/immeuble-moderne.jpg',
      titre:  t('landingPage.slides.2.titre'),
      sous:   t('landingPage.slides.2.sous'),
      tag:    t('landingPage.slides.2.tag'),
    },
    {
      img:    '/img/residences/bungalow-residence.jpg',
      titre:  t('landingPage.slides.3.titre'),
      sous:   t('landingPage.slides.3.sous'),
      tag:    t('landingPage.slides.3.tag'),
    },
  ];
}
export default function LandingPage() {
  var t                   = useTranslation('public').t;
  var navigate            = useNavigate();
  var { user }             = useAuth();
  var heroRef             = useRef(null);
  var [compteurs, setCompteurs] = useState({ logements: 0, utilisateurs: 0 });
  var [slideActif, setSlideActif] = useState(0);
  var [souris, setSouris] = useState({ x: 0, y: 0 });
  var [recherche, setRecherche] = useState('');
  var SLIDES              = getSlides(t);
  var STATS                = getStats(t);
  var TEMOIGNAGES          = getTemoignages(t);
  var limitesPlans         = useLimitesPlans();

useEffect(function() {
  if (window.location.hash) {
    var cible = document.getElementById(window.location.hash.slice(1));
    if (cible) setTimeout(function() { cible.scrollIntoView(); }, 60);
  }
}, []);

useEffect(function() {
  function handleMouse(e) {
    setSouris({
      x: (e.clientX / window.innerWidth  - 0.5) * 20,
      y: (e.clientY / window.innerHeight - 0.5) * 20,
    });
  }
  window.addEventListener('mousemove', handleMouse);
  return function() { window.removeEventListener('mousemove', handleMouse); };
}, []);

useEffect(function() {
  var interval = setInterval(function() {
    setSlideActif(function(i) { return (i + 1) % SLIDES.length; });
  }, 5000);
  return function() { clearInterval(interval); };
}, []);

  useEffect(function() {
    var annule = false;
    var raf = null;

    api.get('/stats/public')
      .then(function(res) {
        if (annule) return;
        var targets = {
          logements:    res.data.logements_disponibles || 0,
          utilisateurs: res.data.utilisateurs_actifs || 0,
        };
        var start = Date.now();
        var duration = 2000;
        raf = requestAnimationFrame(function step() {
          var elapsed = Date.now() - start;
          var pct     = Math.min(elapsed / duration, 1);
          var ease    = 1 - Math.pow(1 - pct, 3); // easeOutCubic
          setCompteurs({
            logements:    Math.round(targets.logements * ease),
            utilisateurs: Math.round(targets.utilisateurs * ease),
          });
          if (pct < 1) raf = requestAnimationFrame(step);
        });
      })
      .catch(function() { /* stats indisponibles : compteurs restent à 0 */ });

    return function() { annule = true; if (raf) cancelAnimationFrame(raf); };
  }, []);
  useEffect(function() {
    var handler = function(e) {
      if (e.key === 'Escape') setMobileMenu(false);
    };
    window.addEventListener('keydown', handler);
    return function() { window.removeEventListener('keydown', handler); };
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: '#F7F8F7', color: '#1B2B22', overflowX: 'hidden', position: 'relative' }}>
      <SEO
        titre={t('landingPage.seo.titre')}
        description={t('landingPage.seo.description')}
        url="https://werdhe.com"
      />
      <SiteHeader />

      {/* ─── HERO PLEIN ÉCRAN ────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', height: '100vh', minHeight: 600, maxHeight: 900, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {/* Photos slides */}
        {SLIDES.map(function(slide, i) {
          return (
            <div key={i} style={{ position: 'absolute', inset: 0, opacity: slideActif === i ? 1 : 0, transition: 'opacity 1.4s ease', zIndex: 0 }}>
            <img src={slide.img} alt="" style={{ width: '105%', height: '105%', objectFit: 'cover', objectPosition: 'center', transform: 'translate(' + (souris.x * -0.5) + 'px, ' + (souris.y * -0.5) + 'px)', transition: 'transform 0.15s ease-out', marginLeft: '-2.5%', marginTop: '-2.5%' }} />
            </div>
          );
        })}

        {/* Voile uni pour la lisibilité du texte */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8, 22, 12, 0.55)', zIndex: 1 }} />

        {/* Contenu hero */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 24px', textAlign: 'center', transform: 'translate(' + (souris.x * 0.3) + 'px, ' + (souris.y * 0.3) + 'px)', transition: 'transform 0.1s ease-out' }}>

          {/* Titre */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: -1, lineHeight: 1.1 }}>
            {SLIDES[slideActif].titre}
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'rgba(255,255,255,0.85)', margin: '0 auto 36px', lineHeight: 1.6, maxWidth: 580 }}>
            {SLIDES[slideActif].sous}
          </p>

          {/* Barre de recherche unique */}
          <form onSubmit={function(e) {
              e.preventDefault();
              navigate(recherche.trim() ? '/logements?search=' + encodeURIComponent(recherche.trim()) : '/logements');
            }}
            style={{ maxWidth: 560, margin: '0 auto 10px' }}>
            <div style={{ background: '#fff', borderRadius: 30, padding: '6px 6px 6px 22px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
              <Search size={17} strokeWidth={1.5} color="#8A8370" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={recherche}
                onChange={function(e) { setRecherche(e.target.value); }}
                placeholder={t('landingPage.search.placeholderUnique')}
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 15, color: '#1B2B22' }} />
              <button type="submit"
                style={{ flexShrink: 0, padding: '12px 22px', borderRadius: 16, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t('landingPage.search.rechercher')}
              </button>
            </div>
          </form>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              {t('landingPage.search.exemple')}
            </span>
          </div>

          {/* Badges rapides */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <Building2 size={13} strokeWidth={1.5} />, label: t('landingPage.quickBadges.appartements') },
              { icon: <Home size={13} strokeWidth={1.5} />,      label: t('landingPage.quickBadges.villas')       },
              { icon: <Key size={13} strokeWidth={1.5} />,       label: t('landingPage.quickBadges.studios')      },
              { icon: <Users size={13} strokeWidth={1.5} />,     label: t('landingPage.quickBadges.colocations')  },
            ].map(function(b, i) {
              return (
                <button key={i} onClick={function() { navigate('/logements'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {b.icon} {b.label}
                </button>
              );
            })}
          </div>
        </div>

        <HeroQuittance />

        {/* Slides nav points */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
          {SLIDES.map(function(_, i) {
            var actif = slideActif === i;
            return (
              <button key={i} onClick={function() { setSlideActif(i); }} aria-label={'Slide ' + (i + 1)}
                style={{ width: actif ? 12 : 9, height: actif ? 12 : 9, borderRadius: '50%', border: actif ? 'none' : '1.5px solid rgba(255,255,255,0.7)', background: actif ? '#fff' : 'rgba(255,255,255,0.35)', boxShadow: 'none', cursor: 'pointer', transition: 'all .3s', padding: 0 }} />
            );
          })}
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 28, right: 28, zIndex: 2 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'flottement 2s ease-in-out infinite' }}
            onClick={function() { document.getElementById('fonctionnalites') && document.getElementById('fonctionnalites').scrollIntoView({ behavior: 'smooth' }); }}>
            <ChevronRight size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} style={{ transform: 'rotate(90deg)' }} />
          </div>
        </div>
      </section>
      {/* ─── CONFIANCE ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #F0F0F0', borderBottom: '0.5px solid #F0F0F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 4vw, 40px)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{t('landingPage.trust.label')}</span>
          {[
            { nom: 'Orange Money', couleur: '#FF6600' },
            { nom: 'MTN MoMo',    couleur: '#FFCB00' },
            { nom: t('landingPage.trust.especes'),      couleur: '#1B6B3A' },
            { nom: t('landingPage.trust.virement'),     couleur: '#1565C0' },
          ].map(function(p, i) {
            return (
              <span key={i} style={{ fontSize: 13, fontWeight: 700, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>{p.nom}</span>
            );
          })}
        </div>
      </div>

      {/* ─── STATS ─────────────────────────────────────────────── */}
      <section style={{ background: '#1B2B22', padding: 'clamp(32px, 5vw, 56px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, maxWidth: 900, margin: '0 auto' }}>
          {STATS.map(function(s, i) {
            var val    = i === 0 ? compteurs.logements : i === 1 ? compteurs.utilisateurs : i === 2 ? 99 : 0;
            var suffix = i === 0 || i === 1 ? '+' : i === 2 ? '%' : 'GNF';
            return (
              <div key={i} style={{ textAlign: 'center', padding: '20px 12px' }}>
                <OdometerNumber value={val} suffix={suffix}
                  style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: -1, fontFamily: "'Fraunces', serif", color: '#fff', justifyContent: 'center' }} />
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ─────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ background: '#fff', padding: 'clamp(50px, 8vw, 90px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.featuresSection.overline')}</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 600, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.featuresSection.title')}</h2>
            <p style={{ color: '#5B6E5F', fontSize: 15, margin: '10px auto 0', maxWidth: 520 }}>{t('landingPage.featuresSection.subtitle')}</p>
          </div>
          <Fonctionnalites />
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ───────────────────────────────────── */}
      <section id="comment" style={{ padding: 'clamp(50px, 8vw, 90px) 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.howItWorks.overline')}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 600, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.howItWorks.title')}</h2>
        </div>

        <CommentCaMarche />
      </section>

      {/* ─── TÉMOIGNAGES / AVIS */}
      <section id="avis" style={{ background: '#F0F8F3', padding: 'clamp(50px, 8vw, 90px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.testimonialsSection.overline')}</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 600, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.testimonialsSection.title')}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {TEMOIGNAGES.map(function(t, i) {
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1px solid #E8F5E9' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                    {[1,2,3,4,5].map(function(n) { return <Star key={n} size={14} strokeWidth={1.5} fill="#F5A623" color="#F5A623" />; })}
                  </div>
                  <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: '0 0 18px', fontStyle: 'italic' }}>"{t.texte}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {t.initiales}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{t.nom}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* ─── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: 'clamp(50px, 8vw, 80px) 24px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.faqSection.overline')}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 600, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.faqSection.title')}</h2>
        </div>
        <FaqLanding />
      </section>
      {/* ─── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ background: '#1B6B3A', padding: 'clamp(50px, 8vw, 80px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 600, color: '#fff', margin: '0 0 16px', letterSpacing: -0.5 }}>
            {t('landingPage.ctaFinal.title')}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: '0 0 32px', lineHeight: 1.6 }}>
            {t('landingPage.ctaFinal.texte')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={function() { navigate('/inscription'); }}
              style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#fff', color: '#1B6B3A', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {t('landingPage.ctaFinal.creerCompte')} <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <button onClick={function() { navigate('/logements'); }}
              style={{ padding: '14px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.35)', background: 'transparent', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {t('landingPage.ctaFinal.voirLogements')}
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @keyframes flottement {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}