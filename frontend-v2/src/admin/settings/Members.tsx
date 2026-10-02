import { For, Show, createMemo, createSignal } from "solid-js";
import { useQueryClient } from "@tanstack/solid-query";
import { PageHead } from "./PageHead";
import { useShell } from "../../shell/state";
import { createToast } from "../../lib/toast";
import { errorText } from "../../lib/errors";
import { publicDisplayLabel } from "../../lib/displayName";
import { t } from "../../i18n";
import { Avatar, Button, Icon, Toast } from "../../components/ui";
import { avatarUrl, queryKeys, servers, type Member, type Server } from "../../api";

const PAGE_SIZE = 8;

function StatCard(props: { label: string; value: number; tone?: "secure" }) {
  return (
    <div class="mg-stat" classList={{ secure: props.tone === "secure" }}>
      <span class="mg-label">{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function MemberRow(props: { member: Member; server: Server; online: boolean }) {
  const shell = useShell();
  const cache = useQueryClient();
  const toast = createToast();
  const [confirming, setConfirming] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  const isOwner = () => props.member.account_id === props.server.owner_account_id;
  const isMe = () => props.member.account_id === shell.meId();
  const name = () => publicDisplayLabel(props.member.handle, props.member.display_name);
  const roles = () => (shell.roles.data ?? []).filter((r) => !r.is_system);
  const current = () => (shell.roles.data ?? []).find((r) => !r.is_system && r.member_ids.includes(props.member.account_id))?.id ?? "";
  const canAssign = () => shell.can("can_manage_roles");
  const canRemove = () => shell.can("can_remove_members") && !isOwner() && !isMe();

  async function assign(roleId: string) {
    try {
      await servers.setMemberRole(props.server.id, props.member.account_id, roleId || null);
      await shell.refreshRoles();
    } catch (failure) {
      toast.flash(errorText(failure, "mgmt.members.roleFailed"));
      await shell.refreshRoles();
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await servers.removeMember(props.server.id, props.member.account_id);
      await Promise.all([cache.invalidateQueries({ queryKey: queryKeys.members(props.server.id) }), shell.refreshRoles()]);
    } catch (failure) {
      toast.flash(errorText(failure, "mgmt.members.removeFailed"));
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li class="mg-member-row" data-member={props.member.handle}>
      <div class="mg-member-id">
        <Avatar name={name()} src={props.member.has_avatar ? avatarUrl(props.member.account_id) : undefined} online={props.online} size="lg" />
        <div>
          <strong>{name()}{isMe() ? <small class="mg-you">{t("mgmt.members.you")}</small> : null}</strong>
          <span class="mg-handle">@{props.member.handle} <i classList={{ on: props.online }}>{props.online ? t("mgmt.members.online_") : t("mgmt.members.offline")}</i></span>
        </div>
      </div>
      <div class="mg-member-role">
        <Show when={!isOwner()} fallback={<span class="mg-owner-chip"><Icon name="lock" />{t("mgmt.members.owner")}</span>}>
          <select aria-label={t("mgmt.members.columnRole")} value={current()} disabled={!canAssign()} onChange={(event) => void assign(event.currentTarget.value)}>
            <option value="" selected={current() === ""}>{t("mgmt.members.noRole")}</option>
            <For each={roles()}>{(role) => <option value={role.id} selected={role.id === current()}>{role.name}</option>}</For>
          </select>
        </Show>
      </div>
      <div class="mg-member-actions">
        <Show when={isOwner()}><span class="mg-badge-line"><Icon name="shield" />{t("mgmt.members.ownerBadge")}</span></Show>
        <Show when={canRemove()}>
          <Show when={!confirming()} fallback={
            <>
              <Button variant="danger" onClick={() => void remove()} disabled={busy()}>{t("mgmt.members.removeConfirm", { name: name() })}</Button>
              <Button onClick={() => setConfirming(false)}>{t("mgmt.cancel")}</Button>
            </>
          }>
            <button type="button" class="mg-remove" onClick={() => setConfirming(true)}><Icon name="person_remove" />{t("mgmt.members.remove")}</button>
          </Show>
        </Show>
      </div>
      <Toast show={!!toast.message()} message={toast.message()} />
    </li>
  );
}

// Member administration: search, filter by role, change role, remove. The owner has no controls.
export function Members(props: { server: Server }) {
  const shell = useShell();
  const [query, setQuery] = createSignal("");
  const [roleFilter, setRoleFilter] = createSignal("");
  const [page, setPage] = createSignal(0);

  const members = () => shell.members.data ?? [];
  const online = () => new Set(shell.presence.data?.online_account_ids ?? []);
  const assignableRoles = () => (shell.roles.data ?? []).filter((r) => !r.is_system);
  const roleOf = (accountId: string) => assignableRoles().find((r) => r.member_ids.includes(accountId))?.id ?? "";
  const applyRoleFilter = (value: string) => {
    setRoleFilter(value);
    setPage(0);
  };

  const filtered = createMemo(() => {
    const needle = query().trim().toLowerCase().replace(/^@/, "");
    return members()
      .filter((m) => !needle || m.handle.toLowerCase().includes(needle) || (m.display_name ?? "").toLowerCase().includes(needle))
      .filter((m) => {
        const filter = roleFilter();
        if (!filter) return true;
        return filter === "none" ? roleOf(m.account_id) === "" : roleOf(m.account_id) === filter;
      })
      .sort((a, b) => Number(b.account_id === props.server.owner_account_id) - Number(a.account_id === props.server.owner_account_id) || a.handle.localeCompare(b.handle));
  });
  const pages = () => Math.max(1, Math.ceil(filtered().length / PAGE_SIZE));
  const visible = () => filtered().slice(Math.min(page(), pages() - 1) * PAGE_SIZE, (Math.min(page(), pages() - 1) + 1) * PAGE_SIZE);
  const from = () => (filtered().length === 0 ? 0 : Math.min(page(), pages() - 1) * PAGE_SIZE + 1);
  const to = () => from() + visible().length - (visible().length ? 1 : 0);

  return (
    <div class="mg-page">
      <PageHead
        crumb={t("mgmt.members.eyebrow").toUpperCase()}
        title={t("mgmt.members.title")}
        lead={t("mgmt.members.lead", { server: props.server.name })}
        aside={
          <div class="mg-stats">
            <StatCard label={t("mgmt.members.total")} value={members().length} />
            <StatCard label={t("mgmt.members.online")} value={members().filter((m) => online().has(m.account_id)).length} tone="secure" />
          </div>
        }
      />

      <div class="mg-toolbar">
        <label class="mg-search">
          <Icon name="search" />
          <input type="search" value={query()} placeholder={t("mgmt.members.search")} onInput={(event) => { setQuery(event.currentTarget.value); setPage(0); }} />
        </label>
        <select aria-label={t("mgmt.members.allRoles")} onChange={(event) => applyRoleFilter(event.currentTarget.value)}>
          <option value="" selected={roleFilter() === ""}>{t("mgmt.members.allRoles")}</option>
          <option value="none" selected={roleFilter() === "none"}>{t("mgmt.members.noRole")}</option>
          <For each={assignableRoles()}>{(role) => <option value={role.id} selected={roleFilter() === role.id}>{role.name}</option>}</For>
        </select>
        <Show when={shell.can("can_create_invites")}>
          <Button variant="primary" onClick={() => document.dispatchEvent(new Event("mesa:invite"))}><Icon name="person_add" />{t("mgmt.members.invite")}</Button>
        </Show>
      </div>

      <p class="mg-listing"><span>{t("mgmt.members.showing")}</span><b>{t("mgmt.members.allMembers", { count: visible().length })}</b></p>

      <section class="mg-table">
        <header>
          <span>{t("mgmt.members.columnIdentity")}</span>
          <span>{t("mgmt.members.columnRole")}</span>
          <span>{t("mgmt.members.columnActions")}</span>
        </header>
        <ul>
          <For each={visible()} fallback={<li class="mg-empty">{t("mgmt.members.empty")}</li>}>
            {(member) => <MemberRow member={member} server={props.server} online={online().has(member.account_id)} />}
          </For>
        </ul>
        <footer>
          <span>{t("mgmt.members.range", { from: from(), to: to(), total: filtered().length })}</span>
          <div class="mg-pager">
            <button type="button" title={t("mgmt.members.prev")} aria-label={t("mgmt.members.prev")} disabled={page() <= 0} onClick={() => setPage((n) => n - 1)}><Icon name="chevron_left" /></button>
            <b>{Math.min(page(), pages() - 1) + 1}</b>
            <button type="button" title={t("mgmt.members.next")} aria-label={t("mgmt.members.next")} disabled={page() >= pages() - 1} onClick={() => setPage((n) => n + 1)}><Icon name="chevron_right" /></button>
          </div>
        </footer>
      </section>

      <aside class="mg-info">
        <span class="mg-info-icon"><Icon name="lock" /></span>
        <div><h3>{t("mgmt.members.e2eeTitle")}</h3><p>{t("mgmt.members.e2eeText")}</p></div>
      </aside>
    </div>
  );
}
