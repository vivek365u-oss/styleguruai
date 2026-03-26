import { createContext, useContext, useState } from 'react';
import { translations, defaultLanguage } from './translations';

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('styleguru_lang') || defaultLanguage;
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('styleguru_lang', lang);
  };

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
