/** Reads only the recovery email's handle fragment. No reset authority lives here. */
export function parseRecoverFragment(hash: string): string | undefined {
  if (!hash.startsWith("#handle=")) return undefined;
  const handle = new URLSearchParams(hash.slice(1)).get("handle");
  return handle && handle.length <= 256 ? handle : undefined;
}
