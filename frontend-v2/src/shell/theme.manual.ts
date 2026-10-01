import { applyTheme, watchSystemTheme, type ThemeMode } from "./theme";

/**
 * Manual browser check. From the browser console after starting Vite, run:
 *   const { runSystemThemeManualCheck } = await import('/src/shell/theme.manual.ts');
 *   runSystemThemeManualCheck();
 * Uses a fake matchMedia to simulate the OS switching between dark and light.
 */
export function runSystemThemeManualCheck(): void {
  const realMatchMedia = window.matchMedia;
  const previous = document.documentElement.dataset.theme;
  let dark = true;
  const listeners = new Set<() => void>();
  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return dark;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
  const osChange = (nextDark: boolean) => {
    dark = nextDark;
    listeners.forEach((fn) => fn());
  };
  const expect = (label: string, want: string) => {
    const got = document.documentElement.dataset.theme;
    if (got !== want) throw new Error(`${label}: expected ${want}, got ${got}`);
  };
  try {
    let mode: ThemeMode = "system";
    const dispose = watchSystemTheme(() => mode);
    applyTheme(mode);
    expect("initial system/dark", "dark");
    osChange(false);
    expect("system follows OS to light", "light");
    osChange(true);
    expect("system follows OS to dark", "dark");
    mode = "light";
    applyTheme(mode);
    osChange(true);
    expect("explicit light ignores OS", "light");
    mode = "dark";
    applyTheme(mode);
    osChange(false);
    expect("explicit dark ignores OS", "dark");
    dispose();
    if (listeners.size !== 0)
      throw new Error("listener not removed on dispose");
    mode = "system";
    applyTheme(mode);
    osChange(true);
    expect("disposed watcher no longer reacts", "light");
  } finally {
    window.matchMedia = realMatchMedia;
    if (previous) document.documentElement.dataset.theme = previous;
  }
}
