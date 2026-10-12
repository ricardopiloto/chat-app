import { Show } from "solid-js";
import { t } from "../i18n";
import { summarizeTypers } from "./logic/typing";

// A reserved row above the composer. Empty, it still holds its height so the list does not jump.
export function TypingIndicator(props: { names: string[]; narrow: boolean }) {
  const summary = () => summarizeTypers(props.names, props.narrow ? 1 : 2);
  const label = () => {
    const { names, more } = summary();
    const first = names[0];
    const second = names[1];
    if (!first) return "";
    if (!second && more === 0) return t("txt.typing.one", { name: first });
    if (second && more === 0) return t("txt.typing.two", { name: first, other: second });
    if (!second) return t("txt.typing.more", { name: first, count: more });
    return t("txt.typing.twoMore", { name: first, other: second, count: more });
  };
  return (
    <p class="ch-typing" aria-live="polite" aria-hidden={props.names.length === 0}>
      <Show when={label()}>{label()}</Show>
    </p>
  );
}
