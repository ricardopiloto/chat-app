/**
 * Shared API/unknown error → user-facing string.
 * Migrated surfaces: see specs/053-frontend-build-optimize/inventory.md C1.
 */
import { ApiError } from "../api/client";

function messageFromObject(err: object): string | null {
  if ("message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return null;
}

export function errorMessage(err: unknown, fallback = "Algo correu mal."): string {
  if (err == null) return fallback;
  if (typeof err === "string" && err.trim()) return err;
  if (err instanceof ApiError) {
    if (err.message.trim()) return err.message;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "object") {
    const msg = messageFromObject(err);
    if (msg) return msg;
  }
  return fallback;
}
