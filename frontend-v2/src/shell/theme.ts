export type ThemeMode = "system" | "light" | "dark";
export function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem("mesa.theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}
export function applyTheme(mode: ThemeMode) {
  const actual =
    mode === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
  document.documentElement.dataset.theme = actual;
}
/** Re-applies the theme when the OS scheme changes while mode is "system". Returns a disposer. */
export function watchSystemTheme(getMode: () => ThemeMode): () => void {
  const m = matchMedia("(prefers-color-scheme: dark)");
  const change = () => {
    if (getMode() === "system") applyTheme("system");
  };
  m.addEventListener("change", change);
  return () => m.removeEventListener("change", change);
}

// Reactive view of the chosen mode. Setting it applies the theme at once and remembers the choice.
import { createSignal } from "solid-js";
const [currentMode, setCurrentMode] = createSignal<ThemeMode>(readTheme());
export const themeMode = currentMode;
export function setThemeMode(mode: ThemeMode): void {
  setCurrentMode(mode);
  applyTheme(mode);
  try {
    localStorage.setItem("mesa.theme", mode);
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
}
