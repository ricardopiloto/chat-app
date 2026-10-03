// Account identity: key pair, the vault that protects it, and where the vault is kept. The vault
// format and derivation live in vault.ts; this module adds browser storage and the unlock policy.
import { BadPasswordError, newKeyPair, seal, unlockVault, unseal, wrapVault, type IdentityVault, type KeyPair } from "./vault";

export { seal, unseal, type IdentityVault };
export type Identity = KeyPair;

const DB_NAME = "chat-identity";
const STORE = "keys";

/** Why an unlock attempt failed; the screen decides the wording. */
export type UnlockFailure = "missing_vault" | "bad_password";

export class IdentityUnlockError extends Error {
  readonly reason: UnlockFailure;
  constructor(reason: UnlockFailure) {
    super(reason);
    this.name = "IdentityUnlockError";
    this.reason = reason;
  }
}

export const b64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return btoa(binary);
};

export const fromB64 = (text: string): Uint8Array => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

const vaultKey = (accountId: string) => `identity:${accountId}`;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

const readLocalVault = (accountId: string) => withStore<IdentityVault | undefined>("readonly", (store) => store.get(vaultKey(accountId)));
const writeLocalVault = (accountId: string, vault: IdentityVault) => withStore("readwrite", (store) => store.put(vault, vaultKey(accountId)));

/** True when this browser already holds the account's vault (so an unlock needs no server copy). */
export const hasLocalVault = async (accountId: string): Promise<boolean> => (await readLocalVault(accountId)) !== undefined;

export const generateIdentity = (): Identity => newKeyPair();

export const wrapIdentity = (identity: Identity, password: string): Promise<IdentityVault> => wrapVault(identity, password);

/** Opens a vault held in memory, without touching storage. */
export async function unlockIdentityVault(vault: IdentityVault, password: string): Promise<Identity> {
  try {
    return await unlockVault(vault, password);
  } catch (error) {
    throw error instanceof BadPasswordError ? new IdentityUnlockError("bad_password") : error;
  }
}

/** Wraps the identity with the password and keeps the vault in this browser; returns it for upload. */
export async function persistIdentity(accountId: string, identity: Identity, password: string): Promise<IdentityVault> {
  const vault = await wrapIdentity(identity, password);
  await writeLocalVault(accountId, vault);
  return vault;
}

/**
 * Unlocks the account identity. The vault kept in this browser wins; otherwise the one held by the
 * server is used. A vault that opens is also kept locally so the next visit needs no server copy.
 */
export async function unlockIdentity(password: string, accountId: string, remoteVault?: IdentityVault | null): Promise<Identity> {
  const vault = (await readLocalVault(accountId)) ?? remoteVault ?? undefined;
  if (!vault) throw new IdentityUnlockError("missing_vault");
  const identity = await unlockIdentityVault(vault, password);
  await writeLocalVault(accountId, vault);
  return identity;
}
