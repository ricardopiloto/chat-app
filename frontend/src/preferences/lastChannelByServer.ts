import type { Channel } from "../api/client";

const KEY = "mesa.lastChannelByServer";

function readMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function readLastChannel(serverId: string): string | null {
  if (!serverId) return null;
  return readMap()[serverId] ?? null;
}

export function writeLastChannel(serverId: string, channelId: string): void {
  if (!serverId || !channelId) return;
  const map = readMap();
  map[serverId] = channelId;
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** Prefer last visited → first text → first any. */
export function resolveChannelForServer(
  serverId: string,
  channels: Channel[],
): Channel | null {
  if (!channels.length) return null;
  const last = readLastChannel(serverId);
  if (last) {
    const hit = channels.find((c) => c.id === last);
    if (hit) return hit;
  }
  return channels.find((c) => c.type === "text") ?? channels[0] ?? null;
}

export function channelHref(ch: Channel, serverId: string): string {
  return `/channels/${ch.id}?server=${serverId}&type=${ch.type}`;
}
