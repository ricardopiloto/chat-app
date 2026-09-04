import nacl from "tweetnacl";
import { argon2id } from "hash-wasm";
import { blake2b } from "@noble/hashes/blake2b";

const DB = "chat-identity";
const STORE = "keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function b64(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

export function fromB64(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const hash = await argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 32 * 1024,
    hashLength: 32,
    outputType: "binary",
  });
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export type Identity = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export type IdentityVault = {
  v: 1;
  publicKey: number[];
  salt: number[];
  iv: number[];
  wrapped: number[];
};

function identityStoreKey(accountId: string): string {
  return `identity:${accountId}`;
}

export function generateIdentity(): Identity {
  const kp = nacl.box.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export async function wrapIdentity(identity: Identity, password: string): Promise<IdentityVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const wrapped = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, identity.secretKey),
  );
  return {
    v: 1,
    publicKey: Array.from(identity.publicKey),
    salt: Array.from(salt),
    iv: Array.from(iv),
    wrapped: Array.from(wrapped),
  };
}

export async function persistIdentity(
  accountId: string,
  identity: Identity,
  password: string,
): Promise<IdentityVault> {
  const vault = await wrapIdentity(identity, password);
  await idbPut(identityStoreKey(accountId), vault);
  return vault;
}

async function openVault(stored: IdentityVault, password: string): Promise<Identity> {
  const key = await deriveKey(password, Uint8Array.from(stored.salt));
  const secret = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Uint8Array.from(stored.iv) },
      key,
      Uint8Array.from(stored.wrapped),
    ),
  );
  return { publicKey: Uint8Array.from(stored.publicKey), secretKey: secret };
}

export async function unlockIdentity(
  password: string,
  accountId: string,
  remoteVault?: IdentityVault | null,
): Promise<Identity> {
  const keyed = await idbGet<IdentityVault>(identityStoreKey(accountId));
  const legacy = keyed ? undefined : await idbGet<IdentityVault>("identity");
  const stored = keyed ?? remoteVault ?? legacy;
  if (!stored) {
    throw new Error("não foi possível abrir as chaves desta conta. Verifique a senha.");
  }
  try {
    const identity = await openVault(stored, password);
    await idbPut(identityStoreKey(accountId), stored);
    return identity;
  } catch {
    throw new Error("senha incorrecta ou cofre de chaves ilegível.");
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

export function seal(plaintext: Uint8Array, recipientPk: Uint8Array): Uint8Array {
  const eph = nacl.box.keyPair();
  const nonce = blake2b(concat(eph.publicKey, recipientPk), { dkLen: 24 });
  const boxed = nacl.box(plaintext, nonce, recipientPk, eph.secretKey);
  return concat(eph.publicKey, boxed);
}

export function unseal(
  sealed: Uint8Array,
  publicKey: Uint8Array,
  secretKey: Uint8Array,
): Uint8Array | null {
  const ephPk = sealed.slice(0, 32);
  const boxed = sealed.slice(32);
  const nonce = blake2b(concat(ephPk, publicKey), { dkLen: 24 });
  return nacl.box.open(boxed, nonce, ephPk, secretKey);
}
