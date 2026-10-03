import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Avatar, Icon } from "../components/ui";
import { avatarUrl } from "../api";
import { errorText } from "../lib/errors";
import { t } from "../i18n";
import { MAX_ATTACHMENTS_PER_MESSAGE } from "../api/limits";
import { checkAttachment, uploadAttachment } from "./attachments";
import { EmojiPicker } from "./EmojiPicker";
import { applyCompletion, detectCompletion, type Completion } from "./logic/autocomplete";
import { expandShortcodes, searchEmoji } from "./logic/emoji";
import { EVERYONE_HANDLE, mentionedAccountIds, mentionsEveryone } from "./logic/mentions";
import { matchPeople, type ChatPerson } from "./logic/people";
import type { Thread } from "./thread";

interface Pending {
  key: number;
  file: File;
  preview: string;
}

export interface ReplyTarget {
  messageId: string;
  author: string;
  excerpt: string;
}

let pendingKey = 0;
const MAX_FIELD_PX = 168;

// "@todos" is offered next to the members, in the same list, but is not a member.
const EVERYONE_ID = "mention:everyone";
const EVERYONE_ENTRY = (): ChatPerson => ({ accountId: EVERYONE_ID, handle: EVERYONE_HANDLE, label: t("txt.composer.everyone"), hasAvatar: false });

// Where a message is written: text field with one suggestion list at a time (@members or :emoji),
// image attachments chosen or pasted, a reply bar, and the emoji picker. Sending encrypts the text
// and every image on this device first.
export function Composer(props: {
  channelId: string;
  channelName: string;
  thread: Thread;
  people: ChatPerson[];
  /** Every member of the server: who a typed handle may resolve to. */
  everyone: ChatPerson[];
  canAttach: boolean;
  /** The person may write @todos: it is offered in the suggestions and sent as a request to notify everyone. */
  canMentionEveryone?: boolean;
  reply: ReplyTarget | undefined;
  onCancelReply: () => void;
  onSent: () => void;
  focusSignal: number;
}) {
  const [text, setText] = createSignal("");
  const [pending, setPending] = createSignal<Pending[]>([]);
  const [completion, setCompletion] = createSignal<Completion>();
  const [active, setActive] = createSignal(0);
  const [pickerOpen, setPickerOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  let field: HTMLTextAreaElement | undefined;
  let fileInput: HTMLInputElement | undefined;
  let pickerBox: HTMLDivElement | undefined;

  const suggestions = () => {
    const open = completion();
    if (!open) return { people: [] as ChatPerson[], emoji: [] as ReturnType<typeof searchEmoji> };
    if (open.kind !== "mention") return { people: [], emoji: searchEmoji(open.query, 6) };
    const everyone: ChatPerson[] = props.canMentionEveryone && EVERYONE_HANDLE.startsWith(open.query.toLowerCase()) ? [EVERYONE_ENTRY()] : [];
    return { people: [...everyone, ...matchPeople(props.people, open.query)], emoji: [] };
  };
  const listSize = () => suggestions().people.length + suggestions().emoji.length;
  const listOpen = () => completion() !== undefined && (listSize() > 0 || completion()!.kind === "mention");

  const resize = () => {
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, MAX_FIELD_PX)}px`;
    field.style.overflowY = field.scrollHeight > MAX_FIELD_PX ? "auto" : "hidden";
  };
  const refreshCompletion = () => {
    if (!field) return;
    setCompletion(detectCompletion(field.value, field.selectionStart ?? field.value.length));
    setActive(0);
  };
  const edit = (value: string, caret?: number) => {
    setText(value);
    queueMicrotask(() => {
      if (!field) return;
      field.value = value;
      if (caret !== undefined) field.setSelectionRange(caret, caret);
      field.focus();
      resize();
      refreshCompletion();
    });
  };
  const insertAtCaret = (insert: string) => {
    const at = field?.selectionStart ?? text().length;
    const end = field?.selectionEnd ?? at;
    edit(text().slice(0, at) + insert + text().slice(end), at + insert.length);
  };

  function choose(index: number) {
    const open = completion();
    if (!open || !field) return;
    const { people, emoji } = suggestions();
    const insert = open.kind === "mention" ? (people[index] ? `@${people[index]!.handle} ` : undefined) : emoji[index]?.glyph;
    if (insert === undefined) return;
    const done = applyCompletion(text(), field.selectionStart ?? text().length, open, insert);
    setCompletion(undefined);
    edit(done.value, done.caret);
  }

  function addFiles(files: Iterable<File>) {
    setProblem("");
    const next = [...pending()];
    for (const file of files) {
      const refused = checkAttachment(file);
      if (refused) {
        setProblem(t(refused === "type" ? "txt.composer.badType" : "txt.composer.badSize"));
        continue;
      }
      if (next.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        setProblem(t("txt.composer.tooMany"));
        break;
      }
      next.push({ key: ++pendingKey, file, preview: URL.createObjectURL(file) });
    }
    // Files that were acceptable are kept even when another one in the same batch was not.
    setPending(next);
  }
  function drop(key: number) {
    const gone = pending().find((p) => p.key === key);
    if (gone) URL.revokeObjectURL(gone.preview);
    setPending((all) => all.filter((p) => p.key !== key));
  }
  onCleanup(() => pending().forEach((p) => URL.revokeObjectURL(p.preview)));

  const onPaste = (event: ClipboardEvent) => {
    if (!props.canAttach) return;
    const images = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    event.preventDefault();
    addFiles(images);
  };

  async function send() {
    const body = expandShortcodes(text()).trim();
    const files = pending();
    const key = props.thread.serverKey();
    if (busy() || !key || (!body && files.length === 0)) return;
    setBusy(true);
    setProblem("");
    try {
      const ids: string[] = [];
      for (const each of files) ids.push(await uploadAttachment(props.channelId, key, each.file));
      await props.thread.send({
        // A message with only pictures still carries an encrypted (empty) body: the backend needs one.
        text: body,
        attachmentIds: ids,
        replyToId: props.reply?.messageId,
        mentionedIds: mentionedAccountIds(body, props.everyone),
        mentionEveryone: props.canMentionEveryone === true && mentionsEveryone(body),
      });
      files.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      setText("");
      props.onCancelReply();
      setCompletion(undefined);
      queueMicrotask(() => {
        if (field) field.value = "";
        resize();
        field?.focus();
        props.onSent();
      });
    } catch (failure) {
      setProblem(errorText(failure, "txt.composer.sendFailed"));
    } finally {
      setBusy(false);
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (listOpen() && listSize() > 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => (i + (event.key === "ArrowDown" ? 1 : -1) + listSize()) % listSize());
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        choose(active());
        return;
      }
    }
    if (event.key === "Escape" && completion()) {
      event.preventDefault();
      event.stopPropagation();
      setCompletion(undefined);
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  // The picker closes on a press anywhere outside it, and on Escape.
  createEffect(() => {
    if (!pickerOpen()) return;
    const outside = (event: PointerEvent) => !pickerBox?.contains(event.target as Node) && setPickerOpen(false);
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setPickerOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    onCleanup(() => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    });
  });
  createEffect(() => {
    void props.focusSignal;
    field?.focus();
  });

  return (
    <div class="ch-composer">
      <Show when={props.reply}>
        {(target) => (
          <div class="ch-reply-bar">
            <Icon name="subdirectory_arrow_right" />
            <span class="ch-reply-text"><strong>{t("txt.row.replyingTo", { name: target().author })}</strong><em>{target().excerpt}</em></span>
            <button type="button" onClick={props.onCancelReply} title={t("txt.row.cancelReply")} aria-label={t("txt.row.cancelReply")}><Icon name="close" /></button>
          </div>
        )}
      </Show>
      <Show when={pending().length > 0}>
        <ul class="ch-tray">
          <For each={pending()}>
            {(each) => (
              <li>
                <img src={each.preview} alt="" />
                <button type="button" onClick={() => drop(each.key)} title={t("txt.composer.removeAttachment")} aria-label={t("txt.composer.removeAttachment")}><Icon name="close" /></button>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={listOpen()}>
        <ul class="ch-suggest" role="listbox" aria-label={t(completion()?.kind === "emoji" ? "txt.composer.emojiList" : "txt.composer.mentionList")}>
          <For each={suggestions().people} fallback={<Show when={completion()?.kind === "mention" && suggestions().emoji.length === 0}><li class="ch-muted">{t("txt.composer.noMembers")}</li></Show>}>
            {(person, at) => (
              <li role="option" aria-selected={active() === at()} classList={{ active: active() === at(), everyone: person.accountId === EVERYONE_ID }} onPointerDown={(e) => { e.preventDefault(); choose(at()); }}>
                <Show when={person.accountId === EVERYONE_ID} fallback={<Avatar name={person.label} src={person.hasAvatar ? avatarUrl(person.accountId) : undefined} size="sm" />}>
                  <span class="ch-suggest-glyph"><Icon name="campaign" /></span>
                </Show>
                <strong>{person.label}</strong><small>{person.accountId === EVERYONE_ID ? t("txt.composer.everyoneHint") : `@${person.handle}`}</small>
              </li>
            )}
          </For>
          <For each={suggestions().emoji}>
            {(item, at) => (
              <li role="option" aria-selected={active() === at()} classList={{ active: active() === at() }} onPointerDown={(e) => { e.preventDefault(); choose(at()); }}>
                <span class="ch-suggest-glyph">{item.glyph}</span><strong>:{item.code}:</strong>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <div class="ch-field">
        <Show when={props.canAttach}>
          <button type="button" class="ch-field-btn" onClick={() => fileInput?.click()} title={t("txt.composer.attach")} aria-label={t("txt.composer.attach")} disabled={busy()}><Icon name="attach_file" /></button>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => { addFiles([...(e.currentTarget.files ?? [])]); e.currentTarget.value = ""; }} />
        </Show>
        <textarea
          ref={field}
          rows="1"
          value={text()}
          placeholder={t("txt.composer.placeholder", { name: props.channelName })}
          aria-label={t("txt.composer.placeholder", { name: props.channelName })}
          onInput={(e) => { setText(e.currentTarget.value); resize(); refreshCompletion(); }}
          onKeyDown={onKeyDown}
          onKeyUp={(e) => ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) && refreshCompletion()}
          onClick={refreshCompletion}
          onBlur={() => setTimeout(() => setCompletion(undefined), 120)}
          onPaste={onPaste}
          data-autofocus
        />
        <div class="ch-picker-anchor" ref={pickerBox}>
          <button type="button" class="ch-field-btn" onClick={() => setPickerOpen((open) => !open)} title={t("txt.composer.emoji")} aria-label={t("txt.composer.emoji")} aria-expanded={pickerOpen()}><Icon name="mood" /></button>
          <Show when={pickerOpen()}>
            <EmojiPicker onPick={(glyph) => { setPickerOpen(false); insertAtCaret(glyph); }} />
          </Show>
        </div>
        <button type="button" class="ch-send" onClick={() => void send()} disabled={busy() || (!text().trim() && pending().length === 0)} title={busy() ? t("txt.composer.sending") : t("txt.composer.send")} aria-label={t("txt.composer.send")}><Icon name="send" /></button>
      </div>
      <Show when={problem()}><p class="ch-problem" role="alert">{problem()}</p></Show>
      <p class="ch-help"><span><Icon name="lock" />{t("txt.composer.help")}</span><span>{t("txt.composer.keys")}</span></p>
    </div>
  );
}
