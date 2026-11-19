// What a person looks like in a call: a video element fed by a track, or an avatar when there is none,
// plus the name and state chips. Every view (stage, grid, strip, floating player) draws people with
// these, so a person looks the same everywhere.
import { Show, createEffect, createSignal, onCleanup, type JSX } from "solid-js";
import type { Track } from "livekit-client";
import { useAuthedSrc } from "../api";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { useCall, type CallConnectionQuality } from "./callSession";
import { participantVolumes, VOLUME_DEFAULT, VOLUME_MAX, VOLUME_MIN } from "./participantVolume";

const QUALITY_ICON: Record<CallConnectionQuality, string> = {
  excellent: "signal_cellular_4_bar",
  good: "signal_cellular_3_bar",
  poor: "signal_cellular_1_bar",
  lost: "signal_cellular_0_bar",
  unknown: "signal_cellular_nodata",
};

export function ConnectionQualityGlyph(props: { level: CallConnectionQuality }) {
  return (
    <span
      class={`call-chip quality ${props.level}`}
      role="status"
      title={t(`call.quality.${props.level}`)}
      aria-label={`${t("call.quality.label")}: ${t(`call.quality.${props.level}`)}`}
    >
      <Icon name={QUALITY_ICON[props.level]} class="text-[14px]" />
    </span>
  );
}

const TONES = ["ember", "plum", "slate", "wine", "umber"] as const;
export const [revealedTile, setRevealedTile] = createSignal<HTMLElement | null>(null);
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" && revealedTile() && !revealedTile()!.contains(event.target as Node)) setRevealedTile(null);
  });
}
export type SeatTone = (typeof TONES)[number];

/** The same account always gets the same colour, on every screen and for every viewer. */
export function seatTone(accountId: string): SeatTone {
  let h = 0;
  for (let i = 0; i < accountId.length; i++) h = (h * 31 + accountId.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length] ?? "ember";
}

/** Attaches a LiveKit track to its own <video> and detaches it when the track or the tile goes away. */
export function TrackVideo(props: { track: Track | null; class?: string; fit?: "cover" | "contain" }) {
  let el: HTMLVideoElement | undefined;
  createEffect(() => {
    const track = props.track;
    const video = el;
    if (!track || !video) return;
    track.attach(video);
    onCleanup(() => {
      track.detach(video);
      video.srcObject = null;
    });
  });
  return <video ref={el} class={`call-video ${props.class ?? ""}`} classList={{ contain: props.fit === "contain" }} autoplay playsinline muted />;
}

export interface TileData {
  id: string;
  name: string;
  /** Account handle, shown under the name where there is room. */
  handle?: string;
  avatar?: string;
  camera: Track | null;
  micOn: boolean;
  listener: boolean;
  deafened: boolean;
  isLocal: boolean;
}

export function Tile(props: {
  person: TileData;
  speaking: boolean;
  /** "stage" and "grid" show the full chip row; "strip" and "mini" are compact. */
  size?: "stage" | "grid" | "strip" | "mini";
  badge?: JSX.Element;
  actions?: JSX.Element;
  onClick?: () => void;
}) {
  const call = useCall();
  let tile: HTMLElement | undefined;
  let touchClick = false;
  const [hovering, setHovering] = createSignal(false);
  const [focusWithin, setFocusWithin] = createSignal(false);
  const visible = () => hovering() || focusWithin() || revealedTile() === tile;
  onCleanup(() => { if (revealedTile() === tile) setRevealedTile(null); });
  const size = () => props.size ?? "grid";
  const initial = () => props.person.name.slice(0, 1).toUpperCase();
  const avatar = useAuthedSrc(() => props.person.avatar);
  /** Each stage/grid tile shows its own LiveKit participant's quality. */
  const quality = () => {
    if (size() !== "stage" && size() !== "grid") return null;
    return call.connectionQualityFor(props.person.id);
  };
  const showVolume = () => !props.person.isLocal && !!props.person.handle && size() !== "mini";
  return (
    <figure
      ref={tile}
      class={`call-tile tone-${seatTone(props.person.id)} size-${size()}`}
      classList={{ "is-speaking": props.speaking, "is-local": props.person.isLocal, "is-clickable": !!props.onClick, "is-info-visible": visible() }}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovering(true); }}
      onPointerLeave={() => setHovering(false)}
      onPointerDown={(event) => { touchClick = event.pointerType === "touch"; }}
      onFocusIn={() => { if (!touchClick) setFocusWithin(true); }}
      onFocusOut={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget && (event.target as Element).closest("button,input,a,label")) return;
        if (touchClick) {
          touchClick = false;
          setRevealedTile(revealedTile() === tile ? null : tile ?? null);
          return;
        }
        props.onClick?.();
      }}
      tabIndex={0}
      data-person={props.person.id}
    >
      <Show
        when={props.person.camera}
        fallback={
          <span class="call-tile-avatar" aria-hidden="true">
            <Show when={avatar()} fallback={initial()}>
              <img src={avatar()} alt="" />
            </Show>
          </span>
        }
      >
        {(track) => <TrackVideo track={track()} />}
      </Show>
      <Show when={!props.person.listener && !props.person.micOn && size() !== "mini"}>
        <span class="call-chip muted">
          <Icon name="mic_off" class="text-[14px]" />
          {t("call.muted")}
        </span>
      </Show>
      <Show when={props.person.isLocal && size() !== "mini"}>
        <span class="call-chip you">{t("call.you")}</span>
      </Show>
      <Show when={quality()}>
        {(level) => <ConnectionQualityGlyph level={level()} />}
      </Show>
      {props.badge}
      <figcaption class="call-tile-caption">
        <span class="call-tile-name">{props.person.name}</span>
        <Show when={props.person.handle && (size() === "stage" || size() === "grid")}>
          <span class="call-tile-handle">@{props.person.handle}</span>
        </Show>
        <span class="call-tile-state">
          <Show when={props.person.listener}>
            <Icon name="hearing" label={t("call.listener")} class="text-[16px]" />
          </Show>
          <Show when={!props.person.listener}>
            <Icon name={props.person.micOn ? "mic" : "mic_off"} label={props.person.micOn ? t("call.micOn") : t("call.micOff")} class={`text-[16px] ${props.person.micOn ? "" : "muted"}`} />
            <Icon name={props.person.camera ? "videocam" : "videocam_off"} label={props.person.camera ? t("call.camState.on") : t("call.camState.off")} class={`text-[16px] ${props.person.camera ? "" : "muted"}`} />
          </Show>
          <Icon name={props.person.deafened ? "headset_off" : "headset_mic"} label={props.person.deafened ? t("call.hearingState.off") : t("call.hearingState.on")} class={`text-[16px] ${props.person.deafened ? "muted" : ""}`} />
        </span>
        <Show when={showVolume()}>
          <ParticipantVolumeControl identity={props.person.id} handle={props.person.handle!} />
        </Show>
        <Show when={props.actions}>
          <span class="call-tile-actions">{props.actions}</span>
        </Show>
      </figcaption>
    </figure>
  );
}

/** Local-only 0–200% slider for one remote participant; persists by handle. */
function ParticipantVolumeControl(props: { identity: string; handle: string }) {
  const call = useCall();
  const [value, setValue] = createSignal(VOLUME_DEFAULT);

  createEffect(() => {
    participantVolumes();
    const next = call.remoteVolume(props.handle);
    setValue(next);
    call.applyStoredRemoteVolume(props.identity, props.handle);
  });

  return (
    <label
      class="call-volume"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Icon name="volume_up" class="text-[14px]" />
      <input
        type="range"
        min={VOLUME_MIN}
        max={VOLUME_MAX}
        step={1}
        value={value()}
        aria-label={t("call.volume.label")}
        onInput={(event) => {
          const next = call.setRemoteVolume(props.identity, props.handle, Number(event.currentTarget.value));
          setValue(next);
        }}
      />
      <span class="call-volume-value">{value()}%</span>
    </label>
  );
}
