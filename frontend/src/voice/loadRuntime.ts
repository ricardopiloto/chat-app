let pending: Promise<typeof import("./runtime")> | null = null;

export function loadVoiceRuntime() {
  if (!pending) {
    pending = import("./runtime").catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
}

export type VoiceRuntime = Awaited<ReturnType<typeof loadVoiceRuntime>>;
