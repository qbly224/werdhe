/* eslint-disable */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import { useAuth } from '../context/AuthContext';
import { Check, X, ChevronDown, ChevronUp, Zap, Building2, Users, ArrowRight, Home } from 'lucide-react';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

var CYCLES = {
  mensuel:    { label: 'Mensuel', mois: 1,  reduction: 0    },
  semestriel: { label: '6 mois',  mois: 6,  reduction: 0.10 },
  annuel:     { label: 'Annuel',  mois: 12, reduction: 0.20 },
};

var PLANS = [
  {
    id:         'gratuit',
    nom:        'Locataire',
    prix_mois:  0,
    couleur:    '#1565C0',
    bg:         '#E3F2FD',
    sous_titre: 'Pour trouver un logement',
    features: [
      'Recherche avancée de logements',
      'Candidatures illimitées',
      'Messagerie avec propriétaires',
      'Suivi de candidature en temps réel',
      'Signature électronique de bail',
      'Historique de locations',
      'Score de confiance',
    ],
    nonInclus: []
  },
  {
    id:        'pro',
    nom:       'Pro',
    prix_mois: 120000,
    couleur:   '#1B6B3A',
    bg:        '#E8F5E9',
    badge:     '1 mois gratuit',
    recommande: true,
    sous_titre: 'Jusqu\'à 20 logements',
    features: [
      'Jusqu\'à 20 logements',
      'Candidatures et dossiers en ligne',
      'Paiement Orange Money + MTN MoMo',
      'Baux et quittances PDF auto',
      'Alertes loyers J-3 / J+5',
      'Rapports financiers + export CSV',
      'Messagerie avec accusé de lecture',
      'Score de confiance locataires',
      'Support email prioritaire',
    ],
    nonInclus: [
      'Multi-utilisateurs',
      'Logements illimités',
    ]
  },
  {
    id:        'agence',
    nom:       'Agence',
    prix_mois: 300000,
    couleur:   '#7B1FA2',
    bg:        '#F3E5F5',
    badge:     '1 mois gratuit',
    recommande: false,
    sous_titre: 'Logements illimités',
    features: [
      'Logements illimités',
      'Tout du plan Pro',
      'Multi-utilisateurs (5 comptes)',
      'Rapport mensuel automatique',
      'Codes promo personnalisés',
      'Support Mail/Message',
      'Formation et onboarding équipe',
      'Tableau de bord agence centralisé',
    ],
    nonInclus: []
  },
];

var FAQ_ITEMS = [
  { q: 'Comment payer mon abonnement ?', r: 'Le paiement se fait uniquement par Mobile Money (Orange Money ou MTN MoMo). Aucun paiement en espèces n\'est accepté.' },
  { q: 'L\'essai est-il vraiment gratuit ?', r: 'Oui, 1 mois complet sur Pro ou Agence, sans Mobile Money requis. Accès à toutes les fonctionnalités du plan choisi. À la fin, choisissez de continuer ou non.' },
  { q: 'Quels rythmes de paiement sont proposés ?', r: 'Mensuel, tous les 6 mois (-10%) ou annuel (-20%). Vous choisissez ce qui vous convient.' },
  { q: 'Que se passe-t-il si je ne paie pas à temps ?', r: 'Vous recevez une relance 3 jours après l\'échéance, puis une dernière relance à 5 jours. Sans règlement, l\'accès est bloqué jusqu\'à régularisation.' },
  { q: 'Puis-je changer de plan à tout moment ?', r: 'Oui. Vous pouvez upgrader ou downgrader depuis vos paramètres. Le changement prend effet immédiatement.' },
  { q: 'Quelle est la commission Werdhe ?', r: 'Werdhe prélève 5% sur chaque loyer encaissé via la plateforme.' },
];

export default function Pricing() {
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
      .then(function(res) { setCodeOk(res.data); toast.success('Code valide !'); })
      .catch(function() { setCodeOk(false); toast.error('Code invalide'); })
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
        toast.success('Essai ' + (planId === 'pro' ? 'Pro' : 'Agence') + ' démarré ! 1 mois gratuit.');
        navigate('/dashboard');
      })
      .catch(function(err) {
        // Essai déjà utilisé ou abonnement déjà actif → payer directement
        var msg = err.response && err.response.data ? err.response.data.erreur : '';
        toast(msg || 'Essai déjà utilisé - vous pouvez payer directement', { icon: 'ℹ️' });
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
        titre="Tarifs - Locataire gratuit, plans Pro et Agence"
        description="Werdhe est 100% gratuit pour les locataires. Plans Pro et Agence pour les propriétaires, 1 mois d'essai gratuit. Paiement Mobile Money."
        url="https://werdhe.com/pricing"
      />

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#1B6B3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1B2B22' }}>Werdhe</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Connexion</Link>
          <Link to="/inscription" style={{ padding: '8px 16px', borderRadius: 8, background: '#1B6B3A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Démarrer</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 64px) 24px 32px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 12px', letterSpacing: -1 }}>
          Des tarifs transparents
        </h1>
        <p style={{ fontSize: 15, color: '#888', margin: '0 0 6px' }}>
          100% gratuit pour les locataires · Pro et Agence pour les propriétaires
        </p>
        <p style={{ fontSize: 13, color: '#1B6B3A', fontWeight: 600, margin: '0 0 28px' }}>
          Paiement uniquement par Mobile Money (Orange / MTN)
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
          titre={'Abonnement ' + (showPaiement === 'pro' ? 'Pro' : 'Agence') + ' - ' + CYCLES[cycle].label}
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
                  Recommandé - {plan.badge}
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
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#1B2B22' }}>Gratuit</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 36, fontWeight: 900, color: '#1B2B22', letterSpacing: -1 }}>
                        {GNF(prix)} <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>GNF</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{CYCLES[cycle].label.toLowerCase()}</div>
                      {CYCLES[cycle].reduction > 0 && (
                        <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 600, marginTop: 4 }}>
                          Économie : {GNF(Math.round(plan.prix_mois * CYCLES[cycle].mois * CYCLES[cycle].reduction))} GNF
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* CTA intelligent */}
                <button onClick={function() { choisirPlan(plan.id); }} disabled={essaiEnCours === plan.id}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: essaiEnCours === plan.id ? '#aaa' : plan.couleur, color: '#fff', fontSize: 14, fontWeight: 700, cursor: essaiEnCours === plan.id ? 'not-allowed' : 'pointer', marginBottom: plan.id === 'gratuit' ? 20 : 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {essaiEnCours === plan.id
                    ? 'Démarrage...'
                    : <>{plan.id === 'gratuit' ? 'Créer un compte gratuit' : 'Essai gratuit 1 mois'} <ArrowRight size={15} strokeWidth={2.5} /></>
                  }
                </button>

                {plan.id !== 'gratuit' && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <button onClick={function() { setShowPaiement(plan.id); }}
                      style={{ background: 'none', border: 'none', color: '#888', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                      Déjà utilisé votre essai ? Payer maintenant
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
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', margin: '0 0 6px' }}>Vous avez un code promo ?</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input type="text" placeholder="Ex: WERDHE50" value={code}
              onChange={function(e) { setCode(e.target.value.toUpperCase()); setCodeOk(null); }}
              onKeyDown={function(e) { if (e.key === 'Enter') validerCode(); }}
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid ' + (codeOk && codeOk.valide ? '#1B6B3A' : codeOk === false ? '#E53935' : '#E0E0E0'), borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'monospace', letterSpacing: 1 }} />
            <button onClick={validerCode} disabled={loading || !code.trim()}
              style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '...' : 'Valider'}
            </button>
          </div>
          {codeOk && codeOk.valide && (
            <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>
              Code valide ! -{codeOk.reduction_pct}% sur le plan {codeOk.plan_cible}
            </div>
          )}
        </div>
      </div>

      {/* Tableau comparatif */}
      <div style={{ maxWidth: 900, margin: '0 auto 48px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px' }}>Comparaison</h2>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#1B2B22', padding: '16px 20px', gap: 8, minWidth: 560 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Fonctionnalité</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#90CAF9', textAlign: 'center' }}>Locataire</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F5A623', textAlign: 'center' }}>Pro</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#CE93D8', textAlign: 'center' }}>Agence</div>
          </div>
          {[
            { label: 'Logements gérés',            vals: ['-', '20', 'Illimités']    },
            { label: 'Paiement Mobile Money',       vals: [false, true,  true]        },
            { label: 'Candidatures et dossiers',    vals: [true,  true,  true]        },
            { label: 'Documents PDF auto',          vals: [false, true,  true]        },
            { label: 'Alertes loyers auto',         vals: [false, true,  true]        },
            { label: 'Rapports financiers',         vals: [false, true,  true]        },
            { label: 'Score confiance',             vals: [true,  true,  true]        },
            { label: 'Multi-utilisateurs',          vals: [false, false, '5 comptes'] },
            { label: 'Support',                     vals: ['-', 'Email', 'Mail/Message'] },
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
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px' }}>Questions fréquentes</h2>
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
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Prêt à commencer ?</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px' }}>1 mois d'essai gratuit · Paiement Mobile Money uniquement</p>
        <button onClick={function() { choisirPlan('pro'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', background: '#F5A623', color: '#1B2B22', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
          Démarrer l'essai gratuit <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ background: '#101A12', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          © 2026 Werdhe · <a href="/cgu" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>CGU</a> · <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Confidentialité</a>
        </p>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
