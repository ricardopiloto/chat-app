import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import {
  api,
  fetchServerRoles,
  kickServerMember,
  setMemberRole,
  type Server,
  type ServerMember,
} from "../api/client";
import IdentityAvatar from "../components/IdentityAvatar";
import { errorMessage } from "../lib/apiError";

export default function MembersManagePage() {
  const params = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = createSignal("");
  const [error, setError] = createSignal("");
  const [busyId, setBusyId] = createSignal<string | null>(null);

  const serverId = () => params.serverId!;

  const [members, { refetch: refetchMembers }] = createResource(serverId, (id) =>
    api<ServerMember[]>(`/api/servers/${id}/members`),
  );
  const [roles, { refetch: refetchRoles }] = createResource(serverId, (id) =>
    fetchServerRoles(id),
  );
  const [server] = createResource(serverId, async (id) => {
    const list = await api<Server[]>("/api/servers");
    return list.find((s) => s.id === id) ?? null;
  });

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    const list = members() ?? [];
    if (!q) return list;
    return list.filter((m) => m.handle.toLowerCase().includes(q));
  });

  function roleForMember(accountId: string): string {
    const match = (roles() ?? []).find((r) => r.member_ids.includes(accountId));
    return match?.id ?? "";
  }

  async function onRoleChange(member: ServerMember, roleId: string) {
    setBusyId(member.account_id);
    setError("");
    try {
      await setMemberRole(serverId(), member.account_id, roleId || null);
      await refetchRoles();
      window.dispatchEvent(
        new CustomEvent("mesa:roles-changed", { detail: { serverId: serverId() } }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function kick(member: ServerMember) {
    if (!window.confirm(`Remover ${member.handle} do servidor?`)) return;
    setError("");
    try {
      await kickServerMember(serverId(), member.account_id);
      await refetchMembers();
      window.dispatchEvent(new CustomEvent("mesa:servers-refresh"));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function goBack() {
    navigate(`/servers/${serverId()}/settings`);
  }

  return (
    <div class="members-manage-page">
      <header class="members-manage-header">
        <button type="button" class="btn btn-ghost" onClick={() => goBack()}>
          Definições
        </button>
        <div>
          <h1 class="members-manage-title">Gerir membros</h1>
          <p class="muted members-manage-sub">
            {server()?.name ?? "Servidor"} — atribua um papel por membro
          </p>
        </div>
      </header>

      <div class="members-manage-toolbar">
        <input
          class="input"
          type="search"
          placeholder="Pesquisar membro…"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          aria-label="Pesquisar membro"
        />
      </div>

      <Show when={error()}>
        <p class="error" role="alert">
          {error()}
        </p>
      </Show>

      <Show when={members.loading || roles.loading}>
        <p class="muted">A carregar…</p>
      </Show>

      <ul class="members-manage-list">
        <For each={filtered()} fallback={<li class="muted">Sem membros</li>}>
          {(m) => (
            <li class="members-manage-row">
              <IdentityAvatar
                class="members-avatar"
                accountId={m.account_id}
                handle={m.handle}
                hasAvatar={!!m.has_avatar}
              />
              <span class="members-handle">{m.handle}</span>
              <Show
                when={server()?.owner_account_id === m.account_id}
                fallback={
                  <select
                    class="input members-manage-role"
                    aria-label={`Papel de ${m.handle}`}
                    disabled={busyId() === m.account_id}
                    value={roleForMember(m.account_id)}
                    onChange={(e) => void onRoleChange(m, e.currentTarget.value)}
                  >
                    <option value="">Sem papel</option>
                    <For each={(roles() ?? []).filter((r) => !r.is_system)}>
                      {(role) => <option value={role.id}>{role.name}</option>}
                    </For>
                  </select>
                }
              >
                <span class="members-manage-role-locked" title="Papel de sistema">
                  Dono
                </span>
              </Show>
              <Show when={server()?.owner_account_id !== m.account_id}>
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => void kick(m)}
                >
                  Remover
                </button>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
