import { For, Show } from "solid-js";
import type { EmojiEntry } from "../lib/emojiData";

type Props = {
  items: EmojiEntry[];
  highlightIndex: number;
  empty: boolean;
  onSelect: (entry: EmojiEntry) => void;
  onHighlight: (index: number) => void;
};

export default function EmojiSuggest(props: Props) {
  return (
    <div class="emoji-suggest" role="listbox" aria-label="Atalhos de emoji">
      <Show
        when={!props.empty}
        fallback={<p class="muted emoji-suggest-empty">Nenhum atalho encontrado</p>}
      >
        <ul class="emoji-suggest-list">
          <For each={props.items}>
            {(entry, i) => (
              <li>
                <button
                  type="button"
                  class="emoji-suggest-item"
                  classList={{ "is-active": i() === props.highlightIndex }}
                  role="option"
                  aria-selected={i() === props.highlightIndex}
                  onMouseEnter={() => props.onHighlight(i())}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    props.onSelect(entry);
                  }}
                >
                  <span class="emoji-suggest-glyph" aria-hidden="true">
                    {entry.glyph}
                  </span>
                  <span class="emoji-suggest-code">:{entry.shortcode}:</span>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
