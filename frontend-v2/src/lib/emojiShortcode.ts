import { uniqueEmojiCatalog, type EmojiEntry } from "./emojiData";

export type ActiveShortcode = {
  /** Index of opening `:`. */
  startIndex: number;
  /** Text after `:` up to caret (may end with `:`). */
  query: string;
};

const CATALOG = uniqueEmojiCatalog();

/** Find `:shortcode` being edited at caret (no spaces; no auto-replace). */
export function findActiveShortcode(
  text: string,
  caretIndex: number,
): ActiveShortcode | null {
  const caret = Math.max(0, Math.min(caretIndex, text.length));
  const before = text.slice(0, caret);
  const colon = before.lastIndexOf(":");
  if (colon < 0) return null;
  if (colon > 0) {
    const prev = before[colon - 1];
    // Allow start of string / whitespace / punctuation before `:`
    if (prev && /[A-Za-z0-9_]/.test(prev)) return null;
  }
  const query = before.slice(colon + 1);
  if (query.includes(" ") || query.includes("\n") || query.includes("\t")) {
    return null;
  }
  // Incomplete or complete `:name` / `:name:` — still show suggest; never auto-replace
  if (query.length > 40) return null;
  if (query.length > 0 && !/^[a-zA-Z0-9_+-]*:?$/.test(query)) return null;
  return { startIndex: colon, query };
}

export function filterEmojiCatalog(
  query: string,
  limit = 40,
  catalog: EmojiEntry[] = CATALOG,
): EmojiEntry[] {
  const raw = query.replace(/:$/, "").trim().toLowerCase();
  if (!raw) return catalog.slice(0, limit);
  const matched: EmojiEntry[] = [];
  for (const e of catalog) {
    const sc = e.shortcode.toLowerCase();
    if (sc.includes(raw)) {
      matched.push(e);
      if (matched.length >= limit) break;
      continue;
    }
    const kws = e.keywords ?? [];
    if (kws.some((k) => k.toLowerCase().includes(raw))) {
      matched.push(e);
      if (matched.length >= limit) break;
    }
  }
  return matched;
}

/** Replace `:query` segment (from opening colon through caret query) with glyph + space. */
export function applyShortcodeSelection(
  text: string,
  active: ActiveShortcode,
  glyph: string,
): { text: string; caret: number } {
  const before = text.slice(0, active.startIndex);
  const after = text.slice(active.startIndex + 1 + active.query.length);
  const inserted = `${glyph} `;
  const next = before + inserted + after;
  return { text: next, caret: before.length + inserted.length };
}

export function insertAtCaret(
  text: string,
  caret: number,
  insert: string,
): { text: string; caret: number } {
  const c = Math.max(0, Math.min(caret, text.length));
  const next = text.slice(0, c) + insert + text.slice(c);
  return { text: next, caret: c + insert.length };
}

export { CATALOG as emojiCatalog };
