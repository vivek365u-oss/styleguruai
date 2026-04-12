import { useState } from 'react';
import { translations, defaultLanguage } from './translations';
import { LanguageContext } from './LanguageContext';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('StyleGuruAI_lang') || defaultLanguage;
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('StyleGuruAI_lang', lang);
  };

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
