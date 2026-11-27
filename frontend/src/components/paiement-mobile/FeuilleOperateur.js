import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check, Bell } from 'lucide-react';
import OperateurLogo from './OperateurLogo';

// Volet qui monte du bas (bottom sheet) : « Bientôt disponible sur Werdhè ».
// En attendant le paiement automatique, il donne le numéro du propriétaire pour payer hors de Werdhè.
export default function FeuilleOperateur(props) {
  var t = useTranslation('dashboard').t;
  var P = 'paiementMobile.feuille.';
  var op = props.operateur; // { operateur, label, numero }
  var [copie, setCopie] = useState(false);
  var [prevenu, setPrevenu] = useState(!!props.dejaPrevenu);
  var [envoi, setEnvoi] = useState(false);
  var fermerRef = useRef(null);
  var onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;

  // Échap ferme ; le focus va sur « Fermer » ; la page derrière ne défile pas.
  useEffect(function() {
    function surTouche(e) { if (e.key === 'Escape') onCloseRef.current(); }
    document.addEventListener('keydown', surTouche);
    var avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (fermerRef.current) fermerRef.current.focus();
    return function() { document.removeEventListener('keydown', surTouche); document.body.style.overflow = avant; };
  }, []);

  useEffect(function() {
    if (!copie) return;
    var id = setTimeout(function() { setCopie(false); }, 2000);
    return function() { clearTimeout(id); };
  }, [copie]);

  function copier() {
    var texte = op.numero;
    function ok() { setCopie(true); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(ok).catch(function() { repli(); });
    } else { repli(); }
    function repli() {
      try {
        var z = document.createElement('textarea');
        z.value = texte; z.setAttribute('readonly', ''); z.style.position = 'fixed'; z.style.opacity = '0';
        document.body.appendChild(z); z.select(); document.execCommand('copy'); document.body.removeChild(z); ok();
      } catch (e) { /* copie impossible : le numéro reste affiché et sélectionnable */ }
    }
  }

  function prevenir() {
    setEnvoi(true);
    props.onPrevenir(op.operateur).then(function() { setPrevenu(true); }).catch(function() {}).finally(function() { setEnvoi(false); });
  }

  return (
    <div className="pm-overlay" onMouseDown={function(e) { if (e.target === e.currentTarget) props.onClose(); }}>
      <div className="pm-sheet" role="dialog" aria-modal="true" aria-labelledby="pm-sheet-titre">
        <div className="pm-sheet__poignee" aria-hidden="true" />
        <button type="button" ref={fermerRef} className="pm-sheet__fermer" onClick={props.onClose} aria-label={t(P + 'fermer')}>
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <div className="pm-sheet__tete">
          <OperateurLogo operateur={op.operateur} taille={48} />
          <div>
            <h3 id="pm-sheet-titre">{t(P + 'titre')}</h3>
            <span className="pm-chip pm-chip--soon">{t('paiementMobile.bientot')}</span>
          </div>
        </div>

        <p className="pm-sheet__texte">{t(P + 'texte')}</p>

        <div className="pm-encadre">
          <div className="pm-encadre__titre">{t(P + 'enAttendant')}</div>
          <dl className="pm-encadre__lignes">
            <div><dt>{t(P + 'operateur')}</dt><dd>{op.label}</dd></div>
            <div><dt>{t(P + 'proprietaire')}</dt><dd>{props.proprietaire}</dd></div>
            <div><dt>{t(P + 'numero')}</dt><dd className="pm-numero">{op.numero}</dd></div>
          </dl>
          <button type="button" className="pm-btn pm-btn--contour" onClick={copier} aria-live="polite">
            {copie ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.75} aria-hidden="true" />}
            {copie ? t(P + 'copie') : t(P + 'copier')}
          </button>
        </div>

        <button type="button" className="pm-btn pm-btn--plein" onClick={function() { props.onDeclarer(op.operateur); }}>
          {t(P + 'jaiPaye')}
        </button>

        {prevenu ? (
          <p className="pm-note-ok" role="status"><Check size={16} strokeWidth={1.75} aria-hidden="true" /> {t(P + 'noteOk')}</p>
        ) : (
          <button type="button" className="pm-btn pm-btn--lien" onClick={prevenir} disabled={envoi}>
            <Bell size={16} strokeWidth={1.75} aria-hidden="true" /> {t(P + 'prevenir')}
          </button>
        )}
      </div>
    </div>
  );
}
