import { isAppLocale, type AppLocale } from "./types";
export function detectLocale(languages: readonly string[] = typeof navigator !== "undefined" ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : ["pt-BR"]): AppLocale {
  for (const raw of languages) { const tag = (raw || "").trim().toLowerCase(); if (tag.startsWith("en")) return "en"; if (tag === "pt" || tag.startsWith("pt-")) return "pt-BR"; }
  return "pt-BR";
}
export function parseStoredLocale(raw: string | null): AppLocale | null { return raw && isAppLocale(raw) ? raw : null; }
