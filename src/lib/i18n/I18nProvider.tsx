"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { translate, type Dictionary } from "./translate";

type I18nContextValue = {
  locale: string;
  dict: Dictionary;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: string;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const t = useCallback(
    (key: string, fallback?: string) => translate(dict, key, fallback),
    [dict]
  );
  const value = useMemo(() => ({ locale, dict, t }), [locale, dict, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/** Convenience hook for client components that only need the translate fn. */
export function useT() {
  return useI18n().t;
}
