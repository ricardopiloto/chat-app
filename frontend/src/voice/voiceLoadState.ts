export type VoiceLoadPhase = "idle" | "loading" | "ready" | "failed";

export function isVoiceLoading(phase: VoiceLoadPhase): boolean {
  return phase === "loading";
}

export function isVoiceLoadFailed(phase: VoiceLoadPhase): boolean {
  return phase === "failed";
}

export function isVoiceReady(phase: VoiceLoadPhase): boolean {
  return phase === "ready";
}
