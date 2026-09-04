import { Show, createResource, createSignal } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { api, type Account, type InvitePreview } from "../api/client";
import { b64, generateIdentity, persistIdentity, wrapIdentity, type Identity } from "../crypto/identity";

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
    <main class="main">
      <Show when={preview()} fallback={<p>A carregar convite…</p>}>
        {(p) => (
          <>
            <h1>Convite para {p().server_name}</h1>
            <p>{p().include_history ? "Inclui histórico" : "Sem histórico anterior"}</p>
            <form onSubmit={accept}>
              <Show when={!props.me}>
                <div class="row">
                  <input
                    required
                    placeholder="identificador"
                    value={handle()}
                    onInput={(e) => setHandle(e.currentTarget.value)}
                  />
                  <input
                    required
                    minLength={8}
                    type="password"
                    placeholder="senha"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                  />
                </div>
              </Show>
              <button type="submit">Aceitar convite</button>
            </form>
          </>
        )}
      </Show>
      <p class="error">{error()}</p>
    </main>
  );
}
