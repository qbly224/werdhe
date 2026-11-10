/* eslint-disable */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import { useAuth } from '../context/AuthContext';
import { Check, X, ChevronDown, ChevronUp, Zap, Building2, Users, ArrowRight, Info } from 'lucide-react';
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';
import OdometerNumber from '../components/OdometerNumber';
import useLimitesPlans from '../hooks/useLimitesPlans';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

function getCycles(t) {
  return {
    mensuel:    { label: t('pricing.cycles.mensuel'), mois: 1,  reduction: 0    },
    semestriel: { label: t('pricing.cycles.semestriel'),  mois: 6,  reduction: 0.10 },
    annuel:     { label: t('pricing.cycles.annuel'),  mois: 12, reduction: 0.20 },
  };
}

function getPlans(t, limites) {
  return [
    {
      id:         'gratuit',
      nom:        t('pricing.plans.gratuit.nom'),
      prix_mois:  0,
      couleur:    '#1565C0',
      bg:         '#E3F2FD',
      sous_titre: t('pricing.plans.gratuit.sousTitre'),
      features: [
        t('pricing.plans.gratuit.features.0'),
        t('pricing.plans.gratuit.features.1'),
        t('pricing.plans.gratuit.features.2'),
        t('pricing.plans.gratuit.features.3'),
        t('pricing.plans.gratuit.features.4'),
        t('pricing.plans.gratuit.features.5'),
        t('pricing.plans.gratuit.features.6'),
      ],
      nonInclus: []
    },
    {
      id:        'pro',
      nom:       t('pricing.plans.pro.nom'),
      prix_mois: 120000,
      couleur:   '#1B6B3A',
      bg:        '#E8F5E9',
      badge:     t('pricing.plans.pro.badge'),
      recommande: true,
      sous_titre: t('pricing.plans.pro.sousTitre', limites),
      features: [
        t('pricing.plans.pro.features.0', limites),
        t('pricing.plans.pro.features.1'),
        t('pricing.plans.pro.features.2'),
        t('pricing.plans.pro.features.3'),
        t('pricing.plans.pro.features.4'),
        t('pricing.plans.pro.features.5'),
        t('pricing.plans.pro.features.6'),
        t('pricing.plans.pro.features.7'),
        t('pricing.plans.pro.features.8'),
      ],
      nonInclus: [
        t('pricing.plans.pro.nonInclus.0'),
        t('pricing.plans.pro.nonInclus.1'),
      ]
    },
    {
      id:        'agence',
      nom:       t('pricing.plans.agence.nom'),
      prix_mois: 300000,
      couleur:   '#7B1FA2',
      bg:        '#F3E5F5',
      badge:     t('pricing.plans.agence.badge'),
      recommande: false,
      sous_titre: t('pricing.plans.agence.sousTitre'),
      features: [
        t('pricing.plans.agence.features.0'),
        t('pricing.plans.agence.features.1'),
        t('pricing.plans.agence.features.2'),
        t('pricing.plans.agence.features.3'),
        t('pricing.plans.agence.features.4'),
        t('pricing.plans.agence.features.5'),
        t('pricing.plans.agence.features.6'),
        t('pricing.plans.agence.features.7'),
      ],
      nonInclus: []
    },
  ];
}

function getFaqItems(t) {
  return [
    { q: t('pricing.faq.0.q'), r: t('pricing.faq.0.r') },
    { q: t('pricing.faq.1.q'), r: t('pricing.faq.1.r') },
    { q: t('pricing.faq.2.q'), r: t('pricing.faq.2.r') },
    { q: t('pricing.faq.3.q'), r: t('pricing.faq.3.r') },
    { q: t('pricing.faq.4.q'), r: t('pricing.faq.4.r') },
    { q: t('pricing.faq.5.q'), r: t('pricing.faq.5.r') },
  ];
}

export default function Pricing() {
  var t                   = useTranslation('public').t;
  var CYCLES              = getCycles(t);
  var limites             = useLimitesPlans();
  var PLANS               = getPlans(t, limites);
  var FAQ_ITEMS           = getFaqItems(t);
  var navigate            = useNavigate();
  var { user }             = useAuth();
  var [cycle, setCycle]     = useState('mensuel');
  var [openFaq, setOpenFaq] = useState(null);
  var [code, setCode]       = useState('');
  var [codeOk, setCodeOk]   = useState(null);
  var [loading, setLoading] = useState(false);
  var [essaiEnCours, setEssaiEnCours] = useState(null); // id du plan en cours de démarrage
  var [showPaiement, setShowPaiement] = useState(null); // 'pro' ou 'agence'

  function validerCode() {
    if (!code.trim()) return;
    setLoading(true);
    api.get('/abonnements/valider-code?code=' + code.trim().toUpperCase())
      .then(function(res) { setCodeOk(res.data); toast.success(t('pricing.codeValide')); })
      .catch(function() { setCodeOk(false); toast.error(t('pricing.codeInvalide')); })
      .finally(function() { setLoading(false); });
  }

  // CTA intelligent : redirige vers l'inscription si non connecté,
  // démarre l'essai gratuit si connecté, ou propose le paiement direct
  // si l'essai a déjà été utilisé.
  function choisirPlan(planId) {
    if (planId === 'gratuit') {
      navigate('/inscription?role=locataire');
      return;
    }

    if (!user) {
      navigate('/inscription?role=proprietaire&plan=' + planId);
      return;
    }

    setEssaiEnCours(planId);
    api.post('/abonnements/essai', { plan: planId })
      .then(function() {
        toast.success(t('pricing.essaiDemarre', { plan: planId === 'pro' ? t('pricing.plans.pro.nom') : t('pricing.plans.agence.nom') }));
        navigate('/dashboard');
      })
      .catch(function(err) {
        // Essai déjà utilisé ou abonnement déjà actif → payer directement
        var msg = err.response && err.response.data ? err.response.data.erreur : '';
        toast(msg || t('pricing.essaiDejaUtilise'), { icon: <Info size={16} strokeWidth={1.5} /> });
        setShowPaiement(planId);
      })
      .finally(function() { setEssaiEnCours(null); });
  }

  function montantCycle(prixMois) {
    var infos = CYCLES[cycle];
    return Math.round(prixMois * infos.mois * (1 - infos.reduction));
  }
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre={t('pricing.seo.titre')}
        description={t('pricing.seo.description')}
        url="https://werdhe.com/pricing"
      />

      {/* Navbar */}
      <nav className="site-navbar" style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '10px 24px', minHeight: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={34} showText={true} darkBg={false} />
        </Link>
        <div className="site-navbar-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', rowGap: 8 }}>
          <Link to="/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>{t('pricing.connexion')}</Link>
          <Link to="/inscription" style={{ padding: '8px 16px', borderRadius: 8, background: '#1B6B3A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>{t('pricing.demarrer')}</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #0F1E14 0%, #1B2B22 55%, #16321F 100%)', textAlign: 'center', padding: 'clamp(28px, 4vw, 44px) 24px 28px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: -0.5 }}>
            {t('pricing.titre')}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>
            {t('pricing.sousTitre')}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500, margin: '0 0 20px' }}>
            {t('pricing.paiementMobileMoney')}
          </p>

          {/* Toggle cycle de facturation */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: 30, padding: '4px 6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.keys(CYCLES).map(function(c) {
              var actif = cycle === c;
              return (
                <button key={c} onClick={function() { setCycle(c); }}
                  style={{ padding: '7px 14px', borderRadius: 22, border: 'none', background: actif ? '#1B6B3A' : 'transparent', color: actif ? '#fff' : '#888', fontSize: 13, fontWeight: actif ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
                  {CYCLES[c].label}
                  {CYCLES[c].reduction > 0 && (
                    <span style={{ background: '#F5A623', color: '#1B2B22', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                      -{Math.round(CYCLES[c].reduction * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal paiement Mobile Money (abonnement) */}
      {showPaiement && (
        <ModalPaiementMobile
          montant={montantCycle(PLANS.find(function(p) { return p.id === showPaiement; }).prix_mois)}
          titre={t('pricing.modalTitre', { plan: showPaiement === 'pro' ? t('pricing.plans.pro.nom') : t('pricing.plans.agence.nom'), cycle: CYCLES[cycle].label })}
          payload={{ plan: showPaiement, cycle: cycle, code_promo: codeOk && codeOk.valide ? code : undefined }}
          endpoint="/abonnements/souscrire"
          onClose={function() { setShowPaiement(null); }}
        />
      )}

      {/* Cartes des plans */}
      <div style={{ maxWidth: 1080, margin: '32px auto 40px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1B6B3A', marginBottom: 8 }}>{t('pricing.registreOverline')}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 'clamp(24px, 3.4vw, 36px)', color: '#1B2B22', margin: 0 }}>{t('pricing.comparaison')}</h2>
        </div>

        <div className="plan-cards">
          {PLANS.map(function(plan) {
            var vedette = plan.id === 'pro';
            var payant = plan.prix_mois > 0;
            var reduction = CYCLES[cycle].reduction;
            var pastille = payant && reduction > 0
              ? t('pricing.reductionPastille', { pct: Math.round(reduction * 100) })
              : (payant ? plan.badge : null);
            return (
              <div key={plan.id} className={'plan-card' + (vedette ? ' plan-card-vedette' : '')}>
                <div className="plan-card-head">
                  {pastille && <span className="plan-pill">{pastille}</span>}
                  <div className="plan-name">{plan.nom}</div>
                  <div className="plan-tagline">{plan.sous_titre}</div>
                </div>

                <div className="plan-card-body">
                  <div className="plan-price">
                    {payant ? (
                      <>
                        <OdometerNumber value={montantCycle(plan.prix_mois)} suffix={"\u00A0GNF"}
                          style={{ fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 32, color: 'inherit' }} />
                        <span className="plan-per">/ {CYCLES[cycle].label.toLowerCase()}</span>
                      </>
                    ) : (
                      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 38 }}>{t('pricing.gratuit')}</span>
                    )}
                  </div>

                  <button onClick={function() { choisirPlan(plan.id); }} disabled={essaiEnCours === plan.id} className="plan-cta">
                    {essaiEnCours === plan.id
                      ? t('pricing.demarrage')
                      : <>{plan.id === 'gratuit' ? t('pricing.creerCompteGratuit') : t('pricing.essaiGratuit1Mois')} <ArrowRight size={14} strokeWidth={2.5} /></>
                    }
                  </button>

                  <div className="plan-fineprint">
                    {payant && reduction > 0
                      ? t('pricing.economie', { montant: GNF(Math.round(plan.prix_mois * CYCLES[cycle].mois * reduction)) })
                      : null}
                    {payant && (
                      <button onClick={function() { setShowPaiement(plan.id); }} className="plan-already">
                        {t('pricing.dejaUtiliseEssai')}
                      </button>
                    )}
                  </div>

                  <ul className="plan-features">
                    {plan.features.map(function(f, i) {
                      return (
                        <li key={i}><Check size={16} strokeWidth={2.5} className="plan-check" /> <span>{f}</span></li>
                      );
                    })}
                    {plan.nonInclus.map(function(f, i) {
                      return (
                        <li key={'n' + i} className="plan-feature-off"><X size={16} strokeWidth={2} /> <span>{f}</span></li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Code promo */}
      <div style={{ maxWidth: 480, margin: '0 auto 48px', padding: '0 20px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '22px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', margin: '0 0 6px' }}>{t('pricing.codePromoQuestion')}</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input type="text" placeholder={t('pricing.placeholderCodePromo')} value={code}
              onChange={function(e) { setCode(e.target.value.toUpperCase()); setCodeOk(null); }}
              onKeyDown={function(e) { if (e.key === 'Enter') validerCode(); }}
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid ' + (codeOk && codeOk.valide ? '#1B6B3A' : codeOk === false ? '#E53935' : '#E0E0E0'), borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'monospace', letterSpacing: 1 }} />
            <button onClick={validerCode} disabled={loading || !code.trim()}
              style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '...' : t('pricing.valider')}
            </button>
          </div>
          {codeOk && codeOk.valide && (
            <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>
              {t('pricing.codeValideReduction', { pct: codeOk.reduction_pct, plan: codeOk.plan_cible })}
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '0 auto 48px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px' }}>{t('pricing.questionsFrequentes')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map(function(item, i) {
            var open = openFaq === i;
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: open ? '0 6px 20px rgba(27,107,58,0.12)' : '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid transparent', borderLeft: open ? '3px solid #F5A623' : '3px solid transparent', transition: 'box-shadow .2s, border-color .2s' }}>
                <button onClick={function() { setOpenFaq(open ? null : i); }}
                  style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{item.q}</span>
                  {open ? <ChevronUp size={18} strokeWidth={2} color="#1B6B3A" /> : <ChevronDown size={18} strokeWidth={2} color="#888" />}
                </button>
                {open && (
                  <div style={{ padding: '0 18px 16px', fontSize: 14, color: '#555', lineHeight: 1.7, borderTop: '0.5px solid #F0F0F0', paddingTop: 12 }}>
                    {item.r}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(160deg, #0F1E14 0%, #1B2B22 55%, #16321F 100%)', padding: 'clamp(32px, 5vw, 48px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>{t('pricing.pretACommencer')}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 22px' }}>{t('pricing.ctaSousTitre')}</p>
        <button onClick={function() { choisirPlan('pro'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', background: '#F5A623', color: '#1B2B22', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
          {t('pricing.demarrerEssai')} <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ background: '#101A12', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          © 2026 Werdhe · <a href="/cgu" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{t('pricing.footerCgu')}</a> · <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{t('pricing.footerConfidentialite')}</a>
        </p>
      </div>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .plan-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: stretch; }
        .plan-card {
          display: flex; flex-direction: column; background: #EEF0EE; border-radius: 26px; padding: 8px;
          color: #1B2B22; transition: transform .2s, box-shadow .2s;
        }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(15,30,20,0.12); }
        .plan-card-head {
          position: relative; background: #fff; border-radius: 20px; padding: 22px 20px 20px; min-height: 130px;
        }
        .plan-pill {
          position: absolute; top: 16px; right: 16px; background: #E4F4EA; color: #1B6B3A;
          border-radius: 20px; padding: 4px 11px; font-size: 12px; font-weight: 800;
        }
        .plan-name { font-family: 'Fraunces', serif; font-weight: 650; font-size: 24px; margin-bottom: 6px; padding-right: 110px; }
        .plan-tagline { font-size: 14px; color: #666; line-height: 1.45; }
        .plan-card-body { padding: 22px 14px 14px; display: flex; flex-direction: column; flex: 1; }
        .plan-price { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; min-height: 46px; }
        .plan-per { font-size: 14px; color: #777; }
        .plan-cta {
          margin-top: 18px; width: 100%; padding: 13px 16px; border-radius: 12px; cursor: pointer;
          background: #fff; color: #1B2B22; border: 1.5px solid #D6DBD7; font-size: 14.5px; font-weight: 700;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: background .15s, border-color .15s;
        }
        .plan-cta:hover { border-color: #1B6B3A; background: #F6FBF8; }
        .plan-cta:disabled { opacity: .6; cursor: default; }
        .plan-fineprint { min-height: 42px; margin-top: 12px; text-align: center; font-size: 12.5px; color: #1B6B3A; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .plan-already { background: none; border: none; color: #8A8F8B; font-size: 11.5px; font-weight: 500; cursor: pointer; text-decoration: underline; padding: 0; }
        .plan-features { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.4; }
        .plan-features li svg { flex-shrink: 0; margin-top: 1px; }
        .plan-check { color: #1FA750; }
        .plan-feature-off { color: #9AA09B; }

        .plan-card-vedette { background: linear-gradient(180deg, #16321F 0%, #08110B 100%); color: #fff; }
        .plan-card-vedette .plan-card-head { background: linear-gradient(160deg, #1B6B3A 0%, #0F3D22 100%); }
        .plan-card-vedette .plan-tagline { color: rgba(255,255,255,0.78); }
        .plan-card-vedette .plan-pill { background: #F5A623; color: #1B2B22; }
        .plan-card-vedette .plan-per { color: rgba(255,255,255,0.65); }
        .plan-card-vedette .plan-cta { background: #fff; border-color: #fff; color: #1B2B22; }
        .plan-card-vedette .plan-cta:hover { background: #F5A623; border-color: #F5A623; }
        .plan-card-vedette .plan-fineprint { color: #FFD98E; }
        .plan-card-vedette .plan-already { color: rgba(255,255,255,0.55); }
        .plan-card-vedette .plan-check { color: #5BE08A; }
        .plan-card-vedette .plan-feature-off { color: rgba(255,255,255,0.4); }

        @media (max-width: 900px) {
          .plan-cards { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; }
          .plan-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
