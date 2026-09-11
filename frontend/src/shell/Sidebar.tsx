import { For, Show, createEffect, createResource, createSignal, onCleanup } from "solid-js";
import { A, useLocation, useNavigate, useParams } from "@solidjs/router";
import {
  ApiError,
  api,
  createChannel as createChannelRequest,
  createInvite as createInviteRequest,
  deleteChannel,
  deleteServer,
  fetchServerRoles,
  fetchServerWelcome,
  fetchVoiceOccupancy,
  formatCallDuration,
  patchChannel,
  type Account,
  type Channel,
  type CreateServerResult,
  type Server,
  type ServerRole,
  type VoiceChannelOccupancy,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { generateServerKey } from "../crypto/serverKey";
import {
  channelKeyDisplay,
  generateChannelKey,
  rememberChannelKey,
  sealChannelKeyForSelf,
} from "../crypto/channelKey";
import { publishOwnEnvelope } from "../crypto/keyHandoff";
import type { Identity } from "../crypto/identity";
import Dialog, { useCopiedFeedback } from "../components/Dialog";
import IdentityAvatar from "../components/IdentityAvatar";
import ChannelAclPanel from "../components/ChannelAclPanel";
import { IconLockClosed } from "../components/icons/IconLock";
import IconPlus from "../components/icons/IconPlus";
import IconEmoji from "../components/icons/IconEmoji";
import IconSettings from "../components/icons/IconSettings";
import EmojiPicker from "../components/EmojiPicker";
import type { EmojiEntry } from "../lib/emojiData";
import { insertAtCaret } from "../lib/emojiShortcode";
import {
  channelNameErrorMessage,
  normalizeChannelNameDraft,
  validateChannelName,
} from "../lib/channelName";
import IconUserPlus from "../components/icons/IconUserPlus";
import IconVoiceChannel from "../components/icons/IconVoiceChannel";
import IconHeadphones from "../components/icons/IconHeadphones";
import { IconMicOff, IconMicOn } from "../components/icons/IconMic";
import { useVoiceSession } from "../voice/VoiceSession";
import { t } from "../i18n";
import { errorMessage } from "../lib/apiError";
import { canManageChannel, memberHasCapability } from "../lib/capabilities";
import {
  buildSettingsNav,
  hasAnySettingsAccess,
  isSettingsPath,
} from "../lib/settingsAccess";
import ContextMenu, { bindLongPress, type MenuState } from "./ContextMenu";
import ServerRail from "./ServerRail";
import SettingsNav from "./SettingsNav";
import UserPanel from "./UserPanel";
import {
  channelHref,
  resolveChannelForServer,
  writeLastChannel,
} from "../preferences/lastChannelByServer";

type Props = {
  me: Account;
  identity: Identity;
  selectedServerId: string | null;
  onSelectServer: (server: Server | null) => void;
  onWs?: (handler: (msg: WsEnvelope) => void) => () => void;
  channelsListExpanded?: boolean;
  onToggleChannels?: () => void;
  /** Peek / show — sets expanded true only (never closes). */
  onExpandChannels?: () => void;
  onLogout: () => void;
  onAccountPatch?: (account: Account) => void;
  /** When true, sidebar shows settings nav instead of channels. */
  settingsMode?: boolean;
};

export default function Sidebar(props: Props) {
  const navigate = useNavigate();
  const params = useParams<{ id?: string; serverId?: string }>();
  const routeLoc = useLocation();
  const voice = useVoiceSession();
  const [servers, { refetch }] = createResource(() => api<Server[]>("/api/servers"));
  const [createServerOpen, setCreateServerOpen] = createSignal(false);
  const [createChannelOpen, setCreateChannelOpen] = createSignal(false);
  const [inviteOpen, setInviteOpen] = createSignal(false);
  const [inviteWelcomeOpen, setInviteWelcomeOpen] = createSignal(false);
  const [inviteWelcomeChannelId, setInviteWelcomeChannelId] = createSignal("");
  const [inviteIncludeHistory, setInviteIncludeHistory] = createSignal(false);
  const [confirmDelete, setConfirmDelete] = createSignal<
    | { kind: "channel"; channel: Channel }
    | { kind: "server"; server: Server }
    | null
  >(null);
  const [serverName, setServerName] = createSignal("");
  const [serverPendingKey, setServerPendingKey] = createSignal<Uint8Array | null>(null);
  const [serverCustodyAck, setServerCustodyAck] = createSignal(false);
  const [channelName, setChannelName] = createSignal("");
  const [channelType, setChannelType] = createSignal<"text" | "voice_video">("text");
  const [channelVisibility, setChannelVisibility] = createSignal<"public" | "private">("public");
  const [visibleToNewMembers, setVisibleToNewMembers] = createSignal(true);
  const [aclChannel, setAclChannel] = createSignal<Channel | null>(null);
  const [pendingKey, setPendingKey] = createSignal<Uint8Array | null>(null);
  const [custodyAck, setCustodyAck] = createSignal(false);
  const [error, setError] = createSignal("");
  const [inviteUrl, setInviteUrl] = createSignal("");
  const [menu, setMenu] = createSignal<MenuState | null>(null);
  const [renamingId, setRenamingId] = createSignal<string | null>(null);
  const [renameDraft, setRenameDraft] = createSignal("");
  const [renamePrev, setRenamePrev] = createSignal("");
  const [createEmojiOpen, setCreateEmojiOpen] = createSignal(false);
  const [renameEmojiOpen, setRenameEmojiOpen] = createSignal(false);
  let createNameInput: HTMLInputElement | undefined;
  let renameNameInput: HTMLInputElement | undefined;
  const [lastNameTap, setLastNameTap] = createSignal<{ id: string; at: number } | null>(null);
  const [occupancy, setOccupancy] = createSignal<Record<string, VoiceChannelOccupancy>>({});
  const [clock, setClock] = createSignal(Date.now());
  const copied = useCopiedFeedback();
  const keyCopied = useCopiedFeedback();
  const serverKeyCopied = useCopiedFeedback();

  /** Select server and navigate main pane to that server’s channel or empty view (041). No hangup. */
  async function selectServerAndNavigate(server: Server) {
    props.onSelectServer(server);
    if (props.settingsMode || isSettingsPath(routeLoc.pathname)) {
      navigate(`/servers/${server.id}/settings`);
      return;
    }
    try {
      const list = await api<Channel[]>(`/api/servers/${server.id}/channels`);
      const target = resolveChannelForServer(server.id, list);
      if (!target) {
        navigate(`/servers/${server.id}`);
        return;
      }
      navigate(channelHref(target, server.id));
    } catch {
      navigate(`/servers/${server.id}`);
    }
  }

  /** Server for channel list / chrome — never fall back to servers[0] (041 US4 rail sync). */
  const selected = () =>
    (servers() ?? []).find((s) => s.id === props.selectedServerId) ?? null;

  const isOwner = () => selected()?.owner_account_id === props.me.id;

  /** Server id from URL when AppShell remounts before/without selectedServerId. */
  function serverIdFromUrl(): string | null {
    const emptyId = params.serverId;
    if (typeof emptyId === "string" && emptyId.length > 0) return emptyId;
    const q = new URLSearchParams(routeLoc.search).get("server");
    return q && q.length > 0 ? q : null;
  }

  createEffect(() => {
    const list = servers();
    if (!list?.length) return;
    const fromUrl = serverIdFromUrl();
    const wantId = props.selectedServerId ?? fromUrl;
    if (wantId && list.some((s) => s.id === wantId)) {
      if (props.selectedServerId !== wantId) {
        props.onSelectServer(list.find((s) => s.id === wantId) ?? null);
      }
      return;
    }
    // No URL server context (e.g. home): pick first only if nothing selected / left membership.
    if (!fromUrl && (!props.selectedServerId || !list.some((s) => s.id === props.selectedServerId))) {
      props.onSelectServer(list[0] ?? null);
    }
  });

  const [channels, { refetch: refetchChannels, mutate: mutateChannels }] = createResource(
    () => selected()?.id ?? props.selectedServerId,
    (id) => (id ? api<Channel[]>(`/api/servers/${id}/channels`) : Promise.resolve([] as Channel[])),
  );
  const [roles, { refetch: refetchRoles }] = createResource(
    () => selected()?.id ?? props.selectedServerId,
    (id) => (id ? fetchServerRoles(id) : Promise.resolve([] as ServerRole[])),
  );
  const canCreateChannels = () =>
    isOwner() || memberHasCapability(roles(), props.me.id, "can_create_channels");
  const canCreateInvites = () =>
    isOwner() || memberHasCapability(roles(), props.me.id, "can_create_invites");
  const canOpenServerSettings = () =>
    hasAnySettingsAccess(isOwner(), roles(), props.me.id);
  const settingsGroups = () => {
    const sid = selected()?.id;
    if (!sid) return [];
    return buildSettingsNav(sid, isOwner(), roles(), props.me.id);
  };

  function openServerSettings() {
    const sid = selected()?.id;
    if (!sid || !canOpenServerSettings()) return;
    navigate(`/servers/${sid}/settings`);
  }

  const textChannels = () => (channels() ?? []).filter((c) => c.type === "text");
  const voiceChannels = () => (channels() ?? []).filter((c) => c.type === "voice_video");
  /** Active channel highlight only when route has :id and it belongs to this server’s list. */
  const activeChannelId = () => {
    const id = params.id;
    if (!id) return null;
    const list = channels();
    if (list && !list.some((c) => c.id === id)) return null;
    return id;
  };

  createEffect(() => {
    const id = selected()?.id;
    if (!id) {
      setOccupancy({});
      return;
    }
    void fetchVoiceOccupancy(id)
      .then((snap) => {
        const map: Record<string, VoiceChannelOccupancy> = {};
        for (const ch of snap.channels) map[ch.channel_id] = ch;
        setOccupancy(map);
      })
      .catch(() => setOccupancy({}));
  });

  createEffect(() => {
    const tick = window.setInterval(() => setClock(Date.now()), 1000);
    onCleanup(() => window.clearInterval(tick));
  });

  createEffect(() => {
    const onRolesChanged = (e: Event) => {
      const serverId = (e as CustomEvent<{ serverId?: string }>).detail?.serverId;
      const current = selected()?.id ?? props.selectedServerId;
      if (!serverId || !current || serverId !== current) return;
      void refetchRoles();
    };
    window.addEventListener("mesa:roles-changed", onRolesChanged);
    onCleanup(() => window.removeEventListener("mesa:roles-changed", onRolesChanged));
  });

  /** Nested roster: only occupants with mic or camera on (028). Avatar is decorative. */
  function transmitting(channelId: string) {
    return (occupancy()[channelId]?.occupants ?? []).filter((o) => o.mic_on || o.cam_on);
  }

  function channelHasScreenShare(channelId: string) {
    return (occupancy()[channelId]?.occupants ?? []).some((o) => o.screen_on);
  }

  function callStartedAt(channelId: string): string | null {
    return occupancy()[channelId]?.call_started_at ?? null;
  }

  createEffect(() => {
    if (!props.onWs) return;
    const off = props.onWs((msg) => {
      if (msg.event === "voice.occupancy") {
        void refetch(); // has_voice on rail (all servers)
        if (msg.server_id === selected()?.id) {
          const channelId = String(msg.payload.channel_id ?? "");
          if (!channelId) return;
          const occupants = (msg.payload.occupants as VoiceChannelOccupancy["occupants"]) ?? [];
          const started = msg.payload.call_started_at;
          const callStartedAt =
            typeof started === "string" ? started : started == null ? null : String(started);
          setOccupancy((prev) => {
            const next = { ...prev };
            if (!callStartedAt && occupants.length === 0) {
              delete next[channelId];
            } else {
              next[channelId] = {
                channel_id: channelId,
                call_started_at: callStartedAt,
                occupants,
              };
            }
            return next;
          });
        }
      }
      if (msg.event === "message.new") {
        void refetch(); // has_unread on rail
      }
      if (msg.event === "channel.deleted") {
        void refetchChannels();
        if (String(msg.payload.channel_id) === activeChannelId()) {
          navigate("/");
        }
      }
      if (msg.event === "server.deleted") {
        void refetch();
        if (String(msg.payload.server_id) === selected()?.id) {
          props.onSelectServer(null);
          navigate("/");
        }
      }
    });
    onCleanup(off);
  });

  createEffect(() => {
    const onRefresh = () => {
      void refetch();
    };
    window.addEventListener("mesa:servers-refresh", onRefresh);
    onCleanup(() => window.removeEventListener("mesa:servers-refresh", onRefresh));
  });

  function openCreateServer() {
    setServerName("");
    setServerPendingKey(generateChannelKey());
    setServerCustodyAck(false);
    setError("");
    setCreateServerOpen(true);
  }

  function openCreateChannel(type: "text" | "voice_video") {
    setChannelType(type);
    setChannelName("");
    setChannelVisibility("public");
    setVisibleToNewMembers(true);
    setPendingKey(type === "voice_video" ? generateChannelKey() : null);
    setCustodyAck(false);
    setError("");
    setCreateChannelOpen(true);
  }

  createEffect(() => {
    if (!createChannelOpen()) return;
    if (channelType() === "voice_video" && !pendingKey()) {
      setPendingKey(generateChannelKey());
      setCustodyAck(false);
    }
    if (channelType() === "text") {
      setPendingKey(null);
      setCustodyAck(false);
    }
  });

  async function createServer(e: Event) {
    e.preventDefault();
    setError("");
    const key = serverPendingKey();
    if (!key || !serverCustodyAck()) {
      setError(t("shell.confirmSaveVoiceKey"));
      return;
    }
    try {
      const result = await api<CreateServerResult>("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          name: serverName().trim() || t("shell.defaultServerName"),
          custody_ack: true,
          channel_key_sealed: sealChannelKeyForSelf(key, props.identity),
        }),
      });
      const server: Server = {
        id: result.id,
        name: result.name,
        owner_account_id: result.owner_account_id,
        has_image: result.has_image ?? false,
      };
      const serverKey = generateServerKey();
      await publishOwnEnvelope(server.id, props.me.id, props.identity, serverKey);

      let voiceId = result.channels?.find((c) => c.type === "voice_video")?.id;
      if (!voiceId) {
        const list = await api<Channel[]>(`/api/servers/${server.id}/channels`);
        voiceId = list.find((c) => c.type === "voice_video")?.id;
      }
      if (voiceId) rememberChannelKey(voiceId, key);

      setServerName("");
      setServerPendingKey(null);
      setServerCustodyAck(false);
      setCreateServerOpen(false);
      await refetch();
      await selectServerAndNavigate(server);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function createChannel(e: Event) {
    e.preventDefault();
    const server = selected();
    if (!server) return;
    setError("");
    if (channelType() === "voice_video" && !custodyAck()) {
      setError(t("shell.confirmSaveChannelKey"));
      return;
    }
    const rawName = channelName().trim()
      ? channelName()
      : channelType() === "text"
        ? t("shell.defaultTextChannel")
        : t("shell.defaultVoiceChannel");
    const checked = validateChannelName(rawName);
    if (!checked.ok) {
      setError(channelNameErrorMessage(checked.reason));
      return;
    }
    try {
      const body: {
        name: string;
        type: "text" | "voice_video";
        visibility: "public" | "private";
        custody_ack?: true;
        channel_key_sealed?: string;
      } = {
        name: checked.name,
        type: channelType(),
        visibility: channelVisibility(),
      };
      const key = pendingKey();
      if (channelType() === "voice_video" && key) {
        body.custody_ack = true;
        body.channel_key_sealed = sealChannelKeyForSelf(key, props.identity);
      }
      let ch = await createChannelRequest(server.id, body);
      if (ch.visibility === "public" && !visibleToNewMembers()) {
        ch = await patchChannel(ch.id, { visible_to_new_members: false });
      }
      if (key) rememberChannelKey(ch.id, key);
      setCreateChannelOpen(false);
      setChannelName("");
      setPendingKey(null);
      setCustodyAck(false);
      await refetchChannels();
      writeLastChannel(server.id, ch.id);
      navigate(`/channels/${ch.id}?server=${server.id}&type=${ch.type}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function needsInviteWelcomeChannel(server: Server): Promise<boolean> {
    const list = channels() ?? (await api<Channel[]>(`/api/servers/${server.id}/channels`));
    if (list.some((c) => c.type === "text" && c.name === "geral")) return false;
    try {
      const welcome = await fetchServerWelcome(server.id);
      if (welcome.welcome_channel_id) return false;
    } catch {
      /* non-owner: assume needed if no geral */
    }
    return true;
  }

  async function createInvite(includeHistory: boolean, welcomeChannelId?: string) {
    const server = selected();
    if (!server) return;
    setError("");
    try {
      const body: {
        include_history: boolean;
        welcome_channel_id?: string;
      } = { include_history: includeHistory };
      if (welcomeChannelId) body.welcome_channel_id = welcomeChannelId;
      const inv = await createInviteRequest(server.id, body);
      const url = `${location.origin}/invite/${inv.code}`;
      setInviteUrl(url);
      await copied.copy(url);
      setInviteWelcomeOpen(false);
      setInviteOpen(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function startCreateInvite(includeHistory: boolean) {
    const server = selected();
    if (!server) return;
    setError("");
    setInviteIncludeHistory(includeHistory);
    try {
      if (await needsInviteWelcomeChannel(server)) {
        setInviteWelcomeChannelId(textChannels()[0]?.id ?? "");
        setInviteWelcomeOpen(true);
        return;
      }
      await createInvite(includeHistory);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function canDeleteChannel(c: Channel): boolean {
    return canManageChannel(props.me.id, selected(), c, roles());
  }

  function canRenameChannel(c: Channel): boolean {
    return canManageChannel(props.me.id, selected(), c, roles());
  }

  function startRename(c: Channel) {
    if (!canRenameChannel(c)) return;
    setRenamePrev(c.name);
    setRenameDraft(normalizeChannelNameDraft(c.name));
    setRenamingId(c.id);
    setError("");
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameDraft("");
    setRenamePrev("");
  }

  async function commitRename() {
    const id = renamingId();
    if (!id) return;
    const checked = validateChannelName(renameDraft());
    const prev = renamePrev();
    if (!checked.ok) {
      setError(channelNameErrorMessage(checked.reason));
      setRenameDraft(normalizeChannelNameDraft(prev));
      setRenamingId(null);
      return;
    }
    if (checked.name === prev) {
      cancelRename();
      return;
    }
    setError("");
    try {
      const updated = await patchChannel(id, { name: checked.name });
      mutateChannels((list) =>
        (list ?? []).map((ch) => (ch.id === id ? { ...ch, name: updated.name } : ch)),
      );
      window.dispatchEvent(
        new CustomEvent("mesa:channel-renamed", {
          detail: { channelId: id, name: updated.name },
        }),
      );
      void refetchChannels();
      cancelRename();
    } catch (err) {
      setRenameDraft(normalizeChannelNameDraft(prev));
      setRenamingId(null);
      if (err instanceof ApiError && err.status === 403) {
        setError(t("shell.renameDenied"));
      } else {
        setError(errorMessage(err) || t("shell.renameFailed"));
      }
    }
  }

  function onRenameKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  }

  function onChannelNameDblClick(c: Channel, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startRename(c);
  }

  function onChannelNamePointerUp(c: Channel, e: PointerEvent) {
    if (e.pointerType === "mouse") return;
    const now = Date.now();
    const prev = lastNameTap();
    if (prev && prev.id === c.id && now - prev.at < 300) {
      e.preventDefault();
      e.stopPropagation();
      setLastNameTap(null);
      startRename(c);
      return;
    }
    setLastNameTap({ id: c.id, at: now });
  }

  function channelNameLabel(c: Channel, className?: string) {
    return (
      <span
        class={className}
        onDblClick={(e) => onChannelNameDblClick(c, e)}
        onPointerUp={(e) => onChannelNamePointerUp(c, e)}
      >
        {c.name}
      </span>
    );
  }

  function channelRenameInput() {
    return (
      <div class="channel-name-emoji-wrap channel-rename-emoji-wrap">
        <Show when={renameEmojiOpen()}>
          <div class="channel-emoji-picker-anchor">
            <EmojiPicker
              onSelect={(entry) => {
                const el = renameNameInput;
                const caret = el?.selectionStart ?? renameDraft().length;
                const { text, caret: next } = insertAtCaret(renameDraft(), caret, entry.glyph);
                const normalized = normalizeChannelNameDraft(text);
                setRenameDraft(normalized);
                setRenameEmojiOpen(false);
                requestAnimationFrame(() => {
                  renameNameInput?.focus();
                  const pos = Math.min(next, normalized.length);
                  renameNameInput?.setSelectionRange(pos, pos);
                });
              }}
              onClose={() => setRenameEmojiOpen(false)}
            />
          </div>
        </Show>
        <input
          class="channel-rename-input"
          type="text"
          value={renameDraft()}
          aria-label={t("shell.newChannelName")}
          onInput={(e) => setRenameDraft(normalizeChannelNameDraft(e.currentTarget.value))}
          onKeyDown={onRenameKeyDown}
          onBlur={() => {
            window.setTimeout(() => {
              if (renameEmojiOpen()) return;
              void commitRename();
            }, 150);
          }}
          ref={(el) => {
            renameNameInput = el;
            queueMicrotask(() => {
              el?.focus();
              el?.select();
            });
          }}
        />
        <button
          type="button"
          class="composer-icon-btn channel-name-emoji-btn"
          aria-label={t("shell.emoji")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setRenameEmojiOpen((v) => !v)}
        >
          <IconEmoji size={16} title={t("shell.emoji")} />
        </button>
      </div>
    );
  }

  function openChannelMenu(c: Channel, e: { clientX: number; clientY: number }) {
    if (!canDeleteChannel(c)) return;
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: t("shell.channelPermissions"),
          onSelect: () => setAclChannel(c),
        },
        {
          label: t("shell.deleteChannel"),
          danger: true,
          onSelect: () => setConfirmDelete({ kind: "channel", channel: c }),
        },
      ],
    });
  }

  function openServerMenu(_s: Server, _e: { clientX: number; clientY: number }) {
    // Imagem / Apagar moved to server settings (056); no rail context menu items.
  }

  async function confirmDeleteAction() {
    const target = confirmDelete();
    if (!target) return;
    setError("");
    try {
      if (target.kind === "channel") {
        await deleteChannel(target.channel.id);
        await refetchChannels();
        if (activeChannelId() === target.channel.id) navigate("/");
      } else {
        await deleteServer(target.server.id);
        await refetch();
        if (selected()?.id === target.server.id) {
          props.onSelectServer(null);
          navigate("/");
        }
      }
      setConfirmDelete(null);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "last_channel" ||
          err.code === "last_channel_of_type" ||
          err.status === 409)
      ) {
        setError(
          err.code === "last_channel_of_type" || err.message.includes("last")
            ? err.message || t("shell.cannotDeleteLastOfType")
            : t("shell.cannotDeleteLast"),
        );
      } else {
        setError(errorMessage(err));
      }
      setConfirmDelete(null);
    }
  }

  return (
    <div class="shell-nav">
      <ServerRail
        servers={servers() ?? []}
        selectedId={props.selectedServerId}
        onSelect={(s) => void selectServerAndNavigate(s)}
        onCreate={() => openCreateServer()}
        onContextMenu={(s, e) => openServerMenu(s, e)}
      />
      <aside class="sidebar">
        <div class="sidebar-header sidebar-header-static">
          <div class="sidebar-server-heading">
            <Show
              when={selected() && canOpenServerSettings()}
              fallback={
                <span class="sidebar-server-name font-place">{selected()?.name ?? t("shell.noServer")}</span>
              }
            >
              <button
                type="button"
                class="sidebar-server-name-btn"
                aria-label={t("shell.serverSettingsOf", {
                  name: selected()?.name ?? t("shell.serverFallback"),
                })}
                onClick={() => openServerSettings()}
              >
                <span class="sidebar-server-name font-place">{selected()?.name}</span>
              </button>
            </Show>
            <Show when={selected() && canOpenServerSettings()}>
              <button
                type="button"
                class="pane-icon-btn sidebar-settings-btn"
                aria-label={t("shell.serverSettings")}
                title={t("shell.serverSettings")}
                onClick={() => openServerSettings()}
              >
                <IconSettings size={18} title={t("shell.serverSettings")} />
              </button>
            </Show>
          </div>
          <Show when={selected() && canCreateInvites()}>
            <button
              type="button"
              class="pane-icon-btn sidebar-invite-btn"
              aria-label={t("shell.invite")}
              title={t("shell.invite")}
              onClick={() => void startCreateInvite(false)}
            >
              <IconUserPlus size={20} />
            </button>
          </Show>
        </div>

        <nav class="sidebar-nav">
          <Show when={selected() && props.settingsMode}>
            <SettingsNav groups={settingsGroups()} />
          </Show>
          <Show when={selected() && !props.settingsMode}>
            <div class="sidebar-section-row">
              <div class="sidebar-section">
                <span class="sidebar-section-icon" aria-hidden="true">
                  #
                </span>
                {t("shell.text")}
              </div>
              <Show when={canCreateChannels()}>
                <button
                  type="button"
                  class="sidebar-section-plus"
                  aria-label={t("shell.createText")}
                  title={t("shell.createText")}
                  onClick={() => openCreateChannel("text")}
                >
                  <IconPlus title={t("shell.createText")} size={18} />
                </button>
              </Show>
            </div>
            <For each={textChannels()}>
              {(c) => (
                <Show
                  when={renamingId() === c.id}
                  fallback={
                    <A
                      href={`/channels/${c.id}?server=${selected()!.id}&type=${c.type}`}
                      class={`channel-item${activeChannelId() === c.id ? " active" : ""}${c.visibility === "private" ? " channel-item-private" : ""}`}
                      onClick={() => {
                        const sid = selected()?.id;
                        if (sid) writeLastChannel(sid, c.id);
                        window.dispatchEvent(new CustomEvent("mesa:close-drawer"));
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openChannelMenu(c, e);
                      }}
                      ref={(el) => {
                        if (!el || !canDeleteChannel(c)) return;
                        const unbind = bindLongPress(el, (x, y) =>
                          openChannelMenu(c, { clientX: x, clientY: y }),
                        );
                        onCleanup(unbind);
                      }}
                    >
                      <span class="prefix">#</span>
                      {channelNameLabel(c, "channel-name")}
                      <Show when={c.visibility === "private"}>
                        <span class="channel-lock" aria-hidden="true">
                          <IconLockClosed size={14} title={t("shell.privateChannel")} />
                        </span>
                      </Show>
                    </A>
                  }
                >
                  <div
                    class={`channel-item channel-item-renaming${activeChannelId() === c.id ? " active" : ""}${c.visibility === "private" ? " channel-item-private" : ""}`}
                  >
                    <span class="prefix">#</span>
                    {channelRenameInput()}
                    <Show when={c.visibility === "private"}>
                      <span class="channel-lock" aria-hidden="true">
                        <IconLockClosed size={14} title={t("shell.privateChannel")} />
                      </span>
                    </Show>
                  </div>
                </Show>
              )}
            </For>

            <div class="sidebar-section-row">
              <div class="sidebar-section">
                <span class="sidebar-section-icon" aria-hidden="true">
                  <IconVoiceChannel size={14} />
                </span>
                {t("shell.voiceVideo")}
              </div>
              <Show when={canCreateChannels()}>
                <button
                  type="button"
                  class="sidebar-section-plus"
                  aria-label={t("shell.createVoice")}
                  title={t("shell.createVoice")}
                  onClick={() => openCreateChannel("voice_video")}
                >
                  <IconPlus title={t("shell.createVoice")} size={18} />
                </button>
              </Show>
            </div>
            <For each={voiceChannels()}>
              {(c) => {
                const started = () => callStartedAt(c.id);
                const names = () => transmitting(c.id);
                const sharing = () => channelHasScreenShare(c.id);
                const timer = () => {
                  const at = started();
                  return at ? formatCallDuration(at, clock()) : null;
                };
                return (
                <div class="voice-channel-block">
                <Show
                  when={renamingId() === c.id}
                  fallback={
                    <A
                      href={`/channels/${c.id}?server=${selected()!.id}&type=${c.type}`}
                      class={`channel-item${activeChannelId() === c.id ? " active" : ""}${c.visibility === "private" ? " channel-item-private" : ""}${sharing() ? " has-screen-share" : ""}`}
                      onClick={() => {
                        const sid = selected()?.id;
                        if (sid) writeLastChannel(sid, c.id);
                        window.dispatchEvent(new CustomEvent("mesa:close-drawer"));
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openChannelMenu(c, e);
                      }}
                      ref={(el) => {
                        if (!el || !canDeleteChannel(c)) return;
                        const unbind = bindLongPress(el, (x, y) =>
                          openChannelMenu(c, { clientX: x, clientY: y }),
                        );
                        onCleanup(unbind);
                      }}
                    >
                      <span class="prefix channel-icon" aria-hidden="true">
                        <IconVoiceChannel size={18} />
                      </span>
                      {channelNameLabel(c, "voice-channel-name channel-name")}
                      <Show when={sharing()}>
                        <span
                          class="screen-share-indicator"
                          aria-label={t("voice.screenShareActive")}
                          title={t("voice.screenShareActive")}
                        />
                      </Show>
                      <Show when={timer()}>
                        {(dur) => (
                          <span class="voice-call-timer" aria-label={t("shell.callDuration", { duration: dur() })}>
                            {dur()}
                          </span>
                        )}
                      </Show>
                      <Show when={c.visibility === "private"}>
                        <span class="channel-lock" aria-hidden="true">
                          <IconLockClosed size={14} title={t("shell.privateChannel")} />
                        </span>
                      </Show>
                    </A>
                  }
                >
                  <div
                    class={`channel-item channel-item-renaming${activeChannelId() === c.id ? " active" : ""}${c.visibility === "private" ? " channel-item-private" : ""}`}
                  >
                    <span class="prefix channel-icon" aria-hidden="true">
                      <IconVoiceChannel size={18} />
                    </span>
                    {channelRenameInput()}
                    <Show when={c.visibility === "private"}>
                      <span class="channel-lock" aria-hidden="true">
                        <IconLockClosed size={14} title={t("shell.privateChannel")} />
                      </span>
                    </Show>
                  </div>
                </Show>
                <Show when={names().length > 0}>
                  <ul class="voice-roster" aria-label={t("shell.inCallRoster", { name: c.name })}>
                    <For each={names()}>
                      {(o) => {
                        const speaking = () => {
                          if (!voice.live() || voice.channelId() !== c.id) return false;
                          if (!o.mic_on) return false;
                          if (o.account_id === props.me.id && !voice.micOn()) return false;
                          return voice.speakingAccountIds().has(o.account_id);
                        };
                        const rowLabel = () =>
                          speaking() ? `${o.handle}, ${t("shell.speaking")}` : o.handle;
                        return (
                          <li
                            class="voice-roster-item"
                            title={o.handle}
                            aria-label={rowLabel()}
                          >
                            <IdentityAvatar
                              class="voice-roster-avatar"
                              accountId={o.account_id}
                              handle={o.handle}
                              hasAvatar={!!o.has_avatar}
                            />
                            <span class="voice-roster-handle">{o.handle}</span>
                            <span class="voice-roster-media" aria-hidden={false}>
                              <span
                                class="voice-roster-media-icon"
                                classList={{ "is-speaking": speaking() }}
                              >
                                <Show
                                  when={o.mic_on}
                                  fallback={
                                    <IconMicOff size={14} title={t("shell.micOff")} />
                                  }
                                >
                                  <IconMicOn size={14} title={t("shell.micOn")} />
                                </Show>
                              </span>
                              <span
                                class="voice-roster-media-icon"
                                classList={{ "is-speaking": speaking() }}
                              >
                                <IconHeadphones size={14} title={t("shell.listening")} />
                              </span>
                            </span>
                          </li>
                        );
                      }}
                    </For>
                  </ul>
                </Show>
                </div>
                );
              }}
            </For>
          </Show>

          <p class="error" style={{ padding: "0 8px" }}>
            {error()}
          </p>
        </nav>
      </aside>

      <UserPanel
        me={props.me}
        onLogout={props.onLogout}
        onAccountPatch={props.onAccountPatch}
        openChannelName={
          (() => {
            const id = activeChannelId();
            if (!id) return null;
            return channels()?.find((c) => c.id === id)?.name ?? null;
          })()
        }
      />

      <ContextMenu menu={menu()} onClose={() => setMenu(null)} />

      <Dialog
        open={createServerOpen()}
        title={t("servers.create")}
        onClose={() => setCreateServerOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setCreateServerOpen(false)}>
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              form="create-server-form"
              class="btn btn-primary"
              disabled={!serverCustodyAck()}
            >
              {t("common.create")}
            </button>
          </>
        }
      >
        <form id="create-server-form" onSubmit={createServer}>
          <div class="field">
            <label for="server-name">{t("common.name")}</label>
            <input
              id="server-name"
              class="input"
              value={serverName()}
              onInput={(e) => setServerName(e.currentTarget.value)}
              placeholder={t("servers.placeholder")}
            />
          </div>
          <Show when={serverPendingKey()}>
            {(key) => (
              <div class="custody-block">
                <p class="muted">
                  {t("shell.serverCustodyHint")}
                </p>
                <div class="row" style={{ gap: "8px", "align-items": "center" }}>
                  <code class="key-display">{channelKeyDisplay(key())}</code>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => void serverKeyCopied.copy(channelKeyDisplay(key()))}
                  >
                    {serverKeyCopied.label() === "Copiar" ? t("shell.copyKey") : serverKeyCopied.label()}
                  </button>
                </div>
                <label class="check-line">
                  <input
                    type="checkbox"
                    checked={serverCustodyAck()}
                    onChange={(e) => setServerCustodyAck(e.currentTarget.checked)}
                  />
                  {t("shell.savedKeyAck")}
                </label>
              </div>
            )}
          </Show>
          <Show when={createServerOpen() && error()}>
            <p class="error" role="alert">
              {error()}
            </p>
          </Show>
        </form>
      </Dialog>

      <Dialog
        open={createChannelOpen()}
        title={channelType() === "text" ? t("shell.createText") : t("shell.createVoice")}
        onClose={() => setCreateChannelOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setCreateChannelOpen(false)}>
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              form="create-channel-form"
              class="btn btn-primary"
              disabled={channelType() === "voice_video" && !custodyAck()}
            >
              {t("common.create")}
            </button>
          </>
        }
      >
        <form id="create-channel-form" onSubmit={createChannel}>
          <div class="field">
            <label for="channel-name">{t("common.name")}</label>
            <div class="channel-name-emoji-wrap">
              <Show when={createEmojiOpen()}>
                <div class="channel-emoji-picker-anchor">
                  <EmojiPicker
                    onSelect={(entry: EmojiEntry) => {
                      const el = createNameInput;
                      const caret = el?.selectionStart ?? channelName().length;
                      const { text, caret: next } = insertAtCaret(
                        channelName(),
                        caret,
                        entry.glyph,
                      );
                      const normalized = normalizeChannelNameDraft(text);
                      setChannelName(normalized);
                      setCreateEmojiOpen(false);
                      requestAnimationFrame(() => {
                        createNameInput?.focus();
                        const pos = Math.min(next, normalized.length);
                        createNameInput?.setSelectionRange(pos, pos);
                      });
                    }}
                    onClose={() => setCreateEmojiOpen(false)}
                  />
                </div>
              </Show>
              <input
                id="channel-name"
                class="input"
                ref={(el) => {
                  createNameInput = el;
                }}
                value={channelName()}
                onInput={(e) => setChannelName(normalizeChannelNameDraft(e.currentTarget.value))}
                placeholder={
                  channelType() === "text"
                    ? t("shell.defaultTextChannel")
                    : t("shell.defaultVoiceChannel")
                }
              />
              <button
                type="button"
                class="composer-icon-btn channel-name-emoji-btn"
                aria-label={t("shell.emoji")}
                onClick={() => setCreateEmojiOpen((v) => !v)}
              >
                <IconEmoji size={16} title={t("shell.emoji")} />
              </button>
            </div>
          </div>
          <div class="field">
            <label>{t("shell.visibility")}</label>
            <div class="row" style={{ gap: "16px" }}>
              <label class="check-line">
                <input
                  type="radio"
                  name="create-channel-visibility"
                  checked={channelVisibility() === "public"}
                  onChange={() => setChannelVisibility("public")}
                />
                {t("shell.public")}
              </label>
              <label class="check-line">
                <input
                  type="radio"
                  name="create-channel-visibility"
                  checked={channelVisibility() === "private"}
                  onChange={() => setChannelVisibility("private")}
                />
                {t("shell.private")}
              </label>
            </div>
          </div>
          <Show when={channelVisibility() === "public"}>
            <label class="check-line">
              <input
                type="checkbox"
                checked={visibleToNewMembers()}
                onChange={(e) => setVisibleToNewMembers(e.currentTarget.checked)}
              />
              {t("shell.visibleToNewMembers")}
            </label>
          </Show>
          <Show when={channelType() === "voice_video" && pendingKey()}>
            {(key) => (
              <div class="custody-block">
                <p class="muted">
                  {t("shell.channelCustodyHint")}
                </p>
                <div class="row" style={{ gap: "8px", "align-items": "center" }}>
                  <code class="key-display">{channelKeyDisplay(key())}</code>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => void keyCopied.copy(channelKeyDisplay(key()))}
                  >
                    {keyCopied.label() === "Copiar" ? t("shell.copyKey") : keyCopied.label()}
                  </button>
                </div>
                <label class="check-line">
                  <input
                    type="checkbox"
                    checked={custodyAck()}
                    onChange={(e) => setCustodyAck(e.currentTarget.checked)}
                  />
                  {t("shell.savedKeyAck")}
                </label>
              </div>
            )}
          </Show>
          <Show when={createChannelOpen() && error()}>
            <p class="error" role="alert">
              {error()}
            </p>
          </Show>
        </form>
      </Dialog>

      <Dialog
        open={inviteWelcomeOpen()}
        title={t("invite.welcomeChannelTitle")}
        onClose={() => setInviteWelcomeOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setInviteWelcomeOpen(false)}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!inviteWelcomeChannelId()}
              onClick={() =>
                void createInvite(inviteIncludeHistory(), inviteWelcomeChannelId() || undefined)
              }
            >
              {t("invite.welcomeChannelCreate")}
            </button>
          </>
        }
      >
        <p class="muted">{t("invite.welcomeChannelHint")}</p>
        <label class="field">
          <span>{t("invite.welcomeChannelLabel")}</span>
          <select
            class="input"
            value={inviteWelcomeChannelId()}
            onChange={(e) => setInviteWelcomeChannelId(e.currentTarget.value)}
          >
            <For each={textChannels()}>{(c) => <option value={c.id}>#{c.name}</option>}</For>
          </select>
        </label>
        <Show when={inviteWelcomeOpen() && error()}>
          <p class="error" role="alert">
            {error()}
          </p>
        </Show>
      </Dialog>

      <Dialog
        open={inviteOpen()}
        title={t("invite.title")}
        onClose={() => setInviteOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setInviteOpen(false)}>
              {t("common.close")}
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void copied.copy(inviteUrl())}>
              {copied.label()}
            </button>
          </>
        }
      >
        <p class="muted">
          {t("invite.copiedHint")}
        </p>
        <input class="input invite-code" readonly value={inviteUrl()} />
      </Dialog>

      <Dialog
        open={!!confirmDelete()}
        title={
          confirmDelete()?.kind === "server"
            ? t("shell.deleteServerConfirmTitle")
            : t("shell.deleteChannelConfirmTitle")
        }
        onClose={() => setConfirmDelete(null)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
              {t("common.cancel")}
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void confirmDeleteAction()}>
              {t("common.delete")}
            </button>
          </>
        }
      >
        <p>
          {confirmDelete()?.kind === "server"
            ? t("shell.deleteServerConfirmBody")
            : t("shell.deleteChannelConfirmBody")}
        </p>
      </Dialog>

      <ChannelAclPanel
        open={!!aclChannel()}
        channel={aclChannel()}
        onClose={() => setAclChannel(null)}
        onSaved={() => void refetchChannels()}
      />
    </div>
  );
}
