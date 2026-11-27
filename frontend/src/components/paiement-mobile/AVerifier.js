import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import OperateurLogo from './OperateurLogo';
import './PaiementMobile.css';

function gnf(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; }
function rafraichirPage() { window.dispatchEvent(new CustomEvent('werdhe:refresh')); }

// Bloc « À vérifier » : paiements mobiles déclarés par les locataires, à confirmer ou contester.
// Un paiement « declare » n'est jamais compté comme payé tant qu'il n'est pas confirmé (règle serveur).
export default function AVerifier() {
  var t = useTranslation('dashboard').t;
  var P = 'paiementMobile.proprio.verifier.';
  var [liste, setListe] = useState(null);
  var [delai, setDelai] = useState(10000);
  var [decisions, setDecisions] = useState({});   // id -> { type, prenom, declaration }
  var [occupe, setOccupe] = useState({});          // id -> true pendant un appel
  var [erreur, setErreur] = useState('');
  var minuteurs = useRef({});

  var charger = useCallback(function() {
    api.get('/paiements/mobile/a-verifier')
      .then(function(res) { setListe(res.data.declarations || []); setDelai(res.data.delai_annulation_ms || 10000); })
      .catch(function() { setListe([]); });
  }, []);
  useEffect(function() { charger(); }, [charger]);
  useEffect(function() { var m = minuteurs.current; return function() { Object.keys(m).forEach(function(k) { clearTimeout(m[k]); }); }; }, []);

  function marquerOccupe(id, v) { setOccupe(function(o) { var n = Object.assign({}, o); if (v) n[id] = true; else delete n[id]; return n; }); }

  function decider(d, type) {
    setErreur(''); marquerOccupe(d.id, true);
    api.patch('/paiements/mobile/' + d.id + '/' + (type === 'confirme' ? 'confirmer' : 'contester'))
      .then(function(res) {
        var delaiServeur = res.data.delai_annulation_ms || delai;
        setDecisions(function(m) { var n = Object.assign({}, m); n[d.id] = { type: type, prenom: res.data.locataire_prenom || d.locataire_prenom, declaration: d }; return n; });
        // La déclaration n'est plus « à vérifier » : elle quitte la liste (« Annuler » la remet).
        setListe(function(l) { return (l || []).filter(function(x) { return x.id !== d.id; }); });
        rafraichirPage();
        // Fenêtre d'annulation écoulée : la décision devient définitive, le bloc se met à jour.
        minuteurs.current[d.id] = setTimeout(function() {
          setDecisions(function(m) { var n = Object.assign({}, m); delete n[d.id]; return n; });
          charger();
        }, delaiServeur);
      })
      .catch(function(err) { setErreur((err.response && err.response.data && err.response.data.erreur) || t(P + 'erreur')); charger(); })
      .finally(function() { marquerOccupe(d.id, false); });
  }

  function annuler(id) {
    setErreur(''); marquerOccupe(id, true);
    api.patch('/paiements/mobile/' + id + '/annuler')
      .then(function() {
        clearTimeout(minuteurs.current[id]);
        setDecisions(function(m) { var n = Object.assign({}, m); delete n[id]; return n; });
        rafraichirPage(); charger();
      })
      .catch(function(err) {
        setErreur((err.response && err.response.data && err.response.data.erreur) || t(P + 'erreur'));
        // « La quittance est déjà partie » : la décision est définitive, on cesse de proposer l'annulation.
        clearTimeout(minuteurs.current[id]);
        setDecisions(function(m) { var n = Object.assign({}, m); delete n[id]; return n; });
        charger();
      })
      .finally(function() { marquerOccupe(id, false); });
  }

  if (liste === null) return null;
  // Décisions en cours d'annulation possible (déjà sorties de la liste « declare » côté serveur).
  var enAnnulation = Object.keys(decisions).map(function(id) { return Object.assign({ id: id }, decisions[id]); });
  var nb = liste.length;

  return (
    <section className="pm-bloc" aria-labelledby="pm-verifier-titre">
      <div className="pm-bloc__tete">
        <h3 id="pm-verifier-titre" className="pm-h3">{t(P + 'titre')}</h3>
        <span className={'pm-chip ' + (nb > 0 ? 'pm-chip--echeance' : 'pm-chip--ok')} role="status">
          {nb > 0 ? t(P + 'compteur', { count: nb }) : t(P + 'toutVerifie')}
        </span>
      </div>

      {erreur && <p className="pm-erreur" role="alert">{erreur}</p>}

      {enAnnulation.map(function(d) {
        return (
          <div key={'d' + d.id} className={'pm-decision pm-decision--' + d.type} role="status">
            <span className="pm-decision__texte">
              <Check size={16} strokeWidth={1.75} aria-hidden="true" /> {t(P + (d.type === 'confirme' ? 'confirme' : 'conteste'), { prenom: d.prenom })}
            </span>
            <button type="button" className="pm-lien" onClick={function() { annuler(d.id); }} disabled={!!occupe[d.id]}>{t(P + 'annuler')}</button>
          </div>
        );
      })}

      {liste.map(function(d) {
        var charge = !!occupe[d.id];
        return (
          <article key={d.id} className="pm-decl">
            <div className="pm-decl__haut">
              <OperateurLogo operateur={d.operateur} taille={40} />
              <div className="pm-decl__qui">
                <b>{d.locataire_prenom} {d.locataire_nom}</b>
                <small>{d.logement_titre}</small>
              </div>
              <span className="pm-decl__montant">{gnf(d.montant)}</span>
            </div>
            <dl className="pm-decl__infos">
              <div><dt>{t(P + 'recuSur')}</dt><dd>{d.operateur_label}</dd></div>
              <div><dt>{t(P + 'code')}</dt><dd className="pm-numero">{d.code_transaction}</dd></div>
              <div><dt>{t(P + 'periode')}</dt><dd>{d.periode_libelle}</dd></div>
            </dl>
            {d.capture_url && (
              <a className="pm-capture-lien" href={d.capture_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" /> {t(P + 'voirCapture')}
              </a>
            )}
            <p className="pm-aide">{t(P + 'consigne')}</p>
            <div className="pm-decl__actions">
              <button type="button" className="pm-btn pm-btn--plein" onClick={function() { decider(d, 'confirme'); }} disabled={charge}>{t(P + 'confirmer')}</button>
              <button type="button" className="pm-btn pm-btn--danger" onClick={function() { decider(d, 'conteste'); }} disabled={charge}>{t(P + 'rien')}</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
