import { For, Show } from "solid-js";
import { tokenizeMentionsForDisplay } from "../lib/mentionParse";

/** Message text with `@handle` chips; a chip is clickable only when the handle is a real member. */
export function MessageBody(props: {
  text: string;
  meHandle: string;
  activableHandles: string[];
  onMentionActivate: (handle: string) => void;
}) {
  const segments = () => tokenizeMentionsForDisplay(props.text, props.meHandle);
  const activable = () =>
    new Set(props.activableHandles.map((h) => h.toLowerCase()));
  return (
    <p class="msg-body">
      <For each={segments()}>
        {(seg) => {
          if (seg.kind === "text" || !seg.styled) return <>{seg.value}</>;
          return (
            <Show
              when={activable().has(seg.handle.toLowerCase())}
              fallback={<>{seg.value}</>}
            >
              <button
                type="button"
                class="msg-mention"
                onClick={() => props.onMentionActivate(seg.handle)}
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
