export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export type MessageTree = { [key: string]: string | MessageTree };
export function isAppLocale(value: string): value is AppLocale { return SUPPORTED_LOCALES.includes(value as AppLocale); }
