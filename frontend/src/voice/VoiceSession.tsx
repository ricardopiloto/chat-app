import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
  type Accessor,
  type JSX,
  type Setter,
} from "solid-js";
import {
  api,
  formatCallDuration,
  leaveVoice,
  patchVoiceMedia,
  type Channel,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { readBlurMode } from "../blur/blurPreference";
import type { LiveSession } from "../video/liveClient";
import { applyBlurMode, supportsCameraBlur } from "../video/backgroundBlur";
import { releaseLocalCapture } from "./releaseLocalCapture";
import { DEFAULT_CORNER, type Corner } from "./pipCorner";
import {
  LocalVideoTrack,
  RoomEvent,
  Track,
  type Participant,
  type RemoteParticipant,
  type RemoteTrack,
} from "livekit-client";

export { formatCallDuration };
export type { Corner };

/** True when connected and the current route is the active voice channel (stage). */
export function viewingActiveVoiceStage(
  routeChannelId: string | undefined | null,
  voice: { live: Accessor<boolean>; channelId: Accessor<string | null> },
): boolean {
  const id = voice.channelId();
  return Boolean(voice.live() && id && routeChannelId === id);
}

export type VoiceTrackHandlers = {
  onTrack: (track: RemoteTrack, participant: Participant) => void;
  onLocalTrack: (el: HTMLMediaElement, kind: "video" | "audio") => void;
  onDisconnected: (reason?: unknown) => void;
};

export type VoiceSessionValue = {
  live: Accessor<boolean>;
  channelId: Accessor<string | null>;
  serverId: Accessor<string | null>;
  channelName: Accessor<string | null>;
  micOn: Accessor<boolean>;
  camOn: Accessor<boolean>;
  /** Client-only: silence remotes + force mic mute (039). */
  deafened: Accessor<boolean>;
  callStartedAt: Accessor<string | null>;
  now: Accessor<number>;
  lastMode: Accessor<"camera" | "audio" | "test">;
  /** LiveKit active speaker identities (= account ids). Empty when not in call. */
  speakingAccountIds: Accessor<ReadonlySet<string>>;
  /** Floating PiP corner while in call (session memory; resets on hangup). */
  pipCorner: Accessor<Corner>;
  setPipCorner: Setter<Corner>;
  session: () => LiveSession | null;
  localCamTrack: () => LocalVideoTrack | null;
  localVideoEl: () => HTMLMediaElement | null;
  setMicOn: Setter<boolean>;
  setCamOn: Setter<boolean>;
  setLocalCamTrack: (track: LocalVideoTrack | null) => void;
  setLocalVideoEl: (el: HTMLMediaElement | null) => void;
  setHandlers: (handlers: VoiceTrackHandlers | null) => void;
  bindLive: (opts: {
    session: LiveSession;
    channel: Channel;
    mode: "camera" | "audio" | "test";
    micOn: boolean;
    camOn: boolean;
    localCamTrack: LocalVideoTrack | null;
    localVideoEl: HTMLMediaElement | null;
  }) => Promise<void>;
  hangup: () => Promise<void>;
  disconnectLivekitOnly: () => Promise<void>;
  dropped: () => Promise<void>;
  reportMedia: (micOn: boolean, camOn: boolean) => Promise<void>;
  /** Shared mic toggle (clears deafen when unmuting). */
  toggleMic: () => Promise<void>;
  /** Shared camera on/off (+ blur preference when enabling). */
  toggleCam: () => Promise<void>;
  setDeafened: (on: boolean) => Promise<void>;
  toggleDeafen: () => Promise<void>;
  consumeIntentionalLeave: () => boolean;
  dispatchTrack: (track: RemoteTrack, participant: Participant) => void;
  dispatchLocalTrack: (el: HTMLMediaElement, kind: "video" | "audio") => void;
};

const VoiceSessionContext = createContext<VoiceSessionValue>();

export function useVoiceSession(): VoiceSessionValue {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) throw new Error("VoiceSessionProvider em falta");
  return ctx;
}

export function VoiceSessionProvider(props: {
  onWs: (handler: (msg: WsEnvelope) => void) => () => void;
  children: JSX.Element;
}) {
  const [live, setLive] = createSignal(false);
  const [channelId, setChannelId] = createSignal<string | null>(null);
  const [serverId, setServerId] = createSignal<string | null>(null);
  const [channelName, setChannelName] = createSignal<string | null>(null);
  const [micOn, setMicOn] = createSignal(true);
  const [camOn, setCamOn] = createSignal(true);
  const [deafened, setDeafenedSignal] = createSignal(false);
  const [callStartedAt, setCallStartedAt] = createSignal<string | null>(null);
  const [now, setNow] = createSignal(Date.now());
  const [lastMode, setLastMode] = createSignal<"camera" | "audio" | "test">("camera");
  const [speakingAccountIds, setSpeakingAccountIds] = createSignal<ReadonlySet<string>>(new Set());
  const [pipCorner, setPipCorner] = createSignal<Corner>(DEFAULT_CORNER);

  let session: LiveSession | null = null;
  let localCamTrack: LocalVideoTrack | null = null;
  let localVideoEl: HTMLMediaElement | null = null;
  let handlers: VoiceTrackHandlers | null = null;
  let heartbeat: number | undefined;
  let intentionalLeave = false;
  let pageHideBound = false;
  let detachSpeakers: (() => void) | null = null;
  let speakDebounce: number | undefined;
  let detachDeafenGuard: (() => void) | null = null;

  function applyRemoteVolumes(volume: number) {
    const room = session?.room;
    if (!room) return;
    for (const p of room.remoteParticipants.values()) {
      (p as RemoteParticipant).setVolume(volume);
    }
  }

  function clearDeafenState() {
    detachDeafenGuard?.();
    detachDeafenGuard = null;
    if (deafened()) applyRemoteVolumes(1);
    setDeafenedSignal(false);
  }

  function attachDeafenGuard(liveSession: LiveSession) {
    detachDeafenGuard?.();
    const room = liveSession.room;
    const onSubscribed = (
      _track: RemoteTrack,
      _publication: unknown,
      participant: RemoteParticipant,
    ) => {
      if (!deafened()) return;
      participant.setVolume(0);
    };
    room.on(RoomEvent.TrackSubscribed, onSubscribed);
    detachDeafenGuard = () => {
      room.off(RoomEvent.TrackSubscribed, onSubscribed);
    };
  }

  function cameraPublication() {
    const lp = session?.room.localParticipant;
    if (!lp) return undefined;
    for (const pub of lp.videoTrackPublications.values()) {
      if (pub.source === Track.Source.Camera) return pub;
    }
    return undefined;
  }

  createEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    onCleanup(() => window.clearInterval(t));
  });

  createEffect(() => {
    const off = props.onWs((msg) => {
      if (msg.event !== "voice.occupancy") return;
      const id = String(msg.payload.channel_id ?? "");
      if (!id || id !== channelId()) return;
      const started = msg.payload.call_started_at;
      setCallStartedAt(typeof started === "string" ? started : started == null ? null : String(started));
    });
    onCleanup(off);
  });

  function clearSpeaking() {
    if (speakDebounce !== undefined) {
      window.clearTimeout(speakDebounce);
      speakDebounce = undefined;
    }
    detachSpeakers?.();
    detachSpeakers = null;
    setSpeakingAccountIds(new Set<string>());
  }

  function attachActiveSpeakers(liveSession: LiveSession) {
    clearSpeaking();
    const room = liveSession.room;
    const onSpeakers = (participants: Participant[]) => {
      const next: Set<string> = new Set(
        participants.map((p) => String(p.identity)),
      );
      if (speakDebounce !== undefined) window.clearTimeout(speakDebounce);
      // Short debounce reduces aura flicker (033 R6).
      speakDebounce = window.setTimeout(() => {
        setSpeakingAccountIds(next);
        speakDebounce = undefined;
      }, 120);
    };
    room.on(RoomEvent.ActiveSpeakersChanged, onSpeakers);
    detachSpeakers = () => {
      room.off(RoomEvent.ActiveSpeakersChanged, onSpeakers);
    };
  }

  function stopHeartbeat() {
    if (heartbeat !== undefined) {
      window.clearInterval(heartbeat);
      heartbeat = undefined;
    }
  }

  function startHeartbeat(id: string) {
    stopHeartbeat();
    heartbeat = window.setInterval(() => {
      void patchVoiceMedia(id, {}).catch(() => undefined);
    }, 20_000);
  }

  async function refreshCallStarted(id: string, server: string) {
    try {
      const snap = await api<{
        channels: { channel_id: string; call_started_at: string | null }[];
      }>(`/api/servers/${server}/voice-occupancy`);
      const row = snap.channels.find((c) => c.channel_id === id);
      setCallStartedAt(row?.call_started_at ?? null);
    } catch {
      /* occupancy fetch is best-effort for the bar timer */
    }
  }

  async function disconnectLivekitOnly() {
    intentionalLeave = true;
    stopHeartbeat();
    clearSpeaking();
    clearDeafenState();
    setPipCorner(DEFAULT_CORNER);
    const s = session;
    const cam = localCamTrack;
    session = null;
    localCamTrack = null;
    // 035: free hardware before abandoning LiveKit on channel move
    await releaseLocalCapture({ localCamTrack: cam, session: s });
    localVideoEl = null;
    setLive(false);
    queueMicrotask(() => {
      intentionalLeave = false;
    });
  }

  async function hangup() {
    const id = channelId();
    intentionalLeave = true;
    stopHeartbeat();
    clearSpeaking();
    clearDeafenState();
    setPipCorner(DEFAULT_CORNER);
    const s = session;
    const cam = localCamTrack;
    session = null;
    localCamTrack = null;
    // 035 FR-007: release local capture first; leave HTTP is best-effort after.
    await releaseLocalCapture({ localCamTrack: cam, session: s });
    if (id) await leaveVoice(id).catch(() => undefined);
    localVideoEl = null;
    setLive(false);
    setChannelId(null);
    setServerId(null);
    setChannelName(null);
    setCallStartedAt(null);
    queueMicrotask(() => {
      intentionalLeave = false;
    });
  }

  async function setDeafened(on: boolean) {
    if (!live() || !session) {
      setDeafenedSignal(false);
      return;
    }
    if (on) {
      setDeafenedSignal(true);
      applyRemoteVolumes(0);
      if (micOn()) {
        await session.room.localParticipant.setMicrophoneEnabled(false);
        await reportMedia(false, camOn());
      }
      return;
    }
    applyRemoteVolumes(1);
    setDeafenedSignal(false);
  }

  async function toggleDeafen() {
    await setDeafened(!deafened());
  }

  async function toggleMic() {
    if (!session) return;
    const next = !micOn();
    if (next && deafened()) {
      applyRemoteVolumes(1);
      setDeafenedSignal(false);
    }
    await session.room.localParticipant.setMicrophoneEnabled(next);
    await reportMedia(next, camOn());
  }

  async function toggleCam() {
    if (!session) return;
    const next = !camOn();
    if (!next) {
      await cameraPublication()?.mute();
      await reportMedia(micOn(), false);
      return;
    }
    let pub = cameraPublication();
    if (!pub?.track) {
      try {
        await session.room.localParticipant.setCameraEnabled(true);
        pub = cameraPublication();
        const track = pub?.track;
        if (track && track instanceof LocalVideoTrack) {
          localCamTrack = track;
          const el = track.attach();
          localVideoEl = el;
          if (el instanceof HTMLVideoElement) {
            el.muted = true;
            el.autoplay = true;
            el.playsInline = true;
          }
        }
      } catch {
        return;
      }
    }
    const mode = readBlurMode();
    const track =
      localCamTrack ??
      (pub?.track instanceof LocalVideoTrack ? pub.track : null);
    if (track && mode !== "off" && supportsCameraBlur()) {
      try {
        await applyBlurMode(track, mode);
      } catch {
        /* blur optional on panel path; leave camera off if gate fails */
        await cameraPublication()?.mute();
        return;
      }
    }
    await cameraPublication()?.unmute();
    await reportMedia(micOn(), true);
  }

  async function reportMedia(mic: boolean, cam: boolean) {
    setMicOn(mic);
    setCamOn(cam);
    const id = channelId();
    if (id) await patchVoiceMedia(id, { mic_on: mic, cam_on: cam }).catch(() => undefined);
  }

  /** Best-effort on tab close; browsers may limit work (035 SC-006). */
  function onPageHide() {
    const id = channelId();
    if (!id || !live()) return;
    void hangup();
  }

  const value: VoiceSessionValue = {
    live,
    channelId,
    serverId,
    channelName,
    micOn,
    camOn,
    deafened,
    callStartedAt,
    now,
    lastMode,
    speakingAccountIds,
    pipCorner,
    setPipCorner,
    session: () => session,
    localCamTrack: () => localCamTrack,
    localVideoEl: () => localVideoEl,
    setMicOn,
    setCamOn,
    setLocalCamTrack: (track) => {
      localCamTrack = track;
    },
    setLocalVideoEl: (el) => {
      localVideoEl = el;
    },
    setHandlers: (next) => {
      handlers = next;
    },
    bindLive: async ({
      session: next,
      channel,
      mode,
      micOn: mic,
      camOn: cam,
      localCamTrack: camTrack,
      localVideoEl: videoEl,
    }) => {
      session = next;
      localCamTrack = camTrack;
      localVideoEl = videoEl;
      setLastMode(mode);
      setMicOn(mic);
      setCamOn(cam);
      setDeafenedSignal(false);
      setChannelId(channel.id);
      setServerId(channel.server_id);
      setChannelName(channel.name);
      setLive(true);
      attachActiveSpeakers(next);
      attachDeafenGuard(next);
      startHeartbeat(channel.id);
      await patchVoiceMedia(channel.id, { mic_on: mic, cam_on: cam }).catch(() => undefined);
      await refreshCallStarted(channel.id, channel.server_id);
      if (!pageHideBound) {
        window.addEventListener("pagehide", onPageHide);
        pageHideBound = true;
      }
    },
    hangup,
    disconnectLivekitOnly,
    dropped: async () => {
      if (intentionalLeave) return;
      stopHeartbeat();
      clearSpeaking();
      clearDeafenState();
      setPipCorner(DEFAULT_CORNER);
      const id = channelId();
      const s = session;
      const cam = localCamTrack;
      session = null;
      localCamTrack = null;
      // Room may already be gone; still stop orphan GUM / blur (035).
      await releaseLocalCapture({ localCamTrack: cam, session: s });
      localVideoEl = null;
      setLive(false);
      if (id) await leaveVoice(id).catch(() => undefined);
      setChannelId(null);
      setServerId(null);
      setChannelName(null);
      setCallStartedAt(null);
    },
    reportMedia,
    toggleMic,
    toggleCam,
    setDeafened,
    toggleDeafen,
    consumeIntentionalLeave: () => intentionalLeave,
    dispatchTrack: (track, participant) => {
      handlers?.onTrack(track, participant);
    },
    dispatchLocalTrack: (el, kind) => {
      handlers?.onLocalTrack(el, kind);
    },
  };

  onCleanup(() => {
    stopHeartbeat();
    clearSpeaking();
    if (pageHideBound) window.removeEventListener("pagehide", onPageHide);
    if (session) void hangup();
  });

  return <VoiceSessionContext.Provider value={value}>{props.children}</VoiceSessionContext.Provider>;
}

export function voiceDurationLabel(startedAt: string | null, nowMs: number): string | null {
  if (!startedAt) return null;
  return formatCallDuration(startedAt, nowMs);
}
