// Recovery key: a random code wraps the same identity and signs one-time challenges.
// Pure aside from WebCrypto, so the contract harness can import it.
import { blake2b } from "@noble/hashes/blake2b";
import { argon2id } from "hash-wasm";
import nacl from "tweetnacl";

export type KeyPair = { publicKey: Uint8Array; secretKey: Uint8Array };

export class BadPasswordError extends Error {
  constructor() {
    super("bad_password");
    this.name = "BadPasswordError";
  }
}

export const RECOVERY_CODE_BYTES = 16;
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export type RecoveryVault = {
  v: 1;
  publicKey: number[];
  iv: number[];
  wrapped: number[];
};

export type RecoveryMaterial = {
  /** Crockford base32, grouped in fours, shown once. */
  code: string;
  /** Normalized 26-character code. Never sent to the server. */
  normalized: string;
  vault: RecoveryVault;
  verifierPublicKey: Uint8Array;
};

const text = new TextEncoder();
const own = (bytes: ArrayLike<number>): Uint8Array<ArrayBuffer> => Uint8Array.from(bytes);

function personalization(label: string): Uint8Array {
  const out = new Uint8Array(16);
  out.set(text.encode(label).subarray(0, 16));
  return out;
}

export function normalizeRecoveryCode(code: string): string | undefined {
  const value = code
    .toUpperCase()
    .split("")
    .filter((char) => char !== "-" && char.trim() !== "")
    .join("");
  if (value.length !== 26 || [...value].some((char) => !ALPHABET.includes(char))) return undefined;
  return value;
}

export function formatRecoveryCode(normalized: string): string {
  return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
}

/** Same string the server rebuilds before hashing a redeem signature. Field order is fixed. */
export function canonicalIdentityVaultJson(vault: {
  v: number;
  publicKey: number[];
  salt?: number[];
  iv: number[];
  wrapped: number[];
}): string {
  const body = vault.salt
    ? { v: vault.v, publicKey: vault.publicKey, salt: vault.salt, iv: vault.iv, wrapped: vault.wrapped }
    : { v: vault.v, publicKey: vault.publicKey, iv: vault.iv, wrapped: vault.wrapped };
  return JSON.stringify(body);
}

/** RFC 4122 UUID as the 16 bytes `Uuid::as_bytes` uses. */
export function uuidToBytes(id: string): Uint8Array {
  const hex = id.replaceAll("-", "");
  if (hex.length !== 32 || /[^0-9a-f]/i.test(hex)) throw new Error("uuid");
  const out = new Uint8Array(16);
  for (let index = 0; index < 16; index += 1) out[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return out;
}

/** BLAKE2b-16 over the domain string and the lowercased handle. Public and deterministic. */
export function recoverySalt(handle: string): Uint8Array {
  const prefix = text.encode("mesa-recovery-v1");
  const name = text.encode(handle.trim().toLowerCase());
  const joined = new Uint8Array(prefix.length + name.length);
  joined.set(prefix, 0);
  joined.set(name, prefix.length);
  return blake2b(joined, { dkLen: 16 });
}

async function masterKey(normalizedCode: string, handle: string): Promise<Uint8Array> {
  return argon2id({
    password: text.encode(normalizedCode),
    salt: recoverySalt(handle),
    parallelism: 1,
    iterations: 3,
    memorySize: 32 * 1024,
    hashLength: 32,
    outputType: "binary",
  });
}

function splitMaster(master: Uint8Array): { wrapKey: Uint8Array; signSeed: Uint8Array } {
  return {
    wrapKey: blake2b(master, { dkLen: 32, personalization: personalization("wrap") }),
    signSeed: blake2b(master, { dkLen: 32, personalization: personalization("sign") }),
  };
}

export function deriveRecovery(master: Uint8Array): { wrapKey: Uint8Array; signSeed: Uint8Array; verifierPublicKey: Uint8Array } {
  const keys = splitMaster(master);
  return { ...keys, verifierPublicKey: nacl.sign.keyPair.fromSeed(keys.signSeed).publicKey };
}

function encodeCode(bytes: Uint8Array): string {
  let bits = 0;
  let available = 0;
  let out = "";
  for (const byte of bytes) {
    bits = (bits << 8) | byte;
    available += 8;
    while (available >= 5) {
      available -= 5;
      out += ALPHABET[(bits >> available) & 31];
    }
  }
  if (available > 0) out += ALPHABET[(bits << (5 - available)) & 31];
  return out;
}

export function newRecoveryCode(): string {
  return formatRecoveryCode(encodeCode(globalThis.crypto.getRandomValues(new Uint8Array(RECOVERY_CODE_BYTES))));
}

/** Generates a code, wraps `identity` and returns the verifier the server may store. */
export async function createRecovery(identity: KeyPair, handle: string): Promise<RecoveryMaterial> {
  return wrapRecovery(identity, newRecoveryCode(), handle);
}

export async function signWithRecoveryCode(code: string, handle: string, message: Uint8Array): Promise<Uint8Array> {
  const normalized = normalizeRecoveryCode(code);
  if (!normalized) throw new BadPasswordError();
  const { signSeed } = deriveRecovery(await masterKey(normalized, handle));
  return signRecovery(message, signSeed);
}

async function aes(wrapKey: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey("raw", own(wrapKey), "AES-GCM", false, [usage]);
}

export async function wrapRecovery(identity: KeyPair, normalizedCode: string, handle: string): Promise<RecoveryMaterial> {
  const normalized = normalizeRecoveryCode(normalizedCode);
  if (!normalized) throw new Error("recovery code");
  const { wrapKey, verifierPublicKey } = deriveRecovery(await masterKey(normalized, handle));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const sealed = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aes(wrapKey, "encrypt"), own(identity.secretKey));
  return {
    code: formatRecoveryCode(normalized),
    normalized,
    verifierPublicKey,
    vault: {
      v: 1,
      publicKey: Array.from(identity.publicKey),
      iv: Array.from(iv),
      wrapped: Array.from(new Uint8Array(sealed)),
    },
  };
}

export async function unwrapRecovery(vault: RecoveryVault, code: string, handle: string): Promise<KeyPair> {
  const normalized = normalizeRecoveryCode(code);
  if (!normalized) throw new BadPasswordError();
  try {
    const { wrapKey } = deriveRecovery(await masterKey(normalized, handle));
    const secret = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: own(vault.iv) },
      await aes(wrapKey, "decrypt"),
      own(vault.wrapped),
    );
    const identity = { publicKey: own(vault.publicKey), secretKey: new Uint8Array(secret) };
    if (!identity.publicKey.every((byte, index) => byte === vault.publicKey[index])) throw new BadPasswordError();
    return identity;
  } catch (error) {
    if (error instanceof BadPasswordError) throw error;
    throw new BadPasswordError();
  }
}

function lengthPrefixed(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + 2 + part.length, 0);
  const out = new Uint8Array(1 + size);
  out[0] = 1;
  let at = 1;
  for (const part of parts) {
    out[at] = part.length >> 8;
    out[at + 1] = part.length & 0xff;
    out.set(part, at + 2);
    at += 2 + part.length;
  }
  return out;
}

/** Versioned canonical bytes for a start or redeem signature. */
export function recoverySignMessage(operation: "start" | "redeem", handle: string, left: Uint8Array, right: Uint8Array): Uint8Array {
  return lengthPrefixed([text.encode(operation), text.encode(handle.trim().toLowerCase()), left, right]);
}

export async function recoveryPayloadHash(password: string, vaultJson: string): Promise<Uint8Array> {
  const body = new Uint8Array(text.encode(password).length + 1 + text.encode(vaultJson).length);
  const passwordBytes = text.encode(password);
  const vaultBytes = text.encode(vaultJson);
  body.set(passwordBytes, 0);
  body[passwordBytes.length] = 0;
  body.set(vaultBytes, passwordBytes.length + 1);
  return new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", body));
}

export function signRecovery(message: Uint8Array, signSeed: Uint8Array): Uint8Array {
  const pair = nacl.sign.keyPair.fromSeed(signSeed);
  return nacl.sign.detached(message, pair.secretKey);
}

export function verifyRecovery(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}
