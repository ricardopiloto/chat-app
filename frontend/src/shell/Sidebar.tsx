import { For, Show, createEffect, createResource, createSignal, onCleanup } from "solid-js";
import { A, useNavigate, useParams } from "@solidjs/router";
import {
  ApiError,
  api,
  deleteChannel,
  deleteServer,
  type Account,
  type Channel,
  type CreateServerResult,
  type Invite,
  type Server,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { generateServerKey } from "../crypto/serverKey";
import {
  channelKeyDisplay,
  generateChannelKey,
  rememberChannelKey,
  sealChannelKeyForSelf,
} from "../crypto/channelKey";
import { publishOwnEnvelope } from "../crypto/keyHandoff";
import type { Identity } from "../crypto/identity";
import Dialog, { useCopiedFeedback } from "../components/Dialog";
import ContextMenu, { bindLongPress, type MenuState } from "./ContextMenu";
import ServerRail from "./ServerRail";

type Props = {
  me: Account;
  identity: Identity;
  selectedServerId: string | null;
  onSelectServer: (server: Server | null) => void;
  onWs?: (handler: (msg: WsEnvelope) => void) => () => void;
};

export default function Sidebar(props: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const [servers, { refetch }] = createResource(() => api<Server[]>("/api/servers"));
  const [createServerOpen, setCreateServerOpen] = createSignal(false);
  const [createChannelOpen, setCreateChannelOpen] = createSignal(false);
  const [inviteOpen, setInviteOpen] = createSignal(false);
  const [confirmDelete, setConfirmDelete] = createSignal<
    | { kind: "channel"; channel: Channel }
    | { kind: "server"; server: Server }
    | null
  >(null);
  const [serverName, setServerName] = createSignal("");
  const [serverPendingKey, setServerPendingKey] = createSignal<Uint8Array | null>(null);
  const [serverCustodyAck, setServerCustodyAck] = createSignal(false);
  const [channelName, setChannelName] = createSignal("");
  const [channelType, setChannelType] = createSignal<"text" | "voice_video">("text");
  const [pendingKey, setPendingKey] = createSignal<Uint8Array | null>(null);
  const [custodyAck, setCustodyAck] = createSignal(false);
  const [error, setError] = createSignal("");
  const [inviteUrl, setInviteUrl] = createSignal("");
  const [menu, setMenu] = createSignal<MenuState | null>(null);
  const copied = useCopiedFeedback();
  const keyCopied = useCopiedFeedback();
  const serverKeyCopied = useCopiedFeedback();

  const selected = () =>
    (servers() ?? []).find((s) => s.id === props.selectedServerId) ??
    (servers() ?? [])[0] ??
    null;

  const isOwner = () => selected()?.owner_account_id === props.me.id;

  createEffect(() => {
    const list = servers();
    if (!list?.length) return;
    if (!props.selectedServerId || !list.some((s) => s.id === props.selectedServerId)) {
      props.onSelectServer(list[0] ?? null);
    }
  });

  const [channels, { refetch: refetchChannels }] = createResource(
    () => selected()?.id,
    (id) => (id ? api<Channel[]>(`/api/servers/${id}/channels`) : Promise.resolve([] as Channel[])),
  );

  const textChannels = () => (channels() ?? []).filter((c) => c.type === "text");
  const voiceChannels = () => (channels() ?? []).filter((c) => c.type === "voice_video");
  const activeChannelId = () => params.id;

  createEffect(() => {
    if (!props.onWs) return;
    const off = props.onWs((msg) => {
      if (msg.event === "channel.deleted") {
        void refetchChannels();
        if (String(msg.payload.channel_id) === activeChannelId()) {
          navigate("/");
        }
      }
      if (msg.event === "server.deleted") {
        void refetch();
        if (String(msg.payload.server_id) === selected()?.id) {
          props.onSelectServer(null);
          navigate("/");
        }
      }
    });
    onCleanup(off);
  });

  function openCreateServer() {
    setServerName("");
    setServerPendingKey(generateChannelKey());
    setServerCustodyAck(false);
    setError("");
    setCreateServerOpen(true);
  }

  function openCreateChannel(type: "text" | "voice_video") {
    setChannelType(type);
    setChannelName("");
    setPendingKey(type === "voice_video" ? generateChannelKey() : null);
    setCustodyAck(false);
    setError("");
    setCreateChannelOpen(true);
  }

  createEffect(() => {
    if (!createChannelOpen()) return;
    if (channelType() === "voice_video" && !pendingKey()) {
      setPendingKey(generateChannelKey());
      setCustodyAck(false);
    }
    if (channelType() === "text") {
      setPendingKey(null);
      setCustodyAck(false);
    }
  });

  async function createServer(e: Event) {
    e.preventDefault();
    setError("");
    const key = serverPendingKey();
    if (!key || !serverCustodyAck()) {
      setError("Confirme que guardou a chave do canal de voz.");
      return;
    }
    try {
      const result = await api<CreateServerResult>("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          name: serverName().trim() || "Novo servidor",
          custody_ack: true,
          channel_key_sealed: sealChannelKeyForSelf(key, props.identity),
        }),
      });
      const server: Server = {
        id: result.id,
        name: result.name,
        owner_account_id: result.owner_account_id,
      };
      const serverKey = generateServerKey();
      await publishOwnEnvelope(server.id, props.me.id, props.identity, serverKey);

      let voiceId = result.channels?.find((c) => c.type === "voice_video")?.id;
      if (!voiceId) {
        const list = await api<Channel[]>(`/api/servers/${server.id}/channels`);
        voiceId = list.find((c) => c.type === "voice_video")?.id;
      }
      if (voiceId) rememberChannelKey(voiceId, key);

      setServerName("");
      setServerPendingKey(null);
      setServerCustodyAck(false);
      setCreateServerOpen(false);
      await refetch();
      props.onSelectServer(server);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function createChannel(e: Event) {
    e.preventDefault();
    const server = selected();
    if (!server) return;
    setError("");
    if (channelType() === "voice_video" && !custodyAck()) {
      setError("Confirme que guardou a chave do canal.");
      return;
    }
    try {
      const body: Record<string, unknown> = {
        name: channelName().trim() || (channelType() === "text" ? "geral" : "mesa"),
        type: channelType(),
      };
      const key = pendingKey();
      if (channelType() === "voice_video" && key) {
        body.custody_ack = true;
        body.channel_key_sealed = sealChannelKeyForSelf(key, props.identity);
      }
      const ch = await api<Channel>(`/api/servers/${server.id}/channels`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (key) rememberChannelKey(ch.id, key);
      setCreateChannelOpen(false);
      setChannelName("");
      setPendingKey(null);
      setCustodyAck(false);
      await refetchChannels();
      navigate(`/channels/${ch.id}?server=${server.id}&type=${ch.type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function createInvite(includeHistory: boolean) {
    const server = selected();
    if (!server) return;
    setError("");
    try {
      const inv = await api<Invite>(`/api/servers/${server.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ include_history: includeHistory }),
      });
      const url = `${location.origin}/invite/${inv.code}`;
      setInviteUrl(url);
      await copied.copy(url);
      setInviteOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function canDeleteChannel(c: Channel): boolean {
    const server = selected();
    if (!server) return false;
    return c.created_by_account_id === props.me.id || server.owner_account_id === props.me.id;
  }

  function openChannelMenu(c: Channel, e: { clientX: number; clientY: number }) {
    if (!canDeleteChannel(c)) return;
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Apagar canal",
          danger: true,
          onSelect: () => setConfirmDelete({ kind: "channel", channel: c }),
        },
      ],
    });
  }

  function openServerMenu(s: Server, e: { clientX: number; clientY: number }) {
    if (s.owner_account_id !== props.me.id) return;
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "Apagar servidor",
          danger: true,
          onSelect: () => setConfirmDelete({ kind: "server", server: s }),
        },
      ],
    });
  }

  async function confirmDeleteAction() {
    const target = confirmDelete();
    if (!target) return;
    setError("");
    try {
      if (target.kind === "channel") {
        await deleteChannel(target.channel.id);
        await refetchChannels();
        if (activeChannelId() === target.channel.id) navigate("/");
      } else {
        await deleteServer(target.server.id);
        await refetch();
        if (selected()?.id === target.server.id) {
          props.onSelectServer(null);
          navigate("/");
        }
      }
      setConfirmDelete(null);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "last_channel" ||
          err.code === "last_channel_of_type" ||
          err.status === 409)
      ) {
        setError(
          err.code === "last_channel_of_type" || err.message.includes("last")
            ? err.message || "Não pode apagar o último canal deste tipo."
            : "Não pode apagar o último canal do servidor.",
        );
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
      setConfirmDelete(null);
    }
  }

  return (
    <div class="shell-nav">
      <ServerRail
        servers={servers() ?? []}
        selectedId={selected()?.id ?? null}
        onSelect={(s) => props.onSelectServer(s)}
        onCreate={() => openCreateServer()}
        onContextMenu={(s, e) => openServerMenu(s, e)}
      />
      <aside class="sidebar">
        <div class="sidebar-header sidebar-header-static">
          <span class="sidebar-server-name">{selected()?.name ?? "Sem servidor"}</span>
        </div>

        <nav class="sidebar-nav">
          <Show when={selected()}>
            <div class="sidebar-section-row">
              <div class="sidebar-section">Texto</div>
              <Show when={isOwner()}>
                <button
                  type="button"
                  class="sidebar-section-plus"
                  aria-label="Criar canal de texto"
                  title="Criar canal de texto"
                  onClick={() => openCreateChannel("text")}
                >
                  +
                </button>
              </Show>
            </div>
            <For each={textChannels()}>
              {(c) => (
                <A
                  href={`/channels/${c.id}?server=${selected()!.id}&type=${c.type}`}
                  class={`channel-item${activeChannelId() === c.id ? " active" : ""}`}
                  onClick={() => window.dispatchEvent(new CustomEvent("mesa:close-drawer"))}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openChannelMenu(c, e);
                  }}
                  ref={(el) => {
                    if (!el || !canDeleteChannel(c)) return;
                    const unbind = bindLongPress(el, (x, y) =>
                      openChannelMenu(c, { clientX: x, clientY: y }),
                    );
                    onCleanup(unbind);
                  }}
                >
                  <span class="prefix">#</span>
                  <span>{c.name}</span>
                </A>
              )}
            </For>

            <div class="sidebar-section-row">
              <div class="sidebar-section">Voz e vídeo</div>
              <Show when={isOwner()}>
                <button
                  type="button"
                  class="sidebar-section-plus"
                  aria-label="Criar canal de voz e vídeo"
                  title="Criar canal de voz e vídeo"
                  onClick={() => openCreateChannel("voice_video")}
                >
                  +
                </button>
              </Show>
            </div>
            <For each={voiceChannels()}>
              {(c) => (
                <A
                  href={`/channels/${c.id}?server=${selected()!.id}&type=${c.type}`}
                  class={`channel-item${activeChannelId() === c.id ? " active" : ""}`}
                  onClick={() => window.dispatchEvent(new CustomEvent("mesa:close-drawer"))}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openChannelMenu(c, e);
                  }}
                  ref={(el) => {
                    if (!el || !canDeleteChannel(c)) return;
                    const unbind = bindLongPress(el, (x, y) =>
                      openChannelMenu(c, { clientX: x, clientY: y }),
                    );
                    onCleanup(unbind);
                  }}
                >
                  <span class="prefix">▸</span>
                  <span>{c.name}</span>
                </A>
              )}
            </For>
          </Show>

          <div class="sidebar-actions">
            <button
              type="button"
              class="btn btn-ghost"
              disabled={!selected()}
              onClick={() => void createInvite(false)}
            >
              Convite
            </button>
          </div>
          <p class="error" style={{ padding: "0 8px" }}>
            {error()}
          </p>
        </nav>

        <div class="sidebar-footer">self-hosted · sem federação</div>
      </aside>

      <ContextMenu menu={menu()} onClose={() => setMenu(null)} />

      <Dialog
        open={createServerOpen()}
        title="Criar servidor"
        onClose={() => setCreateServerOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setCreateServerOpen(false)}>
              Cancelar
            </button>
            <button
              type="submit"
              form="create-server-form"
              class="btn btn-primary"
              disabled={!serverCustodyAck()}
            >
              Criar
            </button>
          </>
        }
      >
        <form id="create-server-form" onSubmit={createServer}>
          <div class="field">
            <label for="server-name">Nome</label>
            <input
              id="server-name"
              class="input"
              value={serverName()}
              onInput={(e) => setServerName(e.currentTarget.value)}
              placeholder="Mesa do Porão"
            />
          </div>
          <Show when={serverPendingKey()}>
            {(key) => (
              <div class="custody-block">
                <p class="muted">
                  O servidor nasce com um canal de voz. Guarde a chave de mídia — sem ela não
                  consegue religar E2EE após gravar.
                </p>
                <div class="row" style={{ gap: "8px", "align-items": "center" }}>
                  <code class="key-display">{channelKeyDisplay(key())}</code>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => void serverKeyCopied.copy(channelKeyDisplay(key()))}
                  >
                    {serverKeyCopied.label() === "Copiar" ? "Copiar chave" : serverKeyCopied.label()}
                  </button>
                </div>
                <label class="check-line">
                  <input
                    type="checkbox"
                    checked={serverCustodyAck()}
                    onChange={(e) => setServerCustodyAck(e.currentTarget.checked)}
                  />
                  Salvei a chave deste canal num sítio seguro
                </label>
              </div>
            )}
          </Show>
        </form>
      </Dialog>

      <Dialog
        open={createChannelOpen()}
        title={channelType() === "text" ? "Criar canal de texto" : "Criar canal de voz e vídeo"}
        onClose={() => setCreateChannelOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setCreateChannelOpen(false)}>
              Cancelar
            </button>
            <button
              type="submit"
              form="create-channel-form"
              class="btn btn-primary"
              disabled={channelType() === "voice_video" && !custodyAck()}
            >
              Criar
            </button>
          </>
        }
      >
        <form id="create-channel-form" onSubmit={createChannel}>
          <div class="field">
            <label for="channel-name">Nome</label>
            <input
              id="channel-name"
              class="input"
              value={channelName()}
              onInput={(e) => setChannelName(e.currentTarget.value)}
              placeholder={channelType() === "text" ? "geral" : "mesa"}
            />
          </div>
          <Show when={channelType() === "voice_video" && pendingKey()}>
            {(key) => (
              <div class="custody-block">
                <p class="muted">
                  Guarde a chave de mídia deste canal. Sem ela não consegue religar E2EE após gravar.
                </p>
                <div class="row" style={{ gap: "8px", "align-items": "center" }}>
                  <code class="key-display">{channelKeyDisplay(key())}</code>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => void keyCopied.copy(channelKeyDisplay(key()))}
                  >
                    {keyCopied.label() === "Copiar" ? "Copiar chave" : keyCopied.label()}
                  </button>
                </div>
                <label class="check-line">
                  <input
                    type="checkbox"
                    checked={custodyAck()}
                    onChange={(e) => setCustodyAck(e.currentTarget.checked)}
                  />
                  Salvei a chave deste canal num sítio seguro
                </label>
              </div>
            )}
          </Show>
        </form>
      </Dialog>

      <Dialog
        open={inviteOpen()}
        title="Convite"
        onClose={() => setInviteOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setInviteOpen(false)}>
              Fechar
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void copied.copy(inviteUrl())}>
              {copied.label()}
            </button>
          </>
        }
      >
        <p class="muted">Ligação copiada para a área de transferência quando possível.</p>
        <input class="input" readonly value={inviteUrl()} />
      </Dialog>

      <Dialog
        open={!!confirmDelete()}
        title={confirmDelete()?.kind === "server" ? "Apagar servidor?" : "Apagar canal?"}
        onClose={() => setConfirmDelete(null)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void confirmDeleteAction()}>
              Apagar
            </button>
          </>
        }
      >
        <p>
          {confirmDelete()?.kind === "server"
            ? "Isto remove o servidor, canais e histórico. Não há recuperação."
            : "Isto remove o canal e o histórico. Quem estiver em chamada será desligado."}
        </p>
      </Dialog>
    </div>
  );
}
