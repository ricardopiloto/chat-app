import { createSignal, Show } from "solid-js";
import { dice } from "../api";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { errorText } from "../lib/errors";
import { clampDiceModifier, composeDiceNotation } from "./logic/diceNotation";

export function DiceComposer(props: {
  channelId: string;
  onSent?: () => void;
  /** When set with `onNotationChange`, notation is controlled by the parent (toolbar). */
  notation?: string;
  onNotationChange?: (notation: string) => void;
}) {
  const [internalNotation, setInternalNotation] = createSignal("1d20");
  const [modifier, setModifier] = createSignal(0);
  const [label, setLabel] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");

  const notation = () => props.notation ?? internalNotation();
  function setNotation(value: string) {
    if (props.onNotationChange) props.onNotationChange(value);
    else setInternalNotation(value);
  }

  async function roll(event: Event) {
    event.preventDefault();
    const composed = composeDiceNotation(notation(), modifier());
    if (busy() || !composed) return;
    setBusy(true); setProblem("");
    try { await dice.roll(props.channelId, composed, label().trim() || undefined); props.onSent?.(); }
    catch (error) { setProblem(errorText(error)); }
    finally { setBusy(false); }
  }
  return <form class="ch-composer ch-composer-dice" onSubmit={(event) => void roll(event)}>
    <div class="ch-field ch-dice-field">
      <span class="ch-dice-glyph" aria-hidden="true"><Icon name="casino" /></span>
      <input
        class="ch-dice-notation"
        value={notation()}
        onInput={(event) => setNotation(event.currentTarget.value)}
        aria-label={t("txt.dice.notation")}
        placeholder="1d20"
        autocomplete="off"
        spellcheck={false}
        data-autofocus
      />
      <input
        class="ch-dice-modifier"
        type="number"
        min={-100}
        max={100}
        step={1}
        value={modifier()}
        onInput={(event) => setModifier(clampDiceModifier(event.currentTarget.valueAsNumber))}
        aria-label={t("txt.dice.modifier")}
        placeholder="+0"
      />
      <input
        class="ch-dice-label"
        value={label()}
        onInput={(event) => setLabel(event.currentTarget.value)}
        aria-label={t("txt.dice.label")}
        placeholder={t("txt.dice.label")}
      />
      <button
        class="ch-send"
        type="submit"
        disabled={busy() || !composeDiceNotation(notation(), modifier())}
        title={t("txt.dice.roll")}
        aria-label={t("txt.dice.roll")}
      >
        <Icon name="casino" />
      </button>
    </div>
    <Show when={problem()}><p class="ch-problem" role="alert">{problem()}</p></Show>
  </form>;
}
