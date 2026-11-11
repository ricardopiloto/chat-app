import { DEFAULT_DICE_APPEARANCE, type DiceAppearance } from "./diceAppearance";

/** One dice engine and one canvas for the lifetime of the application. */
type Box = { initialize(): Promise<void>; roll(notation: string): Promise<unknown>; clearDice(): void; updateConfig(options: Record<string, unknown>): Promise<void>; loadSounds(): Promise<void>; sounds: boolean; theme_texture: string; DiceColors: { colorsets: unknown[] } };
let instance: Box | undefined;
let loading: Promise<Box> | undefined;
let host: HTMLDivElement | undefined;
let appliedAppearance = "";

export function preloadDiceBox(): Promise<unknown> {
  return import("@3d-dice/dice-box-threejs");
}

const HOST_STYLE = "position:fixed;inset:0;pointer-events:none;z-index:2100;visibility:hidden";

export async function ensureDiceBox(): Promise<{ box: Box; host: HTMLDivElement }> {
  if (instance && host) {
    host.style.cssText = HOST_STYLE;
    return { box: instance, host };
  }
  if (!loading) loading = (async () => {
    const { default: DiceBox } = await import("@3d-dice/dice-box-threejs");
    host = document.createElement("div");
    host.id = "chat-dice-box";
    host.style.cssText = HOST_STYLE;
    document.body.appendChild(host);
    try {
      const box: Box = new DiceBox("#chat-dice-box", { assetPath: "/dice-box-threejs/", sounds: false });
      await box.initialize();
      instance = box;
      return box;
    } catch (error) {
      host.remove(); host = undefined;
      throw error;
    }
  })().finally(() => { loading = undefined; });
  const box = await loading;
  return { box, host: host! };
}

/** updateConfig reloads colours; assign sound and empty texture directly because the library skips falsy options. */
export async function applyDiceAppearance(box: Box, appearance: DiceAppearance = DEFAULT_DICE_APPEARANCE): Promise<void> {
  const key = JSON.stringify(appearance);
  if (key === appliedAppearance) return;
  box.sounds = appearance.sound;
  box.theme_texture = appearance.texture;
  // The library caches named colorsets without their texture/material; invalidate before a new snapshot.
  box.DiceColors.colorsets = [];
  await box.updateConfig({
    theme_colorset: appearance.color.mode === "preset" ? appearance.color.preset : "white",
    theme_customColorset: appearance.color.mode === "custom" ? { name: `custom-${key}`, foreground: appearance.color.foreground, background: appearance.color.background, texture: appearance.texture, material: appearance.material } : null,
    theme_texture: appearance.texture,
    theme_material: appearance.material,
  });
  if (appearance.sound) await box.loadSounds();
  appliedAppearance = key;
}

export function safeClear() {
  try { instance?.clearDice(); } catch { /* a failed renderer must not block chat */ }
  if (host) host.style.visibility = "hidden";
}

export function canShowDice(): boolean {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch { return false; }
}
