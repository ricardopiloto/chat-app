// Who has just arrived in a call, from two successive lists of occupants.

/**
 * Accounts present now that were not before, never the user. Without a previous list there is nothing
 * to compare with (first event of a channel, initial load, reconnection) and nobody counts as arrived.
 */
export function arrivals(previous: ReadonlySet<string> | undefined, now: readonly string[], me: string): string[] {
  if (!previous) return [];
  return now.filter((id) => id !== me && !previous.has(id));
}
