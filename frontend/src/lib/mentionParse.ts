/** Extract @handles from plaintext (before encrypt). */
const HANDLE_RE = /(?:^|[\s([{])@([a-zA-Z0-9_]{2,32})\b/g;

export type Mentionable = {
  account_id: string;
  handle: string;
  has_avatar?: boolean;
};

export type ActiveMention = {
  startIndex: number;
  query: string;
};

export type DisplaySegment =
  | { kind: "text"; value: string }
  | { kind: "mention"; value: string; handle: string; styled: boolean };

export function extractMentionHandles(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(HANDLE_RE)) {
    const h = m[1];
    if (h) found.add(h.toLowerCase());
  }
  return [...found];
}

/**
 * Split plaintext into text + mention segments for display.
 * Self handle (case-insensitive) is never `styled`.
 */
export function tokenizeMentionsForDisplay(
  text: string,
  meHandle: string,
): DisplaySegment[] {
  if (!text) return [];
  const me = meHandle.trim().toLowerCase();
  const segments: DisplaySegment[] = [];
  const re = /(?:^|[\s([{])@([a-zA-Z0-9_]{2,32})\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const full = m[0];
    const handle = m[1] ?? "";
    const atOffset = full.startsWith("@") ? 0 : 1;
    const mentionStart = (m.index ?? 0) + atOffset;
    const mentionEnd = mentionStart + 1 + handle.length;
    if (mentionStart > last) {
      segments.push({ kind: "text", value: text.slice(last, mentionStart) });
    }
    const raw = text.slice(mentionStart, mentionEnd);
    segments.push({
      kind: "mention",
      value: raw,
      handle,
      styled: me.length > 0 ? handle.toLowerCase() !== me : true,
    });
    last = mentionEnd;
  }
  if (last < text.length) {
    segments.push({ kind: "text", value: text.slice(last) });
  }
  if (segments.length === 0) {
    segments.push({ kind: "text", value: text });
  }
  return segments;
}

export function resolveMentionAccountIds(
  text: string,
  members: { account_id: string; handle: string }[],
  selfId: string,
): string[] {
  const handles = extractMentionHandles(text);
  if (handles.length === 0) return [];
  const byHandle = new Map(
    members.map((m) => [m.handle.toLowerCase(), m.account_id] as const),
  );
  const ids: string[] = [];
  for (const h of handles) {
    const id = byHandle.get(h);
    if (!id || id === selfId) continue;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Find @mention being edited at caret (query has no spaces). */
export function findActiveMention(
  text: string,
  caretIndex: number,
): ActiveMention | null {
  const caret = Math.max(0, Math.min(caretIndex, text.length));
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0) {
    const prev = before[at - 1];
    if (prev && !/[\s([{]/.test(prev)) return null;
  }
  const query = before.slice(at + 1);
  if (/[\s]/.test(query)) return null;
  if (query.length > 32) return null;
  if (query.length > 0 && !/^[a-zA-Z0-9_]*$/.test(query)) return null;
  return { startIndex: at, query };
}

export function filterMentionables(
  candidates: Mentionable[],
  query: string,
): Mentionable[] {
  const q = query.trim().toLowerCase();
  if (!q) return candidates;
  return candidates.filter((m) => m.handle.toLowerCase().includes(q));
}

/** Replace active @query with @handle and a trailing space. */
export function applyMentionSelection(
  text: string,
  active: ActiveMention,
  handle: string,
): { text: string; caret: number } {
  const before = text.slice(0, active.startIndex);
  const after = text.slice(active.startIndex + 1 + active.query.length);
  const inserted = `@${handle} `;
  const next = before + inserted + after;
  return { text: next, caret: before.length + inserted.length };
}
