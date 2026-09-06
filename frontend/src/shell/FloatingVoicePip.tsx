import {
  For,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  type JSX,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { RoomEvent, Track, type LocalTrack, type RemoteTrack } from "livekit-client";
import { attachRemote } from "../video/liveClient";
import {
  CORNER_CLASS,
  clampPipPosition,
  nearestCorner,
  type Corner,
} from "../voice/pipCorner";
import { useVoiceSession, voiceDurationLabel } from "../voice/VoiceSession";
import { IconPhoneHangupFilled } from "../components/icons/IconPhoneHangup";

type Tile = { id: string; kind: "local" | "remote"; track: LocalTrack | RemoteTrack };

function collectCameraTiles(
  room: import("livekit-client").Room | undefined,
  localCam: import("livekit-client").LocalVideoTrack | null,
): Tile[] {
  const out: Tile[] = [];
  if (localCam && localCam.kind === Track.Kind.Video) {
    out.push({ id: "local", kind: "local", track: localCam });
  } else if (room?.localParticipant) {
    for (const pub of room.localParticipant.videoTrackPublications.values()) {
      const t = pub.track;
      if (t && pub.source === Track.Source.Camera) {
        out.push({ id: `local:${pub.trackSid}`, kind: "local", track: t });
        break;
      }
    }
  }
  if (room) {
    for (const p of room.remoteParticipants.values()) {
      for (const pub of p.videoTrackPublications.values()) {
        const t = pub.track;
        if (!t || pub.source !== Track.Source.Camera) continue;
        if (t.kind !== Track.Kind.Video) continue;
        out.push({ id: `${p.identity}:${pub.trackSid}`, kind: "remote", track: t as RemoteTrack });
      }
    }
  }
  return out.slice(0, 4);
}

function detachTileMedia(node: HTMLElement) {
  for (const child of [...node.children]) {
    if (child instanceof HTMLMediaElement) {
      child.remove();
    }
  }
}

function stopActionPointer(ev: Event) {
  ev.stopPropagation();
}

export default function FloatingVoicePip(): JSX.Element {
  const voice = useVoiceSession();
  const navigate = useNavigate();
  const [tiles, setTiles] = createSignal<Tile[]>([]);
  const [dragging, setDragging] = createSignal(false);
  const [dragPos, setDragPos] = createSignal<{ left: number; top: number } | null>(null);

  let rootEl: HTMLDivElement | undefined;
  const tileEls = new Map<string, HTMLDivElement>();
  const localAttachCache = new WeakMap<LocalTrack, HTMLMediaElement>();
  let dragOrigin: { pointerId: number; startX: number; startY: number; origL: number; origT: number } | null =
    null;

  function refreshTiles() {
    const room = voice.session()?.room;
    setTiles(collectCameraTiles(room, voice.localCamTrack()));
  }

  function layoutTiles() {
    for (const tile of tiles()) {
      const node = tileEls.get(tile.id);
      if (!node) continue;
      if (tile.kind === "remote") {
        attachRemote(tile.track as RemoteTrack, node);
      } else {
        const local = tile.track as LocalTrack;
        let el = voice.localVideoEl() ?? localAttachCache.get(local) ?? null;
        if (!el) {
          el = local.attach();
          localAttachCache.set(local, el);
        }
        if (el instanceof HTMLVideoElement) {
          el.autoplay = true;
          el.playsInline = true;
        }
        if (el.parentElement !== node) node.replaceChildren(el);
        void (el as HTMLMediaElement).play?.().catch(() => undefined);
      }
    }
  }

  createEffect(() => {
    refreshTiles();
    const room = voice.session()?.room;
    if (!room) return;
    const onChange = () => refreshTiles();
    room.on(RoomEvent.TrackSubscribed, onChange);
    room.on(RoomEvent.TrackUnsubscribed, onChange);
    room.on(RoomEvent.LocalTrackPublished, onChange);
    room.on(RoomEvent.LocalTrackUnpublished, onChange);
    onCleanup(() => {
      room.off(RoomEvent.TrackSubscribed, onChange);
      room.off(RoomEvent.TrackUnsubscribed, onChange);
      room.off(RoomEvent.LocalTrackPublished, onChange);
      room.off(RoomEvent.LocalTrackUnpublished, onChange);
    });
  });

  createEffect(() => {
    tiles();
    queueMicrotask(layoutTiles);
  });

  onCleanup(() => {
    for (const node of tileEls.values()) detachTileMedia(node);
    tileEls.clear();
  });

  createEffect(() => {
    const onResize = () => {
      if (dragging()) return;
      /* corner classes re-apply on next render via pipCorner(); force style clear */
      setDragPos(null);
    };
    window.addEventListener("resize", onResize);
    onCleanup(() => window.removeEventListener("resize", onResize));
  });

  function goToStage() {
    const id = voice.channelId();
    const server = voice.serverId();
    if (!id) return;
    navigate(`/channels/${id}${server ? `?server=${server}&type=voice_video` : ""}`);
  }

  function appBounds(): DOMRect {
    const app = document.querySelector(".app");
    if (app) return app.getBoundingClientRect();
    return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function onHeaderPointerDown(ev: PointerEvent) {
    if (ev.button !== 0) return;
    const target = ev.target as HTMLElement | null;
    if (target?.closest("button")) return;
    if (!rootEl) return;
    const rect = rootEl.getBoundingClientRect();
    dragOrigin = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      origL: rect.left,
      origT: rect.top,
    };
    setDragging(true);
    setDragPos({ left: rect.left, top: rect.top });
    rootEl.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  }

  function onHeaderPointerMove(ev: PointerEvent) {
    if (!dragOrigin || ev.pointerId !== dragOrigin.pointerId || !rootEl) return;
    const bounds = appBounds();
    const dx = ev.clientX - dragOrigin.startX;
    const dy = ev.clientY - dragOrigin.startY;
    const pipW = rootEl.offsetWidth;
    const pipH = rootEl.offsetHeight;
    const next = clampPipPosition(
      dragOrigin.origL + dx - bounds.left,
      dragOrigin.origT + dy - bounds.top,
      pipW,
      pipH,
      bounds.width,
      bounds.height,
    );
    setDragPos({ left: bounds.left + next.left, top: bounds.top + next.top });
  }

  function onHeaderPointerUp(ev: PointerEvent) {
    if (!dragOrigin || ev.pointerId !== dragOrigin.pointerId || !rootEl) return;
    try {
      rootEl.releasePointerCapture(ev.pointerId);
    } catch {
      /* already released */
    }
    const pipRect = rootEl.getBoundingClientRect();
    const corner: Corner = nearestCorner(pipRect, appBounds());
    voice.setPipCorner(corner);
    dragOrigin = null;
    setDragging(false);
    setDragPos(null);
  }

  const name = () => voice.channelName() ?? "Chamada";
  const timer = () => voiceDurationLabel(voice.callStartedAt(), voice.now());
  const cornerClass = () => CORNER_CLASS[voice.pipCorner()];

  const rootClass = () => {
    const parts = ["voice-pip"];
    if (dragging()) parts.push("voice-pip--dragging");
    else parts.push(cornerClass());
    return parts.join(" ");
  };

  const rootStyle = (): JSX.CSSProperties | undefined => {
    const pos = dragPos();
    if (!pos || !dragging()) return undefined;
    return {
      position: "fixed",
      left: `${pos.left}px`,
      top: `${pos.top}px`,
      right: "auto",
      bottom: "auto",
    };
  };

  return (
    <div
      class={rootClass()}
      style={rootStyle()}
      ref={(el) => (rootEl = el)}
      role="region"
      aria-label={`Chamada em miniatura: ${name()}`}
    >
      <div
        class="voice-pip-header"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        <div class="voice-pip-title">
          <span>{name()}</span>
          <Show when={timer()}>
            {(t) => (
              <span class="voice-pip-timer" aria-live="off">
                {" "}
                · {t()}
              </span>
            )}
          </Show>
        </div>
      </div>
      <Show
        when={tiles().length > 0}
        fallback={
          <div class="voice-pip-fallback">
            <strong>{name()}</strong>
            <span>Em chamada</span>
          </div>
        }
      >
        <div class="voice-pip-media">
          <For each={tiles()}>
            {(tile) => (
              <div
                class="voice-pip-tile"
                ref={(el) => {
                  tileEls.set(tile.id, el);
                  queueMicrotask(layoutTiles);
                  onCleanup(() => {
                    detachTileMedia(el);
                    tileEls.delete(tile.id);
                  });
                }}
              />
            )}
          </For>
        </div>
      </Show>
      {/* 040: Voltar + hangup only (no mic/cam). Hangup does not navigate.
          UserPanel (039) also offers off-stage leave; PiP hangup for convenience. */}
      <div class="voice-pip-actions">
        <button
          type="button"
          class="btn btn-secondary"
          onPointerDown={stopActionPointer}
          onClick={() => goToStage()}
        >
          Voltar à mesa
        </button>
        <button
          type="button"
          class="btn btn-danger voice-pip-hangup"
          aria-label="Sair da chamada"
          title="Sair da chamada"
          onPointerDown={stopActionPointer}
          onClick={() => void voice.hangup()}
        >
          <IconPhoneHangupFilled size={18} />
        </button>
      </div>
    </div>
  );
}
