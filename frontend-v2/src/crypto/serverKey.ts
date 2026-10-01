import { b64, fromB64 } from "./identity";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const memory = new Map<string, Uint8Array>();

export function generateServerKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function pack(iv: Uint8Array, ct: Uint8Array): Uint8Array {
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv);
  packed.set(ct, iv.length);
  return packed;
}

export async function encryptBytes(
  serverKey: Uint8Array,
  plain: Uint8Array,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    "raw",
    serverKey,
    "AES-GCM",
    false,
    ["encrypt"],
  );
  return pack(
    iv,
    new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain),
    ),
  );
}

export async function decryptBytes(
  serverKey: Uint8Array,
  packed: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    serverKey,
    "AES-GCM",
    false,
    ["decrypt"],
  );
  return new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: packed.slice(0, 12) },
      key,
      packed.slice(12),
    ),
  );
}

export async function encryptMessage(
  serverKey: Uint8Array,
  plaintext: string,
): Promise<string> {
  return b64(await encryptBytes(serverKey, encoder.encode(plaintext)));
}

export async function decryptMessage(
  serverKey: Uint8Array,
  ciphertextB64: string,
): Promise<string> {
  return decoder.decode(await decryptBytes(serverKey, fromB64(ciphertextB64)));
}

export function rememberServerKey(serverId: string, key: Uint8Array) {
  memory.set(serverId, key);
}

export function getServerKey(serverId: string): Uint8Array | undefined {
  return memory.get(serverId);
}
