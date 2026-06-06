/* eslint-disable */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import ModalPaiementMobile from '../components/ModalPaiementMobile';
import './Reserver.css';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

var STEPS = [
  { id: 1, label: 'Demande', icon: '🔍' },
  { id: 2, label: 'Dossier', icon: '📁' },
  { id: 3, label: 'Decision', icon: '⚖️' },
  { id: 4, label: 'Echanges', icon: '💬' },
  { id: 5, label: 'Caution', icon: '🔒' },
  { id: 6, label: 'Bail & EDL', icon: '📝' },
  { id: 7, label: 'Acces', icon: '🗝️' }
];

var PAY_OPTS = [
  { id: 'om', label: 'Orange Money', sub: 'Instantane', color: '#FF6600', text: '#fff', abbr: 'OM' },
  { id: 'mtn', label: 'MTN MoMo', sub: 'Instantane', color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
  { id: 'cash', label: 'Especes', sub: 'Recu PDF genere', icon: '💵' },
  { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank', icon: '🏦' }
];

export default function Reserver() {
  var { id } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();

  var [logement, setLogement] = useState(null);
  var [loading, setLoading] = useState(true);
  var [step, setStep] = useState(1);
  var [signed, setSigned] = useState(false);
  var [selectedPay, setSelectedPay] = useState('om');
  var [showModalPaiement, setShowModalPaiement] = useState(false);
  var [reservationCreee, setReservationCreee] = useState(null);
  var [submitting, setSubmitting] = useState(false);
  var [message, setMessage] = useState('');
  var [dateDebut, setDateDebut] = useState('');
  var [dureeMois, setDureeMois] = useState(12);
  var [msgs, setMsgs] = useState([
    { from: 'proprio', text: 'Bonjour ! J\'ai bien recu votre demande. Quand souhaitez-vous visiter ?', heure: '09:45' },
    { from: 'locataire', text: 'Merci ! Je suis disponible ce samedi matin si possible.', heure: '09:52' }
  ]);
  var [newMsg, setNewMsg] = useState('');

  useEffect(function() {
    api.get('/logements/' + id)
      .then(function(res) { setLogement(res.data.logement); })
      .catch(function() { toast.error('Logement non trouve'); navigate('/logements'); })
      .finally(function() { setLoading(false); });
  }, [id]);

  function sendMsg() {
    if (!newMsg.trim()) return;
    var heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setMsgs(function(prev) { return prev.concat({ from: 'locataire', text: newMsg, heure: heure }); });
    setNewMsg('');
  }

  function creerReservation() {
    if (!dateDebut) { toast.error('Selectionnez une date d\'entree'); return; }
    setSubmitting(true);
    api.post('/reservations', {
      logement_id: id,
      date_debut: dateDebut,
      type_location: 'longue_duree',
      duree_mois: dureeMois
    })
      .then(function(res) {
        var resa = res.data.reservation;
        if (logement) {
          resa.logement_titre = logement.titre;
          resa.montant_total = Number(logement.prix_mensuel);
        }
        setReservationCreee(resa);
        toast.success('Demande envoyee au proprietaire !');
        setStep(2);
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur reservation');
      })
      .finally(function() { setSubmitting(false); });
  }

  function Stepper() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {STEPS.map(function(s, i) {
          var estFait = s.id < step;
          var estActif = s.id === step;
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                onClick={function() { if (s.id <= step) setStep(s.id); }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: estFait ? '14px' : '11px', fontWeight: '700',
                  background: estFait || estActif ? '#1B6B3A' : '#E0E0E0',
                  color: estFait || estActif ? '#fff' : '#888',
                  boxShadow: estActif ? '0 0 0 4px #C8E6C9' : 'none',
                  transition: 'all 0.3s', flexShrink: 0
                }}>
                  {estFait ? '✓' : s.id}
                </div>
                <div style={{ fontSize: '10px', color: estActif ? '#1B6B3A' : '#999', marginTop: '3px', whiteSpace: 'nowrap', fontWeight: estActif ? 700 : 400 }}>
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: estFait ? '#1B6B3A' : '#E0E0E0', minWidth: '12px', margin: '0 2px 16px', transition: 'background 0.3s' }} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function Badge(bprops) {
    var colors = {
      green: { bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
      blue: { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
      amber: { bg: '#FFF8E1', color: '#7B4F00', border: '#FFE082' },
      purple: { bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
      red: { bg: '#FFEBEE', color: '#B71C1C', border: '#FFCDD2' }
    };
    var s = colors[bprops.color] || colors.green;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color, border: '0.5px solid ' + s.border }}>
        {bprops.children}
      </span>
    );
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

        <div style={{ background: '#1B6B3A', borderRadius: '14px', padding: '14px 18px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
              {logement ? logement.titre : 'Reservation'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>
              Etape {step} / 7
            </div>
          </div>
          {logement && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{GNF(logement.prix_mensuel)}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>par mois</div>
            </div>
          )}
        </div>

        <Stepper />

        {step === 1 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="green">Etape 1 · Cote locataire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Demande de reservation</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Envoyez votre demande au proprietaire. Aucun paiement requis a cette etape.</div>
            </div>

            {logement && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '72px', height: '60px', background: '#E8F5E9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🏠</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B2B22' }}>{logement.titre}</div>
                    <div style={{ fontSize: '12px', color: '#888', margin: '3px 0' }}>📍 {logement.adresse}, {logement.ville}</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B6B3A' }}>{GNF(logement.prix_mensuel)} / mois</div>
                  </div>
                  <Badge color="green">Disponible</Badge>
                </div>

                {logement.nb_chambres > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {logement.nb_chambres > 0 && <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{logement.nb_chambres} chambre(s)</span>}
                    {logement.nb_salles_bain > 0 && <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{logement.nb_salles_bain} salle(s) de bain</span>}
                    {logement.superficie && <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{logement.superficie} m2</span>}
                  </div>
                )}

                <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: '600' }}>Proprietaire</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700' }}>
                      {logement.proprietaire_prenom ? logement.proprietaire_prenom.charAt(0) : 'P'}
                      {logement.proprietaire_nom ? logement.proprietaire_nom.charAt(0) : ''}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B2B22' }}>{logement.proprietaire_prenom} {logement.proprietaire_nom}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>Repond en general sous 2h</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Message au proprietaire</div>
                  <textarea
                    value={message}
                    onChange={function(e) { setMessage(e.target.value); }}
                    placeholder="Bonjour, je suis interesse(e) par votre logement..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid #E0E0E0', fontSize: '13px', resize: 'none', height: '70px', fontFamily: 'system-ui', margin: 0 }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Date d\'entree souhaitee *</div>
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
                        <button
                          key={opt[0]}
                          type="button"
                          onClick={function() { setDureeMois(opt[0]); }}
                          style={{
                            padding: '8px 4px', borderRadius: '8px', fontSize: '11px',
                            border: dureeMois === opt[0] ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0',
                            background: dureeMois === opt[0] ? '#E8F5E9' : '#FAFAFA',
                            color: dureeMois === opt[0] ? '#1B5E20' : '#555',
                            fontWeight: dureeMois === opt[0] ? 700 : 400, cursor: 'pointer'
                          }}
                        >
                          {opt[1]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={creerReservation}
                  disabled={submitting || !user}
                  style={{
                    background: submitting ? '#999' : '#1B6B3A',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    padding: '12px', width: '100%', fontSize: '14px',
                    fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                  type="button"
                >
                  {!user ? 'Connectez-vous pour reserver' : submitting ? 'Envoi...' : 'Envoyer ma demande de reservation'}
                </button>
              </div>
            )}

            <div style={{ padding: '10px 14px', background: '#FFF8E1', borderRadius: '10px', display: 'flex', gap: '8px' }}>
              <span>ℹ️</span>
              <span style={{ fontSize: '12px', color: '#7B4F00', lineHeight: '1.5' }}>
                Aucun paiement requis a cette etape. La demande est gratuite. Le proprietaire a 48h pour repondre.
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="green">Etape 2 · Cote locataire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Constitution du dossier</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Un dossier complet augmente vos chances d'obtenir le logement.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Documents a fournir</div>
                <Badge color="amber">2/4 completes</Badge>
              </div>
              <div style={{ background: '#E0E0E0', borderRadius: '4px', height: '6px', marginBottom: '14px', overflow: 'hidden' }}>
                <div style={{ background: '#1B6B3A', width: '50%', height: '100%', borderRadius: '4px' }} />
              </div>
              {[
                { label: "Piece d'identite (CNI)", sub: 'Photo recto-verso', done: true },
                { label: 'Attestation de travail', sub: 'Ou tout justificatif de revenus', done: true },
                { label: 'Fiche de paie (3 derniers mois)', sub: 'Appuyer pour ajouter', done: false, badge: 'Recommande' },
                { label: 'Contact garant', sub: 'Nom + numero de telephone', done: false, badge: 'Optionnel' }
              ].map(function(d, i) {
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                    border: d.done ? '1.5px solid #A5D6A7' : '0.5px dashed #CCC',
                    background: d.done ? '#F0FBF0' : '#FAFAFA',
                    borderRadius: '10px', marginBottom: '8px', cursor: 'pointer'
                  }}>
                    <div style={{ width: '34px', height: '34px', background: d.done ? '#E8F5E9' : '#F0F0F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {d.done ? '📄' : '📎'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: d.done ? '#1B2B22' : '#888' }}>{d.label}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>{d.sub}</div>
                    </div>
                    {d.done ? <span style={{ color: '#1B6B3A', fontSize: '18px' }}>✅</span> : d.badge && <Badge color={d.badge === 'Recommande' ? 'amber' : 'green'}>{d.badge}</Badge>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={function() { setStep(1); }} style={{ background: '#F5F5F5', color: '#555', border: 'none', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', cursor: 'pointer' }} type="button">Retour</button>
              <button onClick={function() { setStep(3); }} style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }} type="button">
                Envoyer le dossier au proprietaire
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="blue">Etape 3 · Cote proprietaire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Examen de la demande</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Le proprietaire examine votre dossier et prend une decision.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: '#1A4FA0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                      {user ? (user.prenom || '').charAt(0) + (user.nom || '').charAt(0) : 'LC'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{user ? user.prenom + ' ' + user.nom : 'Locataire'}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>Conakry, Guinee</div>
                    </div>
                  </div>
                  <Badge color="green">Score 4.5</Badge>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Badge color="green">CNI</Badge>
                  <Badge color="green">Attestation emploi</Badge>
                  <Badge color="amber">Fiche paie manquante</Badge>
                </div>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Decision du proprietaire :</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={function() { toast.success('Demande acceptee !'); setStep(4); }} style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }} type="button">Accepter</button>
                <button onClick={function() { setStep(4); }} style={{ flex: 1, background: '#FFF8E1', color: '#7B4F00', border: '0.5px solid #FFE082', borderRadius: '10px', padding: '11px 8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} type="button">Demander infos</button>
                <button onClick={function() { toast.error('Demande refusee'); navigate('/logements'); }} style={{ flex: 1, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: '10px', padding: '11px 8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} type="button">Refuser</button>
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: '#F0F0F0', borderRadius: '10px', fontSize: '12px', color: '#666' }}>
              Le locataire est notifie instantanement de votre decision par SMS.
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="purple">Etape 4 · Les deux parties</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Echanges et finalisation</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Discutez des details : caution, date d'entree, regles. Partagez photos et documents.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                  {logement ? (logement.proprietaire_prenom || 'P').charAt(0) + (logement.proprietaire_nom || '').charAt(0) : 'P'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{logement ? logement.proprietaire_prenom + ' ' + logement.proprietaire_nom : 'Proprietaire'}</div>
                  <div style={{ fontSize: '11px', color: '#1B6B3A', fontWeight: '600' }}>En ligne</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '18px', cursor: 'pointer' }}>📞</span>
                  <span style={{ fontSize: '18px', cursor: 'pointer' }}>📎</span>
                </div>
              </div>
              <div style={{ padding: '14px 16px', minHeight: '180px', maxHeight: '260px', overflowY: 'auto' }}>
                {msgs.map(function(m, i) {
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: m.from === 'locataire' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{
                          padding: '9px 13px',
                          borderRadius: m.from === 'locataire' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                          background: m.from === 'locataire' ? '#E3F2FD' : '#F5F5F5',
                          color: m.from === 'locataire' ? '#0D47A1' : '#1B2B22',
                          fontSize: '13px', lineHeight: '1.5'
                        }}>
                          {m.text}
                        </div>
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', textAlign: m.from === 'locataire' ? 'right' : 'left' }}>{m.heure}</div>
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
                <button onClick={sendMsg} type="button" style={{ width: '36px', height: '36px', background: '#1B6B3A', border: 'none', borderRadius: '50%', color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0 }}>➤</button>
              </div>
            </div>

            <button
              onClick={function() { setStep(5); }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
              type="button"
            >
              Conditions acceptees — Passer au versement de la caution
            </button>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="green">Etape 5 · Cote locataire</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Versement de la caution</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Securisee sur Werdhe, liberee au proprietaire apres signature du bail.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#F0F4F1', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Montant de la caution</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>Equivalent a 1 mois de loyer · Remboursable</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1B6B3A' }}>
                  {logement ? GNF(logement.prix_mensuel) : '—'}
                </div>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Mode de paiement</div>
              {PAY_OPTS.map(function(p) {
                return (
                  <div
                    key={p.id}
                    onClick={function() { setSelectedPay(p.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 12px',
                      border: selectedPay === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0',
                      background: selectedPay === p.id ? '#E8F5E9' : '#fff',
                      borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px',
                      background: p.color || '#E8F5E9',
                      borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: p.icon ? '18px' : '12px', fontWeight: '700',
                      color: p.text || '#1B6B3A', flexShrink: 0
                    }}>
                      {p.icon || p.abbr}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.label}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{p.sub}</div>
                    </div>
                    {selectedPay === p.id && <span style={{ color: '#1B6B3A', fontSize: '18px' }}>✅</span>}
                  </div>
                );
              })}
            </div>

            <button
              onClick={function() {
                if (reservationCreee) {
                  setShowModalPaiement(true);
                } else {
                  toast.success('Caution enregistree !');
                  setStep(6);
                }
              }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' }}
              type="button"
            >
              Payer la caution — {logement ? GNF(logement.prix_mensuel) : ''}
            </button>

            <div style={{ padding: '10px 14px', background: '#E8F5E9', borderRadius: '10px', display: 'flex', gap: '8px' }}>
              <span>🛡️</span>
              <span style={{ fontSize: '12px', color: '#1B5E20', lineHeight: '1.5' }}>
                Votre caution est securisee sur Werdhe jusqu'a la signature du bail et l'etat des lieux.
              </span>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <Badge color="purple">Etape 6 · Les deux parties</Badge>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22', marginTop: '8px' }}>Signature du bail et etat des lieux</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>Le bail est genere automatiquement. Signez et realisez l'etat des lieux d'entree.</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
                  ['Locataire', user ? user.prenom + ' ' + user.nom : 'N/A'],
                  ['Proprietaire', logement ? logement.proprietaire_prenom + ' ' + logement.proprietaire_nom : 'N/A'],
                  ['Bien', logement ? logement.titre : 'N/A'],
                  ['Loyer', logement ? GNF(logement.prix_mensuel) + '/mois' : 'N/A'],
                  ['Debut', dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : 'N/A'],
                  ['Duree', dureeMois + ' mois renouvelable'],
                  ['Loyer du le', '1er de chaque mois']
                ].map(function(row) {
                  return <div key={row[0]} style={{ fontSize: '11px', color: '#666' }}><strong>{row[0]} :</strong> {row[1]}</div>;
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '12px', border: '0.5px solid #E0E0E0', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Signature Proprietaire</div>
                  <div style={{ fontStyle: 'italic', color: '#1B6B3A', borderBottom: '0.5px solid #E0E0E0', paddingBottom: '6px', marginBottom: '6px', fontSize: '14px' }}>
                    {logement ? logement.proprietaire_prenom + ' ' + logement.proprietaire_nom : 'Proprietaire'} ✓
                  </div>
                  <Badge color="green">Signe</Badge>
                </div>
                <div
                  onClick={function() { setSigned(true); toast.success('Bail signe !'); }}
                  style={{ padding: '12px', border: signed ? '1.5px solid #1A4FA0' : '1.5px dashed #1A4FA0', background: signed ? '#E3F2FD' : '#F0F7FF', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}
                >
                  {signed ? (
                    <div>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Signature Locataire</div>
                      <div style={{ fontStyle: 'italic', color: '#1A4FA0', borderBottom: '0.5px solid #90CAF9', paddingBottom: '6px', marginBottom: '6px', fontSize: '14px' }}>
                        {user ? user.prenom + ' ' + user.nom : 'Locataire'} ✓
                      </div>
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
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Etat des lieux d'entree</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <Badge color="green">Salon — Bon etat</Badge>
                  <Badge color="green">Chambres — Bon etat</Badge>
                  <Badge color="amber">Cuisine — Legere usure</Badge>
                  <Badge color="green">Salle de bain — Bon etat</Badge>
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>Photos jointes · Signe par les deux parties</div>
              </div>
            </div>

            <button
              onClick={function() {
                if (signed) {
                  if (reservationCreee) {
                    api.post('/documents/signer-bail', { reservation_id: reservationCreee.id })
                      .then(function() { toast.success('Bail signe ! Acces au logement accorde.'); setStep(7); })
                      .catch(function() { setStep(7); });
                  } else {
                    setStep(7);
                  }
                } else {
                  toast.error('Vous devez signer le bail pour continuer');
                }
              }}
              style={{
                width: '100%', background: signed ? '#1B6B3A' : '#999',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '13px', fontSize: '14px', fontWeight: '700',
                cursor: signed ? 'pointer' : 'not-allowed'
              }}
              type="button"
            >
              {signed ? 'Bail signe — Passer a la remise des cles' : 'Signez d\'abord le bail pour continuer'}
            </button>
          </div>
        )}

        {step === 7 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ width: '72px', height: '72px', background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '36px' }}>🗝️</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1B6B3A', marginBottom: '6px' }}>
                Felicitations {user ? user.prenom : ''} !
              </div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                Vous avez officiellement acces a votre nouveau logement.
                Tous vos documents sont disponibles dans votre espace.
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {[
                { icon: '✅', title: 'Demande envoyee et acceptee', sub: 'Dossier complet · Profil verifie' },
                { icon: '✅', title: 'Caution versee et securisee', sub: logement ? GNF(logement.prix_mensuel) + ' · Securise' : '' },
                { icon: '✅', title: 'Bail signe', sub: 'Contrat ' + dureeMois + ' mois · PDF disponible' },
                { icon: '✅', title: 'Etat des lieux d\'entree realise', sub: 'Photos jointes · Signe par les deux parties' },
                { icon: '🗝️', title: 'Cles remises · Acces accorde', sub: (dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : 'Aujourd\'hui') + ' · ' + (logement ? logement.titre : ''), highlight: true }
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < 4 ? '0.5px solid #F5F5F5' : 'none' }}>
                    <div style={{ width: '34px', height: '34px', background: item.highlight ? '#1B6B3A' : '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: item.highlight ? '#1B6B3A' : '#1B2B22' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {[['📄','Telecharger le bail'],['💬','Contacter le proprio'],['📋','Mes documents'],['🔔','Mes alertes loyer']].map(function(item) {
                return (
                  <div
                    key={item[1]}
                    onClick={function() { navigate('/dashboard'); }}
                    style={{ padding: '14px', border: '0.5px solid #E0E0E0', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: '#fff' }}
                  >
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item[0]}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1B2B22' }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>

            {logement && (
              <div style={{ padding: '12px 14px', background: '#E8F5E9', borderRadius: '10px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#1B5E20', lineHeight: '1.5' }}>
                  Votre premier loyer de <strong>{GNF(logement.prix_mensuel)}</strong> sera du le <strong>1er du mois prochain</strong>.
                  Vous recevrez un rappel SMS 3 jours avant.
                </div>
              </div>
            )}

            <button
              onClick={function() { navigate('/dashboard'); }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
              type="button"
            >
              Acceder a mon espace locataire
            </button>
          </div>
        )}

      </div>

      {showModalPaiement && reservationCreee && (
        <ModalPaiementMobile
          reservation={reservationCreee}
          montant={logement ? logement.prix_mensuel : 0}
          onClose={function() { setShowModalPaiement(false); }}
          onSuccess={function() {
            setShowModalPaiement(false);
            toast.success('Caution payee !');
            setStep(6);
          }}
        />
      )}
    </div>
  );
}