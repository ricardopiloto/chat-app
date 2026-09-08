import { Show, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { ApiError, api, type Account } from "../api/client";
import {
  b64,
  generateIdentity,
  IdentityUnlockError,
  persistIdentity,
  wrapIdentity,
  type Identity,
} from "../crypto/identity";
import AuthShell from "../components/AuthShell";
import IconAt from "../components/icons/IconAt";
import { IconEyeOff, IconEyeOpen } from "../components/icons/IconEye";
import { IconLockClosed } from "../components/icons/IconLock";
import { errorMessage } from "../lib/apiError";

type Props = {
  session?: Account | null;
  onAuthed: (account: Account, password: string, identity?: Identity) => Promise<void>;
  onRecoverIdentity?: (account: Account, password: string) => Promise<void>;
  onClearSession?: () => Promise<void>;
  inviteCode?: string;
};

export default function Auth(props: Props) {
  const navigate = useNavigate();
  const [handle, setHandle] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [mode, setMode] = createSignal<"register" | "login">("login");
  const [error, setError] = createSignal("");
  const [missingVault, setMissingVault] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [loggedIn, setLoggedIn] = createSignal<Account | null>(null);
  const [showPassword, setShowPassword] = createSignal(false);

  const session = () => props.session ?? loggedIn();

  function describeError(err: unknown): string {
    if (err instanceof IdentityUnlockError) return err.message;
    if (err instanceof ApiError) {
      if (err.status === 401 && err.message === "invalid credentials") {
        return "identificador ou senha incorrectos";
      }
      if (err.status === 401 && err.message === "unauthorized") {
        return "sessão expirada. Entre outra vez.";
      }
      return err.message;
    }
    return errorMessage(err);
  }

  async function submit(e: Event) {
    e.preventDefault();
    setError("");
    setMissingVault(false);
    setBusy(true);
    try {
      const current = session();
      if (current) {
        await props.onAuthed(current, password());
        navigate("/");
        return;
      }
      if (mode() === "register") {
        const identity = generateIdentity();
        const vault = await wrapIdentity(identity, password());
        const account = await api<Account>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            handle: handle(),
            password: password(),
            identity_pubkey: b64(identity.publicKey),
            identity_vault: vault,
            invite_code: props.inviteCode,
          }),
        });
        await persistIdentity(account.id, identity, password());
        await props.onAuthed(account, password(), identity);
      } else {
        const account = await api<Account>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ handle: handle(), password: password() }),
        });
        setLoggedIn(account);
        await props.onAuthed(account, password());
      }
      navigate("/");
    } catch (err) {
      if (err instanceof IdentityUnlockError && err.reason === "missing_vault") {
        setMissingVault(true);
      }
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function recover(e: Event) {
    e.preventDefault();
    const account = session();
    if (!account || !props.onRecoverIdentity) return;
    setError("");
    setBusy(true);
    try {
      await props.onRecoverIdentity(account, password());
      navigate("/");
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Show when={!session()}>
        <div class="auth-tabs" role="tablist" aria-label="Autenticação">
          <button
            type="button"
            role="tab"
            class="auth-tab"
            aria-selected={mode() === "login"}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            class="auth-tab"
            aria-selected={mode() === "register"}
            onClick={() => setMode("register")}
          >
            Criar conta
          </button>
        </div>
      </Show>

      <Show
        when={!session()}
        fallback={
          <>
            <h1>Desbloquear chaves</h1>
            <p class="muted">
              Autenticado como <strong>{session()?.handle}</strong>. A senha abre as chaves E2EE
              neste navegador — o servidor só guarda o cofre cifrado.
            </p>
          </>
        }
      >
        <Show when={mode() === "register"}>
          <p class="muted">A primeira conta da instância é livre. Depois disso é preciso um convite.</p>
        </Show>
      </Show>

      <form onSubmit={submit} class="auth-actions">
        <Show when={!session()}>
          <div class="field">
            <label for="auth-handle">Seu identificador</label>
            <div class="input-affix">
              <span class="input-affix-icon" aria-hidden="true">
                <IconAt />
              </span>
              <input
                id="auth-handle"
                class="input"
                required
                autocomplete="username"
                placeholder="@ seu_handle"
                value={handle()}
                onInput={(e) => setHandle(e.currentTarget.value)}
              />
            </div>
            <p class="auth-field-hint">Este será o seu @handle nesta instância.</p>
          </div>
        </Show>
        <div class="field">
          <label for="auth-password">Senha</label>
          <div class="input-affix">
            <span class="input-affix-icon" aria-hidden="true">
              <IconLockClosed size={18} />
            </span>
            <input
              id="auth-password"
              class="input"
              required
              minLength={8}
              autocomplete={session() || mode() === "login" ? "current-password" : "new-password"}
              type={showPassword() ? "text" : "password"}
              placeholder="Sua senha"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
            <button
              type="button"
              class="input-affix-toggle"
              aria-label={showPassword() ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword(!showPassword())}
            >
              <Show when={showPassword()} fallback={<IconEyeOpen />}>
                <IconEyeOff />
              </Show>
            </button>
          </div>
        </div>
        <button type="submit" class="btn auth-btn-primary btn-block" disabled={busy()}>
          {session() ? "Desbloquear" : mode() === "register" ? "Criar conta" : "Entrar"}
        </button>
      </form>

      <Show when={!session() && mode() === "login"}>
        <div class="auth-divider" aria-hidden="true">
          ou
        </div>
        <button type="button" class="btn auth-btn-outline btn-block" onClick={() => setMode("register")}>
          Criar conta
        </button>
      </Show>

      <Show when={!!session() && props.onClearSession}>
        <button
          type="button"
          class="btn btn-secondary btn-block"
          onClick={() => {
            setLoggedIn(null);
            setMissingVault(false);
            setError("");
            void props.onClearSession?.();
          }}
        >
          Entrar com outra conta
        </button>
      </Show>
      <Show when={missingVault() && !!session() && !!props.onRecoverIdentity}>
        <button
          type="button"
          class="btn btn-secondary btn-block"
          disabled={busy()}
          onClick={(e) => void recover(e)}
        >
          Gerar novas chaves neste aparelho
        </button>
      </Show>
      <p class="error">{error()}</p>
    </AuthShell>
  );
}
