import { For, Match, Show, Switch, createEffect, createMemo, createResource, createSignal, on, onCleanup, onMount } from "solid-js";
import { channels as channelsApi, mutes as mutesApi, type Account, type Channel, type RealtimeEnvelope, type Server, type ServerRole } from "../api";
import type { Identity } from "../crypto/identity";
import { Badge, Button, Icon, Toast } from "../components/ui";
import { errorText } from "../lib/errors";
import { getLocale, t } from "../i18n";
import { useShell } from "../shell/state";
import { Composer, type ReplyTarget } from "./Composer";
import { Lightbox } from "./Lightbox";
import { MessageRow, SystemLine, clockTime, excerptOf } from "./MessageRow";
import { canDeleteMessage, canReplyTo, canWrite } from "./logic/permissions";
import { toPerson, type ChatPerson } from "./logic/people";
import { buildTimeline, type ChatMessage } from "./logic/timeline";
import { clearNews, markSeen } from "./notices";
import { createThread } from "./thread";

const NEAR_BOTTOM_PX = 96;
const GESTURE_MS = 700;
const LOAD_OLDER_AT_PX = 48;
const HIGHLIGHT_MS = 2200;
const MAX_JUMP_PAGES = 10;

const dayLabels = () => ({
  today: t("txt.day.today"),
  yesterday: t("txt.day.yesterday"),
  full: (date: Date) => date.toLocaleDateString(getLocale(), { day: "numeric", month: "long", year: "numeric" }),
});

export function ChannelPage(props: {
  me: Account;
  channel: Channel;
  identity: Identity;
  server: Server | undefined;
  roles: ServerRole[];
  subscribe: (handler: (event: RealtimeEnvelope) => void) => () => void;
  focusMessageId: string | null;
  replyOnFocus: boolean;
}) {
  const shell = useShell();
  const thread = createThread({
    channelId: () => props.channel.id,
    serverId: () => props.channel.server_id,
    identity: () => props.identity,
    accountId: () => props.me.id,
    subscribe: props.subscribe,
    resync: shell.resync,
  });

  // --- people: everyone in the server for names and avatars, channel mentionables for "@" suggestions
  const people = createMemo(() => new Map<string, ChatPerson>((shell.members.data ?? []).map((m) => [m.account_id, toPerson(m)])));
  const [mentionables] = createResource(() => props.channel.id, (id) => channelsApi.mentionables(id).catch(() => []));
  const everyone = createMemo(() => [...people().values()]);
  // Suggestions come from who can be mentioned in this channel; chips resolve against every member.
  const suggestible = createMemo(() => (mentionables()?.length ? mentionables()!.map(toPerson).filter((p) => p.accountId !== props.me.id) : everyone().filter((p) => p.accountId !== props.me.id)));
  const roleBadge = (accountId: string | undefined): string | undefined => {
    if (!accountId) return undefined;
    if (props.server?.owner_account_id === accountId) return t("txt.row.owner");
    return props.roles.filter((r) => !r.is_system && r.member_ids.includes(accountId)).sort((a, b) => b.position - a.position)[0]?.name;
  };

  // --- muted?
  const [mute, { refetch: recheckMute }] = createResource(() => props.channel.id, (id) => mutesApi.mine(id).catch(() => undefined));
  const mutedUntil = () => {
    const found = mute();
    return found?.muted && found.ends_at && new Date(found.ends_at).getTime() > Date.now() ? new Date(found.ends_at) : undefined;
  };
  createEffect(() => {
    const until = mutedUntil();
    if (!until) return;
    const timer = window.setTimeout(() => void recheckMute(), Math.max(1000, until.getTime() - Date.now() + 500));
    onCleanup(() => window.clearTimeout(timer));
  });

  // --- list, scrolling, "jump to present"
  let scroller: HTMLDivElement | undefined;
  let content: HTMLDivElement | undefined;
  const [pinned, setPinned] = createSignal(true);
  const [away, setAway] = createSignal(0);
  const [highlighted, setHighlighted] = createSignal<string>();
  const [reply, setReply] = createSignal<ChatMessage>();
  const [focusComposer, setFocusComposer] = createSignal(0);
  const [viewer, setViewer] = createSignal<{ ids: string[]; start: number }>();
  const [notice, setNotice] = createSignal("");

  const rows = createMemo(() => buildTimeline(thread.messages(), new Date(), dayLabels()));
  // Rows are looked up by key and grouped per day, so a new message only adds a row instead of
  // rebuilding the list, and each day label sticks only while its own day is on screen.
  const table = createMemo(() => new Map(rows().map((row) => [row.key, row])));
  const dayGroups = createMemo(() => {
    const groups = new Map<string, string[]>();
    let current = "day:start";
    for (const row of rows()) {
      if (row.type === "day") {
        current = row.key;
        groups.set(current, []);
      } else {
        if (!groups.has(current)) groups.set(current, []);
        groups.get(current)!.push(row.key);
      }
    }
    return groups;
  });
  const dayKeys = createMemo(() => [...dayGroups().keys()]);
  const byId = createMemo(() => new Map(thread.messages().map((m) => [m.id, m])));

  const nearBottom = () => (scroller ? scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < NEAR_BOTTOM_PX : true);
  // Only scrolling the person started (wheel, touch, keys, dragging the bar) can move them off
  // the bottom; content growing under them, such as an image finishing, must not.
  let lastGesture = 0;
  const gesture = () => (lastGesture = Date.now());
  const toBottom = (smooth = false) => scroller?.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  const settle = (action: () => void) => queueMicrotask(() => requestAnimationFrame(action));

  async function loadOlderKeepingPlace() {
    if (!scroller || !thread.hasOlder() || thread.loadingOlder()) return;
    const before = scroller.scrollHeight;
    if (await thread.loadOlder()) settle(() => scroller && (scroller.scrollTop += scroller.scrollHeight - before));
  }
  function onScroll() {
    if (Date.now() - lastGesture > GESTURE_MS) return;
    const near = nearBottom();
    setPinned(near);
    if (near) setAway(0);
    if (scroller && scroller.scrollTop < LOAD_OLDER_AT_PX && thread.status() === "ready") void loadOlderKeepingPlace();
  }
  const jump = () => {
    setAway(0);
    setPinned(true);
    toBottom(true);
  };

  // New messages at the bottom: follow them when already at the bottom (or when I sent them), otherwise count them.
  let lastSeen = "";
  createEffect(() => {
    const list = thread.messages();
    const last = list.at(-1);
    if (!last) {
      lastSeen = "";
      return;
    }
    const first = lastSeen === "";
    const at = list.findIndex((m) => m.id === lastSeen);
    const added = first ? 0 : at === -1 ? 0 : list.length - 1 - at;
    lastSeen = last.id;
    if (first) return settle(() => !props.focusMessageId && toBottom());
    if (added === 0) return;
    const fromOthers = list.slice(-added).filter((m) => m.senderId !== props.me.id).length;
    if (pinned() || last.senderId === props.me.id) settle(() => toBottom(true));
    else if (fromOthers > 0) setAway((n) => n + fromOthers);
  });

  onMount(() => {
    // Pictures finish loading after the text: keep the bottom in view while that happens.
    const resize = new ResizeObserver(() => pinned() && toBottom());
    if (content) resize.observe(content);
    onCleanup(() => resize.disconnect());
  });

  // A message counts as seen once it has been on screen: that clears its notification.
  let seen: IntersectionObserver | undefined;
  onMount(() => {
    seen = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && markSeen((entry.target as HTMLElement).dataset.msg ?? "")),
      { root: scroller, threshold: 0.6 },
    );
    onCleanup(() => seen?.disconnect());
  });
  const watch = (element: HTMLElement, messageId: string) => {
    element.dataset.msg = messageId;
    seen?.observe(element);
    onCleanup(() => seen?.unobserve(element));
  };

  // The channel counts as read while it is open at the bottom.
  createEffect(() => {
    if (thread.status() !== "ready") return;
    clearNews(props.channel.id);
    if (!pinned()) return;
    void thread.messages().length;
    const timer = window.setTimeout(() => void channelsApi.markRead(props.channel.id).catch(() => undefined), 800);
    onCleanup(() => window.clearTimeout(timer));
  });

  // Deep link (?msg=): load back until the message is there, scroll to it and mark it for a moment.
  createEffect(
    on([() => thread.status(), () => props.focusMessageId], async ([state, target]) => {
      if (state !== "ready" || !target) return;
      for (let pages = 0; !byId().has(target) && thread.hasOlder() && pages < MAX_JUMP_PAGES; pages++) await thread.loadOlder();
      settle(() => {
        scroller?.querySelector(`[data-msg="${CSS.escape(target)}"]`)?.scrollIntoView({ block: "center" });
        setHighlighted(target);
        const found = byId().get(target);
        if (props.replyOnFocus && found && canReplyTo(found)) startReply(found);
      });
      const timer = window.setTimeout(() => setHighlighted(undefined), HIGHLIGHT_MS);
      onCleanup(() => window.clearTimeout(timer));
    }),
  );

  function startReply(message: ChatMessage) {
    setReply(message);
    setFocusComposer((n) => n + 1);
  }
  const replyTarget = (): ReplyTarget | undefined => {
    const m = reply();
    return m && { messageId: m.id, author: people().get(m.senderId ?? "")?.label ?? t("txt.search.unknownSender"), excerpt: excerptOf(m.text) || t("txt.attachment.name") };
  };
  async function remove(message: ChatMessage) {
    try {
      await thread.remove(message.id);
      if (reply()?.id === message.id) setReply(undefined);
    } catch (failure) {
      setNotice(errorText(failure, "txt.row.deleteFailed"));
      window.setTimeout(() => setNotice(""), 3000);
    }
  }

  const description = () => t(props.channel.visibility === "private" ? "txt.header.descPrivate" : "txt.header.descPublic");

  return (
    <section class="ch-page">
      <header class="ch-head">
        <h1><span class="ch-hash">#</span>{props.channel.name}</h1>
        <span class="ch-head-desc">{description()}</span>
        <Badge tone="secure" mono icon="verified_user">{t("txt.header.e2ee")}</Badge>
        <span class="ch-head-actions">
          <button type="button" onClick={() => document.dispatchEvent(new Event("mesa:search-channel"))} title={t("txt.header.search")} aria-label={t("txt.header.search")}><Icon name="search" /></button>
          <button type="button" onClick={shell.toggleMembers} title={t("txt.header.members")} aria-label={t("txt.header.members")} aria-pressed={shell.membersOpen()}><Icon name="group" /></button>
        </span>
      </header>

      <div class="ch-stage">
        <div class="ch-scroll" ref={scroller} onScroll={onScroll} onWheel={gesture} onTouchStart={gesture} onTouchMove={gesture} onPointerDown={gesture} onPointerUp={() => { gesture(); onScroll(); }} onKeyDown={gesture}>
          <div class="ch-content" ref={content}>
            <Show when={!thread.hasOlder() && thread.status() === "ready"}>
              <div class="ch-intro">
                <div class="ch-welcome">
                  <span class="ch-welcome-icon">#</span>
                  <div>
                    <h2>{t("txt.welcome.title", { name: props.channel.name })}</h2>
                    <p>{t("txt.welcome.text", { server: props.server?.name ?? "" })}</p>
                  </div>
                </div>
                <aside class="ch-banner">
                  <Icon name="shield_lock" />
                  <div>
                    <strong>{t("txt.banner.title")}</strong>
                    <p>{t("txt.banner.text")}</p>
                  </div>
                </aside>
              </div>
            </Show>
            <Show when={thread.hasOlder()}>
              <button type="button" class="ch-older" onClick={() => void loadOlderKeepingPlace()} disabled={thread.loadingOlder()}>
                {thread.loadingOlder() ? t("txt.state.loadingOlder") : t("txt.state.older")}
              </button>
            </Show>
            <Switch>
              <Match when={thread.status() === "loading"}><p class="ch-state" role="status"><Icon name="progress_activity" />{t("txt.state.loading")}</p></Match>
              <Match when={thread.status() === "noKey"}><p class="ch-state" role="status"><Icon name="key" />{t("txt.state.noKey")}</p></Match>
              <Match when={thread.status() === "error"}>
                <div class="ch-state" role="alert"><Icon name="error" />{t("txt.state.error")}<Button onClick={() => void thread.retry()}>{t("txt.state.retry")}</Button></div>
              </Match>
              <Match when={thread.status() === "ready" && thread.messages().length === 0}><p class="ch-state">{t("txt.state.empty")}</p></Match>
            </Switch>
            <For each={dayKeys()}>
              {(dayKey) => {
                const day = () => table().get(dayKey) as { label: string } | undefined;
                return (
                  <section class="ch-daygroup">
                    <Show when={day()}><div class="ch-day" role="separator"><span>{day()!.label}</span></div></Show>
                    <For each={dayGroups().get(dayKey) ?? []}>
                      {(key) => {
                        const row = () => table().get(key);
                        const message = () => (row() as { message: ChatMessage } | undefined)?.message;
                        return (
                          <Show when={message()}>
                            {(m) =>
                              row()!.type === "system" ? (
                                <SystemLine message={m()} />
                              ) : (
                                <MessageRow
                                  message={m()}
                                  startsGroup={(row() as { startsGroup: boolean }).startsGroup}
                                  people={people()}
                                  mentionable={everyone()}
                                  roleBadge={roleBadge(m().senderId)}
                                  mine={m().senderId === props.me.id}
                                  canReply={canReplyTo(m()) && canWrite(props.channel) && !mutedUntil()}
                                  canDelete={canDeleteMessage(m(), props.me.id, props.channel, props.server, props.roles)}
                                  quoted={m().replyToId ? byId().get(m().replyToId!) : undefined}
                                  highlighted={highlighted() === m().id}
                                  serverKey={thread.serverKey()}
                                  onReply={() => startReply(m())}
                                  onDelete={() => remove(m())}
                                  onOpenImage={(index) => setViewer({ ids: m().attachmentIds, start: index })}
                                  onFocusMember={shell.focusMember}
                                  watch={watch}
                                />
                              )
                            }
                          </Show>
                        );
                      }}
                    </For>
                  </section>
                );
              }}
            </For>
          </div>
        </div>
        <Show when={!pinned() && away() > 0}>
          <button type="button" class="ch-jump" onClick={jump}>
            {t("txt.jump")}<Badge tone="primary" mono>{away()}</Badge><Icon name="arrow_downward" />
          </button>
        </Show>
      </div>

      <footer class="ch-foot">
        <Switch>
          <Match when={!canWrite(props.channel)}><p class="ch-locked"><Icon name="visibility" />{t("txt.readOnly")}</p></Match>
          <Match when={mutedUntil()}>{(until) => <p class="ch-locked"><Icon name="volume_off" />{t("txt.muted", { time: clockTime(until().toISOString()) })}</p>}</Match>
          <Match when={true}>
            <Composer
              channelId={props.channel.id}
              channelName={props.channel.name}
              thread={thread}
              people={suggestible()}
              everyone={everyone()}
              canAttach={props.server?.owner_account_id === props.me.id || shell.can("can_attach_files")}
              reply={replyTarget()}
              onCancelReply={() => setReply(undefined)}
              onSent={() => settle(() => toBottom(true))}
              focusSignal={focusComposer()}
            />
          </Match>
        </Switch>
      </footer>

      <Show when={viewer() && thread.serverKey()}>
        <Lightbox ids={viewer()!.ids} start={viewer()!.start} serverKey={thread.serverKey()!} onClose={() => setViewer(undefined)} />
      </Show>
      <Toast show={notice() !== ""} message={notice()} />
    </section>
  );
}
