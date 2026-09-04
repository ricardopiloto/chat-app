import { For, createSignal } from "solid-js";
import { api, type ChannelRole, type ServerMember } from "../api/client";

type Props = {
  channelId: string;
  members: ServerMember[];
  roles: ChannelRole[];
  onChanged: (roles: ChannelRole[]) => void;
};

export default function CoDirectorPanel(props: Props) {
  const [error, setError] = createSignal("");
  const selected = () => new Set(props.roles.map((r) => r.account_id));

  async function save() {
    setError("");
    const boxes = document.querySelectorAll<HTMLInputElement>("input[data-codirector]");
    const account_ids = Array.from(boxes)
      .filter((el) => el.checked)
      .map((el) => el.value);
    try {
      const res = await api<{ roles: ChannelRole[] }>(`/api/channels/${props.channelId}/roles`, {
        method: "PUT",
        body: JSON.stringify({ account_ids }),
      });
      props.onChanged(res.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section>
      <h3>Co-diretores</h3>
      <p class="muted">Podem activar cenas; não editam o mapa nem nomeiam outros.</p>
      <For each={props.members}>
        {(m) => (
          <label class="row" style={{ "margin-bottom": "6px" }}>
            <input
              type="checkbox"
              data-codirector
              value={m.account_id}
              checked={selected().has(m.account_id)}
            />
            {m.handle}
          </label>
        )}
      </For>
      <button type="button" class="btn btn-secondary" onClick={() => void save()}>
        Guardar co-diretores
      </button>
      <p class="error">{error()}</p>
    </section>
  );
}
