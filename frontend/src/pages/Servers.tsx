import { For, Show, createResource, createSignal } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { api, type Account, type Channel, type Invite, type Server } from "../api/client";
import { generateServerKey } from "../crypto/serverKey";
import { publishOwnEnvelope } from "../crypto/keyHandoff";
import type { Identity } from "../crypto/identity";

type Props = {
  me: Account;
  identity: Identity;
};

export default function Servers(props: Props) {
  const navigate = useNavigate();
  const [servers, { refetch }] = createResource(() => api<Server[]>("/api/servers"));
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");
  const [selected, setSelected] = createSignal<Server | null>(null);
  const [channels] = createResource(selected, (s) =>
    api<Channel[]>(`/api/servers/${s.id}/channels`),
  );
  const [invites] = createResource(selected, (s) =>
    api<Invite[]>(`/api/servers/${s.id}/invites`).catch(() => [] as Invite[]),
  );

  async function createServer(e: Event) {
    e.preventDefault();
    setError("");
    try {
      const server = await api<Server>("/api/servers", {
        method: "POST",
        body: JSON.stringify({ name: name() }),
      });
      const key = generateServerKey();
      await publishOwnEnvelope(server.id, props.me.id, props.identity, key);
      setName("");
      await refetch();
      setSelected(server);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function createChannel(type: "text" | "voice_video") {
    const server = selected();
    if (!server) return;
    const channelName = type === "text" ? "geral" : "mesa";
    try {
      const ch = await api<Channel>(`/api/servers/${server.id}/channels`, {
        method: "POST",
        body: JSON.stringify({ name: channelName, type }),
      });
      navigate(`/channels/${ch.id}?server=${server.id}&type=${ch.type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function createInvite(includeHistory: boolean) {
    const server = selected();
    if (!server) return;
    try {
      const inv = await api<Invite>(`/api/servers/${server.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ include_history: includeHistory }),
      });
      const url = `${location.origin}/invite/${inv.code}`;
      await navigator.clipboard.writeText(url).catch(() => undefined);
      alert(`Convite copiado:\n${url}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div class="layout">
      <aside class="sidebar">
        <h2>Servidores</h2>
        <form onSubmit={createServer}>
          <input
            placeholder="nome do servidor"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <button type="submit">Criar</button>
        </form>
        <ul>
          <For each={servers()}>
            {(s) => (
              <li>
                <button type="button" class="secondary" onClick={() => setSelected(s)}>
                  {s.name}
                </button>
              </li>
            )}
          </For>
        </ul>
      </aside>
      <main class="main">
        <Show when={selected()} fallback={<p>Selecione ou crie um Servidor.</p>}>
          {(s) => (
            <>
              <h1>{s().name}</h1>
              <div class="row">
                <button type="button" onClick={() => createChannel("text")}>
                  Canal de texto
                </button>
                <button type="button" onClick={() => createChannel("voice_video")}>
                  Canal de vídeo
                </button>
                <button type="button" class="secondary" onClick={() => createInvite(false)}>
                  Convite (sem histórico)
                </button>
                <button type="button" class="secondary" onClick={() => createInvite(true)}>
                  Convite com histórico
                </button>
              </div>
              <h3>Canais</h3>
              <ul>
                <For each={channels()}>
                  {(ch) => (
                    <li>
                      <A href={`/channels/${ch.id}?server=${s().id}&type=${ch.type}`}>
                        {ch.name} ({ch.type})
                      </A>
                    </li>
                  )}
                </For>
              </ul>
              <Show when={(invites() ?? []).length > 0}>
                <h3>Convites</h3>
                <ul>
                  <For each={invites()}>
                    {(inv) => (
                      <li>
                        {location.origin}/invite/{inv.code}{" "}
                        {inv.include_history ? "(histórico)" : "(sem histórico)"}
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </>
          )}
        </Show>
        <p class="error">{error()}</p>
      </main>
    </div>
  );
}
