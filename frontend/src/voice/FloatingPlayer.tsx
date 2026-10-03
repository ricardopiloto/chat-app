// The floating mini-player: keeps a live call visible and controllable while the person is anywhere
// else in the app. Drag it by its header; on release it snaps to the nearest screen corner, and that
// corner is remembered for the rest of the session (also across calls).
import { For, Show, createMemo, createSignal } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { useShell } from "../shell/state";
import { createElapsed, useCall } from "./callSession";
import { useCallPeople } from "./people";
import { Tile } from "./tiles";

export type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_KEY = "mesa.pip.corner";
const isCorner = (v: unknown): v is Corner => v === "tl" || v === "tr" || v === "bl" || v === "br";

function savedCorner(): Corner {
  try {
    const v = sessionStorage.getItem(CORNER_KEY);
    if (isCorner(v)) return v;
  } catch {
    /* storage unavailable: default applies */
  }
  return "br";
}

// Module level on purpose: it must outlive the player, which unmounts whenever the call ends.
const [corner, setCornerSignal] = createSignal<Corner>(savedCorner());
function setCorner(next: Corner) {
  setCornerSignal(next);
  try {
    sessionStorage.setItem(CORNER_KEY, next);
  } catch {
    /* the corner is just not remembered */
  }
}

/** The corner nearest to a point, judged by which quadrant of the window it falls in. */
export function nearestCorner(x: number, y: number, width: number, height: number): Corner {
  return `${y < height / 2 ? "t" : "b"}${x < width / 2 ? "l" : "r"}` as Corner;
}

const MAX_TILES = 4;

export function FloatingPlayer() {
  const call = useCall();
  const shell = useShell();
  const { people } = useCallPeople();
  const [drag, setDrag] = createSignal<{ dx: number; dy: number } | null>(null);
  let root: HTMLElement | undefined;
  let origin = { x: 0, y: 0 };

  const elapsed = createElapsed(() => {
    const at = call.channelId() ? shell.voiceCalls()[call.channelId()!] : null;
    return at ? Date.parse(at) : call.startedAt();
  });
  const seen = createMemo(() => people().filter((p) => p.camera).slice(0, MAX_TILES));

  function down(event: PointerEvent) {
    if ((event.target as HTMLElement).closest("button")) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    origin = { x: event.clientX, y: event.clientY };
    setDrag({ dx: 0, dy: 0 });
  }
  function move(event: PointerEvent) {
    if (drag()) setDrag({ dx: event.clientX - origin.x, dy: event.clientY - origin.y });
  }
  function up(event: PointerEvent) {
    if (!drag() || !root) return;
    const box = root.getBoundingClientRect();
    setCorner(nearestCorner(box.left + box.width / 2, box.top + box.height / 2, window.innerWidth, window.innerHeight));
    setDrag(null);
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  const goBack = () => call.channel() && shell.go(`/servers/${call.channel()!.server_id}/channels/${call.channel()!.id}`);

  return (
    <aside
      ref={root}
      class={`call-pip corner-${corner()}`}
      classList={{ dragging: !!drag() }}
      style={drag() ? { transform: `translate(${drag()!.dx}px, ${drag()!.dy}px)` } : undefined}
      aria-label={t("call.pip.label")}
    >
      <header class="call-pip-head" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <Icon name="drag_indicator" class="text-[18px]" />
        <div class="call-pip-title">
          <strong>{call.channel()?.name}</strong>
          <time class="mono-label">{elapsed()}</time>
        </div>
        <button type="button" class="call-pip-expand" title={t("call.pip.back")} aria-label={t("call.pip.back")} onClick={goBack}>
          <Icon name="open_in_full" class="text-[18px]" />
        </button>
      </header>
      <div class="call-pip-body" classList={{ empty: seen().length === 0 }}>
        <Show when={seen().length > 0} fallback={<span class="call-pip-idle"><Icon name="graphic_eq" class="text-[24px]" />{t("call.pip.idle")}</span>}>
          <For each={seen()}>{(p) => <Tile person={p} size="mini" speaking={call.speaking().has(p.id)} />}</For>
        </Show>
      </div>
      <footer class="call-pip-controls">
        <button type="button" class="call-control" classList={{ off: !call.mic() }} aria-pressed={call.mic()} disabled={!call.canSpeak()} title={call.mic() ? t("call.mute") : t("call.unmute")} aria-label={call.mic() ? t("call.mute") : t("call.unmute")} onClick={() => void call.setMic(!call.mic())}>
          <Icon name={call.mic() ? "mic" : "mic_off"} />
        </button>
        <button type="button" class="call-control" classList={{ off: call.deafened() }} aria-pressed={call.deafened()} title={call.deafened() ? t("call.undeafen") : t("call.deafen")} aria-label={call.deafened() ? t("call.undeafen") : t("call.deafen")} onClick={call.toggleDeafened}>
          <Icon name={call.deafened() ? "headset_off" : "headset_mic"} />
        </button>
        <button type="button" class="call-control" classList={{ off: !call.cam() }} aria-pressed={call.cam()} disabled={!call.canSpeak()} title={call.cam() ? t("call.camOff") : t("call.camOn")} aria-label={call.cam() ? t("call.camOff") : t("call.camOn")} onClick={() => void call.setCam(!call.cam())}>
          <Icon name={call.cam() ? "videocam" : "videocam_off"} />
        </button>
        <button type="button" class="call-pip-back" onClick={goBack}>{t("call.pip.back")}</button>
        <button type="button" class="call-control hangup" title={t("call.hangup")} aria-label={t("call.hangup")} onClick={() => void call.leave()}>
          <Icon name="call_end" />
        </button>
      </footer>
    </aside>
  );
}
