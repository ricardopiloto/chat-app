import { Index, Show } from "solid-js";
import type { GridLayout } from "../api/client";

type Props = {
  grid: GridLayout;
  handles: Record<string, string>;
  attachSlot: (index: number, el: HTMLDivElement) => void;
};

export default function CameraGrid(props: Props) {
  const cols = () => (props.grid.slot_count <= 2 ? 2 : 2);
  const rows = () => (props.grid.slot_count <= 2 ? 1 : 2);
  return (
    <div
      class="grid"
      style={{
        "grid-template-columns": `repeat(${cols()}, minmax(0, 1fr))`,
        "grid-template-rows": `repeat(${rows()}, minmax(0, 1fr))`,
      }}
    >
      <Index each={props.grid.slots}>
        {(slot) => (
          <div class="slot">
            <div class="label">
              <Show when={slot().account_id} fallback={`Slot ${slot().index + 1} (vazio)`}>
                {(id) => props.handles[id()] ?? id()}
              </Show>
            </div>
            <div class="slot-media" ref={(el) => props.attachSlot(slot().index, el)} />
          </div>
        )}
      </Index>
    </div>
  );
}
