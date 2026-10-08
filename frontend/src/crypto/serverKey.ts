// Server key: AES-GCM over bytes, with the 12-byte nonce stored in front of the ciphertext.
import { b64, fromB64 } from "./identity";

const NONCE_BYTES = 12;
const KEY_BYTES = 32;
const keysByServer = new Map<string, Uint8Array>();

export const generateServerKey = (): Uint8Array => crypto.getRandomValues(new Uint8Array(KEY_BYTES));

const importAesKey = (raw: Uint8Array, usage: KeyUsage) =>
  crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [usage]);

export async function encryptBytes(serverKey: Uint8Array, plain: Uint8Array): Promise<Uint8Array> {
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  const sealed = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, await importAesKey(serverKey, "encrypt"), plain);
  const out = new Uint8Array(NONCE_BYTES + sealed.byteLength);
  out.set(nonce, 0);
  out.set(new Uint8Array(sealed), NONCE_BYTES);
  return out;
}

export async function decryptBytes(serverKey: Uint8Array, framed: Uint8Array): Promise<Uint8Array> {
  const [nonce, body] = [framed.subarray(0, NONCE_BYTES), framed.subarray(NONCE_BYTES)];
  const opened = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, await importAesKey(serverKey, "decrypt"), body);
  return new Uint8Array(opened);
}

export const encryptMessage = async (serverKey: Uint8Array, text: string): Promise<string> =>
  b64(await encryptBytes(serverKey, new TextEncoder().encode(text)));

export const decryptMessage = async (serverKey: Uint8Array, encoded: string): Promise<string> =>
  new TextDecoder().decode(await decryptBytes(serverKey, fromB64(encoded)));

export const rememberServerKey = (serverId: string, key: Uint8Array): void => void keysByServer.set(serverId, key);

export const getServerKey = (serverId: string): Uint8Array | undefined => keysByServer.get(serverId);

/** Drops every server key held in this tab. Call when the account or its identity changes. */
export const forgetServerKeys = (): void => keysByServer.clear();
