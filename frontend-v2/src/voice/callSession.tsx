// The call: one LiveKit room, exposed as reactive state.
//
// The provider lives at the app shell, above every screen, so a call outlives navigation: remote audio
// keeps playing and the floating player can show the same state. Screens never touch the room; they
// read `participants()` and call the actions. Video is declarative: each participant carries its tracks
// and a tile attaches a track to its own element (see `TrackVideo`), nothing is moved around the DOM.
import { createContext, createEffect, createSignal, onCleanup, useContext, type Accessor, type JSX } from "solid-js";
import type { Participant as LkParticipant, Room, RemoteTrack, Track, LocalTrackPublication, RemoteTrackPublication } from "livekit-client";
import { voice as voiceApi, type Channel, type MediaFlags, type RealtimeEnvelope } from "../api";
import { loadServerKey } from "../crypto/keyHandoff";
import { useSession } from "../session/session";
import type { Identity } from "../crypto/identity";
import { devices, prefs, refreshDevices, resolveDevice, type BlurLevel } from "./devices";
import { createTestPattern, type TestPattern } from "./testPattern";

export type CallStatus = "idle" | "connecting" | "live" | "reconnecting";
export type JoinMode = "full" | "listen" | "test";
export type CallProblem = "denied" | "noKey" | "unavailable" | "failed" | "kicked";

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
  let pattern: TestPattern | null = null;
  let heartbeat = 0;
  /** Bumped by every join/leave so a slow, superseded join can tell it lost the race. */
  let epoch = 0;
  let lastRequest: JoinRequest | null = null;
  /** Blur level currently running on the live camera track, so choosing it again does nothing. */
  let appliedBlur: BlurLevel = "off";
  const audioHost = document.createElement("div");
  audioHost.setAttribute("aria-hidden", "true");
  audioHost.style.display = "none";
  audioHost.dataset.callAudio = "";
  document.body.appendChild(audioHost);

  // --- snapshots ------------------------------------------------------------------------------

  function snapshot(): CallParticipant[] {
    if (!room || !lk) return [];
    const { Track: T } = lk;
    const everyone: LkParticipant[] = [room.localParticipant, ...room.remoteParticipants.values()];
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

  /** Stops everything this call opened on the machine: camera, microphone, screen, and the test pattern. */
  function releaseHardware() {
    pattern?.stop();
    pattern = null;
    const lp = room?.localParticipant;
    lp?.trackPublications.forEach((pub: LocalTrackPublication) => pub.track?.stop());
  }

  function teardown() {
    window.clearInterval(heartbeat);
    heartbeat = 0;
    const closing = room;
    releaseHardware();
    room = null;
    if (closing) {
      closing.removeAllListeners();
      void closing.disconnect(true);
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
  }

  const report = (flags: MediaFlags = {}) => {
    const id = channel()?.id;
    if (id) void voiceApi.reportMedia(id, flags).catch(() => undefined);
  };

  // --- blur -----------------------------------------------------------------------------------

  async function applyBlur(level: BlurLevel) {
    if (!room || !lk || level === appliedBlur) return;
    const pub = room.localParticipant.getTrackPublication(lk.Track.Source.Camera);
    const video = pub?.videoTrack;
    if (!video) return;
    try {
      setBlurError(false);
      if (level === "off") {
        await video.stopProcessor();
        appliedBlur = "off";
        return;
      }
      const processors = await import("@livekit/track-processors");
      if (!processors.supportsBackgroundProcessors()) throw new Error("unsupported");
      await video.setProcessor(processors.BackgroundBlur(BLUR_RADIUS[level]));
      appliedBlur = level;
    } catch {
      setBlurError(true);
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
      appliedBlur = "off"; // a freshly opened camera track has no effect yet
      await applyBlur(prefs.blur());
      return true;
    } catch {
      setNotice("cameraFailed");
      return false;
    }
  }

  async function setCam(on: boolean) {
    if (!room || !canSpeak()) return;
    if (on) await startCamera();
    else await room.localParticipant.setCameraEnabled(false);
    refresh();
    report({ cam_on: room.localParticipant.isCameraEnabled });
  }

  async function setScreen(on: boolean) {
    if (!room || !canSpeak()) return;
    try {
      await room.localParticipant.setScreenShareEnabled(on);
    } catch {
      /* the person dismissed the picker: nothing to report */
    }
    refresh();
    report({ screen_on: room.localParticipant.isScreenShareEnabled });
  }

  async function setBlur(level: BlurLevel) {
    prefs.setBlur(level);
    await applyBlur(level);
  }

  async function resumeAudio() {
    await room?.startAudio();
    setAudioBlocked(room ? !room.canPlaybackAudio : false);
  }

  async function leave() {
    epoch++;
    const left = channel();
    const wasActive = status() !== "idle";
    teardown();
    setStatus("idle");
    setChannel(null);
    setProblem(null);
    if (left && wasActive) await voiceApi.leave(left.id).catch(() => undefined);
  }

  /** The room dropped us without being asked (network gone, kicked, channel closed). */
  async function lost(why: CallProblem) {
    await leave();
    setProblem(why);
  }

  async function join(request: JoinRequest): Promise<boolean> {
    if (status() !== "idle") await leave();
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
        audioCaptureDefaults: micDevice.id ? { deviceId: micDevice.id } : undefined,
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
      if (request.mode === "test") {
        pattern = createTestPattern();
        await next.localParticipant.publishTrack(pattern.track, { source: lk.Track.Source.Camera, name: "test-pattern" });
      } else if (wantCam) {
        await startCamera();
      }

      setStartedAt(Date.now());
      setStatus("live");
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
      if (track.kind === kit.Track.Kind.Audio) attachAudio(track);
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
    await join(request);
  }

  /** Feeds shell realtime events: the channel or server of the call being deleted ends the call. */
  function onRealtime(message: RealtimeEnvelope) {
    const current = channel();
    if (!current) return;
    if (message.event === "channel.deleted" && message.payload.channel_id === current.id) void lost("kicked");
    if (message.event === "server.deleted" && (message.server_id ?? message.payload.server_id) === current.server_id) void lost("kicked");
    if (message.event === "channel.e2ee_changed" && message.payload.channel_id === current.id) {
      void onE2eeChanged(current.id, message.payload.e2ee_enabled === true);
    }
  }

  // Closing the tab must free the seat: a keepalive leave plus a local disconnect.
  const onPageHide = () => {
    const current = channel();
    if (current && status() !== "idle") voiceApi.leaveOnUnload(current.id);
    teardown();
  };
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
    setMic,
    setCam,
    setScreen,
    setBlur,
    toggleDeafened: () => setDeafened(!deafened()),
    resumeAudio,
    onRealtime,
    /** Re-applies the saved output device to every playing remote track. */
    refreshOutput: () => audioHost.querySelectorAll("audio").forEach((el) => applyOutput(el)),
    devices,
  };
}

export type CallSession = ReturnType<typeof createCall>;

const Context = createContext<CallSession>();

export function CallProvider(props: { subscribe: (handler: (m: RealtimeEnvelope) => void) => () => void; children: JSX.Element }) {
  const call = createCall();
  const stop = props.subscribe((message) => call.onRealtime(message));
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
