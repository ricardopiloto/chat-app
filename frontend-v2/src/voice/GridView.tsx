// "Grade": everyone in the call, then every screen share, with no manual placement. A share can be
// promoted to the main stage (spotlight); the cameras then move to a column on the right.
import { For, Show, createSignal, createMemo } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { useCall } from "./callSession";
import { useCallPeople } from "./people";
import { Tile, TrackVideo } from "./tiles";

export function GridView() {
  const call = useCall();
  const { people, screens } = useCallPeople();
  const [spotlight, setSpotlight] = createSignal<string | null>(null);

  // A spotlight on a share that ended simply stops applying: the grid returns without any action.
  const focused = createMemo(() => screens().find((s) => s.id === spotlight()) ?? null);
  const talkers = () => people().filter((p) => !p.listener);
  const listeners = () => people().filter((p) => p.listener);

  const ScreenTile = (props: { share: ReturnType<typeof screens>[number]; main?: boolean }) => (
    <figure class="call-tile call-screen" classList={{ "is-main": props.main, "is-dimmed": !!focused() && !props.main }}>
      <TrackVideo track={props.share.track} fit="contain" />
      <span class="call-chip screen">
        <Icon name="present_to_all" class="text-[14px]" />
        {t("call.screenTag")}
      </span>
      <figcaption class="call-tile-caption">
        <span class="call-tile-name">{props.share.owner?.name ?? props.share.id}</span>
        <Show when={props.share.owner?.handle}>{(handle) => <span class="call-tile-handle">@{handle()}</span>}</Show>
        <button
          type="button"
          class="call-spotlight"
          aria-pressed={spotlight() === props.share.id}
          title={spotlight() === props.share.id ? t("call.spotlightOff") : t("call.spotlightOn")}
          onClick={() => setSpotlight(spotlight() === props.share.id ? null : props.share.id)}
        >
          <Icon name={spotlight() === props.share.id ? "close_fullscreen" : "open_in_full"} class="text-[18px]" />
          <span>{spotlight() === props.share.id ? t("call.spotlightOff") : t("call.spotlightOn")}</span>
        </button>
      </figcaption>
    </figure>
  );

  return (
    <div class="call-grid-view">
      <Show
        when={focused()}
        fallback={
          <div class="call-grid" style={{ "--cols": String(Math.min(4, Math.max(1, Math.ceil(Math.sqrt(talkers().length + screens().length))))) }}>
            <For each={talkers()}>{(p) => <Tile person={p} size="grid" speaking={call.speaking().has(p.id)} />}</For>
            <For each={screens()}>{(s) => <ScreenTile share={s} />}</For>
          </div>
        }
      >
        {(main) => (
          <div class="call-spotlight-layout">
            <div class="call-spotlight-main">
              <ScreenTile share={main()} main />
              <span class="call-chip live">{t("call.transmitting")}</span>
            </div>
            <div class="call-spotlight-side">
              <For each={talkers()}>{(p) => <Tile person={p} size="strip" speaking={call.speaking().has(p.id)} />}</For>
              <For each={screens().filter((s) => s.id !== main().id)}>{(s) => <ScreenTile share={s} />}</For>
            </div>
          </div>
        )}
      </Show>
      <Show when={listeners().length > 0}>
        <footer class="call-listening">
          <Icon name="hearing" class="text-[18px]" />
          <span class="mono-label">{t("call.listening")}</span>
          <For each={listeners()}>{(p) => <span class="call-listener-pill">{p.name}</span>}</For>
        </footer>
      </Show>
    </div>
  );
}
