import { ApiError } from "../api/client";

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
        return "Câmera sem permissão — entraste só com áudio.";
      case "device":
        return "Câmera indisponível — entraste só com áudio.";
      case "connection":
        return "Câmera indisponível — entraste só com áudio.";
      default:
        return "Câmera indisponível — entraste só com áudio.";
    }
  }

  switch (category) {
    case "permission":
      return "Precisas de permitir o microfone para entrar na chamada.";
    case "device":
      return "Não foi possível usar o microfone ou a câmera (dispositivo em falta ou ocupado).";
    case "connection":
      return "Não foi possível ligar à sala. Tenta de novo.";
    default:
      return "Não foi possível entrar na chamada. Tenta de novo.";
  }
}
