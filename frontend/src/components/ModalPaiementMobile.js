import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';

// Modal de paiement générique (Djomy) : réutilisable pour un paiement de
// loyer (reservation_id) ou un paiement d'abonnement (plan/cycle), selon
// l'endpoint et le payload passés en props. Djomy héberge lui-même le choix
// de l'opérateur (Orange Money / MTN MoMo / Kulu / carte) et l'OTP ; Werdhe
// se contente d'initier le paiement puis de rediriger vers l'URL renvoyée.
export default function ModalPaiementMobile(props) {
  var t = useTranslation('dashboard').t;
  var onClose = props.onClose;
  var reservation = props.reservation;
  var montant = props.montant;
  var titre = props.titre || (reservation && reservation.logement_titre);
  var payload = props.payload || (reservation ? { reservation_id: reservation.id } : {});
  var endpoint = props.endpoint || '/paiements/djomy/initier';

  var [telephone, setTelephone] = useState('');
  var [loading, setLoading] = useState(false);

  function formaterTel(val) {
    var clean = val.replace(/\D/g, '').slice(0, 9);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return clean.slice(0, 3) + ' ' + clean.slice(3);
    return clean.slice(0, 3) + ' ' + clean.slice(3, 6) + ' ' + clean.slice(6);
  }

  function payer() {
    setLoading(true);
    api.post(endpoint, Object.assign({}, payload, { telephone: telephone }))
      .then(function(res) {
        if (res.data && res.data.redirectUrl) {
          window.location.href = res.data.redirectUrl;
        } else {
          toast.error(t('modalPaiementMobile.erreurPaiement'));
          setLoading(false);
        }
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : t('modalPaiementMobile.erreurPaiement'));
        setLoading(false);
      });
  }

  var telephoneValide = telephone.replace(/\s/g, '').length === 9;

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
          <h2 style={{margin:0, fontSize:'18px', fontWeight:'700', color:'#1B2B22', display:'flex', alignItems:'center', gap:8}}>
            <Smartphone size={18} strokeWidth={1.75} /> {t('modalPaiementMobile.titre')}
          </h2>
          <button
            onClick={onClose}
            style={{background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#888', lineHeight:1}}
            type="button"
          >×</button>
        </div>

        <div style={{textAlign:'center', marginBottom:'20px', padding:'12px', background:'#F0F4F1', borderRadius:'10px'}}>
          <div style={{fontSize:'13px', color:'#666', marginBottom:'4px'}}>{t('modalPaiementMobile.montantAPayer')}</div>
          <div style={{fontSize:'24px', fontWeight:'800', color:'#1B6B3A'}}>
            {Number(montant).toLocaleString('fr-FR')} GNF
          </div>
          {titre && <div style={{fontSize:'12px', color:'#888'}}>{titre}</div>}
        </div>

        <div style={{marginBottom:'16px'}}>
          <label style={{fontSize:'13px', fontWeight:'600', color:'#555', display:'block', marginBottom:'6px'}}>
            {t('modalPaiementMobile.numeroTelephone')}
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
          <div style={{fontSize:'11px', color:'#aaa', marginTop:'8px', lineHeight:'1.5'}}>
            {t('modalPaiementMobile.methodesAcceptees')}
          </div>
        </div>

        <div style={{display:'flex', gap:'10px'}}>
          <button
            type="button"
            onClick={onClose}
            style={{flex:1, padding:'12px', background:'#f5f5f5', color:'#555', border:'none', borderRadius:'9px', fontSize:'14px', cursor:'pointer'}}
          >
            {t('modalPaiementMobile.fermer')}
          </button>
          <button
            type="button"
            onClick={payer}
            disabled={loading || !telephoneValide}
            style={{
              flex:2, padding:'12px',
              background: loading || !telephoneValide ? '#ccc' : '#1B6B3A',
              color:'#fff',
              border:'none', borderRadius:'9px', fontSize:'14px',
              fontWeight:'700', cursor: loading || !telephoneValide ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t('modalPaiementMobile.redirectionEnCours') : t('modalPaiementMobile.payer')}
          </button>
        </div>

      </div>
    </div>
  );
}
