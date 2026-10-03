// The last channel a person had open, per server and overall, so leaving the settings goes back to it.
// Kept on this device per account, mirrored in a signal so it also works when storage is blocked.
import { createSignal } from "solid-js";
import { readJson, writeJson } from "../lib/localPrefs";

type Memory = { last?: { serverId: string; channelId: string }; byServer: Record<string, string> };
type Store = Record<string, Memory>;

const KEY = "mesa.lastChannel.v1";
const [store, setStore] = createSignal<Store>(readJson<Store>(KEY, {}));

const memoryOf = (accountId: string): Memory => store()[accountId] ?? { byServer: {} };
const update = (accountId: string, change: (memory: Memory) => Memory) => {
  const next = { ...store(), [accountId]: change(memoryOf(accountId)) };
  setStore(next);
  writeJson(KEY, next);
};

export const lastChannel = {
  /** Remembers that this channel was the one open in its server, and the latest one overall. */
  remember(accountId: string, serverId: string, channelId: string) {
    const memory = memoryOf(accountId);
    if (memory.last?.serverId === serverId && memory.last.channelId === channelId && memory.byServer[serverId] === channelId) return;
    update(accountId, (now) => ({ last: { serverId, channelId }, byServer: { ...now.byServer, [serverId]: channelId } }));
  },
  inServer: (accountId: string, serverId: string): string | undefined => memoryOf(accountId).byServer[serverId],
  overall: (accountId: string): { serverId: string; channelId: string } | undefined => memoryOf(accountId).last,
  /** Drops a deleted channel from the memory. */
  forget(accountId: string, channelId: string) {
    const memory = memoryOf(accountId);
    const holds = memory.last?.channelId === channelId || Object.values(memory.byServer).includes(channelId);
    if (!holds) return;
    update(accountId, (now) => ({
      last: now.last?.channelId === channelId ? undefined : now.last,
      byServer: Object.fromEntries(Object.entries(now.byServer).filter(([, id]) => id !== channelId)),
    }));
  },
};

/** Where leaving a server's settings goes: its remembered channel if it is still listed, else the server. */
export function channelTarget(serverId: string, remembered: string | undefined, listed: { id: string }[]): string {
  return remembered && listed.some((c) => c.id === remembered) ? `/servers/${serverId}/channels/${remembered}` : `/servers/${serverId}`;
}

/** Where leaving the account page goes: the last channel overall if its server still lists it, else home. */
export function accountTarget(
  last: { serverId: string; channelId: string } | undefined,
  serverIds: string[],
  listed: { id: string }[],
): string {
  if (!last || !serverIds.includes(last.serverId)) return "/";
  return listed.some((c) => c.id === last.channelId) ? `/servers/${last.serverId}/channels/${last.channelId}` : "/";
}
