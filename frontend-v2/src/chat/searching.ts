// Search across the messages this device can read. It uses what the open channels already
// decrypted, and fetches and decrypts the latest page of any other text channel it needs.
import type { QueryClient } from "@tanstack/solid-query";
import { messages as messagesApi, type Channel, type Server } from "../api";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import { allChannels, type ChannelRef } from "./directory";
import { loadedMessages, rememberLoaded } from "./loaded";
import { excerptAround, type Excerpt, type ParsedQuery } from "./logic/search";
import type { ChatMessage } from "./logic/timeline";
import { toChatMessage } from "./thread";

export interface Hit {
  message: ChatMessage;
  channel: Channel;
  server: Server;
  excerpt: Excerpt;
}

export type SearchState = "idle" | "needTerm" | "noChannel" | "voiceChannel" | "done";

export interface SearchOutcome {
  state: SearchState;
  hits: Hit[];
}

const MAX_HITS = 50;
const PARALLEL = 4;

export interface SearchEnvironment {
  cache: QueryClient;
  servers: readonly Server[];
  currentServerId: string;
  identity: Identity;
  accountId: string;
  /** Returns true once a newer search has started, so this one can stop early. */
  cancelled: () => boolean;
}

export async function messagesOf(env: Pick<SearchEnvironment, "identity" | "accountId">, ref: ChannelRef): Promise<ChatMessage[]> {
  const known = loadedMessages(ref.channel.id);
  if (known) return known;
  const key = await ensureServerKey(ref.server.id, env.identity, env.accountId);
  if (!key) return [];
  const page = await messagesApi.list(ref.channel.id);
  const decrypted = await Promise.all(page.map((m) => toChatMessage(m, key)));
  rememberLoaded(ref.channel.id, decrypted);
  return decrypted;
}

export async function runSearch(env: SearchEnvironment, query: ParsedQuery): Promise<SearchOutcome> {
  if (!query.channel && !query.term) return { state: "idle", hits: [] };
  const everything = await allChannels(env.cache, env.servers);

  let targets = everything.filter((r) => r.channel.type === "text");
  if (query.channel) {
    const named = everything.filter((r) => r.channel.name.toLowerCase() === query.channel);
    // A name that exists in the open server wins over the same name elsewhere.
    const here = named.filter((r) => r.server.id === env.currentServerId);
    const chosen = here.length > 0 ? here : named;
    if (chosen.length === 0) return { state: "noChannel", hits: [] };
    targets = chosen.filter((r) => r.channel.type === "text");
    if (targets.length === 0) return { state: "voiceChannel", hits: [] };
    if (!query.term) return { state: "needTerm", hits: [] };
  }

  const hits: Hit[] = [];
  for (let at = 0; at < targets.length; at += PARALLEL) {
    if (env.cancelled()) break;
    const batch = await Promise.all(targets.slice(at, at + PARALLEL).map(async (ref) => ({ ref, found: await messagesOf(env, ref).catch(() => []) })));
    for (const { ref, found } of batch) {
      for (const message of found) {
        if (message.system || message.unreadable) continue;
        const excerpt = excerptAround(message.text, query.term);
        if (excerpt) hits.push({ message, channel: ref.channel, server: ref.server, excerpt });
      }
    }
  }
  hits.sort((a, b) => b.message.createdAt.localeCompare(a.message.createdAt));
  return { state: "done", hits: hits.slice(0, MAX_HITS) };
}
