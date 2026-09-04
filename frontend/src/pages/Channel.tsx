import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import {
  ALLOWED_MEDIA_TYPES,
  ApiError,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  api,
  uploadAttachment,
  type Account,
  type Channel,
  type Message,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import {
  decryptMessage,
  encryptBytes,
  encryptMessage,
  getServerKey,
} from "../crypto/serverKey";
import LinkPreviews from "../components/LinkPreviews";
import MessageAttachments from "../components/MessageAttachments";
import { toggleMembersPanel } from "../shell/AppShell";

type Props = {
  me: Account;
  channel: Channel;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
};

type Row = {
  id: string;
  text: string;
  sender: string;
  createdAt?: string;
  attachmentIds: string[];
};

type Pending = {
  localId: string;
  file: File;
  previewUrl: string;
};

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
  const [sending, setSending] = createSignal(false);
  const [handles, setHandles] = createSignal<Record<string, string>>({});
  const [membersOpen, setMembersOpen] = createSignal(false);
  const [pendingFiles, setPendingFiles] = createSignal<Pending[]>([]);
  const [serverKey, setServerKey] = createSignal<Uint8Array | undefined>();
  let fileInput: HTMLInputElement | undefined;

  createEffect(() => {
    const handler = (e: Event) => {
      const open = (e as CustomEvent<{ open?: boolean }>).detail?.open;
      if (typeof open === "boolean") setMembersOpen(open);
    };
    window.addEventListener("mesa:members-panel-state", handler);
    onCleanup(() => window.removeEventListener("mesa:members-panel-state", handler));
  });

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
          setServerKey(undefined);
          setError("Sincronizando chave do Servidor…");
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        setServerKey(key);
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
              attachmentIds: row.attachment_ids ?? [],
            });
          } catch {
            decoded.push({
              id: row.id,
              sender: row.sender_account_id,
              text: "[indeterminável]",
              createdAt: row.created_at,
              attachmentIds: row.attachment_ids ?? [],
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
        const attachmentIds = Array.isArray(msg.payload.attachment_ids)
          ? (msg.payload.attachment_ids as unknown[]).map(String)
          : [];
        setMessages((prev) => [
          ...prev,
          {
            id: String(msg.payload.id),
            sender: String(msg.payload.sender_account_id),
            text,
            attachmentIds,
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

  onCleanup(() => {
    for (const p of pendingFiles()) URL.revokeObjectURL(p.previewUrl);
  });

  function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const next = [...pendingFiles()];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        setError(`Máximo de ${MAX_ATTACHMENTS_PER_MESSAGE} anexos por mensagem.`);
        break;
      }
      if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
        setError("Só JPEG, PNG, WebP ou GIF.");
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError("Cada anexo pode ter no máximo 8 MiB.");
        continue;
      }
      next.push({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setPendingFiles(next);
    if (fileInput) fileInput.value = "";
  }

  function removePending(localId: string) {
    setPendingFiles((prev) => {
      const victim = prev.find((p) => p.localId === localId);
      if (victim) URL.revokeObjectURL(victim.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }

  async function send(e: Event) {
    e.preventDefault();
    if (sending()) return;
    const key = await ensureServerKey(props.channel.server_id, props.identity, props.me.id);
    if (!key) {
      setError("Ainda sincronizando a chave.");
      return;
    }
    const text = draft().trim();
    const files = pendingFiles();
    if (!text && files.length === 0) return;

    setSending(true);
    setError("");
    try {
      const attachment_ids: string[] = [];
      for (const p of files) {
        const buf = new Uint8Array(await p.file.arrayBuffer());
        const cipher = await encryptBytes(key, buf);
        const meta = await uploadAttachment(props.channel.id, cipher, p.file.type);
        attachment_ids.push(meta.id);
      }
      const content_ciphertext = await encryptMessage(key, text);
      await api(`/api/channels/${props.channel.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content_ciphertext, attachment_ids }),
      });
      setDraft("");
      for (const p of files) URL.revokeObjectURL(p.previewUrl);
      setPendingFiles([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  const groups = () => groupMessages(messages());

  return (
    <div class="pane">
      <header class="pane-header">
        <div>
          <div class="pane-title"># {props.channel.name}</div>
          <div class="pane-sub">Canal de texto · visível a todo o servidor</div>
        </div>
        <button
          type="button"
          class="btn btn-ghost"
          style={{ "margin-left": "auto" }}
          disabled={!props.channel.server_id}
          aria-expanded={membersOpen()}
          aria-label="Membros"
          onClick={() => toggleMembersPanel()}
        >
          Membros
        </button>
        <span class="e2ee-chip">E2EE activa</span>
      </header>
      <div class="text-scroll">
        <div class="text-measure">
          <For each={groups()}>
            {(g) => (
              <div class="msg-group">
                <div class="msg-avatar">{initials(handles()[g.sender] ?? g.sender)}</div>
                <div class="msg-content">
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
                  <For each={g.items}>
                    {(m) => (
                      <div class="msg-block">
                        <Show when={m.text}>
                          <p class="msg-body">{m.text}</p>
                        </Show>
                        <Show when={m.attachmentIds.length > 0}>
                          <MessageAttachments
                            attachmentIds={m.attachmentIds}
                            serverKey={serverKey()}
                          />
                        </Show>
                        <Show when={m.text}>
                          <LinkPreviews text={m.text} />
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
      <Show when={pendingFiles().length > 0}>
        <div class="composer-pending">
          <For each={pendingFiles()}>
            {(p) => (
              <div class="composer-pending-item">
                <img src={p.previewUrl} alt={p.file.name} />
                <button
                  type="button"
                  class="btn btn-ghost"
                  aria-label={`Remover ${p.file.name}`}
                  onClick={() => removePending(p.localId)}
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
      <form class="composer" onSubmit={(e) => void send(e)}>
        <input
          ref={(el) => (fileInput = el)}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => onPickFiles(e.currentTarget.files)}
        />
        <button
          type="button"
          class="btn btn-ghost"
          disabled={pending() || pendingFiles().length >= MAX_ATTACHMENTS_PER_MESSAGE}
          aria-label="Anexar imagem"
          onClick={() => fileInput?.click()}
        >
          +
        </button>
        <input
          class="input"
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          placeholder="Escrever mensagem…"
        />
        <button
          type="submit"
          class="btn btn-primary"
          disabled={pending() || sending() || (!draft().trim() && pendingFiles().length === 0)}
        >
          Enviar
        </button>
      </form>
      <p class="error" style={{ padding: "0 24px 8px" }}>
        {error()}
      </p>
    </div>
  );
}
