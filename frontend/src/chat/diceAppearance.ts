/** Keep these curated options aligned with backend/src/api/dice_appearance.rs. */
export const DICE_PRESETS = ["white", "black", "rainbow"] as const;
export const DICE_TEXTURES = ["", "wood", "marble", "metal"] as const;
export const DICE_MATERIALS = ["none", "metal", "wood", "glass", "plastic"] as const;

export type DiceColor = { mode: "preset"; preset: typeof DICE_PRESETS[number] } | { mode: "custom"; foreground: string; background: string };
export interface DiceAppearance { color: DiceColor; material: typeof DICE_MATERIALS[number]; texture: typeof DICE_TEXTURES[number]; sound: boolean }
export const DEFAULT_DICE_APPEARANCE: DiceAppearance = { color: { mode: "preset", preset: "white" }, material: "glass", texture: "", sound: false };

export function parseDiceAppearance(raw: unknown): DiceAppearance {
  if (!raw || typeof raw !== "object") return DEFAULT_DICE_APPEARANCE;
  const value = raw as Partial<DiceAppearance>;
  const color = value.color;
  const validColor = color?.mode === "preset"
    ? DICE_PRESETS.includes(color.preset)
    : color?.mode === "custom" && /^#[0-9a-fA-F]{6}$/.test(color.foreground) && /^#[0-9a-fA-F]{6}$/.test(color.background);
  if (!validColor || !DICE_MATERIALS.includes(value.material as DiceAppearance["material"]) || !DICE_TEXTURES.includes(value.texture as DiceAppearance["texture"]) || typeof value.sound !== "boolean") return DEFAULT_DICE_APPEARANCE;
  return value as DiceAppearance;
}
