// Identity vault and sealed box, written from docs/v2/contracts/crypto-formats.md §2–§3.
// Pure functions with no browser storage and no relative imports, so the contract harness can run
// this file directly in Node.
import nacl from "tweetnacl";
import { blake2b } from "@noble/hashes/blake2b";
import { argon2id } from "hash-wasm";

export type KeyPair = { publicKey: Uint8Array; secretKey: Uint8Array };

/** Serialised vault as stored by the backend and in IndexedDB: octets as plain number arrays. */
export type IdentityVault = {
  v: 1;
  publicKey: number[];
  salt: number[];
  iv: number[];
  wrapped: number[];
};

export class BadPasswordError extends Error {
  constructor() {
    super("bad_password");
    this.name = "BadPasswordError";
  }
}

const SALT_BYTES = 16;
const IV_BYTES = 12;
const KDF = { parallelism: 1, iterations: 3, memorySize: 32 * 1024, hashLength: 32 } as const;

const random = (length: number): Uint8Array => globalThis.crypto.getRandomValues(new Uint8Array(length));
const own = (bytes: ArrayLike<number>): Uint8Array<ArrayBuffer> => Uint8Array.from(bytes);

async function aesKeyFromPassword(password: string, salt: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  const material = await argon2id({
    password: new TextEncoder().encode(password),
    salt,
    ...KDF,
    outputType: "binary",
  });
  return globalThis.crypto.subtle.importKey("raw", material, "AES-GCM", false, [usage]);
}

export function newKeyPair(): KeyPair {
  return nacl.box.keyPair();
}

export async function wrapVault(identity: KeyPair, password: string): Promise<IdentityVault> {
  const salt = random(SALT_BYTES);
  const iv = random(IV_BYTES);
  const key = await aesKeyFromPassword(password, salt, "encrypt");
  const sealedSecret = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, own(identity.secretKey));
  return {
    v: 1,
    publicKey: Array.from(identity.publicKey),
    salt: Array.from(salt),
    iv: Array.from(iv),
    wrapped: Array.from(new Uint8Array(sealedSecret)),
  };
}

/** Opens a vault. Any failure (wrong password, damaged vault) is reported as one BadPasswordError. */
export async function unlockVault(vault: IdentityVault, password: string): Promise<KeyPair> {
  try {
    const key = await aesKeyFromPassword(password, own(vault.salt), "decrypt");
    const secret = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv: own(vault.iv) }, key, own(vault.wrapped));
    return { publicKey: own(vault.publicKey), secretKey: new Uint8Array(secret) };
  } catch {
    throw new BadPasswordError();
  }
}

// The sealed-box nonce is derived, never sent: BLAKE2b-24 over the ephemeral and recipient keys.
function sealNonce(ephemeralPublic: Uint8Array, recipientPublic: Uint8Array): Uint8Array {
  const joined = new Uint8Array(ephemeralPublic.length + recipientPublic.length);
  joined.set(ephemeralPublic, 0);
  joined.set(recipientPublic, ephemeralPublic.length);
  return blake2b(joined, { dkLen: 24 });
}

export function seal(plaintext: Uint8Array, recipientPublicKey: Uint8Array): Uint8Array {
  const ephemeral = nacl.box.keyPair();
  const box = nacl.box(plaintext, sealNonce(ephemeral.publicKey, recipientPublicKey), recipientPublicKey, ephemeral.secretKey);
  const out = new Uint8Array(32 + box.length);
  out.set(ephemeral.publicKey, 0);
  out.set(box, 32);
  return out;
}

/** Returns the plaintext, or null when the box does not authenticate. */
export function unseal(sealed: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array | null {
  const ephemeralPublic = sealed.subarray(0, 32);
  return nacl.box.open(sealed.subarray(32), sealNonce(ephemeralPublic, publicKey), ephemeralPublic, secretKey);
}
