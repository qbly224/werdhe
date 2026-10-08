/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EtatDesLieux from '../components/EtatDesLieux';
import ModalSignatureBail from '../components/ModalSignatureBail';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  Banknote, Landmark, CheckCircle2, KeyRound, XCircle, Send, Search, ShieldCheck,
  ClipboardList, FileText, Home, Paperclip, Camera, Lock, Check, FileSignature,
  MessageCircle, Star, PenLine
} from 'lucide-react';

const GNF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' GNF';

var PAY_OPTS = [
  { id: 'om',   labelKey: 'om',   color: '#FF6600', textColor: '#fff', abbr: 'OM' },
  { id: 'mtn',  labelKey: 'mtn',  color: '#FFCC00', textColor: '#1B2B22', abbr: 'MM' },
  { id: 'cash', labelKey: 'cash', icon: Banknote },
  { id: 'bank', labelKey: 'bank', icon: Landmark },
];

// ─── BARRE DE PROGRESSION ──────────────────────────────────────────
function StepBar({ etape }) {
  var t = useTranslation('dashboard').t;
  var steps = [
    { id: 1, labelKey: 'demande' },
    { id: 2, labelKey: 'dossier' },
    { id: 3, labelKey: 'decision' },
    { id: 4, labelKey: 'echanges' },
    { id: 5, labelKey: 'caution' },
    { id: 6, labelKey: 'bail' },
    { id: 7, labelKey: 'acces' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
      {steps.map(function(s, i) {
        var done   = s.id < etape;
        var active = s.id === etape;
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: done || active ? '#1B6B3A' : '#E0E0E0',
                color: done || active ? '#fff' : '#888',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 13 : 11, fontWeight: 700,
                boxShadow: active ? '0 0 0 4px #C8E6C9' : 'none',
                flexShrink: 0, transition: 'all .3s'
              }}>
                {done ? <Check size={14} strokeWidth={2.2} /> : s.id}
              </div>
              <div style={{ fontSize: 9, marginTop: 3, whiteSpace: 'nowrap', color: active ? '#1B6B3A' : '#999', fontWeight: active ? 700 : 400 }}>
                {t('reservationLocataire.stepBar.' + s.labelKey)}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#1B6B3A' : '#E0E0E0', minWidth: 8, margin: '0 2px', marginBottom: 14, transition: 'background .3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CORRESPONDANCE STATUT → ÉTAPE ────────────────────────────────
var STATUT_ETAPE = {
  en_attente         : 1,
  dossier_requis     : 2,
  en_examen          : 3,
  acceptee           : 4,
  echanges           : 4,
  refusee            : 4,
  caution_requise    : 5,
  caution_payee      : 5,
  bail_en_cours      : 6,
  bail_signe_proprio : 6,
  confirmee          : 7,
};

// ─── COMPOSANT ATTENTE ────────────────────────────────────────────
function AttenteCard({ icone, message, sub }) {
  var t = useTranslation('dashboard').t;
  var [dots, setDots] = useState('.');
  useEffect(function() {
    var t = setInterval(function() { setDots(function(d) { return d.length >= 3 ? '.' : d + '.'; }); }, 600);
    return function() { clearInterval(t); };
  }, []);
  var IconeComp = typeof icone === 'function' ? icone : null;
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        {IconeComp ? <IconeComp size={40} strokeWidth={1.4} color="#1B6B3A" /> : (icone || '⏳')}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>{message}{dots}</div>
      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{sub}</div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, background: '#1B6B3A', borderRadius: '50%' }} />
        <span style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 600 }}>{t('reservationLocataire.attenteCard.syncTempsReel')}</span>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────
export default function ReservationLocataire() {
  var t = useTranslation('dashboard').t;
  var { id: reservationId } = useParams();
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;

  var [reservation, setReservation] = useState(null);
  var [logement, setLogement]       = useState(null);
  var [loading, setLoading]         = useState(true);
  var [msgs, setMsgs]               = useState([]);
  var [newMsg, setNewMsg]           = useState('');
  var [fichierMsg, setFichierMsg]   = useState(null);
  var [docs, setDocs]               = useState({ cni: null, emploi: null, paie: null, garant: null });
  var [payMode, setPayMode]         = useState('om');
  var [payProcessing, setPayProcessing] = useState(false);
  var [signed, setSigned]           = useState(false);
  var [signProcessing, setSignProcessing] = useState(false);
  var [showSignature, setShowSignature] = useState(false);
  var chatRef = useRef(null);
  var [noteSelectionnee, setNoteSelectionnee] = useState(0);
  var [commentaireNote, setCommentaireNote]   = useState('');
  var [noteEnvoyee, setNoteEnvoyee]           = useState(false);

  // ── POLLING STABLE — ne se recrée qu'une seule fois ──────────────
  // On utilise [reservationId] comme seule dépendance (jamais change)
  useEffect(function() {
    var actif = true;

    function doCharger() {
      if (!reservationId) return;
      api.get('/reservations/' + reservationId)
        .then(function(res) {
          if (!actif) return;
          var r = res.data.reservation || res.data;
          setReservation(r);
          setLogement(
            r.logement || {
              titre:        r.logement_titre,
              ville:        r.logement_ville,
              prix_mensuel: r.prix_mensuel,
              adresse:      r.logement_adresse
            }
          );
          setLoading(false);
        })
        .catch(function(err) {
          if (!actif) return;
          console.error(err);
          setLoading(false);
        });
    }

    doCharger();
    var interval = setInterval(doCharger, 5000);

    return function() {
      actif = false;
      clearInterval(interval);
    };
  }, [reservationId]);

  // ── MESSAGES : recharger quand le statut change ───────────────────
  useEffect(function() {
    if (!reservation) return;
    var proprietaireId = reservation.proprietaire_id;
    if (!proprietaireId) return;
    if (!['acceptee', 'echanges'].includes(reservation.statut)) return;
    api.get('/messages/' + proprietaireId)
      .then(function(res) { setMsgs(res.data.messages || []); })
      .catch(console.error);
  }, [reservation && reservation.statut]);

  // ── SCROLL EN BAS DU CHAT ─────────────────────────────────────────
  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  var statut = reservation ? reservation.statut : null;
  var etape  = STATUT_ETAPE[statut] || 1;
  var loyer  = logement ? Number(logement.prix_mensuel || 0) : 0;

  // ── ACTIONS ───────────────────────────────────────────────────────
 function soumettreDocuments(e) {
  e.preventDefault();
  var nbDocs = Object.values(docs).filter(Boolean).length;
  if (nbDocs < 2) { toast.error(t('reservationLocataire.etape2.erreurMinDocuments')); return; }

  var fd = new FormData();
  if (docs.cni)    fd.append('cni',    docs.cni);
  if (docs.emploi) fd.append('emploi', docs.emploi);
  if (docs.paie)   fd.append('paie',   docs.paie);
  if (docs.garant) fd.append('garant', docs.garant);

  toast.loading(t('reservationLocataire.etape2.toastUploadEnCours'));

  api.post('/reservations/' + reservationId + '/dossier', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
    .then(function(res) {
      toast.dismiss();
      toast.success(t('reservationLocataire.etape2.toastDossierSoumis'));
    })
    .catch(function(err) {
      toast.dismiss();
      var msg = err.response && err.response.data ? err.response.data.erreur : t('reservationLocataire.etape2.toastErreurSoumission');
      toast.error(msg);
      console.error('[Dossier]', err.response && err.response.data);
    });
}

  function payerCaution() {
    setPayProcessing(true);
    api.patch('/reservations/' + reservationId + '/payer-caution', { mode_paiement: payMode })
      .then(function() {
        toast.success(t('reservationLocataire.etape5.toastSucces'));
        setPayProcessing(false);
      })
      .catch(function() {
        setPayProcessing(false);
        toast.error(t('reservationLocataire.etape5.toastErreur'));
      });
  }

  function signerBail(nomComplet) {
    setSignProcessing(true);
    api.patch('/reservations/' + reservationId + '/signer-bail', { nom_complet: nomComplet, accepte: true })
      .then(function() {
        setSigned(true);
        setSignProcessing(false);
        setShowSignature(false);
        toast.success(t('reservationLocataire.bail.toastSigneSucces'));
      })
      .catch(function(err) {
        setSignProcessing(false);
        toast.error(err.response && err.response.data ? err.response.data.erreur : t('reservationLocataire.bail.toastErreurSignature'));
      });
  }

  function telechargerBailSigne() {
    api.get('/documents?type=contrat_bail')
      .then(function(res) {
        var docs = (res.data.documents || []).filter(function(d) { return d.reservation_id === reservationId; });
        if (docs.length === 0) { toast.error(t('reservationLocataire.bail.toastIntrouvable')); return; }
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
            toast.success(t('reservationLocataire.bail.toastTelecharge'));
          });
      })
      .catch(function() { toast.error(t('reservationLocataire.bail.toastErreurTelechargement')); });
  }

  function passerAuxEchanges() {
    api.patch('/reservations/' + reservationId + '/statut', { statut: 'echanges' })
      .catch(console.error);
  }

  function passerCautionRequise() {
    api.patch('/reservations/' + reservationId + '/statut', { statut: 'caution_requise' })
      .catch(console.error);
  }

  function envoyerMessage() {
    if (!newMsg.trim() && !fichierMsg) return;
    var proprietaireId = reservation && reservation.proprietaire_id;
    if (!proprietaireId) return;
    var fd = new FormData();
    fd.append('destinataire_id', proprietaireId);
    fd.append('reservation_id', reservationId);
    if (newMsg.trim()) fd.append('contenu', newMsg);
    if (fichierMsg) fd.append('fichier', fichierMsg);
    api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function(res) {
        setMsgs(function(prev) {
          return prev.concat(
            res.data.data || {
              contenu: newMsg,
              expedition_id: user && user.id,
              created_at: new Date().toISOString(),
              type: 'texte'
            }
          );
        });
        setNewMsg('');
        setFichierMsg(null);
      })
      .catch(function() { toast.error(t('reservationLocataire.etape4.toastErreurEnvoiMessage')); });
  }

  function envoyerNote() {
  if (noteSelectionnee === 0) return;
  api.post('/notations', {
    reservation_id: reservationId,
    note:           noteSelectionnee,
    commentaire:    commentaireNote
  })
    .then(function() {
      setNoteEnvoyee(true);
      toast.success(t('reservationLocataire.noter.toastSucces'));
    })
    .catch(function(err) {
      toast.error(err.response && err.response.data ? err.response.data.erreur : t('reservationLocataire.noter.toastErreur'));
    });
}

  // ── LOADING ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: 16, background: '#F7F8F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>{t('reservationLocataire.chargement')}</div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <XCircle size={40} strokeWidth={1.5} color="#E53935" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t('reservationLocataire.introuvable.titre')}</div>
          <button onClick={function() { navigate('/dashboard'); }}
            style={{ marginTop: 16, padding: '10px 20px', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
            {t('reservationLocataire.introuvable.retour')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: '12px 16px 80px', background: '#F7F8F7', minHeight: '100vh', width: '100%' }}>

      {/* HEADER */}
      <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button onClick={function() { navigate('/dashboard'); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 20, cursor: 'pointer', padding: '0 8px 0 0' }}>
              ←
            </button>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{t('reservationLocataire.header.titre')}</span>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, marginLeft: 28 }}>
              {logement && (logement.titre || logement.nom)} · {logement && logement.ville}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
            {statut === 'en_attente'          ? t('reservationLocataire.statutBadge.enAttente')
             : statut === 'dossier_requis'    ? t('reservationLocataire.statutBadge.dossierRequis')
             : statut === 'en_examen'         ? t('reservationLocataire.statutBadge.enExamen')
             : statut === 'acceptee'          ? t('reservationLocataire.statutBadge.acceptee')
             : statut === 'refusee'           ? t('reservationLocataire.statutBadge.refusee')
             : statut === 'echanges'          ? t('reservationLocataire.statutBadge.echanges')
             : statut === 'caution_requise'   ? t('reservationLocataire.statutBadge.cautionRequise')
             : statut === 'caution_payee'     ? t('reservationLocataire.statutBadge.cautionPayee')
             : statut === 'bail_en_cours'     ? t('reservationLocataire.statutBadge.bailEnCours')
             : statut === 'bail_signe_proprio'? t('reservationLocataire.statutBadge.bailSigneProprio')
             : statut === 'confirmee'         ? t('reservationLocataire.statutBadge.confirmee')
             : statut}
          </div>
        </div>
      </div>

      {/* BARRE D'ÉTAPES */}
      <StepBar etape={etape} />

      {/* ═══ ÉTAPE 1 : DEMANDE ENVOYÉE ═════════════════════════════ */}
      {statut === 'en_attente' && (
        <div>
          <AttenteCard
            icone={Send}
            message={t('reservationLocataire.etape1.attente.message')}
            sub={t('reservationLocataire.etape1.attente.sub')}
          />
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>{t('reservationLocataire.etape1.recap.titre')}</div>
            {[
              [t('reservationLocataire.etape1.recap.logement'), logement && (logement.titre || logement.nom)],
              [t('reservationLocataire.etape1.recap.loyerMensuel'), GNF(loyer)],
              [t('reservationLocataire.etape1.recap.dateDeDebut'), reservation.date_debut ? new Date(reservation.date_debut).toLocaleDateString('fr-FR') : t('reservationLocataire.etape1.recap.na')],
              [t('reservationLocataire.etape1.recap.duree'), reservation.duree_mois ? t('reservationLocataire.etape1.recap.dureeMois', { n: reservation.duree_mois }) : t('reservationLocataire.etape1.recap.na')],
              [t('reservationLocataire.etape1.recap.statut'), t('reservationLocataire.etape1.recap.statutEnAttente')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#1B2B22' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ ÉTAPE 2 : DOSSIER ══════════════════════════════════════ */}
      {statut === 'dossier_requis' && (
        <div>
          <div style={{ background: '#E3F2FD', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <ClipboardList size={16} strokeWidth={1.6} color="#1565C0" />
            <span style={{ fontSize: 13, color: '#1565C0', lineHeight: 1.5, fontWeight: 600 }}>
              {t('reservationLocataire.etape2.alerteInfo')}
            </span>
          </div>
          <form onSubmit={soumettreDocuments}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('reservationLocataire.etape2.titreDossier')}</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#666' }}>{t('reservationLocataire.etape2.progression')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1B6B3A' }}>{Math.round(Object.values(docs).filter(Boolean).length / 4 * 100)}%</span>
                </div>
                <div style={{ background: '#F0F0F0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #1B6B3A, #34A853)', width: Math.round(Object.values(docs).filter(Boolean).length / 4 * 100) + '%', height: '100%', borderRadius: 6, transition: 'width .4s' }} />
                </div>
              </div>
              {[
                { key: 'cni',    labelKey: 'cni',    req: true },
                { key: 'emploi', labelKey: 'emploi', req: true },
                { key: 'paie',   labelKey: 'paie',   req: false },
                { key: 'garant', labelKey: 'garant', req: false },
              ].map(function(doc) {
                var added = Boolean(docs[doc.key]);
                return (
                  <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: added ? '#E8F5E9' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {added ? <CheckCircle2 size={18} strokeWidth={1.6} color="#1B6B3A" /> : <FileText size={18} strokeWidth={1.6} color="#999" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>
                        {t('reservationLocataire.etape2.docs.' + doc.labelKey + '.label')}{doc.req && <span style={{ color: '#E53935' }}> *</span>}
                      </div>
                      <div style={{ fontSize: 11, color: added ? '#1B6B3A' : '#888', marginTop: 1 }}>
                        {added ? (docs[doc.key] && docs[doc.key].name ? docs[doc.key].name : docs[doc.key]) : t('reservationLocataire.etape2.docs.' + doc.labelKey + '.sub')}
                      </div>
                    </div>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" style={{ display: 'none' }} onChange={function(e) {
                        if (e.target.files && e.target.files[0]) {
                          var f = e.target.files[0];
                          setDocs(function(prev) { return Object.assign({}, prev, { [doc.key]: f }); });
                          toast.success(t('reservationLocataire.etape2.fichierAjouteToast', { nom: f.name }));
                        }
                      }} />
                      <div style={{ padding: '7px 12px', borderRadius: 8, background: added ? '#F0FBF0' : '#1B6B3A', color: added ? '#1B6B3A' : '#fff', fontSize: 12, fontWeight: 600, border: added ? '0.5px solid #A5D6A7' : 'none' }}>
                        {added ? t('reservationLocataire.etape2.modifier') : t('reservationLocataire.etape2.ajouter')}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
            <button type="submit"
              style={{ width: '100%', background: Object.values(docs).filter(Boolean).length >= 2 ? '#1B6B3A' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: Object.values(docs).filter(Boolean).length >= 2 ? 'pointer' : 'not-allowed' }}>
              {t('reservationLocataire.etape2.soumettreBouton')}
            </button>
          </form>
        </div>
      )}

      {/* ═══ ÉTAPE 3 : EN EXAMEN ════════════════════════════════════ */}
      {statut === 'en_examen' && (
        <AttenteCard
          icone={Search}
          message={t('reservationLocataire.etape3.message')}
          sub={t('reservationLocataire.etape3.sub')}
        />
      )}

      {/* ═══ REFUSÉE ════════════════════════════════════════════════ */}
      {statut === 'refusee' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😞</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 8 }}>{t('reservationLocataire.refusee.titre')}</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
            {t('reservationLocataire.refusee.description')}
          </div>
          {reservation.motif_refus && (
            <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#B71C1C', marginBottom: 4 }}>{t('reservationLocataire.refusee.motif')}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{reservation.motif_refus}</div>
            </div>
          )}
          <button onClick={function() { navigate('/logements'); }}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('reservationLocataire.refusee.chercherAutres')}
          </button>
        </div>
      )}

      {/* ═══ ÉTAPE 4 : ÉCHANGES ═════════════════════════════════════ */}
      {(statut === 'acceptee' || statut === 'echanges') && (
        <div>
          <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <span>🎉</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>{t('reservationLocataire.etape4.accepteeBanner.titre')}</div>
              <div style={{ fontSize: 12, color: '#2E7D32' }}>{t('reservationLocataire.etape4.accepteeBanner.sous')}</div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#1B6B3A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Home size={16} strokeWidth={1.6} color="#fff" />
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{t('reservationLocataire.etape4.discussionSecurisee')}</div>
              <label style={{ marginLeft: 'auto', cursor: 'pointer' }}>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={function(e) {
                  if (e.target.files && e.target.files[0]) setFichierMsg(e.target.files[0]);
                }} />
                <Paperclip size={16} strokeWidth={1.6} color="rgba(255,255,255,0.8)" />
              </label>
            </div>
            <div ref={chatRef} style={{ height: 250, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#F8F9F8' }}>
              {msgs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, paddingTop: 30 }}>{t('reservationLocataire.etape4.demarrerDiscussion')}</div>
              )}
              {msgs.map(function(m, i) {
                var isMoi = m.expedition_id === (user && user.id);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMoi ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '9px 13px', borderRadius: isMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMoi ? '#1B6B3A' : '#fff', color: isMoi ? '#fff' : '#1B2B22', fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      {m.type === 'photo' && m.fichier_url && <img src={m.fichier_url} alt="photo" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, marginBottom: m.contenu ? 6 : 0 }} />}
                      {m.type === 'document' && m.fichier_url && (
                        <a href={m.fichier_url} target="_blank" rel="noreferrer" style={{ color: isMoi ? '#fff' : '#1B6B3A', textDecoration: 'none', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Paperclip size={12} strokeWidth={1.8} /> {m.fichier_nom || t('reservationLocataire.etape4.document')}
                        </a>
                      )}
                      {m.contenu && <div>{m.contenu}</div>}
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {fichierMsg && (
              <div style={{ padding: '6px 12px', background: '#E8F5E9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#1B5E20', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {fichierMsg.type.startsWith('image/') ? <Camera size={13} strokeWidth={1.8} /> : <Paperclip size={13} strokeWidth={1.8} />} {fichierMsg.name}
                </span>
                <button onClick={function() { setFichierMsg(null); }} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontWeight: 700 }}>×</button>
              </div>
            )}
            <div style={{ padding: '10px 12px', background: '#fff', borderTop: '0.5px solid #F0F0F0', display: 'flex', gap: 8 }}>
              <input value={newMsg} onChange={function(e) { setNewMsg(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerMessage(); } }}
                placeholder={t('reservationLocataire.etape4.messagePlaceholder')}
                style={{ flex: 1, padding: '9px 14px', borderRadius: 20, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: '#F8F8F8' }} />
              <button onClick={envoyerMessage} style={{ width: 38, height: 38, borderRadius: '50%', background: '#1B6B3A', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>↗</button>
            </div>
          </div>
          <button onClick={passerCautionRequise}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('reservationLocataire.etape4.procederCautionBouton')}
          </button>
        </div>
      )}

      {/* ═══ ÉTAPE 5 : CAUTION ══════════════════════════════════════ */}
      {statut === 'caution_requise' && (
        <div>
          <div style={{ background: '#FFF3E0', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <Lock size={16} strokeWidth={1.6} color="#E65100" />
            <span style={{ fontSize: 12, color: '#E65100', lineHeight: 1.5 }}>
              {t('reservationLocataire.etape5.alerteInfo')}
            </span>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#F0FBF0', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A' }}>{t('reservationLocataire.etape5.titreCaution')}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t('reservationLocataire.etape5.securiseeSurWerdhe')}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1B6B3A' }}>{GNF(loyer)}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>{t('reservationLocataire.etape5.modePaiement')}</div>
            {PAY_OPTS.map(function(p) {
              return (
                <div key={p.id} onClick={function() { setPayMode(p.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: payMode === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: payMode === p.id ? '#F0FBF0' : '#fff', borderRadius: 12, marginBottom: 8, cursor: 'pointer', transition: 'all .2s' }}>
                  <div style={{ width: 40, height: 40, background: p.color || '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p.icon ? 20 : 13, fontWeight: 700, color: p.textColor || '#1B6B3A', flexShrink: 0 }}>
                    {p.icon ? <p.icon size={20} strokeWidth={1.6} color={p.textColor || '#1B6B3A'} /> : p.abbr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{t('reservationLocataire.payOpts.' + p.labelKey + '.label')}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{t('reservationLocataire.payOpts.' + p.labelKey + '.sub')}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: payMode === p.id ? 'none' : '1.5px solid #E0E0E0', background: payMode === p.id ? '#1B6B3A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {payMode === p.id && <Check size={13} strokeWidth={2.2} color="#fff" />}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={payerCaution} disabled={payProcessing}
            style={{ width: '100%', background: payProcessing ? '#999' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: payProcessing ? 'not-allowed' : 'pointer' }}>
            {payProcessing ? t('reservationLocataire.etape5.traitementEnCours') : t('reservationLocataire.etape5.verserBouton', { montant: GNF(loyer) })}
          </button>
        </div>
      )}

      {/* ═══ ÉTAPE 5b : CAUTION PAYÉE ═══════════════════════════════ */}
      {statut === 'caution_payee' && (
        <div>
          <AttenteCard
            icone={ShieldCheck}
            message={t('reservationLocataire.etape5b.message')}
            sub={t('reservationLocataire.etape5b.sub')}
          />
          <div style={{ background: '#E8F5E9', borderRadius: 12, padding: 14, display: 'flex', gap: 8 }}>
            <CheckCircle2 size={18} strokeWidth={1.6} color="#1B5E20" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>{t('reservationLocataire.etape5b.cautionVersee', { montant: GNF(loyer) })}</div>
              <div style={{ fontSize: 11, color: '#2E7D32', marginTop: 2 }}>{t('reservationLocataire.etape5b.protegeeJusqua')}</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ÉTAPE 6 : BAIL ═════════════════════════════════════════ */}
      {(statut === 'bail_en_cours' || statut === 'bail_signe_proprio') && (
        <div>
          <div style={{ background: '#F3E5F5', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <FileSignature size={18} strokeWidth={1.6} color="#6A1B9A" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6A1B9A' }}>
                {statut === 'bail_signe_proprio' ? t('reservationLocataire.etape6.bannerSigneAttente') : t('reservationLocataire.etape6.bannerPret')}
              </div>
              <div style={{ fontSize: 12, color: '#7B1FA2' }}>{t('reservationLocataire.etape6.lisezEtSignez')}</div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 10, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                [t('reservationLocataire.etape6.labels.logement'), logement && (logement.titre || logement.nom)],
                [t('reservationLocataire.etape6.labels.loyer'), t('reservationLocataire.etape6.labels.loyerParMois', { montant: GNF(loyer) })],
                [t('reservationLocataire.etape6.labels.debut'), reservation.date_debut ? new Date(reservation.date_debut).toLocaleDateString('fr-FR') : t('reservationLocataire.etape1.recap.na')],
                [t('reservationLocataire.etape6.labels.duree'), reservation.duree_mois ? t('reservationLocataire.etape1.recap.dureeMois', { n: reservation.duree_mois }) : t('reservationLocataire.etape1.recap.na')],
                [t('reservationLocataire.etape6.labels.caution'), t('reservationLocataire.etape6.labels.cautionCoche', { montant: GNF(loyer) })],
                [t('reservationLocataire.etape6.labels.loyerDuLe'), t('reservationLocataire.etape6.labels.premierDuMois')],
              ].map(function(row) {
                return <div key={row[0]} style={{ fontSize: 11, color: '#666' }}><b>{row[0]} :</b> {row[1]}</div>;
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 12, border: '0.5px solid #E0E0E0', borderRadius: 10, textAlign: 'center', background: statut === 'bail_signe_proprio' ? '#E8F5E9' : '#FAFAFA' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{t('reservationLocataire.etape6.signatureProprietaire')}</div>
                {statut === 'bail_signe_proprio' ? (
                  <>
                    <div style={{ fontStyle: 'italic', color: '#1B6B3A', fontSize: 14, marginBottom: 4 }}>{t('reservationLocataire.etape6.signe')}</div>
                    <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#E8F5E9', color: '#1B5E20' }}>{t('reservationLocataire.etape6.signeBadge')}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>⏳</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{t('reservationLocataire.etape6.enAttente')}</div>
                  </>
                )}
              </div>
              <div onClick={function() { if (!signed && !signProcessing) setShowSignature(true); }}
                style={{ padding: 12, border: signed ? '1.5px solid #1A4FA0' : '1.5px dashed #1A4FA0', background: signed ? '#E3F2FD' : '#F0F7FF', borderRadius: 10, textAlign: 'center', cursor: signed ? 'default' : 'pointer' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{t('reservationLocataire.etape6.votreSignature')}</div>
                {signed ? (
                  <>
                    <div style={{ fontStyle: 'italic', color: '#1A4FA0', fontSize: 14, marginBottom: 4 }}>{t('reservationLocataire.etape6.signe')}</div>
                    <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#E3F2FD', color: '#0D47A1' }}>{t('reservationLocataire.etape6.signeBadge')}</div>
                  </>
                ) : signProcessing ? (
                  <div style={{ fontSize: 13, color: '#1A4FA0' }}>{t('reservationLocataire.etape6.signatureEnCours')}</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><PenLine size={22} strokeWidth={1.6} color="#1A4FA0" /></div>
                    <div style={{ fontSize: 11, color: '#1A4FA0', marginTop: 4 }}>{t('reservationLocataire.etape6.appuyerPourSigner')}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          {signed && (
            <AttenteCard icone="⏳" message={t('reservationLocataire.etape6.bailSigneAttente.message')} sub={t('reservationLocataire.etape6.bailSigneAttente.sub')} />
          )}
        </div>
      )}

    {(statut === 'bail_en_cours' || statut === 'bail_signe_proprio') && signed && (
      <div style={{ marginTop: 16 }}>
       <EtatDesLieux
        reservationId={reservationId}
        type="entree"
        onTermine={function() { toast.success(t('reservationLocataire.etape6.etatDesLieuxValideToast')); }}
       />
     </div>
    )}

      {/* ═══ ÉTAPE 7 : ACCÈS ACCORDÉ ════════════════════════════════ */}
      {statut === 'confirmee' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <KeyRound size={40} strokeWidth={1.5} color="#1B6B3A" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1B6B3A', marginBottom: 6 }}>{t('reservationLocataire.etape7.felicitations')}</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{t('reservationLocataire.etape7.acces')}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {[
              { icon: CheckCircle2, title: t('reservationLocataire.etape7.items.demandeAcceptee.titre'),   sub: t('reservationLocataire.etape7.items.demandeAcceptee.sub') },
              { icon: CheckCircle2, title: t('reservationLocataire.etape7.items.cautionEnregistree.titre'), sub: t('reservationLocataire.etape7.items.cautionEnregistree.sub', { montant: GNF(loyer) }) },
              { icon: CheckCircle2, title: t('reservationLocataire.etape7.items.bailSigne.titre'),          sub: t('reservationLocataire.etape7.items.bailSigne.sub') },
              { icon: KeyRound, title: t('reservationLocataire.etape7.items.accesAccorde.titre'),      sub: logement && (logement.titre || logement.nom), highlight: true },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '0.5px solid #F5F5F5' : 'none' }}>
                  <div style={{ width: 34, height: 34, background: item.highlight ? '#1B6B3A' : '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={16} strokeWidth={1.6} color={item.highlight ? '#fff' : '#1B6B3A'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.highlight ? '#1B6B3A' : '#1B2B22' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#1B5E20' }}>
              {t('reservationLocataire.etape7.premierLoyerAvant')}<b>{GNF(loyer)}</b>{t('reservationLocataire.etape7.premierLoyerApres')}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
  <button onClick={function() {
    localStorage.setItem('dashboardOnglet', '/dashboard/documents');
    navigate('/dashboard');
  }}
    style={{ padding: 14, border: '0.5px solid #E0E0E0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <FileText size={20} strokeWidth={1.6} color="#1B2B22" />
    <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>{t('reservationLocataire.etape7.actions.documents')}</div>
  </button>
  <button onClick={function() {
    localStorage.setItem('dashboardOnglet', '/dashboard/messages');
    navigate('/dashboard');
  }}
    style={{ padding: 14, border: '0.5px solid #E0E0E0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <MessageCircle size={20} strokeWidth={1.6} color="#1B2B22" />
    <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>{t('reservationLocataire.etape7.actions.messages')}</div>
  </button>
  <button onClick={telechargerBailSigne}
    style={{ padding: 14, border: '0.5px solid #E0E0E0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <KeyRound size={20} strokeWidth={1.6} color="#1B2B22" />
    <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>{t('reservationLocataire.etape7.actions.bailPdf')}</div>
  </button>
</div>
        </div>
      )}

      {/* Bouton noter le propriétaire */}
{!noteEnvoyee && (
  <div style={{ marginTop: 14, background: '#FFF8E1', borderRadius: 12, padding: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: '#7B4F00', marginBottom: 10 }}>
      {t('reservationLocataire.noter.titre')}
    </div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      {[1, 2, 3, 4, 5].map(function(n) {
        return (
          <button key={n} onClick={function() { setNoteSelectionnee(n); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', opacity: noteSelectionnee >= n ? 1 : 0.3, transform: noteSelectionnee >= n ? 'scale(1.1)' : 'scale(1)', transition: 'all .15s' }}>
            <Star size={28} strokeWidth={1.5} color="#F5A623" fill={noteSelectionnee >= n ? '#F5A623' : 'none'} />
          </button>
        );
      })}
    </div>
    {noteSelectionnee > 0 && (
      <div>
        <textarea value={commentaireNote} onChange={function(e) { setCommentaireNote(e.target.value); }}
          placeholder={t('reservationLocataire.noter.commentairePlaceholder')}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 60, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none', marginBottom: 8 }} />
        <button onClick={envoyerNote}
          style={{ width: '100%', background: '#F5A623', color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {t('reservationLocataire.noter.envoyerBouton', { note: noteSelectionnee })}
        </button>
      </div>
    )}
  </div>
)}
{noteEnvoyee && (
  <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>
    {t('reservationLocataire.noter.merci')}
  </div>
)}

      <div style={{ height: 30 }} />
      {showSignature && (
        <ModalSignatureBail
          nomSuggere={((user && user.prenom) || '') + ' ' + ((user && user.nom) || '')}
          loading={signProcessing}
          onClose={function() { if (!signProcessing) setShowSignature(false); }}
          onConfirm={signerBail}
        />
      )}
    </div>
  );
}