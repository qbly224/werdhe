/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home, Users, FileText, Shield, Bell, MessageCircle,
  ChevronRight, Check, Star, MapPin, ArrowRight,
  Building2, Key, TrendingUp, Banknote, Menu, X
} from 'lucide-react';
import SEO from '../components/SEO';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

var STATS = [
  { valeur: '1 200+', label: 'Logements disponibles' },
  { valeur: '4 800+', label: 'Utilisateurs actifs'   },
  { valeur: '98%',    label: 'Locataires satisfaits'  },
  { valeur: '0 GNF',  label: 'Pour les locataires'   },
];

var TEMOIGNAGES = [
  {
    nom:     'Mamadou Diallo',
    role:    'Propriétaire, Conakry',
    note:    5,
    texte:   "Werdhe m'a permis de gérer mes 3 appartements depuis mon téléphone. Les paiements, les contrats, tout est centralisé. Je recommande vivement.",
    initiales: 'MD',
    couleur: '#1B6B3A'
  },
  {
    nom:     'Fatoumata Camara',
    role:    'Locataire, Ratoma',
    note:    5,
    texte:   "J'ai trouvé mon appartement en 48h. Le propriétaire était sérieux, le contrat signé en ligne. Plus besoin d'intermédiaire.",
    initiales: 'FC',
    couleur: '#1565C0'
  },
  {
    nom:     'Ibrahima Bah',
    role:    'Propriétaire, Kaloum',
    note:    5,
    texte:   "Le système d'alertes automatiques pour les loyers en retard m'a sauvé plusieurs fois. Une vraie révolution pour la gestion locative en Guinée.",
    initiales: 'IB',
    couleur: '#7B1FA2'
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
  { icon: <Bell size={20} strokeWidth={1.5} />,         titre: 'Alertes intelligentes',  desc: 'Rappels loyers, baux expirants, préavis — tout est automatisé.' },
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
    sousTitre: "Jusqu'à 25 biens",
    couleur: '#1B6B3A',
    bg: '#E8F5E9',
    features: ['Tout du gratuit', 'Orange Money + MTN', 'Baux et quittances PDF', 'Alertes automatiques', 'Rapports financiers', 'Essai 14 jours'],
    cta: 'Essai gratuit 14 jours',
    role: 'proprietaire',
    recommande: true
  },
  {
    nom: 'Agence',
    prix: 300000,
    sousTitre: 'Biens illimités',
    couleur: '#7B1FA2',
    bg: '#F3E5F5',
    features: ['Tout du plan Pro', 'Multi-utilisateurs', 'API et intégrations', 'Marque blanche', 'Support prioritaire'],
    cta: 'Nous contacter',
    role: 'agence',
    recommande: false
  },
];

export default function LandingPage() {
  var navigate            = useNavigate();
  var [mobileMenu, setMobileMenu] = useState(false);
  var [ongletEtapes, setOngletEtapes] = useState('proprio');
  var heroRef             = useRef(null);

  useEffect(function() {
    var handler = function(e) {
      if (e.key === 'Escape') setMobileMenu(false);
    };
    window.addEventListener('keydown', handler);
    return function() { window.removeEventListener('keydown', handler); };
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F7F8F7', color: '#1B2B22', overflowX: 'hidden' }}>
      <SEO
        titre="Location immobilière en Guinée sans intermédiaire"
        description="Trouvez ou louez un logement en Guinée facilement. Werdhe connecte propriétaires et locataires directement. 100% gratuit pour les locataires."
        url="https://werdhe.com"
      />
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(247,248,247,0.92)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid rgba(27,107,58,0.12)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: '#1B6B3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={16} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1B2B22', letterSpacing: -0.5 }}>Werdhe</span>
        </div>

        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="nav-desktop">
          {[['Fonctionnalités', '#fonctionnalites'], ['Comment ça marche', '#comment'], ['Tarifs', '#tarifs']].map(function(l) {
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

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ padding: 'clamp(60px, 10vw, 100px) 24px clamp(40px, 8vw, 80px)', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
          <div style={{ width: 7, height: 7, background: '#1B6B3A', borderRadius: '50%' }} />
          <span style={{ fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>Plateforme immobilière guinéenne</span>
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 6vw, 58px)', fontWeight: 900, lineHeight: 1.1, color: '#1B2B22', margin: '0 0 20px', letterSpacing: -1.5 }}>
          Louer en Guinée,{' '}
          <span style={{ color: '#1B6B3A', borderBottom: '4px solid #F5A623', paddingBottom: 2 }}>sans intermédiaire</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#555', lineHeight: 1.6, margin: '0 auto 36px', maxWidth: 560 }}>
          Werdhe connecte propriétaires et locataires directement — candidatures, dossiers, baux, paiements. Tout en un seul endroit.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={function() { navigate('/inscription'); }}
            style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            Démarrer gratuitement <ArrowRight size={16} strokeWidth={2} />
          </button>
          <button onClick={function() { navigate('/logements'); }}
            style={{ padding: '14px 28px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', color: '#1B2B22', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Chercher un logement
          </button>
        </div>

        <div style={{ marginTop: 20, fontSize: 12, color: '#888', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} color="#1B6B3A" strokeWidth={2.5} /> 100% gratuit pour les locataires</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} color="#1B6B3A" strokeWidth={2.5} /> Essai Pro 14 jours gratuits</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} color="#1B6B3A" strokeWidth={2.5} /> Sans carte de crédit</span>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────── */}
      <section style={{ background: '#1B2B22', padding: 'clamp(32px, 5vw, 56px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, maxWidth: 900, margin: '0 auto' }}>
          {STATS.map(function(s, i) {
            return (
              <div key={i} style={{ textAlign: 'center', padding: '20px 12px' }}>
                <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: i === 0 ? '#F5A623' : '#fff', letterSpacing: -1 }}>{s.valeur}</div>
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
                    <Building2 size={18} strokeWidth={1.5} color={plan.couleur} />
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
                  onClick={function() {
                    if (plan.role === 'agence') { window.location.href = 'mailto:contact@werdhe.com?subject=Plan Agence'; }
                    else { navigate('/inscription'); }
                  }}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: plan.recommande ? 'none' : '1.5px solid ' + plan.couleur, background: plan.recommande ? plan.couleur : 'transparent', color: plan.recommande ? '#fff' : plan.couleur, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>
                  {plan.cta}
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

      {/* ─── TÉMOIGNAGES ─────────────────────────────────────────── */}
      <section style={{ background: '#F0F8F3', padding: 'clamp(50px, 8vw, 90px) 24px' }}>
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
      <footer style={{ background: '#101A12', padding: 'clamp(36px, 5vw, 56px) 24px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, background: '#1B6B3A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Home size={14} color="#fff" strokeWidth={2} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Werdhe</span>
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
      `}</style>
    </div>
  );
}