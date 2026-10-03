// What is new for the user: mentions and replies (kept by the backend until the message is seen)
// and channels that received messages while another one was open (this session only).
import { createSignal } from "solid-js";
import { notifications as notificationsApi, type Notification } from "../api";

export interface ChannelNews {
  serverId: string;
  channelId: string;
  count: number;
  lastMessageId: string;
  at: string;
}

const [news, setNews] = createSignal<Record<string, ChannelNews>>({});
const [durable, setDurable] = createSignal<Notification[]>([]);

export const channelNews = (): ChannelNews[] => Object.values(news()).sort((a, b) => b.at.localeCompare(a.at));
export const mentionNotices = durable;

export function noteNews(serverId: string, channelId: string, messageId: string, at: string): void {
  setNews((all) => ({ ...all, [channelId]: { serverId, channelId, count: (all[channelId]?.count ?? 0) + 1, lastMessageId: messageId, at } }));
}

export function clearNews(channelId: string): void {
  setNews((all) => {
    if (!(channelId in all)) return all;
    const { [channelId]: _gone, ...rest } = all;
    return rest;
  });
}

export function clearNewsInServer(serverId: string): void {
  setNews((all) => Object.fromEntries(Object.entries(all).filter(([, n]) => n.serverId !== serverId)));
}

export const hasNews = (): boolean => Object.keys(news()).length > 0 || durable().length > 0;
export const unseenCount = (): number => Object.keys(news()).length + durable().length;

export function resetNotices(): void {
  setNews({});
  setDurable([]);
}

export async function loadNotices(): Promise<void> {
  try {
    setDurable(await notificationsApi.list({ unreadOnly: true, limit: 100 }));
  } catch {
    /* the list stays as it was; the next realtime event or reload fills it */
  }
}

/** Live notifications carry no account id; everything else matches the REST shape. */
export function addNotice(payload: Record<string, unknown>): void {
  const id = String(payload.id ?? "");
  if (!id) return;
  const note = payload as unknown as Notification;
  setDurable((all) => (all.some((n) => n.id === id) ? all : [note, ...all]));
}

export const noticeForMessage = (messageId: string): Notification | undefined => durable().find((n) => n.message_id === messageId);

/** Called when the user has actually seen a message: its notifications are done. */
export async function markSeen(messageId: string): Promise<void> {
  const here = durable().filter((n) => n.message_id === messageId);
  if (here.length === 0) return;
  setDurable((all) => all.filter((n) => n.message_id !== messageId));
  await Promise.allSettled(here.map((n) => notificationsApi.markRead(n.id)));
}

export async function markAllSeen(): Promise<void> {
  setDurable([]);
  await notificationsApi.markAllRead().catch(() => undefined);
}
