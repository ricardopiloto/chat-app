import { Room, RoomEvent, Track, type LocalTrack, type LocalVideoTrack, type RemoteTrack, type Participant } from "livekit-client";
import { ExternalE2EEKeyProvider } from "livekit-client";

export type LiveSession = {
  room: Room;
  keyProvider: ExternalE2EEKeyProvider;
  setE2EEEnabled: (enabled: boolean) => Promise<void>;
  setChannelKey: (key: Uint8Array) => Promise<void>;
  disconnect: () => Promise<void>;
};

/** HTTPS da SPA não pode abrir ws://7880 (mixed content). O SDK acrescenta /rtc; o Vite faz proxy. */
export function browserLivekitUrl(issued: string): string {
  const mixed =
    location.port === "1420" || (location.protocol === "https:" && issued.startsWith("ws:"));
  if (mixed) {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${location.host}`;
  }
  return issued;
}

/** Padrão animado — não usa a webcam (teste com duas contas no mesmo PC). */
export function createTestVideoTrack(label: string): MediaStreamTrack {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d indisponível");
  let frame = 0;
  const timer = window.setInterval(() => {
    frame += 1;
    ctx.fillStyle = `hsl(${(frame * 2) % 360} 40% 18%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#eee";
    ctx.font = "32px sans-serif";
    ctx.fillText(label, 24, canvas.height / 2);
  }, 100);
  const stream = canvas.captureStream(10);
  const track = stream.getVideoTracks()[0];
  if (!track) throw new Error("sem faixa de vídeo de teste");
  track.addEventListener("ended", () => window.clearInterval(timer));
  return track;
}

async function applyKey(keyProvider: ExternalE2EEKeyProvider, key: Uint8Array) {
  await keyProvider.setKey(
    key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
  );
}

export async function joinLiveRoom(opts: {
  url: string;
  token: string;
  /** Media key: channel key when present, else server key (legacy). */
  mediaKey: Uint8Array;
  e2eeEnabled?: boolean;
  localVideo?: MediaStreamTrack | LocalVideoTrack;
  localAudio?: MediaStreamTrack;
  onTrack: (track: RemoteTrack, participant: Participant) => void;
  onLocalTrack: (el: HTMLMediaElement, kind: "video" | "audio") => void;
  onDisconnected?: (reason?: unknown) => void;
}): Promise<LiveSession> {
  const keyProvider = new ExternalE2EEKeyProvider();
  await applyKey(keyProvider, opts.mediaKey);
  const worker = new Worker(new URL("livekit-client/e2ee-worker", import.meta.url), {
    type: "module",
  });
  const room = new Room({
    dynacast: true,
    encryption: { keyProvider, worker },
  });
  room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
    opts.onTrack(track, participant);
  });
  if (opts.onDisconnected) {
    room.on(RoomEvent.Disconnected, (reason) => opts.onDisconnected?.(reason));
  }
  await room.connect(browserLivekitUrl(opts.url), opts.token);
  const e2eeOn = opts.e2eeEnabled !== false;
  await room.setE2EEEnabled(e2eeOn);
  if (opts.localVideo) {
    await room.localParticipant.publishTrack(opts.localVideo, { source: Track.Source.Camera });
  } else {
    await room.localParticipant.setCameraEnabled(true);
  }
  if (opts.localAudio) {
    await room.localParticipant.publishTrack(opts.localAudio, { source: Track.Source.Microphone });
  } else if (!opts.localVideo) {
    await room.localParticipant.setMicrophoneEnabled(true);
  }
  room.localParticipant.videoTrackPublications.forEach((pub) => {
    const track = pub.track as LocalTrack | undefined;
    if (!track) return;
    const el = track.attach();
    opts.onLocalTrack(el, "video");
  });
  return {
    room,
    keyProvider,
    setE2EEEnabled: async (enabled: boolean) => {
      await room.setE2EEEnabled(enabled);
    },
    setChannelKey: async (key: Uint8Array) => {
      await applyKey(keyProvider, key);
    },
    disconnect: async () => {
      try {
        const lp = room.localParticipant;
        await Promise.allSettled([
          lp.setCameraEnabled(false),
          lp.setMicrophoneEnabled(false),
        ]);
        // stopTracks=true; await full signaling close before killing E2EE worker
        await room.disconnect(true);
      } finally {
        worker.terminate();
      }
    },
  };
}

const attachedEls = new WeakMap<RemoteTrack, HTMLMediaElement>();

export function attachRemote(track: RemoteTrack, node: HTMLElement) {
  let el = attachedEls.get(track);
  if (!el) {
    el = track.attach();
    attachedEls.set(track, el);
    if (el instanceof HTMLVideoElement) {
      el.autoplay = true;
      el.playsInline = true;
    } else if (el instanceof HTMLAudioElement) {
      el.autoplay = true;
    }
  }
  if (track.kind === Track.Kind.Video) {
    if (el.parentElement !== node) node.replaceChildren(el);
  } else if (el.parentElement !== node) {
    node.appendChild(el);
  }
  void (el as HTMLMediaElement).play?.().catch(() => undefined);
}
