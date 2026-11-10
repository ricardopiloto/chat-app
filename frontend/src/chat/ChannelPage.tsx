import { For, Match, Show, Switch, createEffect, createMemo, createResource, createSignal, on, onCleanup, onMount } from "solid-js";
import { ApiError, channels as channelsApi, mutes as mutesApi, pins as pinsApi, type Account, type Channel, type RealtimeEnvelope, type Server, type ServerRole } from "../api";
import type { Identity } from "../crypto/identity";
import { Badge, Button, Dialog, Icon, Toast } from "../components/ui";
import { errorText } from "../lib/errors";
import { getLocale, t } from "../i18n";
import { useShell } from "../shell/state";
import { Composer, type ReplyTarget } from "./Composer";
import { DiceChannelFooter } from "./DiceChannelFooter";
import { DiceOverlay } from "./DiceOverlay";
import { canShowDice, preloadDiceBox, safeClear } from "./diceBoxHost";
import type { DiceRoll } from "./logic/timeline";
import { TypingIndicator } from "./TypingIndicator";
import { Lightbox } from "./Lightbox";
import { MessageRow, SystemLine, clockTime, excerptOf } from "./MessageRow";
import { canDeleteMessage, canReplyTo, canWrite } from "./logic/permissions";
import { canManageChannel } from "../lib/capabilities";
import { toPerson, type ChatPerson } from "./logic/people";
import { applyTyping, expireTypers, namedTypers, type Typer } from "./logic/typing";
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
  const [diceQueue, setDiceQueue] = createSignal<DiceRoll[]>([]);
  const diceEligible = () => props.channel.type === "dice" || (props.channel.type === "text" && props.channel.dice_animations_enabled === true);
  createEffect(() => { if (diceEligible() && canShowDice()) void preloadDiceBox().catch(() => {}); });
  onCleanup(() => { setDiceQueue([]); safeClear(); });
  const thread = createThread({
    channelId: () => props.channel.id,
    serverId: () => props.channel.server_id,
    identity: () => props.identity,
    accountId: () => props.me.id,
    subscribe: props.subscribe,
    resync: shell.resync,
    onLiveDice: (message) => {
      if (diceEligible() && message.diceRoll && canShowDice()) setDiceQueue((queue) => [...queue, message.diceRoll!]);
    },
  });

  // --- people: everyone in the server for names and avatars, channel mentionables for "@" suggestions
  const people = createMemo(() => new Map<string, ChatPerson>((shell.members.data ?? []).map((m) => [m.account_id, toPerson(m)])));
  const [mentionables] = createResource(() => props.channel.id, (id) => channelsApi.mentionables(id).catch(() => []));
  const everyone = createMemo(() => [...people().values()]);
  // Suggestions come from who can be mentioned in this channel; chips resolve against every member.
  const suggestible = createMemo(() => (mentionables()?.length ? mentionables()!.map(toPerson).filter((p) => p.accountId !== props.me.id) : everyone().filter((p) => p.accountId !== props.me.id)));
  const [typers, setTypers] = createSignal<Typer[]>([]);
  const typingNames = createMemo(() => namedTypers(typers(), new Map([...people()].map(([id, person]) => [id, person.label])), Date.now()));
  createEffect(on(() => props.channel.id, () => setTypers([])));
  createEffect(on(() => shell.resync(), () => setTypers([])));
  createEffect(() => {
    if (shell.delivery() !== "connected") setTypers([]);
  });
  onMount(() => {
    const stop = props.subscribe((message) => {
      if (message.event !== "typing.updated") return;
      setTypers((current) => applyTyping(current, {
        channelId: String(message.payload.channel_id ?? ""),
        accountId: String(message.payload.account_id ?? ""),
        active: message.payload.active === true,
      }, props.channel.id, props.me.id, Date.now()));
    });
    const timer = window.setInterval(() => setTypers((current) => {
      const next = expireTypers(current, Date.now());
      return next.length === current.length ? current : next;
    }), 1_000);
    onCleanup(() => {
      stop();
      window.clearInterval(timer);
    });
  });
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

  // --- pinned message: banner for every viewer, pin/unpin for managers
  const canManage = () => canManageChannel(props.me.id, props.server, props.channel, props.roles);
  const pinnedId = createMemo(() => props.channel.pinned_message_id ?? undefined);
  const localPin = createMemo(() => {
    const id = pinnedId();
    return id ? thread.messages().find((m) => m.id === id) : undefined;
  });
  // Set only when the directed fetch for this id failed (denied by history, or any other error):
  // D4 treats that as "unavailable", never as a generic error.
  const [unavailablePinId, setUnavailablePinId] = createSignal<string>();
  const pinUnavailable = () => pinnedId() !== undefined && pinnedId() === unavailablePinId();
  const pinLoading = () => pinnedId() !== undefined && !localPin() && !pinUnavailable();
  createEffect(
    on([pinnedId, () => thread.status()], async ([id, state]) => {
      if (!id || localPin() || state !== "ready") return;
      if (await thread.ensureMessage(id)) {
        if (unavailablePinId() === id) setUnavailablePinId(undefined);
      } else {
        setUnavailablePinId(id);
      }
    }),
  );
  const pinAuthor = () => {
    const m = localPin();
    if (!m) return "";
    if (m.webhook) return m.senderDisplayNameSnapshot || t("txt.row.webhookBadge");
    const found = people().get(m.senderId ?? "");
    if (!found) return t("txt.search.unknownSender");
    return found.label === found.handle ? `@${found.handle}` : found.label;
  };
  const [replaceTarget, setReplaceTarget] = createSignal<ChatMessage>();
  async function applyPin(messageId: string, expected: string | null) {
    try {
      await pinsApi.set(props.channel.id, messageId, expected);
      void shell.refreshChannels();
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409) {
        void shell.refreshChannels();
        setNotice(t("txt.pin.conflict"));
      } else {
        setNotice(errorText(failure, "txt.pin.actionFailed"));
      }
      window.setTimeout(() => setNotice(""), 3000);
    }
  }
  function startPin(message: ChatMessage) {
    const current = pinnedId();
    if (current && current !== message.id) {
      setReplaceTarget(message);
      return;
    }
    void applyPin(message.id, current ?? null);
  }
  function confirmReplace() {
    const target = replaceTarget();
    setReplaceTarget(undefined);
    if (target) void applyPin(target.id, pinnedId() ?? null);
  }
  async function unpin() {
    const current = pinnedId();
    if (!current) return;
    try {
      await pinsApi.clear(props.channel.id, current);
      void shell.refreshChannels();
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409) {
        void shell.refreshChannels();
        setNotice(t("txt.pin.conflict"));
      } else {
        setNotice(errorText(failure, "txt.pin.actionFailed"));
      }
      window.setTimeout(() => setNotice(""), 3000);
    }
  }

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
    // The smooth scroll this starts is not the person leaving the bottom.
    lastGesture = 0;
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
    if (pinned() || last.senderId === props.me.id) {
      // A message I just sent follows the bottom, so the jump pill stays hidden.
      if (last.senderId === props.me.id) {
        setPinned(true);
        setAway(0);
        lastGesture = 0;
      }
      settle(() => toBottom(true));
    } else if (fromOthers > 0) setAway((n) => n + fromOthers);
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
    // Captured now, not read inside the timeout: by the time it fires the page may already be
    // unmounted (e.g. the user switched servers), and props.channel would be gone by then.
    const channelId = props.channel.id;
    const timer = window.setTimeout(() => void channelsApi.markRead(channelId).catch(() => undefined), 800);
    onCleanup(() => window.clearTimeout(timer));
  });

  // Jump to a message, loading back page by page until it shows up. Beyond MAX_JUMP_PAGES (an old
  // pin, say) it falls back to the directed fetch (thread.ensureMessage) instead of paging blindly.
  // Never declares success silently: a target that truly cannot be reached surfaces a toast.
  let highlightTimer: number | undefined;
  onCleanup(() => window.clearTimeout(highlightTimer));
  async function focusMessage(target: string, options: { reply?: boolean; errorKey?: "txt.pin.openFailed" } = {}) {
    if (thread.status() !== "ready") return;
    for (let pages = 0; !byId().has(target) && thread.hasOlder() && pages < MAX_JUMP_PAGES; pages++) await thread.loadOlder();
    if (!byId().has(target) && !(await thread.ensureMessage(target))) {
      setNotice(t(options.errorKey ?? "txt.message.openFailed"));
      window.setTimeout(() => setNotice(""), 3000);
      return;
    }
    settle(() => {
      const el = scroller?.querySelector(`[data-msg="${CSS.escape(target)}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "center" });
      setHighlighted(target);
      const found = byId().get(target);
      if (options.reply && found && canReplyTo(found)) startReply(found);
    });
    window.clearTimeout(highlightTimer);
    highlightTimer = window.setTimeout(() => setHighlighted(undefined), HIGHLIGHT_MS);
  }

  // Deep link (?msg=): the search panel and notifications open a message this way.
  createEffect(
    on([() => thread.status(), () => props.focusMessageId], ([state, target]) => {
      if (state !== "ready" || !target) return;
      void focusMessage(target, { reply: props.replyOnFocus });
    }),
  );

  function startReply(message: ChatMessage) {
    setReply(message);
    setFocusComposer((n) => n + 1);
  }
  const replyTarget = (): ReplyTarget | undefined => {
    const m = reply();
    return m && { messageId: m.id, author: m.webhook ? (m.senderDisplayNameSnapshot || t("txt.row.webhookBadge")) : (people().get(m.senderId ?? "")?.label ?? t("txt.search.unknownSender")), excerpt: excerptOf(m.text) || t("txt.attachment.name") };
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

  const description = () => props.channel.type === "dice" ? t("txt.header.dice") : t(props.channel.visibility === "private" ? "txt.header.descPrivate" : "txt.header.descPublic");

  return (
    <section class="ch-page">
      <header class="ch-head">
        <h1><span class="ch-hash">#</span>{props.channel.name}</h1>
        <span class="ch-head-desc">{description()}</span>
        <Show when={props.channel.type === "text"}><Badge tone="secure" mono icon="verified_user">{t("txt.header.e2ee")}</Badge></Show>
        <Show when={props.channel.has_active_webhook}><Badge tone="neutral" mono icon="warning">{t("txt.header.webhookActive")}</Badge></Show>
        <span class="ch-head-actions">
          <button type="button" onClick={() => document.dispatchEvent(new Event("mesa:search-channel"))} title={t("txt.header.search")} aria-label={t("txt.header.search")}><Icon name="search" /></button>
          <button type="button" onClick={shell.toggleMembers} title={t("txt.header.members")} aria-label={t("txt.header.members")} aria-pressed={shell.membersOpen()}><Icon name="group" /></button>
        </span>
      </header>

      <Show when={pinnedId()}>
        {(id) => (
          <div class="ch-pin" classList={{ unavailable: pinUnavailable() }}>
            <Icon name="push_pin" />
            <Switch>
              <Match when={pinUnavailable()}><span class="ch-pin-text">{t("txt.pin.unavailable")}</span></Match>
              <Match when={pinLoading()}><span class="ch-pin-text">{t("txt.pin.loading")}</span></Match>
              <Match when={true}>
                <button type="button" class="ch-pin-open" onClick={() => void focusMessage(id(), { errorKey: "txt.pin.openFailed" })}>
                  <Show when={!localPin()?.unreadable} fallback={<span class="ch-pin-text">{t("txt.pin.unreadable")}</span>}>
                    <strong>{pinAuthor()}</strong>
                    <span class="ch-pin-excerpt">{excerptOf(localPin()!.text) || t("txt.attachment.name")}</span>
                  </Show>
                </button>
              </Match>
            </Switch>
          </div>
        )}
      </Show>

      <div class="ch-stage">
        <div class="ch-scroll" ref={scroller} onScroll={onScroll} onWheel={gesture} onTouchStart={gesture} onTouchMove={gesture} onPointerDown={gesture} onPointerUp={() => { gesture(); onScroll(); }} onKeyDown={gesture}>
          <div class="ch-content" ref={content}>
            <Show when={!thread.hasOlder() && thread.status() === "ready"}>
              <div class="ch-intro">
                <div class="ch-welcome">
                  <span class="ch-welcome-icon">{props.channel.type === "dice" ? <Icon name="casino" /> : "#"}</span>
                  <div>
                    <h2>{t("txt.welcome.title", { name: props.channel.name })}</h2>
                    <p>{props.channel.type === "dice" ? t("txt.welcome.diceText", { server: props.server?.name ?? "" }) : t("txt.welcome.text", { server: props.server?.name ?? "" })}</p>
                  </div>
                </div>
                <Show when={props.channel.type === "text"}><aside class="ch-banner">
                  <Icon name="shield_lock" />
                  <div>
                    <strong>{t("txt.banner.title")}</strong>
                    <p>{t("txt.banner.text")}</p>
                  </div>
                </aside></Show>
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
                                  canReact={canWrite(props.channel) && !mutedUntil()}
                                  canDelete={canDeleteMessage(m(), props.me.id, props.channel, props.server, props.roles)}
                                  canPin={canManage() && !m().system && !m().webhook}
                                  pinned={pinnedId() === m().id}
                                  meId={props.me.id}
                                  quoted={m().replyToId ? byId().get(m().replyToId!) : undefined}
                                  highlighted={highlighted() === m().id}
                                  serverKey={thread.serverKey()}
                                  onReply={() => startReply(m())}
                                  onReact={(code) => void thread.react(m().id, code)}
                                  onPin={() => startPin(m())}
                                  onUnpin={() => void unpin()}
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
        <Show when={!pinned()}>
          <button type="button" class="ch-jump" onClick={jump}>
            {t("txt.jump")}
            <Show when={away() > 0}><Badge tone="primary" mono>{away()}</Badge></Show>
            <Icon name="arrow_downward" />
          </button>
        </Show>
      </div>

      <footer class="ch-foot">
        <TypingIndicator names={typingNames()} narrow={shell.narrow()} />
        <Switch>
          <Match when={!canWrite(props.channel)}><p class="ch-locked"><Icon name="visibility" />{t("txt.readOnly")}</p></Match>
          <Match when={mutedUntil()}>{(until) => <p class="ch-locked"><Icon name="volume_off" />{t("txt.muted", { time: clockTime(until().toISOString()) })}</p>}</Match>
          <Match when={props.channel.type === "dice"}><DiceChannelFooter channelId={props.channel.id} onSent={() => settle(() => toBottom(true))} /></Match>
          <Match when={true}>
            <Composer
              channelId={props.channel.id}
              channelName={props.channel.name}
              thread={thread}
              people={suggestible()}
              everyone={everyone()}
              canAttach={props.server?.owner_account_id === props.me.id || shell.can("can_attach_files")}
              canMentionEveryone={props.server?.owner_account_id === props.me.id || shell.can("can_mention_everyone")}
              reply={replyTarget()}
              onCancelReply={() => setReply(undefined)}
              onSent={() => settle(() => toBottom(true))}
              focusSignal={focusComposer()}
              onTyping={shell.sendTyping}
            />
          </Match>
        </Switch>
      </footer>

      <DiceOverlay roll={diceQueue()[0]} onDone={() => setDiceQueue((queue) => queue.slice(1))} />
      <Show when={viewer() && thread.serverKey()}>
        <Lightbox ids={viewer()!.ids} start={viewer()!.start} serverKey={thread.serverKey()!} onClose={() => setViewer(undefined)} />
      </Show>
      <Dialog open={replaceTarget() !== undefined} title={t("txt.pin.replaceTitle")} icon="push_pin" onClose={() => setReplaceTarget(undefined)}>
        <div class="ch-pin-confirm">
          <p>{t("txt.pin.replaceBody")}</p>
          <footer class="ch-pin-confirm-actions">
            <Button onClick={() => setReplaceTarget(undefined)} data-autofocus>{t("txt.pin.cancel")}</Button>
            <Button variant="primary" onClick={confirmReplace}>{t("txt.pin.confirmReplace")}</Button>
          </footer>
        </div>
      </Dialog>
      <Toast show={notice() !== ""} message={notice()} />
    </section>
  );
}
