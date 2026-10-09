// Invite link seed: the server key travels in the URL fragment, sealed to an ephemeral key.
// Format is docs/v2/contracts/crypto-formats.md §11.
import nacl from "tweetnacl";
import { blake2b } from "@noble/hashes/blake2b";
import { seal, unseal } from "./vault.ts";

export const INVITE_SEED_BYTES = 97;
export const INVITE_SEED_MAX_BYTES = 128;
export const SEED_TTL_SECONDS = 24 * 60 * 60;

const VERSION = 1;
const SEAL_BYTES = 80;
const CHECK_BYTES = 16;
const DOMAIN = new TextEncoder().encode("mesa-invite-seed-v1");

const standard = (bytes: Uint8Array): string => {
  let binary = "";
  for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return btoa(binary);
};

const fromStandard = (text: string): Uint8Array => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

const base64Url = (bytes: Uint8Array): string => standard(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

const fromBase64Url = (text: string): Uint8Array => {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return fromStandard(padded + pad);
};

function seedCheck(serverKey: Uint8Array): Uint8Array {
  const input = new Uint8Array(DOMAIN.length + serverKey.length);
  input.set(DOMAIN, 0);
  input.set(serverKey, DOMAIN.length);
  return blake2b(input, { dkLen: CHECK_BYTES });
}

const same = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length && left.every((byte, index) => byte === right[index]);

/** Seals `serverKey` to a fresh X25519 key. The secret stays in the URL fragment. */
export function createInviteSeed(serverKey: Uint8Array): { blob: Uint8Array; secret: Uint8Array } {
  const ephemeral = nacl.box.keyPair();
  const sealed = seal(serverKey, ephemeral.publicKey);
  const blob = new Uint8Array(1 + sealed.length + CHECK_BYTES);
  blob[0] = VERSION;
  blob.set(sealed, 1);
  blob.set(seedCheck(serverKey), 1 + sealed.length);
  return { blob, secret: ephemeral.secretKey };
}

/** Opens a seed. A damaged blob, a short secret, or a check that does not match yields null. */
export function openInviteSeed(blob: Uint8Array, secret: Uint8Array): Uint8Array | null {
  if (blob.length !== INVITE_SEED_BYTES || blob[0] !== VERSION || secret.length !== 32) return null;
  const publicKey = nacl.box.keyPair.fromSecretKey(secret).publicKey;
  const opened = unseal(blob.subarray(1, 1 + SEAL_BYTES), publicKey, secret);
  if (!opened || opened.length !== 32) return null;
  if (!same(seedCheck(opened), blob.subarray(1 + SEAL_BYTES))) return null;
  return opened;
}

export const encodeSeedBlob = (blob: Uint8Array): string => standard(blob);

export const inviteFragment = (secret: Uint8Array): string => `k=${base64Url(secret)}`;

/** Reads `#k=` from a location hash. Anything else, including a truncated secret, is ignored. */
export function parseInviteFragment(hash: string): Uint8Array | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const value = new URLSearchParams(raw).get("k");
  if (!value) return null;
  try {
    const secret = fromBase64Url(value);
    return secret.length === 32 ? secret : null;
  } catch {
    return null;
  }
}

export function inviteUrl(origin: string, code: string, secret: Uint8Array): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/invite/${encodeURIComponent(code)}#${inviteFragment(secret)}`;
}
