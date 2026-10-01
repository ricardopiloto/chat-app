import { ApiError } from "../api/client";
import { t } from "../i18n";

export function errorText(
  err: unknown,
  fallbackKey = "admin.genericError",
): string {
  if (err instanceof ApiError && err.message.trim()) return err.message;
  if (err instanceof Error && err.message.trim()) return err.message;
  return t(fallbackKey);
}
