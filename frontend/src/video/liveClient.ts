import { Room, RoomEvent, Track, type LocalTrack, type RemoteTrack, type Participant } from "livekit-client";
import { ExternalE2EEKeyProvider } from "livekit-client";

export type LiveSession = {
  room: Room;
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
  track.addEventListener("ended", () => window.clearInterval(timer));
  return track;
}

export async function joinLiveRoom(opts: {
  url: string;
  token: string;
  serverKey: Uint8Array;
  localVideo?: MediaStreamTrack;
  localAudio?: MediaStreamTrack;
  onTrack: (track: RemoteTrack, participant: Participant) => void;
  onLocalTrack: (el: HTMLMediaElement, kind: "video" | "audio") => void;
  onDisconnected?: (reason?: unknown) => void;
}): Promise<LiveSession> {
  const keyProvider = new ExternalE2EEKeyProvider();
  await keyProvider.setKey(
    opts.serverKey.buffer.slice(
      opts.serverKey.byteOffset,
      opts.serverKey.byteOffset + opts.serverKey.byteLength,
    ) as ArrayBuffer,
  );
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
  await room.setE2EEEnabled(true);
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
    disconnect: async () => {
      await room.disconnect();
      worker.terminate();
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
}
