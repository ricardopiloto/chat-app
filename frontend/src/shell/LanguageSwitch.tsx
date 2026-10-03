import { For } from "solid-js";
import { LOCALES, getLocale, setLocale } from "../i18n";
import { t } from "../i18n";

// Compact language picker for the top bars; the account menu has the long form.
export function LanguageSwitch() {
  return (
    <div class="flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container-low p-0.5" role="radiogroup" aria-label={t("shell.language")}>
      <For each={LOCALES}>
        {(entry) => (
          <button
            type="button"
            role="radio"
            aria-checked={getLocale() === entry.code}
            title={entry.name}
            onClick={() => setLocale(entry.code)}
            class="rounded-full px-2.5 py-1 font-code text-label-code-sm uppercase text-on-surface-variant transition-colors hover:text-on-surface aria-checked:bg-primary-container aria-checked:text-on-primary-container"
          >
            {entry.code === "pt-BR" ? "PT" : "EN"}
          </button>
        )}
      </For>
    </div>
  );
}
