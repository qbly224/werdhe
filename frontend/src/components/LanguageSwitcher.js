import { useTranslation } from 'react-i18next';
import { changerLangue } from '../i18n';

var LANGUES = [
  { code: 'fr', libelle: 'FR', nom: 'Français' },
  { code: 'en', libelle: 'EN', nom: 'English' },
];

// Sélecteur à deux segments : la langue active est mise en évidence, l'autre
// est cliquable. Pas de drapeaux emoji : Windows ne les affiche pas et montre
// à la place les lettres du pays.
export default function LanguageSwitcher(props) {
  var i18n = useTranslation().i18n;
  var dark = props.dark || false;
  var langueActuelle = i18n.language === 'en' ? 'en' : 'fr';

  return (
    <div role="group" aria-label="Langue / Language"
      style={{
        display: 'inline-flex', alignItems: 'center', flexShrink: 0, gap: 0, padding: 2, borderRadius: 20,
        border: dark ? '1px solid rgba(255,255,255,0.3)' : '1px solid #E0E0E0',
        background: dark ? 'rgba(255,255,255,0.08)' : '#fff',
      }}>
      {LANGUES.map(function(l) {
        var actif = l.code === langueActuelle;
        return (
          <button key={l.code} type="button" lang={l.code} aria-pressed={actif} aria-label={l.nom} title={l.nom}
            onClick={function() { if (!actif) changerLangue(l.code); }}
            style={{
              padding: '5px 9px', borderRadius: 16, border: 'none', fontSize: 11.5, fontWeight: 800, lineHeight: 1,
              letterSpacing: 0.2, cursor: actif ? 'default' : 'pointer', transition: 'background .15s, color .15s',
              background: actif ? (dark ? 'rgba(255,255,255,0.28)' : '#1B6B3A') : 'transparent',
              color: actif ? '#fff' : (dark ? 'rgba(255,255,255,0.65)' : '#8A8F8B'),
            }}>
            {l.libelle}
          </button>
        );
      })}
    </div>
  );
}
