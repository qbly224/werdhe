/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EtatDesLieux from '../components/EtatDesLieux';
import api from '../services/api';
import toast from 'react-hot-toast';

const GNF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' GNF';

var PAY_OPTS = [
  { id: 'om',   label: 'Orange Money',     sub: 'Instantané · Paiement sécurisé', color: '#FF6600', textColor: '#fff', abbr: 'OM' },
  { id: 'mtn',  label: 'MTN MoMo',         sub: 'Instantané · MTN Guinée',        color: '#FFCC00', textColor: '#1B2B22', abbr: 'MM' },
  { id: 'cash', label: 'Espèces',           sub: 'Remise en main propre',           icon: '💵' },
  { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank · UBA',        icon: '🏦' },
];

// ─── BARRE DE PROGRESSION ──────────────────────────────────────────
function StepBar({ etape }) {
  var steps = [
    { id: 1, label: 'Demande' },
    { id: 2, label: 'Dossier' },
    { id: 3, label: 'Décision' },
    { id: 4, label: 'Échanges' },
    { id: 5, label: 'Caution' },
    { id: 6, label: 'Bail' },
    { id: 7, label: 'Accès' },
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
                {done ? '✓' : s.id}
              </div>
              <div style={{ fontSize: 9, marginTop: 3, whiteSpace: 'nowrap', color: active ? '#1B6B3A' : '#999', fontWeight: active ? 700 : 400 }}>
                {s.label}
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
  var [dots, setDots] = useState('.');
  useEffect(function() {
    var t = setInterval(function() { setDots(function(d) { return d.length >= 3 ? '.' : d + '.'; }); }, 600);
    return function() { clearInterval(t); };
  }, []);
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icone || '⏳'}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>{message}{dots}</div>
      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{sub}</div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, background: '#1B6B3A', borderRadius: '50%' }} />
        <span style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 600 }}>Synchronisation en temps réel</span>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────
export default function ReservationLocataire() {
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
  var chatRef = useRef(null);

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
    if (nbDocs < 2) { toast.error('Ajoutez au moins 2 documents'); return; }
    api.patch('/reservations/' + reservationId + '/soumettre-dossier', {})
      .then(function() {
        toast.success('Dossier soumis ! Le propriétaire va l\'examiner.');
      })
      .catch(function(err) {
        toast.error('Erreur lors de la soumission');
        console.error(err);
      });
  }

  function payerCaution() {
    setPayProcessing(true);
    api.patch('/reservations/' + reservationId + '/payer-caution', { mode_paiement: payMode })
      .then(function() {
        toast.success('Caution versée ! Le propriétaire va préparer le bail.');
        setPayProcessing(false);
      })
      .catch(function() {
        setPayProcessing(false);
        toast.error('Erreur paiement caution');
      });
  }

  function signerBail() {
    setSignProcessing(true);
    api.patch('/reservations/' + reservationId + '/signer-bail', { role: 'locataire' })
      .then(function() {
        setSigned(true);
        setSignProcessing(false);
        toast.success('Bail signé ! En attente de confirmation finale.');
      })
      .catch(function() {
        setSignProcessing(false);
        toast.error('Erreur signature bail');
      });
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
      .catch(function() { toast.error('Erreur envoi message'); });
  }

  // ── LOADING ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: 16, background: '#F7F8F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>Chargement de votre réservation...</div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Réservation introuvable</div>
          <button onClick={function() { navigate('/dashboard'); }}
            style={{ marginTop: 16, padding: '10px 20px', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: '12px 16px', background: '#F7F8F7', minHeight: '100vh' }}>

      {/* HEADER */}
      <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button onClick={function() { navigate('/dashboard'); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 20, cursor: 'pointer', padding: '0 8px 0 0' }}>
              ←
            </button>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Ma réservation</span>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, marginLeft: 28 }}>
              {logement && (logement.titre || logement.nom)} · {logement && logement.ville}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
            {statut === 'en_attente'          ? 'Demande envoyée'
             : statut === 'dossier_requis'    ? 'Dossier demandé'
             : statut === 'en_examen'         ? 'En examen'
             : statut === 'acceptee'          ? 'Acceptée ✅'
             : statut === 'refusee'           ? 'Refusée ❌'
             : statut === 'echanges'          ? 'En échanges'
             : statut === 'caution_requise'   ? 'Caution à payer'
             : statut === 'caution_payee'     ? 'Caution versée'
             : statut === 'bail_en_cours'     ? 'Bail à signer'
             : statut === 'bail_signe_proprio'? 'Attente signature'
             : statut === 'confirmee'         ? 'Active 🗝️'
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
            icone="📤"
            message="Demande envoyée au propriétaire"
            sub="Le propriétaire a 48h pour répondre. Vous serez notifié(e) dès qu'il prend une décision."
          />
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Récapitulatif de votre demande</div>
            {[
              ['Logement',      logement && (logement.titre || logement.nom)],
              ['Loyer mensuel', GNF(loyer)],
              ['Date de début', reservation.date_debut ? new Date(reservation.date_debut).toLocaleDateString('fr-FR') : 'N/A'],
              ['Durée',         reservation.duree_mois ? reservation.duree_mois + ' mois' : 'N/A'],
              ['Statut',        '📤 En attente de réponse'],
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
            <span>📋</span>
            <span style={{ fontSize: 13, color: '#1565C0', lineHeight: 1.5, fontWeight: 600 }}>
              Le propriétaire demande votre dossier. Complétez-le pour valider votre candidature.
            </span>
          </div>
          <form onSubmit={soumettreDocuments}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>📁 Votre dossier</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#666' }}>Progression</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1B6B3A' }}>{Math.round(Object.values(docs).filter(Boolean).length / 4 * 100)}%</span>
                </div>
                <div style={{ background: '#F0F0F0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #1B6B3A, #34A853)', width: Math.round(Object.values(docs).filter(Boolean).length / 4 * 100) + '%', height: '100%', borderRadius: 6, transition: 'width .4s' }} />
                </div>
              </div>
              {[
                { key: 'cni',    label: 'Pièce d\'identité (CNI)',  sub: 'Recto-verso · Obligatoire',  req: true },
                { key: 'emploi', label: 'Attestation d\'emploi',    sub: 'Signée · Obligatoire',        req: true },
                { key: 'paie',   label: 'Fiches de paie (3 mois)',  sub: 'Recommandé',                 req: false },
                { key: 'garant', label: 'Contact du garant',        sub: 'Optionnel',                  req: false },
              ].map(function(doc) {
                var added = Boolean(docs[doc.key]);
                return (
                  <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: added ? '#E8F5E9' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {added ? '✅' : '📄'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>
                        {doc.label}{doc.req && <span style={{ color: '#E53935' }}> *</span>}
                      </div>
                      <div style={{ fontSize: 11, color: added ? '#1B6B3A' : '#888', marginTop: 1 }}>
                        {added ? (docs[doc.key] && docs[doc.key].name ? docs[doc.key].name : docs[doc.key]) : doc.sub}
                      </div>
                    </div>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" style={{ display: 'none' }} onChange={function(e) {
                        if (e.target.files && e.target.files[0]) {
                          var f = e.target.files[0];
                          setDocs(function(prev) { return Object.assign({}, prev, { [doc.key]: f }); });
                          toast.success(f.name + ' ajouté !');
                        }
                      }} />
                      <div style={{ padding: '7px 12px', borderRadius: 8, background: added ? '#F0FBF0' : '#1B6B3A', color: added ? '#1B6B3A' : '#fff', fontSize: 12, fontWeight: 600, border: added ? '0.5px solid #A5D6A7' : 'none' }}>
                        {added ? 'Modifier' : 'Ajouter'}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
            <button type="submit"
              style={{ width: '100%', background: Object.values(docs).filter(Boolean).length >= 2 ? '#1B6B3A' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: Object.values(docs).filter(Boolean).length >= 2 ? 'pointer' : 'not-allowed' }}>
              📤 Soumettre mon dossier
            </button>
          </form>
        </div>
      )}

      {/* ═══ ÉTAPE 3 : EN EXAMEN ════════════════════════════════════ */}
      {statut === 'en_examen' && (
        <AttenteCard
          icone="🔍"
          message="Votre dossier est en cours d'examen"
          sub="Le propriétaire analyse votre candidature. Vous serez notifié(e) de sa décision sous 24-48h."
        />
      )}

      {/* ═══ REFUSÉE ════════════════════════════════════════════════ */}
      {statut === 'refusee' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😞</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 8 }}>Candidature non retenue</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
            Le propriétaire n'a pas retenu votre dossier. Ne vous découragez pas !
          </div>
          {reservation.motif_refus && (
            <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#B71C1C', marginBottom: 4 }}>Motif</div>
              <div style={{ fontSize: 13, color: '#555' }}>{reservation.motif_refus}</div>
            </div>
          )}
          <button onClick={function() { navigate('/logements'); }}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🔍 Chercher d'autres logements
          </button>
        </div>
      )}

      {/* ═══ ÉTAPE 4 : ÉCHANGES ═════════════════════════════════════ */}
      {(statut === 'acceptee' || statut === 'echanges') && (
        <div>
          <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <span>🎉</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>Candidature acceptée !</div>
              <div style={{ fontSize: 12, color: '#2E7D32' }}>Discutez des conditions avant de payer la caution.</div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#1B6B3A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏠</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Discussion sécurisée</div>
              <label style={{ marginLeft: 'auto', cursor: 'pointer' }}>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={function(e) {
                  if (e.target.files && e.target.files[0]) setFichierMsg(e.target.files[0]);
                }} />
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>📎</div>
              </label>
            </div>
            <div ref={chatRef} style={{ height: 250, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#F8F9F8' }}>
              {msgs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, paddingTop: 30 }}>Démarrez la discussion avec le propriétaire</div>
              )}
              {msgs.map(function(m, i) {
                var isMoi = m.expedition_id === (user && user.id);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMoi ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '9px 13px', borderRadius: isMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMoi ? '#1B6B3A' : '#fff', color: isMoi ? '#fff' : '#1B2B22', fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      {m.type === 'photo' && m.fichier_url && <img src={m.fichier_url} alt="photo" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, marginBottom: m.contenu ? 6 : 0 }} />}
                      {m.type === 'document' && m.fichier_url && <a href={m.fichier_url} target="_blank" rel="noreferrer" style={{ color: isMoi ? '#fff' : '#1B6B3A', textDecoration: 'none', fontSize: 12 }}>📎 {m.fichier_nom || 'Document'}</a>}
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
                <span style={{ fontSize: 12, color: '#1B5E20' }}>{fichierMsg.type.startsWith('image/') ? '📷' : '📎'} {fichierMsg.name}</span>
                <button onClick={function() { setFichierMsg(null); }} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontWeight: 700 }}>×</button>
              </div>
            )}
            <div style={{ padding: '10px 12px', background: '#fff', borderTop: '0.5px solid #F0F0F0', display: 'flex', gap: 8 }}>
              <input value={newMsg} onChange={function(e) { setNewMsg(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerMessage(); } }}
                placeholder="Écrivez un message..."
                style={{ flex: 1, padding: '9px 14px', borderRadius: 20, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: '#F8F8F8' }} />
              <button onClick={envoyerMessage} style={{ width: 38, height: 38, borderRadius: '50%', background: '#1B6B3A', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>↗</button>
            </div>
          </div>
          <button onClick={passerCautionRequise}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🔒 Procéder au paiement de la caution →
          </button>
        </div>
      )}

      {/* ═══ ÉTAPE 5 : CAUTION ══════════════════════════════════════ */}
      {statut === 'caution_requise' && (
        <div>
          <div style={{ background: '#FFF3E0', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <span>🔒</span>
            <span style={{ fontSize: 12, color: '#E65100', lineHeight: 1.5 }}>
              Versez la caution pour sécuriser votre logement. Elle est protégée sur Werdhe.
            </span>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#F0FBF0', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A' }}>Caution — 1 mois de loyer</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Sécurisée sur Werdhe</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1B6B3A' }}>{GNF(loyer)}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Mode de paiement</div>
            {PAY_OPTS.map(function(p) {
              return (
                <div key={p.id} onClick={function() { setPayMode(p.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: payMode === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: payMode === p.id ? '#F0FBF0' : '#fff', borderRadius: 12, marginBottom: 8, cursor: 'pointer', transition: 'all .2s' }}>
                  <div style={{ width: 40, height: 40, background: p.color || '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p.icon ? 20 : 13, fontWeight: 700, color: p.textColor || '#1B6B3A', flexShrink: 0 }}>
                    {p.icon || p.abbr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{p.sub}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: payMode === p.id ? 'none' : '1.5px solid #E0E0E0', background: payMode === p.id ? '#1B6B3A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {payMode === p.id && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={payerCaution} disabled={payProcessing}
            style={{ width: '100%', background: payProcessing ? '#999' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: payProcessing ? 'not-allowed' : 'pointer' }}>
            {payProcessing ? '⏳ Traitement...' : '🔒 Verser la caution — ' + GNF(loyer)}
          </button>
        </div>
      )}

      {/* ═══ ÉTAPE 5b : CAUTION PAYÉE ═══════════════════════════════ */}
      {statut === 'caution_payee' && (
        <div>
          <AttenteCard
            icone="🛡️"
            message="Caution sécurisée sur Werdhe"
            sub="Le propriétaire va préparer le bail. Vous serez notifié(e) dès qu'il est prêt à être signé."
          />
          <div style={{ background: '#E8F5E9', borderRadius: 12, padding: 14, display: 'flex', gap: 8 }}>
            <span>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20' }}>Caution versée : {GNF(loyer)}</div>
              <div style={{ fontSize: 11, color: '#2E7D32', marginTop: 2 }}>Protégée jusqu'à l'état des lieux de sortie</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ÉTAPE 6 : BAIL ═════════════════════════════════════════ */}
      {(statut === 'bail_en_cours' || statut === 'bail_signe_proprio') && (
        <div>
          <div style={{ background: '#F3E5F5', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <span>📝</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6A1B9A' }}>
                {statut === 'bail_signe_proprio' ? 'Le propriétaire a signé. C\'est votre tour !' : 'Le bail est prêt à signer.'}
              </div>
              <div style={{ fontSize: 12, color: '#7B1FA2' }}>Lisez et signez votre contrat de bail.</div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 10, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                ['Logement', logement && (logement.titre || logement.nom)],
                ['Loyer', GNF(loyer) + '/mois'],
                ['Début', reservation.date_debut ? new Date(reservation.date_debut).toLocaleDateString('fr-FR') : 'N/A'],
                ['Durée', reservation.duree_mois ? reservation.duree_mois + ' mois' : 'N/A'],
                ['Caution', GNF(loyer) + ' ✅'],
                ['Loyer dû le', '1er du mois'],
              ].map(function(row) {
                return <div key={row[0]} style={{ fontSize: 11, color: '#666' }}><b>{row[0]} :</b> {row[1]}</div>;
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 12, border: '0.5px solid #E0E0E0', borderRadius: 10, textAlign: 'center', background: statut === 'bail_signe_proprio' ? '#E8F5E9' : '#FAFAFA' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Signature Propriétaire</div>
                {statut === 'bail_signe_proprio' ? (
                  <>
                    <div style={{ fontStyle: 'italic', color: '#1B6B3A', fontSize: 14, marginBottom: 4 }}>Signé ✓</div>
                    <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#E8F5E9', color: '#1B5E20' }}>Signé</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>⏳</div>
                    <div style={{ fontSize: 11, color: '#888' }}>En attente</div>
                  </>
                )}
              </div>
              <div onClick={function() { if (!signed && !signProcessing) signerBail(); }}
                style={{ padding: 12, border: signed ? '1.5px solid #1A4FA0' : '1.5px dashed #1A4FA0', background: signed ? '#E3F2FD' : '#F0F7FF', borderRadius: 10, textAlign: 'center', cursor: signed ? 'default' : 'pointer' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Votre signature</div>
                {signed ? (
                  <>
                    <div style={{ fontStyle: 'italic', color: '#1A4FA0', fontSize: 14, marginBottom: 4 }}>Signé ✓</div>
                    <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#E3F2FD', color: '#0D47A1' }}>Signé</div>
                  </>
                ) : signProcessing ? (
                  <div style={{ fontSize: 13, color: '#1A4FA0' }}>⏳ Signature...</div>
                ) : (
                  <>
                    <div style={{ fontSize: 24 }}>✍️</div>
                    <div style={{ fontSize: 11, color: '#1A4FA0', marginTop: 4 }}>Appuyer pour signer</div>
                  </>
                )}
              </div>
            </div>
          </div>
          {signed && (
            <AttenteCard icone="⏳" message="Bail signé ! En attente de confirmation finale" sub="Le propriétaire va finaliser et vous aurez officiellement accès au logement." />
          )}
        </div>
      )}

    {(statut === 'bail_en_cours' || statut === 'bail_signe_proprio') && signed && (
      <div style={{ marginTop: 16 }}>
       <EtatDesLieux
        reservationId={reservationId}
        type="entree"
        onTermine={function() { toast.success('État des lieux validé !'); }}
       />
     </div>
    )}

      {/* ═══ ÉTAPE 7 : ACCÈS ACCORDÉ ════════════════════════════════ */}
      {statut === 'confirmee' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 40 }}>🗝️</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1B6B3A', marginBottom: 6 }}>Félicitations ! 🎉</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>Vous avez officiellement accès à votre logement.</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {[
              { icon: '✅', title: 'Demande acceptée',            sub: 'Dossier complet et approuvé' },
              { icon: '✅', title: 'Caution sécurisée',           sub: GNF(loyer) + ' protégés sur Werdhe' },
              { icon: '✅', title: 'Bail signé',                  sub: 'Contrat disponible en PDF' },
              { icon: '🗝️', title: 'Accès accordé !',            sub: logement && (logement.titre || logement.nom), highlight: true },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '0.5px solid #F5F5F5' : 'none' }}>
                  <div style={{ width: 34, height: 34, background: item.highlight ? '#1B6B3A' : '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
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
              🔔 Votre premier loyer de <b>{GNF(loyer)}</b> sera dû le 1er du mois prochain.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
  <button onClick={function() {
    localStorage.setItem('dashboardOnglet', '/dashboard/documents');
    navigate('/dashboard');
  }}
    style={{ padding: 14, border: '0.5px solid #E0E0E0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div style={{ fontSize: 22 }}>📄</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>Documents</div>
  </button>
  <button onClick={function() {
    localStorage.setItem('dashboardOnglet', '/dashboard/messages');
    navigate('/dashboard');
  }}
    style={{ padding: 14, border: '0.5px solid #E0E0E0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div style={{ fontSize: 22 }}>💬</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>Messages</div>
  </button>
</div>
        </div>
      )}

      <div style={{ height: 30 }} />
    </div>
  );
}