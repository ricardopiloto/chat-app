/**
 * Panel dialog load/save chrome helpers (inventory C5).
 */
import { errorMessage } from "./apiError";

/** Alias for panel catch → user-facing string. */
export function formatCatch(err: unknown, fallback?: string): string {
  return errorMessage(err, fallback);
}

/** Clear error, toggle saving, run async work, map failures via errorMessage. */
export async function runPanelAction(
  setError: (msg: string) => void,
  setSaving: (busy: boolean) => void,
  fn: () => Promise<void>,
): Promise<void> {
  setSaving(true);
  setError("");
  try {
    await fn();
  } catch (err) {
    setError(errorMessage(err));
  } finally {
    setSaving(false);
  }
}
