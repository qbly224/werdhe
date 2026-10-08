/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Camera } from 'lucide-react';

var PIECES = [
  { id: 'salon',     labelKey: 'salon' },
  { id: 'cuisine',   labelKey: 'cuisine' },
  { id: 'chambre1',  labelKey: 'chambre1' },
  { id: 'chambre2',  labelKey: 'chambre2' },
  { id: 'sdb',       labelKey: 'sdb' },
  { id: 'toilettes', labelKey: 'toilettes' },
  { id: 'entree',    labelKey: 'entree' },
  { id: 'general',   labelKey: 'general' },
];

var ETATS = ['Excellent', 'Bon', 'Moyen', 'Mauvais'];
var ETAT_COLORS = {
  'Excellent': '#1B6B3A',
  'Bon':       '#1565C0',
  'Moyen':     '#E65100',
  'Mauvais':   '#B71C1C'
};

// ─── COMPOSANT SIGNATURE CANVAS ───────────────────────────────────
function SignatureCanvas({ label, onSigne }) {
  var t = useTranslation('dashboard').t;
  var canvasRef = useRef(null);
  var [dessin, setDessin] = useState(false);
  var [signe, setSigne]   = useState(false);
  var [vide, setVide]     = useState(true);
  var lastPos = useRef({ x: 0, y: 0 });

  function getPos(e, canvas) {
    var rect = canvas.getBoundingClientRect();
    var touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(e) {
    e.preventDefault();
    var canvas = canvasRef.current;
    if (!canvas) return;
    setDessin(true);
    setVide(false);
    lastPos.current = getPos(e, canvas);
  }

  function draw(e) {
    e.preventDefault();
    if (!dessin) return;
    var canvas = canvasRef.current;
    var ctx    = canvas.getContext('2d');
    var pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1B2B22';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDraw() { setDessin(false); }

  function effacer() {
    var canvas = canvasRef.current;
    var ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVide(true);
    setSigne(false);
  }

  function valider() {
    if (vide) { toast.error(t('etatDesLieux.signatureCanvas.signezDabord')); return; }
    var canvas  = canvasRef.current;
    var dataUrl = canvas.toDataURL('image/png');
    setSigne(true);
    if (onSigne) onSigne(dataUrl);
    toast.success(t('etatDesLieux.signatureCanvas.signatureEnregistreeToast'));
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22', marginBottom: 8 }}>{label}</div>
      {signe ? (
        <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} strokeWidth={1.5} color="#1B6B3A" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1B5E20' }}>{t('etatDesLieux.signatureCanvas.signatureEnregistree')}</span>
          <button onClick={effacer} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>{t('etatDesLieux.signatureCanvas.recommencer')}</button>
        </div>
      ) : (
        <div>
          <div style={{ border: '1.5px dashed #1B6B3A', borderRadius: 10, background: '#FAFAFA', position: 'relative', touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={120}
              style={{ width: '100%', height: 120, borderRadius: 10, cursor: 'crosshair', display: 'block' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {vide && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#ccc', fontSize: 13, pointerEvents: 'none', textAlign: 'center' }}>
                {t('etatDesLieux.signatureCanvas.signezIci')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={effacer} style={{ padding: '7px 14px', borderRadius: 8, border: '0.5px solid #E0E0E0', background: '#F5F5F5', color: '#555', fontSize: 12, cursor: 'pointer' }}>{t('etatDesLieux.signatureCanvas.effacer')}</button>
            <button onClick={valider} disabled={vide}
              style={{ flex: 1, padding: '7px 14px', borderRadius: 8, border: 'none', background: vide ? '#CCC' : '#1B6B3A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: vide ? 'not-allowed' : 'pointer' }}>
              {t('etatDesLieux.signatureCanvas.validerMaSignature')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ÉTAT DES LIEUX ──────────────────────────
export default function EtatDesLieux({ reservationId, type = 'entree', onTermine }) {
  var t = useTranslation('dashboard').t;
  var [etats, setEtats]         = useState({});
  var [observations, setObs]    = useState({});
  var [photos, setPhotos]       = useState({});
  var [sigProprio, setSigProprio] = useState(null);
  var [sigLocataire, setSigLocataire] = useState(null);
  var [step, setStep]           = useState('pieces'); // pieces | signatures | confirmation
  var [saving, setSaving]       = useState(false);

  var progressPieces = Object.keys(etats).length;
  var totalPieces    = PIECES.length;

  function handleEtat(pieceId, etat) {
    setEtats(function(prev) { return Object.assign({}, prev, { [pieceId]: etat }); });
  }

  function handleObs(pieceId, val) {
    setObs(function(prev) { return Object.assign({}, prev, { [pieceId]: val }); });
  }

  function handlePhoto(pieceId, file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      setPhotos(function(prev) { return Object.assign({}, prev, { [pieceId]: { file: file, url: e.target.result } }); });
    };
    reader.readAsDataURL(file);
    var piece = PIECES.find(function(p) { return p.id === pieceId; });
    toast.success(t('etatDesLieux.photoAjouteePour', { piece: t('etatDesLieux.pieces.' + piece.labelKey) }));
  }

  async function soumettre() {
    if (!sigProprio || !sigLocataire) {
      toast.error(t('etatDesLieux.deuxPartiesDoiventSigner'));
      return;
    }
    setSaving(true);
    try {
      var fd = new FormData();
      fd.append('reservation_id', reservationId);
      fd.append('type', type);
      fd.append('etats', JSON.stringify(etats));
      fd.append('observations', JSON.stringify(observations));
      fd.append('signature_proprio', sigProprio);
      fd.append('signature_locataire', sigLocataire);

      Object.entries(photos).forEach(function(entry) {
        fd.append('photo_' + entry[0], entry[1].file);
      });

      await api.post('/etat-des-lieux', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      setStep('confirmation');
      toast.success(t('etatDesLieux.etatEnregistreEtSigne'));
    } catch (err) {
      toast.error(t('etatDesLieux.erreurEnregistrement'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (step === 'confirmation') {
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={48} strokeWidth={1.5} color="#1B6B3A" /></div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1B6B3A', marginBottom: 8 }}>
          {type === 'entree' ? t('etatDesLieux.confirmation.titreEntree') : t('etatDesLieux.confirmation.titreSortie')}
        </div>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
          {t('etatDesLieux.confirmation.description')}
        </div>
        <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 14, marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B5E20', marginBottom: 8 }}>{t('etatDesLieux.confirmation.resume')}</div>
          {PIECES.filter(function(p) { return etats[p.id]; }).map(function(p) {
            var etat = etats[p.id];
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '0.5px solid #C8E6C9' }}>
                <span>{t('etatDesLieux.pieces.' + p.labelKey)}</span>
                <span style={{ fontWeight: 600, color: ETAT_COLORS[etat] }}>{etat}</span>
              </div>
            );
          })}
        </div>
        {onTermine && (
          <button onClick={onTermine} style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('etatDesLieux.confirmation.continuer')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: type === 'entree' ? '#1B6B3A' : '#C62828', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
          {type === 'entree' ? t('etatDesLieux.header.titreEntree') : t('etatDesLieux.header.titreSortie')}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>
          {step === 'pieces' ? t('etatDesLieux.header.piecesRenseignees', { progress: progressPieces, total: totalPieces }) : t('etatDesLieux.header.signaturesDesDeuxParties')}
        </div>
      </div>

      {/* BARRE DE PROGRESSION */}
      <div style={{ background: '#F0F0F0', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ background: type === 'entree' ? '#1B6B3A' : '#C62828', width: step === 'signatures' ? '100%' : (progressPieces / totalPieces * 70) + '%', height: '100%', borderRadius: 6, transition: 'width .4s' }} />
      </div>

      {step === 'pieces' && (
        <div>
          {PIECES.map(function(piece) {
            var etatPiece = etats[piece.id];
            return (
              <div key={piece.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid ' + (etatPiece ? ETAT_COLORS[etatPiece] : '#E0E0E0') }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('etatDesLieux.pieces.' + piece.labelKey)}</div>

                {/* Boutons état */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                  {ETATS.map(function(e) {
                    var actif = etatPiece === e;
                    return (
                      <button key={e} onClick={function() { handleEtat(piece.id, e); }}
                        style={{ padding: '7px 4px', borderRadius: 8, border: actif ? '2px solid ' + ETAT_COLORS[e] : '0.5px solid #E0E0E0', background: actif ? ETAT_COLORS[e] + '20' : '#FAFAFA', color: actif ? ETAT_COLORS[e] : '#888', fontSize: 11, fontWeight: actif ? 700 : 400, cursor: 'pointer' }}>
                        {e}
                      </button>
                    );
                  })}
                </div>

                {/* Observation */}
                <input type="text" placeholder={t('etatDesLieux.observationsPlaceholder')} value={observations[piece.id] || ''}
                  onChange={function(e) { handleObs(piece.id, e.target.value); }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />

                {/* Photo */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={function(e) { if (e.target.files[0]) handlePhoto(piece.id, e.target.files[0]); }} />
                  <div style={{ padding: '6px 12px', borderRadius: 8, background: photos[piece.id] ? '#E8F5E9' : '#F5F5F5', color: photos[piece.id] ? '#1B6B3A' : '#888', fontSize: 12, fontWeight: 600, border: photos[piece.id] ? '0.5px solid #A5D6A7' : '0.5px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={14} strokeWidth={1.5} /> {photos[piece.id] ? t('etatDesLieux.photoAjoutee') : t('etatDesLieux.ajouterUnePhoto')}
                  </div>
                  {photos[piece.id] && (
                    <img src={photos[piece.id].url} alt={t('etatDesLieux.pieces.' + piece.labelKey)} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  )}
                </label>
              </div>
            );
          })}

          <button
            onClick={function() { if (progressPieces < 3) { toast.error(t('etatDesLieux.renseignezAuMoins3Pieces')); return; } setStep('signatures'); }}
            style={{ width: '100%', background: progressPieces >= 3 ? '#1B6B3A' : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: progressPieces >= 3 ? 'pointer' : 'not-allowed' }}>
            {t('etatDesLieux.passerAuxSignatures')}
          </button>
        </div>
      )}

      {step === 'signatures' && (
        <div>
          <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#7B4F00' }}>
            {t('etatDesLieux.avertissementLegal')}
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>{t('etatDesLieux.signaturesDesParties')}</div>
            <SignatureCanvas label={t('etatDesLieux.signatureProprietaire')} onSigne={setSigProprio} />
            <SignatureCanvas label={t('etatDesLieux.signatureLocataire')} onSigne={setSigLocataire} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setStep('pieces'); }}
              style={{ padding: '12px 20px', borderRadius: 10, border: '0.5px solid #E0E0E0', background: '#F5F5F5', color: '#555', fontSize: 13, cursor: 'pointer' }}>
              {t('etatDesLieux.retour')}
            </button>
            <button onClick={soumettre} disabled={!sigProprio || !sigLocataire || saving}
              style={{ flex: 1, background: sigProprio && sigLocataire ? '#1B6B3A' : '#CCC', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: sigProprio && sigLocataire ? 'pointer' : 'not-allowed' }}>
              {saving ? t('etatDesLieux.enregistrementEnCours') : t('etatDesLieux.validerEtatDesLieux')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}