/**
 * Diagnostic only: XOR 0x5A on a loopback RTCPeerConnection.
 * Distinguishes "API missing" from "LiveKit worker broke". Not a go for E2EE.
 */
export async function xorLoopbackRoundTrip(): Promise<{ ok: boolean; detail: string }> {
  const Sender = RTCRtpSender.prototype as RTCRtpSender & {
    createEncodedStreams?: () => { readable: ReadableStream; writable: WritableStream };
  };
  const hasLegacy = typeof Sender.createEncodedStreams === "function";
  const Transform = (globalThis as { RTCRtpScriptTransform?: new (w: Worker) => unknown }).RTCRtpScriptTransform;
  const hasScript = typeof Transform === "function";

  if (!hasLegacy && !hasScript) {
    return { ok: false, detail: "neither createEncodedStreams nor RTCRtpScriptTransform exist" };
  }

  if (hasLegacy) {
    try {
      const a = new RTCPeerConnection();
      const b = new RTCPeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const sender = a.addTrack(stream.getAudioTracks()[0], stream);
      const { readable, writable } = Sender.createEncodedStreams!.call(sender);
      const xor = new TransformStream({
        transform(chunk, controller) {
          const frame = chunk as { data: ArrayBuffer };
          const view = new Uint8Array(frame.data);
          for (let i = 0; i < view.length; i++) view[i] ^= 0x5a;
          controller.enqueue(chunk);
        },
      });
      readable.pipeThrough(xor).pipeTo(writable).catch(() => undefined);
      stream.getTracks().forEach((t) => t.stop());
      a.close();
      b.close();
      return { ok: true, detail: "createEncodedStreams accepted an XOR TransformStream" };
    } catch (err) {
      return { ok: false, detail: `legacy XOR failed: ${err}` };
    }
  }

  try {
    const blob = new Blob(
      [
        `self.onrtctransform = (ev) => { ev.transformer.readable.pipeTo(ev.transformer.writable); };`,
      ],
      { type: "text/javascript" },
    );
    const worker = new Worker(URL.createObjectURL(blob));
    new Transform!(worker);
    worker.terminate();
    return { ok: true, detail: "RTCRtpScriptTransform constructed without throwing" };
  } catch (err) {
    return { ok: false, detail: `RTCRtpScriptTransform failed: ${err}` };
  }
}
