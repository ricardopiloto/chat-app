import { For, Match, Show, Switch, createEffect, createMemo, createResource, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { useQueryClient } from "@tanstack/solid-query";
import type { Notification } from "../api";
import { avatarUrl } from "../api";
import { Avatar, Badge, Icon } from "../components/ui";
import { t } from "../i18n";
import { useShell } from "../shell/state";
import { useSession } from "../session/session";
import { messagesOf } from "./searching";
import { allChannels, peopleOf, type ChannelRef } from "./directory";
import { loadedMessages } from "./loaded";
import { excerptOf } from "./MessageRow";
import { channelNews, markAllSeen, mentionNotices, unseenCount, type ChannelNews } from "./notices";

type Tab = "all" | "mentions" | "news";

type Card = { type: "mention"; at: string; notice: Notification } | { type: "news"; at: string; news: ChannelNews };

function ago(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return t("txt.notices.justNow");
  if (minutes < 60) return t("txt.notices.minutesAgo", { n: minutes });
  if (minutes < 60 * 24) return t("txt.notices.hoursAgo", { n: Math.floor(minutes / 60) });
  return t("txt.notices.daysAgo", { n: Math.floor(minutes / 60 / 24) });
}

// Dropdown under the bell: mentions and replies (kept until the message is seen) and channels that
// got messages while another was open (this session only). Each card opens the message or channel.
export function NotificationsPanel(props: { open: boolean; onClose: () => void; onOpenMessage: (channelId: string, serverId: string, messageId: string | null, reply?: boolean) => void }) {
  const shell = useShell();
  const session = useSession();
  const cache = useQueryClient();
  const [tab, setTab] = createSignal<Tab>("all");
  let box: HTMLElement | undefined;

  const [directory] = createResource(
    () => (props.open ? (shell.servers.data ?? []).map((s) => s.id).join(",") : undefined),
    async () => {
      const refs = await allChannels(cache, shell.servers.data ?? []);
      // Decrypt the channels behind mentions so the cards can quote the message.
      const needed = new Set(mentionNotices().map((n) => n.channel_id));
      await Promise.all(refs.filter((r) => needed.has(r.channel.id)).map((r) => messagesOf({ identity: session.identity()!, accountId: shell.meId() }, r).catch(() => [])));
      return { channels: new Map<string, ChannelRef>(refs.map((r) => [r.channel.id, r])), people: await peopleOf(cache, refs.map((r) => r.server.id)) };
    },
  );

  const cards = createMemo<Card[]>(() => {
    const mentions: Card[] = mentionNotices().map((notice) => ({ type: "mention", at: notice.created_at, notice }));
    const news: Card[] = channelNews().map((entry) => ({ type: "news", at: entry.at, news: entry }));
    const shown = tab() === "mentions" ? mentions : tab() === "news" ? news : [...mentions, ...news];
    return shown.sort((a, b) => b.at.localeCompare(a.at));
  });

  createEffect(() => {
    if (!props.open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!box?.contains(target) && !target.closest(".news-button")) props.onClose();
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && props.onClose();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    onCleanup(() => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    });
  });

  const channelOf = (id: string) => directory()?.channels.get(id);
  const go = (channelId: string, messageId: string | null, reply = false) => {
    const ref = channelOf(channelId);
    if (!ref) return;
    props.onClose();
    props.onOpenMessage(channelId, ref.server.id, messageId, reply);
  };

  const tabs: { id: Tab; label: () => string }[] = [
    { id: "all", label: () => t("txt.notices.all") },
    { id: "mentions", label: () => t("txt.notices.mentions") },
    { id: "news", label: () => t("txt.notices.news") },
  ];

  return (
    <Show when={props.open}>
      <Portal>
        <aside ref={box} class="ch-notices" role="dialog" aria-label={t("txt.notices.title")}>
          <header>
            <h2>{t("txt.notices.title")}</h2>
            <Show when={unseenCount() > 0}><Badge tone="primary" mono>{unseenCount() === 1 ? t("txt.notices.oneNew") : t("txt.notices.newCount", { count: unseenCount() })}</Badge></Show>
            <Show when={mentionNotices().length > 0}>
              <button type="button" class="ch-clear-all" onClick={() => void markAllSeen()} title={t("txt.notices.clearHint")}><Icon name="done_all" />{t("txt.notices.clear")}</button>
            </Show>
            <button type="button" onClick={props.onClose} title={t("txt.notices.close")} aria-label={t("txt.notices.close")}><Icon name="close" /></button>
          </header>
          <div class="ch-tabs" role="tablist" aria-label={t("txt.notices.tabs")}>
            <For each={tabs}>{(item) => <button type="button" role="tab" aria-selected={tab() === item.id} classList={{ active: tab() === item.id }} onClick={() => setTab(item.id)}>{item.label()}</button>}</For>
          </div>
          <ul class="ch-cards">
            <For each={cards()} fallback={<li class="ch-state"><Icon name="notifications_off" />{t("txt.notices.empty")}</li>}>
              {(card) => (
                <Switch>
                  <Match when={card.type === "mention"}>
                    {(() => {
                      const notice = (card as { notice: Notification }).notice;
                      const actor = () => directory()?.people.get(notice.actor_account_id);
                      const where = () => channelOf(notice.channel_id);
                      const quote = () => {
                        void directory(); // the messages behind mentions are decrypted along with the directory
                        const found = loadedMessages(notice.channel_id)?.find((m) => m.id === notice.message_id);
                        return found?.text ? excerptOf(found.text, 140) : "";
                      };
                      return (
                        <li class="ch-card unseen">
                          <button type="button" class="ch-card-main" onClick={() => go(notice.channel_id, notice.message_id)}>
                            <Avatar name={actor()?.label ?? "?"} src={actor()?.hasAvatar ? avatarUrl(actor()!.accountId) : undefined} size="md" />
                            <span>
                              <span class="ch-card-head"><strong>{actor()?.label ?? t("txt.notices.someone")}</strong><time>{ago(notice.created_at)}</time></span>
                              <span class="ch-card-text">
                                {t(notice.kind === "reply" ? "txt.notices.replied" : "txt.notices.mentioned")} <b>#{where()?.channel.name ?? t("txt.notices.unknownChannel")}</b>
                                <Show when={quote()}>{(text) => <>: “{text()}”</>}</Show>
                              </span>
                            </span>
                          </button>
                          <span class="ch-card-actions">
                            <button type="button" class="primary" onClick={() => go(notice.channel_id, notice.message_id, true)}><Icon name="reply" />{t("txt.notices.reply")}</button>
                            <button type="button" onClick={() => go(notice.channel_id, null)}>{t("txt.notices.viewChannel")}</button>
                          </span>
                        </li>
                      );
                    })()}
                  </Match>
                  <Match when={card.type === "news"}>
                    {(() => {
                      const entry = (card as { news: ChannelNews }).news;
                      const where = () => channelOf(entry.channelId);
                      return (
                        <li class="ch-card">
                          <button type="button" class="ch-card-main" onClick={() => go(entry.channelId, entry.lastMessageId)}>
                            <span class="ch-card-icon"><Icon name="tag" /></span>
                            <span>
                              <span class="ch-card-head"><strong>{where() ? `${where()!.server.name} · #${where()!.channel.name}` : t("txt.notices.unknownChannel")}</strong><time>{ago(entry.at)}</time></span>
                              <span class="ch-card-text">{entry.count === 1 ? t("txt.notices.oneMessage") : t("txt.notices.newMessages", { count: entry.count })}</span>
                            </span>
                          </button>
                          <span class="ch-card-actions">
                            <button type="button" onClick={() => go(entry.channelId, null)}>{t("txt.notices.viewChannel")}</button>
                          </span>
                        </li>
                      );
                    })()}
                  </Match>
                </Switch>
              )}
            </For>
          </ul>
        </aside>
      </Portal>
    </Show>
  );
}
