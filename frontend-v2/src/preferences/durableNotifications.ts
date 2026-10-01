import { createSignal } from "solid-js";
import {
  listNotifications,
  markNotificationRead,
  type UserNotification,
} from "../api/client";
import {
  NOTIF_MESSAGE_READ_EVENT,
  type NotifMessageReadDetail,
} from "../lib/notifSync";

/** Mentions and replies: kept by the backend until the target message is seen. */
const [durable, setDurable] = createSignal<UserNotification[]>([]);

export const durableNotifications = durable;

export async function loadDurableNotifications() {
  try {
    setDurable(await listNotifications({ unreadOnly: true }));
  } catch {
    /* keep the previous list */
  }
}

export function parseNotification(
  payload: Record<string, unknown>,
): UserNotification | null {
  if (!payload.id || !payload.channel_id) return null;
  return {
    id: String(payload.id),
    kind: payload.kind === "reply" ? "reply" : "mention",
    channel_id: String(payload.channel_id),
    message_id: payload.message_id != null ? String(payload.message_id) : null,
    actor_account_id: String(payload.actor_account_id ?? ""),
    created_at: String(payload.created_at ?? ""),
    read_at: payload.read_at != null ? String(payload.read_at) : null,
  };
}

export function addDurableNotification(n: UserNotification) {
  setDurable((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
}

export async function dismissDurableNotification(n: UserNotification) {
  try {
    await markNotificationRead(n.id);
  } catch {
    /* it stays unread server-side */
  }
  setDurable((prev) => prev.filter((x) => x.id !== n.id));
}

/** Drops notifications whose message the user has just seen. */
export function listenForSeenMessages(): () => void {
  const handler = (e: Event) => {
    const messageId = (e as CustomEvent<NotifMessageReadDetail>).detail
      ?.messageId;
    if (messageId)
      setDurable((prev) => prev.filter((n) => n.message_id !== messageId));
  };
  window.addEventListener(NOTIF_MESSAGE_READ_EVENT, handler);
  return () => window.removeEventListener(NOTIF_MESSAGE_READ_EVENT, handler);
}
