import { For, Show, onCleanup, type JSX } from "solid-js";

export type ContextMenuItem = {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export type MenuState = {
  x: number;
  y: number;
  items: ContextMenuItem[];
};

export function useContextMenu() {
  let menu: MenuState | null = null;
  const listeners = new Set<() => void>();
  function notify() {
    for (const l of listeners) l();
  }
  return {
    get: () => menu,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    open(e: { clientX: number; clientY: number }, items: ContextMenuItem[]) {
      menu = { x: e.clientX, y: e.clientY, items };
      notify();
    },
    close() {
      menu = null;
      notify();
    },
  };
}

type Props = {
  menu: MenuState | null | undefined;
  onClose: () => void;
};

export default function ContextMenu(props: Props): JSX.Element {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };
  window.addEventListener("keydown", onKey);
  onCleanup(() => window.removeEventListener("keydown", onKey));

  return (
    <Show when={props.menu}>
      {(m) => (
        <div
          class="context-menu-root"
          role="presentation"
          onClick={() => props.onClose()}
          onContextMenu={(e) => {
            e.preventDefault();
            props.onClose();
          }}
        >
          <ul
            class="context-menu"
            style={{ left: `${m().x}px`, top: `${m().y}px` }}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <For each={m().items}>
              {(item) => (
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    class={`context-menu-item${item.danger ? " danger" : ""}`}
                    disabled={item.disabled}
                    onClick={() => {
                      props.onClose();
                      item.onSelect();
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      )}
    </Show>
  );
}

/** Long-press helper for touch (≈500ms). */
export function bindLongPress(
  el: HTMLElement,
  onLongPress: (x: number, y: number) => void,
) {
  let timer: number | undefined;
  const clear = () => {
    if (timer != null) window.clearTimeout(timer);
    timer = undefined;
  };
  const start = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    clear();
    timer = window.setTimeout(() => onLongPress(t.clientX, t.clientY), 500);
  };
  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchend", clear);
  el.addEventListener("touchmove", clear);
  el.addEventListener("touchcancel", clear);
  return () => {
    clear();
    el.removeEventListener("touchstart", start);
    el.removeEventListener("touchend", clear);
    el.removeEventListener("touchmove", clear);
    el.removeEventListener("touchcancel", clear);
  };
}
