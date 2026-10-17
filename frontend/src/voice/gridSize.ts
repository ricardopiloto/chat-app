/** Column count whose cells have the largest short side. Equal scores keep the smaller count so a resize does not flicker. */
export function computeGridSize(n: number, width: number, height: number): { cols: number; rows: number } {
  if (n < 1 || width <= 0 || height <= 0) return { cols: 1, rows: 1 };
  // Narrow/tall windows: force a single column when aspect is below 0.7.
  if (n > 1 && width / height < 0.7) return { cols: 1, rows: n };
  let bestCols = 1;
  let bestScore = -Infinity;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const score = Math.min(width / cols, height / rows);
    if (score > bestScore) {
      bestScore = score;
      bestCols = cols;
    }
  }
  return { cols: bestCols, rows: Math.ceil(n / bestCols) };
}
