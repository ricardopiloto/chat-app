import {
  For,
  Show,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
} from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import {
  api,
  accountAvatarUrl,
  listNotifications,
  patchDisplayName,
  putOwnAvatar,
  fetchVoiceOccupancy,
  type VoiceChannelOccupancy,
  type Account,
  type Server,
  type Channel,
} from "../api/client";
import { mergeVoiceOccupancy, voiceOccupancyUpdates } from "./voice-state";
import { connectLiveWs, type WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { getLocale, setLocale, t, type AppLocale } from "../i18n";

type ThemeMode = "system" | "light" | "dark";
function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem("mesa.theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}
function applyTheme(mode: ThemeMode) {
  const actual =
    mode === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
  document.documentElement.dataset.theme = actual;
}
export function AppShell(props: {
  account: Account;
  identity: Identity;
  onLogout: () => Promise<void>;
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const params = () => {
    const parts = loc.pathname.split("/");
    return {
      serverId: parts[1] === "servers" ? parts[2] : undefined,
      channelId: parts[3] === "channels" ? parts[4] : undefined,
    };
  };
  const [servers, { refetch: reloadServers }] = createResource(() =>
    api<Server[]>("/api/servers"),
  );
  const activeServer = () => params().serverId ?? "";
  const [channels, { refetch: reloadChannels }] = createResource(
    activeServer,
    (id) =>
      id ? api<Channel[]>(`/api/servers/${id}/channels`) : Promise.resolve([]),
  );
  const [themeMode, setThemeMode] = createSignal<ThemeMode>(readTheme());
  const [mobileOpen, setMobileOpen] = createSignal(false);
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [logoutOpen, setLogoutOpen] = createSignal(false);
  const [savedName, setSavedName] = createSignal(
    props.account.display_name ?? "",
  );
  const [displayName, setDisplayName] = createSignal(
    props.account.display_name ?? "",
  );
  const [hasAvatar, setHasAvatar] = createSignal(
    props.account.has_avatar ?? false,
  );
  const [avatarRevision, setAvatarRevision] = createSignal(0);
  const [accountNotice, setAccountNotice] = createSignal("");
  const [savingName, setSavingName] = createSignal(false);
  const [hasNews, setHasNews] = createSignal(false);
  const [unreadServers, setUnreadServers] = createSignal<string[]>([]);
  const [voiceChannels, setVoiceChannels] = createSignal<
    Record<string, Record<string, boolean>>
  >({});
  const [locale, setLocaleSignal] = createSignal<AppLocale>(getLocale());
  function updateVoice(serverId: string, updates: VoiceChannelOccupancy[]) {
    setVoiceChannels((previous) =>
      mergeVoiceOccupancy(previous, serverId, updates),
    );
  }
  createEffect(() => {
    let disposed = false;
    for (const server of servers() ?? [])
      void fetchVoiceOccupancy(server.id)
        .then((snapshot) => {
          if (!disposed) updateVoice(server.id, snapshot.channels);
        })
        .catch(() => undefined);
    onCleanup(() => {
      disposed = true;
    });
  });
  createEffect(() => {
    applyTheme(themeMode());
    try {
      localStorage.setItem("mesa.theme", themeMode());
    } catch {
      /* storage unavailable */
    }
  });
  createEffect(() => {
    const m = matchMedia("(prefers-color-scheme: dark)");
    const change = () => {
      if (themeMode() === "system") applyTheme("system");
    };
    m.addEventListener("change", change);
    onCleanup(() => m.removeEventListener("change", change));
  });
  createEffect(() => {
    const resize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", resize);
    onCleanup(() => window.removeEventListener("resize", resize));
  });
  createEffect(() => {
    let live = true;
    void listNotifications()
      .then((notifications) => {
        if (live && notifications.length > 0) setHasNews(true);
      })
      .catch(() => undefined);
    onCleanup(() => {
      live = false;
    });
  });
  createEffect(() => {
    const live = connectLiveWs(
      (msg: WsEnvelope) => {
        const sid = msg.server_id ?? String(msg.payload.server_id ?? "");
        if (msg.event === "message.new") {
          const channelId = String(msg.payload.channel_id ?? "");
          if (sid && channelId !== params().channelId) {
            setUnreadServers((v) => (v.includes(sid) ? v : [...v, sid]));
            setHasNews(true);
          }
        }
        if (msg.event === "notification.created") setHasNews(true);
        if (msg.event === "voice.occupancy" && sid) {
          const updates = voiceOccupancyUpdates(msg.payload);
          updateVoice(sid, updates);
        }
        if (msg.event === "server.created" || msg.event === "server.deleted")
          void reloadServers();
        if (msg.event === "channel.created" || msg.event === "channel.deleted")
          void reloadChannels();
      },
      () => undefined,
    );
    onCleanup(() => live.close());
  });
  createEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
        setLogoutOpen(false);
      }
    };
    window.addEventListener("keydown", escape);
    onCleanup(() => window.removeEventListener("keydown", escape));
  });
  async function saveName() {
    setSavingName(true);
    setAccountNotice("");
    try {
      const me = await patchDisplayName(displayName().trim() || null);
      setDisplayName(me.display_name ?? "");
      setSavedName(me.display_name ?? "");
    } catch {
      setAccountNotice(t("shell.saveError"));
    } finally {
      setSavingName(false);
    }
  }
  async function uploadAvatar(file?: File) {
    if (!file) return;
    setAccountNotice("");
    try {
      const updated = await putOwnAvatar(file, file.type);
      setHasAvatar(updated.has_avatar ?? true);
      setAvatarRevision((v) => v + 1);
    } catch {
      setAccountNotice(t("shell.avatarError"));
    }
  }
  async function signOut() {
    try {
      await props.onLogout();
    } catch {
      setAccountNotice(t("shell.logoutError"));
      setLogoutOpen(false);
    }
  }
  const selected = (id: string) => params().channelId === id;
  return (
    <div class="app-shell">
      <header class="topbar">
        <button
          class="hamburger"
          aria-label={t("shell.openNavigation")}
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>
        <button class="wordmark" onClick={() => nav("/")}>
          <span class="mini-mark">M</span> {t("shell.brand")}
        </button>
        <span class="instance-label">{t("shell.instance")}</span>
        <div class="topbar-spacer" />
        <button
          class="top-action"
          aria-label={t("shell.searchEntry")}
          onClick={() => document.dispatchEvent(new Event("mesa:search"))}
        >
          ⌕ <span>{t("shell.search")}</span>
        </button>
        <button
          class="top-action news-button"
          aria-label={t("shell.notificationEntry")}
          onClick={() =>
            document.dispatchEvent(new Event("mesa:notifications"))
          }
        >
          ♧
          <Show when={hasNews()}>
            <i />
          </Show>
          <span>{t("shell.notifications")}</span>
        </button>
        <select
          aria-label={t("shell.theme")}
          value={themeMode()}
          onChange={(e) => setThemeMode(e.currentTarget.value as ThemeMode)}
        >
          <option value="system">{t("shell.system")}</option>
          <option value="light">{t("shell.light")}</option>
          <option value="dark">{t("shell.dark")}</option>
        </select>
      </header>
      <div class="shell-body">
        <Show when={mobileOpen()}>
          <button
            class="drawer-backdrop"
            aria-label={t("shell.closeNavigation")}
            onClick={() => setMobileOpen(false)}
          />
        </Show>
        <aside class="navigation" classList={{ "mobile-open": mobileOpen() }}>
          <nav class="server-rail" aria-label={t("shell.servers")}>
            <button
              class="server-home"
              title={t("shell.home")}
              onClick={() => {
                nav("/");
                setMobileOpen(false);
              }}
            >
              M
            </button>
            <div class="rail-separator" />
            <For each={servers() ?? []}>
              {(server) => (
                <button
                  class="server-icon"
                  classList={{ active: activeServer() === server.id }}
                  title={server.name}
                  onClick={() => {
                    nav(`/servers/${server.id}`);
                    setMobileOpen(false);
                  }}
                >
                  <Show
                    when={server.has_image}
                    fallback={server.name.slice(0, 2).toUpperCase()}
                  >
                    <img src={`/api/servers/${server.id}/image`} alt="" />
                  </Show>
                  <Show
                    when={
                      unreadServers().includes(server.id) || server.has_unread
                    }
                  >
                    <i class="unread-dot" />
                  </Show>
                  <Show
                    when={Object.values(voiceChannels()[server.id] ?? {}).some(
                      Boolean,
                    )}
                  >
                    <i class="voice-dot" />
                  </Show>
                </button>
              )}
            </For>
            <button
              class="server-add"
              title={t("shell.createServer")}
              onClick={() =>
                document.dispatchEvent(new Event("mesa:create-server"))
              }
            >
              ＋
            </button>
          </nav>
          <div class="sidebar">
            <Show
              when={activeServer()}
              fallback={
                <div class="sidebar-empty">{t("shell.chooseServer")}</div>
              }
            >
              <div class="server-heading">
                <strong>
                  {servers()?.find((s) => s.id === activeServer())?.name ??
                    t("shell.server")}
                </strong>
                <button
                  title={t("shell.settings")}
                  onClick={() =>
                    document.dispatchEvent(new Event("mesa:server-settings"))
                  }
                >
                  ⚙
                </button>
                <button
                  title={t("shell.invite")}
                  onClick={() =>
                    document.dispatchEvent(new Event("mesa:invite"))
                  }
                >
                  ↗
                </button>
              </div>
              <div class="channel-list">
                <section>
                  <h2>{t("shell.text")}</h2>
                  <For
                    each={channels()?.filter((c) => c.type === "text") ?? []}
                  >
                    {(ch) => (
                      <button
                        class="channel-row"
                        classList={{ selected: selected(ch.id) }}
                        onClick={() => {
                          nav(`/servers/${activeServer()}/channels/${ch.id}`);
                          setMobileOpen(false);
                        }}
                      >
                        <span
                          aria-label={
                            ch.visibility === "private"
                              ? t("shell.privateChannel")
                              : undefined
                          }
                        >
                          {ch.visibility === "private" ? "🔒" : "#"}
                        </span>
                        {ch.name}
                      </button>
                    )}
                  </For>
                </section>
                <section>
                  <h2>{t("shell.voice")}</h2>
                  <For
                    each={
                      channels()?.filter((c) => c.type === "voice_video") ?? []
                    }
                  >
                    {(ch) => (
                      <button
                        class="channel-row"
                        classList={{ selected: selected(ch.id) }}
                        onClick={() => {
                          nav(`/servers/${activeServer()}/channels/${ch.id}`);
                          setMobileOpen(false);
                        }}
                      >
                        <span
                          aria-label={
                            ch.visibility === "private"
                              ? t("shell.privateChannel")
                              : undefined
                          }
                        >
                          {ch.visibility === "private" ? "🔒" : "◖"}
                        </span>
                        {ch.name}
                      </button>
                    )}
                  </For>
                </section>
                <Show when={channels()?.length === 0}>
                  <p class="muted channel-empty">{t("shell.noChannels")}</p>
                </Show>
              </div>
            </Show>
            <div class="user-panel">
              <span class="user-avatar">
                {hasAvatar() ? (
                  <img
                    src={`${accountAvatarUrl(props.account.id)}?v=${avatarRevision()}`}
                    alt=""
                  />
                ) : (
                  (savedName() || props.account.handle)
                    .slice(0, 1)
                    .toUpperCase()
                )}
                <i />
              </span>
              <div class="user-label">
                <strong>{savedName() || props.account.handle}</strong>
                <small>@{props.account.handle}</small>
              </div>
              <button
                title={t("shell.accountMenu")}
                onClick={() => setMenuOpen(!menuOpen())}
              >
                ⚙
              </button>
              <Show when={menuOpen()}>
                <div class="account-menu">
                  <label>
                    {t("shell.displayName")}
                    <input
                      value={displayName()}
                      onInput={(e) => setDisplayName(e.currentTarget.value)}
                    />
                    <button
                      type="button"
                      disabled={savingName()}
                      onClick={() => void saveName()}
                    >
                      {savingName() ? t("shell.saving") : t("shell.save")}
                    </button>
                  </label>
                  <label class="avatar-upload">
                    {t("shell.changeAvatar")}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        void uploadAvatar(e.currentTarget.files?.[0])
                      }
                    />
                  </label>
                  <label>
                    {t("shell.language")}
                    <select
                      value={locale()}
                      onChange={(e) => {
                        const l = e.currentTarget.value as AppLocale;
                        setLocale(l);
                        setLocaleSignal(l);
                      }}
                    >
                      <option value="pt-BR">{t("shell.portuguese")}</option>
                      <option value="en">{t("shell.english")}</option>
                    </select>
                  </label>
                  <Show when={accountNotice()}>
                    <p class="form-error" role="alert">
                      {accountNotice()}
                    </p>
                  </Show>
                  <button class="signout" onClick={() => setLogoutOpen(true)}>
                    {t("shell.signOut")}
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </aside>
        <main class="main-content">
          <Show
            when={params().channelId}
            fallback={
              <div class="welcome-pane">
                <span class="welcome-mark">M</span>
                <h1>
                  {activeServer() && channels()?.length === 0
                    ? t("shell.noChannels")
                    : servers()?.length
                      ? t("shell.chooseChannel")
                      : t("shell.noServers")}
                </h1>
                <p>
                  {activeServer() && channels()?.length === 0
                    ? t("shell.noChannelsHint")
                    : servers()?.length
                      ? t("shell.chooseChannelHint")
                      : t("shell.noServersHint")}
                </p>
              </div>
            }
          >
            <section class="route-placeholder">
              <h1>
                {channels()?.find((c) => c.id === params().channelId)?.name ??
                  t("shell.unnamedChannel")}
              </h1>
              <p>{t("shell.channelPlaceholder")}</p>
            </section>
          </Show>
        </main>
      </div>
      <Show when={logoutOpen()}>
        <div class="modal-backdrop" onClick={() => setLogoutOpen(false)}>
          <section
            class="confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{t("shell.signOutTitle")}</h2>
            <p>{t("shell.signOutHint")}</p>
            <div>
              <button onClick={() => setLogoutOpen(false)}>
                {t("shell.cancel")}
              </button>
              <button class="primary-action" onClick={() => void signOut()}>
                {t("shell.confirmSignOut")}
              </button>
            </div>
          </section>
        </div>
      </Show>
    </div>
  );
}
