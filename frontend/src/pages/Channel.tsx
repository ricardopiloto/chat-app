import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import {
  ALLOWED_MEDIA_TYPES,
  ApiError,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  api,
  canDeleteMessage,
  deleteMessage,
  listNotifications,
  markChannelRead,
  markNotificationRead,
  uploadAttachment,
  fetchMyChannelMute,
  fetchChannelMentionables,
  type Account,
  type Channel,
  type ChannelMentionable,
  type Message,
  type MyChannelMute,
  type Server,
  type ServerMember,
} from "../api/client";
import type { LiveDeliveryStatus, WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import {
  decryptMessage,
  encryptBytes,
  encryptMessage,
  getServerKey,
} from "../crypto/serverKey";
import LinkPreviews from "../components/LinkPreviews";
import MessageAttachments from "../components/MessageAttachments";
import MessageBody from "../components/MessageBody";
import MentionPicker from "../components/MentionPicker";
import EmojiPicker from "../components/EmojiPicker";
import EmojiSuggest from "../components/EmojiSuggest";
import { IconLockClosed } from "../components/icons/IconLock";
import IconEmoji from "../components/icons/IconEmoji";
import IconPlus from "../components/icons/IconPlus";
import IconReply from "../components/icons/IconReply";
import IconSend from "../components/icons/IconSend";
import IconTrash from "../components/icons/IconTrash";
import IconUsers from "../components/icons/IconUsers";
import type { EmojiEntry } from "../lib/emojiData";
import {
  applyShortcodeSelection,
  filterEmojiCatalog,
  findActiveShortcode,
  insertAtCaret,
  type ActiveShortcode,
} from "../lib/emojiShortcode";
import {
  clipboardFilesFromPaste,
  preparePastedImage,
} from "../media/pasteWebp";
import { toggleMembersPanel, openMembersPanel } from "../shell/AppShell";
import { showToast } from "../ui/toast";
import IdentityAvatar from "../components/IdentityAvatar";
import { t } from "../i18n";
import { errorMessage } from "../lib/apiError";
import { publicDisplayLabel } from "../lib/displayName";
import { keySyncMsg } from "../lib/keySyncCopy";
import {
  buildTimeline,
  formatDayLabel,
  msUntilNextLocalMidnight,
  type MsgGroupItem,
} from "../lib/daySeparators";
import { isHighlightSeen, markHighlightSeen } from "../lib/highlightSeen";
import { mergeNewerMessages } from "../lib/messageCatchUp";
import { dispatchNotifMessageRead } from "../lib/notifSync";
import { clearMessage, sessionPendingMessageIds } from "../preferences/notifications";
import {
  applyMentionSelection,
  filterMentionables,
  findActiveMention,
  resolveMentionAccountIds,
  type ActiveMention,
} from "../lib/mentionParse";

const HIGHLIGHT_MS = 3000;
const SEEK_MAX_PAGES = 5;
const SCROLL_BOTTOM_THRESHOLD = 48;
/** Avoid repeat mark-read API for the same message in this tab (071). */
const notifClearedForMessage = new Set<string>();
const REPLY_PREVIEW_MAX = 80;

type Props = {
  me: Account;
  channel: Channel;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
  deliveryStatus?: LiveDeliveryStatus;
};

type Row = {
  id: string;
  text: string;
  sender: string;
  createdAt?: string;
  attachmentIds: string[];
  replyToMessageId?: string | null;
  mentionedAccountIds: string[];
  replyToSenderAccountId?: string | null;
  system?: boolean;
};

type Pending = {
  localId: string;
  file: File;
  previewUrl: string;
};

async function decodeRows(key: Uint8Array, rows: Message[]): Promise<Row[]> {
  const decoded: Row[] = [];
  for (const row of rows) {
    if (row.kind === "system") {
      decoded.push({
        id: row.id,
        sender: "",
        text: row.content_plaintext ?? "",
        createdAt: row.created_at,
        attachmentIds: [],
        replyToMessageId: null,
        mentionedAccountIds: [],
        replyToSenderAccountId: null,
        system: true,
      });
      continue;
    }
    try {
      decoded.push({
        id: row.id,
        sender: row.sender_account_id ?? "",
        text: await decryptMessage(key, row.content_ciphertext ?? ""),
        createdAt: row.created_at,
        attachmentIds: row.attachment_ids ?? [],
        replyToMessageId: row.reply_to_message_id ?? null,
        mentionedAccountIds: row.mentioned_account_ids ?? [],
        replyToSenderAccountId: row.reply_to_sender_account_id ?? null,
      });
    } catch {
      decoded.push({
        id: row.id,
        sender: row.sender_account_id ?? "",
        text: "[indeterminável]",
        createdAt: row.created_at,
        attachmentIds: row.attachment_ids ?? [],
        replyToMessageId: row.reply_to_message_id ?? null,
        mentionedAccountIds: row.mentioned_account_ids ?? [],
        replyToSenderAccountId: row.reply_to_sender_account_id ?? null,
      });
    }
  }
  return decoded;
}

function mergeOlderRows(older: Row[], current: Row[]): Row[] {
  const seen = new Set(current.map((m) => m.id));
  const extra = older.filter((m) => !seen.has(m.id));
  return extra.length === 0 ? current : [...extra, ...current];
}

function queryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function messageEl(id: string): HTMLElement | null {
  const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id;
  return document.querySelector(`[data-message-id="${escaped}"]`);
}

function waitForMessageEl(id: string, frames = 10): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const tick = (left: number) => {
      const el = messageEl(id);
      if (el) {
        resolve(el);
        return;
      }
      if (left <= 0) {
        resolve(null);
        return;
      }
      requestAnimationFrame(() => tick(left - 1));
    };
    tick(frames);
  });
}

function truncateReply(text: string, max = REPLY_PREVIEW_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

export default function ChannelPage(props: Props) {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = createSignal<Row[]>([]);
  const [draft, setDraft] = createSignal("");
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(true);
  const [sending, setSending] = createSignal(false);
  const [handles, setHandles] = createSignal<
    Record<string, { handle: string; display_name?: string | null; hasAvatar: boolean }>
  >({});
  const [catchUpBusy, setCatchUpBusy] = createSignal(false);
  let sawDeliveryDown = false;

  const deliveryStatus = () => props.deliveryStatus ?? "connected";
  const showDeliveryBanner = () =>
    deliveryStatus() === "reconnecting" ||
    deliveryStatus() === "disconnected" ||
    catchUpBusy();

  function identityOf(accountId: string): {
    handle: string;
    display_name?: string | null;
    hasAvatar: boolean;
  } {
    const known = handles()[accountId];
    if (known) return known;
    // WS message.new / unknown sender: stable initials from the visible id, never an empty circle.
    return { handle: accountId, hasAvatar: false };
  }

  function displayHandle(accountId: string): string {
    const known = handles()[accountId];
    if (!known) return accountId.slice(0, 8);
    return publicDisplayLabel(known.handle, known.display_name);
  }

  function activableMentionHandles(): string[] {
    return Object.values(handles())
      .map((h) => h.handle)
      .filter((h) => h.toLowerCase() !== props.me.handle.toLowerCase());
  }

  function onMentionChipActivate(handle: string) {
    const target = Object.entries(handles()).find(
      ([, v]) => v.handle.toLowerCase() === handle.toLowerCase(),
    );
    if (!target) return;
    const [accountId] = target;
    if (accountId === props.me.id) return;
    openMembersPanel({ accountId });
  }
  const [membersOpen, setMembersOpen] = createSignal(false);
  const [pendingFiles, setPendingFiles] = createSignal<Pending[]>([]);
  const [serverKey, setServerKey] = createSignal<Uint8Array | undefined>();
  const [serverOwnerId, setServerOwnerId] = createSignal("");
  const [historyEpoch, setHistoryEpoch] = createSignal(0);
  const [myMute, setMyMute] = createSignal<MyChannelMute>({ muted: false });
  /** Bumps so Hoje/Ontem recompute after local midnight / focus. */
  const [labelNow, setLabelNow] = createSignal(Date.now());
  const [stickyDayKey, setStickyDayKey] = createSignal<string | null>(null);
  const [stickyVisible, setStickyVisible] = createSignal(false);
  const [replyTarget, setReplyTarget] = createSignal<Row | null>(null);
  const [stuckToBottom, setStuckToBottom] = createSignal(true);
  const [pendingNewCount, setPendingNewCount] = createSignal(0);
  const [seenVersion, setSeenVersion] = createSignal(0);
  const [msgUnavailable, setMsgUnavailable] = createSignal(false);
  const [mentionables, setMentionables] = createSignal<ChannelMentionable[]>([]);
  const [mentionOpen, setMentionOpen] = createSignal(false);
  const [mentionHighlight, setMentionHighlight] = createSignal(0);
  const [activeMention, setActiveMention] = createSignal<ActiveMention | null>(null);
  const [emojiSuggestOpen, setEmojiSuggestOpen] = createSignal(false);
  const [emojiHighlight, setEmojiHighlight] = createSignal(0);
  const [activeShortcode, setActiveShortcode] = createSignal<ActiveShortcode | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = createSignal(false);
  let textScrollEl: HTMLDivElement | undefined;
  let fileInput: HTMLInputElement | undefined;
  let composerInput: HTMLInputElement | undefined;
  let pasteCleanup: (() => void) | undefined;
  let jumpGen = 0;
  let prevJumpKey = "";
  let lastJumped: { channelId: string; messageId: string } | null = null;
  let highlightedEl: HTMLElement | undefined;
  let highlightTimer: number | undefined;
  const canWrite = () => props.channel.my_permission !== "read";
  const composerBlocked = () => canWrite() && myMute().muted;

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    const el = textScrollEl;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  function isNearBottom(el: HTMLDivElement): boolean {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_BOTTOM_THRESHOLD;
  }

  async function catchUpMessages() {
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    const key =
      getServerKey(serverId) ??
      (await ensureServerKey(serverId, props.identity, props.me.id));
    if (!key) return;
    setCatchUpBusy(true);
    try {
      const rows = await api<Message[]>(`/api/channels/${channelId}/messages`);
      const decoded = await decodeRows(key, rows);
      let grew = false;
      setMessages((prev) => {
        const next = mergeNewerMessages(prev, decoded);
        grew = next !== prev;
        return next;
      });
      if (grew && stuckToBottom()) {
        requestAnimationFrame(() => scrollToBottom());
      }
    } catch {
      /* ignore transient */
    } finally {
      setCatchUpBusy(false);
    }
  }

  createEffect(() => {
    const status = deliveryStatus();
    if (status === "reconnecting" || status === "disconnected") {
      sawDeliveryDown = true;
      return;
    }
    if (status === "connected" && sawDeliveryDown && historyEpoch() > 0) {
      sawDeliveryDown = false;
      void catchUpMessages();
    }
  });

  createEffect(() => {
    const channelId = props.channel.id;
    void channelId;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (historyEpoch() <= 0) return;
      void catchUpMessages();
    };
    const onOnline = () => {
      if (historyEpoch() <= 0) return;
      void catchUpMessages();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    onCleanup(() => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    });
  });

  function isHighlightForMe(m: Row): boolean {
    seenVersion();
    const me = props.me.id;
    return (
      (m.mentionedAccountIds.includes(me) || m.replyToSenderAccountId === me) &&
      !isHighlightSeen(m.id)
    );
  }

  function replyParent(m: Row): Row | undefined {
    if (!m.replyToMessageId) return undefined;
    return messages().find((x) => x.id === m.replyToMessageId);
  }

  function replyQuoteSender(m: Row): string {
    const parent = replyParent(m);
    const senderId = parent?.sender ?? m.replyToSenderAccountId;
    return senderId ? displayHandle(senderId) : "…";
  }

  function replyQuoteText(m: Row): string {
    const parent = replyParent(m);
    if (parent?.text) return truncateReply(parent.text);
    return t("channel.msgUnavailable");
  }

  function muteEndsLabel(): string {
    const ends = myMute().ends_at;
    if (!ends) return "";
    try {
      return new Date(ends).toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      });
    } catch {
      return ends;
    }
  }

  async function refreshMute() {
    try {
      const snap = await fetchMyChannelMute(props.channel.id);
      setMyMute(snap);
    } catch {
      setMyMute({ muted: false });
    }
  }

  function clearHighlightTimer() {
    if (highlightTimer !== undefined) {
      window.clearTimeout(highlightTimer);
      highlightTimer = undefined;
    }
  }

  function applyHighlight(el: HTMLElement) {
    const group = el.closest(".msg-group");
    highlightedEl?.classList.remove("msg-highlight");
    clearHighlightTimer();
    if (!(group instanceof HTMLElement)) return;
    highlightedEl = group;
    group.classList.add("msg-highlight");
    highlightTimer = window.setTimeout(() => {
      group.classList.remove("msg-highlight");
      if (highlightedEl === group) highlightedEl = undefined;
      highlightTimer = undefined;
    }, HIGHLIGHT_MS);
  }

  async function focusMessage(id: string, gen: number): Promise<boolean> {
    const el = await waitForMessageEl(id);
    if (gen !== jumpGen) return false;
    if (!el) return false;
    el.scrollIntoView({ block: "center", inline: "nearest" });
    applyHighlight(el);
    return true;
  }

  function tryPushPending(next: Pending[], file: File): string | null {
    if (next.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
      return t("channel.maxAttachments", { n: MAX_ATTACHMENTS_PER_MESSAGE });
    }
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
      return t("channel.attachTypes");
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return t("channel.attachSize");
    }
    next.push({
      localId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    });
    return null;
  }

  function bindPasteTarget(el: HTMLDivElement) {
    pasteCleanup?.();
    const onPaste = (e: ClipboardEvent) => {
      void handlePaste(e);
    };
    el.addEventListener("paste", onPaste);
    pasteCleanup = () => el.removeEventListener("paste", onPaste);
  }

  onCleanup(() => {
    pasteCleanup?.();
    jumpGen += 1;
    clearHighlightTimer();
    highlightedEl?.classList.remove("msg-highlight");
  });

  async function handlePaste(e: ClipboardEvent) {
    if (!canWrite()) return;
    const { images, text } = clipboardFilesFromPaste(e.clipboardData);
    if (images.length === 0) return;

    e.preventDefault();
    setError("");
    const next = [...pendingFiles()];
    let lastErr = "";
    for (const raw of images) {
      try {
        const file = await preparePastedImage(raw);
        const err = tryPushPending(next, file);
        if (err) {
          lastErr = err;
          if (err === t("channel.maxAttachments", { n: MAX_ATTACHMENTS_PER_MESSAGE })) break;
          continue;
        }
      } catch (err) {
        lastErr = errorMessage(err, t("channel.pasteFail"));
      }
    }
    setPendingFiles(next);
    if (text) {
      setDraft((d) => (d ? `${d}${text}` : text));
    }
    if (lastErr) setError(lastErr);
  }

  createEffect(() => {
    props.channel.id;
    setStuckToBottom(true);
    setPendingNewCount(0);
    setReplyTarget(null);
    setMsgUnavailable(false);
  });

  createEffect(() => {
    const me = props.me;
    setHandles((prev) => ({
      ...prev,
      [me.id]: {
        handle: me.handle,
        display_name: me.display_name,
        hasAvatar: !!me.has_avatar,
      },
    }));
  });

  createEffect(() => {
    const serverId = props.channel.server_id;
    let cancelled = false;
    void (async () => {
      try {
        const servers = await api<Server[]>("/api/servers");
        if (cancelled) return;
        const s = servers.find((x) => x.id === serverId);
        setServerOwnerId(s?.owner_account_id ?? "");
      } catch {
        if (!cancelled) setServerOwnerId("");
      }
    })();
    onCleanup(() => {
      cancelled = true;
    });
  });

  createEffect(() => {
    const handler = (e: Event) => {
      const open = (e as CustomEvent<{ open?: boolean }>).detail?.open;
      if (typeof open === "boolean") setMembersOpen(open);
    };
    window.addEventListener("mesa:members-panel-state", handler);
    onCleanup(() => window.removeEventListener("mesa:members-panel-state", handler));
  });

  createEffect(() => {
    const channelId = props.channel.id;
    void refreshMute();
    const onFocus = () => void refreshMute();
    const onMuteEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ channelId?: string }>).detail;
      if (!detail?.channelId || detail.channelId === channelId) void refreshMute();
    };
    const interval = window.setInterval(() => void refreshMute(), 30_000);
    window.addEventListener("focus", onFocus);
    window.addEventListener("mesa:channel-mute", onMuteEvent);
    onCleanup(() => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mesa:channel-mute", onMuteEvent);
    });
  });

  createEffect(() => {
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    const identity = props.identity;
    const accountId = props.me.id;
    let cancelled = false;
    setHistoryEpoch(0);

    async function load() {
      while (!cancelled) {
        const key = await ensureServerKey(serverId, identity, accountId);
        if (cancelled) return;
        if (!key) {
          setPending(true);
          setServerKey(undefined);
          setError(keySyncMsg());
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        setServerKey(key);
        setPending(false);
        setError("");
        try {
          const members = await api<ServerMember[]>(`/api/servers/${serverId}/members`);
          const map: Record<
            string,
            { handle: string; display_name?: string | null; hasAvatar: boolean }
          > = {
            [props.me.id]: {
              handle: props.me.handle,
              display_name: props.me.display_name,
              hasAvatar: !!props.me.has_avatar,
            },
          };
          for (const m of members) {
            map[m.account_id] = {
              handle: m.handle,
              display_name: m.display_name,
              hasAvatar: !!m.has_avatar,
            };
          }
          setHandles(map);
        } catch {
          setHandles({
            [props.me.id]: {
              handle: props.me.handle,
              display_name: props.me.display_name,
              hasAvatar: !!props.me.has_avatar,
            },
          });
        }
        try {
          const mentionList = await fetchChannelMentionables(channelId);
          if (!cancelled) setMentionables(mentionList);
        } catch {
          if (!cancelled) setMentionables([]);
        }
        const rows = await api<Message[]>(`/api/channels/${channelId}/messages`);
        if (cancelled) return;
        const decoded = await decodeRows(key, rows);
        if (cancelled) return;
        setMessages(decoded);
        setHistoryEpoch((n) => n + 1);
        if (stuckToBottom()) {
          requestAnimationFrame(() => scrollToBottom());
        }
        return;
      }
    }

    void load();
    const off = props.onWs(async (msg) => {
      if (msg.event === "key_handoff.completed" && msg.server_id === serverId) {
        void load();
        return;
      }
      if (msg.event === "message.deleted") {
        if (String(msg.payload.channel_id) !== channelId) return;
        const id = String(msg.payload.id);
        setMessages((prev) => prev.filter((m) => m.id !== id));
        return;
      }
      if (msg.event !== "message.new") return;
      if (String(msg.payload.channel_id) !== channelId) return;
      if (String(msg.payload.kind ?? "") === "system") {
        setMessages((prev) => [
          ...prev,
          {
            id: String(msg.payload.id),
            sender: "",
            text: String(msg.payload.content_plaintext ?? ""),
            attachmentIds: [],
            createdAt: msg.payload.created_at ? String(msg.payload.created_at) : undefined,
            replyToMessageId: null,
            mentionedAccountIds: [],
            replyToSenderAccountId: null,
            system: true,
          },
        ]);
        if (stuckToBottom()) {
          requestAnimationFrame(() => scrollToBottom());
        } else {
          setPendingNewCount((n) => n + 1);
        }
        return;
      }
      const key = getServerKey(serverId);
      if (!key) return;
      try {
        const text = await decryptMessage(key, String(msg.payload.content_ciphertext));
        const attachmentIds = stringArray(msg.payload.attachment_ids);
        const mentionedAccountIds = stringArray(msg.payload.mentioned_account_ids);
        const replyToMessageId = msg.payload.reply_to_message_id
          ? String(msg.payload.reply_to_message_id)
          : null;
        const replyToSenderAccountId = msg.payload.reply_to_sender_account_id
          ? String(msg.payload.reply_to_sender_account_id)
          : null;
        const createdAt = msg.payload.created_at ? String(msg.payload.created_at) : undefined;
        setMessages((prev) => [
          ...prev,
          {
            id: String(msg.payload.id),
            sender: String(msg.payload.sender_account_id),
            text,
            attachmentIds,
            createdAt,
            replyToMessageId,
            mentionedAccountIds,
            replyToSenderAccountId,
          },
        ]);
        if (stuckToBottom()) {
          requestAnimationFrame(() => scrollToBottom());
        } else {
          setPendingNewCount((n) => n + 1);
        }
      } catch {
        /* ignore */
      }
    });
    onCleanup(() => {
      cancelled = true;
      off();
    });
  });

  createEffect(() => {
    const messageId =
      queryParam(searchParams.msg) || queryParam(searchParams.message);
    const channelId = props.channel.id;
    const ready = historyEpoch() > 0;
    const key = `${channelId}::${messageId}`;
    if (key !== prevJumpKey) {
      jumpGen += 1;
      prevJumpKey = key;
      setMsgUnavailable(false);
    }
    if (!messageId || !ready) return;
    if (lastJumped?.channelId === channelId && lastJumped.messageId === messageId) {
      return;
    }
    const gen = jumpGen;
    lastJumped = { channelId, messageId };

    void (async () => {
      const found = () => messages().some((m) => m.id === messageId);
      if (found()) {
        const ok = await focusMessage(messageId, gen);
        if (gen !== jumpGen) return;
        if (!ok) {
          setMsgUnavailable(true);
          showToast(t("channel.msgUnavailable"));
        }
        return;
      }

      const key = serverKey();
      if (!key) {
        if (gen === jumpGen) {
          setMsgUnavailable(true);
          showToast(t("channel.msgUnavailable"));
        }
        return;
      }

      for (let i = 0; i < SEEK_MAX_PAGES; i++) {
        if (gen !== jumpGen) return;
        const oldest = messages()[0]?.createdAt;
        if (!oldest) break;
        try {
          const rows = await api<Message[]>(
            `/api/channels/${channelId}/messages?before=${encodeURIComponent(oldest)}`,
          );
          if (gen !== jumpGen) return;
          if (rows.length === 0) break;
          const decoded = await decodeRows(key, rows);
          if (gen !== jumpGen) return;
          setMessages((prev) => mergeOlderRows(decoded, prev));
          if (found()) {
            const ok = await focusMessage(messageId, gen);
            if (gen !== jumpGen) return;
            if (!ok) {
              setMsgUnavailable(true);
              showToast(t("channel.msgUnavailable"));
            }
            return;
          }
        } catch {
          break;
        }
      }

      if (gen !== jumpGen) return;
      setMsgUnavailable(true);
      showToast(t("channel.msgUnavailable"));
    })();
  });

  onCleanup(() => {
    for (const p of pendingFiles()) URL.revokeObjectURL(p.previewUrl);
  });

  function onPickFiles(list: FileList | null) {
    if (!canWrite()) return;
    if (!list?.length) return;
    setError("");
    const next = [...pendingFiles()];
    let lastErr = "";
    for (const file of Array.from(list)) {
      const err = tryPushPending(next, file);
      if (err) {
        lastErr = err;
        if (err === t("channel.maxAttachments", { n: MAX_ATTACHMENTS_PER_MESSAGE })) break;
        continue;
      }
    }
    setPendingFiles(next);
    if (lastErr) setError(lastErr);
    if (fileInput) fileInput.value = "";
  }

  function removePending(localId: string) {
    setPendingFiles((prev) => {
      const victim = prev.find((p) => p.localId === localId);
      if (victim) URL.revokeObjectURL(victim.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }

  function filteredMentions() {
    return filterMentionables(mentionables(), activeMention()?.query ?? "");
  }

  function filteredEmojis() {
    return filterEmojiCatalog(activeShortcode()?.query ?? "");
  }

  function canSend() {
    return draft().trim().length > 0 || pendingFiles().length > 0;
  }

  function syncComposerTokenState(el: HTMLInputElement) {
    const caret = el.selectionStart ?? el.value.length;
    const mention = findActiveMention(el.value, caret);
    const shortcode = findActiveShortcode(el.value, caret);
    // Prefer @ when both could match; otherwise shortcode
    if (mention) {
      const prev = activeMention();
      setActiveMention(mention);
      setMentionOpen(true);
      setEmojiSuggestOpen(false);
      setActiveShortcode(null);
      setEmojiPickerOpen(false);
      if (
        !prev ||
        prev.startIndex !== mention.startIndex ||
        prev.query !== mention.query
      ) {
        setMentionHighlight(0);
      }
      return;
    }
    setMentionOpen(false);
    setActiveMention(null);
    if (shortcode) {
      const prev = activeShortcode();
      setActiveShortcode(shortcode);
      setEmojiSuggestOpen(true);
      setEmojiPickerOpen(false);
      if (
        !prev ||
        prev.startIndex !== shortcode.startIndex ||
        prev.query !== shortcode.query
      ) {
        setEmojiHighlight(0);
      }
      return;
    }
    setEmojiSuggestOpen(false);
    setActiveShortcode(null);
  }

  function selectMention(item: ChannelMentionable) {
    const active = activeMention();
    if (!active) return;
    const { text, caret } = applyMentionSelection(draft(), active, item.handle);
    setDraft(text);
    setMentionOpen(false);
    setActiveMention(null);
    requestAnimationFrame(() => {
      if (!composerInput) return;
      composerInput.focus();
      composerInput.setSelectionRange(caret, caret);
    });
  }

  function selectEmojiShortcode(entry: EmojiEntry) {
    const active = activeShortcode();
    if (!active) return;
    const { text, caret } = applyShortcodeSelection(draft(), active, entry.glyph);
    setDraft(text);
    setEmojiSuggestOpen(false);
    setActiveShortcode(null);
    requestAnimationFrame(() => {
      if (!composerInput) return;
      composerInput.focus();
      composerInput.setSelectionRange(caret, caret);
    });
  }

  function insertEmojiGlyph(entry: EmojiEntry) {
    const el = composerInput;
    const caret = el?.selectionStart ?? draft().length;
    const { text, caret: nextCaret } = insertAtCaret(draft(), caret, entry.glyph);
    setDraft(text);
    setEmojiPickerOpen(false);
    requestAnimationFrame(() => {
      if (!composerInput) return;
      composerInput.focus();
      composerInput.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function onComposerKeyDown(e: KeyboardEvent) {
    if (emojiSuggestOpen()) {
      const items = filteredEmojis();
      if (e.key === "Escape") {
        e.preventDefault();
        setEmojiSuggestOpen(false);
        setActiveShortcode(null);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length === 0) return;
        setEmojiHighlight((i) => (i + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length === 0) return;
        setEmojiHighlight((i) => (i - 1 + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" && items.length > 0) {
        e.preventDefault();
        const item = items[emojiHighlight()] ?? items[0];
        if (item) selectEmojiShortcode(item);
        return;
      }
    }
    if (!mentionOpen()) return;
    const items = filteredMentions();
    if (e.key === "Escape") {
      e.preventDefault();
      setMentionOpen(false);
      setActiveMention(null);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length === 0) return;
      setMentionHighlight((i) => (i + 1) % items.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length === 0) return;
      setMentionHighlight((i) => (i - 1 + items.length) % items.length);
      return;
    }
    if (e.key === "Enter" && items.length > 0) {
      e.preventDefault();
      const item = items[mentionHighlight()] ?? items[0];
      if (item) selectMention(item);
    }
  }

  async function send(e: Event) {
    e.preventDefault();
    if (sending() || !canWrite() || composerBlocked()) return;
    const key = await ensureServerKey(props.channel.server_id, props.identity, props.me.id);
    if (!key) {
      setError(t("channel.keyStillSyncing"));
      return;
    }
    const text = draft().trim();
    const files = pendingFiles();
    if (!text && files.length === 0) return;

    setSending(true);
    setError("");
    try {
      const attachment_ids: string[] = [];
      for (const p of files) {
        const buf = new Uint8Array(await p.file.arrayBuffer());
        const cipher = await encryptBytes(key, buf);
        const meta = await uploadAttachment(props.channel.id, cipher, p.file.type);
        attachment_ids.push(meta.id);
      }
      const content_ciphertext = await encryptMessage(key, text);
      const roster =
        mentionables().length > 0
          ? mentionables()
          : Object.entries(handles())
              .filter(([id]) => id !== props.me.id)
              .map(([account_id, { handle }]) => ({ account_id, handle }));
      const mentioned_account_ids = resolveMentionAccountIds(text, roster, props.me.id);
      const replyId = replyTarget()?.id;
      const body: Record<string, unknown> = {
        content_ciphertext,
        attachment_ids,
        mentioned_account_ids,
      };
      if (replyId) body.reply_to_message_id = replyId;
      await api(`/api/channels/${props.channel.id}/messages`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      void markChannelRead(props.channel.id)
        .then(() => {
          window.dispatchEvent(new CustomEvent("mesa:servers-refresh"));
        })
        .catch(() => {});
      setDraft("");
      setReplyTarget(null);
      for (const p of files) URL.revokeObjectURL(p.previewUrl);
      setPendingFiles([]);
      if (stuckToBottom()) {
        requestAnimationFrame(() => scrollToBottom());
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  async function requestDelete(messageId: string) {
    if (!window.confirm(t("channel.deleteConfirm"))) {
      return;
    }
    setError("");
    try {
      await deleteMessage(props.channel.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return;
      }
      setError(err instanceof ApiError ? err.message : String(err));
    }
  }

  const timeline = () => buildTimeline(messages(), new Date(labelNow()));
  const stickyLabel = () => {
    const key = stickyDayKey();
    return key ? formatDayLabel(key, new Date(labelNow())) : "";
  };

  createEffect(() => {
    labelNow(); // re-schedule when clock bumps
    const delay = msUntilNextLocalMidnight(new Date(labelNow()));
    const timer = window.setTimeout(() => setLabelNow(Date.now()), delay);
    onCleanup(() => window.clearTimeout(timer));
  });

  createEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") setLabelNow(Date.now());
    };
    const onFocus = () => setLabelNow(Date.now());
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    onCleanup(() => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    });
  });

  function updateStickyFromScroll() {
    const root = textScrollEl;
    if (!root) {
      setStickyVisible(false);
      setStickyDayKey(null);
      return;
    }
    if (messages().length === 0) {
      setStickyVisible(false);
      setStickyDayKey(null);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const topY = rootRect.top + 8;
    const seps = Array.from(root.querySelectorAll<HTMLElement>(".day-sep"));
    if (seps.length === 0) {
      setStickyVisible(false);
      setStickyDayKey(null);
      return;
    }

    // Last separator whose top is at or above the scrollport top = day in view.
    let active: HTMLElement | null = null;
    for (const sep of seps) {
      const r = sep.getBoundingClientRect();
      if (r.top <= topY + 4) active = sep;
      else break;
    }
    if (!active) active = seps[0] ?? null;
    const dayKey = active?.dataset.dayKey ?? null;
    setStickyDayKey(dayKey);

    if (!active || !dayKey) {
      setStickyVisible(false);
      return;
    }
    const ar = active.getBoundingClientRect();
    // Hide sticky while matching inline sep is visible near the top (anti-dupe).
    const inlineNearTop =
      ar.bottom > rootRect.top && ar.top < rootRect.top + 56;
    setStickyVisible(!inlineNearTop);
  }

  function onTextScroll() {
    updateStickyFromScroll();
    const root = textScrollEl;
    if (!root) return;
    if (isNearBottom(root)) {
      setStuckToBottom(true);
      setPendingNewCount(0);
    } else {
      setStuckToBottom(false);
    }
  }

  function jumpToPresent() {
    scrollToBottom("smooth");
    setPendingNewCount(0);
    setStuckToBottom(true);
  }

  createEffect(() => {
    // Rebuild observers when timeline / messages change.
    timeline();
    messages();
    labelNow();
    const root = textScrollEl;
    if (!root) return;

    const onScroll = () => onTextScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    // After DOM paints separators
    requestAnimationFrame(() => onTextScroll());

    const seps = () => Array.from(root.querySelectorAll<HTMLElement>(".day-sep"));
    let io: IntersectionObserver | undefined;
    try {
      io = new IntersectionObserver(
        () => updateStickyFromScroll(),
        { root, threshold: [0, 0.01, 1], rootMargin: "0px" },
      );
      for (const el of seps()) io.observe(el);
    } catch {
      /* older browsers: scroll-only */
    }

    onCleanup(() => {
      root.removeEventListener("scroll", onScroll);
      io?.disconnect();
    });
  });

  createEffect(() => {
    messages();
    seenVersion();
    sessionPendingMessageIds(props.channel.id);
    const root = textScrollEl;
    if (!root) return;

    const channelId = props.channel.id;
    const pendingSession = () => sessionPendingMessageIds(channelId);

    const blocksToObserve = () => {
      const pending = pendingSession();
      return Array.from(root.querySelectorAll<HTMLElement>(".msg-block[data-message-id]")).filter(
        (el) => {
          const id = el.dataset.messageId;
          if (!id) return false;
          if (pending.has(id)) return true;
          if (el.classList.contains("msg-highlight-me")) return true;
          return false;
        },
      );
    };

    async function clearNotifsForMessage(messageId: string) {
      if (notifClearedForMessage.has(messageId)) {
        clearMessage(messageId);
        return;
      }
      notifClearedForMessage.add(messageId);
      clearMessage(messageId);
      dispatchNotifMessageRead({ messageId, channelId });
      try {
        const list = await listNotifications({ unreadOnly: true });
        for (const n of list) {
          if (n.message_id === messageId) {
            await markNotificationRead(n.id);
          }
        }
      } catch {
        /* ignore */
      }
    }

    let io: IntersectionObserver | undefined;
    try {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
            const el = entry.target as HTMLElement;
            const id = el.dataset.messageId;
            if (!id) continue;
            void clearNotifsForMessage(id);
            if (el.classList.contains("msg-highlight-me") && !isHighlightSeen(id)) {
              markHighlightSeen(id);
              setSeenVersion((v) => v + 1);
            }
          }
        },
        { root, threshold: 0.5 },
      );
      for (const el of blocksToObserve()) io.observe(el);
    } catch {
      /* older browsers */
    }

    onCleanup(() => io?.disconnect());
  });

  return (
    <div class="pane" ref={(el) => bindPasteTarget(el)}>
      <header class="pane-header">
        <div>
          <div class="pane-title"># {props.channel.name}</div>
          <div class="pane-sub">{t("channel.textVisible")}</div>
        </div>
        <button
          type="button"
          class="pane-icon-btn"
          style={{ "margin-left": "auto" }}
          disabled={!props.channel.server_id}
          aria-expanded={membersOpen()}
          aria-label={t("shell.members")}
          title={t("shell.members")}
          onClick={() => toggleMembersPanel()}
        >
          <IconUsers size={20} />
        </button>
        <span class="e2ee-chip">
          <IconLockClosed size={16} />
          {t("channel.e2eeOn")}
        </span>
      </header>
      <Show when={showDeliveryBanner()}>
        <div class="channel-delivery-banner" role="status">
          {catchUpBusy() && deliveryStatus() === "connected"
            ? t("channel.deliveryCatchUp")
            : t("channel.deliveryBanner")}
        </div>
      </Show>
      <div
        class="text-scroll"
        ref={(el) => {
          textScrollEl = el;
        }}
      >
        <div class="day-sep-sticky-host" aria-hidden="true">
          <Show when={stickyVisible() && stickyLabel()}>
            <div class="day-sep-sticky">
              <span class="day-sep-sticky-label">{stickyLabel()}</span>
            </div>
          </Show>
        </div>
        <div class="text-scroll-body">
          <For each={timeline()}>
            {(item) => {
              if (item.kind === "day-separator") {
                return (
                  <div
                    class="day-sep"
                    role="separator"
                    aria-label={item.label}
                    data-day-key={item.dayKey}
                  >
                    <span class="day-sep-line" aria-hidden="true" />
                    <span class="day-sep-label">{item.label}</span>
                    <span class="day-sep-line" aria-hidden="true" />
                  </div>
                );
              }
              if (item.kind === "system") {
                return (
                  <div class="msg-system" data-message-id={item.item.id} role="status">
                    {item.item.text}
                  </div>
                );
              }
              const g = item as MsgGroupItem<Row>;
              return (
                <div class="text-measure">
                <div class="msg-group">
                  <IdentityAvatar
                    class="msg-avatar"
                    accountId={g.sender}
                    handle={displayHandle(g.sender)}
                    hasAvatar={identityOf(g.sender).hasAvatar}
                  />
                  <div class="msg-content">
                    <div class="msg-meta">
                      {displayHandle(g.sender)}
                      <Show when={g.items[0]?.createdAt}>
                        {(createdAt) => (
                          <span class="msg-time">
                            {new Date(createdAt()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </Show>
                    </div>
                    <For each={g.items}>
                      {(m) => (
                        <div
                          class="msg-block"
                          classList={{ "msg-highlight-me": isHighlightForMe(m) }}
                          tabindex={0}
                          data-message-id={m.id}
                        >
                          <Show when={canWrite() && !composerBlocked()}>
                            <button
                              type="button"
                              class="btn msg-reply-btn"
                              title={t("channel.reply")}
                              aria-label={t("channel.reply")}
                              onClick={() => setReplyTarget(m)}
                            >
                              <IconReply />
                            </button>
                          </Show>
                          <Show
                            when={canDeleteMessage(
                              props.me.id,
                              m.sender,
                              props.channel.created_by_account_id,
                              serverOwnerId(),
                            )}
                          >
                            <button
                              type="button"
                              class="btn msg-delete"
                              title={t("common.delete")}
                              aria-label={t("channel.deleteMessage")}
                              onClick={() => void requestDelete(m.id)}
                            >
                              <IconTrash />
                            </button>
                          </Show>
                          <Show when={m.replyToMessageId}>
                            <div class="msg-reply-quote">
                              <span class="msg-reply-quote-author">{replyQuoteSender(m)}</span>
                              {" · "}
                              {replyQuoteText(m)}
                            </div>
                          </Show>
                          <Show when={m.text}>
                            <MessageBody
                              text={m.text}
                              meHandle={props.me.handle}
                              activableHandles={activableMentionHandles()}
                              onMentionActivate={onMentionChipActivate}
                            />
                          </Show>
                          <Show when={m.attachmentIds.length > 0}>
                            <MessageAttachments
                              attachmentIds={m.attachmentIds}
                              serverKey={serverKey()}
                            />
                          </Show>
                          <Show when={m.text}>
                            <LinkPreviews text={m.text} />
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>
      <Show when={msgUnavailable()}>
        <div class="msg-unavailable-banner" role="status">
          {t("channel.msgUnavailable")}
        </div>
      </Show>
      <Show
        when={canWrite()}
        fallback={<p class="muted composer-read-only">{t("channel.readOnly")}</p>}
      >
        <Show
          when={!composerBlocked()}
          fallback={
            <p class="muted composer-muted-banner">
              {t("channel.mutedBanner", { when: muteEndsLabel() || "…" })}
            </p>
          }
        >
        <div class="composer-dock">
        <Show when={pendingFiles().length > 0}>
          <div class="composer-pending">
            <For each={pendingFiles()}>
              {(p) => (
                <div class="composer-pending-item">
                  <img src={p.previewUrl} alt={p.file.name} />
                  <button
                    type="button"
                    class="btn btn-ghost"
                    aria-label={t("channel.removeAttachment", { name: p.file.name })}
                    onClick={() => removePending(p.localId)}
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>
        <div class="composer-stack">
          <Show when={!stuckToBottom() && pendingNewCount() > 0}>
            <button
              type="button"
              class="btn jump-to-present"
              onClick={() => jumpToPresent()}
            >
              {pendingNewCount() > 1
                ? t("channel.jumpPresentN", { n: pendingNewCount() })
                : t("channel.jumpPresent")}
            </button>
          </Show>
          <Show when={replyTarget()}>
            {(target) => (
              <div class="composer-reply">
                <IconReply size={14} aria-hidden="true" />
                <span class="composer-reply-label">
                  {t("channel.replyingTo")} <strong>{displayHandle(target().sender)}</strong>
                  {target().text ? `: ${truncateReply(target().text)}` : ""}
                </span>
                <button
                  type="button"
                  class="btn btn-ghost composer-reply-cancel"
                  aria-label={t("channel.cancelReply")}
                  onClick={() => setReplyTarget(null)}
                >
                  ×
                </button>
              </div>
            )}
          </Show>
        <form class="composer" onSubmit={(e) => void send(e)}>
          <input
            ref={(el) => {
              fileInput = el;
            }}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => onPickFiles(e.currentTarget.files)}
          />
          <div class="composer-input-wrap">
            <Show when={mentionOpen()}>
              <MentionPicker
                items={filteredMentions()}
                highlightIndex={mentionHighlight()}
                empty={filteredMentions().length === 0}
                onSelect={selectMention}
                onHighlight={setMentionHighlight}
              />
            </Show>
            <Show when={emojiSuggestOpen()}>
              <EmojiSuggest
                items={filteredEmojis()}
                highlightIndex={emojiHighlight()}
                empty={filteredEmojis().length === 0}
                onSelect={selectEmojiShortcode}
                onHighlight={setEmojiHighlight}
              />
            </Show>
            <Show when={emojiPickerOpen()}>
              <EmojiPicker
                onSelect={insertEmojiGlyph}
                onClose={() => setEmojiPickerOpen(false)}
              />
            </Show>
            <button
              type="button"
              class="composer-icon-btn composer-attach-btn"
              disabled={pending() || pendingFiles().length >= MAX_ATTACHMENTS_PER_MESSAGE}
              aria-label={t("channel.attachImage")}
              onClick={() => fileInput?.click()}
            >
              <IconPlus size={18} title={t("channel.attachImage")} />
            </button>
            <input
              ref={(el) => {
                composerInput = el;
              }}
              class="input composer-text-input"
              value={draft()}
              onInput={(e) => {
                setDraft(e.currentTarget.value);
                syncComposerTokenState(e.currentTarget);
              }}
              onClick={(e) => syncComposerTokenState(e.currentTarget)}
              onKeyUp={(e) => syncComposerTokenState(e.currentTarget)}
              onKeyDown={onComposerKeyDown}
              onBlur={() => {
                window.setTimeout(() => {
                  setMentionOpen(false);
                  setEmojiSuggestOpen(false);
                }, 150);
              }}
              placeholder={t("channel.placeholder")}
              autocomplete="off"
            />
            <div class="composer-trailing">
              <button
                type="button"
                class="composer-icon-btn"
                aria-label={t("channel.emoji")}
                aria-expanded={emojiPickerOpen()}
                onClick={() => {
                  setEmojiPickerOpen((v) => !v);
                  setEmojiSuggestOpen(false);
                  setMentionOpen(false);
                }}
              >
                <IconEmoji size={18} title={t("channel.emoji")} />
              </button>
              <button
                type="submit"
                class="composer-icon-btn composer-send-btn"
                aria-label={t("channel.send")}
                disabled={pending() || sending() || !canSend()}
              >
                <IconSend size={18} title={t("channel.send")} />
              </button>
            </div>
          </div>
        </form>
        </div>
        </div>
        </Show>
      </Show>
      <p class="error" style={{ padding: "0 24px 8px" }}>
        {error()}
      </p>
    </div>
  );
}
