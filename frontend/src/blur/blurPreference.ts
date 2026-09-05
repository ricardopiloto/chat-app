export type CameraBlurMode = "off" | "light" | "strong";

const KEY = "mesa.cameraBlur";

export function isCameraBlurMode(v: string | null): v is CameraBlurMode {
  return v === "off" || v === "light" || v === "strong";
}

export function readBlurMode(): CameraBlurMode {
  try {
    const v = localStorage.getItem(KEY);
    if (isCameraBlurMode(v)) return v;
  } catch {
    /* private mode */
  }
  return "off";
}

export function writeBlurMode(mode: CameraBlurMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode */
  }
}
