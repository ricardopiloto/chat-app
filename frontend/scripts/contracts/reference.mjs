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

const SEED_DOMAIN = text.encode("mesa-invite-seed-v1");
const seedCheck = (serverKey) => blake2b(concat(SEED_DOMAIN, serverKey), { dkLen: 16 });

export function createInviteSeed(serverKey) {
  const ephemeral = nacl.box.keyPair();
  const sealed = seal(serverKey, ephemeral.publicKey);
  return { blob: concat(new Uint8Array([1]), sealed, seedCheck(serverKey)), secret: ephemeral.secretKey };
}

export function openInviteSeed(blob, secret) {
  if (blob.length !== 97 || blob[0] !== 1 || secret.length !== 32) return null;
  const publicKey = nacl.box.keyPair.fromSecretKey(secret).publicKey;
  const opened = unseal(blob.slice(1, 81), publicKey, secret);
  if (!opened || opened.length !== 32) return null;
  const expected = seedCheck(opened);
  const given = blob.slice(81);
  if (expected.some((byte, index) => byte !== given[index])) return null;
  return opened;
}

export const encodeSeedBlob = (blob) => Buffer.from(blob).toString("base64");
export const inviteFragment = (secret) => `k=${Buffer.from(secret).toString("base64url")}`;
export const inviteUrl = (origin, code, secret) =>
  `${String(origin).replace(/\/$/, "")}/invite/${encodeURIComponent(code)}#${inviteFragment(secret)}`;

export const encryptMessage = async (serverKey, str) => Buffer.from(await encryptBytes(serverKey, text.encode(str))).toString("base64");
export const decryptMessage = async (serverKey, b64) =>
  new TextDecoder().decode(await decryptBytes(serverKey, Uint8Array.from(Buffer.from(b64, "base64"))));
