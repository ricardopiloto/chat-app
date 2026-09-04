import { b64, fromB64, seal, unseal, type Identity } from "./identity";

const PREFIX = "mesa.channelKey.";

export function generateChannelKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function channelKeyDisplay(key: Uint8Array): string {
  return b64(key);
}

export function sealChannelKeyForSelf(key: Uint8Array, identity: Identity): string {
  return b64(seal(key, identity.publicKey));
}

export function rememberChannelKey(channelId: string, key: Uint8Array) {
  try {
    localStorage.setItem(PREFIX + channelId, b64(key));
  } catch {
    /* quota / private mode */
  }
}

export function loadChannelKey(channelId: string): Uint8Array | null {
  try {
    const raw = localStorage.getItem(PREFIX + channelId);
    if (!raw) return null;
    return fromB64(raw);
  } catch {
    return null;
  }
}

export function forgetChannelKey(channelId: string) {
  try {
    localStorage.removeItem(PREFIX + channelId);
  } catch {
    /* ignore */
  }
}

export function unsealChannelKey(
  sealedB64: string,
  identity: Identity,
): Uint8Array | null {
  return unseal(fromB64(sealedB64), identity.publicKey, identity.secretKey);
}

/** Parse pasted base64 channel key (32 bytes). */
export function parseChannelKeyInput(raw: string): Uint8Array | null {
  try {
    const bytes = fromB64(raw.trim());
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null;
  }
}
