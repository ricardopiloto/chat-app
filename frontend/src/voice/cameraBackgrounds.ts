import { cameraBackgrounds, type CameraBackground } from "../api/endpoints/cameraBackgrounds";
import { createSignal } from "solid-js";
import { prefs } from "./devices";

const [backgrounds, setBackgrounds] = createSignal<CameraBackground[]>([]);
const blobs = new Map<string, Blob>();

export async function loadBackgrounds(): Promise<void> {
  const list = await cameraBackgrounds.list();
  setBackgrounds(list);
  const ids = new Set(list.map((item) => item.id));
  for (const id of blobs.keys()) if (!ids.has(id)) blobs.delete(id);
  const effect = prefs.effect();
  if (effect.kind === "background" && !ids.has(effect.backgroundId)) prefs.setBlur("off");
  await Promise.allSettled(list.map((item) => backgroundBlob(item.id)));
}

export async function backgroundBlob(id: string): Promise<Blob> {
  const cached = blobs.get(id);
  if (cached) return cached;
  const blob = await cameraBackgrounds.image(id);
  blobs.set(id, blob);
  return blob;
}

export async function removeBackground(id: string): Promise<void> {
  await cameraBackgrounds.remove(id);
  blobs.delete(id);
  setBackgrounds((items) => items.filter((item) => item.id !== id));
  const effect = prefs.effect();
  if (effect.kind === "background" && effect.backgroundId === id) prefs.setBlur("off");
}

export const backgroundList = backgrounds;
