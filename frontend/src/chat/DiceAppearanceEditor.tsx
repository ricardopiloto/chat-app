import { Show, createEffect, createSignal, on } from "solid-js";
import { dice } from "../api";
import { Button, MonoLabel, Segmented, Switch, TextField } from "../components/ui";
import { t } from "../i18n";
import { errorText } from "../lib/errors";
import { DEFAULT_DICE_APPEARANCE, DICE_MATERIALS, DICE_PRESETS, DICE_TEXTURES, type DiceAppearance, type DiceColor } from "./diceAppearance";

export function DiceAppearanceEditor(props: { channelId: string }) {
  const [value, setValue] = createSignal<DiceAppearance>(DEFAULT_DICE_APPEARANCE);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  const [saved, setSaved] = createSignal(false);
  createEffect(on(() => props.channelId, async (channelId) => {
    setProblem("");
    try { setValue(await dice.getAppearance(channelId)); }
    catch (error) { setProblem(errorText(error)); }
  }));
  function setColor(color: DiceColor) { setValue((previous) => ({ ...previous, color })); setSaved(false); }
  function colorChoice(): typeof DICE_PRESETS[number] | "custom" {
    const color = value().color;
    return color.mode === "preset" ? color.preset : "custom";
  }
  async function save() {
    setBusy(true); setProblem(""); setSaved(false);
    try { setValue(await dice.putAppearance(props.channelId, value())); setSaved(true); }
    catch (error) { setProblem(errorText(error)); }
    finally { setBusy(false); }
  }
  return <section class="ch-dice-appearance">
    <h3>{t("txt.dice.appearance")}</h3>
    <div class="ch-dice-appearance-field">
      <MonoLabel>{t("txt.dice.color")}</MonoLabel>
      <Segmented label={t("txt.dice.color")} value={colorChoice()} options={[...DICE_PRESETS.map((preset) => ({ value: preset, label: preset })), { value: "custom", label: t("txt.dice.custom") }]} onChange={(choice) => setColor(choice === "custom" ? { mode: "custom", foreground: "#000000", background: "#ffffff" } : { mode: "preset", preset: choice })} />
    </div>
    <Show when={value().color.mode === "custom"}>
      <TextField label={t("txt.dice.foreground")} type="color" value={(() => { const color = value().color; return color.mode === "custom" ? color.foreground : "#000000"; })()} onInput={(event) => { const color = value().color; setColor({ mode: "custom", foreground: event.currentTarget.value, background: color.mode === "custom" ? color.background : "#ffffff" }); }} />
      <TextField label={t("txt.dice.background")} type="color" value={(() => { const color = value().color; return color.mode === "custom" ? color.background : "#ffffff"; })()} onInput={(event) => { const color = value().color; setColor({ mode: "custom", foreground: color.mode === "custom" ? color.foreground : "#000000", background: event.currentTarget.value }); }} />
    </Show>
    <div class="ch-dice-appearance-field">
      <MonoLabel>{t("txt.dice.material")}</MonoLabel>
      <Segmented label={t("txt.dice.material")} value={value().material} options={DICE_MATERIALS.map((material) => ({ value: material, label: material }))} onChange={(material) => { setValue((previous) => ({ ...previous, material })); setSaved(false); }} />
    </div>
    <div class="ch-dice-appearance-field">
      <MonoLabel>{t("txt.dice.texture")}</MonoLabel>
      <Segmented label={t("txt.dice.texture")} value={value().texture} options={DICE_TEXTURES.map((texture) => ({ value: texture, label: texture || t("txt.dice.noTexture") }))} onChange={(texture) => { setValue((previous) => ({ ...previous, texture })); setSaved(false); }} />
    </div>
    <Switch label={t("txt.dice.sound")} checked={value().sound} onChange={(event) => { setValue((previous) => ({ ...previous, sound: event.currentTarget.checked })); setSaved(false); }} />
    <Button disabled={busy()} onClick={() => void save()}>{t("txt.dice.saveAppearance")}</Button>
    <Show when={saved()}><span role="status">{t("txt.dice.appearanceSaved")}</span></Show>
    <Show when={problem()}><p role="alert">{problem()}</p></Show>
  </section>;
}
