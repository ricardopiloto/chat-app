import { For, Match, Show, Switch, createEffect, createMemo, createSignal, on, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { useQueryClient } from "@tanstack/solid-query";
import { avatarUrl, useAuthedSrc } from "../api";
import { Avatar, Badge, Icon } from "../components/ui";
import { getLocale, t } from "../i18n";
import { useSession } from "../session/session";
import { useShell } from "../shell/state";
import { peopleOf } from "./directory";
import { parseQuery } from "./logic/search";
import type { ChatPerson } from "./logic/people";
import { runSearch, type Hit, type SearchOutcome } from "./searching";

export interface SearchHit {
  channelId: string;
  serverId: string;
  messageId: string;
}

const DEBOUNCE_MS = 250;

const when = (iso: string): string => {
  const date = new Date(iso);
  return `${date.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })} · ${date.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" })}`;
};

// Search over the messages this device can decrypt: free text, or "#channel text" to stay in one
// channel. The channel shows as a chip that can be removed. Results are grouped by relevance of
// recency, with the match highlighted.
export function SearchPanel(props: { open: boolean; seed: string | null; seedNonce: number; onClose: () => void; onOpenHit: (hit: SearchHit) => void }) {
  const shell = useShell();
  const session = useSession();
  const cache = useQueryClient();
  const [channel, setChannel] = createSignal<string>();
  const [term, setTerm] = createSignal("");
  const [outcome, setOutcome] = createSignal<SearchOutcome>({ state: "idle", hits: [] });
  const [busy, setBusy] = createSignal(false);
  const [active, setActive] = createSignal(0);
  const [people, setPeople] = createSignal<Map<string, ChatPerson>>(new Map());
  let input: HTMLInputElement | undefined;
  let generation = 0;

  const applyRaw = (raw: string) => {
    const parsed = parseQuery(raw);
    setChannel(parsed.channel);
    setTerm(parsed.term);
  };
  // Each opening starts from its seed (the open channel for Ctrl/Cmd+F, nothing for Ctrl/Cmd+K).
  createEffect(
    on([() => props.open, () => props.seedNonce], ([open]) => {
      if (!open) return;
      applyRaw(props.seed ?? "");
      setOutcome({ state: "idle", hits: [] });
      queueMicrotask(() => input?.focus());
    }),
  );

  const run = async () => {
    const mine = ++generation;
    const parsed = { channel: channel(), term: term().trim() };
    if (!parsed.channel && !parsed.term) {
      setBusy(false);
      return setOutcome({ state: "idle", hits: [] });
    }
    setBusy(true);
    const result = await runSearch(
      { cache, servers: shell.servers.data ?? [], currentServerId: shell.serverId(), identity: session.identity()!, accountId: shell.meId(), cancelled: () => mine !== generation },
      parsed,
    ).catch(() => ({ state: "done" as const, hits: [] as Hit[] }));
    if (mine !== generation) return;
    setPeople(await peopleOf(cache, result.hits.map((h) => h.server.id)));
    if (mine !== generation) return;
    setOutcome(result);
    setActive(0);
    setBusy(false);
  };
  createEffect(() => {
    if (!props.open) return;
    void channel();
    void term();
    const timer = window.setTimeout(() => void run(), DEBOUNCE_MS);
    onCleanup(() => window.clearTimeout(timer));
  });

  const hits = () => outcome().hits;
  const open = (hit: Hit | undefined) => hit && props.onOpenHit({ channelId: hit.channel.id, serverId: hit.server.id, messageId: hit.message.id });

  function onInput(value: string) {
    // Typing "#name " at the start turns into the channel chip.
    const scoped = /^#(\S+)\s(.*)$/s.exec(value);
    if (!channel() && scoped) {
      setChannel(scoped[1]!.toLowerCase());
      setTerm(scoped[2]!);
      return;
    }
    setTerm(value);
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (hits().length) setActive((i) => (i + (event.key === "ArrowDown" ? 1 : -1) + hits().length) % hits().length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      open(hits()[active()]);
    } else if (event.key === "Backspace" && term() === "" && channel()) {
      setChannel(undefined);
    } else if (event.key === "Escape") {
      event.preventDefault();
      props.onClose();
    }
  }
  createEffect(() => {
    if (!props.open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && props.onClose();
    document.addEventListener("keydown", onKey);
    onCleanup(() => document.removeEventListener("keydown", onKey));
  });

  const openChannelName = () => (shell.channel()?.type === "text" ? shell.channel()!.name.toLowerCase() : undefined);
  const resultLine = createMemo(() => (hits().length === 1 ? t("txt.search.oneResult") : t("txt.search.results", { count: hits().length })));

  return (
    <Show when={props.open}>
      <Portal>
        <div class="ch-overlay" onPointerDown={(event) => event.target === event.currentTarget && props.onClose()}>
          <section class="ch-search" role="dialog" aria-modal="true" aria-label={t("txt.search.label")}>
            <div class="ch-search-field">
              <Icon name="search" />
              <Show when={channel()}>
                {(name) => (
                  <span class="ch-chip">
                    <Icon name="tag" />{name()}
                    <button type="button" onClick={() => setChannel(undefined)} title={t("txt.search.removeChannel")} aria-label={t("txt.search.removeChannel")}><Icon name="close" /></button>
                  </span>
                )}
              </Show>
              <input ref={input} value={term()} placeholder={t("txt.search.placeholder")} aria-label={t("txt.search.label")} autocomplete="off" spellcheck={false} onInput={(e) => onInput(e.currentTarget.value)} onKeyDown={onKeyDown} />
              <Show when={term() || channel()}>
                <button type="button" class="ch-clear" onClick={() => { applyRaw(""); input?.focus(); }} title={t("txt.search.clear")} aria-label={t("txt.search.clear")}><Icon name="backspace" /></button>
              </Show>
              <kbd>Esc</kbd>
            </div>
            <div class="ch-scopes" role="tablist">
              <button type="button" role="tab" aria-selected={!channel()} classList={{ active: !channel() }} onClick={() => setChannel(undefined)}>
                {t("txt.search.scopeAll")}<Show when={!channel() && outcome().state === "done"}><span class="ch-n">{hits().length}</span></Show>
              </button>
              <Show when={channel() || openChannelName()}>
                <button type="button" role="tab" aria-selected={!!channel()} classList={{ active: !!channel() }} onClick={() => setChannel(channel() ?? openChannelName())}>
                  <Icon name="tag" />{channel() ?? openChannelName()}<Show when={channel() && outcome().state === "done"}><span class="ch-n">{hits().length}</span></Show>
                </button>
              </Show>
            </div>
            <div class="ch-results" role="listbox" aria-busy={busy()}>
              <Switch>
                <Match when={outcome().state === "idle"}><p class="ch-state">{busy() ? t("txt.search.searching") : t("txt.search.idle")}</p></Match>
                <Match when={outcome().state === "needTerm"}><p class="ch-state">{t("txt.search.needTerm", { channel: channel() ?? "" })}</p></Match>
                <Match when={outcome().state === "noChannel"}><p class="ch-state"><Icon name="search_off" />{t("txt.search.noChannel", { channel: channel() ?? "" })}</p></Match>
                <Match when={outcome().state === "voiceChannel"}><p class="ch-state"><Icon name="volume_up" />{t("txt.search.voiceChannel", { channel: channel() ?? "" })}</p></Match>
                <Match when={outcome().state === "done" && hits().length === 0}><p class="ch-state"><Icon name="search_off" />{t("txt.search.noMatches")}</p></Match>
                <Match when={true}>
                  <For each={hits()}>
                    {(hit, at) => {
                      const sender = () => people().get(hit.message.senderId ?? "");
                      const face = useAuthedSrc(() => (sender()?.hasAvatar ? avatarUrl(sender()!.accountId) : undefined));
                      return (
                        <button type="button" role="option" aria-selected={active() === at()} class="ch-result" classList={{ active: active() === at() }} onMouseEnter={() => setActive(at())} onClick={() => open(hit)}>
                          <Avatar name={sender()?.label ?? "?"} src={face()} size="sm" />
                          <span class="ch-result-body">
                            <span class="ch-result-head">
                              <strong>{sender()?.label ?? t("txt.search.unknownSender")}</strong>
                              <small>{t("txt.search.in")} <b># {hit.channel.name}</b> · {hit.server.name}</small>
                              <time>{when(hit.message.createdAt)}</time>
                            </span>
                            <span class="ch-result-text">
                              {hit.excerpt.clippedStart ? "…" : ""}{hit.excerpt.before}<mark>{hit.excerpt.hit}</mark>{hit.excerpt.after}{hit.excerpt.clippedEnd ? "…" : ""}
                            </span>
                            <Show when={hit.message.attachmentIds.length > 0}>
                              <Badge tone="neutral" mono icon="attach_file">{t("txt.search.attachments", { n: hit.message.attachmentIds.length })}</Badge>
                            </Show>
                          </span>
                        </button>
                      );
                    }}
                  </For>
                </Match>
              </Switch>
            </div>
            <footer class="ch-search-foot">
              <span class="ch-count"><i classList={{ busy: busy() }} />{outcome().state === "done" ? resultLine() : busy() ? t("txt.search.searching") : ""}</span>
              <span class="ch-keys"><kbd>↑↓</kbd>{t("txt.search.hintMove")}<kbd>↵</kbd>{t("txt.search.hintOpen")}<kbd>esc</kbd>{t("txt.search.hintClose")}</span>
            </footer>
          </section>
        </div>
      </Portal>
    </Show>
  );
}

