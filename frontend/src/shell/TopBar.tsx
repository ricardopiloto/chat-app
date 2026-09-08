import { For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import type { Account, Channel, UserNotification } from "../api/client";
import { api, listNotifications, markAllNotificationsRead, markNotificationRead } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import IconBell from "../components/icons/IconBell";
import IconClose from "../components/icons/IconClose";
import IconMenu from "../components/icons/IconMenu";
import IconMoon from "../components/icons/IconMoon";
import IconSearch from "../components/icons/IconSearch";
import IconSun from "../components/icons/IconSun";
import IconSystem from "../components/icons/IconSystem";
import SearchPanel from "../components/SearchPanel";
import { channelDisplayName, formatNotifWhen } from "../lib/notifFormat";
import {
  NOTIF_MESSAGE_READ_EVENT,
  type NotifMessageReadDetail,
} from "../lib/notifSync";
import { getActiveTextChannelName } from "../preferences/activeChannel";
import {
  clearAllUnseen,
  hasAnyUnseen,
  sessionItemsForChannel,
  unseenChannelIds,
} from "../preferences/notifications";
import {
  THEME_PREF_EVENT,
  cycleThemePreference,
  displayPreference,
  type ThemePreference,
  type ThemePreferenceDetail,
} from "../theme/theme";
import { instanceLabel } from "./instanceLabel";
import { A } from "@solidjs/router";

type Props = {
  me: Account;
  identity: Identity;
  onMenuToggle?: () => void;
  showMenuToggle?: boolean;
  onWs?: (handler: (msg: WsEnvelope) => void) => () => void;
  settingsMode?: boolean;
  onExitSettings?: () => void;
};

/** null = unresolved / failed; string = known name */
type NameCache = Record<string, string | null>;

type SessionPanelRow =
  | { kind: "detail"; channelId: string; messageId: string; createdAt: string }
  | { kind: "plus"; channelId: string; oldestMessageId: string };

const inflight = new Map<string, Promise<void>>();

function preferenceLabel(pref: ThemePreference): string {
  if (pref === "light") return "Tema claro";
  if (pref === "dark") return "Tema escuro";
  return "Tema: sistema";
}

function buildSessionRows(): SessionPanelRow[] {
  const rows: SessionPanelRow[] = [];
  for (const channelId of unseenChannelIds()) {
    const items = sessionItemsForChannel(channelId);
    if (items.length === 0) continue;
    if (items.length > 5) {
      const oldest = items[0]?.messageId;
      if (oldest) rows.push({ kind: "plus", channelId, oldestMessageId: oldest });
      continue;
    }
    for (const item of items) {
      rows.push({
        kind: "detail",
        channelId,
        messageId: item.messageId,
        createdAt: item.createdAt,
      });
    }
  }
  return rows;
}

export default function TopBar(props: Props) {
  const [searchExpanded, setSearchExpanded] = createSignal(false);
  const [searchSeed, setSearchSeed] = createSignal<string | null>(null);
  const [searchSeedNonce, setSearchSeedNonce] = createSignal(0);
  const [notifOpen, setNotifOpen] = createSignal(false);
  const [durableNotifs, setDurableNotifs] = createSignal<UserNotification[]>([]);
  const [channelNames, setChannelNames] = createSignal<NameCache>({});
  const [themePref, setThemePref] = createSignal<ThemePreference>(displayPreference());

  async function resolveChannelNames(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))];
    const cache = channelNames();
    const missing = unique.filter((id) => !(id in cache) && !inflight.has(id));
    if (missing.length === 0) return;

    await Promise.all(
      missing.map(async (id) => {
        const p = (async () => {
          try {
            const ch = await api<Channel>(`/api/channels/${id}`);
            setChannelNames((prev) => ({ ...prev, [id]: ch.name?.trim() || null }));
          } catch {
            setChannelNames((prev) => ({ ...prev, [id]: null }));
          } finally {
            inflight.delete(id);
          }
        })();
        inflight.set(id, p);
        await p;
      }),
    );
  }

  function labelForChannel(id: string): string {
    const cache = channelNames();
    if (!(id in cache)) return channelDisplayName(undefined);
    return channelDisplayName(cache[id]);
  }

  async function loadDurableNotifs() {
    try {
      const list = await listNotifications({ unreadOnly: true });
      setDurableNotifs(list);
      void resolveChannelNames(list.map((n) => n.channel_id));
    } catch {
      /* ignore */
    }
  }

  function parseNotification(payload: Record<string, unknown>): UserNotification | null {
    if (!payload.id || !payload.channel_id) return null;
    const kind = payload.kind === "reply" ? "reply" : "mention";
    return {
      id: String(payload.id),
      kind,
      channel_id: String(payload.channel_id),
      message_id: payload.message_id != null ? String(payload.message_id) : null,
      actor_account_id: String(payload.actor_account_id ?? ""),
      created_at: String(payload.created_at ?? ""),
      read_at: payload.read_at != null ? String(payload.read_at) : null,
    };
  }

  function notifHref(n: UserNotification): string {
    const base = `/channels/${n.channel_id}`;
    if (n.message_id) return `${base}?msg=${encodeURIComponent(n.message_id)}`;
    return base;
  }

  async function onDurableNotifClick(n: UserNotification) {
    try {
      await markNotificationRead(n.id);
    } catch {
      /* ignore */
    }
    setDurableNotifs((prev) => prev.filter((x) => x.id !== n.id));
    setNotifOpen(false);
  }

  async function onClearAll() {
    try {
      await markAllNotificationsRead();
    } catch {
      /* ignore */
    }
    setDurableNotifs([]);
    clearAllUnseen();
  }

  const sessionRows = () => buildSessionRows();
  const showNotifBadge = () => hasAnyUnseen() || durableNotifs().length > 0;
  const canClear = () => showNotifBadge();

  function openSearch(seed: string | null) {
    setSearchSeed(seed);
    setSearchSeedNonce((n) => n + 1);
    setSearchExpanded(true);
  }

  function onFindShortcut(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key !== "f" && e.key !== "F") return;
    e.preventDefault();
    e.stopPropagation();
    const name = getActiveTextChannelName();
    openSearch(name ? `#${name} ` : null);
  }

  function onThemePrefEvent(e: Event) {
    const detail = (e as CustomEvent<ThemePreferenceDetail>).detail;
    setThemePref(detail?.preference ?? "system");
  }

  function onNotifMessageRead(e: Event) {
    const detail = (e as CustomEvent<NotifMessageReadDetail>).detail;
    const messageId = detail?.messageId;
    if (!messageId) return;
    setDurableNotifs((prev) => prev.filter((n) => n.message_id !== messageId));
  }

  onMount(() => {
    void loadDurableNotifs();
    window.addEventListener("keydown", onFindShortcut, true);
    window.addEventListener(THEME_PREF_EVENT, onThemePrefEvent);
    window.addEventListener(NOTIF_MESSAGE_READ_EVENT, onNotifMessageRead);
  });
  onCleanup(() => {
    window.removeEventListener("keydown", onFindShortcut, true);
    window.removeEventListener(THEME_PREF_EVENT, onThemePrefEvent);
    window.removeEventListener(NOTIF_MESSAGE_READ_EVENT, onNotifMessageRead);
  });

  createEffect(() => {
    if (notifOpen()) void loadDurableNotifs();
  });

  createEffect(() => {
    const ids = unseenChannelIds();
    if (ids.length > 0) void resolveChannelNames(ids);
  });

  createEffect(() => {
    if (!props.onWs) return;
    const off = props.onWs((msg) => {
      if (msg.event !== "notification.created") return;
      const n = parseNotification(msg.payload);
      if (!n) return;
      setDurableNotifs((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev];
      });
      void resolveChannelNames([n.channel_id]);
    });
    onCleanup(off);
  });

  function cycleTheme() {
    const next = cycleThemePreference();
    setThemePref(next);
  }

  const themeAria = () => preferenceLabel(themePref());

  return (
    <header class="topbar">
      <Show when={props.showMenuToggle}>
        <button
          type="button"
          class="menu-toggle"
          onClick={() => props.onMenuToggle?.()}
          aria-label="Canais"
        >
          <IconMenu title="Canais" size={20} />
        </button>
      </Show>
      <div class="topbar-brand" aria-label="Mesa">
        <img class="topbar-mark" src="/mesa-logo.png" alt="" width={28} height={28} />
        <span class="topbar-name">Mesa</span>
      </div>
      <span class="topbar-instance">{instanceLabel()}</span>
      <div class="topbar-actions">
        <Show when={props.settingsMode}>
          <button
            type="button"
            class="topbar-icon-btn topbar-settings-close"
            aria-label="Fechar configurações"
            title="Fechar configurações"
            onClick={() => props.onExitSettings?.()}
          >
            <IconClose title="Fechar configurações" size={20} />
          </button>
        </Show>
        <Show
          when={searchExpanded()}
          fallback={
            <button
              type="button"
              class="topbar-icon-btn"
              aria-label="Pesquisar"
              onClick={() => openSearch(null)}
            >
              <IconSearch title="Pesquisar" size={20} />
            </button>
          }
        >
          <SearchPanel
            expanded={true}
            onCollapse={() => {
              setSearchExpanded(false);
              setSearchSeed(null);
            }}
            identity={props.identity}
            meId={props.me.id}
            seedQuery={searchSeed()}
            seedNonce={searchSeedNonce()}
          />
        </Show>
        <div class="topbar-notif">
          <button
            type="button"
            class="topbar-icon-btn"
            aria-label="Notificações"
            aria-expanded={notifOpen()}
            onClick={() => setNotifOpen((v) => !v)}
          >
            <IconBell title="Notificações" size={24} />
            <Show when={showNotifBadge()}>
              <span class="topbar-notif-dot" aria-hidden="true" />
            </Show>
          </button>
          <Show when={notifOpen()}>
            <div class="topbar-notif-panel" role="menu">
              <Show when={canClear()}>
                <div class="topbar-notif-toolbar">
                  <button
                    type="button"
                    class="topbar-notif-clear"
                    onClick={() => void onClearAll()}
                  >
                    Limpar
                  </button>
                </div>
              </Show>
              <Show when={durableNotifs().length > 0}>
                <p class="muted topbar-notif-section">Menções e respostas</p>
                <ul class="topbar-notif-list">
                  <For each={durableNotifs()}>
                    {(n) => {
                      const when = () => formatNotifWhen(n.created_at);
                      return (
                        <li>
                          <A
                            class="topbar-notif-link"
                            href={notifHref(n)}
                            onClick={() => void onDurableNotifClick(n)}
                          >
                            <span class="topbar-notif-channel">{labelForChannel(n.channel_id)}</span>
                            <Show when={when()}>
                              <span class="topbar-notif-when">{when()}</span>
                            </Show>
                          </A>
                        </li>
                      );
                    }}
                  </For>
                </ul>
              </Show>
              <Show when={hasAnyUnseen()}>
                <p
                  class="muted topbar-notif-section"
                  classList={{ "topbar-notif-section-spaced": durableNotifs().length > 0 }}
                >
                  Canais com mensagens novas:
                </p>
                <ul class="topbar-notif-list">
                  <For each={sessionRows()}>
                    {(row) => {
                      if (row.kind === "plus") {
                        return (
                          <li>
                            <A
                              class="topbar-notif-link"
                              href={`/channels/${row.channelId}?msg=${encodeURIComponent(row.oldestMessageId)}`}
                              onClick={() => setNotifOpen(false)}
                            >
                              <span class="topbar-notif-channel">{labelForChannel(row.channelId)}</span>
                              <span class="topbar-notif-when">5+ notificações pendentes</span>
                            </A>
                          </li>
                        );
                      }
                      const when = () => formatNotifWhen(row.createdAt);
                      return (
                        <li>
                          <A
                            class="topbar-notif-link"
                            href={`/channels/${row.channelId}?msg=${encodeURIComponent(row.messageId)}`}
                            onClick={() => setNotifOpen(false)}
                          >
                            <span class="topbar-notif-channel">{labelForChannel(row.channelId)}</span>
                            <Show when={when()}>
                              <span class="topbar-notif-when">{when()}</span>
                            </Show>
                          </A>
                        </li>
                      );
                    }}
                  </For>
                </ul>
              </Show>
              <Show when={!showNotifBadge()}>
                <p class="muted">Sem atividade nova nesta sessão.</p>
              </Show>
            </div>
          </Show>
        </div>
        <button
          type="button"
          class="topbar-icon-btn"
          aria-label={themeAria()}
          title={themeAria()}
          onClick={cycleTheme}
        >
          <Show when={themePref() === "light"}>
            <IconSun title="Tema claro" size={20} />
          </Show>
          <Show when={themePref() === "dark"}>
            <IconMoon title="Tema escuro" size={20} />
          </Show>
          <Show when={themePref() === "system"}>
            <IconSystem title="Tema: sistema" size={20} />
          </Show>
        </button>
      </div>
    </header>
  );
}
