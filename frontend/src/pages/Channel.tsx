import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import {
  ALLOWED_MEDIA_TYPES,
  ApiError,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  api,
  canDeleteMessage,
  deleteMessage,
  uploadAttachment,
  type Account,
  type Channel,
  type Message,
  type Server,
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
import { IconLockClosed } from "../components/icons/IconLock";
import IconTrash from "../components/icons/IconTrash";
import IconUsers from "../components/icons/IconUsers";
import {
  clipboardFilesFromPaste,
  preparePastedImage,
} from "../media/pasteWebp";
import { toggleMembersPanel } from "../shell/AppShell";
import { showToast } from "../ui/toast";

const HIGHLIGHT_MS = 3000;
const SEEK_MAX_PAGES = 5;

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

async function decodeRows(key: Uint8Array, rows: Message[]): Promise<Row[]> {
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
  return decoded;
}

function mergeOlderRows(older: Row[], current: Row[]): Row[] {
  const seen = new Set(current.map((m) => m.id));
  const extra = older.filter((m) => !seen.has(m.id));
  return extra.length === 0 ? current : [...extra, ...current];
}

function queryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function messageEl(id: string): HTMLElement | null {
  const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id;
  return document.querySelector(`[data-message-id="${escaped}"]`);
}

function waitForMessageEl(id: string, frames = 10): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const tick = (left: number) => {
      const el = messageEl(id);
      if (el) {
        resolve(el);
        return;
      }
      if (left <= 0) {
        resolve(null);
        return;
      }
      requestAnimationFrame(() => tick(left - 1));
    };
    tick(frames);
  });
}

export default function ChannelPage(props: Props) {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = createSignal<Row[]>([]);
  const [draft, setDraft] = createSignal("");
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(true);
  const [sending, setSending] = createSignal(false);
  const [handles, setHandles] = createSignal<Record<string, string>>({});
  const [membersOpen, setMembersOpen] = createSignal(false);
  const [pendingFiles, setPendingFiles] = createSignal<Pending[]>([]);
  const [serverKey, setServerKey] = createSignal<Uint8Array | undefined>();
  const [serverOwnerId, setServerOwnerId] = createSignal("");
  const [historyEpoch, setHistoryEpoch] = createSignal(0);
  let fileInput: HTMLInputElement | undefined;
  let pasteCleanup: (() => void) | undefined;
  let jumpGen = 0;
  let prevJumpKey = "";
  let lastJumped: { channelId: string; messageId: string } | null = null;
  let highlightedEl: HTMLElement | undefined;
  let highlightTimer: number | undefined;

  function clearHighlightTimer() {
    if (highlightTimer !== undefined) {
      window.clearTimeout(highlightTimer);
      highlightTimer = undefined;
    }
  }

  function applyHighlight(el: HTMLElement) {
    const group = el.closest(".msg-group");
    highlightedEl?.classList.remove("msg-highlight");
    clearHighlightTimer();
    if (!(group instanceof HTMLElement)) return;
    highlightedEl = group;
    group.classList.add("msg-highlight");
    highlightTimer = window.setTimeout(() => {
      group.classList.remove("msg-highlight");
      if (highlightedEl === group) highlightedEl = undefined;
      highlightTimer = undefined;
    }, HIGHLIGHT_MS);
  }

  async function focusMessage(id: string, gen: number): Promise<boolean> {
    const el = await waitForMessageEl(id);
    if (gen !== jumpGen) return false;
    if (!el) return false;
    el.scrollIntoView({ block: "center", inline: "nearest" });
    applyHighlight(el);
    return true;
  }

  function tryPushPending(next: Pending[], file: File): string | null {
    if (next.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
      return `Máximo de ${MAX_ATTACHMENTS_PER_MESSAGE} anexos por mensagem.`;
    }
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
      return "Só JPEG, PNG, WebP ou GIF.";
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return "Cada anexo pode ter no máximo 5 MiB.";
    }
    next.push({
      localId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    });
    return null;
  }

  function bindPasteTarget(el: HTMLDivElement) {
    pasteCleanup?.();
    const onPaste = (e: ClipboardEvent) => {
      void handlePaste(e);
    };
    el.addEventListener("paste", onPaste);
    pasteCleanup = () => el.removeEventListener("paste", onPaste);
  }

  onCleanup(() => {
    pasteCleanup?.();
    jumpGen += 1;
    clearHighlightTimer();
    highlightedEl?.classList.remove("msg-highlight");
  });

  async function handlePaste(e: ClipboardEvent) {
    const { images, text } = clipboardFilesFromPaste(e.clipboardData);
    if (images.length === 0) return;

    e.preventDefault();
    setError("");
    const next = [...pendingFiles()];
    let lastErr = "";
    for (const raw of images) {
      try {
        const file = await preparePastedImage(raw);
        const err = tryPushPending(next, file);
        if (err) {
          lastErr = err;
          if (err.startsWith("Máximo")) break;
          continue;
        }
      } catch (err) {
        lastErr =
          err instanceof Error ? err.message : "Falha ao preparar imagem colada.";
      }
    }
    setPendingFiles(next);
    if (text) {
      setDraft((d) => (d ? `${d}${text}` : text));
    }
    if (lastErr) setError(lastErr);
  }

  createEffect(() => {
    const serverId = props.channel.server_id;
    let cancelled = false;
    void (async () => {
      try {
        const servers = await api<Server[]>("/api/servers");
        if (cancelled) return;
        const s = servers.find((x) => x.id === serverId);
        setServerOwnerId(s?.owner_account_id ?? "");
      } catch {
        if (!cancelled) setServerOwnerId("");
      }
    })();
    onCleanup(() => {
      cancelled = true;
    });
  });

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
    setHistoryEpoch(0);

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
        const decoded = await decodeRows(key, rows);
        if (cancelled) return;
        setMessages(decoded);
        setHistoryEpoch((n) => n + 1);
        return;
      }
    }

    void load();
    const off = props.onWs(async (msg) => {
      if (msg.event === "key_handoff.completed" && msg.server_id === serverId) {
        void load();
        return;
      }
      if (msg.event === "message.deleted") {
        if (String(msg.payload.channel_id) !== channelId) return;
        const id = String(msg.payload.id);
        setMessages((prev) => prev.filter((m) => m.id !== id));
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

  createEffect(() => {
    const messageId = queryParam(searchParams.message);
    const channelId = props.channel.id;
    const ready = historyEpoch() > 0;
    const key = `${channelId}::${messageId}`;
    if (key !== prevJumpKey) {
      jumpGen += 1;
      prevJumpKey = key;
    }
    if (!messageId || !ready) return;
    if (lastJumped?.channelId === channelId && lastJumped.messageId === messageId) {
      return;
    }
    const gen = jumpGen;
    lastJumped = { channelId, messageId };

    void (async () => {
      const found = () => messages().some((m) => m.id === messageId);
      if (found()) {
        const ok = await focusMessage(messageId, gen);
        if (gen !== jumpGen) return;
        if (!ok) showToast("Mensagem não encontrada");
        return;
      }

      const key = serverKey();
      if (!key) {
        if (gen === jumpGen) showToast("Mensagem não encontrada");
        return;
      }

      for (let i = 0; i < SEEK_MAX_PAGES; i++) {
        if (gen !== jumpGen) return;
        const oldest = messages()[0]?.createdAt;
        if (!oldest) break;
        try {
          const rows = await api<Message[]>(
            `/api/channels/${channelId}/messages?before=${encodeURIComponent(oldest)}`,
          );
          if (gen !== jumpGen) return;
          if (rows.length === 0) break;
          const decoded = await decodeRows(key, rows);
          if (gen !== jumpGen) return;
          setMessages((prev) => mergeOlderRows(decoded, prev));
          if (found()) {
            const ok = await focusMessage(messageId, gen);
            if (gen !== jumpGen) return;
            if (!ok) showToast("Mensagem não encontrada");
            return;
          }
        } catch {
          break;
        }
      }

      if (gen !== jumpGen) return;
      showToast("Mensagem não encontrada");
    })();
  });

  onCleanup(() => {
    for (const p of pendingFiles()) URL.revokeObjectURL(p.previewUrl);
  });

  function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const next = [...pendingFiles()];
    let lastErr = "";
    for (const file of Array.from(list)) {
      const err = tryPushPending(next, file);
      if (err) {
        lastErr = err;
        if (err.startsWith("Máximo")) break;
        continue;
      }
    }
    setPendingFiles(next);
    if (lastErr) setError(lastErr);
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

  async function requestDelete(messageId: string) {
    if (!window.confirm("Apagar esta mensagem? Esta acção não pode ser anulada.")) {
      return;
    }
    setError("");
    try {
      await deleteMessage(props.channel.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return;
      }
      setError(err instanceof ApiError ? err.message : String(err));
    }
  }

  const groups = () => groupMessages(messages());

  return (
    <div class="pane" ref={(el) => bindPasteTarget(el)}>
      <header class="pane-header">
        <div>
          <div class="pane-title"># {props.channel.name}</div>
          <div class="pane-sub">Canal de texto · visível a todo o servidor</div>
        </div>
        <button
          type="button"
          class="pane-icon-btn"
          style={{ "margin-left": "auto" }}
          disabled={!props.channel.server_id}
          aria-expanded={membersOpen()}
          aria-label="Membros"
          title="Membros"
          onClick={() => toggleMembersPanel()}
        >
          <IconUsers size={20} />
        </button>
        <span class="e2ee-chip">
          <IconLockClosed size={16} />
          E2EE activa
        </span>
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
                      <div class="msg-block" tabindex={0} data-message-id={m.id}>
                        <Show
                          when={canDeleteMessage(
                            props.me.id,
                            m.sender,
                            props.channel.created_by_account_id,
                            serverOwnerId(),
                          )}
                        >
                          <button
                            type="button"
                            class="btn msg-delete"
                            title="Apagar"
                            aria-label="Apagar mensagem"
                            onClick={() => void requestDelete(m.id)}
                          >
                            <IconTrash />
                          </button>
                        </Show>
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
