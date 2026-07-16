/* eslint-disable */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

var PLANS = [
  {
    id:          'gratuit',
    nom:         'Gratuit',
    prix:        0,
    sousTitre:   '1 à 2 biens',
    recommande:  false,
    ctaLabel:    'Démarrer',
    ctaAction:   'demarrer',
    couleur:     '#555',
    features: [
      { label: 'Gestion basique',       ok: true },
      { label: 'Alertes loyers',        ok: true },
      { label: 'Messagerie locataires', ok: true },
      { label: 'Mobile Money',          ok: false },
      { label: 'Annuaire logements',    ok: false },
    ]
  },
  {
    id:          'pro',
    nom:         'Pro',
    prix:        120000,
    sousTitre:   "Jusqu'à 25 biens",
    recommande:  true,
    ctaLabel:    'Essai 14 jours',
    ctaAction:   'essai',
    couleur:     '#1B6B3A',
    features: [
      { label: 'Tout du plan Gratuit',      ok: true },
      { label: 'Orange Money + MTN + Espèces', ok: true },
      { label: 'Baux et quittances PDF',    ok: true },
      { label: 'Annuaire logements',        ok: true },
      { label: 'Rapports financiers',       ok: true },
    ]
  },
  {
    id:          'agence',
    nom:         'Agence',
    prix:        300000,
    sousTitre:   'Biens illimités',
    recommande:  false,
    ctaLabel:    'Nous contacter',
    ctaAction:   'contact',
    couleur:     '#1565C0',
    features: [
      { label: 'Tout du plan Pro',    ok: true },
      { label: 'Multi-utilisateurs', ok: true },
      { label: 'Marque blanche',      ok: true },
      { label: 'API et intégrations', ok: true },
      { label: 'Support prioritaire', ok: true },
    ]
  }
];

export default function Pricing() {
  var navigate  = useNavigate();
  var auth      = useAuth();
  var user      = auth.user;
  var [loading, setLoading]   = useState(null);
  var [codePromo, setCodePromo] = useState('');
  var [promoInfo, setPromoInfo] = useState(null);
  var [promoLoading, setPromoLoading] = useState(false);

  function handleCTA(plan) {
    if (!user) { navigate('/login'); return; }

    if (plan.ctaAction === 'demarrer') {
      navigate('/dashboard');
      return;
    }

    if (plan.ctaAction === 'essai') {
      setLoading('essai');
      api.post('/abonnements/essai-pro')
        .then(function(res) {
          toast.success(res.data.message);
          setTimeout(function() { navigate('/dashboard'); }, 1500);
        })
        .catch(function(err) {
          var msg = err.response && err.response.data ? err.response.data.erreur : 'Erreur';
          toast.error(msg);
        })
        .finally(function() { setLoading(null); });
      return;
    }

    if (plan.ctaAction === 'contact') {
      window.location.href = 'mailto:contact@werdhe.com?subject=Plan Agence Werdhe';
      return;
    }
  }

  function verifierPromo(planId) {
  if (!codePromo.trim()) return;
  setPromoLoading(true);
  api.post('/abonnements/verifier-promo', { code: codePromo, plan: planId })
    .then(function(res) {
      setPromoInfo(res.data);
      toast.success('Code promo valide ! -' + res.data.reduction_pct + '%');
    })
    .catch(function(err) {
      setPromoInfo(null);
      toast.error(err.response && err.response.data ? err.response.data.erreur : 'Code invalide');
    })
    .finally(function() { setPromoLoading(false); });
}

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh', padding: '40px 16px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <button onClick={function() { navigate(-1); }}
          style={{ position: 'absolute', left: 20, top: 20, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1B6B3A' }}>
          ←
        </button>
        <div style={{ fontSize: 13, color: '#1B6B3A', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Tarification
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>
          Plans pour les propriétaires
        </h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
          L'espace locataire est toujours 100% gratuit
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 900, margin: '0 auto 48px' }}>
        {PLANS.map(function(plan) {
          return (
            <div key={plan.id} style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: plan.recommande ? '0 8px 30px rgba(27,107,58,0.15)' : '0 2px 10px rgba(0,0,0,0.06)',
              border: plan.recommande ? '2px solid #1B6B3A' : '1px solid #E0E0E0',
              position: 'relative',
              transition: 'transform .2s'
            }}>
              {plan.recommande && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#1B6B3A', color: '#fff', borderRadius: 20, padding: '4px 18px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Recommandé
                </div>
              )}

              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{plan.nom}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#1B2B22' }}>
                  {plan.prix === 0 ? '0' : GNF(plan.prix)}
                </span>
                <span style={{ fontSize: 13, color: '#888' }}>GNF/mois</span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>{plan.sousTitre}</div>

              <button
                onClick={function() { handleCTA(plan); }}
                disabled={loading === 'essai' && plan.id === 'pro'}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: plan.recommande ? 'none' : '1.5px solid ' + plan.couleur,
                  background: plan.recommande ? plan.couleur : 'transparent',
                  color: plan.recommande ? '#fff' : plan.couleur,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 20,
                  opacity: loading === 'essai' && plan.id === 'pro' ? 0.7 : 1
                }}>
                {loading === 'essai' && plan.id === 'pro' ? '⏳ Activation...' : plan.ctaLabel}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(function(f) {
                  return (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      {f.ok ? (
                        <div style={{ width: 18, height: 18, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#1B6B3A', fontSize: 11, fontWeight: 700 }}>✓</span>
                        </div>
                      ) : (
                        <div style={{ width: 18, height: 18, background: '#F5F5F5', borderRadius: '50%', flexShrink: 0 }} />
                      )}
                      <span style={{ color: f.ok ? '#1B2B22' : '#bbb' }}>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Code promo */}
<div style={{ maxWidth: 400, margin: '0 auto 40px', background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>🎟️ Vous avez un code promo ?</div>
  <div style={{ display: 'flex', gap: 8 }}>
    <input
      type="text"
      placeholder="Ex: WERDHE50"
      value={codePromo}
      onChange={function(e) { setCodePromo(e.target.value.toUpperCase()); setPromoInfo(null); }}
      style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', fontFamily: 'monospace', letterSpacing: 1 }} />
    <button
      onClick={function() { verifierPromo('pro'); }}
      disabled={promoLoading || !codePromo.trim()}
      style={{ padding: '10px 16px', borderRadius: 10, background: '#1B6B3A', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
      {promoLoading ? '...' : 'Valider'}
    </button>
  </div>
  {promoInfo && (
    <div style={{ marginTop: 12, background: '#E8F5E9', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A' }}>✅ Code valide — {promoInfo.reduction_pct}% de réduction</div>
      <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
        <span style={{ textDecoration: 'line-through', color: '#aaa' }}>{new Intl.NumberFormat('fr-FR').format(promoInfo.montant_base)} GNF</span>
        {' → '}
        <span style={{ fontWeight: 700, color: '#1B6B3A' }}>{new Intl.NumberFormat('fr-FR').format(promoInfo.montant_reduit)} GNF</span>
        {' (économie : '}{new Intl.NumberFormat('fr-FR').format(promoInfo.economie)}{' GNF)'}
      </div>
    </div>
  )}
</div>

      {/* FAQ */}
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#888', lineHeight: 1.8 }}>
          <p>🔒 Paiement sécurisé via Orange Money ou MTN MoMo</p>
          <p>❌ Annulation à tout moment · Pas d'engagement</p>
          <p>📞 Support : <a href="mailto:contact@werdhe.com" style={{ color: '#1B6B3A' }}>contact@werdhe.com</a></p>
        </div>
      </div>
    </div>
  );
}