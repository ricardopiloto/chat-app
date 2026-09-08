/** Channel name rules (072): live normalize + validate. */

export const CHANNEL_NAME_MAX = 32;

/** Replace Unicode whitespace with `-`, then take first 32 Unicode scalar values. */
export function normalizeChannelNameDraft(raw: string): string {
  let out = "";
  for (const ch of raw) {
    out += /\s/u.test(ch) ? "-" : ch;
  }
  return [...out].slice(0, CHANNEL_NAME_MAX).join("");
}

export type ChannelNameValidation =
  | { ok: true; name: string }
  | { ok: false; reason: "empty" | "hyphen_only" };

/** Normalize then validate for persist. */
export function validateChannelName(raw: string): ChannelNameValidation {
  const name = normalizeChannelNameDraft(raw);
  if (!name) return { ok: false, reason: "empty" };
  if (/^-+$/u.test(name)) return { ok: false, reason: "hyphen_only" };
  return { ok: true, name };
}

export function channelNameErrorMessage(reason: "empty" | "hyphen_only"): string {
  if (reason === "hyphen_only") {
    return "O nome do canal não pode ser só hífens.";
  }
  return "O nome do canal não pode ficar vazio.";
}
