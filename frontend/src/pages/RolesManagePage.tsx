import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import {
  OPEN_ROLE_CAPABILITIES,
  createServerRole,
  deleteServerRole,
  fetchServerRoles,
  putRolePositions,
  type ServerRole,
} from "../api/client";
import { errorMessage } from "../lib/apiError";
import { runPanelAction } from "../lib/panelState";

function sortByPositionDesc(roles: ServerRole[]): ServerRole[] {
  return [...roles].sort((a, b) => b.position - a.position);
}

export default function RolesManagePage() {
  const params = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const [roles, setRoles] = createSignal<ServerRole[]>([]);
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [reorderBusy, setReorderBusy] = createSignal(false);

  const serverId = () => params.serverId!;
  const sortedRoles = createMemo(() => sortByPositionDesc(roles()));

  async function load() {
    setError("");
    try {
      setRoles(sortByPositionDesc(await fetchServerRoles(serverId())));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  createEffect(() => {
    void serverId();
    void load();
  });

  async function createRole(e: Event) {
    e.preventDefault();
    const trimmed = name().trim();
    if (!trimmed || saving()) return;
    await runPanelAction(setError, setSaving, async () => {
      const role = await createServerRole(serverId(), {
        name: trimmed,
        capabilities: { ...OPEN_ROLE_CAPABILITIES },
      });
      setRoles((prev) => sortByPositionDesc([...prev, role]));
      setName("");
      window.dispatchEvent(
        new CustomEvent("mesa:roles-changed", { detail: { serverId: serverId() } }),
      );
    });
  }

  async function removeRole(role: ServerRole) {
    setError("");
    try {
      await deleteServerRole(serverId(), role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      window.dispatchEvent(
        new CustomEvent("mesa:roles-changed", { detail: { serverId: serverId() } }),
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function canReorder(role: ServerRole): boolean {
    return !role.is_system;
  }

  function canMove(role: ServerRole, direction: "up" | "down"): boolean {
    if (!canReorder(role) || reorderBusy()) return false;
    const sorted = sortedRoles();
    const idx = sorted.findIndex((r) => r.id === role.id);
    if (idx < 0) return false;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return false;
    return canReorder(sorted[swapIdx]!);
  }

  async function moveRole(role: ServerRole, direction: "up" | "down") {
    if (!canMove(role, direction)) return;
    const sorted = sortedRoles();
    const idx = sorted.findIndex((r) => r.id === role.id);
    const other = sorted[direction === "up" ? idx - 1 : idx + 1];
    if (!other) return;

    setReorderBusy(true);
    setError("");
    try {
      const updated = await putRolePositions(serverId(), [
        { id: role.id, position: other.position },
        { id: other.id, position: role.position },
      ]);
      setRoles(sortByPositionDesc(updated));
      window.dispatchEvent(
        new CustomEvent("mesa:roles-changed", { detail: { serverId: serverId() } }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReorderBusy(false);
    }
  }

  function openPermissions(role: ServerRole) {
    navigate(`/servers/${serverId()}/settings/roles/${role.id}/permissions`);
  }

  return (
    <div class="roles-manage-page main" role="main">
      <header class="roles-manage-header">
        <h1 class="roles-manage-title">Perfis</h1>
        <p class="muted">
          Crie e configure papéis aqui. Atribua o papel de cada membro em Membros. Papéis mais
          acima têm maior hierarquia.
        </p>
      </header>
      <form class="permission-create-row" onSubmit={(e) => void createRole(e)}>
        <input
          class="input"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="Novo papel"
          aria-label="Nome do papel"
        />
        <button type="submit" class="btn btn-primary" disabled={!name().trim() || saving()}>
          Criar
        </button>
      </form>
      <div class="permission-list">
        <For each={sortedRoles()} fallback={<p class="muted">Ainda não existem papéis.</p>}>
          {(role) => (
            <section class="permission-card">
              <div class="permission-card-title">
                <div class="permission-card-heading">
                  <strong>{role.name}</strong>
                </div>
                <div class="permission-card-actions">
                  <Show when={canReorder(role)}>
                    <button
                      type="button"
                      class="btn btn-ghost"
                      disabled={!canMove(role, "up")}
                      aria-label={`Subir ${role.name}`}
                      onClick={() => void moveRole(role, "up")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost"
                      disabled={!canMove(role, "down")}
                      aria-label={`Descer ${role.name}`}
                      onClick={() => void moveRole(role, "down")}
                    >
                      ↓
                    </button>
                  </Show>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => openPermissions(role)}
                  >
                    Permissões
                  </button>
                  <Show when={!role.is_system}>
                    <button type="button" class="btn btn-ghost" onClick={() => void removeRole(role)}>
                      Apagar
                    </button>
                  </Show>
                </div>
              </div>
            </section>
          )}
        </For>
      </div>
      <Show when={error()}>
        <p class="error" role="alert">
          {error()}
        </p>
      </Show>
    </div>
  );
}
