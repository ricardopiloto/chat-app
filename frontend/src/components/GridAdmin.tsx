import { For, createSignal } from "solid-js";
import { api, type GridLayout } from "../api/client";

type Props = {
  channelId: string;
  grid: GridLayout;
  memberIds: string[];
  handles: Record<string, string>;
  sceneId?: string;
  sceneIsActive?: boolean;
  onSaved: (grid: GridLayout) => void;
  onScenePatched?: () => void;
};

export default function GridAdmin(props: Props) {
  const [count, setCount] = createSignal(props.grid.slot_count);
  const [error, setError] = createSignal("");

  async function save() {
    setError("");
    const slots = Array.from({ length: count() }, (_, index) => {
      const select = document.getElementById(`slot-assign-${index}`) as HTMLSelectElement | null;
      const value = select?.value || "";
      return { index, account_id: value === "" ? null : value };
    });
    const layout = { slot_count: count(), assigned_by: "owner" as const, slots };
    try {
      if (props.sceneId && props.sceneIsActive === false) {
        await api(`/api/channels/${props.channelId}/scenes/${props.sceneId}`, {
          method: "PATCH",
          body: JSON.stringify({ layout }),
        });
        props.onScenePatched?.();
      } else {
        const grid = await api<GridLayout>(`/api/channels/${props.channelId}/grid`, {
          method: "PUT",
          body: JSON.stringify(layout),
        });
        props.onSaved(grid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section>
      <h3>Composição da grade</h3>
      <label>
        Slots
        <select value={count()} onChange={(e) => setCount(Number(e.currentTarget.value))}>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </label>
      <For each={Array.from({ length: count() }, (_, i) => i)}>
        {(index) => (
          <div class="row">
            <span>Slot {index + 1}</span>
            <select id={`slot-assign-${index}`}>
              <option value="">(vazio)</option>
              <For each={props.memberIds}>
                {(id) => (
                  <option
                    value={id}
                    selected={props.grid.slots.find((s) => s.index === index)?.account_id === id}
                  >
                    {props.handles[id] ?? id}
                  </option>
                )}
              </For>
            </select>
          </div>
        )}
      </For>
      <button type="button" onClick={save}>
        Guardar mapa
      </button>
      <p class="error">{error()}</p>
    </section>
  );
}
