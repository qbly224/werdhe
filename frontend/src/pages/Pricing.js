/* eslint-disable */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Check, X, ChevronDown, ChevronUp, Zap, Building2, ArrowRight, Home } from 'lucide-react';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

var PLANS = [
  {
    id:        'pro',
    nom:       'Pro',
    prix_mois: 120000,
    prix_an:   96000,
    couleur:   '#1B6B3A',
    bg:        '#E8F5E9',
    badge:     '14 jours gratuits',
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
      'Support téléphonique',
    ]
  },
  {
    id:        'agence',
    nom:       'Agence',
    prix_mois: 300000,
    prix_an:   240000,
    couleur:   '#7B1FA2',
    bg:        '#F3E5F5',
    recommande: false,
    sous_titre: 'Logements illimités',
    features: [
      'Logements illimités',
      'Tout du plan Pro',
      'Multi-utilisateurs (5 comptes)',
      'Rapport mensuel automatique',
      'Codes promo personnalisés',
      'Support téléphonique dédié',
      'Formation et onboarding équipe',
      'Tableau de bord agence centralisé',
    ],
    nonInclus: []
  },
];

var FAQ_ITEMS = [
  { q: 'Comment payer mon abonnement ?', r: 'Le paiement se fait uniquement par Mobile Money (Orange Money ou MTN MoMo). Aucun paiement en espèces n\'est accepté.' },
  { q: 'L\'essai Pro est-il vraiment gratuit ?', r: 'Oui, 14 jours complets sans Mobile Money requis. Accès à toutes les fonctionnalités Pro. À la fin, choisissez de continuer ou non.' },
  { q: 'Puis-je changer de plan à tout moment ?', r: 'Oui. Vous pouvez upgrader ou downgrader depuis vos paramètres. Le changement prend effet immédiatement.' },
  { q: 'Quelle est la commission Werdhe ?', r: 'Werdhe prélève 5% sur chaque loyer encaissé via la plateforme.' },
  { q: 'Que se passe-t-il si j\'annule ?', r: 'Vos données sont conservées 30 jours. Vous pouvez réactiver votre compte à tout moment.' },
];

export default function Pricing() {
  var navigate          = useNavigate();
  var [annuel, setAnnuel] = useState(false);
  var [openFaq, setOpenFaq] = useState(null);
  var [code, setCode]   = useState('');
  var [codeOk, setCodeOk] = useState(null);
  var [loading, setLoading] = useState(false);
  var [showPaiement, setShowPaiement] = useState(null); // 'pro' ou 'agence'
  var [numMobile, setNumMobile] = useState('');
  var [operateur, setOperateur] = useState('orange');
  var [payLoading, setPayLoading] = useState(false);

  function validerCode() {
    if (!code.trim()) return;
    setLoading(true);
    api.get('/abonnements/valider-code?code=' + code.trim().toUpperCase())
      .then(function(res) { setCodeOk(res.data); toast.success('Code valide !'); })
      .catch(function() { setCodeOk(false); toast.error('Code invalide'); })
      .finally(function() { setLoading(false); });
  }

  function lancerPaiement(planId) {
    if (!numMobile || numMobile.length < 8) {
      toast.error('Entrez un numéro Mobile Money valide');
      return;
    }
    setPayLoading(true);
    api.post('/abonnements/souscrire', {
      plan:       planId,
      periodicite: annuel ? 'annuel' : 'mensuel',
      telephone:  '+224' + numMobile.replace(/\s/g, ''),
      operateur:  operateur,
    })
      .then(function() {
        toast.success('Paiement initié ! Confirmez sur votre téléphone.');
        setShowPaiement(null);
        setNumMobile('');
        navigate('/dashboard');
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur paiement');
      })
      .finally(function() { setPayLoading(false); });
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="Tarifs — Plans Pro et Agence"
        description="Plans Werdhe pour propriétaires. Pro : 120 000 GNF/mois · Agence : 300 000 GNF/mois. Paiement Mobile Money."
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
          Pour les propriétaires et agences immobilières
        </p>
        <p style={{ fontSize: 13, color: '#1B6B3A', fontWeight: 600, margin: '0 0 28px' }}>
          Paiement uniquement par Mobile Money (Orange / MTN)
        </p>

        {/* Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 30, padding: '6px 8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <button onClick={function() { setAnnuel(false); }}
            style={{ padding: '8px 18px', borderRadius: 22, border: 'none', background: !annuel ? '#1B6B3A' : 'transparent', color: !annuel ? '#fff' : '#888', fontSize: 13, fontWeight: !annuel ? 700 : 500, cursor: 'pointer' }}>
            Mensuel
          </button>
          <button onClick={function() { setAnnuel(true); }}
            style={{ padding: '8px 18px', borderRadius: 22, border: 'none', background: annuel ? '#1B6B3A' : 'transparent', color: annuel ? '#fff' : '#888', fontSize: 13, fontWeight: annuel ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            Annuel
            <span style={{ background: '#F5A623', color: '#1B2B22', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>-20%</span>
          </button>
        </div>
      </div>

      {/* Modal paiement Mobile Money */}
      {showPaiement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px' }}>
              Payer par Mobile Money
            </h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
              Plan {showPaiement === 'pro' ? 'Pro' : 'Agence'} · {GNF(showPaiement === 'pro' ? (annuel ? 96000 : 120000) : (annuel ? 240000 : 300000))} GNF/{annuel ? 'mois (annuel)' : 'mois'}
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Opérateur</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { val: 'orange', label: 'Orange Money', couleur: '#FF6600', bg: '#FFF3E0' },
                  { val: 'mtn',    label: 'MTN MoMo',    couleur: '#FFCB00', bg: '#FFFDE7' },
                ].map(function(op) {
                  return (
                    <button key={op.val} onClick={function() { setOperateur(op.val); }}
                      style={{ padding: '12px', borderRadius: 10, border: '2px solid ' + (operateur === op.val ? op.couleur : '#E0E0E0'), background: operateur === op.val ? op.bg : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: operateur === op.val ? op.couleur : '#888' }}>
                      {op.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Numéro Mobile Money</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: '#F7F8F7', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#555', flexShrink: 0 }}>
                  +224
                </div>
                <input type="tel" placeholder="622 00 00 00" value={numMobile}
                  onChange={function(e) { setNumMobile(e.target.value); }}
                  style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#7B4F00' }}>
              Vous recevrez une confirmation sur votre téléphone pour valider le paiement.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={function() { setShowPaiement(null); setNumMobile(''); }}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={function() { lancerPaiement(showPaiement); }} disabled={payLoading}
                style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: payLoading ? '#aaa' : '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: payLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {payLoading
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Traitement...</>
                  : 'Confirmer le paiement'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, maxWidth: 800, margin: '0 auto 48px', padding: '0 20px' }}>
        {PLANS.map(function(plan) {
          var prix = annuel ? plan.prix_an : plan.prix_mois;
          return (
            <div key={plan.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: plan.recommande ? '0 8px 32px rgba(27,107,58,0.15)' : '0 2px 12px rgba(0,0,0,0.06)', border: plan.recommande ? '2px solid ' + plan.couleur : '1px solid #E8E8E8', position: 'relative' }}>
              {plan.recommande && (
                <div style={{ background: plan.couleur, color: '#fff', textAlign: 'center', padding: '6px', fontSize: 12, fontWeight: 700 }}>
                  Recommandé — {plan.badge}
                </div>
              )}
              <div style={{ padding: '24px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: plan.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.couleur }}>
                    {plan.id === 'pro' ? <Zap size={24} strokeWidth={1.5} /> : <Building2 size={24} strokeWidth={1.5} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22' }}>{plan.nom}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{plan.sous_titre}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#1B2B22', letterSpacing: -1 }}>
                    {GNF(prix)} <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>GNF/mois</span>
                  </div>
                  {annuel && (
                    <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 600, marginTop: 4 }}>
                      Économie : {GNF((plan.prix_mois - plan.prix_an) * 12)} GNF/an
                    </div>
                  )}
                </div>

                {/* Bouton paiement Mobile Money */}
                <button onClick={function() { setShowPaiement(plan.id); }}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: plan.couleur, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {plan.id === 'pro' ? 'Essai gratuit 14 jours' : 'S\'abonner maintenant'} <ArrowRight size={15} strokeWidth={2.5} />
                </button>

                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 16 }}>
                  Paiement par Orange Money ou MTN MoMo
                </div>

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
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid ' + (codeOk === true ? '#1B6B3A' : codeOk === false ? '#E53935' : '#E0E0E0'), borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'monospace', letterSpacing: 1 }} />
            <button onClick={validerCode} disabled={loading || !code.trim()}
              style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '...' : 'Valider'}
            </button>
          </div>
          {codeOk && codeOk !== false && (
            <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>
              Code valide ! -{codeOk.reduction_pct}% sur le plan {codeOk.plan_cible}
            </div>
          )}
        </div>
      </div>

      {/* Tableau comparatif */}
      <div style={{ maxWidth: 700, margin: '0 auto 48px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px' }}>Comparaison</h2>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#1B2B22', padding: '16px 20px', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Fonctionnalité</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F5A623', textAlign: 'center' }}>Pro</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#CE93D8', textAlign: 'center' }}>Agence</div>
          </div>
          {[
            { label: 'Logements gérés',            vals: ['20', 'Illimités']   },
            { label: 'Paiement Mobile Money',       vals: [true,  true]        },
            { label: 'Candidatures et dossiers',    vals: [true,  true]        },
            { label: 'Documents PDF auto',          vals: [true,  true]        },
            { label: 'Alertes loyers auto',         vals: [true,  true]        },
            { label: 'Rapports financiers',         vals: [true,  true]        },
            { label: 'Score confiance locataires',  vals: [true,  true]        },
            { label: 'Multi-utilisateurs',          vals: [false, '5 comptes'] },
            { label: 'Support dédié',              vals: ['Email', 'Téléphone']},
          ].map(function(row, i) {
            var colors = ['#1B6B3A', '#7B1FA2'];
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '13px 20px', background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '0.5px solid #F0F0F0', gap: 8, alignItems: 'center' }}>
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
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px' }}>14 jours d'essai Pro gratuit · Paiement Mobile Money uniquement</p>
        <button onClick={function() { setShowPaiement('pro'); }}
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