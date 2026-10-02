// Looks channels and members up across every server the user belongs to. The panels that work
// across servers (search, notifications) use this instead of the open server's data.
import type { QueryClient } from "@tanstack/solid-query";
import { channels as channelsApi, queryKeys, servers as serversApi, type Channel, type Member, type Server } from "../api";
import { toPerson, type ChatPerson } from "./logic/people";

const FRESH_MS = 30_000;

export interface ChannelRef {
  channel: Channel;
  server: Server;
}

export const channelsOf = (cache: QueryClient, serverId: string): Promise<Channel[]> =>
  cache.fetchQuery({ queryKey: queryKeys.channels(serverId), queryFn: () => channelsApi.listForServer(serverId), staleTime: FRESH_MS });

export const membersOf = (cache: QueryClient, serverId: string): Promise<Member[]> =>
  cache.fetchQuery({ queryKey: queryKeys.members(serverId), queryFn: () => serversApi.members(serverId), staleTime: FRESH_MS });

export async function allChannels(cache: QueryClient, servers: readonly Server[]): Promise<ChannelRef[]> {
  const perServer = await Promise.all(servers.map(async (server) => (await channelsOf(cache, server.id).catch(() => [])).map((channel) => ({ channel, server }))));
  return perServer.flat();
}

export async function peopleOf(cache: QueryClient, serverIds: readonly string[]): Promise<Map<string, ChatPerson>> {
  const lists = await Promise.all([...new Set(serverIds)].map((id) => membersOf(cache, id).catch(() => [])));
  return new Map(lists.flat().map((m) => [m.account_id, toPerson(m)]));
}
