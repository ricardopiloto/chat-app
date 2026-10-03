// Reference implementation of docs/v2/contracts/crypto-formats.md.
// Written from that document and the libraries only; it exists to prove the document is sufficient
// and to give the harness something to run. Interface shared by every implementation under test.
import nacl from "tweetnacl";
import { blake2b } from "@noble/hashes/blake2b";
import { argon2id } from "hash-wasm";

const subtle = globalThis.crypto.subtle;
const text = new TextEncoder();

const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

async function vaultKey(password, salt, usage) {
  const raw = await argon2id({
    password: text.encode(password),
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 32 * 1024,
    hashLength: 32,
    outputType: "binary",
  });
  return subtle.importKey("raw", raw, "AES-GCM", false, usage);
}

export async function wrapVault(identity, password) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await vaultKey(password, salt, ["encrypt"]);
  const wrapped = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, identity.secretKey));
  return { v: 1, publicKey: [...identity.publicKey], salt: [...salt], iv: [...iv], wrapped: [...wrapped] };
}

/** Returns { publicKey, secretKey } or throws Error("bad_password"). */
export async function unlockVault(vault, password) {
  try {
    const key = await vaultKey(password, Uint8Array.from(vault.salt), ["decrypt"]);
    const secretKey = new Uint8Array(
      await subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(vault.iv) }, key, Uint8Array.from(vault.wrapped)),
    );
    return { publicKey: Uint8Array.from(vault.publicKey), secretKey };
  } catch {
    throw new Error("bad_password");
  }
}

const sealNonce = (ephPk, recipientPk) => blake2b(concat(ephPk, recipientPk), { dkLen: 24 });

export function seal(plaintext, recipientPublicKey) {
  const eph = nacl.box.keyPair();
  const boxed = nacl.box(plaintext, sealNonce(eph.publicKey, recipientPublicKey), recipientPublicKey, eph.secretKey);
  return concat(eph.publicKey, boxed);
}

/** Returns bytes, or null when authentication fails. */
export function unseal(sealed, publicKey, secretKey) {
  const ephPk = sealed.slice(0, 32);
  return nacl.box.open(sealed.slice(32), sealNonce(ephPk, publicKey), ephPk, secretKey);
}

export async function encryptBytes(serverKey, plain) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await subtle.importKey("raw", serverKey, "AES-GCM", false, ["encrypt"]);
  return concat(iv, new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, plain)));
}

/** Returns bytes or throws when the tag does not verify. */
export async function decryptBytes(serverKey, packed) {
  const key = await subtle.importKey("raw", serverKey, "AES-GCM", false, ["decrypt"]);
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: packed.slice(0, 12) }, key, packed.slice(12)));
}

export const encryptMessage = async (serverKey, str) => Buffer.from(await encryptBytes(serverKey, text.encode(str))).toString("base64");
export const decryptMessage = async (serverKey, b64) =>
  new TextDecoder().decode(await decryptBytes(serverKey, Uint8Array.from(Buffer.from(b64, "base64"))));
