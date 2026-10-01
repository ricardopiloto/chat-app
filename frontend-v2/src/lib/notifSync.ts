/** Cross-component sync when a message's notifications are cleared. */
export const NOTIF_MESSAGE_READ_EVENT = "mesa:notification-message-read";

export type NotifMessageReadDetail = { messageId: string; channelId?: string };

export function dispatchNotifMessageRead(detail: NotifMessageReadDetail) {
  if (typeof window === "undefined" || !detail.messageId) return;
  window.dispatchEvent(new CustomEvent(NOTIF_MESSAGE_READ_EVENT, { detail }));
}
