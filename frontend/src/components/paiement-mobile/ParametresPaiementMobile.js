import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OperateurLogo from './OperateurLogo';
import './PaiementMobile.css';

var OPERATEURS = [
  { cle: 'orange_money', nom: 'Orange Money' },
  { cle: 'mtn_momo', nom: 'MTN Mobile Money' },
];

// Même règle que le serveur : 9 chiffres commençant par 6 (indicatif +224 et séparateurs tolérés).
function chiffresNumero(v) {
  var c = String(v || '').replace(/[\s.\-()]/g, '').replace(/^\+?224/, '').replace(/^00224/, '');
  return /^6\d{8}$/.test(c) ? c : null;
}

// Bloc « Recevoir les loyers par paiement mobile » : le propriétaire choisit les opérateurs
// qu'il accepte et son numéro de réception. Les locataires ne voient que ces choix.
export default function ParametresPaiementMobile() {
  var t = useTranslation('dashboard').t;
  var P = 'paiementMobile.proprio.parametres.';
  var [etat, setEtat] = useState(null);           // { orange_money: { actif, numero }, mtn_momo: {...} }
  var [directActif, setDirectActif] = useState(false);
  var [masque, setMasque] = useState(false);
  var [erreurs, setErreurs] = useState({});
  var [envoi, setEnvoi] = useState(false);

  useEffect(function() {
    api.get('/paiements/mobile/parametres')
      .then(function(res) {
        var p = res.data.parametres;
        setEtat({
          orange_money: { actif: !!p.orange_money_actif, numero: p.orange_money_numero || '' },
          mtn_momo: { actif: !!p.mtn_momo_actif, numero: p.mtn_momo_numero || '' },
        });
        setDirectActif(!!res.data.direct_actif);
      })
      .catch(function() { setMasque(true); }); // rôle sans accès : le bloc ne s'affiche pas
  }, []);

  if (masque || !etat) return null;

  function majOp(cle, champ, valeur) {
    setEtat(function(e) { var n = Object.assign({}, e); n[cle] = Object.assign({}, e[cle]); n[cle][champ] = valeur; return n; });
    setErreurs(function(x) { var n = Object.assign({}, x); delete n[cle]; return n; });
  }

  function enregistrer(e) {
    e.preventDefault();
    var err = {};
    OPERATEURS.forEach(function(o) { if (etat[o.cle].actif && !chiffresNumero(etat[o.cle].numero)) err[o.cle] = t(P + 'erreurNumero'); });
    setErreurs(err);
    if (Object.keys(err).length > 0) return;
    setEnvoi(true);
    api.put('/paiements/mobile/parametres', {
      orange_money_actif: etat.orange_money.actif, orange_money_numero: etat.orange_money.numero,
      mtn_momo_actif: etat.mtn_momo.actif, mtn_momo_numero: etat.mtn_momo.numero,
    })
      .then(function(res) {
        var p = res.data.parametres;
        setEtat({
          orange_money: { actif: !!p.orange_money_actif, numero: p.orange_money_numero || '' },
          mtn_momo: { actif: !!p.mtn_momo_actif, numero: p.mtn_momo_numero || '' },
        });
        toast.success(t(P + 'enregistre'));
      })
      .catch(function(er) {
        var d = er.response && er.response.data;
        if (d && d.champ) { var n = {}; n[d.champ.replace('_numero', '')] = d.erreur; setErreurs(n); }
        else toast.error((d && d.erreur) || t(P + 'erreurGenerique'));
      })
      .finally(function() { setEnvoi(false); });
  }

  var actifs = OPERATEURS.filter(function(o) { return etat[o.cle].actif && chiffresNumero(etat[o.cle].numero); });

  return (
    <form className="pm-bloc" onSubmit={enregistrer} noValidate aria-labelledby="pm-param-titre">
      <div className="pm-bloc__tete">
        <h3 id="pm-param-titre" className="pm-h3">{t(P + 'titre')}</h3>
        {!directActif && <span className="pm-chip pm-chip--soon">{t(P + 'directBientot')}</span>}
      </div>
      <p className="pm-muted">{t(P + 'intro')}</p>

      <div className="pm-param-liste">
        {OPERATEURS.map(function(o) {
          var op = etat[o.cle];
          var idChamp = 'pm-num-' + o.cle;
          return (
            <div key={o.cle} className={'pm-param' + (op.actif ? ' on' : '')}>
              <label className="pm-param__entete">
                <input type="checkbox" className="pm-param__case" checked={op.actif} onChange={function(e) { majOp(o.cle, 'actif', e.target.checked); }} />
                <OperateurLogo operateur={o.cle} taille={40} />
                <b>{o.nom}</b>
              </label>
              {op.actif && (
                <div className="pm-param__numero">
                  <label htmlFor={idChamp}>{t(P + 'numero')}</label>
                  <input id={idChamp} className="ds-input" type="tel" inputMode="tel" autoComplete="tel" maxLength={20}
                    placeholder={t(P + 'numeroPlaceholder')} value={op.numero} aria-invalid={!!erreurs[o.cle]} aria-describedby={erreurs[o.cle] ? idChamp + '-err' : undefined}
                    onChange={function(e) { majOp(o.cle, 'numero', e.target.value); }} />
                  {erreurs[o.cle] && <p id={idChamp + '-err'} className="pm-erreur" role="alert">{erreurs[o.cle]}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pm-encadre" aria-live="polite">
        <div className="pm-encadre__titre">{t(P + 'apercuTitre')}</div>
        {actifs.length === 0 ? (
          <p className="pm-muted">{t(P + 'apercuAucun')}</p>
        ) : (
          <ul className="pm-apercu">
            {actifs.map(function(o) {
              return (
                <li key={o.cle}>
                  <OperateurLogo operateur={o.cle} taille={32} />
                  <span><b>{o.nom}</b><small>{t(P + 'apercuNumero', { numero: chiffresNumero(etat[o.cle].numero) })}</small></span>
                  {!directActif && <span className="pm-chip pm-chip--soon">{t('paiementMobile.bientot')}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="pm-aide">{t(P + 'mention')}</p>
      <button type="submit" className="pm-btn pm-btn--plein" disabled={envoi}>{t(P + 'enregistrer')}</button>
    </form>
  );
}
