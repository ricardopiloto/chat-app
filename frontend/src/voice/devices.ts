// Audio & video devices and the user's saved call preferences.
// One module-level store: the green room, the settings page and the live call all read and write the
// same signals, so a choice made anywhere is the one used on the next join.
import { createSignal } from "solid-js";
import { readJson, writeJson } from "../lib/localPrefs";

export type BlurLevel = "off" | "light" | "strong";
export type DeviceKind = "audioinput" | "audiooutput" | "videoinput";

export interface DeviceInfo {
  id: string;
  label: string;
}

/** What the person chose; every field is optional because nothing is chosen on a first run. */
interface Saved {
  micId?: string;
  camId?: string;
  outId?: string;
  micOn?: boolean;
  camOn?: boolean;
  blur?: BlurLevel;
}

const STORE = "mesa.callPrefs.v2";
const BLUR_LEGACY_KEY = "mesa.cameraBlur";

const isBlur = (v: unknown): v is BlurLevel => v === "off" || v === "light" || v === "strong";

function load(): Saved {
  const saved = readJson<Saved>(STORE, {});
  if (!isBlur(saved.blur)) {
    // The blur choice predates this store; honour it once so nobody has to pick it again.
    try {
      const old = localStorage.getItem(BLUR_LEGACY_KEY);
      if (isBlur(old)) saved.blur = old;
    } catch {
      /* storage unavailable: default applies */
    }
  }
  return saved;
}

const [saved, setSaved] = createSignal<Saved>(load());

function patch(next: Partial<Saved>): void {
  const merged = { ...saved(), ...next };
  setSaved(merged);
  writeJson(STORE, merged);
}

export const prefs = {
  micId: () => saved().micId,
  camId: () => saved().camId,
  outId: () => saved().outId,
  micOn: () => saved().micOn ?? true,
  camOn: () => saved().camOn ?? true,
  blur: (): BlurLevel => saved().blur ?? "off",
  setMic: (id: string | undefined) => patch({ micId: id }),
  setCam: (id: string | undefined) => patch({ camId: id }),
  setOut: (id: string | undefined) => patch({ outId: id }),
  setMicOn: (on: boolean) => patch({ micOn: on }),
  setCamOn: (on: boolean) => patch({ camOn: on }),
  setBlur: (level: BlurLevel) => patch({ blur: level }),
};

// --- enumeration ----------------------------------------------------------------------------

export type Permission = "unknown" | "granted" | "denied";

const [list, setList] = createSignal<MediaDeviceInfo[]>([]);
const [permission, setPermission] = createSignal<{ audio: Permission; video: Permission }>({ audio: "unknown", video: "unknown" });

const toInfo = (d: MediaDeviceInfo, n: number, fallback: string): DeviceInfo => ({ id: d.deviceId, label: d.label || `${fallback} ${n + 1}` });

export const devices = {
  mics: (): DeviceInfo[] => list().filter((d) => d.kind === "audioinput").map((d, i) => toInfo(d, i, "Mic")),
  cams: (): DeviceInfo[] => list().filter((d) => d.kind === "videoinput").map((d, i) => toInfo(d, i, "Cam")),
  outputs: (): DeviceInfo[] => list().filter((d) => d.kind === "audiooutput").map((d, i) => toInfo(d, i, "Out")),
  permission,
  /** Browsers only expose output selection where `setSinkId` exists. */
  canPickOutput: (): boolean => typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype,
};

/** Re-reads the device list; labels are empty until the browser has granted access. */
export async function refreshDevices(): Promise<void> {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    setList(await navigator.mediaDevices.enumerateDevices());
  } catch {
    setList([]);
  }
}

if (typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
  navigator.mediaDevices.addEventListener("devicechange", () => void refreshDevices());
}

/**
 * Asks for access once so labels and ids become available, then stops the probe stream. A denied
 * kind is recorded rather than thrown so callers can explain how to grant it.
 */
export async function requestAccess(wantVideo = true): Promise<void> {
  const probe = async (constraints: MediaStreamConstraints, key: "audio" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((t) => t.stop());
      setPermission((p) => ({ ...p, [key]: "granted" }));
    } catch (error) {
      const blocked = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setPermission((p) => ({ ...p, [key]: blocked ? "denied" : p[key] }));
    }
  };
  if (!navigator.mediaDevices?.getUserMedia) return;
  await probe({ audio: true }, "audio");
  if (wantVideo) await probe({ video: true }, "video");
  await refreshDevices();
}

/** The saved id when it is still plugged in; otherwise undefined, meaning "use the default". */
export function resolveDevice(kind: DeviceKind, savedId: string | undefined): { id: string | undefined; missing: boolean } {
  if (!savedId) return { id: undefined, missing: false };
  const present = list().some((d) => d.kind === kind && d.deviceId === savedId);
  return present ? { id: savedId, missing: false } : { id: undefined, missing: true };
}

// --- microphone level -----------------------------------------------------------------------

export interface LevelMeter {
  /** 0..1 */
  level: () => number;
  stop: () => void;
}

/** Follows the loudness of a stream so the UI can draw a live meter. */
export function meterStream(stream: MediaStream): LevelMeter {
  const [level, setLevel] = createSignal(0);
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let frame = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
    setLevel(Math.min(1, peak / 64));
    frame = requestAnimationFrame(tick);
  };
  tick();
  return {
    level,
    stop: () => {
      cancelAnimationFrame(frame);
      void ctx.close();
    },
  };
}

/** A short tone through the chosen output, so the person can hear where sound will come out. */
export async function playTestTone(outputId: string | undefined): Promise<void> {
  const ctx = new AudioContext();
  if (outputId && "setSinkId" in ctx) {
    try {
      await (ctx as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(outputId);
    } catch {
      /* falls back to the default output */
    }
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 523.25;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.75);
  osc.onended = () => void ctx.close();
}
