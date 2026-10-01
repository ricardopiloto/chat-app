/**
 * Incremental catch-up: append rows whose id is not already in the local timeline.
 * Preserves chronological order (existing order + new sorted by createdAt/id).
 */
export function mergeNewerMessages<T extends { id: string; createdAt?: string }>(
  current: T[],
  incoming: T[],
): T[] {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((m) => m.id));
  const extra = incoming.filter((m) => !seen.has(m.id));
  if (extra.length === 0) return current;

  const byTime = (a: T, b: T) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  };

  // Prefer appending sorted extras after current if all extras are newer than last current.
  const last = current[current.length - 1];
  const lastTs = last?.createdAt ? Date.parse(last.createdAt) : Number.NEGATIVE_INFINITY;
  const allAfter =
    !last ||
    extra.every((m) => {
      const t = m.createdAt ? Date.parse(m.createdAt) : 0;
      return t >= lastTs;
    });

  if (allAfter) {
    return [...current, ...extra.sort(byTime)];
  }
  return [...current, ...extra].sort(byTime);
}
