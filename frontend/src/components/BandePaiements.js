import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import './BandePaiements.css';

// Bande « Paiement du loyer » de l'accueil. Honnête : seul le paiement en espèces est disponible
// aujourd'hui ; Orange Money et MTN MoMo sont annoncés « Bientôt » (le prestataire n'est pas choisi).
export default function BandePaiements() {
  var t = useTranslation('public').t;
  var P = 'landingPage.trust.';
  return (
    <div className="bp">
      <ul className="bp__liste" aria-label={t(P + 'label')}>
        <li className="bp__label">{t(P + 'label')}</li>
        <li className="bp__item">
          <b>{t(P + 'especes')}</b>
          <span className="bp__chip bp__chip--ok"><Check size={12} strokeWidth={2.25} aria-hidden="true" />{t(P + 'disponible')}</span>
        </li>
        <li className="bp__item">
          <b>Orange Money</b>
          <span className="bp__chip">{t(P + 'bientot')}</span>
        </li>
        <li className="bp__item">
          <b>MTN MoMo</b>
          <span className="bp__chip">{t(P + 'bientot')}</span>
        </li>
      </ul>
    </div>
  );
}
