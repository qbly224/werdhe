import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Modal Mobile Money générique : réutilisable pour un paiement de loyer
// (reservation_id) ou un paiement d'abonnement (plan/cycle), selon les
// endpoints et le payload passés en props.
export default function ModalPaiementMobile(props) {
  var onClose = props.onClose;
  var onSuccess = props.onSuccess;
  var reservation = props.reservation;
  var montant = props.montant;
  var titre = props.titre || (reservation && reservation.logement_titre);
  var payload = props.payload || (reservation ? { reservation_id: reservation.id } : {});
  var endpoints = props.endpoints || {
    orange:    '/paiements/orange-money/initier',
    mtn:       '/paiements/mtn-momo/initier',
    confirmer: '/paiements/confirmer/',
  };

  var [operateur, setOperateur] = useState(null);
  var [telephone, setTelephone] = useState('');
  var [etape, setEtape] = useState(1);
  var [loading, setLoading] = useState(false);
  var [paiementData, setPaiementData] = useState(null);
  var [confirming, setConfirming] = useState(false);
  var [compteur, setCompteur] = useState(0);

  function formaterTel(val) {
    var clean = val.replace(/\D/g, '').slice(0, 9);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return clean.slice(0, 3) + ' ' + clean.slice(3);
    return clean.slice(0, 3) + ' ' + clean.slice(3, 6) + ' ' + clean.slice(6);
  }

  function initierPaiement() {
    setLoading(true);
    var endpoint = operateur === 'orange' ? endpoints.orange : endpoints.mtn;

    api.post(endpoint, Object.assign({}, payload, {
      telephone: telephone,
      montant: montant
    }))
      .then(function(res) {
        setPaiementData(res.data);
        setEtape(3);
        demarrerCompteur();
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur paiement');
      })
      .finally(function() { setLoading(false); });
  }

  function demarrerCompteur() {
    setCompteur(180);
    var interval = setInterval(function() {
      setCompteur(function(c) {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  function confirmerSimulation() {
    if (!paiementData) return;
    var id = paiementData.paiement_id || paiementData.facture_id;
    setConfirming(true);
    api.patch(endpoints.confirmer + id, { statut: 'complete' })
      .then(function() {
        toast.success('Paiement confirme ! 🎉');
        setEtape(4);
        if (onSuccess) onSuccess();
      })
      .catch(function() { toast.error('Erreur confirmation'); })
      .finally(function() { setConfirming(false); });
  }

  function formatTimer(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  var styles = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    },
    modal: {
      background: '#fff', borderRadius: '16px',
      padding: '28px', width: '100%', maxWidth: '420px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      fontFamily: "'Segoe UI', system-ui, sans-serif"
    }
  };

  return (
    <div style={styles.overlay} onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2 style={{margin:0, fontSize:'18px', fontWeight:'700', color:'#1B2B22'}}>
            💳 Paiement Mobile Money
          </h2>
          <button
            onClick={onClose}
            style={{background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#888', lineHeight:1}}
            type="button"
          >×</button>
        </div>

        <div style={{textAlign:'center', marginBottom:'20px', padding:'12px', background:'#F0F4F1', borderRadius:'10px'}}>
          <div style={{fontSize:'13px', color:'#666', marginBottom:'4px'}}>Montant à payer</div>
          <div style={{fontSize:'24px', fontWeight:'800', color:'#1B6B3A'}}>
            {Number(montant).toLocaleString('fr-FR')} GNF
          </div>
          <div style={{fontSize:'12px', color:'#888'}}>{titre}</div>
        </div>

        {etape === 1 && (
          <div>
            <div style={{fontSize:'13px', fontWeight:'600', color:'#555', marginBottom:'12px'}}>
              Choisissez votre operateur
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px'}}>
              <div
                onClick={function() { setOperateur('orange'); setEtape(2); }}
                style={{
                  border: '2px solid #FF6600',
                  borderRadius: '12px', padding: '20px 12px',
                  textAlign: 'center', cursor: 'pointer',
                  background: '#FFF3E0', transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width:'48px', height:'48px',
                  background:'#FF6600', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 10px', color:'#fff', fontWeight:'800', fontSize:'16px'
                }}>OM</div>
                <div style={{fontWeight:'700', fontSize:'14px', color:'#E65100'}}>Orange Money</div>
                <div style={{fontSize:'11px', color:'#888', marginTop:'4px'}}>Paiement instantane</div>
              </div>

              <div
                onClick={function() { setOperateur('mtn'); setEtape(2); }}
                style={{
                  border: '2px solid #FFCC00',
                  borderRadius: '12px', padding: '20px 12px',
                  textAlign: 'center', cursor: 'pointer',
                  background: '#FFFDE7', transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width:'48px', height:'48px',
                  background:'#FFCC00', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 10px', color:'#1B2B22', fontWeight:'800', fontSize:'14px'
                }}>MTN</div>
                <div style={{fontWeight:'700', fontSize:'14px', color:'#F57F17'}}>MTN MoMo</div>
                <div style={{fontSize:'11px', color:'#888', marginTop:'4px'}}>Paiement instantane</div>
              </div>
            </div>
          </div>
        )}

        {etape === 2 && (
          <div>
            <div style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'12px', borderRadius:'10px', marginBottom:'16px',
              background: operateur === 'orange' ? '#FFF3E0' : '#FFFDE7',
              border: '1px solid ' + (operateur === 'orange' ? '#FF6600' : '#FFCC00')
            }}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background: operateur === 'orange' ? '#FF6600' : '#FFCC00',
                display:'flex', alignItems:'center', justifyContent:'center',
                color: operateur === 'orange' ? '#fff' : '#1B2B22',
                fontWeight:'800', fontSize:'12px', flexShrink:0
              }}>
                {operateur === 'orange' ? 'OM' : 'MTN'}
              </div>
              <div>
                <div style={{fontWeight:'700', fontSize:'13px', color:'#1B2B22'}}>
                  {operateur === 'orange' ? 'Orange Money' : 'MTN MoMo'}
                </div>
                <div style={{fontSize:'11px', color:'#888'}}>Saisissez votre numero</div>
              </div>
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#555', display:'block', marginBottom:'6px'}}>
                Numero de telephone
              </label>
              <div style={{display:'flex', gap:'8px'}}>
                <div style={{
                  display:'flex', alignItems:'center', gap:'5px',
                  padding:'10px 12px', background:'#f5f5f5',
                  border:'1px solid #e0e0e0', borderRadius:'8px',
                  fontSize:'13px', color:'#555', flexShrink:0
                }}>
                  🇬🇳 +224
                </div>
                <input
                  type="tel"
                  placeholder="6XX XXX XXX"
                  value={telephone}
                  onChange={function(e) { setTelephone(formaterTel(e.target.value)); }}
                  style={{
                    flex:1, padding:'10px 12px', border:'1px solid #e0e0e0',
                    borderRadius:'8px', fontSize:'13px', outline:'none', margin:0
                  }}
                  onFocus={function(e) { e.target.style.borderColor = '#1B6B3A'; }}
                  onBlur={function(e) { e.target.style.borderColor = '#e0e0e0'; }}
                />
              </div>
              <div style={{fontSize:'11px', color:'#aaa', marginTop:'5px'}}>
                {operateur === 'orange' ? 'Numeros Orange : 060, 065, 066, 067, 068' : 'Numeros MTN : 061, 062, 063, 064'}
              </div>
            </div>

            <div style={{display:'flex', gap:'10px'}}>
              <button
                type="button"
                onClick={function() { setEtape(1); }}
                style={{flex:1, padding:'12px', background:'#f5f5f5', color:'#555', border:'none', borderRadius:'9px', fontSize:'14px', cursor:'pointer'}}
              >
                Retour
              </button>
              <button
                type="button"
                onClick={initierPaiement}
                disabled={loading || telephone.replace(/\s/g, '').length < 9}
                style={{
                  flex:2, padding:'12px',
                  background: loading || telephone.replace(/\s/g, '').length < 9 ? '#ccc' : (operateur === 'orange' ? '#FF6600' : '#FFCC00'),
                  color: operateur === 'mtn' ? '#1B2B22' : '#fff',
                  border:'none', borderRadius:'9px', fontSize:'14px',
                  fontWeight:'700', cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        )}

        {etape === 3 && paiementData && (
          <div>
            <div style={{textAlign:'center', marginBottom:'16px'}}>
              <div style={{
                width:'56px', height:'56px', borderRadius:'50%',
                background: operateur === 'orange' ? '#FFF3E0' : '#FFFDE7',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 12px', fontSize:'28px'
              }}>
                {operateur === 'orange' ? '📱' : '📲'}
              </div>
              <div style={{fontSize:'15px', fontWeight:'700', color:'#1B2B22', marginBottom:'6px'}}>
                Demande envoyee !
              </div>
              <div style={{fontSize:'13px', color:'#888', lineHeight:'1.6', marginBottom:'12px'}}>
                {paiementData.message}
              </div>
              {compteur > 0 && (
                <div style={{fontSize:'12px', color:'#E65100', fontWeight:'600', marginBottom:'12px'}}>
                  ⏱️ Expire dans {formatTimer(compteur)}
                </div>
              )}
            </div>

            {paiementData.instructions && (
              <div style={{background:'#F8F9FA', borderRadius:'10px', padding:'14px', marginBottom:'16px'}}>
                <div style={{fontSize:'12px', fontWeight:'700', color:'#555', marginBottom:'8px'}}>
                  Instructions :
                </div>
                {paiementData.instructions.map(function(inst, i) {
                  return (
                    <div key={i} style={{display:'flex', gap:'8px', marginBottom:'6px', fontSize:'12px', color:'#444'}}>
                      <span style={{fontWeight:'700', color: operateur === 'orange' ? '#FF6600' : '#F57F17', flexShrink:0}}>
                        {i + 1}.
                      </span>
                      <span>{inst}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{fontSize:'11px', color:'#aaa', textAlign:'center', marginBottom:'12px'}}>
              Ref : {paiementData.reference}
            </div>

            {paiementData.simulation && (
              <div>
                <div style={{
                  background:'#E8F5E9', border:'1px dashed #1B6B3A',
                  borderRadius:'10px', padding:'12px', marginBottom:'12px',
                  fontSize:'12px', color:'#1B5E20', textAlign:'center'
                }}>
                  🧪 Mode demonstration — cliquez pour simuler la confirmation
                </div>
                <button
                  type="button"
                  onClick={confirmerSimulation}
                  disabled={confirming}
                  style={{
                    width:'100%', padding:'13px',
                    background: confirming ? '#ccc' : '#1B6B3A',
                    color:'#fff', border:'none', borderRadius:'9px',
                    fontSize:'14px', fontWeight:'700', cursor: confirming ? 'not-allowed' : 'pointer'
                  }}
                >
                  {confirming ? 'Confirmation...' : 'Simuler la confirmation du paiement'}
                </button>
              </div>
            )}
          </div>
        )}

        {etape === 4 && (
          <div style={{textAlign:'center'}}>
            <div style={{
              width:'64px', height:'64px', borderRadius:'50%', background:'#E8F5E9',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 16px', fontSize:'32px'
            }}>✅</div>
            <div style={{fontSize:'18px', fontWeight:'700', color:'#1B2B22', marginBottom:'8px'}}>
              Paiement confirme !
            </div>
            <div style={{fontSize:'13px', color:'#888', marginBottom:'20px', lineHeight:'1.6'}}>
              Votre paiement de{' '}
              <strong style={{color:'#1B6B3A'}}>{Number(montant).toLocaleString('fr-FR')} GNF</strong>
              {' '}a ete confirme. Une quittance vous sera envoyee par email.
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{width:'100%', padding:'13px', background:'#1B6B3A', color:'#fff', border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}
            >
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}