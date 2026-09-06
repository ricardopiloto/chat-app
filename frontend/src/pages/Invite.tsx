import { Show, createResource, createSignal } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { api, type Account, type InvitePreview } from "../api/client";
import { b64, generateIdentity, persistIdentity, wrapIdentity, type Identity } from "../crypto/identity";
import AuthShell from "../components/AuthShell";
import IconAt from "../components/icons/IconAt";
import { IconEyeOff, IconEyeOpen } from "../components/icons/IconEye";
import { IconLockClosed } from "../components/icons/IconLock";

type Props = {
  me: Account | null;
  onAuthed: (account: Account, password: string, identity?: Identity) => Promise<void>;
};

export default function Invite(props: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const [preview] = createResource(() => api<InvitePreview>(`/api/invites/${params.code}`));
  const [handle, setHandle] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);

  async function accept(e: Event) {
    e.preventDefault();
    setError("");
    try {
      if (props.me) {
        await api(`/api/invites/${params.code}/accept`, {
          method: "POST",
          body: JSON.stringify({}),
        });
      } else {
        const identity = generateIdentity();
        const vault = await wrapIdentity(identity, password());
        const account = await api<Account>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            handle: handle(),
            password: password(),
            identity_pubkey: b64(identity.publicKey),
            identity_vault: vault,
            invite_code: params.code,
          }),
        });
        await persistIdentity(account.id, identity, password());
        await props.onAuthed(account, password(), identity);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <AuthShell>
      <Show when={preview()} fallback={<p class="muted">A carregar convite…</p>}>
        {(p) => (
          <>
            <h1>Convite</h1>
            <p>
              Entrar em <strong>{p().server_name}</strong>
            </p>
            <p class="muted">{p().include_history ? "Inclui histórico" : "Sem histórico anterior"}</p>
            <form onSubmit={accept} class="auth-actions">
              <Show when={!props.me}>
                <div class="field">
                  <label for="inv-handle">Seu identificador</label>
                  <div class="input-affix">
                    <span class="input-affix-icon" aria-hidden="true">
                      <IconAt />
                    </span>
                    <input
                      id="inv-handle"
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
                <div class="field">
                  <label for="inv-password">Senha</label>
                  <div class="input-affix">
                    <span class="input-affix-icon" aria-hidden="true">
                      <IconLockClosed size={18} />
                    </span>
                    <input
                      id="inv-password"
                      class="input"
                      required
                      minLength={8}
                      autocomplete="new-password"
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
              </Show>
              <button type="submit" class="btn auth-btn-primary btn-block">
                Aceitar convite
              </button>
            </form>
          </>
        )}
      </Show>
      <p class="error">{error()}</p>
    </AuthShell>
  );
}
