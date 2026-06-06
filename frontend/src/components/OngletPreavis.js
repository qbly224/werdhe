/* eslint-disable */
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

var MOTIFS_LOCATAIRE = [
  'Changement de ville ou de pays',
  'Achat d\'un bien immobilier',
  'Logement ne correspond plus a mes besoins',
  'Raisons professionnelles',
  'Raisons familiales',
  'Conditions du logement insatisfaisantes',
  'Autre raison',
];

var MOTIFS_PROPRIO = [
  'Vente du bien immobilier',
  'Reprise du bien pour usage personnel',
  'Travaux de renovation importants',
  'Non-paiement repete des loyers',
  'Troubles de voisinage',
  'Fin de bail non renouvele',
  'Autre motif',
];

function addDays(n) {
  var d = new Date(); d.setDate(d.getDate() + n);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── PRÉAVIS LOCATAIRE ────────────────────────────────────────────────────────
export function PreavisLocataire(props) {
  var stats       = props.stats || {};
  var [step,      setStep]      = useState('form'); // form | confirm | sent
  var [motif,     setMotif]     = useState('');
  var [delai,     setDelai]     = useState('1');
  var [note,      setNote]      = useState('');
  var [logement,  setLogement]  = useState(null);

  useEffect(function() {
    var resaActive = (stats.reservations || []).find(function(r) { return r.statut === 'confirmee'; });
    if (resaActive) {
      setLogement({
        id:        resaActive.id,
        nom:       resaActive.logement_titre  || 'Mon logement',
        proprio:   (resaActive.proprietaire_prenom || '') + ' ' + (resaActive.proprietaire_nom || ''),
        quartier:  resaActive.logement_ville  || 'Conakry',
      });
    } else {
      setLogement({ id: null, nom: 'Appartement F3 — Ratoma', proprio: 'Mamadou Barry', quartier: 'Ratoma, Conakry' });
    }
  }, [stats]);

  var dateFinEstimee = delai ? addDays(parseInt(delai) * 30) : '—';

  function envoyer() {
    if (logement && logement.id) {
      api.post('/documents/generer', { reservation_id: logement.id, type: 'preavis' }).catch(console.error);
    }
    setStep('sent');
    toast.success('Preavis envoye avec succes !');
  }

  if (!logement) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Chargement...</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ background: '#C62828', borderRadius: '14px', padding: '16px 18px', marginBottom: '18px' }}>
        <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Donner mon preavis de depart</div>
        <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '12px', marginTop: '2px' }}>{logement.nom} · Proprietaire : {logement.proprio}</div>
      </div>

      {step === 'sent' ? (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '44px', marginBottom: '14px' }}>📨</div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#1B2B22', marginBottom: '8px' }}>Preavis envoye avec succes !</div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
            Votre preavis a ete transmis a <strong>{logement.proprio}</strong> par notification et SMS.<br/>
            Il a <strong>48h</strong> pour accuser reception.
          </div>
          <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '14px', marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#7B4F00', marginBottom: '10px' }}>Recapitulatif de votre preavis</div>
            {[
              ['Bien concerne',    logement.nom],
              ['Proprietaire',     logement.proprio],
              ['Motif',            motif || 'Non renseigne'],
              ['Delai de preavis', delai + ' mois'],
              ['Date de depart',   dateFinEstimee],
              ['Statut',           'En attente d\'accuse de reception'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: '600', color: '#7B4F00', textAlign: 'right', maxWidth: '60%' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '12px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: '#1B5E20', lineHeight: '1.6' }}>
              Continuez a payer votre loyer normalement jusqu'a votre date de depart officielle.
              L'etat des lieux de sortie sera planifie apres l'accuse de reception.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', cursor: 'pointer' }}>
              Contacter le proprio
            </button>
            <button type="button" style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Telecharger PDF
            </button>
          </div>
        </div>

      ) : step === 'confirm' ? (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1B2B22', marginBottom: '14px' }}>Confirmer votre preavis</div>
          <div style={{ background: '#FFEBEE', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#B71C1C', fontWeight: '600', marginBottom: '6px' }}>Attention — action irreversible</div>
            <div style={{ fontSize: '12px', color: '#C62828', lineHeight: '1.6' }}>
              Une fois envoye, votre preavis est officiel et notifie immediatement votre proprietaire.
              Assurez-vous que toutes les informations sont correctes.
            </div>
          </div>
          <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            {[
              ['Bien',                    logement.nom],
              ['Proprietaire notifie',    logement.proprio],
              ['Motif',                   motif],
              ['Delai de preavis',        delai + ' mois'],
              ['Date de depart estimee',  dateFinEstimee],
              ['Note personnelle',        note || 'Aucune note'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '0.5px solid #EFEFEF', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: '600', color: '#333', textAlign: 'right', maxWidth: '60%' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={function() { setStep('form'); }}
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer' }}>
              Modifier
            </button>
            <button type="button" onClick={envoyer}
              style={{ flex: 2, background: '#C62828', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Confirmer l'envoi du preavis
            </button>
          </div>
        </div>

      ) : (
        <div>
          <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚖️</span>
            <span style={{ fontSize: '12px', color: '#7B4F00', lineHeight: '1.6' }}>
              En Guinee, le delai de preavis legal standard est generalement d'<strong>1 mois</strong> pour un logement meuble
              et <strong>3 mois</strong> pour un logement non meuble. Verifiez les conditions de votre bail.
            </span>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1B2B22', marginBottom: '14px' }}>Informations du preavis</div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>Motif de depart *</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MOTIFS_LOCATAIRE.map(function(m) {
                  return (
                    <div key={m} onClick={function() { setMotif(m); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer',
                        border:     motif === m ? '1.5px solid #1A4FA0' : '0.5px solid #E0E0E0',
                        background: motif === m ? '#E3F2FD' : '#FAFAFA',
                        borderRadius: '10px',
                      }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        border:     motif === m ? 'none' : '1.5px solid #CCC',
                        background: motif === m ? '#1A4FA0' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {motif === m && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '13px', color: motif === m ? '#0D47A1' : '#555' }}>{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>Delai de preavis souhaite *</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[['1','1 mois'],['2','2 mois'],['3','3 mois']].map(function(opt) {
                  return (
                    <button key={opt[0]} type="button" onClick={function() { setDelai(opt[0]); }}
                      style={{ padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                        border:     delai === opt[0] ? '2px solid #1A4FA0' : '0.5px solid #E0E0E0',
                        background: delai === opt[0] ? '#E3F2FD' : '#FAFAFA',
                        color:      delai === opt[0] ? '#0D47A1' : '#555',
                        fontWeight: delai === opt[0] ? 700 : 400,
                      }}>
                      {opt[1]}
                    </button>
                  );
                })}
              </div>
              {delai && (
                <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '10px 14px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#1B5E20' }}>Date de depart estimee</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B6B3A' }}>{dateFinEstimee}</div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>Note au proprietaire (optionnel)</div>
              <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
                placeholder="Ajoutez un message personnel a votre proprietaire..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid #E0E0E0', fontSize: '13px', resize: 'none', height: '80px', fontFamily: 'system-ui', margin: 0 }}
              />
            </div>

            <button type="button" onClick={function() { if (motif && delai) setStep('confirm'); }}
              style={{ width: '100%', background: motif && delai ? '#C62828' : '#CCC', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: motif && delai ? 'pointer' : 'not-allowed' }}>
              Continuer — Envoyer mon preavis de depart
            </button>
            {(!motif || !delai) && (
              <div style={{ fontSize: '11px', color: '#C62828', textAlign: 'center', marginTop: '6px' }}>
                Veuillez selectionner un motif et un delai de preavis
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRÉAVIS PROPRIÉTAIRE ─────────────────────────────────────────────────────
export function PreavisProprietaire(props) {
  var stats = props.stats || {};
  var [step,   setStep]   = useState('list'); // list | form | confirm | sent
  var [biens,  setBiens]  = useState([]);
  var [selected, setSelected] = useState(null);
  var [motif,  setMotif]  = useState('');
  var [delai,  setDelai]  = useState('3');
  var [note,   setNote]   = useState('');

  useEffect(function() {
    var biensOccupes = (stats.logements || []).filter(function(l) { return l.statut === 'loue'; }).map(function(l) {
      var resa = (stats.reservations || []).find(function(r) { return r.logement_id === l.id && r.statut === 'confirmee'; });
      return {
        id:        l.id,
        nom:       l.titre,
        locataire: resa ? (resa.locataire_prenom + ' ' + resa.locataire_nom) : '—',
        tel:       resa ? (resa.locataire_telephone || '—') : '—',
        loyer:     Number(l.prix_mensuel),
        debut:     resa ? new Date(resa.date_debut).toLocaleDateString('fr-FR') : '—',
        preavis:   false,
        icon:      '🏠',
        resa_id:   resa ? resa.id : null,
      };
    });

    if (biensOccupes.length > 0) {
      setBiens(biensOccupes);
    } else {
      setBiens([
        { id: '1', nom: 'Villa Ratoma',    locataire: 'Mamadou Diallo',   tel: '+224 622 11 22 33', loyer: 2500000, debut: '1er mars 2024',   preavis: false, icon: '🏠', resa_id: null },
        { id: '2', nom: 'Appart Kaloum 2', locataire: 'Fatoumata Camara', tel: '+224 664 33 44 55', loyer: 1800000, debut: '1er juillet 2025', preavis: true,  icon: '🏢', resa_id: null },
        { id: '3', nom: 'Studio Matam',    locataire: 'Sekou Konate',     tel: '+224 655 77 88 99', loyer: 900000,  debut: '1er janvier 2025', preavis: false, icon: '🏠', resa_id: null },
      ]);
    }
  }, [stats]);

  var biensDisponibles = biens.filter(function(b) { return !b.preavis; });
  var dateFinEstimee   = delai ? addDays(parseInt(delai) * 30) : '—';

  function envoyerPreavis() {
    if (selected && selected.resa_id) {
      api.post('/documents/generer', { reservation_id: selected.resa_id, type: 'preavis' }).catch(console.error);
    }
    setBiens(function(prev) {
      return prev.map(function(b) { return b.id === selected.id ? Object.assign({}, b, { preavis: true }) : b; });
    });
    setStep('sent');
    toast.success('Preavis envoye au locataire !');
  }

  if (step === 'list') {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#1B6B3A', borderRadius: '14px', padding: '16px 18px', marginBottom: '18px' }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Mes biens</div>
          <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '12px', marginTop: '2px' }}>{biens.length} biens en gestion</div>
        </div>

        {biens.map(function(b) {
          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderLeft: '4px solid ' + (b.preavis ? '#C62828' : '#1B6B3A') }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: '#E8F5E9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{b.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B2B22' }}>{b.nom}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{b.locataire} · Depuis {b.debut}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B6B3A', marginTop: '3px' }}>{new Intl.NumberFormat('fr-FR').format(b.loyer)} GNF/mois</div>
                </div>
                <div>
                  {b.preavis ? (
                    <span style={{ background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'block', textAlign: 'center' }}>
                      Preavis envoye
                    </span>
                  ) : (
                    <span style={{ background: '#E8F5E9', color: '#1B5E20', border: '0.5px solid #A5D6A7', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'block', textAlign: 'center' }}>
                      Occupe
                    </span>
                  )}
                </div>
              </div>

              {b.preavis && (
                <div style={{ background: '#FFEBEE', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>📋</span>
                  <div style={{ fontSize: '12px', color: '#B71C1C', lineHeight: '1.5' }}>
                    Preavis de depart envoye a {b.locataire}. <strong>En attente d'accuse de reception.</strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" style={{ flex: 1, background: '#F0F4F1', color: '#1B6B3A', border: '0.5px solid #A5D6A7', borderRadius: '10px', padding: '9px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                  Messagerie
                </button>
                <button type="button" style={{ flex: 1, background: '#E3F2FD', color: '#1A4FA0', border: '0.5px solid #90CAF9', borderRadius: '10px', padding: '9px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                  Documents
                </button>
                {!b.preavis && (
                  <button type="button"
                    onClick={function() { setSelected(b); setMotif(''); setNote(''); setStep('form'); }}
                    style={{ flex: 1, background: '#FFEBEE', color: '#C62828', border: '0.5px solid #FFCDD2', borderRadius: '10px', padding: '9px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                    Preavis
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (step === 'sent') {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#C62828', borderRadius: '14px', padding: '16px 18px', marginBottom: '18px' }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Preavis envoye</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '44px', marginBottom: '14px' }}>✅</div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#1B2B22', marginBottom: '8px' }}>Preavis envoye !</div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
            <strong>{selected ? selected.locataire : ''}</strong> a ete notifie par SMS et notification push.<br/>
            Il a <strong>48h</strong> pour accuser reception sur la plateforme.
          </div>
          <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '14px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#7B4F00', marginBottom: '10px' }}>Preavis officiel</div>
            {[
              ['Bien',                selected ? selected.nom : ''],
              ['Locataire notifie',   selected ? selected.locataire : ''],
              ['Contact',             selected ? selected.tel : ''],
              ['Motif',               motif],
              ['Delai accorde',       delai + ' mois'],
              ['Date de sortie',      dateFinEstimee],
              ['Statut',              'En attente d\'accuse de reception'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '0.5px solid #FFE082', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: '600', color: '#7B4F00', textAlign: 'right', maxWidth: '55%' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '12px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: '#1B5E20', lineHeight: '1.6' }}>
              Continuez a encaisser les loyers normalement jusqu'a la date de sortie.
              L'etat des lieux de sortie sera planifie automatiquement dans <strong>{delai} mois</strong>.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={function() { setStep('list'); }}
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', cursor: 'pointer' }}>
              Retour aux biens
            </button>
            <button type="button"
              style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Telecharger PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#C62828', borderRadius: '14px', padding: '16px 18px', marginBottom: '18px' }}>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Confirmer le preavis</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1B2B22', marginBottom: '14px' }}>Confirmer l'envoi du preavis</div>
          <div style={{ background: '#FFEBEE', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#B71C1C', fontWeight: '600', marginBottom: '4px' }}>Action officielle et irreversible</div>
            <div style={{ fontSize: '12px', color: '#C62828', lineHeight: '1.6' }}>
              Ce preavis sera envoye officiellement a <strong>{selected ? selected.locataire : ''}</strong> par SMS et notification.
              Il apparaitra dans l'historique du bien.
            </div>
          </div>
          <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            {[
              ['Bien',          selected ? selected.nom : ''],
              ['Locataire',     selected ? selected.locataire : ''],
              ['Motif',         motif],
              ['Delai',         delai + ' mois'],
              ['Date de sortie',dateFinEstimee],
              ['Note',          note || 'Aucune note'],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '0.5px solid #EFEFEF', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: '600', color: '#333', maxWidth: '60%', textAlign: 'right' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={function() { setStep('form'); }}
              style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer' }}>
              Modifier
            </button>
            <button type="button" onClick={envoyerPreavis}
              style={{ flex: 2, background: '#C62828', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Envoyer le preavis officiel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'form'
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#C62828', borderRadius: '14px', padding: '16px 18px', marginBottom: '18px' }}>
        <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Envoyer un preavis de depart</div>
        <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '12px', marginTop: '2px' }}>Notification officielle au locataire</div>
      </div>

      <div style={{ background: '#FFF8E1', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <span>⚖️</span>
        <span style={{ fontSize: '12px', color: '#7B4F00', lineHeight: '1.6' }}>
          Le preavis sera envoye par SMS et notification push directement au locataire.
          Il apparaitra comme une notification officielle sur son application.
        </span>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>

        {biensDisponibles.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>Bien concerne *</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {biensDisponibles.map(function(b) {
                return (
                  <div key={b.id} onClick={function() { setSelected(b); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', cursor: 'pointer',
                      border:     selected && selected.id === b.id ? '2px solid #C62828' : '0.5px solid #E0E0E0',
                      background: selected && selected.id === b.id ? '#FFEBEE' : '#FAFAFA',
                      borderRadius: '10px',
                    }}>
                    <span style={{ fontSize: '20px' }}>{b.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1B2B22' }}>{b.nom}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{b.locataire} · {b.tel}</div>
                    </div>
                    {selected && selected.id === b.id && <span style={{ color: '#C62828', fontSize: '16px' }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>Motif du preavis *</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {MOTIFS_PROPRIO.map(function(m) {
              return (
                <div key={m} onClick={function() { setMotif(m); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer',
                    border:     motif === m ? '1.5px solid #C62828' : '0.5px solid #E0E0E0',
                    background: motif === m ? '#FFEBEE' : '#FAFAFA',
                    borderRadius: '10px',
                  }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    border:     motif === m ? 'none' : '1.5px solid #CCC',
                    background: motif === m ? '#C62828' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {motif === m && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '13px', color: motif === m ? '#B71C1C' : '#555' }}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>Delai accorde au locataire *</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[['1','1 mois'],['2','2 mois'],['3','3 mois']].map(function(opt) {
              return (
                <button key={opt[0]} type="button" onClick={function() { setDelai(opt[0]); }}
                  style={{ padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                    border:     delai === opt[0] ? '2px solid #C62828' : '0.5px solid #E0E0E0',
                    background: delai === opt[0] ? '#FFEBEE' : '#FAFAFA',
                    color:      delai === opt[0] ? '#B71C1C' : '#555',
                    fontWeight: delai === opt[0] ? 700 : 400,
                  }}>
                  {opt[1]}
                </button>
              );
            })}
          </div>
          {delai && (
            <div style={{ background: '#FFEBEE', borderRadius: '10px', padding: '10px 14px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#B71C1C' }}>Date de sortie estimee</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#C62828' }}>{dateFinEstimee}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>Message au locataire (optionnel)</div>
          <textarea value={note} onChange={function(e) { setNote(e.target.value); }}
            placeholder="Ajoutez un message pour expliquer la situation au locataire..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid #E0E0E0', fontSize: '13px', resize: 'none', height: '80px', fontFamily: 'system-ui', margin: 0 }}
          />
        </div>

        <button type="button"
          onClick={function() { if ((selected || biensDisponibles.length === 1) && motif && delai) { if (!selected) setSelected(biensDisponibles[0]); setStep('confirm'); } }}
          style={{ width: '100%', background: motif && delai ? '#C62828' : '#CCC', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: motif && delai ? 'pointer' : 'not-allowed' }}>
          Continuer — Preparer le preavis officiel
        </button>
        {(!motif || !delai) && (
          <div style={{ fontSize: '11px', color: '#C62828', textAlign: 'center', marginTop: '6px' }}>
            Selectionnez un motif et un delai
          </div>
        )}
      </div>
    </div>
  );
}