"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DictKey } from "./dictionary";
import { setActiveLang, translate, type Lang } from "./format";

export type { Lang } from "./format";

const STORAGE_KEY = "uf-language";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * The app's language (English / Bahasa Indonesia), persisted per
 * device in localStorage like the theme. Server markup is English;
 * a saved Indonesian choice applies right after mount, then stays
 * live for every surface that reads copy through t(). The
 * <html lang> attribute follows the choice, and non-React code
 * (mappers, stores) reads the same choice through format.ts.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "id" || saved === "en") setLangState(saved);
    } catch {
      // storage unavailable: English stays
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    setActiveLang(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the choice still applies for this session
    }
  }, []);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}
