import { isAppLocale, type AppLocale } from "./types";

/** Map browser/system languages to a supported AppLocale. */
export function detectLocale(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    : ["pt-BR"],
): AppLocale {
  for (const raw of languages) {
    const tag = (raw || "").trim().toLowerCase();
    if (!tag) continue;
    if (tag === "en" || tag.startsWith("en-")) return "en";
    if (tag === "pt" || tag.startsWith("pt-")) return "pt-BR";
  }
  return "pt-BR";
}

export function parseStoredLocale(raw: string | null): AppLocale | null {
  if (!raw) return null;
  return isAppLocale(raw) ? raw : null;
}
