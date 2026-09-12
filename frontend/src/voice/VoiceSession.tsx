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
  leaveVoiceKeepalive,
  patchVoiceMedia,
  type Channel,
} from "../api/client";
import type { WsEnvelope } from "../api/ws";
import { readBlurMode } from "../blur/blurPreference";
import type { LiveSession } from "../video/liveClient";
import { attachRemote } from "../video/liveClient";
import { resumeMediaUnder } from "../lib/safeMedia";
import type {
  LocalVideoTrack,
  Participant,
  RemoteParticipant,
  RemoteTrack,
} from "livekit-client";
import { Track } from "livekit-client";
import { loadVoiceRuntime } from "./loadRuntime";
import { DEFAULT_CORNER, type Corner } from "./pipCorner";

export { formatCallDuration };
export type { Corner };
export { loadVoiceRuntime } from "./loadRuntime";
export type { VoiceRuntime } from "./loadRuntime";

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
  /** 088: remove remote screen/cam tracks from Grade maps when unsubscribed. */
  onTrackUnsubscribed?: (track: RemoteTrack, participant: Participant) => void;
  onParticipantDisconnected?: (participant: Participant) => void;
  /** 096: bank/Grade refresh when a remote joins (often before video). */
  onParticipantConnected?: (participant: Participant) => void;
  onLocalTrack: (el: HTMLMediaElement, kind: "video" | "audio") => void;
  onDisconnected: (reason?: unknown) => void;
};

export type VoiceSessionValue = {
  live: Accessor<boolean>;
  channelId: Accessor<string | null>;
  serverId: Accessor<string | null>;
  channelName: Accessor<string | null>;
  permission: Accessor<Channel["my_permission"] | null>;
  micOn: Accessor<boolean>;
  camOn: Accessor<boolean>;
  /** Local screen-share publication active (082). */
  screenOn: Accessor<boolean>;
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
  localScreenVideoEl: () => HTMLMediaElement | null;
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
  /** Screen share on/off (Grade UI gate is caller's responsibility). */
  toggleScreenShare: () => Promise<void>;
  setDeafened: (on: boolean) => Promise<void>;
  toggleDeafen: () => Promise<void>;
  consumeIntentionalLeave: () => boolean;
  dispatchTrack: (track: RemoteTrack, participant: Participant) => void;
  dispatchTrackUnsubscribed: (track: RemoteTrack, participant: Participant) => void;
  dispatchParticipantDisconnected: (participant: Participant) => void;
  dispatchParticipantConnected: (participant: Participant) => void;
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
  const [permission, setPermission] = createSignal<Channel["my_permission"] | null>(null);
  const [micOn, setMicOn] = createSignal(true);
  /** 081: preferred cam defaults off (JOIN without camera until panel toggled). */
  const [camOn, setCamOn] = createSignal(false);
  const [screenOn, setScreenOn] = createSignal(false);
  const [deafened, setDeafenedSignal] = createSignal(false);
  const [callStartedAt, setCallStartedAt] = createSignal<string | null>(null);
  const [now, setNow] = createSignal(Date.now());
  const [lastMode, setLastMode] = createSignal<"camera" | "audio" | "test">("camera");
  const [speakingAccountIds, setSpeakingAccountIds] = createSignal<ReadonlySet<string>>(new Set());
  const [pipCorner, setPipCorner] = createSignal<Corner>(DEFAULT_CORNER);

  let session: LiveSession | null = null;
  let localCamTrack: LocalVideoTrack | null = null;
  let localVideoEl: HTMLMediaElement | null = null;
  let screenTrackEndedHandler: ((this: MediaStreamTrack, ev: Event) => void) | null = null;
  let screenMediaTrack: MediaStreamTrack | null = null;
  let handlers: VoiceTrackHandlers | null = null;
  let heartbeat: number | undefined;
  let intentionalLeave = false;
  let pageHideBound = false;
  let detachSpeakers: (() => void) | null = null;
  let speakDebounce: number | undefined;
  let detachDeafenGuard: (() => void) | null = null;
  /** 096: session-owned remote mic sink (survives VoiceChannel unmount / PIP). */
  let remoteAudioHost: HTMLDivElement | null = null;
  const sessionRemoteAudio = new Set<RemoteTrack>();
  /** 097: reactive so Grade layout rebinds when local screen preview attaches. */
  const [localScreenVideoEl, setLocalScreenVideoEl] = createSignal<HTMLMediaElement | null>(null);

  function attachSessionRemoteAudio(track: RemoteTrack) {
    if (track.kind !== Track.Kind.Audio) return;
    sessionRemoteAudio.add(track);
    if (remoteAudioHost) {
      attachRemote(track, remoteAudioHost);
      if (!deafened()) resumeMediaUnder(remoteAudioHost);
    }
  }

  function detachSessionRemoteAudio(track: RemoteTrack) {
    sessionRemoteAudio.delete(track);
  }

  function clearSessionRemoteAudio() {
    sessionRemoteAudio.clear();
    if (remoteAudioHost) remoteAudioHost.replaceChildren();
  }

  function resumeSessionRemoteAudio() {
    resumeMediaUnder(remoteAudioHost);
  }

  function applyRemoteVolumes(volume: number) {
    const room = session?.room;
    if (!room) return;
    for (const p of room.remoteParticipants.values()) {
      (p as RemoteParticipant).setVolume(volume);
    }
  }

  function detachLiveDeafen() {
    detachDeafenGuard?.();
    detachDeafenGuard = null;
    if (session) applyRemoteVolumes(1);
  }

  async function attachDeafenGuard(liveSession: LiveSession) {
    const { RoomEvent } = await loadVoiceRuntime();
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

  async function cameraPublication() {
    const { Track } = await loadVoiceRuntime();
    const lp = session?.room.localParticipant;
    if (!lp) return undefined;
    for (const pub of lp.videoTrackPublications.values()) {
      if (pub.source === Track.Source.Camera) return pub;
    }
    return undefined;
  }

  function clearLocalScreenEl() {
    if (screenMediaTrack && screenTrackEndedHandler) {
      screenMediaTrack.removeEventListener("ended", screenTrackEndedHandler);
    }
    screenMediaTrack = null;
    screenTrackEndedHandler = null;
    const el = localScreenVideoEl();
    if (el) {
      try {
        el.remove();
      } catch {
        /* ignore */
      }
    }
    setLocalScreenVideoEl(null);
  }

  async function stopScreenShare() {
    clearLocalScreenEl();
    const id = channelId();
    if (session) {
      await session.room.localParticipant.setScreenShareEnabled(false).catch(() => undefined);
    }
    setScreenOn(false);
    if (id) await patchVoiceMedia(id, { screen_on: false }).catch(() => undefined);
  }

  async function toggleScreenShare() {
    if (permission() === "listen") return;
    if (!session || !live()) return;
    if (screenOn()) {
      await stopScreenShare();
      return;
    }
    try {
      await session.room.localParticipant.setScreenShareEnabled(true, {
        audio: true,
        contentHint: "detail",
      });
    } catch {
      // User cancelled picker or browser denied — no server start
      return;
    }
    const { Track } = await loadVoiceRuntime();
    const lp = session.room.localParticipant;
    for (const pub of lp.videoTrackPublications.values()) {
      if (pub.source !== Track.Source.ScreenShare || !pub.track) continue;
      const mt = pub.track.mediaStreamTrack;
      if (mt) {
        try {
          mt.contentHint = "detail";
        } catch {
          /* optional */
        }
        screenMediaTrack = mt;
        screenTrackEndedHandler = () => {
          void stopScreenShare();
        };
        mt.addEventListener("ended", screenTrackEndedHandler);
      }
      const el = pub.track.attach();
      setLocalScreenVideoEl(el);
      if (el instanceof HTMLVideoElement) {
        el.muted = true;
        el.autoplay = true;
        el.playsInline = true;
      }
    }
    setScreenOn(true);
    const id = channelId();
    if (id) await patchVoiceMedia(id, { screen_on: true }).catch(() => undefined);
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

  async function attachActiveSpeakers(liveSession: LiveSession) {
    const { RoomEvent } = await loadVoiceRuntime();
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
    detachLiveDeafen();
    setPipCorner(DEFAULT_CORNER);
    await stopScreenShare();
    const s = session;
    const cam = localCamTrack;
    session = null;
    localCamTrack = null;
    // 035: free hardware before abandoning LiveKit on channel move
    const { releaseLocalCapture } = await loadVoiceRuntime();
    await releaseLocalCapture({ localCamTrack: cam, session: s });
    localVideoEl = null;
    clearSessionRemoteAudio();
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
    // 080: keep mic/deafen session prefs after hangup (browser-session only)
    detachLiveDeafen();
    setPipCorner(DEFAULT_CORNER);
    await stopScreenShare();
    const s = session;
    const cam = localCamTrack;
    session = null;
    localCamTrack = null;
    // 035 FR-007: release local capture first; leave HTTP is best-effort after.
    const { releaseLocalCapture } = await loadVoiceRuntime();
    await releaseLocalCapture({ localCamTrack: cam, session: s });
    if (id) await leaveVoice(id).catch(() => undefined);
    localVideoEl = null;
    clearSessionRemoteAudio();
    setLive(false);
    setChannelId(null);
    setServerId(null);
    setChannelName(null);
    setPermission(null);
    setCallStartedAt(null);
    queueMicrotask(() => {
      intentionalLeave = false;
    });
  }

  async function setDeafened(on: boolean) {
    if (!live() || !session) {
      // 080: preferred deafen while idle (session memory)
      setDeafenedSignal(on);
      if (on) setMicOn(false);
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
    resumeSessionRemoteAudio();
  }

  async function toggleDeafen() {
    await setDeafened(!deafened());
  }

  async function toggleMic() {
    if (permission() === "listen") return;
    if (!session || !live()) {
      // 080: preferred mic while idle
      const next = !micOn();
      if (next && deafened()) setDeafenedSignal(false);
      setMicOn(next);
      return;
    }
    const next = !micOn();
    if (next && deafened()) {
      applyRemoteVolumes(1);
      setDeafenedSignal(false);
      resumeSessionRemoteAudio();
    }
    await session.room.localParticipant.setMicrophoneEnabled(next);
    await reportMedia(next, camOn());
  }

  /** 091: keep session preview canonical and notify VoiceChannel (join-equivalent). */
  function adoptLocalCamPreview(el: HTMLMediaElement) {
    localVideoEl = el;
    if (el instanceof HTMLVideoElement) {
      el.muted = true;
      el.autoplay = true;
      el.playsInline = true;
    }
    handlers?.onLocalTrack(el, "video");
  }

  async function toggleCam() {
    if (permission() === "listen") return;
    if (!session || !live()) {
      // 081: preferred camera while idle
      setCamOn(!camOn());
      return;
    }
    const runtime = await loadVoiceRuntime();
    const next = !camOn();
    if (!next) {
      await (await cameraPublication())?.mute();
      await reportMedia(micOn(), false);
      return;
    }
    let pub = await cameraPublication();
    if (!pub?.track) {
      try {
        await session.room.localParticipant.setCameraEnabled(true);
        pub = await cameraPublication();
        const track = pub?.track;
        if (track && track instanceof runtime.LocalVideoTrack) {
          localCamTrack = track;
          adoptLocalCamPreview(track.attach());
        }
      } catch {
        return;
      }
    }
    const mode = readBlurMode();
    const track =
      localCamTrack ??
      (pub?.track instanceof runtime.LocalVideoTrack ? pub.track : null);
    if (track && mode !== "off" && runtime.supportsCameraBlur()) {
      try {
        await runtime.applyBlurMode(track, mode);
      } catch {
        /* blur optional on panel path; leave camera off if gate fails */
        await (await cameraPublication())?.mute();
        return;
      }
    }
    // Re-attach if session lost the preview element (mid-call unmute / remount).
    if (!localVideoEl && track) {
      adoptLocalCamPreview(track.attach());
    } else if (localVideoEl) {
      adoptLocalCamPreview(localVideoEl);
    }
    await (await cameraPublication())?.unmute();
    await reportMedia(micOn(), true);
  }

  async function reportMedia(mic: boolean, cam: boolean) {
    setMicOn(mic);
    setCamOn(cam);
    const id = channelId();
    if (id) await patchVoiceMedia(id, { mic_on: mic, cam_on: cam }).catch(() => undefined);
  }

  /** Best-effort on tab close/refresh: keepalive leave first (087), then hangup. */
  function onPageHide() {
    const id = channelId();
    if (!id || !live()) return;
    leaveVoiceKeepalive(id);
    void hangup();
  }

  const value: VoiceSessionValue = {
    live,
    channelId,
    serverId,
    channelName,
    permission,
    micOn,
    camOn,
    screenOn,
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
    localScreenVideoEl,
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
      const preferDeafen = deafened();
      await loadVoiceRuntime();
      session = next;
      localCamTrack = camTrack;
      localVideoEl = videoEl;
      setLastMode(mode);
      setMicOn(mic);
      setCamOn(cam);
      setScreenOn(false);
      clearLocalScreenEl();
      setChannelId(channel.id);
      setServerId(channel.server_id);
      setChannelName(channel.name);
      setPermission(channel.my_permission ?? null);
      setLive(true);
      await attachActiveSpeakers(next);
      await attachDeafenGuard(next);
      startHeartbeat(channel.id);
      if (!mic) {
        await next.room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
      } else {
        // 096: ensure send path when preferred mic is on (publish or enable)
        await next.room.localParticipant.setMicrophoneEnabled(true).catch(() => undefined);
      }
      // 096: attach any remote audio already present in the room
      for (const p of next.room.remoteParticipants.values()) {
        for (const pub of p.trackPublications.values()) {
          const track = pub.track as RemoteTrack | undefined;
          if (track) attachSessionRemoteAudio(track);
        }
      }
      await patchVoiceMedia(channel.id, { mic_on: mic, cam_on: cam }).catch(() => undefined);
      if (preferDeafen) {
        await setDeafened(true);
      } else {
        resumeSessionRemoteAudio();
      }
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
      detachLiveDeafen();
      setPipCorner(DEFAULT_CORNER);
      await stopScreenShare();
      const id = channelId();
      const s = session;
      const cam = localCamTrack;
      session = null;
      localCamTrack = null;
      // Room may already be gone; still stop orphan GUM / blur (035).
      const { releaseLocalCapture } = await loadVoiceRuntime();
      await releaseLocalCapture({ localCamTrack: cam, session: s });
      localVideoEl = null;
      clearSessionRemoteAudio();
      setLive(false);
      if (id) await leaveVoice(id).catch(() => undefined);
      setChannelId(null);
      setServerId(null);
      setChannelName(null);
      setPermission(null);
      setCallStartedAt(null);
    },
    reportMedia,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    setDeafened,
    toggleDeafen,
    consumeIntentionalLeave: () => intentionalLeave,
    dispatchTrack: (track, participant) => {
      // 096: attach remote mic at session host before page handlers (PIP-safe)
      attachSessionRemoteAudio(track);
      handlers?.onTrack(track, participant);
    },
    dispatchTrackUnsubscribed: (track, participant) => {
      detachSessionRemoteAudio(track);
      handlers?.onTrackUnsubscribed?.(track, participant);
    },
    dispatchParticipantDisconnected: (participant) => {
      handlers?.onParticipantDisconnected?.(participant);
    },
    dispatchParticipantConnected: (participant) => {
      handlers?.onParticipantConnected?.(participant);
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

  return (
    <VoiceSessionContext.Provider value={value}>
      <div
        class="voice-audio-host voice-audio-host--session"
        aria-hidden="true"
        ref={(el) => {
          remoteAudioHost = el;
          for (const track of sessionRemoteAudio) {
            attachRemote(track, el);
          }
          if (!deafened()) resumeMediaUnder(el);
        }}
      />
      {props.children}
    </VoiceSessionContext.Provider>
  );
}

export function voiceDurationLabel(startedAt: string | null, nowMs: number): string | null {
  if (!startedAt) return null;
  return formatCallDuration(startedAt, nowMs);
}
