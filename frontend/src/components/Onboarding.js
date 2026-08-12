/* eslint-disable */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Home, Users, FileText, Bell, CreditCard,
  Search, CalendarCheck, Key, ChevronRight,
  Check, X, Zap, Building2, Star, ArrowRight,
  TrendingUp, Shield, MessageCircle, ChevronLeft
} from 'lucide-react';

// ─── ÉTAPES LOCATAIRE (simple) ───────────────────────────────────
var ETAPES_LOCATAIRE = [
  {
    icon:    <Search size={52} strokeWidth={1} color="#1B6B3A" />,
    titre:   'Bienvenue sur Werdhe 🎉',
    desc:    'Trouvez votre logement idéal en Guinée. Filtrez par ville, prix, superficie. Sans intermédiaire, sans frais cachés.',
    cta:     'Commencer',
    couleur: '#1B6B3A',
    bg:      '#E8F5E9',
  },
  {
    icon:    <CalendarCheck size={52} strokeWidth={1} color="#1565C0" />,
    titre:   'Candidatez en ligne',
    desc:    'Trouvez un logement et envoyez votre candidature directement. Dossier numérique, réponse rapide.',
    cta:     'Suivant',
    couleur: '#1565C0',
    bg:      '#E3F2FD',
  },
  {
    icon:    <FileText size={52} strokeWidth={1} color="#7B1FA2" />,
    titre:   'Dossier et signature',
    desc:    'Uploadez vos documents une seule fois. Le bail se signe électroniquement — plus besoin de se déplacer.',
    cta:     'Suivant',
    couleur: '#7B1FA2',
    bg:      '#F3E5F5',
  },
  {
    icon:    <Key size={52} strokeWidth={1} color="#1B6B3A" />,
    titre:   'Vous êtes prêt !',
    desc:    "L'espace locataire est 100% gratuit, pour toujours. Commencez à chercher votre logement dès maintenant.",
    cta:     'Chercher un logement',
    couleur: '#1B6B3A',
    bg:      '#E8F5E9',
    dernier: true,
  },
];

// ─── ONBOARDING PROPRIÉTAIRE AVANCÉ ─────────────────────────────
function OnboardingProprioAvance({ onTermine }) {
  var navigate  = useNavigate();
  var auth      = useAuth();
  var user      = auth.user;

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
    toast.success('Bienvenue sur Werdhe ! Ajoutez votre premier bien 🏠');
  }

  function passer() {
    setQuitter(true);
  }

  if (quitter) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🤔</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>Passer le tutoriel ?</h3>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.6 }}>
            Quelques minutes maintenant vous feront gagner beaucoup de temps plus tard.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setQuitter(false); }}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#1B2B22', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Continuer
            </button>
            <button onClick={marquerTermine}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#F5F5F5', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Passer quand même
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
                <ChevronLeft size={16} strokeWidth={2} /> Retour
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>{etape + 1} / {TOTAL}</span>
          <button onClick={passer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <X size={14} strokeWidth={2} /> Passer
          </button>
        </div>

        {/* ═══ ÉTAPE 0 — BIENVENUE ════════════════════════════════ */}
        {etape === 0 && (
          <div style={{ padding: '20px 28px 28px', textAlign: 'center' }}>
            <div style={{ width: 90, height: 90, background: '#E8F5E9', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Home size={48} strokeWidth={1} color="#1B6B3A" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px', lineHeight: 1.2 }}>
              Bienvenue sur Werdhe, {user && user.prenom} ! 🎉
            </h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
              Gérez tous vos logements depuis un seul tableau de bord. Candidatures, paiements, documents — tout est centralisé.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { icon: '📊', titre: 'Dashboard complet', desc: 'Tout en un seul endroit' },
                { icon: '💰', titre: 'Paiements auto',    desc: 'Alertes et quittances' },
                { icon: '📋', titre: 'Candidatures',      desc: 'Dossiers en ligne' },
                { icon: '⚡', titre: 'Alertes temps réel', desc: 'Loyers, baux, preavis' },
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ background: '#F7F8F7', borderRadius: 12, padding: '12px 14px', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
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
              Commencer la configuration <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* ═══ ÉTAPE 1 — CHOISIR LE PLAN ════════════════════════ */}
        {etape === 1 && (
          <div style={{ padding: '20px 28px 28px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px' }}>Choisissez votre plan</h2>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 18px' }}>Commencez avec un essai Pro gratuit de 14 jours</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                {
                  id:    'gratuit',
                  nom:   'Gratuit',
                  prix:  '0 GNF',
                  desc:  'Jusqu\'à 2 logements',
                  color: '#888',
                  bg:    '#F5F5F5',
                  features: ['2 logements max', 'Candidatures de base', 'Messagerie'],
                },
                {
                  id:    'pro',
                  nom:   'Pro',
                  prix:  '120 000 GNF/mois',
                  desc:  'Jusqu\'à 25 logements · 14 jours gratuits',
                  color: '#1B6B3A',
                  bg:    '#E8F5E9',
                  badge: 'Recommandé',
                  features: ['25 logements', 'Orange Money + MTN', 'Documents PDF', 'Alertes auto', 'Rapports'],
                },
                {
                  id:    'agence',
                  nom:   'Agence',
                  prix:  '300 000 GNF/mois',
                  desc:  'Biens illimités · Multi-utilisateurs',
                  color: '#7B1FA2',
                  bg:    '#F3E5F5',
                  features: ['Biens illimités', 'Multi-users', 'API', 'Support dédié'],
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
              Continuer avec {planChoisi === 'gratuit' ? 'le plan Gratuit' : planChoisi === 'pro' ? 'l\'essai Pro' : 'le plan Agence'} <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* ═══ ÉTAPE 2 — PREMIER BIEN ════════════════════════════ */}
        {etape === 2 && (
          <div style={{ padding: '20px 28px 28px', textAlign: 'center' }}>
            <div style={{ width: 90, height: 90, background: '#E3F2FD', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Building2 size={48} strokeWidth={1} color="#1565C0" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>Ajoutez votre premier bien</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 20px' }}>
              Publiez votre logement en 5 minutes. Titre, adresse, prix, photos — et les candidatures arrivent directement.
            </p>

            <div style={{ background: '#F7F8F7', borderRadius: 14, padding: '16px 18px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Ce que vous devez préparer :</div>
              {[
                { icon: '📸', label: 'Photos du logement (au moins 1)' },
                { icon: '📍', label: 'Adresse exacte + ville' },
                { icon: '💰', label: 'Prix mensuel en GNF' },
                { icon: '🛏', label: 'Nombre de chambres et superficie' },
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: '#555' }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    {item.label}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={suivant}
                style={{ padding: '12px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Plus tard
              </button>
              <button onClick={function() { marquerTermine(); navigate('/logements/ajouter'); }}
                style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#1565C0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Home size={14} strokeWidth={2} /> Ajouter maintenant
              </button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 3 — FONCTIONNALITÉS ═════════════════════════ */}
        {etape === 3 && (
          <div style={{ padding: '20px 28px 28px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px' }}>Fonctionnalités clés</h2>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 18px' }}>Tout ce que Werdhe fait pour vous automatiquement</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { icon: <Bell size={20} strokeWidth={1.5} color="#E65100" />, bg: '#FFF3E0', titre: 'Alertes automatiques', desc: 'Rappel loyer J-3, mise en demeure J+5, bail expirant J-30' },
                { icon: <FileText size={20} strokeWidth={1.5} color="#1B6B3A" />, bg: '#E8F5E9', titre: 'Documents en 1 clic', desc: 'Bail, quittance, état des lieux, mise en demeure en PDF' },
                { icon: <TrendingUp size={20} strokeWidth={1.5} color="#1565C0" />, bg: '#E3F2FD', titre: 'Rapports financiers', desc: 'Graphiques revenus, taux occupation, export CSV/PDF' },
                { icon: <Shield size={20} strokeWidth={1.5} color="#7B1FA2" />, bg: '#F3E5F5', titre: 'Score de confiance', desc: 'Évaluez chaque locataire avant d\'accepter une candidature' },
                { icon: <MessageCircle size={20} strokeWidth={1.5} color="#37474F" />, bg: '#ECEFF1', titre: 'Messagerie intégrée', desc: 'Communiquez avec vos locataires depuis la plateforme' },
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
              Suivant <ChevronRight size={16} strokeWidth={2} />
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
              Vous êtes prêt ! 🚀
            </h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 24px' }}>
              Votre espace propriétaire est configuré. Ajoutez votre premier bien et commencez à recevoir des candidatures dès aujourd'hui.
            </p>

            <div style={{ background: '#F0FBF0', border: '1px solid #A5D6A7', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20', marginBottom: 10 }}>✅ Votre checklist de démarrage</div>
              {[
                { label: 'Créer un compte',         fait: true  },
                { label: 'Choisir un plan',         fait: true  },
                { label: 'Ajouter un logement',     fait: false },
                { label: 'Recevoir une candidature', fait: false },
                { label: 'Signer un bail',          fait: false },
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
                🏠 Ajouter mon premier bien <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              <button onClick={marquerTermine}
                style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                Explorer le dashboard d'abord
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
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>Passer le tutoriel ?</h3>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.6 }}>Vous pouvez y revenir depuis les paramètres.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setQuitter(false); }}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#1B2B22', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Continuer
            </button>
            <button onClick={marquerTermine}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#F5F5F5', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Passer quand même
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
            <X size={14} strokeWidth={2} /> Passer
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
              Je connais déjà Werdhe — passer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}