// A local, offline look at the chosen devices: a live microphone meter and a camera preview that can
// carry the same blur the call will use. Nothing here joins a call or touches the network. Streams are
// opened only when asked for and always stopped, so the hardware light goes off the moment a preview
// is switched off or its screen closes.
import { createSignal, onCleanup } from "solid-js";
import type { LocalVideoTrack } from "livekit-client";
import { meterStream, prefs, resolveDevice, refreshDevices, requestAccess, type BlurLevel, type LevelMeter } from "./devices";

const BLUR_RADIUS: Record<Exclude<BlurLevel, "off">, number> = { light: 8, strong: 22 };

export type PreviewProblem = "denied" | "unavailable" | null;

export function createPreview() {
  const [micOn, setMicOn] = createSignal(false);
  const [camOn, setCamOn] = createSignal(false);
  const [micProblem, setMicProblem] = createSignal<PreviewProblem>(null);
  const [camProblem, setCamProblem] = createSignal<PreviewProblem>(null);
  const [blurError, setBlurError] = createSignal(false);
  const [level, setLevel] = createSignal(0);

  let micStream: MediaStream | null = null;
  let camStream: MediaStream | null = null;
  let meter: LevelMeter | null = null;
  let meterFrame = 0;
  let video: HTMLVideoElement | null = null;
  let processed: { stop: () => void } | null = null;
  /** Bumped by every render and by stopping the camera, so a render that lost the race releases what it made. */
  let renderTicket = 0;
  /** Bumped on every change so a slow getUserMedia that lost the race closes its own stream. */
  let micTicket = 0;
  let camTicket = 0;

  const problemFor = (error: unknown): PreviewProblem =>
    error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError") ? "denied" : "unavailable";

  function stopMic() {
    micTicket++;
    cancelAnimationFrame(meterFrame);
    meter?.stop();
    meter = null;
    micStream?.getTracks().forEach((t) => t.stop());
    micStream = null;
    setLevel(0);
    setMicOn(false);
  }

  async function startMic() {
    stopMic();
    const ticket = ++micTicket;
    setMicProblem(null);
    try {
      await refreshDevices();
      const chosen = resolveDevice("audioinput", prefs.micId()).id;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: chosen ? { deviceId: { exact: chosen } } : true });
      if (ticket !== micTicket) return stream.getTracks().forEach((t) => t.stop());
      micStream = stream;
      meter = meterStream(stream);
      const follow = () => {
        setLevel(meter?.level() ?? 0);
        meterFrame = requestAnimationFrame(follow);
      };
      follow();
      setMicOn(true);
      void requestAccess(false);
    } catch (error) {
      setMicProblem(problemFor(error));
    }
  }

  function clearVideo() {
    processed?.stop();
    processed = null;
    if (video) video.srcObject = null;
  }

  function stopCam() {
    camTicket++;
    renderTicket++;
    clearVideo();
    camStream?.getTracks().forEach((t) => t.stop());
    camStream = null;
    setCamOn(false);
  }

  /** Puts the camera stream on the video element, through the blur processor when one is chosen. */
  async function render() {
    const ticket = ++renderTicket;
    clearVideo();
    if (!video || !camStream) return;
    const level = prefs.blur();
    setBlurError(false);
    if (level === "off") {
      video.srcObject = camStream;
      return;
    }
    // The blurred preview works on a copy of the camera track. A live copy keeps the camera open on
    // its own, so the copy is kept here and stopped explicitly whenever the preview is dropped.
    let copy: MediaStreamTrack | null = null;
    let blurred: LocalVideoTrack | null = null;
    const release = () => {
      blurred?.stop();
      copy?.stop();
      void blurred?.stopProcessor().catch(() => undefined);
    };
    try {
      const [{ LocalVideoTrack }, processors] = await Promise.all([import("livekit-client"), import("@livekit/track-processors")]);
      if (ticket !== renderTicket || !video || !camStream) return;
      if (!processors.supportsBackgroundProcessors()) throw new Error("unsupported");
      const source = camStream.getVideoTracks()[0];
      if (!source) throw new Error("no video track");
      copy = source.clone();
      blurred = new LocalVideoTrack(copy);
      await blurred.setProcessor(processors.BackgroundBlur(BLUR_RADIUS[level]));
      if (ticket !== renderTicket || !video || !camStream) return release();
      blurred.attach(video);
      processed = { stop: release };
    } catch {
      release();
      if (ticket !== renderTicket) return;
      setBlurError(true);
      if (video && camStream) video.srcObject = camStream;
    }
  }

  async function startCam() {
    stopCam();
    const ticket = ++camTicket;
    setCamProblem(null);
    try {
      await refreshDevices();
      const chosen = resolveDevice("videoinput", prefs.camId()).id;
      const stream = await navigator.mediaDevices.getUserMedia({ video: chosen ? { deviceId: { exact: chosen } } : true });
      if (ticket !== camTicket) return stream.getTracks().forEach((t) => t.stop());
      camStream = stream;
      setCamOn(true);
      await render();
      void requestAccess(false);
    } catch (error) {
      setCamProblem(problemFor(error));
    }
  }

  const stopAll = () => {
    stopMic();
    stopCam();
  };
  onCleanup(stopAll);

  return {
    micOn,
    camOn,
    micProblem,
    camProblem,
    blurError,
    level,
    /** Registers the <video> the camera preview draws into. */
    bindVideo: (el: HTMLVideoElement) => {
      video = el;
      void render();
    },
    toggleMic: () => (micOn() ? stopMic() : void startMic()),
    toggleCam: () => (camOn() ? stopCam() : void startCam()),
    startMic: () => void startMic(),
    startCam: () => void startCam(),
    /** Re-opens whatever is on, so a changed device or blur choice takes effect. */
    reapply: async () => {
      if (camOn()) await startCam();
      if (micOn()) await startMic();
    },
    rerenderBlur: () => void render(),
    stopAll,
  };
}

export type Preview = ReturnType<typeof createPreview>;
