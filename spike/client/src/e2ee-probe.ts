export type ProbeResult = {
  rtcRtpScriptTransform: boolean;
  createEncodedStreams: boolean;
};

export function probeEncodedTransform(): ProbeResult {
  const rtcRtpScriptTransform = typeof (globalThis as { RTCRtpScriptTransform?: unknown }).RTCRtpScriptTransform === "function";
  const proto = RTCRtpSender.prototype as RTCRtpSender & { createEncodedStreams?: unknown };
  const createEncodedStreams = typeof proto.createEncodedStreams === "function";
  return { rtcRtpScriptTransform, createEncodedStreams };
}
