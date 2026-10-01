import { createSignal } from "solid-js";
import { en } from "./catalogs/en";
import { ptBR } from "./catalogs/pt-BR";
import { detectLocale, parseStoredLocale } from "./detect";
import { SUPPORTED_LOCALES, type AppLocale, type MessageTree } from "./types";
export { SUPPORTED_LOCALES, detectLocale, type AppLocale };
const catalogs: Record<AppLocale, MessageTree> = { "pt-BR": ptBR, en };
function readStoredLocale() {
  try { return typeof localStorage === "undefined" ? null : parseStoredLocale(localStorage.getItem("mesa.locale")); } catch { return null; }
}
const stored = readStoredLocale();
const initialLocale = stored ?? detectLocale();
const [locale, setLocaleSignal] = createSignal<AppLocale>(initialLocale);
if (!stored) {
  try { if (typeof localStorage !== "undefined") localStorage.setItem("mesa.locale", initialLocale); } catch { /* storage may be unavailable */ }
}
function applyDocumentLocale(value: AppLocale) { if (typeof document !== "undefined") document.documentElement.lang = value; }
applyDocumentLocale(locale());
export function getLocale() { return locale(); }
export function setLocale(value: AppLocale) { if (!SUPPORTED_LOCALES.includes(value)) return; setLocaleSignal(value); try { if (typeof localStorage !== "undefined") localStorage.setItem("mesa.locale", value); } catch { /* storage may be unavailable */ } applyDocumentLocale(value); }
function lookup(tree: MessageTree, parts: string[]): string | undefined { let current: string | MessageTree | undefined = tree; for (const key of parts) { if (!current || typeof current === "string") return; current = current[key]; } return typeof current === "string" ? current : undefined; }
export function t(key: string) { const parts = key.split(".").filter(Boolean); return lookup(catalogs[locale()], parts) ?? lookup(catalogs["pt-BR"], parts) ?? key; }
