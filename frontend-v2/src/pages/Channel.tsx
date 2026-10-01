import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";
import {
  ALLOWED_MEDIA_TYPES,
  ApiError,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  api,
  canDeleteMessage,
  deleteMessage,
  fetchChannelMentionables,
  fetchMyChannelMute,
  listNotifications,
  markChannelRead,
  markNotificationRead,
  uploadAttachment,
  type Account,
  type Channel,
  type ChannelMentionable,
  type Message,
  type MyChannelMute,
  type Server,
  type ServerMember,
  type ServerRole,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { Avatar, Button, Dialog } from "../components/ui";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import {
  decryptMessage,
  encryptBytes,
  encryptMessage,
  getServerKey,
} from "../crypto/serverKey";
import { Attachments } from "../chat/Attachments";
import { LinkPreviews } from "../chat/LinkPreviews";
import { MessageBody } from "../chat/MessageBody";
import { EmojiPicker, EmojiSuggest, MentionPicker } from "../chat/Pickers";
import { t } from "../i18n";
import { buildTimeline, msUntilNextLocalMidnight } from "../lib/daySeparators";
import { publicDisplayLabel } from "../lib/displayName";
import type { EmojiEntry } from "../lib/emojiData";
import {
  applyShortcodeSelection,
  filterEmojiCatalog,
  findActiveShortcode,
  insertAtCaret,
  type ActiveShortcode,
} from "../lib/emojiShortcode";
import { memberHasCapability } from "../lib/capabilities";
import { errorText } from "../lib/errors";
import { isHighlightSeen, markHighlightSeen } from "../lib/highlightSeen";
import { mergeNewerMessages } from "../lib/messageCatchUp";
import {
  applyMentionSelection,
  filterMentionables,
  findActiveMention,
  resolveMentionAccountIds,
  type ActiveMention,
} from "../lib/mentionParse";
import { dispatchNotifMessageRead } from "../lib/notifSync";
import {
  clipboardFilesFromPaste,
  preparePastedImage,
} from "../media/pasteWebp";
import {
  clearMessage,
  sessionPendingMessageIds,
} from "../preferences/notifications";

const SCROLL_BOTTOM_THRESHOLD = 48;
const SEEK_MAX_PAGES = 5;
const HIGHLIGHT_MS = 3000;
const REPLY_PREVIEW_MAX = 80;

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

type Pending = { localId: string; file: File; previewUrl: string };
type Person = {
  handle: string;
  display_name?: string | null;
  hasAvatar: boolean;
};

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];
const truncate = (text: string, max = REPLY_PREVIEW_MAX) =>
  text.trim().length <= max ? text.trim() : `${text.trim().slice(0, max - 1)}…`;

async function toRow(key: Uint8Array | undefined, row: Message): Promise<Row> {
  const base = {
    id: row.id,
    createdAt: row.created_at,
    attachmentIds: row.attachment_ids ?? [],
    replyToMessageId: row.reply_to_message_id ?? null,
    mentionedAccountIds: row.mentioned_account_ids ?? [],
    replyToSenderAccountId: row.reply_to_sender_account_id ?? null,
  };
  if (row.kind === "system")
    return {
      ...base,
      sender: "",
      text: row.content_plaintext ?? "",
      attachmentIds: [],
      system: true,
    };
  try {
    return {
      ...base,
      sender: row.sender_account_id ?? "",
      text: await decryptMessage(key!, row.content_ciphertext ?? ""),
    };
  } catch {
    return {
      ...base,
      sender: row.sender_account_id ?? "",
      text: t("chat.undecryptable"),
    };
  }
}

const decodeRows = (key: Uint8Array, rows: Message[]) =>
  Promise.all(rows.map((row) => toRow(key, row)));

function mergeOlder(older: Row[], current: Row[]): Row[] {
  const seen = new Set(current.map((m) => m.id));
  const extra = older.filter((m) => !seen.has(m.id));
  return extra.length === 0 ? current : [...extra, ...current];
}

function messageEl(id: string): HTMLElement | null {
  return document.querySelector(`[data-message-id="${CSS.escape(id)}"]`);
}

function waitForMessageEl(
  id: string,
  frames = 10,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const tick = (left: number) => {
      const el = messageEl(id);
      if (el || left <= 0) return resolve(el);
      requestAnimationFrame(() => tick(left - 1));
    };
    tick(frames);
  });
}

export function ChannelPage(props: {
  me: Account;
  channel: Channel;
  identity: Identity;
  server?: Server;
  roles: ServerRole[];
  subscribe: (handler: (msg: WsEnvelope) => void) => () => void;
  focusMessageId?: string | null;
}) {
  const [messages, setMessages] = createSignal<Row[]>([]);
  const [draft, setDraft] = createSignal("");
  const [error, setError] = createSignal("");
  const [keyPending, setKeyPending] = createSignal(true);
  const [sending, setSending] = createSignal(false);
  const [people, setPeople] = createSignal<Record<string, Person>>({});
  const [serverKey, setServerKey] = createSignal<Uint8Array | undefined>();
  const [historyEpoch, setHistoryEpoch] = createSignal(0);
  const [myMute, setMyMute] = createSignal<MyChannelMute>({ muted: false });
  const [now, setNow] = createSignal(Date.now());
  const [replyTarget, setReplyTarget] = createSignal<Row | null>(null);
  const [stuck, setStuck] = createSignal(true);
  const [newCount, setNewCount] = createSignal(0);
  const [pendingFiles, setPendingFiles] = createSignal<Pending[]>([]);
  const [mentionables, setMentionables] = createSignal<ChannelMentionable[]>(
    [],
  );
  const [activeMention, setActiveMention] = createSignal<ActiveMention | null>(
    null,
  );
  const [mentionHighlight, setMentionHighlight] = createSignal(0);
  const [activeShortcode, setActiveShortcode] =
    createSignal<ActiveShortcode | null>(null);
  const [emojiHighlight, setEmojiHighlight] = createSignal(0);
  const [emojiPickerOpen, setEmojiPickerOpen] = createSignal(false);
  const [deleteTarget, setDeleteTarget] = createSignal<Row | null>(null);
  const [memberCard, setMemberCard] = createSignal<string | null>(null);
  const [unavailable, setUnavailable] = createSignal(false);
  const [notifIds, setNotifIds] = createSignal<Set<string>>(new Set());
  const [seenVersion, setSeenVersion] = createSignal(0);
  let scrollEl: HTMLDivElement | undefined;
  let fileInput: HTMLInputElement | undefined;
  let composerInput: HTMLInputElement | undefined;
  let highlighted: HTMLElement | undefined;
  let highlightTimer: number | undefined;
  let jumpGen = 0;
  let lastJumped = "";

  const canWrite = () => props.channel.my_permission !== "read";
  const muted = () => canWrite() && myMute().muted;
  const person = (id: string): Person =>
    people()[id] ?? { handle: id.slice(0, 8), hasAvatar: false };
  const label = (id: string) =>
    publicDisplayLabel(person(id).handle, person(id).display_name);
  const activableHandles = () =>
    Object.entries(people())
      .filter(([id]) => id !== props.me.id)
      .map(([, p]) => p.handle);
  const mayDelete = (row: Row) =>
    canDeleteMessage(
      props.me.id,
      row.sender,
      props.channel.created_by_account_id,
      props.server?.owner_account_id ?? "",
    ) || memberHasCapability(props.roles, props.me.id, "can_delete_messages");

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior });
  }
  const nearBottom = (el: HTMLElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_BOTTOM_THRESHOLD;
  function onScroll() {
    if (!scrollEl) return;
    if (nearBottom(scrollEl)) {
      setStuck(true);
      setNewCount(0);
    } else setStuck(false);
  }
  function afterNewMessage() {
    if (stuck()) requestAnimationFrame(() => scrollToBottom());
    else setNewCount((n) => n + 1);
  }
  function jumpToPresent() {
    scrollToBottom("smooth");
    setNewCount(0);
    setStuck(true);
  }

  async function refreshMute() {
    try {
      setMyMute(await fetchMyChannelMute(props.channel.id));
    } catch {
      setMyMute({ muted: false });
    }
  }
  const muteUntil = () => {
    const ends = myMute().ends_at;
    if (!ends) return "";
    return new Date(ends).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  async function catchUp() {
    const key = getServerKey(props.channel.server_id);
    if (!key) return;
    try {
      const decoded = await decodeRows(
        key,
        await api<Message[]>(`/api/channels/${props.channel.id}/messages`),
      );
      let grew = false;
      setMessages((prev) => {
        const next = mergeNewerMessages(prev, decoded);
        grew = next !== prev;
        return next;
      });
      if (grew && stuck()) requestAnimationFrame(() => scrollToBottom());
    } catch {
      /* transient */
    }
  }

  createEffect(() => {
    void props.channel.id;
    setStuck(true);
    setNewCount(0);
    setReplyTarget(null);
    setUnavailable(false);
    setDraft("");
    void refreshMute();
    const interval = window.setInterval(() => void refreshMute(), 30_000);
    const onMute = (e: Event) => {
      const detail = (e as CustomEvent<{ channelId?: string }>).detail;
      if (!detail?.channelId || detail.channelId === props.channel.id)
        void refreshMute();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && historyEpoch() > 0)
        void catchUp();
    };
    window.addEventListener("mesa:channel-mute", onMute);
    document.addEventListener("visibilitychange", onVisible);
    onCleanup(() => {
      window.clearInterval(interval);
      window.removeEventListener("mesa:channel-mute", onMute);
      document.removeEventListener("visibilitychange", onVisible);
    });
  });

  createEffect(() => {
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    let cancelled = false;
    setHistoryEpoch(0);
    setMessages([]);

    async function load() {
      while (!cancelled) {
        const key = await ensureServerKey(
          serverId,
          props.identity,
          props.me.id,
        );
        if (cancelled) return;
        if (!key) {
          setKeyPending(true);
          setServerKey(undefined);
          setError(t("chat.keySyncing"));
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        setServerKey(key);
        setKeyPending(false);
        setError("");
        const me: Person = {
          handle: props.me.handle,
          display_name: props.me.display_name,
          hasAvatar: !!props.me.has_avatar,
        };
        try {
          const members = await api<ServerMember[]>(
            `/api/servers/${serverId}/members`,
          );
          const map: Record<string, Person> = { [props.me.id]: me };
          for (const m of members)
            map[m.account_id] = {
              handle: m.handle,
              display_name: m.display_name,
              hasAvatar: !!m.has_avatar,
            };
          setPeople(map);
        } catch {
          setPeople({ [props.me.id]: me });
        }
        try {
          const list = await fetchChannelMentionables(channelId);
          if (!cancelled) setMentionables(list);
        } catch {
          if (!cancelled) setMentionables([]);
        }
        const rows = await api<Message[]>(
          `/api/channels/${channelId}/messages`,
        );
        if (cancelled) return;
        setMessages(await decodeRows(key, rows));
        setHistoryEpoch((n) => n + 1);
        requestAnimationFrame(() => scrollToBottom());
        void markChannelRead(channelId)
          .then(() =>
            window.dispatchEvent(new CustomEvent("mesa:servers-refresh")),
          )
          .catch(() => undefined);
        void listNotifications({ unreadOnly: true })
          .then((list) => {
            if (!cancelled)
              setNotifIds(
                new Set(
                  list
                    .filter((n) => n.channel_id === channelId && n.message_id)
                    .map((n) => n.message_id!),
                ),
              );
          })
          .catch(() => undefined);
        return;
      }
    }
    void load();

    const off = props.subscribe(async (msg) => {
      if (msg.event === "key_handoff.completed" && msg.server_id === serverId)
        return void load();
      if (
        msg.event === "message.deleted" &&
        String(msg.payload.channel_id) === channelId
      ) {
        const id = String(msg.payload.id);
        setMessages((prev) => prev.filter((m) => m.id !== id));
        return;
      }
      if (
        msg.event === "notification.created" &&
        String(msg.payload.channel_id) === channelId &&
        msg.payload.message_id
      ) {
        const id = String(msg.payload.message_id);
        setNotifIds((prev) => new Set(prev).add(id));
        return;
      }
      if (
        msg.event !== "message.new" ||
        String(msg.payload.channel_id) !== channelId
      )
        return;
      const payload = msg.payload;
      const id = String(payload.id);
      if (String(payload.kind ?? "") === "system") {
        setMessages((prev) =>
          mergeNewerMessages(prev, [
            {
              id,
              sender: "",
              text: String(payload.content_plaintext ?? ""),
              createdAt: payload.created_at
                ? String(payload.created_at)
                : undefined,
              attachmentIds: [],
              mentionedAccountIds: [],
              system: true,
            },
          ]),
        );
        afterNewMessage();
        return;
      }
      const key = getServerKey(serverId);
      if (!key) return;
      try {
        const row: Row = {
          id,
          sender: String(payload.sender_account_id),
          text: await decryptMessage(key, String(payload.content_ciphertext)),
          attachmentIds: stringArray(payload.attachment_ids),
          createdAt: payload.created_at
            ? String(payload.created_at)
            : undefined,
          replyToMessageId: payload.reply_to_message_id
            ? String(payload.reply_to_message_id)
            : null,
          mentionedAccountIds: stringArray(payload.mentioned_account_ids),
          replyToSenderAccountId: payload.reply_to_sender_account_id
            ? String(payload.reply_to_sender_account_id)
            : null,
        };
        setMessages((prev) =>
          prev.some((m) => m.id === id) ? prev : [...prev, row],
        );
        afterNewMessage();
      } catch {
        /* undecryptable live message */
      }
    });
    onCleanup(() => {
      cancelled = true;
      off();
    });
  });

  // Deep link: scroll to ?msg=, paging back through older history when it is not loaded yet.
  function applyHighlight(el: HTMLElement) {
    const target = el.closest(".msg-group");
    highlighted?.classList.remove("msg-highlight");
    window.clearTimeout(highlightTimer);
    if (!(target instanceof HTMLElement)) return;
    highlighted = target;
    target.classList.add("msg-highlight");
    highlightTimer = window.setTimeout(
      () => target.classList.remove("msg-highlight"),
      HIGHLIGHT_MS,
    );
  }
  async function focusMessage(id: string, gen: number): Promise<boolean> {
    const el = await waitForMessageEl(id);
    if (gen !== jumpGen || !el) return false;
    el.scrollIntoView({ block: "center" });
    applyHighlight(el);
    return true;
  }
  createEffect(() => {
    const messageId = props.focusMessageId;
    const channelId = props.channel.id;
    if (!messageId || historyEpoch() === 0) return;
    const tag = `${channelId}::${messageId}`;
    if (tag === lastJumped) return;
    lastJumped = tag;
    const gen = ++jumpGen;
    setUnavailable(false);
    void (async () => {
      const found = () => messages().some((m) => m.id === messageId);
      if (!found()) {
        const key = serverKey();
        for (let i = 0; key && i < SEEK_MAX_PAGES && !found(); i++) {
          const oldest = messages()[0]?.createdAt;
          if (!oldest) break;
          try {
            const rows = await api<Message[]>(
              `/api/channels/${channelId}/messages?before=${encodeURIComponent(oldest)}`,
            );
            if (gen !== jumpGen) return;
            if (rows.length === 0) break;
            const decoded = await decodeRows(key, rows);
            setMessages((prev) => mergeOlder(decoded, prev));
          } catch {
            break;
          }
        }
      }
      if (gen !== jumpGen) return;
      if (!found() || !(await focusMessage(messageId, gen)))
        setUnavailable(true);
    })();
  });
  onCleanup(() => {
    jumpGen += 1;
    window.clearTimeout(highlightTimer);
    for (const p of pendingFiles()) URL.revokeObjectURL(p.previewUrl);
  });

  // Clear notifications for messages that scroll into view.
  createEffect(() => {
    messages();
    notifIds();
    sessionPendingMessageIds(props.channel.id);
    seenVersion();
    const root = scrollEl;
    if (!root) return;
    const watched = new Set([
      ...notifIds(),
      ...sessionPendingMessageIds(props.channel.id),
    ]);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
          const id = (entry.target as HTMLElement).dataset.messageId;
          if (!id) continue;
          clearMessage(id);
          dispatchNotifMessageRead({
            messageId: id,
            channelId: props.channel.id,
          });
          if (notifIds().has(id)) {
            setNotifIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            void listNotifications({ unreadOnly: true })
              .then((list) =>
                Promise.all(
                  list
                    .filter((n) => n.message_id === id)
                    .map((n) => markNotificationRead(n.id)),
                ),
              )
              .catch(() => undefined);
          }
          markHighlightSeen(id);
          setSeenVersion((v) => v + 1);
        }
      },
      { root, threshold: 0.5 },
    );
    root
      .querySelectorAll<HTMLElement>(".msg-block[data-message-id]")
      .forEach((el) => {
        if (watched.has(el.dataset.messageId ?? "")) io.observe(el);
      });
    onCleanup(() => io.disconnect());
  });

  createEffect(() => {
    now();
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      msUntilNextLocalMidnight(new Date(now())),
    );
    onCleanup(() => window.clearTimeout(timer));
  });

  const timeline = createMemo(() => buildTimeline(messages(), new Date(now())));
  const isMentionForMe = (row: Row) => {
    seenVersion();
    return (
      (row.mentionedAccountIds.includes(props.me.id) ||
        row.replyToSenderAccountId === props.me.id) &&
      !isHighlightSeen(row.id)
    );
  };
  const replyParent = (row: Row) =>
    messages().find((m) => m.id === row.replyToMessageId);
  const replySender = (row: Row) => {
    const id = replyParent(row)?.sender ?? row.replyToSenderAccountId;
    return id ? label(id) : "…";
  };
  const replyText = (row: Row) => {
    const parent = replyParent(row);
    return parent?.text ? truncate(parent.text) : t("channel.msgUnavailable");
  };

  // ---- composer ----
  function pushPending(next: Pending[], file: File): string | null {
    if (next.length >= MAX_ATTACHMENTS_PER_MESSAGE)
      return t("channel.maxAttachments", { n: MAX_ATTACHMENTS_PER_MESSAGE });
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) return t("channel.attachTypes");
    if (file.size > MAX_ATTACHMENT_BYTES) return t("channel.attachSize");
    next.push({
      localId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    });
    return null;
  }
  function onPickFiles(list: FileList | null) {
    if (!canWrite() || !list?.length) return;
    const next = [...pendingFiles()];
    let problem = "";
    for (const file of Array.from(list))
      problem = pushPending(next, file) ?? problem;
    setPendingFiles(next);
    setError(problem);
    if (fileInput) fileInput.value = "";
  }
  async function onPaste(e: ClipboardEvent) {
    if (!canWrite() || muted()) return;
    const { images, text } = clipboardFilesFromPaste(e.clipboardData);
    if (images.length === 0) return;
    e.preventDefault();
    const next = [...pendingFiles()];
    let problem = "";
    for (const raw of images) {
      try {
        problem = pushPending(next, await preparePastedImage(raw)) ?? problem;
      } catch {
        problem = t("channel.pasteFail");
      }
    }
    setPendingFiles(next);
    if (text) setDraft((d) => d + text);
    setError(problem);
  }
  function removePending(localId: string) {
    setPendingFiles((prev) => {
      prev
        .filter((p) => p.localId === localId)
        .forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return prev.filter((p) => p.localId !== localId);
    });
  }

  const filteredMentions = () =>
    filterMentionables(
      mentionables(),
      activeMention()?.query ?? "",
    ) as ChannelMentionable[];
  const filteredEmojis = () =>
    filterEmojiCatalog(activeShortcode()?.query ?? "");
  function syncTokens(el: HTMLInputElement) {
    const caret = el.selectionStart ?? el.value.length;
    const mention = findActiveMention(el.value, caret);
    if (mention) {
      const prev = activeMention();
      setActiveMention(mention);
      setActiveShortcode(null);
      setEmojiPickerOpen(false);
      if (
        !prev ||
        prev.startIndex !== mention.startIndex ||
        prev.query !== mention.query
      )
        setMentionHighlight(0);
      return;
    }
    setActiveMention(null);
    const shortcode = findActiveShortcode(el.value, caret);
    const prev = activeShortcode();
    setActiveShortcode(shortcode);
    if (shortcode) {
      setEmojiPickerOpen(false);
      if (
        !prev ||
        prev.startIndex !== shortcode.startIndex ||
        prev.query !== shortcode.query
      )
        setEmojiHighlight(0);
    }
  }
  function restoreCaret(caret: number) {
    requestAnimationFrame(() => {
      composerInput?.focus();
      composerInput?.setSelectionRange(caret, caret);
    });
  }
  function selectMention(item: ChannelMentionable) {
    const active = activeMention();
    if (!active) return;
    const { text, caret } = applyMentionSelection(draft(), active, item.handle);
    setDraft(text);
    setActiveMention(null);
    restoreCaret(caret);
  }
  function selectShortcode(entry: EmojiEntry) {
    const active = activeShortcode();
    if (!active) return;
    const { text, caret } = applyShortcodeSelection(
      draft(),
      active,
      entry.glyph,
    );
    setDraft(text);
    setActiveShortcode(null);
    restoreCaret(caret);
  }
  function insertEmoji(entry: EmojiEntry) {
    const { text, caret } = insertAtCaret(
      draft(),
      composerInput?.selectionStart ?? draft().length,
      entry.glyph,
    );
    setDraft(text);
    setEmojiPickerOpen(false);
    restoreCaret(caret);
  }
  function onComposerKeyDown(e: KeyboardEvent) {
    const lists = [
      {
        open: activeShortcode() !== null,
        items: filteredEmojis(),
        idx: emojiHighlight,
        set: setEmojiHighlight,
        pick: (i: number) => selectShortcode(filteredEmojis()[i]!),
        close: () => setActiveShortcode(null),
      },
      {
        open: activeMention() !== null,
        items: filteredMentions(),
        idx: mentionHighlight,
        set: setMentionHighlight,
        pick: (i: number) => selectMention(filteredMentions()[i]!),
        close: () => setActiveMention(null),
      },
    ];
    for (const list of lists) {
      if (!list.open) continue;
      const n = list.items.length;
      if (e.key === "Escape") {
        e.preventDefault();
        list.close();
        return;
      }
      if (e.key === "ArrowDown" && n) {
        e.preventDefault();
        list.set((list.idx() + 1) % n);
        return;
      }
      if (e.key === "ArrowUp" && n) {
        e.preventDefault();
        list.set((list.idx() - 1 + n) % n);
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && n) {
        e.preventDefault();
        list.pick(list.idx() % n);
        return;
      }
    }
  }

  const canSend = () => draft().trim().length > 0 || pendingFiles().length > 0;
  async function send(e: Event) {
    e.preventDefault();
    if (sending() || !canWrite() || muted() || !canSend()) return;
    const key = await ensureServerKey(
      props.channel.server_id,
      props.identity,
      props.me.id,
    );
    if (!key) {
      setError(t("channel.keyStillSyncing"));
      return;
    }
    const text = draft().trim();
    const files = pendingFiles();
    setSending(true);
    setError("");
    try {
      const attachment_ids: string[] = [];
      for (const p of files) {
        const meta = await uploadAttachment(
          props.channel.id,
          await encryptBytes(key, new Uint8Array(await p.file.arrayBuffer())),
          p.file.type,
        );
        attachment_ids.push(meta.id);
      }
      const roster =
        mentionables().length > 0
          ? mentionables()
          : Object.entries(people())
              .filter(([id]) => id !== props.me.id)
              .map(([account_id, p]) => ({ account_id, handle: p.handle }));
      const body: Record<string, unknown> = {
        content_ciphertext: await encryptMessage(key, text),
        attachment_ids,
        mentioned_account_ids: resolveMentionAccountIds(
          text,
          roster,
          props.me.id,
        ),
      };
      if (replyTarget()) body.reply_to_message_id = replyTarget()!.id;
      await api(`/api/channels/${props.channel.id}/messages`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setDraft("");
      setReplyTarget(null);
      files.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingFiles([]);
      if (stuck()) requestAnimationFrame(() => scrollToBottom());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    const row = deleteTarget();
    if (!row) return;
    setDeleteTarget(null);
    try {
      await deleteMessage(props.channel.id, row.id);
      setMessages((prev) => prev.filter((m) => m.id !== row.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404)
        setMessages((prev) => prev.filter((m) => m.id !== row.id));
      else setError(errorText(err));
    }
  }

  const memberCardPerson = () =>
    memberCard() ? people()[memberCard()!] : undefined;
  function activateMention(handle: string) {
    const found = Object.entries(people()).find(
      ([, p]) => p.handle.toLowerCase() === handle.toLowerCase(),
    );
    if (found && found[0] !== props.me.id) setMemberCard(found[0]);
  }

  return (
    <div
      class="chat-pane"
      ref={(el) => el.addEventListener("paste", (e) => void onPaste(e))}
    >
      <header class="chat-header">
        <div>
          <h1># {props.channel.name}</h1>
          <p class="muted">{t("channel.textVisible")}</p>
        </div>
      </header>
      <Show when={unavailable()}>
        <p class="chat-banner" role="status">
          {t("channel.msgUnavailable")}
        </p>
      </Show>
      <Show when={error()}>
        <p class="chat-banner form-error" role="alert">
          {error()}
        </p>
      </Show>
      <div
        class="chat-scroll"
        ref={(el) => (scrollEl = el)}
        onScroll={onScroll}
        role="log"
        aria-label={t("chat.messages")}
      >
        <Show when={keyPending()}>
          <p class="muted chat-empty">{t("channel.keySync")}</p>
        </Show>
        <For each={timeline()}>
          {(item) => {
            if (item.kind === "day-separator") {
              return (
                <div class="day-sep" data-day-key={item.dayKey}>
                  <span>{item.label}</span>
                </div>
              );
            }
            if (item.kind === "system") {
              return (
                <div class="msg-system" data-message-id={item.item.id}>
                  {item.item.text}
                </div>
              );
            }
            return (
              <article class="msg-group">
                <Avatar
                  name={label(item.sender)}
                  src={
                    person(item.sender).hasAvatar
                      ? `/api/accounts/${item.sender}/avatar`
                      : undefined
                  }
                />
                <div class="msg-col">
                  <header class="msg-head">
                    <strong>{label(item.sender)}</strong>
                    <Show when={item.items[0]?.createdAt}>
                      {(at) => (
                        <time>
                          {new Date(at()).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      )}
                    </Show>
                  </header>
                  <For each={item.items}>
                    {(row) => (
                      <div
                        class="msg-block"
                        classList={{ "msg-highlight-me": isMentionForMe(row) }}
                        data-message-id={row.id}
                      >
                        <Show when={row.replyToMessageId}>
                          <blockquote class="msg-quote">
                            <strong>{replySender(row)}</strong> {replyText(row)}
                          </blockquote>
                        </Show>
                        <Show when={row.text}>
                          <MessageBody
                            text={row.text}
                            meHandle={props.me.handle}
                            activableHandles={activableHandles()}
                            onMentionActivate={activateMention}
                          />
                        </Show>
                        <Show when={row.attachmentIds.length > 0}>
                          <Attachments
                            attachmentIds={row.attachmentIds}
                            serverKey={serverKey()}
                          />
                        </Show>
                        <LinkPreviews text={row.text} />
                        <span class="msg-actions">
                          <Show when={canWrite()}>
                            <button
                              type="button"
                              aria-label={t("channel.reply")}
                              title={t("channel.reply")}
                              onClick={() => {
                                setReplyTarget(row);
                                composerInput?.focus();
                              }}
                            >
                              ↩
                            </button>
                          </Show>
                          <Show when={mayDelete(row)}>
                            <button
                              type="button"
                              aria-label={t("channel.deleteMessage")}
                              title={t("channel.deleteMessage")}
                              onClick={() => setDeleteTarget(row)}
                            >
                              🗑
                            </button>
                          </Show>
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </article>
            );
          }}
        </For>
        <Show
          when={!keyPending() && messages().length === 0 && historyEpoch() > 0}
        >
          <p class="muted chat-empty">{t("chat.empty")}</p>
        </Show>
      </div>
      <Show when={newCount() > 0 && !stuck()}>
        <button type="button" class="jump-pill" onClick={jumpToPresent}>
          {t("channel.jumpPresentN", { n: newCount() })}
        </button>
      </Show>
      <Show when={memberCardPerson()}>
        {(p) => (
          <div
            class="member-card"
            role="dialog"
            aria-label={t("chat.memberCard")}
          >
            <Avatar
              name={publicDisplayLabel(p().handle, p().display_name)}
              src={
                p().hasAvatar
                  ? `/api/accounts/${memberCard()}/avatar`
                  : undefined
              }
            />
            <span>
              <strong>
                {publicDisplayLabel(p().handle, p().display_name)}
              </strong>
              <small>@{p().handle}</small>
            </span>
            <button
              type="button"
              aria-label={t("admin.close")}
              onClick={() => setMemberCard(null)}
            >
              ×
            </button>
          </div>
        )}
      </Show>
      <footer class="composer-area">
        <Show when={replyTarget()}>
          {(target) => (
            <div class="reply-bar">
              <span>
                {t("channel.replyingTo")}{" "}
                <strong>{label(target().sender)}</strong>:{" "}
                {truncate(target().text)}
              </span>
              <button
                type="button"
                aria-label={t("channel.cancelReply")}
                onClick={() => setReplyTarget(null)}
              >
                ×
              </button>
            </div>
          )}
        </Show>
        <Show
          when={canWrite()}
          fallback={
            <p class="composer-state" role="status">
              {t("channel.readOnly")}
            </p>
          }
        >
          <Show
            when={!muted()}
            fallback={
              <p class="composer-state" role="status">
                {t("channel.mutedBanner", { when: muteUntil() })}
              </p>
            }
          >
            <Show when={pendingFiles().length > 0}>
              <div class="pending-files">
                <For each={pendingFiles()}>
                  {(p) => (
                    <span class="pending-file">
                      <img src={p.previewUrl} alt="" />
                      <button
                        type="button"
                        aria-label={t("channel.removeAttachment", {
                          name: p.file.name,
                        })}
                        onClick={() => removePending(p.localId)}
                      >
                        ×
                      </button>
                    </span>
                  )}
                </For>
              </div>
            </Show>
            <form class="composer" onSubmit={(e) => void send(e)}>
              <input
                ref={(el) => (fileInput = el)}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => onPickFiles(e.currentTarget.files)}
              />
              <button
                type="button"
                class="composer-btn"
                aria-label={t("channel.attachImage")}
                title={t("channel.attachImage")}
                onClick={() => fileInput?.click()}
              >
                ＋
              </button>
              <div class="composer-field">
                <Show when={activeMention()}>
                  <MentionPicker
                    items={filteredMentions()}
                    highlightIndex={mentionHighlight()}
                    onSelect={selectMention}
                    onHighlight={setMentionHighlight}
                  />
                </Show>
                <Show when={activeShortcode()}>
                  <EmojiSuggest
                    items={filteredEmojis()}
                    highlightIndex={emojiHighlight()}
                    onSelect={selectShortcode}
                    onHighlight={setEmojiHighlight}
                  />
                </Show>
                <Show when={emojiPickerOpen()}>
                  <EmojiPicker
                    onSelect={insertEmoji}
                    onClose={() => setEmojiPickerOpen(false)}
                  />
                </Show>
                <input
                  ref={(el) => (composerInput = el)}
                  class="composer-input"
                  value={draft()}
                  placeholder={t("channel.placeholder")}
                  aria-label={t("channel.placeholder")}
                  autocomplete="off"
                  onInput={(e) => {
                    setDraft(e.currentTarget.value);
                    syncTokens(e.currentTarget);
                  }}
                  onClick={(e) => syncTokens(e.currentTarget)}
                  onKeyDown={onComposerKeyDown}
                />
              </div>
              <button
                type="button"
                class="composer-btn"
                aria-label={t("channel.emoji")}
                title={t("channel.emoji")}
                onClick={() => {
                  setEmojiPickerOpen((v) => !v);
                  setActiveMention(null);
                  setActiveShortcode(null);
                }}
              >
                ☺
              </button>
              <Button
                variant="primary"
                type="submit"
                disabled={sending() || !canSend()}
              >
                {t("channel.send")}
              </Button>
            </form>
          </Show>
        </Show>
      </footer>
      <Dialog
        open={!!deleteTarget()}
        title={t("channel.deleteMessage")}
        onClose={() => setDeleteTarget(null)}
      >
        <div class="admin-form">
          <p>{t("channel.deleteConfirm")}</p>
          <div class="dialog-actions">
            <Button onClick={() => setDeleteTarget(null)}>
              {t("admin.cancel")}
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              {t("channel.deleteMessage")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
