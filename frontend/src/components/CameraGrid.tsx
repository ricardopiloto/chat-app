import { Index, Show } from "solid-js";
import type { GridLayout } from "../api/client";
import { cellStyle, layoutOf, type LayoutKey } from "./sceneLayouts";

type Props = {
  grid: GridLayout;
  handles: Record<string, string>;
  attachSlot: (index: number, el: HTMLDivElement) => void;
  gradeIdentities?: string[];
  attachGrade?: (identity: string, el: HTMLDivElement) => void;
};

export default function CameraGrid(props: Props) {
  const isGrade = () => (props.gradeIdentities?.length ?? 0) > 0;
  const named = () => layoutOf(props.grid.layout_key);
  const gradeCount = () => props.gradeIdentities?.length ?? 0;
  const gradeCols = () => Math.min(3, Math.max(1, gradeCount()));
  const gradeRows = () => Math.ceil(Math.max(1, gradeCount()) / gradeCols());

  return (
    <Show
      when={isGrade()}
      fallback={
        <div
          class="stage"
          style={{
            "grid-template-columns": named().cols,
            "grid-template-rows": named().rows,
          }}
        >
          <Index each={props.grid.slots}>
            {(slot) => (
              <div
                class="slot"
                style={cellStyle((props.grid.layout_key ?? "quad") as LayoutKey, slot().index)}
              >
                <div class="chip">
                  <Show when={slot().account_id} fallback={`Slot ${slot().index + 1}`}>
                    {(id) => props.handles[id()] ?? id()}
                  </Show>
                </div>
                <div class="slot-media" ref={(el) => props.attachSlot(slot().index, el)} />
              </div>
            )}
          </Index>
        </div>
      }
    >
      <div
        class="stage"
        style={{
          "grid-template-columns": `repeat(${gradeCols()}, minmax(0, 1fr))`,
          "grid-template-rows": `repeat(${gradeRows()}, minmax(0, 1fr))`,
        }}
      >
        <Index each={props.gradeIdentities}>
          {(id) => (
            <div class="slot">
              <div class="chip">{props.handles[id()] ?? id()}</div>
              <div class="slot-media" ref={(el) => props.attachGrade?.(id(), el)} />
            </div>
          )}
        </Index>
      </div>
    </Show>
  );
}
