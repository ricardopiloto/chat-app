// Detects what the cursor is completing in the composer: "@handle" or ":emoji". One detector
// serves both, so the composer only ever has one open suggestion list.

export type CompletionKind = "mention" | "emoji";

export interface Completion {
  kind: CompletionKind;
  /** Text typed after the trigger character. */
  query: string;
  /** Index of the trigger character in the field. */
  start: number;
}

const MENTION_CHARS = /^[A-Za-z0-9_]*$/;
const EMOJI_CHARS = /^[a-z0-9_+-]*$/i;
const MIN_EMOJI_QUERY = 2;

export function detectCompletion(value: string, caret: number): Completion | undefined {
  let start = caret;
  while (start > 0 && !/\s/.test(value[start - 1]!)) start--;
  const token = value.slice(start, caret);
  const query = token.slice(1);
  if (token.startsWith("@") && MENTION_CHARS.test(query)) return { kind: "mention", query, start };
  if (token.startsWith(":") && query.length >= MIN_EMOJI_QUERY && EMOJI_CHARS.test(query)) return { kind: "emoji", query, start };
  return undefined;
}

/** Replaces the trigger and what was typed after it with `insert`, returning the new text and caret. */
export function applyCompletion(value: string, caret: number, completion: Completion, insert: string): { value: string; caret: number } {
  const next = value.slice(0, completion.start) + insert + value.slice(caret);
  return { value: next, caret: completion.start + insert.length };
}
