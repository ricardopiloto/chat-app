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
import { applyTheme, resolveTheme } from "../theme/theme";

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
  const [mode, setMode] = createSignal<"register" | "login">(props.session ? "login" : "register");
  const [error, setError] = createSignal("");
  const [missingVault, setMissingVault] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [loggedIn, setLoggedIn] = createSignal<Account | null>(null);

  const session = () => props.session ?? loggedIn();

  // Auth sits outside AppShell — still apply theme tokens on a root .app wrapper
  const theme = resolveTheme();

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
    return err instanceof Error ? err.message : String(err);
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
    <div
      class="app auth-screen"
      data-theme={theme}
      ref={(el) => applyTheme(theme, el)}
    >
      <div class="auth-card">
        <div class="auth-brand">
          <span class="topbar-mark" aria-hidden="true" />
          <span class="topbar-name">Mesa</span>
        </div>
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
          <h1>{mode() === "register" ? "Criar conta" : "Entrar"}</h1>
          <p class="muted">A primeira conta da instância é livre. Depois disso é preciso um convite.</p>
        </Show>
        <form onSubmit={submit} class="auth-actions">
          <Show when={!session()}>
            <div class="field">
              <label for="auth-handle">Identificador</label>
              <input
                id="auth-handle"
                class="input"
                required
                value={handle()}
                onInput={(e) => setHandle(e.currentTarget.value)}
              />
            </div>
          </Show>
          <div class="field">
            <label for="auth-password">Senha</label>
            <input
              id="auth-password"
              class="input"
              required
              minLength={8}
              type="password"
              placeholder="mín. 8 caracteres"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
          </div>
          <button type="submit" class="btn btn-primary btn-block" disabled={busy()}>
            {session() ? "Desbloquear" : mode() === "register" ? "Cadastrar" : "Entrar"}
          </button>
        </form>
        <Show when={!session()}>
          <button
            type="button"
            class="btn btn-ghost"
            onClick={() => setMode(mode() === "register" ? "login" : "register")}
          >
            {mode() === "register" ? "Já tenho conta" : "Quero cadastrar"}
          </button>
        </Show>
        <Show when={!!session() && props.onClearSession}>
          <button
            type="button"
            class="btn btn-secondary"
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
          <button type="button" class="btn btn-secondary" disabled={busy()} onClick={(e) => void recover(e)}>
            Gerar novas chaves neste aparelho
          </button>
        </Show>
        <p class="error">{error()}</p>
      </div>
    </div>
  );
}
