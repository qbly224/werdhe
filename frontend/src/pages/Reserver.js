/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const GNF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' GNF';

const STEPS = [
  { id: 1, label: 'Demande', icon: '🔍' },
  { id: 2, label: 'Dossier', icon: '📁' },
  { id: 3, label: 'Décision', icon: '⚖️' },
  { id: 4, label: 'Échanges', icon: '💬' },
  { id: 5, label: 'Caution', icon: '🔒' },
  { id: 6, label: 'Bail & EDL', icon: '📝' },
  { id: 7, label: 'Accès', icon: '🗝️' },
];

const PAY_OPTS = [
  { id: 'om', label: 'Orange Money', sub: 'Instantané · Paiement sécurisé', color: '#FF6600', textColor: '#fff', abbr: 'OM' },
  { id: 'mtn', label: 'MTN MoMo', sub: 'Instantané · MTN Guinée', color: '#FFCC00', textColor: '#1B2B22', abbr: 'MM' },
  { id: 'cash', label: 'Espèces', sub: 'Remise en main propre · reçu PDF généré', icon: '💵' },
  { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank · UBA', icon: '🏦' },
];

function Badge({ color, children }) {
  var styles = {
    green: { bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
    blue: { bg: '#E3F2FD', color: '#0D47A1', border: '#90CAF9' },
    amber: { bg: '#FFF8E1', color: '#7B4F00', border: '#FFE082' },
    purple: { bg: '#F3E5F5', color: '#4A148C', border: '#CE93D8' },
    red: { bg: '#FFEBEE', color: '#B71C1C', border: '#FFCDD2' },
  };
  var s = styles[color] || styles.green;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: '0.5px solid ' + s.border }}>
      {children}
    </span>
  );
}

export default function Reserver() {
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;

  var [step, setStep] = useState(1);
  var [selectedPay, setSelectedPay] = useState('om');
  var [signed, setSigned] = useState(false);
  var [cautionDone, setCautionDone] = useState(false);
  var [cautionProcessing, setCautionProcessing] = useState(false);
  var [msgs, setMsgs] = useState([
    { from: 'proprio', text: 'Bonjour ! J\'ai bien reçu votre dossier. La caution équivaut à 1 mois de loyer soit 1 500 000 GNF.', time: '09:45' },
    { from: 'locataire', text: 'Bonjour ! Merci. Je suis d\'accord avec la caution. Est-ce que je pourrais visiter l\'appartement avant de signer ?', time: '09:52' },
    { from: 'proprio', text: 'Bien sûr ! Je suis disponible samedi matin à 10h.', time: '09:55' },
    { from: 'locataire', text: 'Parfait pour samedi à 10h ! Je confirme ma présence.', time: '10:02' },
  ]);
  var [newMsg, setNewMsg] = useState('');
  var [docs, setDocs] = useState({ cni: null, emploi: null, paie: null, garant: null });
  var [docsProgress, setDocsProgress] = useState(0);
  var [message, setMessage] = useState('');
  var [dateDebut, setDateDebut] = useState('');
  var [duree, setDuree] = useState('12');
  var [demandeEnvoyee, setDemandeEnvoyee] = useState(false);
  var [decision, setDecision] = useState(null);
  var chatRef = useRef(null);

  useEffect(function() {
    var done = Object.values(docs).filter(Boolean).length;
    setDocsProgress(Math.round(done / 4 * 100));
  }, [docs]);

  useEffect(function() {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [msgs]);

  function sendMsg() {
    if (!newMsg.trim()) return;
    setMsgs(function(prev) {
      return prev.concat({ from: 'locataire', text: newMsg, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) });
    });
    setNewMsg('');
  }

  function handleDocUpload(key, file) {
    if (!file) return;
    setDocs(function(prev) { return Object.assign({}, prev, { [key]: file.name }); });
    toast.success(file.name + ' ajouté !');
  }

  function envoyerDemande() {
    if (!message.trim() || !dateDebut) { toast.error('Remplissez tous les champs'); return; }
    setDemandeEnvoyee(true);
    setTimeout(function() { setStep(2); }, 800);
    toast.success('Demande envoyée au propriétaire !');
  }

  function soumettreDossier() {
    if (docsProgress < 50) { toast.error('Ajoutez au moins 2 documents'); return; }
    toast.success('Dossier soumis au propriétaire !');
    setTimeout(function() { setStep(3); }, 600);
  }

  function payerCaution() {
    setCautionProcessing(true);
    setTimeout(function() {
      setCautionProcessing(false);
      setCautionDone(true);
      toast.success('Caution sécurisée sur Werdhe !');
    }, 2200);
  }

  var stepDone = function(s) { return s < step; };
  var stepActive = function(s) { return s === step; };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto', padding: '12px 16px', background: '#F7F8F7', minHeight: '100vh' }}>

      {/* HEADER */}
      <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '14px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={function() { navigate(-1); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8 }}>←</button>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Flux de réservation</span>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2, marginLeft: 30 }}>Étape {step} / 7</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Badge color="green">Locataire</Badge>
          <Badge color="blue">Propriétaire</Badge>
        </div>
      </div>

      {/* STEP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {STEPS.map(function(s, i) {
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div onClick={function() { if (s.id <= step) setStep(s.id); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: s.id <= step ? 'pointer' : 'default' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: stepDone(s.id) ? 14 : 11, fontWeight: 700,
                  background: stepDone(s.id) || stepActive(s.id) ? '#1B6B3A' : '#E0E0E0',
                  color: stepDone(s.id) || stepActive(s.id) ? '#fff' : '#888',
                  boxShadow: stepActive(s.id) ? '0 0 0 4px #C8E6C9' : 'none',
                  transition: 'all .3s', flexShrink: 0
                }}>
                  {stepDone(s.id) ? '✓' : s.id}
                </div>
                <div style={{ fontSize: 10, color: stepActive(s.id) ? '#1B6B3A' : '#999', marginTop: 3, whiteSpace: 'nowrap', fontWeight: stepActive(s.id) ? 700 : 400 }}>{s.label}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: stepDone(s.id) ? '#1B6B3A' : '#E0E0E0', minWidth: 12, margin: '0 2px', marginBottom: 16, transition: 'background .3s' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════
          ÉTAPE 1 — DEMANDE DE RÉSERVATION (locataire)
      ═══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <Badge color="green">🔍 Étape 1 · Côté locataire</Badge>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginTop: 8 }}>Demande de réservation</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 3 }}>Le locataire a trouvé un logement et envoie une demande au propriétaire. Aucun paiement requis.</div>
          </div>

          {/* Fiche logement */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 72, height: 60, background: '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🏢</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1B2B22' }}>Appartement F3 — Ratoma Centre</div>
                <div style={{ fontSize: 12, color: '#888', margin: '3px 0' }}>📍 Ratoma, Conakry</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1B6B3A' }}>{GNF(1500000)} / mois</div>
              </div>
              <Badge color="green">Disponible</Badge>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {['3 pièces', 'Eau courante', 'Gardiennage', '2ème étage'].map(function(t) {
                return <span key={t} style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>{t}</span>;
              })}
            </div>
            <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 600 }}>Propriétaire</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>MB</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Mamadou Barry</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Membre vérifié · Répond en moins de 2h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire demande */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>Votre demande</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 600 }}>Date d'entrée souhaitée *</div>
              <input type="date" value={dateDebut} onChange={function(e) { setDateDebut(e.target.value); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 600 }}>Durée envisagée</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['6', '6 mois'], ['12', '12 mois'], ['24', '24 mois']].map(function(opt) {
                  return (
                    <button key={opt[0]} onClick={function() { setDuree(opt[0]); }}
                      style={{ padding: 10, borderRadius: 10, border: duree === opt[0] ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: duree === opt[0] ? '#E8F5E9' : '#FAFAFA', color: duree === opt[0] ? '#1B5E20' : '#555', fontSize: 13, fontWeight: duree === opt[0] ? 700 : 400, cursor: 'pointer' }}>
                      {opt[1]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 600 }}>Message au propriétaire *</div>
              <textarea value={message} onChange={function(e) { setMessage(e.target.value); }}
                placeholder="Présentez-vous et expliquez votre situation (emploi, composition familiale...)"
                rows={4}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 14 }}>ℹ️</span>
              <span style={{ fontSize: 12, color: '#0D47A1', lineHeight: 1.5 }}>Aucun paiement requis à cette étape. Le propriétaire a 48h pour répondre à votre demande.</span>
            </div>
            <button onClick={envoyerDemande} disabled={demandeEnvoyee}
              style={{ width: '100%', background: demandeEnvoyee ? '#999' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: demandeEnvoyee ? 'not-allowed' : 'pointer' }}>
              {demandeEnvoyee ? '✅ Demande envoyée !' : '📤 Envoyer la demande au propriétaire'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ÉTAPE 2 — DOSSIER (locataire)
      ═══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <Badge color="green">📁 Étape 2 · Côté locataire</Badge>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginTop: 8 }}>Votre dossier de location</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 3 }}>Déposez vos documents pour que le propriétaire puisse évaluer votre candidature.</div>
          </div>

          {/* Barre de progression */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>Progression du dossier</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A' }}>{docsProgress}%</span>
            </div>
            <div style={{ background: '#F0F0F0', borderRadius: 6, height: 10, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, #1B6B3A, #34A853)', width: docsProgress + '%', height: '100%', borderRadius: 6, transition: 'width .5s' }} />
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{Object.values(docs).filter(Boolean).length} / 4 documents ajoutés</div>
          </div>

          {/* Documents requis */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {[
              { key: 'cni', label: 'Carte nationale d\'identité', sub: 'CNI valide recto-verso', required: true },
              { key: 'emploi', label: 'Attestation d\'emploi', sub: 'Signée par votre employeur', required: true },
              { key: 'paie', label: 'Fiche de paie (3 mois)', sub: 'Les 3 derniers mois', required: false },
              { key: 'garant', label: 'Contact du garant', sub: 'Nom, téléphone, profession', required: false },
            ].map(function(doc) {
              var added = Boolean(docs[doc.key]);
              return (
                <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: added ? '#E8F5E9' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {added ? '✅' : '📄'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>
                      {doc.label}
                      {doc.required && <span style={{ color: '#E53935', marginLeft: 4 }}>*</span>}
                    </div>
                    <div style={{ fontSize: 11, color: added ? '#1B6B3A' : '#888', marginTop: 2 }}>
                      {added ? docs[doc.key] : doc.sub}
                    </div>
                  </div>
                  <label style={{ cursor: 'pointer' }}>
                    <input type="file" style={{ display: 'none' }} onChange={function(e) { if (e.target.files[0]) handleDocUpload(doc.key, e.target.files[0]); }} />
                    <div style={{ padding: '7px 14px', borderRadius: 8, background: added ? '#F0FBF0' : '#1B6B3A', color: added ? '#1B6B3A' : '#fff', fontSize: 12, fontWeight: 600, border: added ? '0.5px solid #A5D6A7' : 'none' }}>
                      {added ? 'Modifier' : 'Ajouter'}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          <button onClick={soumettreDossier}
            style={{ width: '100%', background: docsProgress >= 50 ? '#1B6B3A' : '#999', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: docsProgress >= 50 ? 'pointer' : 'not-allowed' }}>
            📤 Soumettre le dossier
          </button>
          {docsProgress < 50 && <div style={{ fontSize: 11, color: '#E53935', textAlign: 'center', marginTop: 6 }}>Ajoutez au moins 2 documents</div>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ÉTAPE 3 — DÉCISION (propriétaire)
      ═══════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <Badge color="blue">⚖️ Étape 3 · Côté propriétaire</Badge>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginTop: 8 }}>Examiner la candidature</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 3 }}>Analysez le dossier du locataire et prenez votre décision.</div>
          </div>

          {/* Profil candidat */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, background: '#1565C0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>FC</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22' }}>Fatoumata Camara</div>
                <div style={{ fontSize: 12, color: '#888' }}>Locataire vérifiée · Score 82/100</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <Badge color="green">✅ Profil complet</Badge>
                  <Badge color="blue">Solvable</Badge>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                ['Revenu mensuel', '3 500 000 GNF'],
                ['Ratio loyer/revenus', '43% — Acceptable'],
                ['Emploi', 'Fonctionnaire · Ministère'],
                ['Garant', 'Présent · Solvable'],
              ].map(function(item) {
                return (
                  <div key={item[0]} style={{ background: '#F8F8F8', borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>{item[0]}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22', marginBottom: 8 }}>Documents soumis</div>
              {[
                { label: 'CNI recto-verso', ok: true },
                { label: 'Attestation d\'emploi', ok: true },
                { label: 'Fiches de paie (3 mois)', ok: true },
                { label: 'Contact garant', ok: false },
              ].map(function(d) {
                return (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <span style={{ fontSize: 14 }}>{d.ok ? '✅' : '⏳'}</span>
                    <span style={{ fontSize: 12, color: d.ok ? '#1B2B22' : '#888' }}>{d.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic', background: '#F0F7FF', padding: 12, borderRadius: 10, marginBottom: 14 }}>
              "Bonjour, je suis fonctionnaire depuis 5 ans. Je cherche un appartement calme pour moi et mon mari. Nous sommes sérieux et respectueux."
            </div>

            {!decision ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={function() { setDecision('accepte'); setTimeout(function() { setStep(4); }, 600); toast.success('Candidature acceptée ! Locataire notifié.'); }}
                  style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  ✅ Accepter la candidature
                </button>
                <button onClick={function() { setDecision('infos'); toast.success('Demande d\'infos envoyée.'); }}
                  style={{ background: '#E3F2FD', color: '#1565C0', border: '0.5px solid #90CAF9', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  💬 Demander des informations complémentaires
                </button>
                <button onClick={function() { setDecision('refuse'); toast.error('Candidature refusée. Locataire notifié.'); }}
                  style={{ background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  ❌ Refuser
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <Badge color={decision === 'accepte' ? 'green' : decision === 'infos' ? 'blue' : 'red'}>
                  {decision === 'accepte' ? '✅ Candidature acceptée' : decision === 'infos' ? '💬 Infos demandées' : '❌ Candidature refusée'}
                </Badge>
                {decision === 'accepte' && (
                  <button onClick={function() { setStep(4); }} style={{ display: 'block', width: '100%', marginTop: 12, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Passer aux échanges →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ÉTAPE 4 — ÉCHANGES (les deux)
      ═══════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <Badge color="purple">💬 Étape 4 · Les deux parties</Badge>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginTop: 8 }}>Échanges et négociation</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 3 }}>Discutez des conditions, de la visite, de la caution. Partagez photos et documents.</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 14 }}>
            {/* En-tête chat */}
            <div style={{ background: '#1B6B3A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏠</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Appartement F3 — Ratoma</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Discussion sécurisée · Werdhe</div>
              </div>
              <label style={{ marginLeft: 'auto', cursor: 'pointer' }}>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={function(e) {
                  if (e.target.files[0]) {
                    setMsgs(function(prev) { return prev.concat({ from: 'locataire', text: '📎 ' + e.target.files[0].name, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }); });
                    toast.success('Fichier partagé !');
                  }
                }} />
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, padding: 4, cursor: 'pointer' }}>📎</div>
              </label>
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{ height: 280, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F8F9F8' }}>
              {msgs.map(function(m, i) {
                var isMoi = m.from === 'locataire';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMoi ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '78%', padding: '10px 13px', borderRadius: isMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMoi ? '#1B6B3A' : '#fff', color: isMoi ? '#fff' : '#1B2B22',
                      fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>
                      {m.from === 'proprio' ? 'Propriétaire' : 'Vous'} · {m.time}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', background: '#fff', borderTop: '0.5px solid #F0F0F0', display: 'flex', gap: 8 }}>
              <input value={newMsg} onChange={function(e) { setNewMsg(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') sendMsg(); }}
                placeholder="Écrivez un message..."
                style={{ flex: 1, padding: '9px 14px', borderRadius: 20, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: '#F8F8F8' }} />
              <button onClick={sendMsg} style={{ width: 40, height: 40, borderRadius: '50%', background: '#1B6B3A', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ↗
              </button>
            </div>
          </div>

          <button onClick={function() { setStep(5); }}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🔒 Procéder au paiement de la caution →
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ÉTAPE 5 — CAUTION (locataire)
      ═══════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <Badge color="amber">🔒 Étape 5 · Côté locataire</Badge>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginTop: 8 }}>Paiement de la caution</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 3 }}>Sécurisez votre logement en versant la caution. Elle est protégée sur Werdhe jusqu'à la remise des clés.</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#F0FBF0', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Montant de la caution</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Équivalent à 1 mois de loyer</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1B6B3A' }}>{GNF(1500000)}</div>
            </div>

            {!cautionDone && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Mode de paiement</div>
                {PAY_OPTS.map(function(p) {
                  return (
                    <div key={p.id} onClick={function() { setSelectedPay(p.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: selectedPay === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: selectedPay === p.id ? '#F0FBF0' : '#fff', borderRadius: 12, marginBottom: 8, cursor: 'pointer', transition: 'all .2s' }}>
                      <div style={{ width: 40, height: 40, background: p.color || '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p.icon ? 20 : 13, fontWeight: 700, color: p.textColor || '#1B6B3A', flexShrink: 0 }}>
                        {p.icon || p.abbr}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{p.label}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{p.sub}</div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: selectedPay === p.id ? 'none' : '1.5px solid #E0E0E0', background: selectedPay === p.id ? '#1B6B3A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPay === p.id && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cautionDone ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: 64, height: 64, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 32 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1B6B3A', marginBottom: 6 }}>Caution sécurisée !</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 16 }}>{GNF(1500000)} sécurisés sur Werdhe. Votre caution sera restituée après l'état des lieux de sortie.</div>
                <Badge color="green">🛡️ Protégé par Werdhe</Badge>
              </div>
            ) : (
              <button onClick={payerCaution} disabled={cautionProcessing}
                style={{ width: '100%', background: cautionProcessing ? '#999' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: cautionProcessing ? 'not-allowed' : 'pointer', marginTop: 6 }}>
                {cautionProcessing ? '⏳ Traitement...' : '🔒 Payer la caution — ' + GNF(1500000)}
              </button>
            )}

            <div style={{ padding: '10px 14px', background: '#E8F5E9', borderRadius: 10, display: 'flex', gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 14 }}>🛡️</span>
              <span style={{ fontSize: 12, color: '#1B5E20', lineHeight: 1.5 }}>Votre caution est sécurisée sur Werdhe jusqu'à la signature du bail et l'état des lieux.</span>
            </div>
          </div>

          {cautionDone && (
            <button onClick={function() { setStep(6); }}
              style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              📝 Passer à la signature du bail →
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ÉTAPE 6 — BAIL & ÉTAT DES LIEUX (les deux)
      ═══════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <Badge color="purple">📝 Étape 6 · Les deux parties</Badge>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', marginTop: 8 }}>Signature du bail & état des lieux</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 3 }}>Le bail est généré automatiquement. Signez numériquement et réalisez l'état des lieux d'entrée avec photos.</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: '#E3F2FD', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Contrat de bail</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Bail_FC_Ratoma_2025.pdf · Généré auto</div>
                </div>
              </div>
              <Badge color="amber">À signer</Badge>
            </div>

            <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 10, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                ['Locataire', 'Fatoumata Camara'],
                ['Propriétaire', 'Mamadou Barry'],
                ['Bien', 'Appart F3 · Ratoma'],
                ['Loyer', GNF(1500000) + '/mois'],
                ['Début', '1er juillet 2025'],
                ['Durée', '12 mois renouvelable'],
                ['Caution', GNF(1500000) + ' ✅'],
                ['Loyer dû le', '1er de chaque mois'],
              ].map(function(item) {
                return <div key={item[0]} style={{ fontSize: 11, color: '#666' }}><b>{item[0]} :</b> {item[1]}</div>;
              })}
            </div>

            {/* Zones de signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 12, border: '0.5px solid #E0E0E0', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Signature Propriétaire</div>
                <div style={{ fontStyle: 'italic', color: '#1B6B3A', borderBottom: '0.5px solid #E0E0E0', paddingBottom: 6, marginBottom: 6, fontSize: 14 }}>M. Barry ✓</div>
                <Badge color="green">Signé · 11:30</Badge>
              </div>
              <div onClick={function() { setSigned(true); if (!signed) toast.success('Bail signé électroniquement !'); }}
                style={{ padding: 12, border: signed ? '1.5px solid #1A4FA0' : '1.5px dashed #1A4FA0', background: signed ? '#E3F2FD' : '#F0F7FF', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}>
                {signed ? (
                  <>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Signature Locataire</div>
                    <div style={{ fontStyle: 'italic', color: '#1A4FA0', borderBottom: '0.5px solid #90CAF9', paddingBottom: 6, marginBottom: 6, fontSize: 14 }}>F. Camara ✓</div>
                    <Badge color="blue">Signé · maintenant</Badge>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: '#1A4FA0', marginBottom: 6 }}>Signature Locataire</div>
                    <div style={{ fontSize: 24 }}>✍️</div>
                    <div style={{ fontSize: 11, color: '#1A4FA0', marginTop: 4 }}>Appuyer pour signer</div>
                  </>
                )}
              </div>
            </div>

            {/* État des lieux */}
            <div style={{ borderTop: '0.5px solid #F0F0F0', paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📋 État des lieux d'entrée</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge color="green">✅ Salon — Bon état</Badge>
                <Badge color="green">✅ Chambre — Bon état</Badge>
                <Badge color="amber">⚠️ Cuisine — Légère usure</Badge>
                <Badge color="green">✅ Salle de bain — Bon état</Badge>
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>📸 8 photos jointes · Signé par les deux parties</div>
            </div>
          </div>

          <button onClick={function() { if (signed) setStep(7); else toast.error('Signez d\'abord le bail'); }}
            style={{ width: '100%', background: signed ? '#1B6B3A' : '#999', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: signed ? 'pointer' : 'not-allowed' }}>
            {signed ? '🗝️ Bail signé — Passer à la remise des clés' : '✍️ Signez d\'abord le bail pour continuer'}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ÉTAPE 7 — ACCÈS AU BIEN (locataire)
      ═══════════════════════════════════════════════════════ */}
      {step === 7 && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ width: 72, height: 72, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 36 }}>🗝️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1B6B3A', marginBottom: 6 }}>Félicitations ! 🎉</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>Vous avez officiellement accès à votre nouveau logement à Ratoma. Tous vos documents sont disponibles dans votre espace personnel.</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Récapitulatif de votre installation</div>
            {[
              { icon: '✅', title: 'Demande envoyée et acceptée', sub: 'Dossier complet · Profil vérifié' },
              { icon: '✅', title: 'Caution versée et sécurisée', sub: GNF(1500000) + ' · Orange Money · 14 juin 2025' },
              { icon: '✅', title: 'Bail signé électroniquement', sub: 'Contrat 12 mois · PDF disponible' },
              { icon: '✅', title: 'État des lieux d\'entrée réalisé', sub: '8 photos · Signé par les deux parties' },
              { icon: '🗝️', title: 'Clés remises · Accès accordé', sub: '1er juillet 2025 · Appartement F3 · Ratoma', highlight: true },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '0.5px solid #F5F5F5' : 'none' }}>
                  <div style={{ width: 34, height: 34, background: item.highlight ? '#1B6B3A' : '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.highlight ? '#1B6B3A' : '#1B2B22' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[['📄', 'Télécharger le bail PDF'], ['💬', 'Contacter le propriétaire'], ['📋', 'Voir mes documents'], ['🔔', 'Mes alertes loyer']].map(function(item) {
              return (
                <div key={item[1]} style={{ padding: 14, border: '0.5px solid #E0E0E0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: '#fff' }}
                  onClick={function() { toast.success(item[1]); }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{item[0]}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2B22' }}>{item[1]}</div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px 14px', background: '#E8F5E9', borderRadius: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#1B5E20', lineHeight: 1.5 }}>🔔 Votre premier loyer de <b>{GNF(1500000)}</b> sera dû le <b>1er août 2025</b>. Vous recevrez un rappel SMS 3 jours avant.</div>
          </div>

          <button onClick={function() { setStep(1); setSigned(false); setCautionDone(false); setDecision(null); setDemandeEnvoyee(false); setDocs({ cni: null, emploi: null, paie: null, garant: null }); }}
            style={{ width: '100%', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            ← Retour au début
          </button>
        </div>
      )}

      {/* Bouton navigation bas */}
      <div style={{ height: 30 }} />
    </div>
  );
}