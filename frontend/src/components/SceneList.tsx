import { For, Show, createSignal } from "solid-js";
import { api, type Scene, type SceneList } from "../api/client";

type Props = {
  channelId: string;
  scenes: Scene[];
  selectedId: string;
  canManage: boolean;
  canActivate: boolean;
  onSelect: (id: string) => void;
  onChanged: (list: SceneList) => void;
  onEdit?: () => void;
};

export default function SceneList(props: Props) {
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");

  async function createCopy() {
    setError("");
    const n = name().trim();
    if (!n) {
      setError("Dê um nome à cena.");
      return;
    }
    try {
      await api(`/api/channels/${props.channelId}/scenes`, {
        method: "POST",
        body: JSON.stringify({ name: n }),
      });
      setName("");
      props.onChanged(await api<SceneList>(`/api/channels/${props.channelId}/scenes`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function duplicate(id: string) {
    setError("");
    const n = name().trim();
    if (!n) {
      setError("Dê um nome à duplicata.");
      return;
    }
    try {
      await api(`/api/channels/${props.channelId}/scenes/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({ name: n }),
      });
      setName("");
      props.onChanged(await api<SceneList>(`/api/channels/${props.channelId}/scenes`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function activate(id: string) {
    setError("");
    try {
      await api(`/api/channels/${props.channelId}/scenes/${id}/activate`, { method: "POST" });
      props.onChanged(await api<SceneList>(`/api/channels/${props.channelId}/scenes`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await api(`/api/channels/${props.channelId}/scenes/${id}`, { method: "DELETE" });
      props.onChanged(await api<SceneList>(`/api/channels/${props.channelId}/scenes`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section class="scene-panel">
      <h3>Cenas</h3>
      <For each={props.scenes}>
        {(scene) => (
          <div class="row" style={{ "margin-bottom": "6px" }}>
            <button
              type="button"
              class={`btn ${scene.id === props.selectedId ? "btn-primary" : "btn-secondary"}`}
              onClick={() => props.onSelect(scene.id)}
            >
              {scene.name}
              {scene.is_active ? " · activa" : ""}
            </button>
            <Show when={props.canActivate && !scene.is_active}>
              <button type="button" class="btn btn-ghost" onClick={() => void activate(scene.id)}>
                Activar
              </button>
            </Show>
            <Show when={props.canManage}>
              <button type="button" class="btn btn-ghost" onClick={() => void duplicate(scene.id)}>
                Duplicar
              </button>
              <Show when={!scene.is_active}>
                <button type="button" class="btn btn-ghost" onClick={() => void remove(scene.id)}>
                  Apagar
                </button>
              </Show>
            </Show>
          </div>
        )}
      </For>
      <Show when={props.canManage}>
        <div class="row" style={{ "margin-top": "10px" }}>
          <input
            class="input"
            style={{ flex: "1", "min-width": "140px" }}
            placeholder="Nome da cena nova"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <button type="button" class="btn btn-secondary" onClick={() => void createCopy()}>
            Copiar quadro
          </button>
          <Show when={props.onEdit}>
            <button type="button" class="btn btn-primary" onClick={() => props.onEdit?.()}>
              Editar cena
            </button>
          </Show>
        </div>
      </Show>
      <p class="error">{error()}</p>
    </section>
  );
}
