// Search is done on this device, over messages that have already been decrypted. This file holds
// the parts that do not touch the network: reading the query and cutting the excerpt.

export interface ParsedQuery {
  /** Channel name from a leading "#name", lowercase, without the hash. */
  channel: string | undefined;
  term: string;
}

export function parseQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  const scoped = /^#(\S*)\s*(.*)$/s.exec(trimmed);
  if (!scoped) return { channel: undefined, term: trimmed };
  return { channel: scoped[1]!.toLowerCase(), term: scoped[2]!.trim() };
}

export const buildQuery = (channel: string | undefined, term: string): string => (channel ? `#${channel} ${term}` : term);

/** Case- and accent-insensitive form used only for comparison. */
export const fold = (text: string): string => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export interface Excerpt {
  before: string;
  hit: string;
  after: string;
  clippedStart: boolean;
  clippedEnd: boolean;
}

/** The text around the first match of `term`, or undefined when it does not occur. */
export function excerptAround(text: string, term: string, radius = 60): Excerpt | undefined {
  const needle = fold(term);
  if (!needle) return undefined;
  const flat = text.replace(/\s+/g, " ");
  // Folding can change length for a few characters; comparing per code unit keeps indexes aligned.
  const at = [...flat].map((c) => fold(c)).join("").indexOf(needle);
  if (at === -1) return undefined;
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + needle.length + radius);
  return {
    before: flat.slice(start, at),
    hit: flat.slice(at, at + needle.length),
    after: flat.slice(at + needle.length, end),
    clippedStart: start > 0,
    clippedEnd: end < flat.length,
  };
}

export type EmptyReason = "noChannel" | "voiceChannel" | "noMatches";
