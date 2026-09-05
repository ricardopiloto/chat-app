import { Show, createEffect, createResource, createSignal, onCleanup } from "solid-js";
import CallBank, { deriveBank } from "../components/CallBank";
import CameraGrid from "../components/CameraGrid";
import SceneEditor from "../components/SceneEditor";
import Dialog from "../components/Dialog";
import CameraBlurMenu from "../components/CameraBlurMenu";
import { IconCameraOff, IconCameraOn } from "../components/icons/IconCamera";
import { IconChevronDown, IconChevronDownBlur } from "../components/icons/IconChevron";
import { IconLockClosed, IconLockWarning } from "../components/icons/IconLock";
import { IconMicOff, IconMicOn } from "../components/icons/IconMic";
import IconPhoneHangup from "../components/icons/IconPhoneHangup";
import IconUsers from "../components/icons/IconUsers";
import {
  ApiError,
  api,
  startEgress,
  stopEgress,
  setChannelE2ee,
  type Account,
  type Channel,
  type GridLayout,
  type Scene,
  type SceneList as SceneListData,
  type ServerMember,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import type { Identity } from "../crypto/identity";
import { ensureServerKey } from "../crypto/keyHandoff";
import {
  loadChannelKey,
  parseChannelKeyInput,
  rememberChannelKey,
} from "../crypto/channelKey";
import { readViewMode, writeViewMode, type ViewMode } from "../preferences/uiPrefs";
import { readBlurMode, writeBlurMode, type CameraBlurMode } from "../blur/blurPreference";
import { requestStageMode, toggleMembersPanel, toggleStageMode } from "../shell/AppShell";
import { attachRemote, createTestVideoTrack, joinLiveRoom, type LiveSession } from "../video/liveClient";
import {
  applyBlurMode,
  waitUntilBlurred,
  stopBlurProcessor,
  supportsCameraBlur,
  BLUR_UNAVAILABLE,
  BLUR_FAILED,
} from "../video/backgroundBlur";
import { LocalVideoTrack, Track, type RemoteTrack, type Participant } from "livekit-client";
import { useNavigate } from "@solidjs/router";

type Props = {
  me: Account;
  channel: Channel;
  identity: Identity;
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
};

const emptyGrid = (): GridLayout => ({
  layout_key: "quad",
  slot_count: 4,
  assigned_by: "auto",
  slots: [0, 1, 2, 3].map((index) => ({ index, account_id: null })),
});

export default function VoiceChannel(props: Props) {
  const navigate = useNavigate();
  const [grid, setGrid] = createSignal<GridLayout | null>(emptyGrid());
  const [error, setError] = createSignal("");
  const [live, setLive] = createSignal(false);
  const [needGesture, setNeedGesture] = createSignal(false);
  const [scenes, setScenes] = createSignal<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = createSignal("");
  const [members, setMembers] = createSignal<ServerMember[]>([]);
  const [viewMode, setViewMode] = createSignal<ViewMode>(readViewMode());
  const [editing, setEditing] = createSignal(false);
  const [micOn, setMicOn] = createSignal(true);
  const [camOn, setCamOn] = createSignal(true);
  const [inCallIds, setInCallIds] = createSignal<string[]>([]);
  const [e2eeEnabled, setE2eeEnabled] = createSignal(props.channel.e2ee_enabled !== false);
  const [hasChannelKey, setHasChannelKey] = createSignal(!!props.channel.has_channel_key);
  const [recording, setRecording] = createSignal(false);
  const [e2eeActor, setE2eeActor] = createSignal("");
  const [e2eeAt, setE2eeAt] = createSignal("");
  const [gravarOpen, setGravarOpen] = createSignal(false);
  const [religarOpen, setReligarOpen] = createSignal(false);
  const [religarInput, setReligarInput] = createSignal("");
  const [membersOpen, setMembersOpen] = createSignal(false);
  const [blurMode, setBlurMode] = createSignal<CameraBlurMode>(readBlurMode());
  const [blurMenuOpen, setBlurMenuOpen] = createSignal(false);
  const [videoPausedByBlurFailure, setVideoPausedByBlurFailure] = createSignal(false);
  const slotEls = new Map<number, HTMLDivElement>();
  const gradeEls = new Map<string, HTMLDivElement>();
  const remotes = new Map<string, RemoteTrack[]>();
  let localVideoEl: HTMLMediaElement | null = null;
  let session: LiveSession | null = null;
  let localCamTrack: LocalVideoTrack | null = null;
  let starting = false;
  /** Guards against leave() + onCleanup both calling disconnect. */
  let leaving = false;
  /** Suppresses onDisconnected error UI during intentional leave / unmount. */
  let intentionalLeave = false;

  const [servers] = createResource(() => api<{ id: string; owner_account_id: string }[]>("/api/servers"));

  createEffect(() => {
    const handler = (e: Event) => {
      const open = (e as CustomEvent<{ open?: boolean }>).detail?.open;
      if (typeof open === "boolean") setMembersOpen(open);
    };
    window.addEventListener("mesa:members-panel-state", handler);
    onCleanup(() => window.removeEventListener("mesa:members-panel-state", handler));
  });

  createEffect(() => {
    setE2eeEnabled(props.channel.e2ee_enabled !== false);
    setHasChannelKey(!!props.channel.has_channel_key);
  });

  async function loadScenes() {
    const data = await api<SceneListData>(`/api/channels/${props.channel.id}/scenes`);
    setScenes(data.scenes);
    setActiveSceneId(data.active_scene_id);
  }

  async function loadMembers() {
    const list = await api<ServerMember[]>(`/api/servers/${props.channel.server_id}/members`);
    setMembers(list);
  }

  function refreshInCall() {
    const ids = new Set<string>([props.me.id, ...remotes.keys()]);
    if (session?.room) {
      for (const p of session.room.remoteParticipants.values()) {
        ids.add(p.identity);
      }
    }
    setInCallIds([...ids]);
  }

  function attachSlot(index: number, el: HTMLDivElement) {
    slotEls.set(index, el);
    queueMicrotask(layoutMedia);
  }

  function attachGrade(identity: string, el: HTMLDivElement) {
    gradeEls.set(identity, el);
    queueMicrotask(layoutMedia);
  }

  function clearOrphanVideos(node: HTMLElement, keep: HTMLMediaElement | null) {
    for (const child of [...node.children]) {
      if (child instanceof HTMLVideoElement && child !== keep) {
        child.remove();
      }
    }
  }

  function layoutMedia() {
    const current = grid();
    if (!current) return;
    if (viewMode() === "grid") {
      for (const node of gradeEls.values()) clearOrphanVideos(node, localVideoEl);
      for (const [identity, tracks] of remotes) {
        const node = gradeEls.get(identity);
        if (!node) continue;
        for (const track of tracks) attachRemote(track, node);
      }
      if (localVideoEl) {
        const node = gradeEls.get(props.me.id);
        if (node && localVideoEl.parentElement !== node) node.appendChild(localVideoEl);
        void localVideoEl.play?.().catch(() => undefined);
      }
      return;
    }
    for (const node of slotEls.values()) clearOrphanVideos(node, localVideoEl);
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
      void localVideoEl.play?.().catch(() => undefined);
    }
  }

  function placeTrack(track: RemoteTrack, participant: Participant) {
    const list = remotes.get(participant.identity) ?? [];
    if (!list.includes(track)) list.push(track);
    remotes.set(participant.identity, list);
    refreshInCall();
    layoutMedia();
  }

  async function captureLocal(
    mode: "camera" | "test",
  ): Promise<{ video: MediaStreamTrack | LocalVideoTrack; audio?: MediaStreamTrack }> {
    if (mode === "test") {
      let audio: MediaStreamTrack | undefined;
      try {
        audio = (await navigator.mediaDevices.getUserMedia({ audio: true, video: false })).getAudioTracks()[0];
      } catch {
        /* ok */
      }
      return { video: createTestVideoTrack(props.me.handle), audio };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const raw = stream.getVideoTracks()[0];
    if (!raw) throw new Error("sem faixa de vídeo");
    return { video: new LocalVideoTrack(raw), audio: stream.getAudioTracks()[0] };
  }

  function cameraPublication() {
    return session?.room.localParticipant.getTrackPublication(Track.Source.Camera);
  }

  async function gateBlurBeforeSend(track: LocalVideoTrack, mode: CameraBlurMode) {
    if (mode === "off") return;
    if (!supportsCameraBlur()) throw new Error(BLUR_UNAVAILABLE);
    await applyBlurMode(track, mode);
    await waitUntilBlurred(track);
  }

  async function resolveMediaKey(): Promise<Uint8Array | null> {
    const channelKey = loadChannelKey(props.channel.id);
    if (channelKey) return channelKey;
    const serverKey = await ensureServerKey(props.channel.server_id, props.identity, props.me.id);
    return serverKey ?? null;
  }

  async function connect(mode: "camera" | "test") {
    if (starting || session) return;
    starting = true;
    const channelId = props.channel.id;
    try {
      const key = await resolveMediaKey();
      if (!key) {
        setError("Sincronizando chave…");
        return;
      }
      setError(mode === "test" ? "A ligar com vídeo de teste…" : "A pedir câmara e microfone…");
      let local: { video: MediaStreamTrack | LocalVideoTrack; audio?: MediaStreamTrack };
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
      localCamTrack = local.video instanceof LocalVideoTrack ? local.video : null;
      const wantBlur = blurMode();
      if (localCamTrack && wantBlur !== "off") {
        if (!supportsCameraBlur()) {
          setError(BLUR_UNAVAILABLE);
          setBlurMode("off");
        } else {
          try {
            await gateBlurBeforeSend(localCamTrack, wantBlur);
          } catch {
            setError(BLUR_FAILED);
            setVideoPausedByBlurFailure(true);
            await localCamTrack.mute();
            setCamOn(false);
          }
        }
      }
      setError((e) => (e === BLUR_FAILED || e === BLUR_UNAVAILABLE ? e : ""));
      const join = await api<{ token: string; url: string; room: string }>(
        `/api/channels/${channelId}/voice/join`,
        { method: "POST" },
      );
      const layout = await api<GridLayout>(`/api/channels/${channelId}/grid`);
      setGrid(layout);
      session = await joinLiveRoom({
        url: join.url,
        token: join.token,
        mediaKey: key,
        e2eeEnabled: e2eeEnabled(),
        localVideo: local.video,
        localAudio: local.audio,
        onTrack: placeTrack,
        onDisconnected: (reason) => {
          session = null;
          setLive(false);
          if (intentionalLeave) return;
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
      refreshInCall();
      requestStageMode(true);
      requestAnimationFrame(() => queueMicrotask(layoutMedia));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      starting = false;
    }
  }

  async function leave() {
    if (leaving) return;
    leaving = true;
    intentionalLeave = true;
    try {
      if (localCamTrack) {
        await stopBlurProcessor(localCamTrack);
        localCamTrack.stop();
        localCamTrack = null;
      }
      // Clear session before await so onCleanup cannot double-disconnect.
      const s = session;
      session = null;
      await s?.disconnect();
      localVideoEl = null;
      remotes.clear();
      setLive(false);
      setInCallIds([]);
      setRecording(false);
      setBlurMenuOpen(false);
      setVideoPausedByBlurFailure(false);
      requestStageMode(false);
    } finally {
      leaving = false;
      queueMicrotask(() => {
        intentionalLeave = false;
      });
    }
  }

  async function toggleMic() {
    const next = !micOn();
    setMicOn(next);
    await session?.room.localParticipant.setMicrophoneEnabled(next);
  }

  async function toggleCam() {
    const next = !camOn();
    if (!next) {
      setCamOn(false);
      await cameraPublication()?.mute();
      return;
    }
    if (videoPausedByBlurFailure()) {
      setError(BLUR_FAILED);
      return;
    }
    const mode = blurMode();
    if (localCamTrack && mode !== "off") {
      try {
        await gateBlurBeforeSend(localCamTrack, mode);
      } catch {
        setError(BLUR_FAILED);
        setVideoPausedByBlurFailure(true);
        await cameraPublication()?.mute();
        return;
      }
    }
    setCamOn(true);
    await cameraPublication()?.unmute();
  }

  async function selectBlurMode(next: CameraBlurMode) {
    setBlurMenuOpen(false);
    if (next !== "off" && !supportsCameraBlur()) {
      setError(BLUR_UNAVAILABLE);
      return;
    }
    const previous = blurMode();
    writeBlurMode(next);
    setBlurMode(next);
    if (!localCamTrack || !live()) {
      if (next === "off" && (error() === BLUR_FAILED || error() === BLUR_UNAVAILABLE)) setError("");
      return;
    }
    try {
      if (next === "off") {
        await applyBlurMode(localCamTrack, "off");
        setVideoPausedByBlurFailure(false);
        if (camOn()) await cameraPublication()?.unmute();
        if (error() === BLUR_FAILED || error() === BLUR_UNAVAILABLE) setError("");
        return;
      }
      const needsGate = previous === "off" || videoPausedByBlurFailure();
      if (needsGate && camOn()) await cameraPublication()?.mute();
      await applyBlurMode(localCamTrack, next);
      if (needsGate) await waitUntilBlurred(localCamTrack);
      setVideoPausedByBlurFailure(false);
      if (camOn()) await cameraPublication()?.unmute();
      if (error() === BLUR_FAILED || error() === BLUR_UNAVAILABLE) setError("");
    } catch {
      setError(BLUR_FAILED);
      setVideoPausedByBlurFailure(true);
      await cameraPublication()?.mute();
    }
  }

  function setMode(mode: ViewMode) {
    writeViewMode(mode);
    setViewMode(mode);
    queueMicrotask(layoutMedia);
    requestAnimationFrame(() => queueMicrotask(layoutMedia));
  }

  createEffect(() => {
    grid();
    viewMode();
    queueMicrotask(layoutMedia);
  });

  createEffect(() => {
    const onStage = () => {
      queueMicrotask(layoutMedia);
      requestAnimationFrame(() => queueMicrotask(layoutMedia));
    };
    window.addEventListener("mesa:stage-mode", onStage);
    onCleanup(() => window.removeEventListener("mesa:stage-mode", onStage));
  });

  createEffect(() => {
    const channelId = props.channel.id;
    const serverId = props.channel.server_id;
    const identity = props.identity;
    const accountId = props.me.id;
    let cancelled = false;

    async function boot() {
      while (!cancelled) {
        const key = await ensureServerKey(serverId, identity, accountId);
        if (cancelled) return;
        if (!key && !loadChannelKey(channelId)) {
          setError("Sincronizando chave do Servidor…");
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        if (!session) setError("");
        const layout = await api<GridLayout>(`/api/channels/${channelId}/grid`);
        if (cancelled) return;
        setGrid(layout);
        await loadScenes();
        await loadMembers();
        return;
      }
    }
    void boot();

    const off = props.onWs((msg) => {
      if (msg.event === "grid.updated" && String(msg.payload.channel_id) === channelId) {
        setGrid(msg.payload.grid as GridLayout);
        queueMicrotask(layoutMedia);
        requestAnimationFrame(() => queueMicrotask(layoutMedia));
      }
      if (msg.event === "scene.changed" && String(msg.payload.channel_id) === channelId) {
        void loadScenes();
        queueMicrotask(layoutMedia);
      }
      if (msg.event === "key_handoff.completed" && msg.server_id === serverId) {
        void boot();
      }
      if (msg.event === "channel.e2ee_changed" && String(msg.payload.channel_id) === channelId) {
        const enabled = Boolean(msg.payload.e2ee_enabled);
        setE2eeEnabled(enabled);
        if (!enabled) {
          setE2eeActor(String(msg.payload.actor_account_id ?? ""));
          setE2eeAt(String(msg.payload.at ?? ""));
          setRecording(true);
        } else {
          setRecording(false);
          setE2eeActor("");
          setE2eeAt("");
        }
        void session?.setE2EEEnabled(enabled).catch(() => undefined);
      }
      if (msg.event === "channel.deleted" && String(msg.payload.channel_id) === channelId) {
        void leave().then(() => navigate("/"));
      }
      if (msg.event === "server.deleted" && String(msg.payload.server_id) === serverId) {
        void leave().then(() => navigate("/"));
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
      intentionalLeave = true;
      const s = session;
      session = null;
      void s?.disconnect();
      if (localCamTrack) {
        void stopBlurProcessor(localCamTrack);
        localCamTrack.stop();
        localCamTrack = null;
      }
      localVideoEl = null;
      remotes.clear();
      setLive(false);
      requestStageMode(false);
    });
  });

  const admin = () =>
    (servers() ?? []).some(
      (s) => s.id === props.channel.server_id && s.owner_account_id === props.me.id,
    );
  const activeScene = () =>
    scenes().find((s) => s.id === activeSceneId()) ?? scenes().find((s) => s.is_active);
  const handles = () => {
    const map: Record<string, string> = { [props.me.id]: props.me.handle };
    for (const m of members()) map[m.account_id] = m.handle;
    return map;
  };
  const occupied = () => (grid()?.slots.filter((s) => s.account_id).length ?? 0);
  const slotCount = () => grid()?.slot_count ?? 0;
  const bankIds = () =>
    deriveBank(
      inCallIds().length ? inCallIds() : live() ? [props.me.id] : [],
      (grid()?.slots ?? []).map((s) => s.account_id),
    );
  const actorHandle = () => {
    const id = e2eeActor();
    return handles()[id] ?? (id || "alguém");
  };
  const canRecord = () => admin() && hasChannelKey();

  async function persistLayout(layout: GridLayout) {
    const g = await api<GridLayout>(`/api/channels/${props.channel.id}/grid`, {
      method: "PUT",
      body: JSON.stringify(layout),
    });
    setGrid(g);
    await loadScenes();
    queueMicrotask(layoutMedia);
    requestAnimationFrame(() => queueMicrotask(layoutMedia));
  }

  async function confirmGravar() {
    setError("");
    try {
      await startEgress(props.channel.id);
      setRecording(true);
      setE2eeEnabled(false);
      setGravarOpen(false);
      await session?.setE2EEEnabled(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      setError(msg);
      setGravarOpen(false);
      // Refresh channel state in case compensate ran
      try {
        const ch = await api<Channel>(`/api/channels/${props.channel.id}`);
        setE2eeEnabled(ch.e2ee_enabled);
        setHasChannelKey(ch.has_channel_key);
        if (ch.e2ee_enabled) setRecording(false);
      } catch {
        /* ignore */
      }
    }
  }

  async function stopRecording() {
    setError("");
    try {
      await stopEgress(props.channel.id);
      setRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function confirmReligar() {
    setError("");
    let key = loadChannelKey(props.channel.id);
    if (!key) {
      key = parseChannelKeyInput(religarInput());
      if (!key) {
        setError("Chave do canal inválida.");
        return;
      }
      rememberChannelKey(props.channel.id, key);
    }
    try {
      await session?.setChannelKey(key);
      await setChannelE2ee(props.channel.id, true);
      await session?.setE2EEEnabled(true);
      setE2eeEnabled(true);
      setRecording(false);
      setReligarOpen(false);
      setReligarInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div class={`pane voice-pane${editing() ? " voice-pane-editing" : ""}`}>
      <Show when={!e2eeEnabled()}>
        <div class="e2ee-banner" role="status">
          <IconLockWarning size={22} />
          <div>
            <strong>E2EE desligada</strong>
            {recording() ? " — gravando via Egress do servidor" : ""}
            <div class="muted">
              Desligada por {actorHandle()}
              {e2eeAt() ? ` · ${e2eeAt()}` : ""} · registado na auditoria
            </div>
          </div>
          <Show when={admin() && hasChannelKey()}>
            <button type="button" class="btn btn-secondary" onClick={() => setReligarOpen(true)}>
              Religar E2EE
            </button>
          </Show>
        </div>
      </Show>

      <header class="pane-header">
        <div>
          <div class="pane-title">{props.channel.name}</div>
          <div class="pane-sub">
            {occupied()} de {slotCount()} em cena
          </div>
        </div>
        <div class="seg" style={{ "margin-left": "auto" }}>
          <label class="seg-opt">
            <input
              type="radio"
              name="view-mode"
              checked={viewMode() === "composition"}
              onChange={() => setMode("composition")}
            />
            Composição
          </label>
          <label class="seg-opt">
            <input
              type="radio"
              name="view-mode"
              checked={viewMode() === "grid"}
              onChange={() => setMode("grid")}
            />
            Grade
          </label>
        </div>
        <Show when={admin() && !editing()}>
          <button type="button" class="btn btn-primary" onClick={() => setEditing(true)}>
            Editar cena
          </button>
        </Show>
        <button
          type="button"
          class="pane-icon-btn"
          disabled={!props.channel.server_id}
          aria-expanded={membersOpen()}
          aria-label="Membros"
          title="Membros"
          onClick={() => toggleMembersPanel()}
        >
          <IconUsers size={20} />
        </button>
        <button type="button" class="btn btn-ghost" onClick={() => toggleStageMode()}>
          Modo palco
        </button>
        <span class={`e2ee-chip${e2eeEnabled() ? "" : " off"}`}>
          <Show when={e2eeEnabled()} fallback={<IconLockWarning size={16} />}>
            <IconLockClosed size={16} />
          </Show>
          {e2eeEnabled() ? "E2EE activa" : "E2EE off"}
        </span>
      </header>

      <Show when={!live()}>
        <div class="row" style={{ padding: "16px 24px" }}>
          <button type="button" class="btn btn-primary" onClick={() => void connect("camera")}>
            {needGesture() ? "Permitir câmara e microfone" : "Ligar câmara e microfone"}
          </button>
          <button type="button" class="btn btn-secondary" onClick={() => void connect("test")}>
            Vídeo de teste
          </button>
        </div>
      </Show>

      <Show when={grid()}>
        {(g) => (
          <>
            <Show when={!editing()}>
              <Show when={viewMode() === "composition"}>
                <CameraGrid grid={g()} handles={handles()} attachSlot={attachSlot} />
                <CallBank accountIds={bankIds()} handles={handles()} />
              </Show>
              <Show when={viewMode() === "grid"}>
                <CameraGrid
                  grid={g()}
                  handles={handles()}
                  attachSlot={attachSlot}
                  gradeIdentities={inCallIds().length ? inCallIds() : [props.me.id]}
                  attachGrade={attachGrade}
                />
              </Show>
            </Show>

            <Show when={live() && !editing()}>
              <div class="call-controls">
                <button
                  type="button"
                  class="btn btn-secondary call-ctrl call-ctrl-icon"
                  aria-label={micOn() ? "Microfone ligado" : "Microfone desligado"}
                  title={micOn() ? "Microfone ligado" : "Microfone desligado"}
                  onClick={() => void toggleMic()}
                >
                  <Show when={micOn()} fallback={<IconMicOff />}>
                    <IconMicOn />
                  </Show>
                </button>
                <div class="call-ctrl-split camera-blur-anchor">
                  <button
                    type="button"
                    class="btn btn-secondary call-ctrl call-ctrl-icon"
                    aria-label={camOn() ? "Câmara ligada" : "Câmara desligada"}
                    title={camOn() ? "Câmara ligada" : "Câmara desligada"}
                    onClick={() => void toggleCam()}
                  >
                    <Show when={camOn()} fallback={<IconCameraOff />}>
                      <IconCameraOn />
                    </Show>
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary call-ctrl-chevron"
                    data-blur={blurMode() === "off" ? "off" : "on"}
                    aria-haspopup="menu"
                    aria-expanded={blurMenuOpen()}
                    aria-label={blurMode() === "off" ? "Fundo: sem blur" : "Fundo: blur ligado"}
                    title={blurMode() === "off" ? "Fundo: sem blur" : "Fundo: blur ligado"}
                    onClick={() => setBlurMenuOpen(!blurMenuOpen())}
                  >
                    <Show when={blurMode() !== "off"} fallback={<IconChevronDown />}>
                      <IconChevronDownBlur />
                    </Show>
                  </button>
                  <CameraBlurMenu
                    open={blurMenuOpen()}
                    mode={blurMode()}
                    onClose={() => setBlurMenuOpen(false)}
                    onSelect={(m) => void selectBlurMode(m)}
                  />
                </div>
                <Show when={admin()}>
                  <Show
                    when={!recording()}
                    fallback={
                      <button type="button" class="btn btn-secondary" onClick={() => void stopRecording()}>
                        Parar gravação
                      </button>
                    }
                  >
                    <button
                      type="button"
                      class="btn btn-secondary"
                      disabled={!canRecord()}
                      title={
                        hasChannelKey()
                          ? undefined
                          : "Recrie o canal de voz para activar Gravar (chave de canal em falta)"
                      }
                      onClick={() => setGravarOpen(true)}
                    >
                      Gravar cena…
                    </button>
                  </Show>
                </Show>
                <button
                  type="button"
                  class="btn btn-danger call-ctrl call-ctrl-leave"
                  aria-label="Sair da chamada"
                  onClick={() => void leave()}
                >
                  <IconPhoneHangup />
                  <span>Sair</span>
                </button>
              </div>
              <p class="privacy-line">
                {e2eeEnabled()
                  ? "E2EE activa · o servidor não decodifica nada"
                  : "gravando via Egress do servidor"}
              </p>
            </Show>

            <Show when={editing() && admin() && activeScene()}>
              {(scene) => (
                <div class="scene-editor-host">
                  <SceneEditor
                    channelId={props.channel.id}
                    sceneId={scene().id}
                    sceneName={scene().name}
                    sceneIsActive={true}
                    layout={g()}
                    handles={handles()}
                    inCallIds={inCallIds()}
                    onSave={persistLayout}
                    onClose={() => {
                      setEditing(false);
                      queueMicrotask(layoutMedia);
                      requestAnimationFrame(() => queueMicrotask(layoutMedia));
                    }}
                  />
                </div>
              )}
            </Show>
          </>
        )}
      </Show>
      <p class="error" style={{ padding: "0 16px 8px" }}>
        {error()}
      </p>

      <Dialog
        open={gravarOpen()}
        title="Gravar cena"
        onClose={() => setGravarOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setGravarOpen(false)}>
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void confirmGravar()}>
              Confirmar e gravar
            </button>
          </>
        }
      >
        <p>
          A gravação e a exportação da cena acontecem no servidor (Egress), e isso é incompatível com
          criptografia ponta-a-ponta: enquanto estiver a gravar, o servidor decodifica áudio e vídeo.
          A troca é sua, e fica visível para todos no canal.
        </p>
      </Dialog>

      <Dialog
        open={religarOpen()}
        title="Religar E2EE"
        onClose={() => setReligarOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setReligarOpen(false)}>
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void confirmReligar()}>
              Religar
            </button>
          </>
        }
      >
        <Show
          when={!loadChannelKey(props.channel.id)}
          fallback={<p class="muted">A chave deste canal está guardada neste dispositivo.</p>}
        >
          <div class="field">
            <label for="religar-key">Chave do canal (base64)</label>
            <input
              id="religar-key"
              class="input"
              value={religarInput()}
              onInput={(e) => setReligarInput(e.currentTarget.value)}
              placeholder="Cole a chave que guardou na criação"
            />
          </div>
        </Show>
      </Dialog>
    </div>
  );
}
