import {
  For,
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
} from "solid-js";
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  OPEN_ROLE_CAPABILITIES,
  api,
  createServerRole,
  deleteServer,
  deleteServerImage,
  deleteServerRole,
  fetchServerRoles,
  fetchServerWelcome,
  kickServerMember,
  patchServerRole,
  patchServerWelcome,
  putRolePositions,
  putServerImage,
  serverImageUrl,
  setMemberRole,
  type Channel,
  type RoleCapabilities,
  type Server,
  type ServerMember,
  type ServerRole,
} from "../api/client";
import { Avatar, Button, Dialog, Switch, TextField } from "../components/ui";
import { t } from "../i18n";
import { errorText } from "../lib/errors";

export type SettingsSection = "overview" | "members" | "roles";

const CAP_GROUPS: { key: string; caps: (keyof RoleCapabilities)[] }[] = [
  {
    key: "general",
    caps: [
      "can_view_channels",
      "can_manage_channels",
      "can_manage_roles",
      "can_create_invites",
      "can_remove_members",
      "can_mute_members",
    ],
  },
  {
    key: "text",
    caps: ["can_send_messages", "can_delete_messages", "can_attach_files"],
  },
  { key: "voice", caps: ["can_connect_voice", "can_speak_voice"] },
];

const byPositionDesc = (roles: ServerRole[]) =>
  [...roles].sort((a, b) => b.position - a.position);

export function validateServerImage(file: {
  type: string;
  size: number;
}): string | null {
  if (!ALLOWED_AVATAR_TYPES.has(file.type) || file.size > MAX_AVATAR_BYTES)
    return t("admin.settings.imageInvalid");
  return null;
}

export function ServerSettings(props: {
  server: Server;
  meId: string;
  section: SettingsSection;
  onNavigate: (section: SettingsSection) => void;
  onServersChanged: () => void;
  onRolesChanged: () => void;
  onDeleted: () => void;
}) {
  const isOwner = () => props.server.owner_account_id === props.meId;
  const sections: SettingsSection[] = ["overview", "members", "roles"];
  return (
    <section class="settings-page">
      <header class="settings-head">
        <h1>{props.server.name}</h1>
        <nav class="settings-tabs" aria-label={t("admin.settings.title")}>
          <For each={sections}>
            {(section) => (
              <button
                classList={{ active: props.section === section }}
                aria-current={props.section === section ? "page" : undefined}
                onClick={() => props.onNavigate(section)}
              >
                {t(`admin.settings.${section}`)}
              </button>
            )}
          </For>
        </nav>
      </header>
      <Show when={props.section === "overview"}>
        <Overview
          server={props.server}
          isOwner={isOwner()}
          onServersChanged={props.onServersChanged}
          onDeleted={props.onDeleted}
        />
      </Show>
      <Show when={props.section === "members"}>
        <Members server={props.server} onChanged={props.onRolesChanged} />
      </Show>
      <Show when={props.section === "roles"}>
        <Roles server={props.server} onChanged={props.onRolesChanged} />
      </Show>
    </section>
  );
}

function Overview(props: {
  server: Server;
  isOwner: boolean;
  onServersChanged: () => void;
  onDeleted: () => void;
}) {
  const [imageRev, setImageRev] = createSignal(0);
  const [imageError, setImageError] = createSignal("");
  const [channels] = createResource(
    () => props.server.id,
    async (id) =>
      (await api<Channel[]>(`/api/servers/${id}/channels`)).filter(
        (c) => c.type === "text",
      ),
  );
  const [channelId, setChannelId] = createSignal("");
  const [template, setTemplate] = createSignal("");
  const [welcomeBusy, setWelcomeBusy] = createSignal(false);
  const [welcomeMsg, setWelcomeMsg] = createSignal("");
  const [welcomeError, setWelcomeError] = createSignal("");
  const [welcome] = createResource(
    () => props.server.id,
    async (id) => {
      const settings = await fetchServerWelcome(id);
      setChannelId(settings.welcome_channel_id ?? "");
      setTemplate(settings.welcome_message_template ?? "");
      return settings;
    },
  );
  const [deleteOpen, setDeleteOpen] = createSignal(false);
  const [confirmName, setConfirmName] = createSignal("");
  const [deleteError, setDeleteError] = createSignal("");
  const [deleting, setDeleting] = createSignal(false);

  async function uploadImage(file?: File) {
    if (!file) return;
    const problem = validateServerImage(file);
    if (problem) {
      setImageError(problem);
      return;
    }
    setImageError("");
    try {
      await putServerImage(props.server.id, file, file.type);
      setImageRev((v) => v + 1);
      props.onServersChanged();
    } catch (err) {
      setImageError(errorText(err));
    }
  }
  async function removeImage() {
    setImageError("");
    try {
      await deleteServerImage(props.server.id);
      setImageRev((v) => v + 1);
      props.onServersChanged();
    } catch (err) {
      setImageError(errorText(err));
    }
  }
  async function saveWelcome(event: Event) {
    event.preventDefault();
    setWelcomeBusy(true);
    setWelcomeError("");
    setWelcomeMsg("");
    try {
      const trimmed = template().trim();
      await patchServerWelcome(props.server.id, {
        welcome_channel_id: channelId() || null,
        welcome_message_template: trimmed ? trimmed : null,
      });
      setWelcomeMsg(t("admin.settings.welcomeSaved"));
    } catch (err) {
      setWelcomeError(errorText(err));
    } finally {
      setWelcomeBusy(false);
    }
  }
  async function confirmDelete() {
    if (confirmName() !== props.server.name || deleting()) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteServer(props.server.id);
      props.onDeleted();
    } catch (err) {
      setDeleteError(errorText(err));
    } finally {
      setDeleting(false);
    }
  }
  return (
    <div class="settings-body">
      <section class="settings-card">
        <h2>{t("admin.settings.image")}</h2>
        <p class="muted">{t("admin.settings.imageHint")}</p>
        <div class="image-row">
          <Show
            when={props.server.has_image}
            fallback={
              <span class="image-placeholder">
                {props.server.name.slice(0, 2).toUpperCase()}
              </span>
            }
          >
            <img
              class="server-image-preview"
              src={`${serverImageUrl(props.server.id)}?v=${imageRev()}`}
              alt={props.server.name}
            />
          </Show>
          <Show when={props.isOwner}>
            <label class="file-pick">
              <span class="ui-button secondary">
                {t("admin.settings.changeImage")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  void uploadImage(e.currentTarget.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <Show when={props.server.has_image}>
              <Button onClick={() => void removeImage()}>
                {t("admin.settings.removeImage")}
              </Button>
            </Show>
          </Show>
        </div>
        <Show when={imageError()}>
          <p class="form-error" role="alert">
            {imageError()}
          </p>
        </Show>
      </section>
      <section class="settings-card">
        <h2>{t("admin.settings.welcome")}</h2>
        <p class="muted">{t("admin.settings.welcomeHint")}</p>
        <Show
          when={welcome() && channels()}
          fallback={<p class="muted">{t("admin.loading")}</p>}
        >
          <form class="admin-form" onSubmit={(e) => void saveWelcome(e)}>
            <label class="field">
              <span>{t("admin.settings.welcomeChannel")}</span>
              <select
                value={channelId()}
                disabled={!props.isOwner}
                onChange={(e) => setChannelId(e.currentTarget.value)}
              >
                <option value="">{t("admin.settings.welcomeDefault")}</option>
                <For each={channels() ?? []}>
                  {(c) => (
                    <option value={c.id} selected={c.id === channelId()}>
                      #{c.name}
                    </option>
                  )}
                </For>
              </select>
            </label>
            <label class="field">
              <span>{t("admin.settings.welcomeTemplate")}</span>
              <textarea
                class="admin-textarea"
                rows="3"
                disabled={!props.isOwner}
                value={template()}
                onInput={(e) => setTemplate(e.currentTarget.value)}
              />
            </label>
            <Show when={props.isOwner}>
              <div class="dialog-actions">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={welcomeBusy()}
                >
                  {t("admin.save")}
                </Button>
              </div>
            </Show>
            <Show when={welcomeMsg()}>
              <p class="form-ok" role="status">
                {welcomeMsg()}
              </p>
            </Show>
            <Show when={welcomeError()}>
              <p class="form-error" role="alert">
                {welcomeError()}
              </p>
            </Show>
          </form>
        </Show>
      </section>
      <Show when={props.isOwner}>
        <section class="settings-card danger-zone">
          <h2>{t("admin.settings.delete")}</h2>
          <p class="muted">{t("admin.settings.deleteHint")}</p>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmName("");
              setDeleteError("");
              setDeleteOpen(true);
            }}
          >
            {t("admin.settings.deleteAction")}
          </Button>
        </section>
      </Show>
      <Dialog
        open={deleteOpen()}
        title={t("admin.settings.delete")}
        onClose={() => setDeleteOpen(false)}
      >
        <div class="admin-form">
          <p>
            {t("admin.settings.deleteConfirm", { name: props.server.name })}
          </p>
          <TextField
            label={t("admin.name")}
            value={confirmName()}
            onInput={(e) => setConfirmName(e.currentTarget.value)}
          />
          <Show when={deleteError()}>
            <p class="form-error" role="alert">
              {deleteError()}
            </p>
          </Show>
          <div class="dialog-actions">
            <Button onClick={() => setDeleteOpen(false)}>
              {t("admin.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={confirmName() !== props.server.name || deleting()}
              onClick={() => void confirmDelete()}
            >
              {t("admin.settings.deleteFinal")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function Members(props: { server: Server; onChanged: () => void }) {
  const [query, setQuery] = createSignal("");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal<string | null>(null);
  const [removing, setRemoving] = createSignal<ServerMember | null>(null);
  const [members, { refetch: refetchMembers }] = createResource(
    () => props.server.id,
    (id) => api<ServerMember[]>(`/api/servers/${id}/members`),
  );
  const [roles, { refetch: refetchRoles }] = createResource(
    () => props.server.id,
    fetchServerRoles,
  );
  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    const list = members() ?? [];
    return q
      ? list.filter((m) =>
          `${m.handle} ${m.display_name ?? ""}`.toLowerCase().includes(q),
        )
      : list;
  });
  const roleOf = (accountId: string) =>
    (roles() ?? []).find(
      (r) => !r.is_system && r.member_ids.includes(accountId),
    )?.id ?? "";
  async function changeRole(member: ServerMember, roleId: string) {
    setBusy(member.account_id);
    setError("");
    try {
      await setMemberRole(props.server.id, member.account_id, roleId || null);
      await refetchRoles();
      props.onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }
  async function confirmRemove() {
    const member = removing();
    if (!member) return;
    try {
      await kickServerMember(props.server.id, member.account_id);
      setRemoving(null);
      await refetchMembers();
    } catch (err) {
      setError(errorText(err));
      setRemoving(null);
    }
  }
  return (
    <div class="settings-body">
      <input
        class="admin-search"
        type="search"
        placeholder={t("admin.members.search")}
        aria-label={t("admin.members.search")}
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
      />
      <Show when={error()}>
        <p class="form-error" role="alert">
          {error()}
        </p>
      </Show>
      <ul class="member-list">
        <For
          each={filtered()}
          fallback={<li class="muted">{t("admin.members.none")}</li>}
        >
          {(member) => {
            const owner = () =>
              member.account_id === props.server.owner_account_id;
            const label = () => member.display_name || member.handle;
            return (
              <li class="member-row" data-owner={owner() ? "true" : undefined}>
                <Avatar
                  name={label()}
                  src={
                    member.has_avatar
                      ? `/api/accounts/${member.account_id}/avatar`
                      : undefined
                  }
                />
                <span class="member-name">
                  <strong>{label()}</strong>
                  <small>@{member.handle}</small>
                </span>
                <Show
                  when={owner()}
                  fallback={
                    <>
                      <select
                        class="member-role"
                        aria-label={t("admin.members.roleOf", {
                          name: label(),
                        })}
                        disabled={busy() === member.account_id}
                        value={roleOf(member.account_id)}
                        onChange={(e) =>
                          void changeRole(member, e.currentTarget.value)
                        }
                      >
                        <option value="">{t("admin.members.noRole")}</option>
                        <For each={(roles() ?? []).filter((r) => !r.is_system)}>
                          {(r) => (
                            <option
                              value={r.id}
                              selected={r.id === roleOf(member.account_id)}
                            >
                              {r.name}
                            </option>
                          )}
                        </For>
                      </select>
                      <Button onClick={() => setRemoving(member)}>
                        {t("admin.members.remove")}
                      </Button>
                    </>
                  }
                >
                  <span class="member-owner">{t("admin.members.owner")}</span>
                </Show>
              </li>
            );
          }}
        </For>
      </ul>
      <Dialog
        open={!!removing()}
        title={t("admin.members.remove")}
        onClose={() => setRemoving(null)}
      >
        <div class="admin-form">
          <p>
            {t("admin.members.removeConfirm", {
              name: removing()?.handle ?? "",
            })}
          </p>
          <div class="dialog-actions">
            <Button onClick={() => setRemoving(null)}>
              {t("admin.cancel")}
            </Button>
            <Button variant="danger" onClick={() => void confirmRemove()}>
              {t("admin.members.remove")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function Roles(props: { server: Server; onChanged: () => void }) {
  const [roles, setRoles] = createSignal<ServerRole[]>([]);
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal<RoleCapabilities>({
    ...OPEN_ROLE_CAPABILITIES,
  });
  const [dirty, setDirty] = createSignal(false);
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [deleting, setDeleting] = createSignal<ServerRole | null>(null);
  const sorted = createMemo(() => byPositionDesc(roles()));
  const selected = createMemo(
    () => roles().find((r) => r.id === selectedId()) ?? null,
  );

  async function load() {
    try {
      const list = byPositionDesc(await fetchServerRoles(props.server.id));
      setRoles(list);
      if (!selectedId() || !list.some((r) => r.id === selectedId()))
        select(list[0] ?? null, list);
    } catch (err) {
      setError(errorText(err));
    }
  }
  function select(role: ServerRole | null, list = roles()) {
    const target = role ? (list.find((r) => r.id === role.id) ?? role) : null;
    setSelectedId(target?.id ?? null);
    setDraft({ ...OPEN_ROLE_CAPABILITIES, ...(target?.capabilities ?? {}) });
    setDirty(false);
  }
  createEffect(() => {
    void props.server.id;
    void load();
  });
  async function create(event: Event) {
    event.preventDefault();
    const trimmed = name().trim();
    if (!trimmed || busy()) return;
    setBusy(true);
    setError("");
    try {
      const role = await createServerRole(props.server.id, {
        name: trimmed,
        capabilities: { ...OPEN_ROLE_CAPABILITIES },
      });
      const list = byPositionDesc([...roles(), role]);
      setRoles(list);
      setName("");
      select(role, list);
      props.onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  function canMove(role: ServerRole, dir: "up" | "down") {
    if (role.is_system || busy()) return false;
    const list = sorted();
    const idx = list.findIndex((r) => r.id === role.id);
    const other = list[dir === "up" ? idx - 1 : idx + 1];
    return !!other && !other.is_system;
  }
  async function move(role: ServerRole, dir: "up" | "down") {
    if (!canMove(role, dir)) return;
    const list = sorted();
    const idx = list.findIndex((r) => r.id === role.id);
    const other = list[dir === "up" ? idx - 1 : idx + 1]!;
    setBusy(true);
    setError("");
    try {
      const updated = await putRolePositions(props.server.id, [
        { id: role.id, position: other.position },
        { id: other.id, position: role.position },
      ]);
      setRoles(byPositionDesc(updated));
      props.onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function confirmDelete() {
    const role = deleting();
    if (!role) return;
    try {
      await deleteServerRole(props.server.id, role.id);
      const list = roles().filter((r) => r.id !== role.id);
      setRoles(list);
      if (selectedId() === role.id) select(list[0] ?? null, list);
      props.onChanged();
    } catch (err) {
      setError(errorText(err));
    }
    setDeleting(null);
  }
  function toggle(key: keyof RoleCapabilities, value: boolean) {
    if (selected()?.is_system) return;
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }
  async function save() {
    const role = selected();
    if (!role || role.is_system || busy()) return;
    setBusy(true);
    setError("");
    try {
      const caps = draft();
      const updated = await patchServerRole(props.server.id, role.id, {
        capabilities: caps,
        can_create_channels: caps.can_manage_channels,
      });
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDirty(false);
      props.onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  const roleLabel = (role: ServerRole) =>
    role.is_system && /^(dono|owner)$/i.test(role.name)
      ? t("admin.members.owner")
      : role.name;
  return (
    <div class="settings-body roles-layout">
      <div class="roles-list">
        <form class="role-create" onSubmit={(e) => void create(e)}>
          <input
            aria-label={t("admin.roles.name")}
            placeholder={t("admin.roles.newRole")}
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <Button
            variant="primary"
            type="submit"
            disabled={!name().trim() || busy()}
          >
            {t("admin.create")}
          </Button>
        </form>
        <ul>
          <For
            each={sorted()}
            fallback={<li class="muted">{t("admin.roles.none")}</li>}
          >
            {(role) => (
              <li classList={{ active: selectedId() === role.id }}>
                <button class="role-name" onClick={() => select(role)}>
                  {roleLabel(role)}
                </button>
                <Show when={!role.is_system}>
                  <button
                    aria-label={t("admin.roles.moveUp", { name: role.name })}
                    disabled={!canMove(role, "up")}
                    onClick={() => void move(role, "up")}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={t("admin.roles.moveDown", { name: role.name })}
                    disabled={!canMove(role, "down")}
                    onClick={() => void move(role, "down")}
                  >
                    ↓
                  </button>
                  <button
                    aria-label={t("admin.roles.delete", { name: role.name })}
                    onClick={() => setDeleting(role)}
                  >
                    🗑
                  </button>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </div>
      <div class="roles-detail">
        <Show
          when={selected()}
          fallback={<p class="muted">{t("admin.roles.select")}</p>}
        >
          {(role) => (
            <>
              <h2>{roleLabel(role())}</h2>
              <Show when={role().is_system}>
                <p class="muted">{t("admin.roles.systemReadonly")}</p>
              </Show>
              <For each={CAP_GROUPS}>
                {(group) => (
                  <fieldset class="admin-fieldset">
                    <legend>{t(`admin.roles.group.${group.key}`)}</legend>
                    <For each={group.caps}>
                      {(cap) => (
                        <div class="cap-row">
                          <div>
                            <strong>{t(`admin.caps.${cap}`)}</strong>
                            <p class="muted">{t(`admin.caps.${cap}Hint`)}</p>
                          </div>
                          <Switch
                            label={t(`admin.caps.${cap}`)}
                            checked={draft()[cap]}
                            disabled={!!role().is_system}
                            onChange={(e) =>
                              toggle(cap, e.currentTarget.checked)
                            }
                          />
                        </div>
                      )}
                    </For>
                  </fieldset>
                )}
              </For>
              <Show when={!role().is_system}>
                <div class="dialog-actions">
                  <Button
                    variant="primary"
                    disabled={!dirty() || busy()}
                    onClick={() => void save()}
                  >
                    {t("admin.save")}
                  </Button>
                </div>
              </Show>
            </>
          )}
        </Show>
        <Show when={error()}>
          <p class="form-error" role="alert">
            {error()}
          </p>
        </Show>
      </div>
      <Dialog
        open={!!deleting()}
        title={t("admin.roles.deleteTitle")}
        onClose={() => setDeleting(null)}
      >
        <div class="admin-form">
          <p>
            {(deleting()?.member_ids.length ?? 0) > 0
              ? t("admin.roles.deleteWarn", {
                  name: deleting()?.name ?? "",
                  n: deleting()?.member_ids.length ?? 0,
                })
              : t("admin.roles.deleteConfirm", {
                  name: deleting()?.name ?? "",
                })}
          </p>
          <div class="dialog-actions">
            <Button onClick={() => setDeleting(null)}>
              {t("admin.cancel")}
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              {t("admin.roles.deleteAction")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
