// Who is signed in and whether their identity is unlocked. The server session (cookie) and the
// identity (secret key, held only in memory) are separate: after a reload the account is known but
// the identity is locked until the password opens the vault again.
import { createContext, createSignal, useContext, type JSX } from "solid-js";
import { auth, invites, queryClient, type Account, type Membership } from "../api";
import { b64, generateIdentity, hasLocalVault, IdentityUnlockError, persistIdentity, unlockIdentity, wrapIdentity, type Identity } from "../crypto/identity";

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

  async function open(me: Account, password: string): Promise<void> {
    const id = await unlockIdentity(password, me.id, me.identity_vault);
    setAccount(me);
    setIdentity(id);
    await backfillRemoteVault(me, password, id);
  }

  /** Signs in. An identity that cannot be opened leaves the account on the unlock screen. */
  async function login({ handle, password }: Credentials): Promise<void> {
    const me = await auth.login(handle, password);
    try {
      await open(me, password);
    } catch (error) {
      if (!(error instanceof IdentityUnlockError)) throw error;
      setAccount(me);
      setLockReason(error.reason);
    }
  }

  /** Creates the account: the identity is generated here and only its password-wrapped vault is sent. */
  async function register({ handle, password, inviteCode }: Credentials & { inviteCode?: string }): Promise<void> {
    const fresh = generateIdentity();
    const vault = await wrapIdentity(fresh, password);
    const me = await auth.register({
      handle,
      password,
      identity_pubkey: b64(fresh.publicKey),
      identity_vault: vault,
      invite_code: inviteCode || undefined,
    });
    await persistIdentity(me.id, fresh, password);
    setAccount(me);
    setIdentity(fresh);
  }

  /** Accepts an invitation with no account yet: the same identity setup as `register`, in one call. */
  async function joinWithInvite({ handle, password, inviteCode }: Credentials & { inviteCode: string }): Promise<Membership> {
    const fresh = generateIdentity();
    const vault = await wrapIdentity(fresh, password);
    const membership = await invites.accept(inviteCode, { handle, password, identity_pubkey: b64(fresh.publicKey), identity_vault: vault });
    const me = await auth.me();
    if (!me) throw new Error("session missing after accepting the invitation");
    await persistIdentity(me.id, fresh, password);
    setAccount(me);
    setIdentity(fresh);
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
    await persistIdentity(me.id, fresh, password);
    setAccount({ ...updated, identity_vault: vault });
    setIdentity(fresh);
  }

  async function logout(): Promise<void> {
    await auth.logout();
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
    logout,
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
