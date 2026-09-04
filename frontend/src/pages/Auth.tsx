import { Show, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { api, type Account } from "../api/client";
import { b64, generateIdentity, persistIdentity, wrapIdentity, type Identity } from "../crypto/identity";

type Props = {
  session?: Account | null;
  onAuthed: (account: Account, password: string, identity?: Identity) => Promise<void>;
  onClearSession?: () => Promise<void>;
  inviteCode?: string;
};

export default function Auth(props: Props) {
  const navigate = useNavigate();
  const [handle, setHandle] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [mode, setMode] = createSignal<"register" | "login">(props.session ? "login" : "register");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function submit(e: Event) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (props.session) {
        await props.onAuthed(props.session, password());
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
        try {
          await props.onAuthed(account, password());
        } catch (err) {
          await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
          throw err;
        }
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main class="main">
      <Show
        when={!props.session}
        fallback={
          <>
            <h1>Desbloquear chaves</h1>
            <p class="muted">
              Sessão de <strong>{props.session?.handle}</strong>. Introduza a senha para
              desenvelopar as chaves neste aparelho.
            </p>
          </>
        }
      >
        <h1>{mode() === "register" ? "Criar conta" : "Entrar"}</h1>
        <p class="muted">
          A primeira conta da instância é livre. Depois disso é preciso um convite.
        </p>
      </Show>
      <form onSubmit={submit}>
        <div class="row">
          <Show when={!props.session}>
            <input
              required
              placeholder="identificador"
              value={handle()}
              onInput={(e) => setHandle(e.currentTarget.value)}
            />
          </Show>
          <input
            required
            minLength={8}
            type="password"
            placeholder="senha (mín. 8)"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
          <button type="submit" disabled={busy()}>
            {props.session ? "Desbloquear" : mode() === "register" ? "Cadastrar" : "Entrar"}
          </button>
        </div>
      </form>
      <Show when={!props.session}>
        <p>
          <button
            type="button"
            class="secondary"
            onClick={() => setMode(mode() === "register" ? "login" : "register")}
          >
            {mode() === "register" ? "Já tenho conta" : "Quero cadastrar"}
          </button>
        </p>
      </Show>
      <Show when={!!props.session && props.onClearSession}>
        <p>
          <button
            type="button"
            class="secondary"
            onClick={() => void props.onClearSession?.()}
          >
            Entrar com outra conta
          </button>
        </p>
      </Show>
      <p class="error">{error()}</p>
    </main>
  );
}
