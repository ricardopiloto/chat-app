import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { api, type Account, type Channel, type Message } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import { decryptMessage, encryptMessage, getServerKey } from "../crypto/serverKey";

type Props = {
  me: Account;
  channel: Channel;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
};

type Row = { id: string; text: string; sender: string; createdAt?: string };

function initials(id: string): string {
  return id.slice(0, 2).toUpperCase();
}

function groupMessages(rows: Row[]): { sender: string; items: Row[] }[] {
  const groups: { sender: string; items: Row[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.sender === row.sender) last.items.push(row);
    else groups.push({ sender: row.sender, items: [row] });
  }
  return groups;
}

export default function ChannelPage(props: Props) {
  const [messages, setMessages] = createSignal<Row[]>([]);
  const [draft, setDraft] = createSignal("");
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(true);
  const [handles, setHandles] = createSignal<Record<string, string>>({});

  createEffect(() => {
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    const identity = props.identity;
    const accountId = props.me.id;
    let cancelled = false;

    async function load() {
      while (!cancelled) {
        const key = await ensureServerKey(serverId, identity, accountId);
        if (cancelled) return;
        if (!key) {
          setPending(true);
          setError("Sincronizando chave do Servidor…");
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        setPending(false);
        setError("");
        try {
          const members = await api<{ account_id: string; handle: string }[]>(
            `/api/servers/${serverId}/members`,
          );
          const map: Record<string, string> = { [props.me.id]: props.me.handle };
          for (const m of members) map[m.account_id] = m.handle;
          setHandles(map);
        } catch {
          setHandles({ [props.me.id]: props.me.handle });
        }
        const rows = await api<Message[]>(`/api/channels/${channelId}/messages`);
        if (cancelled) return;
        const decoded: Row[] = [];
        for (const row of rows) {
          try {
            decoded.push({
              id: row.id,
              sender: row.sender_account_id,
              text: await decryptMessage(key, row.content_ciphertext),
              createdAt: row.created_at,
            });
          } catch {
            decoded.push({
              id: row.id,
              sender: row.sender_account_id,
              text: "[indeterminável]",
              createdAt: row.created_at,
            });
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
    const key = await ensureServerKey(props.channel.server_id, props.identity, props.me.id);
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

  const groups = () => groupMessages(messages());

  return (
    <div class="pane">
      <header class="pane-header">
        <div>
          <div class="pane-title"># {props.channel.name}</div>
          <div class="pane-sub">Canal de texto · visível a todo o servidor</div>
        </div>
        <span class="e2ee-chip">E2EE activa</span>
      </header>
      <div class="text-scroll">
        <div class="text-measure">
          <For each={groups()}>
            {(g) => (
              <div class="msg-group">
                <div class="msg-avatar">{initials(handles()[g.sender] ?? g.sender)}</div>
                <div>
                  <div class="msg-meta">
                    {handles()[g.sender] ?? g.sender.slice(0, 8)}
                    <Show when={g.items[0]?.createdAt}>
                      {(t) => (
                        <span class="msg-time">
                          {new Date(t()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </Show>
                  </div>
                  <For each={g.items}>{(m) => <p class="msg-body">{m.text}</p>}</For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
      <form class="composer" onSubmit={send}>
        <input
          class="input"
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          placeholder="Escrever mensagem…"
        />
        <button type="submit" class="btn btn-primary" disabled={pending()}>
          Enviar
        </button>
      </form>
      <p class="error" style={{ padding: "0 24px 8px" }}>
        {error()}
      </p>
    </div>
  );
}
