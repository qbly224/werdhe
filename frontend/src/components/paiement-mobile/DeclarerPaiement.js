import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera, Check, Circle, X } from 'lucide-react';
import api from '../../services/api';
import OperateurLogo from './OperateurLogo';

function gnf(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; }

var TAILLE_MAX = 5 * 1024 * 1024;
var TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Écran « Déclarer un paiement » puis écran « Déclaration envoyée ».
export default function DeclarerPaiement(props) {
  var t = useTranslation('dashboard').t;
  var P = 'paiementMobile.declarer.';
  var navigate = useNavigate();
  var data = props.data;                 // réponse de /paiements/mobile/ecran/:id
  var ops = data.operateurs;             // opérateurs acceptés par le propriétaire
  var [operateur, setOperateur] = useState(props.operateurInitial || (ops[0] && ops[0].operateur));
  var [nbMois, setNbMois] = useState(1);
  var [code, setCode] = useState('');
  var [capture, setCapture] = useState(null);
  var [envoi, setEnvoi] = useState(false);
  var [erreur, setErreur] = useState('');
  var [envoye, setEnvoye] = useState(null);
  var fichierRef = useRef(null);

  var opChoisi = ops.find(function(o) { return o.operateur === operateur; }) || ops[0];
  var montant = data.loyer * nbMois;
  var codeVide = code.trim() === '';

  function choisirFichier(e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (TYPES.indexOf(f.type) === -1) return setErreur(t(P + 'erreurFormat'));
    if (f.size > TAILLE_MAX) return setErreur(t(P + 'erreurTaille'));
    setErreur(''); setCapture(f);
  }

  function envoyer(e) {
    e.preventDefault();
    if (codeVide || envoi || !opChoisi) return;
    setErreur(''); setEnvoi(true);
    var f = new FormData();
    f.append('reservation_id', data.reservation_id);
    f.append('operateur', opChoisi.operateur);
    f.append('nb_mois', String(nbMois));
    f.append('code_transaction', code.trim());
    if (capture) f.append('capture', capture);
    api.post('/paiements/mobile/declarer', f, { headers: { 'Content-Type': undefined } })
      .then(function(res) { setEnvoye(res.data.paiement); if (props.onEnvoye) props.onEnvoye(); })
      .catch(function(err) { setErreur((err.response && err.response.data && err.response.data.erreur) || t(P + 'erreurGenerique')); })
      .finally(function() { setEnvoi(false); });
  }

  // ── Confirmation « Déclaration envoyée » ──
  if (envoye) {
    return (
      <div className="pm-ecran">
        <div className="pm-succes">
          <span className="pm-succes__icone" aria-hidden="true"><Check size={28} strokeWidth={1.75} /></span>
          <h2 className="pm-titre">{t(P + 'envoyeeTitre')}</h2>
          <p className="pm-succes__montant">{gnf(envoye.montant)}</p>
          <p className="pm-muted">{envoye.operateur_label} · {envoye.periode_libelle}</p>
        </div>

        <ol className="pm-frise" aria-label={t(P + 'friseAria')}>
          <li className="pm-frise__etape pm-frise__etape--fait">
            <span className="pm-frise__point" aria-hidden="true"><Check size={14} strokeWidth={2} /></span>
            <div><b>{t(P + 'frise.declare')}</b><small>{t(P + 'frise.declareQuand')}</small></div>
          </li>
          <li className="pm-frise__etape">
            <span className="pm-frise__point" aria-hidden="true"><Circle size={12} strokeWidth={1.75} /></span>
            <div><b>{t(P + 'frise.confirmation')}</b><small>{t(P + 'frise.confirmationQuand')}</small></div>
          </li>
          <li className="pm-frise__etape">
            <span className="pm-frise__point" aria-hidden="true"><Circle size={12} strokeWidth={1.75} /></span>
            <div><b>{t(P + 'frise.quittance')}</b><small>{t(P + 'frise.quittanceQuand')}</small></div>
          </li>
        </ol>

        <button type="button" className="pm-btn pm-btn--plein" onClick={function() { navigate('/dashboard'); }}>
          {t(P + 'retourAccueil')}
        </button>
      </div>
    );
  }

  // ── Formulaire ──
  return (
    <form className="pm-ecran" onSubmit={envoyer} noValidate>
      <div className="pm-entete">
        <button type="button" className="pm-retour" onClick={props.onRetour} aria-label={t(P + 'retour')}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div>
          <p className="pm-sous-titre">{t(P + 'sousTitre')}</p>
          <h2 className="pm-titre">{t(P + 'titre')}</h2>
        </div>
      </div>

      <fieldset className="pm-champ">
        <legend>{t(P + 'avecQuoi')}</legend>
        {ops.length > 1 ? (
          <div className="pm-choix pm-choix--ops" role="radiogroup" aria-label={t(P + 'avecQuoi')}>
            {ops.map(function(o) {
              var actif = o.operateur === operateur;
              return (
                <button key={o.operateur} type="button" role="radio" aria-checked={actif}
                  className={'pm-choix__bouton' + (actif ? ' on' : '')} onClick={function() { setOperateur(o.operateur); }}>
                  <OperateurLogo operateur={o.operateur} taille={32} />
                  {t('paiementMobile.nomCourt.' + o.operateur)}
                </button>
              );
            })}
          </div>
        ) : (
          opChoisi && (
            <p className="pm-fixe">
              <OperateurLogo operateur={opChoisi.operateur} taille={32} />
              {t(P + 'payeAvec', { operateur: t('paiementMobile.nomCourt.' + opChoisi.operateur), numero: opChoisi.numero })}
            </p>
          )
        )}
        {ops.length > 1 && opChoisi && <p className="pm-aide">{t(P + 'auNumero', { numero: opChoisi.numero })}</p>}
      </fieldset>

      <fieldset className="pm-champ">
        <legend>{t(P + 'combienMois')}</legend>
        <div className="pm-choix" role="radiogroup" aria-label={t(P + 'combienMois')}>
          {[1, 2, 3].map(function(n) {
            return (
              <button key={n} type="button" role="radio" aria-checked={nbMois === n}
                className={'pm-choix__bouton' + (nbMois === n ? ' on' : '')} onClick={function() { setNbMois(n); }}>
                {t(P + 'mois', { count: n })}
              </button>
            );
          })}
        </div>
        <p className="pm-montant" aria-live="polite">{t(P + 'montant')} <b>{gnf(montant)}</b></p>
      </fieldset>

      <div className="pm-champ">
        <label htmlFor="pm-code">{t(P + 'code')}</label>
        <input id="pm-code" className="ds-input" type="text" value={code} maxLength={40} autoComplete="off" autoCapitalize="characters"
          spellCheck={false} aria-describedby="pm-code-aide" aria-required="true" onChange={function(e) { setCode(e.target.value); }} />
        <p id="pm-code-aide" className="pm-aide">{t(P + 'codeAide1')}<br />{t(P + 'codeAide2')}</p>
      </div>

      <div className="pm-champ">
        <input ref={fichierRef} id="pm-capture" className="pm-fichier" type="file" accept="image/jpeg,image/png,image/webp" onChange={choisirFichier} />
        {capture ? (
          <div className="pm-capture">
            <Camera size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className="pm-capture__nom">{capture.name}</span>
            <button type="button" className="pm-capture__retirer" onClick={function() { setCapture(null); }} aria-label={t(P + 'retirerCapture')}>
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" className="pm-btn pm-btn--contour" onClick={function() { if (fichierRef.current) fichierRef.current.click(); }}>
            <Camera size={18} strokeWidth={1.75} aria-hidden="true" /> {t(P + 'ajouterCapture')}
          </button>
        )}
      </div>

      {erreur && <p className="pm-erreur" role="alert">{erreur}</p>}

      <button type="submit" className="pm-btn pm-btn--plein" disabled={codeVide || envoi}>
        {codeVide ? t(P + 'saisirCode') : t(P + 'envoyer')}
      </button>
    </form>
  );
}
