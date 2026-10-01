import { readString, writeString } from "../lib/localPrefs";

export type CameraBlurMode = "off" | "light" | "strong";

const KEY = "mesa.cameraBlur";

export function isCameraBlurMode(v: string | null): v is CameraBlurMode {
  return v === "off" || v === "light" || v === "strong";
}

export function readBlurMode(): CameraBlurMode {
  const v = readString(KEY);
  if (isCameraBlurMode(v)) return v;
  return "off";
}

export function writeBlurMode(mode: CameraBlurMode): void {
  writeString(KEY, mode);
}
