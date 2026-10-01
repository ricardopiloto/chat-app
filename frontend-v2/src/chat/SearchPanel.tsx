import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { api, type Channel, type Message, type Server } from "../api/client";
import { decryptMessage, getServerKey } from "../crypto/serverKey";
import { t } from "../i18n";
import {
  parseSearchQuery,
  type ParsedSearchQuery,
} from "../search/parseSearchQuery";

export type SearchHit = {
  serverId: string;
  serverName: string;
  channelId: string;
  channelName: string;
  messageId: string;
  snippet: string;
};

type EmptyReason = "channel_not_found" | "voice_only" | "no_results";

/** Client-side search: decrypts the recent history of the text channels the user can open. */
export function SearchPanel(props: {
  open: boolean;
  seed: string | null;
  seedNonce: number;
  onClose: () => void;
  onOpenHit: (hit: SearchHit) => void;
}) {
  const [query, setQuery] = createSignal("");
  const [status, setStatus] = createSignal<"idle" | "searching" | "done">(
    "idle",
  );
  const [results, setResults] = createSignal<SearchHit[]>([]);
  const [empty, setEmpty] = createSignal<EmptyReason | null>(null);
  let timer: number | undefined;
  let generation = 0;
  let input: HTMLInputElement | undefined;
  let root: HTMLDivElement | undefined;

  function reset(value: string) {
    setQuery(value);
    setResults([]);
    setEmpty(null);
    setStatus("idle");
  }
  createEffect(() => {
    void props.seedNonce;
    if (!props.open) {
      reset("");
      return;
    }
    const seed = props.seed ?? "";
    reset(seed);
    queueMicrotask(() => {
      input?.focus();
      input?.setSelectionRange(seed.length, seed.length);
    });
  });
  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        props.onClose();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (root && !root.contains(e.target as Node)) props.onClose();
    };
    window.addEventListener("keydown", onKey);
    const id = window.setTimeout(
      () => window.addEventListener("pointerdown", onPointer),
      0,
    );
    onCleanup(() => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    });
  });
  onCleanup(() => window.clearTimeout(timer));

  function onInput(value: string) {
    setQuery(value);
    window.clearTimeout(timer);
    const parsed = parseSearchQuery(value);
    if (parsed.term.length < 2) {
      setResults([]);
      setEmpty(null);
      setStatus("idle");
      return;
    }
    setStatus("searching");
    setEmpty(null);
    timer = window.setTimeout(() => void run(parsed), 250);
  }

  async function run(parsed: ParsedSearchQuery) {
    const gen = ++generation;
    setResults([]);
    setEmpty(null);
    const needle = parsed.term.toLowerCase();
    const nameNeedle = (parsed.channelName ?? "").toLowerCase();
    let hits = 0;
    let reason: EmptyReason | null = null;
    try {
      const servers = await api<Server[]>("/api/servers");
      const targets: { server: Server; channel: Channel }[] = [];
      let matchedName = false;
      for (const server of servers) {
        let channels: Channel[] = [];
        try {
          channels = await api<Channel[]>(`/api/servers/${server.id}/channels`);
        } catch {
          continue;
        }
        if (gen !== generation) return;
        for (const channel of channels) {
          if (parsed.mode === "scoped") {
            if (channel.name.toLowerCase() !== nameNeedle) continue;
            matchedName = true;
          }
          if (channel.type === "text") targets.push({ server, channel });
        }
      }
      if (parsed.mode === "scoped" && targets.length === 0) {
        reason = matchedName ? "voice_only" : "channel_not_found";
        return;
      }
      for (const { server, channel } of targets) {
        const key = getServerKey(server.id);
        if (!key) continue;
        try {
          const rows = await api<Message[]>(
            `/api/channels/${channel.id}/messages`,
          );
          if (gen !== generation) return;
          for (const row of rows) {
            if (row.kind === "system") continue;
            let text = "";
            try {
              text = await decryptMessage(key, row.content_ciphertext ?? "");
            } catch {
              continue;
            }
            if (!text.toLowerCase().includes(needle)) continue;
            hits += 1;
            setResults((prev) => [
              ...prev,
              {
                serverId: server.id,
                serverName: server.name,
                channelId: channel.id,
                channelName: channel.name,
                messageId: row.id,
                snippet: text.length > 120 ? `${text.slice(0, 117)}…` : text,
              },
            ]);
          }
        } catch {
          /* one unreadable channel does not stop the search */
        }
      }
    } finally {
      if (gen === generation) {
        setEmpty(reason ?? (hits === 0 ? "no_results" : null));
        setStatus("done");
      }
    }
  }

  return (
    <Show when={props.open}>
      <div class="search-panel" ref={(el) => (root = el)} role="search">
        <input
          ref={(el) => (input = el)}
          type="search"
          placeholder={t("chat.searchPlaceholder")}
          aria-label={t("chat.searchMessages")}
          value={query()}
          onInput={(e) => onInput(e.currentTarget.value)}
        />
        <div class="search-results">
          <Show when={status() === "searching"}>
            <p class="muted">{t("chat.searching")}</p>
          </Show>
          <ul>
            <For each={results()}>
              {(hit) => (
                <li>
                  <button
                    type="button"
                    class="search-result"
                    onClick={() => props.onOpenHit(hit)}
                  >
                    <span class="search-result-meta">
                      {hit.serverName} · #{hit.channelName}
                    </span>
                    <span class="search-result-snippet">{hit.snippet}</span>
                  </button>
                </li>
              )}
            </For>
          </ul>
          <Show when={status() === "done" && results().length === 0 && empty()}>
            {(reason) => (
              <p class="muted search-empty" data-reason={reason()}>
                {t(`chat.searchEmpty.${reason()}`)}
              </p>
            )}
          </Show>
        </div>
      </div>
    </Show>
  );
}
