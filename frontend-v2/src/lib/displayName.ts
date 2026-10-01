/** 099: public presentation label — display_name when set, else handle. */

export function publicDisplayLabel(
  handle: string,
  displayName?: string | null,
): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed;
  return handle;
}

export const DISPLAY_NAME_MAX_CHARS = 64;
