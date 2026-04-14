/**
 * LanguageContext.jsx — i18n language switching (EN / Tamil)
 */

import { createContext, useContext, useState } from 'react';
import { en } from '../i18n/en';
import { ta } from '../i18n/ta';

const LanguageContext = createContext(null);

const TRANSLATIONS = { en, ta };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const t = (key) => {
    const keys = key.split('.');
    let value = TRANSLATIONS[lang];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return value || key;
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'ta' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const setLanguage = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be within LanguageProvider');
  return ctx;
};
