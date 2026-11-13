/* eslint-disable */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { urlPremierePhoto } from '../utils/photos';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import toast from 'react-hot-toast';
import GestionPhotos from '../components/GestionPhotos';
import OngletPreavisComponent from '../components/OngletPreavis';
import EtatDesLieux from '../components/EtatDesLieux';
import ActesSignature from '../components/ActesSignature';
import OngletPaiementsComponent from '../components/OngletPaiements';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import ModalSignatureBail from '../components/ModalSignatureBail';
import useDarkMode from '../hooks/useDarkMode';
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
  Paperclip, CheckCheck, SmilePlus, Globe,
  Smartphone, CheckCircle2
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
import useLimitesPlans from '../hooks/useLimitesPlans';
import i18n, { changerLangue } from '../i18n';

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
  { icon: <FileSignature size={32} strokeWidth={1.5} color="var(--green)"/>, labelKey: 'contratBail',     color: 'var(--green)', type: 'contrat_bail'     },
  { icon: <Receipt       size={32} strokeWidth={1.5} color="var(--green)"/>, labelKey: 'quittance',       color: 'var(--green)', type: 'quittance'        },
  { icon: <FileText      size={32} strokeWidth={1.5} color="var(--green)"/>, labelKey: 'etatLieux',       color: 'var(--green)', type: 'etat_lieux'       },
  { icon: <AlertCircle   size={32} strokeWidth={1.5} color="var(--danger)"/>, labelKey: 'miseEnDemeure',   color: 'var(--danger)', type: 'mise_en_demeure'  },
  { icon: <TrendingUp    size={32} strokeWidth={1.5} color="var(--green)"/>, labelKey: 'rapportFinancier', color: 'var(--green)', type: 'rapport_financier' },
  { icon: <Shield        size={32} strokeWidth={1.5} color="#1B6B3A"/>, labelKey: 'caution',         color: '#1B6B3A', type: 'caution'          },
  { icon: <Send          size={32} strokeWidth={1.5} color="var(--green)"/>, labelKey: 'preavis',         color: 'var(--green)', type: 'preavis'          },
  { icon: <FileSignature size={32} strokeWidth={1.5} color="var(--green)"/>, labelKey: 'avenant',         color: 'var(--green)', type: 'avenant'          },
  { icon: <Banknote      size={32} strokeWidth={1.5} color="var(--green)"/>, labelKey: 'decompte',        color: 'var(--green)', type: 'decompte'         },
  { icon: <Shield        size={32} strokeWidth={1.5} color="var(--danger)"/>, labelKey: 'cautionnement',   color: 'var(--danger)', type: 'cautionnement'    },
];
var TYPES_ACTES = ['avenant', 'decompte', 'cautionnement', 'bail'];

// ================================================
// Composant UpgradeBanner
// ================================================

function UpgradeBanner({ fonctionnalite, planRequis }) {
  var t = useTranslation('dashboard').t;
  var limites = useLimitesPlans();
  var navigate = useNavigate();
  var messages = {
    mobile_money:  t('upgradeBanner.messages.mobileMoney'),
    documents_pdf: t('upgradeBanner.messages.documentsPdf'),
    annuaire:      t('upgradeBanner.messages.annuaire'),
    rapports:      t('upgradeBanner.messages.rapports'),
    max_biens:     t('upgradeBanner.messages.maxBiens', limites),
    multi_users:   t('upgradeBanner.messages.multiUsers'),
  };
  return (
    <div style={{ background: '#1B2B22', borderRadius: 12, padding: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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
        style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
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

  var couleur = score.score >= 80 ? 'var(--green)'
    : score.score >= 65 ? '#1B6B3A'
    : score.score >= 50 ? '#9A5B00'
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
      borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: couleur, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '18px'
      }}>
        {score.score}
      </div>
      <div>
        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
          {t('badgeScore.titre')}
        </div>
        <div style={{ fontSize: '12px', color: couleur, fontWeight: '600' }}>
          {badgeLabel[score.badge] || t('badgeScore.badges.nouveau')}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
        <span style={{ cursor: 'pointer', color: 'var(--green)', fontSize: 12 }} onClick={onClose}>{t('notifPanel.fermer')}</span>
      </div>
      {alertes.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
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
          { label: t('ongletOverviewLocataire.kpi.locationsActives'), val: String(locationsActives.length),         icon: <Home size={22} strokeWidth={1.5}/>,         color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletOverviewLocataire.kpi.candidatures'),     val: String(candidatures.length),              icon: <CalendarCheck size={22} strokeWidth={1.5}/>, color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletOverviewLocataire.kpi.loyersPayes'),      val: String(paiementsOk.length),               icon: <CreditCard size={22} strokeWidth={1.5}/>,    color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletOverviewLocataire.kpi.totalVerse'),       val: GNF(totalPaye) + ' GNF',                 icon: <Banknote size={22} strokeWidth={1.5}/>,      color: 'var(--warn)', bg: 'var(--warn-soft)' },
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
          var photo = urlPremierePhoto(r.photos);
          var dateDebut = r.date_debut ? new Date(r.date_debut) : null;
          var moisEcoules = dateDebut ? Math.floor((new Date() - dateDebut) / (1000 * 60 * 60 * 24 * 30)) : 0;
          var duree = r.duree_mois || 12;
          var pct   = Math.min(100, Math.round(moisEcoules / duree * 100));

          return (
            <div key={r.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-md)', marginBottom: 16, border: '1.5px solid var(--green-border)' }}>
              <div style={{ height: 100, background: photo ? 'none' : '#1B6B3A', overflow: 'hidden', position: 'relative' }}>
                {photo
                  ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
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
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('ongletOverviewLocataire.loyerMensuel')}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{GNF(r.prix_mensuel)} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>GNF</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('ongletOverviewLocataire.dureeDuBail')}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{t('ongletOverviewLocataire.moisSurDuree', { mois: moisEcoules, duree: duree })}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                    <div style={{ background: '#1B6B3A', width: pct + '%', height: '100%', borderRadius: 6 }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{t('ongletOverviewLocataire.progression', { pct: pct })}</div>
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
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 8, border: '0.5px solid #E8E8E8', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--green)', fontSize: 10, fontWeight: 600, transition: 'all .2s' }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = 'var(--green-light)'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
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
          <Home size={48} strokeWidth={1} color="var(--green-border)" />
          <h3>{t('ongletOverviewLocataire.aucuneLocation.titre')}</h3>
          <p>{t('ongletOverviewLocataire.aucuneLocation.description')}</p>
          <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Search size={14} strokeWidth={1.75} /> {t('ongletOverviewLocataire.aucuneLocation.chercherBouton')}</Link>
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

  var k = overview.kpis || { revenus_mois: 0, revenus_mois_precedent: 0, tendance_revenus: 0, total_biens: 0, biens_loues: 0, taux_occupation: 0, candidatures_attente: 0, nouvelles_candidatures_7j: 0 };
  overview.biens        = overview.biens        || [];
  overview.candidatures = overview.candidatures || [];
  overview.alertes      = overview.alertes      || [];
  overview.evenements   = overview.evenements   || [];
  overview.revenus6mois = overview.revenus6mois || [];

  return (
    <div>
      {/* ─── KPIs ──────────────────────────────────────────────── */}
      <div className="stats-grid-4" data-tour="kpis" style={{ marginBottom: 20 }}>
        {[
          {
            label: t('ongletOverview.kpi.revenusDuMois'),
            val:   GNF(k.revenus_mois),
            sub:   k.tendance_revenus > 0 ? t('ongletOverview.kpi.tendanceHausse', { pct: k.tendance_revenus })
                 : k.tendance_revenus < 0 ? t('ongletOverview.kpi.tendanceBaisse', { pct: k.tendance_revenus })
                 : t('ongletOverview.kpi.tendanceStable'),
            subColor: k.tendance_revenus > 0 ? '#1B6B3A' : k.tendance_revenus < 0 ? '#E53935' : '#888',
            icon:  <Banknote size={22} strokeWidth={1.5}/>, color: 'var(--green)', bg: 'var(--green-light)'
          },
          {
            label: t('ongletOverview.kpi.tauxOccupation'),
            val:   k.taux_occupation + '%',
            sub:   t('ongletOverview.kpi.biensOccupes', { loues: k.biens_loues, total: k.total_biens }),
            subColor: '#888',
            icon:  <Home size={22} strokeWidth={1.5}/>, color: 'var(--green)', bg: 'var(--green-light)'
          },
          {
            label: t('ongletOverview.kpi.candidatures'),
            val:   String(k.candidatures_attente),
            sub:   t('ongletOverview.kpi.nouvellesCetteSemaine', { count: k.nouvelles_candidatures_7j }),
            subColor: k.nouvelles_candidatures_7j > 0 ? '#E65100' : '#888',
            icon:  <CalendarCheck size={22} strokeWidth={1.5}/>, color: 'var(--green)', bg: 'var(--green-light)'
          },
          {
            label: t('ongletOverview.kpi.biensGeres'),
            val:   String(k.total_biens),
            sub:   t('ongletOverview.kpi.louesEtLibres', { loues: k.biens_loues, libres: (k.total_biens - k.biens_loues) }),
            subColor: '#888',
            icon:  <Building2 size={22} strokeWidth={1.5}/>, color: 'var(--green)', bg: 'var(--green-light)'
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
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('ongletOverview.revenus6mois.titre')}</h3>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/rapports'); }}
              style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
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
                    <div style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700, opacity: pct > 0 ? 1 : 0 }}>
                      {pct > 0 ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(Number(m.revenus)) : ''}
                    </div>
                    <div style={{ width: '100%', background: pct > 0 ? 'var(--green)' : 'var(--bg-tertiary)', borderRadius: '4px 4px 0 0', height: Math.max(4, Math.round(pct * 60)) + 'px', transition: 'height .5s' }} />
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{m.mois}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── ALERTES + ÉVÉNEMENTS ──────────────────────────── */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('ongletOverview.aFaire.titre')}</h3>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/alertes'); }}
              style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {t('ongletOverview.aFaire.toutVoir')}
            </button>
          </div>

          {overview.alertes.length === 0 && overview.evenements.length === 0 && (
            <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, padding: '12px 0' }}>
              <CheckCircle size={28} strokeWidth={1} color="var(--green-border)" style={{ display: 'block', margin: '0 auto 8px' }} />
              {t('ongletOverview.aFaire.toutEnOrdre')}
            </div>
          )}

          {overview.alertes.slice(0, 3).map(function(a, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F5F5F5', alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, background: a.priorite === 'haute' ? 'var(--danger)' : 'var(--green)', borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{a.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{a.description && a.description.slice(0, 50)}{a.description && a.description.length > 50 ? '...' : ''}</div>
                </div>
              </div>
            );
          })}

          {overview.evenements.map(function(e, i) {
            var joursRestants = Math.ceil((new Date(e.date_evenement) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div key={'ev' + i} style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>
                  {t('ongletOverview.aFaire.bailExpire', { logement: e.logement_titre })}
                  <span style={{ color: joursRestants <= 15 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700, marginLeft: 6 }}>
                    {t('ongletOverview.aFaire.dansNJours', { n: joursRestants })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MES BIENS ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 20px', marginBottom: 16, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('ongletOverview.mesBiens.titre')}</h3>
          <button onClick={function() { if(setOnglet) setOnglet('/dashboard/biens'); }}
            style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            {t('ongletOverview.mesBiens.gerer')}
          </button>
        </div>
        {overview.biens.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Home size={36} strokeWidth={1} color="var(--green-border)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{t('ongletOverview.mesBiens.aucunBien')}</div>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/biens'); }}
              style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('ongletOverview.mesBiens.ajouterBien')}
            </button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {overview.biens.map(function(b, i) {
            var estLoue = b.statut === 'loue';
            var photo   = urlPremierePhoto(b.photos);
            return (
              <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: 'var(--surface-soft)' }}>
                <div style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', background: 'var(--green-light)', flexShrink: 0 }}>
                  {photo
                    ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={20} strokeWidth={1.5} color="#A5D6A7" /></div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{b.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {GNF(b.prix_mensuel)}/mois · {b.ville}
                  </div>
                  {estLoue && b.loc_prenom && (
                    <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 1 }}>
                      {t('ongletOverview.mesBiens.locataire', { prenom: b.loc_prenom, nom: b.loc_nom })}
                    </div>
                  )}
                </div>
                <span style={{ background: estLoue ? 'var(--green-light)' : (b.statut === 'reserve' ? 'var(--info-soft)' : 'var(--warn-soft)'), color: estLoue ? 'var(--green)' : (b.statut === 'reserve' ? 'var(--info)' : 'var(--warn)'), borderRadius: 16, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {estLoue ? t('ongletOverview.mesBiens.loue') : (b.statut === 'reserve' ? t('ongletOverview.mesBiens.reserve') : t('ongletOverview.mesBiens.libre'))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── DERNIÈRES CANDIDATURES ────────────────────────────── */}
      {overview.candidatures.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('ongletOverview.candidatures.titre')}</h3>
            <button onClick={function() { if(setOnglet) setOnglet('/dashboard/reservations'); }}
              style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {t('ongletOverview.candidatures.toutesVoir')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overview.candidatures.map(function(r, i) {
              var cfgStatuts = {
                en_attente:  { label: t('ongletOverview.candidatures.statuts.nouvelle'),       color: 'var(--warn)', bg: 'var(--warn-soft)' },
                dossier_requis: { label: t('ongletOverview.candidatures.statuts.dossierDemande'), color: 'var(--info)', bg: 'var(--info-soft)' },
                en_examen:   { label: t('ongletOverview.candidatures.statuts.enExamen'),       color: 'var(--info)', bg: 'var(--info-soft)' },
                acceptee:    { label: t('ongletOverview.candidatures.statuts.acceptee'),       color: 'var(--green)', bg: 'var(--green-light)' },
                refusee:     { label: t('ongletOverview.candidatures.statuts.refusee'),        color: 'var(--text-muted)',    bg: 'var(--surface-soft)' },
                echanges:    { label: t('ongletReservationsProprio.statuts.echanges'),        color: 'var(--info)', bg: 'var(--info-soft)' },
                caution_requise:    { label: t('ongletReservationsProprio.statuts.cautionRequise'), color: 'var(--warn)', bg: 'var(--warn-soft)' },
                caution_payee:      { label: t('ongletReservationsProprio.statuts.cautionPayee'),   color: 'var(--green)', bg: 'var(--green-light)' },
                bail_en_cours:      { label: t('ongletReservationsProprio.statuts.bailEnCours'),    color: 'var(--info)', bg: 'var(--info-soft)' },
                bail_signe_proprio: { label: t('ongletReservationsProprio.statuts.bailSigneProprio'), color: 'var(--info)', bg: 'var(--info-soft)' },
                confirmee:          { label: t('ongletReservationsProprio.statuts.confirmee'),     color: 'var(--green)', bg: 'var(--green-light)' },
              };
              var cfg = cfgStatuts[r.statut] || { label: r.statut, color: 'var(--text-muted)', bg: 'var(--surface-soft)' };
              return (
                <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: 'var(--surface-soft)', cursor: 'pointer' }}
                  onClick={function() { if(setOnglet) setOnglet('/dashboard/reservations'); }}>
                  <div style={{ width: 36, height: 36, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {(r.loc_prenom || '').charAt(0)}{(r.loc_nom || '').charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.loc_prenom} {r.loc_nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.logement_titre} · {GNF(r.prix_mensuel)}/mois</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 16, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                      {cfg.label}
                    </span>
                    {r.score_confiance > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('ongletOverview.candidatures.score', { score: r.score_confiance })}</span>
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
  var plan      = props.plan || { plan: 'gratuit', droits: { max_biens: null }, nb_biens: 0 };
  var estProprio = user && (user.role === 'proprietaire' || user.role === 'les_deux');
  // Dans OngletBiens, après la déclaration de limiteAtteinte
  var maxBiensPlan = plan.droits ? plan.droits.max_biens : null; // null = illimité
  var limiteAtteinte = maxBiensPlan != null && plan.nb_biens >= maxBiensPlan;

  var [showConfirm, setShowConfirm] = useState(null);
  var [modeEdit, setModeEdit]       = useState(null);
  var [showLiberer, setShowLiberer] = useState(null);
  var [formEdit, setFormEdit]       = useState({});
  var [reservationsActives, setReservationsActives] = useState([]);
  var [showRenouv, setShowRenouv]       = useState(null);
  var [renouvForm, setRenouvForm]       = useState({ duree: '12', prix: '', message: '' });
  var [renouvLoading, setRenouvLoading] = useState(false);
  var [renouvList, setRenouvList] = useState([]);

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

  function chargerRenouvellements() {
    if (!estProprio) return;
    api.get('/renouvellements/en-cours')
      .then(function(res) { setRenouvList(res.data.renouvellements || []); })
      .catch(console.error);
  }

  useEffect(chargerRenouvellements, [estProprio]);

  function renouvPour(locataire) {
    if (!locataire) return null;
    return renouvList.find(function(p) { return String(p.reservation_id) === String(locataire.id); }) || null;
  }

  function proposerRenouvellement(bien) {
    if (!bien.reservation_id) { toast.error(t('ongletBiens.renouvNego.aucuneLocation')); return; }
    setShowRenouv(bien);
    setRenouvForm({ duree: String(bien.duree || '12'), prix: String(bien.prix || bien.loyer || ''), message: '' });
  }

  function contreProposerRenouv(proposition, bien, locataire) {
    setShowRenouv({
      nom: bien.titre, reservation_id: locataire.id, contreDe: proposition.id,
      loyer: locataire.montant_total || bien.prix_mensuel,
    });
    setRenouvForm({ duree: String(proposition.nouvelle_duree_mois), prix: String(proposition.nouveau_prix || ''), message: '' });
  }

  function envoyerRenouvellement() {
    if (!showRenouv) return;
    setRenouvLoading(true);
    var corps = {
      nouvelle_duree_mois: parseInt(renouvForm.duree, 10),
      nouveau_prix:        renouvForm.prix ? Number(renouvForm.prix) : null,
      message:             renouvForm.message || null
    };
    var requete = showRenouv.contreDe
      ? api.post('/renouvellements/' + showRenouv.contreDe + '/contre-proposer', corps)
      : api.post('/renouvellements', Object.assign({ reservation_id: showRenouv.reservation_id }, corps));
    requete
      .then(function() {
        toast.success(showRenouv.contreDe ? t('ongletBiens.renouvNego.toastContreEnvoyee') : t('ongletBiens.renouvNego.toastEnvoyee'));
        setShowRenouv(null);
        chargerRenouvellements();
      })
      .catch(function(err) { toast.error((err.response && err.response.data && err.response.data.erreur) || t('ongletBiens.renouvNego.erreur')); })
      .finally(function() { setRenouvLoading(false); });
  }

  function repondreRenouv(id, reponse) {
    api.patch('/renouvellements/' + id + '/repondre', { reponse: reponse })
      .then(function() {
        toast.success(reponse === 'accepte' ? t('ongletBiens.renouvNego.toastAccepte') : t('ongletBiens.renouvNego.toastRefuse'));
        chargerRenouvellements();
        if (reponse === 'accepte' && recharger) recharger();
      })
      .catch(function(err) { toast.error((err.response && err.response.data && err.response.data.erreur) || t('ongletBiens.renouvNego.erreur')); });
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
            <Home size={48} strokeWidth={1} color="var(--green-border)" />
            <h3>{t('ongletBiens.locataire.aucuneLocation.titre')}</h3>
            <p>{t('ongletBiens.locataire.aucuneLocation.description')}</p>
            <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
              {t('ongletBiens.locataire.aucuneLocation.trouverLogement')}
            </Link>
          </div>
        )}

        {locationsActives.map(function(r) {
          return (
            <div key={r.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid var(--green)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: 'var(--green-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Home size={22} strokeWidth={1.5} color="var(--green)" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{r.logement_titre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {t('ongletBiens.locataire.depuisLe', { ville: r.logement_ville, date: r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletBiens.locataire.na') })}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || 0)} GNF/mois
                  </div>
                </div>
                <div style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {t('ongletBiens.locataire.active')}
                </div>
              </div>

              {/* Boutons locataire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link to={'/reservation/' + r.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '0.5px solid var(--green-border)' }}>
                  {t('ongletBiens.locataire.details')}
                </Link>
                <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 8, background: 'var(--info-soft)', color: 'var(--info)', fontSize: 13, fontWeight: 600, border: '0.5px solid var(--info)', cursor: 'pointer' }}>
                  <span style={{display:'flex',alignItems:'center',gap:5}}><FileText size={14} strokeWidth={1.5}/> {t('ongletBiens.locataire.documents')}</span>
                </button>
              </div>
              {limiteAtteinte ? (
  <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 10 }}>
    <AlertCircle size={16} strokeWidth={1.5} color="var(--warn)" />
    {t('ongletBiens.limiteAtteinte', { max: maxBiensPlan })}{' '}
    <button onClick={function() { navigate('/pricing'); }}
      style={{ background: 'none', border: 'none', color: 'var(--info)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13 }}>
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
            <h3 style={{ color: 'var(--danger)' }}>{t('ongletBiens.confirmSuppression.titre')}</h3>
            <p>{t('ongletBiens.confirmSuppression.description')}</p>
            <div className="modal-actions">
              <button className="btn-green" style={{ background: 'var(--danger)' }} onClick={function() { handleDelete(showConfirm); }}>{t('ongletBiens.confirmSuppression.supprimer')}</button>
              <button className="btn-outline-green" onClick={function() { setShowConfirm(null); }}>{t('ongletBiens.confirmSuppression.annuler')}</button>
            </div>
          </div>
        </div>
      )}

    {showLiberer && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={16} strokeWidth={1.75} /> {t('ongletBiens.libererModal.titre')}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {t('ongletBiens.libererModal.descAvant')}<b>{t('ongletBiens.libererModal.descGras')}</b>{t('ongletBiens.libererModal.descApres')}
      </p>
      <div style={{ background: 'var(--danger-soft)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: 'var(--danger)' }}>
        <span style={{display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={14} strokeWidth={1.5} /> {t('ongletBiens.libererModal.avertissement')}</span>
      </div>
      <div className="modal-actions">
        <button
          style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'var(--green)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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
          <Home size={48} strokeWidth={1} color="var(--green-border)" />
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
          var renouvEnCours = renouvPour(locataire);
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
              <div key={b.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid var(--green)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>{t('ongletBiens.editForm.modifierTitre', { titre: b.titre })}</div>
                <div className="form-row-2">
                  <div className="form-group"><label>{t('ongletBiens.editForm.titre')}</label><input type="text" value={formEdit.titre} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { titre: e.target.value })); }} /></div>
                  <div className="form-group"><label>{t('ongletBiens.editForm.prix')}</label><input type="number" value={formEdit.prix_mensuel} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { prix_mensuel: e.target.value })); }} /></div>
                  <div className="form-group"><label>{t('ongletBiens.editForm.adresse')}</label><input type="text" value={formEdit.adresse} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { adresse: e.target.value })); }} /></div>
                  <div className="form-group">
                    <label>{t('ongletBiens.editForm.statut')}</label>
                    <select value={formEdit.statut} onChange={function(e) { setFormEdit(Object.assign({}, formEdit, { statut: e.target.value })); }}>
                      <option value="disponible">{t('ongletBiens.editForm.statutDisponible')}</option>
                      <option value="reserve">{t('ongletBiens.editForm.statutReserve')}</option>
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
            <div key={b.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid ' + borderColor }}>

              {/* En-tête bien */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: estOccupe ? 'var(--green-light)' : 'var(--warn-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {b.categorie && b.categorie.includes('villa') ? <Home size={22} strokeWidth={1.5} /> : b.categorie && b.categorie.includes('studio') ? <Building2 size={22} strokeWidth={1.5} /> : <Building size={22} strokeWidth={1.5} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{b.titre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {locataire
                      ? t('ongletBiens.locataireDepuisLe', { prenom: locataire.locataire_prenom, nom: locataire.locataire_nom, date: locataire.date_debut ? new Date(locataire.date_debut).toLocaleDateString('fr-FR') : t('ongletBiens.locataire.na') })
                      : (b.adresse ? b.adresse + ', ' : '') + (b.ville || '')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(b.prix_mensuel)} GNF/mois
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {preavisActif ? (
                    <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><AlertCircle size={12} strokeWidth={1.5}/> {t('ongletBiens.preavisEnvoye')}</span>
                    </div>
                  ) : estOccupe ? (
                    <div style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      {t('ongletBiens.occupe')}
                    </div>
                  ) : b.statut === 'reserve' ? (
                    <div style={{ background: 'var(--info-soft)', color: 'var(--info)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      {t('ongletBiens.reserve')}
                    </div>
                  ) : (
                    <div style={{ background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                      {t('ongletBiens.locataire.libre')}
                    </div>
                  )}
                  {preavisActif && joursRestants !== null && (
                    <div style={{
                      background: joursRestants <= 5 ? 'var(--danger-soft)' : joursRestants <= 15 ? 'var(--warn-soft)' : 'var(--warn-soft)',
                      color:      joursRestants <= 5 ? 'var(--danger)' : joursRestants <= 15 ? 'var(--warn)' : 'var(--warn)',
                      border:     '1.5px solid ' + (joursRestants <= 5 ? 'var(--danger)' : joursRestants <= 15 ? '#FFCC80' : 'var(--warn)'),
                      borderRadius: 16, padding: '4px 12px', fontSize: 13, fontWeight: 700
                    }}>
                      J-{joursRestants > 0 ? joursRestants : 0}
                    </div>
                  )}
                </div>
              </div>

              {/* Bannière préavis actif */}
              {preavisActif && (
                <div style={{ background: 'var(--danger-soft)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--danger)' }}>
                  <ClipboardList size={14} strokeWidth={1.5} />
                  <span>
                    {t('ongletBiens.preavisBanniere.avant')}<b>{locataire && locataire.locataire_prenom + ' ' + locataire.locataire_nom}</b>{t('ongletBiens.preavisBanniere.apres')}
                    {' '}<span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={function() { if (setOnglet) setOnglet('/dashboard/preavis'); }}>{t('ongletBiens.preavisBanniere.voirLePreavis')}</span>
                  </span>
                </div>
              )}

              {/* Boutons selon statut */}
              {estOccupe ? (
                <div>
                  {renouvEnCours && renouvEnCours.a_traiter && (
                    <div style={{ background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={14} strokeWidth={1.5} /> {t('ongletBiens.renouvNego.contrePropositionDe', { nom: renouvEnCours.auteur_prenom + ' ' + renouvEnCours.auteur_nom })}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {t('ongletBiens.renouvNego.resume', { n: renouvEnCours.nouvelle_duree_mois, loyer: new Intl.NumberFormat('fr-FR').format(renouvEnCours.nouveau_prix || renouvEnCours.loyer_actuel) })}
                      </div>
                      {renouvEnCours.message && <div style={{ fontSize: 12, color: '#666', marginTop: 6, fontStyle: 'italic' }}>"{renouvEnCours.message}"</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                        <button type="button" onClick={function() { repondreRenouv(renouvEnCours.id, 'accepte'); }}
                          style={{ padding: '9px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {t('ongletBiens.renouvNego.accepter')}
                        </button>
                        <button type="button" onClick={function() { contreProposerRenouv(renouvEnCours, b, locataire); }}
                          style={{ padding: '9px', borderRadius: 8, border: '1px solid var(--info)', background: 'var(--bg-secondary)', color: 'var(--info)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {t('ongletBiens.renouvNego.contreProposer')}
                        </button>
                        <button type="button" onClick={function() { repondreRenouv(renouvEnCours.id, 'refuse'); }}
                          style={{ padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          {t('ongletBiens.renouvNego.refuser')}
                        </button>
                      </div>
                    </div>
                  )}
                  {renouvEnCours && !renouvEnCours.a_traiter && (
                    <div style={{ background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 12, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={13} strokeWidth={1.5} />
                      {t('ongletBiens.renouvNego.enAttenteLocataire', { n: renouvEnCours.nouvelle_duree_mois, loyer: new Intl.NumberFormat('fr-FR').format(renouvEnCours.nouveau_prix || renouvEnCours.loyer_actuel) })}
                    </div>
                  )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button onClick={function() { if (setOnglet) setOnglet('/dashboard/messages'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', border: '0.5px solid var(--green-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <span style={{display:'flex',alignItems:'center',gap:5}}><MessageCircle size={14} strokeWidth={1.5}/> {t('ongletBiens.boutons.messagerie')}</span>
                  </button>
                  <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 8, background: 'var(--info-soft)', color: 'var(--info)', border: '0.5px solid var(--info)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <FileText size={14} strokeWidth={1.5} /> {t('ongletBiens.boutons.documents')}
                  </button>
                  {!preavisActif && (
                    <button onClick={function() { if (setOnglet) setOnglet('/dashboard/preavis'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 8, background: 'var(--danger-soft)', color: 'var(--danger)', border: '0.5px solid var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <span style={{display:'flex',alignItems:'center',gap:5}}><Send size={14} strokeWidth={1.5}/> {t('ongletBiens.boutons.preavis')}</span>
                    </button>
                  )}
                  {preavisActif && (
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 8, background: 'var(--surface-soft)', color: 'var(--text-muted)', border: '0.5px solid var(--border)', fontSize: 12, cursor: 'not-allowed' }} disabled>
                      {t('ongletBiens.preavisEnvoye')}
                    </button>
                  )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <button type="button" disabled={!locataire}
                      onClick={function() { proposerRenouvellement({ nom: b.titre, reservation_id: locataire.id, loyer: locataire.montant_total || b.prix_mensuel }); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 8, background: 'var(--info-soft)', color: 'var(--info)', border: '0.5px solid var(--info)', fontSize: 12, fontWeight: 600, cursor: locataire ? 'pointer' : 'not-allowed', opacity: locataire ? 1 : 0.5 }}>
                      <RefreshCw size={14} strokeWidth={1.5} /> {t('ongletBiens.boutons.renouveler')}
                    </button>
                    <button type="button" onClick={function() { setShowLiberer(b.id); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', borderRadius: 8, background: 'var(--danger-soft)', color: 'var(--danger)', border: '0.5px solid var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t('ongletBiens.libererModal.libererMaintenant')}
                    </button>
                  </div>
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

      {showRenouv && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: 'var(--info)' }}>{showRenouv.contreDe ? t('ongletBiens.renouvNego.titreContre') : t('ongletBiens.renouvModal.titre')}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {t('ongletBiens.renouvModal.logement')} <b>{showRenouv.nom}</b>
            </p>
            <div className="form-group">
              <label>{t('ongletBiens.renouvModal.dureeLabel')}</label>
              <select value={renouvForm.duree} onChange={function(e) { setRenouvForm(Object.assign({}, renouvForm, { duree: e.target.value })); }}>
                {['1','2','3','6','12','18','24','36'].map(function(d) { return <option key={d} value={d}>{t('ongletBiens.renouvModal.dureeMois', { n: d })}</option>; })}
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
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div className="modal-actions">
              <button onClick={envoyerRenouvellement} disabled={renouvLoading}
                style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontWeight: 700, cursor: 'pointer', flex: 1 }}>
                {renouvLoading ? t('ongletBiens.renouvModal.envoiEnCours') : (showRenouv.contreDe ? t('ongletBiens.renouvNego.envoyerContre') : t('ongletBiens.renouvModal.envoyerLaProposition'))}
              </button>
              <button className="btn-outline-green" onClick={function() { setShowRenouv(null); }}>{t('ongletBiens.confirmSuppression.annuler')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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

  var [ficheId, setFicheId] = useState(null);

  var locatairesReservations = stats.reservations.reduce(function(acc, r) {
    if (r.locataire_nom && !acc.find(function(l) { return l.email === r.locataire_email; })) {
      acc.push({ id: r.id, nom: r.locataire_nom, prenom: r.locataire_prenom, telephone: r.locataire_telephone, email: r.locataire_email, logement: r.logement_titre, loyer: r.montant_total, statut: r.statut });
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
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{t('ongletLocataires.viaWerdhe')}</h3>
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
                  <button className="btn-outline-green" onClick={function() { setFicheId(l.id); }}>{t('ongletLocataires.voirFiche')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{t('ongletLocataires.manuels')}</h3>
      {locatairesManue.length === 0 && !showForm && (
        <div className="dash-empty-state">
          <Users size={48} strokeWidth={1} color="var(--green-border)" />
          <h3>{t('ongletLocataires.aucunManuel.titre')}</h3>
          <p>{t('ongletLocataires.aucunManuel.description')}</p>
        </div>
      )}
      {locatairesManue.map(function(l) {
        var initiales = (l.prenom ? l.prenom.charAt(0) : '') + (l.nom ? l.nom.charAt(0) : '');
        return (
          <div key={l.id} className="locataire-row" style={{ borderLeft: '4px solid var(--warn)' }}>
            <div className="locataire-row-left">
              <div className="locataire-avatar-proto" style={{ background: 'var(--green)', color: '#fff' }}>{initiales}</div>
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
              <button style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }} onClick={function() { handleDelete(l.id); }}>{t('ongletLocataires.form.supprimer')}</button>
            </div>
          </div>
        );
      })}

      {ficheId && <FicheLocataireModal reservationId={ficheId} onClose={function() { setFicheId(null); }} />}
    </div>
  );
}

// ================================================
// MODAL : Fiche locataire complète
// ================================================
function FicheLocataireModal(props) {
  var t = useTranslation('dashboard').t;
  var reservationId = props.reservationId;
  var onClose = props.onClose;
  var [r, setR] = useState(null);
  var [loading, setLoading] = useState(true);
  var [erreur, setErreur] = useState(false);

  useEffect(function() {
    setLoading(true);
    setErreur(false);
    api.get('/reservations/' + reservationId + '/detail')
      .then(function(res) { setR(res.data.reservation); })
      .catch(function() { setErreur(true); toast.error(t('ongletLocataires.fiche.toastErreurChargement')); })
      .finally(function() { setLoading(false); });
  }, [reservationId]);

  var initiales = r ? ((r.locataire_prenom || '').charAt(0) + (r.locataire_nom || '').charAt(0)).toUpperCase() : '';
  var statutLabels = {
    en_attente: t('ongletReservationsProprio.statuts.enAttente'),
    en_examen:  t('ongletReservationsProprio.statuts.enExamen'),
    confirmee:  t('ongletReservationsProprio.statuts.confirmee'),
    refusee:    t('ongletReservationsProprio.statuts.refusee'),
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', textAlign: 'left' }} onClick={function(e) { e.stopPropagation(); }}>
        {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('dashboardMain.chargement')}</p>}
        {!loading && erreur && <p style={{ textAlign: 'center', color: 'var(--danger)' }}>{t('ongletLocataires.toastErreur')}</p>}
        {!loading && !erreur && r && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div className="locataire-avatar-proto" style={{ width: 52, height: 52, fontSize: 18, flexShrink: 0 }}>{initiales}</div>
              <div>
                <h3 style={{ margin: 0 }}>{r.locataire_prenom} {r.locataire_nom}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.logement_titre}</div>
              </div>
            </div>

            {/* Coordonnées et infos */}
            <div style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{t('ongletReservationsProprio.infosCandidat.titre')}</div>
              {[
                [t('ongletReservationsProprio.demandeRecue.labels.email'), r.locataire_email || t('ongletReservationsProprio.na')],
                [t('ongletReservationsProprio.infosCandidat.telephone'), r.locataire_telephone || t('ongletReservationsProprio.na')],
                [t('ongletLocataires.form.logement'), r.logement_titre || t('ongletReservationsProprio.na')],
                [t('ongletReservationsProprio.infosCandidat.loyer'), GNF(r.montant_total) + '/mois'],
                [t('ongletLocataires.fiche.dateDebut'), r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletReservationsProprio.na')],
                [t('ongletLocataires.fiche.duree'), r.duree_mois ? t('ongletReservationsProprio.nMois', { n: r.duree_mois }) : t('ongletReservationsProprio.na')],
                [t('ongletLocataires.fiche.statut'), statutLabels[r.statut] || r.statut],
              ].map(function(row) {
                return (
                  <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row[0]}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row[1]}</span>
                  </div>
                );
              })}
            </div>

            {/* Bail */}
            <div style={{ background: r.bail_signe ? 'var(--green-light)' : 'var(--warn-soft)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSignature size={16} strokeWidth={1.5} color={r.bail_signe ? 'var(--green)' : 'var(--warn)'} />
              <span style={{ fontSize: 13, fontWeight: 600, color: r.bail_signe ? 'var(--green)' : 'var(--warn)' }}>
                {r.bail_signe
                  ? t('ongletLocataires.fiche.bailSigne', { date: r.date_signature_bail ? new Date(r.date_signature_bail).toLocaleDateString('fr-FR') : '' })
                  : t('ongletLocataires.fiche.bailNonSigne')}
              </span>
            </div>

            {/* Documents du dossier */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{t('ongletLocataires.fiche.documents')}</div>
              {[
                { label: t('ongletReservationsProprio.docs.cni'),    key: 'cni',    url: r.doc_cni_url },
                { label: t('ongletReservationsProprio.docs.emploi'), key: 'emploi', url: r.doc_emploi_url },
                { label: t('ongletReservationsProprio.docs.paie'),   key: 'paie',   url: r.doc_paie_url },
                { label: t('ongletReservationsProprio.docs.garant'), key: 'garant', url: r.doc_garant_url },
              ].map(function(d) {
                return (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      {d.url ? <CheckCircle size={16} strokeWidth={1.5} color="var(--green)" /> : <Clock size={16} strokeWidth={1.5} color="#ccc" />}
                    </span>
                    <span style={{ fontSize: 13, color: d.url ? 'var(--text-primary)' : '#aaa', flex: 1 }}>{d.label}</span>
                    {d.url && (
                      <a href={'https://werdhe-backend.onrender.com/reservations/' + r.id + '/document/' + d.key + '?token=' + localStorage.getItem('token')}
                        target="_blank" rel="noreferrer"
                        style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '0.5px solid var(--green-border)' }}>
                        {t('ongletReservationsProprio.voir')}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Message du locataire */}
            {r.message_locataire && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{t('ongletLocataires.fiche.message')}</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-soft)', borderRadius: 8, padding: 12, margin: 0, lineHeight: 1.6 }}>{r.message_locataire}</p>
              </div>
            )}

            <button className="btn-outline-green" style={{ width: '100%' }} onClick={onClose}>{t('ongletLocataires.fiche.fermer')}</button>
          </>
        )}
      </div>
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
      en_attente:         { label: t('ongletReservations.locataire.statuts.enAttente.label'),         couleur: 'var(--warn)', bg: 'var(--warn-soft)', action: t('ongletReservations.locataire.statuts.enAttente.action'),         urgent: true  },
      dossier_requis:     { label: t('ongletReservations.locataire.statuts.dossierRequis.label'),     couleur: 'var(--info)', bg: 'var(--info-soft)', action: t('ongletReservations.locataire.statuts.dossierRequis.action'),     urgent: true  },
      en_examen:          { label: t('ongletReservations.locataire.statuts.enExamen.label'),          couleur: 'var(--info)', bg: 'var(--info-soft)', action: t('ongletReservations.locataire.statuts.enExamen.action'),          urgent: false },
      acceptee:           { label: t('ongletReservations.locataire.statuts.acceptee.label'),           couleur: 'var(--green)', bg: 'var(--green-light)', action: t('ongletReservations.locataire.statuts.acceptee.action'),           urgent: true  },
      echanges:           { label: t('ongletReservations.locataire.statuts.echanges.label'),           couleur: 'var(--info)', bg: 'var(--info-soft)', action: t('ongletReservations.locataire.statuts.echanges.action'),           urgent: false },
      caution_requise:    { label: t('ongletReservations.locataire.statuts.cautionRequise.label'),    couleur: 'var(--warn)', bg: 'var(--warn-soft)', action: t('ongletReservations.locataire.statuts.cautionRequise.action'),    urgent: true  },
      caution_payee:      { label: t('ongletReservations.locataire.statuts.cautionPayee.label'),      couleur: 'var(--green)', bg: 'var(--green-light)', action: t('ongletReservations.locataire.statuts.cautionPayee.action'),      urgent: false },
      bail_en_cours:      { label: t('ongletReservations.locataire.statuts.bailEnCours.label'),       couleur: 'var(--info)', bg: 'var(--info-soft)', action: t('ongletReservations.locataire.statuts.bailEnCours.action'),       urgent: true  },
      bail_signe_proprio: { label: t('ongletReservations.locataire.statuts.bailSigneProprio.label'),  couleur: 'var(--info)', bg: 'var(--info-soft)', action: t('ongletReservations.locataire.statuts.bailSigneProprio.action'),  urgent: true  },
      confirmee:          { label: t('ongletReservations.locataire.statuts.confirmee.label'),         couleur: 'var(--green)', bg: 'var(--green-light)', action: t('ongletReservations.locataire.statuts.confirmee.action'),         urgent: false },
      refusee:            { label: t('ongletReservations.locataire.statuts.refusee.label'),           couleur: 'var(--danger)', bg: 'var(--danger-soft)', action: null,                    urgent: false },
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
            <CalendarCheck size={48} strokeWidth={1} color="var(--green-border)" />
            <h3>{t('ongletReservations.locataire.aucuneReservation.titre')}</h3>
            <p>{t('ongletReservations.locataire.aucuneReservation.description')}</p>
            <Link to="/logements" className="btn-green" style={{ textDecoration: 'none', display: 'inline-block' }}>
              {t('ongletReservations.locataire.aucuneReservation.trouverLogement')}
            </Link>
          </div>
        )}

        {reservationsLoc.map(function(r) {
          var cfg = statutsLoc[r.statut] || { label: r.statut, couleur: 'var(--text-muted)', bg: 'var(--surface-soft)', action: t('ongletReservations.locataire.voir'), urgent: false };
          return (
            <div key={r.id} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid ' + cfg.couleur }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {r.logement_titre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {r.date_debut ? t('ongletReservations.locataire.demandeDu', { date: new Date(r.created_at).toLocaleDateString('fr-FR') }) : t('ongletReservations.locataire.demandeEnCours')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || 0)} GNF / mois
                  </div>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.couleur, flexShrink: 0, marginLeft: 10 }}>
                  {cfg.label}
                </span>
              </div>

              {cfg.urgent && (
                <div style={{ background: 'var(--warn-soft)', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} strokeWidth={1.75} /> {t('ongletReservations.locataire.actionAttendue')}
                </div>
              )}

              {cfg.action && (
                <Link
                  to={'/reservation/' + r.id}
                  style={{ display: 'block', width: '100%', background: cfg.urgent ? 'var(--green)' : 'var(--bg-tertiary)', color: cfg.urgent ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: cfg.urgent ? 700 : 400, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: score.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: score.couleur }}>{score.score}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ 100</div>
      </div>
      <div style={{ width: 1, height: 32, background: 'rgba(0,0,0,0.1)' }} />
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{t('scoreLocataire.titre')}</div>
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
  var [annulerResa, setAnnulerResa] = useState(null);
  var [msgs, setMsgs] = useState([]);
  var [newMsg, setNewMsg] = useState('');
  var [bailSigne, setBailSigne] = useState(false);
  var [showSignatureProprio, setShowSignatureProprio] = useState(false);
  var [signatureProcessing, setSignatureProcessing] = useState(false);
  var [bailPanel, setBailPanel] = useState(false);
  var [acteBail, setActeBail] = useState(null);

  // Le bail se prépare et se signe avec ses conditions particulières (acte « bail »).
  useEffect(function() {
    setBailPanel(false); setActeBail(null);
    if (selectionne && ['caution_payee', 'bail_en_cours', 'bail_signe_proprio'].includes(selectionne.statut)) {
      api.get('/actes/reservation/' + selectionne.id)
        .then(function(res) { setActeBail((res.data.actes || []).some(function(a) { return a.type === 'bail'; })); })
        .catch(function() { setActeBail(false); });
    }
  }, [selectionne && selectionne.id, selectionne && selectionne.statut]);

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
    api.get('/documents/bail/' + reservationId + '/telecharger?format=pdf', { responseType: 'blob' })
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
    en_attente         : { label: t('ongletReservationsProprio.statuts.enAttente'),         couleur: 'var(--danger)', urgent: true },
    dossier_requis     : { label: t('ongletReservationsProprio.statuts.dossierRequis'),     couleur: 'var(--warn)', urgent: false },
    en_examen          : { label: t('ongletReservationsProprio.statuts.enExamen'),          couleur: 'var(--info)', urgent: true  },
    acceptee           : { label: t('ongletReservationsProprio.statuts.acceptee'),          couleur: 'var(--green)', urgent: false },
    echanges           : { label: t('ongletReservationsProprio.statuts.echanges'),          couleur: 'var(--info)', urgent: false },
    caution_requise    : { label: t('ongletReservationsProprio.statuts.cautionRequise'),    couleur: 'var(--warn)', urgent: false },
    caution_payee      : { label: t('ongletReservationsProprio.statuts.cautionPayee'),      couleur: 'var(--green)', urgent: true  },
    bail_en_cours      : { label: t('ongletReservationsProprio.statuts.bailEnCours'),        couleur: 'var(--info)', urgent: true  },
    bail_signe_proprio : { label: t('ongletReservationsProprio.statuts.bailSigneProprio'),  couleur: 'var(--warn)', urgent: false },
    confirmee          : { label: t('ongletReservationsProprio.statuts.confirmee'),         couleur: 'var(--green)', urgent: false },
    refusee            : { label: t('ongletReservationsProprio.statuts.refusee'),           couleur: 'var(--text-muted)',    urgent: false },
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
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--green)', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
          {t('ongletReservationsProprio.retourListe')}
        </button>

        {/* En-tête locataire */}
        <div style={{ background: 'var(--green)', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
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
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '5px 14px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
              {cfgStatuts[r.statut] ? cfgStatuts[r.statut].label : r.statut}
            </div>
          </div>
        </div>

        {/* ─ NOUVELLE DEMANDE ─ */}
        {r.statut === 'en_attente' && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 18, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Inbox size={15} strokeWidth={1.75} /> {t('ongletReservationsProprio.demandeRecue.titre')}</div>

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
                  <div key={row[0]} style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{row[0]}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row[1]}</div>
                  </div>
                );
              })}
            </div>

            {r.message_locataire && (
              <div style={{ background: '#F0F7FF', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{t('ongletReservationsProprio.demandeRecue.messageLocataire')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontStyle: 'italic' }}>"{r.message_locataire}"</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={function() { action('/decision', { decision: 'dossier_requis' }, t('ongletReservationsProprio.toastDossierDemande')); }}
                style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('ongletReservationsProprio.demanderDossierComplet')}
              </button>
              <button
                onClick={function() { action('/decision', { decision: 'acceptee' }, t('ongletReservationsProprio.toastCandidatureAcceptee')); }}
                style={{ background: 'var(--green-light)', color: 'var(--green)', border: '1px solid var(--green-border)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><CheckCircle size={15} strokeWidth={1.5}/> {t('ongletReservationsProprio.accepterSansDossier')}</span>
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={motifRefus}
                  onChange={function(e) { setMotifRefus(e.target.value); }}
                  placeholder={t('ongletReservationsProprio.motifRefusPlaceholder')}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none' }} />
                <button
                  onClick={function() {
                    if (!motifRefus.trim()) { toast.error(t('ongletReservationsProprio.toastIndiquerMotif')); return; }
                    action('/decision', { decision: 'refusee', motif: motifRefus }, t('ongletReservationsProprio.toastCandidatureRefusee'));
                  }}
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '0.5px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
  <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 18, boxShadow: 'var(--shadow-md)' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
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
            <span style={{ flexShrink: 0, display:'flex', alignItems:'center' }}>{d.ok ? <CheckCircle size={18} strokeWidth={1.5} color="var(--green)"/> : <Clock size={18} strokeWidth={1.5} color="var(--text-muted)"/>}</span>
            <span style={{ fontSize: 13, color: d.ok ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1 }}>{d.label}</span>
            {d.ok && d.url && (
              <a href={'https://werdhe-backend.onrender.com/reservations/' + r.id + '/document/' + d.key + '?token=' + localStorage.getItem('token')}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '0.5px solid var(--green-border)', flexShrink: 0 }}>
              {t('ongletReservationsProprio.voir')}
              </a>
            )}
            {d.ok && !d.url && (
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} strokeWidth={1.75} /> {t('ongletReservationsProprio.soumis')}</span>
            )}
          </div>
        );
      })}
    </div>

    {/* Infos locataire */}
    <div style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{t('ongletReservationsProprio.infosCandidat.titre')}</div>
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
          <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{row[0]}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row[1]}</span>
          </div>
        );
      })}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={function() { action('/decision', { decision: 'acceptee' }, t('ongletReservationsProprio.toastDossierValide')); }}
        style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><CheckCircle size={15} strokeWidth={1.5}/> {t('ongletReservationsProprio.validerDossier')}</span>
      </button>
      <button onClick={function() { action('/decision', { decision: 'dossier_requis' }, t('ongletReservationsProprio.toastInfosComplementaires')); }}
        style={{ background: 'var(--info-soft)', color: 'var(--info)', border: '1px solid var(--info)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        <MessageCircle size={14} strokeWidth={1.5} /> {t('ongletReservationsProprio.demanderInfosComplementaires')}
      </button>
      <div style={{ display: 'flex', gap: 10 }}>
        <input type="text" value={motifRefus} onChange={function(e) { setMotifRefus(e.target.value); }}
          placeholder={t('ongletReservationsProprio.motifRefusCourt')}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none' }} />
        <button onClick={function() {
          if (!motifRefus.trim()) { toast.error(t('ongletReservationsProprio.toastIndiquerMotifCourt')); return; }
          action('/decision', { decision: 'refusee', motif: motifRefus }, t('ongletReservationsProprio.toastCandidatureRefuseeCourt'));
        }}
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '0.5px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <XCircle size={14} strokeWidth={1.5} /> {t('ongletReservationsProprio.refuser')}
        </button>
      </div>
    </div>
  </div>
)}

        {/* ─ ÉCHANGES CHAT ─ */}
        {(r.statut === 'acceptee' || r.statut === 'echanges') && (
          <div>
            <div style={{ background: 'var(--green-light)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <span>🎉</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{t('ongletReservationsProprio.echanges.candidatureAcceptee')}</div>
                <div style={{ fontSize: 12, color: 'var(--green)' }}>{t('ongletReservationsProprio.echanges.discutezConditions')}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ background: 'var(--green)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
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
                      <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: isMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMoi ? 'var(--green)' : 'var(--bg-secondary)', color: isMoi ? '#fff' : 'var(--text-primary)', fontSize: 13, lineHeight: 1.5, boxShadow: 'var(--shadow-sm)' }}>
                        {m.contenu}
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 8 }}>
                <input
                  value={newMsg}
                  onChange={function(e) { setNewMsg(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') envoyerMessage(); }}
                  placeholder={t('ongletReservationsProprio.echanges.messagePlaceholder')}
                  style={{ flex: 1, padding: '9px 14px', borderRadius: 16, border: '0.5px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--surface-soft)' }} />
                <button onClick={envoyerMessage} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--green)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={16} strokeWidth={1.5} /></button>
              </div>
            </div>
          </div>
        )}

        {/* ─ CAUTION EN ATTENTE ─ */}
        {r.statut === 'caution_requise' && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Clock size={32} strokeWidth={1.5} color="var(--text-muted)" /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
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
            <div style={{ background: 'var(--green-light)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <CheckCircle size={32} strokeWidth={1.5} color="var(--green)" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                  {t('ongletReservationsProprio.cautionRecue.titre', { montant: new Intl.NumberFormat('fr-FR').format(loyer) })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--green)' }}>
                  {t('ongletReservationsProprio.cautionRecue.preparerBail')}
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: 'var(--shadow-md)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
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
                  <div key={item} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Check size={14} strokeWidth={1.5} color="var(--green)" />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={function() { setBailPanel(true); }}
              style={{ width: '100%', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {t('ongletReservationsProprio.genererPreparerBail')}
            </button>
            {r.statut === 'caution_payee' && (
              annulerResa === r.id ? (
                <div style={{ background: 'var(--danger-soft)', border: '0.5px solid var(--danger)', borderRadius: 12, padding: 14, marginTop: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>{t('ongletReservationsProprio.cautionRecue.annulerConfirmation')}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={function() { setAnnulerResa(null); action('/decision', { decision: 'refusee', motif: t('ongletReservationsProprio.cautionRecue.motifAnnulation') }, t('ongletReservationsProprio.cautionRecue.toastAnnulee')); }}
                      style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {t('ongletReservationsProprio.cautionRecue.annulerOui')}
                    </button>
                    <button onClick={function() { setAnnulerResa(null); }}
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {t('ongletReservationsProprio.cautionRecue.annulerNon')}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={function() { setAnnulerResa(r.id); }}
                  style={{ width: '100%', background: 'transparent', color: 'var(--danger)', border: 'none', padding: '10px 0 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  {t('ongletReservationsProprio.cautionRecue.annulerBouton')}
                </button>
              )
            )}
          </div>
        )}

        {/* ─ BAIL : conditions particulières, signatures, document ─ */}
        {(bailPanel || acteBail || r.statut === 'bail_en_cours') && ['caution_payee', 'bail_en_cours', 'bail_signe_proprio'].includes(r.statut) && (
          <div style={{ marginTop: 14 }}>
            <ActesSignature key={r.id} reservationId={r.id} type="bail" onFermer={function() { setBailPanel(false); }} onChange={function() { if (recharger) recharger(); }} />
          </div>
        )}

        {/* ─ EN ATTENTE SIGNATURE LOCATAIRE ─ */}
        {r.statut === 'bail_signe_proprio' && acteBail === false && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Clock size={32} strokeWidth={1.5} color="var(--text-muted)" /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {t('ongletReservationsProprio.attenteSignature.titre', { prenom: r.locataire_prenom })}
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              {t('ongletReservationsProprio.attenteSignature.description')}
            </div>
          </div>
        )}

        {/* ─ LOCATION ACTIVE ─ */}
        {r.statut === 'confirmee' && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}><Key size={14} strokeWidth={1.5} /></div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{t('ongletReservationsProprio.locationActive.titre')}</div>
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
                  <span style={{ color: 'var(--text-muted)' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row[1]}</span>
                </div>
              );
            })}
            <button type="button" onClick={function() { telechargerBailSigne(r.id); }}
              style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 8, border: '1.5px solid var(--green)', background: 'var(--bg-secondary)', color: 'var(--green)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('ongletReservationsProprio.locationActive.telechargerBail')}
            </button>
          </div>
        )}

        {/* ─ REFUSÉE ─ */}
        {r.statut === 'refusee' && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
            <XCircle size={36} strokeWidth={1.5} color="var(--danger)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)' }}>{t('ongletReservationsProprio.refusee.titre')}</div>
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
        <div style={{ background: 'var(--danger-soft)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} strokeWidth={1.5} color="var(--danger)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
              {t('ongletReservationsProprio.liste.actionsRequises', { count: actionsRequises.length })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--danger)' }}>
              {t('ongletReservationsProprio.liste.repondezAuxDemandes')}
            </div>
          </div>
        </div>
      )}

      {reservations.length === 0 && (
        <div className="dash-empty-state">
          <CalendarCheck size={48} strokeWidth={1} color="var(--green-border)" />
          <h3>{t('ongletReservationsProprio.liste.aucuneDemande.titre')}</h3>
          <p>{t('ongletReservationsProprio.liste.aucuneDemande.description')}</p>
        </div>
      )}

      {reservations.map(function(r) {
        var cfg = cfgStatuts[r.statut] || { label: r.statut, couleur: 'var(--text-muted)', urgent: false };
        return (
          <div key={r.id} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid ' + (cfg.urgent ? 'var(--danger)' : 'var(--green)') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 38, height: 38, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {((r.locataire_prenom || 'L').charAt(0) + (r.locataire_nom || 'L').charAt(0)).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {r.locataire_prenom} {r.locataire_nom}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.locataire_telephone}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><Home size={12} strokeWidth={1.5} /> {r.logement_titre}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginTop: 3 }}>
                  {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || r.montant_total || 0)} GNF/mois
                </div>
              </div>
              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: cfg.urgent ? 'var(--danger-soft)' : 'var(--green-light)', color: cfg.couleur, flexShrink: 0, marginLeft: 10 }}>
                {cfg.label}
              </span>
            </div>
            {cfg.urgent && (
              <div style={{ background: 'var(--warn-soft)', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: 'var(--warn)', fontWeight: 600 }}>
                {t('ongletReservationsProprio.liste.interventionRequise')}
              </div>
            )}
            <button
              onClick={function() { setSelectionne(r); }}
              style={{ width: '100%', background: cfg.urgent ? 'var(--green)' : 'var(--bg-tertiary)', color: cfg.urgent ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: cfg.urgent ? 700 : 400, cursor: 'pointer' }}>
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
    return <PaiementsLocataire stats={stats} onPaiementEffectue={function() { window.dispatchEvent(new CustomEvent('werdhe:refresh')); }} />;
  }
  // Proprio → déléguer à PaiementsProprietaire
  return <PaiementsProprietaire stats={stats} />;
}

// Statut du loyer du mois en cours pour un bail. Un paiement se rattache au bail
// (reservation_id) ; seuls ceux du mois comptent : payé s'il existe un paiement
// complet ce mois-ci, en retard si un paiement est en attente, impayé sinon.
function statutLoyerDuMois(paiements, reservationId) {
  var maintenant = new Date();
  var duMois = (paiements || []).filter(function(p) {
    if (!reservationId || String(p.reservation_id) !== String(reservationId)) return false;
    var d = new Date(p.date_paiement || p.created_at);
    return d.getFullYear() === maintenant.getFullYear() && d.getMonth() === maintenant.getMonth();
  });
  if (duMois.some(function(p) { return p.statut === 'complete'; })) return { statut: 'paye', jours: 0 };
  var attente = duMois.filter(function(p) { return p.statut === 'en_attente'; })[0];
  if (attente) {
    return { statut: 'en_retard', jours: Math.max(0, Math.floor((maintenant - new Date(attente.created_at)) / 86400000)) };
  }
  return { statut: 'impaye', jours: 0 };
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
    { id: 'mtn', label: t('ongletPaiementsDash.payModes.mtn.label'), sub: t('ongletPaiementsDash.payModes.mtn.sub'), color: '#FFCC00', text: 'var(--text-primary)', abbr: 'MM' },
    { id: 'cash', label: t('ongletPaiementsDash.payModes.cash.label'), sub: t('ongletPaiementsDash.payModes.cash.sub'), abbr: 'ESP' },
    { id: 'bank', label: t('ongletPaiementsDash.payModes.bank.label'), sub: t('ongletPaiementsDash.payModes.bank.sub'), abbr: 'VIR' }
  ];
  useEffect(function() {
    // Seuls les biens loués ont un loyer à encaisser. Un paiement se rattache
    // au bail (reservation_id) : la table des paiements n'a pas de logement_id.
    var bl = (stats.logements || []).filter(function(l) { return l.statut === 'loue'; }).map(function(l) {
      var resaActive = (stats.reservations || []).find(function(r) { return String(r.logement_id) === String(l.id) && r.statut === 'confirmee'; });
      var etat = resaActive
        ? statutLoyerDuMois(stats.paiements, resaActive.id)
        : { statut: 'impaye', jours: 0 };
      return {
        id:            l.id,
        nom:           l.titre,
        locataire:     resaActive ? (resaActive.locataire_prenom + ' ' + resaActive.locataire_nom) : '-',
        reservation_id: resaActive ? resaActive.id : null,
        quartier:      l.ville,
        loyer:         Number(resaActive && resaActive.montant_total ? resaActive.montant_total : l.prix_mensuel),
        statut:        etat.statut,
        jours:         etat.jours,
        icon:          <Home size={24} strokeWidth={1.5} />
      };
    });
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
              return Object.assign({}, b, statutLoyerDuMois(paiementsfrais, b.reservation_id));
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
  var SCFG = { paye: { label: t('ongletPaiementsDash.statuts.paye'), bg: 'var(--green-light)', color: 'var(--green)', border: 'var(--green-border)', bar: 'var(--green)' }, impaye: { label: t('ongletPaiementsDash.statuts.nonPaye'), bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'var(--danger)', bar: 'var(--danger)' }, en_retard: { label: t('ongletPaiementsDash.statuts.enRetard'), bg: 'var(--warn-soft)', color: 'var(--warn)', border: 'var(--warn)', bar: '#C8860A' } };
  return (
    <div style={{fontFamily: 'var(--font-body)'}}>
      <div style={{background:'#1B6B3A',borderRadius: '12px',padding:'14px 18px',marginBottom:'18px'}}>
        <div style={{color:'#fff',fontWeight:'700',fontSize:'16px'}}>{t('ongletPaiementsDash.proprio.titre')}</div>
        <div style={{color:'rgba(255,255,255,.7)',fontSize:'12px',marginTop:'2px'}}>{t('ongletPaiementsDash.proprio.sousTitre', { mois: moisActuel, count: biensList.length })}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'18px'}}>
        {[{label:t('ongletPaiementsDash.proprio.kpi.encaisse'),val:GNF(totalPercu),sub:t('ongletPaiementsDash.proprio.kpi.taux', { taux: tauxRecouv }),bg:'var(--green-light)',border:'var(--green)',color:'var(--green)'},{label:t('ongletPaiementsDash.proprio.kpi.impayes'),val:GNF(totalImpaye),sub:t('ongletPaiementsDash.proprio.kpi.locataires', { count: biensList.filter(function(b){return b.statut!=='paye';}).length }),bg:'var(--danger-soft)',border:'var(--danger)',color:'var(--danger)'},{label:t('ongletPaiementsDash.proprio.kpi.attendu'),val:GNF(totalAttendu),sub:t('ongletPaiementsDash.proprio.kpi.totalDuMois'),bg:'var(--surface-soft)',border:'#888',color:'var(--text-primary)'}].map(function(k){return(<div key={k.label} style={{background:k.bg,borderRadius:'12px',padding:'12px 14px',borderLeft:'3px solid '+k.border}}><div style={{fontSize:'11px',color:k.color,marginBottom:'4px'}}>{k.label}</div><div style={{fontSize:'15px',fontWeight:'700',color:k.color}}>{k.val}</div><div style={{fontSize:'10px',color:k.color,marginTop:'2px',opacity:0.7}}>{k.sub}</div></div>);})}
      </div>
      <div style={{background:'var(--bg-secondary)',borderRadius:'12px',padding:'14px 16px',marginBottom:'16px',boxShadow: 'var(--shadow-md)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span style={{fontSize:'13px',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.tauxRecouvrement')}</span><span style={{fontSize:'13px',fontWeight:'700',color:'var(--green)'}}>{tauxRecouv}%</span></div>
        <div style={{background:'var(--bg-tertiary)',borderRadius:'6px',height:'10px',overflow:'hidden'}}><div style={{background:'#1B6B3A',width:tauxRecouv+'%',height:'100%',borderRadius:'6px',transition:'width .5s'}}/></div>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
        {[['tous',t('ongletPaiementsDash.proprio.filtres.tous'),'#1B6B3A'],['paye',t('ongletPaiementsDash.proprio.filtres.payes'),'#1B6B3A'],['impaye',t('ongletPaiementsDash.proprio.filtres.nonPayes'),'#C62828'],['en_retard',t('ongletPaiementsDash.proprio.filtres.enRetard'),'#C8860A']].map(function(f){return(<button key={f[0]} type="button" onClick={function(){setFilterStatut(f[0]);}} style={{padding:'7px 16px',borderRadius: '16px',fontSize:'12px',cursor:'pointer',border:filterStatut===f[0]?'1.5px solid '+f[2]:'0.5px solid var(--border)',background:filterStatut===f[0]?f[2]:'var(--bg-secondary)',color:filterStatut===f[0]?'#fff':'#666',fontWeight:filterStatut===f[0]?700:400}}>{f[1]}</button>);})}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
        {filtered.length===0&&<div style={{textAlign:'center',padding:'30px',color:'var(--text-muted)'}}>{t('ongletPaiementsDash.proprio.aucunBien')}</div>}
        {filtered.map(function(b){var s=SCFG[b.statut]||SCFG.impaye;return(<div key={b.id} style={{background:'var(--bg-secondary)',borderRadius: '12px',padding:'16px',boxShadow: 'var(--shadow-md)',borderLeft:'4px solid '+s.bar}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{display:'flex',gap:'10px',alignItems:'center'}}><div style={{width:'40px',height:'40px',background:'var(--surface-soft)',borderRadius: '8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{b.icon}</div><div><div style={{fontWeight:'700',fontSize:'14px',color:'var(--text-primary)'}}>{b.nom}</div><div style={{fontSize:'12px',color:'var(--text-muted)'}}>{b.locataire} · {b.quartier}</div></div></div>
            <span style={{padding:'4px 10px',borderRadius: '16px',fontSize:'11px',fontWeight:'700',background:s.bg,color:s.color,border:'0.5px solid '+s.border}}>{s.label}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
            <div style={{background:'var(--surface-soft)',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'var(--text-muted)'}}>{t('ongletPaiementsDash.proprio.loyerMensuel')}</div><div style={{fontSize:'14px',fontWeight:'700',color:'var(--green)'}}>{GNF(b.loyer)}</div></div>
            <div style={{background:'var(--surface-soft)',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'var(--text-muted)'}}>{t('ongletPaiementsDash.proprio.situation')}</div><div style={{fontSize:'13px',fontWeight:'600',color:s.color}}>{b.statut==='paye'?t('ongletPaiementsDash.proprio.payeCeMois'):b.statut==='en_retard'?t('ongletPaiementsDash.proprio.retardJours', { jours: b.jours }):t('ongletPaiementsDash.proprio.nonPaye')}</div></div>
          </div>
          {b.statut==='paye'?(<div style={{display:'flex',gap:'8px'}}><button type="button" style={{flex:1,background:'var(--surface-soft)',color:'var(--green)',border:'0.5px solid var(--green-border)',borderRadius: '8px',padding:'9px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.voirQuittance')}</button><button type="button" style={{flex:1,background:'var(--surface-soft)',color:'var(--text-secondary)',border:'0.5px solid var(--border)',borderRadius: '8px',padding:'9px',fontSize:'13px',cursor:'pointer'}}>{t('ongletPaiementsDash.proprio.contacter')}</button></div>):(<div style={{display:'flex',gap:'8px'}}><button type="button" onClick={function(){ouvrirModal(b);}} style={{flex:2,background:'var(--green)',color:'#fff',border:'none',borderRadius: '8px',padding:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>{t('ongletPaiementsDash.proprio.enregistrerPaiement')}</button><button type="button" style={{flex:1,background:'var(--danger-soft)',color:'var(--danger)',border:'0.5px solid var(--danger)',borderRadius: '8px',padding:'10px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.relancer')}</button></div>)}
        </div>);})}
      </div>
      {modal&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'flex-end',zIndex:1000}} onClick={function(e){if(e.target===e.currentTarget)fermerModal();}}>
        <div style={{background:'var(--bg-secondary)',borderRadius:'20px 20px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:'600px',margin:'0 auto',maxHeight:'90vh',overflowY:'auto'}}>
          {!done?(<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><div><div style={{fontSize:'16px',fontWeight:'700'}}>{t('ongletPaiementsDash.modal.titre')}</div><div style={{fontSize:'12px',color:'var(--text-muted)'}}>{modal.nom} · {modal.locataire}</div></div><button type="button" onClick={fermerModal} style={{width:'32px',height:'32px',borderRadius:'50%',border:'none',background:'var(--surface-soft)',cursor:'pointer'}}>x</button></div>
            <div style={{background:'var(--surface-soft)',borderRadius:'12px',padding:'14px',marginBottom:'18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:'12px',color:'var(--text-secondary)'}}>{t('ongletPaiementsDash.proprio.loyerMensuel')}</div></div><div style={{fontSize:'22px',fontWeight:'700',color:'var(--green)'}}>{GNF(modal.loyer)}</div></div>
            <div style={{fontSize:'13px',fontWeight:'700',marginBottom:'12px'}}>{t('ongletPaiementsDash.modal.modePaiement')}</div>
            {PAY_MODES.map(function(p){return(<div key={p.id} onClick={function(){setSelectedMode(p.id);}} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',border:selectedMode===p.id?'2px solid var(--green)':'0.5px solid var(--border)',background:selectedMode===p.id?'var(--green-light)':'var(--bg-secondary)',borderRadius:'12px',marginBottom:'8px',cursor:'pointer'}}><div style={{width:'40px',height:'40px',background:p.color||'var(--green-light)',borderRadius: '8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:p.icon?'20px':'13px',fontWeight:'700',color:p.text||'var(--green)'}}>{p.icon||p.abbr}</div><div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'600'}}>{p.label}</div><div style={{fontSize:'11px',color:'var(--text-muted)'}}>{p.sub}</div></div><div style={{width:'22px',height:'22px',borderRadius:'50%',border:selectedMode===p.id?'none':'1.5px solid var(--border)',background:selectedMode===p.id?'var(--green)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedMode===p.id&&<Check size={12} strokeWidth={2} color="#fff" />}</div></div>);})}
            <button type="button" onClick={confirmerPaiement} disabled={processing} style={{width:'100%',background:processing?'#999':'var(--green)',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'700',cursor:processing?'not-allowed':'pointer',marginTop:'6px'}}>{processing?t('ongletPaiementsDash.modal.traitementEnCours'):t('ongletPaiementsDash.modal.confirmer', { montant: GNF(modal.loyer) })}</button>
          </div>):(<div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{width:'70px',height:'70px',background:'var(--green-light)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'36px'}}><CheckCircle size={36} strokeWidth={1.5} color="var(--green)"/></div>
            <div style={{fontSize:'20px',fontWeight:'700',color:'var(--green)',marginBottom:'8px'}}>{t('ongletPaiementsDash.modal.succes.titre')}</div>
            <div style={{fontSize:'13px',color:'#666',marginBottom:'20px'}}>{t('ongletPaiementsDash.modal.succes.description')}</div>
            <div style={{display:'flex',gap:'10px'}}><button type="button" style={{flex:1,background:'var(--surface-soft)',color:'var(--green)',border:'0.5px solid var(--green-border)',borderRadius: '8px',padding:'12px',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>{t('ongletPaiementsDash.proprio.voirQuittance')}</button><button type="button" onClick={fermerModal} style={{flex:1,background:'var(--green)',color:'#fff',border:'none',borderRadius: '8px',padding:'12px',fontSize:'13px',cursor:'pointer',fontWeight:'700'}}>{t('ongletPaiementsDash.modal.retour')}</button></div>
          </div>)}
        </div>
      </div>)}
    </div>
  );
}

function PaiementsLocataire(props) {
  var t = useTranslation('dashboard').t;
  var stats = props.stats;
  var [logement, setLogement] = useState(null);
  var [reservationReelle, setReservationReelle] = useState(null);
  var [showPaiementDjomy, setShowPaiementDjomy] = useState(false);
  var [enregistrementEspeces, setEnregistrementEspeces] = useState(false);
  useEffect(function() {
    var r = (stats.reservations||[]).find(function(r){return r.statut==='confirmee';});
    if(r){
      setReservationReelle(r);
      setLogement({nom:r.logement_titre||t('ongletPaiementsDash.locataireLegacy.monLogement'),proprio:(r.prop_prenom||'')+' '+(r.prop_nom||''),propIni:((r.prop_prenom||'').charAt(0)+(r.prop_nom||'').charAt(0)).toUpperCase()||'P',quartier:r.logement_ville||'Conakry',loyer:Number(r.prix_mensuel)||0,montantDu:Number(r.montant_total)||0,debut:r.date_debut?new Date(r.date_debut).toLocaleDateString('fr-FR'):'-',fin:r.date_fin?new Date(r.date_fin).toLocaleDateString('fr-FR'):'-'});
    } else {
      setReservationReelle(null);
      setLogement({nom:'Appartement F3 - Ratoma',proprio:'Mamadou Barry',propIni:'MB',quartier:'Ratoma, Conakry',loyer:1500000,montantDu:1500000,debut:'1 juillet 2025',fin:'30 juin 2026'});
    }
  }, [stats]);
  if (!logement) return null;
  var moisActuel = new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  var paiementsResa = reservationReelle ? (stats.paiements||[]).filter(function(p){return p.reservation_id===reservationReelle.id;}) : [];
  var paiementComplet = paiementsResa.find(function(p){return p.statut==='complete';});
  var paiementEnAttente = paiementsResa.find(function(p){return p.statut==='en_attente';});
  var historique = (stats.paiements||[]).slice(0,3).map(function(p){return{mois:new Date(p.created_at).toLocaleDateString('fr-FR',{month:'long',year:'numeric'}),montant:Number(p.montant),mode:p.mode_paiement==='especes'?t('ongletPaiementsDash.locataireLegacy.especes'):p.mode_paiement};});
  if(historique.length===0){historique=[{mois:t('ongletPaiementsDash.locataireLegacy.moisPrecedent'),montant:logement.loyer,mode:'Orange Money'},{mois:t('ongletPaiementsDash.locataireLegacy.ilYA2Mois'),montant:logement.loyer,mode:t('ongletPaiementsDash.locataireLegacy.especes')},{mois:t('ongletPaiementsDash.locataireLegacy.ilYA3Mois'),montant:logement.loyer,mode:'MTN MoMo'}];}

  function signalerEspeces() {
    if (!reservationReelle) return;
    setEnregistrementEspeces(true);
    api.post('/paiements', { reservation_id: reservationReelle.id, mode_paiement: 'especes' })
      .then(function() {
        toast.success(t('ongletPaiementsDash.locataireLegacy.toastPaiementEffectue'));
        if (props.onPaiementEffectue) props.onPaiementEffectue();
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletPaiementsDash.modal.erreur'));
      })
      .finally(function() { setEnregistrementEspeces(false); });
  }

  var statutPaye = !!paiementComplet;

  return (
    <div style={{fontFamily: 'var(--font-body)'}}>
      <div style={{background:'#1B6B3A',borderRadius: '12px',padding:'16px 18px',marginBottom:'18px'}}><div style={{color:'#fff',fontWeight:'700',fontSize:'16px'}}>{t('ongletPaiementsDash.locataireLegacy.mesPaiements')}</div><div style={{color:'rgba(255,255,255,.75)',fontSize:'12px',marginTop:'2px'}}>{moisActuel}</div></div>
      <div style={{background:'var(--bg-secondary)',borderRadius: '12px',padding:'16px',marginBottom:'14px',boxShadow: 'var(--shadow-md)'}}>
        <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'14px'}}>
          <div style={{width:'52px',height:'52px',background:'var(--info-soft)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}><Building2 size={26} strokeWidth={1.5} color="var(--info)" /></div>
          <div style={{flex:1}}><div style={{fontWeight:'700',fontSize:'14px',color:'var(--text-primary)'}}>{logement.nom}</div><div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px',display:'flex',alignItems:'center',gap:4}}><MapPin size={11} strokeWidth={1.5} /> {logement.quartier}</div><div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px'}}><div style={{width:'26px',height:'26px',background:'var(--green)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'10px',fontWeight:'700'}}>{logement.propIni}</div><span style={{fontSize:'12px',color:'var(--text-secondary)'}}>{logement.proprio}</span></div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:'16px',fontWeight:'700',color:'var(--green)'}}>{GNF(logement.loyer)}</div><div style={{fontSize:'10px',color:'var(--text-muted)'}}>/ mois</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
          {[[t('ongletPaiementsDash.locataireLegacy.debut'),logement.debut],[t('ongletPaiementsDash.locataireLegacy.fin'),logement.fin],[t('ongletPaiementsDash.locataireLegacy.caution'),GNF(logement.loyer)]].map(function(row){return <div key={row[0]} style={{background:'var(--surface-soft)',borderRadius:'8px',padding:'8px 10px'}}><div style={{fontSize:'10px',color:'var(--text-muted)'}}>{row[0]}</div><div style={{fontSize:'11px',fontWeight:'600',color:'var(--text-primary)',marginTop:'2px'}}>{row[1]}</div></div>;})}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:statutPaye?'var(--green-light)':(paiementEnAttente?'var(--warn-soft)':'var(--danger-soft)'),borderRadius: '8px',marginBottom:'14px',border:'0.5px solid '+(statutPaye?'var(--green-border)':(paiementEnAttente?'var(--warn)':'var(--danger)'))}}>
          <div><div style={{fontSize:'13px',fontWeight:'700',color:statutPaye?'var(--green)':(paiementEnAttente?'var(--warn)':'var(--danger)')}}>{statutPaye?t('ongletPaiementsDash.locataireLegacy.loyerPaye', { mois: moisActuel }):(paiementEnAttente?t('ongletPaiementsDash.modal.enAttenteConfirmation'):t('ongletPaiementsDash.locataireLegacy.loyerImpaye', { mois: moisActuel }))}</div><div style={{fontSize:'11px',color:'var(--text-muted)',marginTop:'2px'}}>{statutPaye?t('ongletPaiementsDash.locataireLegacy.quittanceEnvoyee'):(paiementEnAttente?t('ongletPaiementsDash.modal.confirmationProprietaire'):t('ongletPaiementsDash.locataireLegacy.duDepuis3Jours'))}</div></div>
          <div style={{fontSize:'16px',fontWeight:'700',color:statutPaye?'var(--green)':(paiementEnAttente?'var(--warn)':'var(--danger)')}}>{GNF(logement.montantDu)}</div>
        </div>
        <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'8px'}}>{t('ongletPaiementsDash.locataireLegacy.historiqueRecent')}</div>
        {historique.map(function(h,i){return(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'var(--surface-soft)',borderRadius:'8px',marginBottom:'6px'}}><div><div style={{fontSize:'12px',fontWeight:'600'}}>{h.mois}</div><div style={{fontSize:'11px',color:'var(--text-muted)'}}>{h.mode}</div></div><div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'12px',fontWeight:'700',color:'var(--green)'}}>{GNF(h.montant)}</span><span style={{background:'var(--green-light)',color:'var(--green)',padding:'2px 8px',borderRadius: '16px',fontSize:'10px',fontWeight:'700'}}>{t('ongletPaiementsDash.locataireLegacy.paye')}</span></div></div>);})}
      </div>
      {!reservationReelle ? (
        <div style={{background:'var(--surface-soft)',borderRadius: '12px',padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:'13px'}}>{t('ongletPaiementsDash.modal.aucuneReservationActive')}</div>
      ) : statutPaye ? (
        <div style={{background:'var(--green-light)',borderRadius: '12px',padding:'20px',textAlign:'center',boxShadow: 'var(--shadow-md)'}}><div style={{fontSize:'40px',marginBottom:'10px'}}>🎉</div><div style={{fontSize:'16px',fontWeight:'700',color:'var(--green)',marginBottom:'6px'}}>{t('ongletPaiementsDash.locataireLegacy.paiementEffectue')}</div></div>
      ) : (
        <div style={{background:'var(--bg-secondary)',borderRadius: '12px',padding:'16px',marginBottom:'14px',boxShadow: 'var(--shadow-md)'}}>
          <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>{t('ongletPaiementsDash.locataireLegacy.effectuerPaiement')}</div>
          <div style={{background:'var(--surface-soft)',borderRadius: '8px',padding:'12px 14px',marginBottom:'14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{t('ongletPaiementsDash.locataireLegacy.total')}</span>
            <span style={{fontSize:'18px',fontWeight:'700',color:'var(--green)'}}>{GNF(logement.montantDu)}</span>
          </div>
          {paiementEnAttente ? (
            <div style={{textAlign:'center',fontSize:'12px',color:'var(--warn)',padding:'10px'}}>{t('ongletPaiementsDash.modal.enAttenteConfirmation')}</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <button type="button" onClick={function(){setShowPaiementDjomy(true);}} style={{width:'100%',background:'var(--green)',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'700',cursor:'pointer'}}>{t('ongletPaiementsDash.modal.payerEnLigne', { montant: GNF(logement.montantDu) })}</button>
              <button type="button" onClick={signalerEspeces} disabled={enregistrementEspeces} style={{width:'100%',background:'var(--surface-soft)',color:'var(--green)',border:'0.5px solid var(--green-border)',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'600',cursor:enregistrementEspeces?'not-allowed':'pointer'}}>{enregistrementEspeces?t('ongletPaiementsDash.modal.traitementEnCours'):t('ongletPaiementsDash.modal.signalerEspeces')}</button>
            </div>
          )}
        </div>
      )}
      {showPaiementDjomy && reservationReelle && (
        <ModalPaiementMobile
          montant={logement.montantDu}
          titre={logement.nom}
          payload={{ reservation_id: reservationReelle.id }}
          endpoint="/paiements/djomy/initier"
          onClose={function(){setShowPaiementDjomy(false);}}
        />
      )}
    </div>
  );
}

// ================================================
// ONGLET : Preavis
// ================================================

function OngletPreavis(props) {
  var t = useTranslation('dashboard').t;
  var [renouvellements, setRenouvellements] = useState([]);
  var [contre, setContre] = useState(null); // { id, duree, prix, message, envoi }

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

function ouvrirContreProposition(rn) {
  setContre({ id: rn.id, duree: String(rn.nouvelle_duree_mois), prix: String(rn.nouveau_prix || rn.loyer_actuel || ''), message: '', envoi: false });
}

function envoyerContreProposition() {
  if (!contre) return;
  setContre(Object.assign({}, contre, { envoi: true }));
  api.post('/renouvellements/' + contre.id + '/contre-proposer', {
    nouvelle_duree_mois: parseInt(contre.duree, 10),
    nouveau_prix:        contre.prix ? Number(contre.prix) : null,
    message:             contre.message || null
  })
    .then(function() {
      toast.success(t('ongletPreavisDash.renouv.contreEnvoyee'));
      var idEnvoye = contre.id;
      setContre(null);
      setRenouvellements(function(prev) { return prev.filter(function(r) { return r.id !== idEnvoye; }); });
    })
    .catch(function(err) {
      setContre(function(c) { return c && Object.assign({}, c, { envoi: false }); });
      toast.error((err.response && err.response.data && err.response.data.erreur) || t('ongletPreavisDash.erreur'));
    });
}
  var user      = props.user;
  var setOnglet = props.setOnglet;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');
  var [step, setStep]       = useState('form');
  var [motif, setMotif]     = useState('');
  var [dateDepart, setDateDepart] = useState('');
  var [apercu, setApercu]   = useState(null);
  var [apercuLoading, setApercuLoading] = useState(false);
  var [delais, setDelais]   = useState({ locataire: 30, proprietaire: 30, maximum: 730 });
  var [mesPreavis, setMesPreavis] = useState([]);
  var [annulation, setAnnulation] = useState(null); // { documentId, motif }
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
  api.get('/preavis/delai-minimum')
    .then(function(res) { setDelais(res.data); })
    .catch(function() {});
  chargerMesPreavis();
}, []);

function chargerMesPreavis() {
  api.get('/preavis')
    .then(function(res) {
      setMesPreavis((res.data.preavis || []).filter(function(p) {
        return p.auteur_id === (user && user.id) && p.statut !== 'termine';
      }));
    })
    .catch(function() {});
}

function telechargerDocumentPreavis(documentId, numero) {
  if (!documentId) { toast.error(t('ongletPreavisDash.toastErreurTelechargement')); return; }
  api.get('/documents/' + documentId + '/telecharger?format=pdf', { responseType: 'blob' })
    .then(function(r) {
      var typePdf = (r.headers && r.headers['content-type'] || '').indexOf('pdf') !== -1;
      var url  = window.URL.createObjectURL(new Blob([r.data], { type: typePdf ? 'application/pdf' : 'text/html; charset=utf-8' }));
      var link = document.createElement('a');
      link.href = url;
      link.download = (numero || 'Preavis') + (typePdf ? '.pdf' : '.html');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('ongletPreavisDash.toastPdfTelecharge'));
    })
    .catch(function() { toast.error(t('ongletPreavisDash.toastErreurTelechargement')); });
}

function confirmerAnnulationPreavis() {
  if (!annulation || (annulation.motif || '').trim().length < 3) return;
  api.post('/documents/' + annulation.documentId + '/annuler', { motif: annulation.motif })
    .then(function() {
      toast.success(t('ongletPreavisDash.mes.toastAnnule'));
      setAnnulation(null);
      chargerMesPreavis();
    })
    .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletPreavisDash.toastErreurEnvoi')); });
}

function repondre(preavisId, reponse) {
  setReponseLoading(true);
  api.patch('/preavis/' + preavisId + '/repondre', {
    reponse:  reponse,
    message:  messageReponse
  })
    .then(function() {
      toast.success(reponse === 'accepte' ? t('ongletPreavisDash.recus.toastAccuse') : t('ongletPreavisDash.recus.toastRenouvellement'));
      setReponseModal(null);
      setMessageReponse('');
      setPreavisRecus(function(prev) { return prev.filter(function(p) { return p.id !== preavisId; }); });
    })
    .catch(function(err) {
      toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur');
    })
    .finally(function() { setReponseLoading(false); });
}
  function reservationChoisie() {
    return estProprietaire ? bien : reservation;
  }

  function minDate() {
    var d = new Date();
    d.setDate(d.getDate() + (estProprietaire ? delais.proprietaire : delais.locataire));
    return d.toISOString().slice(0, 10);
  }

  function maxDate() {
    var d = new Date();
    d.setDate(d.getDate() + (delais.maximum || 730));
    return d.toISOString().slice(0, 10);
  }

  function erreurApi(err, defaut) {
    return err.response && err.response.data && err.response.data.erreur ? err.response.data.erreur : defaut;
  }

  // Étape « aperçu » : le serveur génère le document sans rien enregistrer.
  function ouvrirApercu() {
    var r = reservationChoisie();
    if (!r || !r.id) { toast.error(t('ongletPreavisDash.toastAucuneReservation')); return; }
    if (!motif || !dateDepart || (estProprietaire && !bien)) { toast.error(t('ongletPreavisDash.form.champsManquants')); return; }
    setApercuLoading(true);
    api.post('/preavis/apercu', { reservation_id: r.id, motif: motif, date_depart: dateDepart, note: note })
      .then(function(res) { setApercu(res.data.html); setStep('confirm'); })
      .catch(function(err) { toast.error(erreurApi(err, t('ongletPreavisDash.toastErreurEnvoi'))); })
      .finally(function() { setApercuLoading(false); });
  }

  function envoyer() {
    var r = reservationChoisie();
    if (!r || !r.id) { toast.error(t('ongletPreavisDash.toastAucuneReservation')); return; }
    setLoading(true);
    api.post('/preavis', { reservation_id: r.id, motif: motif, date_depart: dateDepart, note: note })
    .then(function(res) {
      setResultat(res.data);
      setStep('sent');
      chargerMesPreavis();
      toast.success(t('ongletPreavisDash.toastPreavisEnvoye'));
    })
    .catch(function(err) {
      toast.error(erreurApi(err, t('ongletPreavisDash.toastErreurEnvoi')));
    })
    .finally(function() { setLoading(false); });
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
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--info)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} strokeWidth={1.5} /> {t('ongletPreavisDash.renouv.titre', { count: renouvellements.length })}
          </div>
          {renouvellements.map(function(rn) {
            return (
              <div key={rn.id} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 18, marginBottom: 12, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid var(--green)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} strokeWidth={1.5} /> {rn.logement_titre}
                </div>
                <div style={{ background: 'var(--info-soft)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                  {[
                    [t('ongletPreavisDash.renouv.proposePar'), (rn.auteur_prenom || rn.prop_prenom) + ' ' + (rn.auteur_nom || rn.prop_nom)],
                    [t('ongletPreavisDash.renouv.duree'), t('ongletPreavisDash.renouv.moisSupplementaires', { n: rn.nouvelle_duree_mois })],
                    [t('ongletPreavisDash.renouv.nouveauLoyer'), rn.nouveau_prix ? new Intl.NumberFormat('fr-FR').format(rn.nouveau_prix) + ' GNF/mois' : t('ongletPreavisDash.renouv.inchange')],
                    [t('ongletPreavisDash.renouv.recuLe'), new Date(rn.created_at).toLocaleDateString('fr-FR')],
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid var(--info)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{row[0]}</span>
                        <span style={{ fontWeight: 600, color: 'var(--info)' }}>{row[1]}</span>
                      </div>
                    );
                  })}
                  {rn.message && <div style={{ fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' }}>"{rn.message}"</div>}
                </div>
                {contre && contre.id === rn.id && (
                  <div style={{ border: '1px solid var(--info)', borderRadius: 12, padding: 14, marginBottom: 12, background: 'var(--surface-soft)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)', marginBottom: 10 }}>{t('ongletPreavisDash.renouv.contreTitre')}</div>
                    <div className="form-group">
                      <label>{t('ongletPreavisDash.renouv.contreDuree')}</label>
                      <select value={contre.duree} onChange={function(e) { setContre(Object.assign({}, contre, { duree: e.target.value })); }}>
                        {['1','2','3','6','12','18','24','36'].map(function(d) { return <option key={d} value={d}>{t('ongletBiens.renouvModal.dureeMois', { n: d })}</option>; })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('ongletPreavisDash.renouv.contreLoyer')}</label>
                      <input type="number" value={contre.prix} onChange={function(e) { setContre(Object.assign({}, contre, { prix: e.target.value })); }} />
                    </div>
                    <div className="form-group">
                      <label>{t('ongletPreavisDash.renouv.contreMessage')}</label>
                      <textarea rows="2" value={contre.message} placeholder={t('ongletPreavisDash.renouv.contreMessagePlaceholder')}
                        onChange={function(e) { setContre(Object.assign({}, contre, { message: e.target.value })); }}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <button type="button" onClick={function() { setContre(null); }}
                        style={{ padding: 11, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {t('ongletPreavisDash.renouv.annuler')}
                      </button>
                      <button type="button" disabled={contre.envoi} onClick={envoyerContreProposition}
                        style={{ padding: 11, borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: contre.envoi ? 0.6 : 1 }}>
                        {t('ongletPreavisDash.renouv.contreEnvoyer')}
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <button onClick={function() { repondreRenouvellement(rn.id, 'refuse'); }}
                    style={{ padding: 12, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {t('ongletPreavisDash.renouv.refuser')}
                  </button>
                  <button onClick={function() { ouvrirContreProposition(rn); }}
                    style={{ padding: 12, borderRadius: 8, border: '1.5px solid var(--info)', background: 'var(--bg-secondary)', color: 'var(--info)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {t('ongletPreavisDash.renouv.contreProposer')}
                  </button>
                  <button onClick={function() { repondreRenouvellement(rn.id, 'accepte'); }}
                    style={{ padding: 12, borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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
          <button className="btn-outline-green" onClick={function() { setStep('form'); setMotif(''); setDateDepart(''); setNote(''); setBien(null); setResultat(null); setApercu(null); }}>
            {t('ongletPreavisDash.nouveauPreavis')}
          </button>
        )}
      </div>

      {/* ── ÉCRAN ENVOYÉ ─────────────────────────────────────── */}
      {step === 'sent' && resultat && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, background: estProprietaire ? 'var(--warn-soft)' : 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 32 }}>
              {estProprietaire ? <Send size={32} strokeWidth={1.5}/> : <CheckCircle size={32} strokeWidth={1.5}/>}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: estProprietaire ? 'var(--danger)' : 'var(--green)', marginBottom: 8 }}>
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
          <div style={{ background: 'var(--warn-soft)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warn)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={14} strokeWidth={1.5} /> {estProprietaire ? t('ongletPreavisDash.sent.recapTitreProprio') : t('ongletPreavisDash.sent.recapTitreLocataire')}</div>
            {[
              estProprietaire ? [t('ongletPreavisDash.sent.bien'), bien && bien.logement_titre] : [t('ongletReservationsProprio.demandeRecue.labels.logement'), reservation && reservation.logement_titre],
              estProprietaire ? [t('ongletPreavisDash.sent.locataireNotifie'), resultat.dest_prenom + ' ' + resultat.dest_nom] : null,
              estProprietaire ? [t('ongletPreavisDash.sent.contact'), resultat.dest_tel || t('ongletReservationsProprio.na')] : null,
              [t('ongletPreavisDash.sent.motif'), motif],
              [t('ongletPreavisDash.sent.dateDepart'), resultat.date_sortie],
              [t('ongletPreavisDash.sent.document'), resultat.numero],
              [t('ongletPreavisDash.sent.statut'), t('ongletPreavisDash.sent.enAttenteAccuse')],
            ].filter(Boolean).map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '0.5px solid var(--warn)', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: 'var(--warn)', textAlign: 'right' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          {/* Info suite */}
          <div style={{ background: 'var(--green-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--green)', display: 'flex', gap: 6 }}>
            <Info size={14} strokeWidth={1.5} />
            <span style={{ lineHeight: 1.5 }}>
              {estProprietaire
                ? t('ongletPreavisDash.sent.infoProprioDate', { date: resultat.date_sortie })
                : t('ongletPreavisDash.sent.infoLocataire')}
            </span>
          </div>

          {/* Boutons actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={contacter}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 8, background: 'var(--surface-soft)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <MessageCircle size={14} strokeWidth={1.5} /> {estProprietaire ? t('ongletPreavisDash.sent.contacterLocataire') : t('ongletPreavisDash.sent.contacterProprio')}
            </button>
            <button onClick={function() { telechargerDocumentPreavis(resultat.document_id, resultat.numero); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 8, background: estProprietaire ? 'var(--danger)' : 'var(--green)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <FileText size={14} strokeWidth={1.5} /> {t('ongletPreavisDash.sent.telechargerPdf')}
            </button>
          </div>
        </div>
      )}

      {/* ── APERÇU AVANT ENVOI ───────────────────────────────── */}
      {step === 'confirm' && (function() {
        var largeur = Math.min(794, Math.max(280, (typeof window !== 'undefined' ? window.innerWidth : 794) - 96));
        var echelle = largeur / 794;
        return (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}><span style={{display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={15} strokeWidth={1.5}/> {t('ongletPreavisDash.apercu.titre')}</span></div>
          <div style={{ background: 'var(--danger-soft)', borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
            {t('ongletPreavisDash.apercu.avertissement')}
          </div>
          <div style={{ width: largeur, maxWidth: '100%', height: 1123 * echelle, overflow: 'hidden', borderRadius: 6, border: '1px solid var(--border)', margin: '0 auto 16px', background: '#E6ECE8' }}>
            <iframe title={t('ongletPreavisDash.apercu.titre')} srcDoc={apercu || ''} sandbox=""
              style={{ width: 794, height: 1123, border: 0, transformOrigin: '0 0', transform: 'scale(' + echelle + ')', background: 'var(--bg-secondary)' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={function() { setStep('form'); }}
              style={{ flex: 1, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: 8, padding: 12, fontSize: 13, cursor: 'pointer' }}>{t('ongletPreavis.modifier')}</button>
            <button onClick={envoyer} disabled={loading}
              style={{ flex: 2, background: loading ? '#999' : (estProprietaire ? 'var(--danger)' : 'var(--green)'), color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? t('ongletPreavisDash.confirm.envoiEnCours') : <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><Send size={14} strokeWidth={1.5}/> {t('ongletPreavisDash.apercu.envoyer')}</span>}
            </button>
          </div>
        </div>
        );
      })()}

      {/* ── MES PRÉAVIS ENVOYÉS ──────────────────────────────── */}
      {step === 'form' && mesPreavis.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>{t('ongletPreavisDash.mes.titre')}</div>
          {mesPreavis.map(function(p) {
            var accuse = p.statut === 'accuse' && p.accuse_at;
            return (
              <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid ' + (accuse ? 'var(--green)' : 'var(--warn)') }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.logement_titre}</div>
                <div style={{ fontSize: 12, color: '#666', margin: '4px 0 10px' }}>
                  {t('ongletPreavisDash.mes.depart', { date: p.date_sortie_estimee ? new Date(p.date_sortie_estimee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '' })}
                  {' · '}
                  <b style={{ color: accuse ? 'var(--green)' : 'var(--warn)' }}>
                    {accuse ? t('ongletPreavisDash.mes.accuse', { date: new Date(p.accuse_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) }) : t('ongletPreavisDash.mes.enAttente')}
                  </b>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={function() { telechargerDocumentPreavis(p.document_id, 'Preavis'); }} disabled={!p.document_id}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#37474F', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {t('ongletPreavisDash.mes.pdf')}
                  </button>
                  {p.statut === 'envoye' && p.document_id && (
                    <button onClick={function() { setAnnulation({ documentId: p.document_id, motif: '' }); }}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--danger)', background: 'var(--bg-secondary)', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t('ongletPreavisDash.mes.annuler')}
                    </button>
                  )}
                </div>
                {annulation && annulation.documentId === p.document_id && (
                  <div style={{ marginTop: 12 }}>
                    <input type="text" maxLength={300} autoFocus value={annulation.motif} placeholder={t('ongletPreavisDash.mes.annulerMotif')}
                      onChange={function(e) { setAnnulation({ documentId: annulation.documentId, motif: e.target.value }); }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={function() { setAnnulation(null); }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>{t('ongletLocataires.form.annuler')}</button>
                      <button onClick={confirmerAnnulationPreavis} disabled={annulation.motif.trim().length < 3}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: annulation.motif.trim().length < 3 ? '#E0B5B1' : 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: annulation.motif.trim().length < 3 ? 'not-allowed' : 'pointer' }}>
                        {t('ongletPreavisDash.mes.confirmerAnnulation')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PRÉAVIS REÇUS ─────────────────────────────────────── */}
{preavisRecus.length > 0 && (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
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
        <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 18, marginBottom: 12, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={14} strokeWidth={1.75} /> {t('ongletPreavisDash.recus.preavisDe', { logement: p.logement_titre })}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{t('ongletPreavisDash.recus.de', { expediteur: expediteur })}</div>
            </div>
            {diff !== null && (
              <div style={{ background: diff <= 5 ? 'var(--danger-soft)' : 'var(--warn-soft)', color: diff <= 5 ? 'var(--danger)' : 'var(--warn)', borderRadius: 16, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                J-{diff > 0 ? diff : 0}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--warn-soft)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
            {[
              [t('ongletPreavisDash.sent.motif'),               p.motif],
              [t('ongletPreavisDash.recus.dateDeSortie'),      dateSortie],
              [t('ongletPreavisDash.renouv.recuLe'),             new Date(p.created_at).toLocaleDateString('fr-FR')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid var(--warn)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: 'var(--warn)' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          {p.document_id && (
            <button onClick={function() { telechargerDocumentPreavis(p.document_id, 'Preavis'); }}
              style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 8, border: '1px solid #CFD8DC', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('ongletPreavisDash.recus.lireDocument')}
            </button>
          )}

          {reponseModal === p.id ? (
            <div>
              <textarea
                value={messageReponse}
                onChange={function(e) { setMessageReponse(e.target.value); }}
                placeholder={t('ongletPreavisDash.recus.messageOptionnel')}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, resize: 'none', height: 70, fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none', marginBottom: 10 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={function() { repondre(p.id, 'renouveler'); }}
                  disabled={reponseLoading}
                  style={{ padding: 12, borderRadius: 8, border: '1.5px solid var(--green)', background: 'var(--info-soft)', color: 'var(--info)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {t('ongletPreavisDash.recus.demanderRenouvellement')}
                </button>
                <button
                  onClick={function() { repondre(p.id, 'accepte'); }}
                  disabled={reponseLoading}
                  style={{ padding: 12, borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><CheckCircle size={14} strokeWidth={1.5}/> {t('ongletPreavisDash.recus.accepterDepart')}</span>
                </button>
              </div>
              <button onClick={function() { setReponseModal(null); setMessageReponse(''); }}
                style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: 'none', background: 'var(--surface-soft)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                {t('ongletLocataires.form.annuler')}
              </button>
            </div>
          ) : (
            <button
              onClick={function() { setReponseModal(p.id); }}
              style={{ width: '100%', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
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
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ background: 'var(--warn-soft)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--warn)', display: 'flex', gap: 6 }}>
            <Scale size={14} strokeWidth={1.5} />
            <span>{t('ongletPreavisDash.form.alerteInfo')}</span>
          </div>

          {/* Sélection bien (proprio) */}
          {estProprietaire && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{t('ongletPreavis.proprio.form.bienLabel')}</div>
              {biens.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('ongletPreavisDash.form.aucuneLocationActive')}</div>}
              {biens.map(function(b) {
                return (
                  <div key={b.id} onClick={function() { setBien(b); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: bien && bien.id === b.id ? '2px solid var(--green)' : '0.5px solid var(--border)', background: bien && bien.id === b.id ? 'var(--green-light)' : 'var(--surface-soft)', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
                    <Home size={18} strokeWidth={1.5} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.logement_titre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.locataire_prenom} {b.locataire_nom} · {b.locataire_telephone}</div>
                    </div>
                    {bien && bien.id === b.id && <Check size={16} strokeWidth={2} color="var(--green)" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Motif */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{t('ongletPreavis.locataire.form.motifLabel')}</div>
            {motifsList.map(function(opt) {
              var m = opt.value;
              return (
                <div key={m} onClick={function() { setMotif(m); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: motif === m ? '1.5px solid var(--green)' : '0.5px solid var(--border)', background: motif === m ? 'var(--green-light)' : 'var(--surface-soft)', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: motif === m ? 'none' : '1.5px solid #CCC', background: motif === m ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {motif === m && <Check size={11} strokeWidth={2} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 13, color: motif === m ? 'var(--green)' : 'var(--text-secondary)' }}>{opt.label}</span>
                </div>
              );
            })}
          </div>

          {/* Date de départ */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              {t('ongletPreavisDash.form.dateDepart')}
            </div>
            <input type="date" value={dateDepart} min={minDate()} max={maxDate()}
              onChange={function(e) { setDateDepart(e.target.value); }}
              style={{ width: '100%', padding: '11px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box', background: 'var(--surface-soft)' }} />
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', marginTop: 10, fontSize: 12, color: '#546E7A' }}>
              {t('ongletPreavisDash.form.delaiMinimum', { n: estProprietaire ? delais.proprietaire : delais.locataire, date: new Date(minDate() + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) })}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t('ongletPreavisDash.form.messageOptionnel')}</div>
            <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
              placeholder={estProprietaire ? t('ongletPreavis.proprio.form.messagePlaceholder') : t('ongletPreavisDash.form.messagePersonnelPlaceholder')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 13, resize: 'none', height: 80, fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <button
            onClick={ouvrirApercu} disabled={apercuLoading}
            style={{ width: '100%', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {apercuLoading ? t('ongletPreavisDash.apercu.chargement') : t('ongletPreavisDash.form.preparerBouton')}
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>{t('ongletAlertes.chargement')}</div>;

  var total = data.alertes.length + (data.signalements ? data.signalements.length : 0);

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="dash-page-header">
        <div><h1>{t('ongletAlertes.titre')}</h1><p>{t('ongletAlertes.nbAlertes', { count: total })}</p></div>
      </div>
      {total === 0 && (
        <div className="dash-empty-state">
          <CheckCircle size={48} strokeWidth={1} color="var(--green-border)"/><h3>{t('ongletAlertes.aucuneAlerte')}</h3><p>{t('ongletAlertes.toutEnOrdre')}</p>
        </div>
      )}
      {data.alertes.map(function(a) {
        var borderColor = a.type === 'loyer_retard' ? 'var(--danger)' : a.type === 'bail_bientot' ? 'var(--warn)' : 'var(--green)';
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
  var [aAnnuler, setAAnnuler] = useState(null);
  var [motifAnnul, setMotifAnnul] = useState('');
  var [edlOuvert, setEdlOuvert] = useState(false);
  var [edlResa, setEdlResa] = useState('');
  var [acteType, setActeType] = useState(null);
  var [acteResa, setActeResa] = useState('');
  var [toutesResa, setToutesResa] = useState([]);

  useEffect(function() {
    api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); }).catch(console.error);
    var ep = user && user.role === 'locataire' ? '/reservations/mes-reservations' : '/reservations/proprietaire';
        api.get(ep).then(function(res) {
      setToutesResa((res.data.reservations || []).filter(function(r) {
        return ['acceptee', 'caution_requise', 'caution_payee', 'bail_en_cours', 'bail_signe_proprio', 'confirmee', 'terminee'].includes(r.statut);
      }));
      setReservations((res.data.reservations || []).filter(function(r) {
        return ['confirmee', 'active', 'bail_signe', 'bail_signe_proprio', 'bail_signe_locataire', 'terminee'].includes(r.statut);
      }));
    }).catch(console.error);
  }, [user]);

  function generer(e) {
    e.preventDefault();
    var payload = { reservation_id: genForm.reservation_id, type: genForm.type };
        if (genForm.type === 'etat_lieux') payload.type_etat = genForm.type_etat || 'entree';
    if (genForm.periode && /^\d{4}-\d{2}$/.test(genForm.periode)) {
      payload.annee = parseInt(genForm.periode.slice(0, 4), 10);
      payload.mois = parseInt(genForm.periode.slice(5, 7), 10);
    }
    api.post('/documents/generer', payload)
      .then(function() {
        toast.success(t('ongletDocuments.toastDocumentGenere'));
        setShowForm(false);
        api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); });
      })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletDocuments.toastErreur')); });
  }

  function confirmerAnnulation() {
    if (!aAnnuler) return;
    api.post('/documents/' + aAnnuler.id + '/annuler', { motif: motifAnnul })
      .then(function() {
        toast.success(t('ongletDocuments.toastAnnule'));
        setAAnnuler(null); setMotifAnnul('');
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
    ? DOCS_TYPES.filter(function(d) { return ['quittance', 'etat_lieux', 'preavis', 'contrat_bail'].concat(TYPES_ACTES).includes(d.type); })
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

      {edlOuvert && (
        <div className="dash-form-card" style={{ marginBottom: 16 }}>
          {!edlResa ? (
            <div>
              <h3 style={{ marginBottom: 10 }}>{t('edl.choisirLocation')}</h3>
              {toutesResa.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('edl.aucuneLocation')}</p>}
              <select value={edlResa} onChange={function(e) { setEdlResa(e.target.value); }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 10 }}>
                <option value="">{t('ongletDocuments.selectionnezReservation')}</option>
                {toutesResa.map(function(r) { return <option key={r.id} value={r.id}>{r.logement_titre} - {new Date(r.date_debut).toLocaleDateString('fr-FR')}</option>; })}
              </select>
              <button className="btn-outline-green" onClick={function() { setEdlOuvert(false); }}>{t('edl.fermer')}</button>
            </div>
          ) : (
            <EtatDesLieux key={edlResa} reservationId={edlResa} onFermer={function() { setEdlOuvert(false); setEdlResa(''); api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); }); }} />
          )}
        </div>
      )}

      {acteType && (
        <div className="dash-form-card" style={{ marginBottom: 16 }}>
          {!acteResa ? (
            <div>
              <h3 style={{ marginBottom: 10 }}>{t('edl.choisirLocation')}</h3>
              {toutesResa.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('edl.aucuneLocation')}</p>}
              <select value={acteResa} onChange={function(e) { setActeResa(e.target.value); }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 10 }}>
                <option value="">{t('ongletDocuments.selectionnezReservation')}</option>
                {toutesResa.map(function(r) { return <option key={r.id} value={r.id}>{r.logement_titre} - {new Date(r.date_debut).toLocaleDateString('fr-FR')}</option>; })}
              </select>
              <button className="btn-outline-green" onClick={function() { setActeType(null); }}>{t('edl.fermer')}</button>
            </div>
          ) : (
            <ActesSignature key={acteResa + acteType} reservationId={acteResa} type={acteType} onFermer={function() { setActeType(null); setActeResa(''); api.get('/documents').then(function(res) { setDocuments(res.data.documents || []); }); }} />
          )}
        </div>
      )}

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
                onClick={function() {
                  // Les préavis passent par leur onglet (date limite, aperçu, accusé de réception)
                  if (d.type === 'preavis' && props.setOnglet) { props.setOnglet('/dashboard/preavis'); return; }
                  // Les états des lieux ont leur parcours (grille, signatures des deux parties)
                  if (TYPES_ACTES.indexOf(d.type) !== -1 || d.type === 'contrat_bail') {
                    setActeType(d.type === 'contrat_bail' ? 'bail' : d.type); setEdlOuvert(false); setShowForm(false); setShowUpload(false);
                    setActeResa(toutesResa.length === 1 ? toutesResa[0].id : '');
                    return;
                  }
                  if (d.type === 'etat_lieux') {
                    setEdlOuvert(true); setShowForm(false); setShowUpload(false);
                    if (toutesResa.length === 1) setEdlResa(toutesResa[0].id);
                    return;
                  }
                  setGenForm(Object.assign({}, genForm, { type: d.type })); setShowForm(true); setShowUpload(false);
                }}
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
                  {typesAffiches.filter(function(d) { return d.type !== 'preavis' && d.type !== 'etat_lieux' && d.type !== 'contrat_bail' && TYPES_ACTES.indexOf(d.type) === -1; }).map(function(d) { return <option key={d.type} value={d.type}>{t('ongletDocuments.docsTypes.' + d.labelKey + '.titre')}</option>; })}
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
            {genForm.type === 'etat_lieux' && (
              <div className="form-group">
                <label>{t('ongletDocuments.typeEtat')}</label>
                <select value={genForm.type_etat || 'entree'} onChange={function(e) { setGenForm(Object.assign({}, genForm, { type_etat: e.target.value })); }}>
                  <option value="entree">{t('ongletDocuments.etatEntree')}</option>
                  <option value="sortie">{t('ongletDocuments.etatSortie')}</option>
                </select>
              </div>
            )}
            {['quittance', 'facture', 'rapport_financier'].includes(genForm.type) && (
              <div className="form-group">
                <label>{t('ongletDocuments.periode')}</label>
                <input type="month" value={genForm.periode || ''} onChange={function(e) { setGenForm(Object.assign({}, genForm, { periode: e.target.value })); }} />
              </div>
            )}
            <p style={{ fontSize: 12.5, color: 'var(--warn)', background: '#FBEFD9', borderRadius: 8, padding: '8px 12px', margin: '4px 0 12px' }}>
              <Lock size={12} strokeWidth={2} style={{ verticalAlign: -1, marginRight: 6 }} />{t('ongletDocuments.avertissementVerrou')}
            </p>
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
              contrat_bail:    { icon: FileSignature, color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.contratBail')    },
              quittance:       { icon: Receipt,        color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.quittance')           },
              etat_lieux:      { icon: ClipboardList,  color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.etatLieux')      },
              mise_en_demeure: { icon: AlertTriangle,   color: 'var(--danger)', bg: 'var(--danger-soft)', label: t('ongletDocuments.cfgDoc.miseEnDemeure')     },
              preavis:         { icon: Send,            color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.preavis')              },
              facture:         { icon: Banknote,        color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.facture')              },
              caution:         { icon: Lock,            color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.caution')     },
              avenant:         { icon: FileSignature,   color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.avenant')     },
              decompte:        { icon: Banknote,        color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.decompte')    },
              cautionnement:   { icon: Shield,          color: 'var(--green)', bg: 'var(--green-light)', label: t('ongletDocuments.cfgDoc.cautionnement') },
            }[doc.type] || { icon: FileText, color: 'var(--text-muted)', bg: 'var(--surface-soft)', label: t('ongletDocuments.cfgDoc.document') };
            var CfgDocIcon = cfgDoc.icon;
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'var(--surface-soft)', marginBottom: 8 }}>
                <div style={{ width: 42, height: 42, background: cfgDoc.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CfgDocIcon size={20} strokeWidth={1.5} color={cfgDoc.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: doc.statut === 'annule' ? '#9AA39E' : 'var(--text-primary)', textDecoration: doc.statut === 'annule' ? 'line-through' : 'none' }}>{doc.titre}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                    <span style={{ background: cfgDoc.bg, color: cfgDoc.color, borderRadius: 16, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>{cfgDoc.label}</span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {doc.statut === 'annule'
                      ? <span style={{ background: '#FBE6E4', color: 'var(--danger)', borderRadius: 16, padding: '1px 8px', fontSize: 10, fontWeight: 700 }} title={doc.annule_motif || ''}>{t('ongletDocuments.annule')}</span>
                      : doc.verrouille_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}><Lock size={10} strokeWidth={2} />{t('ongletDocuments.verrouille')}</span>}
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
                      .catch(function(err) { toast.error(err.response && err.response.data && err.response.data.erreur ? err.response.data.erreur : t('ongletDocuments.toastEmailErreur')); });
                  }}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={13} strokeWidth={2} /> {t('ongletDocuments.email')}
                  </button>
                  {!doc.est_manuel && doc.statut !== 'annule' && (
                    <button onClick={function() { setAAnnuler(doc); setMotifAnnul(''); }}
                      style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--danger)', background: 'var(--bg-secondary)', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t('ongletDocuments.annuler')}
                    </button>
                  )}
                </div>
              </div>
            ); 
          })}
        </div>
      )}

      {aAnnuler && (
        <div role="dialog" aria-modal="true" onClick={function() { setAAnnuler(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,14,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 440 }}>
            <h3 style={{ marginBottom: 6 }}>{t('ongletDocuments.annulerTitre')}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{aAnnuler.titre}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{t('ongletDocuments.annulerExplication')}</p>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{t('ongletDocuments.annulerMotif')}</label>
            <input type="text" maxLength={300} autoFocus value={motifAnnul} placeholder={t('ongletDocuments.annulerMotifPlaceholder')}
              onChange={function(e) { setMotifAnnul(e.target.value); }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', margin: '4px 0 14px', fontSize: 14 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline-green" onClick={function() { setAAnnuler(null); }}>{t('ongletDocuments.annulerRetour')}</button>
              <button type="button" disabled={motifAnnul.trim().length < 3} onClick={confirmerAnnulation}
                style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: motifAnnul.trim().length < 3 ? '#E0B5B1' : 'var(--danger)', color: '#fff', fontWeight: 700, cursor: motifAnnul.trim().length < 3 ? 'not-allowed' : 'pointer' }}>
                {t('ongletDocuments.annulerConfirmer')}
              </button>
            </div>
          </div>
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

    api.post('/messages', formData, { headers: { 'Content-Type': undefined } })
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
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('ongletMessages.chargement')}</div>
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
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
            {t('ongletMessages.conversations', { count: conversations.length })}
          </div>
          <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-soft)', borderRadius: 8, padding: '7px 12px' }}>
              <Search size={14} strokeWidth={1.5} color="var(--text-muted)" />
              <input type="text" placeholder={t('ongletMessages.rechercherPlaceholder')} value={recherche}
                onChange={function(e) { setRecherche(e.target.value); }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1, color: 'var(--text-primary)' }} />
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
                      <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '8px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>{nonLus}</span>
                    )}
                  </div>
                  <div className="msg-thread-preview">
                    {c.type === 'photo' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Camera size={12} strokeWidth={1.75} /> {t('ongletMessages.photo')}</span>
                    ) : c.type === 'document' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Paperclip size={12} strokeWidth={1.75} /> {t('ongletMessages.document')}</span>
                    ) : (c.contenu || t('ongletMessages.nouvelleConversation'))}
                  </div>
                  {c.logement_titre && <div style={{ fontSize: '11px', color: 'var(--green)' }}>{c.logement_titre}</div>}
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
                      {convCourante.logement_titre && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{convCourante.logement_titre}</div>}
                    </div>
                    {convCourante.telephone && (
                      <a href={'tel:' + convCourante.telephone}
                        style={{ marginLeft: 'auto', background: 'var(--green-light)', color: 'var(--green)', borderRadius: '16px', padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
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
                        <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 8, padding: '4px 10px', marginBottom: 4, fontSize: 12, color: 'var(--text-muted)', borderLeft: '3px solid var(--green)', maxWidth: '60%' }}>
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
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: estMoi ? '#fff' : 'var(--green)', textDecoration: 'none', padding: '8px', background: estMoi ? 'rgba(255,255,255,0.15)' : 'var(--bg-tertiary)', borderRadius: 8, fontSize: 13 }}>
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
                            <span key={ri} style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '1px 7px', fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '6px 10px', boxShadow: 'var(--shadow-lg)', display: 'flex', gap: 6, marginTop: 2, zIndex: 10 }}>
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
                <div style={{ padding: '8px 14px', background: 'var(--green-light)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, borderLeft: '3px solid var(--green)', paddingLeft: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginBottom: 2 }}>{t('ongletMessages.repondreA')}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {replyTo.contenu ? replyTo.contenu.slice(0, 60) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Paperclip size={12} strokeWidth={1.75} /> {t('ongletMessages.fichier')}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={function() { setReplyTo(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18 }}>×</button>
                </div>
              )}
              {fichier && (
                <div style={{ padding: '8px 16px', background: 'var(--green-light)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '13px', color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>{fichier.type.startsWith('image/') ? <Camera size={14} strokeWidth={1.5} /> : <Paperclip size={14} strokeWidth={1.5} />} {fichier.name}</span>
                  <button type="button" onClick={function() { setFichier(null); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: '700' }}>x</button>
                </div>
              )}

              <div className="messages-chat-input">
                <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={function(e) { if (e.target.files && e.target.files[0]) setFichier(e.target.files[0]); }} />
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Paperclip size={16} strokeWidth={1.5} /></div>
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
    api.post('/reclamations', fd, { headers: { 'Content-Type': undefined } })
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

  var statutColors = { ouverte: '#B3261E', en_cours: '#9A5B00', resolue: '#1B6B3A', fermee: '#888' };
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
                style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', width: '100%' }} />
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

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('ongletReclamations.chargement')}</div>}

      {!loading && reclamations.length === 0 && (
        <div className="dash-empty-state">
          <CheckCircle size={48} strokeWidth={1} color="var(--green-border)"/><h3>{t('ongletReclamations.aucuneReclamation')}</h3><p>{t('ongletAlertes.toutEnOrdre')}</p>
        </div>
      )}

      {reclamations.map(function(r) {
        var couleur = statutColors[r.statut] || 'var(--text-muted)';
        return (
          <div key={r.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: 'var(--shadow-md)', borderLeft: '5px solid ' + couleur }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{r.titre}</span>
                  <span style={{ background: couleur + '20', color: couleur, borderRadius: '16px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>{statutLabels[r.statut]}</span>
                  <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: '16px', padding: '2px 10px', fontSize: '11px' }}>{categorieLabels[r.categorie]}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {r.logement_titre}
                  {user && user.role !== 'locataire' && r.loc_nom && <span> · {r.loc_prenom} {r.loc_nom}</span>}
                  <span> · {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {r.description && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>{r.description}</div>}
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
                    <button className="btn-green" style={{ fontSize: '12px', padding: '6px 12px', background: 'var(--green)' }} onClick={function() { changerStatut(r.id, 'resolue'); }}>{t('ongletReclamations.statuts.resolue')}</button>
                  </div>
                )}
              </div>
            </div>

            {activeTimeline === r.id && (
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>{t('ongletReclamations.timeline')}</div>
                {timeline.map(function(tl) {
                  return (
                    <div key={tl.id} style={{ display: 'flex', gap: 10, marginBottom: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: tl.type === 'creation' ? 'var(--green-light)' : tl.type === 'statut_change' ? 'var(--warn-soft)' : 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tl.type === 'creation' ? <Wrench size={14} strokeWidth={1.5} color="var(--green)" /> : tl.type === 'statut_change' ? <RefreshCw size={14} strokeWidth={1.5} color="var(--warn)" /> : <MessageCircle size={14} strokeWidth={1.5} color="var(--info)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{tl.contenu}</div>
                        {tl.photo_url && <img src={tl.photo_url} alt="photo" style={{ maxHeight: '80px', borderRadius: '6px', marginTop: '4px', cursor: 'pointer' }} onClick={function() { window.open(tl.photo_url, '_blank'); }} />}
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{tl.prenom} {tl.nom} · {new Date(tl.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: '10px', display: 'flex', gap: 8 }}>
                  <input type="text" placeholder={t('ongletReclamations.ajouterCommentaire')} value={commentaire}
                    onChange={function(e) { setCommentaire(e.target.value); }}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', outline: 'none', margin: 0 }} />
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t('pushToggle.titre')}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('pushToggle.sousTitre')}</div>
      </div>
      <button onClick={toggle} disabled={loading}
        style={{ padding: '8px 16px', borderRadius: 16, border: 'none', background: abonne ? 'var(--green)' : 'var(--bg-tertiary)', color: abonne ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
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
    estAbonne().then(function(val) {
      setAbonne(val);
      setLoading(false);
    });
  }, []);

  function toggleNotifs() {
    setLoading(true);
    if (abonne) {
      desactiverNotifications().then(function() {
        setAbonne(false);
        toast.success(t('pushToggle.toastDesactivees'));
      }).catch(function() {
        toast.error(t('boutonNotifPush.toastErreurDesactivation'));
      }).finally(function() { setLoading(false); });
    } else {
      activerNotificationsPush().then(function(ok) {
        if (ok) {
          setAbonne(true);
          toast.success(t('boutonNotifPush.toastActivees'));
        } else {
          toast.error(t('boutonNotifPush.toastAutorisez'));
        }
      }).catch(function() {
        toast.error(t('boutonNotifPush.toastAutorisez'));
      }).finally(function() { setLoading(false); });
    }
  }

  return (
    <div style={{ background: 'var(--surface-soft)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, background: abonne ? 'var(--green-light)' : 'var(--surface-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={24} strokeWidth={1.5} color={abonne ? 'var(--green)' : 'var(--text-muted)'} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {abonne ? t('boutonNotifPush.titreActivees') : t('boutonNotifPush.titreDesactivees')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
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
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              {item}
            </div>
          );
        })}
      </div>

      <button onClick={toggleNotifs} disabled={loading}
        style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: loading ? '#aaa' : abonne ? 'var(--danger-soft)' : 'var(--green)', color: loading ? '#fff' : abonne ? 'var(--danger)' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {loading ? t('boutonNotifPush.chargement') : abonne ? t('boutonNotifPush.desactiverBouton') : (<><Bell size={14} strokeWidth={1.75} /> {t('boutonNotifPush.activerBouton')}</>)}
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
      <div style={{ width: 32, height: 32, border: '3px solid var(--green-light)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)' }}>{t('ongletHistorique.chargement')}</span>
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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--green-light)', borderRadius: 16, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
          {badge}
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: t('ongletHistorique.kpi.locationsTotales'),  val: s.nb_locations_total,                      icon: <Home size={22} strokeWidth={1.5}/>,        color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletHistorique.kpi.locationsActives'),  val: s.nb_actives,                               icon: <CheckCircle size={22} strokeWidth={1.5}/>,  color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletHistorique.kpi.totalPaye'),         val: GNFf(s.total_paye) + ' GNF',               icon: <Banknote size={22} strokeWidth={1.5}/>,     color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletHistorique.kpi.noteRecue'),         val: noteLocataire > 0 ? noteLocataire.toFixed(1) + '/5' : t('ongletHistorique.kpi.pasEncore'), icon: <Star size={22} strokeWidth={1.5}/>, color: 'var(--green)', bg: 'var(--green-light)' },
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
              style={{ padding: '8px 16px', borderRadius: 16, border: 'none', background: ongletLocal === tab.id ? 'var(--green)' : 'var(--bg-tertiary)', color: ongletLocal === tab.id ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: ongletLocal === tab.id ? 700 : 500, cursor: 'pointer', transition: 'all .2s' }}>
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
              <Home size={48} strokeWidth={1} color="var(--green-border)" />
              <h3>{t('ongletHistorique.locations.aucune')}</h3>
              <p>{t('ongletHistorique.locations.apparaitront')}</p>
            </div>
          )}
          {data.locations.map(function(r) {
            var photo = urlPremierePhoto(r.photos);
            var statuts = {
              confirmee:  { label: t('ongletHistorique.locations.statuts.active'),      color: 'var(--green)', bg: 'var(--green-light)' },
              terminee:   { label: t('ongletHistorique.locations.statuts.terminee'),    color: 'var(--text-muted)',    bg: 'var(--surface-soft)' },
              en_attente: { label: t('ongletHistorique.locations.statuts.enAttente'),  color: 'var(--warn)', bg: 'var(--warn-soft)' },
              refusee:    { label: t('ongletHistorique.locations.statuts.refusee'),     color: 'var(--danger)', bg: 'var(--danger-soft)' },
            };
            var cfg = statuts[r.statut] || { label: r.statut, color: 'var(--text-muted)', bg: 'var(--surface-soft)' };

            return (
              <div key={r.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: r.statut === 'confirmee' ? '1.5px solid var(--green-border)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Photo */}
                  <div style={{ width: 100, height: 100, background: photo ? 'none' : 'var(--green-light)', flexShrink: 0, overflow: 'hidden' }}>
                    {photo
                      ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={28} strokeWidth={1.5} color="#A5D6A7" /></div>
                    }
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{r.logement_titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={11} strokeWidth={1.5} /> {r.logement_adresse}, {r.logement_ville}
                        </div>
                      </div>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 16, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {cfg.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--green)' }}>{GNFf(r.prix_mensuel)} GNF/mois</span>
                      {r.date_debut && <span>{t('ongletHistorique.locations.depuis', { date: new Date(r.date_debut).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) })}</span>}
                      {r.nb_chambres && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><BedDouble size={12} strokeWidth={1.5} /> {r.nb_chambres} ch.</span>}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {t('ongletHistorique.locations.proprietaire')} {r.prop_prenom} {r.prop_nom}
                      {r.prop_telephone && <span> · <a href={'tel:' + r.prop_telephone} style={{ color: 'var(--green)', textDecoration: 'none' }}>{r.prop_telephone}</a></span>}
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
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          {data.paiements.length === 0 && (
            <div className="dash-empty-state">
              <Banknote size={48} strokeWidth={1} color="var(--green-border)" />
              <h3>{t('ongletHistorique.paiements.aucun')}</h3>
              <p>{t('ongletHistorique.paiements.apparaitront')}</p>
            </div>
          )}
          {data.paiements.map(function(p, i) {
            var cfg = p.statut === 'complete'
              ? { label: t('ongletHistorique.paiements.paye'), color: 'var(--green)', bg: 'var(--green-light)' }
              : { label: t('ongletHistorique.paiements.enAttente'), color: 'var(--warn)', bg: 'var(--warn-soft)' };
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < data.paiements.length - 1 ? '0.5px solid #F5F5F5' : 'none', background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--surface-soft)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.logement_titre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {p.mode_paiement && <span> · {p.mode_paiement}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: cfg.color }}>{GNFf(p.montant)} GNF</div>
                  <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 16, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
                </div>
              </div>
            );
          })}

          {data.paiements.length > 0 && (
            <div style={{ padding: '14px 18px', background: '#1B2B22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{t('ongletHistorique.paiements.totalPaye')}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{GNFf(s.total_paye)} GNF</span>
            </div>
          )}
        </div>
      )}

      {/* ─── NOTATIONS ───────────────────────────────────────────── */}
      {ongletLocal === 'notations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.notations.length === 0 && (
            <div className="dash-empty-state">
              <Star size={48} strokeWidth={1} color="var(--green-border)" />
              <h3>{t('ongletHistorique.notations.aucun')}</h3>
              <p>{t('ongletHistorique.notations.apparaitront')}</p>
            </div>
          )}
          {data.notations.map(function(n, i) {
            var estRecu = n.cible_id === (user && user.id);
            return (
              <div key={n.id} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-md)', borderLeft: '4px solid ' + (estRecu ? 'var(--green)' : 'var(--green)') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: estRecu ? 'var(--green)' : 'var(--info)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {estRecu ? t('ongletHistorique.notations.avisRecu') : t('ongletHistorique.notations.avisDonne')}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {n.auteur_prenom} {n.auteur_nom} · {n.logement_titre}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(function(s) {
                      return <Star key={s} size={14} strokeWidth={1.5} fill={s <= n.note ? 'var(--warn)' : 'transparent'} color="var(--warn)" />;
                    })}
                  </div>
                </div>
                {n.commentaire && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
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
  var plan = props.plan || { plan: 'gratuit', droits: { rapports: false } };
  var [data, setData]         = useState(null);
  var [loading, setLoading]   = useState(true);
  var [periode, setPeriode]   = useState('12mois');

  useEffect(function() {
    if (!plan.droits.rapports) { setLoading(false); return; }
    api.get('/rapports/financier?periode=' + periode)
      .then(function(res) { setData(res.data); })
      .catch(function(err) { console.error('[Rapports]', err.message); })
      .finally(function() { setLoading(false); });
  }, [periode, plan.droits.rapports]);

  if (!plan.droits.rapports) {
    return (
      <div>
        <div className="dash-page-header"><div><h1>{t('ongletRapports.titre')}</h1></div></div>
        <UpgradeBanner fonctionnalite="rapports" planRequis="Pro" />
      </div>
    );
  }

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
      <div style={{ width: 32, height: 32, border: '3px solid var(--green-light)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)' }}>{t('ongletRapports.chargementDonnees')}</span>
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
            style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', background: 'var(--bg-secondary)' }}>
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
    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
    <FileText size={14} strokeWidth={1.5} /> {t('ongletRapports.exportPdf')}
  </button>
</div>
      </div>

      {/* KPIs */}
      <div className="stats-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: t('ongletRapports.kpi.encaisseCeMois'),    val: GNF(r.encaisse) + ' GNF',    icon: <Banknote size={22} strokeWidth={1.5}/>,  color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletRapports.kpi.enAttente'),          val: GNF(r.en_attente) + ' GNF',  icon: <Clock size={22} strokeWidth={1.5}/>,     color: 'var(--warn)', bg: 'var(--warn-soft)' },
          { label: t('ongletRapports.kpi.totalAnnuel'),        val: GNF(r.total_annuel) + ' GNF', icon: <TrendingUp size={22} strokeWidth={1.5}/>, color: 'var(--green)', bg: 'var(--green-light)' },
          { label: t('ongletRapports.kpi.paiementsCeMois'),   val: t('ongletRapports.kpi.recus', { n: r.nb_paiements }),    icon: <Receipt size={22} strokeWidth={1.5}/>,   color: 'var(--green)', bg: 'var(--green-light)' },
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
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('ongletRapports.evolutionRevenus')}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ongletRapports.periodes.12mois')}</span>
        </div>
        {data.evolution.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('ongletRapports.aucuneDonnee')}</div>
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
              <XAxis dataKey="mois_label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={function(v) { return new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v); }} />
              <Tooltip formatter={function(v, n) { return [new Intl.NumberFormat('fr-FR').format(v) + ' GNF', n === 'revenus' ? t('ongletRapports.encaisse') : t('ongletRapports.impayes')]; }} labelStyle={{ fontWeight: 700 }} />
              <Area type="monotone" dataKey="revenus" stroke="var(--green)" strokeWidth={2.5} fill="url(#colorRevenus)" dot={false} />
              <Area type="monotone" dataKey="impayes" stroke="var(--danger)" strokeWidth={1.5} fill="url(#colorImpayes)" dot={false} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ width: 24, height: 3, background: 'var(--green)', borderRadius: 2 }} /> {t('ongletRapports.revenusEncaisses')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ width: 24, height: 2, background: 'var(--danger)', borderRadius: 2, borderTop: '2px dashed var(--danger)' }} /> {t('ongletRapports.impayes')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Taux d'occupation */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>{t('ongletRapports.tauxOccupation')}</h3>
          {data.occupation.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('ongletRapports.aucuneDonnee')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.occupation} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="mois_label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} tickFormatter={function(v) { return v + '%'; }} />
                <Tooltip formatter={function(v) { return [v + '%', t('ongletRapports.occupation')]; }} />
                <Bar dataKey={function(d) { return d.total_biens > 0 ? Math.round(d.biens_loues / d.total_biens * 100) : 0; }}
                  name="occupation" fill="var(--green)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenus par bien */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>{t('ongletRapports.revenusParBien')}</h3>
          {data.par_bien.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('ongletRapports.aucunLogement')}</div>
          )}
          {data.par_bien.map(function(b, i) {
            var max = Math.max.apply(null, data.par_bien.map(function(x) { return Number(x.total_encaisse); }));
            var pct = max > 0 ? Math.round(Number(b.total_encaisse) / max * 100) : 0;
            return (
              <div key={b.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{b.titre}</span>
                  <span style={{ fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>{GNF(b.total_encaisse)}</span>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#1B6B3A', width: pct + '%', height: '100%', borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ─── ANALYTICS CANDIDATURES ──────────────────────────── */}
      {data.candidatures && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            {t('ongletRapports.analyseCandidatures')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: t('ongletRapports.candidatures.totalRecues'),      val: data.candidatures.total_candidatures, color: 'var(--text-primary)', bg: 'var(--surface-soft)' },
              { label: t('ongletRapports.candidatures.acceptees'),         val: data.candidatures.acceptees,          color: 'var(--green)', bg: 'var(--green-light)' },
              { label: t('ongletRapports.candidatures.refusees'),          val: data.candidatures.refusees,           color: 'var(--danger)', bg: 'var(--danger-soft)' },
              { label: t('ongletRapports.candidatures.enAttente'),        val: data.candidatures.en_attente,         color: 'var(--warn)', bg: 'var(--warn-soft)' },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Taux d'acceptation */}
          <div style={{ background: 'var(--surface-soft)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{t('ongletRapports.tauxAcceptation')}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: Number(data.candidatures.taux_acceptation) >= 50 ? 'var(--green)' : 'var(--warn)' }}>
                {data.candidatures.taux_acceptation || 0}%
              </span>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div style={{
                background: Number(data.candidatures.taux_acceptation) >= 50 ? 'var(--green)' : 'var(--warn)',
                width: (data.candidatures.taux_acceptation || 0) + '%',
                height: '100%', borderRadius: 6, transition: 'width .6s'
              }} />
            </div>
            {data.meilleur_mois && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} strokeWidth={1.5} color="var(--green)" />
                <span>{t('ongletRapports.meilleurMoisAvant')}<strong style={{ color: 'var(--green)' }}>{data.meilleur_mois.mois}</strong> - {GNF(data.meilleur_mois.total)}</span>
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
          <div style={{ background: '#1B2B22', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
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
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{p.val}</div>
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
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>{t('ongletRapports.historiquePaiements')}</h3>
        {data.paiements.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>{t('ongletRapports.aucunPaiementEnregistre')}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.paiements.map(function(p, i) {
            var cfg = p.statut === 'complete'
              ? { label: t('ongletHistorique.paiements.paye'), color: 'var(--green)', bg: 'var(--green-light)' }
              : p.statut === 'en_attente'
              ? { label: t('ongletHistorique.paiements.enAttente'), color: 'var(--warn)', bg: 'var(--warn-soft)' }
              : { label: p.statut, color: 'var(--text-muted)', bg: 'var(--surface-soft)' };
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 8, background: i % 2 === 0 ? 'var(--surface-soft)' : 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.locataire_prenom} {p.locataire_nom}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.logement_titre} · {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {p.mode_paiement && ' · ' + p.mode_paiement}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: cfg.color }}>{GNF(p.montant)}</div>
                  <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 16, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
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
        <div style={{ width: 64, height: 64, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} strokeWidth={1.5} color="var(--green)" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>{t('supprimerCompte.compteSupprime')}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('supprimerCompte.donneesSupprimees')}</p>
      </div>
    );
  }

  return (
    <div className="dash-form-card" style={{ maxWidth: 500 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Trash2 size={20} strokeWidth={2} color="var(--danger)" />
        {t('supprimerCompte.titre')}
      </h3>

      {etape === 1 && (
        <>
          <div style={{ background: 'var(--danger-soft)', borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: '1px solid var(--danger)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 10 }}>
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
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--danger)' }}>
                    <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                    {item}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRetour}
              style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('ongletLocataires.form.annuler')}
            </button>
            <button onClick={confirmer}
              style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {t('supprimerCompte.continuer')}
            </button>
          </div>
        </>
      )}

      {etape === 2 && (
        <>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('supprimerCompte.confirmerAvecEmailAvant')}<strong>{user && user.email}</strong>{t('supprimerCompte.confirmerAvecEmailApres')}
          </p>

          {erreur && (
            <div style={{ background: 'var(--danger-soft)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--danger)' }}>
              {erreur}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {t('supprimerCompte.motDePasseActuel')}
            </label>
            <input type="password" placeholder={t('supprimerCompte.votreMotDePasse')} value={motDePasse}
              onChange={function(e) { setMotDePasse(e.target.value); setErreur(''); }}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setEtape(1); setMotDePasse(''); setErreur(''); }}
              style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {t('supprimerCompte.retour')}
            </button>
            <button onClick={confirmer} disabled={loading}
              style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: loading ? '#aaa' : 'var(--danger)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
  var tour = props.tour;
  var auth = useAuth();
  var navigate = useNavigate();
  var [section, setSection] = useState(null);
  var [formProfil, setFormProfil] = useState({ prenom: user ? user.prenom : '', nom: user ? user.nom : '', email: user ? user.email : '', telephone: user ? user.telephone || '' : '' });
  var [formMdp, setFormMdp] = useState({ ancien: '', nouveau: '', confirmer: '' });
  var [notifs, setNotifs] = useState({ email: true, sms: true, loyers: true, bails: true, pannes: false });
  var [langue, setLangue] = useState(i18n.language === 'en' ? 'en' : 'fr');
  var [saving, setSaving] = useState(false);
  var [scoreData, setScoreData] = useState(null);
  var [monAbonnement, setMonAbonnement] = useState(null);
  var [essaiEnCours, setEssaiEnCours] = useState(null);
  var [cycleChoisi, setCycleChoisi] = useState('mensuel');
  var [showPaiementAbo, setShowPaiementAbo] = useState(null);
  var [factures, setFactures] = useState([]);
  var [equipeMembres, setEquipeMembres] = useState([]);
  var [emailInvite, setEmailInvite] = useState('');
  var [invitingLoading, setInvitingLoading] = useState(false);
  var [formSupport, setFormSupport] = useState({ sujet: '', message: '' });
  var [envoiSupportLoading, setEnvoiSupportLoading] = useState(false);

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
    api.get('/abonnements/factures')
      .then(function(res) { setFactures(res.data.factures || []); })
      .catch(console.error);
  }

  function chargerEquipe() {
    api.get('/equipe')
      .then(function(res) { setEquipeMembres(res.data.membres || []); })
      .catch(console.error);
  }

  function inviterMembre(e) {
    e.preventDefault();
    if (!emailInvite) return;
    setInvitingLoading(true);
    api.post('/equipe/inviter', { email: emailInvite })
      .then(function() {
        toast.success(t('ongletParametres.equipe.toastInvitationEnvoyee'));
        setEmailInvite('');
        chargerEquipe();
      })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletParametres.erreur')); })
      .finally(function() { setInvitingLoading(false); });
  }

  function revoquerMembre(id) {
    if (!window.confirm(t('ongletParametres.equipe.confirmRevoquer'))) return;
    api.delete('/equipe/' + id)
      .then(function() { toast.success(t('ongletParametres.equipe.toastMembreRetire')); chargerEquipe(); })
      .catch(function() { toast.error(t('ongletParametres.erreur')); });
  }

  function envoyerSupport(e) {
    e.preventDefault();
    setEnvoiSupportLoading(true);
    api.post('/support/contacter', formSupport)
      .then(function() {
        toast.success(t('ongletParametres.support.toastEnvoye'));
        setFormSupport({ sujet: '', message: '' });
      })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('ongletParametres.erreur')); })
      .finally(function() { setEnvoiSupportLoading(false); });
  }

  useEffect(function() {
    api.get('/auth/mon-score')
      .then(function(res) { setScoreData(res.data); })
      .catch(console.error);
    chargerAbonnement();
    chargerEquipe();
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
    { id: 'supprimer', icon: <Trash2 size={22} strokeWidth={1.5} color="var(--danger)" />, titre: t('ongletParametres.menu.supprimer.titre'), desc: t('ongletParametres.menu.supprimer.desc'), danger: true },
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
                style={{ background: item.danger ? '#FFF5F5' : 'var(--bg-secondary)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.15s', border: item.danger ? '1px solid var(--danger)' : 'none' }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateX(0)'; }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{item.titre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
              </div>
            );
          })}

          {/* Badge plan actuel */}
<div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-md)', marginBottom: 12 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{t('ongletParametres.monAbonnement')}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
        {user && user.role !== 'locataire' ? t('ongletParametres.planActuel') : t('ongletParametres.accesLocataireGratuit')}
      </div>
    </div>
    <div style={{ background: user && user.plan === 'pro' ? 'var(--green-light)' : user && user.plan === 'agence' ? 'var(--info-soft)' : 'var(--surface-soft)', color: user && user.plan === 'pro' ? 'var(--green)' : user && user.plan === 'agence' ? 'var(--info)' : 'var(--text-muted)', borderRadius: 16, padding: '4px 14px', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
      {user && user.plan ? user.plan : t('ongletParametres.gratuit')}
    </div>
  </div>

  {monAbonnement && monAbonnement.abonnement && monAbonnement.abonnement.statut === 'impaye' && (
    <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, color: 'var(--danger)' }}>
      {t('ongletParametres.abonnementImpaye')}
    </div>
  )}

  {monAbonnement && monAbonnement.jours_restants !== null && monAbonnement.plan !== 'gratuit' && monAbonnement.abonnement && monAbonnement.abonnement.statut !== 'impaye' && (
    <div style={{ fontSize: 12, color: monAbonnement.jours_restants <= 5 ? 'var(--warn)' : 'var(--text-muted)', marginTop: 8, fontWeight: monAbonnement.jours_restants <= 5 ? 700 : 400 }}>
      {monAbonnement.jours_restants > 0
        ? t('ongletParametres.joursRestants', { type: monAbonnement.abonnement.statut === 'essai' ? t('ongletParametres.essaiGratuit') : t('ongletParametres.abonnement'), n: monAbonnement.jours_restants })
        : t('ongletParametres.abonnementExpire')}
    </div>
  )}

  {monAbonnement && monAbonnement.abonnement && monAbonnement.abonnement.date_fin && (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
      {t('ongletParametres.dateFin')} : {new Date(monAbonnement.abonnement.date_fin).toLocaleDateString('fr-FR')}
    </div>
  )}

  {user && user.role !== 'locataire' && monAbonnement && monAbonnement.plan === 'gratuit' && (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button onClick={function() { demarrerEssai('pro'); }} disabled={essaiEnCours === 'pro'}
        style={{ flex: 1, background: essaiEnCours === 'pro' ? '#aaa' : 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {essaiEnCours === 'pro' ? '...' : t('ongletParametres.essaiProBouton')}
      </button>
      <button onClick={function() { demarrerEssai('agence'); }} disabled={essaiEnCours === 'agence'}
        style={{ flex: 1, background: essaiEnCours === 'agence' ? '#aaa' : 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {essaiEnCours === 'agence' ? '...' : t('ongletParametres.essaiAgenceBouton')}
      </button>
    </div>
  )}

  {user && user.role !== 'locataire' && monAbonnement && ['pro', 'agence'].includes(monAbonnement.plan) && (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{t('ongletParametres.cycleFacturation')}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {Object.keys(CYCLES_ABONNEMENT).map(function(c) {
          var actif = cycleChoisi === c;
          return (
            <button key={c} onClick={function() { setCycleChoisi(c); }}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: actif ? '1.5px solid var(--green)' : '1px solid var(--border)', background: actif ? 'var(--green-light)' : 'var(--bg-secondary)', color: actif ? 'var(--green)' : 'var(--text-muted)', fontSize: 11, fontWeight: actif ? 700 : 500, cursor: 'pointer' }}>
              {CYCLES_ABONNEMENT[c].label}
            </button>
          );
        })}
      </div>
      <button onClick={function() { setShowPaiementAbo(monAbonnement.plan); }}
        style={{ width: '100%', background: monAbonnement.jours_restants !== null && monAbonnement.jours_restants <= 7 ? 'var(--warn)' : '#1B2B22', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Smartphone size={14} strokeWidth={1.75} />
        {monAbonnement.jours_restants !== null && monAbonnement.jours_restants <= 7 ? t('ongletParametres.renouveler') : t('ongletParametres.payerMobileMoney')}
      </button>
    </div>
  )}

  {factures.length > 0 && (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{t('ongletParametres.historiqueFactures')}</div>
      {factures.map(function(f) {
        var couleurStatut = f.statut === 'payee' ? '#1B6B3A' : f.statut === 'annulee' ? '#B71C1C' : '#888';
        return (
          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 0', borderBottom: '0.5px solid #F5F5F5' }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{f.plan} · {new Date(f.created_at).toLocaleDateString('fr-FR')}</div>
              <div style={{ color: '#aaa', fontSize: 11 }}>{GNF(f.montant)}</div>
            </div>
            <span style={{ color: couleurStatut, fontWeight: 700, fontSize: 11 }}>
              {t('ongletParametres.factureStatut.' + f.statut)}
            </span>
          </div>
        );
      })}
    </div>
  )}
</div>

{showPaiementAbo && (
  <ModalPaiementMobile
    montant={Math.round(PRIX_ABONNEMENT[showPaiementAbo] * CYCLES_ABONNEMENT[cycleChoisi].mois * (1 - CYCLES_ABONNEMENT[cycleChoisi].reduction))}
    titre={t('ongletParametres.abonnementTitre', { plan: showPaiementAbo === 'pro' ? 'Pro' : 'Agence', cycle: CYCLES_ABONNEMENT[cycleChoisi].label })}
    payload={{ plan: showPaiementAbo, cycle: cycleChoisi }}
    endpoint="/abonnements/souscrire"
    onClose={function() { setShowPaiementAbo(null); }}
  />
)}

{user && user.role !== 'locataire' && monAbonnement && monAbonnement.est_membre_equipe && (
  <div style={{ background: 'var(--info-soft)', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 12, color: 'var(--info)' }}>
    {t('ongletParametres.equipe.vousEtesMembre')}
  </div>
)}

{user && user.role !== 'locataire' && monAbonnement && !monAbonnement.est_membre_equipe && (
  <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-md)', marginBottom: 12 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{t('ongletParametres.equipe.titre')}</div>

    {monAbonnement.plan !== 'agence' ? (
      <UpgradeBanner fonctionnalite="multi_users" planRequis="Agence" />
    ) : (
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {t('ongletParametres.equipe.compteur', { n: equipeMembres.filter(function(m) { return m.statut !== 'revoque'; }).length, max: monAbonnement.droits.max_membres })}
        </div>

        <form onSubmit={inviterMembre} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input type="email" required placeholder={t('ongletParametres.equipe.placeholderEmail')} value={emailInvite}
            onChange={function(e) { setEmailInvite(e.target.value); }}
            style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
          <button type="submit" disabled={invitingLoading || equipeMembres.filter(function(m) { return m.statut !== 'revoque'; }).length >= monAbonnement.droits.max_membres}
            style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: invitingLoading ? 0.6 : 1 }}>
            {t('ongletParametres.equipe.inviter')}
          </button>
        </form>

        {equipeMembres.filter(function(m) { return m.statut !== 'revoque'; }).map(function(m) {
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #F5F5F5' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.prenom ? m.prenom + ' ' + m.nom : m.email}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: m.statut === 'actif' ? 'var(--green-light)' : 'var(--warn-soft)', color: m.statut === 'actif' ? 'var(--green)' : 'var(--warn)', borderRadius: 16, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                  {m.statut === 'actif' ? t('ongletParametres.equipe.statutActif') : t('ongletParametres.equipe.statutInvite')}
                </span>
                <button onClick={function() { revoquerMembre(m.id); }}
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '0.5px solid var(--danger)', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                  {t('ongletParametres.equipe.retirer')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

{user && user.role !== 'locataire' && monAbonnement && monAbonnement.plan === 'agence' && !monAbonnement.est_membre_equipe && (
  <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-md)', marginBottom: 12 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{t('ongletParametres.support.titre')}</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{t('ongletParametres.support.sousTitre')}</div>
    <form onSubmit={envoyerSupport}>
      <input type="text" required placeholder={t('ongletParametres.support.placeholderSujet')} value={formSupport.sujet}
        onChange={function(e) { setFormSupport(Object.assign({}, formSupport, { sujet: e.target.value })); }}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
      <textarea required rows={4} placeholder={t('ongletParametres.support.placeholderMessage')} value={formSupport.message}
        onChange={function(e) { setFormSupport(Object.assign({}, formSupport, { message: e.target.value })); }}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
      <button type="submit" disabled={envoiSupportLoading}
        style={{ background: envoiSupportLoading ? '#aaa' : 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: envoiSupportLoading ? 'not-allowed' : 'pointer' }}>
        {envoiSupportLoading ? t('ongletParametres.support.envoiEnCours') : t('ongletParametres.support.envoyer')}
      </button>
    </form>
  </div>
)}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>{t('ongletParametres.infosCompte')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{t('ongletParametres.emailLabel')} {user && user.email}</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{t('ongletParametres.roleLabel')} {user && user.role}</div>
          </div>
      {user && user.role === 'admin' && (
        <button
          onClick={function() { window.location.href = '/admin'; }}
          style={{ background: '#1B2B22', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><Settings size={16} strokeWidth={1.5}/> {t('ongletParametres.panneauAdmin')}</span>
        </button>
      )}
          <button onClick={function() { auth.logout(); }}
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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
    <HelpCircle size={48} strokeWidth={1} color="var(--green)" style={{ marginBottom: 16 }} />
    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>{t('ongletParametres.menu.tour.titre')}</h3>
    <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
      {t('ongletParametres.tour.description')}
    </p>
    <button onClick={function() { tour.relancer(); setSection(null); }}
      style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
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
              <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{t('ongletParametres.toastMdpNeCorrespondentPas')}</div>
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
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{n.label}</div>
                <div onClick={function() { setNotifs(function(prev) { var next = Object.assign({}, prev); next[n.key] = !next[n.key]; return next; }); }}
                  style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: notifs[n.key] ? 'var(--green)' : 'var(--bg-tertiary)', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-secondary)', position: 'absolute', top: 3, left: notifs[n.key] ? 23 : 3, transition: 'left 0.2s', boxShadow: 'var(--shadow-sm)' }} />
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
    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
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
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 8, cursor: 'pointer', border: langue === l.code ? '2px solid var(--green)' : '1px solid var(--border)', background: langue === l.code ? 'var(--green-light)' : 'var(--bg-secondary)', marginBottom: 8, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 24 }}>{l.flag}</span>
                <span style={{ fontSize: 14, fontWeight: langue === l.code ? 600 : 400 }}>{l.label}</span>
                {langue === l.code && <Check size={16} strokeWidth={2} color="var(--green)" style={{ marginLeft: 'auto' }} />}
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-green" onClick={function() {
              changerLangue(langue === 'fr-fr' ? 'fr' : langue);
              toast.success(t('ongletParametres.toastLangueSauvegardee'));
              setSection(null);
            }}>{t('ongletLocataires.form.sauvegarder')}</button>
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
                <div style={{ fontSize: 28, fontWeight: 700, color: scoreData.couleur }}>{scoreData.score}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ 100</div>
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: scoreData.bg, borderRadius: 16, padding: '5px 14px' }}>
              <span>{scoreData.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: scoreData.couleur }}>{scoreData.label}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {scoreData.criteres && scoreData.criteres.map(function(c, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: c.atteint ? 'var(--green-light)' : '#F9F9F9', border: '0.5px solid ' + (c.atteint ? 'var(--green-border)' : 'var(--border)') }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.atteint ? 'var(--green)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.atteint
                      ? <CheckCircle size={16} strokeWidth={2.5} color="#fff" />
                      : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>+{c.points}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.atteint ? 'var(--text-primary)' : 'var(--text-muted)' }}>{c.label}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.atteint ? 'var(--green)' : '#aaa' }}>
                    {c.atteint ? '+' + c.points : '0'} pts
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: 'var(--warn-soft)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--warn)', marginBottom: 14 }}>
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
          <Home size={48} strokeWidth={1} color="var(--green-border)" />
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
            <div key={r.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow-md)', borderLeft: '4px solid var(--green)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: 'var(--green-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Home size={22} strokeWidth={1.5} color="var(--green)" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{r.logement_titre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {t('ongletMesLocations.depuisLe', { date: r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : t('ongletReservationsProprio.na') })}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginTop: 6 }}>
                    {new Intl.NumberFormat('fr-FR').format(r.prix_mensuel || 0)} GNF/mois
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}> / mois</span>
                  </div>
                </div>
                <div style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {t('ongletMesLocations.active')}
                </div>
              </div>

              {/* Boutons locataire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link to={'/reservation/' + r.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '0.5px solid var(--green-border)' }}>
                  {t('ongletBiens.locataire.details')}
                </Link>
                <button onClick={function() { if (setOnglet) setOnglet('/dashboard/documents'); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 8, background: 'var(--info-soft)', color: 'var(--info)', fontSize: 13, fontWeight: 600, border: '0.5px solid var(--info)', cursor: 'pointer' }}>
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
  var limites = useLimitesPlans();
  var navigate = useNavigate();
  var CONFIGS = {
    multi_users: {
      titre:  t('upgradePrompt.multiUtilisateurs.titre'),
      desc:   t('upgradePrompt.multiUtilisateurs.desc'),
      icon:   <Users size={36} strokeWidth={1} color="var(--info)" />,
      bg:     'var(--info-soft)',
      color:  'var(--info)',
    },
    logements_illimites: {
      titre:  t('upgradePrompt.logementsIllimites.titre'),
      desc:   t('upgradePrompt.logementsIllimites.desc', limites),
      icon:   <Building2 size={36} strokeWidth={1} color="var(--info)" />,
      bg:     'var(--info-soft)',
      color:  'var(--info)',
    },
  };
  var cfg = CONFIGS[fonctionnalite] || { titre: t('upgradePrompt.defaut.titre'), desc: t('upgradePrompt.defaut.desc'), icon: <Zap size={36} strokeWidth={1} color="var(--info)" />, bg: 'var(--info-soft)', color: 'var(--info)' };

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 420, margin: '40px auto', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ width: 72, height: 72, background: cfg.bg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        {cfg.icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>{cfg.titre}</h3>
      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>{cfg.desc}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={function() { navigate('/pricing'); }}
          style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {t('upgradePrompt.passerPlanAgence')}
        </button>
        <button onClick={function() { setOnglet('/dashboard'); }}
          style={{ padding: '12px 20px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
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
  var [monPlan, setMonPlan] = useState({ plan: 'gratuit', droits: { max_biens: null, mobile_money: false, documents_pdf: false }, nb_biens: 0 });
  var [showOnboarding, setShowOnboarding] = useState(false);
  var [enLigne, setEnLigne] = useState(navigator.onLine);

useInactivite(true);

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

  // ── Retour depuis la page de paiement Djomy (loyer ou abonnement) ─
  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    var paiementLoyerId = params.get('paiement_loyer');
    var paiementAboId = params.get('paiement_abonnement');
    if (!paiementLoyerId && !paiementAboId) return;

    var requete = paiementLoyerId
      ? api.get('/paiements/djomy/statut/' + paiementLoyerId)
      : api.get('/abonnements/djomy/statut/' + paiementAboId);

    requete
      .then(function(res) {
        var statut = res.data.statut;
        if (statut === 'complete' || statut === 'payee') {
          toast.success(t('dashboardMain.paiementDjomyReussi'));
        } else if (statut === 'echoue' || statut === 'annulee') {
          toast.error(t('dashboardMain.paiementDjomyEchec'));
        } else {
          toast(t('dashboardMain.paiementDjomyEnAttente'));
        }
        chargerDonnees();
      })
      .catch(function() { toast.error(t('dashboardMain.paiementDjomyErreurVerif')); })
      .finally(function() {
        setOnglet(paiementAboId ? '/dashboard/parametres' : '/dashboard/paiements');
        navigate('/dashboard', { replace: true });
      });
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
    if (onglet === '/dashboard/documents')  return <OngletDocuments user={user} plan={monPlan} setOnglet={setOnglet} />;
    if (onglet === '/dashboard/alertes') return <OngletAlertes />;
    if (onglet === '/dashboard/messages') return <OngletMessages />;
    if (onglet === '/dashboard/reclamations') return <OngletReclamations />;
    if (onglet === '/dashboard/parametres') return <OngletParametres user={user} tour={tour} />;
    if (onglet === '/dashboard/mes-locations') return <OngletMesLocations stats={stats} setOnglet={setOnglet} />;
    if (onglet === '/dashboard/rapports') return <OngletRapports user={user} plan={monPlan} />;
    if (onglet === '/dashboard/historique') return <OngletHistorique user={user} />;
    return <OngletOverview stats={stats} user={user} alertes={alertes} setOnglet={setOnglet} />;
  }, [onglet, stats, user, alertes, monPlan]);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dash-loading">
          <div style={{ width: 40, height: 40, border: '3px solid var(--green-light)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
<TourTooltip
  actif={tour.actif}
  etapeActuelle={tour.etapeActuelle}
  etape={tour.etape}
  totalEtapes={tour.totalEtapes}
  suivant={tour.suivant}
  passer={tour.passer}
  terminer={tour.terminer}
/>
{isMobile && sidebarOpen && (
  <div
    onClick={function() { setSidebarOpen(false); }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
)}
<Sidebar
    ongletActif={onglet}
    setOnglet={function(o) { setOnglet(o); if (isMobile) setSidebarOpen(false); }}
    open={sidebarOpen}
    monPlan={monPlan} />
                  <div className={'dashboard-main' + (sidebarOpen && !isMobile ? ' sidebar-open' : '')}>
        <div className="dash-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 62, background: 'var(--bg-secondary)', borderBottom: '1px solid #EBEBEB', position: 'sticky', top: 0, zIndex: 100 }}>

          {/* ── GAUCHE : toggle + logo ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button className="dash-toggle-btn" onClick={function() { setSidebarOpen(!sidebarOpen); }} type="button"
              style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Menu size={18} strokeWidth={1.5} />
            </button>
            {!sidebarOpen && !isMobile && (
              <Logo size={30} showText={true} darkBg={false} />
            )}
          </div>

          {/* ── CENTRE : onglets navigation ── */}
          {!isMobile && (
            <div data-tour="header-tabs" style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--surface-soft)', borderRadius: 12, padding: '3px' }}>
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
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: actif ? 700 : 500, background: actif ? 'var(--bg-secondary)' : 'transparent', color: actif ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: actif ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── DROITE : recherche, notifs, avatar ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isMobile && <div data-tour="recherche"><RechercheGlobale stats={stats} onNavigate={setOnglet} /></div>}

            {!enLigne && (
              <div style={{ background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 16 }}>
                {t('dashboardMain.horsLigne')}
              </div>
            )}

            {/* Cloche */}
            <button className="dash-notif-btn" type="button" data-tour="notifications"
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
              style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, background: 'var(--surface-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={17} strokeWidth={1.5} />
              {alertes.filter(function(a) { return !a.lu; }).length > 0 && (
                <div style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid #fff' }} />
              )}
            </button>

            {/* Mode sombre */}
            <button onClick={toggleDarkMode}
              style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {darkMode ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>

            {/* Avatar */}
            <div onClick={function() { setOnglet('/dashboard/parametres'); }}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
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
          {user && (user.role === 'proprietaire' || user.role === 'les_deux') && monPlan && monPlan.abonnement && (
            <>
              {monPlan.abonnement.statut === 'impaye' && (
                <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <AlertTriangle size={18} strokeWidth={1.75} color="var(--danger)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, flex: 1 }}>{t('ongletParametres.abonnementImpaye')}</span>
                  <button onClick={function() { setOnglet('/dashboard/parametres'); }}
                    style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    {t('ongletParametres.bannerRenouveler')}
                  </button>
                </div>
              )}
              {monPlan.abonnement.statut !== 'impaye' && monPlan.jours_restants !== null && monPlan.jours_restants <= 7 && (
                <div style={{ background: monPlan.jours_restants <= 0 ? 'var(--danger-soft)' : 'var(--warn-soft)', border: '1px solid ' + (monPlan.jours_restants <= 0 ? 'var(--danger)' : 'var(--warn)'), borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <AlertTriangle size={18} strokeWidth={1.75} color={monPlan.jours_restants <= 0 ? 'var(--danger)' : 'var(--warn)'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: monPlan.jours_restants <= 0 ? 'var(--danger)' : 'var(--warn)', fontWeight: 600, flex: 1 }}>
                    {monPlan.jours_restants > 0
                      ? t('ongletParametres.joursRestants', { type: monPlan.abonnement.statut === 'essai' ? t('ongletParametres.essaiGratuit') : t('ongletParametres.abonnement'), n: monPlan.jours_restants })
                      : t('ongletParametres.abonnementExpire')}
                  </span>
                  <button onClick={function() { setOnglet('/dashboard/parametres'); }}
                    style={{ background: monPlan.jours_restants <= 0 ? 'var(--danger)' : 'var(--warn)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    {t('ongletParametres.bannerRenouveler')}
                  </button>
                </div>
              )}
              {monPlan.biens_masques > 0 && (
                <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Home size={18} strokeWidth={1.75} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{t('ongletParametres.biensMasques', { n: monPlan.biens_masques })}</span>
                  <button onClick={function() { setOnglet('/dashboard/parametres'); }}
                    style={{ background: '#1B2B22', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    {t('ongletParametres.bannerRenouveler')}
                  </button>
                </div>
              )}
            </>
          )}
          {renderOnglet}
        </div>
        {/* Bouton + flottant mobile (proprio) */}  
{isMobile && user && (user.role === 'proprietaire' || user.role === 'les_deux') && (
  <button
    onClick={function() { navigate('/logements/ajouter'); }}
    style={{ position: 'fixed', bottom: 74, right: 16, width: 52, height: 52, borderRadius: '50%', background: 'var(--green)', border: 'none', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 499 }}>
    <Plus size={24} color="#fff" strokeWidth={2.5} />
  </button>
)}
{/* Barre navigation mobile */}
{isMobile && (
  <div style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'var(--bg-secondary)', borderTop: '0.5px solid var(--border)',
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
            <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%' }} />
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
            <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%' }} />
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
            padding: '4px 8px', borderRadius: 8, flex: 1,
            color: actif ? 'var(--green)' : 'var(--text-muted)',
            transition: 'all .15s'
          }}>
          {item.icon}
          <span style={{ fontSize: 10, fontWeight: actif ? 700 : 400, letterSpacing: 0.2 }}>{item.label}</span>
          {actif && <div style={{ width: 4, height: 4, background: 'var(--green)', borderRadius: '50%', marginTop: 2 }} />}
        </button>
      );
    })}
   </div>
)}
      </div>
    </div>
  );
}