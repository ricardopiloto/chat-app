// The invite secret lives only in the URL fragment. Capture it before the router runs, then drop
// it from the address bar when the invite page reads it. A desktop shell can hand the same URL to
// `ingestDeepLink` before navigation.
import { parseInviteFragment } from "./inviteSeed.ts";

let secret: Uint8Array | null = null;

export function captureInviteFragment(hash = typeof location === "undefined" ? "" : location.hash): void {
  const parsed = parseInviteFragment(hash);
  if (parsed) secret = parsed;
}

/** Accepts a full URL from a deep link and keeps `#k=` when it is present. */
export function ingestDeepLink(url: string): void {
  const hashAt = url.indexOf("#");
  if (hashAt === -1) return;
  captureInviteFragment(url.slice(hashAt));
}

function clearAddressBar(): void {
  if (typeof history === "undefined" || typeof location === "undefined" || !location.hash) return;
  history.replaceState(history.state, "", `${location.pathname}${location.search}`);
}

/** Clears the fragment from the address bar and returns a copy of the captured secret. */
export function readInviteFragment(): Uint8Array | null {
  clearAddressBar();
  return secret ? secret.slice() : null;
}

/** Returns the captured secret and forgets it, so a later invite does not reuse it. */
export function takeInviteFragment(): Uint8Array | null {
  const value = secret;
  secret = null;
  clearAddressBar();
  return value;
}
