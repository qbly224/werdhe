/* eslint-disable */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import { useAuth } from '../context/AuthContext';
import { Check, X, ChevronDown, ChevronUp, Zap, Building2, Users, ArrowRight, Home, Info } from 'lucide-react';
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';
import BlueprintPattern, { PlanMasseMotif } from '../components/BlueprintPattern';
import OdometerNumber from '../components/OdometerNumber';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };
var gradientOr = { background: 'linear-gradient(135deg, #F5A623 0%, #FFD98E 55%, #F5A623 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

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
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #0F1E14 0%, #1B2B22 55%, #16321F 100%)', textAlign: 'center', padding: 'clamp(48px, 7vw, 76px) 24px 40px' }}>
        <BlueprintPattern opacity={0.055} color="#F5A623" size={60} />
        <PlanMasseMotif opacity={0.08} width={300} height={260} style={{ position: 'absolute', top: -20, left: -40, display: window.innerWidth < 640 ? 'none' : 'block' }} />
        <PlanMasseMotif opacity={0.08} width={300} height={260} style={{ position: 'absolute', bottom: -40, right: -40, transform: 'scaleX(-1)', display: window.innerWidth < 640 ? 'none' : 'block' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 18 }}>
            <Home size={13} strokeWidth={2} color="#F5A623" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F5A623' }}>{t('pricing.badgeOverline')}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 46px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: -1 }}>
            {t('pricing.titre')}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: '0 0 6px' }}>
            {t('pricing.sousTitre')}
          </p>
          <p style={{ fontSize: 13, ...gradientOr, fontWeight: 700, margin: '0 0 28px' }}>
            {t('pricing.paiementMobileMoney')}
          </p>

          {/* Toggle cycle de facturation */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 30, padding: '6px 8px', boxShadow: '0 12px 32px rgba(0,0,0,0.35)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.keys(CYCLES).map(function(c) {
              var actif = cycle === c;
              return (
                <button key={c} onClick={function() { setCycle(c); }}
                  style={{ padding: '8px 16px', borderRadius: 22, border: 'none', background: actif ? '#1B6B3A' : 'transparent', color: actif ? '#fff' : '#888', fontSize: 13, fontWeight: actif ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
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

      {/* Registre des tarifs — un document unique, pas trois cartes identiques */}
      <div style={{ maxWidth: 1000, margin: '0 auto 40px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1B6B3A', marginBottom: 8 }}>{t('pricing.registreOverline')}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 'clamp(24px, 3.4vw, 36px)', color: '#1B2B22', margin: 0 }}>{t('pricing.comparaison')}</h2>
        </div>

        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <div className="pricing-ledger" style={{ background: '#fff', border: '1px solid #1B2B22', position: 'relative' }}>
          <div className="pricing-stamp">{t('pricing.tampon')}</div>

          {/* En-tête */}
          <div className="ledger-row ledger-head">
            <div className="ledger-cell ledger-label-col" />
            {PLANS.map(function(plan) {
              return (
                <div key={plan.id} className="ledger-cell" style={{ textAlign: 'center' }}>
                  <div style={plan.id === 'pro' ? { fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 18, ...gradientOr } : { fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 18, color: plan.couleur }}>
                    {plan.nom}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{plan.sous_titre}</div>
                </div>
              );
            })}
          </div>

          {/* Prix */}
          <div className="ledger-row ledger-price-row">
            <div className="ledger-cell ledger-label-col">{t('pricing.abonnement')}</div>
            {PLANS.map(function(plan) {
              var prixCible = montantCycle(plan.prix_mois);
              return (
                <div key={plan.id} className="ledger-cell" style={{ textAlign: 'center' }}>
                  {plan.prix_mois === 0 ? (
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 28, color: '#1B2B22' }}>{t('pricing.gratuit')}</div>
                  ) : (
                    <>
                      <OdometerNumber value={prixCible} suffix="GNF"
                        style={{ fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 28, color: '#1B2B22', justifyContent: 'center' }} />
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{CYCLES[cycle].label.toLowerCase()}</div>
                      {CYCLES[cycle].reduction > 0 && (
                        <div style={{ fontSize: 10.5, color: '#1B6B3A', fontWeight: 700, marginTop: 3 }}>
                          {t('pricing.economie', { montant: GNF(Math.round(plan.prix_mois * CYCLES[cycle].mois * CYCLES[cycle].reduction)) })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="ledger-row ledger-cta-row">
            <div className="ledger-cell ledger-label-col" />
            {PLANS.map(function(plan) {
              return (
                <div key={plan.id} className="ledger-cell" style={{ textAlign: 'center' }}>
                  <button onClick={function() { choisirPlan(plan.id); }} disabled={essaiEnCours === plan.id}
                    className="ledger-cta-btn" style={{ background: essaiEnCours === plan.id ? '#aaa' : plan.couleur }}>
                    {essaiEnCours === plan.id
                      ? t('pricing.demarrage')
                      : <>{plan.id === 'gratuit' ? t('pricing.creerCompteGratuit') : t('pricing.essaiGratuit1Mois')} <ArrowRight size={13} strokeWidth={2.5} /></>
                    }
                  </button>
                  {plan.id !== 'gratuit' && (
                    <button onClick={function() { setShowPaiement(plan.id); }} className="ledger-already-link">
                      {t('pricing.dejaUtiliseEssai')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fonctionnalités */}
          {[
            { label: t('pricing.table.logementsGeres'),         vals: ['-', '20', t('pricing.table.illimites')]    },
            { label: t('pricing.table.paiementMobileMoney'),    vals: [false, true,  true]        },
            { label: t('pricing.table.candidaturesDossiers'),   vals: [true,  true,  true]        },
            { label: t('pricing.table.documentsPdfAuto'),       vals: [false, true,  true]        },
            { label: t('pricing.table.alertesLoyersAuto'),      vals: [false, true,  true]        },
            { label: t('pricing.table.rapportsFinanciers'),     vals: [false, true,  true]        },
            { label: t('pricing.table.scoreConfiance'),         vals: [true,  true,  true]        },
            { label: t('pricing.table.multiUtilisateurs'),      vals: [false, false, t('pricing.table.cinqComptes')] },
            { label: t('pricing.table.support'),                vals: ['-', t('pricing.table.email'), t('pricing.table.mailMessage')] },
          ].map(function(row, i) {
            var colors = ['#1565C0', '#1B6B3A', '#7B1FA2'];
            return (
              <div key={i} className="ledger-row">
                <div className="ledger-cell ledger-label-col" style={{ color: '#555' }}>{row.label}</div>
                {row.vals.map(function(v, vi) {
                  return (
                    <div key={vi} className="ledger-cell" style={{ textAlign: 'center' }}>
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
      <div style={{ background: 'linear-gradient(160deg, #0F1E14 0%, #1B2B22 55%, #16321F 100%)', padding: 'clamp(40px, 6vw, 64px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <BlueprintPattern opacity={0.05} color="#F5A623" size={56} />
        <PlanMasseMotif opacity={0.1} color="#F5A623" width={200} height={170} style={{ position: 'absolute', top: -10, left: -10, display: window.innerWidth < 640 ? 'none' : 'block' }} />
        <PlanMasseMotif opacity={0.1} color="#F5A623" width={200} height={170} style={{ position: 'absolute', bottom: -10, right: -10, transform: 'scaleX(-1)', display: window.innerWidth < 640 ? 'none' : 'block' }} />
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, margin: '0 0 12px', position: 'relative', ...gradientOr }}>{t('pricing.pretACommencer')}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px', position: 'relative' }}>{t('pricing.ctaSousTitre')}</p>
        <button onClick={function() { choisirPlan('pro'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', background: '#F5A623', color: '#1B2B22', fontWeight: 800, fontSize: 15, cursor: 'pointer', position: 'relative', boxShadow: '0 8px 24px rgba(245,166,35,0.3)' }}>
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

        .pricing-ledger { min-width: 620px; }
        .ledger-row { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; }
        .ledger-row + .ledger-row { border-top: 1px solid #ECE8D9; }
        .ledger-cell { padding: 14px 18px; display: flex; flex-direction: column; justify-content: center; font-size: 13px; }
        .ledger-label-col { color: #1B2B22; font-weight: 500; }
        .ledger-head { background: #0F1E14; border-bottom: 2px solid #1B2B22; }
        .ledger-head .ledger-cell { padding: 20px 18px 16px; }
        .ledger-price-row .ledger-cell { padding: 22px 18px; }
        .ledger-cta-row .ledger-cell { padding: 10px 14px 20px; align-items: center; }
        .ledger-cta-btn {
          width: 100%; max-width: 180px; padding: 10px 14px; border: none; color: #fff;
          font-size: 12.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center;
          justify-content: center; gap: 6px;
        }
        .ledger-already-link { background: none; border: none; color: #999; font-size: 10.5px; cursor: pointer; text-decoration: underline; margin-top: 6px; }

        .pricing-stamp {
          position: absolute; top: -46px; left: 61%; width: 108px; height: 108px; border-radius: 50%;
          border: 2px solid #B5401F; color: #B5401F; display: flex; align-items: center; justify-content: center;
          text-align: center; transform: rotate(-10deg); font-family: 'Fraunces', serif; font-weight: 700;
          font-size: 12.5px; line-height: 1.15; opacity: .85; mix-blend-mode: multiply; pointer-events: none; z-index: 2;
        }
        .pricing-stamp::before { content: ''; position: absolute; inset: 6px; border: 1px solid #B5401F; border-radius: 50%; }

        @media (max-width: 640px) {
          .pricing-stamp { display: none; }
        }
      `}</style>
    </div>
  );
}
