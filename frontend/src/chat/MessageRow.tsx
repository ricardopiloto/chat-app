import { For, Show, createSignal, onCleanup } from "solid-js";
import { Avatar, Badge, Icon } from "../components/ui";
import { avatarUrl } from "../api";
import { getLocale, t } from "../i18n";
import { AttachmentThumb } from "./AttachmentThumb";
import { LinkCards } from "./LinkCards";
import { splitMentions } from "./logic/mentions";
import type { ChatPerson } from "./logic/people";
import type { ChatMessage } from "./logic/timeline";

const URL_SPLIT = /(https?:\/\/[^\s<>"]+)/gi;
const TRAILING = /[.,;:!?)\]}'"]+$/;
const QUOTE_LENGTH = 90;

export const clockTime = (iso: string): string => new Date(iso).toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });

export const excerptOf = (text: string, length = QUOTE_LENGTH): string => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > length ? `${flat.slice(0, length - 1)}…` : flat;
};

/** Plain text with web links made clickable; only http(s) addresses become links. */
function Linked(props: { text: string }) {
  return (
    <For each={props.text.split(URL_SPLIT)}>
      {(piece, at) => {
        if (at() % 2 === 0) return <>{piece}</>;
        const url = piece.replace(TRAILING, "");
        return (
          <>
            <a href={url} target="_blank" rel="noopener noreferrer nofollow">{url}</a>
            {piece.slice(url.length)}
          </>
        );
      }}
    </For>
  );
}

export interface MessageRowProps {
  message: ChatMessage;
  startsGroup: boolean;
  people: Map<string, ChatPerson>;
  mentionable: ChatPerson[];
  roleBadge: string | undefined;
  mine: boolean;
  canReply: boolean;
  canDelete: boolean;
  quoted: ChatMessage | undefined;
  highlighted: boolean;
  serverKey: Uint8Array | undefined;
  onReply: () => void;
  onDelete: () => Promise<void>;
  onOpenImage: (index: number) => void;
  onFocusMember: (accountId: string) => void;
  /** Lets the list notice when the row scrolls into view. */
  watch: (element: HTMLElement, messageId: string) => void;
}

export function MessageRow(props: MessageRowProps) {
  const [armed, setArmed] = createSignal(false);
  let disarm = 0;
  onCleanup(() => window.clearTimeout(disarm));
  const author = () => props.people.get(props.message.senderId ?? "");
  // Like the mockups, a member without a display name is shown as @handle.
  const authorName = () => {
    const found = author();
    if (!found) return t("txt.search.unknownSender");
    return found.label === found.handle ? `@${found.handle}` : found.label;
  };
  const quoteAuthor = () => {
    const found = props.people.get(props.quoted?.senderId ?? props.message.replySenderId ?? "");
    return found ? (found.label === found.handle ? `@${found.handle}` : found.label) : t("txt.search.unknownSender");
  };

  function pressDelete() {
    if (!armed()) {
      setArmed(true);
      disarm = window.setTimeout(() => setArmed(false), 3000);
      return;
    }
    window.clearTimeout(disarm);
    setArmed(false);
    void props.onDelete();
  }

  return (
    <article ref={(el) => props.watch(el, props.message.id)} class="ch-msg" classList={{ grouped: !props.startsGroup, mine: props.mine, highlighted: props.highlighted }} data-msg={props.message.id}>
      <div class="ch-msg-gutter">
        <Show when={props.startsGroup}>
          <Avatar name={author()?.label ?? "?"} src={author()?.hasAvatar ? avatarUrl(author()!.accountId) : undefined} size="lg" />
        </Show>
        <time class="ch-msg-hover-time" datetime={props.message.createdAt}>{clockTime(props.message.createdAt)}</time>
      </div>
      <div class="ch-msg-main">
        <Show when={props.startsGroup}>
          <header>
            <strong class="ch-msg-author">{authorName()}</strong>
            <Show when={author() && author()!.label !== author()!.handle}><small class="ch-msg-handle">@{author()!.handle}</small></Show>
            <Show when={props.roleBadge}>{(label) => <Badge tone="neutral" mono>{label()}</Badge>}</Show>
            <time datetime={props.message.createdAt}>{clockTime(props.message.createdAt)}</time>
          </header>
        </Show>
        <Show when={props.message.replyToId}>
          <p class="ch-quote">
            <Icon name="subdirectory_arrow_right" />
            <strong>{quoteAuthor()}:</strong>
            <span>{props.quoted ? excerptOf(props.quoted.text) || t("txt.attachment.name") : t("txt.row.quoteGone")}</span>
          </p>
        </Show>
        <Show when={!props.message.unreadable} fallback={<p class="ch-unreadable"><Icon name="lock" />{t("txt.row.unreadable")}</p>}>
          <Show when={props.message.text}>
            <p class="ch-msg-text">
              <For each={splitMentions(props.message.text, props.mentionable, props.message.mentionsEveryone)}>
                {(part) =>
                  part.type === "mention" ? (
                    <button type="button" class="ch-mention" onClick={() => props.onFocusMember(part.accountId)}>{part.value}</button>
                  ) : part.type === "everyone" ? (
                    <span class="ch-mention everyone">{part.value}</span>
                  ) : (
                    <Linked text={part.value} />
                  )
                }
              </For>
            </p>
          </Show>
          <Show when={props.message.attachmentIds.length > 0}>
            <div class="ch-attachments">
              <For each={props.message.attachmentIds}>
                {(id, at) => <AttachmentThumb attachmentId={id} serverKey={props.serverKey} onOpen={() => props.onOpenImage(at())} />}
              </For>
            </div>
          </Show>
          <Show when={props.message.text}><LinkCards text={props.message.text} /></Show>
        </Show>
      </div>
      <Show when={props.canReply || props.canDelete}>
        <div class="ch-msg-actions" role="toolbar">
          <Show when={props.canReply}>
            <button type="button" onClick={props.onReply} title={t("txt.row.reply")} aria-label={t("txt.row.reply")}><Icon name="reply" /></button>
          </Show>
          <Show when={props.canDelete}>
            <button type="button" class="danger" classList={{ armed: armed() }} onClick={pressDelete} title={t("txt.row.delete")} aria-label={t("txt.row.delete")}>
              <Icon name="delete" />
              <Show when={armed()}><span>{t("txt.row.confirmDelete")}</span></Show>
            </button>
          </Show>
        </div>
      </Show>
    </article>
  );
}

/** Row for server-generated lines such as a member joining. */
export function SystemLine(props: { message: ChatMessage }) {
  return (
    <div class="ch-system" data-msg={props.message.id}>
      <Icon name="waving_hand" />
      <span>{props.message.text}</span>
      <time datetime={props.message.createdAt}>{clockTime(props.message.createdAt)}</time>
    </div>
  );
}
