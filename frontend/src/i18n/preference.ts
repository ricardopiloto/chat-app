import { readString, writeString } from "../lib/localPrefs";
import { parseStoredLocale } from "./detect";
import type { AppLocale } from "./types";

const LOCALE_KEY = "mesa.locale";

export function readLocalePreference(): AppLocale | null {
  return parseStoredLocale(readString(LOCALE_KEY));
}

export function writeLocalePreference(locale: AppLocale): void {
  writeString(LOCALE_KEY, locale);
}
