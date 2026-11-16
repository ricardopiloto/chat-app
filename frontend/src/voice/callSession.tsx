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
import { devices, prefs, refreshDevices, resolveDevice, SEGMENTATION_MODEL_ASSET_PATH, type BlurLevel, type CameraEffect } from "./devices";
import { backgroundBlob } from "./cameraBackgrounds";
import { volumeForHandle, setVolumeForHandle, VOLUME_DEFAULT } from "./participantVolume";
import { notify } from "../sound/effects";

export type CallStatus = "idle" | "connecting" | "live" | "reconnecting";
export type JoinMode = "full" | "listen";
export type CallProblem = "denied" | "noKey" | "unavailable" | "failed" | "popoutToken" | "livekitConnect" | "kicked";
/** LiveKit ordinal connection health for the local publishing participant (not ping/RTT). */
export type CallConnectionQuality = "excellent" | "good" | "poor" | "lost" | "unknown";

function mapConnectionQuality(value: string | undefined): CallConnectionQuality {
  switch (value) {
    case "excellent":
      return "excellent";
    case "good":
      return "good";
    case "poor":
      return "poor";
    case "lost":
      return "lost";
    default:
      return "unknown";
  }
}

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
/** Max wait for LiveKit disconnect, server leave, or a stuck join/leave guard. */
const CLEANUP_MS = 8_000;
const BLUR_RADIUS: Record<Exclude<BlurLevel, "off">, number> = { light: 8, strong: 22 };

/** Resolves when `promise` settles or `ms` elapses, whichever comes first. */
function withDeadline(promise: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    promise.finally(() => {
      window.clearTimeout(timer);
      finish();
    });
  });
}

type LiveKit = typeof import("livekit-client");

let livekitPromise: Promise<LiveKit> | null = null;
const loadLiveKit = () => (livekitPromise ??= import("livekit-client"));

/**
 * Mobile browser (not Electron). Soft-background policy applies only here: a short app switch may
 * fire visibility/pagehide without destroying the document. Desktop tab close still hard-leaves.
 */
function isMobileWeb(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (window.__MESA_NATIVE__ || window.mesaNative) return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ can report as Macintosh with touch.
  if (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform || ua)) return true;
  return false;
}

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
  const [screenAudio, setScreenAudioState] = createSignal(false);
  const [screenAudioPreference, setScreenAudioPreference] = createSignal(false);
  const [deafened, setDeafened] = createSignal(false);
  const [canSpeak, setCanSpeak] = createSignal(true);
  const [e2eeOn, setE2eeOn] = createSignal(false);
  const [audioBlocked, setAudioBlocked] = createSignal(false);
  const [blurError, setBlurError] = createSignal(false);
  const [localQuality, setLocalQuality] = createSignal<CallConnectionQuality>("unknown");

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
  /** After connect: baseline remotes then allow arrival sounds for new identities. */
  let armArrivalSounds: (() => void) | null = null;
  /** Mobile: call was backgrounded; keep room until Leave, hard unload, or document death. */
  let mobileSoftBackground = false;
  let mobileHiddenAt = 0;
  let recoveringFromBackground = false;
  /** Blur level currently running on the live camera track, so choosing it again does nothing. */
  let appliedEffect: CameraEffect = { kind: "blur", level: "off" };
  let backgroundProcessor: import("@livekit/track-processors").BackgroundProcessorWrapper | null = null;
  let backgroundUrl: string | null = null;
  const audioHost = document.createElement("div");
  audioHost.setAttribute("aria-hidden", "true");
  audioHost.style.display = "none";
  audioHost.dataset.callAudio = "";
  document.body.appendChild(audioHost);
  /** Boost graphs for elements that have been raised above 100% (MediaElementSource is one-shot). */
  type BoostGraph = { context: AudioContext; source: MediaElementAudioSourceNode; gain: GainNode };
  const boostByTrack = new Map<string, BoostGraph>();
  let sharedAudioContext: AudioContext | null = null;

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
      const local = room.localParticipant;
      setScreenState(Boolean(local.getTrackPublication(lk!.Track.Source.ScreenShare)?.track));
      setScreenAudioState(Boolean(local.getTrackPublication(lk!.Track.Source.ScreenShareAudio)?.track));
    }
  };

  // --- remote audio ---------------------------------------------------------------------------

  const applyOutput = (el: HTMLMediaElement) => {
    el.muted = deafened();
    const sink = resolveDevice("audiooutput", prefs.outId()).id;
    if (sink && "setSinkId" in el) void (el as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(sink).catch(() => undefined);
  };

  async function routeBoostContext(context: AudioContext): Promise<void> {
    const sink = resolveDevice("audiooutput", prefs.outId()).id;
    if (!sink || !("setSinkId" in context)) return;
    try {
      await (context as AudioContext & { setSinkId: (id: string) => Promise<void> }).setSinkId(sink);
    } catch {
      /* unsupported or device gone — boosted audio still plays on the default device */
    }
  }

  function clearBoost(trackSid: string): void {
    const graph = boostByTrack.get(trackSid);
    if (!graph) return;
    try {
      graph.source.disconnect();
      graph.gain.disconnect();
    } catch {
      /* already disconnected */
    }
    boostByTrack.delete(trackSid);
  }

  /** Apply 0–200% local volume. ≤100% uses element.volume until a boost graph already exists. */
  function applyElementVolume(el: HTMLMediaElement, percent: number): void {
    const trackSid = el.dataset.track ?? "";
    const clamped = Math.min(200, Math.max(0, Math.round(percent)));
    let graph = boostByTrack.get(trackSid);
    if (clamped <= 100 && !graph) {
      el.volume = clamped / 100;
      applyOutput(el);
      return;
    }
    // Once boosted, MediaElementAudioSourceNode owns the element for good — keep using gain.
    if (!graph) {
      const context = sharedAudioContext ?? new AudioContext();
      sharedAudioContext = context;
      const source = context.createMediaElementSource(el);
      const gain = context.createGain();
      source.connect(gain);
      gain.connect(context.destination);
      graph = { context, source, gain };
      boostByTrack.set(trackSid, graph);
      void routeBoostContext(context);
    }
    el.volume = 1;
    el.muted = deafened();
    graph.gain.gain.value = clamped / 100;
    void routeBoostContext(graph.context);
  }

  function applyVolumeForIdentity(identity: string, percent: number): void {
    audioHost.querySelectorAll("audio").forEach((node) => {
      const el = node as HTMLMediaElement;
      if (el.dataset.identity === identity) applyElementVolume(el, percent);
    });
  }

  createEffect(() => {
    const quiet = deafened();
    audioHost.querySelectorAll("audio").forEach((el) => (el.muted = quiet));
  });

  function attachAudio(track: RemoteTrack, identity: string) {
    const el = track.attach() as HTMLMediaElement;
    el.dataset.track = track.sid ?? "";
    el.dataset.identity = identity;
    applyOutput(el);
    // Handle may not be known yet; Tile reapplies the stored preference once the handle resolves.
    applyElementVolume(el, VOLUME_DEFAULT);
    audioHost.appendChild(el);
  }

  function detachAudio(track: RemoteTrack) {
    const sid = track.sid ?? "";
    if (sid) clearBoost(sid);
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
    armArrivalSounds = null;
    mobileSoftBackground = false;
    for (const sid of [...boostByTrack.keys()]) clearBoost(sid);
    audioHost.replaceChildren();
    setParticipants([]);
    setSpeaking(new Set<string>());
    setMicState(false);
    setCamState(false);
    setScreenState(false);
    setScreenAudioState(false);
    setStartedAt(null);
    setE2eeOn(false);
    setAudioBlocked(false);
    setBlurError(false);
    setDeafened(false);
    setLocalQuality("unknown");
    if (!closing) return Promise.resolve();
    closing.removeAllListeners();
    // Tracks/room are already released; bound the wait so a stalled disconnect cannot block rejoin.
    // Late completion is ignored — `room` no longer points at `closing`.
    return withDeadline(closing.disconnect(true).catch(() => undefined), CLEANUP_MS);
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
          const processor = processors.BackgroundProcessor({ ...options, assetPaths: { modelAssetPath: SEGMENTATION_MODEL_ASSET_PATH } });
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

  async function setScreen(on: boolean, audio = screenAudioPreference()): Promise<boolean> {
    if (!room || !canSpeak()) return false;
    try {
      if (on) setScreenAudioPreference(audio);
      await room.localParticipant.setScreenShareEnabled(on, on ? { audio } : undefined);
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
    if (activeLeave) {
      const pending = activeLeave;
      await withDeadline(pending, CLEANUP_MS);
      if (activeLeave === pending) {
        epoch++;
        activeLeave = null;
      }
      if (activeLeave) return activeLeave;
    }
    const leaving = leaveOnce();
    activeLeave = leaving;
    try {
      await leaving;
    } finally {
      if (activeLeave === leaving) activeLeave = null;
    }
  }

  async function leaveOnce() {
    const mine = ++epoch;
    const left = channel();
    const wasActive = status() !== "idle";
    const wasViewer = viewer;
    const openPopout = popoutFor();
    if (wasActive && !wasViewer) notify("callLeave");
    viewer = false;
    const disconnected = teardown();
    setStatus("idle");
    setChannel(null);
    setProblem(null);
    if (!wasViewer && openPopout && mine === epoch) {
      await closePopout();
    }
    await disconnected;
    if (mine !== epoch) return;
    if (left && wasActive && !wasViewer) {
      await withDeadline(voiceApi.leave(left.id).catch(() => undefined), CLEANUP_MS);
    }
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
      armArrivalSounds?.();
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
    // A superseded join must finish (or time out) before the next channel reserves a seat.
    while (activeJoin) {
      const pending = activeJoin;
      await withDeadline(pending, CLEANUP_MS);
      if (activeJoin === pending) {
        epoch++;
        activeJoin = null;
      }
    }
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
    if (activeLeave) {
      const pending = activeLeave;
      await withDeadline(pending, CLEANUP_MS);
      if (activeLeave === pending) {
        epoch++;
        activeLeave = null;
      }
    }
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
      armArrivalSounds?.();
      setStartedAt(Date.now());
      setStatus("live");
      if (!viewer) setLocalQuality(mapConnectionQuality(next.localParticipant.connectionQuality));
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
    // Remotes present at (or during) connect are baselined; only later identities sound.
    let announceArrivals = false;
    const seenRemotes = new Set<string>();
    armArrivalSounds = () => {
      for (const participant of next.remoteParticipants.values()) {
        seenRemotes.add(participant.identity);
      }
      announceArrivals = true;
    };
    next.on(E.ParticipantConnected, (participant: LkParticipant) => {
      if (!alive()) return;
      refresh();
      const id = participant.identity;
      if (!announceArrivals) {
        seenRemotes.add(id);
        return;
      }
      if (seenRemotes.has(id)) return;
      seenRemotes.add(id);
      // Owning window only; popout viewer stays silent. Deafen and non-live skip the effect.
      if (viewer || deafened() || status() !== "live") return;
      // Let Solid commit the refreshed participants() tile before the sound plays.
      queueMicrotask(() => {
        if (!alive() || viewer || deafened() || status() !== "live") return;
        if (!seenRemotes.has(id)) return;
        notify("callJoin");
      });
    });
    next.on(E.ParticipantDisconnected, (participant: LkParticipant) => {
      if (!alive()) return;
      refresh();
      const id = participant.identity;
      if (!seenRemotes.has(id)) return;
      seenRemotes.delete(id);
      if (viewer || deafened() || status() !== "live") return;
      queueMicrotask(() => {
        if (!alive() || viewer || deafened() || status() !== "live") return;
        if (seenRemotes.has(id)) return;
        notify("callLeave");
      });
    });
    for (const name of [
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
    next.on(E.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: LkParticipant) => {
      if (!alive()) return;
      // The viewer room is picture only. Playing audio here would echo the speaker
      // and play everyone else a second time, on top of the main window.
      if (track.kind === kit.Track.Kind.Audio && !viewer) attachAudio(track, participant.identity);
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
    next.on(E.ConnectionQualityChanged, (quality: string, participant: LkParticipant) => {
      if (!alive() || viewer || !participant.isLocal) return;
      setLocalQuality(mapConnectionQuality(quality));
    });
    next.on(E.Reconnecting, () => {
      if (!alive()) return;
      setStatus("reconnecting");
      // Do not keep a stale Excellent/Good while the link is unresolved.
      if (!viewer) setLocalQuality("unknown");
    });
    next.on(E.Reconnected, () => {
      if (!alive()) return;
      setStatus("live");
      if (!viewer) setLocalQuality(mapConnectionQuality(next.localParticipant.connectionQuality));
      refresh();
    });
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

  /**
   * After a mobile app switch, inspect the surviving room. Healthy connections stay; otherwise wait
   * briefly for LiveKit auto-reconnect, then silent rejoin in the same document. A discarded /
   * reloaded document never reaches here — join consent applies on the fresh page.
   */
  async function recoverAfterBackground(): Promise<void> {
    if (recoveringFromBackground || viewer) return;
    const active = room;
    if (!active || status() === "idle") return;
    recoveringFromBackground = true;
    const mine = epoch;
    const wantMic = mic();
    const wantCam = cam();
    try {
      setStatus("reconnecting");
      const kit = lk ?? (await loadLiveKit());
      if (mine !== epoch || room !== active) return;
      const { Connected, Disconnected } = kit.ConnectionState;
      const deadline = Date.now() + CLEANUP_MS;
      while (Date.now() < deadline && mine === epoch && room === active) {
        if (active.state === Connected || active.state === Disconnected) break;
        await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
      }
      if (mine !== epoch || room !== active) return;

      if (active.state === Connected) {
        await active.startAudio().catch(() => undefined);
        if (mine !== epoch || room !== active) return;
        setAudioBlocked(!active.canPlaybackAudio);
        try {
          if (wantMic && canSpeak() && !active.localParticipant.isMicrophoneEnabled) {
            await active.localParticipant.setMicrophoneEnabled(true);
          }
        } catch {
          setNotice("micFailed");
        }
        try {
          if (wantCam && canSpeak() && !active.localParticipant.isCameraEnabled) {
            await startCamera();
          }
        } catch {
          setNotice("cameraFailed");
        }
        if (mine !== epoch || room !== active) return;
        refresh();
        report({
          mic_on: active.localParticipant.isMicrophoneEnabled,
          cam_on: active.localParticipant.isCameraEnabled,
        });
        if (!heartbeat) heartbeat = window.setInterval(() => report(), HEARTBEAT_MS);
        setStatus("live");
        return;
      }

      if (lastRequest) {
        const ok = await join(
          { ...lastRequest, mic: wantMic, cam: wantCam },
          { silent: true },
        );
        if (!ok && status() === "idle") setProblem("unavailable");
        return;
      }
      setProblem("failed");
      setStatus("idle");
      setChannel(null);
    } finally {
      recoveringFromBackground = false;
    }
  }

  /**
   * Hard unload: free the seat and disconnect. Used for desktop tab close and any mobile pagehide
   * that is not a soft-background candidate. Explicit Leave still goes through leave()/teardown.
   */
  function hardUnloadLeave(): void {
    const current = channel();
    const wasActive = status() !== "idle";
    const wasViewer = viewer;
    epoch++;
    activeJoin = null;
    activeLeave = null;
    mobileSoftBackground = false;
    if (current && wasActive && !wasViewer) voiceApi.leaveOnUnload(current.id);
    setStatus("idle");
    setChannel(null);
    setProblem(null);
    viewer = false;
    void teardown();
  }

  const onVisibilityChange = () => {
    if (!isMobileWeb()) return;
    if (document.visibilityState === "hidden") {
      if (status() !== "idle" && !viewer) {
        mobileHiddenAt = Date.now();
        mobileSoftBackground = true;
      }
      return;
    }
    if (mobileSoftBackground) {
      mobileSoftBackground = false;
      void recoverAfterBackground();
    }
  };

  // Desktop: always hard-leave. Mobile: pagehide after a recent hide (or bfcache) keeps the room;
  // abandoned seats are bounded by backend OCCUPANT_STALE_SECS when heartbeats stop.
  const onPageHide = (event: PageTransitionEvent) => {
    if (isMobileWeb() && status() !== "idle" && !viewer) {
      const recentHidden = mobileHiddenAt > 0 && Date.now() - mobileHiddenAt < 5_000;
      const persisted = event.persisted === true;
      if (mobileSoftBackground || recentHidden || persisted) {
        mobileSoftBackground = true;
        return;
      }
    }
    hardUnloadLeave();
  };

  const onPageShow = (event: PageTransitionEvent) => {
    if (!isMobileWeb()) return;
    if (event.persisted || (status() !== "idle" && room)) {
      mobileSoftBackground = false;
      void recoverAfterBackground();
    }
  };

  const isCallPopoutRoute =
    location.pathname.startsWith("/call-popout") || location.hash.includes("/call-popout/");

  /** Authoritative control snapshot for the desktop popout (never touches the viewer room). */
  function publishPopoutOwnerState(): void {
    const native = window.mesaNative;
    const id = popoutFor();
    if (!native?.publishCallPopoutOwnerState || !id || viewer) return;
    native.publishCallPopoutOwnerState({
      channelId: id,
      live: status() === "live" || status() === "reconnecting",
      mic: mic(),
      cam: cam(),
      screen: screen(),
      deafened: deafened(),
      quality: localQuality(),
      canSpeak: canSpeak(),
      available: true,
    });
  }

  if (window.mesaNative && !isCallPopoutRoute) {
    createEffect(() => {
      const id = popoutFor();
      if (!id || viewer) return;
      status();
      mic();
      cam();
      screen();
      deafened();
      localQuality();
      canSpeak();
      channel();
      publishPopoutOwnerState();
    });

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

    onCleanup(window.mesaNative.onCallPopoutCommand((command) => {
      if (viewer) return;
      const openId = popoutFor();
      const currentId = channel()?.id;
      // Stale channel or a newer call: reject without mutating, then refresh what the popout sees.
      if (!openId || !currentId || command.channelId !== openId || command.channelId !== currentId) {
        publishPopoutOwnerState();
        return;
      }
      if (status() !== "live" && status() !== "reconnecting") {
        publishPopoutOwnerState();
        return;
      }
      switch (command.action) {
        case "setMic":
          if (canSpeak()) void setMic(command.value);
          else publishPopoutOwnerState();
          break;
        case "setCam":
          if (canSpeak()) void setCam(command.value);
          else publishPopoutOwnerState();
          break;
        case "setScreen":
          if (canSpeak()) void setScreen(command.value);
          else publishPopoutOwnerState();
          break;
        case "toggleDeafened":
          setDeafened(!deafened());
          break;
        case "leave":
          void leave();
          break;
      }
    }));

    onCleanup(window.mesaNative.onCallPopoutStateRequest((channelId) => {
      if (popoutFor() === channelId && !viewer) publishPopoutOwnerState();
    }));
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  onCleanup(() => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    // Soft mobile pagehide does not unmount CallProvider, so this path is for real unmount/unload.
    // A discarded hidden tab may never run it; OCCUPANT_STALE_SECS then clears occupancy.
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
    screenAudio,
    screenAudioPreference,
    setScreenAudioPreference,
    deafened,
    canSpeak,
    e2eeOn,
    audioBlocked,
    blurError,
    /** Local publishing quality only; null while idle or in the view-only popout. */
    connectionQuality: (): CallConnectionQuality | null => {
      if (viewer || status() === "idle") return null;
      return localQuality();
    },
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
    /** Re-applies the saved output device to every playing remote track (and boost graphs). */
    refreshOutput: () => {
      audioHost.querySelectorAll("audio").forEach((node) => {
        const el = node as HTMLMediaElement;
        const sid = el.dataset.track ?? "";
        const graph = boostByTrack.get(sid);
        if (graph) {
          el.muted = deafened();
          void routeBoostContext(graph.context);
        } else {
          applyOutput(el);
        }
      });
    },
    /** Local-only volume for a remote identity; persists by handle when provided. */
    remoteVolume: (handle: string) => volumeForHandle(handle),
    setRemoteVolume: (identity: string, handle: string, percent: number) => {
      if (!handle || viewer) return VOLUME_DEFAULT;
      const saved = setVolumeForHandle(handle, percent);
      applyVolumeForIdentity(identity, saved);
      return saved;
    },
    /** Apply the stored handle preference to a participant's current audio elements. */
    applyStoredRemoteVolume: (identity: string, handle: string) => {
      if (!handle || viewer) return;
      applyVolumeForIdentity(identity, volumeForHandle(handle));
    },
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
