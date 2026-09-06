/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home, Users, FileText, Shield, Bell, MessageCircle,
  ChevronRight, Check, Star, MapPin, ArrowRight,
  Building2, Key, TrendingUp, Banknote, Menu, X, Search, Phone, Mail
} from 'lucide-react';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

var STATS = [
  { valeur: '100+', label: 'Logements disponibles' },
  { valeur: '80+', label: 'Utilisateurs actifs'   },
  { valeur: '99%',    label: 'Locataires satisfaits'  },
  { valeur: '0 GNF',  label: 'Pour les locataires'   },
];

var TEMOIGNAGES = [
  {
    nom:       'Mamadou Diallo',
    role:      'Propriétaire, Conakry',
    note:      5,
    texte:     "Werdhe m'a permis de gérer mes 3 appartements depuis mon téléphone. Les paiements, les contrats, tout est centralisé.",
    initiales: 'MD',
    couleur:   '#1B6B3A'
  },
  {
    nom:       'Fatoumata Camara',
    role:      'Locataire, Ratoma',
    note:      5,
    texte:     "J'ai trouvé mon appartement en 48h. Le propriétaire était sérieux, le contrat signé en ligne. Plus besoin d'intermédiaire.",
    initiales: 'FC',
    couleur:   '#1565C0'
  },
  {
    nom:       'Ibrahima Bah',
    role:      'Propriétaire, Kaloum',
    note:      5,
    texte:     "Le système d'alertes automatiques pour les loyers en retard m'a sauvé plusieurs fois. Une vraie révolution.",
    initiales: 'IB',
    couleur:   '#7B1FA2'
  },
];

var ETAPES_PROPRIETAIRE = [
  { icon: <Home size={22} strokeWidth={1.5} />,        titre: 'Publiez votre bien',     desc: 'Ajoutez photos, prix et description en 5 minutes.' },
  { icon: <Users size={22} strokeWidth={1.5} />,       titre: 'Recevez des candidatures', desc: 'Les locataires postulent directement depuis la plateforme.' },
  { icon: <FileText size={22} strokeWidth={1.5} />,    titre: 'Signez et encaissez',    desc: 'Bail numérique, quittances automatiques, alertes loyers.' },
];

var ETAPES_LOCATAIRE = [
  { icon: <MapPin size={22} strokeWidth={1.5} />,      titre: 'Cherchez',               desc: 'Filtrez par ville, prix, superficie et catégorie.' },
  { icon: <MessageCircle size={22} strokeWidth={1.5} />, titre: 'Candidatez',           desc: 'Envoyez votre dossier en quelques clics, sans intermédiaire.' },
  { icon: <Key size={22} strokeWidth={1.5} />,         titre: 'Emménagez',              desc: 'Signez le bail en ligne et récupérez vos clés.' },
];

var FONCTIONNALITES = [
  { icon: <Shield size={20} strokeWidth={1.5} />,       titre: 'Dossiers sécurisés',    desc: 'CNI, bulletins de paie, contrats stockés et accessibles en toute sécurité.' },
  { icon: <FileText size={20} strokeWidth={1.5} />,     titre: 'Documents automatiques', desc: 'Baux, quittances et mises en demeure générés en un clic.' },
  { icon: <Bell size={20} strokeWidth={1.5} />,         titre: 'Alertes intelligentes',  desc: 'Rappels loyers, baux expirants, préavis - tout est automatisé.' },
  { icon: <Banknote size={20} strokeWidth={1.5} />,     titre: 'Paiements multiples',    desc: 'Orange Money, MTN MoMo, espèces ou virement acceptés.' },
  { icon: <MessageCircle size={20} strokeWidth={1.5} />, titre: 'Messagerie intégrée',   desc: 'Communiquez directement avec locataires et propriétaires.' },
  { icon: <TrendingUp size={20} strokeWidth={1.5} />,   titre: 'Rapports financiers',    desc: 'Suivez vos revenus mois par mois avec des graphiques clairs.' },
  { icon: <Star size={20} strokeWidth={1.5} />,         titre: 'Notations mutuelles',    desc: 'Locataires et propriétaires se notent après chaque location.' },
  { icon: <Building2 size={20} strokeWidth={1.5} />,    titre: 'Multi-logements',        desc: 'Gérez jusqu\'à 25 biens depuis un seul tableau de bord.' },
];

var PLANS = [
  {
    nom: 'Locataire',
    prix: 0,
    sousTitre: 'Toujours gratuit',
    couleur: '#1565C0',
    bg: '#E3F2FD',
    features: ['Recherche avancée', 'Candidatures illimitées', 'Messagerie', 'Suivi de dossier', 'Signature électronique'],
    cta: 'Trouver un logement',
    role: 'locataire',
    recommande: false
  },
  {
    nom: 'Pro',
    prix: 120000,
    sousTitre: "Jusqu'à 20 biens",
    couleur: '#1B6B3A',
    bg: '#E8F5E9',
    features: ['Orange Money + MTN MoMo', 'Baux et quittances PDF', 'Alertes automatiques', 'Rapports financiers', 'Essai 1 mois'],
    cta: 'Essai gratuit 1 mois',
    role: 'proprietaire',
    plan: 'pro',
    recommande: true
  },
  {
    nom: 'Agence',
    prix: 300000,
    sousTitre: 'Biens illimités',
    couleur: '#7B1FA2',
    bg: '#F3E5F5',
    features: ['Tout du plan Pro', 'Multi-utilisateurs (5 comptes)', 'Rapport mensuel automatique', 'Support Mail/Message'],
    cta: 'Essai gratuit 1 mois',
    role: 'proprietaire',
    plan: 'agence',
    recommande: false
  },
];
var FAQ_LANDING = [
  { q: 'Werdhe est-il gratuit pour les locataires ?',      r: 'Oui, 100% gratuit pour toujours. Aucun frais d\'agence, aucune commission.' },
  { q: 'Comment fonctionne l\'essai Pro / Agence ?',       r: '1 mois complet d\'accès au plan choisi, sans Mobile Money requis. À la fin, vous choisissez de continuer ou non.' },
  { q: 'Quels modes de paiement sont acceptés ?',          r: 'Orange Money, MTN MoMo, espèces et virement bancaire (BICIGUI, Ecobank).' },
  { q: 'Mes données sont-elles sécurisées ?',              r: 'Oui. HTTPS, mots de passe hachés, 2FA admin, aucune donnée bancaire stockée.' },
  { q: 'Puis-je gérer plusieurs logements ?',              r: 'Oui. Le plan Pro permet jusqu\'à 20 biens, le plan Agence est illimité.' },
];

function FaqLanding() {
  var [open, setOpen] = useState(null);
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
var SLIDES = [
  {
    img:    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80&fit=crop',
    titre:  'Trouvez votre logement idéal',
    sous:   'Appartements, villas, studios à Conakry et partout en Guinée',
    tag:    'Conakry · Boké · Kindia · Labé · Kankan',
  },
  {
    img:    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80&fit=crop',
    titre:  'Publiez votre bien en 5 minutes',
    sous:   'Gérez candidatures, baux et paiements depuis un seul tableau de bord',
    tag:    'Pour les propriétaires · Essai 1 mois gratuit',
  },
  {
    img:    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80&fit=crop',
    titre:  'Des villas modernes en Guinée',
    sous:   'Découvrez nos logements vérifiés, sans intermédiaire, sans frais cachés',
    tag:    'Villas · Appartements · Studios · Bureaux',
  },
  {
    img:    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=80&fit=crop',
    titre:  'La location simplifiée',
    sous:   'Candidatez, signez votre bail et payez - tout en ligne sur Werdhe',
    tag:    '100% gratuit pour les locataires',
  },
];
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
  var navigate            = useNavigate();
  var { user }             = useAuth();
  var [mobileMenu, setMobileMenu] = useState(false);
  var [ongletEtapes, setOngletEtapes] = useState('proprio');
  var [essaiEnCours, setEssaiEnCours] = useState(null);
  var heroRef             = useRef(null);
  var [compteurs, setCompteurs] = useState({ logements: 0, utilisateurs: 0 });
  var [slideActif, setSlideActif] = useState(0);
  var [souris, setSouris] = useState({ x: 0, y: 0 });

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
        toast.success('Essai ' + plan.nom + ' démarré ! 1 mois gratuit.');
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
    var start = Date.now();
    var duration = 2000;
    var targets = { logements: 1200, utilisateurs: 4800 };
    var raf = requestAnimationFrame(function step() {
      var elapsed = Date.now() - start;
      var pct     = Math.min(elapsed / duration, 1);
      var ease    = 1 - Math.pow(1 - pct, 3); // easeOutCubic
      setCompteurs({
        logements:    Math.round(targets.logements * ease),
        utilisateurs: Math.round(targets.utilisateurs * ease),
      });
      if (pct < 1) requestAnimationFrame(step);
    });
    return function() { cancelAnimationFrame(raf); };
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
        titre="Location immobilière en Guinée sans intermédiaire"
        description="Trouvez ou louez un logement en Guinée facilement. Werdhe connecte propriétaires et locataires directement. 100% gratuit pour les locataires."
        url="https://werdhe.com"
      />
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(247,248,247,0.92)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid rgba(27,107,58,0.12)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={36} showText={true} darkBg={false} />

        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="nav-desktop">
          {[['Fonctionnalités', '#fonctionnalites'], ['Comment ça marche', '#comment'], ['Tarifs', '#tarifs'], ['Avis', '#avis'], ['FAQ', '#faq']].map(function(l) {
            return <a key={l[0]} href={l[1]} style={{ fontSize: 14, color: '#555', textDecoration: 'none', fontWeight: 500 }}>{l[0]}</a>;
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={function() { navigate('/login'); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', background: 'transparent', color: '#1B6B3A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Connexion
          </button>
          <button onClick={function() { navigate('/inscription'); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            className="btn-nav-hide">
            Démarrer
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
          {[['Fonctionnalités', '#fonctionnalites'], ['Comment ça marche', '#comment'], ['Tarifs', '#tarifs']].map(function(l) {
            return (
              <a key={l[0]} href={l[1]} onClick={function() { setMobileMenu(false); }}
                style={{ fontSize: 18, color: '#1B2B22', textDecoration: 'none', fontWeight: 600, padding: '12px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                {l[0]}
              </a>
            );
          })}
          <button onClick={function() { navigate('/login'); }}
            style={{ padding: '14px', borderRadius: 10, border: '1px solid #1B6B3A', background: 'transparent', color: '#1B6B3A', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            Connexion
          </button>
          <button onClick={function() { navigate('/inscription'); }}
            style={{ padding: '14px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Démarrer gratuitement
          </button>
        </div>
      )}
      {/* ─── FOND ANIMÉ GUINÉE ──────────────────────────────── */}
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 600, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <svg viewBox="0 0 1440 600" style={{ width: '100%', height: '100%', opacity: 0.07 }} xmlns="http://www.w3.org/2000/svg">
          {/* Maisons guinéennes stylisées */}
          <g transform="translate(100, 200)">
            <polygon points="60,0 120,60 0,60" fill="#1B6B3A" />
            <rect x="20" y="60" width="80" height="80" fill="#1B6B3A" />
            <rect x="45" y="100" width="30" height="40" fill="#F5A623" />
          </g>
          <g transform="translate(300, 220)">
            <polygon points="50,0 100,50 0,50" fill="#1B6B3A" />
            <rect x="15" y="50" width="70" height="70" fill="#1B6B3A" />
            <rect x="35" y="85" width="25" height="35" fill="#F5A623" />
          </g>
          <g transform="translate(1100, 180)">
            <polygon points="70,0 140,70 0,70" fill="#1B6B3A" />
            <rect x="25" y="70" width="90" height="90" fill="#1B6B3A" />
            <rect x="50" y="110" width="35" height="50" fill="#F5A623" />
          </g>
          <g transform="translate(1280, 210)">
            <polygon points="50,0 100,50 0,50" fill="#1B6B3A" />
            <rect x="15" y="50" width="70" height="70" fill="#1B6B3A" />
          </g>
          {/* Collines guinéennes */}
          <ellipse cx="200" cy="520" rx="300" ry="120" fill="#1B6B3A" />
          <ellipse cx="800" cy="550" rx="400" ry="100" fill="#1B6B3A" />
          <ellipse cx="1300" cy="530" rx="280" ry="110" fill="#1B6B3A" />
          {/* Soleil */}
          <circle cx="1350" cy="120" r="60" fill="#F5A623" opacity="0.5" />
          {/* Palmiers */}
          <line x1="550" y1="500" x2="550" y2="350" stroke="#1B6B3A" strokeWidth="8" />
          <ellipse cx="550" cy="340" rx="40" ry="20" fill="#1B6B3A" transform="rotate(-20, 550, 340)" />
          <ellipse cx="550" cy="340" rx="40" ry="20" fill="#1B6B3A" transform="rotate(20, 550, 340)" />
          <ellipse cx="550" cy="340" rx="40" ry="20" fill="#1B6B3A" transform="rotate(60, 550, 340)" />
          <line x1="900" y1="490" x2="900" y2="370" stroke="#1B6B3A" strokeWidth="6" />
          <ellipse cx="900" cy="360" rx="30" ry="15" fill="#1B6B3A" transform="rotate(-20, 900, 360)" />
          <ellipse cx="900" cy="360" rx="30" ry="15" fill="#1B6B3A" transform="rotate(30, 900, 360)" />
        </svg>

        {/* Personnages animés */}
        <div style={{ position: 'absolute', bottom: 60, left: '15%', animation: 'flottement 4s ease-in-out infinite' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>👨‍💼</div>
            <div style={{ fontSize: 10, color: '#1B6B3A', fontWeight: 700, marginTop: 4 }}>Propriétaire</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 60, right: '15%', animation: 'flottement 4s ease-in-out infinite 1s' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>👩</div>
            <div style={{ fontSize: 10, color: '#1B6B3A', fontWeight: 700, marginTop: 4 }}>Locataire</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', animation: 'flottement 3s ease-in-out infinite 0.5s' }}>
          <div style={{ fontSize: 56 }}>🏠</div>
        </div>

        {/* Flèches de connexion animées */}
        <svg style={{ position: 'absolute', bottom: 70, left: '20%', width: '60%', height: 60 }} viewBox="0 0 400 60">
          <path d="M30 30 Q200 10 370 30" stroke="#1B6B3A" strokeWidth="2" fill="none" strokeDasharray="8 4" opacity="0.4">
            <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite" />
          </path>
          <path d="M370 30 Q200 50 30 30" stroke="#F5A623" strokeWidth="2" fill="none" strokeDasharray="8 4" opacity="0.4">
            <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>
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
            <div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{SLIDES[slideActif].tag}</span>
          </div>

          {/* Titre */}
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: -1.5, lineHeight: 1.08, textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
            {SLIDES[slideActif].titre}
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'rgba(255,255,255,0.85)', margin: '0 auto 36px', lineHeight: 1.6, maxWidth: 580 }}>
            {SLIDES[slideActif].sous}
          </p>

          {/* Barre de recherche */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 8, display: 'flex', gap: 8, maxWidth: 720, margin: '0 auto 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#F7F8F7' }}>
              <MapPin size={16} strokeWidth={1.5} color="#1B6B3A" />
              <select defaultValue="" style={{ border: 'none', background: 'transparent', fontSize: 14, color: '#1B2B22', outline: 'none', width: '100%', cursor: 'pointer' }}>
                <option value="">Toutes les villes</option>
                {['Conakry', 'Kindia', 'Labé', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'N\'Zérékoré'].map(function(v) {
                  return <option key={v} value={v}>{v}</option>;
                })}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 130, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#F7F8F7' }}>
              <Home size={16} strokeWidth={1.5} color="#1B6B3A" />
              <select defaultValue="" style={{ border: 'none', background: 'transparent', fontSize: 14, color: '#1B2B22', outline: 'none', width: '100%', cursor: 'pointer' }}>
                <option value="">Type de bien</option>
                {['Appartement', 'Villa', 'Studio', 'Duplex', 'Bureau'].map(function(c) {
                  return <option key={c} value={c.toLowerCase()}>{c}</option>;
                })}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 130, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#F7F8F7' }}>
              <Banknote size={16} strokeWidth={1.5} color="#1B6B3A" />
              <select defaultValue="" style={{ border: 'none', background: 'transparent', fontSize: 14, color: '#1B2B22', outline: 'none', width: '100%', cursor: 'pointer' }}>
                <option value="">Budget</option>
                <option value="0-500000">Moins de 500K GNF</option>
                <option value="500000-1000000">500K – 1M GNF</option>
                <option value="1000000-3000000">1M – 3M GNF</option>
                <option value="3000000+">Plus de 3M GNF</option>
              </select>
            </div>
            <button
              onClick={function() { navigate('/logements'); }}
              style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
              <Search size={16} strokeWidth={2} /> Rechercher
            </button>
          </div>

          {/* Badges rapides */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <Building2 size={13} strokeWidth={1.5} />, label: 'Appartements' },
              { icon: <Home size={13} strokeWidth={1.5} />,      label: 'Villas'       },
              { icon: <Key size={13} strokeWidth={1.5} />,       label: 'Studios'      },
              { icon: <Users size={13} strokeWidth={1.5} />,     label: 'Colocations'  },
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
          <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Paiements acceptés</span>
          {[
            { nom: 'Orange Money', couleur: '#FF6600' },
            { nom: 'MTN MoMo',    couleur: '#FFCB00' },
            { nom: 'Espèces',      couleur: '#1B6B3A' },
            { nom: 'Virement',     couleur: '#1565C0' },
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
            return (
              <div key={i} style={{ textAlign: 'center', padding: '20px 12px' }}>
                <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: i === 0 ? '#F5A623' : '#fff', letterSpacing: -1 }}>
          {i === 0 ? compteurs.logements.toLocaleString('fr-FR') + '+' : i === 1 ? compteurs.utilisateurs.toLocaleString('fr-FR') + '+' : s.valeur}
        </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ───────────────────────────────────── */}
      <section id="comment" style={{ padding: 'clamp(50px, 8vw, 90px) 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Comment ça marche</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>Simple pour tous</h2>
        </div>

        {/* Toggle proprio / locataire */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', background: '#F0F0F0', borderRadius: 12, padding: 4, gap: 4 }}>
            {[['proprio', 'Je suis propriétaire'], ['locataire', 'Je cherche un logement']].map(function(t) {
              var actif = ongletEtapes === t[0];
              return (
                <button key={t[0]} onClick={function() { setOngletEtapes(t[0]); }}
                  style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: actif ? '#1B6B3A' : 'transparent', color: actif ? '#fff' : '#888', fontSize: 14, fontWeight: actif ? 700 : 500, cursor: 'pointer', transition: 'all .2s' }}>
                  {t[1]}
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
            {ongletEtapes === 'proprio' ? 'Ajouter mon premier bien' : 'Voir les logements disponibles'} <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ─────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ background: '#1B2B22', padding: 'clamp(50px, 8vw, 90px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, color: '#F5A623', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Fonctionnalités</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: -0.5 }}>Tout pour gérer vos locations</h2>
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
          <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Tarifs</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: '0 0 12px', color: '#1B2B22', letterSpacing: -0.5 }}>Transparent et sans surprise</h2>
          <p style={{ color: '#666', fontSize: 16, margin: 0 }}>L'espace locataire est toujours 100% gratuit</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {PLANS.map(function(plan, i) {
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', border: plan.recommande ? '2px solid #1B6B3A' : '1px solid #E8E8E8', position: 'relative', boxShadow: plan.recommande ? '0 8px 32px rgba(27,107,58,0.12)' : 'none' }}>
                {plan.recommande && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#1B6B3A', color: '#fff', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Recommandé
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
                    {plan.prix === 0 ? 'Gratuit' : GNF(plan.prix)}
                  </span>
                  {plan.prix > 0 && <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>GNF/mois</span>}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>{plan.sousTitre}</div>

                <button
                  onClick={function() { choisirPlan(plan); }}
                  disabled={essaiEnCours === plan.plan}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: plan.recommande ? 'none' : '1.5px solid ' + plan.couleur, background: essaiEnCours === plan.plan ? '#aaa' : (plan.recommande ? plan.couleur : 'transparent'), color: plan.recommande ? '#fff' : plan.couleur, fontSize: 14, fontWeight: 700, cursor: essaiEnCours === plan.plan ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
                  {essaiEnCours === plan.plan ? 'Démarrage...' : plan.cta}
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
            <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Témoignages</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>Ils font confiance à Werdhe</h2>
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
          <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>FAQ</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: 0, color: '#1B2B22', letterSpacing: -0.5 }}>Questions fréquentes</h2>
        </div>
        <FaqLanding />
      </section>
      {/* ─── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ background: '#1B6B3A', padding: 'clamp(50px, 8vw, 80px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: -1 }}>
            Prêt à commencer ?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: '0 0 32px', lineHeight: 1.6 }}>
            Rejoignez des milliers de propriétaires et locataires qui gèrent leurs locations sur Werdhe.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={function() { navigate('/inscription'); }}
              style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#F5A623', color: '#1B2B22', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Créer mon compte <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <button onClick={function() { navigate('/logements'); }}
              style={{ padding: '14px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.35)', background: 'transparent', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Voir les logements
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
            <footer style={{ background: '#101A12', padding: '0' }}>
        {/* Galerie résidences Guinée */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, height: 180 }}>
          {[
            { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=75&fit=crop', label: 'Villa moderne' },
            { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=75&fit=crop', label: 'Appartement'   },
            { src: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=75&fit=crop', label: 'Résidence'     },
            { src: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=75&fit=crop', label: 'Duplex'        },
          ].map(function(item, i) {
            return (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                <img src={item.src} alt={item.label} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)', transition: 'transform .4s, filter .4s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.filter = 'brightness(0.75)'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(0.5)'; }} />
                <div style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 12, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(36px, 5vw, 56px) 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ marginBottom: 14 }}>
                <Logo size={32} showText={true} darkBg={true} />
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 14px' }}>
                La plateforme immobilière de référence en Guinée.
              </p>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>🇬🇳 Made in Guinea</div>
            </div>

            {[
              { titre: 'Plateforme', liens: [['Logements disponibles', '/logements'], ['Tarifs', '/pricing'], ['À propos', '/a-propos'], ['Se connecter', '/login'], ['Créer un compte', '/inscription']] },
              { titre: 'Assistance', liens: [['Contact', '/contact'], ['Conditions d\'utilisation', '/cgu'], ['Politique de confidentialité', '/confidentialite']] },
            ].map(function(col) {
              return (
                <div key={col.titre}>
                  <div style={{ fontSize: 12, color: '#F5A623', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>{col.titre}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {col.liens.map(function(l) {
                      return (
                        <a key={l[0]} href={l[1]}
                          style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                          onMouseEnter={function(e) { e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={function(e) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                          {l[0]}
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 Werdhe. Tous droits réservés.</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>contact@werdhe.com</div>
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