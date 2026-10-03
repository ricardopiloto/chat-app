// Voice-channel keys: a random 32-byte secret, shown once to the creator, sealed to their own
// identity for the server, and cached in localStorage under a per-channel entry.
import { b64, fromB64, seal, unseal, type Identity } from "./identity";

const KEY_BYTES = 32;
const storageName = (channelId: string) => `mesa.channelKey.${channelId}`;

export const generateChannelKey = (): Uint8Array => crypto.getRandomValues(new Uint8Array(KEY_BYTES));

/** The copyable form of a key. */
export const channelKeyDisplay = (key: Uint8Array): string => b64(key);

export const sealChannelKeyForSelf = (key: Uint8Array, owner: Identity): string => b64(seal(key, owner.publicKey));

export const unsealChannelKey = (sealed: string, owner: Identity): Uint8Array | null =>
  unseal(fromB64(sealed), owner.publicKey, owner.secretKey);

/** Storage can be full or blocked; a missing cache entry is always an acceptable outcome. */
function withStorage<T>(action: (store: Storage) => T, fallback: T): T {
  try {
    return action(localStorage);
  } catch {
    return fallback;
  }
}

export const rememberChannelKey = (channelId: string, key: Uint8Array): void =>
  withStorage((store) => store.setItem(storageName(channelId), b64(key)), undefined);

export const forgetChannelKey = (channelId: string): void =>
  withStorage((store) => store.removeItem(storageName(channelId)), undefined);

export function loadChannelKey(channelId: string): Uint8Array | null {
  const stored = withStorage((store) => store.getItem(storageName(channelId)), null);
  return stored ? withStorage(() => fromB64(stored), null) : null;
}

/** Accepts a pasted base64 key and returns it only when it has the right length. */
export function parseChannelKeyInput(pasted: string): Uint8Array | null {
  const bytes = withStorage(() => fromB64(pasted.trim()), null);
  return bytes?.length === KEY_BYTES ? bytes : null;
}
