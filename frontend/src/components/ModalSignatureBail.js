import { useState } from 'react';
import { PenLine } from 'lucide-react';

// Modal de signature électronique simple : capture le nom complet tapé
// par le signataire et son acceptation explicite des termes. La preuve
// (IP + horodatage) est enregistrée côté serveur au moment de l'appel API.
export default function ModalSignatureBail(props) {
  var onClose = props.onClose;
  var onConfirm = props.onConfirm;
  var nomSuggere = props.nomSuggere || '';
  var loading = props.loading || false;

  var [nomComplet, setNomComplet] = useState(nomSuggere);
  var [accepte, setAccepte] = useState(false);

  var peutSigner = nomComplet.trim().length >= 3 && accepte && !loading;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={function(e) { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PenLine size={18} strokeWidth={1.5} color="#1B6B3A" />
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1B2B22' }}>Signer le bail</h2>
        </div>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px', lineHeight: 1.5 }}>
          Votre signature électronique sera horodatée et associée à votre adresse IP, comme preuve d'acceptation du contrat.
        </p>

        <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
          Tapez votre nom complet pour signer
        </label>
        <input type="text" value={nomComplet} autoFocus
          onChange={function(e) { setNomComplet(e.target.value); }}
          placeholder="Ex: Mamadou Diallo"
          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#444', cursor: 'pointer', marginBottom: 22, lineHeight: 1.5 }}>
          <input type="checkbox" checked={accepte} onChange={function(e) { setAccepte(e.target.checked); }}
            style={{ marginTop: 2, width: 16, height: 16, accentColor: '#1B6B3A', flexShrink: 0, cursor: 'pointer' }} />
          Je certifie l'exactitude de mon identité et j'accepte les termes de ce contrat de bail.
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} disabled={loading}
            style={{ flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            Annuler
          </button>
          <button type="button" disabled={!peutSigner}
            onClick={function() { onConfirm(nomComplet.trim()); }}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: peutSigner ? '#1B6B3A' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: peutSigner ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Signature...' : 'Signer le bail'}
          </button>
        </div>
      </div>
    </div>
  );
}
