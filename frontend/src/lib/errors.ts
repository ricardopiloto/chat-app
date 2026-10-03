import { t } from "../i18n";

/** The most specific message an error carries, or the translated fallback when it carries none. */
export function errorText(error: unknown, fallbackKey = "admin.genericError"): string {
  const message = error instanceof Error ? error.message.trim() : "";
  return message || t(fallbackKey);
}
