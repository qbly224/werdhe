/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './Reserver.css';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

var STEPS = [
  { id: 1, label: 'Demande',   icon: '🔍' },
  { id: 2, label: 'Dossier',   icon: '📁' },
  { id: 3, label: 'Decision',  icon: '⚖️' },
  { id: 4, label: 'Echanges',  icon: '💬' },
  { id: 5, label: 'Caution',   icon: '🔒' },
  { id: 6, label: 'Bail & EDL',icon: '📝' },
  { id: 7, label: 'Acces',     icon: '🗝️' },
];

var PAY_OPTS = [
  { id: 'om',   label: 'Orange Money',     sub: 'Instantane',            color: '#FF6600', text: '#fff',     abbr: 'OM'  },
  { id: 'mtn',  label: 'MTN MoMo',         sub: 'Instantane',            color: '#FFCC00', text: '#1B2B22',  abbr: 'MM'  },
  { id: 'cash', label: 'Especes',           sub: 'Recu PDF genere auto',  icon: '💵' },
  { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank · UBA', icon: '🏦' },
];

var DOCS_DOSSIER = [
  { label: "Piece d'identite (CNI)",        sub: 'Photo recto-verso',          done: true,  badge: null },
  { label: 'Attestation de travail',        sub: 'Ou justificatif de revenus', done: true,  badge: null },
  { label: 'Fiche de paie (3 derniers mois)', sub: 'Appuyer pour ajouter',     done: false, badge: 'Recommande' },
  { label: 'Contact garant',               sub: 'Nom + numero de telephone',   done: false, badge: 'Optionnel' },
];

function Badge(props) {
  var palettes = {
    green:  { bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
    blue:   { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
    amber:  { bg: '#FFF8E1', color: '#7B4F00', border: '#FFE082' },
    purple: { bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
    red:    { bg: '#FFEBEE', color: '#B71C1C', border: '#FFCDD2' },
  };
  var s = palettes[props.color] || palettes.green;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '600',
      background: s.bg, color: s.color, border: '0.5px solid ' + s.border,
    }}>
      {props.children}
    </span>
  );
}

function Stepper(props) {
  var current = props.current;
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
      {STEPS.map(function(s, i) {
        var done   = s.id < current;
        var active = s.id === current;
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? '14px' : '11px', fontWeight: '700',
                background: done || active ? '#1B6B3A' : '#E0E0E0',
                color:      done || active ? '#fff'    : '#888',
                boxShadow:  active ? '0 0 0 4px #C8E6C9' : 'none',
                transition: 'all .3s', flexShrink: 0,
              }}>
                {done ? '✓' : s.id}
              </div>
              <div style={{
                fontSize: '10px', marginTop: '3px', whiteSpace: 'nowrap',
                color:      active ? '#1B6B3A' : '#999',
                fontWeight: active ? 700 : 400,
              }}>
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: '2px',
                background: done ? '#1B6B3A' : '#E0E0E0',
                minWidth: '12px', margin: '0 2px 16px',
                transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Reserver() {
  var { id } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();

  var [logement,       setLogement]       = useState(null);
  var [loading,        setLoading]        = useState(true);
  var [step,           setStep]           = useState(1);
  var [submitting,     setSubmitting]     = useState(false);
  var [reservationId,  setReservationId]  = useState(null);

  // Étape 1
  var [msgTexte,  setMsgTexte]  = useState('');
  var [dateDebut, setDateDebut] = useState('');
  var [duree,     setDuree]     = useState(12);

  // Étape 4 — chat
  var chatRef = useRef(null);
  var [msgs, setMsgs]     = useState([
    { from: 'proprio',  text: "Bonjour ! J'ai bien recu votre dossier. Nous pouvons organiser une visite.", heure: '09:45' },
    { from: 'locataire',text: 'Merci ! Je suis disponible samedi matin.', heure: '09:52' },
  ]);
  var [newMsg, setNewMsg] = useState('');

  // Étape 5 — caution
  var [payMode,   setPayMode]   = useState('om');
  var [payDone,   setPayDone]   = useState(false);

  // Étape 6 — bail
  var [signed,    setSigned]    = useState(false);

  useEffect(function() {
    api.get('/logements/' + id)
      .then(function(res) { setLogement(res.data.logement); })
      .catch(function()   { toast.error('Logement non trouve'); navigate('/logements'); })
      .finally(function() { setLoading(false); });
  }, [id]);

  function sendMsg() {
    if (!newMsg.trim()) return;
    var now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setMsgs(function(prev) { return prev.concat({ from: 'locataire', text: newMsg, heure: now }); });
    setNewMsg('');
    setTimeout(function() {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 50);
  }

  function creerReservation() {
    if (!dateDebut) { toast.error("Selectionnez une date d'entree"); return; }
    setSubmitting(true);
    api.post('/reservations', {
      logement_id:  id,
      date_debut:   dateDebut,
      type_location:'longue_duree',
      duree_mois:   duree,
    })
      .then(function(res) {
        setReservationId(res.data.reservation.id);
        toast.success('Demande envoyee au proprietaire !');
        setStep(2);
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur reservation');
      })
      .finally(function() { setSubmitting(false); });
  }

  function validerCaution() {
    setPayDone(true);
    setTimeout(function() { setStep(6); }, 1200);
  }

  function signerBail() {
    setSigned(true);
    toast.success('Bail signe electroniquement !');
  }

  function finaliserBail() {
    if (!signed) { toast.error('Signez le bail avant de continuer'); return; }
    if (reservationId) {
      api.post('/documents/signer-bail', { reservation_id: reservationId }).catch(console.error);
    }
    setStep(7);
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>Chargement...</div>
      </div>
    );
  }

  var loyer = logement ? Number(logement.prix_mensuel) : 0;
  var propNom = logement ? (logement.proprietaire_prenom + ' ' + logement.proprietaire_nom) : 'Proprietaire';
  var propInitiales = logement
    ? ((logement.proprietaire_prenom || '').charAt(0) + (logement.proprietaire_nom || '').charAt(0)).toUpperCase()
    : 'P';

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#F7F8F7', minHeight: '100vh' }}>

        {/* HEADER */}
        <div style={{ background: '#1B6B3A', borderRadius: '14px', padding: '14px 18px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>🏠 Flux de reservation</div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px', marginTop: '2px' }}>Etape {step} / 7</div>
          </div>
          {logement && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{GNF(loyer)}</div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '11px' }}>par mois</div>
            </div>
          )}
        </div>

        <Stepper current={step} />

        {/* ── ÉTAPE 1 ── */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="green">🔍 Etape 1 · Cote locataire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Demande de reservation</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Envoyez votre demande. Aucun paiement requis a cette etape.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>

              {logement && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '72px', height: '60px', background: '#E8F5E9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🏠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B2B22' }}>{logement.titre}</div>
                      <div style={{ fontSize: '12px', color: '#888', margin: '3px 0' }}>📍 {logement.adresse}, {logement.ville}</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B6B3A' }}>{GNF(loyer)} / mois</div>
                    </div>
                    <Badge color="green">Disponible</Badge>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {logement.nb_chambres > 0 && <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{logement.nb_chambres} chambre(s)</span>}
                    {logement.superficie && <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{logement.superficie} m2</span>}
                    {logement.ville && <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{logement.ville}</span>}
                  </div>

                  <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: '600' }}>Proprietaire</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700' }}>{propInitiales}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B2B22' }}>{propNom}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Repond en general sous 2h</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Message au proprietaire</div>
                <textarea
                  value={msgTexte}
                  onChange={function(e) { setMsgTexte(e.target.value); }}
                  placeholder="Bonjour, je suis interesse(e) par votre logement. Je suis..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid #E0E0E0', fontSize: '13px', resize: 'none', height: '70px', fontFamily: 'system-ui', margin: 0 }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Date d'emmenagement souhaitee *</div>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={function(e) { setDateDebut(e.target.value); }}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ padding: '9px 12px', borderRadius: '10px', border: '0.5px solid #E0E0E0', fontSize: '13px', width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Duree souhaitee</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {[[1,'1 mois'],[3,'3 mois'],[6,'6 mois'],[12,'1 an'],[24,'2 ans']].map(function(opt) {
                    return (
                      <button key={opt[0]} type="button" onClick={function() { setDuree(opt[0]); }}
                        style={{ padding: '8px 4px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
                          border:      duree === opt[0] ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0',
                          background:  duree === opt[0] ? '#E8F5E9' : '#FAFAFA',
                          color:       duree === opt[0] ? '#1B5E20' : '#555',
                          fontWeight:  duree === opt[0] ? 700 : 400,
                        }}>
                        {opt[1]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="button"
                onClick={creerReservation}
                disabled={submitting || !user}
                style={{ background: submitting ? '#999' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {!user ? 'Connectez-vous pour reserver' : submitting ? 'Envoi en cours...' : '📤 Envoyer ma demande de reservation'}
              </button>
            </div>

            <div style={{ padding: '10px 14px', background: '#FFF8E1', borderRadius: '10px', display: 'flex', gap: '8px' }}>
              <span style={{ flexShrink: 0 }}>ℹ️</span>
              <span style={{ fontSize: '12px', color: '#7B4F00', lineHeight: '1.5' }}>Aucun paiement requis a cette etape. La demande est gratuite. Le proprietaire a 48h pour repondre.</span>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 ── */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="green">📁 Etape 2 · Cote locataire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Constitution du dossier</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Un dossier complet augmente vos chances d'obtenir le logement.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Documents a fournir</div>
                <Badge color="amber">2 / 4 completes</Badge>
              </div>
              <div style={{ background: '#E0E0E0', borderRadius: '4px', height: '6px', marginBottom: '14px', overflow: 'hidden' }}>
                <div style={{ background: '#1B6B3A', width: '50%', height: '100%', borderRadius: '4px' }} />
              </div>
              {DOCS_DOSSIER.map(function(d, i) {
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                    border:      d.done ? '1.5px solid #A5D6A7' : '0.5px dashed #CCC',
                    background:  d.done ? '#F0FBF0' : '#FAFAFA',
                    borderRadius:'10px', marginBottom: '8px', cursor: 'pointer',
                  }}>
                    <div style={{ width: '34px', height: '34px', background: d.done ? '#E8F5E9' : '#F0F0F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {d.done ? '📄' : '📎'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: d.done ? '#1B2B22' : '#888' }}>{d.label}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>{d.sub}</div>
                    </div>
                    {d.done
                      ? <span style={{ color: '#1B6B3A', fontSize: '18px' }}>✅</span>
                      : d.badge && <Badge color={d.badge === 'Recommande' ? 'amber' : 'green'}>{d.badge}</Badge>
                    }
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={function() { setStep(1); }}
                style={{ background: '#F5F5F5', color: '#555', border: 'none', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', cursor: 'pointer' }}>
                Retour
              </button>
              <button type="button" onClick={function() { setStep(3); }}
                style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                📤 Envoyer le dossier au proprietaire
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 ── */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="blue">🏠 Etape 3 · Cote proprietaire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Examen de la demande</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Le proprietaire examine le dossier et prend une decision.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '12px' }}>Demande recue</div>

              <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: '#1A4FA0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                      {user ? ((user.prenom || '').charAt(0) + (user.nom || '').charAt(0)).toUpperCase() : 'LC'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{user ? user.prenom + ' ' + user.nom : 'Locataire'}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>Conakry, Guinee</div>
                    </div>
                  </div>
                  <Badge color="green">Score 4.5</Badge>
                </div>

                {msgTexte && (
                  <div style={{ fontSize: '12px', color: '#555', fontStyle: 'italic', background: '#fff', padding: '8px', borderRadius: '8px', marginBottom: '10px', lineHeight: '1.5' }}>
                    "{msgTexte}"
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#666' }}><strong>Emmenagement :</strong> {dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : 'N/A'}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}><strong>Duree :</strong> {duree} mois</div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Badge color="green">CNI</Badge>
                  <Badge color="green">Attestation emploi</Badge>
                  <Badge color="amber">Fiche paie manquante</Badge>
                </div>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Votre decision :</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button"
                  onClick={function() { toast.success('Demande acceptee ! Locataire notifie par SMS.'); setStep(4); }}
                  style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Accepter
                </button>
                <button type="button"
                  onClick={function() { toast.success('Message envoye au locataire.'); setStep(4); }}
                  style={{ flex: 1, background: '#FFF8E1', color: '#7B4F00', border: '0.5px solid #FFE082', borderRadius: '10px', padding: '11px 8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Demander infos
                </button>
                <button type="button"
                  onClick={function() { toast.error('Demande refusee. Locataire notifie.'); navigate('/logements'); }}
                  style={{ flex: 1, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: '10px', padding: '11px 8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Refuser
                </button>
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: '#F0F0F0', borderRadius: '10px', fontSize: '12px', color: '#666' }}>
              🔔 Le locataire est notifie instantanement de votre decision par SMS.
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 ── */}
        {step === 4 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="purple">💬 Etape 4 · Les deux parties</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Echanges et finalisation des conditions</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Discutez des details : caution, date d'entree, regles. Partagez photos et documents.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.05)', marginBottom: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px' }}>{propInitiales}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{propNom}</div>
                  <div style={{ fontSize: '11px', color: '#1B6B3A', fontWeight: '600' }}>🟢 En ligne</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '18px', cursor: 'pointer' }}>📞</span>
                  <span style={{ fontSize: '18px', cursor: 'pointer' }}>📎</span>
                </div>
              </div>

              <div ref={chatRef} style={{ padding: '14px 16px', minHeight: '200px', maxHeight: '280px', overflowY: 'auto' }}>
                {msgs.map(function(m, i) {
                  var isLoc = m.from === 'locataire';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isLoc ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{
                          padding: '9px 13px',
                          borderRadius: isLoc ? '12px 12px 0 12px' : '12px 12px 12px 0',
                          background: isLoc ? '#E3F2FD' : '#F5F5F5',
                          color:      isLoc ? '#0D47A1'  : '#1B2B22',
                          fontSize: '13px', lineHeight: '1.5',
                        }}>
                          {m.text}
                        </div>
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', textAlign: isLoc ? 'right' : 'left' }}>{m.heure}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: '10px 14px', borderTop: '0.5px solid #F0F0F0', display: 'flex', gap: '8px' }}>
                <input
                  value={newMsg}
                  onChange={function(e) { setNewMsg(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') sendMsg(); }}
                  placeholder="Ecrire un message..."
                  style={{ flex: 1, padding: '9px 14px', borderRadius: '20px', border: '0.5px solid #E0E0E0', background: '#F8F8F8', fontSize: '13px', margin: 0 }}
                />
                <button type="button" onClick={sendMsg}
                  style={{ width: '36px', height: '36px', background: '#1B6B3A', border: 'none', borderRadius: '50%', color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0 }}>
                  ➤
                </button>
              </div>
            </div>

            <button type="button" onClick={function() { setStep(5); }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              ✅ Conditions acceptees — Passer au versement de la caution
            </button>
          </div>
        )}

        {/* ── ÉTAPE 5 ── */}
        {step === 5 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="green">🔒 Etape 5 · Cote locataire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Versement de la caution</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Securisee sur Werdhe, liberee au proprietaire uniquement apres signature du bail.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ background: '#F0F4F1', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Montant de la caution</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>Equivalent a 1 mois de loyer · Remboursable</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1B6B3A' }}>{GNF(loyer)}</div>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Mode de paiement</div>
              {PAY_OPTS.map(function(p) {
                return (
                  <div key={p.id} onClick={function() { setPayMode(p.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px',
                      border:     payMode === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0',
                      background: payMode === p.id ? '#E8F5E9' : '#fff',
                      borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', transition: 'all .2s',
                    }}>
                    <div style={{
                      width: '36px', height: '36px',
                      background: p.color || '#E8F5E9',
                      borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: p.icon ? '18px' : '12px', fontWeight: '700',
                      color: p.text || '#1B6B3A', flexShrink: 0,
                    }}>
                      {p.icon || p.abbr}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.label}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{p.sub}</div>
                    </div>
                    {payMode === p.id && <span style={{ color: '#1B6B3A', fontSize: '18px' }}>✅</span>}
                  </div>
                );
              })}
            </div>

            {payDone ? (
              <div style={{ background: '#E8F5E9', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontWeight: '700', color: '#1B6B3A' }}>Caution payee avec succes !</div>
                <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px' }}>Passage a la signature du bail...</div>
              </div>
            ) : (
              <button type="button" onClick={validerCaution}
                style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' }}>
                🔒 Payer la caution — {GNF(loyer)}
              </button>
            )}

            {!payDone && (
              <div style={{ padding: '10px 14px', background: '#E8F5E9', borderRadius: '10px', display: 'flex', gap: '8px' }}>
                <span>🛡️</span>
                <span style={{ fontSize: '12px', color: '#1B5E20', lineHeight: '1.5' }}>Votre caution est securisee sur Werdhe jusqu'a la signature du bail et l'etat des lieux.</span>
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 6 ── */}
        {step === 6 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="purple">📝 Etape 6 · Les deux parties</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Signature du bail et etat des lieux</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Bail genere automatiquement. Signez numeriquement et realisez l'etat des lieux d'entree avec photos.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#E3F2FD', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📄</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Contrat de bail</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>Bail_Werdhe_{new Date().getFullYear()}.pdf</div>
                  </div>
                </div>
                <Badge color="amber">A signer</Badge>
              </div>

              <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '10px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  ['Locataire',   user ? user.prenom + ' ' + user.nom : 'N/A'],
                  ['Proprietaire',propNom],
                  ['Bien',        logement ? logement.titre : 'N/A'],
                  ['Loyer',       GNF(loyer) + '/mois'],
                  ['Debut',       dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : 'N/A'],
                  ['Duree',       duree + ' mois renouvelable'],
                  ['Loyer du le', '1er de chaque mois'],
                ].map(function(row) {
                  return <div key={row[0]} style={{ fontSize: '11px', color: '#666' }}><strong>{row[0]} :</strong> {row[1]}</div>;
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '12px', border: '0.5px solid #E0E0E0', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Signature Proprietaire</div>
                  <div style={{ fontStyle: 'italic', color: '#1B6B3A', borderBottom: '0.5px solid #E0E0E0', paddingBottom: '6px', marginBottom: '6px', fontSize: '14px' }}>{propNom} ✓</div>
                  <Badge color="green">Signe · 11:30</Badge>
                </div>

                <div onClick={function() { if (!signed) signerBail(); }}
                  style={{ padding: '12px', border: signed ? '1.5px solid #1A4FA0' : '1.5px dashed #1A4FA0', background: signed ? '#E3F2FD' : '#F0F7FF', borderRadius: '10px', textAlign: 'center', cursor: signed ? 'default' : 'pointer' }}>
                  {signed ? (
                    <div>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Signature Locataire</div>
                      <div style={{ fontStyle: 'italic', color: '#1A4FA0', borderBottom: '0.5px solid #90CAF9', paddingBottom: '6px', marginBottom: '6px', fontSize: '14px' }}>{user ? user.prenom + ' ' + user.nom : 'Locataire'} ✓</div>
                      <Badge color="blue">Signe</Badge>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '11px', color: '#1A4FA0', marginBottom: '6px' }}>Signature Locataire</div>
                      <div style={{ fontSize: '24px' }}>✍️</div>
                      <div style={{ fontSize: '11px', color: '#1A4FA0', marginTop: '4px' }}>Appuyer pour signer</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '0.5px solid #F0F0F0', paddingTop: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>📋 Etat des lieux d'entree</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <Badge color="green">Salon — Bon etat</Badge>
                  <Badge color="green">Chambres — Bon etat</Badge>
                  <Badge color="amber">Cuisine — Legere usure</Badge>
                  <Badge color="green">Salle de bain — Bon etat</Badge>
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>📸 8 photos jointes · Signe par les deux parties</div>
              </div>
            </div>

            <button type="button" onClick={finaliserBail}
              style={{ width: '100%', background: signed ? '#1B6B3A' : '#999', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: signed ? 'pointer' : 'not-allowed' }}>
              {signed ? '🗝️ Bail signe — Passer a la remise des cles' : '✍️ Signez d\'abord le bail pour continuer'}
            </button>
          </div>
        )}

        {/* ── ÉTAPE 7 ── */}
        {step === 7 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ width: '72px', height: '72px', background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '36px' }}>🗝️</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1B6B3A', marginBottom: '6px' }}>Felicitations {user ? user.prenom : ''} ! 🎉</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                Vous avez officiellement acces a votre nouveau logement.
                Tous vos documents sont disponibles dans votre espace personnel.
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '14px' }}>Recapitulatif de votre installation</div>
              {[
                { icon: '✅', title: 'Demande envoyee et acceptee',     sub: 'Dossier complet · Profil verifie' },
                { icon: '✅', title: 'Caution versee et securisee',      sub: GNF(loyer) + ' · ' + (PAY_OPTS.find(function(p) { return p.id === payMode; }) || {}).label },
                { icon: '✅', title: 'Bail signe electroniquement',      sub: 'Contrat ' + duree + ' mois · PDF disponible' },
                { icon: '✅', title: 'Etat des lieux d\'entree realise', sub: '8 photos · Signe par les deux parties' },
                { icon: '🗝️',title: 'Cles remises · Acces accorde',     sub: (logement ? logement.titre : '') + ' · ' + (dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : 'Aujourd\'hui'), highlight: true },
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < 4 ? '0.5px solid #F5F5F5' : 'none' }}>
                    <div style={{ width: '34px', height: '34px', background: item.highlight ? '#1B6B3A' : '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: item.highlight ? '#1B6B3A' : '#1B2B22' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {[['📄','Telecharger le bail'],['💬','Contacter le proprio'],['📋','Mes documents'],['🔔','Alertes loyer']].map(function(item) {
                return (
                  <div key={item[1]} onClick={function() { navigate('/dashboard'); }}
                    style={{ padding: '14px', border: '0.5px solid #E0E0E0', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: '#fff' }}>
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item[0]}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1B2B22' }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '12px 14px', background: '#E8F5E9', borderRadius: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#1B5E20', lineHeight: '1.5' }}>
                🔔 Votre premier loyer de <strong>{GNF(loyer)}</strong> sera du le <strong>1er du mois prochain</strong>.
                Vous recevrez un rappel SMS 3 jours avant.
              </div>
            </div>

            <button type="button" onClick={function() { navigate('/dashboard'); }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Acceder a mon espace locataire
            </button>
          </div>
        )}

      </div>
    </div>
  );
}