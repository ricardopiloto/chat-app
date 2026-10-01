import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { api, type Channel, type UserNotification } from "../api/client";
import { t } from "../i18n";
import { channelDisplayName, formatNotifWhen } from "../lib/notifFormat";
import {
  dismissDurableNotification,
  durableNotifications,
  loadDurableNotifications,
} from "../preferences/durableNotifications";
import {
  hasAnyUnseen,
  sessionItemsForChannel,
  unseenChannelIds,
} from "../preferences/notifications";

type SessionRow =
  | { kind: "plus"; channelId: string; oldestMessageId: string }
  | { kind: "detail"; channelId: string; messageId: string; createdAt: string };

const MAX_DETAIL_PER_CHANNEL = 5;

function sessionRows(): SessionRow[] {
  const rows: SessionRow[] = [];
  for (const channelId of unseenChannelIds()) {
    const items = sessionItemsForChannel(channelId);
    if (items.length > MAX_DETAIL_PER_CHANNEL) {
      if (items[0])
        rows.push({
          kind: "plus",
          channelId,
          oldestMessageId: items[0].messageId,
        });
      continue;
    }
    for (const item of items)
      rows.push({
        kind: "detail",
        channelId,
        messageId: item.messageId,
        createdAt: item.createdAt,
      });
  }
  return rows;
}

type ChannelRef = { name: string | null; serverId: string | null };

/** Two fixed sections: mentions/replies (durable) and channels with news (this session). */
export function NotificationsPanel(props: {
  open: boolean;
  onClose: () => void;
  onOpenMessage: (
    channelId: string,
    serverId: string,
    messageId: string | null,
  ) => void;
}) {
  const [channels, setChannels] = createSignal<Record<string, ChannelRef>>({});
  let root: HTMLDivElement | undefined;

  async function resolve(ids: string[]) {
    const missing = [...new Set(ids)].filter((id) => id && !(id in channels()));
    await Promise.all(
      missing.map(async (id) => {
        try {
          const ch = await api<Channel>(`/api/channels/${id}`);
          setChannels((prev) => ({
            ...prev,
            [id]: { name: ch.name?.trim() || null, serverId: ch.server_id },
          }));
        } catch {
          setChannels((prev) => ({
            ...prev,
            [id]: { name: null, serverId: null },
          }));
        }
      }),
    );
  }
  createEffect(() => {
    if (props.open) void loadDurableNotifications();
  });
  createEffect(() => {
    void resolve([
      ...durableNotifications().map((n) => n.channel_id),
      ...unseenChannelIds(),
    ]);
  });
  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && props.onClose();
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (root && !root.contains(target) && !target.closest(".news-button"))
        props.onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    onCleanup(() => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    });
  });
  const name = (channelId: string) =>
    channelDisplayName(channels()[channelId]?.name);
  function open(
    channelId: string,
    messageId: string | null,
    durable?: UserNotification,
  ) {
    const serverId = channels()[channelId]?.serverId;
    if (durable) void dismissDurableNotification(durable);
    if (serverId) props.onOpenMessage(channelId, serverId, messageId);
    props.onClose();
  }
  const empty = () => durableNotifications().length === 0 && !hasAnyUnseen();
  return (
    <Show when={props.open}>
      <div
        class="notif-panel"
        ref={(el) => (root = el)}
        role="menu"
        aria-label={t("shell.notifications")}
      >
        <Show when={durableNotifications().length > 0}>
          <h2>{t("chat.mentionsReplies")}</h2>
          <ul>
            <For each={durableNotifications()}>
              {(n) => (
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    data-section="mentions"
                    onClick={() => open(n.channel_id, n.message_id, n)}
                  >
                    <span class="notif-channel">
                      {name(n.channel_id)} ·{" "}
                      {t(n.kind === "reply" ? "chat.reply" : "chat.mention")}
                    </span>
                    <span class="notif-when">
                      {formatNotifWhen(n.created_at)}
                    </span>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
        <Show when={hasAnyUnseen()}>
          <h2>{t("chat.channelsWithNews")}</h2>
          <ul>
            <For each={sessionRows()}>
              {(row) => (
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    data-section="news"
                    onClick={() =>
                      open(
                        row.channelId,
                        row.kind === "plus"
                          ? row.oldestMessageId
                          : row.messageId,
                      )
                    }
                  >
                    <span class="notif-channel">{name(row.channelId)}</span>
                    <span class="notif-when">
                      {row.kind === "plus"
                        ? t("chat.pendingPlus")
                        : formatNotifWhen(row.createdAt)}
                    </span>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
        <Show when={empty()}>
          <p class="muted">{t("chat.noActivity")}</p>
        </Show>
      </div>
    </Show>
  );
}
