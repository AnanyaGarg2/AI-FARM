import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';

const LANGUAGE_KEY = 'app_language';

const browserLanguage = typeof navigator !== 'undefined' ? navigator.language.toLowerCase().startsWith('hi') ? 'hi' : 'en' : 'en';
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) : null;

const languageDetector = {
  type: 'languageDetector',
  async: false,
  detect: () => savedLanguage || browserLanguage,
  init: () => {},
  cacheUserLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, language);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
