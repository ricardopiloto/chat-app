import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "./locales";

const STORAGE_KEY = "mesa.locale";

/** Picks the first browser language we support; Portuguese in any variant maps to pt-BR. */
export function negotiateLocale(preferences: readonly string[] = browserLanguages()): AppLocale {
  for (const tag of preferences) {
    const primary = tag.trim().toLowerCase().split("-")[0];
    if (primary === "pt") return "pt-BR";
    if (primary === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

const storage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // some browsers throw when site data is blocked
  }
};

export function savedLocale(): AppLocale | null {
  const value = storage()?.getItem(STORAGE_KEY) ?? null;
  return isAppLocale(value) ? value : null;
}

export function saveLocale(locale: AppLocale): void {
  try {
    storage()?.setItem(STORAGE_KEY, locale); // may fail on quota; the choice then lasts for the session
  } catch {
    /* ignore */
  }
}
