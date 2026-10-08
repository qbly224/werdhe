/* eslint-disable */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import toast from 'react-hot-toast';
import GestionPhotos from '../components/GestionPhotos';
import OngletPreavisComponent from '../components/OngletPreavis';
import OngletPaiementsComponent from '../components/OngletPaiements';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import ModalSignatureBail from '../components/ModalSignatureBail';
import useDarkMode from '../hooks/useDarkMode';
import { t, changerLangue, getLangue } from '../services/i18n';
import RechercheGlobale from '../components/dashboard/RechercheGlobale';
import './Dashboard.css';
import {
  Menu, Bell, Sun, Moon, Search,
  LayoutDashboard, Home, CalendarCheck,
  MessageCircle, CreditCard, Settings,
  Users, FileText, Wrench, Send, AlertTriangle,
  CheckCircle, XCircle, Clock, Key, Lock,
  Plus, Pencil, Trash2, Download, Upload,
  Eye, Copy, Phone, Mail, MapPin,
  Star, RefreshCw, Building2, Camera,
  Banknote, TrendingUp, Receipt, Shield,
  ChevronRight, ChevronLeft, Info, Zap,
  FileSignature, BedDouble, Bath, Maximize2,
  LogOut, UserCheck, Award, AlertCircle, Gift, HelpCircle,
  ClipboardList, Building, Check, Scale, Inbox,
  Paperclip, CheckCheck, SmilePlus, Globe
} from 'lucide-react';
import Onboarding from '../components/Onboarding';
import { activerNotificationsPush, estAbonne, desactiverNotifications } from '../services/pushService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import useInactivite from '../hooks/useInactivite';
import Logo from '../components/Logo';
import { SkeletonKPI, SkeletonListe, SkeletonCard } from '../components/Skeleton';
import TourTooltip from '../components/TourTooltip';
import useOnboarding from '../hooks/useOnboarding';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

// ================================================
// UTILITAIRE - Formater les montants en GNF
// ================================================
var GNF = function(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' GNF';
};

// ================================================
// TYPES DE DOCUMENTS disponibles
// ================================================
var DOCS_TYPES = [
  { icon: <FileSignature size={32} strokeWidth={1.5} color="#1B6B3A"/>, labelKey: 'contratBail',     color: '#1B6B3A', type: 'contrat_bail'     },
  { icon: <Receipt       size={32} strokeWidth={1.5} color="#1565C0"/>, labelKey: 'quittance',       color: '#1565C0', type: 'quittance'        },
  { icon: <FileText      size={32} strokeWidth={1.5} color="#E65100"/>, labelKey: 'etatLieux',       color: '#E65100', type: 'etat_lieux'       },
  { icon: <AlertCircle   size={32} strokeWidth={1.5} color="#B71C1C"/>, labelKey: 'miseEnDemeure',   color: '#B71C1C', type: 'mise_en_demeure'  },
  { icon: <TrendingUp    size={32} strokeWidth={1.5} color="#4A148C"/>, labelKey: 'rapportFinancier', color: '#4A148C', type: 'rapport_financier' },
  { icon: <Shield        size={32} strokeWidth={1.5} color="#00695C"/>, labelKey: 'caution',         color: '#00695C', type: 'caution'          },
  { icon: <Send          size={32} strokeWidth={1.5} color="#37474F"/>, labelKey: 'preavis',         color: '#37474F', type: 'preavis'          },
];

// ================================================
// Composant UpgradeBanner
// ================================================

function UpgradeBanner({ fonctionnalite, planRequis }) {
  var t = useTranslation('dashboard').t;
  var navigate = useNavigate();
  var messages = {
    mobile_money:  t('upgradeBanner.messages.mobileMoney'),
    documents_pdf: t('upgradeBanner.messages.documentsPdf'),
    annuaire:      t('upgradeBanner.messages.annuaire'),
    rapports:      t('upgradeBanner.messages.rapports'),
    max_biens:     t('upgradeBanner.messages.maxBiens'),
  };
  return (
    <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', borderRadius: 14, padding: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ flexShrink: 0, display:'flex', alignItems:'center' }}><Lock size={28} strokeWidth={1.5} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          {t('upgradeBanner.titre', { plan: planRequis || 'Pro' })}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.5 }}>
          {messages[fonctionnalite] || t('upgradeBanner.messages.defaut')}
        </div>
      </div>
      <button
        onClick={function() { navigate('/pricing'); }}
        style={{ background: '#F5A623', color: '#1B2B22', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
        {t('upgradeBanner.voirLesPlans')}
      </button>
    </div>
  );
}

// ================================================
// COMPOSANT : Badge Score de Confiance
// ================================================
function BadgeScore({ userId }) {
  var t = useTranslation('dashboard').t;
  var [score, setScore] = useState(null);

  useEffect(function() {
    api.get('/scores/mon-score')
      .then(function(res) { setScore(res.data.score); })
      .catch(console.error);
  }, [userId]);

  if (!score) return null;

  var couleur = score.score >= 80 ? '#F5A623'
    : score.score >= 65 ? '#1B6B3A'
    : score.score >= 50 ? '#1565C0'
    : '#888';

  var badgeLabel = {
    elite: t('badgeScore.badges.elite'),
    excellent: t('badgeScore.badges.excellent'),
    fiable: t('badgeScore.badges.fiable'),
    nouveau: t('badgeScore.badges.nouveau')
  };

  return (
    <div style={{
      background: couleur + '15', border: '1px solid ' + couleur + '40',
      borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: couleur, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '18px'
      }}>
        {score.score}
      </div>
      <div>
        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B2B22' }}>
          {t('badgeScore.titre')}
        </div>
        <div style={{ fontSize: '12px', color: couleur, fontWeight: '600' }}>
          {badgeLabel[score.badge] || t('badgeScore.badges.nouveau')}
        </div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          {t('badgeScore.paiementsATemps', { count: score.nb_paiements_a_temps || 0 })}
          {score.nb_reclamations_resolues > 0 && ' · ' + t('badgeScore.reclamationsResolues', { count: score.nb_reclamations_resolues })}
        </div>
      </div>
    </div>
  );
}

// ================================================
// COMPOSANT : Panneau de notifications
// ================================================
function NotifPanel(props) {
  var t = useTranslation('dashboard').t;
  var alertes = props.alertes;
  var onClose = props.onClose;
  return (
    <div className="notif-panel">
      <div className="notif-header">
        <span>{t('notifPanel.titre')}</span>
        <span style={{ cursor: 'pointer', color: '#1B6B3A', fontSize: 12 }} onClick={onClose}>{t('notifPanel.fermer')}</span>
      </div>
      {alertes.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: 13 }}>
          {t('notifPanel.aucuneNotification')}
        </div>
      )}
      {alertes.map(function(a, i) {
        return (
          <div key={i} className="notif-item">
            <div className="notif-item-icon">
              {a.type === 'loyer_retard' ? <AlertTriangle size={16} strokeWidth={1.5} /> : a.type === 'bail_bientot' ? <ClipboardList size={16} strokeWidth={1.5} /> : <Bell size={16} strokeWidth={1.5} />}
            </div>
            <div>
              <div className="notif-item-text">{a.titre}</div>
              <div className="notif-item-time">{new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ════════════════════════════════════════════════════════════════
// OVERVIEW LOCATAIRE
// ════════════════════════════════════════════════════════════════
function OngletOverviewLocataire(props) {
  var t = useTranslation('dashboard').t;
  var stats    = props.stats;
  var user     = props.user;
  var setOnglet = props.setOnglet;
  var alertes  = props.alertes || [];

  var locationsActives  = (stats.reservations || []).filter(function(r) { return r.statut === 'confirmee'; });
  var candidatures      = (stats.reservations || []).filter(function(r) { return r.statut !== 'confirmee' && r.statut !== 'terminee'; });
  var paiementsOk       = (stats.paiements   || []).filter(function(p) { return p.statut === 'complete'; });
  var totalPaye         = paiementsOk.reduce(function(s, p) { return s + Number(p.montant); }, 0);

  return (
    <div>
      {/* KPIs */}
      <div className="stats-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: t('ongletOverviewLocataire.kpi.locationsActives'), val: String(locationsActives.length),         icon: <Home size={22} strokeWidth={1.5}/>,         color: '#1B6B3A', bg: '#E8F5E9' },
          { label: t('ongletOverviewLocataire.kpi.candidatures'),     val: String(candidatures.length),              icon: <CalendarCheck size={22} strokeWidth={1.5}/>, color: '#1565C0', bg: '#E3F2FD' },
          { label: t('ongletOverviewLocataire.kpi.loyersPayes'),      val: String(paiementsOk.length),               icon: <CreditCard size={22} strokeWidth={1.5}/>,    color: '#7B1FA2', bg: '#F3E5F5' },
          { label: t('ongletOverviewLocataire.kpi.totalVerse'),       val: GNF(totalPaye) + ' GNF',                 icon: <Banknote size={22} strokeWidth={1.5}/>,      color: '#E65100', bg: '#FFF3E0' },
        ].map(function(s, i) {
          return (
            <div key={i} className="stat-card-colored" style={{ background: s.bg, borderLeft: '4px solid ' + s.color }}>
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div className="stat-card-val" style={{ color: s.color, fontSize: 18 }}>{s.val}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Location active */}
      {locationsActives.length > 0 ? (
        locationsActives.map(function(r) {
          var photo = r.photos && r.photos.length > 0 ? r.photos[0] : null;
          var dateDebut = r.date_debut ? new Date(r.date_debut) : null;
          var moisEcoules = dateDebut ? Math.floor((new Date() - dateDebut) / (1000 * 60 * 60 * 24 * 30)) : 0;
          var duree = r.duree_mois || 12;
          var pct   = Math.min(100, Math.round(moisEcoules / duree * 100));

          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 16, border: '1.5px solid #A5D6A7' }}>
              <div style={{ height: 100, background: photo ? 'none' : 'linear-gradient(135deg,#1B6B3A,#2D9E5F)', overflow: 'hidden', position: 'relative' }}>
                {photo
                  ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Home size={36} strokeWidth={1.5} color="#fff" /></div>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55))', display: 'flex', alignItems: 'flex-end', padding: '10px 14px' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{r.logement_titre}</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{r.logement_adresse}, {r.logement_ville}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888' }}>{t('ongletOverviewLocataire.loyerMensuel')}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1B6B3A' }}>{GNF(r.prix_mensuel)} <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>GNF</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#888' }}>{t('ongletOverviewLocataire.dureeDuBail')}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{t('ongletOverviewLocataire.moisSurDuree', { mois: moisEcoules, duree: duree })}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ background: '#F0F0F0', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg,#1B6B3A,#34A853)', width: pct + '%', height: '100%', borderRadius: 6 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{t('ongletOverviewLocataire.progression', { pct: pct })}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[
                    { icon: <FileText size={16} strokeWidth={1.5}/>,      label: t('ongletOverviewLocataire.actions.docs'),       path: '/dashboard/documents'    },
                    { icon: <MessageCircle size={16} strokeWidth={1.5}/>, label: t('ongletOverviewLocataire.actions.messages'),   path: '/dashboard/messages'     },
                    { icon: <CreditCard size={16} strokeWidth={1.5}/>,    label: t('ongletOverviewLocataire.actions.paiements'),  path: '/dashboard/paiements'    },
                    { icon: <Clock size={16} strokeWidth={1.5}/>,         label: t('ongletOverviewLocataire.actions.historique'), path: '/dashboard/historique'   },
                  ].map(function(a, i) {
                    return (
                      <button key={i} onClick={function() { if(setOnglet) setOnglet(a.path); }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 10, border: '0.5px solid #E8E8E8', background: '#fff', cursor: 'pointer', color: '#1B6B3A', fontSize: 10, fontWeight: 600, transition: 'all .2s' }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = '#E8F5E9'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = '#fff'; }}>
                        {a.icon}
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="dash-empty-state">
          <Home size={48} strokeWidth={1} color="#C8E6C9" />
          <h3>{t('ongletOverviewLocataire.aucuneLocation.titre')}</h3>
          <p>{t('ongletOverviewLocataire.aucuneLocation.description')}</p>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>{t('ongletOverviewLocataire.aucuneLocation.chercherBouton')}</Link>
        </div>
      )}
    </div>
  );
}
// ================================================
// ONGLET : Vue d'ensemble (tableau de bord principal)
// ================================================
function OngletOverview(props) {
  var t = useTranslation('dashboard').t;
  var user     = props.user;
  var setOnglet = props.setOnglet;
  var estProprio = user && (user.role === 'proprietaire' || user.role === 'les_deux');

  // Locataire → renvoyer vers le dashboard locataire existant
  if (!estProprio) return <OngletOverviewLocataire {...props} />;

  var [overview, setOverview] = useState(null);
  var [loading, setLoading]   = useState(true);

  useEffect(function() {
    api.get('/rapports/overview')
      .then(function(res) { setOverview(res.data); })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, []);

    if (loading) return (
    <div>
      <div className="stats-grid-4" style={{ marginBottom: 24 }}>
        <SkeletonKPI /><SkeletonKPI /><SkeletonKPI /><SkeletonKPI />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SkeletonCard /><SkeletonCard />
      </div>
    </div>
  );

  if (!overview) return null;

  var k = overview.kpis;

  return (
    <div>
      {/* ─── KPIs ──────────────────────────────────────────────── */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          {
            label: t('ongletOverview.kpi.revenusDuMois'),
            val:   GNF(k.revenus_mois) + ' GNF',
            sub:   k.tendance_revenus > 0 ? t('ongletOverview.kpi.tendanceHausse', { pct: k.tendance_revenus })
                 : k.tendance_revenus < 0 ? t('ongletOverview.kpi.tendanceBaisse', { pct: k.tendance_revenus })
                 : t('ongletOverview.kpi.tendanceStable'),
            subColor: k.tendance_revenus > 0 ? '#1B6B3A' : k.tendance_revenus < 0 ? '#E53935' : '#888',
            icon:  <Banknote size={22} strokeWidth={1.5}/>, color: '#1B6B3A', bg: '#E8F5E9'
          },
          {
            label: t('ongletOverview.kpi.tauxOccupation'),
            val:   k.taux_occupation + '%',
            sub:   t('ongletOverview.kpi.biensOccupes', { loues: k.biens_loues, total: k.total_biens }),
            subColor: '#888',
            icon:  <Home size={22} strokeWidth={1.5}/>, color: '#1565C0', bg: '#E3F2FD'
          },
          {
            label: t('ongletOverview.kpi.candidatures'),
            val:   String(k.candidatures_attente),
            sub:   t('ongletOverview.kpi.nouvellesCetteSemaine', { count: k.nouvelles_candidatures_7j }),
            subColor: k.nouvelles_candidatures_7j > 0 ? '#E65100' : '#888',
            icon:  <CalendarCheck size={22} strokeWidth={1.5}/>, color: '#7B1FA2', bg: '#F3E5F5'
          },
          {
            label: t('ongletOverview.kpi.biensGeres'),
            val:   String(k.total_biens),
            sub:   t('ongletOverview.kpi.louesEtLibres', { loues: k.biens_loues, libres: (k.total_biens - k.biens_loues) }),
            subColor: '#888',
            icon:  <Building2 size={22} strokeWidth={1.5}/>, color: '#E65100', bg: '#FFF3E0'
          },
        ].map(function(s, i) {
          return (
            <div key={i} className="stat-card-colored" style={{ background: s.bg, borderLeft: '4px solid ' + s.color }}>
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div className="stat-card-val" style={{ color: s.color, fontSize: 18 }}>{s.val}</div>
              <div className="stat-card-label">{s.label}</div>
              <div style={{ fontSize: 11, color: s.subColor, marginTop: 4, fontWeight: 600 }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* ─── GRAPHIQUE REVENUS 6 MOIS ──────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', margin: 0 }}>{t('ongletOverview.revenus6mois.titre')}</h3>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/rapports'); }}
              style={{ background: 'none', border: 'none', color: '#1B6B3A', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {t('ongletOverview.revenus6mois.voirTout')}
            </button>
          </div>
          {overview.revenus6mois.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#ccc', padding: '20px', fontSize: 13 }}>{t('ongletOverview.aucuneDonnee')}</div>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
              {overview.revenus6mois.map(function(m, i) {
                var max = Math.max.apply(null, overview.revenus6mois.map(function(x) { return Number(x.revenus); }));
                var pct = max > 0 ? Number(m.revenus) / max : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 9, color: '#1B6B3A', fontWeight: 700, opacity: pct > 0 ? 1 : 0 }}>
                      {pct > 0 ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(Number(m.revenus)) : ''}
                    </div>
                    <div style={{ width: '100%', background: pct > 0 ? '#1B6B3A' : '#F0F0F0', borderRadius: '4px 4px 0 0', height: Math.max(4, Math.round(pct * 60)) + 'px', transition: 'height .5s' }} />
                    <div style={{ fontSize: 9, color: '#888' }}>{m.mois}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── ALERTES + ÉVÉNEMENTS ──────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', margin: 0 }}>{t('ongletOverview.aFaire.titre')}</h3>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/alertes'); }}
              style={{ background: 'none', border: 'none', color: '#1B6B3A', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {t('ongletOverview.aFaire.toutVoir')}
            </button>
          </div>

          {overview.alertes.length === 0 && overview.evenements.length === 0 && (
            <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, padding: '12px 0' }}>
              <CheckCircle size={28} strokeWidth={1} color="#C8E6C9" style={{ display: 'block', margin: '0 auto 8px' }} />
              {t('ongletOverview.aFaire.toutEnOrdre')}
            </div>
          )}

          {overview.alertes.slice(0, 3).map(function(a, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F5F5F5', alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, background: a.priorite === 'haute' ? '#E53935' : '#F5A623', borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>{a.titre}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{a.description && a.description.slice(0, 50)}{a.description && a.description.length > 50 ? '...' : ''}</div>
                </div>
              </div>
            );
          })}

          {overview.evenements.map(function(e, i) {
            var joursRestants = Math.ceil((new Date(e.date_evenement) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div key={'ev' + i} style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, background: '#1565C0', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: '#1B2B22' }}>
                  {t('ongletOverview.aFaire.bailExpire', { logement: e.logement_titre })}
                  <span style={{ color: joursRestants <= 15 ? '#E53935' : '#888', fontWeight: 700, marginLeft: 6 }}>
                    {t('ongletOverview.aFaire.dansNJours', { n: joursRestants })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MES BIENS ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', margin: 0 }}>{t('ongletOverview.mesBiens.titre')}</h3>
          <button onClick={function() { if(setOnglet) setOnglet('/dashboard/biens'); }}
            style={{ background: 'none', border: 'none', color: '#1B6B3A', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            {t('ongletOverview.mesBiens.gerer')}
          </button>
        </div>
        {overview.biens.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Home size={36} strokeWidth={1} color="#C8E6C9" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{t('ongletOverview.mesBiens.aucunBien')}</div>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/biens'); }}
              style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('ongletOverview.mesBiens.ajouterBien')}
            </button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {overview.biens.map(function(b, i) {
            var estLoue = b.statut === 'loue';
            var photo   = b.photos && b.photos.length > 0 ? b.photos[0] : null;
            return (
              <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: '#F7F8F7' }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', background: '#E8F5E9', flexShrink: 0 }}>
                  {photo
                    ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={20} strokeWidth={1.5} color="#A5D6A7" /></div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{b.titre}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                    {GNF(b.prix_mensuel)} GNF/mois · {b.ville}
                  </div>
                  {estLoue && b.loc_prenom && (
                    <div style={{ fontSize: 11, color: '#1B6B3A', marginTop: 1 }}>
                      {t('ongletOverview.mesBiens.locataire', { prenom: b.loc_prenom, nom: b.loc_nom })}
                    </div>
                  )}
                </div>
                <span style={{ background: estLoue ? '#E8F5E9' : '#FFF8E1', color: estLoue ? '#1B5E20' : '#7B4F00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {estLoue ? t('ongletOverview.mesBiens.loue') : t('ongletOverview.mesBiens.libre')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── DERNIÈRES CANDIDATURES ────────────────────────────── */}
      {overview.candidatures.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', margin: 0 }}>{t('ongletOverview.candidatures.titre')}</h3>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/reservations'); }}
              style={{ background: 'none', border: 'none', color: '#1B6B3A', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {t('ongletOverview.candidatures.toutesVoir')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overview.candidatures.map(function(r, i) {
              var cfgStatuts = {
                en_attente:  { label: t('ongletOverview.candidatures.statuts.nouvelle'),       color: '#E65100', bg: '#FFF3E0' },
                dossier_requis: { label: t('ongletOverview.candidatures.statuts.dossierDemande'), color: '#1565C0', bg: '#E3F2FD' },
                en_examen:   { label: t('ongletOverview.candidatures.statuts.enExamen'),       color: '#7B1FA2', bg: '#F3E5F5' },
                acceptee:    { label: t('ongletOverview.candidatures.statuts.acceptee'),       color: '#1B6B3A', bg: '#E8F5E9' },
                refusee:     { label: t('ongletOverview.candidatures.statuts.refusee'),        color: '#888',    bg: '#F5F5F5' },
              };
              var cfg = cfgStatuts[r.statut] || { label: r.statut, color: '#888', bg: '#F5F5F5' };
              return (
                <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: '#F7F8F7', cursor: 'pointer' }}
                  onClick={function() { if(setOnglet) setOnglet('/dashboard/reservations'); }}>
                  <div style={{ width: 36, height: 36, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {(r.loc_prenom || '').charAt(0)}{(r.loc_nom || '').charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{r.loc_prenom} {r.loc_nom}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{r.logement_titre} · {GNF(r.prix_mensuel)} GNF/mois</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                      {cfg.label}
                    </span>
                    {r.score_confiance > 0 && (
                      <span style={{ fontSize: 10, color: '#888' }}>{t('ongletOverview.candidatures.score', { score: r.score_confiance })}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
// ================================================
// ONGLET : Mes biens
// ================================================
function OngletBiens(props) {
  var t = useTranslation('dashboard').t;
  var stats     = props.stats;
  var recharger = props.recharger;
  var user      = props.user;
  var setOnglet = props.setOnglet;
  var plan      = props.plan || { plan: 'gratuit', droits: { max_biens: 2 }, nb_biens: 0 };
  var estProprio = user && (user.role === 'proprietaire' || user.role === 'les_deux');
  // Dans OngletBiens, après la déclaration de limiteAtteinte
  var limiteAtteinte = plan.nb_biens >= 20 && plan.plan !== 'agence';

  var [showConfirm, setShowConfirm] = useState(null);
  var [modeEdit, setModeEdit]       = useState(null);
  var [showLiberer, setShowLiberer] = useState(null);
  var [formEdit, setFormEdit]       = useState({});
  var [reservationsActives, setReservationsActives] = useState([]);
  var [showRenouv, setShowRenouv]       = useState(null);
  var [renouvForm, setRenouvForm]       = useState({ duree: '12', prix: '', message: '' });
  var [renouvLoading, setRenouvLoading] = useState(false);

  // Charger les réservations pour avoir les infos locataires
  useEffect(function() {
    if (!estProprio) return;
    api.get('/reservations/proprietaire')
      .then(function(res) {
        setReservationsActives(
          (res.data.reservations || []).filter(function(r) {
            return r.statut === 'confirmee';
          })
        );
      })
      .catch(console.error);
  }, [estProprio]);

  function getLocataireInfo(logementId) {
    return reservationsActives.find(function(r) { return r.logement_id === logementId; });
  }

  function handleDelete(id) {
    api.delete('/logements/' + id)
      .then(function() { toast.success(t('ongletBiens.toastBienSupprime')); setShowConfirm(null); recharger(); })
      .catch(function() { toast.error(t('ongletBiens.toastErreurSuppression')); });
  }

  function handleSave(id) {
    api.put('/logements/' + id, formEdit)
      .then(function() { toast.success(t('ongletBiens.toastBienModifie')); setModeEdit(null); recharger(); })
      .catch(function() { toast.error(t('ongletBiens.toastErreurModification')); });
  }

  function libererBien(id) {
  api.patch('/logements/' + id + '/liberer')
    .then(function() {
      toast.success(t('ongletBiens.toastBienLibere'));
      setShowLiberer(null);
      recharger();
    })
    .catch(function(err) {
      toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletBiens.toastErreur'));
    });
  }

  // ── VUE LOCATAIRE ─────────────────────────────────────────────
  if (!estProprio) {
    var locationsActives = stats.reservations.filter(function(r) { return r.statut === 'confirmee'; });
    return (
      <div>
        <div className="dash-page-header">
          <div><h1>{t('ongletBiens.locataire.titre')}</h1><p>{t('ongletBiens.locataire.locationsActives', { count: locationsActives.length })}</p></div>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>
            {t('ongletBiens.locataire.chercherLogement')}
          </Link>
        </div>

        {locationsActives.length === 0 && (
          <div className="dash-empty-state">
            <Home size={48} strokeWidth={1} color="#C8E6C9" />
            <h3>{t('ongletBiens.locataire.aucuneLocation.titre')}</h3>
            <p>{t('ongletBiens.locataire.aucuneLocation.description')}</p>
            <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
              {t('ongletBiens.locataire.aucuneLocation.trouverLogement')}
            </Link>
          </div>
        )}

        {locationsActives.map(function(r) {
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #1B6B3A' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: '#E8F5E9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Home size={22} strokeWidth={1.5} color="#1B6B3A" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>{r.logement_titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                    {t('ongletBiens.locataire.depuisLe', { ville: r.logement_ville, date: r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletBiens.locataire.na') })}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B6B3A', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || 0)} GNF/mois
                  </div>
                </div>
                <div style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {t('ongletBiens.locataire.active')}
                </div>
              </div>

              {/* Boutons locataire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link to={'/reservation/' + r.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '0.5px solid #A5D6A7' }}>
                  {t('ongletBiens.locataire.details')}
                </Link>
                <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E3F2FD', color: '#1565C0', fontSize: 13, fontWeight: 600, border: '0.5px solid #90CAF9', cursor: 'pointer' }}>
                  <span style={{display:'flex',alignItems:'center',gap:5}}><FileText size={14} strokeWidth={1.5}/> {t('ongletBiens.locataire.documents')}</span>
                </button>
              </div>
              {limiteAtteinte ? (
  <div style={{ background: '#FFF3E0', border: '1px solid #FFE082', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#7B4F00', display: 'flex', alignItems: 'center', gap: 10 }}>
    <AlertCircle size={16} strokeWidth={1.5} color="#E65100" />
    {t('ongletBiens.limiteAtteinte20')}{' '}
    <button onClick={function() { navigate('/pricing'); }}
      style={{ background: 'none', border: 'none', color: '#7B1FA2', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13 }}>
      {t('ongletBiens.passerPlanAgence')}
    </button>
  </div>
) : (
  <Link to="/logements/ajouter" className="btn-green" style={{ textDecoration: 'none' }}>
    {t('ongletBiens.ajouterBien')}
  </Link>
)}
            </div>
          );
        })}
      </div>
    );
  }

  // ── VUE PROPRIÉTAIRE ──────────────────────────────────────────
  return (
    <div>
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: '#B71C1C' }}>{t('ongletBiens.confirmSuppression.titre')}</h3>
            <p>{t('ongletBiens.confirmSuppression.description')}</p>
            <div className="modal-actions">
              <button className="btn-green" style={{ background: '#B71C1C' }} onClick={function() { handleDelete(showConfirm); }}>{t('ongletBiens.confirmSuppression.supprimer')}</button>
              <button className="btn-outline-green" onClick={function() { setShowConfirm(null); }}>{t('ongletBiens.confirmSuppression.annuler')}</button>
            </div>
          </div>
        </div>
      )}

    {showLiberer && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3 style={{ color: '#C62828' }}>{t('ongletBiens.libererModal.titre')}</h3>
      <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
        {t('ongletBiens.libererModal.descAvant')}<b>{t('ongletBiens.libererModal.descGras')}</b>{t('ongletBiens.libererModal.descApres')}
      </p>
      <div style={{ background: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: '#B71C1C' }}>
        <span style={{display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={14} strokeWidth={1.5} /> {t('ongletBiens.libererModal.avertissement')}</span>
      </div>
      <div className="modal-actions">
        <button
          style={{ background: '#C62828', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          onClick={function() { libererBien(showLiberer); }}>
          {t('ongletBiens.libererModal.libererMaintenant')}
        </button>
        <button className="btn-outline-green" onClick={function() { setShowLiberer(null); }}>
          {t('ongletBiens.confirmSuppression.annuler')}
        </button>
      </div>
    </div>
  </div>
  )}

      <div className="dash-page-header">
        <div>
          <h1>{t('ongletBiens.titre')}</h1>
          <p>{t('ongletBiens.biensEnGestion', { count: stats.logements.length })}</p>
        </div>
        {limiteAtteinte ? (
          <button onClick={function() { window.location.href = '/pricing'; }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: '#F5A623', color: '#1B2B22', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Lock size={14} strokeWidth={1.5} /> {t('ongletBiens.limiteAtteinteUpgrader')}
          </button>
        ) : (
          <Link to="/logements/ajouter" className="btn-green" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {t('ongletBiens.ajouterBien')}
          </Link>
        )}
      </div>

      {stats.logements.length === 0 && (
        <div className="dash-empty-state">
          <Home size={48} strokeWidth={1} color="#C8E6C9" />
          <h3>{t('ongletBiens.aucunBienEnregistre')}</h3>
          <Link to="/logements/ajouter" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
            {t('ongletBiens.ajouterMonPremierBien')}
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stats.logements.map(function(b) {
        var estOccupe    = b.statut === 'loue';
          var locataire    = estOccupe ? getLocataireInfo(b.id) : null;
          var preavisActif = b.preavis_statut === 'envoye';
          var joursRestants = preavisActif && b.date_sortie_estimee
            ? Math.ceil((new Date(b.date_sortie_estimee) - new Date()) / (1000 * 60 * 60 * 24))
            : null;
          var borderColor  = preavisActif
            ? (joursRestants !== null && joursRestants <= 5 ? '#C62828' : '#E65100')
            : estOccupe ? '#1B6B3A' : '#F5A623';       
          // Mode édition
          if (modeEdit === b.id) {
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #1565C0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>{t('ongletBiens.editForm.modifierTitre', { titre: b.titre })}</div>
                <div className="form-row-2">
                  <div className="form-group"><label>{t('ongletBiens.editForm.titre')}</label><input type="text" value={formEdit.titre} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { titre: e.target.value })); }} /></div>
                  <div className="form-group"><label>{t('ongletBiens.editForm.prix')}</label><input type="number" value={formEdit.prix_mensuel} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { prix_mensuel: e.target.value })); }} /></div>
                  <div className="form-group"><label>{t('ongletBiens.editForm.adresse')}</label><input type="text" value={formEdit.adresse} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { adresse: e.target.value })); }} /></div>
                  <div className="form-group">
                    <label>{t('ongletBiens.editForm.statut')}</label>
                    <select value={formEdit.statut} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { statut: e.target.value })); }}>
                      <option value="disponible">{t('ongletBiens.editForm.statutDisponible')}</option>
                      <option value="loue">{t('ongletBiens.editForm.statutLoue')}</option>
                      <option value="suspendu">{t('ongletBiens.editForm.statutSuspendu')}</option>
                    </select>
                  </div>
                </div>
                {modeEdit === b.id && (
  <div style={{ marginBottom: 16 }}>
    <GestionPhotos
      logementId={b.id}
      photosInitiales={b.photos || []}
      onUpdate={function(nouvPhotos) {
        toast.success(t('ongletBiens.editForm.photosEnregistrees', { count: nouvPhotos.length }));
      }} />
  </div>
)}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-bien-primary" onClick={function() { handleSave(b.id); }}>{t('ongletBiens.editForm.sauvegarder')}</button>
                  <button className="btn-bien-secondary" onClick={function() { setModeEdit(null); }}>{t('ongletBiens.editForm.annuler')}</button>
                </div>
              </div>
            );
          }

          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + borderColor }}>

              {/* En-tête bien */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: estOccupe ? '#E8F5E9' : '#FFF8E1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {b.categorie && b.categorie.includes('villa') ? <Home size={22} strokeWidth={1.5} /> : b.categorie && b.categorie.includes('studio') ? <Building2 size={22} strokeWidth={1.5} /> : <Building size={22} strokeWidth={1.5} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>{b.titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                    {locataire
                      ? t('ongletBiens.locataireDepuisLe', { prenom: locataire.locataire_prenom, nom: locataire.locataire_nom, date: locataire.date_debut ? new Date(locataire.date_debut).toLocaleDateString('fr-FR') : t('ongletBiens.locataire.na') })
                      : (b.adresse ? b.adresse + ', ' : '') + (b.ville || '')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B6B3A', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(b.prix_mensuel)} GNF/mois
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {preavisActif ? (
                    <div style={{ background: '#FFEBEE', color: '#B71C1C', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><AlertCircle size={12} strokeWidth={1.5}/> {t('ongletBiens.preavisEnvoye')}</span>
                    </div>
                  ) : estOccupe ? (
                    <div style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      {t('ongletBiens.occupe')}
                    </div>
                  ) : (
                    <div style={{ background: '#FFF8E1', color: '#C8860A', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      {t('ongletBiens.locataire.libre')}
                    </div>
                  )}
                  {preavisActif && joursRestants !== null && (
                    <div style={{
                      background: joursRestants <= 5 ? '#FFEBEE' : joursRestants <= 15 ? '#FFF3E0' : '#FFF8E1',
                      color:      joursRestants <= 5 ? '#C62828' : joursRestants <= 15 ? '#E65100' : '#7B4F00',
                      border:     '1.5px solid ' + (joursRestants <= 5 ? '#FFCDD2' : joursRestants <= 15 ? '#FFCC80' : '#FFE082'),
                      borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 800
                    }}>
                      J-{joursRestants > 0 ? joursRestants : 0}
                    </div>
                  )}
                </div>
              </div>

              {/* Bannière préavis actif */}
              {preavisActif && (
                <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#B71C1C' }}>
                  <ClipboardList size={14} strokeWidth={1.5} />
                  <span>
                    {t('ongletBiens.preavisBanniere.avant')}<b>{locataire && locataire.locataire_prenom + ' ' + locataire.locataire_nom}</b>{t('ongletBiens.preavisBanniere.apres')}
                    {' '}<span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={function() { if (setOnglet) setOnglet('/dashboard/preavis'); }}>{t('ongletBiens.preavisBanniere.voirLePreavis')}</span>
                  </span>
                </div>
              )}

              {/* Boutons selon statut */}
              {estOccupe ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button onClick={function() { if (setOnglet) setOnglet('/dashboard/messages'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', border: '0.5px solid #A5D6A7', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <span style={{display:'flex',alignItems:'center',gap:5}}><MessageCircle size={14} strokeWidth={1.5}/> {t('ongletBiens.boutons.messagerie')}</span>
                  </button>
                  <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#E3F2FD', color: '#1565C0', border: '0.5px solid #90CAF9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <FileText size={14} strokeWidth={1.5} /> {t('ongletBiens.boutons.documents')}
                  </button>
                  {!preavisActif && (
                    <button onClick={function() { if (setOnglet) setOnglet('/dashboard/preavis'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <span style={{display:'flex',alignItems:'center',gap:5}}><Send size={14} strokeWidth={1.5}/> {t('ongletBiens.boutons.preavis')}</span>
                    </button>
                  )}
                  {preavisActif && (
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#F5F5F5', color: '#888', border: '0.5px solid #E0E0E0', fontSize: 12, cursor: 'not-allowed' }} disabled>
                      {t('ongletBiens.preavisEnvoye')}
                    </button>
                  )}
                  {estOccupe && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
    {/* ... boutons existants Messagerie, Documents, Préavis ... */}
    <button
      onClick={function() { proposerRenouvellement(b); }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#E3F2FD', color: '#1565C0', border: '0.5px solid #90CAF9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      <RefreshCw size={13} strokeWidth={1.5} /> {t('ongletBiens.boutons.renouveler')}
    </button>
    <button
      onClick={function() { setShowLiberer(b.id); }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 10, background: '#FFEBEE', color: '#C62828', border: '0.5px solid #FFCDD2', fontSize: 12, fontWeight: 600, cursor: 'pointer', gridColumn: '1 / -1' }}>
      {t('ongletBiens.libererModal.libererMaintenant')}
    </button>
  </div>
)}

{showRenouv && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3 style={{ color: '#1565C0' }}>{t('ongletBiens.renouvModal.titre')}</h3>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
        {t('ongletBiens.renouvModal.logement')} <b>{showRenouv.nom}</b>
      </p>
      <div className="form-group">
        <label>{t('ongletBiens.renouvModal.dureeLabel')}</label>
        <select value={renouvForm.duree} onChange={function(e) { setRenouvForm(Object.assign({}, renouvForm, { duree: e.target.value })); }}>
          {['3','6','12','18','24'].map(function(d) { return <option key={d} value={d}>{t('ongletBiens.renouvModal.dureeMois', { n: d })}</option>; })}
        </select>
      </div>
      <div className="form-group">
        <label>{t('ongletBiens.renouvModal.nouveauLoyerLabel')}</label>
        <input type="number" placeholder={showRenouv.loyer} value={renouvForm.prix}
          onChange={function(e) { setRenouvForm(Object.assign({}, renouvForm, { prix: e.target.value })); }} />
      </div>
      <div className="form-group">
        <label>{t('ongletBiens.renouvModal.messageLabel')}</label>
        <textarea value={renouvForm.message} onChange={function(e) { setRenouvForm(Object.assign({}, renouvForm, { message: e.target.value })); }}
          placeholder={t('ongletBiens.renouvModal.messagePlaceholder')} rows="2"
          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
      </div>
      <div className="modal-actions">
        <button onClick={envoyerRenouvellement} disabled={renouvLoading}
          style={{ background: '#1565C0', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, cursor: 'pointer', flex: 1 }}>
          {renouvLoading ? t('ongletBiens.renouvModal.envoiEnCours') : t('ongletBiens.renouvModal.envoyerLaProposition')}
        </button>
        <button className="btn-outline-green" onClick={function() { setShowRenouv(null); }}>{t('ongletBiens.confirmSuppression.annuler')}</button>
      </div>
    </div>
  </div>
)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button className="btn-bien-primary" onClick={function() {
                    setModeEdit(b.id);
                    setFormEdit({ titre: b.titre, adresse: b.adresse, prix_mensuel: b.prix_mensuel, statut: b.statut });
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Pencil size={14} strokeWidth={1.5} /> {t('ongletBiens.editForm.modifier')}</span>
                  </button>
                  <button className="btn-bien-secondary" onClick={function() { setShowConfirm(b.id); }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} strokeWidth={1.5} /> {t('ongletBiens.editForm.supprimer')}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function proposerRenouvellement(bien) {
  if (!bien.reservation_id) { toast.error('Aucune réservation active'); return; }
  setShowRenouv(bien);
  setRenouvForm({ duree: '12', prix: String(bien.loyer || ''), message: '' });
}

function envoyerRenouvellement() {
  if (!showRenouv) return;
  setRenouvLoading(true);
  api.post('/renouvellements', {
    reservation_id:      showRenouv.reservation_id,
    nouvelle_duree_mois: parseInt(renouvForm.duree),
    nouveau_prix:        renouvForm.prix ? Number(renouvForm.prix) : null,
    message:             renouvForm.message || null
  })
    .then(function() {
      toast.success('Proposition de renouvellement envoyée !');
      setShowRenouv(null);
    })
    .catch(function(err) { toast.error(err.response?.data?.erreur || 'Erreur'); })
    .finally(function() { setRenouvLoading(false); });
}

// ================================================
// ONGLET : Locataires
// ================================================
function OngletLocataires(props) {
  var t = useTranslation('dashboard').t;
  var stats = props.stats;
  var logements = props.logements;
  var [showForm, setShowForm] = useState(false);
  var [locatairesManue, setLocatairesManue] = useState([]);
  var [modeEdit, setModeEdit] = useState(null);
  var [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '', logement_id: '', loyer_mensuel: '', date_entree: '' });

  useEffect(function() {
    api.get('/locataires-manuels')
      .then(function(res) { setLocatairesManue(res.data.locataires); })
      .catch(console.error);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    var req = modeEdit
      ? api.put('/locataires-manuels/' + modeEdit, form)
      : api.post('/locataires-manuels', form);
    req.then(function() {
      toast.success(modeEdit ? t('ongletLocataires.toastModifie') : t('ongletLocataires.toastAjoute'));
      setShowForm(false);
      setModeEdit(null);
      setForm({ nom: '', prenom: '', telephone: '', email: '', logement_id: '', loyer_mensuel: '', date_entree: '' });
      api.get('/locataires-manuels').then(function(res) { setLocatairesManue(res.data.locataires); });
    }).catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletLocataires.toastErreur')); });
  }

  function handleDelete(id) {
    if (!window.confirm(t('ongletLocataires.confirmSuppression'))) return;
    api.delete('/locataires-manuels/' + id)
      .then(function() {
        toast.success(t('ongletLocataires.toastSupprime'));
        api.get('/locataires-manuels').then(function(res) { setLocatairesManue(res.data.locataires); });
      }).catch(function() { toast.error(t('ongletLocataires.toastErreur')); });
  }

  var locatairesReservations = stats.reservations.reduce(function(acc, r) {
    if (r.locataire_nom && !acc.find(function(l) { return l.email === r.locataire_email; })) {
      acc.push({ nom: r.locataire_nom, prenom: r.locataire_prenom, telephone: r.locataire_telephone, email: r.locataire_email, logement: r.logement_titre, loyer: r.montant_total, statut: r.statut });
    }
    return acc;
  }, []);

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>{t('ongletLocataires.titre')}</h1>
          <p>{t('ongletLocataires.nbLocataires', { count: locatairesReservations.length + locatairesManue.length })}</p>
        </div>
        <button className="btn-green" onClick={function() { setShowForm(!showForm); setModeEdit(null); setForm({ nom: '', prenom: '', telephone: '', email: '', logement_id: '', loyer_mensuel: '', date_entree: '' }); }}>
          {t('ongletLocataires.ajouterLocataire')}
        </button>
      </div>

      {showForm && (
        <div className="dash-form-card">
          <h3>{modeEdit ? t('ongletLocataires.form.modifierTitre') : t('ongletLocataires.form.nouveauTitre')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group"><label>{t('ongletLocataires.form.prenom')}</label><input type="text" value={form.prenom} onChange={function(e) { setForm(Object.assign({}, form, { prenom: e.target.value })); }} required /></div>
              <div className="form-group"><label>{t('ongletLocataires.form.nom')}</label><input type="text" value={form.nom} onChange={function(e) { setForm(Object.assign({}, form, { nom: e.target.value })); }} required /></div>
              <div className="form-group"><label>{t('ongletLocataires.form.telephone')}</label><input type="tel" value={form.telephone} onChange={function(e) { setForm(Object.assign({}, form, { telephone: e.target.value })); }} /></div>
              <div className="form-group"><label>{t('ongletLocataires.form.email')}</label><input type="email" value={form.email} onChange={function(e) { setForm(Object.assign({}, form, { email: e.target.value })); }} /></div>
              <div className="form-group">
                <label>{t('ongletLocataires.form.logement')}</label>
                <select value={form.logement_id} onChange={function(e) { setForm(Object.assign({}, form, { logement_id: e.target.value })); }}>
                  <option value="">{t('ongletLocataires.form.aucun')}</option>
                  {logements.map(function(l) { return <option key={l.id} value={l.id}>{l.titre}</option>; })}
                </select>
              </div>
              <div className="form-group"><label>{t('ongletLocataires.form.loyer')}</label><input type="number" value={form.loyer_mensuel} onChange={function(e) { setForm(Object.assign({}, form, { loyer_mensuel: e.target.value })); }} /></div>
              <div className="form-group"><label>{t('ongletLocataires.form.dateEntree')}</label><input type="date" value={form.date_entree} onChange={function(e) { setForm(Object.assign({}, form, { date_entree: e.target.value })); }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green">{modeEdit ? t('ongletLocataires.form.sauvegarder') : t('ongletLocataires.form.ajouter')}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>{t('ongletLocataires.form.annuler')}</button>
            </div>
          </form>
        </div>
      )}

      {locatairesReservations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('ongletLocataires.viaWerdhe')}</h3>
          {locatairesReservations.map(function(l, i) {
            var initiales = (l.prenom ? l.prenom.charAt(0) : '') + (l.nom ? l.nom.charAt(0) : '');
            return (
              <div key={i} className="locataire-row">
                <div className="locataire-row-left">
                  <div className="locataire-avatar-proto">{initiales}</div>
                  <div>
                    <div className="locataire-row-name">{l.prenom} {l.nom}</div>
                    <div className="locataire-row-sub">{l.logement}</div>
                  </div>
                </div>
                <div className="locataire-row-right">
                  <div>
                    <div className="locataire-loyer">{GNF(l.loyer)}/mois</div>
                  </div>
                  <button className="btn-outline-green">{t('ongletLocataires.voirFiche')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('ongletLocataires.manuels')}</h3>
      {locatairesManue.length === 0 && !showForm && (
        <div className="dash-empty-state">
          <Users size={48} strokeWidth={1} color="#C8E6C9" />
          <h3>{t('ongletLocataires.aucunManuel.titre')}</h3>
          <p>{t('ongletLocataires.aucunManuel.description')}</p>
        </div>
      )}
      {locatairesManue.map(function(l) {
        var initiales = (l.prenom ? l.prenom.charAt(0) : '') + (l.nom ? l.nom.charAt(0) : '');
        return (
          <div key={l.id} className="locataire-row" style={{ borderLeft: '4px solid #F5A623' }}>
            <div className="locataire-row-left">
              <div className="locataire-avatar-proto" style={{ background: '#F5A623', color: '#1B6B3A' }}>{initiales}</div>
              <div>
                <div className="locataire-row-name">{l.prenom} {l.nom}</div>
                <div className="locataire-row-sub">
                  {l.telephone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={12} strokeWidth={1.5} /> {l.telephone}</span>}
                  {l.logement_titre && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}> · <Home size={12} strokeWidth={1.5} /> {l.logement_titre}</span>}
                </div>
              </div>
            </div>
            <div className="locataire-row-right">
              {l.loyer_mensuel && (
                <div>
                  <div className="locataire-loyer">{GNF(l.loyer_mensuel)}/mois</div>
                </div>
              )}
              <button className="btn-outline-green" onClick={function() {
                setModeEdit(l.id);
                setForm({ nom: l.nom, prenom: l.prenom, telephone: l.telephone || '', email: l.email || '', logement_id: l.logement_id || '', loyer_mensuel: l.loyer_mensuel || '', date_entree: l.date_entree ? l.date_entree.split('T')[0] : '' });
                setShowForm(true);
              }}>{t('ongletLocataires.form.modifier')}</button>
              <button style={{ background: '#FFEBEE', color: '#B71C1C', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }} onClick={function() { handleDelete(l.id); }}>{t('ongletLocataires.form.supprimer')}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Reservations
// ================================================
function OngletReservations(props) {
  var t = useTranslation('dashboard').t;
  var stats = props.stats;
  var user = props.user;
  var recharger = props.recharger;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');

  // ── LOCATAIRE : liste des réservations avec lien vers le flux ─────
  if (!estProprietaire) {
    var reservationsLoc = stats.reservations || [];
    console.log('[Debug] Candidatures locataire:', reservationsLoc.length, reservationsLoc);

    var statutsLoc = {
      en_attente:         { label: t('ongletReservations.locataire.statuts.enAttente.label'),         couleur: '#F5A623', bg: '#FFF8E1', action: t('ongletReservations.locataire.statuts.enAttente.action'),         urgent: true  },
      dossier_requis:     { label: t('ongletReservations.locataire.statuts.dossierRequis.label'),     couleur: '#1565C0', bg: '#E3F2FD', action: t('ongletReservations.locataire.statuts.dossierRequis.action'),     urgent: true  },
      en_examen:          { label: t('ongletReservations.locataire.statuts.enExamen.label'),          couleur: '#7B1FA2', bg: '#F3E5F5', action: t('ongletReservations.locataire.statuts.enExamen.action'),          urgent: false },
      acceptee:           { label: t('ongletReservations.locataire.statuts.acceptee.label'),           couleur: '#1B6B3A', bg: '#E8F5E9', action: t('ongletReservations.locataire.statuts.acceptee.action'),           urgent: true  },
      echanges:           { label: t('ongletReservations.locataire.statuts.echanges.label'),           couleur: '#1565C0', bg: '#E3F2FD', action: t('ongletReservations.locataire.statuts.echanges.action'),           urgent: false },
      caution_requise:    { label: t('ongletReservations.locataire.statuts.cautionRequise.label'),    couleur: '#E65100', bg: '#FFF3E0', action: t('ongletReservations.locataire.statuts.cautionRequise.action'),    urgent: true  },
      caution_payee:      { label: t('ongletReservations.locataire.statuts.cautionPayee.label'),      couleur: '#1B6B3A', bg: '#E8F5E9', action: t('ongletReservations.locataire.statuts.cautionPayee.action'),      urgent: false },
      bail_en_cours:      { label: t('ongletReservations.locataire.statuts.bailEnCours.label'),       couleur: '#7B1FA2', bg: '#F3E5F5', action: t('ongletReservations.locataire.statuts.bailEnCours.action'),       urgent: true  },
      bail_signe_proprio: { label: t('ongletReservations.locataire.statuts.bailSigneProprio.label'),  couleur: '#7B1FA2', bg: '#F3E5F5', action: t('ongletReservations.locataire.statuts.bailSigneProprio.action'),  urgent: true  },
      confirmee:          { label: t('ongletReservations.locataire.statuts.confirmee.label'),         couleur: '#1B6B3A', bg: '#E8F5E9', action: t('ongletReservations.locataire.statuts.confirmee.action'),         urgent: false },
      refusee:            { label: t('ongletReservations.locataire.statuts.refusee.label'),           couleur: '#B71C1C', bg: '#FFEBEE', action: null,                    urgent: false },
    };

    return (
      <div>
        <div className="dash-page-header">
          <div>
            <h1>{t('ongletReservations.locataire.titre')}</h1><p>{t('ongletReservations.locataire.nbCandidatures', { count: reservationsLoc.length })}</p>
          </div>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>
            {t('ongletReservations.locataire.chercherLogement')}
          </Link>
        </div>

        {reservationsLoc.length === 0 && (
          <div className="dash-empty-state">
            <CalendarCheck size={48} strokeWidth={1} color="#C8E6C9" />
            <h3>{t('ongletReservations.locataire.aucuneReservation.titre')}</h3>
            <p>{t('ongletReservations.locataire.aucuneReservation.description')}</p>
            <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
              {t('ongletReservations.locataire.aucuneReservation.trouverLogement')}
            </Link>
          </div>
        )}

        {reservationsLoc.map(function(r) {
          var cfg = statutsLoc[r.statut] || { label: r.statut, couleur: '#888', bg: '#F5F5F5', action: t('ongletReservations.locataire.voir'), urgent: false };
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + cfg.couleur }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 3 }}>
                    {r.logement_titre}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {r.date_debut ? t('ongletReservations.locataire.demandeDu', { date: new Date(r.created_at).toLocaleDateString('fr-FR') }) : t('ongletReservations.locataire.demandeEnCours')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A', marginTop: 4 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || 0)} GNF / mois
                  </div>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.couleur, flexShrink: 0, marginLeft: 10 }}>
                  {cfg.label}
                </span>
              </div>

              {cfg.urgent && (
                <div style={{ background: '#FFF8E1', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: '#7B4F00', fontWeight: 600 }}>
                  {t('ongletReservations.locataire.actionAttendue')}
                </div>
              )}

              {cfg.action && (
                <Link
                  to={'/reservation/' + r.id}
                  style={{ display: 'block', width: '100%', background: cfg.urgent ? '#1B6B3A' : '#F0F0F0', color: cfg.urgent ? '#fff' : '#555', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: cfg.urgent ? 700 : 400, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
                  {cfg.action} →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── PROPRIÉTAIRE : liste + détail inline (pas de navigation) ──────
  return <OngletReservationsProprio stats={stats} recharger={recharger} user={user} />;
}
function ScoreLocataire({ locataireId }) {
  var t = useTranslation('dashboard').t;
  var [score, setScore] = useState(null);

  useEffect(function() {
    if (!locataireId) return;
    api.get('/auth/score/' + locataireId)
      .then(function(res) { setScore(res.data); })
      .catch(console.error);
  }, [locataireId]);

  if (!score) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: score.bg, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: score.couleur }}>{score.score}</div>
        <div style={{ fontSize: 9, color: '#888' }}>/ 100</div>
      </div>
      <div style={{ width: 1, height: 32, background: 'rgba(0,0,0,0.1)' }} />
      <div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{t('scoreLocataire.titre')}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: score.couleur }}>{score.emoji} {score.label}</div>
      </div>
    </div>
  );
}
// ─── Séparé pour garder le code propre ────────────────────────────
function OngletReservationsProprio(props) {
  var t = useTranslation('dashboard').t;
  var stats = props.stats;
  var recharger = props.recharger;
  var user = props.user;
  var [selectionne, setSelectionne] = useState(null);
  var [motifRefus, setMotifRefus] = useState('');
  var [msgs, setMsgs] = useState([]);
  var [newMsg, setNewMsg] = useState('');
  var [bailSigne, setBailSigne] = useState(false);
  var [showSignatureProprio, setShowSignatureProprio] = useState(false);
  var [signatureProcessing, setSignatureProcessing] = useState(false);

  // Polling toutes les 10s pour mettre à jour le statut

  var rechargerRef = useRef(recharger);
useEffect(function() { rechargerRef.current = recharger; }, [recharger]);
useEffect(function() {
  var interval = setInterval(function() {
    if (rechargerRef.current) rechargerRef.current();
  }, 10000);
  return function() { clearInterval(interval); };
}, []);

  // Quand la liste se met à jour, mettre à jour aussi la vue détail
  useEffect(function() {
    if (selectionne) {
      var updated = (stats.reservations || []).find(function(r) { return r.id === selectionne.id; });
      if (updated && updated.statut !== selectionne.statut) {
        setSelectionne(updated);
      }
    }
  }, [stats.reservations]);

  // Charger les messages quand on ouvre la discussion
  useEffect(function() {
    if (selectionne && selectionne.locataire_id && ['acceptee', 'echanges'].includes(selectionne.statut)) {
      api.get('/messages/' + selectionne.locataire_id)
        .then(function(res) { setMsgs(res.data.messages || []); })
        .catch(console.error);
    }
  }, [selectionne && selectionne.statut]);

  function action(endpoint, body, msgSucces) {
    api.patch('/reservations/' + selectionne.id + endpoint, body)
      .then(function(res) {
        toast.success(msgSucces);
        setMotifRefus('');
        if (recharger) recharger();
      })
      .catch(function(err) {
       var msg = err.response && err.response.data && err.response.data.erreur
       ? err.response.data.erreur
       : t('ongletReservationsProprio.erreurServeur');
       toast.error(msg);
       console.error('Détail erreur:', err.response && err.response.data);
      });
  }

  function signerBail(nomComplet) {
    setSignatureProcessing(true);
    api.patch('/reservations/' + selectionne.id + '/signer-bail', { nom_complet: nomComplet, accepte: true })
      .then(function() {
        setBailSigne(true);
        setSignatureProcessing(false);
        setShowSignatureProprio(false);
        toast.success(t('ongletReservationsProprio.toastBailSigneAttenteLocataire'));
        if (recharger) recharger();
      })
      .catch(function(err) {
        setSignatureProcessing(false);
        toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletReservationsProprio.toastErreurSignatureBail'));
      });
  }

  function telechargerBailSigne(reservationId) {
    api.get('/documents?type=contrat_bail')
      .then(function(res) {
        var docs = (res.data.documents || []).filter(function(d) { return d.reservation_id === reservationId; });
        if (docs.length === 0) { toast.error(t('ongletReservationsProprio.toastBailNonTrouve')); return; }
        return api.get('/documents/' + docs[0].id + '/telecharger?format=pdf', { responseType: 'blob' })
          .then(function(res2) {
            var typePdf = (res2.headers && res2.headers['content-type'] || '').indexOf('pdf') !== -1;
            var blob = new Blob([res2.data], { type: typePdf ? 'application/pdf' : 'text/html; charset=utf-8' });
            var url  = window.URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Bail_' + reservationId.slice(0, 8) + (typePdf ? '.pdf' : '.html'));
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(t('ongletReservationsProprio.toastBailTelecharge'));
          });
      })
      .catch(function() { toast.error(t('ongletReservationsProprio.toastErreurTelechargement')); });
  }

  function envoyerMessage() {
    if (!newMsg.trim()) return;
    api.post('/messages', {
      destinataire_id: selectionne.locataire_id,
      reservation_id: selectionne.id,
      contenu: newMsg
    })
      .then(function(res) {
        setMsgs(function(prev) { return prev.concat(res.data.data || { contenu: newMsg, expedition_id: user && user.id, created_at: new Date().toISOString() }); });
        setNewMsg('');
      })
      .catch(function() { toast.error(t('ongletReservationsProprio.toastErreurEnvoi')); });
  }

  var reservations = stats.reservations || [];
  var actionsRequises = reservations.filter(function(r) {
    return ['en_attente', 'en_examen', 'caution_payee', 'bail_en_cours'].includes(r.statut);
  });

  var cfgStatuts = {
    en_attente         : { label: t('ongletReservationsProprio.statuts.enAttente'),         couleur: '#E53935', urgent: true },
    dossier_requis     : { label: t('ongletReservationsProprio.statuts.dossierRequis'),     couleur: '#F5A623', urgent: false },
    en_examen          : { label: t('ongletReservationsProprio.statuts.enExamen'),          couleur: '#7B1FA2', urgent: true  },
    acceptee           : { label: t('ongletReservationsProprio.statuts.acceptee'),          couleur: '#1B6B3A', urgent: false },
    echanges           : { label: t('ongletReservationsProprio.statuts.echanges'),          couleur: '#1565C0', urgent: false },
    caution_requise    : { label: t('ongletReservationsProprio.statuts.cautionRequise'),    couleur: '#F5A623', urgent: false },
    caution_payee      : { label: t('ongletReservationsProprio.statuts.cautionPayee'),      couleur: '#1B6B3A', urgent: true  },
    bail_en_cours      : { label: t('ongletReservationsProprio.statuts.bailEnCours'),        couleur: '#7B1FA2', urgent: true  },
    bail_signe_proprio : { label: t('ongletReservationsProprio.statuts.bailSigneProprio'),  couleur: '#F5A623', urgent: false },
    confirmee          : { label: t('ongletReservationsProprio.statuts.confirmee'),         couleur: '#1B6B3A', urgent: false },
    refusee            : { label: t('ongletReservationsProprio.statuts.refusee'),           couleur: '#888',    urgent: false },
  };

  // ── VUE DÉTAIL ──────────────────────────────────────────────────
  if (selectionne) {
    var r = selectionne;
    var loyer = Number(r.prix_mensuel) || Number(r.montant_total) || 0;
    console.log('[Debug loyer]', r.logement_titre, 'prix_mensuel:', r.prix_mensuel, 'montant_total:', r.montant_total, 'loyer calculé:', loyer);

    return (
      <div>
        {/* Bouton retour */}
        <button
          onClick={function() { setSelectionne(null); setBailSigne(false); setMotifRefus(''); setMsgs([]); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#1B6B3A', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
          {t('ongletReservationsProprio.retourListe')}
        </button>

        {/* En-tête locataire */}
        <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                {r.locataire_prenom} {r.locataire_nom}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 }}>
                {r.logement_titre} · {new Intl.NumberFormat('fr-FR').format(loyer)} GNF/mois
              </div>
              {r.locataire_telephone && (
                <a href={'tel:' + r.locataire_telephone} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={12} strokeWidth={1.5} /> {r.locataire_telephone}
                </a>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
              {cfgStatuts[r.statut] ? cfgStatuts[r.statut].label : r.statut}
            </div>
          </div>
        </div>

        {/* ─ NOUVELLE DEMANDE ─ */}
        {r.statut === 'en_attente' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>{t('ongletReservationsProprio.demandeRecue.titre')}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                [t('ongletReservationsProprio.demandeRecue.labels.logement'), r.logement_titre],
                [t('ongletReservationsProprio.demandeRecue.labels.loyer'), new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF/mois'],
                [t('ongletReservationsProprio.demandeRecue.labels.dateSouhaitee'), r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletReservationsProprio.demandeRecue.nonPrecisee')],
                [t('ongletReservationsProprio.demandeRecue.labels.duree'), r.duree_mois ? t('ongletReservationsProprio.nMois', { n: r.duree_mois }) : t('ongletReservationsProprio.demandeRecue.nonPrecisee')],
                [t('ongletReservationsProprio.demandeRecue.labels.recueLe'), new Date(r.created_at).toLocaleDateString('fr-FR')],
                [t('ongletReservationsProprio.demandeRecue.labels.email'), r.locataire_email || t('ongletReservationsProprio.na')],
              ].map(function(row) {
                return (
                  <div key={row[0]} style={{ background: '#F8F8F8', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>{row[0]}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{row[1]}</div>
                  </div>
                );
              })}
            </div>

            {r.message_locataire && (
              <div style={{ background: '#F0F7FF', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 600 }}>{t('ongletReservationsProprio.demandeRecue.messageLocataire')}</div>
                <div style={{ fontSize: 13, color: '#333', fontStyle: 'italic' }}>"{r.message_locataire}"</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={function() { action('/decision', { decision: 'dossier_requis' }, t('ongletReservationsProprio.toastDossierDemande')); }}
                style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('ongletReservationsProprio.demanderDossierComplet')}
              </button>
              <button
                onClick={function() { action('/decision', { decision: 'acceptee' }, t('ongletReservationsProprio.toastCandidatureAcceptee')); }}
                style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #A5D6A7', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><CheckCircle size={15} strokeWidth={1.5}/> {t('ongletReservationsProprio.accepterSansDossier')}</span>
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={motifRefus}
                  onChange={function(e) { setMotifRefus(e.target.value); }}
                  placeholder={t('ongletReservationsProprio.motifRefusPlaceholder')}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
                <button
                  onClick={function() {
                    if (!motifRefus.trim()) { toast.error(t('ongletReservationsProprio.toastIndiquerMotif')); return; }
                    action('/decision', { decision: 'refusee', motif: motifRefus }, t('ongletReservationsProprio.toastCandidatureRefusee'));
                  }}
                  style={{ background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><XCircle size={14} strokeWidth={1.5}/> {t('ongletReservationsProprio.refuser')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Score du locataire */}
{selectionne && (
  <ScoreLocataire locataireId={selectionne.locataire_id} />
)}

        {/* ─ EXAMINER LE DOSSIER ─ */}
{r.statut === 'en_examen' && (
  <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>
      {t('ongletReservationsProprio.dossierSoumisPar', { prenom: r.locataire_prenom })}
    </div>

    {/* Documents avec liens de téléchargement */}
    <div style={{ marginBottom: 16 }}>
      {[
        { label: t('ongletReservationsProprio.docs.cni'),    key: 'cni',    url: r.doc_cni_url,    ok: true },
        { label: t('ongletReservationsProprio.docs.emploi'), key: 'emploi', url: r.doc_emploi_url, ok: true },
        { label: t('ongletReservationsProprio.docs.paie'),   key: 'paie',   url: r.doc_paie_url,   ok: Boolean(r.doc_paie_url) },
        { label: t('ongletReservationsProprio.docs.garant'), key: 'garant', url: r.doc_garant_url, ok: Boolean(r.doc_garant_url) },
      ].map(function(d) {
        return (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #F5F5F5' }}>
            <span style={{ flexShrink: 0, display:'flex', alignItems:'center' }}>{d.ok ? <CheckCircle size={18} strokeWidth={1.5} color="#1B6B3A"/> : <Clock size={18} strokeWidth={1.5} color="#888"/>}</span>
            <span style={{ fontSize: 13, color: d.ok ? '#1B2B22' : '#888', flex: 1 }}>{d.label}</span>
            {d.ok && d.url && (
              <a href={'https://werdhe-backend.onrender.com/reservations/' + r.id + '/document/' + d.key + '?token=' + localStorage.getItem('token')}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '5px 12px', borderRadius: 8, background: '#E8F5E9', color: '#1B6B3A', textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '0.5px solid #A5D6A7', flexShrink: 0 }}>
              {t('ongletReservationsProprio.voir')}
              </a>
            )}
            {d.ok && !d.url && (
              <span style={{ fontSize: 11, color: '#1B6B3A', fontWeight: 600 }}>{t('ongletReservationsProprio.soumis')}</span>
            )}
          </div>
        );
      })}
    </div>

    {/* Infos locataire */}
    <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 600 }}>{t('ongletReservationsProprio.infosCandidat.titre')}</div>
      {[
        [t('ongletReservationsProprio.infosCandidat.nomComplet'), r.locataire_prenom + ' ' + r.locataire_nom],
        [t('ongletReservationsProprio.demandeRecue.labels.email'),       r.locataire_email || t('ongletReservationsProprio.na')],
        [t('ongletReservationsProprio.infosCandidat.telephone'),  r.locataire_telephone || t('ongletReservationsProprio.na')],
        [t('ongletReservationsProprio.demandeRecue.labels.logement'),   r.logement_titre],
        [t('ongletReservationsProprio.infosCandidat.loyer'),      GNF(loyer) + '/mois'],
        [t('ongletReservationsProprio.demandeRecue.labels.dateSouhaitee'), r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletReservationsProprio.na')],
        [t('ongletReservationsProprio.demandeRecue.labels.duree'),      r.duree_mois ? t('ongletReservationsProprio.nMois', { n: r.duree_mois }) : t('ongletReservationsProprio.na')],
      ].map(function(row) {
        return (
          <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid #EFEFEF' }}>
            <span style={{ color: '#888' }}>{row[0]}</span>
            <span style={{ fontWeight: 600, color: '#1B2B22' }}>{row[1]}</span>
          </div>
        );
      })}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={function() { action('/decision', { decision: 'acceptee' }, t('ongletReservationsProprio.toastDossierValide')); }}
        style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><CheckCircle size={15} strokeWidth={1.5}/> {t('ongletReservationsProprio.validerDossier')}</span>
      </button>
      <button onClick={function() { action('/decision', { decision: 'dossier_requis' }, t('ongletReservationsProprio.toastInfosComplementaires')); }}
        style={{ background: '#E3F2FD', color: '#1565C0', border: '1px solid #90CAF9', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        <MessageCircle size={14} strokeWidth={1.5} /> {t('ongletReservationsProprio.demanderInfosComplementaires')}
      </button>
      <div style={{ display: 'flex', gap: 10 }}>
        <input type="text" value={motifRefus} onChange={function(e) { setMotifRefus(e.target.value); }}
          placeholder={t('ongletReservationsProprio.motifRefusCourt')}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none' }} />
        <button onClick={function() {
          if (!motifRefus.trim()) { toast.error(t('ongletReservationsProprio.toastIndiquerMotifCourt')); return; }
          action('/decision', { decision: 'refusee', motif: motifRefus }, t('ongletReservationsProprio.toastCandidatureRefuseeCourt'));
        }}
          style={{ background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <XCircle size={14} strokeWidth={1.5} /> {t('ongletReservationsProprio.refuser')}
        </button>
      </div>
    </div>
  </div>
)}

        {/* ─ ÉCHANGES CHAT ─ */}
        {(r.statut === 'acceptee' || r.statut === 'echanges') && (
          <div>
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <span>🎉</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>{t('ongletReservationsProprio.echanges.candidatureAcceptee')}</div>
                <div style={{ fontSize: 12, color: '#2E7D32' }}>{t('ongletReservationsProprio.echanges.discutezConditions')}</div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#1B6B3A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  {((r.locataire_prenom || 'L').charAt(0) + (r.locataire_nom || 'L').charAt(0)).toUpperCase()}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{r.locataire_prenom} {r.locataire_nom}</div>
              </div>
              <div style={{ height: 240, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: '#F8F9F8' }}>
                {msgs.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, paddingTop: 30 }}>{t('ongletReservationsProprio.echanges.commencerDiscussion')}</div>
                )}
                {msgs.map(function(m, i) {
                  var isMoi = m.expedition_id === (user && user.id);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMoi ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: isMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMoi ? '#1B6B3A' : '#fff', color: isMoi ? '#fff' : '#1B2B22', fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        {m.contenu}
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '10px 12px', background: '#fff', borderTop: '0.5px solid #F0F0F0', display: 'flex', gap: 8 }}>
                <input
                  value={newMsg}
                  onChange={function(e) { setNewMsg(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }}
                  placeholder={t('ongletReservationsProprio.echanges.messagePlaceholder')}
                  style={{ flex: 1, padding: '9px 14px', borderRadius: 20, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: '#F8F8F8' }} />
                <button onClick={envoyerMessage} style={{ width: 38, height: 38, borderRadius: '50%', background: '#1B6B3A', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={16} strokeWidth={1.5} /></button>
              </div>
            </div>
          </div>
        )}

        {/* ─ CAUTION EN ATTENTE ─ */}
        {r.statut === 'caution_requise' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Clock size={32} strokeWidth={1.5} color="#888" /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>
              {t('ongletReservationsProprio.cautionEnAttente.enTrainDePayer', { prenom: r.locataire_prenom })}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              {t('ongletReservationsProprio.cautionEnAttente.serezNotifieAvant')}<strong>{new Intl.NumberFormat('fr-FR').format(loyer)} GNF</strong>{t('ongletReservationsProprio.cautionEnAttente.serezNotifieApres')}
            </div>
          </div>
        )}

        {/* ─ CAUTION REÇUE → PRÉPARER LE BAIL ─ */}
        {r.statut === 'caution_payee' && (
          <div>
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <CheckCircle size={32} strokeWidth={1.5} color="#1B6B3A" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>
                  {t('ongletReservationsProprio.cautionRecue.titre', { montant: new Intl.NumberFormat('fr-FR').format(loyer) })}
                </div>
                <div style={{ fontSize: 12, color: '#2E7D32' }}>
                  {t('ongletReservationsProprio.cautionRecue.preparerBail')}
                </div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>
                {t('ongletReservationsProprio.cautionRecue.bailSeraGenere')}
              </div>
              {[
                t('ongletReservationsProprio.cautionRecue.items.identites'),
                t('ongletReservationsProprio.cautionRecue.items.adresse'),
                t('ongletReservationsProprio.cautionRecue.items.loyerMensuel', { montant: new Intl.NumberFormat('fr-FR').format(loyer) }),
                t('ongletReservationsProprio.cautionRecue.items.dateEtDuree'),
                t('ongletReservationsProprio.cautionRecue.items.cautionVersee', { montant: new Intl.NumberFormat('fr-FR').format(loyer) }),
              ].map(function(item) {
                return (
                  <div key={item} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 13, color: '#555' }}>
                    <Check size={14} strokeWidth={1.5} color="#1B6B3A" />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={function() { action('/statut', { statut: 'bail_en_cours' }, t('ongletReservationsProprio.toastBailGenere')); }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {t('ongletReservationsProprio.genererPreparerBail')}
            </button>
          </div>
        )}

        {/* ─ BAIL À SIGNER ─ */}
        {r.statut === 'bail_en_cours' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>{t('ongletReservationsProprio.bailASigner.titre')}</div>
            <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                [t('ongletReservationsProprio.infosCandidat.locataireLabel'), r.locataire_prenom + ' ' + r.locataire_nom],
                [t('ongletReservationsProprio.demandeRecue.labels.logement'), r.logement_titre],
                [t('ongletReservationsProprio.demandeRecue.labels.loyer'), new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF/mois'],
                [t('ongletReservationsProprio.bailASigner.debut'), r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletReservationsProprio.na')],
                [t('ongletReservationsProprio.demandeRecue.labels.duree'), r.duree_mois ? t('ongletReservationsProprio.nMois', { n: r.duree_mois }) : t('ongletReservationsProprio.na')],
                [t('ongletReservationsProprio.bailASigner.caution'), <span key="caution-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{new Intl.NumberFormat('fr-FR').format(loyer)} GNF <Check size={11} strokeWidth={2} color="#1B6B3A" /></span>],
              ].map(function(row) {
                return (
                  <div key={row[0]} style={{ fontSize: 11, color: '#666' }}>
                    <b>{row[0]} :</b> {row[1]}
                  </div>
                );
              })}
            </div>
            <div onClick={function() { if (!bailSigne) setShowSignatureProprio(true); }}
              style={{ padding: 16, border: bailSigne ? '1.5px solid #1B6B3A' : '1.5px dashed #1B6B3A', background: bailSigne ? '#E8F5E9' : '#F0FBF0', borderRadius: 12, textAlign: 'center', cursor: bailSigne ? 'default' : 'pointer', marginBottom: 14 }}>
              {bailSigne ? (
                <div>
                  <CheckCircle size={22} strokeWidth={1.5} color="#1B6B3A" style={{ marginBottom: 4 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B6B3A' }}>{t('ongletReservationsProprio.bailASigner.vousAvezSigne')}</div>
                  <div style={{ fontSize: 12, color: '#2E7D32', marginTop: 4 }}>{t('ongletReservationsProprio.bailASigner.attenteSignatureLocataire')}</div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}><FileSignature size={26} strokeWidth={1.5} color="#1B6B3A" /></div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B6B3A' }}>{t('ongletReservationsProprio.bailASigner.appuyerPourSigner')}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{t('ongletReservationsProprio.bailASigner.signatureSecurisee')}</div>
                </div>
              )}
            </div>
            {showSignatureProprio && (
              <ModalSignatureBail
                nomSuggere={((user && user.prenom) || '') + ' ' + ((user && user.nom) || '')}
                loading={signatureProcessing}
                onClose={function() { if (!signatureProcessing) setShowSignatureProprio(false); }}
                onConfirm={signerBail}
              />
            )}
          </div>
        )}

        {/* ─ EN ATTENTE SIGNATURE LOCATAIRE ─ */}
        {r.statut === 'bail_signe_proprio' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Clock size={32} strokeWidth={1.5} color="#888" /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>
              {t('ongletReservationsProprio.attenteSignature.titre', { prenom: r.locataire_prenom })}
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              {t('ongletReservationsProprio.attenteSignature.description')}
            </div>
          </div>
        )}

        {/* ─ LOCATION ACTIVE ─ */}
        {r.statut === 'confirmee' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}><Key size={14} strokeWidth={1.5} /></div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1B6B3A' }}>{t('ongletReservationsProprio.locationActive.titre')}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
                {t('ongletReservationsProprio.locationActive.occupeVotreLogement', { prenom: r.locataire_prenom, nom: r.locataire_nom })}
              </div>
            </div>
            {[
              [t('ongletReservationsProprio.infosCandidat.locataireLabel'),       r.locataire_prenom + ' ' + r.locataire_nom],
              [t('ongletReservationsProprio.infosCandidat.telephone'),       r.locataire_telephone || t('ongletReservationsProprio.na')],
              [t('ongletReservationsProprio.demandeRecue.labels.logement'),        r.logement_titre],
              [t('ongletReservationsProprio.locationActive.loyerMensuel'),   new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF'],
              [t('ongletReservationsProprio.locationActive.cautionVersee'),  new Intl.NumberFormat('fr-FR').format(loyer) + ' GNF'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#1B2B22' }}>{row[1]}</span>
                </div>
              );
            })}
            <button type="button" onClick={function() { telechargerBailSigne(r.id); }}
              style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 10, border: '1.5px solid #1B6B3A', background: '#fff', color: '#1B6B3A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('ongletReservationsProprio.locationActive.telechargerBail')}
            </button>
          </div>
        )}

        {/* ─ REFUSÉE ─ */}
        {r.statut === 'refusee' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <XCircle size={36} strokeWidth={1.5} color="#B71C1C" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#B71C1C' }}>{t('ongletReservationsProprio.refusee.titre')}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{t('ongletReservationsProprio.refusee.description')}</div>
          </div>
        )}
      </div>
    );
  }

  // ── VUE LISTE ────────────────────────────────────────────────────
  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>{t('ongletReservationsProprio.liste.titre')}</h1><p>{t('ongletReservationsProprio.liste.nbCandidatures', { count: reservations.length })}</p>
        </div>
      </div>

      {actionsRequises.length > 0 && (
        <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} strokeWidth={1.5} color="#B71C1C" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#B71C1C' }}>
              {t('ongletReservationsProprio.liste.actionsRequises', { count: actionsRequises.length })}
            </div>
            <div style={{ fontSize: 12, color: '#C62828' }}>
              {t('ongletReservationsProprio.liste.repondezAuxDemandes')}
            </div>
          </div>
        </div>
      )}

      {reservations.length === 0 && (
        <div className="dash-empty-state">
          <CalendarCheck size={48} strokeWidth={1} color="#C8E6C9" />
          <h3>{t('ongletReservationsProprio.liste.aucuneDemande.titre')}</h3>
          <p>{t('ongletReservationsProprio.liste.aucuneDemande.description')}</p>
        </div>
      )}

      {reservations.map(function(r) {
        var cfg = cfgStatuts[r.statut] || { label: r.statut, couleur: '#888', urgent: false };
        return (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + (cfg.urgent ? '#E53935' : '#1B6B3A') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 38, height: 38, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {((r.locataire_prenom || 'L').charAt(0) + (r.locataire_nom || 'L').charAt(0)).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>
                      {r.locataire_prenom} {r.locataire_nom}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>{r.locataire_telephone}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}><Home size={12} strokeWidth={1.5} /> {r.logement_titre}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A', marginTop: 3 }}>
                  {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || r.montant_total || 0)} GNF/mois
                </div>
              </div>
              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.urgent ? '#FFEBEE' : '#E8F5E9', color: cfg.couleur, flexShrink: 0, marginLeft: 10 }}>
                {cfg.label}
              </span>
            </div>
            {cfg.urgent && (
              <div style={{ background: '#FFF8E1', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: '#7B4F00', fontWeight: 600 }}>
                {t('ongletReservationsProprio.liste.interventionRequise')}
              </div>
            )}
            <button
              onClick={function() { setSelectionne(r); }}
              style={{ width: '100%', background: cfg.urgent ? '#1B6B3A' : '#F0F0F0', color: cfg.urgent ? '#fff' : '#555', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: cfg.urgent ? 700 : 400, cursor: 'pointer' }}>
              {cfg.urgent ? t('ongletReservationsProprio.liste.repondreMaintenant') : t('ongletReservationsProprio.liste.voirLeDetail')}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Paiements
// ================================================

function OngletPaiements(props) {
  var t = useTranslation('dashboard').t;
  var stats = props.stats;
  var user  = props.user;
  var estLocataire = user && user.role === 'locataire';

  // ── VUE LOCATAIRE ─────────────────────────────────────────────
    if (estLocataire) {
    var [paiementsLoc, setPaiementsLoc] = useState([]);
    var [loadPay, setLoadPay]           = useState(true);

    useEffect(function() {
      api.get('/paiements/mes-paiements')
        .then(function(r) { setPaiementsLoc(r.data.paiements || []); })
        .catch(console.error)
        .finally(function() { setLoadPay(false); });
    }, []);

    var paiements = paiementsLoc;
    if (loadPay) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#888', fontSize: 14 }}>{t('ongletPaiementsDash.chargement')}</span>
      </div>
    );
    return (
      <div>
        <div className="dash-page-header">
          <div><h1>{t('ongletPaiementsDash.locataire.titre')}</h1><p>{t('ongletPaiementsDash.locataire.nbPaiements', { count: paiements.length })}</p></div>
        </div>

        {paiements.length === 0 && (
          <div className="dash-empty-state">
            <Banknote size={48} strokeWidth={1} color="#C8E6C9" />
            <h3>{t('ongletPaiementsDash.locataire.aucunPaiement.titre')}</h3>
            <p>{t('ongletPaiementsDash.locataire.aucunPaiement.description')}</p>
          </div>
        )}

        {paiements.map(function(p, i) {
          var statut = p.statut === 'complete' ? { label: t('ongletPaiementsDash.statuts.paye'), color: '#1B6B3A', bg: '#E8F5E9' }
            : p.statut === 'retard'   ? { label: t('ongletPaiementsDash.statuts.enRetard'), color: '#B71C1C', bg: '#FFEBEE' }
            : { label: t('ongletPaiementsDash.statuts.enAttente'), color: '#E65100', bg: '#FFF3E0' };
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid ' + statut.color }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{p.logement_titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                  {p.mode_paiement && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t('ongletPaiementsDash.locataire.via', { mode: p.mode_paiement })}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: statut.color }}>
                    {new Intl.NumberFormat('fr-FR').format(p.montant)} GNF
                  </div>
                  <span style={{ background: statut.bg, color: statut.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'inline-block', marginTop: 4 }}>
                    {statut.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
   );
  }
  // Proprio → déléguer à PaiementsProprietaire
  return <PaiementsProprietaire stats={stats} />;
}

function PaiementsProprietaire(props) {
  var t = useTranslation('dashboard').t;
  var stats = props.stats;
  var [filterStatut, setFilterStatut] = useState('tous');
  var [modal, setModal] = useState(null);
  var [selectedMode, setSelectedMode] = useState('om');
  var [processing, setProcessing] = useState(false);
  var [done, setDone] = useState(false);
  var [biensList, setBiensList] = useState(null);
  var PAY_MODES = [
    { id: 'om', label: t('ongletPaiementsDash.payModes.om.label'), sub: t('ongletPaiementsDash.payModes.om.sub'), color: '#FF6600', text: '#fff', abbr: 'OM' },
    { id: 'mtn', label: t('ongletPaiementsDash.payModes.mtn.label'), sub: t('ongletPaiementsDash.payModes.mtn.sub'), color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
    { id: 'cash', label: t('ongletPaiementsDash.payModes.cash.label'), sub: t('ongletPaiementsDash.payModes.cash.sub'), abbr: 'ESP' },
    { id: 'bank', label: t('ongletPaiementsDash.payModes.bank.label'), sub: t('ongletPaiementsDash.payModes.bank.sub'), abbr: 'VIR' }
  ];
  useEffect(function() {
    var bl = stats.logements.map(function(l) {
      var dp = stats.paiements.find(function(p) { return String(p.logement_id) === String(l.id) && p.statut === 'complete'; });
      var ea = stats.paiements.find(function(p) { return String(p.logement_id) === String(l.id) && p.statut === 'en_attente'; });
      var resaActive = stats.reservations.find(function(r) { return r.logement_id === l.id && r.statut === 'confirmee'; });
return {
  id:            l.id,
  nom:           l.titre,
  locataire:     resaActive ? (resaActive.locataire_prenom + ' ' + resaActive.locataire_nom) : '-',
  reservation_id: resaActive ? resaActive.id : null,
  quartier:      l.ville,
  loyer:         Number(l.prix_mensuel),
  statut:        l.statut === 'loue' ? (dp ? 'paye' : ea ? 'en_retard' : 'impaye') : 'impaye',
  jours:         ea ? 5 : 0,
  icon:          <Home size={24} strokeWidth={1.5} />
};
    });
    if (bl.length === 0) bl = [
      { id: '1', nom: 'Villa Ratoma', locataire: 'Mamadou Diallo', quartier: 'Ratoma', loyer: 2500000, statut: 'en_retard', jours: 12, icon: <Home size={24} strokeWidth={1.5} /> },
      { id: '2', nom: 'Appart Kaloum 2', locataire: 'Fatoumata Camara', quartier: 'Kaloum', loyer: 1800000, statut: 'impaye', jours: 3, icon: <Building2 size={24} strokeWidth={1.5} /> },
      { id: '3', nom: 'Studio Matam', locataire: 'Sekou Konate', quartier: 'Matam', loyer: 900000, statut: 'paye', jours: 0, icon: <Home size={24} strokeWidth={1.5} /> }
    ];
    setBiensList(bl);
  }, [stats]);
  if (!biensList) return null;
  function ouvrirModal(b) { setModal(b); setSelectedMode('om'); setProcessing(false); setDone(false); }
  function fermerModal() { setModal(null); setDone(false); }
  function confirmerPaiement() {
  if (!modal) return;
  setProcessing(true);
    var modeBackend = selectedMode === 'cash' ? 'especes' : 'en_ligne';
  api.post('/paiements', {
    reservation_id: modal.reservation_id,
    montant:        modal.loyer,
    mode_paiement:  modeBackend,
    statut:         'complete'
  })
    .then(function() {
    setProcessing(false);
    setDone(true);
    // Mise à jour immédiate locale
    setBiensList(function(prev) {
      return prev.map(function(b) {
        return b.id === modal.id
          ? Object.assign({}, b, { statut: 'paye', jours: 0 })
          : b;
      });
    });
    // Recharger les vraies données après 1s
    setTimeout(function() {
      api.get('/paiements/proprietaire')
        .then(function(res) {
          var paiementsfrais = res.data.paiements || [];
          setBiensList(function(prev) {
            return prev.map(function(b) {
              var dp = paiementsfrais.find(function(p) {
                return String(p.logement_id) === String(b.id) && p.statut === 'complete';
              });
              var ea = paiementsfrais.find(function(p) {
                return String(p.logement_id) === String(b.id) && p.statut === 'en_attente';
              });
              return Object.assign({}, b, {
                statut: dp ? 'paye' : ea ? 'en_retard' : 'impaye',
                jours:  ea ? 5 : 0,
              });
            });
          });
        })
        .catch(console.warn);
      window.dispatchEvent(new CustomEvent('werdhe:refresh'));
    }, 1000);
  })
  .catch(function(err) {
    setProcessing(false);
    var msg = err.response && err.response.data
      ? err.response.data.erreur
      : t('ongletPaiementsDash.erreurPaiement');
    toast.error(msg);
    console.error('[Paiement]', err);
  });
}
  var totalAttendu = biensList.reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalPercu = biensList.filter(function(b) { return b.statut === 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalImpaye = biensList.filter(function(b) { return b.statut !== 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var tauxRecouv = totalAttendu > 0 ? Math.round(totalPercu / totalAttendu * 100) : 0;
  var moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  var filtered = filterStatut === 'tous' ? biensList : biensList.filter(function(b) { return b.statut === filterStatut; });
  var SCFG = { paye: { label: t('ongletPaiementsDash.statuts.paye'), bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7', bar: '#1B6B3A' }, impaye: { label: t('ongletPaiementsDash.statuts.nonPaye'), bg: '#FFEBEE', color: '#B71C1C', border: '#FFCDD2', bar: '#E53935' }, en_retard: { label: t('ongletPaiementsDash.statuts.enRetard'), bg: '#FFF8E1', color: '#7B4F00', border: '#FFE082', bar: '#C8860A' } };
  return (
    <div style={{fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#1B6B3A',borderRadius:'14px',padding:'14px 18px',marginBottom:'18px'}}>
        <div style={{color:'#fff',fontWeight:'700',fontSize:'16px'}}>{t('ongletPaiementsDash.proprio.titre')}</div>
        <div style={{color:'rgba(255,255,255,.7)',fontSize:'12px',marginTop:'2px'}}>{t('ongletPaiementsDash.proprio.sousTitre', { mois: moisActuel, count: biensList.length })}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'18px'}}>
        {[{label:t('ongletPaiementsDash.proprio.kpi.encaisse'),val:GNF(totalPercu),sub:t('ongletPaiementsDash.proprio.kpi.taux', { taux: tauxRecouv }),bg:'#E8F5E9',border:'#1B6B3A',color:'#1B6B3A'},{label:t('ongletPaiementsDash.proprio.kpi.impayes'),val:GNF(totalImpaye),sub:t('ongletPaiementsDash.proprio.kpi.locataires', { count: biensList.filter(function(b){return b.statut!=='paye';}).length }),bg:'#FFEBEE',border:'#E53935',color:'#C62828'},{label:t('ongletPaiementsDash.proprio.kpi.attendu'),val:GNF(totalAttendu),sub:t('ongletPaiementsDash.proprio.kpi.totalDuMois'),bg:'#F0F4F1',border:'#888',color:'#333'}].map(function(k){return(<div key={k.label} style={{background:k.bg,borderRadius:'12px',padding:'12px 14px',borderLeft:'3px solid '+k.border}}><div style={{fontSize:'11px',color:k.color,marginBottom:'4px'}}>{k.label}</div><div style={{fontSize:'15px',fontWeight:'700',color:k.color}}>{k.val}</div><div style={{fontSize:'10px',color:k.color,marginTop:'2px',opacity:0.7}}>{k.sub}</div></div>);})}
      </div>
      <div style={{background:'#fff',borderRadius:'12px',padding:'14px 16px',marginBottom:'16px',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span style={{fontSize:'13px',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.tauxRecouvrement')}</span><span style={{fontSize:'13px',fontWeight:'700',color:'#1B6B3A'}}>{tauxRecouv}%</span></div>
        <div style={{background:'#F0F0F0',borderRadius:'6px',height:'10px',overflow:'hidden'}}><div style={{background:'linear-gradient(90deg,#1B6B3A,#34A853)',width:tauxRecouv+'%',height:'100%',borderRadius:'6px',transition:'width .5s'}}/></div>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
        {[['tous',t('ongletPaiementsDash.proprio.filtres.tous'),'#1B6B3A'],['paye',t('ongletPaiementsDash.proprio.filtres.payes'),'#1B6B3A'],['impaye',t('ongletPaiementsDash.proprio.filtres.nonPayes'),'#C62828'],['en_retard',t('ongletPaiementsDash.proprio.filtres.enRetard'),'#C8860A']].map(function(f){return(<button key={f[0]} type="button" onClick={function(){setFilterStatut(f[0]);}} style={{padding:'7px 16px',borderRadius:'20px',fontSize:'12px',cursor:'pointer',border:filterStatut===f[0]?'1.5px solid '+f[2]:'0.5px solid #E0E0E0',background:filterStatut===f[0]?f[2]:'#fff',color:filterStatut===f[0]?'#fff':'#666',fontWeight:filterStatut===f[0]?700:400}}>{f[1]}</button>);})}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
        {filtered.length===0&&<div style={{textAlign:'center',padding:'30px',color:'#888'}}>{t('ongletPaiementsDash.proprio.aucunBien')}</div>}
        {filtered.map(function(b){var s=SCFG[b.statut]||SCFG.impaye;return(<div key={b.id} style={{background:'#fff',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(0,0,0,.04)',borderLeft:'4px solid '+s.bar}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{display:'flex',gap:'10px',alignItems:'center'}}><div style={{width:'40px',height:'40px',background:'#F0F4F1',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{b.icon}</div><div><div style={{fontWeight:'700',fontSize:'14px',color:'#1B2B22'}}>{b.nom}</div><div style={{fontSize:'12px',color:'#888'}}>{b.locataire} · {b.quartier}</div></div></div>
            <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',background:s.bg,color:s.color,border:'0.5px solid '+s.border}}>{s.label}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
            <div style={{background:'#F8F8F8',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'#888'}}>{t('ongletPaiementsDash.proprio.loyerMensuel')}</div><div style={{fontSize:'14px',fontWeight:'700',color:'#1B6B3A'}}>{GNF(b.loyer)}</div></div>
            <div style={{background:'#F8F8F8',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'#888'}}>{t('ongletPaiementsDash.proprio.situation')}</div><div style={{fontSize:'13px',fontWeight:'600',color:s.color}}>{b.statut==='paye'?t('ongletPaiementsDash.proprio.payeCeMois'):b.statut==='en_retard'?t('ongletPaiementsDash.proprio.retardJours', { jours: b.jours }):t('ongletPaiementsDash.proprio.nonPaye')}</div></div>
          </div>
          {b.statut==='paye'?(<div style={{display:'flex',gap:'8px'}}><button type="button" style={{flex:1,background:'#F0F4F1',color:'#1B6B3A',border:'0.5px solid #A5D6A7',borderRadius:'10px',padding:'9px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.voirQuittance')}</button><button type="button" style={{flex:1,background:'#F5F5F5',color:'#555',border:'0.5px solid #E0E0E0',borderRadius:'10px',padding:'9px',fontSize:'13px',cursor:'pointer'}}>{t('ongletPaiementsDash.proprio.contacter')}</button></div>):(<div style={{display:'flex',gap:'8px'}}><button type="button" onClick={function(){ouvrirModal(b);}} style={{flex:2,background:'#1B6B3A',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{t('ongletPaiementsDash.proprio.enregistrerPaiement')}</button><button type="button" style={{flex:1,background:'#FFEBEE',color:'#B71C1C',border:'0.5px solid #FFCDD2',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.relancer')}</button></div>)}
        </div>);})}
      </div>
      {modal&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'flex-end',zIndex:1000}} onClick={function(e){if(e.target===e.currentTarget)fermerModal();}}>
        <div style={{background:'#fff',borderRadius:'20px 20px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:'600px',margin:'0 auto',maxHeight:'90vh',overflowY:'auto'}}>
          {!done?(<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><div><div style={{fontSize:'16px',fontWeight:'700'}}>{t('ongletPaiementsDash.modal.titre')}</div><div style={{fontSize:'12px',color:'#888'}}>{modal.nom} · {modal.locataire}</div></div><button type="button" onClick={fermerModal} style={{width:'32px',height:'32px',borderRadius:'50%',border:'none',background:'#F5F5F5',cursor:'pointer'}}>x</button></div>
            <div style={{background:'#F0F4F1',borderRadius:'12px',padding:'14px',marginBottom:'18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:'12px',color:'#555'}}>{t('ongletPaiementsDash.proprio.loyerMensuel')}</div></div><div style={{fontSize:'22px',fontWeight:'700',color:'#1B6B3A'}}>{GNF(modal.loyer)}</div></div>
            <div style={{fontSize:'13px',fontWeight:'700',marginBottom:'12px'}}>{t('ongletPaiementsDash.modal.modePaiement')}</div>
            {PAY_MODES.map(function(p){return(<div key={p.id} onClick={function(){setSelectedMode(p.id);}} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',border:selectedMode===p.id?'2px solid #1B6B3A':'0.5px solid #E0E0E0',background:selectedMode===p.id?'#E8F5E9':'#fff',borderRadius:'12px',marginBottom:'8px',cursor:'pointer'}}><div style={{width:'40px',height:'40px',background:p.color||'#E8F5E9',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:p.icon?'20px':'13px',fontWeight:'700',color:p.text||'#1B6B3A'}}>{p.icon||p.abbr}</div><div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'600'}}>{p.label}</div><div style={{fontSize:'11px',color:'#888'}}>{p.sub}</div></div><div style={{width:'22px',height:'22px',borderRadius:'50%',border:selectedMode===p.id?'none':'1.5px solid #E0E0E0',background:selectedMode===p.id?'#1B6B3A':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedMode===p.id&&<Check size={12} strokeWidth={2} color="#fff" />}</div></div>);})}
            <button type="button" onClick={confirmerPaiement} disabled={processing} style={{width:'100%',background:processing?'#999':'#1B6B3A',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'700',cursor:processing?'not-allowed':'pointer',marginTop:'6px'}}>{processing?t('ongletPaiementsDash.modal.traitementEnCours'):t('ongletPaiementsDash.modal.confirmer', { montant: GNF(modal.loyer) })}</button>
          </div>):(<div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{width:'70px',height:'70px',background:'#E8F5E9',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'36px'}}><CheckCircle size={36} strokeWidth={1.5} color="#1B6B3A"/></div>
            <div style={{fontSize:'20px',fontWeight:'700',color:'#1B6B3A',marginBottom:'8px'}}>{t('ongletPaiementsDash.modal.succes.titre')}</div>
            <div style={{fontSize:'13px',color:'#666',marginBottom:'20px'}}>{t('ongletPaiementsDash.modal.succes.description')}</div>
            <div style={{display:'flex',gap:'10px'}}><button type="button" style={{flex:1,background:'#F0F4F1',color:'#1B6B3A',border:'0.5px solid #A5D6A7',borderRadius:'10px',padding:'12px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.voirQuittance')}</button><button type="button" onClick={fermerModal} style={{flex:1,background:'#1B6B3A',color:'#fff',border:'none',borderRadius:'10px',padding:'12px',fontSize:'13px',cursor:'pointer',fontWeight:'700'}}>{t('ongletPaiementsDash.modal.retour')}</button></div>
          </div>)}
        </div>
      </div>)}
    </div>
  );
}

function PaiementsLocataire(props) {
  var t = useTranslation('dashboard').t;
  var stats = props.stats;
  var PAY_MODES = [
    { id: 'om', label: t('ongletPaiementsDash.payModes.om.label'), sub: t('ongletPaiementsDash.payModes.om.sub'), color: '#FF6600', text: '#fff', abbr: 'OM' },
    { id: 'mtn', label: t('ongletPaiementsDash.payModes.mtn.label'), sub: t('ongletPaiementsDash.payModes.mtn.sub'), color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
    { id: 'cash', label: t('ongletPaiementsDash.payModes.cash.label'), sub: t('ongletPaiementsDash.payModes.cash.sub'), abbr: 'ESP' },
    { id: 'bank', label: t('ongletPaiementsDash.payModes.bank.label'), sub: t('ongletPaiementsDash.payModes.bank.sub'), abbr: 'VIR' }
  ];
  var [nbMois, setNbMois] = useState(1);
  var [mode, setMode] = useState('om');
  var [stepPay, setStepPay] = useState('select');
  var [logement, setLogement] = useState(null);
  useEffect(function() {
    var r = (stats.reservations||[]).find(function(r){return r.statut==='confirmee';});
    if(r){setLogement({nom:r.logement_titre||t('ongletPaiementsDash.locataireLegacy.monLogement'),proprio:(r.proprietaire_prenom||'')+' '+(r.proprietaire_nom||''),propIni:((r.proprietaire_prenom||'').charAt(0)+(r.proprietaire_nom||'').charAt(0)).toUpperCase()||'P',quartier:r.logement_ville||'Conakry',loyer:Number(r.prix_mensuel)||0,debut:r.date_debut?new Date(r.date_debut).toLocaleDateString('fr-FR'):'-',fin:r.date_fin?new Date(r.date_fin).toLocaleDateString('fr-FR'):'-'});}
    else{setLogement({nom:'Appartement F3 - Ratoma',proprio:'Mamadou Barry',propIni:'MB',quartier:'Ratoma, Conakry',loyer:1500000,debut:'1 juillet 2025',fin:'30 juin 2026'});}
  }, [stats]);
  if (!logement) return null;
  var addMonths = function(n){var d=new Date();d.setMonth(d.getMonth()+n);return d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});};
  var moisActuel = new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  var total = logement.loyer * nbMois;
  var historique = (stats.paiements||[]).slice(0,3).map(function(p){return{mois:new Date(p.created_at).toLocaleDateString('fr-FR',{month:'long',year:'numeric'}),montant:Number(p.montant),mode:p.mode_paiement==='en_ligne'?t('ongletPaiementsDash.locataireLegacy.enLigne'):t('ongletPaiementsDash.locataireLegacy.especes')};});
  if(historique.length===0){historique=[{mois:t('ongletPaiementsDash.locataireLegacy.moisPrecedent'),montant:logement.loyer,mode:'Orange Money'},{mois:t('ongletPaiementsDash.locataireLegacy.ilYA2Mois'),montant:logement.loyer,mode:t('ongletPaiementsDash.locataireLegacy.especes')},{mois:t('ongletPaiementsDash.locataireLegacy.ilYA3Mois'),montant:logement.loyer,mode:'MTN MoMo'}];}
  return (
    <div style={{fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'#1A4FA0',borderRadius:'14px',padding:'16px 18px',marginBottom:'18px'}}><div style={{color:'#fff',fontWeight:'700',fontSize:'16px'}}>{t('ongletPaiementsDash.locataireLegacy.mesPaiements')}</div><div style={{color:'rgba(255,255,255,.75)',fontSize:'12px',marginTop:'2px'}}>{moisActuel}</div></div>
      <div style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'14px',boxShadow:'0 2px 10px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'14px'}}>
          <div style={{width:'52px',height:'52px',background:'#E3F2FD',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}><Building2 size={26} strokeWidth={1.5} color="#1565C0" /></div>
          <div style={{flex:1}}><div style={{fontWeight:'700',fontSize:'14px',color:'#1B2B22'}}>{logement.nom}</div><div style={{fontSize:'12px',color:'#888',marginTop:'2px',display:'flex',alignItems:'center',gap:4}}><MapPin size={11} strokeWidth={1.5} /> {logement.quartier}</div><div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px'}}><div style={{width:'26px',height:'26px',background:'#1B6B3A',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'10px',fontWeight:'700'}}>{logement.propIni}</div><span style={{fontSize:'12px',color:'#555'}}>{logement.proprio}</span></div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:'16px',fontWeight:'700',color:'#1A4FA0'}}>{GNF(logement.loyer)}</div><div style={{fontSize:'10px',color:'#888'}}>/ mois</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
          {[[t('ongletPaiementsDash.locataireLegacy.debut'),logement.debut],[t('ongletPaiementsDash.locataireLegacy.fin'),logement.fin],[t('ongletPaiementsDash.locataireLegacy.caution'),GNF(logement.loyer)]].map(function(row){return <div key={row[0]} style={{background:'#F8F8F8',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'#888'}}>{row[0]}</div><div style={{fontSize:'11px',fontWeight:'600',color:'#333',marginTop:'2px'}}>{row[1]}</div></div>;})}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:stepPay==='success'?'#E8F5E9':'#FFEBEE',borderRadius:'10px',marginBottom:'14px',border:'0.5px solid '+(stepPay==='success'?'#A5D6A7':'#FFCDD2')}}>
          <div><div style={{fontSize:'13px',fontWeight:'700',color:stepPay==='success'?'#1B6B3A':'#B71C1C'}}>{stepPay==='success'?t('ongletPaiementsDash.locataireLegacy.loyerPaye', { mois: moisActuel }):t('ongletPaiementsDash.locataireLegacy.loyerImpaye', { mois: moisActuel })}</div><div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{stepPay==='success'?t('ongletPaiementsDash.locataireLegacy.quittanceEnvoyee'):t('ongletPaiementsDash.locataireLegacy.duDepuis3Jours')}</div></div>
          <div style={{fontSize:'16px',fontWeight:'700',color:stepPay==='success'?'#1B6B3A':'#C62828'}}>{GNF(logement.loyer)}</div>
        </div>
        <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'8px'}}>{t('ongletPaiementsDash.locataireLegacy.historiqueRecent')}</div>
        {historique.map(function(h,i){return(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'#F8F8F8',borderRadius:'8px',marginBottom:'6px'}}><div><div style={{fontSize:'12px',fontWeight:'600'}}>{h.mois}</div><div style={{fontSize:'11px',color:'#888'}}>{h.mode}</div></div><div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'12px',fontWeight:'700',color:'#1B6B3A'}}>{GNF(h.montant)}</span><span style={{background:'#E8F5E9',color:'#1B5E20',padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:'700'}}>{t('ongletPaiementsDash.locataireLegacy.paye')}</span></div></div>);})}
      </div>
      {stepPay!=='success'?(<div style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'14px',boxShadow:'0 2px 10px rgba(0,0,0,.06)'}}>
        <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>{t('ongletPaiementsDash.locataireLegacy.effectuerPaiement')}</div>
        <div style={{marginBottom:'18px'}}>
          <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'10px'}}>{t('ongletPaiementsDash.locataireLegacy.nbMoisAPayer')}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginBottom:'10px'}}>
            {[[1,t('ongletPaiementsDash.locataireLegacy.unMois')],[2,t('ongletPaiementsDash.delaiMois', { n: 2 })],[3,t('ongletPaiementsDash.delaiMois', { n: 3 })],[6,t('ongletPaiementsDash.delaiMois', { n: 6 })],[12,t('ongletPaiementsDash.locataireLegacy.unAn')]].map(function(opt){return(<button key={opt[0]} type="button" onClick={function(){setNbMois(opt[0]);}} style={{padding:'10px 4px',borderRadius:'10px',fontSize:'13px',cursor:'pointer',border:nbMois===opt[0]?'2px solid #1A4FA0':'0.5px solid #E0E0E0',background:nbMois===opt[0]?'#E3F2FD':'#FAFAFA',color:nbMois===opt[0]?'#0D47A1':'#555',fontWeight:nbMois===opt[0]?700:400}}>{opt[1]}</button>);})}
          </div>
          <div style={{background:'#E3F2FD',borderRadius:'10px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:'12px',color:'#0D47A1',fontWeight:'600'}}>{t('ongletPaiementsDash.locataireLegacy.periodeCouverte')}</div><div style={{fontSize:'11px',color:'#1565C0',marginTop:'2px'}}>{t('ongletPaiementsDash.locataireLegacy.moisVers', { debut: moisActuel, fin: addMonths(nbMois-1) })}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:'11px',color:'#888'}}>{nbMois} x {GNF(logement.loyer)}</div><div style={{fontSize:'18px',fontWeight:'700',color:'#1A4FA0'}}>{GNF(total)}</div></div>
          </div>
        </div>
        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'10px'}}>{t('ongletPaiementsDash.modal.modePaiement')}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {PAY_MODES.map(function(p){return(<div key={p.id} onClick={function(){setMode(p.id);}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 12px',cursor:'pointer',border:mode===p.id?'2px solid #1A4FA0':'0.5px solid #E0E0E0',background:mode===p.id?'#E3F2FD':'#fff',borderRadius:'10px'}}><div style={{width:'34px',height:'34px',background:p.color||'#E8F5E9',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:p.icon?'18px':'11px',fontWeight:'700',color:p.text||'#1B6B3A',flexShrink:0}}>{p.icon||p.abbr}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'12px',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.label}</div><div style={{fontSize:'10px',color:'#888'}}>{p.sub}</div></div>{mode===p.id&&<Check size={14} strokeWidth={2} color="#1A4FA0" style={{flexShrink:0}} />}</div>);})}
          </div>
        </div>
        <div style={{background:'#F8F8F8',borderRadius:'10px',padding:'12px 14px',marginBottom:'14px'}}>
          <div style={{fontSize:'12px',fontWeight:'600',marginBottom:'8px'}}>{t('ongletPaiementsDash.locataireLegacy.recapitulatif')}</div>
          {[[t('ongletPaiementsDash.locataireLegacy.bien'),logement.nom],[t('ongletPaiementsDash.locataireLegacy.moisPayes'),t('ongletPaiementsDash.delaiMois', { n: nbMois })],[t('ongletPaiementsDash.locataireLegacy.mode'),(PAY_MODES.find(function(p){return p.id===mode;})||{}).label],[t('ongletPaiementsDash.locataireLegacy.total'),GNF(total)]].map(function(row){return(<div key={row[0]} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'4px 0',borderBottom:'0.5px solid #EFEFEF'}}><span style={{color:'#888'}}>{row[0]}</span><span style={{fontWeight:'600',color:row[0]===t('ongletPaiementsDash.locataireLegacy.total')?'#1A4FA0':'#333'}}>{row[1]}</span></div>);})}
        </div>
        <button type="button" onClick={function(){setStepPay('success');toast.success(t('ongletPaiementsDash.locataireLegacy.toastPaiementEffectue'));}} style={{width:'100%',background:'#1A4FA0',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'700',cursor:'pointer'}}>{t('ongletPaiementsDash.locataireLegacy.confirmerMontant', { montant: GNF(total) })}</button>
      </div>):(<div style={{background:'#E8F5E9',borderRadius:'14px',padding:'20px',textAlign:'center',boxShadow:'0 2px 10px rgba(0,0,0,.06)'}}><div style={{fontSize:'40px',marginBottom:'10px'}}>🎉</div><div style={{fontSize:'16px',fontWeight:'700',color:'#1B6B3A',marginBottom:'6px'}}>{t('ongletPaiementsDash.locataireLegacy.paiementEffectue')}</div><div style={{fontSize:'13px',color:'#2E7D32',marginBottom:'16px'}}>{t('ongletPaiementsDash.locataireLegacy.recapSucces', { montant: GNF(total), n: nbMois })}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}><button type="button" style={{background:'#fff',color:'#1B6B3A',border:'0.5px solid #A5D6A7',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.voirQuittance')}</button><button type="button" onClick={function(){setStepPay('select');setNbMois(1);}} style={{background:'#1B6B3A',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer',fontWeight:'700'}}>{t('ongletPaiementsDash.modal.retour')}</button></div></div>)}
    </div>
  );
}

// ================================================
// ONGLET : Preavis
// ================================================

function OngletPreavis(props) {
  var t = useTranslation('dashboard').t;
  var [renouvellements, setRenouvellements] = useState([]);

useEffect(function() {
  if (user && user.role === 'locataire') {
    api.get('/renouvellements/en-attente')
      .then(function(res) { setRenouvellements(res.data.renouvellements || []); })
      .catch(console.error);
  }
}, [user]);

function repondreRenouvellement(id, reponse) {
  api.patch('/renouvellements/' + id + '/repondre', { reponse: reponse })
    .then(function() {
      toast.success(reponse === 'accepte' ? t('ongletPreavisDash.renouvellementAccepte') : t('ongletPreavisDash.renouvellementRefuse'));
      setRenouvellements(function(prev) { return prev.filter(function(r) { return r.id !== id; }); });
    })
    .catch(function(err) { toast.error(err.response?.data?.erreur || t('ongletPreavisDash.erreur')); });
}
  var user      = props.user;
  var setOnglet = props.setOnglet;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');
  var [step, setStep]       = useState('form');
  var [motif, setMotif]     = useState('');
  var [delai, setDelai]     = useState('');
  var [note, setNote]       = useState('');
  var [bien, setBien]       = useState(null);
  var [biens, setBiens]     = useState([]);
  var [reservation, setReservation] = useState(null);
  var [resultat, setResultat] = useState(null);
  var [loading, setLoading] = useState(false);
  var [preavisRecus, setPreavisRecus]   = useState([]);      
  var [reponseModal, setReponseModal]   = useState(null);     
  var [messageReponse, setMessageReponse] = useState('');     
  var [reponseLoading, setReponseLoading] = useState(false);  

  var addDays = function(n) {
    var d = new Date(); d.setDate(d.getDate() + n);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  var motifsKeysProprio = ['venteBien', 'repriseUsagePersonnel', 'travauxRenovation', 'nonPaiementRepete', 'troublesVoisinage', 'finBailNonRenouvele', 'autreMotif'];
  var motifsKeysLocataire = ['changementVille', 'achatBien', 'logementInadapte', 'raisonsProfessionnelles', 'raisonsFamiliales', 'conditionsInsatisfaisantes', 'autreRaison'];
  var tFr = i18n.getFixedT('fr', 'dashboard');
  var motifsList = (estProprietaire ? motifsKeysProprio : motifsKeysLocataire).map(function(k) {
    return { value: tFr('ongletPreavisDash.motifs.' + k), label: t('ongletPreavisDash.motifs.' + k) };
  });

  useEffect(function() {
    if (estProprietaire) {
      api.get('/reservations/proprietaire')
        .then(function(res) {
          setBiens((res.data.reservations || []).filter(function(r) { return r.statut === 'confirmee'; }));
        }).catch(console.error);
    } else {
      api.get('/reservations/mes-reservations')
        .then(function(res) {
          setReservation((res.data.reservations || []).find(function(r) { return r.statut === 'confirmee'; }));
        }).catch(console.error);
    }
  }, [estProprietaire]);


useEffect(function() {
  api.get('/preavis/recus')
    .then(function(res) { setPreavisRecus(res.data.preavis || []); })
    .catch(console.error);
}, []);

function repondre(preavisId, reponse) {
  setReponseLoading(true);
  api.patch('/preavis/' + preavisId + '/repondre', {
    reponse:  reponse,
    message:  messageReponse
  })
    .then(function() {
      toast.success(reponse === 'accepte' ? 'Préavis accepté !' : 'Demande de renouvellement envoyée !');
      setReponseModal(null);
      setMessageReponse('');
      setPreavisRecus(function(prev) { return prev.filter(function(p) { return p.id !== preavisId; }); });
    })
    .catch(function(err) {
      toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur');
    })
    .finally(function() { setReponseLoading(false); });
}
  function envoyer() {
    var reservationId = estProprietaire ? (bien && bien.id) : (reservation && reservation.id);
    
    console.log('=== PREAVIS DEBUG ===');
    console.log('reservationId:', reservationId);
    console.log('motif:', motif);
    console.log('delai:', delai);
    console.log('type:', estProprietaire ? 'proprietaire' : 'locataire');
    console.log('reservation:', reservation);
    if (!reservationId) { toast.error(t('ongletPreavisDash.toastAucuneReservation')); return; }
    setLoading(true);
    api.post('/preavis', {
      reservation_id: reservationId,
      motif:          motif,
      delai_mois:     parseInt(delai),
      note:           note,
      type:           estProprietaire ? 'proprietaire' : 'locataire'
    })
    .then(function(res) {
      setResultat(res.data);
      setStep('sent');
      toast.success(t('ongletPreavisDash.toastPreavisEnvoye'));
    })
    .catch(function(err) {
      toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletPreavisDash.toastErreurEnvoi'));
    })
    .finally(function() { setLoading(false); });
  }
  function telechargerPDF() {
    // Générer et télécharger le document préavis
    api.get('/documents?type=preavis')
      .then(function(res) {
        var docs = res.data.documents || [];
        if (docs.length > 0) {
          var doc = docs[0];
          return api.get('/documents/' + doc.id + '/telecharger', { responseType: 'blob' })
            .then(function(r) {
              var url  = window.URL.createObjectURL(new Blob([r.data], { type: 'text/html' }));
              var link = document.createElement('a');
              link.href = url;
              link.download = 'Preavis_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.html';
              document.body.appendChild(link);
              link.click();
              link.remove();
              toast.success(t('ongletPreavisDash.toastPdfTelecharge'));
            });
        } else {
          // Générer un PDF minimal depuis les données locales
          var contenu = `
            <html><head><meta charset="UTF-8"><title>${t('ongletPreavisDash.pdf.titre')}</title>
            <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto}
            h1{color:#1B6B3A}.box{background:#FFF8E1;border:1px solid #FFE082;border-radius:8px;padding:16px;margin:16px 0}
            .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid #FFE082;font-size:14px}</style></head>
            <body>
              <h1>${t('ongletPreavisDash.pdf.entete')}</h1>
              <p>${t('ongletPreavisDash.pdf.date', { date: new Date().toLocaleDateString('fr-FR') })}</p>
              <div class="box">
                <div class="row"><span>${t('ongletPreavisDash.pdf.motif')}</span><b>${motif}</b></div>
                <div class="row"><span>${t('ongletPreavisDash.pdf.delai')}</span><b>${t('ongletPaiementsDash.delaiMois', { n: delai })}</b></div>
                <div class="row"><span>${t('ongletPreavisDash.pdf.dateSortieEstimee')}</span><b>${addDays(parseInt(delai) * 30)}</b></div>
              </div>
              ${note ? '<p style="font-style:italic">"' + note + '"</p>' : ''}
              <p>${t('ongletPreavisDash.pdf.genereParWerdhe')}</p>
            </body></html>
          `;
          var blob = new Blob([contenu], { type: 'text/html' });
          var url  = window.URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'Preavis_Werdhe.html';
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success(t('ongletPreavisDash.toastPreavisTelecharge'));
        }
      })
      .catch(function() { toast.error(t('ongletPreavisDash.toastErreurTelechargement')); });
  }
  function contacter() {
    if (setOnglet) setOnglet('/dashboard/messages');
    else window.location.href = '/dashboard/messages';
  }
  return (
    <div>
      {/* ── PROPOSITIONS DE RENOUVELLEMENT (locataire) ── */}
      {renouvellements.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1565C0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} strokeWidth={1.5} /> {t('ongletPreavisDash.renouv.titre', { count: renouvellements.length })}
          </div>
          {renouvellements.map(function(rn) {
            return (
              <div key={rn.id} style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #1565C0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} strokeWidth={1.5} /> {rn.logement_titre}
                </div>
                <div style={{ background: '#E3F2FD', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  {[
                    [t('ongletPreavisDash.renouv.proposePar'), rn.prop_prenom + ' ' + rn.prop_nom],
                    [t('ongletPreavisDash.renouv.duree'), t('ongletPreavisDash.renouv.moisSupplementaires', { n: rn.nouvelle_duree_mois })],
                    [t('ongletPreavisDash.renouv.nouveauLoyer'), rn.nouveau_prix ? new Intl.NumberFormat('fr-FR').format(rn.nouveau_prix) + ' GNF/mois' : t('ongletPreavisDash.renouv.inchange')],
                    [t('ongletPreavisDash.renouv.recuLe'), new Date(rn.created_at).toLocaleDateString('fr-FR')],
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid #BBDEFB' }}>
                        <span style={{ color: '#888' }}>{row[0]}</span>
                        <span style={{ fontWeight: 600, color: '#1565C0' }}>{row[1]}</span>
                      </div>
                    );
                  })}
                  {rn.message && <div style={{ fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' }}>"{rn.message}"</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button onClick={function() { repondreRenouvellement(rn.id, 'refuse'); }}
                    style={{ padding: 12, borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {t('ongletPreavisDash.renouv.refuser')}
                  </button>
                  <button onClick={function() { repondreRenouvellement(rn.id, 'accepte'); }}
                    style={{ padding: 12, borderRadius: 10, border: 'none', background: '#1565C0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {t('ongletPreavisDash.renouv.accepter')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="dash-page-header">
        <div>
          <span style={{display:'flex',alignItems:'center',gap:5}}><Send size={14} strokeWidth={1.5}/> {t('ongletPreavisDash.titre')}</span>
          <p>{estProprietaire ? t('ongletPreavisDash.notifierLocataire') : t('ongletPreavisDash.notifierProprietaire')}</p>
        </div>
        {step !== 'form' && (
          <button className="btn-outline-green" onClick={function() { setStep('form'); setMotif(''); setDelai(''); setNote(''); setBien(null); setResultat(null); }}>
            {t('ongletPreavisDash.nouveauPreavis')}
          </button>
        )}
      </div>

      {/* ── ÉCRAN ENVOYÉ ─────────────────────────────────────── */}
      {step === 'sent' && resultat && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, background: estProprietaire ? '#FFF3E0' : '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 32 }}>
              {estProprietaire ? <Send size={32} strokeWidth={1.5}/> : <CheckCircle size={32} strokeWidth={1.5}/>}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: estProprietaire ? '#C62828' : '#1B6B3A', marginBottom: 8 }}>
              {estProprietaire ? t('ongletPreavisDash.sent.titreOfficiel') : t('ongletPreavisDash.sent.titre')}
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              {estProprietaire
                ? <span><b>{resultat.dest_prenom} {resultat.dest_nom}</b> {t('ongletPreavisDash.sent.notifieSmsEmail')}<b>48h</b>{t('ongletPreavisDash.sent.pourAccuserReception')}</span>
                : <span>{t('ongletPreavisDash.sent.proprioNotifie')}<b>48h</b>{t('ongletPreavisDash.sent.pourAccuserReception')}</span>
              }
            </div>
          </div>

          {/* Récap préavis */}
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7B4F00', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={14} strokeWidth={1.5} /> {estProprietaire ? t('ongletPreavisDash.sent.recapTitreProprio') : t('ongletPreavisDash.sent.recapTitreLocataire')}</div>
            {[
              estProprietaire ? [t('ongletPreavisDash.sent.bien'), bien && bien.logement_titre] : [t('ongletReservationsProprio.demandeRecue.labels.logement'), reservation && reservation.logement_titre],
              estProprietaire ? [t('ongletPreavisDash.sent.locataireNotifie'), resultat.dest_prenom + ' ' + resultat.dest_nom] : null,
              estProprietaire ? [t('ongletPreavisDash.sent.contact'), resultat.dest_tel || t('ongletReservationsProprio.na')] : null,
              [t('ongletPreavisDash.sent.motif'), motif],
              [estProprietaire ? t('ongletPreavisDash.sent.delaiAccorde') : t('ongletPreavisDash.sent.delaiDePreavis'), t('ongletPaiementsDash.delaiMois', { n: delai })],
              [t('ongletPreavisDash.sent.dateSortieEstimee'), resultat.date_sortie || addDays(parseInt(delai) * 30)],
              [t('ongletPreavisDash.sent.statut'), t('ongletPreavisDash.sent.enAttenteAccuse')],
            ].filter(Boolean).map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#7B4F00', textAlign: 'right' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          {/* Info suite */}
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#1B5E20', display: 'flex', gap: 6 }}>
            <Info size={14} strokeWidth={1.5} />
            <span style={{ lineHeight: 1.5 }}>
              {estProprietaire
                ? t('ongletPreavisDash.sent.infoProprio', { n: delai })
                : t('ongletPreavisDash.sent.infoLocataire')}
            </span>
          </div>

          {/* Boutons actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={contacter}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: '#F5F5F5', color: '#555', border: '0.5px solid #E0E0E0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <MessageCircle size={14} strokeWidth={1.5} /> {estProprietaire ? t('ongletPreavisDash.sent.contacterLocataire') : t('ongletPreavisDash.sent.contacterProprio')}
            </button>
            <button onClick={telechargerPDF}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, background: estProprietaire ? '#C62828' : '#1B6B3A', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <FileText size={14} strokeWidth={1.5} /> {t('ongletPreavisDash.sent.telechargerPdf')}
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION AVANT ENVOI ─────────────────────────── */}
      {step === 'confirm' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}><span style={{display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={15} strokeWidth={1.5}/> {t('ongletPreavis.confirmerEnvoiTitre')}</span></div>
          <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: '#B71C1C', fontWeight: 600 }}>
            {t('ongletPreavisDash.confirm.actionIrreversible')}
          </div>
          {[
            estProprietaire ? [t('ongletPreavisDash.sent.bien'), bien && bien.logement_titre] : [t('ongletReservationsProprio.demandeRecue.labels.logement'), reservation && reservation.logement_titre],
            [t('ongletPreavisDash.sent.motif'), motif],
            [t('ongletPreavis.locataire.confirm.labels.delai'), t('ongletPaiementsDash.delaiMois', { n: delai })],
            [t('ongletPreavisDash.sent.dateSortieEstimee'), addDays(parseInt(delai) * 30)],
            note ? [t('ongletPreavisDash.confirm.message'), note] : null,
          ].filter(Boolean).map(function(row) {
            return (
              <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '0.5px solid #f0f0f0', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: '#888' }}>{row[0]}</span>
                <span style={{ fontWeight: 600, color: '#333', textAlign: 'right', maxWidth: '60%' }}>{row[1]}</span>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={function() { setStep('form'); }}
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer' }}>{t('ongletPreavis.modifier')}</button>
            <button onClick={envoyer} disabled={loading}
              style={{ flex: 2, background: loading ? '#999' : (estProprietaire ? '#C62828' : '#1B6B3A'), color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? t('ongletPreavisDash.confirm.envoiEnCours') : <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><Send size={14} strokeWidth={1.5}/> {t('ongletPreavisDash.confirm.envoyerOfficiel')}</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── PRÉAVIS REÇUS ─────────────────────────────────────── */}
{preavisRecus.length > 0 && (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#B71C1C', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Inbox size={16} strokeWidth={1.5} /> {t('ongletPreavisDash.recus.titre', { count: preavisRecus.length, s: preavisRecus.length > 1 ? 's' : '' })}
    </div>
    {preavisRecus.map(function(p) {
      var dateSortie = p.date_sortie_estimee ? new Date(p.date_sortie_estimee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : t('ongletReservationsProprio.na');
      var maintenant = new Date();
      var diff       = p.date_sortie_estimee ? Math.ceil((new Date(p.date_sortie_estimee) - maintenant) / 86400000) : null;
      var expediteur = p.type === 'locataire'
        ? t('ongletPreavisDash.recus.expediteurLocataire', { prenom: p.loc_prenom, nom: p.loc_nom })
        : t('ongletPreavisDash.recus.expediteurProprietaire', { prenom: p.prop_prenom, nom: p.prop_nom });

      return (
        <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #C62828' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{t('ongletPreavisDash.recus.preavisDe', { logement: p.logement_titre })}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{t('ongletPreavisDash.recus.de', { expediteur: expediteur })}</div>
            </div>
            {diff !== null && (
              <div style={{ background: diff <= 5 ? '#FFEBEE' : '#FFF8E1', color: diff <= 5 ? '#C62828' : '#7B4F00', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 800 }}>
                J-{diff > 0 ? diff : 0}
              </div>
            )}
          </div>

          <div style={{ background: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 14 }}>
            {[
              [t('ongletPreavisDash.sent.motif'),               p.motif],
              [t('ongletPreavis.locataire.confirm.labels.delai'),               t('ongletPaiementsDash.delaiMois', { n: p.delai_mois })],
              [t('ongletPreavisDash.recus.dateDeSortie'),      dateSortie],
              [t('ongletPreavisDash.renouv.recuLe'),             new Date(p.created_at).toLocaleDateString('fr-FR')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid #FFE082' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#7B4F00' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          {reponseModal === p.id ? (
            <div>
              <textarea
                value={messageReponse}
                onChange={function(e) { setMessageReponse(e.target.value); }}
                placeholder={t('ongletPreavisDash.recus.messageOptionnel')}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 70, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none', marginBottom: 10 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={function() { repondre(p.id, 'renouveler'); }}
                  disabled={reponseLoading}
                  style={{ padding: 12, borderRadius: 10, border: '1.5px solid #1565C0', background: '#E3F2FD', color: '#1565C0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {t('ongletPreavisDash.recus.demanderRenouvellement')}
                </button>
                <button
                  onClick={function() { repondre(p.id, 'accepte'); }}
                  disabled={reponseLoading}
                  style={{ padding: 12, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><CheckCircle size={14} strokeWidth={1.5}/> {t('ongletPreavisDash.recus.accepterDepart')}</span>
                </button>
              </div>
              <button onClick={function() { setReponseModal(null); setMessageReponse(''); }}
                style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: 'none', background: '#F5F5F5', color: '#888', fontSize: 12, cursor: 'pointer' }}>
                {t('ongletLocataires.form.annuler')}
              </button>
            </div>
          ) : (
            <button
              onClick={function() { setReponseModal(p.id); }}
              style={{ width: '100%', background: '#C62828', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {t('ongletPreavisDash.recus.repondreAuPreavis')}
            </button>
          )}
        </div>
      );
    })}
  </div>
)}

      {/* ── FORMULAIRE ───────────────────────────────────────── */}
      {step === 'form' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#7B4F00', display: 'flex', gap: 6 }}>
            <Scale size={14} strokeWidth={1.5} />
            <span>{t('ongletPreavisDash.form.alerteInfo')}</span>
          </div>

          {/* Sélection bien (proprio) */}
          {estProprietaire && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('ongletPreavis.proprio.form.bienLabel')}</div>
              {biens.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>{t('ongletPreavisDash.form.aucuneLocationActive')}</div>}
              {biens.map(function(b) {
                return (
                  <div key={b.id} onClick={function() { setBien(b); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: bien && bien.id === b.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: bien && bien.id === b.id ? '#E8F5E9' : '#FAFAFA', borderRadius: 10, marginBottom: 8, cursor: 'pointer' }}>
                    <Home size={18} strokeWidth={1.5} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.logement_titre}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{b.locataire_prenom} {b.locataire_nom} · {b.locataire_telephone}</div>
                    </div>
                    {bien && bien.id === b.id && <Check size={16} strokeWidth={2} color="#1B6B3A" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Motif */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('ongletPreavis.locataire.form.motifLabel')}</div>
            {motifsList.map(function(opt) {
              var m = opt.value;
              return (
                <div key={m} onClick={function() { setMotif(m); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: motif === m ? '1.5px solid #1B6B3A' : '0.5px solid #E0E0E0', background: motif === m ? '#E8F5E9' : '#FAFAFA', borderRadius: 10, marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: motif === m ? 'none' : '1.5px solid #CCC', background: motif === m ? '#1B6B3A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {motif === m && <Check size={11} strokeWidth={2} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 13, color: motif === m ? '#1B5E20' : '#555' }}>{opt.label}</span>
                </div>
              );
            })}
          </div>

          {/* Délai */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>
              {estProprietaire ? t('ongletPreavis.proprio.form.delaiLabel') : t('ongletPreavis.locataire.form.delaiLabel')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['1', '2', '3'].map(function(n) {
                return (
                  <button key={n} onClick={function() { setDelai(n); }}
                    style={{ padding: 10, borderRadius: 10, border: delai === n ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: delai === n ? '#E8F5E9' : '#FAFAFA', color: delai === n ? '#1B5E20' : '#555', fontSize: 13, fontWeight: delai === n ? 700 : 400, cursor: 'pointer' }}>
                    {t('ongletPaiementsDash.delaiMois', { n: n })}
                  </button>
                );
              })}
            </div>
            {delai && (
              <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#555' }}>{t('ongletPreavisDash.sent.dateSortieEstimee')}</span>
                <span style={{ fontWeight: 700, color: '#1B6B3A' }}>{addDays(parseInt(delai) * 30)}</span>
              </div>
            )}
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{t('ongletPreavisDash.form.messageOptionnel')}</div>
            <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
              placeholder={estProprietaire ? t('ongletPreavis.proprio.form.messagePlaceholder') : t('ongletPreavisDash.form.messagePersonnelPlaceholder')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 80, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <button
            onClick={function() {
              var ok = motif && delai && (!estProprietaire || bien);
              if (!ok) { toast.error(t('ongletPreavisDash.form.selectionnez', { bien: estProprietaire && !bien ? t('ongletPreavisDash.form.unBienVirgule') : '', motif: motif ? '' : t('ongletPreavisDash.form.unMotifEt'), delai: !delai ? t('ongletPreavisDash.form.unDelai') : '' })); return; }
              setStep('confirm');
            }}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('ongletPreavisDash.form.preparerBouton')}
          </button>
        </div>
      )}
    </div>
  );
}

// ================================================
// ONGLET : Alertes
// ================================================

function OngletAlertes() {
  var t = useTranslation('dashboard').t;
  var [data, setData] = useState({ alertes: [], signalements: [] });
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    api.get('/alertes')
      .then(function(res) { setData(res.data); })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, []);

  function traiter(id, statut) {
    api.patch('/alertes/' + id, { statut: statut })
      .then(function() {
        toast.success(t('ongletAlertes.toastMiseAJour'));
        setData(function(prev) {
          return Object.assign({}, prev, { alertes: prev.alertes.filter(function(a) { return a.id !== id; }) });
        });
      }).catch(function() { toast.error(t('ongletAlertes.toastErreur')); });
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>{t('ongletAlertes.chargement')}</div>;

  var total = data.alertes.length + (data.signalements ? data.signalements.length : 0);

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="dash-page-header">
        <div><h1>{t('ongletAlertes.titre')}</h1><p>{t('ongletAlertes.nbAlertes', { count: total })}</p></div>
      </div>
      {total === 0 && (
        <div className="dash-empty-state">
          <CheckCircle size={48} strokeWidth={1} color="#C8E6C9"/><h3>{t('ongletAlertes.aucuneAlerte')}</h3><p>{t('ongletAlertes.toutEnOrdre')}</p>
        </div>
      )}
      {data.alertes.map(function(a) {
        var borderColor = a.type === 'loyer_retard' ? '#E53935' : a.type === 'bail_bientot' ? '#F5A623' : '#1565C0';
        var btnLabel = a.type === 'loyer_retard' ? t('ongletAlertes.relancer') : a.type === 'bail_bientot' ? t('ongletAlertes.renouveler') : t('ongletAlertes.traiter');
        return (
          <div key={a.id} className="alerte-card-proto" style={{ borderLeft: '5px solid ' + borderColor }}>
            <div className="alerte-card-icon">
              {a.type === 'loyer_retard' ? <AlertTriangle size={20} strokeWidth={1.5} /> : a.type === 'bail_bientot' ? <FileText size={20} strokeWidth={1.5} /> : <Bell size={20} strokeWidth={1.5} />}
            </div>
            <div className="alerte-card-body">
              <div className="alerte-card-title">{a.titre}</div>
              <div className="alerte-card-sub">{a.description}</div>
            </div>
            <button className="alerte-card-btn" onClick={function() { traiter(a.id, 'traitee'); }}>
              {btnLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ================================================
// ONGLET : Documents
// ================================================
function OngletDocuments(props) {
  var t = useTranslation('dashboard').t;
  var plan = props.plan || { plan: 'gratuit', droits: { documents_pdf: false } };
if (user && user.role !== 'locataire' && !plan.droits.documents_pdf) {
  return (
    <div>
      <div className="dash-page-header"><div><h1>{t('ongletDocuments.titre')}</h1></div></div>
      <UpgradeBanner fonctionnalite="documents_pdf" planRequis="Pro" />
    </div>
  );
}
  var user = props.user;
  var [reservations, setReservations] = useState([]);
  var [documents, setDocuments] = useState([]);
  var [showForm, setShowForm] = useState(false);
  var [genForm, setGenForm] = useState({ reservation_id: '', type: 'contrat_bail' });
  var [showUpload, setShowUpload] = useState(false);
  var [uploadForm, setUploadForm] = useState({ titre: '', type: 'autre' });
  var [fichier, setFichier] = useState(null);

  useEffect(function() {
    api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); }).catch(console.error);
    var ep = user && user.role === 'locataire' ? '/reservations/mes-reservations' : '/reservations/proprietaire';
        api.get(ep).then(function(res) {
      setReservations((res.data.reservations || []).filter(function(r) {
        return ['confirmee', 'active', 'bail_signe', 'bail_signe_proprio', 'bail_signe_locataire', 'terminee'].includes(r.statut);
      }));
    }).catch(console.error);
  }, [user]);

  function generer(e) {
    e.preventDefault();
    api.post('/documents/generer', genForm)
      .then(function() {
        toast.success(t('ongletDocuments.toastDocumentGenere'));
        setShowForm(false);
        api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); });
      })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletDocuments.toastErreur')); });
  }

  function telecharger(doc) {
    api.get('/documents/' + doc.id + '/telecharger?format=pdf', { responseType: 'blob' })
      .then(function(res) {
        var typePdf = (res.headers && res.headers['content-type'] || '').indexOf('pdf') !== -1;
        var blob = new Blob([res.data], { type: typePdf ? 'application/pdf' : 'text/html; charset=utf-8' });
        var url  = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', (doc.titre || 'document').replace(/\s+/g, '_') + (typePdf ? '.pdf' : '.html'));
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(t('ongletDocuments.toastDocumentTelecharge'));
      }).catch(function() { toast.error(t('ongletDocuments.toastErreurTelechargement')); });
  }

  // Types selon le rôle
  var typesAffiches = user && user.role === 'locataire'
    ? DOCS_TYPES.filter(function(d) { return ['quittance', 'etat_lieux', 'preavis'].includes(d.type); })
    : DOCS_TYPES;

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>{t('ongletDocuments.titre')}</h1><p>{t('ongletDocuments.nbDocuments', { count: documents.length })}</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline-green" onClick={function() { setShowUpload(!showUpload); setShowForm(false); }}>{t('ongletDocuments.ajouter')}</button>
          <button className="btn-green" onClick={function() { setShowForm(!showForm); setShowUpload(false); }}>{t('ongletDocuments.generer')}</button>
        </div>
      </div>

      <div className="docs-grid-proto">
        {typesAffiches.map(function(d, i) {
          return (
            <div key={i} className="doc-card-proto">
              <div className="doc-card-icon">{d.icon}</div>
              <div className="doc-card-title">{t('ongletDocuments.docsTypes.' + d.labelKey + '.titre')}</div>
              <div className="doc-card-desc">{t('ongletDocuments.docsTypes.' + d.labelKey + '.desc')}</div>
              <button
                className="doc-card-btn"
                style={{ background: d.color }}
                onClick={function() { setGenForm(Object.assign({}, genForm, { type: d.type })); setShowForm(true); setShowUpload(false); }}
              >{t('ongletDocuments.generer')}</button>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="dash-form-card" style={{ marginTop: 16 }}>
          <h3>{t('ongletDocuments.genererUnDocument')}</h3>
          <form onSubmit={generer}>
            <div className="form-row-2">
              <div className="form-group">
                <label>{t('ongletDocuments.typeDeDocument')}</label>
                <select value={genForm.type} onChange={function(e) { setGenForm(Object.assign({}, genForm, { type: e.target.value })); }}>
                  {typesAffiches.map(function(d) { return <option key={d.type} value={d.type}>{t('ongletDocuments.docsTypes.' + d.labelKey + '.titre')}</option>; })}
                </select>
              </div>
              <div className="form-group">
                <label>{t('ongletDocuments.reservationConcernee')}</label>
                <select value={genForm.reservation_id} onChange={function(e) { setGenForm(Object.assign({}, genForm, { reservation_id: e.target.value })); }} required>
                  <option value="">{t('ongletDocuments.selectionnezReservation')}</option>
                  {reservations.map(function(r) {
                    return <option key={r.id} value={r.id}>{r.logement_titre} - {new Date(r.date_debut).toLocaleDateString('fr-FR')}</option>;
                  })}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green">{t('ongletDocuments.genererEtEnvoyer')}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>{t('ongletLocataires.form.annuler')}</button>
            </div>
          </form>
        </div>
      )}

      {documents.length > 0 && (
        <div className="dash-white-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 14 }}>{t('ongletDocuments.historique')}</h3>
          {documents.map(function(doc) {
            var cfgDoc = {
              contrat_bail:    { icon: FileSignature, color: '#1B6B3A', bg: '#E8F5E9', label: t('ongletDocuments.cfgDoc.contratBail')    },
              quittance:       { icon: Receipt,        color: '#1565C0', bg: '#E3F2FD', label: t('ongletDocuments.cfgDoc.quittance')           },
              etat_lieux:      { icon: ClipboardList,  color: '#E65100', bg: '#FFF3E0', label: t('ongletDocuments.cfgDoc.etatLieux')      },
              mise_en_demeure: { icon: AlertTriangle,   color: '#B71C1C', bg: '#FFEBEE', label: t('ongletDocuments.cfgDoc.miseEnDemeure')     },
              preavis:         { icon: Send,            color: '#37474F', bg: '#ECEFF1', label: t('ongletDocuments.cfgDoc.preavis')              },
              facture:         { icon: Banknote,        color: '#7B1FA2', bg: '#F3E5F5', label: t('ongletDocuments.cfgDoc.facture')              },
              caution:         { icon: Lock,            color: '#1B6B3A', bg: '#E8F5E9', label: t('ongletDocuments.cfgDoc.caution')     },
            }[doc.type] || { icon: FileText, color: '#888', bg: '#F5F5F5', label: t('ongletDocuments.cfgDoc.document') };
            var CfgDocIcon = cfgDoc.icon;
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: '#F7F8F7', marginBottom: 8 }}>
                <div style={{ width: 42, height: 42, background: cfgDoc.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CfgDocIcon size={20} strokeWidth={1.5} color={cfgDoc.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{doc.titre}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                    <span style={{ background: cfgDoc.bg, color: cfgDoc.color, borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>{cfgDoc.label}</span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={function() { telecharger(doc); }}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: cfgDoc.color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Download size={13} strokeWidth={2} /> PDF
                  </button>
                  <button onClick={function() {
                    api.post('/documents/' + doc.id + '/renvoyer-email')
                      .then(function() { toast.success(t('ongletDocuments.toastEmailEnvoye')); })
                      .catch(function() { toast.error(t('ongletDocuments.toastErreur')); });
                  }}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={13} strokeWidth={2} /> {t('ongletDocuments.email')}
                  </button>
                </div>
              </div>
            ); 
          })}
        </div>
      )}
    </div>
  );
}

// ================================================
// ONGLET : Messagerie avec fichiers
// ================================================
function OngletMessages() {
  var t = useTranslation('dashboard').t;
  var auth = useAuth();
  var user = auth.user;
  var [conversations, setConversations] = useState([]);
  var [convActive, setConvActive] = useState(null);
  var [messages, setMessages] = useState([]);
  var [message, setMessage] = useState('');
  var [loading, setLoading] = useState(true);
  var [fichier, setFichier] = useState(null);
  var [replyTo, setReplyTo]         = useState(null);
  var [recherche, setRecherche]     = useState('');
  var [showEmojis, setShowEmojis]   = useState(null);
  var [isTyping, setIsTyping]       = useState(false);
  var typingTimeout                 = useRef(null);
  var messagesEndRef                = useRef(null);
  var EMOJIS_RAPIDES = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  useEffect(function() {
    api.get('/messages/conversations')
      .then(function(res) { setConversations(res.data.conversations || []); })
      .catch(function() {
        // Fallback si le backend n'a pas encore les routes messages
        setConversations([]);
      })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  function chargerMessages(interlocuteurId) {
    setConvActive(interlocuteurId);
    setMessages([]);
    api.get('/messages/' + interlocuteurId)
      .then(function(res) { setMessages(res.data.messages || []); })
      .catch(console.error);
  }

  function envoyerMessage() {
    if (!message.trim() && !fichier) return;
    if (!convActive) return;

    var formData = new FormData();
    formData.append('destinataire_id', convActive);
    if (message.trim()) formData.append('contenu', message);
    if (fichier) formData.append('fichier', fichier);
    if (replyTo) formData.append('reply_to', replyTo.id); 

    api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function(res) {
        setMessages(function(prev) { return prev.concat(res.data.data); });
        setMessage('');
        setFichier(null);
        setReplyTo(null);
        toast.success(t('ongletMessages.toastMessageEnvoye'));
      })
      .catch(function() { toast.error(t('ongletMessages.toastErreurEnvoi')); });
  }

  var convCourante = conversations.find(function(c) { return c.interlocuteur_id === convActive; });

  if (loading) {
    return (
      <div>
        <div className="dash-page-header"><div><h1>{t('ongletMessages.titre')}</h1></div></div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>{t('ongletMessages.chargement')}</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div>
        <div className="dash-page-header"><div><h1>{t('ongletMessages.titre')}</h1><p>{t('ongletMessages.sousTitre')}</p></div></div>
        <div className="dash-empty-state">
          <span><MessageCircle size={14} strokeWidth={1.5} /></span>
          <h3>{t('ongletMessages.aucuneConversation')}</h3>
          <p>{user && user.role === 'locataire' ? t('ongletMessages.reservezLogement') : t('ongletMessages.messagesLocataires')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-page-header"><div><h1>{t('ongletMessages.titre')}</h1><p>{t('ongletMessages.sousTitre')}</p></div></div>
      <div className="messages-container">
        <div className="messages-list">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 13, color: '#1B2B22' }}>
            {t('ongletMessages.conversations', { count: conversations.length })}
          </div>
          <div style={{ padding: '8px 12px', borderBottom: '0.5px solid #F0F0F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F8F7', borderRadius: 10, padding: '7px 12px' }}>
              <Search size={14} strokeWidth={1.5} color="#888" />
              <input type="text" placeholder={t('ongletMessages.rechercherPlaceholder')} value={recherche}
                onChange={function(e) { setRecherche(e.target.value); }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1, color: '#1B2B22' }} />
            </div>
          </div>
          {conversations.filter(function(c) {
            if (!recherche) return true;
            return ((c.prenom || '') + ' ' + (c.nom || '') + ' ' + (c.contenu || '')).toLowerCase().includes(recherche.toLowerCase());
          }).map(function(c) {
            var initiales = ((c.prenom || '').charAt(0) + (c.nom || '').charAt(0)).toUpperCase();
            var nonLus = parseInt(c.non_lus) || 0;
            return (
              <div key={c.interlocuteur_id}
                className={'message-thread-item ' + (convActive === c.interlocuteur_id ? 'active' : '')}
                onClick={function() { chargerMessages(c.interlocuteur_id); }}>
                <div className="msg-avatar">{initiales}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="msg-thread-name">{c.prenom} {c.nom}</div>
                    {nonLus > 0 && (
                      <span style={{ background: '#E53935', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>{nonLus}</span>
                    )}
                  </div>
                  <div className="msg-thread-preview">
                    {c.type === 'photo' ? t('ongletMessages.photo') : c.type === 'document' ? t('ongletMessages.document') : (c.contenu || t('ongletMessages.nouvelleConversation'))}
                  </div>
                  {c.logement_titre && <div style={{ fontSize: '11px', color: '#1B6B3A' }}>{c.logement_titre}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="messages-chat">
          {!convActive && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '14px' }}>
              {t('ongletMessages.selectionnezConversation')}
            </div>
          )}
          {convActive && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="messages-chat-header">
                {convCourante && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="msg-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {((convCourante.prenom || '').charAt(0) + (convCourante.nom || '').charAt(0)).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{convCourante.prenom} {convCourante.nom}</div>
                      {convCourante.logement_titre && <div style={{ fontSize: 11, color: '#888' }}>{convCourante.logement_titre}</div>}
                    </div>
                    {convCourante.telephone && (
                      <a href={'tel:' + convCourante.telephone}
                        style={{ marginLeft: 'auto', background: '#E8F5E9', color: '#1B6B3A', borderRadius: '20px', padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        {t('ongletMessages.appeler')}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="messages-chat-body">
                {messages.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, padding: '40px 20px' }}>{t('ongletMessages.demarrezConversation')}</div>}
                {messages.map(function(m) {
                  var estMoi = m.expedition_id === (user && user.id);
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: estMoi ? 'flex-end' : 'flex-start', marginBottom: 8 }}>

                      {/* Citation reply */}
                      {m.reply_contenu && (
                        <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 8, padding: '4px 10px', marginBottom: 4, fontSize: 12, color: '#888', borderLeft: '3px solid #1B6B3A', maxWidth: '60%' }}>
                          {m.reply_contenu.slice(0, 60)}{m.reply_contenu.length > 60 ? '...' : ''}
                        </div>
                      )}

                      {/* Bulle */}
                      <div
                        className={'msg-bubble ' + (estMoi ? 'msg-bubble-sent' : 'msg-bubble-received')}
                        onDoubleClick={function() { setReplyTo(m); }}
                        style={{ maxWidth: '70%' }}>
                        {m.type === 'photo' && m.fichier_url && (
                          <img src={m.fichier_url} alt="photo" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, cursor: 'pointer' }} onClick={function() { window.open(m.fichier_url, '_blank'); }} />
                        )}
                        {m.type === 'document' && m.fichier_url && (
                          <a href={m.fichier_url} target="_blank" rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: estMoi ? '#fff' : '#1B6B3A', textDecoration: 'none', padding: '8px', background: estMoi ? 'rgba(255,255,255,0.15)' : '#f0f0f0', borderRadius: 8, fontSize: 13 }}>
                            <Paperclip size={14} strokeWidth={1.5} /><span>{m.fichier_nom || t('ongletMessages.document')}</span>
                          </a>
                        )}
                        {m.contenu && <div>{m.contenu}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: 10, opacity: 0.7 }}>
                            {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {estMoi && (
                            <span style={{ opacity: m.lu ? 1 : 0.4, color: 'rgba(255,255,255,0.9)', display: 'inline-flex', alignItems: 'center' }}>
                              {m.lu ? <CheckCheck size={13} strokeWidth={2} /> : <Check size={13} strokeWidth={2} />}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Réactions + bouton */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        {m.reactions && Array.isArray(m.reactions) && m.reactions.filter(function(r) { return r.emoji; }).map(function(r, ri) {
                          return (
                            <span key={ri} style={{ background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 20, padding: '1px 7px', fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                              {r.emoji}{r.nb > 1 ? ' ' + r.nb : ''}
                            </span>
                          );
                        })}
                        <button
                          onMouseDown={function(e) { e.preventDefault(); e.stopPropagation(); setShowEmojis(showEmojis === m.id ? null : m.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '1px 4px', opacity: 0.35 }}
                          onMouseEnter={function(e) { e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={function(e) { e.currentTarget.style.opacity = '0.35'; }}>
                          <SmilePlus size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Sélecteur emojis */}
                      {showEmojis === m.id && (
                        <div style={{ background: '#fff', borderRadius: 20, padding: '6px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', gap: 6, marginTop: 2, zIndex: 10 }}>
                          {EMOJIS_RAPIDES.map(function(emoji) {
                            return (
                              <button key={emoji}
                                onMouseDown={function(e) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  api.post('/messages/' + m.id + '/reaction', { emoji: emoji })
                                    .then(function() { setShowEmojis(null); chargerMessages(convActive); });
                                }}
                                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '2px 4px' }}>
                                {emoji}
                              </button>
                            );
                          })}
                          <button onMouseDown={function(e) { e.preventDefault(); setShowEmojis(null); }}
                            style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: '#aaa' }}>×</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} /> 
              </div>
{/* Barre de réponse */}
              {replyTo && (
                <div style={{ padding: '8px 14px', background: '#F0FBF0', borderTop: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, borderLeft: '3px solid #1B6B3A', paddingLeft: 10 }}>
                    <div style={{ fontSize: 11, color: '#1B6B3A', fontWeight: 700, marginBottom: 2 }}>{t('ongletMessages.repondreA')}</div>
                    <div style={{ fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {replyTo.contenu ? replyTo.contenu.slice(0, 60) : t('ongletMessages.fichier')}
                    </div>
                  </div>
                  <button onClick={function() { setReplyTo(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18 }}>×</button>
                </div>
              )}
              {fichier && (
                <div style={{ padding: '8px 16px', background: '#E8F5E9', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '13px', color: '#1B5E20', display: 'inline-flex', alignItems: 'center', gap: 5 }}>{fichier.type.startsWith('image/') ? <Camera size={14} strokeWidth={1.5} /> : <Paperclip size={14} strokeWidth={1.5} />} {fichier.name}</span>
                  <button type="button" onClick={function() { setFichier(null); }} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontWeight: '700' }}>x</button>
                </div>
              )}

              <div className="messages-chat-input">
                <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={function(e) { if (e.target.files && e.target.files[0]) setFichier(e.target.files[0]); }} />
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F0F4F1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Paperclip size={16} strokeWidth={1.5} /></div>
                </label>
                <input type="text" placeholder={t('ongletMessages.ecrireMessage')} value={message}
                  onChange={function(e) { setMessage(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }} />
                <button className="btn-send" onClick={envoyerMessage} type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================
// ONGLET : Reclamations avec timeline
// ================================================
function OngletReclamations() {
  var t = useTranslation('dashboard').t;
  var auth = useAuth();
  var user = auth.user;
  var [reclamations, setReclamations] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showForm, setShowForm] = useState(false);
  var [activeTimeline, setActiveTimeline] = useState(null);
  var [timeline, setTimeline] = useState([]);
  var [form, setForm] = useState({ titre: '', description: '', categorie: 'autre', priorite: 'normale', logement_id: '' });
  var [photo, setPhoto] = useState(null);
  var [commentaire, setCommentaire] = useState('');
  var [logements, setLogements] = useState([]);

  useEffect(function() {
    charger();
    if (user && user.role === 'locataire') {
      api.get('/reservations/mes-reservations')
        .then(function(res) {
          var logs = (res.data.reservations || [])
            .filter(function(r) { return r.statut === 'confirmee'; })
            .map(function(r) { return { id: r.logement_id, titre: r.logement_titre }; });
          setLogements(logs);
        })
        .catch(console.error);
    }
  }, [user]);

  function charger() {
    setLoading(true);
    api.get('/reclamations')
      .then(function(res) { setReclamations(res.data.reclamations || []); })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }

  function voirTimeline(id) {
    setActiveTimeline(id);
    api.get('/reclamations/' + id + '/timeline')
      .then(function(res) { setTimeline(res.data.timeline || []); })
      .catch(console.error);
  }

  function soumettre(e) {
    e.preventDefault();
    var fd = new FormData();
    fd.append('titre', form.titre);
    fd.append('description', form.description);
    fd.append('categorie', form.categorie);
    fd.append('priorite', form.priorite);
    fd.append('logement_id', form.logement_id);
    if (photo) fd.append('photo', photo);
    api.post('/reclamations', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function() { toast.success(t('ongletReclamations.toastEnvoyee')); setShowForm(false); setForm({ titre: '', description: '', categorie: 'autre', priorite: 'normale', logement_id: '' }); setPhoto(null); charger(); })
      .catch(function() { toast.error(t('ongletReclamations.toastErreur')); });
  }

  function changerStatut(id, statut) {
    api.patch('/reclamations/' + id + '/statut', { statut: statut, commentaire: commentaire })
      .then(function() { toast.success(t('ongletReclamations.toastStatutMisAJour')); setCommentaire(''); charger(); if (activeTimeline === id) voirTimeline(id); })
      .catch(function() { toast.error(t('ongletReclamations.toastErreur')); });
  }

  var categorieLabels = {
    panne_eau: t('ongletReclamations.categories.panneEau'), panne_electricite: t('ongletReclamations.categories.panneElectricite'),
    panne_equipement: t('ongletReclamations.categories.panneEquipement'), securite: t('ongletReclamations.categories.securite'),
    nuisances: t('ongletReclamations.categories.nuisances'), autre: t('ongletReclamations.categories.autre')
  };

  var statutColors = { ouverte: '#E53935', en_cours: '#F5A623', resolue: '#1B6B3A', fermee: '#888' };
  var statutLabels = { ouverte: t('ongletReclamations.statuts.ouverte'), en_cours: t('ongletReclamations.statuts.enCours'), resolue: t('ongletReclamations.statuts.resolue'), fermee: t('ongletReclamations.statuts.fermee') };

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>{t('ongletReclamations.titre')}</h1><p>{t('ongletReclamations.nbReclamations', { count: reclamations.length })}</p></div>
        {user && user.role === 'locataire' && (
          <button className="btn-green" onClick={function() { setShowForm(!showForm); }}>{t('ongletReclamations.signalerProbleme')}</button>
        )}
      </div>

      {showForm && user && user.role === 'locataire' && (
        <div className="dash-form-card">
          <h3>{t('ongletReclamations.form.titreCard')}</h3>
          <form onSubmit={soumettre}>
            <div className="form-row-2">
              <div className="form-group">
                <label>{t('ongletReclamations.form.logement')}</label>
                <select value={form.logement_id} onChange={function(e) { setForm(Object.assign({}, form, { logement_id: e.target.value })); }} required>
                  <option value="">{t('ongletReclamations.form.selectionnez')}</option>
                  {logements.map(function(l) { return <option key={l.id} value={l.id}>{l.titre}</option>; })}
                </select>
              </div>
              <div className="form-group">
                <label>{t('ongletReclamations.form.categorie')}</label>
                <select value={form.categorie} onChange={function(e) { setForm(Object.assign({}, form, { categorie: e.target.value })); }}>
                  {Object.entries(categorieLabels).map(function(entry) { return <option key={entry[0]} value={entry[0]}>{entry[1]}</option>; })}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>{t('ongletReclamations.form.titreProbleme')}</label>
              <input type="text" value={form.titre} placeholder={t('ongletReclamations.form.titreProblemePlaceholder')} onChange={function(e) { setForm(Object.assign({}, form, { titre: e.target.value })); }} required />
            </div>
            <div className="form-group">
              <label>{t('ongletReclamations.form.description')}</label>
              <textarea rows="3" value={form.description} placeholder={t('ongletReclamations.form.descriptionPlaceholder')}
                onChange={function(e) { setForm(Object.assign({}, form, { description: e.target.value })); }}
                style={{ padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', width: '100%' }} />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>{t('ongletReclamations.form.priorite')}</label>
                <select value={form.priorite} onChange={function(e) { setForm(Object.assign({}, form, { priorite: e.target.value })); }}>
                  <option value="basse">{t('ongletReclamations.form.prioriteBasse')}</option>
                  <option value="normale">{t('ongletReclamations.form.prioriteNormale')}</option>
                  <option value="haute">{t('ongletReclamations.form.prioriteHaute')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('ongletReclamations.form.photo')}</label>
                <input type="file" accept="image/*" onChange={function(e) { if (e.target.files[0]) setPhoto(e.target.files[0]); }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green">{t('ongletReclamations.form.envoyer')}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setShowForm(false); }}>{t('ongletLocataires.form.annuler')}</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>{t('ongletReclamations.chargement')}</div>}

      {!loading && reclamations.length === 0 && (
        <div className="dash-empty-state">
          <CheckCircle size={48} strokeWidth={1} color="#C8E6C9"/><h3>{t('ongletReclamations.aucuneReclamation')}</h3><p>{t('ongletAlertes.toutEnOrdre')}</p>
        </div>
      )}

      {reclamations.map(function(r) {
        var couleur = statutColors[r.statut] || '#888';
        return (
          <div key={r.id} style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '5px solid ' + couleur }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: '#1B2B22' }}>{r.titre}</span>
                  <span style={{ background: couleur + '20', color: couleur, borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>{statutLabels[r.statut]}</span>
                  <span style={{ background: '#f0f0f0', color: '#555', borderRadius: '20px', padding: '2px 10px', fontSize: '11px' }}>{categorieLabels[r.categorie]}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {r.logement_titre}
                  {user && user.role !== 'locataire' && r.loc_nom && <span> · {r.loc_prenom} {r.loc_nom}</span>}
                  <span> · {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {r.description && <div style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>{r.description}</div>}
                {r.photo_url && (
                  <img src={r.photo_url} alt="reclamation" style={{ maxHeight: '120px', borderRadius: '8px', cursor: 'pointer', marginTop: '8px' }} onClick={function() { window.open(r.photo_url, '_blank'); }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button className="btn-outline-green" onClick={function() { if (activeTimeline === r.id) { setActiveTimeline(null); } else { voirTimeline(r.id); } }}>
                  {activeTimeline === r.id ? t('ongletReclamations.fermer') : t('ongletReclamations.timeline')}
                </button>
                {user && user.role !== 'locataire' && r.statut !== 'resolue' && r.statut !== 'fermee' && (
                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                    {r.statut === 'ouverte' && (
                      <button className="btn-green" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={function() { changerStatut(r.id, 'en_cours'); }}>{t('ongletReclamations.statuts.enCours')}</button>
                    )}
                    <button className="btn-green" style={{ fontSize: '12px', padding: '6px 12px', background: '#1565C0' }} onClick={function() { changerStatut(r.id, 'resolue'); }}>{t('ongletReclamations.statuts.resolue')}</button>
                  </div>
                )}
              </div>
            </div>

            {activeTimeline === r.id && (
              <div style={{ marginTop: '14px', borderTop: '1px solid #f0f0f0', paddingTop: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B2B22', marginBottom: '10px' }}>{t('ongletReclamations.timeline')}</div>
                {timeline.map(function(tl) {
                  return (
                    <div key={tl.id} style={{ display: 'flex', gap: 10, marginBottom: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: tl.type === 'creation' ? '#E8F5E9' : tl.type === 'statut_change' ? '#FFF3E0' : '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tl.type === 'creation' ? <Wrench size={14} strokeWidth={1.5} color="#1B6B3A" /> : tl.type === 'statut_change' ? <RefreshCw size={14} strokeWidth={1.5} color="#E65100" /> : <MessageCircle size={14} strokeWidth={1.5} color="#1565C0" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', color: '#333' }}>{tl.contenu}</div>
                        {tl.photo_url && <img src={tl.photo_url} alt="photo" style={{ maxHeight: '80px', borderRadius: '6px', marginTop: '4px', cursor: 'pointer' }} onClick={function() { window.open(tl.photo_url, '_blank'); }} />}
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{tl.prenom} {tl.nom} · {new Date(tl.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: '10px', display: 'flex', gap: 8 }}>
                  <input type="text" placeholder={t('ongletReclamations.ajouterCommentaire')} value={commentaire}
                    onChange={function(e) { setCommentaire(e.target.value); }}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', margin: 0 }} />
                  <button className="btn-green" style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={function() {
                      api.post('/reclamations/' + r.id + '/commentaire', { commentaire: commentaire })
                        .then(function() { toast.success(t('ongletReclamations.toastCommentaireAjoute')); setCommentaire(''); voirTimeline(r.id); })
                        .catch(function() { toast.error(t('ongletReclamations.toastErreur')); });
                    }}>{t('ongletReclamations.form.envoyer')}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PushToggle() {
  var t = useTranslation('dashboard').t;
  var [abonne, setAbonne] = useState(false);
  var [loading, setLoading] = useState(false);

  useEffect(function() {
    estAbonne().then(setAbonne);
  }, []);

  function toggle() {
    setLoading(true);
    if (abonne) {
      desactiverNotifications()
        .then(function() { setAbonne(false); toast.success(t('pushToggle.toastDesactivees')); })
        .finally(function() { setLoading(false); });
    } else {
      activerNotificationsPush()
        .then(function(ok) {
          if (ok) { setAbonne(true); toast.success(t('pushToggle.toastActivees')); }
          else toast.error(t('pushToggle.toastPermissionRefusee'));
        })
        .finally(function() { setLoading(false); });
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{t('pushToggle.titre')}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t('pushToggle.sousTitre')}</div>
      </div>
      <button onClick={toggle} disabled={loading}
        style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: abonne ? '#1B6B3A' : '#F0F0F0', color: abonne ? '#fff' : '#888', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {loading ? '...' : abonne ? t('pushToggle.activees') : t('pushToggle.desactivees')}
      </button>
    </div>
  );
}
function BoutonNotifPush() {
  var t = useTranslation('dashboard').t;
  var [abonne, setAbonne]     = useState(false);
  var [loading, setLoading]   = useState(true);

  useEffect(function() {
    import('../services/pushService').then(function(m) {
      m.estAbonne().then(function(val) {
        setAbonne(val);
        setLoading(false);
      });
    });
  }, []);

  function toggleNotifs() {
    setLoading(true);
    import('../services/pushService').then(function(m) {
      if (abonne) {
        m.desactiverNotifications().then(function() {
          setAbonne(false);
          toast.success(t('pushToggle.toastDesactivees'));
        }).catch(function() {
          toast.error(t('boutonNotifPush.toastErreurDesactivation'));
        }).finally(function() { setLoading(false); });
      } else {
        m.activerNotificationsPush().then(function() {
          setAbonne(true);
          toast.success(t('boutonNotifPush.toastActivees'));
        }).catch(function() {
          toast.error(t('boutonNotifPush.toastAutorisez'));
        }).finally(function() { setLoading(false); });
      }
    });
  }

  return (
    <div style={{ background: '#F7F8F7', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, background: abonne ? '#E8F5E9' : '#F5F5F5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={24} strokeWidth={1.5} color={abonne ? '#1B6B3A' : '#888'} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>
            {abonne ? t('boutonNotifPush.titreActivees') : t('boutonNotifPush.titreDesactivees')}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {t('boutonNotifPush.sousTitre')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {[
          t('boutonNotifPush.items.nouvelleCandidature'),
          t('boutonNotifPush.items.candidatureAcceptee'),
          t('boutonNotifPush.items.paiementConfirme'),
          t('boutonNotifPush.items.nouveauMessage'),
          t('boutonNotifPush.items.rappelLoyer'),
        ].map(function(item, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B6B3A', flexShrink: 0 }} />
              {item}
            </div>
          );
        })}
      </div>

      <button onClick={toggleNotifs} disabled={loading}
        style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: loading ? '#aaa' : abonne ? '#FFEBEE' : '#1B6B3A', color: loading ? '#fff' : abonne ? '#B71C1C' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? t('boutonNotifPush.chargement') : abonne ? t('boutonNotifPush.desactiverBouton') : t('boutonNotifPush.activerBouton')}
      </button>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════
// ONGLET : Historique locataire
// ════════════════════════════════════════════════════════════════
function OngletHistorique(props) {
  var t = useTranslation('dashboard').t;
  var user = props.user;
  var [data, setData]         = useState(null);
  var [loading, setLoading]   = useState(true);
  var [ongletLocal, setOngletLocal] = useState('locations');

  useEffect(function() {
    api.get('/reservations/historique')
      .then(function(res) { setData(res.data); })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#888' }}>{t('ongletHistorique.chargement')}</span>
    </div>
  );

  if (!data) return null;

  var s           = data.stats;
  var GNFf        = function(n) { return new Intl.NumberFormat('fr-FR').format(Number(n)); };
  var noteLocataire = Number(s.note_moyenne_recue);
  var badge = Number(s.nb_terminees) >= 3 ? t('ongletHistorique.badges.experimente')
            : Number(s.nb_terminees) >= 1 ? t('ongletHistorique.badges.verifie')
            : t('ongletHistorique.badges.nouveau');

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>{t('ongletHistorique.titre')}</h1>
          <p>{t('ongletHistorique.sousTitre')}</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F5E9', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>
          {badge}
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: t('ongletHistorique.kpi.locationsTotales'),  val: s.nb_locations_total,                      icon: <Home size={22} strokeWidth={1.5}/>,        color: '#1B6B3A', bg: '#E8F5E9' },
          { label: t('ongletHistorique.kpi.locationsActives'),  val: s.nb_actives,                               icon: <CheckCircle size={22} strokeWidth={1.5}/>,  color: '#1565C0', bg: '#E3F2FD' },
          { label: t('ongletHistorique.kpi.totalPaye'),         val: GNFf(s.total_paye) + ' GNF',               icon: <Banknote size={22} strokeWidth={1.5}/>,     color: '#7B1FA2', bg: '#F3E5F5' },
          { label: t('ongletHistorique.kpi.noteRecue'),         val: noteLocataire > 0 ? noteLocataire.toFixed(1) + '/5' : t('ongletHistorique.kpi.pasEncore'), icon: <Star size={22} strokeWidth={1.5}/>, color: '#F5A623', bg: '#FFF8E1' },
        ].map(function(k, i) {
          return (
            <div key={i} className="stat-card-colored" style={{ background: k.bg, borderLeft: '4px solid ' + k.color }}>
              <div style={{ color: k.color, marginBottom: 8 }}>{k.icon}</div>
              <div className="stat-card-val" style={{ color: k.color, fontSize: 18 }}>{k.val}</div>
              <div className="stat-card-label">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Onglets locaux */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'locations', label: t('ongletHistorique.tabs.locations', { count: data.locations.length }) },
          { id: 'paiements', label: t('ongletHistorique.tabs.paiements', { count: data.paiements.length }) },
          { id: 'notations', label: t('ongletHistorique.tabs.avis', { count: data.notations.length }) },
        ].map(function(tab) {
          return (
            <button key={tab.id} onClick={function() { setOngletLocal(tab.id); }}
              style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: ongletLocal === tab.id ? '#1B6B3A' : '#F0F0F0', color: ongletLocal === tab.id ? '#fff' : '#555', fontSize: 13, fontWeight: ongletLocal === tab.id ? 700 : 500, cursor: 'pointer', transition: 'all .2s' }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── LOCATIONS ───────────────────────────────────────────── */}
      {ongletLocal === 'locations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.locations.length === 0 && (
            <div className="dash-empty-state">
              <Home size={48} strokeWidth={1} color="#C8E6C9" />
              <h3>{t('ongletHistorique.locations.aucune')}</h3>
              <p>{t('ongletHistorique.locations.apparaitront')}</p>
            </div>
          )}
          {data.locations.map(function(r) {
            var photo = r.photos && r.photos.length > 0 ? r.photos[0] : null;
            var statuts = {
              confirmee:  { label: t('ongletHistorique.locations.statuts.active'),      color: '#1B6B3A', bg: '#E8F5E9' },
              terminee:   { label: t('ongletHistorique.locations.statuts.terminee'),    color: '#888',    bg: '#F5F5F5' },
              en_attente: { label: t('ongletHistorique.locations.statuts.enAttente'),  color: '#E65100', bg: '#FFF3E0' },
              refusee:    { label: t('ongletHistorique.locations.statuts.refusee'),     color: '#B71C1C', bg: '#FFEBEE' },
            };
            var cfg = statuts[r.statut] || { label: r.statut, color: '#888', bg: '#F5F5F5' };

            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: r.statut === 'confirmee' ? '1.5px solid #A5D6A7' : '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Photo */}
                  <div style={{ width: 100, height: 100, background: photo ? 'none' : 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', flexShrink: 0, overflow: 'hidden' }}>
                    {photo
                      ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={28} strokeWidth={1.5} color="#A5D6A7" /></div>
                    }
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22' }}>{r.logement_titre}</div>
                        <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={11} strokeWidth={1.5} /> {r.logement_adresse}, {r.logement_ville}
                        </div>
                      </div>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {cfg.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555' }}>
                      <span style={{ fontWeight: 700, color: '#1B6B3A' }}>{GNFf(r.prix_mensuel)} GNF/mois</span>
                      {r.date_debut && <span>{t('ongletHistorique.locations.depuis', { date: new Date(r.date_debut).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) })}</span>}
                      {r.nb_chambres && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><BedDouble size={12} strokeWidth={1.5} /> {r.nb_chambres} ch.</span>}
                    </div>

                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      {t('ongletHistorique.locations.proprietaire')} {r.prop_prenom} {r.prop_nom}
                      {r.prop_telephone && <span> · <a href={'tel:' + r.prop_telephone} style={{ color: '#1B6B3A', textDecoration: 'none' }}>{r.prop_telephone}</a></span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── PAIEMENTS ───────────────────────────────────────────── */}
      {ongletLocal === 'paiements' && (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {data.paiements.length === 0 && (
            <div className="dash-empty-state">
              <Banknote size={48} strokeWidth={1} color="#C8E6C9" />
              <h3>{t('ongletHistorique.paiements.aucun')}</h3>
              <p>{t('ongletHistorique.paiements.apparaitront')}</p>
            </div>
          )}
          {data.paiements.map(function(p, i) {
            var cfg = p.statut === 'complete'
              ? { label: t('ongletHistorique.paiements.paye'), color: '#1B6B3A', bg: '#E8F5E9' }
              : { label: t('ongletHistorique.paiements.enAttente'), color: '#E65100', bg: '#FFF3E0' };
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < data.paiements.length - 1 ? '0.5px solid #F5F5F5' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>
                    {p.logement_titre}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {p.mode_paiement && <span> · {p.mode_paiement}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: cfg.color }}>{GNFf(p.montant)} GNF</div>
                  <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
                </div>
              </div>
            );
          })}

          {data.paiements.length > 0 && (
            <div style={{ padding: '14px 18px', background: '#1B2B22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{t('ongletHistorique.paiements.totalPaye')}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#F5A623' }}>{GNFf(s.total_paye)} GNF</span>
            </div>
          )}
        </div>
      )}

      {/* ─── NOTATIONS ───────────────────────────────────────────── */}
      {ongletLocal === 'notations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.notations.length === 0 && (
            <div className="dash-empty-state">
              <Star size={48} strokeWidth={1} color="#C8E6C9" />
              <h3>{t('ongletHistorique.notations.aucun')}</h3>
              <p>{t('ongletHistorique.notations.apparaitront')}</p>
            </div>
          )}
          {data.notations.map(function(n, i) {
            var estRecu = n.cible_id === (user && user.id);
            return (
              <div key={n.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + (estRecu ? '#1B6B3A' : '#1565C0') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: estRecu ? '#1B6B3A' : '#1565C0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {estRecu ? t('ongletHistorique.notations.avisRecu') : t('ongletHistorique.notations.avisDonne')}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22', marginTop: 2 }}>
                      {n.auteur_prenom} {n.auteur_nom} · {n.logement_titre}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(function(s) {
                      return <Star key={s} size={14} strokeWidth={1.5} fill={s <= n.note ? '#F5A623' : 'transparent'} color="#F5A623" />;
                    })}
                  </div>
                </div>
                {n.commentaire && (
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                    "{n.commentaire}"
                  </p>
                )}
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
                  {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ════════════════════════════════════════════════════════════════
// ONGLET : Rapports financiers
// ════════════════════════════════════════════════════════════════
function OngletRapports(props) {
  var t = useTranslation('dashboard').t;
  var user = props.user;
  var [data, setData]         = useState(null);
  var [loading, setLoading]   = useState(true);
  var [periode, setPeriode]   = useState('12mois');

  useEffect(function() {
    api.get('/rapports/financier?periode=' + periode)
      .then(function(res) { setData(res.data); })
      .catch(function(err) { console.error('[Rapports]', err.message); })
      .finally(function() { setLoading(false); });
  }, [periode]);

  function exportCSV() {
    if (!data) return;
    var lignes = [
      [t('ongletRapports.csv.mois'), t('ongletRapports.csv.revenusGnf'), t('ongletRapports.csv.paiements'), t('ongletRapports.csv.impayesGnf')],
      ...data.evolution.map(function(m) {
        return [m.mois_label, m.revenus, m.nb_paiements, m.impayes];
      })
    ];
    var csv     = lignes.map(function(l) { return l.join(','); }).join('\n');
    var blob    = new Blob([csv], { type: 'text/csv' });
    var url     = URL.createObjectURL(blob);
    var a       = document.createElement('a');
    a.href      = url;
    a.download  = 'werdhe-rapport-' + new Date().toISOString().slice(0,7) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('ongletRapports.toastCsvTelecharge'));
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#888' }}>{t('ongletRapports.chargementDonnees')}</span>
    </div>
  );

  if (!data) return (
    <div className="dash-empty-state">
      <TrendingUp size={48} strokeWidth={1} color="#E0E0E0" />
      <h3>{t('ongletRapports.aucuneDonneeFinanciere')}</h3>
      <p>{t('ongletRapports.donneesApparaitront')}</p>
    </div>
  );

  var r = data.resume;

  return (
    <div>
      <div className="dash-page-header">
        <div>
          <h1>{t('ongletRapports.titre')}</h1>
          <p>{t('ongletRapports.sousTitre')}</p>
        </div>
        <select value={periode} onChange={function(e) { setPeriode(e.target.value); }}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 13, color: '#555', cursor: 'pointer', outline: 'none', background: '#fff' }}>
            <option value="3mois">{t('ongletRapports.periodes.3mois')}</option>
            <option value="6mois">{t('ongletRapports.periodes.6mois')}</option>
            <option value="12mois">{t('ongletRapports.periodes.12mois')}</option>
            <option value="annee">{t('ongletRapports.periodes.annee')}</option>
          </select>
        <div style={{ display: 'flex', gap: 8 }}>
  <button onClick={exportCSV} className="btn-outline-green" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <Download size={14} strokeWidth={1.5} /> CSV
  </button>
  <button
    onClick={function() {
      var token = localStorage.getItem('token');
      window.open('https://api.werdhe.com/rapports/financier/pdf?token=' + token, '_blank');
    }}
    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#B71C1C', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
    <FileText size={14} strokeWidth={1.5} /> {t('ongletRapports.exportPdf')}
  </button>
</div>
      </div>

      {/* KPIs */}
      <div className="stats-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: t('ongletRapports.kpi.encaisseCeMois'),    val: GNF(r.encaisse) + ' GNF',    icon: <Banknote size={22} strokeWidth={1.5}/>,  color: '#1B6B3A', bg: '#E8F5E9' },
          { label: t('ongletRapports.kpi.enAttente'),          val: GNF(r.en_attente) + ' GNF',  icon: <Clock size={22} strokeWidth={1.5}/>,     color: '#E65100', bg: '#FFF3E0' },
          { label: t('ongletRapports.kpi.totalAnnuel'),        val: GNF(r.total_annuel) + ' GNF', icon: <TrendingUp size={22} strokeWidth={1.5}/>, color: '#1565C0', bg: '#E3F2FD' },
          { label: t('ongletRapports.kpi.paiementsCeMois'),   val: t('ongletRapports.kpi.recus', { n: r.nb_paiements }),    icon: <Receipt size={22} strokeWidth={1.5}/>,   color: '#7B1FA2', bg: '#F3E5F5' },
        ].map(function(s, i) {
          return (
            <div key={i} className="stat-card-colored" style={{ background: s.bg, borderLeft: '4px solid ' + s.color }}>
              <div style={{ color: s.color, marginBottom: 10 }}>{s.icon}</div>
              <div className="stat-card-val" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Graphique revenus 12 mois */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: 0 }}>{t('ongletRapports.evolutionRevenus')}</h3>
          <span style={{ fontSize: 12, color: '#888' }}>{t('ongletRapports.periodes.12mois')}</span>
        </div>
        {data.evolution.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>{t('ongletRapports.aucuneDonnee')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.evolution} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B6B3A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B6B3A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorImpayes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E53935" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="mois_label" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={function(v) { return new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v); }} />
              <Tooltip formatter={function(v, n) { return [new Intl.NumberFormat('fr-FR').format(v) + ' GNF', n === 'revenus' ? t('ongletRapports.encaisse') : t('ongletRapports.impayes')]; }} labelStyle={{ fontWeight: 700 }} />
              <Area type="monotone" dataKey="revenus" stroke="#1B6B3A" strokeWidth={2.5} fill="url(#colorRevenus)" dot={false} />
              <Area type="monotone" dataKey="impayes" stroke="#E53935" strokeWidth={1.5} fill="url(#colorImpayes)" dot={false} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
            <div style={{ width: 24, height: 3, background: '#1B6B3A', borderRadius: 2 }} /> {t('ongletRapports.revenusEncaisses')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
            <div style={{ width: 24, height: 2, background: '#E53935', borderRadius: 2, borderTop: '2px dashed #E53935' }} /> {t('ongletRapports.impayes')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Taux d'occupation */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', margin: '0 0 16px' }}>{t('ongletRapports.tauxOccupation')}</h3>
          {data.occupation.length === 0 ? (
            <div style={{ color: '#888', fontSize: 13 }}>{t('ongletRapports.aucuneDonnee')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.occupation} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="mois_label" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} domain={[0, 100]} tickFormatter={function(v) { return v + '%'; }} />
                <Tooltip formatter={function(v) { return [v + '%', t('ongletRapports.occupation')]; }} />
                <Bar dataKey={function(d) { return d.total_biens > 0 ? Math.round(d.biens_loues / d.total_biens * 100) : 0; }}
                  name="occupation" fill="#1B6B3A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenus par bien */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', margin: '0 0 16px' }}>{t('ongletRapports.revenusParBien')}</h3>
          {data.par_bien.length === 0 && (
            <div style={{ color: '#888', fontSize: 13 }}>{t('ongletRapports.aucunLogement')}</div>
          )}
          {data.par_bien.map(function(b, i) {
            var max = Math.max.apply(null, data.par_bien.map(function(x) { return Number(x.total_encaisse); }));
            var pct = max > 0 ? Math.round(Number(b.total_encaisse) / max * 100) : 0;
            return (
              <div key={b.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{b.titre}</span>
                  <span style={{ fontWeight: 700, color: '#1B6B3A', flexShrink: 0 }}>{GNF(b.total_encaisse)} GNF</span>
                </div>
                <div style={{ background: '#F0F0F0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #1B6B3A, #34A853)', width: pct + '%', height: '100%', borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ─── ANALYTICS CANDIDATURES ──────────────────────────── */}
      {data.candidatures && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', margin: '0 0 16px' }}>
            {t('ongletRapports.analyseCandidatures')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: t('ongletRapports.candidatures.totalRecues'),      val: data.candidatures.total_candidatures, color: '#1B2B22', bg: '#F5F5F5' },
              { label: t('ongletRapports.candidatures.acceptees'),         val: data.candidatures.acceptees,          color: '#1B6B3A', bg: '#E8F5E9' },
              { label: t('ongletRapports.candidatures.refusees'),          val: data.candidatures.refusees,           color: '#E53935', bg: '#FFEBEE' },
              { label: t('ongletRapports.candidatures.enAttente'),        val: data.candidatures.en_attente,         color: '#E65100', bg: '#FFF3E0' },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Taux d'acceptation */}
          <div style={{ background: '#F7F8F7', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>{t('ongletRapports.tauxAcceptation')}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: Number(data.candidatures.taux_acceptation) >= 50 ? '#1B6B3A' : '#E65100' }}>
                {data.candidatures.taux_acceptation || 0}%
              </span>
            </div>
            <div style={{ background: '#E0E0E0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div style={{
                background: Number(data.candidatures.taux_acceptation) >= 50 ? '#1B6B3A' : '#E65100',
                width: (data.candidatures.taux_acceptation || 0) + '%',
                height: '100%', borderRadius: 6, transition: 'width .6s'
              }} />
            </div>
            {data.meilleur_mois && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} strokeWidth={1.5} color="#F5A623" />
                <span>{t('ongletRapports.meilleurMoisAvant')}<strong style={{ color: '#1B6B3A' }}>{data.meilleur_mois.mois}</strong> - {GNF(data.meilleur_mois.total)} GNF</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PRÉVISIONS ────────────────────────────────────────── */}
      {data.evolution && data.evolution.length >= 3 && (function() {
        var derniersMois = data.evolution.slice(-3);
        var moyenneMensuelle = derniersMois.reduce(function(s, m) { return s + Number(m.revenus); }, 0) / 3;
        var prevision3mois = Math.round(moyenneMensuelle * 3);
        var prevision12mois = Math.round(moyenneMensuelle * 12);
        return (
          <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {t('ongletRapports.previsionsTitre')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: t('ongletRapports.moisProchain'),    val: GNF(Math.round(moyenneMensuelle)) + ' GNF' },
                { label: t('ongletRapports.trimestre'),        val: GNF(prevision3mois) + ' GNF'               },
                { label: t('ongletRapports.projectionAnnuelle'), val: GNF(prevision12mois) + ' GNF'           },
              ].map(function(p, i) {
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#F5A623', marginBottom: 4 }}>{p.val}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{p.label}</div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '12px 0 0', textAlign: 'center' }}>
              {t('ongletRapports.estimationNote')}
            </p>
          </div>
        );
      })()}

      {/* Historique paiements */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', margin: '0 0 16px' }}>{t('ongletRapports.historiquePaiements')}</h3>
        {data.paiements.length === 0 && (
          <div style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: 20 }}>{t('ongletRapports.aucunPaiementEnregistre')}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.paiements.map(function(p, i) {
            var cfg = p.statut === 'complete'
              ? { label: t('ongletHistorique.paiements.paye'), color: '#1B6B3A', bg: '#E8F5E9' }
              : p.statut === 'en_attente'
              ? { label: t('ongletHistorique.paiements.enAttente'), color: '#E65100', bg: '#FFF3E0' }
              : { label: p.statut, color: '#888', bg: '#F5F5F5' };
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: i % 2 === 0 ? '#FAFAFA' : '#fff', border: '0.5px solid #F0F0F0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>
                    {p.locataire_prenom} {p.locataire_nom}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {p.logement_titre} · {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {p.mode_paiement && ' · ' + p.mode_paiement}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: cfg.color }}>{GNF(p.montant)} GNF</div>
                  <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function SupprimerCompte({ onRetour, user }) {
  var t = useTranslation('dashboard').t;
  var auth     = useAuth();
  var navigate = useNavigate();
  var [etape, setEtape]     = useState(1); // 1=avertissement, 2=confirmation, 3=succès
  var [motDePasse, setMotDePasse] = useState('');
  var [loading, setLoading] = useState(false);
  var [erreur, setErreur]   = useState('');

  function confirmer() {
    if (etape === 1) { setEtape(2); return; }
    if (!motDePasse) { setErreur(t('supprimerCompte.erreurMotDePasseRequis')); return; }
    setLoading(true);
    api.delete('/auth/compte', { data: { mot_de_passe: motDePasse } })
      .then(function() {
        setEtape(3);
        setTimeout(function() {
          auth.logout();
          navigate('/');
        }, 3000);
      })
      .catch(function(err) {
        setErreur(err.response && err.response.data ? err.response.data.erreur : t('supprimerCompte.erreurSuppression'));
        setLoading(false);
      });
  }

  if (etape === 3) {
    return (
      <div className="dash-form-card" style={{ maxWidth: 500, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} strokeWidth={1.5} color="#1B6B3A" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B22', margin: '0 0 10px' }}>{t('supprimerCompte.compteSupprime')}</h3>
        <p style={{ fontSize: 14, color: '#888' }}>{t('supprimerCompte.donneesSupprimees')}</p>
      </div>
    );
  }

  return (
    <div className="dash-form-card" style={{ maxWidth: 500 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#E53935', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Trash2 size={20} strokeWidth={2} color="#E53935" />
        {t('supprimerCompte.titre')}
      </h3>

      {etape === 1 && (
        <>
          <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: '1px solid #FFCDD2' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#B71C1C', marginBottom: 10 }}>
              {t('supprimerCompte.attentionIrreversible')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                t('supprimerCompte.consequences.profilAnonymise'),
                t('supprimerCompte.consequences.logementsMasques'),
                t('supprimerCompte.consequences.candidaturesAnnulees'),
                t('supprimerCompte.consequences.messagesConserves'),
                t('supprimerCompte.consequences.donneesContractuelles'),
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#C62828' }}>
                    <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                    {item}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRetour}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('ongletLocataires.form.annuler')}
            </button>
            <button onClick={confirmer}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#E53935', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {t('supprimerCompte.continuer')}
            </button>
          </div>
        </>
      )}

      {etape === 2 && (
        <>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
            {t('supprimerCompte.confirmerAvecEmailAvant')}<strong>{user && user.email}</strong>{t('supprimerCompte.confirmerAvecEmailApres')}
          </p>

          {erreur && (
            <div style={{ background: '#FFEBEE', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B71C1C' }}>
              {erreur}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              {t('supprimerCompte.motDePasseActuel')}
            </label>
            <input type="password" placeholder={t('supprimerCompte.votreMotDePasse')} value={motDePasse}
              onChange={function(e) { setMotDePasse(e.target.value); setErreur(''); }}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setEtape(1); setMotDePasse(''); setErreur(''); }}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('supprimerCompte.retour')}
            </button>
            <button onClick={confirmer} disabled={loading}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#aaa' : '#E53935', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> {t('supprimerCompte.suppressionEnCours')}</>
                : t('supprimerCompte.supprimerDefinitivement')
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}
// ================================================
// ONGLET : Parametres
// ================================================
function OngletParametres(props) {
  var t = useTranslation('dashboard').t;
  var user = props.user;
  var auth = useAuth();
  var navigate = useNavigate();
  var [section, setSection] = useState(null);
  var [formProfil, setFormProfil] = useState({ prenom: user ? user.prenom : '', nom: user ? user.nom : '', email: user ? user.email : '', telephone: user ? user.telephone || '' : '' });
  var [formMdp, setFormMdp] = useState({ ancien: '', nouveau: '', confirmer: '' });
  var [notifs, setNotifs] = useState({ email: true, sms: true, loyers: true, bails: true, pannes: false });
  var [langue, setLangue] = useState('fr');
  var [saving, setSaving] = useState(false);
  var [scoreData, setScoreData] = useState(null);
  var [monAbonnement, setMonAbonnement] = useState(null);
  var [essaiEnCours, setEssaiEnCours] = useState(null);
  var [cycleChoisi, setCycleChoisi] = useState('mensuel');
  var [showPaiementAbo, setShowPaiementAbo] = useState(null);

  var PRIX_ABONNEMENT = { pro: 120000, agence: 300000 };
  var CYCLES_ABONNEMENT = {
    mensuel:    { label: t('ongletParametres.cycles.mensuel'), mois: 1,  reduction: 0    },
    semestriel: { label: t('ongletParametres.cycles.semestriel'),  mois: 6,  reduction: 0.10 },
    annuel:     { label: t('ongletParametres.cycles.annuel'),  mois: 12, reduction: 0.20 },
  };

  function chargerAbonnement() {
    api.get('/abonnements/mon-plan')
      .then(function(res) { setMonAbonnement(res.data); })
      .catch(console.error);
  }

  useEffect(function() {
    api.get('/auth/mon-score')
      .then(function(res) { setScoreData(res.data); })
      .catch(console.error);
    chargerAbonnement();
  }, []);

  function demarrerEssai(plan) {
    setEssaiEnCours(plan);
    api.post('/abonnements/essai', { plan: plan })
      .then(function() {
        toast.success(plan === 'pro' ? t('ongletParametres.toastEssaiProDemarre') : t('ongletParametres.toastEssaiAgenceDemarre'));
        chargerAbonnement();
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletParametres.erreur'));
      })
      .finally(function() { setEssaiEnCours(null); });
  }
  function saveProfil(e) {
    e.preventDefault();
    setSaving(true);
    api.put('/auth/profil', formProfil)
      .then(function() { toast.success(t('ongletParametres.toastProfilMisAJour')); setSection(null); })
      .catch(function() { toast.error(t('ongletParametres.toastErreurMiseAJour')); })
      .finally(function() { setSaving(false); });
  }

  function saveMdp(e) {
    e.preventDefault();
    if (formMdp.nouveau !== formMdp.confirmer) { toast.error(t('ongletParametres.toastMdpNeCorrespondentPas')); return; }
    if (formMdp.nouveau.length < 6) { toast.error(t('ongletParametres.toastMinimum6Caracteres')); return; }
    setSaving(true);
    api.put('/auth/changer-mot-de-passe', { ancien_mot_de_passe: formMdp.ancien, nouveau_mot_de_passe: formMdp.nouveau })
      .then(function() { toast.success(t('ongletParametres.toastMdpChange')); setFormMdp({ ancien: '', nouveau: '', confirmer: '' }); setSection(null); })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletParametres.erreur')); })
      .finally(function() { setSaving(false); });
  }

  var menuItems = [
    { id: 'profil', icon: <UserCheck size={22} strokeWidth={1.5} />, titre: t('ongletParametres.menu.profil.titre'), desc: t('ongletParametres.menu.profil.desc') },
    { id: 'mdp', icon: <Shield size={22} strokeWidth={1.5} />, titre: t('ongletParametres.menu.mdp.titre'), desc: t('ongletParametres.menu.mdp.desc') },
    { id: 'notifs', icon: <Bell size={22} strokeWidth={1.5} />, titre: t('ongletParametres.menu.notifs.titre'), desc: t('ongletParametres.menu.notifs.desc') },
    { id: 'langue', icon: <Globe size={22} strokeWidth={1.5} />, titre: t('ongletParametres.menu.langue.titre'), desc: t('ongletParametres.menu.langue.desc') },
    { id: 'score', icon: <Star size={22} strokeWidth={1.5} />, titre: t('ongletParametres.menu.score.titre'), desc: t('ongletParametres.menu.score.desc') },
    { id: 'notifs', icon: <Bell size={22} strokeWidth={1.5} />, titre: t('ongletParametres.menu.notifs.titre'), desc: t('ongletParametres.menu.notifs.desc') },
    { id: 'supprimer', icon: <Trash2 size={22} strokeWidth={1.5} color="#E53935" />, titre: t('ongletParametres.menu.supprimer.titre'), desc: t('ongletParametres.menu.supprimer.desc'), danger: true },
    { id: 'tour', icon: <HelpCircle size={22} strokeWidth={1.5} />, titre: t('ongletParametres.menu.tour.titre'), desc: t('ongletParametres.menu.tour.desc') },
  ];

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>{t('ongletParametres.titre')}</h1></div>
        {section && <button className="btn-outline-green" onClick={function() { setSection(null); }}>{t('supprimerCompte.retour')}</button>}
      </div>

      {!section && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
          <BadgeScore userId={user && user.id} />
          {menuItems.map(function(item) {
            return (
              <div key={item.id} onClick={function() { setSection(item.id); }}
                style={{ background: item.danger ? '#FFF5F5' : '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.15s', border: item.danger ? '1px solid #FFCDD2' : 'none' }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateX(0)'; }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1B2B22' }}>{item.titre}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
              </div>
            );
          })}

          {/* Badge plan actuel */}
<div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 12 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{t('ongletParametres.monAbonnement')}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
        {user && user.role !== 'locataire' ? t('ongletParametres.planActuel') : t('ongletParametres.accesLocataireGratuit')}
      </div>
    </div>
    <div style={{ background: user && user.plan === 'pro' ? '#E8F5E9' : user && user.plan === 'agence' ? '#E3F2FD' : '#F5F5F5', color: user && user.plan === 'pro' ? '#1B6B3A' : user && user.plan === 'agence' ? '#1565C0' : '#888', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
      {user && user.plan ? user.plan : t('ongletParametres.gratuit')}
    </div>
  </div>

  {monAbonnement && monAbonnement.abonnement && monAbonnement.abonnement.statut === 'impaye' && (
    <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#B71C1C' }}>
      {t('ongletParametres.abonnementImpaye')}
    </div>
  )}

  {monAbonnement && monAbonnement.jours_restants !== null && monAbonnement.plan !== 'gratuit' && monAbonnement.abonnement && monAbonnement.abonnement.statut !== 'impaye' && (
    <div style={{ fontSize: 12, color: monAbonnement.jours_restants <= 5 ? '#E65100' : '#888', marginTop: 8, fontWeight: monAbonnement.jours_restants <= 5 ? 700 : 400 }}>
      {monAbonnement.jours_restants > 0
        ? t('ongletParametres.joursRestants', { type: monAbonnement.abonnement.statut === 'essai' ? t('ongletParametres.essaiGratuit') : t('ongletParametres.abonnement'), n: monAbonnement.jours_restants })
        : t('ongletParametres.abonnementExpire')}
    </div>
  )}

  {user && user.role !== 'locataire' && monAbonnement && monAbonnement.plan === 'gratuit' && (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button onClick={function() { demarrerEssai('pro'); }} disabled={essaiEnCours === 'pro'}
        style={{ flex: 1, background: essaiEnCours === 'pro' ? '#aaa' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {essaiEnCours === 'pro' ? '...' : t('ongletParametres.essaiProBouton')}
      </button>
      <button onClick={function() { demarrerEssai('agence'); }} disabled={essaiEnCours === 'agence'}
        style={{ flex: 1, background: essaiEnCours === 'agence' ? '#aaa' : '#7B1FA2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {essaiEnCours === 'agence' ? '...' : t('ongletParametres.essaiAgenceBouton')}
      </button>
    </div>
  )}

  {user && user.role !== 'locataire' && monAbonnement && ['pro', 'agence'].includes(monAbonnement.plan) && (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid #F0F0F0' }}>
      <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 6 }}>{t('ongletParametres.cycleFacturation')}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {Object.keys(CYCLES_ABONNEMENT).map(function(c) {
          var actif = cycleChoisi === c;
          return (
            <button key={c} onClick={function() { setCycleChoisi(c); }}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: actif ? '1.5px solid #1B6B3A' : '1px solid #E0E0E0', background: actif ? '#E8F5E9' : '#fff', color: actif ? '#1B6B3A' : '#888', fontSize: 11, fontWeight: actif ? 700 : 500, cursor: 'pointer' }}>
              {CYCLES_ABONNEMENT[c].label}
            </button>
          );
        })}
      </div>
      <button onClick={function() { setShowPaiementAbo(monAbonnement.plan); }}
        style={{ width: '100%', background: '#1B2B22', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {t('ongletParametres.payerMobileMoney')}
      </button>
    </div>
  )}
</div>

{showPaiementAbo && (
  <ModalPaiementMobile
    montant={Math.round(PRIX_ABONNEMENT[showPaiementAbo] * CYCLES_ABONNEMENT[cycleChoisi].mois * (1 - CYCLES_ABONNEMENT[cycleChoisi].reduction))}
    titre={t('ongletParametres.abonnementTitre', { plan: showPaiementAbo === 'pro' ? 'Pro' : 'Agence', cycle: CYCLES_ABONNEMENT[cycleChoisi].label })}
    payload={{ plan: showPaiementAbo, cycle: cycleChoisi }}
    endpoints={{
      orange:    '/abonnements/orange-money/initier',
      mtn:       '/abonnements/mtn-momo/initier',
      confirmer: '/abonnements/confirmer/',
    }}
    onClose={function() { setShowPaiementAbo(null); }}
    onSuccess={function() { chargerAbonnement(); }}
  />
)}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 600 }}>{t('ongletParametres.infosCompte')}</div>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>{t('ongletParametres.emailLabel')} {user && user.email}</div>
            <div style={{ fontSize: 14, color: '#333' }}>{t('ongletParametres.roleLabel')} {user && user.role}</div>
          </div>
      {user && user.role === 'admin' && (
        <button
          onClick={function() { window.location.href = '/admin'; }}
          style={{ background: '#1B2B22', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><Settings size={16} strokeWidth={1.5}/> {t('ongletParametres.panneauAdmin')}</span>
        </button>
      )}
          <button onClick={function() { auth.logout(); }}
            style={{ background: '#FFEBEE', color: '#B71C1C', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {t('ongletParametres.seDeconnecter')}
          </button>
        </div>
      )}

      {section === 'profil' && (
        <div className="dash-form-card" style={{ maxWidth: 560 }}>
          <h3>{t('ongletParametres.modifierProfil')}</h3>
          <form onSubmit={saveProfil}>
            <div className="form-row-2">
              <div className="form-group"><label>{t('ongletLocataires.form.prenom').replace(' *','')}</label><input type="text" value={formProfil.prenom} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { prenom: e.target.value })); }} required /></div>
              <div className="form-group"><label>{t('ongletLocataires.form.nom').replace(' *','')}</label><input type="text" value={formProfil.nom} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { nom: e.target.value })); }} required /></div>
            </div>
            <div className="form-group"><label>{t('ongletLocataires.form.email')}</label><input type="email" value={formProfil.email} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { email: e.target.value })); }} required /></div>
            <div className="form-group"><label>{t('ongletLocataires.form.telephone')}</label><input type="tel" placeholder="+224 622 00 00 00" value={formProfil.telephone} onChange={function(e) { setFormProfil(Object.assign({}, formProfil, { telephone: e.target.value })); }} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green" disabled={saving}>{saving ? t('ongletParametres.sauvegardeEnCours') : t('ongletLocataires.form.sauvegarder')}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setSection(null); }}>{t('ongletLocataires.form.annuler')}</button>
            </div>
          </form>
        </div>
      )}
  {section === 'tour' && (
  <div className="dash-form-card" style={{ maxWidth: 480, textAlign: 'center' }}>
    <HelpCircle size={48} strokeWidth={1} color="#1B6B3A" style={{ marginBottom: 16 }} />
    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>{t('ongletParametres.menu.tour.titre')}</h3>
    <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px', lineHeight: 1.6 }}>
      {t('ongletParametres.tour.description')}
    </p>
    <button onClick={function() { tour.relancer(); setSection(null); }}
      style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
      {t('ongletParametres.tour.lancer')}
    </button>
  </div>
  )}

      {section === 'mdp' && (
        <div className="dash-form-card" style={{ maxWidth: 480 }}>
          <h3>{t('ongletParametres.changerMdp')}</h3>
          <form onSubmit={saveMdp}>
            <div className="form-group"><label>{t('supprimerCompte.motDePasseActuel').replace(' *','')}</label><input type="password" value={formMdp.ancien} onChange={function(e) { setFormMdp(Object.assign({}, formMdp, { ancien: e.target.value })); }} required /></div>
            <div className="form-group"><label>{t('ongletParametres.nouveauMdp')}</label><input type="password" placeholder={t('ongletParametres.minimum6Caracteres')} value={formMdp.nouveau} onChange={function(e) { setFormMdp(Object.assign({}, formMdp, { nouveau: e.target.value })); }} required /></div>
            <div className="form-group"><label>{t('ongletParametres.confirmer')}</label><input type="password" value={formMdp.confirmer} onChange={function(e) { setFormMdp(Object.assign({}, formMdp, { confirmer: e.target.value })); }} required /></div>
            {formMdp.nouveau && formMdp.confirmer && formMdp.nouveau !== formMdp.confirmer && (
              <div style={{ fontSize: 12, color: '#B71C1C', marginBottom: 10 }}>{t('ongletParametres.toastMdpNeCorrespondentPas')}</div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-green" disabled={saving}>{saving ? t('ongletParametres.changementEnCours') : t('ongletParametres.changer')}</button>
              <button type="button" className="btn-outline-green" onClick={function() { setSection(null); }}>{t('ongletLocataires.form.annuler')}</button>
            </div>
          </form>
        </div>
      )}

      {section === 'notifs' && (
        <div className="dash-form-card" style={{ maxWidth: 480 }}>
          <h3>{t('ongletParametres.preferencesNotifs')}</h3>
          <PushToggle />
          {[
            { key: 'email', label: t('ongletParametres.notifs.email') },
            { key: 'sms', label: t('ongletParametres.notifs.sms') },
            { key: 'loyers', label: t('ongletParametres.notifs.loyers') },
            { key: 'bails', label: t('ongletParametres.notifs.bails') },
            { key: 'pannes', label: t('ongletParametres.notifs.pannes') }
          ].map(function(n) {
            return (
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{n.label}</div>
                <div onClick={function() { setNotifs(function(prev) { var next = Object.assign({}, prev); next[n.key] = !next[n.key]; return next; }); }}
                  style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: notifs[n.key] ? '#1B6B3A' : '#e0e0e0', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notifs[n.key] ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-green" onClick={function() { toast.success(t('ongletParametres.toastPreferencesSauvegardees')); setSection(null); }}>{t('ongletLocataires.form.sauvegarder')}</button>
            <button className="btn-outline-green" onClick={function() { setSection(null); }}>{t('ongletLocataires.form.annuler')}</button>
          </div>
        </div>

      )}
      {section === 'notifs' && (
  <div className="dash-form-card" style={{ maxWidth: 560 }}>
    <h3>{t('ongletMessages.titre')}</h3>
    <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
      {t('ongletParametres.notifsPushDescription')}
    </p>
    <BoutonNotifPush />
    <button className="btn-outline-green" style={{ width: '100%', marginTop: 14 }}
      onClick={function() { setSection(null); }}>
      {t('ongletReservationsProprio.retourListe')}
    </button>
  </div>
)}

      {section === 'langue' && (
        <div className="dash-form-card" style={{ maxWidth: 480 }}>
          <h3>{t('ongletParametres.langueInterface')}</h3>
          {[{ code: 'fr', label: t('ongletParametres.langueFrGuinee'), flag: '🇬🇳' }, { code: 'fr-fr', label: t('ongletParametres.langueFrFrance'), flag: '🇫🇷' }, { code: 'en', label: 'English', flag: '🇬🇧' }].map(function(l) {
            return (
              <div key={l.code} onClick={function() { setLangue(l.code); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', border: langue === l.code ? '2px solid #1B6B3A' : '1px solid #e0e0e0', background: langue === l.code ? '#E8F5E9' : '#fff', marginBottom: 8, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 24 }}>{l.flag}</span>
                <span style={{ fontSize: 14, fontWeight: langue === l.code ? 600 : 400 }}>{l.label}</span>
                {langue === l.code && <Check size={16} strokeWidth={2} color="#1B6B3A" style={{ marginLeft: 'auto' }} />}
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-green" onClick={function() { toast.success(t('ongletParametres.toastLangueSauvegardee')); setSection(null); }}>{t('ongletLocataires.form.sauvegarder')}</button>
            <button className="btn-outline-green" onClick={function() { setSection(null); }}>{t('ongletLocataires.form.annuler')}</button>
          </div>
        </div>
      )}
      {section === 'score' && scoreData && (
        <div className="dash-form-card" style={{ maxWidth: 560 }}>
          <h3>{t('ongletParametres.monScoreConfiance')}</h3>
          <div style={{ textAlign: 'center', padding: '24px 0', marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#F0F0F0" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={scoreData.couleur} strokeWidth="10"
                  strokeDasharray={`${scoreData.score * 3.27} 327`}
                  strokeLinecap="round" transform="rotate(-90 60 60)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: scoreData.couleur }}>{scoreData.score}</div>
                <div style={{ fontSize: 10, color: '#888' }}>/ 100</div>
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: scoreData.bg, borderRadius: 20, padding: '5px 14px' }}>
              <span>{scoreData.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: scoreData.couleur }}>{scoreData.label}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {scoreData.criteres && scoreData.criteres.map(function(c, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: c.atteint ? '#F0FBF0' : '#F9F9F9', border: '0.5px solid ' + (c.atteint ? '#A5D6A7' : '#E0E0E0') }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.atteint ? '#1B6B3A' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.atteint
                      ? <CheckCircle size={16} strokeWidth={2.5} color="#fff" />
                      : <span style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>+{c.points}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.atteint ? '#1B2B22' : '#888' }}>{c.label}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.atteint ? '#1B6B3A' : '#aaa' }}>
                    {c.atteint ? '+' + c.points : '0'} pts
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#7B4F00', marginBottom: 14 }}>
            {t('ongletParametres.ameliorerScore')}
          </div>
          <button className="btn-outline-green" style={{ width: '100%' }}
            onClick={function() { setSection(null); }}>
            {t('ongletReservationsProprio.retourListe')}
          </button>
        </div>
      )}
      {section === 'supprimer' && (
        <SupprimerCompte onRetour={function() { setSection(null); }} user={user} />
      )}
    </div>
  );
}
// ================================================
// ONGLET : Mes locations (locataire)
// ================================================
function OngletMesLocations(props) {
  var t = useTranslation('dashboard').t;
  var stats    = props.stats;
  var setOnglet = props.setOnglet;
  var locationsActives = stats.reservations.filter(function(r) { return r.statut === 'confirmee'; });

  return (
    <div>
      <div className="dash-page-header">
        <div><h1>{t('ongletBiens.locataire.titre')}</h1><p>{t('ongletBiens.locataire.locationsActives', { count: locationsActives.length })}</p></div>
        <Link to="/logements" className="btn-green" style={{ textDecoration: 'none' }}>
          {t('ongletBiens.locataire.chercherLogement')}
        </Link>
      </div>

      {locationsActives.length === 0 && (
        <div className="dash-empty-state">
          <Home size={48} strokeWidth={1} color="#C8E6C9" />
          <h3>{t('ongletBiens.locataire.aucuneLocation.titre')}</h3>
          <p>{t('ongletBiens.locataire.aucuneLocation.description')}</p>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
            {t('ongletBiens.locataire.aucuneLocation.trouverLogement')}
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {locationsActives.map(function(r) {
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #1B6B3A' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: '#E8F5E9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Home size={22} strokeWidth={1.5} color="#1B6B3A" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>{r.logement_titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                    {t('ongletMesLocations.depuisLe', { date: r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletReservationsProprio.na') })}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B6B3A', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || 0)} GNF/mois
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}> / mois</span>
                  </div>
                </div>
                <div style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {t('ongletMesLocations.active')}
                </div>
              </div>

              {/* Boutons locataire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link to={'/reservation/' + r.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '0.5px solid #A5D6A7' }}>
                  {t('ongletBiens.locataire.details')}
                </Link>
                <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#E3F2FD', color: '#1565C0', fontSize: 13, fontWeight: 600, border: '0.5px solid #90CAF9', cursor: 'pointer' }}>
                  <FileText size={14} strokeWidth={1.5} /> {t('ongletBiens.locataire.documents')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function UpgradePrompt({ fonctionnalite, planRequis, setOnglet }) {
  var t = useTranslation('dashboard').t;
  var navigate = useNavigate();
  var CONFIGS = {
    multi_users: {
      titre:  t('upgradePrompt.multiUtilisateurs.titre'),
      desc:   t('upgradePrompt.multiUtilisateurs.desc'),
      icon:   <Users size={36} strokeWidth={1} color="#7B1FA2" />,
      bg:     '#F3E5F5',
      color:  '#7B1FA2',
    },
    logements_illimites: {
      titre:  t('upgradePrompt.logementsIllimites.titre'),
      desc:   t('upgradePrompt.logementsIllimites.desc'),
      icon:   <Building2 size={36} strokeWidth={1} color="#7B1FA2" />,
      bg:     '#F3E5F5',
      color:  '#7B1FA2',
    },
  };
  var cfg = CONFIGS[fonctionnalite] || { titre: t('upgradePrompt.defaut.titre'), desc: t('upgradePrompt.defaut.desc'), icon: <Zap size={36} strokeWidth={1} color="#7B1FA2" />, bg: '#F3E5F5', color: '#7B1FA2' };

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 420, margin: '40px auto', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ width: 72, height: 72, background: cfg.bg, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        {cfg.icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>{cfg.titre}</h3>
      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>{cfg.desc}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={function() { navigate('/pricing'); }}
          style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: '#7B1FA2', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {t('upgradePrompt.passerPlanAgence')}
        </button>
        <button onClick={function() { setOnglet('/dashboard'); }}
          style={{ padding: '12px 20px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer' }}>
          {t('supprimerCompte.retour')}
        </button>
      </div>
    </div>
  );
}
// ================================================
// COMPOSANT PRINCIPAL : Dashboard
// ================================================
export default function Dashboard() {
  var t = useTranslation('dashboard').t;
  var auth = useAuth();
  var user = auth.user;
  var navigate = useNavigate();

  var [onglet, setOnglet] = useState('/dashboard');
  var [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  var [isMobile, setIsMobile]       = useState(window.innerWidth <= 768);
  var [loading, setLoading] = useState(true);
  var [showNotif, setShowNotif] = useState(false);
  var [alertes, setAlertes] = useState([]);
  var [stats, setStats] = useState({ logements: [], reservations: [], paiements: [] });
  var [monPlan, setMonPlan] = useState({ plan: 'gratuit', droits: { max_biens: 2, mobile_money: false, documents_pdf: false }, nb_biens: 0 });
  var [showOnboarding, setShowOnboarding] = useState(false);
  var [enLigne, setEnLigne] = useState(navigator.onLine);
  var [installPrompt, setInstallPrompt] = useState(null);
  var [showInstall, setShowInstall]     = useState(false);

useInactivite(true);

useEffect(function() {
  function handler(e) {
    e.preventDefault();
    setInstallPrompt(e);
    // Montrer la bannière si pas déjà installée
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(true);
    }
  }
  window.addEventListener('beforeinstallprompt', handler);
  return function() { window.removeEventListener('beforeinstallprompt', handler); };
}, []);

function installerApp() {
  if (!installPrompt) return;
  installPrompt.prompt();
  installPrompt.userChoice.then(function(result) {
    if (result.outcome === 'accepted') {
      toast.success(t('dashboardMain.toastInstalle'));
    }
    setShowInstall(false);
    setInstallPrompt(null);
  });
}

  var premierChargement = useRef(true);
  var { darkMode, toggleDarkMode } = useDarkMode();
  var tour = useOnboarding(user && user.role);
  // ================================================
  // Titres et icones des onglets
  // ================================================
 var pageTitle = {
  '/dashboard':              t('sidebar.nav.tableauDeBord'),
  '/dashboard/biens':        t('sidebar.nav.mesBiens'),
  '/dashboard/locataires':   t('sidebar.nav.locataires'),
  '/dashboard/reservations': user && (user.role === 'proprietaire' || user.role === 'les_deux') ? t('ongletReservationsProprio.liste.titre') : t('ongletReservations.locataire.titre'),
  '/dashboard/paiements':    t('sidebar.nav.paiements'),
  '/dashboard/documents':    t('sidebar.nav.documents'),
  '/dashboard/alertes':      t('ongletAlertes.titre'),
  '/dashboard/messages':     t('sidebar.nav.messages'),
  '/dashboard/reclamations': t('sidebar.nav.reclamations'),
  '/dashboard/preavis':      t('sidebar.nav.preavis'),
  '/dashboard/parametres':   t('sidebar.nav.parametres'),
  '/dashboard/mes-locations': t('sidebar.nav.mesLocations'),
  '/dashboard/rapports':      t('ongletRapports.titre'),
  '/dashboard/historique': t('ongletHistorique.titre'),
};
  var pageIcon = {
    '/dashboard':              '',
    '/dashboard/biens':        '',
    '/dashboard/locataires':   '',
    '/dashboard/reservations': '',
    '/dashboard/paiements':    '',
    '/dashboard/documents':    '',
    '/dashboard/alertes':      '',
    '/dashboard/messages':     '',
    '/dashboard/reclamations': '',
    '/dashboard/preavis':      '',
    '/dashboard/parametres':   '',
    '/dashboard/mes-locations': '',
    '/dashboard/rapports': '',
  };

  // Détecter le resize
useEffect(function() {
  function handleResize() {
    var mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    if (!mobile && !sidebarOpen) setSidebarOpen(true);
    if (mobile) setSidebarOpen(false);
  }
  window.addEventListener('resize', handleResize);
  return function() { window.removeEventListener('resize', handleResize); };
}, []);

useEffect(function() {
  function handleOnline()  { setEnLigne(true);  toast.success(t('dashboardMain.connexionRetablie')); }
  function handleOffline() { setEnLigne(false); toast.error(t('dashboardMain.connexionPerdue'));    }
  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);
  return function() {
    window.removeEventListener('online',  handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

 useEffect(function() {
  var savedOnglet = localStorage.getItem('dashboardOnglet');
  if (savedOnglet) {
    setOnglet(savedOnglet);
    localStorage.removeItem('dashboardOnglet');
  }
  chargerDonnees();

  // ── Écouter les événements de refresh ────────────────────────
  function handleRefresh() { chargerDonnees(); }
  // Afficher l'onboarding si premier login
  if (user && !user.onboarding_termine) {
    setShowOnboarding(true);
  }
  window.addEventListener('werdhe:refresh', handleRefresh);

  // ── Raccourcis clavier ──────────────
    function handleRaccourcis(e) {
      // Ignorer si on est dans un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // G + B → Mes biens
      if (e.key === 'b') { setOnglet('/dashboard/biens');        toast(t('sidebar.nav.mesBiens'),        { duration: 800 }); }
      // G + R → Réservations
      if (e.key === 'r') { setOnglet('/dashboard/reservations'); toast(t('dashboardMain.raccourciReservations'),      { duration: 800 }); }
      // G + M → Messages
      if (e.key === 'm') { setOnglet('/dashboard/messages');     toast(<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MessageCircle size={14} strokeWidth={1.5} /> {t('sidebar.nav.messages')}</span>, { duration: 800 }); }
      // G + P → Paiements
      if (e.key === 'p') { setOnglet('/dashboard/paiements');    toast(t('sidebar.nav.paiements'),         { duration: 800 }); }
      // G + H → Accueil (overview)
      if (e.key === 'h') { setOnglet('/dashboard');              toast(t('sidebar.nav.tableauDeBord'),   { duration: 800 }); }
    }
    window.addEventListener('keydown', handleRaccourcis);

  // ── Polling silencieux toutes les 15 secondes ─────────────────
  var interval = setInterval(chargerDonnees, 15000);

  return function() {
    window.removeEventListener('werdhe:refresh', handleRefresh);
    window.removeEventListener('keydown', handleRaccourcis);
    clearInterval(interval);
  };
}, []);

function chargerDonnees() {
  if (premierChargement.current) setLoading(true);

  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');
  var req;

  if (estProprietaire) {
    req = Promise.all([
      api.get('/logements/proprietaire/mes-logements').catch(function() { return { data: { logements: [] } }; }),
      api.get('/reservations/proprietaire').catch(function() { return { data: { reservations: [] } }; }),
      api.get('/paiements/proprietaire').catch(function() { return { data: { paiements: [] } }; }),
      api.get('/alertes').catch(function() { return { data: { alertes: [] } }; }),
    ]).then(function(results) {
      setStats({
        logements:    results[0].data.logements    || [],
        reservations: results[1].data.reservations || [],
        paiements:    results[2].data.paiements    || [],
      });
      setAlertes(results[3].data.alertes || []);
    });
  } else {
    req = Promise.all([
      api.get('/reservations/mes-reservations'),
      api.get('/paiements/mes-paiements'),
      api.get('/alertes/mes-alertes').catch(function() { return { data: { alertes: [] } }; }),
    ]).then(function(results) {
      setStats({
        logements:    [],
        reservations: results[0].data.reservations || [],
        paiements:    results[1].data.paiements    || [],
      });
      setAlertes(results[2].data.alertes || []);
    });
  }

  // Charger le plan en parallèle
  api.get('/abonnements/mon-plan')
    .then(function(res) { setMonPlan(res.data); })
    .catch(console.error);

  req.catch(console.error).finally(function() {
    setLoading(false);
    premierChargement.current = false;
    // Rendre refresh accessible globalement
    window.__werdheRefresh = chargerDonnees;
  });
}

  function traiterReservation(id, statut) {
    api.patch('/reservations/' + id + '/traiter', { statut: statut })
      .then(function() { toast.success(statut === 'confirmee' ? t('dashboardMain.toastReservationConfirmee') : t('dashboardMain.toastReservationAnnulee')); chargerDonnees(); })
      .catch(function() { toast.error(t('ongletParametres.erreur')); });
  }

// ================================================
  // Helper - vérifier accès par plan
  // ================================================
  function peutAcceder(fonctionnalite) {
    var droitsAgence = ['multi_users', 'codes_promo', 'rapport_auto'];
    if (droitsAgence.includes(fonctionnalite)) {
      return monPlan && monPlan.plan === 'agence';
    }
    return true;
  }
  // ================================================
  // Rendu de l'onglet actif
  // ================================================
  var renderOnglet = useMemo(function() {
    if (onglet === '/dashboard') return <OngletOverview stats={stats} user={user} alertes={alertes} setOnglet={setOnglet} />;
    if (onglet === '/dashboard/biens')  return <OngletBiens stats={stats} recharger={chargerDonnees} user={user} setOnglet={setOnglet} plan={monPlan} />;
    if (onglet === '/dashboard/locataires') return <OngletLocataires stats={stats} logements={stats.logements} />;
    if (onglet === '/dashboard/reservations') return <OngletReservations stats={stats} traiter={traiterReservation} user={user} navigate={navigate} recharger={chargerDonnees} />;
    if (onglet === '/dashboard/paiements') return <OngletPaiements stats={stats} user={user} plan={monPlan} />;
    if (onglet === '/dashboard/preavis') return <OngletPreavis user={user} setOnglet={setOnglet} />;
    if (onglet === '/dashboard/documents')  return <OngletDocuments user={user} plan={monPlan} />;
    if (onglet === '/dashboard/alertes') return <OngletAlertes />;
    if (onglet === '/dashboard/messages') return <OngletMessages />;
    if (onglet === '/dashboard/reclamations') return <OngletReclamations />;
    if (onglet === '/dashboard/parametres') return <OngletParametres user={user} />;
    if (onglet === '/dashboard/mes-locations') return <OngletMesLocations stats={stats} setOnglet={setOnglet} />;
    if (onglet === '/dashboard/rapports') return <OngletRapports user={user} />;
    if (onglet === '/dashboard/historique') return <OngletHistorique user={user} />;
    return <OngletOverview stats={stats} user={user} alertes={alertes} setOnglet={setOnglet} />;
  }, [onglet, stats, user, alertes, monPlan]);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dash-loading">
          <div style={{ width: 40, height: 40, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          {t('dashboardMain.chargement')}
        </div>
      </div>
    );
  }
  var sidebarWidth = isMobile ? 0 : sidebarOpen ? 220 : 64;
  return (
    <div className="dashboard-wrapper">

      {/* Overlay sombre sur mobile quand sidebar ouverte */}
{isMobile && sidebarOpen && (
  <div
    className="sidebar-overlay"
    onClick={function() { setSidebarOpen(false); }} />
)}
{showOnboarding && (
  <Onboarding onTermine={function() { setShowOnboarding(false); }} />
)}
{/* Bannière installation PWA */}
{showInstall && (
  <div style={{ position: 'fixed', bottom: isMobile ? 70 : 20, left: '50%', transform: 'translateX(-50%)', background: '#1B2B22', color: '#fff', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 9999, maxWidth: 380, width: 'calc(100% - 32px)' }}>
    <div style={{ flexShrink: 0 }}><Download size={26} strokeWidth={1.5} color="#fff" /></div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{t('dashboardMain.installerWerdhe')}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t('dashboardMain.accesRapide')}</div>
    </div>
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button onClick={function() { setShowInstall(false); }}
        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
        {t('dashboardMain.plusTard')}
      </button>
      <button onClick={installerApp}
        style={{ background: '#F5A623', border: 'none', color: '#1B2B22', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {t('dashboardMain.installer')}
      </button>
    </div>
  </div>
)}
{isMobile && sidebarOpen && (
  <div
    onClick={function() { setSidebarOpen(false); }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
)}
<Sidebar
    ongletActif={onglet}
    setOnglet={function(o) { setOnglet(o); if (isMobile) setSidebarOpen(false); }}
    open={sidebarOpen} />
                  <div className={'dashboard-main' + (sidebarOpen && !isMobile ? ' sidebar-open' : '')}>
        <div className="dash-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 62, background: '#fff', borderBottom: '1px solid #EBEBEB', position: 'sticky', top: 0, zIndex: 100 }}>

          {/* ── GAUCHE : toggle + logo ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button className="dash-toggle-btn" onClick={function() { setSidebarOpen(!sidebarOpen); }} type="button"
              style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F6FA', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
              <Menu size={18} strokeWidth={1.5} />
            </button>
            {!sidebarOpen && !isMobile && (
              <Logo size={30} showText={true} darkBg={false} />
            )}
          </div>

          {/* ── CENTRE : onglets navigation ── */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#F5F6FA', borderRadius: 12, padding: '3px' }}>
              {(user && (user.role === 'proprietaire' || user.role === 'les_deux') ? [
                { path: '/dashboard',              label: t('dashboardMain.nav.accueil')      },
                { path: '/dashboard/biens',        label: t('sidebar.nav.mesBiens')    },
                { path: '/dashboard/reservations', label: t('sidebar.nav.candidatures') },
                { path: '/dashboard/messages',     label: t('sidebar.nav.messages')     },
                { path: '/dashboard/rapports',     label: t('dashboardMain.nav.rapports')     },
                { path: '/dashboard/documents',    label: t('sidebar.nav.documents')    },
              ] : [
                { path: '/dashboard',               label: t('dashboardMain.nav.accueil')      },
                { path: '/dashboard/mes-locations', label: t('dashboardMain.nav.locations')    },
                { path: '/dashboard/reservations',  label: t('sidebar.nav.candidatures') },
                { path: '/dashboard/messages',      label: t('sidebar.nav.messages')     },
                { path: '/dashboard/paiements',     label: t('sidebar.nav.paiements')    },
                { path: '/dashboard/documents',     label: t('sidebar.nav.documents')    },
              ]).map(function(item) {
                var actif = onglet === item.path;
                return (
                  <button key={item.path}
                    onClick={function() { setOnglet(item.path); }}
                    style={{ padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: actif ? 700 : 500, background: actif ? '#fff' : 'transparent', color: actif ? '#1B2B22' : '#888', boxShadow: actif ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── DROITE : recherche, notifs, avatar ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isMobile && <RechercheGlobale stats={stats} onNavigate={setOnglet} />}

            {!enLigne && (
              <div style={{ background: '#E53935', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                {t('dashboardMain.horsLigne')}
              </div>
            )}

            {/* Cloche */}
            <button className="dash-notif-btn" type="button"
              onClick={function() {
                var nouvelEtat = !showNotif;
                setShowNotif(nouvelEtat);
                if (nouvelEtat && alertes.length > 0) {
                  var estLocataire = user && user.role === 'locataire';
                  api.patch(estLocataire ? '/alertes/mes-alertes/lues' : '/alertes/lues')
                    .then(function() {
                      setAlertes(function(prev) { return prev.map(function(a) { return Object.assign({}, a, { lu: true }); }); });
                    }).catch(console.error);
                }
              }}
              style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, background: '#F5F6FA', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
              <Bell size={17} strokeWidth={1.5} />
              {alertes.filter(function(a) { return !a.lu; }).length > 0 && (
                <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: '#E53935', borderRadius: '50%', border: '2px solid #fff' }} />
              )}
            </button>

            {/* Mode sombre */}
            <button onClick={toggleDarkMode}
              style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F6FA', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
              {darkMode ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>

            {/* Avatar */}
            <div onClick={function() { setOnglet('/dashboard/parametres'); }}
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#1B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              {user ? ((user.prenom || '').charAt(0) + (user.nom || '').charAt(0)).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
        {showNotif && (
          <div style={{ position: 'relative' }}>
            <NotifPanel alertes={alertes} onClose={function() { setShowNotif(false); }} />
          </div>
        )}
        <div className="dash-scroll">
          {renderOnglet}
        </div>
        {/* Bouton + flottant mobile (proprio) */}  
{isMobile && user && (user.role === 'proprietaire' || user.role === 'les_deux') && (
  <button
    onClick={function() { navigate('/logements/ajouter'); }}
    style={{ position: 'fixed', bottom: 74, right: 16, width: 52, height: 52, borderRadius: '50%', background: '#1B6B3A', border: 'none', boxShadow: '0 4px 16px rgba(27,107,58,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 499 }}>
    <Plus size={24} color="#fff" strokeWidth={2.5} />
  </button>
)}
{/* Barre navigation mobile */}
{isMobile && (
  <div style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#fff', borderTop: '0.5px solid #E0E0E0',
    display: 'flex', justifyContent: 'space-around',
    padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
    zIndex: 500, boxShadow: '0 -4px 12px rgba(0,0,0,0.08)'
  }}>
    {(user && user.role === 'locataire' ? [
      { path: '/dashboard',               icon: <LayoutDashboard size={22} strokeWidth={1.5} />, label: t('dashboardMain.nav.accueil')   },
      { path: '/dashboard/mes-locations', icon: <Home            size={22} strokeWidth={1.5} />, label: t('dashboardMain.nav.locations') },
            { path: '/dashboard/messages', icon: (
        <div style={{ position: 'relative' }}>
          <MessageCircle size={22} strokeWidth={1.5} />
          {alertes && alertes.filter(function(a) { return !a.lu && a.type === 'message'; }).length > 0 && (
            <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#E53935', borderRadius: '50%' }} />
          )}
        </div>
      ), label: t('sidebar.nav.messages') },
      { path: '/dashboard/paiements',     icon: <CreditCard      size={22} strokeWidth={1.5} />, label: t('sidebar.nav.paiements') },
      { path: '/dashboard/historique', icon: <Clock size={22} strokeWidth={1.5} />, label: t('sidebar.nav.historique') },
      { path: '/dashboard/parametres',    icon: <Settings        size={22} strokeWidth={1.5} />, label: t('dashboardMain.nav.profil')    },
    ] : [
      { path: '/dashboard',               icon: <LayoutDashboard size={22} strokeWidth={1.5} />, label: t('dashboardMain.nav.accueil')   },
      { path: '/dashboard/biens',         icon: <Home            size={22} strokeWidth={1.5} />, label: t('dashboardMain.nav.biens')     },
      { path: '/dashboard/reservations',  icon: <CalendarCheck   size={22} strokeWidth={1.5} />, label: t('dashboardMain.nav.resas')     },
            { path: '/dashboard/messages', icon: (
        <div style={{ position: 'relative' }}>
          <MessageCircle size={22} strokeWidth={1.5} />
          {alertes && alertes.filter(function(a) { return !a.lu && a.type === 'message'; }).length > 0 && (
            <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#E53935', borderRadius: '50%' }} />
          )}
        </div>
      ), label: t('sidebar.nav.messages') },
      { path: '/dashboard/parametres',    icon: <Settings        size={22} strokeWidth={1.5} />, label: t('dashboardMain.nav.profil')    },
    ]).map(function(item) {
      var actif = onglet === item.path;
      return (
        <button key={item.path}
          onClick={function() { setOnglet(item.path); }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 10, flex: 1,
            color: actif ? '#1B6B3A' : '#888',
            transition: 'all .15s'
          }}>
          {item.icon}
          <span style={{ fontSize: 10, fontWeight: actif ? 700 : 400, letterSpacing: 0.2 }}>{item.label}</span>
          {actif && <div style={{ width: 4, height: 4, background: '#1B6B3A', borderRadius: '50%', marginTop: 2 }} />}
        </button>
      );
    })}
   </div>
)}
      </div>
    </div>
  );
}