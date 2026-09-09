/**
 * Mesa i18n (074).
 *
 * To add a locale later:
 * 1. Create `catalogs/<code>.ts` with the same key tree as `pt-BR.ts`
 * 2. Add the code to `SUPPORTED_LOCALES` in `types.ts`
 * 3. Register the catalog in `CATALOGS` below
 * 4. AccountMenu options come from `SUPPORTED_LOCALES` automatically
 */
import { createSignal } from "solid-js";
import { en } from "./catalogs/en";
import { ptBR, type MessageTree } from "./catalogs/pt-BR";
import { detectLocale } from "./detect";
import { readLocalePreference, writeLocalePreference } from "./preference";
import { SUPPORTED_LOCALES, type AppLocale } from "./types";

export type { AppLocale } from "./types";
export { SUPPORTED_LOCALES, isAppLocale } from "./types";
export { detectLocale } from "./detect";

const CATALOGS: Record<AppLocale, MessageTree> = {
  "pt-BR": ptBR,
  en,
};

function resolveInitial(): AppLocale {
  const stored = readLocalePreference();
  if (stored) return stored;
  const detected = detectLocale();
  writeLocalePreference(detected);
  return detected;
}

const [locale, setLocaleSignal] = createSignal<AppLocale>(resolveInitial());

function applyDocumentLang(loc: AppLocale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = loc === "pt-BR" ? "pt-BR" : "en";
}

applyDocumentLang(locale());

export function getLocale(): AppLocale {
  return locale();
}

export function setLocale(next: AppLocale): void {
  if (!SUPPORTED_LOCALES.includes(next)) return;
  setLocaleSignal(next);
  writeLocalePreference(next);
  applyDocumentLang(next);
}

function lookup(tree: MessageTree, parts: string[]): string | undefined {
  let node: string | MessageTree | undefined = tree;
  for (const p of parts) {
    if (node == null || typeof node === "string") return undefined;
    node = node[p];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{${name}}`,
  );
}

/** Translate a dotted key; tracks Solid locale for reactivity. */
export function t(key: string, params?: Record<string, string | number>): string {
  const loc = locale();
  const parts = key.split(".").filter(Boolean);
  const primary = lookup(CATALOGS[loc], parts);
  if (primary != null) return interpolate(primary, params);
  const fallback = lookup(CATALOGS["pt-BR"], parts);
  if (fallback != null) return interpolate(fallback, params);
  return key;
}

/** Display name for a system role; otherwise returns stored name. */
export function systemRoleLabel(role: { name: string; is_system?: boolean }): string {
  if (!role.is_system) return role.name;
  // Product system owner role is historically named "Dono"
  if (role.name === "Dono" || role.name.toLowerCase() === "owner") {
    return t("roles.system.owner");
  }
  return role.name;
}

export function emptyServerJokes(): string[] {
  return [
    t("emptyServer.joke1"),
    t("emptyServer.joke2"),
    t("emptyServer.joke3"),
    t("emptyServer.joke4"),
    t("emptyServer.joke5"),
  ];
}
