// Desktop-only bridge: mirror live in-app notices to the OS when the main window is unfocused.
// Coalesces channel-news toasts (one per channel until focus returns). loadNotices must never call this.
import type { QueryClient } from "@tanstack/solid-query";
import { queryKeys, type Channel, type Member, type Server } from "../api";
import { t } from "../i18n";
import { publicDisplayLabel } from "../lib/displayName";

const announcedNews = new Set<string>();
let focusBound = false;

function ensureFocusClear(): void {
  if (focusBound || typeof window === "undefined") return;
  focusBound = true;
  window.addEventListener("focus", () => announcedNews.clear());
}

function notifyOs(title: string, body: string): void {
  if (!window.__MESA_NATIVE__) return;
  const bridge = window.mesaNative;
  if (!bridge?.notifyOs) return;
  void bridge.notifyOs({ title, body }).catch(() => undefined);
}

function memberLabel(members: Member[] | undefined, accountId: string): string | undefined {
  const found = members?.find((m) => m.account_id === accountId);
  return found ? publicDisplayLabel(found.handle, found.display_name) : undefined;
}

function channelLabel(channels: Channel[] | undefined, channelId: string): string | undefined {
  return channels?.find((c) => c.id === channelId)?.name;
}

export function announceMentionOs(
  cache: QueryClient,
  serverId: string,
  notice: { kind?: unknown; channel_id?: unknown; actor_account_id?: unknown },
): void {
  ensureFocusClear();
  if (!window.__MESA_NATIVE__ || !window.mesaNative?.notifyOs) return;
  const kind = notice.kind === "reply" ? "reply" : "mention";
  const channelId = typeof notice.channel_id === "string" ? notice.channel_id : "";
  const actorId = typeof notice.actor_account_id === "string" ? notice.actor_account_id : "";
  const members = serverId ? cache.getQueryData<Member[]>(queryKeys.members(serverId)) : undefined;
  const channels = serverId ? cache.getQueryData<Channel[]>(queryKeys.channels(serverId)) : undefined;
  const name = actorId ? memberLabel(members, actorId) : undefined;
  const channel = channelId ? channelLabel(channels, channelId) : undefined;
  const title = t("txt.notices.osApp");
  let body: string;
  if (kind === "reply") {
    body = name && channel ? t("txt.notices.osReply", { name, channel }) : t("txt.notices.osReplyGeneric");
  } else {
    body = name && channel ? t("txt.notices.osMention", { name, channel }) : t("txt.notices.osMentionGeneric");
  }
  notifyOs(title, body);
}

export function announceNewsOs(cache: QueryClient, serverId: string, channelId: string): void {
  ensureFocusClear();
  if (!window.__MESA_NATIVE__ || !window.mesaNative?.notifyOs) return;
  if (!channelId || announcedNews.has(channelId)) return;
  announcedNews.add(channelId);
  const channels = serverId ? cache.getQueryData<Channel[]>(queryKeys.channels(serverId)) : undefined;
  const servers = cache.getQueryData<Server[]>(queryKeys.servers);
  const channel = channelLabel(channels, channelId);
  const server = servers?.find((s) => s.id === serverId)?.name;
  const title = t("txt.notices.osApp");
  const body = channel
    ? server
      ? t("txt.notices.osNews", { server, channel })
      : t("txt.notices.osNewsChannel", { channel })
    : t("txt.notices.osNewsGeneric");
  notifyOs(title, body);
}
