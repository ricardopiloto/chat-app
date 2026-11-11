// The call: one LiveKit room, exposed as reactive state.
//
// The provider lives at the app shell, above every screen, so a call outlives navigation: remote audio
// keeps playing and the floating player can show the same state. Screens never touch the room; they
// read `participants()` and call the actions. Video is declarative: each participant carries its tracks
// and a tile attaches a track to its own element (see `TrackVideo`), nothing is moved around the DOM.
import { createContext, createEffect, createSignal, onCleanup, onMount, useContext, type Accessor, type JSX } from "solid-js";
import type { Participant as LkParticipant, Room, RemoteTrack, Track, LocalTrackPublication, RemoteTrackPublication } from "livekit-client";
import { channels as channelsApi, voice as voiceApi, type Channel, type MediaFlags, type RealtimeEnvelope } from "../api";
import { b64 } from "../crypto/identity";
import { loadServerKey } from "../crypto/keyHandoff";
import { getServerKey } from "../crypto/serverKey";
import { useSession } from "../session/session";
import type { Identity } from "../crypto/identity";
import { devices, prefs, refreshDevices, resolveDevice, type BlurLevel, type CameraEffect } from "./devices";
import { backgroundBlob } from "./cameraBackgrounds";
import { notify } from "../sound/effects";

export type CallStatus = "idle" | "connecting" | "live" | "reconnecting";
export type JoinMode = "full" | "listen";
export type CallProblem = "denied" | "noKey" | "unavailable" | "failed" | "popoutToken" | "livekitConnect" | "kicked";

/** What a tile needs to draw one person. Tracks are LiveKit tracks; `attach(el)` renders them. */
export interface CallParticipant {
  id: string;
  name: string;
  isLocal: boolean;
  /** Present only while the camera is publishing and unmuted. */
  camera: Track | null;
  screen: Track | null;
  micOn: boolean;
  camOn: boolean;
  /** Can hear but not publish. */
  listener: boolean;
}

export interface JoinRequest {
  channel: Channel;
  mode: JoinMode;
  /** Wanted media; ignored (forced off) for listeners. */
  mic: boolean;
  cam: boolean;
}

const HEARTBEAT_MS = 20_000;
const BLUR_RADIUS: Record<Exclude<BlurLevel, "off">, number> = { light: 8, strong: 22 };

type LiveKit = typeof import("livekit-client");

let livekitPromise: Promise<LiveKit> | null = null;
const loadLiveKit = () => (livekitPromise ??= import("livekit-client"));

/**
 * The frame key is the server key, the same bytes for everyone in the server (docs/e2ee-gaps.md). A
 * channel's own key is custody material for turning encryption back on; using it for frames would
 * leave its creator unable to decrypt anyone else's media.
 */
const mediaKeyFor = (channel: Channel, identity: Identity): Promise<Uint8Array | undefined> => loadServerKey(channel.server_id, identity);

function createCall() {
  const session = useSession();
  const [status, setStatus] = createSignal<CallStatus>("idle");
  const [channel, setChannel] = createSignal<Channel | null>(null);
  const [startedAt, setStartedAt] = createSignal<number | null>(null);
  const [participants, setParticipants] = createSignal<CallParticipant[]>([]);
  const [speaking, setSpeaking] = createSignal<ReadonlySet<string>>(new Set<string>());
  const [problem, setProblem] = createSignal<CallProblem | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [mic, setMicState] = createSignal(false);
  const [cam, setCamState] = createSignal(false);
  const [screen, setScreenState] = createSignal(false);
  const [deafened, setDeafened] = createSignal(false);
  const [canSpeak, setCanSpeak] = createSignal(true);
  const [e2eeOn, setE2eeOn] = createSignal(false);
  const [audioBlocked, setAudioBlocked] = createSignal(false);
  const [blurError, setBlurError] = createSignal(false);

  let lk: LiveKit | null = null;
  let room: Room | null = null;
  let heartbeat = 0;
  /** Bumped by every join/leave so a slow, superseded join can tell it lost the race. */
  let epoch = 0;
  let accessGeneration = 0;
  /** This renderer is the view-only popout, not the call that owns the seat. */
  let viewer = false;
  const [popoutFor, setPopoutFor] = createSignal<string | null>(null);
  let popoutGeneration = 0;
  let pendingClose: { channelId: string; generation: number; finish: () => void } | null = null;
  const timedOutCloses: string[] = [];
  let popoutClosing: Promise<void> | null = null;
  let activeJoin: Promise<boolean> | null = null;
  let activeLeave: Promise<void> | null = null;
  let lastRequest: JoinRequest | null = null;
  /** Blur level currently running on the live camera track, so choosing it again does nothing. */
  let appliedEffect: CameraEffect = { kind: "blur", level: "off" };
  let backgroundProcessor: import("@livekit/track-processors").BackgroundProcessorWrapper | null = null;
  let backgroundUrl: string | null = null;
  const audioHost = document.createElement("div");
  audioHost.setAttribute("aria-hidden", "true");
  audioHost.style.display = "none";
  audioHost.dataset.callAudio = "";
  document.body.appendChild(audioHost);

  // --- snapshots ------------------------------------------------------------------------------

  function snapshot(): CallParticipant[] {
    if (!room || !lk) return [];
    const { Track: T } = lk;
    const everyone: LkParticipant[] = [room.localParticipant, ...room.remoteParticipants.values()].filter(
      (participant) => !(viewer && participant.isLocal),
    );
    return everyone.map((p) => {
      const camPub = p.getTrackPublication(T.Source.Camera);
      const micPub = p.getTrackPublication(T.Source.Microphone);
      const scrPub = p.getTrackPublication(T.Source.ScreenShare);
      const camLive = !!camPub?.track && !camPub.isMuted;
      return {
        id: p.identity,
        name: p.name || p.identity,
        isLocal: p.isLocal,
        camera: camLive ? camPub!.track! : null,
        screen: scrPub?.track ?? null,
        micOn: !!micPub && !micPub.isMuted,
        camOn: camLive,
        listener: p.permissions ? !p.permissions.canPublish : false,
      };
    });
  }

  const refresh = () => {
    setParticipants(snapshot());
    if (room) {
      setMicState(room.localParticipant.isMicrophoneEnabled);
      setCamState(room.localParticipant.isCameraEnabled);
      setScreenState(room.localParticipant.isScreenShareEnabled);
    }
  };

  // --- remote audio ---------------------------------------------------------------------------

  const applyOutput = (el: HTMLMediaElement) => {
    el.muted = deafened();
    const sink = resolveDevice("audiooutput", prefs.outId()).id;
    if (sink && "setSinkId" in el) void (el as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(sink).catch(() => undefined);
  };

  createEffect(() => {
    const quiet = deafened();
    audioHost.querySelectorAll("audio").forEach((el) => (el.muted = quiet));
  });

  function attachAudio(track: RemoteTrack) {
    const el = track.attach() as HTMLMediaElement;
    el.dataset.track = track.sid ?? "";
    applyOutput(el);
    audioHost.appendChild(el);
  }

  function detachAudio(track: RemoteTrack) {
    track.detach().forEach((el) => el.remove());
  }

  // --- hardware -------------------------------------------------------------------------------

  /** Stops everything this call opened on the machine: camera, microphone, and screen. */
  function releaseHardware() {
    const lp = room?.localParticipant;
    lp?.trackPublications.forEach((pub: LocalTrackPublication) => pub.track?.stop());
  }

  function teardown(): Promise<void> {
    window.clearInterval(heartbeat);
    heartbeat = 0;
    const closing = room;
    releaseHardware();
    backgroundProcessor = null;
    if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
    backgroundUrl = null;
    appliedEffect = { kind: "blur", level: "off" };
    room = null;
    let disconnected: Promise<void> = Promise.resolve();
    if (closing) {
      closing.removeAllListeners();
      disconnected = closing.disconnect(true).catch(() => undefined);
    }
    audioHost.replaceChildren();
    setParticipants([]);
    setSpeaking(new Set<string>());
    setMicState(false);
    setCamState(false);
    setScreenState(false);
    setStartedAt(null);
    setE2eeOn(false);
    setAudioBlocked(false);
    setBlurError(false);
    setDeafened(false);
    return disconnected;
  }

  const report = (flags: MediaFlags = {}) => {
    const id = channel()?.id;
    if (id) void voiceApi.reportMedia(id, flags).catch(() => undefined);
  };

  // --- blur -----------------------------------------------------------------------------------

  async function applyEffect(effect: CameraEffect) {
    if (!room || !lk || JSON.stringify(effect) === JSON.stringify(appliedEffect)) return;
    const pub = room.localParticipant.getTrackPublication(lk.Track.Source.Camera);
    const video = pub?.videoTrack;
    if (!video) return;
    try {
      setBlurError(false);
      if (effect.kind === "blur" && effect.level === "off") {
        await video.stopProcessor();
        backgroundProcessor = null;
        if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
        backgroundUrl = null;
        appliedEffect = effect;
        return;
      }
      const processors = await import("@livekit/track-processors");
      if (!processors.supportsBackgroundProcessors()) throw new Error("unsupported");
      const nextUrl = effect.kind === "background" ? URL.createObjectURL(await backgroundBlob(effect.backgroundId)) : null;
      const options: import("@livekit/track-processors").SwitchBackgroundProcessorOptions = effect.kind === "background"
        ? { mode: "virtual-background", imagePath: nextUrl! }
        : { mode: "background-blur", blurRadius: BLUR_RADIUS[effect.level as Exclude<BlurLevel, "off">] };
      try {
        if (backgroundProcessor) await backgroundProcessor.switchTo(options);
        else {
          const processor = processors.BackgroundProcessor(options);
          await video.setProcessor(processor);
          backgroundProcessor = processor;
        }
      } catch (error) {
        if (nextUrl) URL.revokeObjectURL(nextUrl);
        throw error;
      }
      if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
      backgroundUrl = nextUrl;
      appliedEffect = effect;
    } catch {
      setBlurError(true);
      prefs.setBlur("off");
      await video.stopProcessor().catch(() => undefined);
      backgroundProcessor = null;
      if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
      backgroundUrl = null;
      appliedEffect = { kind: "blur", level: "off" };
    }
  }

  // --- actions --------------------------------------------------------------------------------

  async function setMic(on: boolean) {
    if (!room || !canSpeak()) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(on);
    } catch {
      setNotice("micFailed");
    }
    refresh();
    report({ mic_on: room.localParticipant.isMicrophoneEnabled });
  }

  async function startCamera(): Promise<boolean> {
    if (!room) return false;
    const chosen = resolveDevice("videoinput", prefs.camId());
    try {
      await room.localParticipant.setCameraEnabled(true, chosen.id ? { deviceId: chosen.id } : undefined);
      appliedEffect = { kind: "blur", level: "off" }; // a freshly opened camera track has no effect yet
      backgroundProcessor = null;
      await applyEffect(prefs.effect());
      return true;
    } catch {
      setNotice("cameraFailed");
      return false;
    }
  }

  // Camera changes run one after the other. Switching on and off quickly otherwise overlaps a track that
  // is still opening with the request to close it, and the camera can stay on after the last "off".
  let cameraQueue: Promise<unknown> = Promise.resolve();
  const inCameraQueue = <R,>(task: () => Promise<R>): Promise<R> => {
    const run = cameraQueue.then(task, task);
    cameraQueue = run.catch(() => undefined);
    return run;
  };

  function setCam(on: boolean): Promise<void> {
    return inCameraQueue(async () => {
      if (!room || !canSpeak()) return;
      if (on) await startCamera();
      else {
        await applyEffect({ kind: "blur", level: "off" });
        await room.localParticipant.setCameraEnabled(false);
      }
      refresh();
      report({ cam_on: room.localParticipant.isCameraEnabled });
    });
  }

  async function setScreen(on: boolean): Promise<boolean> {
    if (!room || !canSpeak()) return false;
    try {
      await room.localParticipant.setScreenShareEnabled(on);
    } catch {
      /* the person dismissed the picker: nothing to report */
    }
    refresh();
    report({ screen_on: room.localParticipant.isScreenShareEnabled });
    return room.localParticipant.isScreenShareEnabled;
  }

  function setBlur(level: BlurLevel): Promise<void> {
    prefs.setBlur(level);
    return inCameraQueue(() => applyEffect({ kind: "blur", level }));
  }

  function setEffect(effect: CameraEffect): Promise<void> {
    prefs.setEffect(effect);
    return inCameraQueue(() => applyEffect(effect));
  }

  async function resumeAudio() {
    await room?.startAudio();
    setAudioBlocked(room ? !room.canPlaybackAudio : false);
  }

  async function leave() {
    if (activeLeave) return activeLeave;
    const leaving = leaveOnce();
    activeLeave = leaving;
    try {
      await leaving;
    } finally {
      if (activeLeave === leaving) activeLeave = null;
    }
  }

  async function leaveOnce() {
    epoch++;
    const left = channel();
    const wasActive = status() !== "idle";
    const wasViewer = viewer;
    const openPopout = popoutFor();
    viewer = false;
    const disconnected = teardown();
    setStatus("idle");
    setChannel(null);
    setProblem(null);
    if (!wasViewer && openPopout) {
      await closePopout();
    }
    await disconnected;
    if (left && wasActive && !wasViewer) await voiceApi.leave(left.id).catch(() => undefined);
  }

  async function watch(request: { channelId: string; serverId: string; e2ee: boolean }): Promise<boolean> {
    if (status() !== "idle") await leave();
    viewer = true;
    const mine = ++epoch;
    setProblem(null);
    setNotice(null);
    const target: Channel = {
      id: request.channelId,
      server_id: request.serverId,
      name: "",
      type: "voice_video",
      grid_slot_count: null,
      created_by_account_id: "",
      e2ee_enabled: request.e2ee,
      has_channel_key: true,
          has_active_webhook: false,
      visibility: "public",
      visible_to_new_members: true,
      dice_animations_enabled: false,
    };
    setChannel(target);
    setStatus("connecting");
    setCanSpeak(false);
    let step: "prepare" | "popoutToken" | "livekitConnect" = "prepare";
    try {
      console.debug("[call popout] prepare");
      const identity = session.identity();
      const carried = request.e2ee ? getServerKey(request.serverId) : undefined;
      const key = carried ?? (request.e2ee && identity ? ((await mediaKeyFor(target, identity)) ?? null) : null);
      if (request.e2ee && !key) {
        viewer = false;
        setStatus("idle");
        setChannel(null);
        setProblem("noKey");
        return false;
      }
      lk = await loadLiveKit();
      const options: ConstructorParameters<LiveKit["Room"]>[0] = { adaptiveStream: true, dynacast: true };
      let provider: InstanceType<LiveKit["ExternalE2EEKeyProvider"]> | null = null;
      if (key) {
        provider = new lk.ExternalE2EEKeyProvider();
        options.e2ee = { keyProvider: provider, worker: new Worker(new URL("livekit-client/e2ee-worker", import.meta.url), { type: "module" }) };
      }
      const next = new lk.Room(options);
      step = "popoutToken";
      console.debug("[call popout] request popout token");
      const granted = await voiceApi.popoutToken(request.channelId);
      console.debug("[call popout] popout token granted");
      if (mine !== epoch) return false;
      step = "prepare";
      room = next;
      wire(next, lk, mine);
      if (provider) {
        await provider.setKey(key!.buffer.slice(key!.byteOffset, key!.byteOffset + key!.byteLength) as ArrayBuffer);
        await next.setE2EEEnabled(true);
        setE2eeOn(true);
      }
      step = "livekitConnect";
      console.debug("[call popout] connect LiveKit");
      await next.connect(granted.url, granted.token);
      console.debug("[call popout] LiveKit connected");
      if (mine !== epoch) return false;
      if (mine !== epoch) return false;
      setStartedAt(Date.now());
      setStatus("live");
      setAudioBlocked(!next.canPlaybackAudio);
      refresh();
      return true;
    } catch (error) {
      console.warn("[call popout] failed", { step, errorType: error instanceof Error ? error.name : typeof error });
      if (mine === epoch) {
        teardown();
        viewer = false;
        setStatus("idle");
        setChannel(null);
        setProblem(step === "popoutToken" ? "popoutToken" : step === "livekitConnect" ? "livekitConnect" : "failed");
      }
      return false;
    }
  }

  async function openPopout(): Promise<void> {
    if (popoutClosing) await popoutClosing;
    const current = channel();
    const native = window.mesaNative;
    if (!current || !native) return;
    const serverKey = getServerKey(current.server_id);
    if (current.e2ee_enabled && !serverKey) {
      setNotice("popoutKey");
      return;
    }
    await native.openCallPopout({
      channelId: current.id,
      serverId: current.server_id,
      e2ee: current.e2ee_enabled,
      serverKey: serverKey ? b64(serverKey) : null,
    });
    popoutGeneration++;
    setPopoutFor(current.id);
  }

  function closePopout(): Promise<void> {
    if (popoutClosing) return popoutClosing;
    const closing = closePopoutOnce();
    popoutClosing = closing.finally(() => { popoutClosing = null; });
    return popoutClosing;
  }

  async function closePopoutOnce(): Promise<void> {
    const native = window.mesaNative;
    const channelId = popoutFor();
    if (!native || !channelId) return;
    const generation = popoutGeneration;
    const closed = new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        timedOutCloses.push(channelId);
        finish();
      }, 5_000);
      function finish() {
        window.clearTimeout(timer);
        if (pendingClose?.generation === generation) pendingClose = null;
        resolve();
      }
      pendingClose = { channelId, generation, finish };
    });
    try {
      await native.closeCallPopout();
    } finally {
      await closed;
      if (popoutGeneration === generation) setPopoutFor(null);
    }
  }

  /** The room dropped us without being asked (network gone, kicked, channel closed). */
  async function lost(why: CallProblem) {
    await leave();
    setProblem(why);
  }

  async function join(request: JoinRequest, { silent = false, valid = () => true }: { silent?: boolean; valid?: () => boolean } = {}): Promise<boolean> {
    // A superseded join must finish releasing its seat before the next channel reserves one.
    while (activeJoin) await activeJoin;
    if (!valid()) return false;
    const attempt = joinOnce(request, silent, valid);
    activeJoin = attempt;
    try {
      return await attempt;
    } finally {
      if (activeJoin === attempt) activeJoin = null;
    }
  }

  async function joinOnce(request: JoinRequest, silent: boolean, valid: () => boolean): Promise<boolean> {
    if (activeLeave) await activeLeave;
    if (!valid()) return false;
    if (status() !== "idle") await leave();
    if (!valid()) return false;
    const mine = ++epoch;
    lastRequest = request;
    const target = request.channel;
    const listening = request.mode === "listen";
    setProblem(null);
    setNotice(null);
    setChannel(target);
    setStatus("connecting");
    setCanSpeak(!listening);
    setDeafened(false);

    const wantE2ee = target.e2ee_enabled;
    const identity = session.identity();
    const key = wantE2ee && identity ? ((await mediaKeyFor(target, identity)) ?? null) : null;
    if (mine !== epoch) return false;
    if (wantE2ee && !key) {
      setStatus("idle");
      setChannel(null);
      setProblem("noKey");
      return false;
    }

    const wantMic = !listening && request.mic;
    const wantCam = !listening && request.cam;
    let reserved = false;
    try {
      lk = await loadLiveKit();
      await refreshDevices();
      const micDevice = resolveDevice("audioinput", prefs.micId());
      if (micDevice.missing) setNotice("deviceMissing");

      const options: ConstructorParameters<LiveKit["Room"]>[0] = {
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { noiseSuppression: true, ...(micDevice.id ? { deviceId: micDevice.id } : {}) },
      };
      let provider: InstanceType<LiveKit["ExternalE2EEKeyProvider"]> | null = null;
      if (key) {
        provider = new lk.ExternalE2EEKeyProvider();
        options.e2ee = { keyProvider: provider, worker: new Worker(new URL("livekit-client/e2ee-worker", import.meta.url), { type: "module" }) };
      }
      const next = new lk.Room(options);

      const joined = await voiceApi.join(target.id, { mic_on: wantMic, cam_on: wantCam });
      reserved = true;
      if (mine !== epoch) {
        await voiceApi.leave(target.id).catch(() => undefined);
        return false;
      }

      room = next;
      wire(next, lk, mine);
      if (provider) {
        await provider.setKey(key!.buffer.slice(key!.byteOffset, key!.byteOffset + key!.byteLength) as ArrayBuffer);
        await next.setE2EEEnabled(true);
        setE2eeOn(true);
      }
      await next.connect(joined.url, joined.token);
      if (mine !== epoch) return false;

      if (wantMic) {
        try {
          await next.localParticipant.setMicrophoneEnabled(true);
        } catch {
          setNotice("micFailed");
        }
      }
      if (wantCam) {
        await startCamera();
      }

      if (mine !== epoch) return false;
      setStartedAt(Date.now());
      setStatus("live");
      if (!viewer && !silent) notify("callJoin");
      setAudioBlocked(!next.canPlaybackAudio);
      refresh();
      report({ mic_on: next.localParticipant.isMicrophoneEnabled, cam_on: next.localParticipant.isCameraEnabled });
      heartbeat = window.setInterval(() => report(), HEARTBEAT_MS);
      return true;
    } catch (error) {
      if (mine === epoch) {
        const denied = typeof error === "object" && error !== null && "status" in error && ((error as { status: number }).status === 403 || (error as { status: number }).status === 401);
        teardown();
        setStatus("idle");
        setChannel(null);
        setProblem(denied ? "denied" : reserved ? "unavailable" : "failed");
      }
      if (reserved) await voiceApi.leave(target.id).catch(() => undefined);
      return false;
    }
  }

  function wire(next: Room, kit: LiveKit, mine: number) {
    const E = kit.RoomEvent;
    const alive = () => mine === epoch && room === next;
    const onChange = () => alive() && refresh();
    for (const name of [
      E.ParticipantConnected,
      E.ParticipantDisconnected,
      E.TrackPublished,
      E.TrackUnpublished,
      E.TrackMuted,
      E.TrackUnmuted,
      E.LocalTrackPublished,
      E.ParticipantNameChanged,
      E.ParticipantPermissionsChanged,
    ] as const) {
      next.on(name, onChange);
    }
    next.on(E.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication) => {
      if (!alive()) return;
      // The viewer room is picture only. Playing audio here would echo the speaker
      // and play everyone else a second time, on top of the main window.
      if (track.kind === kit.Track.Kind.Audio && !viewer) attachAudio(track);
      refresh();
    });
    next.on(E.TrackUnsubscribed, (track: RemoteTrack) => {
      if (!alive()) return;
      if (track.kind === kit.Track.Kind.Audio) detachAudio(track);
      refresh();
    });
    next.on(E.LocalTrackUnpublished, (pub: LocalTrackPublication) => {
      if (!alive()) return;
      // The browser's own "stop sharing" button ends the screen track without going through us.
      if (pub.source === kit.Track.Source.ScreenShare) report({ screen_on: false });
      refresh();
    });
    next.on(E.ActiveSpeakersChanged, (list: LkParticipant[]) => alive() && setSpeaking(new Set(list.map((p) => p.identity))));
    next.on(E.AudioPlaybackStatusChanged, () => alive() && setAudioBlocked(!next.canPlaybackAudio));
    next.on(E.Reconnecting, () => alive() && setStatus("reconnecting"));
    next.on(E.Reconnected, () => alive() && (setStatus("live"), refresh()));
    next.on(E.MediaDevicesError, () => alive() && setNotice("cameraFailed"));
    next.on(E.EncryptionError, () => alive() && setNotice("encryption"));
    next.on(E.Disconnected, () => {
      if (alive()) void lost("kicked");
    });
  }

  // --- reacting to the rest of the app --------------------------------------------------------

  async function refreshAccess() {
    const current = channel();
    if (!current || viewer) return;
    const generation = ++accessGeneration;
    const callEpoch = epoch;
    const fresh = await channelsApi.get(current.id).catch(() => null);
    if (generation !== accessGeneration || callEpoch !== epoch || channel()?.id !== current.id) return;
    if (!fresh) return;
    const allowed = fresh.my_permission === "speak" && lastRequest?.mode !== "listen";
    setCanSpeak(allowed);
    if (!allowed && room) {
      const local = room.localParticipant;
      await Promise.allSettled([
        local.setMicrophoneEnabled(false),
        local.setCameraEnabled(false),
        local.setScreenShareEnabled(false),
      ]);
      if (generation !== accessGeneration || callEpoch !== epoch) return;
      refresh();
      report({ mic_on: false, cam_on: false, screen_on: false });
    }
  }

  /** `channel.e2ee_changed`: the room cannot switch encryption in place, so rejoin with the new setting. */
  async function onE2eeChanged(channelId: string, enabled: boolean) {
    const current = channel();
    if (!current || current.id !== channelId || current.e2ee_enabled === enabled || !lastRequest) return;
    const request: JoinRequest = {
      ...lastRequest,
      channel: { ...current, e2ee_enabled: enabled },
      mic: mic(),
      cam: cam(),
    };
    await join(request, { silent: true });
  }

  /** Feeds shell realtime events: the channel or server of the call being deleted ends the call. */
  function onRealtime(message: RealtimeEnvelope) {
    const current = channel();
    if (!current) return;
    if (message.event === "channel.deleted" && message.payload.channel_id === current.id) void lost("kicked");
    if (message.event === "server.deleted" && (message.server_id ?? message.payload.server_id) === current.server_id) void lost("kicked");
    if (message.event === "member.removed" && message.payload.account_id === session.account()?.id) void lost("kicked");
    if (message.event === "channel.e2ee_changed" && message.payload.channel_id === current.id) {
      void onE2eeChanged(current.id, message.payload.e2ee_enabled === true);
    }
    const server = message.server_id ?? message.payload.server_id;
    if (server === current.server_id && (
      message.event === "role.changed" ||
      message.event === "member_role.changed" ||
      message.event === "member.removed" ||
      (message.event === "channel_acl.changed" && message.payload.channel_id === current.id)
    )) void refreshAccess();
  }

  // Closing the tab must free the seat: a keepalive leave plus a local disconnect.
  const onPageHide = () => {
    const current = channel();
    if (current && status() !== "idle" && !viewer) voiceApi.leaveOnUnload(current.id);
    teardown();
  };
  if (window.mesaNative && !location.pathname.startsWith("/call-popout") && !location.hash.includes("/call-popout/")) {
    onCleanup(window.mesaNative.onCallPopoutClosed((channelId) => {
      const timedOut = timedOutCloses.indexOf(channelId);
      if (timedOut !== -1) {
        timedOutCloses.splice(timedOut, 1);
        return;
      }
      if (pendingClose?.channelId === channelId) {
        const closing = pendingClose;
        closing.finish();
        if (popoutGeneration === closing.generation) setPopoutFor(null);
      } else if (popoutFor() === channelId) {
        setPopoutFor(null);
      }
    }));
  }
  window.addEventListener("pagehide", onPageHide);
  onCleanup(() => {
    window.removeEventListener("pagehide", onPageHide);
    teardown();
    audioHost.remove();
  });

  return {
    status,
    channel,
    channelId: () => channel()?.id ?? null,
    live: () => status() === "live" || status() === "reconnecting",
    startedAt,
    setStartedAt: (at: number | null) => setStartedAt(at),
    participants,
    speaking,
    problem,
    clearProblem: () => setProblem(null),
    notice,
    clearNotice: () => setNotice(null),
    mic,
    cam,
    screen,
    deafened,
    canSpeak,
    e2eeOn,
    audioBlocked,
    blurError,
    join,
    leave,
    watch,
    popoutFor,
    openPopout,
    closePopout,
    setMic,
    setCam,
    setScreen,
    setBlur,
    setEffect,
    toggleDeafened: () => setDeafened(!deafened()),
    resumeAudio,
    onRealtime,
    refreshAccess,
    /** Re-applies the saved output device to every playing remote track. */
    refreshOutput: () => audioHost.querySelectorAll("audio").forEach((el) => applyOutput(el)),
    devices,
  };
}

export type CallSession = ReturnType<typeof createCall>;

const Context = createContext<CallSession>();

export function CallProvider(props: {
  subscribe: (handler: (m: RealtimeEnvelope) => void) => () => void;
  resync?: Accessor<number>;
  watch?: { channelId: string; serverId: string; e2ee: boolean };
  children: JSX.Element;
}) {
  const call = createCall();
  const stop = props.subscribe((message) => call.onRealtime(message));
  createEffect(() => {
    if (props.resync?.()) void call.refreshAccess();
  });
  onMount(() => {
    if (props.watch) void call.watch(props.watch);
  });
  onCleanup(() => stop?.());
  return <Context.Provider value={call}>{props.children}</Context.Provider>;
}

export function useCall(): CallSession {
  const call = useContext(Context);
  if (!call) throw new Error("useCall outside CallProvider");
  return call;
}

/** The call's duration as m:ss or h:mm:ss, ticking once a second. */
export function createElapsed(since: Accessor<number | null>): Accessor<string> {
  const [now, setNow] = createSignal(Date.now());
  const timer = window.setInterval(() => setNow(Date.now()), 1000);
  onCleanup(() => window.clearInterval(timer));
  return () => {
    const from = since();
    if (from === null) return "0:00";
    const total = Math.max(0, Math.floor((now() - from) / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, "0");
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  };
}
