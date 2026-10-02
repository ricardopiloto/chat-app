import { For, Show, createEffect, createSignal, on, onCleanup, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { t } from "../../i18n";

/** Calls `handler` on Escape for as long as `active()` is true. */
function useEscape(active: () => boolean, handler: () => void) {
  createEffect(() => {
    if (!active()) return;
    const listener = (event: KeyboardEvent) => event.key === "Escape" && handler();
    document.addEventListener("keydown", listener);
    onCleanup(() => document.removeEventListener("keydown", listener));
  });
}

// Modal dialog rendered in a portal so no ancestor can clip it. Escape and a press that starts on
// the dimmed backdrop close it; focus moves into the dialog and returns to the opener afterwards.
export function Dialog(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: JSX.Element;
  /** Material icon shown in a tile before the title. */
  icon?: string;
  /** Colour band along the top edge, for confirmations that need weight. */
  accent?: boolean;
  /** Wider panel for dialogs that carry forms with several blocks. */
  wide?: boolean;
  /** Small mono caption above the title. */
  eyebrow?: string;
}) {
  let panel: HTMLElement | undefined;
  useEscape(() => props.open, () => props.onClose());
  createEffect(
    on(
      () => props.open,
      (open) => {
        if (!open) return;
        const opener = document.activeElement;
        queueMicrotask(() => {
          const first = (selector: string) => panel?.querySelector<HTMLElement>(selector);
          (first("[data-autofocus]") ?? first("input, select") ?? first("button.primary") ?? first("button"))?.focus();
        });
        onCleanup(() => opener instanceof HTMLElement && opener.focus());
      },
    ),
  );
  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="dialog-backdrop"
          onPointerDown={(event) => event.target === event.currentTarget && props.onClose()}
        >
          <section ref={panel} class="dialog" classList={{ accent: props.accent, wide: props.wide }} role="dialog" aria-modal="true" aria-label={props.title}>
            <header>
              <Show when={props.icon}>{(name) => <span class="dialog-icon"><Icon name={name()} /></span>}</Show>
              <div class="dialog-title">
                <Show when={props.eyebrow}>{(text) => <span class="dialog-eyebrow">{text()}</span>}</Show>
                <h2>{props.title}</h2>
              </div>
              <Button variant="icon" title={t("ui.close")} onClick={() => props.onClose()}>
                <Icon name="close" />
              </Button>
            </header>
            {props.children}
          </section>
        </div>
      </Portal>
    </Show>
  );
}

export function Toast(props: { message: string; show: boolean }) {
  return (
    <Show when={props.show}>
      <div class="toast" role="status" aria-live="polite">
        <Icon name="check_circle" />
        <span>{props.message}</span>
      </div>
    </Show>
  );
}

export type MenuItem = { label: string; danger?: boolean; action: () => void };

const TOUCH_HOLD_MS = 500;
const MENU_WIDTH = 200;
const ROW_HEIGHT = 40;
const EDGE = 8;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), Math.max(low, high));

// Context menu opened at the pointer by right-click, or by holding a finger down for half a second.
// It clamps to the viewport and closes on an outside press, on Escape, or after a choice.
export function ContextMenu(props: { children: JSX.Element; items: MenuItem[] }) {
  const [anchor, setAnchor] = createSignal<{ left: number; top: number }>();
  let hold = 0;
  const show = (x: number, y: number) =>
    setAnchor({
      left: clamp(x, EDGE, window.innerWidth - MENU_WIDTH - EDGE),
      top: clamp(y, EDGE, window.innerHeight - props.items.length * ROW_HEIGHT - 2 * EDGE),
    });
  const hide = () => setAnchor(undefined);
  useEscape(() => anchor() !== undefined, hide);
  createEffect(() => {
    if (!anchor()) return;
    // A press inside the menu is a choice in progress; only presses elsewhere dismiss it.
    const dismissOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".context-menu")) hide();
    };
    document.addEventListener("pointerdown", dismissOutside);
    onCleanup(() => document.removeEventListener("pointerdown", dismissOutside));
  });
  return (
    <div
      class="context-target"
      onContextMenu={(event) => {
        if (props.items.length === 0) return;
        event.preventDefault();
        show(event.clientX, event.clientY);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "touch" && props.items.length > 0) hold = window.setTimeout(() => show(event.clientX, event.clientY), TOUCH_HOLD_MS);
      }}
      onPointerUp={() => window.clearTimeout(hold)}
      onPointerCancel={() => window.clearTimeout(hold)}
      onPointerMove={() => window.clearTimeout(hold)}
    >
      {props.children}
      <Show when={anchor()}>
        {(position) => (
          <div
            class="context-menu"
            role="menu"
            style={{ left: `${position().left}px`, top: `${position().top}px`, width: `${MENU_WIDTH}px` }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <For each={props.items}>
              {(item) => (
                <button
                  type="button"
                  role="menuitem"
                  class={item.danger ? "danger" : undefined}
                  onClick={() => {
                    hide();
                    // Run after this click has finished, so a dialog opened by the action does not receive it.
                    window.setTimeout(item.action, 0);
                  }}
                >
                  {item.label}
                </button>
              )}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
}
