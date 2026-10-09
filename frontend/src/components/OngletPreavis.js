/* eslint-disable */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Home, CheckCircle2, Scale, Check, Send, ClipboardList, FileCheck, Info, MessageCircle, FileDown, AlertTriangle, CalendarDays } from 'lucide-react';

const addDays = (n) => {
  var d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

var MOTIFS_LOCATAIRE = [
  { value: 'Changement de ville ou de pays', key: 'changementVille' },
  { value: 'Achat d\'un bien immobilier', key: 'achatBien' },
  { value: 'Logement ne correspond plus à mes besoins', key: 'logementNeCorrespondPlus' },
  { value: 'Raisons professionnelles', key: 'raisonsProfessionnelles' },
  { value: 'Raisons familiales', key: 'raisonsFamiliales' },
  { value: 'Conditions du logement insatisfaisantes', key: 'conditionsInsatisfaisantes' },
  { value: 'Autre raison', key: 'autreRaison' },
];

var MOTIFS_PROPRIO = [
  { value: 'Vente du bien immobilier', key: 'venteBien' },
  { value: 'Reprise du bien pour usage personnel', key: 'repriseUsagePersonnel' },
  { value: 'Travaux de rénovation importants', key: 'travauxRenovation' },
  { value: 'Non-paiement répété des loyers', key: 'nonPaiementRepete' },
  { value: 'Troubles de voisinage', key: 'troublesVoisinage' },
  { value: 'Fin de bail non renouvelé', key: 'finBailNonRenouvele' },
  { value: 'Autre motif', key: 'autreMotif' },
];

// ═══════════════════════════════════════════════════
// PRÉAVIS CÔTÉ LOCATAIRE
// ═══════════════════════════════════════════════════
function PreavisLocataire() {
  var t = useTranslation('dashboard').t;
  var [step, setStep] = useState('form'); // form | confirm | sent
  var [motif, setMotif] = useState('');
  var [delai, setDelai] = useState('');
  var [note, setNote] = useState('');
  var [reservation, setReservation] = useState(null);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    api.get('/reservations/mes-reservations')
      .then(function(res) {
        var active = (res.data.reservations || []).find(function(r) { return r.statut === 'confirmee'; });
        if (active) setReservation(active);
      })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, []);

  function envoyer() {
    api.post('/preavis', {
      reservation_id: reservation && reservation.id,
      motif: motif,
      delai_mois: parseInt(delai),
      note: note,
      type: 'locataire'
    }).catch(function() {
      // Pas bloquant
    });
    setStep('sent');
    toast.success(t('ongletPreavis.locataire.envoye.toastSucces'));
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>{t('ongletPreavis.chargement')}</div>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: '#37474F', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={16} strokeWidth={1.75} /> {t('ongletPreavis.locataire.header.titre')}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
          {reservation ? reservation.logement_titre : t('ongletPreavis.locataire.header.monLogement')}
        </div>
      </div>

      {step === 'sent' ? (
        /* ── ENVOYÉ ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><CheckCircle2 size={36} strokeWidth={1.5} color="#1B6B3A" /></div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1B6B3A', marginBottom: 8 }}>{t('ongletPreavis.locataire.envoye.titre')}</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            {t('ongletPreavis.locataire.envoye.descAvant')}<b>48h</b>{t('ongletPreavis.locataire.envoye.descApres')}
          </div>
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7B4F00', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><FileCheck size={14} strokeWidth={1.75} /> {t('ongletPreavis.locataire.envoye.recapTitre')}</div>
            {[
              [t('ongletPreavis.locataire.envoye.labels.logement'), reservation ? reservation.logement_titre : t('ongletPreavis.na')],
              [t('ongletPreavis.locataire.envoye.labels.motif'), motif],
              [t('ongletPreavis.locataire.envoye.labels.delaiPreavis'), t('ongletPreavis.delaiMois', { n: delai })],
              [t('ongletPreavis.locataire.envoye.labels.dateDepartEstimee'), addDays(parseInt(delai) * 30)],
              [t('ongletPreavis.locataire.envoye.labels.statut'), t('ongletPreavis.locataire.envoye.statutEnAttenteConfirmation')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#7B4F00', textAlign: 'right', maxWidth: '55%' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'left', display: 'flex', gap: 8 }}>
            <Info size={14} strokeWidth={1.75} color="#1B5E20" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: '#1B5E20', lineHeight: 1.6 }}>
              {t('ongletPreavis.locataire.envoye.infoContinuerPaiement')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><MessageCircle size={13} strokeWidth={1.75} /> {t('ongletPreavis.locataire.envoye.contacterProprio')}</button>
            <button style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><FileDown size={13} strokeWidth={1.75} /> {t('ongletPreavis.telechargerPdf')}</button>
          </div>
        </div>
      ) : step === 'confirm' ? (
        /* ── CONFIRMATION AVANT ENVOI ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={15} strokeWidth={1.75} /> {t('ongletPreavis.confirmerEnvoiTitre')}</div>
          <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#B71C1C', fontWeight: 600, marginBottom: 4 }}>{t('ongletPreavis.locataire.confirm.actionOfficielle')}</div>
            <div style={{ fontSize: 12, color: '#C62828', lineHeight: 1.6 }}>{t('ongletPreavis.locataire.confirm.description')}</div>
          </div>
          <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            {[
              [t('ongletPreavis.locataire.confirm.labels.logement'), reservation ? reservation.logement_titre : t('ongletPreavis.na')],
              [t('ongletPreavis.locataire.confirm.labels.motif'), motif],
              [t('ongletPreavis.locataire.confirm.labels.delai'), t('ongletPreavis.delaiMois', { n: delai })],
              [t('ongletPreavis.locataire.confirm.labels.dateDeSortie'), addDays(parseInt(delai) * 30)],
              [t('ongletPreavis.locataire.confirm.labels.note'), note || t('ongletPreavis.aucuneNote')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '0.5px solid #EFEFEF', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#333', maxWidth: '60%', textAlign: 'right' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setStep('form'); }}
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer' }}>{t('ongletPreavis.modifier')}</button>
            <button onClick={envoyer}
              style={{ flex: 2, background: '#37474F', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Send size={14} strokeWidth={1.75} /> {t('ongletPreavis.locataire.confirm.envoyerLePreavis')}</button>
          </div>
        </div>
      ) : (
        /* ── FORMULAIRE ── */
        <div>
          {/* Alerte légale */}
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8 }}>
            <Scale size={16} strokeWidth={1.5} />
            <span style={{ fontSize: 12, color: '#7B4F00', lineHeight: 1.6 }}>
              {t('ongletPreavis.locataire.form.alerteLegaleAvant')}<b>{t('ongletPreavis.locataire.form.alerteLegaleGras')}</b>{t('ongletPreavis.locataire.form.alerteLegaleApres')}
            </span>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* MOTIF */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: '#1B2B22', marginBottom: 10, fontWeight: 700 }}>{t('ongletPreavis.locataire.form.motifLabel')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MOTIFS_LOCATAIRE.map(function(opt) {
                  var m = opt.value;
                  return (
                    <div key={m} onClick={function() { setMotif(m); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: motif === m ? '1.5px solid #37474F' : '0.5px solid #E0E0E0', background: motif === m ? '#F5F5F5' : '#FAFAFA', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: motif === m ? 'none' : '1.5px solid #CCC', background: motif === m ? '#37474F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {motif === m && <Check size={12} strokeWidth={2.2} color="#fff" />}
                      </div>
                      <span style={{ fontSize: 13, color: motif === m ? '#263238' : '#555' }}>{t('ongletPreavis.motifsLocataire.' + opt.key)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DÉLAI */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: '#1B2B22', marginBottom: 10, fontWeight: 700 }}>{t('ongletPreavis.locataire.form.delaiLabel')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {['1', '2', '3'].map(function(n) {
                  return (
                    <button key={n} onClick={function() { setDelai(n); }}
                      style={{ padding: 10, borderRadius: 10, border: delai === n ? '2px solid #37474F' : '0.5px solid #E0E0E0', background: delai === n ? '#ECEFF1' : '#FAFAFA', color: delai === n ? '#263238' : '#555', fontSize: 13, fontWeight: delai === n ? 700 : 400, cursor: 'pointer' }}>
                      {t('ongletPreavis.delaiMois', { n: n })}
                    </button>
                  );
                })}
              </div>
              {delai && (
                <div style={{ background: '#ECEFF1', borderRadius: 10, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#546E7A', display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} strokeWidth={1.75} /> {t('ongletPreavis.locataire.form.dateDepartEstimeeLabel')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#37474F' }}>{addDays(parseInt(delai) * 30)}</span>
                </div>
              )}
            </div>

            {/* NOTE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#1B2B22', marginBottom: 8, fontWeight: 700 }}>{t('ongletPreavis.locataire.form.messageLabel')}</div>
              <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
                placeholder={t('ongletPreavis.locataire.form.messagePlaceholder')}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 80, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button onClick={function() { if (motif && delai) setStep('confirm'); else toast.error(t('ongletPreavis.locataire.form.erreurSelection')); }}
              style={{ width: '100%', background: motif && delai ? '#37474F' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: motif && delai ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ClipboardList size={14} strokeWidth={1.75} /> {t('ongletPreavis.locataire.form.preparerBouton')}
            </button>
            {(!motif || !delai) && (
              <div style={{ fontSize: 11, color: '#B71C1C', textAlign: 'center', marginTop: 6 }}>{t('ongletPreavis.locataire.form.erreurSelectionContinuer')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PRÉAVIS CÔTÉ PROPRIÉTAIRE
// ═══════════════════════════════════════════════════
function PreavisProprio() {
  var t = useTranslation('dashboard').t;
  var [step, setStep] = useState('form'); // form | confirm | sent
  var [bien, setBien] = useState(null);
  var [motif, setMotif] = useState('');
  var [delai, setDelai] = useState('');
  var [note, setNote] = useState('');
  var [biens, setBiens] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    api.get('/reservations/proprietaire')
      .then(function(res) {
        var actives = (res.data.reservations || []).filter(function(r) {
          return r.statut === 'confirmee' && !r.preavis_envoye;
        }).map(function(r) {
          return {
            id: r.id,
            nom: r.logement_titre,
            locataire: (r.locataire_prenom || '') + ' ' + (r.locataire_nom || ''),
            tel: r.locataire_telephone || 'N/A',
            loyer: Number(r.montant_total || r.prix_mensuel),
            debut: r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : 'N/A',
            preavis: null,
            icon: Home
          };
        });
        setBiens(actives.length > 0 ? actives : [
          { id: '1', nom: 'Villa Ratoma', locataire: 'Mamadou Diallo', tel: '+224 622 11 22 33', loyer: 2500000, debut: '1er mars 2024', preavis: null, icon: Home },
          { id: '3', nom: 'Studio Matam', locataire: 'Sekou Konaté', tel: '+224 655 77 88 99', loyer: 900000, debut: '1er janvier 2025', preavis: null, icon: Home },
        ]);
      })
      .catch(function() {
        setBiens([
          { id: '1', nom: 'Villa Ratoma', locataire: 'Mamadou Diallo', tel: '+224 622 11 22 33', loyer: 2500000, debut: '1er mars 2024', preavis: null, icon: Home },
          { id: '3', nom: 'Studio Matam', locataire: 'Sekou Konaté', tel: '+224 655 77 88 99', loyer: 900000, debut: '1er janvier 2025', preavis: null, icon: Home },
        ]);
      })
      .finally(function() { setLoading(false); });
  }, []);

  function envoyer() {
    api.post('/preavis', {
      reservation_id: bien && bien.id,
      motif: motif,
      delai_mois: parseInt(delai),
      note: note,
      type: 'proprietaire'
    }).catch(function() {
      // Pas bloquant
    });
    setStep('sent');
    toast.success(t('ongletPreavis.proprio.envoye.toastSucces', { locataire: (bien && bien.locataire) }));
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>{t('ongletPreavis.chargement')}</div>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: '#C62828', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={16} strokeWidth={1.75} /> {t('ongletPreavis.proprio.header.titre')}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>{t('ongletPreavis.proprio.header.sousTitre')}</div>
      </div>

      {step === 'sent' ? (
        /* ── ENVOYÉ ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: '#FFF8E1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Send size={32} strokeWidth={1.5} color="#E65100" /></div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C62828', marginBottom: 8 }}>{t('ongletPreavis.proprio.envoye.titre')}</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            <b>{bien && bien.locataire}</b> {t('ongletPreavis.proprio.envoye.descMid')}<b>48h</b>{t('ongletPreavis.proprio.envoye.descApres')}
          </div>
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7B4F00', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><FileCheck size={14} strokeWidth={1.75} /> {t('ongletPreavis.proprio.envoye.recapTitre')}</div>
            {[
              [t('ongletPreavis.proprio.envoye.labels.bien'), bien && bien.nom],
              [t('ongletPreavis.proprio.envoye.labels.locataireNotifie'), bien && bien.locataire],
              [t('ongletPreavis.proprio.envoye.labels.contact'), bien && bien.tel],
              [t('ongletPreavis.proprio.envoye.labels.motif'), motif],
              [t('ongletPreavis.proprio.envoye.labels.delaiAccorde'), t('ongletPreavis.delaiMois', { n: delai })],
              [t('ongletPreavis.proprio.envoye.labels.dateDeSortieEstimee'), addDays(parseInt(delai) * 30)],
              [t('ongletPreavis.proprio.envoye.labels.statut'), t('ongletPreavis.proprio.envoye.statutEnAttente')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#7B4F00', textAlign: 'right', maxWidth: '55%' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'left', display: 'flex', gap: 8 }}>
            <Info size={14} strokeWidth={1.75} color="#1B5E20" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: '#1B5E20', lineHeight: 1.6 }}>
              {t('ongletPreavis.proprio.envoye.infoAvant')}<b>{t('ongletPreavis.delaiMois', { n: delai })}</b>.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><MessageCircle size={13} strokeWidth={1.75} /> {t('ongletPreavis.proprio.envoye.contacterLocataire')}</button>
            <button style={{ flex: 1, background: '#C62828', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><FileDown size={13} strokeWidth={1.75} /> {t('ongletPreavis.telechargerPdf')}</button>
          </div>
        </div>
      ) : step === 'confirm' ? (
        /* ── DOUBLE CONFIRMATION ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={15} strokeWidth={1.75} /> {t('ongletPreavis.confirmerEnvoiTitre')}</div>
          <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#B71C1C', fontWeight: 600, marginBottom: 4 }}>{t('ongletPreavis.proprio.confirm.actionOfficielleIrreversible')}</div>
            <div style={{ fontSize: 12, color: '#C62828', lineHeight: 1.6 }}>{t('ongletPreavis.proprio.confirm.descAvant')}<b>{bien && bien.locataire}</b>{t('ongletPreavis.proprio.confirm.descApres')}</div>
          </div>
          <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            {[
              [t('ongletPreavis.proprio.confirm.labels.bien'), bien && bien.nom],
              [t('ongletPreavis.proprio.confirm.labels.locataire'), bien && bien.locataire],
              [t('ongletPreavis.proprio.confirm.labels.motif'), motif],
              [t('ongletPreavis.proprio.confirm.labels.delai'), t('ongletPreavis.delaiMois', { n: delai })],
              [t('ongletPreavis.proprio.confirm.labels.dateDeSortie'), addDays(parseInt(delai) * 30)],
              [t('ongletPreavis.proprio.confirm.labels.note'), note || t('ongletPreavis.aucuneNote')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '0.5px solid #EFEFEF', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#333', maxWidth: '60%', textAlign: 'right' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setStep('form'); }}
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer' }}>{t('ongletPreavis.modifier')}</button>
            <button onClick={envoyer}
              style={{ flex: 2, background: '#C62828', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Send size={14} strokeWidth={1.75} /> {t('ongletPreavis.proprio.confirm.envoyerOfficiel')}</button>
          </div>
        </div>
      ) : (
        /* ── FORMULAIRE ── */
        <div>
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8 }}>
            <Scale size={16} strokeWidth={1.5} />
            <span style={{ fontSize: 12, color: '#7B4F00', lineHeight: 1.6 }}>{t('ongletPreavis.proprio.form.alerteInfo')}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* SÉLECTION BIEN */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('ongletPreavis.proprio.form.bienLabel')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {biens.filter(function(b) { return !b.preavis; }).map(function(b) {
                  return (
                    <div key={b.id} onClick={function() { setBien(b); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: bien && bien.id === b.id ? '2px solid #C62828' : '0.5px solid #E0E0E0', background: bien && bien.id === b.id ? '#FFEBEE' : '#FAFAFA', borderRadius: 10, cursor: 'pointer' }}>
                      <b.icon size={20} strokeWidth={1.6} color="#555" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{b.nom}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{b.locataire} · {b.tel}</div>
                      </div>
                      {bien && bien.id === b.id && <Check size={16} strokeWidth={2.2} color="#C62828" />}
                    </div>
                  );
                })}
                {biens.filter(function(b) { return !b.preavis; }).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 13 }}>{t('ongletPreavis.proprio.form.aucunBienDisponible')}</div>
                )}
              </div>
            </div>

            {/* MOTIF */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('ongletPreavis.proprio.form.motifLabel')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MOTIFS_PROPRIO.map(function(opt) {
                  var m = opt.value;
                  return (
                    <div key={m} onClick={function() { setMotif(m); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: motif === m ? '1.5px solid #C62828' : '0.5px solid #E0E0E0', background: motif === m ? '#FFEBEE' : '#FAFAFA', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: motif === m ? 'none' : '1.5px solid #CCC', background: motif === m ? '#C62828' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {motif === m && <Check size={12} strokeWidth={2.2} color="#fff" />}
                      </div>
                      <span style={{ fontSize: 13, color: motif === m ? '#B71C1C' : '#555' }}>{t('ongletPreavis.motifsProprio.' + opt.key)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DÉLAI */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('ongletPreavis.proprio.form.delaiLabel')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {['1', '2', '3'].map(function(n) {
                  return (
                    <button key={n} onClick={function() { setDelai(n); }}
                      style={{ padding: 10, borderRadius: 10, border: delai === n ? '2px solid #C62828' : '0.5px solid #E0E0E0', background: delai === n ? '#FFEBEE' : '#FAFAFA', color: delai === n ? '#B71C1C' : '#555', fontSize: 13, fontWeight: delai === n ? 700 : 400, cursor: 'pointer' }}>
                      {t('ongletPreavis.delaiMois', { n: n })}
                    </button>
                  );
                })}
              </div>
              {delai && (
                <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#B71C1C', display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} strokeWidth={1.75} /> {t('ongletPreavis.proprio.form.dateSortieEstimeeLabel')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C62828' }}>{addDays(parseInt(delai) * 30)}</span>
                </div>
              )}
            </div>

            {/* NOTE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{t('ongletPreavis.proprio.form.messageLabel')}</div>
              <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
                placeholder={t('ongletPreavis.proprio.form.messagePlaceholder')}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 80, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button onClick={function() { if (bien && motif && delai) setStep('confirm'); else toast.error(t('ongletPreavis.proprio.form.erreurChampsObligatoires')); }}
              style={{ width: '100%', background: bien && motif && delai ? '#C62828' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: bien && motif && delai ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ClipboardList size={14} strokeWidth={1.75} /> {t('ongletPreavis.proprio.form.continuerBouton')}
            </button>
            {(!bien || !motif || !delai) && (
              <div style={{ fontSize: 11, color: '#C62828', textAlign: 'center', marginTop: 6 }}>{t('ongletPreavis.proprio.form.erreurSelectionComplete')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DISPATCHER — rôle locataire vs propriétaire
// ═══════════════════════════════════════════════════
export default function OngletPreavis() {
  var t = useTranslation('dashboard').t;
  var auth = useAuth();
  var user = auth.user;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1B2B22', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={20} strokeWidth={1.75} /> {t('ongletPreavis.dispatcher.titre')}</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
            {estProprietaire ? t('ongletPreavis.dispatcher.sousTitreProprio') : t('ongletPreavis.dispatcher.sousTitreLocataire')}
          </p>
        </div>
      </div>
      {estProprietaire ? <PreavisProprio /> : <PreavisLocataire />}
    </div>
  );
}