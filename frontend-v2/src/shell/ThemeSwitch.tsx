import { For } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { setThemeMode, themeMode, type ThemeMode } from "./theme";

const MODES: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "system", icon: "desktop_windows", label: "shell.system" },
  { mode: "light", icon: "light_mode", label: "shell.light" },
  { mode: "dark", icon: "dark_mode", label: "shell.dark" },
];

// Three icon buttons in one pill: System follows the operating system, Light and Dark are fixed.
export function ThemeSwitch() {
  return (
    <div class="flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container-low p-0.5" role="radiogroup" aria-label={t("shell.theme")}>
      <For each={MODES}>
        {(entry) => (
          <button
            type="button"
            role="radio"
            aria-checked={themeMode() === entry.mode}
            title={t(entry.label)}
            aria-label={t(entry.label)}
            onClick={() => setThemeMode(entry.mode)}
            class="grid h-7 w-7 place-items-center rounded-full text-on-surface-variant transition-colors hover:text-on-surface aria-checked:bg-primary-container aria-checked:text-on-primary-container"
          >
            <Icon name={entry.icon} class="text-[16px]" />
          </button>
        )}
      </For>
    </div>
  );
}
