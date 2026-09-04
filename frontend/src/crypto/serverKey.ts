import { b64, fromB64 } from "./identity";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function generateServerKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function encryptMessage(serverKey: Uint8Array, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", serverKey, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext)),
  );
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv);
  packed.set(ct, iv.length);
  return b64(packed);
}

export async function decryptMessage(serverKey: Uint8Array, ciphertextB64: string): Promise<string> {
  const packed = fromB64(ciphertextB64);
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const key = await crypto.subtle.importKey("raw", serverKey, "AES-GCM", false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return decoder.decode(pt);
}

/** Encrypt opaque bytes (attachments) — same AES-GCM packing as messages. */
export async function encryptBytes(serverKey: Uint8Array, plain: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", serverKey, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv);
  packed.set(ct, iv.length);
  return packed;
}

export async function decryptBytes(serverKey: Uint8Array, packed: Uint8Array): Promise<Uint8Array> {
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const key = await crypto.subtle.importKey("raw", serverKey, "AES-GCM", false, ["decrypt"]);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
}

const memory = new Map<string, Uint8Array>();

export function rememberServerKey(serverId: string, key: Uint8Array) {
  memory.set(serverId, key);
}

export function getServerKey(serverId: string): Uint8Array | undefined {
  return memory.get(serverId);
}
