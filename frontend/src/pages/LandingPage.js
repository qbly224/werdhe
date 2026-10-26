/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home, Users, FileText, Shield, Bell, MessageCircle,
  ChevronRight, Check, Star, MapPin, ArrowRight,
  Building2, Key, TrendingUp, Banknote, Menu, X,Facebook, Instagram, Search, Phone, Mail, Clock
} from 'lucide-react';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import OdometerNumber from '../components/OdometerNumber';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

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

function getEtapesProprietaire(t) {
  return [
    { icon: <Home size={22} strokeWidth={1.5} />,        titre: t('landingPage.steps.owner.0.titre'),     desc: t('landingPage.steps.owner.0.desc') },
    { icon: <Users size={22} strokeWidth={1.5} />,       titre: t('landingPage.steps.owner.1.titre'), desc: t('landingPage.steps.owner.1.desc') },
    { icon: <FileText size={22} strokeWidth={1.5} />,    titre: t('landingPage.steps.owner.2.titre'),    desc: t('landingPage.steps.owner.2.desc') },
  ];
}

function getEtapesLocataire(t) {
  return [
    { icon: <MapPin size={22} strokeWidth={1.5} />,      titre: t('landingPage.steps.tenant.0.titre'),               desc: t('landingPage.steps.tenant.0.desc') },
    { icon: <MessageCircle size={22} strokeWidth={1.5} />, titre: t('landingPage.steps.tenant.1.titre'),           desc: t('landingPage.steps.tenant.1.desc') },
    { icon: <Key size={22} strokeWidth={1.5} />,         titre: t('landingPage.steps.tenant.2.titre'),              desc: t('landingPage.steps.tenant.2.desc') },
  ];
}

function getFonctionnalites(t) {
  return [
    { icon: <Shield size={20} strokeWidth={1.5} />,       titre: t('landingPage.features.0.titre'),    desc: t('landingPage.features.0.desc') },
    { icon: <FileText size={20} strokeWidth={1.5} />,     titre: t('landingPage.features.1.titre'), desc: t('landingPage.features.1.desc') },
    { icon: <Bell size={20} strokeWidth={1.5} />,         titre: t('landingPage.features.2.titre'),  desc: t('landingPage.features.2.desc') },
    { icon: <Banknote size={20} strokeWidth={1.5} />,     titre: t('landingPage.features.3.titre'),    desc: t('landingPage.features.3.desc') },
    { icon: <MessageCircle size={20} strokeWidth={1.5} />, titre: t('landingPage.features.4.titre'),   desc: t('landingPage.features.4.desc') },
    { icon: <TrendingUp size={20} strokeWidth={1.5} />,   titre: t('landingPage.features.5.titre'),    desc: t('landingPage.features.5.desc') },
    { icon: <Star size={20} strokeWidth={1.5} />,         titre: t('landingPage.features.6.titre'),    desc: t('landingPage.features.6.desc') },
    { icon: <Building2 size={20} strokeWidth={1.5} />,    titre: t('landingPage.features.7.titre'),        desc: t('landingPage.features.7.desc') },
  ];
}

function getPlans(t) {
  return [
    {
      nom: t('landingPage.plans.tenant.nom'),
      prix: 0,
      sousTitre: t('landingPage.plans.tenant.sousTitre'),
      couleur: '#1565C0',
      bg: '#E3F2FD',
      features: [
        t('landingPage.plans.tenant.features.0'),
        t('landingPage.plans.tenant.features.1'),
        t('landingPage.plans.tenant.features.2'),
        t('landingPage.plans.tenant.features.3'),
        t('landingPage.plans.tenant.features.4'),
      ],
      cta: t('landingPage.plans.tenant.cta'),
      role: 'locataire',
      recommande: false
    },
    {
      nom: t('landingPage.plans.pro.nom'),
      prix: 120000,
      sousTitre: t('landingPage.plans.pro.sousTitre'),
      couleur: '#1B6B3A',
      bg: '#E8F5E9',
      features: [
        t('landingPage.plans.pro.features.0'),
        t('landingPage.plans.pro.features.1'),
        t('landingPage.plans.pro.features.2'),
        t('landingPage.plans.pro.features.3'),
        t('landingPage.plans.pro.features.4'),
      ],
      cta: t('landingPage.plans.pro.cta'),
      role: 'proprietaire',
      plan: 'pro',
      recommande: true
    },
    {
      nom: t('landingPage.plans.agency.nom'),
      prix: 300000,
      sousTitre: t('landingPage.plans.agency.sousTitre'),
      couleur: '#7B1FA2',
      bg: '#F3E5F5',
      features: [
        t('landingPage.plans.agency.features.0'),
        t('landingPage.plans.agency.features.1'),
        t('landingPage.plans.agency.features.2'),
        t('landingPage.plans.agency.features.3'),
      ],
      cta: t('landingPage.plans.agency.cta'),
      role: 'proprietaire',
      plan: 'agence',
      recommande: false
    },
  ];
}

function getFaqLanding(t) {
  return [
    { q: t('landingPage.faq.0.q'),      r: t('landingPage.faq.0.r') },
    { q: t('landingPage.faq.1.q'),       r: t('landingPage.faq.1.r') },
    { q: t('landingPage.faq.2.q'),          r: t('landingPage.faq.2.r') },
    { q: t('landingPage.faq.3.q'),              r: t('landingPage.faq.3.r') },
    { q: t('landingPage.faq.4.q'),              r: t('landingPage.faq.4.r') },
  ];
}

function FaqLanding() {
  var t = useTranslation('public').t;
  var [open, setOpen] = useState(null);
  var FAQ_LANDING = getFaqLanding(t);
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
function Particules() {
  var [scrollY, setScrollY] = useState(0);

  useEffect(function() {
    function onScroll() { setScrollY(window.scrollY); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return function() { window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {[
        { size: 6,   left: '10%', top: '20%', speed: 0.08, opacity: 0.15, color: '#1B6B3A' },
        { size: 10,  left: '85%', top: '15%', speed: 0.12, opacity: 0.1,  color: '#F5A623' },
        { size: 4,   left: '60%', top: '40%', speed: 0.06, opacity: 0.12, color: '#1B6B3A' },
        { size: 8,   left: '25%', top: '60%', speed: 0.1,  opacity: 0.08, color: '#F5A623' },
        { size: 5,   left: '75%', top: '70%', speed: 0.09, opacity: 0.1,  color: '#1B6B3A' },
        { size: 12,  left: '45%', top: '30%', speed: 0.07, opacity: 0.06, color: '#F5A623' },
      ].map(function(p, i) {
        return (
          <div key={i} style={{
            position: 'absolute',
            width:  p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            left: p.left,
            top:  'calc(' + p.top + ' - ' + (scrollY * p.speed) + 'px)',
            opacity: p.opacity,
            transition: 'top 0.1s ease-out',
          }} />
        );
      })}
    </div>
  );
}
export default function LandingPage() {
  var t                   = useTranslation('public').t;
  var navigate            = useNavigate();
  var { user }             = useAuth();
  var [mobileMenu, setMobileMenu] = useState(false);
  var [ongletEtapes, setOngletEtapes] = useState('proprio');
  var [essaiEnCours, setEssaiEnCours] = useState(null);
  var heroRef             = useRef(null);
  var [compteurs, setCompteurs] = useState({ logements: 0, utilisateurs: 0 });
  var [slideActif, setSlideActif] = useState(0);
  var [souris, setSouris] = useState({ x: 0, y: 0 });
  var [recherche, setRecherche] = useState('');
  var SLIDES              = getSlides(t);
  var STATS                = getStats(t);
  var TEMOIGNAGES          = getTemoignages(t);
  var ETAPES_PROPRIETAIRE  = getEtapesProprietaire(t);
  var ETAPES_LOCATAIRE     = getEtapesLocataire(t);
  var FONCTIONNALITES      = getFonctionnalites(t);
  var PLANS                = getPlans(t);

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

  function choisirPlan(plan) {
    if (plan.role === 'locataire') {
      navigate('/inscription?role=locataire');
      return;
    }
    if (!user) {
      navigate('/inscription?role=proprietaire&plan=' + plan.plan);
      return;
    }
    setEssaiEnCours(plan.plan);
    api.post('/abonnements/essai', { plan: plan.plan })
      .then(function() {
        toast.success(t('landingPage.essaiToast', { plan: plan.nom }));
        navigate('/dashboard');
      })
      .catch(function() {
        navigate('/pricing');
      })
      .finally(function() { setEssaiEnCours(null); });
  }

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
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F7F8F7', color: '#1B2B22', overflowX: 'hidden', position: 'relative' }}>
      <Particules />
      <SEO
        titre={t('landingPage.seo.titre')}
        description={t('landingPage.seo.description')}
        url="https://werdhe.com"
      />
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(247,248,247,0.92)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid rgba(27,107,58,0.12)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={36} showText={true} darkBg={false} />

        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="nav-desktop">
          {[[t('landingPage.nav.fonctionnalites'), '#fonctionnalites'], [t('landingPage.nav.commentCaMarche'), '#comment'], [t('landingPage.nav.tarifs'), '#tarifs'], [t('landingPage.nav.avis'), '#avis'], [t('landingPage.nav.faq'), '#faq']].map(function(l) {
            return <a key={l[1]} href={l[1]} style={{ fontSize: 14, color: '#555', textDecoration: 'none', fontWeight: 500 }}>{l[0]}</a>;
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <LanguageSwitcher />
          <button onClick={function() { navigate('/login'); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', background: 'transparent', color: '#1B6B3A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t('landingPage.nav.connexion')}
          </button>
          <button onClick={function() { navigate('/inscription'); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            className="btn-nav-hide">
            {t('landingPage.nav.demarrer')}
          </button>
          <button onClick={function() { setMobileMenu(!mobileMenu); }}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            className="btn-hamburger">
            {mobileMenu ? <X size={22} color="#1B2B22" /> : <Menu size={22} color="#1B2B22" />}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileMenu && (
        <div style={{ position: 'fixed', inset: 0, top: 60, background: '#fff', zIndex: 99, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[[t('landingPage.nav.fonctionnalites'), '#fonctionnalites'], [t('landingPage.nav.commentCaMarche'), '#comment'], [t('landingPage.nav.tarifs'), '#tarifs']].map(function(l) {
            return (
              <a key={l[1]} href={l[1]} onClick={function() { setMobileMenu(false); }}
                style={{ fontSize: 18, color: '#1B2B22', textDecoration: 'none', fontWeight: 600, padding: '12px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                {l[0]}
              </a>
            );
          })}
          <button onClick={function() { navigate('/login'); }}
            style={{ padding: '14px', borderRadius: 10, border: '1px solid #1B6B3A', background: 'transparent', color: '#1B6B3A', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            {t('landingPage.nav.connexion')}
          </button>
          <button onClick={function() { navigate('/inscription'); }}
            style={{ padding: '14px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {t('landingPage.nav.demarrerGratuit')}
          </button>
        </div>
      )}
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

        {/* Overlay dégradé */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)', zIndex: 1 }} />

        {/* Contenu hero */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 24px', textAlign: 'center', transform: 'translate(' + (souris.x * 0.3) + 'px, ' + (souris.y * 0.3) + 'px)', transition: 'transform 0.1s ease-out' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{SLIDES[slideActif].tag}</span>
          </div>

          {/* Titre */}
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: -1.5, lineHeight: 1.08, textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
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
                style={{ flexShrink: 0, padding: '12px 22px', borderRadius: 24, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t('landingPage.search.rechercher')}
              </button>
            </div>
          </form>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ display: 'inline-block', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 16, padding: '5px 14px' }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {b.icon} {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slides nav points */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 2 }}>
          {SLIDES.map(function(_, i) {
            return (
              <button key={i} onClick={function() { setSlideActif(i); }}
                style={{ width: slideActif === i ? 28 : 8, height: 8, borderRadius: 4, border: 'none', background: slideActif === i ? '#F5A623' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all .4s', padding: 0 }} />
            );
          })}
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 28, right: 28, zIndex: 2 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'flottement 2s ease-in-out infinite' }}
            onClick={function() { document.getElementById('comment') && document.getElementById('comment').scrollIntoView({ behavior: 'smooth' }); }}>
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
                  style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: -1, fontFamily: "'Fraunces', serif", color: i <= 1 ? '#F5A623' : '#fff', justifyContent: 'center' }} />
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ───────────────────────────────────── */}
      <section id="comment" style={{ padding: 'clamp(50px, 8vw, 90px) 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.howItWorks.overline')}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 650, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.howItWorks.title')}</h2>
        </div>

        {/* Toggle proprio / locataire */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', background: '#F0F0F0', borderRadius: 12, padding: 4, gap: 4 }}>
            {[['proprio', t('landingPage.howItWorks.tabProprio')], ['locataire', t('landingPage.howItWorks.tabLocataire')]].map(function(tab) {
              var actif = ongletEtapes === tab[0];
              return (
                <button key={tab[0]} onClick={function() { setOngletEtapes(tab[0]); }}
                  style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: actif ? '#1B6B3A' : 'transparent', color: actif ? '#fff' : '#888', fontSize: 14, fontWeight: actif ? 700 : 500, cursor: 'pointer', transition: 'all .2s' }}>
                  {tab[1]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {(ongletEtapes === 'proprio' ? ETAPES_PROPRIETAIRE : ETAPES_LOCATAIRE).map(function(e, i) {
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #F0F0F0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, left: 24, background: '#1B6B3A', color: '#fff', borderRadius: 20, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                  {i + 1}
                </div>
                <div style={{ width: 44, height: 44, background: '#E8F5E9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B6B3A', marginBottom: 16 }}>
                  {e.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{e.titre}</div>
                <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{e.desc}</div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={function() { navigate(ongletEtapes === 'proprio' ? '/inscription' : '/logements'); }}
            style={{ padding: '13px 28px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {ongletEtapes === 'proprio' ? t('landingPage.howItWorks.ctaProprio') : t('landingPage.howItWorks.ctaLocataire')} <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ─────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ background: '#1B2B22', padding: 'clamp(50px, 8vw, 90px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, color: '#F5A623', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.featuresSection.overline')}</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 650, margin: 0, color: '#fff', letterSpacing: -0.5 }}>{t('landingPage.featuresSection.title')}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {FONCTIONNALITES.map(function(f, i) {
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(245,166,35,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', marginBottom: 14 }}>
                    {f.icon}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.titre}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TARIFS ─────────────────────────────────────────────── */}
      <section id="tarifs" style={{ padding: 'clamp(50px, 8vw, 90px) 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.pricingSection.overline')}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 650, margin: '0 0 12px', color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.pricingSection.title')}</h2>
          <p style={{ color: '#666', fontSize: 16, margin: 0 }}>{t('landingPage.pricingSection.subtitle')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {PLANS.map(function(plan, i) {
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', border: plan.recommande ? '2px solid #1B6B3A' : '1px solid #E8E8E8', position: 'relative', boxShadow: plan.recommande ? '0 8px 32px rgba(27,107,58,0.12)' : 'none' }}>
                {plan.recommande && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#1B6B3A', color: '#fff', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {t('landingPage.pricingSection.recommande')}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, background: plan.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {plan.role === 'locataire' ? <Users size={18} strokeWidth={1.5} color={plan.couleur} /> : <Building2 size={18} strokeWidth={1.5} color={plan.couleur} />}
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>{plan.nom}</span>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#1B2B22' }}>
                    {plan.prix === 0 ? t('landingPage.pricingSection.gratuit') : GNF(plan.prix)}
                  </span>
                  {plan.prix > 0 && <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>{t('landingPage.pricingSection.parMois')}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>{plan.sousTitre}</div>

                <button
                  onClick={function() { choisirPlan(plan); }}
                  disabled={essaiEnCours === plan.plan}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: plan.recommande ? 'none' : '1.5px solid ' + plan.couleur, background: essaiEnCours === plan.plan ? '#aaa' : (plan.recommande ? plan.couleur : 'transparent'), color: plan.recommande ? '#fff' : plan.couleur, fontSize: 14, fontWeight: 700, cursor: essaiEnCours === plan.plan ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
                  {essaiEnCours === plan.plan ? t('landingPage.pricingSection.demarrage') : plan.cta}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(function(f) {
                    return (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1B2B22' }}>
                        <Check size={14} strokeWidth={2.5} color={plan.couleur} style={{ flexShrink: 0 }} />
                        {f}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── TÉMOIGNAGES / AVIS */}
      <section id="avis" style={{ background: '#F0F8F3', padding: 'clamp(50px, 8vw, 90px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('landingPage.testimonialsSection.overline')}</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 650, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.testimonialsSection.title')}</h2>
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
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 650, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>{t('landingPage.faqSection.title')}</h2>
        </div>
        <FaqLanding />
      </section>
      {/* ─── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ background: '#1B6B3A', padding: 'clamp(50px, 8vw, 80px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 650, color: '#fff', margin: '0 0 16px', letterSpacing: -0.5 }}>
            {t('landingPage.ctaFinal.title')}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: '0 0 32px', lineHeight: 1.6 }}>
            {t('landingPage.ctaFinal.texte')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={function() { navigate('/inscription'); }}
              style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#F5A623', color: '#1B2B22', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {t('landingPage.ctaFinal.creerCompte')} <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <button onClick={function() { navigate('/logements'); }}
              style={{ padding: '14px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.35)', background: 'transparent', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {t('landingPage.ctaFinal.voirLogements')}
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
<footer style={{ position: 'relative', background: '#0A1A0D', overflow: 'hidden' }}>

  {/* Image de fond avec overlay */}
  <div style={{
    position: 'absolute', inset: 0,
    backgroundImage: 'url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=75&fit=crop)',
    backgroundSize: 'cover', backgroundPosition: 'center',
  }}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(8, 22, 12, 0.88)' }} />
  </div>

  {/* Contenu au-dessus de l'image */}
  <div style={{ position: 'relative', zIndex: 1 }}>

    {/* ── Corps du footer ── */}
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 28px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40, marginBottom: 40,
      }}>

        {/* Colonne 1 — Logo + desc + réseaux */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <Logo size={32} showText={true} darkBg={true} />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: '0 0 20px' }}>
            {t('landingPage.footer.desc')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
  {
    label: 'Facebook',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@qbelytech',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z"/>
      </svg>
    ),
  },
].map(function(s) {
  return (
    <a key={s.label} href={s.href || '#'} target={s.href ? '_blank' : undefined} rel={s.href ? 'noopener noreferrer' : undefined} title={s.label} style={{
      width: 36, height: 36, borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all .2s',
    }}
    onMouseEnter={function(e) {
      e.currentTarget.style.background = '#1B6B3A';
      e.currentTarget.style.borderColor = '#1B6B3A';
      e.currentTarget.style.color = '#fff';
    }}
    onMouseLeave={function(e) {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
      e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
    }}>
      {s.svg}
    </a>
  );
})}
          </div>
        </div>

        {/* Colonne 2 — Navigation */}
        <div>
          <div style={{ fontSize: 11, color: '#F5A623', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
            {t('landingPage.footer.navTitle')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              [t('landingPage.footer.nav.accueil'), '/'],
              [t('landingPage.footer.nav.logements'), '/logements'],
              [t('landingPage.footer.nav.tarifs'), '/pricing'],
              [t('landingPage.footer.nav.blog'), '/blog'],
              [t('landingPage.footer.nav.estimation'), '/estimation'],
              [t('landingPage.footer.nav.aPropos'), '/a-propos'],
              [t('landingPage.footer.nav.seConnecter'), '/login'],
            ].map(function(l) {
              return (
                <a key={l[1]} href={l[1]} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
                  {l[0]}
                </a>
              );
            })}
          </div>
        </div>

        {/* Colonne 3 — Liens rapides */}
        <div>
          <div style={{ fontSize: 11, color: '#F5A623', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
            {t('landingPage.footer.quickTitle')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              [t('landingPage.footer.quick.creerCompte'), '/inscription'],
              [t('landingPage.footer.quick.contact'), '/contact'],
              [t('landingPage.footer.quick.faq'), '/a-propos#faq'],
              [t('landingPage.footer.quick.cgu'), '/cgu'],
              [t('landingPage.footer.quick.confidentialite'), '/confidentialite'],
            ].map(function(l) {
              return (
                <a key={l[1]} href={l[1]} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
                  {l[0]}
                </a>
              );
            })}
          </div>
        </div>

        {/* Colonne 4 — Infos pratiques */}
        <div>
          <div style={{ fontSize: 11, color: '#F5A623', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
            {t('landingPage.footer.infosTitle')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={15} strokeWidth={1.5} style={{ color: '#F5A623', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                {t('landingPage.footer.adresse')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Clock size={15} strokeWidth={1.5} style={{ color: '#F5A623', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                {t('landingPage.footer.horaires')}<br />
                {t('landingPage.footer.support')}
              </span>
            </div>
          </div>
          <a href="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20, padding: '10px 20px',
            background: 'transparent', border: '1.5px solid #1B6B3A',
            borderRadius: 8, color: '#fff', fontSize: 13,
            fontWeight: 600, textDecoration: 'none', transition: 'all .2s',
          }}
          onMouseEnter={function(e) { e.currentTarget.style.background = '#1B6B3A'; }}
          onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
            <Phone size={14} strokeWidth={1.5} />
            {t('landingPage.footer.contactBtn')}
          </a>
        </div>

      </div>

      {/* ── Bas du footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 20,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          {t('landingPage.footer.copyright')}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          contact@werdhe.com
        </div>
      </div>
    </div>

  </div>
</footer>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .btn-nav-hide { display: none !important; }
          .btn-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .btn-hamburger { display: none !important; }
        }
        a:hover { opacity: 0.85; }
        button { transition: opacity .15s, transform .1s; }
        button:hover { opacity: 0.9; }
        button:active { transform: scale(0.98); }
        @keyframes flottement {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}