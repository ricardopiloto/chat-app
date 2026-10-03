// Mentions: finding "@handle" in text and deciding which of them point at a real member.

export interface MentionTarget {
  accountId: string;
  handle: string;
}

export type BodyPart = { type: "text"; value: string } | { type: "mention"; value: string; accountId: string } | { type: "everyone"; value: string };

/** The reserved word that notifies a whole channel; only people with the permission can use it. */
export const EVERYONE_HANDLE = "todos";

const HANDLE = /(^|[^\w@])@([A-Za-z0-9_]{3,32})(?![\w@])/g;

const lookup = (targets: readonly MentionTarget[]) => new Map(targets.map((t) => [t.handle.toLowerCase(), t]));

/** True when the text contains @todos as a whole word. */
export const mentionsEveryone = (text: string): boolean =>
  [...text.matchAll(HANDLE)].some((found) => found[2]!.toLowerCase() === EVERYONE_HANDLE);

/**
 * Splits a message body so that only mentions of real members become mention parts. `@todos` becomes
 * its own part only when `everyone` is set (the server marked the message as notifying everyone);
 * otherwise it is plain text, or the member whose handle it is.
 */
export function splitMentions(text: string, targets: readonly MentionTarget[], everyone = false): BodyPart[] {
  const known = lookup(targets);
  const parts: BodyPart[] = [];
  let cursor = 0;
  for (const found of text.matchAll(HANDLE)) {
    const word = found[2]!.toLowerCase();
    const reserved = everyone && word === EVERYONE_HANDLE;
    const target = reserved ? undefined : known.get(word);
    if (!target && !reserved) continue;
    const start = (found.index ?? 0) + found[1]!.length;
    if (start > cursor) parts.push({ type: "text", value: text.slice(cursor, start) });
    parts.push(reserved ? { type: "everyone", value: `@${found[2]}` } : { type: "mention", value: `@${found[2]}`, accountId: target!.accountId });
    cursor = start + found[2]!.length + 1;
  }
  if (cursor < text.length) parts.push({ type: "text", value: text.slice(cursor) });
  return parts;
}

/** Account ids to send with a message: each mentioned member once, up to the server's limit. */
export function mentionedAccountIds(text: string, targets: readonly MentionTarget[], limit = 20): string[] {
  const ids = splitMentions(text, targets).flatMap((part) => (part.type === "mention" ? [part.accountId] : []));
  return [...new Set(ids)].slice(0, limit);
}
