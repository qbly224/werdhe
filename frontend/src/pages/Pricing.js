/* eslint-disable */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Home, Check, X, ChevronDown, ChevronUp,
  Zap, Building2, Users, ArrowRight
} from 'lucide-react';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

var PLANS = [
  {
    id:         'gratuit',
    nom:        'Locataire',
    prix_mois:  0,
    prix_an:    0,
    sous_titre: 'Pour trouver un logement',
    couleur:    '#1565C0',
    bg:         '#E3F2FD',
    icon:       <Users size={24} strokeWidth={1.5} />,
    recommande: false,
    cta:        'Créer un compte gratuit',
    features: [
      { label: 'Recherche avancée de logements',      ok: true  },
      { label: 'Candidatures illimitées',             ok: true  },
      { label: 'Messagerie avec propriétaires',       ok: true  },
      { label: 'Suivi de candidature en temps réel',  ok: true  },
      { label: 'Signature électronique de bail',      ok: true  },
      { label: 'Historique de locations',             ok: true  },
      { label: 'Score de confiance',                  ok: true  },
      { label: 'Publication de logements',            ok: false },
      { label: 'Génération de documents PDF',         ok: false },
      { label: 'Alertes loyers automatiques',         ok: false },
    ]
  },
  {
    id:         'pro',
    nom:        'Pro',
    prix_mois:  120000,
    prix_an:    96000,
    sous_titre: 'Pour les propriétaires actifs',
    couleur:    '#1B6B3A',
    bg:         '#E8F5E9',
    icon:       <Zap size={24} strokeWidth={1.5} />,
    recommande: true,
    cta:        'Essai gratuit 14 jours',
    badge:      '14 jours gratuits',
    features: [
      { label: 'Jusqu\'à 25 logements',               ok: true  },
      { label: 'Candidatures et dossiers en ligne',   ok: true  },
      { label: 'Orange Money + MTN MoMo',             ok: true  },
      { label: 'Baux et quittances PDF auto',         ok: true  },
      { label: 'Alertes loyers J-3 / J+5',            ok: true  },
      { label: 'Rapports financiers Recharts',        ok: true  },
      { label: 'Export CSV + PDF',                    ok: true  },
      { label: 'Messagerie avec accusé de lecture',   ok: true  },
      { label: 'Score de confiance locataires',       ok: true  },
      { label: 'Support email prioritaire',           ok: true  },
    ]
  },
  {
    id:         'agence',
    nom:        'Agence',
    prix_mois:  300000,
    prix_an:    240000,
    sous_titre: 'Pour les agences immobilières',
    couleur:    '#7B1FA2',
    bg:         '#F3E5F5',
    icon:       <Building2 size={24} strokeWidth={1.5} />,
    recommande: false,
    cta:        'Nous contacter',
    features: [
      { label: 'Logements illimités',                 ok: true  },
      { label: 'Tout du plan Pro',                    ok: true  },
      { label: 'Multi-utilisateurs (5 comptes)',      ok: true  },
      { label: 'Marque blanche disponible',           ok: true  },
      { label: 'API et webhooks',                     ok: true  },
      { label: 'Codes promo personnalisés',           ok: true  },
      { label: 'Rapport mensuel automatique',         ok: true  },
      { label: 'Support téléphonique dédié',          ok: true  },
      { label: 'Formation et onboarding équipe',      ok: true  },
      { label: 'SLA 99.9% uptime garanti',            ok: true  },
    ]
  },
];

var FAQ_ITEMS = [
  { q: 'L\'essai Pro est-il vraiment gratuit ?', r: 'Oui, 14 jours complets sans carte bancaire. Vous accédez à toutes les fonctionnalités Pro sans engagement. À la fin de l\'essai, choisissez de continuer ou revenez au plan gratuit.' },
  { q: 'Puis-je changer de plan à tout moment ?', r: 'Oui. Vous pouvez upgrader ou downgrader à tout moment depuis vos paramètres. Le changement prend effet immédiatement.' },
  { q: 'Quelle est la commission prélevée par Werdhe ?', r: 'Werdhe prélève 5% sur chaque loyer encaissé via la plateforme. Cette commission couvre l\'ensemble des services : documents, alertes, messagerie, rapports.' },
  { q: 'Les paiements Mobile Money sont-ils sécurisés ?', r: 'Oui. Les paiements Orange Money et MTN MoMo sont traités par les opérateurs officiels. Werdhe ne stocke aucune information de paiement sur ses serveurs.' },
  { q: 'Que se passe-t-il si j\'annule mon abonnement ?', r: 'Vos données sont conservées pendant 30 jours. Vous pouvez réactiver votre compte à tout moment. Après 30 jours, les données sont supprimées définitivement.' },
  { q: 'Y a-t-il des frais cachés ?', r: 'Aucun. Le prix affiché est le prix payé. La seule commission est les 5% sur les loyers encaissés, clairement affichés dans votre dashboard.' },
];

export default function Pricing() {
  var navigate            = useNavigate();
  var [annuel, setAnnuel] = useState(false);
  var [openFaq, setOpenFaq] = useState(null);
  var [code, setCode]     = useState('');
  var [codeOk, setCodeOk] = useState(null);
  var [loading, setLoading] = useState(false);

  function validerCode() {
    if (!code.trim()) return;
    setLoading(true);
    api.get('/abonnements/valider-code?code=' + code.trim().toUpperCase())
      .then(function(res) {
        setCodeOk(res.data);
        toast.success('Code valide ! -' + res.data.reduction_pct + '% sur le plan ' + res.data.plan_cible);
      })
      .catch(function() {
        setCodeOk(false);
        toast.error('Code invalide ou expiré');
      })
      .finally(function() { setLoading(false); });
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="Tarifs — Plans pour propriétaires"
        description="Choisissez votre plan Werdhe. Gratuit pour les locataires. Plans Pro et Agence pour les propriétaires. Essai 14 jours gratuit."
        url="https://werdhe.com/pricing"
      />

      {/* Navbar */}
      <nav style={{ background: 'rgba(247,248,247,0.95)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid rgba(27,107,58,0.1)', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#1B6B3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1B2B22' }}>Werdhe</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Connexion</Link>
          <Link to="/inscription" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1B6B3A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Démarrer</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 64px) 24px 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 20, padding: '4px 14px', marginBottom: 18 }}>
          <span style={{ fontSize: 12, color: '#1B5E20', fontWeight: 700 }}>Transparent · Sans engagement</span>
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 46px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 12px', letterSpacing: -1 }}>
          Des tarifs clairs pour tous
        </h1>
        <p style={{ fontSize: 16, color: '#888', margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          L'espace locataire est 100% gratuit. Les propriétaires bénéficient d'un essai Pro de 14 jours.
        </p>

        {/* Toggle mensuel / annuel */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 30, padding: '6px 8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: 4 }}>
          <button onClick={function() { setAnnuel(false); }}
            style={{ padding: '8px 18px', borderRadius: 22, border: 'none', background: !annuel ? '#1B6B3A' : 'transparent', color: !annuel ? '#fff' : '#888', fontSize: 13, fontWeight: !annuel ? 700 : 500, cursor: 'pointer', transition: 'all .2s' }}>
            Mensuel
          </button>
          <button onClick={function() { setAnnuel(true); }}
            style={{ padding: '8px 18px', borderRadius: 22, border: 'none', background: annuel ? '#1B6B3A' : 'transparent', color: annuel ? '#fff' : '#888', fontSize: 13, fontWeight: annuel ? 700 : 500, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6 }}>
            Annuel
            <span style={{ background: '#F5A623', color: '#1B2B22', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>-20%</span>
          </button>
        </div>
        {annuel && <p style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 600, margin: '6px 0 0' }}>🎉 Économisez 2 mois par an !</p>}
      </div>

      {/* Cards plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, maxWidth: 1000, margin: '0 auto 48px', padding: '0 20px' }}>
        {PLANS.map(function(plan) {
          var prix = annuel ? plan.prix_an : plan.prix_mois;
          return (
            <div key={plan.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: plan.recommande ? '0 8px 32px rgba(27,107,58,0.15)' : '0 2px 12px rgba(0,0,0,0.06)', border: plan.recommande ? '2px solid ' + plan.couleur : '1px solid #E8E8E8', position: 'relative', transition: 'transform .2s' }}
              onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateY(0)'; }}>

              {/* Badge recommandé */}
              {plan.recommande && (
                <div style={{ background: plan.couleur, color: '#fff', textAlign: 'center', padding: '6px', fontSize: 12, fontWeight: 700 }}>
                  ⭐ Recommandé — {plan.badge}
                </div>
              )}

              <div style={{ padding: '24px 22px 20px' }}>
                {/* Header plan */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, background: plan.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.couleur }}>
                    {plan.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1B2B22' }}>{plan.nom}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{plan.sous_titre}</div>
                  </div>
                </div>

                {/* Prix */}
                <div style={{ marginBottom: 20 }}>
                  {prix === 0 ? (
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#1B2B22' }}>Gratuit</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 36, fontWeight: 900, color: '#1B2B22' }}>{GNF(prix)}</span>
                        <span style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>GNF/mois</span>
                      </div>
                      {annuel && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                          <span style={{ textDecoration: 'line-through', marginRight: 6 }}>{GNF(plan.prix_mois)} GNF</span>
                          <span style={{ color: '#1B6B3A', fontWeight: 700 }}>Économie : {GNF((plan.prix_mois - plan.prix_an) * 12)} GNF/an</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={function() {
                    if (plan.id === 'agence') {
                      window.location.href = 'mailto:contact@werdhe.com?subject=Plan Agence Werdhe';
                    } else {
                      navigate('/inscription?role=' + (plan.id === 'gratuit' ? 'locataire' : 'proprietaire'));
                    }
                  }}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: plan.recommande ? 'none' : '1.5px solid ' + plan.couleur, background: plan.recommande ? plan.couleur : 'transparent', color: plan.recommande ? '#fff' : plan.couleur, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}>
                  {plan.cta} <ArrowRight size={15} strokeWidth={2.5} />
                </button>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {plan.features.map(function(f, i) {
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: f.ok ? '#1B2B22' : '#ccc' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: f.ok ? plan.bg : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {f.ok
                            ? <Check size={11} strokeWidth={3} color={plan.couleur} />
                            : <X size={11} strokeWidth={2.5} color="#ccc" />
                          }
                        </div>
                        {f.label}
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
          <div style={{ fontSize: 24, marginBottom: 10 }}>🎟️</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: '0 0 6px' }}>Vous avez un code promo ?</h3>
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>Entrez-le ici pour bénéficier d'une réduction sur votre abonnement</p>
          <div style={{ display: 'flex', gap: 8 }}>
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
              ✅ Code valide ! -{codeOk.reduction_pct}% sur le plan {codeOk.plan_cible}
            </div>
          )}
        </div>
      </div>

      {/* Tableau comparatif */}
      <div style={{ maxWidth: 900, margin: '0 auto 48px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px', letterSpacing: -0.5 }}>
          Comparaison complète
        </h2>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#1B2B22', padding: '16px 20px', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Fonctionnalité</div>
            {PLANS.map(function(p) {
              return <div key={p.id} style={{ fontSize: 13, fontWeight: 700, color: p.recommande ? '#F5A623' : '#fff', textAlign: 'center' }}>{p.nom}</div>;
            })}
          </div>
          {[
            { label: 'Recherche de logements',     vals: [true, true,  true]  },
            { label: 'Candidatures',               vals: [true, true,  true]  },
            { label: 'Publication de biens',       vals: [false, '25', '∞']   },
            { label: 'Mobile Money',               vals: [false, true, true]  },
            { label: 'Documents PDF auto',         vals: [false, true, true]  },
            { label: 'Alertes automatiques',       vals: [false, true, true]  },
            { label: 'Rapports financiers',        vals: [false, true, true]  },
            { label: 'Multi-utilisateurs',         vals: [false, false, '5'] },
            { label: 'API & webhooks',             vals: [false, false, true] },
            { label: 'Support dédié',              vals: [false, 'Email', 'Téléphone'] },
          ].map(function(row, i) {
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '13px 20px', background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '0.5px solid #F0F0F0', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#555' }}>{row.label}</div>
                {row.vals.map(function(v, vi) {
                  var plan = PLANS[vi];
                  return (
                    <div key={vi} style={{ textAlign: 'center' }}>
                      {v === true
                        ? <Check size={16} strokeWidth={2.5} color={plan.couleur} />
                        : v === false
                        ? <X size={16} strokeWidth={2} color="#DDD" />
                        : <span style={{ fontSize: 13, fontWeight: 700, color: plan.couleur }}>{v}</span>
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
      <div style={{ maxWidth: 680, margin: '0 auto 48px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', textAlign: 'center', margin: '0 0 20px', letterSpacing: -0.5 }}>
          Questions fréquentes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map(function(item, i) {
            var open = openFaq === i;
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: open ? '1px solid #A5D6A7' : '1px solid transparent' }}>
                <button onClick={function() { setOpenFaq(open ? null : i); }}
                  style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22', lineHeight: 1.4 }}>{item.q}</span>
                  {open ? <ChevronUp size={18} strokeWidth={2} color="#1B6B3A" /> : <ChevronDown size={18} strokeWidth={2} color="#888" />}
                </button>
                {open && (
                  <div style={{ padding: '0 18px 16px', fontSize: 14, color: '#555', lineHeight: 1.7, borderTop: '0.5px solid #F0F0F0', paddingTop: 14 }}>
                    {item.r}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA final */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', padding: 'clamp(40px, 6vw, 64px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: -0.5 }}>
          Prêt à commencer ?
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px' }}>
          14 jours d'essai Pro gratuit · Sans carte bancaire
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/inscription?role=proprietaire"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: '#F5A623', color: '#1B2B22', textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>
            Je suis propriétaire <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <Link to="/inscription?role=locataire"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
            Je cherche un logement
          </Link>
        </div>
      </div>

      {/* Footer minimal */}
      <div style={{ background: '#101A12', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          © 2026 Werdhe · <a href="/cgu" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>CGU</a> · <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Confidentialité</a>
        </p>
      </div>
    </div>
  );
}