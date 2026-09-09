import { ApiError } from "../api/client";
import { t } from "../i18n";

/** Join / capture error taxonomy for voice channel connect (031). */

export type JoinErrorCategory = "permission" | "device" | "connection" | "generic";

export function categorizeJoinError(err: unknown): JoinErrorCategory {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return "permission";
    if (err.status >= 400) return "connection";
  }

  if (err instanceof DOMException || (err && typeof err === "object" && "name" in err)) {
    const name = String((err as { name: string }).name);
    if (name === "NotAllowedError" || name === "SecurityError") return "permission";
    if (
      name === "NotFoundError" ||
      name === "NotReadableError" ||
      name === "OverconstrainedError" ||
      name === "AbortError"
    ) {
      return "device";
    }
  }

  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();

  if (
    /notallowed|permission|denied|secure context|gesto|clique para libertar/i.test(msg) ||
    lower.includes("notallowederror")
  ) {
    return "permission";
  }
  if (
    /notfound|notreadable|device|webcam|microfone|câmera|camera|occupied|ocupad/i.test(msg)
  ) {
    return "device";
  }
  if (
    /failed to fetch|network|timeout|livekit|connect|websocket|econn|503|502|504|join/i.test(
      lower,
    )
  ) {
    return "connection";
  }

  return "generic";
}

export function joinErrorMessage(
  category: JoinErrorCategory,
  opts?: { cameraOnly?: boolean },
): string {
  if (opts?.cameraOnly) {
    switch (category) {
      case "permission":
        return t("voice.camOnlyPermission");
      case "device":
      case "connection":
      default:
        return t("voice.camOnlyUnavailable");
    }
  }

  switch (category) {
    case "permission":
      return t("voice.errPermission");
    case "device":
      return t("voice.errDevice");
    case "connection":
      return t("voice.errConnection");
    default:
      return t("voice.errGeneric");
  }
}
