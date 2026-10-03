import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { PageHead } from "./PageHead";
import { useShell } from "../../shell/state";
import { createToast } from "../../lib/toast";
import { errorText } from "../../lib/errors";
import { publicDisplayLabel } from "../../lib/displayName";
import { t } from "../../i18n";
import { Button, Icon, Toast } from "../../components/ui";
import { roles as rolesApi, avatarUrl, type RoleCapabilities, type Server, type ServerRole } from "../../api";

type Capability = keyof RoleCapabilities;

const GROUPS: { id: string; title: string; icon: string; keys: Capability[] }[] = [
  { id: "general", title: "mgmt.roles.groupGeneral", icon: "hub", keys: ["can_view_channels", "can_manage_channels", "can_manage_roles", "can_create_invites", "can_remove_members", "can_mute_members"] },
  { id: "text", title: "mgmt.roles.groupText", icon: "chat", keys: ["can_send_messages", "can_delete_messages", "can_attach_files", "can_mention_everyone"] },
  { id: "voice", title: "mgmt.roles.groupVoice", icon: "mic", keys: ["can_connect_voice", "can_speak_voice"] },
];

const sameCapabilities = (a: RoleCapabilities, b: RoleCapabilities) => (Object.keys(a) as Capability[]).every((key) => a[key] === b[key]);

function PermissionRow(props: { capability: Capability; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label class="switch mg-perm" classList={{ locked: props.disabled }}>
      <input type="checkbox" role="switch" checked={props.checked} disabled={props.disabled} onChange={(event) => props.onChange(event.currentTarget.checked)} />
      <span class="switch-track" aria-hidden="true" />
      <span class="mg-perm-text">
        <strong>{t(`mgmt.roles.${props.capability}`)}</strong>
        <small>{t(`mgmt.roles.${props.capability}_text`)}</small>
      </span>
    </label>
  );
}

// Roles master-detail: ordered list on the left, the selected role's permissions on the right,
// edited in place and saved from a bar that appears while there are unsaved changes.
export function Roles(props: { server: Server }) {
  const shell = useShell();
  const toast = createToast();
  const [selectedId, setSelectedId] = createSignal("");
  const [draft, setDraft] = createSignal<RoleCapabilities | null>(null);
  const [newName, setNewName] = createSignal("");
  const [confirmingDelete, setConfirmingDelete] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  const all = () => shell.roles.data ?? [];
  const editable = createMemo(() => all().filter((r) => !r.is_system).sort((a, b) => b.position - a.position));
  const system = () => all().filter((r) => r.is_system);
  const selected = () => all().find((r) => r.id === selectedId());
  const canManage = () => shell.can("can_manage_roles");
  const members = () => shell.members.data ?? [];

  // Select the first editable role once data arrives, and drop a selection that no longer exists.
  createEffect(() => {
    if (!all().length) return;
    if (!selected()) setSelectedId(editable()[0]?.id ?? system()[0]?.id ?? "");
  });
  // The draft restarts from the saved capabilities whenever the selection or the saved role changes.
  createEffect(() => {
    const role = selected();
    setDraft(role ? { ...role.capabilities } : null);
    setConfirmingDelete(false);
  });

  const dirty = () => {
    const role = selected();
    const current = draft();
    return !!role && !!current && !sameCapabilities(role.capabilities, current);
  };
  const readOnly = () => !canManage() || !!selected()?.is_system;
  const enabledIn = (keys: Capability[]) => keys.filter((key) => draft()?.[key]).length;

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      await action();
      await shell.refreshRoles();
      if (success) toast.flash(success);
    } catch (failure) {
      toast.flash(errorText(failure, "mgmt.roles.failed"));
    } finally {
      setBusy(false);
    }
  }

  const create = async (event: Event) => {
    event.preventDefault();
    const name = newName().trim();
    if (!name) return;
    await run(async () => {
      const created = await rolesApi.create(props.server.id, name);
      setNewName("");
      setSelectedId(created.id);
    });
  };

  const move = (role: ServerRole, direction: -1 | 1) => {
    const list = editable();
    const at = list.findIndex((r) => r.id === role.id);
    const other = list[at + direction];
    if (!other) return;
    // Swap the two positions; the request lists every editable role with its final position.
    const next = list.map((r) => ({ id: r.id, position: r.id === role.id ? other.position : r.id === other.id ? role.position : r.position }));
    void run(() => rolesApi.reorder(props.server.id, next));
  };

  const save = () => {
    const role = selected();
    const capabilities = draft();
    if (role && capabilities) void run(() => rolesApi.update(props.server.id, role.id, { capabilities }), t("mgmt.roles.saved"));
  };

  const remove = () => {
    const role = selected();
    if (!role) return;
    setSelectedId("");
    void run(() => rolesApi.remove(props.server.id, role.id));
  };

  const toggleMember = (role: ServerRole, accountId: string, present: boolean) => {
    const ids = present ? role.member_ids.filter((id) => id !== accountId) : [...role.member_ids, accountId];
    void run(() => rolesApi.setMembers(props.server.id, role.id, ids));
  };

  /** The "add member" picker acts as a button: choosing an entry adds it and the picker returns to its prompt. */
  const addFromPicker = (role: ServerRole, picker: HTMLSelectElement) => {
    const accountId = picker.value;
    picker.value = "";
    if (accountId) toggleMember(role, accountId, false);
  };

  const roleMembers = () => members().filter((m) => selected()?.member_ids.includes(m.account_id));
  const candidates = () => members().filter((m) => !selected()?.member_ids.includes(m.account_id) && m.account_id !== props.server.owner_account_id);
  const countLabel = (role: ServerRole) => (role.member_ids.length === 1 ? t("mgmt.roles.membersOne") : t("mgmt.roles.members", { count: role.member_ids.length }));

  return (
    <div class="mg-page">
      <PageHead crumb={`${t("mgmt.roles.eyebrow").toUpperCase()} · ${t("mgmt.roles.crumb")}`} title={t("mgmt.roles.title")} />

      <Show when={dirty()}>
        <div class="mg-unsaved" role="status">
          <Icon name="edit_note" />
          <div>
            <strong>{t("mgmt.roles.unsavedTitle")}</strong>
            <span>{t("mgmt.roles.unsavedText", { role: selected()?.name ?? "" })}</span>
            <div class="mg-row">
              <Button onClick={() => setDraft(selected() ? { ...selected()!.capabilities } : null)}>{t("mgmt.roles.discard")}</Button>
              <Button variant="primary" onClick={save} disabled={busy()}><Icon name="save" />{t("mgmt.roles.save")}</Button>
            </div>
          </div>
        </div>
      </Show>

      <div class="mg-roles-layout">
        <div class="mg-stack">
          <Show when={canManage()}>
            <form class="mg-card compact" onSubmit={create}>
              <span class="mg-label">{t("mgmt.roles.newTitle")}</span>
              <div class="mg-add-role">
                <label><Icon name="badge" /><input value={newName()} placeholder={t("mgmt.roles.newPlaceholder")} maxLength={32} onInput={(event) => setNewName(event.currentTarget.value)} /></label>
                <button type="submit" class="mg-icon-button filled" title={t("mgmt.roles.newAdd")} aria-label={t("mgmt.roles.newAdd")} disabled={!newName().trim() || busy()}><Icon name="add" /></button>
              </div>
            </form>
          </Show>

          <section class="mg-card compact">
            <span class="mg-label">{t("mgmt.roles.listTitle")}<output>{t("mgmt.roles.active", { count: all().length })}</output></span>
            <ul class="mg-role-list">
              <For each={editable()}>
                {(role, index) => (
                  <li classList={{ active: role.id === selectedId() }}>
                    <button type="button" class="mg-role-pick" onClick={() => setSelectedId(role.id)}>
                      <strong>{role.name}</strong>
                      <small>{countLabel(role)}</small>
                    </button>
                    <Show when={canManage()}>
                      <span class="mg-role-tools">
                        <button type="button" title={t("mgmt.roles.up")} aria-label={t("mgmt.roles.up")} disabled={index() === 0 || busy()} onClick={() => move(role, -1)}><Icon name="arrow_upward" /></button>
                        <button type="button" title={t("mgmt.roles.down")} aria-label={t("mgmt.roles.down")} disabled={index() === editable().length - 1 || busy()} onClick={() => move(role, 1)}><Icon name="arrow_downward" /></button>
                      </span>
                    </Show>
                  </li>
                )}
              </For>
              <For each={system()}>
                {(role) => (
                  <li class="system" classList={{ active: role.id === selectedId() }}>
                    <button type="button" class="mg-role-pick" onClick={() => setSelectedId(role.id)}>
                      <strong>{role.name}</strong>
                      <small>{t("mgmt.roles.system")}</small>
                    </button>
                    <Icon name="lock" />
                  </li>
                )}
              </For>
            </ul>
            <p class="mg-note-box"><Icon name="info" />{t("mgmt.roles.inherit")}</p>
          </section>

          <Show when={selected()}>
            {(role) => (
              <section class="mg-card compact">
                <span class="mg-label">{t("mgmt.roles.matrixTitle")}<output>{t("mgmt.roles.matrixCount", { count: roleMembers().length, total: members().length })}</output></span>
                <ul class="mg-matrix">
                  <For each={roleMembers()} fallback={<li class="mg-muted">{t("mgmt.roles.matrixEmpty")}</li>}>
                    {(member) => (
                      <li>
                        <span class="mg-mini-avatar">
                          <Show when={member.has_avatar} fallback={publicDisplayLabel(member.handle, member.display_name).slice(0, 1).toUpperCase()}><img src={avatarUrl(member.account_id)} alt="" /></Show>
                        </span>
                        <span>{publicDisplayLabel(member.handle, member.display_name)}</span>
                        <Show when={canManage() && !role().is_system}>
                          <button type="button" title={t("mgmt.roles.matrixRemove", { name: member.handle })} aria-label={t("mgmt.roles.matrixRemove", { name: member.handle })} onClick={() => toggleMember(role(), member.account_id, true)}><Icon name="close" /></button>
                        </Show>
                      </li>
                    )}
                  </For>
                </ul>
                <Show when={canManage() && !role().is_system && candidates().length > 0}>
                  <select aria-label={t("mgmt.roles.matrixAdd")} value="" onChange={(event) => addFromPicker(role(), event.currentTarget)}>
                    <option value="">{t("mgmt.roles.matrixAdd")}</option>
                    <For each={candidates()}>{(member) => <option value={member.account_id}>{publicDisplayLabel(member.handle, member.display_name)}</option>}</For>
                  </select>
                </Show>
              </section>
            )}
          </Show>
        </div>
        {/* detail pane */}

        <Show when={selected()}>
          {(role) => (
            <div class="mg-stack" data-pane="role-detail">
              <section class="mg-card" data-part="head">
                <div class="mg-role-head">
                  <span class="mg-role-icon"><Icon name={role().is_system ? "shield_person" : "badge"} /></span>
                  <div>
                    <h2>{role().name}</h2>
                    <p class="mg-muted">{role().is_system ? t("mgmt.roles.systemBase") : countLabel(role())}</p>
                  </div>
                </div>
                <div class="mg-custody-note">
                  <Icon name="lock" />
                  <div><strong>{t("mgmt.roles.custodyTitle")}</strong><p>{role().is_system ? t("mgmt.roles.systemNotice") : t("mgmt.roles.custodyText")}</p></div>
                </div>
              </section>

              <For each={GROUPS}>
                {(group) => (
                  <section class="mg-card">
                    <header class="mg-group-head">
                      <Icon name={group.icon} /><h2>{t(group.title)}</h2>
                      <output>{t("mgmt.roles.enabled", { count: enabledIn(group.keys) })}</output>
                    </header>
                    <For each={group.keys}>
                      {(key) => (
                        <PermissionRow capability={key} checked={!!draft()?.[key]} disabled={readOnly()} onChange={(checked) => setDraft((now) => (now ? { ...now, [key]: checked } : now))} />
                      )}
                    </For>
                  </section>
                )}
              </For>

              <Show when={!role().is_system && canManage()}>
                <section class="mg-card danger-row">
                  <span class="mg-danger-icon"><Icon name="delete" /></span>
                  <div class="mg-danger-text">
                    <strong>{t("mgmt.roles.deleteTitle")}</strong>
                    <p>{role().member_ids.length ? t("mgmt.roles.deleteText", { count: role().member_ids.length }) : t("mgmt.roles.deleteTextNone")}</p>
                    <Show when={confirmingDelete()}>
                      <p class="mg-warning" role="alert">{role().member_ids.length ? t("mgmt.roles.deleteConfirm", { count: role().member_ids.length }) : t("mgmt.roles.deleteConfirmNone", { role: role().name })}</p>
                    </Show>
                  </div>
                  <Show when={!confirmingDelete()} fallback={
                    <div class="mg-row">
                      <Button onClick={() => setConfirmingDelete(false)}>{t("mgmt.cancel")}</Button>
                      <Button variant="danger" onClick={remove} disabled={busy()}>{t("mgmt.roles.deleteYes")}</Button>
                    </div>
                  }>
                    <Button onClick={() => setConfirmingDelete(true)}><Icon name="delete" />{t("mgmt.roles.deleteButton")}</Button>
                  </Show>
                </section>
              </Show>
            </div>
          )}
        </Show>
      </div>
      <Toast show={!!toast.message()} message={toast.message()} />
    </div>
  );
}
