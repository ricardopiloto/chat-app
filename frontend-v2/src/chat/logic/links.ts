// Finding the links in a message so the thread can show a preview for each (at most five).

export const MAX_PREVIEWS = 5;

const URL_PATTERN = /https?:\/\/[^\s<>"]+/gi;
const TRAILING = /[.,;:!?)\]}'"]+$/;

export function extractUrls(text: string, max = MAX_PREVIEWS): string[] {
  const seen = new Set<string>();
  for (const found of text.matchAll(URL_PATTERN)) {
    const url = found[0].replace(TRAILING, "");
    try {
      const parsed = new URL(url);
      if (parsed.hostname) seen.add(url);
    } catch {
      /* not a usable URL */
    }
    if (seen.size >= max) break;
  }
  return [...seen];
}
