// Image attachments: encrypted here before upload, decrypted here after download. The backend
// only ever stores and returns opaque bytes.
import { attachments as attachmentsApi } from "../api";
import { ATTACHMENT_MEDIA_TYPES, MAX_ATTACHMENT_BYTES } from "../api/limits";
import { decryptBytes, encryptBytes } from "../crypto/serverKey";

/** AES-GCM framing adds a 12-byte nonce and a 16-byte tag, and the backend limit applies to the result. */
const FRAMING_BYTES = 28;
export const MAX_PLAIN_BYTES = MAX_ATTACHMENT_BYTES - FRAMING_BYTES;

export type AttachmentProblem = "type" | "size";

export function checkAttachment(file: Pick<File, "type" | "size">): AttachmentProblem | undefined {
  if (!ATTACHMENT_MEDIA_TYPES.has(file.type)) return "type";
  return file.size > MAX_PLAIN_BYTES ? "size" : undefined;
}

export async function uploadAttachment(channelId: string, serverKey: Uint8Array, file: File): Promise<string> {
  const plain = new Uint8Array(await file.arrayBuffer());
  const sealed = await encryptBytes(serverKey, plain);
  const stored = await attachmentsApi.upload(channelId, sealed, file.type);
  return stored.id;
}

export interface ShownImage {
  url: string;
  mediaType: string;
  bytes: number;
  width: number;
  height: number;
}

const shown = new Map<string, Promise<ShownImage>>();

const measure = (url: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = url;
  });

/** Downloads, decrypts and caches one attachment as an object URL, so it is fetched once per session. */
export function showAttachment(attachmentId: string, serverKey: Uint8Array): Promise<ShownImage> {
  const known = shown.get(attachmentId);
  if (known) return known;
  const pending = (async () => {
    const { bytes, mediaType } = await attachmentsApi.download(attachmentId);
    if (!ATTACHMENT_MEDIA_TYPES.has(mediaType)) throw new Error("unsupported attachment type");
    const plain = await decryptBytes(serverKey, bytes);
    const url = URL.createObjectURL(new Blob([plain as BlobPart], { type: mediaType }));
    return { url, mediaType, bytes: plain.byteLength, ...(await measure(url)) };
  })();
  shown.set(attachmentId, pending);
  pending.catch(() => shown.delete(attachmentId));
  return pending;
}

const UNITS = ["B", "KB", "MB"] as const;

export function formatSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit === 0 ? value : value.toFixed(value >= 10 ? 0 : 1)} ${UNITS[unit]}`;
}
