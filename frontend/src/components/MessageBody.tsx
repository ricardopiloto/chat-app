import { For, Show } from "solid-js";
import { tokenizeMentionsForDisplay } from "../lib/mentionParse";

type Props = {
  text: string;
  meHandle: string;
  /** When set, styled mentions with a known target can activate (button). */
  onMentionActivate?: (handle: string) => void;
  /** Handles that resolve to a roster member (activable). Lowercase keys optional. */
  activableHandles?: Set<string> | string[];
};

function activableSet(list: Set<string> | string[] | undefined): Set<string> {
  if (!list) return new Set();
  if (list instanceof Set) {
    return new Set([...list].map((h) => h.toLowerCase()));
  }
  return new Set(list.map((h) => h.toLowerCase()));
}

export default function MessageBody(props: Props) {
  const segments = () => tokenizeMentionsForDisplay(props.text, props.meHandle);
  const canActivate = (handle: string) => {
    if (!props.onMentionActivate) return false;
    return activableSet(props.activableHandles).has(handle.toLowerCase());
  };

  return (
    <p class="msg-body">
      <For each={segments()}>
        {(seg) => {
          if (seg.kind === "text") return <>{seg.value}</>;
          if (!seg.styled) return <>{seg.value}</>;
          return (
            <Show
              when={canActivate(seg.handle)}
              fallback={<span class="msg-mention">{seg.value}</span>}
            >
              <button
                type="button"
                class="msg-mention msg-mention-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onMentionActivate?.(seg.handle);
                }}
              >
                {seg.value}
              </button>
            </Show>
          );
        }}
      </For>
    </p>
  );
}
