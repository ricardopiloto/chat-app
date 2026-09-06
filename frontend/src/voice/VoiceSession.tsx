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
import type { LiveSession } from "../video/liveClient";
import type { LocalVideoTrack } from "livekit-client";
import type { Participant, RemoteTrack } from "livekit-client";

export { formatCallDuration };

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
  callStartedAt: Accessor<string | null>;
  now: Accessor<number>;
  lastMode: Accessor<"camera" | "test">;
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
    mode: "camera" | "test";
    micOn: boolean;
    camOn: boolean;
    localCamTrack: LocalVideoTrack | null;
    localVideoEl: HTMLMediaElement | null;
  }) => Promise<void>;
  hangup: () => Promise<void>;
  disconnectLivekitOnly: () => Promise<void>;
  dropped: () => Promise<void>;
  reportMedia: (micOn: boolean, camOn: boolean) => Promise<void>;
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
  const [callStartedAt, setCallStartedAt] = createSignal<string | null>(null);
  const [now, setNow] = createSignal(Date.now());
  const [lastMode, setLastMode] = createSignal<"camera" | "test">("camera");

  let session: LiveSession | null = null;
  let localCamTrack: LocalVideoTrack | null = null;
  let localVideoEl: HTMLMediaElement | null = null;
  let handlers: VoiceTrackHandlers | null = null;
  let heartbeat: number | undefined;
  let intentionalLeave = false;
  let pageHideBound = false;

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
    const s = session;
    session = null;
    await s?.disconnect().catch(() => undefined);
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
    const s = session;
    session = null;
    if (id) await leaveVoice(id).catch(() => undefined);
    await s?.disconnect().catch(() => undefined);
    localCamTrack = null;
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
    callStartedAt,
    now,
    lastMode,
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
      setChannelId(channel.id);
      setServerId(channel.server_id);
      setChannelName(channel.name);
      setLive(true);
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
      const id = channelId();
      session = null;
      localCamTrack = null;
      localVideoEl = null;
      setLive(false);
      if (id) await leaveVoice(id).catch(() => undefined);
      setChannelId(null);
      setServerId(null);
      setChannelName(null);
      setCallStartedAt(null);
    },
    reportMedia: async (mic, cam) => {
      setMicOn(mic);
      setCamOn(cam);
      const id = channelId();
      if (id) await patchVoiceMedia(id, { mic_on: mic, cam_on: cam }).catch(() => undefined);
    },
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
    if (pageHideBound) window.removeEventListener("pagehide", onPageHide);
    if (session) void hangup();
  });

  return <VoiceSessionContext.Provider value={value}>{props.children}</VoiceSessionContext.Provider>;
}

export function voiceDurationLabel(startedAt: string | null, nowMs: number): string | null {
  if (!startedAt) return null;
  return formatCallDuration(startedAt, nowMs);
}
