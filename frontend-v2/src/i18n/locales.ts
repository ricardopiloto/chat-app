export const LOCALES = [
  { code: "pt-BR", name: "Português (BR)" },
  { code: "en", name: "English" },
] as const;

export type AppLocale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: AppLocale = "pt-BR";

export const isAppLocale = (value: unknown): value is AppLocale => LOCALES.some((l) => l.code === value);
