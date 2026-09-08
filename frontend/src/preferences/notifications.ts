import { createSignal } from "solid-js";

/** In-memory session unread messages for the topbar bell (071).
 *  Server-rail unread uses durable BE `has_unread` (037) — keep both. */

export type SessionUnreadItem = {
  messageId: string;
  createdAt: string;
};

const MAX_PER_CHANNEL = 50;
const byChannel = new Map<string, SessionUnreadItem[]>();
const [tick, setTick] = createSignal(0);

function bump() {
  setTick((n) => n + 1);
}

function sortOldestFirst(items: SessionUnreadItem[]) {
  items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Record a session unread for a message (channel not focused). Dedupes by messageId. */
export function markUnseen(channelId: string, messageId: string, createdAt?: string) {
  if (!channelId || !messageId) return;
  const list = byChannel.get(channelId) ?? [];
  if (list.some((i) => i.messageId === messageId)) return;
  list.push({
    messageId,
    createdAt: createdAt && createdAt.length > 0 ? createdAt : new Date().toISOString(),
  });
  sortOldestFirst(list);
  // Cap: keep oldest 50 so «5+ → oldest» stays meaningful
  while (list.length > MAX_PER_CHANNEL) list.pop();
  byChannel.set(channelId, list);
  bump();
}

/** Clear one message from session unseen (any channel). */
export function clearMessage(messageId: string) {
  if (!messageId) return;
  let changed = false;
  for (const [channelId, list] of byChannel) {
    const next = list.filter((i) => i.messageId !== messageId);
    if (next.length !== list.length) {
      changed = true;
      if (next.length === 0) byChannel.delete(channelId);
      else byChannel.set(channelId, next);
    }
  }
  if (changed) bump();
}

/** Remove all session items for a channel (e.g. channel deleted). */
export function removeChannel(channelId: string) {
  if (!channelId) return;
  if (byChannel.delete(channelId)) bump();
}

export function clearAllUnseen() {
  if (byChannel.size === 0) return;
  byChannel.clear();
  bump();
}

/** Reactive: call inside a tracking scope. */
export function hasAnyUnseen(): boolean {
  tick();
  return byChannel.size > 0;
}

export function unseenChannelIds(): string[] {
  tick();
  return [...byChannel.keys()];
}

export function sessionItemsForChannel(channelId: string): SessionUnreadItem[] {
  tick();
  return [...(byChannel.get(channelId) ?? [])];
}

export function oldestSessionMessageId(channelId: string): string | null {
  const items = sessionItemsForChannel(channelId);
  return items[0]?.messageId ?? null;
}

export function sessionPendingMessageIds(channelId?: string): Set<string> {
  tick();
  const ids = new Set<string>();
  if (channelId) {
    for (const i of byChannel.get(channelId) ?? []) ids.add(i.messageId);
  } else {
    for (const list of byChannel.values()) {
      for (const i of list) ids.add(i.messageId);
    }
  }
  return ids;
}
