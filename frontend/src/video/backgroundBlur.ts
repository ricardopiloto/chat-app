import {
  BackgroundProcessor,
  supportsBackgroundProcessors,
  type BackgroundProcessorWrapper,
} from "@livekit/track-processors";
import type { LocalVideoTrack } from "livekit-client";
import type { CameraBlurMode } from "../blur/blurPreference";

export const BLUR_RADIUS: Record<"light" | "strong", number> = { light: 12, strong: 32 };

export const BLUR_UNAVAILABLE = "Blur de fundo não disponível";
export const BLUR_FAILED = "Blur de fundo falhou — o vídeo está em pausa";

const TASKS_VISION = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/selfie_segmenter.tflite";

export function supportsCameraBlur(): boolean {
  try {
    return supportsBackgroundProcessors();
  } catch {
    return false;
  }
}

export class BlurUnavailableError extends Error {
  constructor() {
    super(BLUR_UNAVAILABLE);
    this.name = "BlurUnavailableError";
  }
}

type TrackBlurState = {
  processor: BackgroundProcessorWrapper;
  blurredFrames: number;
  waiters: Array<() => void>;
};

const stateByTrack = new WeakMap<LocalVideoTrack, TrackBlurState>();

function assetPaths() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    tasksVisionFileSet: `${origin}${TASKS_VISION}`,
    modelAssetPath: `${origin}${MODEL_PATH}`,
  };
}

function notifyBlurred(state: TrackBlurState) {
  state.blurredFrames += 1;
  const waiters = state.waiters.splice(0);
  for (const w of waiters) w();
}

export function createBlurProcessor(track: LocalVideoTrack, initial: CameraBlurMode): BackgroundProcessorWrapper {
  const existing = stateByTrack.get(track);
  if (existing) return existing.processor;

  const state: TrackBlurState = {
    processor: BackgroundProcessor({
      mode: initial === "off" ? "disabled" : "background-blur",
      blurRadius: initial === "off" ? undefined : BLUR_RADIUS[initial],
      assetPaths: assetPaths(),
      onFrameProcessed: () => notifyBlurred(state),
    }),
    blurredFrames: 0,
    waiters: [],
  };
  stateByTrack.set(track, state);
  return state.processor;
}

function stateOf(track: LocalVideoTrack): TrackBlurState | undefined {
  return stateByTrack.get(track);
}

export async function applyBlurMode(track: LocalVideoTrack, mode: CameraBlurMode): Promise<void> {
  if (!supportsCameraBlur()) throw new BlurUnavailableError();
  let state = stateOf(track);
  if (!state) {
    const processor = createBlurProcessor(track, mode);
    state = stateOf(track);
    if (!state) throw new Error("blur processor state missing");
    await track.setProcessor(processor);
    return;
  }
  if (mode === "off") {
    await state.processor.switchTo({ mode: "disabled" });
    return;
  }
  if (state.processor.mode !== "background-blur") {
    state.blurredFrames = 0;
  }
  await state.processor.switchTo({ mode: "background-blur", blurRadius: BLUR_RADIUS[mode] });
}

/** Resolves after at least one *processed* frame (LiveKit's first passthrough does not fire onFrameProcessed). */
export function waitUntilBlurred(track: LocalVideoTrack, timeoutMs = 12000): Promise<void> {
  const state = stateOf(track);
  if (!state) return Promise.reject(new Error("blur processor not attached"));
  if (state.blurredFrames > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("timeout a aplicar blur de fundo"));
    }, timeoutMs);
    state.waiters.push(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
}

export async function stopBlurProcessor(track: LocalVideoTrack): Promise<void> {
  try {
    await track.stopProcessor();
  } catch {
    /* already stopped */
  }
  stateByTrack.delete(track);
}
