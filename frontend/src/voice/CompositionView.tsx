// "Composição": people placed in named seats of the channel's single scene, plus the bench for
// whoever holds no seat. The same seat layout is reused, without video, by the scene editor preview.
import { For, Show } from "solid-js";
import { t } from "../i18n";
import { useCall } from "./callSession";
import { useCallPeople } from "./people";
import { bench, type Scene } from "./scene";
import { Tile, seatTone } from "./tiles";

/** CSS hooks for a layout family and seat count; the geometry itself lives in call.css. */
export const layoutClass = (scene: Pick<Scene, "layout" | "seats">) => `layout-${scene.layout} seats-${scene.seats.length}`;

export function CompositionView(props: { scene: Scene }) {
  const call = useCall();
  const { people, byId } = useCallPeople();
  const benched = () => bench(props.scene, people().map((p) => p.id));

  return (
    <div class="call-composition">
      <div class={`call-stage ${layoutClass(props.scene)}`} data-layout={props.scene.layout}>
        <For each={props.scene.seats}>
          {(seat, position) => (
            <div class="call-seat" data-seat={seat.index}>
              <Show when={byId(seat.accountId)} fallback={<span class="call-seat-empty">{seat.index + 1}</span>}>
                {(person) => <Tile person={person()} size={position() === 0 ? "stage" : "grid"} speaking={call.speaking().has(person().id)} />}
              </Show>
            </div>
          )}
        </For>
      </div>
      <footer class="call-bench" aria-label={t("call.bench")}>
        <span class="mono-label">{t("call.bench")}</span>
        <Show when={benched().length > 0} fallback={<span class="call-bench-hint">{t("call.benchEmpty")}</span>}>
          <For each={benched()}>
            {(id) => {
              const person = () => byId(id);
              return (
                <Show when={person()}>
                  {(p) => (
                    <span class={`call-bench-chip tone-${seatTone(p().id)}`} classList={{ "is-speaking": call.speaking().has(p().id) }}>
                      <span class="call-bench-dot">{p().name.slice(0, 1).toUpperCase()}</span>
                      {p().name}
                      <Show when={p().listener}>
                        <span class="call-bench-tag">{t("call.listener")}</span>
                      </Show>
                    </span>
                  )}
                </Show>
              );
            }}
          </For>
        </Show>
      </footer>
    </div>
  );
}
