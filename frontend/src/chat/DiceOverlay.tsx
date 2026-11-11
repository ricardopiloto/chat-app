import { For, Show, createEffect, createSignal, on, onCleanup } from "solid-js";
import { t } from "../i18n";
import { facesForDiceRoll } from "./logic/percentile";
import type { DiceRoll } from "./logic/timeline";
import { applyDiceAppearance, canShowDice, ensureDiceBox, safeClear } from "./diceBoxHost";

const NATIVE_SIDES = new Set([2, 4, 6, 8, 10, 12, 20]);
export const supportsDiceShape = (sides: number) => NATIVE_SIDES.has(sides) || sides === 100;

/** Build the library notation with predetermined faces from the server payload (or derived for d100). */
export function libraryNotationFor(roll: DiceRoll): string | undefined {
  if (roll.sides === 100) {
    const faces = facesForDiceRoll(roll.sides, roll.rolls, roll.faces);
    if (!faces || faces.length !== roll.count * 2) return undefined;
    const parts: string[] = [];
    const values: number[] = [];
    for (let i = 0; i < roll.count; i++) {
      parts.push("1d100", "1d10");
      values.push(faces[i * 2]!, faces[i * 2 + 1]!);
    }
    return `${parts.join("+")}@${values.join(",")}`;
  }
  if (!supportsDiceShape(roll.sides) || roll.rolls.length !== roll.count) return undefined;
  return `${roll.count}d${roll.sides}@${roll.rolls.join(",")}`;
}

export function DiceOverlay(props: { roll: DiceRoll | undefined; onDone: () => void }) {
  const [visible, setVisible] = createSignal(false);
  const [generic, setGeneric] = createSignal<{ sides: number; value: number }[]>([]);
  let cancelled = false;
  let hold: number | undefined;
  createEffect(on(() => props.roll, async (roll) => {
    if (!roll) return;
    cancelled = false;
    setVisible(false);
    setGeneric([]);
    if (!canShowDice()) { props.onDone(); return; }
    const notation = libraryNotationFor(roll);
    const fallback = notation
      ? []
      : roll.rolls.map((value) => ({ sides: roll.sides, value }));
    try {
      if (notation) {
        const { box, host } = await ensureDiceBox();
        if (cancelled) return;
        await applyDiceAppearance(box, roll.appearance);
        if (cancelled) return;
        host.style.visibility = "visible";
        setGeneric([]);
        setVisible(true);
        await box.roll(notation);
      } else {
        setGeneric(fallback);
        setVisible(true);
        await new Promise((resolve) => window.setTimeout(resolve, 900));
      }
      if (cancelled) return;
      hold = window.setTimeout(() => { setVisible(false); safeClear(); props.onDone(); }, 1800);
    } catch {
      setVisible(false);
      safeClear();
      if (!cancelled) props.onDone();
    }
  }, { defer: true }));
  onCleanup(() => { cancelled = true; if (hold) window.clearTimeout(hold); safeClear(); });
  return <Show when={visible() && props.roll}>
    <div class="pointer-events-none fixed inset-0 z-[2200] flex flex-col items-center justify-center gap-8" aria-live="polite">
      <div class="flex flex-wrap items-center justify-center gap-6">
        <For each={generic()}>{(die) =>
          <div class="flex h-24 w-24 rotate-[-8deg] items-center justify-center rounded-xl border-4 border-white/70 bg-surface-container-high text-4xl font-black text-on-surface shadow-2xl" aria-label={`d${die.sides}: ${die.value}`}>
            {die.value}
          </div>
        }</For>
      </div>
      <div class="rounded-xl bg-surface-container-high px-5 py-3 shadow-xl"><strong>{t("txt.dice.roll")}</strong> · {props.roll!.notation} · {props.roll!.total}</div>
    </div>
  </Show>;
}
