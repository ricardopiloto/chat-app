/** Named layouts from Mesa Nocturne prototype (contracts/layout-catalog.md). */

export type LayoutKey = "mestre" | "quad" | "faixa";

export type LayoutCell = { slotIndex: number; col: string; row: string };

export type NamedLayout = {
  key: LayoutKey;
  label: string;
  slotCount: number;
  cols: string;
  rows: string;
  cells: LayoutCell[];
};

export const SCENE_LAYOUTS: Record<LayoutKey, NamedLayout> = {
  mestre: {
    key: "mestre",
    label: "Mestre em destaque",
    slotCount: 5,
    cols: "2fr 1fr 1fr",
    rows: "1fr 1fr",
    cells: [
      { slotIndex: 0, col: "1", row: "1 / span 2" },
      { slotIndex: 1, col: "2", row: "1" },
      { slotIndex: 2, col: "3", row: "1" },
      { slotIndex: 3, col: "2", row: "2" },
      { slotIndex: 4, col: "3", row: "2" },
    ],
  },
  quad: {
    key: "quad",
    label: "Painel 2×2",
    slotCount: 4,
    cols: "1fr 1fr",
    rows: "1fr 1fr",
    cells: [
      { slotIndex: 0, col: "1", row: "1" },
      { slotIndex: 1, col: "2", row: "1" },
      { slotIndex: 2, col: "1", row: "2" },
      { slotIndex: 3, col: "2", row: "2" },
    ],
  },
  faixa: {
    key: "faixa",
    label: "Faixa 5-up",
    slotCount: 5,
    cols: "repeat(5, 1fr)",
    rows: "1fr",
    cells: [
      { slotIndex: 0, col: "1", row: "1" },
      { slotIndex: 1, col: "2", row: "1" },
      { slotIndex: 2, col: "3", row: "1" },
      { slotIndex: 3, col: "4", row: "1" },
      { slotIndex: 4, col: "5", row: "1" },
    ],
  },
};

export const LAYOUT_KEYS = Object.keys(SCENE_LAYOUTS) as LayoutKey[];

export function layoutOf(key: LayoutKey | string | undefined | null): NamedLayout {
  if (key && key in SCENE_LAYOUTS) return SCENE_LAYOUTS[key as LayoutKey];
  return SCENE_LAYOUTS.quad;
}

export function cellStyle(key: LayoutKey, slotIndex: number): { "grid-column": string; "grid-row": string } {
  const cell = layoutOf(key).cells.find((c) => c.slotIndex === slotIndex);
  return {
    "grid-column": cell?.col ?? "1",
    "grid-row": cell?.row ?? "1",
  };
}
