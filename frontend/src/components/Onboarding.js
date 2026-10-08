/* eslint-disable */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  Home, Users, FileText, Bell, CreditCard,
  Search, CalendarCheck, Key, ChevronRight,
  Check, X, Zap, Building2, Star, ArrowRight,
  TrendingUp, Shield, MessageCircle, ChevronLeft,
  BarChart3, Wallet, ClipboardList, Camera, MapPin, BedDouble
} from 'lucide-react';

// ─── ONBOARDING PROPRIÉTAIRE AVANCÉ ─────────────────────────────
function OnboardingProprioAvance({ onTermine }) {
  var navigate  = useNavigate();
  var auth      = useAuth();
  var user      = auth.user;
  var t         = useTranslation('logements').t;

  var [etape, setEtape]           = useState(0);
  var [planChoisi, setPlanChoisi] = useState('pro');
  var [quitter, setQuitter]       = useState(false);
  var [submitting, setSubmitting] = useState(false);

  // Étape 0 : Bienvenue
  // Étape 1 : Choisir le plan
  // Étape 2 : Ajouter premier bien (teaser)
  // Étape 3 : Fonctionnalités clés
  // Étape 4 : Prêt !

  var TOTAL = 5;

  function marquerTermine() {
    api.patch('/auth/onboarding-termine').catch(console.warn);
    if (onTermine) onTermine();
  }

  function suivant() {
    if (etape < TOTAL - 1) setEtape(etape + 1);
  }

  function precedent() {
    if (etape > 0) setEtape(etape - 1);
  }

  function terminer() {
    marquerTermine();
    navigate('/dashboard/biens');
    toast.success(t('onboarding.proprio.etape4.toastBienvenue'));
  }

  function passer() {
    setQuitter(true);
  }

  if (quitter) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🤔</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>{t('onboarding.passerTutoriel.titre')}</h3>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.6 }}>
            {t('onboarding.passerTutoriel.descProprio')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setQuitter(false); }}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#1B2B22', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('onboarding.passerTutoriel.continuer')}
            </button>
            <button onClick={marquerTermine}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#F5F5F5', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('onboarding.passerTutoriel.passerQuandMeme')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, maxWidth: 520, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>

        {/* Barre de progression */}
        <div style={{ background: '#F0F0F0', height: 4 }}>
          <div style={{ background: '#1B6B3A', height: '100%', width: ((etape + 1) / TOTAL * 100) + '%', transition: 'width .4s ease' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {etape > 0 && (
              <button onClick={precedent}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <ChevronLeft size={16} strokeWidth={2} /> {t('onboarding.retour')}
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>{etape + 1} / {TOTAL}</span>
          <button onClick={passer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <X size={14} strokeWidth={2} /> {t('onboarding.passer')}
          </button>
        </div>

        {/* ═══ ÉTAPE 0 — BIENVENUE ════════════════════════════════ */}
        {etape === 0 && (
          <div style={{ padding: '20px 28px 28px', textAlign: 'center' }}>
            <div style={{ width: 90, height: 90, background: '#E8F5E9', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Home size={48} strokeWidth={1} color="#1B6B3A" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px', lineHeight: 1.2 }}>
              {t('onboarding.proprio.etape0.bienvenue', { prenom: user && user.prenom })}
            </h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
              {t('onboarding.proprio.etape0.desc')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { icon: BarChart3, titre: t('onboarding.proprio.etape0.dashboardComplet'), desc: t('onboarding.proprio.etape0.dashboardCompletDesc') },
                { icon: Wallet, titre: t('onboarding.proprio.etape0.paiementsAuto'),    desc: t('onboarding.proprio.etape0.paiementsAutoDesc') },
                { icon: ClipboardList, titre: t('onboarding.proprio.etape0.candidatures'),      desc: t('onboarding.proprio.etape0.candidaturesDesc') },
                { icon: Zap, titre: t('onboarding.proprio.etape0.alertesTempsReel'), desc: t('onboarding.proprio.etape0.alertesTempsReelDesc') },
              ].map(function(item, i) {
                var Icone = item.icon;
                return (
                  <div key={i} style={{ background: '#F7F8F7', borderRadius: 12, padding: '12px 14px', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Icone size={22} strokeWidth={1.5} color="#1B6B3A" />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2B22' }}>{item.titre}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={suivant}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {t('onboarding.proprio.etape0.commencerConfiguration')} <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* ═══ ÉTAPE 1 — CHOISIR LE PLAN ════════════════════════ */}
        {etape === 1 && (
          <div style={{ padding: '20px 28px 28px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px' }}>{t('onboarding.proprio.etape1.titre')}</h2>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 18px' }}>{t('onboarding.proprio.etape1.desc')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                {
                  id:    'gratuit',
                  nom:   t('onboarding.proprio.etape1.gratuit.nom'),
                  prix:  t('onboarding.proprio.etape1.gratuit.prix'),
                  desc:  t('onboarding.proprio.etape1.gratuit.desc'),
                  color: '#888',
                  bg:    '#F5F5F5',
                  features: [t('onboarding.proprio.etape1.gratuit.feature1'), t('onboarding.proprio.etape1.gratuit.feature2'), t('onboarding.proprio.etape1.gratuit.feature3')],
                },
                {
                  id:    'pro',
                  nom:   t('onboarding.proprio.etape1.pro.nom'),
                  prix:  t('onboarding.proprio.etape1.pro.prix'),
                  desc:  t('onboarding.proprio.etape1.pro.desc'),
                  color: '#1B6B3A',
                  bg:    '#E8F5E9',
                  badge: t('onboarding.proprio.etape1.pro.badge'),
                  features: [t('onboarding.proprio.etape1.pro.feature1'), t('onboarding.proprio.etape1.pro.feature2'), t('onboarding.proprio.etape1.pro.feature3'), t('onboarding.proprio.etape1.pro.feature4'), t('onboarding.proprio.etape1.pro.feature5')],
                },
                {
                  id:    'agence',
                  nom:   t('onboarding.proprio.etape1.agence.nom'),
                  prix:  t('onboarding.proprio.etape1.agence.prix'),
                  desc:  t('onboarding.proprio.etape1.agence.desc'),
                  color: '#7B1FA2',
                  bg:    '#F3E5F5',
                  features: [t('onboarding.proprio.etape1.agence.feature1'), t('onboarding.proprio.etape1.agence.feature2'), t('onboarding.proprio.etape1.agence.feature3'), t('onboarding.proprio.etape1.agence.feature4')],
                },
              ].map(function(plan) {
                var sel = planChoisi === plan.id;
                return (
                  <div key={plan.id} onClick={function() { setPlanChoisi(plan.id); }}
                    style={{ padding: '14px 16px', borderRadius: 14, border: sel ? '2px solid ' + plan.color : '1.5px solid #E0E0E0', background: sel ? plan.bg : '#fff', cursor: 'pointer', transition: 'all .2s', position: 'relative' }}>
                    {plan.badge && (
                      <div style={{ position: 'absolute', top: -10, right: 14, background: plan.color, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                        {plan.badge}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1B2B22' }}>{plan.nom}</span>
                        <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{plan.prix}</span>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: sel ? plan.color : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                        {sel && <Check size={13} color="#fff" strokeWidth={3} />}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{plan.desc}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {plan.features.map(function(f) {
                        return (
                          <span key={f} style={{ background: sel ? plan.color + '20' : '#F5F5F5', color: sel ? plan.color : '#888', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                            {f}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={suivant}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {planChoisi === 'gratuit' ? t('onboarding.proprio.etape1.continuerAvecGratuit') : planChoisi === 'pro' ? t('onboarding.proprio.etape1.continuerAvecPro') : t('onboarding.proprio.etape1.continuerAvecAgence')} <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* ═══ ÉTAPE 2 — PREMIER BIEN ════════════════════════════ */}
        {etape === 2 && (
          <div style={{ padding: '20px 28px 28px', textAlign: 'center' }}>
            <div style={{ width: 90, height: 90, background: '#E3F2FD', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Building2 size={48} strokeWidth={1} color="#1565C0" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>{t('onboarding.proprio.etape2.titre')}</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 20px' }}>
              {t('onboarding.proprio.etape2.desc')}
            </p>

            <div style={{ background: '#F7F8F7', borderRadius: 14, padding: '16px 18px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>{t('onboarding.proprio.etape2.ceQueVousDevezPreparer')}</div>
              {[
                { icon: Camera, label: t('onboarding.proprio.etape2.photos') },
                { icon: MapPin, label: t('onboarding.proprio.etape2.adresse') },
                { icon: Wallet, label: t('onboarding.proprio.etape2.prix') },
                { icon: BedDouble, label: t('onboarding.proprio.etape2.chambres') },
              ].map(function(item, i) {
                var Icone = item.icon;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: '#555' }}>
                    <Icone size={18} strokeWidth={1.5} color="#1B6B3A" />
                    {item.label}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={suivant}
                style={{ padding: '12px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('onboarding.proprio.etape2.plusTard')}
              </button>
              <button onClick={function() { marquerTermine(); navigate('/logements/ajouter'); }}
                style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#1565C0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Home size={14} strokeWidth={2} /> {t('onboarding.proprio.etape2.ajouterMaintenant')}
              </button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 3 — FONCTIONNALITÉS ═════════════════════════ */}
        {etape === 3 && (
          <div style={{ padding: '20px 28px 28px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px' }}>{t('onboarding.proprio.etape3.titre')}</h2>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 18px' }}>{t('onboarding.proprio.etape3.desc')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { icon: <Bell size={20} strokeWidth={1.5} color="#E65100" />, bg: '#FFF3E0', titre: t('onboarding.proprio.etape3.alertesAuto.titre'), desc: t('onboarding.proprio.etape3.alertesAuto.desc') },
                { icon: <FileText size={20} strokeWidth={1.5} color="#1B6B3A" />, bg: '#E8F5E9', titre: t('onboarding.proprio.etape3.documentsUnClic.titre'), desc: t('onboarding.proprio.etape3.documentsUnClic.desc') },
                { icon: <TrendingUp size={20} strokeWidth={1.5} color="#1565C0" />, bg: '#E3F2FD', titre: t('onboarding.proprio.etape3.rapportsFinanciers.titre'), desc: t('onboarding.proprio.etape3.rapportsFinanciers.desc') },
                { icon: <Shield size={20} strokeWidth={1.5} color="#7B1FA2" />, bg: '#F3E5F5', titre: t('onboarding.proprio.etape3.scoreConfiance.titre'), desc: t('onboarding.proprio.etape3.scoreConfiance.desc') },
                { icon: <MessageCircle size={20} strokeWidth={1.5} color="#37474F" />, bg: '#ECEFF1', titre: t('onboarding.proprio.etape3.messagerieIntegree.titre'), desc: t('onboarding.proprio.etape3.messagerieIntegree.desc') },
              ].map(function(feat, i) {
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: '#F7F8F7', borderRadius: 12 }}>
                    <div style={{ width: 40, height: 40, background: feat.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {feat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{feat.titre}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{feat.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={suivant}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {t('onboarding.proprio.etape3.suivant')} <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* ═══ ÉTAPE 4 — PRÊT ! ══════════════════════════════════ */}
        {etape === 4 && (
          <div style={{ padding: '20px 28px 28px', textAlign: 'center' }}>
            <div style={{ width: 90, height: 90, background: '#E8F5E9', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Star size={48} strokeWidth={1} color="#F5A623" fill="#F5A623" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>
              {t('onboarding.proprio.etape4.titre')}
            </h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 24px' }}>
              {t('onboarding.proprio.etape4.desc')}
            </p>

            <div style={{ background: '#F0FBF0', border: '1px solid #A5D6A7', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20', marginBottom: 10 }}>{t('onboarding.proprio.etape4.checklist')}</div>
              {[
                { label: t('onboarding.proprio.etape4.creerCompte'),         fait: true  },
                { label: t('onboarding.proprio.etape4.choisirPlan'),         fait: true  },
                { label: t('onboarding.proprio.etape4.ajouterLogement'),     fait: false },
                { label: t('onboarding.proprio.etape4.recevoirCandidature'), fait: false },
                { label: t('onboarding.proprio.etape4.signerBail'),          fait: false },
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 13, color: item.fait ? '#1B6B3A' : '#888' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: item.fait ? '#1B6B3A' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.fait && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    {item.label}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={terminer}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {t('onboarding.proprio.etape4.ajouterMonPremierBien')} <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              <button onClick={marquerTermine}
                style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                {t('onboarding.proprio.etape4.explorerDashboard')}
              </button>
            </div>
          </div>
        )}

        {/* Points de navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 16 }}>
          {Array.from({ length: TOTAL }).map(function(_, i) {
            return (
              <div key={i} style={{ width: i === etape ? 20 : 7, height: 7, borderRadius: 4, background: i === etape ? '#1B6B3A' : '#E0E0E0', transition: 'all .3s' }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  var auth       = useAuth();
  var user       = auth.user;
  var navigate   = useNavigate();
  var t          = useTranslation('logements').t;
  var [quitter, setQuitter] = useState(false);

  var estProprio = user && (user.role === 'proprietaire' || user.role === 'les_deux' || user.role === 'admin');

  function marquerTermine() {
    api.patch('/auth/onboarding-termine').catch(console.warn);
    if (onTermine) onTermine();
  }

  // Propriétaire → onboarding avancé
  if (estProprio) {
    return <OnboardingProprioAvance onTermine={onTermine} />;
  }

  // ─── LOCATAIRE (version simple) ──────────────────────────────
  var ETAPES_LOCATAIRE = [
    {
      icon:    <Search size={52} strokeWidth={1} color="#1B6B3A" />,
      titre:   t('onboarding.locataire.etape1.titre'),
      desc:    t('onboarding.locataire.etape1.desc'),
      cta:     t('onboarding.locataire.etape1.cta'),
      couleur: '#1B6B3A',
      bg:      '#E8F5E9',
    },
    {
      icon:    <CalendarCheck size={52} strokeWidth={1} color="#1565C0" />,
      titre:   t('onboarding.locataire.etape2.titre'),
      desc:    t('onboarding.locataire.etape2.desc'),
      cta:     t('onboarding.locataire.etape2.cta'),
      couleur: '#1565C0',
      bg:      '#E3F2FD',
    },
    {
      icon:    <FileText size={52} strokeWidth={1} color="#7B1FA2" />,
      titre:   t('onboarding.locataire.etape3.titre'),
      desc:    t('onboarding.locataire.etape3.desc'),
      cta:     t('onboarding.locataire.etape3.cta'),
      couleur: '#7B1FA2',
      bg:      '#F3E5F5',
    },
    {
      icon:    <Key size={52} strokeWidth={1} color="#1B6B3A" />,
      titre:   t('onboarding.locataire.etape4.titre'),
      desc:    t('onboarding.locataire.etape4.desc'),
      cta:     t('onboarding.locataire.etape4.cta'),
      couleur: '#1B6B3A',
      bg:      '#E8F5E9',
      dernier: true,
    },
  ];
  var [etape, setEtape] = useState(0);
  var etapes = ETAPES_LOCATAIRE;
  var e      = etapes[etape];

  function suivant() {
    if (etape < etapes.length - 1) setEtape(etape + 1);
  }

  function terminer() {
    marquerTermine();
    navigate('/logements');
  }

  if (quitter) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🤔</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>{t('onboarding.passerTutoriel.titre')}</h3>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.6 }}>{t('onboarding.passerTutoriel.descLocataire')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setQuitter(false); }}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#1B2B22', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('onboarding.passerTutoriel.continuer')}
            </button>
            <button onClick={marquerTermine}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#F5F5F5', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('onboarding.passerTutoriel.passerQuandMeme')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, maxWidth: 440, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ background: '#F5F5F5', height: 4 }}>
          <div style={{ background: e.couleur, height: '100%', width: ((etape + 1) / etapes.length * 100) + '%', transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>{etape + 1} / {etapes.length}</div>
          <button onClick={function() { setQuitter(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <X size={14} strokeWidth={2} /> {t('onboarding.passer')}
          </button>
        </div>
        <div style={{ padding: '24px 28px 28px', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, background: e.bg, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            {e.icon}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 12px', lineHeight: 1.2 }}>{e.titre}</h2>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, margin: '0 0 28px' }}>{e.desc}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {etapes.map(function(_, i) {
              return <div key={i} style={{ width: i === etape ? 20 : 7, height: 7, borderRadius: 4, background: i === etape ? e.couleur : '#E0E0E0', transition: 'all .3s' }} />;
            })}
          </div>
          <button onClick={e.dernier ? terminer : suivant}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: e.couleur, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {e.cta}
            {!e.dernier && <ChevronRight size={18} strokeWidth={2} />}
            {e.dernier && <Check size={18} strokeWidth={2.5} />}
          </button>
          {etape === 0 && (
            <button onClick={function() { setQuitter(true); }}
              style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#aaa', fontSize: 13, cursor: 'pointer' }}>
              {t('onboarding.jeConnaisDejaWerdhe')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}