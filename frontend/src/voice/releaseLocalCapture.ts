import type { LocalVideoTrack } from "livekit-client";
import { stopBlurProcessor } from "../video/backgroundBlur";
import type { LiveSession } from "../video/liveClient";

export type ReleaseLocalCaptureArgs = {
  localCamTrack?: LocalVideoTrack | null;
  /** Raw or LocalVideoTrack video (e.g. test canvas) when not in localCamTrack. */
  localVideo?: MediaStreamTrack | LocalVideoTrack | null;
  audioTracks?: Array<MediaStreamTrack | undefined | null>;
  /** If still connected, disable cam/mic then disconnect(true). */
  session?: LiveSession | null;
  /**
   * When false, only stop local MediaStreamTracks / blur — do not call
   * session.disconnect (caller will disconnect separately). Default true.
   */
  disconnectSession?: boolean;
};

function stopTrack(track: { stop: () => void } | null | undefined) {
  if (!track) return;
  try {
    track.stop();
  } catch {
    /* already stopped */
  }
}

/**
 * Idempotent release of local mic/camera capture (+ blur).
 * Safe to call twice; swallows per-step errors (035 / FR-005).
 */
export async function releaseLocalCapture(args: ReleaseLocalCaptureArgs = {}): Promise<void> {
  const {
    localCamTrack,
    localVideo,
    audioTracks,
    session,
    disconnectSession = true,
  } = args;

  if (localCamTrack) {
    await stopBlurProcessor(localCamTrack).catch(() => undefined);
    stopTrack(localCamTrack);
  } else if (localVideo) {
    stopTrack(localVideo);
  }

  for (const track of audioTracks ?? []) {
    if (!track) continue;
    try {
      if (track.readyState !== "ended") track.stop();
    } catch {
      /* ignore */
    }
  }

  if (session && disconnectSession) {
    // liveClient.disconnect: setCamera/MicEnabled(false) + room.disconnect(true)
    await session.disconnect().catch(() => undefined);
  } else if (session) {
    try {
      const lp = session.room.localParticipant;
      await Promise.allSettled([
        lp.setCameraEnabled(false),
        lp.setMicrophoneEnabled(false),
      ]);
    } catch {
      /* ignore */
    }
  }
}
