import {
  Room,
  RoomEvent,
  Track,
  type LocalTrack,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
import { attachVideo, clearSlot } from "./grid";

export type LogFn = (line: string) => void;

export function wireRoom(room: Room, localIdentity: string, log: LogFn): void {
  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
    if (track.kind !== Track.Kind.Video) return;
    const stream = new MediaStream([track.mediaStreamTrack]);
    attachVideo(participant.identity, stream);
    log(`subscribed video ${participant.identity}`);
  });
  room.on(RoomEvent.TrackUnsubscribed, (_track, _pub, participant) => {
    clearSlot(participant.identity);
    log(`unsubscribed ${participant.identity} — slot reserved`);
  });
  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    clearSlot(participant.identity);
    log(`left ${participant.identity} — slot reserved`);
  });
  room.on(RoomEvent.Disconnected, () => {
    clearSlot(localIdentity);
    log("disconnected");
  });
}

export async function publishLocal(
  room: Room,
  stream: MediaStream,
  identity: string,
): Promise<LocalTrack[]> {
  const tracks: LocalTrack[] = [];
  for (const media of stream.getTracks()) {
    const pub = await room.localParticipant.publishTrack(media);
    tracks.push(pub.track as LocalTrack);
  }
  const video = stream.getVideoTracks()[0];
  if (video) attachVideo(identity, new MediaStream([video]));
  return tracks;
}

export async function connectRoom(url: string, token: string): Promise<Room> {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  await room.connect(url, token);
  return room;
}
