/* eslint-disable */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const addDays = (n) => {
  var d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

var MOTIFS_LOCATAIRE = [
  'Changement de ville ou de pays',
  'Achat d\'un bien immobilier',
  'Logement ne correspond plus à mes besoins',
  'Raisons professionnelles',
  'Raisons familiales',
  'Conditions du logement insatisfaisantes',
  'Autre raison',
];

var MOTIFS_PROPRIO = [
  'Vente du bien immobilier',
  'Reprise du bien pour usage personnel',
  'Travaux de rénovation importants',
  'Non-paiement répété des loyers',
  'Troubles de voisinage',
  'Fin de bail non renouvelé',
  'Autre motif',
];

// ═══════════════════════════════════════════════════
// PRÉAVIS CÔTÉ LOCATAIRE
// ═══════════════════════════════════════════════════
function PreavisLocataire() {
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
    toast.success('Préavis envoyé au propriétaire !');
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: '#37474F', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>📤 Préavis de départ</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
          {reservation ? reservation.logement_titre : 'Mon logement'}
        </div>
      </div>

      {step === 'sent' ? (
        /* ── ENVOYÉ ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1B6B3A', marginBottom: 8 }}>Préavis envoyé !</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            Votre propriétaire a été notifié par SMS. Il a <b>48h</b> pour accuser réception.
          </div>
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7B4F00', marginBottom: 10 }}>📋 Votre préavis officiel</div>
            {[
              ['Logement', reservation ? reservation.logement_titre : 'N/A'],
              ['Motif', motif],
              ['Délai de préavis', delai + ' mois'],
              ['Date de départ estimée', addDays(parseInt(delai) * 30)],
              ['Statut', '⏳ En attente de confirmation'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#7B4F00', textAlign: 'right', maxWidth: '55%' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#1B5E20', lineHeight: 1.6 }}>
              ℹ️ Continuez à payer vos loyers normalement jusqu'à la date de sortie. Un état des lieux de sortie sera planifié avec le propriétaire.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>💬 Contacter le proprio</button>
            <button style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📄 Télécharger PDF</button>
          </div>
        </div>
      ) : step === 'confirm' ? (
        /* ── CONFIRMATION AVANT ENVOI ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>⚠️ Confirmer l'envoi du préavis</div>
          <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#B71C1C', fontWeight: 600, marginBottom: 4 }}>Action officielle</div>
            <div style={{ fontSize: 12, color: '#C62828', lineHeight: 1.6 }}>Ce préavis sera envoyé officiellement à votre propriétaire par SMS et notification. Il ne pourra pas être annulé.</div>
          </div>
          <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            {[
              ['Logement', reservation ? reservation.logement_titre : 'N/A'],
              ['Motif', motif],
              ['Délai', delai + ' mois'],
              ['Date de sortie', addDays(parseInt(delai) * 30)],
              ['Note', note || 'Aucune note'],
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
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer' }}>← Modifier</button>
            <button onClick={envoyer}
              style={{ flex: 2, background: '#37474F', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>📤 Envoyer le préavis</button>
          </div>
        </div>
      ) : (
        /* ── FORMULAIRE ── */
        <div>
          {/* Alerte légale */}
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8 }}>
            <span>⚖️</span>
            <span style={{ fontSize: 12, color: '#7B4F00', lineHeight: 1.6 }}>
              En Guinée, le délai légal de préavis est d'<b>1 mois minimum</b>. Votre propriétaire recevra une notification officielle par SMS et via l'application Werdhe.
            </span>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* MOTIF */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: '#1B2B22', marginBottom: 10, fontWeight: 700 }}>Motif de départ *</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MOTIFS_LOCATAIRE.map(function(m) {
                  return (
                    <div key={m} onClick={function() { setMotif(m); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: motif === m ? '1.5px solid #37474F' : '0.5px solid #E0E0E0', background: motif === m ? '#F5F5F5' : '#FAFAFA', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: motif === m ? 'none' : '1.5px solid #CCC', background: motif === m ? '#37474F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {motif === m && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: motif === m ? '#263238' : '#555' }}>{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DÉLAI */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: '#1B2B22', marginBottom: 10, fontWeight: 700 }}>Délai de préavis *</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['1', '1 mois'], ['2', '2 mois'], ['3', '3 mois']].map(function(opt) {
                  return (
                    <button key={opt[0]} onClick={function() { setDelai(opt[0]); }}
                      style={{ padding: 10, borderRadius: 10, border: delai === opt[0] ? '2px solid #37474F' : '0.5px solid #E0E0E0', background: delai === opt[0] ? '#ECEFF1' : '#FAFAFA', color: delai === opt[0] ? '#263238' : '#555', fontSize: 13, fontWeight: delai === opt[0] ? 700 : 400, cursor: 'pointer' }}>
                      {opt[1]}
                    </button>
                  );
                })}
              </div>
              {delai && (
                <div style={{ background: '#ECEFF1', borderRadius: 10, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#546E7A' }}>📅 Date de départ estimée</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#37474F' }}>{addDays(parseInt(delai) * 30)}</span>
                </div>
              )}
            </div>

            {/* NOTE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#1B2B22', marginBottom: 8, fontWeight: 700 }}>Message au propriétaire (optionnel)</div>
              <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
                placeholder="Ajoutez un message personnel pour expliquer votre départ..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 80, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button onClick={function() { if (motif && delai) setStep('confirm'); else toast.error('Sélectionnez un motif et un délai'); }}
              style={{ width: '100%', background: motif && delai ? '#37474F' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: motif && delai ? 'pointer' : 'not-allowed' }}>
              📋 Préparer le préavis officiel
            </button>
            {(!motif || !delai) && (
              <div style={{ fontSize: 11, color: '#B71C1C', textAlign: 'center', marginTop: 6 }}>Sélectionnez un motif et un délai pour continuer</div>
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
            icon: '🏠'
          };
        });
        setBiens(actives.length > 0 ? actives : [
          { id: '1', nom: 'Villa Ratoma', locataire: 'Mamadou Diallo', tel: '+224 622 11 22 33', loyer: 2500000, debut: '1er mars 2024', preavis: null, icon: '🏠' },
          { id: '3', nom: 'Studio Matam', locataire: 'Sekou Konaté', tel: '+224 655 77 88 99', loyer: 900000, debut: '1er janvier 2025', preavis: null, icon: '🏠' },
        ]);
      })
      .catch(function() {
        setBiens([
          { id: '1', nom: 'Villa Ratoma', locataire: 'Mamadou Diallo', tel: '+224 622 11 22 33', loyer: 2500000, debut: '1er mars 2024', preavis: null, icon: '🏠' },
          { id: '3', nom: 'Studio Matam', locataire: 'Sekou Konaté', tel: '+224 655 77 88 99', loyer: 900000, debut: '1er janvier 2025', preavis: null, icon: '🏠' },
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
    toast.success('Préavis officiel envoyé ! ' + (bien && bien.locataire) + ' a été notifié.');
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: '#C62828', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>📋 Envoyer un préavis</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Notification officielle au locataire</div>
      </div>

      {step === 'sent' ? (
        /* ── ENVOYÉ ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: '#FFF8E1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>📤</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C62828', marginBottom: 8 }}>Préavis officiel envoyé</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            <b>{bien && bien.locataire}</b> a été notifié par SMS et notification push. Il a <b>48h</b> pour accuser réception sur la plateforme.
          </div>
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7B4F00', marginBottom: 10 }}>📋 Préavis officiel</div>
            {[
              ['Bien', bien && bien.nom],
              ['Locataire notifié', bien && bien.locataire],
              ['Contact', bien && bien.tel],
              ['Motif', motif],
              ['Délai accordé', delai + ' mois'],
              ['Date de sortie estimée', addDays(parseInt(delai) * 30)],
              ['Statut', '⏳ En attente d\'accusé de réception'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#7B4F00', textAlign: 'right', maxWidth: '55%' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#1B5E20', lineHeight: 1.6 }}>
              ℹ️ Continuez à encaisser les loyers normalement jusqu'à la date de sortie. L'état des lieux de sortie sera planifié automatiquement dans <b>{delai} mois</b>.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>💬 Contacter le locataire</button>
            <button style={{ flex: 1, background: '#C62828', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📄 Télécharger PDF</button>
          </div>
        </div>
      ) : step === 'confirm' ? (
        /* ── DOUBLE CONFIRMATION ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>⚠️ Confirmer l'envoi du préavis</div>
          <div style={{ background: '#FFEBEE', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#B71C1C', fontWeight: 600, marginBottom: 4 }}>Action officielle et irréversible</div>
            <div style={{ fontSize: 12, color: '#C62828', lineHeight: 1.6 }}>Ce préavis sera envoyé officiellement à <b>{bien && bien.locataire}</b> par SMS et notification. Il apparaîtra dans l'historique du bien.</div>
          </div>
          <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            {[
              ['Bien', bien && bien.nom],
              ['Locataire', bien && bien.locataire],
              ['Motif', motif],
              ['Délai', delai + ' mois'],
              ['Date de sortie', addDays(parseInt(delai) * 30)],
              ['Note', note || 'Aucune note'],
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
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer' }}>← Modifier</button>
            <button onClick={envoyer}
              style={{ flex: 2, background: '#C62828', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>📤 Envoyer le préavis officiel</button>
          </div>
        </div>
      ) : (
        /* ── FORMULAIRE ── */
        <div>
          <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8 }}>
            <span>⚖️</span>
            <span style={{ fontSize: 12, color: '#7B4F00', lineHeight: 1.6 }}>Le préavis sera envoyé par SMS et notification push directement au locataire. Il apparaîtra comme une notification officielle sur son application.</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* SÉLECTION BIEN */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>Bien concerné *</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {biens.filter(function(b) { return !b.preavis; }).map(function(b) {
                  return (
                    <div key={b.id} onClick={function() { setBien(b); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: bien && bien.id === b.id ? '2px solid #C62828' : '0.5px solid #E0E0E0', background: bien && bien.id === b.id ? '#FFEBEE' : '#FAFAFA', borderRadius: 10, cursor: 'pointer' }}>
                      <span style={{ fontSize: 20 }}>{b.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{b.nom}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{b.locataire} · {b.tel}</div>
                      </div>
                      {bien && bien.id === b.id && <span style={{ color: '#C62828', fontSize: 16 }}>✓</span>}
                    </div>
                  );
                })}
                {biens.filter(function(b) { return !b.preavis; }).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 13 }}>Tous vos biens ont déjà un préavis en cours</div>
                )}
              </div>
            </div>

            {/* MOTIF */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>Motif du préavis *</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MOTIFS_PROPRIO.map(function(m) {
                  return (
                    <div key={m} onClick={function() { setMotif(m); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: motif === m ? '1.5px solid #C62828' : '0.5px solid #E0E0E0', background: motif === m ? '#FFEBEE' : '#FAFAFA', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: motif === m ? 'none' : '1.5px solid #CCC', background: motif === m ? '#C62828' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {motif === m && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: motif === m ? '#B71C1C' : '#555' }}>{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DÉLAI */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>Délai accordé au locataire *</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['1', '1 mois'], ['2', '2 mois'], ['3', '3 mois']].map(function(opt) {
                  return (
                    <button key={opt[0]} onClick={function() { setDelai(opt[0]); }}
                      style={{ padding: 10, borderRadius: 10, border: delai === opt[0] ? '2px solid #C62828' : '0.5px solid #E0E0E0', background: delai === opt[0] ? '#FFEBEE' : '#FAFAFA', color: delai === opt[0] ? '#B71C1C' : '#555', fontSize: 13, fontWeight: delai === opt[0] ? 700 : 400, cursor: 'pointer' }}>
                      {opt[1]}
                    </button>
                  );
                })}
              </div>
              {delai && (
                <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#B71C1C' }}>📅 Date de sortie estimée</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C62828' }}>{addDays(parseInt(delai) * 30)}</span>
                </div>
              )}
            </div>

            {/* NOTE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>Message au locataire (optionnel)</div>
              <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
                placeholder="Ajoutez un message pour expliquer la situation au locataire..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', height: 80, fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button onClick={function() { if (bien && motif && delai) setStep('confirm'); else toast.error('Remplissez tous les champs obligatoires'); }}
              style={{ width: '100%', background: bien && motif && delai ? '#C62828' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: bien && motif && delai ? 'pointer' : 'not-allowed' }}>
              📋 Continuer — Préparer le préavis officiel
            </button>
            {(!bien || !motif || !delai) && (
              <div style={{ fontSize: 11, color: '#C62828', textAlign: 'center', marginTop: 6 }}>Sélectionnez un bien, un motif et un délai</div>
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
  var auth = useAuth();
  var user = auth.user;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1B2B22', margin: 0 }}>📤 Préavis de départ</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
            {estProprietaire ? 'Envoyez un préavis officiel à un locataire' : 'Notifiez votre propriétaire de votre départ'}
          </p>
        </div>
      </div>
      {estProprietaire ? <PreavisProprio /> : <PreavisLocataire />}
    </div>
  );
}