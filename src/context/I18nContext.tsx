import * as React from "react";

type Lang = "vi" | "en";

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const I18nContext = React.createContext<I18nState | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = React.useState<Lang>(
    (localStorage.getItem("umatter.lang") as Lang) || "vi",
  );
  React.useEffect(() => {
    localStorage.setItem("umatter.lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  return <I18nContext.Provider value={{ lang, setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
