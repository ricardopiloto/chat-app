type LogFn = (line: string) => void;

export async function captureLocal(log: LogFn): Promise<MediaStream> {
  const gum = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
  if (!gum) {
    throw new Error(
      `getUserMedia indisponível (isSecureContext=${window.isSecureContext}, origin=${window.location.origin}). ` +
        `No celular abra o HTTPS da SPA (aceite o certificado) — http://IP não é origem segura.`,
    );
  }
  try {
    const stream = await gum({
      audio: true,
      video: { width: { ideal: 640 }, height: { ideal: 360 } },
    });
    log("getUserMedia ok");
    return stream;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`getUserMedia failed: ${message}`);
  }
}
