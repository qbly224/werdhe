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
import HeroAccueil from '../components/HeroAccueil';
import BandePaiements from '../components/BandePaiements';
import AvisWerdhe from '../components/AvisWerdhe';

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
export default function LandingPage() {
  var t                   = useTranslation('public').t;
  var navigate            = useNavigate();
  var { user }             = useAuth();
  var [compteurs, setCompteurs] = useState({ logements: 0, utilisateurs: 0 });
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

      {/* ─── HÉROS : texte, recherche et photo réelle (cadre portrait, sans zoom) */}
      <HeroAccueil />
      {/* ─── PAIEMENT DU LOYER : espèces disponible, paiement mobile « Bientôt » */}
      <BandePaiements />
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

      {/* ─── AVIS : vrais avis approuvés + témoignages conservés */}
      <AvisWerdhe temoignages={TEMOIGNAGES} />
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