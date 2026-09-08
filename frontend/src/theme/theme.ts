import { readString, writeString } from "../lib/localPrefs";

/** Effective applied theme (`data-theme`). */
export type Theme = "light" | "dark";

/** Persisted preference; `null` = never set (behaves like system for resolution). */
export type ThemePreference = "system" | "light" | "dark";

const KEY = "mesa.theme";
export const THEME_PREF_EVENT = "mesa:theme-preference";

export type ThemePreferenceDetail = {
  preference: ThemePreference | null;
  effective: Theme;
};

let listenersStarted = false;

export function readThemePreference(): ThemePreference | null {
  const v = readString(KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return null;
}

/** @deprecated Prefer readThemePreference — returns only light/dark overrides. */
export function readStoredTheme(): Theme | null {
  const p = readThemePreference();
  if (p === "light" || p === "dark") return p;
  return null;
}

export function systemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Effective theme from preference (or OS when system/absent). */
export function resolveEffectiveTheme(
  preference: ThemePreference | null = readThemePreference(),
): Theme {
  if (preference === "light" || preference === "dark") return preference;
  return systemTheme();
}

/** Alias — effective theme for apply/boot. */
export function resolveTheme(): Theme {
  return resolveEffectiveTheme();
}

/** Preference shown in UI: absent ≡ system. */
export function displayPreference(
  preference: ThemePreference | null = readThemePreference(),
): ThemePreference {
  return preference ?? "system";
}

export function writeThemePreference(preference: ThemePreference): void {
  writeString(KEY, preference);
}

/** @deprecated Prefer writeThemePreference. */
export function writeTheme(theme: Theme): void {
  writeThemePreference(theme);
}

export function applyTheme(
  theme: Theme,
  root: HTMLElement | null = document.querySelector(".app"),
): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  if (!root) return;
  root.setAttribute("data-theme", theme);
}

function broadcastPreference(preference: ThemePreference | null, effective: Theme): void {
  window.dispatchEvent(
    new CustomEvent<ThemePreferenceDetail>(THEME_PREF_EVENT, {
      detail: { preference, effective },
    }),
  );
}

/** Persist preference, apply effective theme, notify same-tab listeners. */
export function setThemePreference(
  preference: ThemePreference,
  root?: HTMLElement | null,
): Theme {
  writeThemePreference(preference);
  const effective = resolveEffectiveTheme(preference);
  const el =
    root === undefined
      ? (document.querySelector(".app") as HTMLElement | null)
      : root;
  applyTheme(effective, el);
  broadcastPreference(preference, effective);
  return effective;
}

/** Cycle system → light → dark → system (absent treated as system). */
export function cycleThemePreference(root?: HTMLElement | null): ThemePreference {
  const current = displayPreference();
  const next: ThemePreference =
    current === "system" ? "light" : current === "light" ? "dark" : "system";
  setThemePreference(next, root);
  return next;
}

export function bootTheme(root: HTMLElement | null = document.querySelector(".app")): Theme {
  const preference = readThemePreference();
  const theme = resolveEffectiveTheme(preference);
  applyTheme(theme, root);
  return theme;
}

function onSystemSchemeChange(): void {
  const preference = readThemePreference();
  if (preference === "light" || preference === "dark") return;
  const effective = systemTheme();
  applyTheme(effective);
  broadcastPreference(preference, effective);
}

function onStorage(e: StorageEvent): void {
  if (e.key !== KEY && e.key !== null) return;
  const preference = readThemePreference();
  const effective = resolveEffectiveTheme(preference);
  applyTheme(effective);
  broadcastPreference(preference, effective);
}

/** Idempotent: matchMedia + storage listeners for FR-007 / FR-009. */
export function startThemeListeners(): void {
  if (typeof window === "undefined" || listenersStarted) return;
  listenersStarted = true;
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onSystemSchemeChange);
  } else {
    mq.addListener(onSystemSchemeChange);
  }
  window.addEventListener("storage", onStorage);
}
