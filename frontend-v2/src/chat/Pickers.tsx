import { For, Show, createMemo, createSignal } from "solid-js";
import type { ChannelMentionable } from "../api/client";
import { t } from "../i18n";
import { uniqueEmojiCatalog, type EmojiEntry } from "../lib/emojiData";
import { filterEmojiCatalog } from "../lib/emojiShortcode";

export function MentionPicker(props: {
  items: ChannelMentionable[];
  highlightIndex: number;
  onSelect: (item: ChannelMentionable) => void;
  onHighlight: (index: number) => void;
}) {
  return (
    <div
      class="picker mention-picker"
      role="listbox"
      aria-label={t("chat.mentionList")}
    >
      <Show
        when={props.items.length > 0}
        fallback={<p class="muted">{t("chat.noMember")}</p>}
      >
        <For each={props.items}>
          {(item, i) => (
            <button
              type="button"
              role="option"
              aria-selected={i() === props.highlightIndex}
              classList={{ active: i() === props.highlightIndex }}
              onMouseEnter={() => props.onHighlight(i())}
              onMouseDown={(e) => {
                e.preventDefault();
                props.onSelect(item);
              }}
            >
              @{item.handle}
            </button>
          )}
        </For>
      </Show>
    </div>
  );
}

export function EmojiSuggest(props: {
  items: EmojiEntry[];
  highlightIndex: number;
  onSelect: (entry: EmojiEntry) => void;
  onHighlight: (index: number) => void;
}) {
  return (
    <div
      class="picker emoji-suggest"
      role="listbox"
      aria-label={t("chat.emojiShortcuts")}
    >
      <Show
        when={props.items.length > 0}
        fallback={<p class="muted">{t("chat.noShortcut")}</p>}
      >
        <For each={props.items}>
          {(entry, i) => (
            <button
              type="button"
              role="option"
              aria-selected={i() === props.highlightIndex}
              classList={{ active: i() === props.highlightIndex }}
              onMouseEnter={() => props.onHighlight(i())}
              onMouseDown={(e) => {
                e.preventDefault();
                props.onSelect(entry);
              }}
            >
              <span aria-hidden="true">{entry.glyph}</span> :{entry.shortcode}:
            </button>
          )}
        </For>
      </Show>
    </div>
  );
}

export function EmojiPicker(props: {
  onSelect: (entry: EmojiEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = createSignal("");
  const catalog = uniqueEmojiCatalog();
  const items = createMemo(() => filterEmojiCatalog(query(), 80, catalog));
  return (
    <div
      class="picker emoji-picker"
      role="dialog"
      aria-label={t("chat.emojiPicker")}
    >
      <div class="emoji-picker-toolbar">
        <input
          type="search"
          placeholder={t("chat.search")}
          aria-label={t("chat.searchEmoji")}
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        <button
          type="button"
          aria-label={t("admin.close")}
          onClick={props.onClose}
        >
          ×
        </button>
      </div>
      <Show
        when={items().length > 0}
        fallback={<p class="muted">{t("chat.noEmoji")}</p>}
      >
        <div class="emoji-picker-grid" role="listbox">
          <For each={items()}>
            {(entry) => (
              <button
                type="button"
                role="option"
                title={`:${entry.shortcode}:`}
                aria-label={entry.shortcode}
                onMouseDown={(e) => {
                  e.preventDefault();
                  props.onSelect(entry);
                }}
              >
                <span aria-hidden="true">{entry.glyph}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
