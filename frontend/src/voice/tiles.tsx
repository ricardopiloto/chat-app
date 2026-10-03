// What a person looks like in a call: a video element fed by a track, or an avatar when there is none,
// plus the name and state chips. Every view (stage, grid, strip, floating player) draws people with
// these, so a person looks the same everywhere.
import { Show, createEffect, onCleanup, type JSX } from "solid-js";
import type { Track } from "livekit-client";
import { Icon } from "../components/ui";
import { t } from "../i18n";

const TONES = ["ember", "plum", "slate", "wine", "umber"] as const;
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
  const size = () => props.size ?? "grid";
  const initial = () => props.person.name.slice(0, 1).toUpperCase();
  return (
    <figure
      class={`call-tile tone-${seatTone(props.person.id)} size-${size()}`}
      classList={{ "is-speaking": props.speaking, "is-local": props.person.isLocal, "is-clickable": !!props.onClick }}
      onClick={props.onClick}
      data-person={props.person.id}
    >
      <Show
        when={props.person.camera}
        fallback={
          <span class="call-tile-avatar" aria-hidden="true">
            <Show when={props.person.avatar} fallback={initial()}>
              <img src={props.person.avatar} alt="" />
            </Show>
          </span>
        }
      >
        {(track) => <TrackVideo track={track()} />}
      </Show>
      <Show when={props.speaking}>
        <span class="call-chip speaking" role="status">
          <Icon name="graphic_eq" class="text-[14px]" />
          {t("call.speaking")}
        </span>
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
        </span>
      </figcaption>
      {props.actions}
    </figure>
  );
}
