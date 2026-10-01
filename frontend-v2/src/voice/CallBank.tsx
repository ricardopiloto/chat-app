import { For, Show } from "solid-js";
import { t } from "../i18n";

type Props = {
  accountIds: string[];
  handles: Record<string, string>;
};

/** Participants in the call without a position in the active composition. */
export default function CallBank(props: Props) {
  return (
    <Show when={props.accountIds.length > 0}>
      <div class="call-bank" aria-label={t("scene.bank")}>
        <span>{t("scene.bank")}</span>
        <For each={props.accountIds}>
          {(id) => (
            <span class="call-bank-chip">
              {props.handles[id] ?? id.slice(0, 8)}
            </span>
          )}
        </For>
      </div>
    </Show>
  );
}

export function deriveBank(
  inCall: string[],
  slotted: (string | null)[],
): string[] {
  const set = new Set(slotted.filter((id): id is string => !!id));
  return inCall.filter((id) => !set.has(id));
}
