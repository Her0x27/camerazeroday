import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { en, type Translations } from "./en";
import { ru } from "./ru";

export type Language = "en" | "ru";

const translations: Record<Language, Translations> = {
  en,
  ru,
};

interface I18nContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  availableLanguages: { code: Language; name: string; nativeName: string }[];
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "camera-zeroday-language";

const availableLanguages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
];

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  if (browserLang === "ru") return "ru";
  return "en";
}

function getSavedLanguage(): Language | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ru") {
      return saved;
    }
  } catch {
  }
  return null;
}

function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return getSavedLanguage() || detectBrowserLanguage();
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    saveLanguage(lang);
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  return (
    <I18nContext.Provider
      value={{
        language,
        t,
        setLanguage,
        availableLanguages,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslations(): Translations {
  const { t } = useI18n();
  return t;
}
