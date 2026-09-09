import { Show, createEffect, createResource, createSignal, onCleanup, untrack } from "solid-js";
import CallBank, { deriveBank } from "../components/CallBank";
import CameraGrid from "../components/CameraGrid";
import SceneEditor from "../components/SceneEditor";
import Dialog from "../components/Dialog";
import { IconLockClosed, IconLockWarning } from "../components/icons/IconLock";
import IconUsers from "../components/icons/IconUsers";
import {
  api,
  fetchVoiceOccupancy,
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
import { requestStageMode, toggleMembersPanel } from "../shell/AppShell";
import type { LiveSession } from "../video/liveClient";
import { categorizeJoinError, joinErrorMessage } from "../voice/joinErrors";
import { loadVoiceRuntime, type VoiceRuntime } from "../voice/loadRuntime";
import { t } from "../i18n";
import { errorMessage } from "../lib/apiError";
import { keySyncMsg, keySyncShort } from "../lib/keySyncCopy";
import { safePlay } from "../lib/safeMedia";
import {
  isVoiceLoadFailed,
  isVoiceLoading,
  type VoiceLoadPhase,
} from "../voice/voiceLoadState";
import { useVoiceSession, voiceDurationLabel } from "../voice/VoiceSession";
import type { LocalVideoTrack, Participant, RemoteTrack } from "livekit-client";
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
  const voice = useVoiceSession();
  const [grid, setGrid] = createSignal<GridLayout | null>(emptyGrid());
  const [error, setError] = createSignal("");
  const [live, setLive] = createSignal(false);
  const [needGesture, setNeedGesture] = createSignal(false);
  const [scenes, setScenes] = createSignal<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = createSignal("");
  const [members, setMembers] = createSignal<ServerMember[]>([]);
  const [viewMode, setViewMode] = createSignal<ViewMode>(readViewMode());
  const [editing, setEditing] = createSignal(false);
  const [camOn, setCamOn] = createSignal(false);
  const [inCallIds, setInCallIds] = createSignal<string[]>([]);
  const [e2eeEnabled, setE2eeEnabled] = createSignal(props.channel.e2ee_enabled !== false);
  const [hasChannelKey, setHasChannelKey] = createSignal(!!props.channel.has_channel_key);
  const [e2eeActor, setE2eeActor] = createSignal("");
  const [e2eeAt, setE2eeAt] = createSignal("");
  const [religarOpen, setReligarOpen] = createSignal(false);
  const [religarInput, setReligarInput] = createSignal("");
  const [membersOpen, setMembersOpen] = createSignal(false);
  const [blurMode, setBlurMode] = createSignal<CameraBlurMode>(readBlurMode());
  const [callStartedAt, setCallStartedAt] = createSignal<string | null>(null);
  const [runtimePhase, setRuntimePhase] = createSignal<VoiceLoadPhase>("idle");
  const slotEls = new Map<number, HTMLDivElement>();
  const gradeEls = new Map<string, HTMLDivElement>();
  const remotes = new Map<string, RemoteTrack[]>();
  let localVideoEl: HTMLMediaElement | null = null;
  let session: LiveSession | null = null;
  let localCamTrack: LocalVideoTrack | null = null;
  let rt: VoiceRuntime | null = null;
  let starting = false;
  /** Guards against leave() + hangup both running. */
  let leaving = false;
  const listenOnly = () => props.channel.my_permission === "listen";

  async function selectHeaderBlur(next: CameraBlurMode) {
    writeBlurMode(next);
    setBlurMode(next);
    const track = voice.localCamTrack();
    if (!track || !voice.camOn()) return;
    try {
      const runtime = await ensureRuntime();
      if (next !== "off" && !runtime.supportsCameraBlur()) {
        setError(runtime.BLUR_UNAVAILABLE);
        return;
      }
      await runtime.applyBlurMode(track, next);
    } catch {
      const runtime = rt;
      setError(runtime?.BLUR_FAILED ?? t("shell.blurUnavailable"));
    }
  }

  async function ensureRuntime(): Promise<VoiceRuntime> {
    if (rt) {
      setRuntimePhase("ready");
      return rt;
    }
    setRuntimePhase("loading");
    try {
      rt = await loadVoiceRuntime();
      setRuntimePhase("ready");
      return rt;
    } catch (err) {
      setRuntimePhase("failed");
      throw err;
    }
  }

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
    const room = voice.session()?.room;
    if (room) {
      for (const p of room.remoteParticipants.values()) {
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
    if (!current || !rt) return;
    if (viewMode() === "grid") {
      for (const node of gradeEls.values()) clearOrphanVideos(node, localVideoEl);
      for (const [identity, tracks] of remotes) {
        const node = gradeEls.get(identity);
        if (!node) continue;
        for (const track of tracks) rt.attachRemote(track, node);
      }
      if (localVideoEl) {
        const node = gradeEls.get(props.me.id);
        if (node && localVideoEl.parentElement !== node) node.appendChild(localVideoEl);
        safePlay(localVideoEl);
      }
      return;
    }
    for (const node of slotEls.values()) clearOrphanVideos(node, localVideoEl);
    for (const [identity, tracks] of remotes) {
      const idx = current.slots.find((s) => s.account_id === identity)?.index;
      if (idx === undefined) continue;
      const node = slotEls.get(idx);
      if (!node) continue;
      for (const track of tracks) rt.attachRemote(track, node);
    }
    if (localVideoEl) {
      const mine = current.slots.find((s) => s.account_id === props.me.id)?.index ?? 0;
      const node = slotEls.get(mine);
      if (node && localVideoEl.parentElement !== node) node.appendChild(localVideoEl);
      safePlay(localVideoEl);
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
    runtime: VoiceRuntime,
    mode: "camera" | "audio" | "test",
  ): Promise<{
    video?: MediaStreamTrack | LocalVideoTrack;
    audio?: MediaStreamTrack;
    cameraSoftFail?: boolean;
    cameraSoftFailErr?: unknown;
  }> {
    if (mode === "audio") {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audio = stream.getAudioTracks()[0];
      if (!audio) throw new Error("sem faixa de áudio");
      return { audio };
    }
    if (mode === "test") {
      let audio: MediaStreamTrack | undefined;
      try {
        audio = (await navigator.mediaDevices.getUserMedia({ audio: true, video: false })).getAudioTracks()[0];
      } catch {
        /* ok */
      }
      return { video: runtime.createTestVideoTrack(props.me.handle), audio };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const raw = stream.getVideoTracks()[0];
      if (!raw) throw new Error("sem faixa de vídeo");
      return { video: new runtime.LocalVideoTrack(raw), audio: stream.getAudioTracks()[0] };
    } catch (avErr) {
      // Audio-only fallback when video fails but mic can still be obtained (031 cam soft-fail).
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const audio = audioOnly.getAudioTracks()[0];
        if (!audio) throw avErr;
        return { audio, cameraSoftFail: true, cameraSoftFailErr: avErr };
      } catch {
        throw avErr;
      }
    }
  }

  async function gateBlurBeforeSend(
    runtime: VoiceRuntime,
    track: LocalVideoTrack,
    mode: CameraBlurMode,
  ) {
    if (mode === "off") return;
    if (!runtime.supportsCameraBlur()) throw new Error(runtime.BLUR_UNAVAILABLE);
    await runtime.applyBlurMode(track, mode);
    await runtime.waitUntilBlurred(track);
  }

  async function resolveMediaKey(): Promise<Uint8Array | null> {
    const channelKey = loadChannelKey(props.channel.id);
    if (channelKey) return channelKey;
    const serverKey = await ensureServerKey(props.channel.server_id, props.identity, props.me.id);
    return serverKey ?? null;
  }

  async function connect(mode: "camera" | "audio" | "test") {
    if (starting) return;
    if (voice.live() && voice.channelId() === props.channel.id) return;
    starting = true;
    const channelId = props.channel.id;
    let joined = false;
    let localAudio: MediaStreamTrack | undefined;
    let localVideo: MediaStreamTrack | LocalVideoTrack | undefined;
    let partialSession: LiveSession | null = null;
    let cameraWarning = "";
    const mayPublish = !listenOnly();
    /** 080/081: inherit panel session mic/cam preferences on join. */
    const preferredMic = voice.micOn();
    let runtime: VoiceRuntime | null = null;
    try {
      setError(t("voice.loadModule"));
      runtime = await ensureRuntime();
      const key = await resolveMediaKey();
      if (!key) {
        setError(keySyncShort());
        return;
      }
      setError(
        !mayPublish
          ? t("voice.connectingListen")
          : mode === "test"
          ? t("voice.connectingTest")
          : mode === "audio"
            ? t("voice.askingMic")
            : t("voice.askingCamMic"),
      );
      if (!mayPublish) {
        setCamOn(false);
      } else if (mode === "audio") {
        setCamOn(false);
      } else if (mode === "camera") {
        setCamOn(true);
      }
      let local: Awaited<ReturnType<typeof captureLocal>> = {};
      try {
        if (mayPublish) local = await captureLocal(runtime, mode);
        setNeedGesture(false);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setNeedGesture(true);
          setError(
            mode === "audio"
              ? t("voice.micPermission")
              : joinErrorMessage("permission"),
          );
          return;
        }
        setError(joinErrorMessage(categorizeJoinError(err)));
        return;
      }
      localAudio = local.audio;
      localVideo = local.video;
      if (local.cameraSoftFail) {
        setCamOn(false);
        cameraWarning = joinErrorMessage(categorizeJoinError(local.cameraSoftFailErr), {
          cameraOnly: true,
        });
      }
      localCamTrack =
        local.video instanceof runtime.LocalVideoTrack ? local.video : null;
      voice.setLocalCamTrack(localCamTrack);
      const wantBlur = blurMode();
      if (localCamTrack && wantBlur !== "off") {
        if (!runtime.supportsCameraBlur()) {
          setError(runtime.BLUR_UNAVAILABLE);
          setBlurMode("off");
        } else {
          try {
            await gateBlurBeforeSend(runtime, localCamTrack, wantBlur);
          } catch {
            setError(runtime.BLUR_FAILED);
            await localCamTrack.mute();
            setCamOn(false);
          }
        }
      }
      setError((e) =>
        e === runtime!.BLUR_FAILED || e === runtime!.BLUR_UNAVAILABLE ? e : t("voice.connecting"),
      );
      const useCam =
        !mayPublish || mode === "audio"
          ? false
          : Boolean(local.video) && (mode === "test" || camOn());
      const join = await api<{ token: string; url: string; room: string }>(
        `/api/channels/${channelId}/voice/join`,
        {
          method: "POST",
          body: JSON.stringify({ mic_on: mayPublish && preferredMic, cam_on: useCam }),
        },
      );
      joined = true;
      const layout = await api<GridLayout>(`/api/channels/${channelId}/grid`);
      setGrid(layout);
      partialSession = await runtime.joinLiveRoom({
        url: join.url,
        token: join.token,
        mediaKey: key,
        e2eeEnabled: e2eeEnabled(),
        localVideo: local.video,
        localAudio: local.audio,
        onTrack: (track, participant) => voice.dispatchTrack(track, participant),
        onDisconnected: (reason) => {
          session = null;
          setLive(false);
          if (voice.consumeIntentionalLeave()) return;
          void voice.dropped();
          requestStageMode(false);
          setError(
            t("voice.connectionClosed", {
              detail: reason != null ? ` (${String(reason)})` : "",
            }),
          );
        },
        onLocalTrack: (el) => {
          localVideoEl = el;
          voice.setLocalVideoEl(el);
          if (el instanceof HTMLVideoElement) {
            el.muted = true;
            el.autoplay = true;
            el.playsInline = true;
          }
          layoutMedia();
        },
      });
      session = partialSession;
      await voice.bindLive({
        session,
        channel: props.channel,
        mode,
        micOn: mayPublish && preferredMic,
        camOn: useCam,
        localCamTrack,
        localVideoEl,
      });
      setLive(true);
      refreshInCall();
      requestStageMode(false);
      if (cameraWarning) {
        setError(cameraWarning);
      } else {
        setError((e) =>
          e === runtime!.BLUR_FAILED || e === runtime!.BLUR_UNAVAILABLE ? e : "",
        );
      }
      requestAnimationFrame(() => queueMicrotask(layoutMedia));
    } catch (err) {
      if (isVoiceLoadFailed(runtimePhase()) || !runtime) {
        setError(t("channel.voiceLoadFail"));
      } else {
        await runtime.abortFailedJoin({
          channelId,
          joined,
          localCamTrack,
          localVideo,
          audioTracks: [localAudio],
          session: partialSession,
        });
        localCamTrack = null;
        voice.setLocalCamTrack(null);
        session = null;
        partialSession = null;
        localVideoEl = null;
        setLive(false);
        requestStageMode(false);
        setError(joinErrorMessage(categorizeJoinError(err)));
      }
    } finally {
      starting = false;
    }
  }

  async function leave() {
    if (leaving) return;
    leaving = true;
    try {
      // hangup → releaseLocalCapture then leaveVoice (035); idempotent if bar also hangs up
      await voice.hangup();
      localCamTrack = null;
      session = null;
      localVideoEl = null;
      remotes.clear();
      setLive(false);
      setInCallIds([]);
      requestStageMode(false);
    } finally {
      leaving = false;
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
          setError(keySyncMsg());
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        if (!voice.session()) setError("");
        const layout = await api<GridLayout>(`/api/channels/${channelId}/grid`);
        if (cancelled) return;
        setGrid(layout);
        try {
          const snap = await fetchVoiceOccupancy(serverId);
          const row = snap.channels.find((c) => c.channel_id === channelId);
          setCallStartedAt(row?.call_started_at ?? null);
        } catch {
          setCallStartedAt(null);
        }
        await loadScenes();
        await loadMembers();
        return;
      }
    }
    void boot();

    const off = props.onWs((msg) => {
      if (msg.event === "voice.occupancy" && String(msg.payload.channel_id) === channelId) {
        const started = msg.payload.call_started_at;
        setCallStartedAt(
          typeof started === "string" ? started : started == null ? null : String(started),
        );
      }
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
        } else {
          setE2eeActor("");
          setE2eeAt("");
        }
        void voice.session()?.setE2EEEnabled(enabled).catch(() => undefined);
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
    voice.setHandlers({
      onTrack: placeTrack,
      onLocalTrack: (el) => {
        localVideoEl = el;
        voice.setLocalVideoEl(el);
        if (el instanceof HTMLVideoElement) {
          el.muted = true;
          el.autoplay = true;
          el.playsInline = true;
        }
        layoutMedia();
      },
      onDisconnected: (reason) => {
        session = null;
        setLive(false);
        if (voice.consumeIntentionalLeave()) return;
        void voice.dropped();
        requestStageMode(false);
        setError(
          t("voice.connectionClosed", {
            detail: reason != null ? ` (${String(reason)})` : "",
          }),
        );
      },
    });
    onCleanup(() => voice.setHandlers(null));
  });

  createEffect(() => {
    if (!live()) return;
    setCamOn(voice.camOn());
  });

  let moving = false;
  createEffect(() => {
    const chId = props.channel.id;
    const inCall = voice.live();
    const current = voice.channelId();
    if (inCall && current === chId) {
      untrack(() => {
        setLive(true);
        session = voice.session();
        localCamTrack = voice.localCamTrack();
        localVideoEl = voice.localVideoEl();
        setCamOn(voice.camOn());
        void ensureRuntime().then(() => {
          const room = voice.session()?.room;
          if (room) {
            for (const p of room.remoteParticipants.values()) {
              for (const pub of p.trackPublications.values()) {
                const track = pub.track;
                if (track) placeTrack(track as RemoteTrack, p);
              }
            }
          }
          requestStageMode(false);
          queueMicrotask(layoutMedia);
        });
      });
      return;
    }
    if (inCall && current && current !== chId && !moving) {
      moving = true;
      // 032: leave previous call and show dual pre-join on destination (no auto-reconnect).
      void (async () => {
        try {
          await voice.hangup();
          setLive(false);
          session = null;
          localCamTrack = null;
          localVideoEl = null;
          remotes.clear();
          requestStageMode(false);
        } finally {
          moving = false;
        }
      })();
    }
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
    return handles()[id] ?? (id || t("common.someone"));
  };

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

  async function confirmReligar() {
    setError("");
    let key = loadChannelKey(props.channel.id);
    if (!key) {
      key = parseChannelKeyInput(religarInput());
      if (!key) {
        setError(t("voice.invalidKey"));
        return;
      }
      rememberChannelKey(props.channel.id, key);
    }
    try {
      await voice.session()?.setChannelKey(key);
      await setChannelE2ee(props.channel.id, true);
      await voice.session()?.setE2EEEnabled(true);
      setE2eeEnabled(true);
      setReligarOpen(false);
      setReligarInput("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div class={`pane voice-pane${editing() ? " voice-pane-editing" : ""}`}>
      <Show when={!e2eeEnabled()}>
        <div class="e2ee-banner" role="status">
          <IconLockWarning size={22} />
          <div>
            <strong>{t("voice.e2eeOff")}</strong>
            <div class="muted">
              {t("voice.e2eeOffBy", { handle: actorHandle() })}
              {e2eeAt() ? ` · ${e2eeAt()}` : ""} · {t("voice.e2eeAudit")}
            </div>
          </div>
          <Show when={admin() && hasChannelKey()}>
            <button type="button" class="btn btn-secondary" onClick={() => setReligarOpen(true)}>
              {t("voice.reenableE2ee")}
            </button>
          </Show>
        </div>
      </Show>

      <header class="pane-header">
        <div>
          <div class="pane-title">{props.channel.name}</div>
          <div class="pane-sub">
            {t("voice.occupied", { n: occupied(), total: slotCount() })}
            <Show when={voiceDurationLabel(callStartedAt(), voice.now())}>
              {(dur) => (
                <>
                  {" · "}
                  <span class="voice-call-timer" aria-label={t("voice.callDuration", { duration: dur() })}>
                    {dur()}
                  </span>
                </>
              )}
            </Show>
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
            {t("voice.composition")}
          </label>
          <label class="seg-opt">
            <input
              type="radio"
              name="view-mode"
              checked={viewMode() === "grid"}
              onChange={() => setMode("grid")}
            />
            {t("voice.grid")}
          </label>
        </div>
        <Show when={admin() && !editing()}>
          <button type="button" class="btn btn-primary" onClick={() => setEditing(true)}>
            {t("voice.editScene")}
          </button>
        </Show>
        <button
          type="button"
          class="pane-icon-btn"
          disabled={!props.channel.server_id}
          aria-expanded={membersOpen()}
          aria-label={t("shell.members")}
          title={t("shell.members")}
          onClick={() => toggleMembersPanel()}
        >
          <IconUsers size={20} />
        </button>
        <Show when={live() && !listenOnly()}>
          <label class="voice-header-blur">
            <span class="voice-header-blur-label">{t("voice.blurEffect")}</span>
            <select
              class="voice-header-blur-select"
              aria-label={t("voice.blurEffect")}
              value={blurMode()}
              onChange={(e) => void selectHeaderBlur(e.currentTarget.value as CameraBlurMode)}
            >
              <option value="off">{t("voice.blurNone")}</option>
              <option value="light">{t("voice.blurLight")}</option>
              <option value="strong">{t("voice.blurStrong")}</option>
            </select>
          </label>
        </Show>
        <span class={`e2ee-chip${e2eeEnabled() ? "" : " off"}`}>
          <Show when={e2eeEnabled()} fallback={<IconLockWarning size={16} />}>
            <IconLockClosed size={16} />
          </Show>
          {e2eeEnabled() ? t("channel.e2eeOn") : t("voice.e2eeOffChip")}
        </span>
      </header>

      <Show when={!live()}>
        <div class="row voice-module-load voice-prejoin" style={{ padding: "16px 24px", gap: "8px", "flex-wrap": "wrap" }}>
          <Show when={isVoiceLoading(runtimePhase())}>
            <p class="muted" role="status">
              {t("voice.loadModule")}
            </p>
          </Show>
          <Show when={isVoiceLoadFailed(runtimePhase())}>
            <p class="error" role="alert">
              {error() || t("channel.voiceLoadFail")}
            </p>
            <button
              type="button"
              class="btn btn-primary"
              onClick={() => {
                setRuntimePhase("idle");
                setError("");
                void connect(
                  listenOnly() ? "audio" : voice.camOn() ? "camera" : "audio",
                );
              }}
            >
              {t("channel.tryAgain")}
            </button>
          </Show>
          <Show when={!isVoiceLoading(runtimePhase()) && !isVoiceLoadFailed(runtimePhase())}>
            <Show
              when={!listenOnly()}
              fallback={
                <button type="button" class="btn btn-primary" onClick={() => void connect("audio")}>
                  {t("voice.joinListen")}
                </button>
              }
            >
              <div class="voice-prejoin-controls">
                <button
                  type="button"
                  class="btn btn-primary voice-prejoin-join"
                  onClick={() =>
                    void connect(voice.camOn() ? "camera" : "audio")
                  }
                >
                  {needGesture()
                    ? voice.camOn()
                      ? t("voice.allowCamMic")
                      : t("voice.allowMic")
                    : t("voice.join")}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  onClick={() => void connect("test")}
                >
                  {t("voice.testVideo")}
                </button>
              </div>
            </Show>
          </Show>
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
      <p class="error voice-pane-error" style={{ padding: "0 16px 8px" }}>
        {error()}
      </p>

      <Dialog
        open={religarOpen()}
        title={t("voice.reenableE2ee")}
        onClose={() => setReligarOpen(false)}
        actions={
          <>
            <button type="button" class="btn btn-secondary" onClick={() => setReligarOpen(false)}>
              {t("common.cancel")}
            </button>
            <button type="button" class="btn btn-primary" onClick={() => void confirmReligar()}>
              {t("voice.reenable")}
            </button>
          </>
        }
      >
        <Show
          when={!loadChannelKey(props.channel.id)}
          fallback={<p class="muted">{t("voice.keyOnDevice")}</p>}
        >
          <div class="field">
            <label for="religar-key">{t("voice.channelKeyLabel")}</label>
            <input
              id="religar-key"
              class="input"
              value={religarInput()}
              onInput={(e) => setReligarInput(e.currentTarget.value)}
              placeholder={t("voice.channelKeyPlaceholder")}
            />
          </div>
        </Show>
      </Dialog>
    </div>
  );
}
