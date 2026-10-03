// The messages of one open text channel: loading, decrypting, paging back, merging what arrives
// over the socket, and sending. The view only reads signals and calls these methods.
import { createEffect, createSignal, on, onCleanup, untrack } from "solid-js";
import { ApiError, messages as messagesApi, type Message, type RealtimeEnvelope } from "../api";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import { decryptMessage, encryptMessage } from "../crypto/serverKey";
import { mergeMessage, mergeMessages, type ChatMessage } from "./logic/timeline";
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
    createdAt: raw.created_at,
    system,
    attachmentIds: raw.attachment_ids ?? [],
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
}) {
  const [list, setList] = createSignal<ChatMessage[]>([]);
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
  }

  const onEvent = async (event: RealtimeEnvelope) => {
    const channelId = options.channelId();
    if (event.event === "message.new" && event.payload.channel_id === channelId && key) {
      publish(mergeMessage(untrack(list), await toChatMessage(event.payload as unknown as Message, key)));
    } else if (event.event === "message.deleted" && event.payload.channel_id === channelId) {
      publish(untrack(list).filter((m) => m.id !== event.payload.id));
    } else if (event.event === "key_handoff.completed" && untrack(status) === "noKey") {
      void open();
    }
  };

  createEffect(on([options.channelId, options.serverId], () => void open()));
  createEffect(on(options.resync, () => void refresh(), { defer: true }));
  createEffect(() => onCleanup(options.subscribe((event) => void onEvent(event))));

  return { messages: list, status, hasOlder, loadingOlder, loadOlder, send, remove, refresh, retry: open, serverKey: () => key };
}

export type Thread = ReturnType<typeof createThread>;
