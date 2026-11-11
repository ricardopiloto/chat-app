declare module "@3d-dice/dice-box-threejs" {
  export default class DiceBox {
    constructor(selector: string, options?: { assetPath?: string; sounds?: boolean });
    sounds: boolean;
    theme_texture: string;
    theme_material: string;
    theme_colorset: string;
    theme_customColorset: unknown;
    DiceColors: { colorsets: unknown[] };
    initialize(): Promise<void>;
    updateConfig(options: Record<string, unknown>): Promise<void>;
    roll(notation: string): Promise<unknown>;
    clearDice(): void;
    loadSounds(): Promise<void>;
  }
}
