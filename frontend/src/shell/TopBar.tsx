import { Show, createSignal, onMount } from "solid-js";
import { applyTheme, resolveTheme, writeTheme, type Theme } from "../theme/theme";
import { instanceLabel } from "./instanceLabel";

type Props = {
  handle: string;
  onLogout: () => void;
  onMenuToggle?: () => void;
  showMenuToggle?: boolean;
};

function initials(handle: string): string {
  const parts = handle.trim().split(/[\s._-]+/).filter(Boolean);
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (a && b) return (a + b).toUpperCase();
  return handle.slice(0, 2).toUpperCase() || "?";
}

export default function TopBar(props: Props) {
  const [theme, setTheme] = createSignal<Theme>(resolveTheme());

  onMount(() => {
    setTheme(resolveTheme());
  });

  function set(t: Theme) {
    writeTheme(t);
    applyTheme(t);
    setTheme(t);
  }

  return (
    <header class="topbar">
      <Show when={props.showMenuToggle}>
        <button type="button" class="menu-toggle" onClick={() => props.onMenuToggle?.()} aria-label="Canais">
          ☰
        </button>
      </Show>
      <div class="topbar-brand">
        <span class="topbar-mark" aria-hidden="true" />
        <span class="topbar-name">Mesa</span>
      </div>
      <span class="topbar-instance">{instanceLabel()}</span>
      <div class="topbar-actions">
        <div class="theme-seg" role="group" aria-label="Tema">
          <button type="button" aria-pressed={theme() === "dark"} onClick={() => set("dark")}>
            Escuro
          </button>
          <button type="button" aria-pressed={theme() === "light"} onClick={() => set("light")}>
            Claro
          </button>
        </div>
        <button type="button" class="user-chip" onClick={() => props.onLogout()} title="Sair">
          <span class="user-avatar">{initials(props.handle)}</span>
          <span style={{ "font-size": "13px", "font-weight": "500" }}>{props.handle}</span>
        </button>
      </div>
    </header>
  );
}
