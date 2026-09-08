import { For, Show, createMemo, createSignal } from "solid-js";
import { uniqueEmojiCatalog, type EmojiEntry } from "../lib/emojiData";
import { filterEmojiCatalog } from "../lib/emojiShortcode";

type Props = {
  onSelect: (entry: EmojiEntry) => void;
  onClose?: () => void;
};

export default function EmojiPicker(props: Props) {
  const [query, setQuery] = createSignal("");
  const catalog = uniqueEmojiCatalog();
  const items = createMemo(() => filterEmojiCatalog(query(), 80, catalog));

  return (
    <div class="emoji-picker" role="dialog" aria-label="Escolher emoji">
      <div class="emoji-picker-toolbar">
        <input
          class="input emoji-picker-search"
          type="search"
          placeholder="Pesquisar…"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          aria-label="Pesquisar emoji"
        />
        <Show when={props.onClose}>
          <button
            type="button"
            class="btn btn-ghost emoji-picker-close"
            aria-label="Fechar"
            onClick={() => props.onClose?.()}
          >
            ×
          </button>
        </Show>
      </div>
      <Show
        when={items().length > 0}
        fallback={<p class="muted emoji-picker-empty">Nenhum emoji encontrado</p>}
      >
        <div class="emoji-picker-grid" role="listbox">
          <For each={items()}>
            {(entry) => (
              <button
                type="button"
                class="emoji-picker-cell"
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
