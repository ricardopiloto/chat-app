export type ParsedSearchQuery = {
  mode: "global" | "scoped";
  channelName?: string;
  term: string;
  raw: string;
};

/**
 * Parse topbar search input: `#canal termo` → scoped; otherwise global.
 * Channel token is the first whitespace-delimited word after `#`.
 */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("#")) {
    return { mode: "global", term: trimmed, raw };
  }
  const afterHash = trimmed.slice(1);
  const m = /^(\S+)(?:\s+(.*))?$/s.exec(afterHash);
  if (!m) {
    return { mode: "scoped", channelName: "", term: "", raw };
  }
  const channelName = m[1] ?? "";
  const term = (m[2] ?? "").trim();
  return { mode: "scoped", channelName, term, raw };
}
