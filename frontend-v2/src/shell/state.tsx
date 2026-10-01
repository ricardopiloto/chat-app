// Everything the shell chrome needs, in one place: what is selected (from the URL), the data for
// it (TanStack Query), live updates (WebSocket), and the small amount of UI state (drawer, panels).
// Components read it through useShell() instead of passing props down the tree.
import { createContext, createEffect, createMemo, createSignal, onCleanup, useContext, type JSX } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { channels as channelsApi, queryKeys, roles as rolesApi, servers as serversApi, voice as voiceApi } from "../api";
import { connectRealtime, type DeliveryState, type RealtimeEnvelope } from "../api";
import type { Account, Channel, ChannelKind, ChannelOccupancy, Member, Presence, Server } from "../api";
import { handleHandoffEvent, loadAllServerKeys } from "../crypto/keyHandoff";
import type { Identity } from "../crypto/identity";
import { isOwner, memberHasCapability } from "../lib/capabilities";
import { addDurableNotification, durableNotifications, listenForSeenMessages, loadDurableNotifications, parseNotification } from "../preferences/durableNotifications";
import { hasAnyUnseen, markUnseen, removeChannel } from "../preferences/notifications";
import { mergeVoiceOccupancy, voiceOccupancyUpdates, type VoiceState } from "./voice-state";

export type Listener = (message: RealtimeEnvelope) => void;
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
  const can = (capability: Capability) => owner() || memberHasCapability(roles.data, meId(), capability);
  const canAdminServer = () => owner() || can("can_manage_roles") || can("can_remove_members");

  // --- live state that is not a query: who is in voice, which servers have something unread
  const [voiceState, setVoiceState] = createSignal<VoiceState>({});
  const [voiceRoster, setVoiceRoster] = createSignal<Record<string, ChannelOccupancy["occupants"]>>({});
  const [unreadServers, setUnreadServers] = createSignal<string[]>([]);
  const [delivery, setDelivery] = createSignal<DeliveryState>("connected");

  const applyOccupancy = (forServer: string, updates: ChannelOccupancy[]) => {
    setVoiceState((now) => mergeVoiceOccupancy(now, forServer, updates));
    setVoiceRoster((now) => ({ ...now, ...Object.fromEntries(updates.map((u) => [u.channel_id, u.occupants])) }));
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

  createEffect(() => {
    void loadDurableNotifications();
    void loadAllServerKeys(props.identity(), meId());
    onCleanup(listenForSeenMessages());
  });

  createEffect(() => {
    const live = connectRealtime({
      onState: setDelivery,
      onResync: () => void cache.invalidateQueries(),
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
                markUnseen(channelId, messageId, String(message.payload.created_at ?? "") || undefined);
              }
            }
            break;
          }
          case "notification.created": {
            const note = parseNotification(message.payload);
            if (note) addDurableNotification(note);
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
            if (about) applyOccupancy(about, voiceOccupancyUpdates(message.payload));
            break;
          case "channel.deleted":
            removeChannel(String(message.payload.id ?? message.payload.channel_id ?? ""));
            void cache.invalidateQueries({ queryKey: queryKeys.channels(about) });
            break;
          case "server.deleted":
            void cache.invalidateQueries({ queryKey: queryKeys.servers });
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

  const hasNews = () => hasAnyUnseen() || durableNotifications().length > 0;
  const go = (path: string) => navigate(path);

  return {
    route, serverId, servers, channels, roles, members, presence, server, channel, meId, owner, can, canAdminServer,
    voiceState, voiceRoster, unreadServers, delivery, subscribe, listeners,
    createChannelKind, setCreateChannelKind, settingsChannel, setSettingsChannel,
    drawerOpen, setDrawerOpen, narrow, membersOpen, toggleMembers, hasNews, go,
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
