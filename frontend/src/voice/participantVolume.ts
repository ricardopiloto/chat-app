// Per-remote-participant playback volume (0–200%, 100 = unchanged), local to this device.
// Keyed by the other person's account handle — separate from the flat own-device prefs in devices.ts.
import { createSignal } from "solid-js";
import { readJson, writeJson } from "../lib/localPrefs";

const STORE = "mesa.participantVolume.v1";
export const VOLUME_DEFAULT = 100;
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 200;

type VolumeMap = Record<string, number>;

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return VOLUME_DEFAULT;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(value)));
}

function load(): VolumeMap {
  const raw = readJson<VolumeMap>(STORE, {});
  const next: VolumeMap = {};
  for (const [handle, value] of Object.entries(raw)) {
    if (typeof handle !== "string" || handle.length === 0) continue;
    if (typeof value !== "number") continue;
    const clamped = clampVolume(value);
    if (clamped === VOLUME_DEFAULT) continue;
    next[handle] = clamped;
  }
  return next;
}

const [volumes, setVolumes] = createSignal<VolumeMap>(load());

function persist(next: VolumeMap): void {
  setVolumes(next);
  writeJson(STORE, next);
}

/** Volume percent for a remote handle; missing entries are 100. */
export function volumeForHandle(handle: string): number {
  return volumes()[handle] ?? VOLUME_DEFAULT;
}

/** Save a non-default volume; writing 100 removes the entry. */
export function setVolumeForHandle(handle: string, percent: number): number {
  if (!handle) return VOLUME_DEFAULT;
  const clamped = clampVolume(percent);
  const next = { ...volumes() };
  if (clamped === VOLUME_DEFAULT) delete next[handle];
  else next[handle] = clamped;
  persist(next);
  return clamped;
}

/** Reactive map accessor for UI that needs to re-render on change. */
export const participantVolumes = volumes;
