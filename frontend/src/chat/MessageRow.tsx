import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Avatar, Badge, Icon } from "../components/ui";
import { avatarUrl, useAuthedSrc } from "../api";
import { getLocale, t } from "../i18n";
import { AttachmentThumb } from "./AttachmentThumb";
import { EmojiPicker } from "./EmojiPicker";
import { LinkCards } from "./LinkCards";
import { BY_CODE } from "./logic/emoji";
import { splitMentions } from "./logic/mentions";
import { pickPlacement, type PickerPlacement } from "./logic/popover";
import type { ChatPerson } from "./logic/people";
import type { ChatMessage, MessageReaction } from "./logic/timeline";

/** Names listed in a reaction tooltip before the rest collapse into "and N more". */
const REACTION_NAMES = 8;

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
  canReact: boolean;
  canDelete: boolean;
  meId: string;
  quoted: ChatMessage | undefined;
  highlighted: boolean;
  serverKey: Uint8Array | undefined;
  onReply: () => void;
  onReact: (emojiCode: string) => void;
  onDelete: () => Promise<void>;
  onOpenImage: (index: number) => void;
  onFocusMember: (accountId: string) => void;
  /** Lets the list notice when the row scrolls into view. */
  watch: (element: HTMLElement, messageId: string) => void;
}

function personName(people: Map<string, ChatPerson>, accountId: string): string {
  const found = people.get(accountId);
  if (!found) return t("txt.search.unknownSender");
  return found.label === found.handle ? `@${found.handle}` : found.label;
}

function ReactionPill(props: { reaction: MessageReaction; people: Map<string, ChatPerson>; meId: string; canReact: boolean; onReact: (emojiCode: string) => void }) {
  const glyph = () => BY_CODE.get(props.reaction.emojiCode)?.glyph ?? props.reaction.emojiCode;
  const names = () => props.reaction.accountIds.map((id) => personName(props.people, id));
  const shown = () => names().slice(0, REACTION_NAMES);
  const extra = () => Math.max(0, names().length - REACTION_NAMES);
  const mine = () => props.reaction.accountIds.includes(props.meId);
  return (
    <button
      type="button"
      class="ch-react-pill"
      classList={{ mine: mine() }}
      disabled={!props.canReact}
      aria-pressed={mine()}
      onClick={() => props.onReact(props.reaction.emojiCode)}
    >
      <span>{glyph()}</span>
      <span>{props.reaction.count}</span>
      <span class="ch-react-tip" role="tooltip">
        {shown().join(", ")}
        <Show when={extra() > 0}> {t("txt.row.reactMore", { count: extra() })}</Show>
      </span>
    </button>
  );
}

export function MessageRow(props: MessageRowProps) {
  const [armed, setArmed] = createSignal(false);
  const [picker, setPicker] = createSignal(false);
  const [pickerPlace, setPickerPlace] = createSignal<PickerPlacement & { maxWidth?: number }>({ placement: "below" });
  let disarm = 0;
  let anchor: HTMLDivElement | undefined;
  onCleanup(() => window.clearTimeout(disarm));
  createEffect(() => {
    if (!picker()) return;
    queueMicrotask(() => anchor?.querySelector<HTMLElement>("[data-autofocus]")?.focus());
    const close = (event: PointerEvent) => {
      if (anchor && !anchor.contains(event.target as Node)) setPicker(false);
    };
    document.addEventListener("pointerdown", close);
    onCleanup(() => document.removeEventListener("pointerdown", close));
  });
  function measurePicker(): PickerPlacement & { maxWidth?: number } {
    const node = anchor;
    if (!node) return { placement: "below" };
    const anchorRect = node.getBoundingClientRect();
    const scroll = node.closest(".ch-scroll");
    const frame = scroll ? scroll.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
    const place = pickPlacement({ below: frame.bottom - anchorRect.bottom, above: anchorRect.top - frame.top });
    const span = anchorRect.right - frame.left;
    return span < 320 ? { ...place, maxWidth: Math.max(0, span - 8) } : place;
  }
  function togglePicker() {
    if (picker()) {
      setPicker(false);
      return;
    }
    setPickerPlace(measurePicker());
    setPicker(true);
  }
  const author = () => props.people.get(props.message.senderId ?? "");
  const avatar = useAuthedSrc(() => (author()?.hasAvatar ? avatarUrl(author()!.accountId) : undefined));
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
          <Avatar name={author()?.label ?? "?"} src={avatar()} size="lg" />
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
        <Show when={props.message.reactions.length > 0}>
          <div class="ch-reacts">
            <For each={props.message.reactions}>
              {(reaction) => <ReactionPill reaction={reaction} people={props.people} meId={props.meId} canReact={props.canReact} onReact={props.onReact} />}
            </For>
          </div>
        </Show>
      </div>
      <Show when={props.canReply || props.canReact || props.canDelete}>
        <div class="ch-msg-actions" role="toolbar">
          <Show when={props.canReply}>
            <button type="button" onClick={props.onReply} title={t("txt.row.reply")} aria-label={t("txt.row.reply")}><Icon name="reply" /></button>
          </Show>
          <Show when={props.canReact}>
            <div class="ch-react-anchor" ref={anchor}>
              <button type="button" aria-expanded={picker()} onClick={togglePicker} title={t("txt.row.react")} aria-label={t("txt.row.react")}><Icon name="add_reaction" /></button>
              <Show when={picker()}>
                <EmojiPicker
                  placement={pickerPlace().placement}
                  maxHeight={pickerPlace().maxHeight}
                  maxWidth={pickerPlace().maxWidth}
                  onPick={() => undefined}
                  onPickItem={(emoji) => {
                    setPicker(false);
                    props.onReact(emoji.code);
                  }}
                />
              </Show>
            </div>
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
