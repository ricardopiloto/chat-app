// Who is signed in and whether their identity is unlocked. The server session (cookie) and the
// identity (secret key, held only in memory) are separate: after a reload the account is known but
// the identity is locked until the password opens the vault again.
import { createContext, createSignal, useContext, type JSX } from "solid-js";
import { auth, invites, queryClient, type Account, type Membership } from "../api";
import { b64, fromB64, generateIdentity, hasLocalVault, IdentityUnlockError, persistIdentity, unlockIdentity, wrapIdentity, type Identity } from "../crypto/identity";
import {
  canonicalIdentityVaultJson,
  createRecovery,
  recoveryPayloadHash,
  recoverySignMessage,
  signWithRecoveryCode,
  unwrapRecovery,
  uuidToBytes,
  type RecoveryMaterial,
} from "../crypto/recovery";
import { forgetServerKeys } from "../crypto/serverKey";

export type SessionPhase = "loading" | "anonymous" | "locked" | "ready";

/** Why the identity is still locked after a sign-in, so the unlock screen can say so. */
export type LockReason =
  /** The vault exists in this browser; only the password is missing. */
  | "locked"
  /** This browser has no copy, but the server does: unlocking will fetch it. */
  | "no_local"
  /** Neither this browser nor the server has a vault. */
  | "missing_vault"
  | "bad_password";

export type Credentials = { handle: string; password: string };

function createSession() {
  const [account, setAccount] = createSignal<Account>();
  const [identity, setIdentity] = createSignal<Identity>();
  const [checked, setChecked] = createSignal(false);
  const [lockReason, setLockReason] = createSignal<LockReason>("locked");

  const phase = (): SessionPhase => (!checked() ? "loading" : !account() ? "anonymous" : identity() ? "ready" : "locked");

  /** Reads the existing server session, if any. */
  async function restore(): Promise<void> {
    try {
      setAccount(await auth.me());
    } catch {
      setAccount(undefined);
    }
    const me = account();
    if (me && !(await hasLocalVault(me.id))) setLockReason(me.identity_vault ? "no_local" : "missing_vault");
    setChecked(true);
  }

  // Accounts created before the server kept a vault copy get one uploaded after their first unlock.
  async function backfillRemoteVault(me: Account, password: string, id: Identity): Promise<void> {
    if (me.identity_vault) return;
    const vault = await wrapIdentity(id, password);
    await auth.saveVault(vault);
    setAccount({ ...me, identity_vault: vault });
  }

  function adopt(me: Account, id?: Identity): void {
    if (account()?.id !== me.id) forgetServerKeys();
    setAccount(me);
    if (id) setIdentity(id);
  }

  async function open(me: Account, password: string): Promise<void> {
    const id = await unlockIdentity(password, me.id, me.identity_vault);
    adopt(me, id);
    await backfillRemoteVault(me, password, id);
  }

  /** Signs in. An identity that cannot be opened leaves the account on the unlock screen. */
  async function login({ handle, password }: Credentials): Promise<void> {
    const me = await auth.login(handle, password);
    try {
      await open(me, password);
    } catch (error) {
      if (!(error instanceof IdentityUnlockError)) throw error;
      if (account()?.id !== me.id) forgetServerKeys();
      setIdentity(undefined);
      setAccount(me);
      setLockReason(error.reason);
    }
  }

  /** Creates the account. A recovery key, when present, was already shown and confirmed in memory. */
  async function register({
    handle,
    password,
    inviteCode,
    identity,
    recovery,
  }: Credentials & { inviteCode?: string; identity?: Identity; recovery?: RecoveryMaterial }): Promise<void> {
    const fresh = identity ?? generateIdentity();
    const vault = await wrapIdentity(fresh, password);
    const me = await auth.register({
      handle,
      password,
      identity_pubkey: b64(fresh.publicKey),
      identity_vault: vault,
      invite_code: inviteCode || undefined,
      recovery_vault: recovery?.vault,
      recovery_verifier_pubkey: recovery ? b64(recovery.verifierPublicKey) : undefined,
    });
    await persistIdentity(me.id, fresh, password);
    adopt(me, fresh);
  }

  /** Accepts an invitation with no account yet: the same identity setup as `register`, in one call. */
  async function joinWithInvite({
    handle,
    password,
    inviteCode,
    identity,
    recovery,
  }: Credentials & { inviteCode: string; identity?: Identity; recovery?: RecoveryMaterial }): Promise<Membership> {
    const fresh = identity ?? generateIdentity();
    const vault = await wrapIdentity(fresh, password);
    const membership = await invites.accept(inviteCode, {
      handle,
      password,
      identity_pubkey: b64(fresh.publicKey),
      identity_vault: vault,
      recovery_vault: recovery?.vault,
      recovery_verifier_pubkey: recovery ? b64(recovery.verifierPublicKey) : undefined,
    });
    const me = await auth.me();
    if (!me) throw new Error("session missing after accepting the invitation");
    await persistIdentity(me.id, fresh, password);
    adopt(me, fresh);
    return membership;
  }

  /** Opens the vault for the signed-in account; throws IdentityUnlockError with the reason. */
  async function unlock(password: string): Promise<void> {
    const me = account();
    if (!me) return;
    try {
      await open(me, password);
    } catch (error) {
      if (error instanceof IdentityUnlockError) setLockReason(error.reason);
      throw error;
    }
  }

  /** Replaces the identity with fresh keys. Older encrypted history stops being readable. */
  async function recover(password: string): Promise<void> {
    const me = account();
    if (!me) return;
    const fresh = generateIdentity();
    const vault = await wrapIdentity(fresh, password);
    const updated = await auth.replaceIdentity(b64(fresh.publicKey), vault);
    forgetServerKeys();
    await persistIdentity(me.id, fresh, password);
    setAccount({ ...updated, identity_vault: vault });
    setIdentity(fresh);
  }

  /** Operator reset: new identity, new session, servers wait for a handoff. */
  async function recoverWithCode(handle: string, code: string, password: string): Promise<void> {
    forgetServerKeys();
    const fresh = generateIdentity();
    const vault = await wrapIdentity(fresh, password);
    const me = await auth.recoverWithCode({
      handle,
      code,
      password,
      identity_pubkey: b64(fresh.publicKey),
      identity_vault: vault,
    });
    await persistIdentity(me.id, fresh, password);
    setAccount({ ...me, identity_vault: vault });
    setIdentity(fresh);
    setLockReason("locked");
  }

  /** Recovery key: same identity, new password, servers stay sealed to this account. */
  async function recoverWithKey(handle: string, code: string, password: string): Promise<void> {
    const challenge = await auth.recoveryChallenge(handle);
    const nonce = fromB64(challenge.nonce);
    const startSignature = await signWithRecoveryCode(code, handle, recoverySignMessage("start", handle, uuidToBytes(challenge.challenge_id), nonce));
    const started = await auth.recoveryStart({
      handle,
      challenge_id: challenge.challenge_id,
      nonce: challenge.nonce,
      signature: b64(startSignature),
    });
    const opened = await unwrapRecovery(started.recovery_vault, code, handle);
    const vault = await wrapIdentity(opened, password);
    const hash = await recoveryPayloadHash(password, canonicalIdentityVaultJson(vault));
    const ticket = fromB64(started.ticket);
    const redeemSignature = await signWithRecoveryCode(code, handle, recoverySignMessage("redeem", handle, ticket, hash));
    const me = await auth.recoveryRedeem({
      handle,
      ticket: started.ticket,
      signature: b64(redeemSignature),
      password,
      identity_vault: vault,
    });
    if (account()?.id !== me.id) forgetServerKeys();
    await persistIdentity(me.id, opened, password);
    setAccount({ ...me, identity_vault: vault });
    setIdentity(opened);
    setLockReason("locked");
  }

  /** Shows a new recovery code only after the caller has confirmed it was saved. */
  async function saveRecoveryKey(currentPassword: string, material: RecoveryMaterial): Promise<void> {
    const updated = await auth.putRecoveryKey(currentPassword, material.vault, b64(material.verifierPublicKey));
    setAccount(updated);
  }

  /** Builds a recovery code for the unlocked identity. The code stays with the caller. */
  async function prepareRecoveryKey(): Promise<RecoveryMaterial> {
    const me = account();
    const id = identity();
    if (!me || !id) throw new Error("identity locked");
    return createRecovery(id, me.handle);
  }

  /** Re-wraps the same identity. Other sessions end; this one stays. */
  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const me = account();
    const id = identity();
    if (!me || !id) return;
    const vault = await wrapIdentity(id, newPassword);
    await auth.changePassword(currentPassword, newPassword, vault);
    await persistIdentity(me.id, id, newPassword);
    setAccount({ ...me, identity_vault: vault });
  }

  async function logout(): Promise<void> {
    await auth.logout();
    invalidate();
  }

  function invalidate(): void {
    forgetServerKeys();
    setAccount(undefined);
    setIdentity(undefined);
    setLockReason("locked");
    queryClient.clear();
  }

  return {
    phase,
    account,
    identity,
    lockReason,
    restore,
    login,
    register,
    joinWithInvite,
    unlock,
    recover,
    recoverWithCode,
    recoverWithKey,
    prepareRecoveryKey,
    saveRecoveryKey,
    changePassword,
    logout,
    invalidate,
    /** Applies a changed account (display name, avatar) everywhere that reads it. */
    updateAccount: (next: Account) => setAccount(next),
  };
}

export type Session = ReturnType<typeof createSession>;

const SessionContext = createContext<Session>();

export function SessionProvider(props: { children: JSX.Element }) {
  const session = createSession();
  void session.restore();
  return <SessionContext.Provider value={session}>{props.children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession needs a SessionProvider");
  return session;
}
