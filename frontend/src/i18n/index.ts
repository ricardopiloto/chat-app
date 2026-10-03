import { createSignal } from "solid-js";
import { en } from "./catalogs/en";
import { ptBR } from "./catalogs/pt-BR";
import { en as legacyEn } from "./catalogs/legacy/en";
import { ptBR as legacyPtBR } from "./catalogs/legacy/pt-BR";
import { chatEn } from "./catalogs/chat.en";
import { chatPtBR } from "./catalogs/chat.pt-BR";
import { mgmtEn } from "./catalogs/mgmt.en";
import { mgmtPtBR } from "./catalogs/mgmt.pt-BR";
import { settingsEn } from "./catalogs/settings.en";
import { voiceEn } from "./catalogs/voice.en";
import { voicePtBR } from "./catalogs/voice.pt-BR";
import { settingsPtBR } from "./catalogs/settings.pt-BR";
import { DEFAULT_LOCALE, LOCALES, isAppLocale, type AppLocale } from "./locales";
import { interpolate, merge, type FlatMessages } from "./messages";
import { negotiateLocale, saveLocale, savedLocale } from "./negotiate";

export { LOCALES, type AppLocale };
export const SUPPORTED_LOCALES = LOCALES.map((l) => l.code);

// The legacy catalogs hold text for screens that have not been rebuilt yet; entries in the
// current catalogs win. Each phase moves the keys it rebuilds out of legacy.
const messages: Record<AppLocale, FlatMessages> = {
  "pt-BR": merge(legacyPtBR, ptBR, mgmtPtBR, settingsPtBR, chatPtBR, voicePtBR),
  en: merge(legacyEn, en, mgmtEn, settingsEn, chatEn, voiceEn),
};

const [active, setActive] = createSignal<AppLocale>(savedLocale() ?? negotiateLocale());
const reflectInDocument = (locale: AppLocale) => {
  if (typeof document !== "undefined") document.documentElement.lang = locale;
};
reflectInDocument(active());

export const getLocale = (): AppLocale => active();

export function setLocale(next: AppLocale): void {
  if (!isAppLocale(next)) return;
  setActive(next);
  saveLocale(next);
  reflectInDocument(next);
}

/**
 * Looks a key up in the active language, then in the default language, then falls back to the key
 * itself, so a missing translation shows a recognisable placeholder instead of breaking the screen.
 */
export function t(key: string, values?: Record<string, string | number>): string {
  const text = messages[active()].get(key) ?? messages[DEFAULT_LOCALE].get(key) ?? key;
  return interpolate(text, values);
}

/** True when the key has a translation in the language itself (used by the parity checks). */
export const hasMessage = (key: string, locale: AppLocale = active()): boolean => messages[locale].has(key);
