/** Supported UI locales for Mesa (074). Extend by adding a catalog + this list. */
export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
