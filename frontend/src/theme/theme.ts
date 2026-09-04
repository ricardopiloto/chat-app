export type Theme = "light" | "dark";

const KEY = "mesa.theme";

export function readStoredTheme(): Theme | null {
  const v = localStorage.getItem(KEY);
  if (v === "light" || v === "dark") return v;
  return null;
}

export function systemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Resolve theme: stored user choice, else system preference. */
export function resolveTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

export function writeTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
}

export function applyTheme(theme: Theme, root: HTMLElement | null = document.querySelector(".app")): void {
  if (!root) return;
  root.setAttribute("data-theme", theme);
}

export function bootTheme(root: HTMLElement | null = document.querySelector(".app")): Theme {
  const theme = resolveTheme();
  applyTheme(theme, root);
  return theme;
}
