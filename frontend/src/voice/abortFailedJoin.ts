import { leaveVoice } from "../api/client";
import type { LiveSession } from "../video/liveClient";
import { LocalVideoTrack } from "livekit-client";
import { releaseLocalCapture } from "./releaseLocalCapture";

export type AbortFailedJoinArgs = {
  channelId: string;
  /** True if POST .../voice/join already succeeded for this channel. */
  joined: boolean;
  /** LocalVideoTrack used for blur + stop; prefer this when present. */
  localCamTrack?: LocalVideoTrack | null;
  /** Any local video track (incl. test canvas / raw) to stop. */
  localVideo?: MediaStreamTrack | LocalVideoTrack | null;
  audioTracks?: Array<MediaStreamTrack | undefined | null>;
  /** Partial LiveKit session if connect/publish failed after room creation. */
  session?: LiveSession | null;
};

/**
 * Revert a failed voice join: release local capture, leave occupancy if joined.
 * Never binds live / never sets session live. Hardware cleanup via 035 helper.
 */
export async function abortFailedJoin(args: AbortFailedJoinArgs): Promise<void> {
  const { channelId, joined, localCamTrack, localVideo, audioTracks, session } = args;

  await releaseLocalCapture({
    localCamTrack,
    localVideo,
    audioTracks,
    session,
  });

  if (joined) {
    await leaveVoice(channelId).catch(() => undefined);
  }
}
