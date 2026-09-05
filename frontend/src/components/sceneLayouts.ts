/** Parametric named layouts — family × N (2–8). */

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

export const MIN_SCENE_SLOTS = 2;
export const MAX_SCENE_SLOTS = 8;

export const LAYOUT_KEYS: LayoutKey[] = ["mestre", "quad", "faixa"];

function clampN(n: number): number {
  return Math.min(MAX_SCENE_SLOTS, Math.max(MIN_SCENE_SLOTS, Math.floor(n)));
}

function mestreGeometry(n: number): NamedLayout {
  const sats = n - 1;
  const satCols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(Math.max(1, sats)))));
  const satRows = Math.max(1, Math.ceil(Math.max(1, sats) / satCols));
  const cols =
    sats === 0 ? "1fr" : `2fr ${Array.from({ length: satCols }, () => "1fr").join(" ")}`;
  const rows = Array.from({ length: satRows }, () => "1fr").join(" ");
  const cells: LayoutCell[] = [
    { slotIndex: 0, col: "1", row: satRows > 1 ? `1 / span ${satRows}` : "1" },
  ];
  for (let i = 0; i < sats; i++) {
    const r = Math.floor(i / satCols) + 1;
    const c = (i % satCols) + 2;
    cells.push({ slotIndex: i + 1, col: String(c), row: String(r) });
  }
  return {
    key: "mestre",
    label: "Mestre em destaque",
    slotCount: n,
    cols,
    rows,
    cells,
  };
}

function quadGeometry(n: number): NamedLayout {
  const colsN = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rowsN = Math.max(1, Math.ceil(n / colsN));
  const cells: LayoutCell[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / colsN) + 1;
    const c = (i % colsN) + 1;
    cells.push({ slotIndex: i, col: String(c), row: String(r) });
  }
  return {
    key: "quad",
    label: n === 4 ? "Painel 2×2" : "Painel",
    slotCount: n,
    cols: Array.from({ length: colsN }, () => "1fr").join(" "),
    rows: Array.from({ length: rowsN }, () => "1fr").join(" "),
    cells,
  };
}

function faixaGeometry(n: number): NamedLayout {
  const cells: LayoutCell[] = [];
  for (let i = 0; i < n; i++) {
    cells.push({ slotIndex: i, col: String(i + 1), row: "1" });
  }
  return {
    key: "faixa",
    label: `Faixa ${n}-up`,
    slotCount: n,
    cols: `repeat(${n}, 1fr)`,
    rows: "1fr",
    cells,
  };
}

/** Geometry for a layout family at camera count N. */
export function layoutGeometry(
  key: LayoutKey | string | undefined | null,
  n: number,
): NamedLayout {
  const count = clampN(n);
  const k = key && LAYOUT_KEYS.includes(key as LayoutKey) ? (key as LayoutKey) : "quad";
  if (k === "mestre") return mestreGeometry(count);
  if (k === "faixa") return faixaGeometry(count);
  return quadGeometry(count);
}

/** @deprecated Prefer layoutGeometry(key, n). Defaults to family default N for thumbnails. */
export function layoutOf(key: LayoutKey | string | undefined | null): NamedLayout {
  const k = key && LAYOUT_KEYS.includes(key as LayoutKey) ? (key as LayoutKey) : "quad";
  const defaultN = k === "quad" ? 4 : 5;
  return layoutGeometry(k, defaultN);
}

export function familyLabel(key: LayoutKey, n: number): string {
  return layoutGeometry(key, n).label;
}

export function cellStyle(
  key: LayoutKey,
  slotIndex: number,
  n: number,
): { "grid-column": string; "grid-row": string } {
  const cell = layoutGeometry(key, n).cells.find((c) => c.slotIndex === slotIndex);
  return {
    "grid-column": cell?.col ?? "1",
    "grid-row": cell?.row ?? "1",
  };
}

/** Legacy static catalog kept for imports that expect SCENE_LAYOUTS keys. */
export const SCENE_LAYOUTS: Record<LayoutKey, NamedLayout> = {
  mestre: layoutGeometry("mestre", 5),
  quad: layoutGeometry("quad", 4),
  faixa: layoutGeometry("faixa", 5),
};
