import { For, Show, createEffect, createMemo, createResource, createSignal, onCleanup } from "solid-js";
import {
  api,
  deleteChannelMute,
  fetchChannelMutes,
  fetchServerPresence,
  fetchServerRoles,
  kickServerMember,
  putChannelMute,
  type ChannelMute,
  type Server,
  type ServerMember,
  type ServerRole,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import IdentityAvatar from "./IdentityAvatar";
import { systemRoleLabel, t } from "../i18n";
import { errorMessage } from "../lib/apiError";
import { memberHasCapability } from "../lib/capabilities";

type Props = {
  serverId: string | null;
  /** Active text/voice channel — enables mute when set. */
  channelId: string | null;
  meId: string;
  onWs?: (handler: (msg: WsEnvelope) => void) => () => void;
  /** Scroll/highlight this member when panel opens (067). */
  focusAccountId?: string | null;
  onFocusConsumed?: () => void;
};

const MUTE_PRESETS = [5, 10, 15, 30] as const;

function closeMembersPanel() {
  window.dispatchEvent(new CustomEvent("mesa:members-panel", { detail: { open: false } }));
}

function formatEndsAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function remainingLabel(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return t("members.expired");
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return t("members.remainingMins", { n: mins });
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0
    ? t("members.remainingHoursMins", { h: hours, m: rem })
    : t("members.remainingHours", { h: hours });
}

type RoleBucket = { key: string; label: string; members: ServerMember[] };

export default function MembersPanel(props: Props) {
  const [onlineIds, setOnlineIds] = createSignal<Set<string>>(new Set());
  const [muteTarget, setMuteTarget] = createSignal<ServerMember | null>(null);
  const [customMinutes, setCustomMinutes] = createSignal("60");
  const [muteError, setMuteError] = createSignal("");
  const [muteBusy, setMuteBusy] = createSignal(false);

  const [members, { refetch }] = createResource(
    () => props.serverId,
    (id) =>
      id
        ? api<ServerMember[]>(`/api/servers/${id}/members`)
        : Promise.resolve([] as ServerMember[]),
  );
  const [roles] = createResource(
    () => props.serverId,
    (id) => (id ? fetchServerRoles(id) : Promise.resolve([] as ServerRole[])),
  );
  const [server] = createResource(
    () => props.serverId,
    async (id) => {
      if (!id) return null;
      const servers = await api<Server[]>("/api/servers");
      return servers.find((item) => item.id === id) ?? null;
    },
  );

  const mutesKey = () =>
    props.channelId && props.serverId ? `${props.channelId}:${props.serverId}` : null;

  const [mutes, { refetch: refetchMutes }] = createResource(mutesKey, async () => {
    const channelId = props.channelId;
    if (!channelId) return [] as ChannelMute[];
    try {
      return await fetchChannelMutes(channelId);
    } catch {
      return [] as ChannelMute[];
    }
  });

  const muteByAccount = createMemo(() => {
    const map = new Map<string, ChannelMute>();
    for (const m of mutes() ?? []) map.set(m.account_id, m);
    return map;
  });

  const canMute = createMemo(() => {
    const s = server();
    if (!s || !props.channelId) return false;
    if (s.owner_account_id === props.meId) return true;
    return memberHasCapability(roles(), props.meId, "can_mute_members");
  });

  async function loadPresence(id: string) {
    try {
      const snap = await fetchServerPresence(id);
      setOnlineIds(new Set<string>(snap.online_account_ids));
    } catch {
      setOnlineIds(new Set<string>());
    }
  }

  createEffect(() => {
    const id = props.serverId;
    if (!id) {
      setOnlineIds(new Set<string>());
      return;
    }
    void loadPresence(id);
  });

  createEffect(() => {
    if (!props.onWs) return;
    const off = props.onWs((msg) => {
      if (msg.event !== "presence") return;
      if (msg.server_id !== props.serverId) return;
      const payload = msg.payload as { online_account_ids?: string[] } | undefined;
      if (Array.isArray(payload?.online_account_ids)) {
        setOnlineIds(new Set<string>(payload.online_account_ids));
      }
    });
    onCleanup(() => off());
  });

  createEffect(() => {
    const focusId = props.focusAccountId;
    const list = members();
    if (!focusId || !list || members.loading) return;
    requestAnimationFrame(() => {
      const escaped =
        typeof CSS !== "undefined" && CSS.escape ? CSS.escape(focusId) : focusId;
      const el = document.querySelector(
        `.members-list-item[data-account-id="${escaped}"]`,
      );
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        el.classList.add("members-list-item-focus");
        window.setTimeout(() => el.classList.remove("members-list-item-focus"), 1800);
      }
      props.onFocusConsumed?.();
    });
  });

  function roleOf(accountId: string): ServerRole | null {
    return (roles() ?? []).find((r) => r.member_ids.includes(accountId)) ?? null;
  }

  function buckets(list: ServerMember[]): RoleBucket[] {
    const order = roles() ?? [];
    const map = new Map<string, RoleBucket>();
    for (const role of order) {
      map.set(role.id, { key: role.id, label: systemRoleLabel(role), members: [] });
    }
    map.set("__none__", { key: "__none__", label: t("members.noRole"), members: [] });
    for (const m of list) {
      const r = roleOf(m.account_id);
      const key = r?.id ?? "__none__";
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: r ? systemRoleLabel(r) : t("members.noRole"),
          members: [],
        });
      }
      map.get(key)!.members.push(m);
    }
    return [...map.values()].filter((b) => b.members.length > 0);
  }

  const onlineMembers = createMemo(() =>
    (members() ?? []).filter((m) => onlineIds().has(m.account_id)),
  );
  const offlineMembers = createMemo(() =>
    (members() ?? []).filter((m) => !onlineIds().has(m.account_id)),
  );

  async function kick(member: ServerMember) {
    const serverId = props.serverId;
    if (!serverId || !window.confirm(t("members.removeConfirm", { handle: member.handle }))) {
      return;
    }
    await kickServerMember(serverId, member.account_id);
    await refetch();
    window.dispatchEvent(new CustomEvent("mesa:servers-refresh"));
  }

  function canActOn(member: ServerMember): boolean {
    const s = server();
    if (!s) return false;
    if (member.account_id === props.meId) return false;
    if (member.account_id === s.owner_account_id) return false;
    return true;
  }

  async function applyMute(minutes: number) {
    const channelId = props.channelId;
    const target = muteTarget();
    if (!channelId || !target) return;
    setMuteBusy(true);
    setMuteError("");
    try {
      await putChannelMute(channelId, target.account_id, minutes);
      setMuteTarget(null);
      await refetchMutes();
      window.dispatchEvent(
        new CustomEvent("mesa:channel-mute", { detail: { channelId, accountId: target.account_id } }),
      );
    } catch (err) {
      setMuteError(errorMessage(err, t("members.muteFail")));
    } finally {
      setMuteBusy(false);
    }
  }

  async function unmute(member: ServerMember) {
    const channelId = props.channelId;
    if (!channelId) return;
    setMuteBusy(true);
    setMuteError("");
    try {
      await deleteChannelMute(channelId, member.account_id);
      await refetchMutes();
      window.dispatchEvent(
        new CustomEvent("mesa:channel-mute", { detail: { channelId, accountId: member.account_id } }),
      );
    } catch (err) {
      setMuteError(errorMessage(err, t("members.unmuteFail")));
    } finally {
      setMuteBusy(false);
    }
  }

  function renderSection(title: string, list: ServerMember[]) {
    const groups = buckets(list);
    return (
      <section class="members-status-section">
        <h3 class="members-status-title">
          {title} <span class="members-status-count">{list.length}</span>
        </h3>
        <For each={groups} fallback={<p class="members-panel-status">{t("members.nobody")}</p>}>
          {(group) => (
            <div class="members-role-group">
              <h4 class="members-role-title">{group.label}</h4>
              <ul class="members-list">
                <For each={group.members}>
                  {(m) => {
                    const activeMute = () => muteByAccount().get(m.account_id);
                    return (
                      <li class="members-list-item" data-account-id={m.account_id}>
                        <IdentityAvatar
                          class="members-avatar"
                          accountId={m.account_id}
                          handle={m.handle}
                          hasAvatar={!!m.has_avatar}
                        />
                        <span class="members-handle">{m.handle}</span>
                        <div class="members-actions">
                          <Show when={canMute() && canActOn(m)}>
                            <Show
                              when={activeMute()}
                              fallback={
                                <button
                                  type="button"
                                  class="btn btn-ghost members-mute"
                                  aria-label={t("members.muteAria", { handle: m.handle })}
                                  title={t("members.muteTitle")}
                                  disabled={muteBusy()}
                                  onClick={() => {
                                    setMuteError("");
                                    setMuteTarget(m);
                                  }}
                                >
                                  {t("members.mute")}
                                </button>
                              }
                            >
                              {(mute) => (
                                <>
                                  <span class="members-mute-remaining" title={formatEndsAt(mute().ends_at)}>
                                    {t("members.mutedLabel", {
                                      remaining: remainingLabel(mute().ends_at),
                                    })}
                                  </span>
                                  <button
                                    type="button"
                                    class="btn btn-ghost members-unmute"
                                    aria-label={t("members.unmuteAria", { handle: m.handle })}
                                    title={t("members.unmuteTitle")}
                                    disabled={muteBusy()}
                                    onClick={() => void unmute(m)}
                                  >
                                    {t("members.unmute")}
                                  </button>
                                </>
                              )}
                            </Show>
                          </Show>
                          <Show
                            when={
                              server()?.owner_account_id === props.meId && m.account_id !== props.meId
                            }
                          >
                            <button
                              type="button"
                              class="btn btn-ghost members-kick"
                              aria-label={t("members.removeAria", { handle: m.handle })}
                              title={t("members.removeTitle")}
                              onClick={() => void kick(m)}
                            >
                              {t("members.remove")}
                            </button>
                          </Show>
                        </div>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </div>
          )}
        </For>
      </section>
    );
  }

  return (
    <aside class="members-panel" aria-label={t("members.title")}>
      <div class="members-panel-header">
        <h2 class="members-panel-title">{t("members.title")}</h2>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          aria-label={t("members.close")}
          onClick={() => closeMembersPanel()}
        >
          ×
        </button>
      </div>
      <Show when={!props.serverId}>
        <p class="members-panel-status">{t("members.noServer")}</p>
      </Show>
      <Show when={props.serverId && members.loading}>
        <p class="members-panel-status">{t("common.loading")}</p>
      </Show>
      <Show when={props.serverId && members.error}>
        <p class="error members-panel-status">
          {errorMessage(members.error, t("members.loadFail"))}
        </p>
      </Show>
      <Show when={muteError()}>
        <p class="error members-panel-status">{muteError()}</p>
      </Show>
      <Show when={props.serverId && !members.loading && !members.error}>
        <div class="members-roster">
          {renderSection(t("members.online"), onlineMembers())}
          {renderSection(t("members.offline"), offlineMembers())}
        </div>
      </Show>

      <Show when={muteTarget()}>
        {(target) => (
          <div
            class="members-mute-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="members-mute-title"
          >
            <div class="members-mute-dialog-card">
              <h3 id="members-mute-title">
                {t("members.muteDialogTitle", { handle: target().handle })}
              </h3>
              <p class="muted">{t("members.muteDialogHint")}</p>
              <div class="members-mute-presets">
                <For each={[...MUTE_PRESETS]}>
                  {(mins) => (
                    <button
                      type="button"
                      class="btn"
                      disabled={muteBusy()}
                      onClick={() => void applyMute(mins)}
                    >
                      {t("members.muteMins", { n: mins })}
                    </button>
                  )}
                </For>
              </div>
              <div class="members-mute-custom">
                <label>
                  {t("members.customMins")}
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={customMinutes()}
                    onInput={(e) => setCustomMinutes(e.currentTarget.value)}
                  />
                </label>
                <button
                  type="button"
                  class="btn"
                  disabled={muteBusy()}
                  onClick={() => {
                    const n = Number.parseInt(customMinutes(), 10);
                    if (!Number.isFinite(n) || n < 1 || n > 1440) {
                      setMuteError(t("members.durationRange"));
                      return;
                    }
                    void applyMute(n);
                  }}
                >
                  {t("common.apply")}
                </button>
              </div>
              <button
                type="button"
                class="btn btn-ghost"
                disabled={muteBusy()}
                onClick={() => setMuteTarget(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </Show>
    </aside>
  );
}
