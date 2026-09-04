import { For, createEffect, createSignal, onCleanup } from "solid-js";
import { api, type Channel, type Message } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { loadServerKey } from "../crypto/keyHandoff";
import { decryptMessage, encryptMessage, getServerKey } from "../crypto/serverKey";

type Props = {
  channel: Channel;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
};

export default function ChannelPage(props: Props) {
  const [messages, setMessages] = createSignal<{ id: string; text: string; sender: string }[]>([]);
  const [draft, setDraft] = createSignal("");
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(true);

  createEffect(() => {
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    const identity = props.identity;
    let cancelled = false;

    async function load() {
      while (!cancelled) {
        const key = await loadServerKey(serverId, identity);
        if (cancelled) return;
        if (!key) {
          setPending(true);
          setError("Sincronizando chave do Servidor…");
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        setPending(false);
        setError("");
        const rows = await api<Message[]>(`/api/channels/${channelId}/messages`);
        if (cancelled) return;
        const decoded = [];
        for (const row of rows) {
          try {
            decoded.push({
              id: row.id,
              sender: row.sender_account_id,
              text: await decryptMessage(key, row.content_ciphertext),
            });
          } catch {
            decoded.push({ id: row.id, sender: row.sender_account_id, text: "[indeterminável]" });
          }
        }
        setMessages(decoded);
        return;
      }
    }

    void load();
    const off = props.onWs(async (msg) => {
      if (msg.event === "key_handoff.completed" && msg.server_id === serverId) {
        void load();
        return;
      }
      if (msg.event !== "message.new") return;
      if (String(msg.payload.channel_id) !== channelId) return;
      const key = getServerKey(serverId);
      if (!key) return;
      try {
        const text = await decryptMessage(key, String(msg.payload.content_ciphertext));
        setMessages((prev) => [
          ...prev,
          {
            id: String(msg.payload.id),
            sender: String(msg.payload.sender_account_id),
            text,
          },
        ]);
      } catch {
        /* ignore */
      }
    });
    onCleanup(() => {
      cancelled = true;
      off();
    });
  });

  async function send(e: Event) {
    e.preventDefault();
    const key = await loadServerKey(props.channel.server_id, props.identity);
    if (!key) {
      setError("Ainda sincronizando a chave.");
      return;
    }
    const content_ciphertext = await encryptMessage(key, draft());
    await api(`/api/channels/${props.channel.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content_ciphertext }),
    });
    setDraft("");
  }

  return (
    <main class="main">
      <h1>Canal de texto</h1>
      <For each={messages()}>
        {(m) => (
          <p class="msg">
            <span class="muted">{m.sender.slice(0, 8)}</span> {m.text}
          </p>
        )}
      </For>
      <form class="composer" onSubmit={send}>
        <input
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          placeholder="mensagem"
        />
        <button type="submit" disabled={pending()}>
          Enviar
        </button>
      </form>
      <p class="error">{error()}</p>
    </main>
  );
}
