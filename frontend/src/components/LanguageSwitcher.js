import { useTranslation } from 'react-i18next';
import { changerLangue } from '../i18n';

export default function LanguageSwitcher(props) {
  var i18n = useTranslation().i18n;
  var dark = props.dark || false;
  var langueActuelle = i18n.language === 'en' ? 'en' : 'fr';

  function basculer() {
    changerLangue(langueActuelle === 'fr' ? 'en' : 'fr');
  }

  return (
    <button type="button" onClick={basculer} title={langueActuelle === 'fr' ? 'Switch to English' : 'Passer en français'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 20,
        border: dark ? '1px solid rgba(255,255,255,0.35)' : '1px solid #E0E0E0',
        background: dark ? 'rgba(255,255,255,0.08)' : '#fff',
        color: dark ? '#fff' : '#1B2B22',
        fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
      }}>
      <span>{langueActuelle === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
      <span>{langueActuelle === 'fr' ? 'FR' : 'EN'}</span>
    </button>
  );
}
