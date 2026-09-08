import { For, Show, createEffect, createResource, createSignal, onCleanup } from "solid-js";
import { A, useLocation, useNavigate, useParams } from "@solidjs/router";
import {
  ApiError,
  api,
  createChannel as createChannelRequest,
  deleteChannel,
  deleteServer,
  fetchServerRoles,
  fetchVoiceOccupancy,
  formatCallDuration,
  patchChannel,
  type Account,
  type Channel,
  type CreateServerResult,
  type Invite,
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
    const t = window.setInterval(() => setClock(Date.now()), 1000);
    onCleanup(() => window.clearInterval(t));
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
      setError("Confirme que guardou a chave do canal de voz.");
      return;
    }
    try {
      const result = await api<CreateServerResult>("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          name: serverName().trim() || "Novo servidor",
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
      setError("Confirme que guardou a chave do canal.");
      return;
    }
    const rawName = channelName().trim()
      ? channelName()
      : channelType() === "text"
        ? "geral"
        : "mesa";
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

  async function createInvite(includeHistory: boolean) {
    const server = selected();
    if (!server) return;
    setError("");
    try {
      const inv = await api<Invite>(`/api/servers/${server.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ include_history: includeHistory }),
      });
      const url = `${location.origin}/invite/${inv.code}`;
      setInviteUrl(url);
      await copied.copy(url);
      setInviteOpen(true);
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
        setError("Sem permissão para renomear este canal.");
      } else {
        setError(errorMessage(err) || "Não foi possível renomear o canal.");
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
          aria-label="Novo nome do canal"
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
          aria-label="Emoji"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setRenameEmojiOpen((v) => !v)}
        >
          <IconEmoji size={16} title="Emoji" />
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
          label: "Permissões do canal",
          onSelect: () => setAclChannel(c),
        },
        {
          label: "Apagar canal",
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
            ? err.message || "Não pode apagar o último canal deste tipo."
            : "Não pode apagar o último canal do servidor.",
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
        <button
          type="button"
          class="channels-peek"
          tabindex={props.channelsListExpanded || props.settingsMode ? -1 : 0}
          aria-hidden={!!props.channelsListExpanded || !!props.settingsMode}
          aria-label="Mostrar canais"
          title="Mostrar canais"
          onClick={() => props.onExpandChannels?.()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              props.onExpandChannels?.();
            }
          }}
        />
        <div class="sidebar-header sidebar-header-static">
          <div class="sidebar-server-heading">
            <Show
              when={selected() && canOpenServerSettings()}
              fallback={
                <span class="sidebar-server-name">{selected()?.name ?? "Sem servidor"}</span>
              }
            >
              <button
                type="button"
                class="sidebar-server-name-btn"
                aria-label={`Configurações de ${selected()?.name ?? "servidor"}`}
                onClick={() => openServerSettings()}
              >
                <span class="sidebar-server-name">{selected()?.name}</span>
              </button>
            </Show>
            <Show when={selected() && canOpenServerSettings()}>
              <button
                type="button"
                class="pane-icon-btn sidebar-settings-btn"
                aria-label="Configurações do servidor"
                title="Configurações do servidor"
                onClick={() => openServerSettings()}
              >
                <IconSettings size={18} title="Configurações do servidor" />
              </button>
            </Show>
          </div>
          <Show when={selected() && canCreateInvites()}>
            <button
              type="button"
              class="pane-icon-btn sidebar-invite-btn"
              aria-label="Convite"
              title="Convite"
              onClick={() => void createInvite(false)}
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
              <div class="sidebar-section">Texto</div>
              <Show when={canCreateChannels()}>
                <button
                  type="button"
                  class="sidebar-section-plus"
                  aria-label="Criar canal de texto"
                  title="Criar canal de texto"
                  onClick={() => openCreateChannel("text")}
                >
                  <IconPlus title="Criar canal de texto" size={18} />
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
                          <IconLockClosed size={14} title="Canal privado" />
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
                        <IconLockClosed size={14} title="Canal privado" />
                      </span>
                    </Show>
                  </div>
                </Show>
              )}
            </For>

            <div class="sidebar-section-row">
              <div class="sidebar-section">Voz e vídeo</div>
              <Show when={canCreateChannels()}>
                <button
                  type="button"
                  class="sidebar-section-plus"
                  aria-label="Criar canal de voz e vídeo"
                  title="Criar canal de voz e vídeo"
                  onClick={() => openCreateChannel("voice_video")}
                >
                  <IconPlus title="Criar canal de voz e vídeo" size={18} />
                </button>
              </Show>
            </div>
            <For each={voiceChannels()}>
              {(c) => {
                const started = () => callStartedAt(c.id);
                const names = () => transmitting(c.id);
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
                      <span class="prefix channel-icon" aria-hidden="true">
                        <IconVoiceChannel size={18} />
                      </span>
                      {channelNameLabel(c, "voice-channel-name channel-name")}
                      <Show when={timer()}>
                        {(t) => (
                          <span class="voice-call-timer" aria-label={`Duração da chamada ${t()}`}>
                            {t()}
                          </span>
                        )}
                      </Show>
                      <Show when={c.visibility === "private"}>
                        <span class="channel-lock" aria-hidden="true">
                          <IconLockClosed size={14} title="Canal privado" />
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
                        <IconLockClosed size={14} title="Canal privado" />
                      </span>
                    </Show>
                  </div>
                </Show>
                <Show when={names().length > 0}>
                  <ul class="voice-roster" aria-label={`Na chamada ${c.name}`}>
                    <For each={names()}>
                      {(o) => {
                        const speaking = () => {
                          if (!voice.live() || voice.channelId() !== c.id) return false;
                          if (!o.mic_on) return false;
                          if (o.account_id === props.me.id && !voice.micOn()) return false;
                          return voice.speakingAccountIds().has(o.account_id);
                        };
                        const rowLabel = () =>
                          speaking() ? `${o.handle}, a falar` : o.handle;
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
                                    <IconMicOff size={14} title="Microfone desligado" />
                                  }
                                >
                                  <IconMicOn size={14} title="Microfone ligado" />
                                </Show>
                              </span>
                              <span
                                class="voice-roster-media-icon"
                                classList={{ "is-speaking": speaking() }}
                              >
                                <IconHeadphones size={14} title="A ouvir" />
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
        <Show when={!props.settingsMode}>
          <button
            type="button"
            class="sidebar-channels-toggle"
            aria-expanded={!!props.channelsListExpanded}
            aria-label={
              props.channelsListExpanded ? "Ocultar canais" : "Mostrar canais"
            }
            title={props.channelsListExpanded ? "Ocultar canais" : "Mostrar canais"}
            onClick={() => {
              if (props.channelsListExpanded) props.onToggleChannels?.();
              else props.onExpandChannels?.();
            }}
          >
            <span class="sidebar-channels-toggle-label">
              {props.channelsListExpanded ? "ocultar canais" : "mostrar canais"}
            </span>
          </button>
        </Show>
      </aside>

      <UserPanel
        me={props.me}
        onLogout={props.onLogout}
        onAccountPatch={props.onAccountPatch}
      />

      <ContextMenu menu={menu()} onClose={() => setMenu(null)} />

      <Dialog
        open={createServerOpen()}
        title="Criar servidor"
        onClose={() => setCreateServerOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setCreateServerOpen(false)}>
              Cancelar
            </button>
            <button
              type="submit"
              form="create-server-form"
              class="btn btn-primary"
              disabled={!serverCustodyAck()}
            >
              Criar
            </button>
          </>
        }
      >
        <form id="create-server-form" onSubmit={createServer}>
          <div class="field">
            <label for="server-name">Nome</label>
            <input
              id="server-name"
              class="input"
              value={serverName()}
              onInput={(e) => setServerName(e.currentTarget.value)}
              placeholder="Mesa do Porão"
            />
          </div>
          <Show when={serverPendingKey()}>
            {(key) => (
              <div class="custody-block">
                <p class="muted">
                  O servidor nasce com um canal de voz. Guarde a chave de mídia — sem ela não
                  consegue religar E2EE após gravar.
                </p>
                <div class="row" style={{ gap: "8px", "align-items": "center" }}>
                  <code class="key-display">{channelKeyDisplay(key())}</code>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => void serverKeyCopied.copy(channelKeyDisplay(key()))}
                  >
                    {serverKeyCopied.label() === "Copiar" ? "Copiar chave" : serverKeyCopied.label()}
                  </button>
                </div>
                <label class="check-line">
                  <input
                    type="checkbox"
                    checked={serverCustodyAck()}
                    onChange={(e) => setServerCustodyAck(e.currentTarget.checked)}
                  />
                  Salvei a chave deste canal num sítio seguro
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
        title={channelType() === "text" ? "Criar canal de texto" : "Criar canal de voz e vídeo"}
        onClose={() => setCreateChannelOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setCreateChannelOpen(false)}>
              Cancelar
            </button>
            <button
              type="submit"
              form="create-channel-form"
              class="btn btn-primary"
              disabled={channelType() === "voice_video" && !custodyAck()}
            >
              Criar
            </button>
          </>
        }
      >
        <form id="create-channel-form" onSubmit={createChannel}>
          <div class="field">
            <label for="channel-name">Nome</label>
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
                placeholder={channelType() === "text" ? "geral" : "mesa"}
              />
              <button
                type="button"
                class="composer-icon-btn channel-name-emoji-btn"
                aria-label="Emoji"
                onClick={() => setCreateEmojiOpen((v) => !v)}
              >
                <IconEmoji size={16} title="Emoji" />
              </button>
            </div>
          </div>
          <div class="field">
            <label>Visibilidade</label>
            <div class="row" style={{ gap: "16px" }}>
              <label class="check-line">
                <input
                  type="radio"
                  name="create-channel-visibility"
                  checked={channelVisibility() === "public"}
                  onChange={() => setChannelVisibility("public")}
                />
                Público
              </label>
              <label class="check-line">
                <input
                  type="radio"
                  name="create-channel-visibility"
                  checked={channelVisibility() === "private"}
                  onChange={() => setChannelVisibility("private")}
                />
                Privado
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
              Visível a novos membros
            </label>
          </Show>
          <Show when={channelType() === "voice_video" && pendingKey()}>
            {(key) => (
              <div class="custody-block">
                <p class="muted">
                  Guarde a chave de mídia deste canal. Sem ela não consegue religar E2EE após gravar.
                </p>
                <div class="row" style={{ gap: "8px", "align-items": "center" }}>
                  <code class="key-display">{channelKeyDisplay(key())}</code>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => void keyCopied.copy(channelKeyDisplay(key()))}
                  >
                    {keyCopied.label() === "Copiar" ? "Copiar chave" : keyCopied.label()}
                  </button>
                </div>
                <label class="check-line">
                  <input
                    type="checkbox"
                    checked={custodyAck()}
                    onChange={(e) => setCustodyAck(e.currentTarget.checked)}
                  />
                  Salvei a chave deste canal num sítio seguro
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
        open={inviteOpen()}
        title="Convite"
        onClose={() => setInviteOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setInviteOpen(false)}>
              Fechar
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void copied.copy(inviteUrl())}>
              {copied.label()}
            </button>
          </>
        }
      >
        <p class="muted">
          Ligação copiada para a área de transferência quando possível. Válido 5 minutos · até 10
          entradas.
        </p>
        <input class="input invite-code" readonly value={inviteUrl()} />
      </Dialog>

      <Dialog
        open={!!confirmDelete()}
        title={confirmDelete()?.kind === "server" ? "Apagar servidor?" : "Apagar canal?"}
        onClose={() => setConfirmDelete(null)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void confirmDeleteAction()}>
              Apagar
            </button>
          </>
        }
      >
        <p>
          {confirmDelete()?.kind === "server"
            ? "Isto remove o servidor, canais e histórico. Não há recuperação."
            : "Isto remove o canal e o histórico. Quem estiver em chamada será desligado."}
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
