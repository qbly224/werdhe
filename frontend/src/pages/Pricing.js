/* eslint-disable */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import { useAuth } from '../context/AuthContext';
import { Check, X, ChevronDown, ChevronUp, Zap, Building2, Users, ArrowRight, Home } from 'lucide-react';
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

function getCycles(t) {
  return {
    mensuel:    { label: t('pricing.cycles.mensuel'), mois: 1,  reduction: 0    },
    semestriel: { label: t('pricing.cycles.semestriel'),  mois: 6,  reduction: 0.10 },
    annuel:     { label: t('pricing.cycles.annuel'),  mois: 12, reduction: 0.20 },
  };
}

function getPlans(t) {
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
      sous_titre: t('pricing.plans.pro.sousTitre'),
      features: [
        t('pricing.plans.pro.features.0'),
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
  var PLANS               = getPlans(t);
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
        toast(msg || t('pricing.essaiDejaUtilise'), { icon: 'ℹ️' });
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
      <nav style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={34} showText={true} darkBg={false} />
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>{t('pricing.connexion')}</Link>
          <Link to="/inscription" style={{ padding: '8px 16px', borderRadius: 8, background: '#1B6B3A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>{t('pricing.demarrer')}</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 64px) 24px 32px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 12px', letterSpacing: -1 }}>
          {t('pricing.titre')}
        </h1>
        <p style={{ fontSize: 15, color: '#888', margin: '0 0 6px' }}>
          {t('pricing.sousTitre')}
        </p>
        <p style={{ fontSize: 13, color: '#1B6B3A', fontWeight: 600, margin: '0 0 28px' }}>
          {t('pricing.paiementMobileMoney')}
        </p>

        {/* Toggle cycle de facturation */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 30, padding: '6px 8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Object.keys(CYCLES).map(function(c) {
            var actif = cycle === c;
            return (
              <button key={c} onClick={function() { setCycle(c); }}
                style={{ padding: '8px 16px', borderRadius: 22, border: 'none', background: actif ? '#1B6B3A' : 'transparent', color: actif ? '#fff' : '#888', fontSize: 13, fontWeight: actif ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
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

      {/* Modal paiement Mobile Money (abonnement) */}
      {showPaiement && (
        <ModalPaiementMobile
          montant={montantCycle(PLANS.find(function(p) { return p.id === showPaiement; }).prix_mois)}
          titre={t('pricing.modalTitre', { plan: showPaiement === 'pro' ? t('pricing.plans.pro.nom') : t('pricing.plans.agence.nom'), cycle: CYCLES[cycle].label })}
          payload={{ plan: showPaiement, cycle: cycle, code_promo: codeOk && codeOk.valide ? code : undefined }}
          endpoints={{
            orange:    '/abonnements/orange-money/initier',
            mtn:       '/abonnements/mtn-momo/initier',
            confirmer: '/abonnements/confirmer/',
          }}
          onClose={function() { setShowPaiement(null); }}
          onSuccess={function() { navigate('/dashboard'); }}
        />
      )}

      {/* Cards plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, maxWidth: 1000, margin: '0 auto 48px', padding: '0 20px' }}>
        {PLANS.map(function(plan) {
          var prix = montantCycle(plan.prix_mois);
          return (
            <div key={plan.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: plan.recommande ? '0 8px 32px rgba(27,107,58,0.15)' : '0 2px 12px rgba(0,0,0,0.06)', border: plan.recommande ? '2px solid ' + plan.couleur : '1px solid #E8E8E8', position: 'relative' }}>
              {plan.recommande && (
                <div style={{ background: plan.couleur, color: '#fff', textAlign: 'center', padding: '6px', fontSize: 12, fontWeight: 700 }}>
                  {t('pricing.recommande')} - {plan.badge}
                </div>
              )}
              <div style={{ padding: '24px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: plan.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.couleur }}>
                    {plan.id === 'gratuit' ? <Users size={24} strokeWidth={1.5} /> : plan.id === 'pro' ? <Zap size={24} strokeWidth={1.5} /> : <Building2 size={24} strokeWidth={1.5} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22' }}>{plan.nom}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{plan.sous_titre}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  {prix === 0 ? (
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#1B2B22' }}>{t('pricing.gratuit')}</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 36, fontWeight: 900, color: '#1B2B22', letterSpacing: -1 }}>
                        {GNF(prix)} <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>GNF</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{CYCLES[cycle].label.toLowerCase()}</div>
                      {CYCLES[cycle].reduction > 0 && (
                        <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 600, marginTop: 4 }}>
                          {t('pricing.economie', { montant: GNF(Math.round(plan.prix_mois * CYCLES[cycle].mois * CYCLES[cycle].reduction)) })}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* CTA intelligent */}
                <button onClick={function() { choisirPlan(plan.id); }} disabled={essaiEnCours === plan.id}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: essaiEnCours === plan.id ? '#aaa' : plan.couleur, color: '#fff', fontSize: 14, fontWeight: 700, cursor: essaiEnCours === plan.id ? 'not-allowed' : 'pointer', marginBottom: plan.id === 'gratuit' ? 20 : 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {essaiEnCours === plan.id
                    ? t('pricing.demarrage')
                    : <>{plan.id === 'gratuit' ? t('pricing.creerCompteGratuit') : t('pricing.essaiGratuit1Mois')} <ArrowRight size={15} strokeWidth={2.5} /></>
                  }
                </button>

                {plan.id !== 'gratuit' && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <button onClick={function() { setShowPaiement(plan.id); }}
                      style={{ background: 'none', border: 'none', color: '#888', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                      {t('pricing.dejaUtiliseEssai')}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {plan.features.map(function(f, i) {
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#1B2B22' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: plan.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} strokeWidth={3} color={plan.couleur} />
                        </div>
                        {f}
                      </div>
                    );
                  })}
                  {plan.nonInclus && plan.nonInclus.map(function(f, i) {
                    return (
                      <div key={'non' + i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#ccc' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <X size={11} strokeWidth={2.5} color="#ccc" />
                        </div>
                        {f}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
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

      {/* Tableau comparatif */}
      <div style={{ maxWidth: 900, margin: '0 auto 48px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px' }}>{t('pricing.comparaison')}</h2>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#1B2B22', padding: '16px 20px', gap: 8, minWidth: 560 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{t('pricing.table.fonctionnalite')}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#90CAF9', textAlign: 'center' }}>{t('pricing.plans.gratuit.nom')}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F5A623', textAlign: 'center' }}>{t('pricing.plans.pro.nom')}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#CE93D8', textAlign: 'center' }}>{t('pricing.plans.agence.nom')}</div>
          </div>
          {[
            { label: t('pricing.table.logementsGeres'),            vals: ['-', '20', t('pricing.table.illimites')]    },
            { label: t('pricing.table.paiementMobileMoney'),       vals: [false, true,  true]        },
            { label: t('pricing.table.candidaturesDossiers'),    vals: [true,  true,  true]        },
            { label: t('pricing.table.documentsPdfAuto'),          vals: [false, true,  true]        },
            { label: t('pricing.table.alertesLoyersAuto'),         vals: [false, true,  true]        },
            { label: t('pricing.table.rapportsFinanciers'),         vals: [false, true,  true]        },
            { label: t('pricing.table.scoreConfiance'),             vals: [true,  true,  true]        },
            { label: t('pricing.table.multiUtilisateurs'),          vals: [false, false, t('pricing.table.cinqComptes')] },
            { label: t('pricing.table.support'),                     vals: ['-', t('pricing.table.email'), t('pricing.table.mailMessage')] },
          ].map(function(row, i) {
            var colors = ['#1565C0', '#1B6B3A', '#7B1FA2'];
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '13px 20px', background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '0.5px solid #F0F0F0', gap: 8, alignItems: 'center', minWidth: 560 }}>
                <div style={{ fontSize: 13, color: '#555' }}>{row.label}</div>
                {row.vals.map(function(v, vi) {
                  return (
                    <div key={vi} style={{ textAlign: 'center' }}>
                      {v === true
                        ? <Check size={16} strokeWidth={2.5} color={colors[vi]} />
                        : v === false
                        ? <X size={16} strokeWidth={2} color="#DDD" />
                        : <span style={{ fontSize: 13, fontWeight: 700, color: colors[vi] }}>{v}</span>
                      }
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '0 auto 48px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px' }}>{t('pricing.questionsFrequentes')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map(function(item, i) {
            var open = openFaq === i;
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: open ? '1px solid #A5D6A7' : '1px solid transparent' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', padding: 'clamp(40px, 6vw, 64px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>{t('pricing.pretACommencer')}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px' }}>{t('pricing.ctaSousTitre')}</p>
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

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
