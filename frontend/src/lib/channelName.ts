export const CHANNEL_NAME_MAX = 32;

export type ChannelNameValidation = { ok: true; name: string } | { ok: false; reason: "empty" | "hyphen_only" };

/** Whitespace becomes hyphens and the result is cut to CHANNEL_NAME_MAX characters (not UTF-16 units). */
export function normalizeChannelNameDraft(raw: string): string {
  const characters = Array.from(raw, (character) => (/\s/u.test(character) ? "-" : character));
  return characters.slice(0, CHANNEL_NAME_MAX).join("");
}

export function validateChannelName(raw: string): ChannelNameValidation {
  const name = normalizeChannelNameDraft(raw);
  if (name.length === 0) return { ok: false, reason: "empty" };
  if (!/[^-]/u.test(name)) return { ok: false, reason: "hyphen_only" };
  return { ok: true, name };
}
