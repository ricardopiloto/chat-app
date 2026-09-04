import { For, Show, createResource } from "solid-js";
import { api, type ServerMember } from "../api/client";

type Props = {
  serverId: string | null;
};

function closeMembersPanel() {
  window.dispatchEvent(new CustomEvent("mesa:members-panel", { detail: { open: false } }));
}

export default function MembersPanel(props: Props) {
  const [members] = createResource(
    () => props.serverId,
    (id) =>
      id
        ? api<ServerMember[]>(`/api/servers/${id}/members`)
        : Promise.resolve([] as ServerMember[]),
  );

  return (
    <aside class="members-panel" aria-label="Membros">
      <div class="members-panel-header">
        <h2 class="members-panel-title">Membros</h2>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          aria-label="Fechar membros"
          onClick={() => closeMembersPanel()}
        >
          ×
        </button>
      </div>
      <Show when={!props.serverId}>
        <p class="members-panel-status">Sem servidor seleccionado</p>
      </Show>
      <Show when={props.serverId && members.loading}>
        <p class="members-panel-status">A carregar…</p>
      </Show>
      <Show when={props.serverId && members.error}>
        <p class="error members-panel-status">
          {members.error instanceof Error
            ? members.error.message
            : "Não foi possível carregar membros"}
        </p>
      </Show>
      <Show
        when={
          props.serverId &&
          !members.loading &&
          !members.error &&
          (members() ?? []).length === 0
        }
      >
        <p class="members-panel-status">Sem membros</p>
      </Show>
      <ul class="members-list">
        <For each={members() ?? []}>
          {(m) => (
            <li class="members-list-item">
              <span class="members-avatar" aria-hidden="true">
                {m.handle.slice(0, 2).toUpperCase()}
              </span>
              <span class="members-handle">{m.handle}</span>
            </li>
          )}
        </For>
      </ul>
    </aside>
  );
}
