import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, X } from 'lucide-react';
import api from '../services/api';
import './AbonnementOrangeMoney.css';

var DUREES = [1, 3, 6, 12];

function gnf(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; }

// Même calcul que le serveur (le serveur recalcule toujours : ce montant n'est qu'un affichage).
function montantPour(infos, plan, duree, promoPct) {
  var brut = infos.tarifs.prix_mensuel[plan] * duree * (1 - infos.tarifs.reductions[duree]);
  return Math.round(promoPct ? brut * (1 - promoPct / 100) : brut);
}

// Formulaire d'abonnement par Orange Money (paiement manuel) : le propriétaire envoie l'argent au
// numéro de Werdhe, puis déclare son paiement ; un administrateur le vérifie et active l'abonnement.
export default function AbonnementOrangeMoney(props) {
  var t = useTranslation('public').t;
  var P = 'pricing.manuel.';
  var plan = props.plan;
  var [infos, setInfos] = useState(null);
  var [erreurChargement, setErreurChargement] = useState(false);
  var [duree, setDuree] = useState(props.dureeInitiale || 1);
  var [reference, setReference] = useState('');
  var [numeroExp, setNumeroExp] = useState('');
  var [erreur, setErreur] = useState('');
  var [envoi, setEnvoi] = useState(false);
  var [envoyee, setEnvoyee] = useState(null);
  var [copie, setCopie] = useState(false);
  var fenetre = useRef(null);
  var onClose = props.onClose;

  var charger = useCallback(function() {
    api.get('/abonnements/demandes/infos')
      .then(function(res) {
        setInfos(res.data);
        setNumeroExp(function(n) { return n || res.data.profil.telephone || ''; });
      })
      .catch(function() { setErreurChargement(true); });
  }, []);
  useEffect(function() { charger(); }, [charger]);

  // Échap ferme ; le focus entre dans la fenêtre ; le fond ne défile pas.
  useEffect(function() {
    var precedent = document.activeElement;
    var avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (fenetre.current) fenetre.current.focus();
    function touche(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', touche);
    return function() {
      document.removeEventListener('keydown', touche);
      document.body.style.overflow = avant;
      if (precedent && precedent.focus) precedent.focus();
    };
  }, [onClose]);

  var nomPlan = t('pricing.plans.' + plan + '.nom');
  var promoPct = props.reductionPromo || 0;
  var montant = infos ? montantPour(infos, plan, duree, promoPct) : 0;

  function copier() {
    var numero = infos.numero;
    var fin = function() { setCopie(true); setTimeout(function() { setCopie(false); }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(numero).then(fin).catch(function() {});
    else fin();
  }

  function envoyer(e) {
    e.preventDefault();
    setErreur('');
    if (reference.trim().length < 4) { setErreur(t(P + 'referenceInvalide')); return; }
    setEnvoi(true);
    api.post('/abonnements/demandes', {
      plan: plan, duree: duree, reference: reference.trim(),
      numero_expediteur: numeroExp.trim() || undefined, code_promo: props.codePromo || undefined,
    })
      .then(function(res) { setEnvoyee(res.data.demande); })
      .catch(function(err) {
        var d = err.response && err.response.data;
        setErreur((d && d.erreur) || t(P + 'erreurEnvoi'));
        if (d && d.code === 'deja_en_attente') charger();
      })
      .finally(function() { setEnvoi(false); });
  }

  function annulerDemande(id) {
    setErreur('');
    api.patch('/abonnements/demandes/' + id + '/annuler')
      .then(function() { setEnvoyee(null); charger(); })
      .catch(function(err) { setErreur((err.response && err.response.data && err.response.data.erreur) || t(P + 'erreurEnvoi')); charger(); });
  }

  var enAttente = infos && infos.demande_en_attente;
  var refusee = infos && !enAttente && infos.dernieres && infos.dernieres[0] && infos.dernieres[0].statut === 'refusee' ? infos.dernieres[0] : null;

  function corps() {
    if (erreurChargement) return <p className="aom__erreur" role="alert">{t(P + 'erreurChargement')}</p>;
    if (!infos) return <p className="aom__muted" role="status">…</p>;

    if (envoyee) {
      return (
        <div className="aom__succes" role="status">
          <span className="aom__succes-icone"><Check size={26} strokeWidth={2} aria-hidden="true" /></span>
          <h3>{t(P + 'succesTitre')}</h3>
          <p>{t(P + 'succesTexte')}</p>
          <p className="aom__code">{t(P + 'codeDemande')} : <b>{envoyee.code}</b></p>
          <button type="button" className="ds-btn ds-btn--primary ds-btn--block" onClick={onClose}>{t(P + 'fermer')}</button>
        </div>
      );
    }

    if (enAttente) {
      return (
        <div className="aom__attente">
          <h3>{t(P + 'enAttenteTitre')}</h3>
          <p>{t(P + 'enAttenteTexte')}</p>
          <dl className="aom__recap">
            <div><dt>{t(P + 'codeDemande')}</dt><dd>{enAttente.code}</dd></div>
            <div><dt>{t(P + 'planLabel')}</dt><dd>{t('pricing.plans.' + enAttente.plan + '.nom')} · {t(P + 'mois', { count: enAttente.duree_mois })}</dd></div>
            <div><dt>{t(P + 'montantLabel')}</dt><dd>{gnf(enAttente.montant)}</dd></div>
            <div><dt>{t(P + 'reference')}</dt><dd className="aom__mono">{enAttente.reference_paiement}</dd></div>
          </dl>
          {erreur && <p className="aom__erreur" role="alert">{erreur}</p>}
          <button type="button" className="ds-btn ds-btn--secondary ds-btn--block" onClick={function() { annulerDemande(enAttente.id); }}>{t(P + 'annuler')}</button>
        </div>
      );
    }

    var p = infos.profil;
    return (
      <form onSubmit={envoyer} noValidate>
        {refusee && <p className="aom__refus" role="status">{t(P + 'dernierRefus', { motif: refusee.motif_refus })}</p>}
        <p className="aom__muted">{t(P + 'intro')}</p>

        <fieldset className="aom__durees">
          <legend>{t(P + 'dureeLabel')}</legend>
          <div className="aom__durees-liste">
            {DUREES.map(function(d) {
              var red = Math.round(infos.tarifs.reductions[d] * 100);
              return (
                <label key={d} className={'aom__duree' + (duree === d ? ' on' : '')}>
                  <input type="radio" name="aom-duree" value={d} checked={duree === d} onChange={function() { setDuree(d); }} />
                  <span>{t(P + 'mois', { count: d })}</span>
                  {red > 0 && <small>-{red} %</small>}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="aom__carte" aria-live="polite">
          <div className="aom__carte-libelle">{t(P + 'montantLabel')}</div>
          <div className="aom__carte-montant">{gnf(montant)}</div>
          {promoPct > 0 && <div className="aom__carte-promo">{t('pricing.codeValideReduction', { pct: promoPct, plan: nomPlan })}</div>}
        </div>

        <h3 className="aom__h3">{t(P + 'etapesTitre')}</h3>
        <ol className="aom__etapes">
          <li><span className="aom__n">1</span><span>{t(P + 'etape1', { montant: gnf(montant) })}</span></li>
          <li><span className="aom__n">2</span><span>{t(P + 'etape2')}</span></li>
          <li><span className="aom__n">3</span><span>{t(P + 'etape3')}</span></li>
        </ol>

        <div className="aom__numero">
          <div>
            <div className="aom__numero-libelle">{t(P + 'numeroLabel')}</div>
            <div className="aom__numero-valeur">{infos.numero_affiche}</div>
          </div>
          <button type="button" className="ds-btn ds-btn--secondary ds-btn--sm" onClick={copier}>
            {copie ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.75} aria-hidden="true" />} {copie ? t(P + 'copie') : t(P + 'copier')}
          </button>
        </div>

        <h3 className="aom__h3">{t(P + 'vosInfos')}</h3>
        <dl className="aom__recap">
          <div><dt>{t(P + 'nom')}</dt><dd>{p.prenom} {p.nom}</dd></div>
          <div><dt>{t(P + 'email')}</dt><dd>{p.email}</dd></div>
          {p.telephone && <div><dt>{t(P + 'telephone')}</dt><dd>{p.telephone}</dd></div>}
          <div><dt>{t(P + 'planLabel')}</dt><dd>{nomPlan} · {t(P + 'mois', { count: duree })}</dd></div>
        </dl>

        <label className="aom__champ" htmlFor="aom-ref">{t(P + 'reference')} <span aria-hidden="true">*</span></label>
        <input id="aom-ref" className="ds-input" value={reference} maxLength={100} autoComplete="off" required
          placeholder={t(P + 'referencePlaceholder')} aria-describedby="aom-ref-aide" aria-invalid={!!erreur && reference.trim().length < 4}
          onChange={function(e) { setReference(e.target.value); setErreur(''); }} />
        <p id="aom-ref-aide" className="aom__aide">{t(P + 'referenceAide')}</p>

        <label className="aom__champ" htmlFor="aom-num">{t(P + 'numeroExp')}</label>
        <input id="aom-num" className="ds-input" type="tel" inputMode="tel" autoComplete="tel" maxLength={20}
          value={numeroExp} onChange={function(e) { setNumeroExp(e.target.value); }} />

        {erreur && <p className="aom__erreur" role="alert">{erreur}</p>}
        <button type="submit" className="ds-btn ds-btn--primary ds-btn--block aom__envoyer" disabled={envoi}>{envoi ? t(P + 'envoi') : t(P + 'envoyer')}</button>
      </form>
    );
  }

  return (
    <div className="aom" onMouseDown={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="aom__fenetre" role="dialog" aria-modal="true" aria-labelledby="aom-titre" tabIndex={-1} ref={fenetre}>
        <div className="aom__tete">
          <h2 id="aom-titre">{t(P + 'titre', { plan: nomPlan })}</h2>
          <button type="button" className="aom__fermer" onClick={onClose} aria-label={t(P + 'fermer')}><X size={20} strokeWidth={1.75} aria-hidden="true" /></button>
        </div>
        <div className="aom__corps">{corps()}</div>
      </div>
    </div>
  );
}
