import { readString, writeString } from "../lib/localPrefs";

export type ViewMode = "composition" | "grid";

const VIEW_KEY = "mesa.viewMode";

export function readViewMode(): ViewMode {
  const v = readString(VIEW_KEY);
  return v === "composition" || v === "grid" ? v : "composition";
}

export function writeViewMode(mode: ViewMode): void {
  writeString(VIEW_KEY, mode);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mesa:view-mode", { detail: { mode } }));
  }
}

/** Subscribe to view-mode changes (screen-share gate in the user panel). */
export function subscribeViewMode(cb: (mode: ViewMode) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (e: Event) => {
    const mode = (e as CustomEvent<{ mode?: string }>).detail?.mode;
    if (mode === "composition" || mode === "grid") cb(mode);
  };
  window.addEventListener("mesa:view-mode", handler);
  return () => window.removeEventListener("mesa:view-mode", handler);
}
