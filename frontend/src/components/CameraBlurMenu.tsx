import { For, Show, createEffect, onCleanup } from "solid-js";
import type { CameraBlurMode } from "../blur/blurPreference";

const OPTIONS: { mode: CameraBlurMode; label: string }[] = [
  { mode: "off", label: "Sem blur" },
  { mode: "light", label: "Blur leve" },
  { mode: "strong", label: "Blur forte" },
];

type Props = {
  open: boolean;
  mode: CameraBlurMode;
  onClose: () => void;
  onSelect: (mode: CameraBlurMode) => void;
};

export default function CameraBlurMenu(props: Props) {
  let panelRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        props.onClose();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest(".camera-blur-anchor")) return;
      if (panelRef && t instanceof Node && !panelRef.contains(t)) props.onClose();
    };
    window.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointer);
    }, 0);
    onCleanup(() => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    });
  });

  return (
    <Show when={props.open}>
      <div class="camera-blur-menu" ref={(el) => (panelRef = el)}>
        <div class="camera-blur-menu-panel" role="menu" aria-label="Fundo da câmara">
          <For each={OPTIONS}>
            {(opt) => (
              <button
                type="button"
                class="camera-blur-menu-item"
                role="menuitemradio"
                aria-checked={props.mode === opt.mode}
                onClick={() => props.onSelect(opt.mode)}
              >
                {opt.label}
              </button>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
