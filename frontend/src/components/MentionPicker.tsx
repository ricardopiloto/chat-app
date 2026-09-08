import { For, Show } from "solid-js";
import type { ChannelMentionable } from "../api/client";

type Props = {
  items: ChannelMentionable[];
  highlightIndex: number;
  empty: boolean;
  onSelect: (item: ChannelMentionable) => void;
  onHighlight: (index: number) => void;
};

export default function MentionPicker(props: Props) {
  return (
    <div class="mention-picker" role="listbox" aria-label="Membros para mencionar">
      <Show
        when={!props.empty}
        fallback={<p class="mention-picker-empty muted">Nenhum membro encontrado</p>}
      >
        <ul class="mention-picker-list">
          <For each={props.items}>
            {(item, i) => (
              <li>
                <button
                  type="button"
                  class="mention-picker-item"
                  classList={{ "is-active": i() === props.highlightIndex }}
                  role="option"
                  aria-selected={i() === props.highlightIndex}
                  onMouseEnter={() => props.onHighlight(i())}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    props.onSelect(item);
                  }}
                >
                  <span class="mention-picker-handle">@{item.handle}</span>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
