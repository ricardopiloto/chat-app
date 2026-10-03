// Catalogs are written as nested trees for readability and flattened to "a.b.c" keys for lookup.
export type MessageTree = { [key: string]: string | MessageTree };
export type FlatMessages = ReadonlyMap<string, string>;

export function flatten(tree: MessageTree, prefix = "", into = new Map<string, string>()): Map<string, string> {
  for (const [name, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (typeof value === "string") into.set(path, value);
    else flatten(value, path, into);
  }
  return into;
}

/** Later catalogs override earlier ones. */
export function merge(...catalogs: MessageTree[]): FlatMessages {
  const merged = new Map<string, string>();
  for (const catalog of catalogs) flatten(catalog, "", merged);
  return merged;
}

/** Replaces `{name}` placeholders; a placeholder with no value is left visible. */
export function interpolate(text: string, values?: Record<string, string | number>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => (name in values ? String(values[name]) : placeholder));
}
