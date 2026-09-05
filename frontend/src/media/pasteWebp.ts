/** Paste → pending attachment helpers (010). */

export const WEBP_QUALITY = 0.82;

export type PasteClipboardResult = {
  images: File[];
  text: string;
};

/** Collect image files + optional plain text from a paste event. */
export function clipboardFilesFromPaste(
  data: DataTransfer | null | undefined,
): PasteClipboardResult {
  const images: File[] = [];
  let text = "";
  if (!data) return { images, text };

  if (typeof data.getData === "function" && data.types?.includes("text/plain")) {
    text = data.getData("text/plain") ?? "";
  }

  const items = data.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) images.push(f);
      }
    }
  }
  if (images.length === 0 && data.files?.length) {
    for (const f of Array.from(data.files)) {
      if (f.type.startsWith("image/")) images.push(f);
    }
  }
  return { images, text };
}

/**
 * True if GIF has more than one image descriptor (animated).
 * Lightweight block walk — no full decode.
 */
export function isAnimatedGif(bytes: Uint8Array): boolean {
  if (bytes.length < 13) return false;
  if (bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) return false;

  const packed = bytes[10] ?? 0;
  let i = 13;
  if (packed & 0x80) {
    i += 3 * (1 << ((packed & 0x07) + 1));
  }

  let frames = 0;
  while (i < bytes.length) {
    const b = bytes[i++] ?? 0;
    if (b === 0x3b) break;
    if (b === 0x21) {
      if (i >= bytes.length) break;
      i++; // label
      while (i < bytes.length) {
        const sz = bytes[i++] ?? 0;
        if (sz === 0) break;
        i += sz;
      }
    } else if (b === 0x2c) {
      frames++;
      if (frames > 1) return true;
      if (i + 9 > bytes.length) break;
      const localPacked = bytes[i + 8] ?? 0;
      i += 9;
      if (localPacked & 0x80) {
        i += 3 * (1 << ((localPacked & 0x07) + 1));
      }
      if (i >= bytes.length) break;
      i++; // LZW min code size
      while (i < bytes.length) {
        const sz = bytes[i++] ?? 0;
        if (sz === 0) break;
        i += sz;
      }
    } else {
      break;
    }
  }
  return false;
}

export async function staticImageToWebp(
  file: File,
  quality: number = WEBP_QUALITY,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível criar canvas para WebP.");
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", quality);
    });
    if (!blob || blob.size === 0) {
      throw new Error("Este browser não consegue gerar WebP.");
    }
    const base = file.name.replace(/\.[^.]+$/, "") || "paste";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

/** Static paste → WebP; animated GIF kept as GIF. */
export async function preparePastedImage(file: File): Promise<File> {
  const isGif =
    file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
  if (isGif) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (isAnimatedGif(bytes)) {
      return new File([bytes], file.name || "paste.gif", { type: "image/gif" });
    }
  }
  return staticImageToWebp(file);
}
