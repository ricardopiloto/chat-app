import { For, Show, createMemo, createSignal } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { EMOJI_GROUPS, searchEmoji, type Emoji } from "./logic/emoji";
import { PICKER_HEIGHT_PX } from "./logic/popover";

// Searchable emoji grid. `onPick` still hands the character to the composer. `onPickItem` is for
// callers that also need the shortcode, such as message reactions. Without `placement` the picker
// stays anchored above the composer.
export function EmojiPicker(props: { onPick: (glyph: string) => void; onPickItem?: (emoji: Emoji) => void; placement?: "above" | "below"; maxHeight?: number; maxWidth?: number }) {
  const [query, setQuery] = createSignal("");
  const [group, setGroup] = createSignal(EMOJI_GROUPS[0]!.id);
  const visible = createMemo(() => (query().trim() ? searchEmoji(query(), 60) : (EMOJI_GROUPS.find((g) => g.id === group())?.items ?? [])));
  const height = () => props.maxHeight ?? PICKER_HEIGHT_PX;
  return (
    <div
      class="ch-emoji"
      classList={{ above: props.placement === "above", below: props.placement === "below" }}
      style={{ "--ch-emoji-h": `${height()}px`, ...(props.maxWidth !== undefined ? { "max-width": `${props.maxWidth}px` } : {}) }}
      role="dialog"
      aria-label={t("txt.composer.emoji")}
    >
      <input type="search" value={query()} placeholder={t("txt.emoji.search")} aria-label={t("txt.emoji.search")} onInput={(e) => setQuery(e.currentTarget.value)} data-autofocus />
      <Show when={!query().trim()}>
        <div class="ch-emoji-groups" role="tablist">
          <For each={EMOJI_GROUPS}>
            {(g) => (
              <button type="button" role="tab" aria-selected={group() === g.id} classList={{ active: group() === g.id }} title={t(`txt.emoji.group.${g.id}`)} onClick={() => setGroup(g.id)}>
                {g.glyph}
              </button>
            )}
          </For>
        </div>
      </Show>
      <div class="ch-emoji-grid">
        <For each={visible()} fallback={<p class="ch-muted"><Icon name="search_off" />{t("txt.emoji.none")}</p>}>
          {(emoji) => (
            <button type="button" title={`:${emoji.code}:`} onClick={() => { props.onPick(emoji.glyph); props.onPickItem?.(emoji); }}>
              {emoji.glyph}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
