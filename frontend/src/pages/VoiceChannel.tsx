import { For, Show, createEffect, createResource, createSignal, onCleanup } from "solid-js";
import CameraGrid from "../components/CameraGrid";
import GridAdmin from "../components/GridAdmin";
import { api, type Account, type Channel, type GridLayout, type Message } from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { loadServerKey } from "../crypto/keyHandoff";
import { decryptMessage, encryptMessage } from "../crypto/serverKey";
import { attachRemote, createTestVideoTrack, joinLiveRoom, type LiveSession } from "../video/liveClient";
import type { RemoteTrack, Participant } from "livekit-client";

type Props = {
  me: Account;
  channel: Channel;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
};

export default function VoiceChannel(props: Props) {
  const [grid, setGrid] = createSignal<GridLayout | null>({
    slot_count: 4,
    assigned_by: "auto",
    slots: [0, 1, 2, 3].map((index) => ({ index, account_id: null })),
  });
  const [error, setError] = createSignal("");
  const [draft, setDraft] = createSignal("");
  const [texts, setTexts] = createSignal<{ id: string; text: string }[]>([]);
  const [live, setLive] = createSignal(false);
  const [needGesture, setNeedGesture] = createSignal(false);
  const slotEls = new Map<number, HTMLDivElement>();
  const remotes = new Map<string, RemoteTrack[]>();
  let localVideoEl: HTMLMediaElement | null = null;
  let session: LiveSession | null = null;
  let starting = false;

  const [servers] = createResource(() => api<{ id: string; owner_account_id: string }[]>("/api/servers"));

  function attachSlot(index: number, el: HTMLDivElement) {
    slotEls.set(index, el);
    queueMicrotask(layoutMedia);
  }

  function layoutMedia() {
    const current = grid();
    if (!current) return;
    for (const [identity, tracks] of remotes) {
      const idx = current.slots.find((s) => s.account_id === identity)?.index;
      if (idx === undefined) continue;
      const node = slotEls.get(idx);
      if (!node) continue;
      for (const track of tracks) attachRemote(track, node);
    }
    if (localVideoEl) {
      const mine = current.slots.find((s) => s.account_id === props.me.id)?.index ?? 0;
      const node = slotEls.get(mine);
      if (node && localVideoEl.parentElement !== node) node.appendChild(localVideoEl);
    }
  }

  function placeTrack(track: RemoteTrack, participant: Participant) {
    const list = remotes.get(participant.identity) ?? [];
    if (!list.includes(track)) list.push(track);
    remotes.set(participant.identity, list);
    layoutMedia();
  }

  async function loadTexts(key: Uint8Array) {
    const rows = await api<Message[]>(`/api/channels/${props.channel.id}/messages`);
    const decoded = [];
    for (const row of rows) {
      try {
        decoded.push({ id: row.id, text: await decryptMessage(key, row.content_ciphertext) });
      } catch {
        decoded.push({ id: row.id, text: "[indeterminável]" });
      }
    }
    setTexts(decoded);
  }

  async function captureLocal(
    mode: "camera" | "test",
  ): Promise<{ video: MediaStreamTrack; audio?: MediaStreamTrack }> {
    if (mode === "test") {
      let audio: MediaStreamTrack | undefined;
      try {
        audio = (await navigator.mediaDevices.getUserMedia({ audio: true, video: false })).getAudioTracks()[0];
      } catch {
        /* vídeo de teste pode ir sem microfone */
      }
      return { video: createTestVideoTrack(props.me.handle), audio };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return {
      video: stream.getVideoTracks()[0],
      audio: stream.getAudioTracks()[0],
    };
  }

  async function connect(mode: "camera" | "test") {
    if (starting || session) return;
    starting = true;
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    try {
      const key = await loadServerKey(serverId, props.identity);
      if (!key) {
        setError("Sincronizando chave do Servidor…");
        return;
      }
      setError(mode === "test" ? "A ligar com vídeo de teste…" : "A pedir câmara e microfone…");
      let local: { video: MediaStreamTrack; audio?: MediaStreamTrack };
      try {
        local = await captureLocal(mode);
        setNeedGesture(false);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setNeedGesture(true);
          setError("O navegador precisa de um clique para libertar câmara e microfone.");
          return;
        }
        if (name === "NotReadableError" || name === "AbortError") {
          setError("A webcam está ocupada. Use «Vídeo de teste» nesta conta.");
          return;
        }
        throw err;
      }
      setError("");
      const join = await api<{ token: string; url: string; room: string }>(
        `/api/channels/${channelId}/voice/join`,
        { method: "POST" },
      );
      const layout = await api<GridLayout>(`/api/channels/${channelId}/grid`);
      setGrid(layout);
      session = await joinLiveRoom({
        url: join.url,
        token: join.token,
        serverKey: key,
        localVideo: local.video,
        localAudio: local.audio,
        onTrack: placeTrack,
        onDisconnected: (reason) => {
          session = null;
          setLive(false);
          setError(`Ligação encerrada${reason != null ? ` (${String(reason)})` : ""}.`);
        },
        onLocalTrack: (el) => {
          localVideoEl = el;
          if (el instanceof HTMLVideoElement) {
            el.muted = true;
            el.autoplay = true;
            el.playsInline = true;
          }
          layoutMedia();
        },
      });
      setLive(true);
      await loadTexts(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      starting = false;
    }
  }

  createEffect(() => {
    grid();
    queueMicrotask(layoutMedia);
  });

  createEffect(() => {
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    const identity = props.identity;
    let cancelled = false;

    async function loadKeyAndTexts() {
      while (!cancelled) {
        const key = await loadServerKey(serverId, identity);
        if (cancelled) return;
        if (!key) {
          setError("Sincronizando chave do Servidor…");
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        if (!session) setError("");
        const layout = await api<GridLayout>(`/api/channels/${channelId}/grid`);
        if (cancelled) return;
        setGrid(layout);
        await loadTexts(key);
        return;
      }
    }
    void loadKeyAndTexts();

    const off = props.onWs((msg) => {
      if (msg.event === "grid.updated" && String(msg.payload.channel_id) === channelId) {
        setGrid(msg.payload.grid as GridLayout);
        queueMicrotask(layoutMedia);
      }
      if (msg.event === "key_handoff.completed" && msg.server_id === serverId) {
        void loadKeyAndTexts();
      }
    });
    onCleanup(() => {
      cancelled = true;
      off();
    });
  });

  createEffect(() => {
    void props.channel.id;
    onCleanup(() => {
      void session?.disconnect();
      session = null;
      localVideoEl = null;
      remotes.clear();
      setLive(false);
    });
  });

  async function send(e: Event) {
    e.preventDefault();
    const key = await loadServerKey(props.channel.server_id, props.identity);
    if (!key) return;
    await api(`/api/channels/${props.channel.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content_ciphertext: await encryptMessage(key, draft()) }),
    });
    setDraft("");
  }

  const admin = () =>
    (servers() ?? []).some(
      (s) => s.id === props.channel.server_id && s.owner_account_id === props.me.id,
    );

  return (
    <main class="main">
      <h1>Canal de vídeo</h1>
      <Show when={!live()}>
        <p class="row">
          <button type="button" onClick={() => void connect("camera")}>
            {needGesture() ? "Permitir câmara e microfone" : "Ligar câmara e microfone"}
          </button>
          <button type="button" class="secondary" onClick={() => void connect("test")}>
            Vídeo de teste (sem webcam)
          </button>
        </p>
        <p class="muted">
          No telemóvel abra <code>https://&lt;IP-LAN&gt;:1420</code> (aceite o certificado) e
          entre com <strong>outra conta</strong> (convite). A mídia UDP do LiveKit tem de
          chegar à LAN — recrie o contentor depois da alteração de rede em <code>infra/</code>.
        </p>
      </Show>
      <Show when={grid()}>
        {(g) => (
          <>
            <CameraGrid grid={g()} handles={{ [props.me.id]: props.me.handle }} attachSlot={attachSlot} />
            <Show when={admin()}>
              <GridAdmin
                channelId={props.channel.id}
                grid={g()}
                memberIds={g()
                  .slots.map((s) => s.account_id)
                  .filter((id): id is string => !!id)}
                handles={{ [props.me.id]: props.me.handle }}
                onSaved={setGrid}
              />
            </Show>
          </>
        )}
      </Show>
      <For each={texts()}>{(m) => <p class="msg">{m.text}</p>}</For>
      <form class="composer" onSubmit={send}>
        <input value={draft()} onInput={(e) => setDraft(e.currentTarget.value)} />
        <button type="submit">Enviar</button>
      </form>
      <p class="error">{error()}</p>
    </main>
  );
}
