import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonFr from './locales/fr/common.json';
import publicFr from './locales/fr/public.json';
import logementsFr from './locales/fr/logements.json';
import profilFr from './locales/fr/profil.json';
import dashboardFr from './locales/fr/dashboard.json';
import adminFr from './locales/fr/admin.json';

import commonEn from './locales/en/common.json';
import publicEn from './locales/en/public.json';
import logementsEn from './locales/en/logements.json';
import profilEn from './locales/en/profil.json';
import dashboardEn from './locales/en/dashboard.json';
import adminEn from './locales/en/admin.json';

var langueStockee = null;
try { langueStockee = localStorage.getItem('werdhe_langue'); } catch (e) {}

i18n.use(initReactI18next).init({
  resources: {
    fr: { common: commonFr, public: publicFr, logements: logementsFr, profil: profilFr, dashboard: dashboardFr, admin: adminFr },
    en: { common: commonEn, public: publicEn, logements: logementsEn, profil: profilEn, dashboard: dashboardEn, admin: adminEn },
  },
  lng: langueStockee === 'en' ? 'en' : 'fr',
  fallbackLng: 'fr',
  ns: ['common', 'public', 'logements', 'profil', 'dashboard', 'admin'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export function changerLangue(langue) {
  i18n.changeLanguage(langue);
  try { localStorage.setItem('werdhe_langue', langue); } catch (e) {}
}

export default i18n;
