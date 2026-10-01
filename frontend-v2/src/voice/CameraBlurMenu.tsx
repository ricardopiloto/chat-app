import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { t } from "../i18n";
import {
  readBlurMode,
  writeBlurMode,
  type CameraBlurMode,
} from "../blur/blurPreference";
import { loadVoiceRuntime } from "./loadRuntime";
import { useVoiceSession } from "./VoiceSession";
import { Icon } from "../components/ui";

const OPTIONS: { mode: CameraBlurMode; key: string }[] = [
  { mode: "off", key: "voice.blurNone" },
  { mode: "light", key: "voice.blurLight" },
  { mode: "strong", key: "voice.blurStrong" },
];

/** Camera background menu (none / light / strong) anchored to the call controls. */
export default function CameraBlurMenu() {
  const voice = useVoiceSession();
  const [open, setOpen] = createSignal(false);
  const [mode, setMode] = createSignal<CameraBlurMode>(readBlurMode());
  const [error, setError] = createSignal("");
  let wrap: HTMLDivElement | undefined;

  createEffect(() => {
    if (!open()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target;
      if (wrap && target instanceof Node && wrap.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const id = window.setTimeout(
      () => window.addEventListener("pointerdown", onPointer),
      0,
    );
    onCleanup(() => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    });
  });

  async function select(next: CameraBlurMode) {
    setError("");
    writeBlurMode(next);
    setMode(next);
    const track = voice.localCamTrack();
    if (!track || !voice.camOn()) return;
    try {
      const runtime = await loadVoiceRuntime();
      if (next !== "off" && !runtime.supportsCameraBlur()) {
        setError(t("voice.blurUnavailable"));
        return;
      }
      await runtime.applyBlurMode(track, next);
    } catch {
      setError(t("voice.blurFailed"));
    }
  }

  return (
    <div class="camera-blur-anchor" ref={(el) => (wrap = el)}>
      <button
        type="button"
        class="call-ctl call-ctl--small"
        aria-haspopup="menu"
        aria-expanded={open()}
        aria-label={t("voice.blurMenu")}
        title={t("voice.blurMenu")}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="blur_on" />
      </button>
      <Show when={open()}>
        <div class="camera-blur-menu" role="menu" aria-label={t("voice.blurMenu")}>
          <For each={OPTIONS}>
            {(opt) => (
              <button
                type="button"
                class="camera-blur-menu-item"
                role="menuitemradio"
                aria-checked={mode() === opt.mode}
                onClick={() => void select(opt.mode)}
              >
                {t(opt.key)}
              </button>
            )}
          </For>
          <Show when={error()}>
            <p class="form-error camera-blur-error" role="alert">
              {error()}
            </p>
          </Show>
        </div>
      </Show>
    </div>
  );
}
