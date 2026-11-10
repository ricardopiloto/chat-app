declare module "@3d-dice/dice-box-threejs" {
  export default class DiceBox {
    constructor(selector: string, options?: { assetPath?: string; sounds?: boolean });
    initialize(): Promise<void>;
    roll(notation: string): Promise<unknown>;
    clearDice(): void;
  }
}
