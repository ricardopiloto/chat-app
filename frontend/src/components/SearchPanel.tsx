import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { api, type Channel, type Message, type Server } from "../api/client";
import type { Identity } from "../crypto/identity";
import { decryptMessage, getServerKey } from "../crypto/serverKey";
import { parseSearchQuery, type ParsedSearchQuery } from "../search/parseSearchQuery";
import {
  type SearchEmptyReason,
  searchEmptyMessage,
} from "../search/searchEmpty";

export type SearchHit = {
  serverId: string;
  serverName: string;
  channelId: string;
  channelName: string;
  channelType: Channel["type"];
  messageId: string;
  snippet: string;
};

type Props = {
  expanded: boolean;
  onCollapse: () => void;
  identity: Identity;
  meId: string;
  /** When set with a new seedNonce, replaces the query and focuses caret at end. */
  seedQuery?: string | null;
  seedNonce?: number;
};

export default function SearchPanel(props: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = createSignal("");
  const [status, setStatus] = createSignal<"idle" | "searching" | "done">("idle");
  const [results, setResults] = createSignal<SearchHit[]>([]);
  const [emptyReason, setEmptyReason] = createSignal<SearchEmptyReason | null>(null);
  let debounceTimer: number | undefined;
  let searchGen = 0;
  let inputRef: HTMLInputElement | undefined;
  let rootRef: HTMLDivElement | undefined;

  createEffect(() => {
    const seed = props.seedQuery;
    const nonce = props.seedNonce;
    if (!props.expanded || seed == null || nonce === undefined) return;
    setQuery(seed);
    setResults([]);
    setEmptyReason(null);
    setStatus("idle");
    queueMicrotask(() => {
      const el = inputRef;
      if (!el) return;
      el.focus();
      const len = seed.length;
      el.setSelectionRange(len, len);
    });
  });

  createEffect(() => {
    if (!props.expanded) {
      setQuery("");
      setResults([]);
      setStatus("idle");
      setEmptyReason(null);
      return;
    }
    queueMicrotask(() => {
      if (props.seedQuery == null) inputRef?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        props.onCollapse();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef && !rootRef.contains(t)) props.onCollapse();
    };
    window.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointer);
    }, 0);
    onCleanup(() => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    });
  });

  onCleanup(() => {
    if (debounceTimer) window.clearTimeout(debounceTimer);
  });

  function onInput(value: string) {
    setQuery(value);
    if (debounceTimer) window.clearTimeout(debounceTimer);
    const parsed = parseSearchQuery(value);
    if (parsed.term.length < 2) {
      setResults([]);
      setEmptyReason(null);
      setStatus("idle");
      return;
    }
    setStatus("searching");
    setEmptyReason(null);
    debounceTimer = window.setTimeout(() => {
      void runSearch(parsed);
    }, 250);
  }

  async function runSearch(parsed: ParsedSearchQuery) {
    const gen = ++searchGen;
    setResults([]);
    setEmptyReason(null);
    const needle = parsed.term.toLowerCase();
    const nameNeedle = (parsed.channelName ?? "").toLowerCase();
    let hitCount = 0;

    try {
      // Membership: only servers from GET /api/servers for the current user.
      const servers = await api<Server[]>("/api/servers");
      if (gen !== searchGen) return;

      type ChRef = { server: Server; channel: Channel };
      const textTargets: ChRef[] = [];
      let matchedNameNonText = false;
      let matchedNameAny = false;

      for (const server of servers) {
        let channels: Channel[] = [];
        try {
          channels = await api<Channel[]>(`/api/servers/${server.id}/channels`);
        } catch {
          continue;
        }
        if (gen !== searchGen) return;
        for (const ch of channels) {
          if (parsed.mode === "scoped") {
            if (ch.name.toLowerCase() !== nameNeedle) continue;
            matchedNameAny = true;
            if (ch.type === "text") textTargets.push({ server, channel: ch });
            else matchedNameNonText = true;
          } else if (ch.type === "text") {
            textTargets.push({ server, channel: ch });
          }
        }
      }

      if (parsed.mode === "scoped" && textTargets.length === 0) {
        if (gen !== searchGen) return;
        setEmptyReason(
          matchedNameNonText || matchedNameAny ? "voice_only" : "channel_not_found",
        );
        setStatus("done");
        return;
      }

      for (const { server, channel: ch } of textTargets) {
        const key = getServerKey(server.id);
        if (!key) continue;
        try {
          const rows = await api<Message[]>(`/api/channels/${ch.id}/messages`);
          if (gen !== searchGen) return;
          for (const row of rows) {
            let text = "";
            try {
              text = await decryptMessage(key, row.content_ciphertext);
            } catch {
              continue;
            }
            if (!text.toLowerCase().includes(needle)) continue;
            const snippet = text.length > 120 ? `${text.slice(0, 117)}…` : text;
            hitCount += 1;
            setResults((prev) => [
              ...prev,
              {
                serverId: server.id,
                serverName: server.name,
                channelId: ch.id,
                channelName: ch.name,
                channelType: ch.type,
                messageId: row.id,
                snippet,
              },
            ]);
          }
        } catch {
          /* ignore channel errors */
        }
      }
    } finally {
      if (gen === searchGen) {
        if (hitCount === 0 && emptyReason() === null) {
          setEmptyReason("no_results");
        }
        setStatus("done");
      }
    }
  }

  function openHit(hit: SearchHit) {
    navigate(
      `/channels/${hit.channelId}?server=${hit.serverId}&type=${hit.channelType}&message=${hit.messageId}`,
    );
    props.onCollapse();
  }

  const showEmpty = () =>
    status() === "done" && results().length === 0 && emptyReason() !== null;

  return (
    <Show when={props.expanded}>
      <div class="topbar-search-expand" ref={(el) => (rootRef = el)}>
        <input
          ref={(el) => (inputRef = el)}
          class="input topbar-search-field"
          type="search"
          placeholder="Pesquisar… ou #canal termo"
          value={query()}
          onInput={(e) => onInput(e.currentTarget.value)}
          aria-label="Pesquisar mensagens"
        />
        <div class="topbar-search-results">
          <Show when={status() === "searching"}>
            <p class="muted">A procurar…</p>
          </Show>
          <ul class="search-results">
            <For each={results()}>
              {(hit) => (
                <li>
                  <button type="button" class="search-result" onClick={() => openHit(hit)}>
                    <span class="search-result-meta">
                      {hit.serverName} · #{hit.channelName}
                    </span>
                    <span class="search-result-snippet">{hit.snippet}</span>
                  </button>
                </li>
              )}
            </For>
          </ul>
          <Show when={showEmpty()}>
            <p class="muted">{searchEmptyMessage(emptyReason()!)}</p>
          </Show>
        </div>
      </div>
    </Show>
  );
}
