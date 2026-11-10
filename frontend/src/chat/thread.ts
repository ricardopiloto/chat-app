// The messages of one open text channel: loading, decrypting, paging back, merging what arrives
// over the socket, and sending. The view only reads signals and calls these methods.
import { createEffect, createMemo, createSignal, on, onCleanup, untrack } from "solid-js";
import { ApiError, messages as messagesApi, type Message, type RealtimeEnvelope } from "../api";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import { decryptMessage, encryptMessage } from "../crypto/serverKey";
import { mergeMessage, mergeMessages, type ChatMessage, type DiceRoll } from "./logic/timeline";
import { rememberLoaded } from "./loaded";

export type ThreadStatus = "loading" | "ready" | "noKey" | "error";

/** The backend returns at most this many messages per page. */
const PAGE_SIZE = 200;

export interface Outgoing {
  text: string;
  attachmentIds: string[];
  replyToId: string | undefined;
  mentionedIds: string[];
  /** The text has @todos and the sender may use it; the server decides whether it counts. */
  mentionEveryone?: boolean;
}

export async function toChatMessage(raw: Message, key: Uint8Array): Promise<ChatMessage> {
  const system = raw.kind === "system";
  let text = raw.content_plaintext ?? "";
  let unreadable = false;
  let diceRoll: DiceRoll | undefined;
  if (raw.kind === "dice_roll") {
    try {
      const parsed = JSON.parse(text) as DiceRoll & { label?: string | null; natural?: DiceRoll["natural"] | null };
      const rollsOk = Array.isArray(parsed.rolls)
        && Number.isInteger(parsed.count)
        && Number.isInteger(parsed.sides)
        && parsed.rolls.length === parsed.count
        && parsed.rolls.every((value) => Number.isInteger(value) && value >= 1 && value <= parsed.sides);
      if (rollsOk) {
        diceRoll = {
          notation: parsed.notation,
          count: parsed.count,
          sides: parsed.sides,
          rolls: parsed.rolls,
          faces: Array.isArray(parsed.faces) ? parsed.faces : undefined,
          modifier: Number.isFinite(parsed.modifier) ? parsed.modifier : 0,
          total: Number.isFinite(parsed.total) ? parsed.total : parsed.rolls.reduce((sum, value) => sum + value, 0) + (parsed.modifier || 0),
          label: parsed.label ?? undefined,
          natural: parsed.natural ?? undefined,
        };
        text = `🎲 ${diceRoll.notation} → ${diceRoll.total}${diceRoll.label ? ` (${diceRoll.label})` : ""}`;
      }
    } catch { /* keep raw text if a malformed legacy row is encountered */ }
  }
  if (!system && raw.content_ciphertext) {
    try {
      text = await decryptMessage(key, raw.content_ciphertext);
    } catch {
      text = "";
      unreadable = true;
    }
  }
  return {
    id: raw.id,
    channelId: raw.channel_id,
    senderId: raw.sender_account_id,
    text,
    diceRoll,
    createdAt: raw.created_at,
    system,
    webhook: raw.kind === "webhook",
    senderDisplayNameSnapshot: raw.sender_display_name_snapshot,
    senderAvatarUrl: raw.sender_avatar_url,
    attachmentIds: raw.attachment_ids ?? [],
    reactions: (raw.reactions ?? []).map((reaction) => ({
      emojiCode: reaction.emoji_code,
      count: reaction.count,
      accountIds: reaction.account_ids,
    })),
    replyToId: raw.reply_to_message_id,
    replySenderId: raw.reply_to_sender_account_id,
    mentionedIds: raw.mentioned_account_ids ?? [],
    mentionsEveryone: raw.mentions_everyone === true,
    unreadable,
  };
}

export function createThread(options: {
  channelId: () => string;
  serverId: () => string;
  identity: () => Identity;
  accountId: () => string;
  subscribe: (handler: (event: RealtimeEnvelope) => void) => () => void;
  /** Changes whenever the realtime connection came back after an interruption. */
  resync: () => number;
  onLiveDice?: (message: ChatMessage) => void;
}) {
  const [list, setList] = createSignal<ChatMessage[]>([]);
  const [directed, setDirected] = createSignal<ChatMessage[]>([]);
  const messages = createMemo(() => {
    const loaded = list();
    const loadedIds = new Set(loaded.map((message) => message.id));
    return mergeMessages(loaded, directed().filter((message) => !loadedIds.has(message.id)));
  });
  const [status, setStatus] = createSignal<ThreadStatus>("loading");
  const [hasOlder, setHasOlder] = createSignal(false);
  const [loadingOlder, setLoadingOlder] = createSignal(false);
  let key: Uint8Array | undefined;

  const publish = (next: ChatMessage[]) => {
    setList(next);
    rememberLoaded(options.channelId(), next);
  };

  async function decryptAll(raw: Message[]): Promise<ChatMessage[]> {
    return Promise.all(raw.map((m) => toChatMessage(m, key!)));
  }

  async function open() {
    const channelId = options.channelId();
    setStatus("loading");
    publish([]);
    setDirected([]);
    key = undefined;
    setHasOlder(false);
    try {
      key = await ensureServerKey(options.serverId(), options.identity(), options.accountId());
      if (!key) return setStatus("noKey");
      const page = await messagesApi.list(channelId);
      if (channelId !== options.channelId()) return;
      publish(mergeMessages([], await decryptAll(page)));
      setHasOlder(page.length >= PAGE_SIZE);
      setStatus("ready");
    } catch {
      if (channelId === options.channelId()) setStatus("error");
    }
  }

  /** Fetches the latest page again and merges it, so nothing sent while disconnected is missed. */
  async function refresh() {
    if (!key) return;
    const channelId = options.channelId();
    try {
      const page = await decryptAll(await messagesApi.list(channelId));
      if (channelId === options.channelId()) publish(mergeMessages(untrack(list), page));
    } catch {
      /* the next event or resync tries again */
    }
  }

  /** Directed fetch stays separate from the contiguous page window used by loadOlder. */
  async function ensureMessage(messageId: string): Promise<boolean> {
    if (!key) return false;
    const channelId = options.channelId();
    try {
      const raw = await messagesApi.get(channelId, messageId);
      if (channelId !== options.channelId()) return false;
      const message = await toChatMessage(raw, key);
      if (channelId !== options.channelId()) return false;
      setDirected((current) => mergeMessage(current, message));
      return true;
    } catch {
      return false;
    }
  }

  async function loadOlder(): Promise<boolean> {
    const oldest = untrack(list)[0];
    if (!key || !oldest || loadingOlder()) return false;
    setLoadingOlder(true);
    const channelId = options.channelId();
    try {
      const page = await messagesApi.list(channelId, oldest.createdAt);
      if (channelId !== options.channelId()) return false;
      publish(mergeMessages(untrack(list), await decryptAll(page)));
      setHasOlder(page.length >= PAGE_SIZE);
      return page.length > 0;
    } catch {
      return false;
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send(outgoing: Outgoing): Promise<void> {
    if (!key) throw new ApiError(0, "no key");
    const body = {
      content_ciphertext: await encryptMessage(key, outgoing.text),
      attachment_ids: outgoing.attachmentIds,
      mentioned_account_ids: outgoing.mentionedIds,
      reply_to_message_id: outgoing.replyToId,
      mention_everyone: outgoing.mentionEveryone || undefined,
    };
    const created = await messagesApi.post(options.channelId(), body);
    publish(mergeMessage(untrack(list), await toChatMessage(created, key)));
  }

  async function remove(messageId: string): Promise<void> {
    await messagesApi.remove(options.channelId(), messageId);
    publish(untrack(list).filter((m) => m.id !== messageId));
    setDirected((current) => current.filter((m) => m.id !== messageId));
  }

  /** Toggles this account's reaction and paints it before the server answers. */
  async function react(messageId: string, emojiCode: string): Promise<void> {
    const accountId = options.accountId();
    const current = untrack(list).find((message) => message.id === messageId);
    if (!current) return;
    const mine = current.reactions.some((reaction) => reaction.emojiCode === emojiCode && reaction.accountIds.includes(accountId));
    publish(applyReaction(untrack(list), messageId, emojiCode, accountId, !mine));
    try {
      if (mine) await messagesApi.removeReaction(options.channelId(), messageId, emojiCode);
      else await messagesApi.addReaction(options.channelId(), messageId, emojiCode);
    } catch {
      void refresh();
    }
  }

  const onEvent = async (event: RealtimeEnvelope) => {
    const channelId = options.channelId();
    if (event.event === "message.new" && event.payload.channel_id === channelId && key) {
      const raw = event.payload as unknown as Message;
      const message = await toChatMessage(raw, key);
      if (channelId !== options.channelId()) return;
      publish(mergeMessage(untrack(list), message));
      if (raw.kind === "dice_roll" && message.diceRoll) options.onLiveDice?.(message);
    } else if (event.event === "message.deleted" && event.payload.channel_id === channelId) {
      publish(untrack(list).filter((m) => m.id !== event.payload.id));
      setDirected((current) => current.filter((m) => m.id !== event.payload.id));
    } else if ((event.event === "reaction.added" || event.event === "reaction.removed") && event.payload.channel_id === channelId) {
      const messageId = event.payload.message_id;
      const accountId = event.payload.account_id;
      const emojiCode = event.payload.emoji_code;
      if (typeof messageId === "string" && typeof accountId === "string" && typeof emojiCode === "string") {
        publish(applyReaction(untrack(list), messageId, emojiCode, accountId, event.event === "reaction.added"));
      }
    } else if (event.event === "key_handoff.completed" && untrack(status) === "noKey") {
      void open();
    }
  };

  createEffect(on([options.channelId, options.serverId], () => void open()));
  createEffect(on(options.resync, () => void refresh(), { defer: true }));
  createEffect(() => onCleanup(options.subscribe((event) => void onEvent(event))));

  return { messages, status, hasOlder, loadingOlder, loadOlder, ensureMessage, send, remove, react, refresh, retry: open, serverKey: () => key };
}

/** Adds or drops one account on one emoji. Repeating the same change does not change the count. */
export function applyReaction(messages: readonly ChatMessage[], messageId: string, emojiCode: string, accountId: string, present: boolean): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== messageId) return message;
    const reactions = message.reactions.map((reaction) => ({ ...reaction, accountIds: [...reaction.accountIds] }));
    const index = reactions.findIndex((reaction) => reaction.emojiCode === emojiCode);
    if (present) {
      if (index < 0) reactions.push({ emojiCode, count: 1, accountIds: [accountId] });
      else if (!reactions[index]!.accountIds.includes(accountId)) reactions[index]!.accountIds.push(accountId);
    } else if (index >= 0) {
      reactions[index]!.accountIds = reactions[index]!.accountIds.filter((id) => id !== accountId);
    }
    const next = reactions
      .map((reaction) => ({ ...reaction, count: reaction.accountIds.length }))
      .filter((reaction) => reaction.count > 0)
      .sort((a, b) => a.emojiCode.localeCompare(b.emojiCode));
    return { ...message, reactions: next };
  });
}

export type Thread = ReturnType<typeof createThread>;
