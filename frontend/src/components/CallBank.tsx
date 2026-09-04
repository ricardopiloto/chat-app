import { For, Show } from "solid-js";

type Props = {
  accountIds: string[];
  handles: Record<string, string>;
};

/** Participants in call without a slot on the active composition. */
export default function CallBank(props: Props) {
  return (
    <Show when={props.accountIds.length > 0}>
      <div class="call-bank" aria-label="No banco">
        <span>No banco</span>
        <For each={props.accountIds}>
          {(id) => <span class="call-bank-chip">{props.handles[id] ?? id.slice(0, 8)}</span>}
        </For>
      </div>
    </Show>
  );
}

export function deriveBank(inCall: string[], slotted: (string | null)[]): string[] {
  const set = new Set(slotted.filter((id): id is string => !!id));
  return inCall.filter((id) => !set.has(id));
}
