import { useLocation } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { api, ApiError, type Account } from "../api/client";
import {
  b64,
  generateIdentity,
  IdentityUnlockError,
  persistIdentity,
  wrapIdentity,
  type Identity,
} from "../crypto/identity";
import { t } from "../i18n";

export function Auth(props: {
  session?: Account | null;
  onAuthed: (
    account: Account,
    password: string,
    identity?: Identity,
  ) => Promise<void>;
  onRecover: (account: Account, password: string) => Promise<void>;
  onSwitch: () => Promise<void>;
}) {
  const location = useLocation();
  const initialInvite =
    new URLSearchParams(location.search).get("invite") ??
    (location.pathname.startsWith("/invite/")
      ? decodeURIComponent(location.pathname.split("/")[2] ?? "")
      : "");
  const [inviteCode, setInviteCode] = createSignal(initialInvite);
  const [recoverOpen, setRecoverOpen] = createSignal(false);
  const [mode, setMode] = createSignal<"login" | "register">(
    initialInvite ? "register" : "login",
  );
  const [pendingSession, setPendingSession] = createSignal<Account | null>(
    null,
  );
  const [handle, setHandle] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [visible, setVisible] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [missing, setMissing] = createSignal(false);
  const session = () => props.session ?? pendingSession();
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy()) return;
    setBusy(true);
    setError("");
    setMissing(false);
    try {
      if (session()) {
        await props.onAuthed(session()!, password());
        return;
      }
      if (mode() === "register") {
        const id = generateIdentity();
        const vault = await wrapIdentity(id, password());
        const me = await api<Account>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            handle: handle().trim(),
            password: password(),
            identity_pubkey: b64(id.publicKey),
            identity_vault: vault,
            invite_code: inviteCode().trim() || undefined,
          }),
        });
        setPendingSession(me);
        await persistIdentity(me.id, id, password());
        await props.onAuthed(me, password(), id);
      } else {
        const me = await api<Account>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            handle: handle().trim(),
            password: password(),
          }),
        });
        setPendingSession(me);
        await props.onAuthed(me, password());
      }
    } catch (err) {
      if (err instanceof IdentityUnlockError && err.reason === "missing_vault")
        setMissing(true);
      setError(
        err instanceof IdentityUnlockError
          ? err.reason === "missing_vault"
            ? t("auth.missingVault")
            : t("auth.badPassword")
          : err instanceof ApiError &&
              err.status === 403 &&
              mode() === "register"
            ? t("auth.inviteError")
            : err instanceof ApiError && err.status === 401
              ? t("auth.invalidCredentials")
              : err instanceof Error
                ? err.message
                : t("auth.genericError"),
      );
    } finally {
      setBusy(false);
    }
  }
  async function recover() {
    if (password().length < 8) {
      setError(t("auth.passwordRequired"));
      return;
    }
    const me = session();
    if (!me) return;
    setBusy(true);
    setError("");
    try {
      await props.onRecover(me, password());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.recoverError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand-mark">M</div>
        <p class="eyebrow">{t("auth.brand")}</p>
        <Show when={!session()}>
          <div class="auth-tabs">
            <button
              classList={{ selected: mode() === "login" }}
              onClick={() => setMode("login")}
            >
              {t("auth.login")}
            </button>
            <button
              classList={{ selected: mode() === "register" }}
              onClick={() => setMode("register")}
            >
              {t("auth.register")}
            </button>
          </div>
        </Show>
        <h1>
          {session()
            ? t("auth.unlock")
            : mode() === "login"
              ? t("auth.welcome")
              : t("auth.createTitle")}
        </h1>
        <p class="muted">
          {session() ? (
            <>
              {t("auth.unlockHint")} <b>@{session()!.handle}</b>{" "}
              {t("auth.unlockSuffix")}
            </>
          ) : (
            t("auth.tagline")
          )}
        </p>
        <form onSubmit={submit} class="auth-form">
          <Show when={!session()}>
            <label>
              {t("auth.handle")}
              <input
                required
                minLength={3}
                maxLength={32}
                autocomplete="username"
                value={handle()}
                onInput={(e) => setHandle(e.currentTarget.value)}
                placeholder={t("auth.handlePlaceholder")}
              />
            </label>
          </Show>
          <Show when={!session() && mode() === "register"}>
            <label>
              {t("auth.inviteCode")}
              <input
                value={inviteCode()}
                onInput={(e) => setInviteCode(e.currentTarget.value)}
                autocomplete="off"
                placeholder={t("auth.invitePlaceholder")}
              />
            </label>
            <p class="muted">{t("auth.inviteHint")}</p>
          </Show>
          <label>
            {t("auth.password")}
            <span class="password-control">
              <input
                required
                minLength={8}
                type={visible() ? "text" : "password"}
                autocomplete={
                  mode() === "login" ? "current-password" : "new-password"
                }
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder={t("auth.passwordPlaceholder")}
              />
              <button
                type="button"
                aria-label={
                  visible() ? t("auth.hidePassword") : t("auth.showPassword")
                }
                onClick={() => setVisible(!visible())}
              >
                {visible() ? t("auth.hide") : t("auth.show")}
              </button>
            </span>
          </label>
          <Show when={missing()}>
            <p class="notice">{t("auth.missingVault")}</p>
          </Show>
          <Show when={error()}>
            <p class="form-error" role="alert">
              {error()}
            </p>
          </Show>
          <button class="primary-action" type="submit" disabled={busy()}>
            {busy()
              ? t("auth.waiting")
              : session()
                ? t("auth.unlockButton")
                : mode() === "login"
                  ? t("auth.login")
                  : t("auth.createButton")}
          </button>
        </form>
        <Show when={session()}>
          <div class="auth-extra">
            <button
              type="button"
              class="text-action"
              disabled={busy()}
              onClick={() => setRecoverOpen(true)}
            >
              {t("auth.recover")}
            </button>
            <button
              type="button"
              class="text-action"
              disabled={busy()}
              onClick={async () => {
                setBusy(true);
                try {
                  await props.onSwitch();
                  setPendingSession(null);
                  setError("");
                  setMissing(false);
                  setPassword("");
                } catch {
                  setError(t("auth.genericError"));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("auth.switchAccount")}
            </button>
          </div>
        </Show>
      </section>
      <Show when={recoverOpen()}>
        <div class="modal-backdrop">
          <section
            class="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-title"
          >
            <h2 id="recovery-title">{t("auth.recover")}</h2>
            <p>{t("auth.recoveryWarning")}</p>
            <div>
              <button disabled={busy()} onClick={() => setRecoverOpen(false)}>
                {t("shell.cancel")}
              </button>
              <button
                class="primary-action"
                disabled={busy()}
                onClick={async () => {
                  setRecoverOpen(false);
                  await recover();
                }}
              >
                {t("auth.generateKeys")}
              </button>
            </div>
          </section>
        </div>
      </Show>
    </main>
  );
}
