/** Strip a trailing ±K from free-typed notation, then apply the explicit modifier control. */
export function composeDiceNotation(notation: string, modifier: number): string {
  const raw = notation.trim().toLowerCase().replace(/\s+/g, "");
  if (!raw) return raw;
  const base = raw.replace(/[+-]\d+$/, "");
  const mod = Math.max(-100, Math.min(100, Math.trunc(modifier) || 0));
  if (!base) return raw;
  if (mod === 0) return base;
  return `${base}${mod > 0 ? "+" : ""}${mod}`;
}

export function clampDiceModifier(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-100, Math.min(100, Math.trunc(value)));
}
