import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, ChevronRight, FileCheck2 } from 'lucide-react';
import api from '../../services/api';
import OperateurLogo from './OperateurLogo';
import FeuilleOperateur from './FeuilleOperateur';
import DeclarerPaiement from './DeclarerPaiement';
import './PaiementMobile.css';

function gnf(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; }
function dateLocale(iso, locale, opts) { return new Date(iso + 'T12:00:00').toLocaleDateString(locale, opts); }

// Écran « Payer mon loyer » du locataire (mobile d'abord).
//  - Espèces : disponible maintenant.
//  - Paiement mobile : « Bientôt » (le prestataire n'est pas choisi) ; n'affiche que les opérateurs
//    acceptés par le propriétaire de ce bien. Aucun opérateur actif → toute la section disparaît.
//  - Déclaration d'un paiement mobile déjà fait, à confirmer par le propriétaire.
export default function PayerLoyer(props) {
  var tr = useTranslation('dashboard');
  var t = tr.t;
  var P = 'paiementMobile.';
  var locale = tr.i18n.language === 'en' ? 'en-GB' : 'fr-FR';
  var [data, setData] = useState(null);
  var [erreur, setErreur] = useState('');
  var [vue, setVue] = useState('payer');          // 'payer' | 'declarer'
  var [feuille, setFeuille] = useState(null);     // opérateur dont le volet est ouvert
  var [opDeclaration, setOpDeclaration] = useState(null);
  var declencheurRef = useRef(null);

  var charger = useCallback(function() {
    api.get('/paiements/mobile/ecran/' + props.reservationId)
      .then(function(res) { setData(res.data); setErreur(''); })
      .catch(function(err) { setErreur((err.response && err.response.data && err.response.data.erreur) || '__defaut__'); });
  }, [props.reservationId]);
  useEffect(function() { charger(); }, [charger]);

  function prevenir(operateur) {
    return api.post('/paiements/mobile/attente', { operateur: operateur })
      .then(function() { setData(function(d) { return Object.assign({}, d, { attente: (d.attente || []).concat(operateur) }); }); });
  }

  function fermerFeuille() {
    setFeuille(null);
    if (declencheurRef.current) declencheurRef.current.focus();
  }

  if (erreur) return <div className="pm-ecran"><p className="pm-erreur" role="alert">{erreur === '__defaut__' ? t(P + 'erreurChargement') : erreur}</p></div>;
  if (!data) return <div className="pm-ecran" aria-busy="true"><p className="pm-muted">{t(P + 'chargement')}</p></div>;

  var aDesOperateurs = data.operateurs.length > 0;

  if (vue === 'declarer' && aDesOperateurs) {
    return (
      <DeclarerPaiement data={data} operateurInitial={opDeclaration}
        onRetour={function() { setVue('payer'); }} onEnvoye={charger} />
    );
  }

  var mois = data.periode ? dateLocale(data.periode.debut, locale, { month: 'long', year: 'numeric' }) : '';
  var echeance = data.echeance ? dateLocale(data.echeance, locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  var proprio = (data.proprietaire.prenom + ' ' + data.proprietaire.nom).trim();
  var opFeuille = feuille && data.operateurs.find(function(o) { return o.operateur === feuille; });

  return (
    <div className="pm-ecran">
      <div className="pm-entete">
        <div>
          <p className="pm-sous-titre">{data.bien}</p>
          <h2 className="pm-titre">{t(P + 'titre')}</h2>
        </div>
      </div>

      {data.tout_paye ? (
        <p className="pm-carte-vide">{t(P + 'toutPaye')}</p>
      ) : (
        <section className="pm-carte" aria-label={t(P + 'carteAria', { mois: mois })}>
          <div className="pm-carte__libelle">{t(P + 'loyerDe', { mois: mois })}</div>
          <div className="pm-carte__montant">{gnf(data.loyer)}</div>
          <div className="pm-carte__pied">
            <span>{t(P + 'proprietaire', { nom: proprio })}</span>
            <span className="pm-chip pm-chip--echeance">{t(P + 'avantLe', { date: echeance })}</span>
          </div>
        </section>
      )}

      <section aria-labelledby="pm-comment">
        <h3 id="pm-comment" className="pm-h3">{t(P + 'commentPayer')}</h3>

        <div className="pm-opt pm-opt--especes">
          <div className="pm-opt__tete">
            <span className="pm-opt__icone" aria-hidden="true"><Banknote size={22} strokeWidth={1.75} /></span>
            <b>{t(P + 'especes.titre')}</b>
            <span className="pm-chip pm-chip--ok">{t(P + 'especes.dispo')}</span>
          </div>
          <ol className="pm-etapes">
            <li><span className="pm-etapes__n" aria-hidden="true">1</span>{t(P + 'especes.etape1')}</li>
            <li><span className="pm-etapes__n" aria-hidden="true">2</span>{t(P + 'especes.etape2')}</li>
            <li><span className="pm-etapes__n" aria-hidden="true">3</span>{t(P + 'especes.etape3')}</li>
          </ol>
          {props.onSignalerEspeces && !data.tout_paye && (
            <button type="button" className="pm-btn pm-btn--contour" onClick={props.onSignalerEspeces} disabled={props.signalementEnCours}>
              {t(P + 'especes.signaler')}
            </button>
          )}
        </div>
      </section>

      {aDesOperateurs && (
        <section aria-labelledby="pm-mobile">
          <div className="pm-h3-ligne">
            <h3 id="pm-mobile" className="pm-h3">{t(P + 'paiementMobile')}</h3>
            {!data.direct_actif && <span className="pm-chip pm-chip--soon">{t(P + 'bientotDispo')}</span>}
          </div>

          <ul className="pm-ops">
            {data.operateurs.map(function(o) {
              return (
                <li key={o.operateur}>
                  <button type="button" className="pm-op" onClick={function(e) { declencheurRef.current = e.currentTarget; setFeuille(o.operateur); }}>
                    <OperateurLogo operateur={o.operateur} taille={44} />
                    <span className="pm-op__texte">
                      <b>{o.label}</b>
                      <small>{t(P + 'toucherPourEnSavoir')}</small>
                    </span>
                    {!data.direct_actif && <span className="pm-chip pm-chip--soon">{t(P + 'bientot')}</span>}
                    <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>

          <button type="button" className="pm-info" onClick={function(e) { declencheurRef.current = e.currentTarget; setOpDeclaration(null); setVue('declarer'); }}>
            <span className="pm-info__icone" aria-hidden="true"><FileCheck2 size={22} strokeWidth={1.75} /></span>
            <span className="pm-info__texte"><b>{t(P + 'dejaPaye')}</b><small>{t(P + 'dejaPayeAide')}</small></span>
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </section>
      )}

      {props.apres}

      {opFeuille && (
        <FeuilleOperateur operateur={opFeuille} proprietaire={proprio}
          dejaPrevenu={(data.attente || []).indexOf(opFeuille.operateur) !== -1}
          onClose={fermerFeuille} onPrevenir={prevenir}
          onDeclarer={function(op) { setFeuille(null); setOpDeclaration(op); setVue('declarer'); }} />
      )}
    </div>
  );
}
