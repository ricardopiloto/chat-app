// Everything the shell chrome needs, in one place: what is selected (from the URL), the data for
// it (TanStack Query), live updates (WebSocket), and the small amount of UI state (drawer, panels).
// Components read it through useShell() instead of passing props down the tree.
import { createContext, createEffect, createMemo, createSignal, onCleanup, useContext, type JSX } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { channels as channelsApi, queryKeys, roles as rolesApi, servers as serversApi, voice as voiceApi } from "../api";
import { connectRealtime, type DeliveryState, type RealtimeEnvelope } from "../api";
import { DEFAULT_ROLE_CAPABILITIES } from "../api/helpers";
import type { Account, Channel, ChannelKind, ChannelOccupancy, Member, Presence, Server } from "../api";
import { handleHandoffEvent, loadAllServerKeys } from "../crypto/keyHandoff";
import type { Identity } from "../crypto/identity";
import { isOwner, memberHasCapability } from "../lib/capabilities";
import { addNotice, clearNews, hasNews as anythingNew, loadNotices, noteNews, resetNotices } from "../chat/notices";
import { mergeVoiceOccupancy, voiceOccupancyUpdates, type VoiceState } from "./voice-state";
import { noteE2eeChange } from "../voice/e2eeState";
import { accountTarget, channelTarget, lastChannel } from "./lastChannel";
import { useSession } from "../session/session";

export type Listener = (message: RealtimeEnvelope) => void;
/** Told, per real-time occupancy event, who was in the channel before it (undefined: not known yet). */
export type OccupancyListener = (change: { channelId: string; before: string[] | undefined; after: string[] }) => void;
type Capability = Parameters<typeof memberHasCapability>[2];

const WIDE_SCREEN = 768;
const MEMBERS_KEY = "mesa.membersPanel";

/** Adds an event listener and returns the function that removes it, for use as an effect cleanup. */
function listen(target: Window, type: "resize", handler: () => void): void {
  target.addEventListener(type, handler);
  onCleanup(() => target.removeEventListener(type, handler));
}

function remembered(): boolean | undefined {
  try {
    const value = sessionStorage.getItem(MEMBERS_KEY);
    return value === null ? undefined : value === "1";
  } catch {
    return undefined;
  }
}

export function createShellState(props: { account: () => Account; identity: () => Identity }) {
  const session = useSession();
  const where = useLocation();
  const navigate = useNavigate();
  const cache = useQueryClient();

  // --- selection, taken from the URL: /servers/:serverId[/channels/:channelId | /settings[/:section]] or /account
  const route = createMemo(() => {
    const [, first, serverId, kind, id] = where.pathname.split("/");
    return {
      page: first === "account" ? ("account" as const) : first === "servers" ? ("server" as const) : ("home" as const),
      serverId: first === "servers" ? serverId : undefined,
      channelId: kind === "channels" ? id : undefined,
      settings: kind === "settings" ? (["members", "roles"].includes(id ?? "") ? id! : "overview") : undefined,
    };
  });
  const serverId = () => route().serverId ?? "";

  // --- data
  const servers = createQuery(() => ({ queryKey: queryKeys.servers, queryFn: serversApi.list }));
  const channels = createQuery(() => ({ queryKey: queryKeys.channels(serverId()), queryFn: () => channelsApi.listForServer(serverId()), enabled: !!serverId() }));
  const roles = createQuery(() => ({ queryKey: queryKeys.roles(serverId()), queryFn: () => rolesApi.list(serverId()), enabled: !!serverId() }));
  const members = createQuery(() => ({ queryKey: queryKeys.members(serverId()), queryFn: () => serversApi.members(serverId()), enabled: !!serverId() }));
  const presence = createQuery(() => ({ queryKey: queryKeys.presence(serverId()), queryFn: () => serversApi.presence(serverId()), enabled: !!serverId() }));

  const server = createMemo<Server | undefined>(() => servers.data?.find((s) => s.id === serverId()));
  const channel = createMemo<Channel | undefined>(() => channels.data?.find((c) => c.id === route().channelId));
  const meId = () => props.account().id;
  const owner = () => isOwner(server(), meId());
  // A member with no role still has the server's defaults (they can write and speak); only a role changes that.
  const hasRole = () => (roles.data ?? []).some((role) => role.member_ids.includes(meId()));
  const can = (capability: Capability) =>
    owner() || (hasRole() ? memberHasCapability(roles.data, meId(), capability) : DEFAULT_ROLE_CAPABILITIES[capability]);
  const canAdminServer = () => owner() || can("can_manage_roles") || can("can_remove_members");

  // --- live state that is not a query: who is in voice, which servers have something unread
  const [voiceState, setVoiceState] = createSignal<VoiceState>({});
  const [voiceRoster, setVoiceRoster] = createSignal<Record<string, ChannelOccupancy["occupants"]>>({});
  const [voiceCalls, setVoiceCalls] = createSignal<Record<string, string | null>>({});
  const [unreadServers, setUnreadServers] = createSignal<string[]>([]);
  const [delivery, setDelivery] = createSignal<DeliveryState>("connected");
  // Counts reconnections, so a thread that is open knows to fetch what it missed.
  const [resync, setResync] = createSignal(0);

  const applyOccupancy = (forServer: string, updates: ChannelOccupancy[]) => {
    setVoiceState((now) => mergeVoiceOccupancy(now, forServer, updates));
    setVoiceRoster((now) => ({ ...now, ...Object.fromEntries(updates.map((u) => [u.channel_id, u.occupants])) }));
    setVoiceCalls((now) => ({ ...now, ...Object.fromEntries(updates.map((u) => [u.channel_id, u.call_started_at])) }));
  };

  createEffect(() => {
    let stale = false;
    for (const each of servers.data ?? []) {
      void voiceApi
        .occupancy(each.id)
        .then((snapshot) => !stale && applyOccupancy(each.id, snapshot.channels))
        .catch(() => undefined);
    }
    onCleanup(() => (stale = true));
  });

  // --- real-time events
  const listeners = new Set<Listener>();
  const subscribe = (handler: Listener) => {
    listeners.add(handler);
    return () => listeners.delete(handler);
  };

  const occupancyListeners = new Set<OccupancyListener>();
  const subscribeOccupancy = (handler: OccupancyListener) => {
    occupancyListeners.add(handler);
    return () => occupancyListeners.delete(handler);
  };

  createEffect(() => {
    resetNotices();
    void loadNotices();
    void loadAllServerKeys(props.identity(), meId());
  });

  createEffect(() => {
    const live = connectRealtime({
      onSessionRevoked: () => session.invalidate(),
      onState: setDelivery,
      onResync: () => {
        void cache.invalidateQueries();
        setResync((n) => n + 1);
      },
      onEvent: (message) => {
        const about = message.server_id ?? String(message.payload.server_id ?? "");
        void handleHandoffEvent(message, props.identity(), meId()).catch(() => undefined);
        switch (message.event) {
          case "message.new": {
            const channelId = String(message.payload.channel_id ?? "");
            const messageId = String(message.payload.id ?? "");
            if (about && channelId !== route().channelId) {
              setUnreadServers((now) => (now.includes(about) ? now : [...now, about]));
              if (channelId && messageId && message.payload.sender_account_id !== meId()) {
                noteNews(about, channelId, messageId, String(message.payload.created_at ?? new Date().toISOString()));
              }
            }
            break;
          }
          case "notification.created": {
            addNotice(message.payload);
            break;
          }
          case "presence":
            if (about) {
              const online = (message.payload.online_account_ids as string[] | undefined) ?? [];
              cache.setQueryData<Presence>(queryKeys.presence(about), { online_account_ids: online });
              // Someone online who is not in the member list has just joined: fetch the list again.
              const known = cache.getQueryData<Member[]>(queryKeys.members(about));
              if (known && online.some((id) => !known.some((m) => m.account_id === id))) {
                void cache.invalidateQueries({ queryKey: queryKeys.members(about) });
              }
            }
            break;
          case "voice.occupancy":
            if (about) {
              const updates = voiceOccupancyUpdates(message.payload);
              const known = voiceRoster();
              const changes = updates.map((u) => ({
                channelId: u.channel_id,
                before: known[u.channel_id]?.map((o) => o.account_id),
                after: u.occupants.map((o) => o.account_id),
              }));
              applyOccupancy(about, updates);
              changes.forEach((change) => occupancyListeners.forEach((handler) => handler(change)));
            }
            break;
          case "channel.e2ee_changed": {
            const changed = String(message.payload.channel_id ?? "");
            if (changed) noteE2eeChange(changed, message.payload);
            if (about) void cache.invalidateQueries({ queryKey: queryKeys.channels(about) });
            break;
          }
          case "channel.deleted": {
            const gone = String(message.payload.id ?? message.payload.channel_id ?? "");
            clearNews(gone);
            lastChannel.forget(meId(), gone);
            void cache.invalidateQueries({ queryKey: queryKeys.channels(about) });
            // Someone looking at the channel that was just deleted is taken back to its server.
            if (gone && route().channelId === gone) navigate(`/servers/${about || serverId()}`);
            break;
          }
          case "server.deleted": {
            const gone = String(message.payload.server_id ?? about);
            void cache.invalidateQueries({ queryKey: queryKeys.servers });
            if (gone && serverId() === gone) navigate("/");
            break;
          }
          case "invite.consumed":
            // A new member joined through an invite: the member list and role counts change.
            if (about) {
              void cache.invalidateQueries({ queryKey: queryKeys.members(about) });
              void cache.invalidateQueries({ queryKey: queryKeys.roles(about) });
            }
            break;
          case "channel_role.changed":
            // Roles of a channel changed what some members may do there.
            if (about) {
              void cache.invalidateQueries({ queryKey: queryKeys.channels(about) });
              void cache.invalidateQueries({ queryKey: queryKeys.roles(about) });
            }
            break;
        }
        listeners.forEach((handler) => handler(message));
      },
    });
    onCleanup(() => live.close());
  });

  // --- chrome state
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [membersChoice, setMembersChoice] = createSignal<boolean | undefined>(remembered());
  const [viewport, setViewport] = createSignal(window.innerWidth);
  const narrow = () => viewport() < WIDE_SCREEN;
  const membersOpen = () => !narrow() && (membersChoice() ?? true) && route().page === "server" && !!serverId() && route().settings === undefined;
  const toggleMembers = () => {
    const next = !(membersChoice() ?? true);
    setMembersChoice(next);
    try {
      sessionStorage.setItem(MEMBERS_KEY, next ? "1" : "0");
    } catch {
      /* the choice then lasts only until the next change of page */
    }
  };

  /** Brings a member into view in the members panel, opening the panel first if it is closed. */
  const focusMember = (accountId: string) => {
    setMembersChoice(true);
    requestAnimationFrame(() => {
      const row = document.querySelector<HTMLElement>(`[data-account="${CSS.escape(accountId)}"]`);
      row?.scrollIntoView({ block: "center" });
      row?.classList.add("member-flash");
      window.setTimeout(() => row?.classList.remove("member-flash"), 1800);
    });
  };

  createEffect(() =>
    listen(window, "resize", () => {
      setViewport(window.innerWidth);
      if (!narrow()) setDrawerOpen(false);
    }),
  );
  // The drawer closes whenever the route changes, so choosing something never leaves it covering the result.
  createEffect(() => {
    void where.pathname;
    setDrawerOpen(false);
  });

  createEffect(() => {
    const open = serverId();
    if (open) setUnreadServers((now) => now.filter((id) => id !== open));
  });

  // Dialogs opened from the sidebar but rendered once, at the shell root.
  const [createChannelKind, setCreateChannelKind] = createSignal<ChannelKind | null>(null);
  const [settingsChannel, setSettingsChannel] = createSignal<Channel | null>(null);
  // Set when the channel dialog is opened straight onto its delete confirmation (context menu).
  const [settingsDelete, setSettingsDelete] = createSignal(false);

  // The channel on screen is the one to come back to; settings and account pages have no channel in the URL.
  createEffect(() => {
    const { serverId: inServer, channelId } = route();
    if (inServer && channelId && channels.data?.some((c) => c.id === channelId)) lastChannel.remember(meId(), inServer, channelId);
  });

  const hasNews = () => anythingNew();
  const go = (path: string) => navigate(path);
  // The channel lists are waited for (not guessed), so leaving right after a reload does not land on an empty server.
  const channelsOf = (id: string) => cache.fetchQuery({ queryKey: queryKeys.channels(id), queryFn: () => channelsApi.listForServer(id), staleTime: 30_000 });
  /** Leaves a server's settings for the channel that was open in it, or the server itself. */
  const leaveServerSettings = async (id: string) => {
    const remembered = lastChannel.inServer(meId(), id);
    const listed = remembered ? await channelsOf(id).catch(() => []) : [];
    go(channelTarget(id, remembered, listed));
  };
  /** Leaves the account page for the last channel opened anywhere, or home. */
  const leaveAccount = async () => {
    const last = lastChannel.overall(meId());
    let listed: Channel[] = [];
    let serverIds = (servers.data ?? cache.getQueryData<Server[]>(queryKeys.servers) ?? []).map((s) => s.id);
    if (last) {
      if (!serverIds.length) serverIds = (await serversApi.list().catch(() => [])).map((s) => s.id);
      listed = await channelsOf(last.serverId).catch(() => []);
    }
    go(accountTarget(last, serverIds, listed));
  };

  return {
    route, serverId, servers, channels, roles, members, presence, server, channel, meId, owner, can, canAdminServer,
    voiceState, voiceRoster, voiceCalls, unreadServers, delivery, resync, subscribe, subscribeOccupancy, listeners,
    createChannelKind, setCreateChannelKind, settingsChannel, setSettingsChannel, settingsDelete, setSettingsDelete,
    drawerOpen, setDrawerOpen, narrow, membersOpen, toggleMembers, focusMember, hasNews, go, leaveServerSettings, leaveAccount,
    refreshServers: () => cache.invalidateQueries({ queryKey: queryKeys.servers }),
    refreshChannels: () => cache.invalidateQueries({ queryKey: queryKeys.channels(serverId()) }),
    refreshRoles: () => cache.invalidateQueries({ queryKey: queryKeys.roles(serverId()) }),
  };
}

export type ShellState = ReturnType<typeof createShellState>;

const ShellContext = createContext<ShellState>();

export function ShellProvider(props: { value: ShellState; children: JSX.Element }) {
  return <ShellContext.Provider value={props.value}>{props.children}</ShellContext.Provider>;
}

export function useShell(): ShellState {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error("useShell needs a ShellProvider");
  return shell;
}
