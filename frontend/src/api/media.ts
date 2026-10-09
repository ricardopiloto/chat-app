// Avatars and server images. The web build puts the relative path straight into <img src>
// and lets the cookie travel with it. Native mode has no cookie, and an <img> cannot send
// Authorization, so those bytes are loaded through requestBytes and shown as a blob URL.
import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";
import { isNative } from "./instance";
import { MEDIA_TYPE_HEADER, requestBytes } from "./http";

type Slot = {
  refs: number;
  blobUrl?: string;
  failed: boolean;
  waiters: Set<(url: string | undefined) => void>;
};

const slots = new Map<string, Slot>();

function publish(slot: Slot): void {
  const url = slot.blobUrl;
  for (const waiter of slot.waiters) waiter(url);
}

async function load(key: string, slot: Slot): Promise<void> {
  try {
    const { bytes, headers } = await requestBytes(key);
    if (slot.refs === 0) {
      slots.delete(key);
      return;
    }
    const type = headers.get(MEDIA_TYPE_HEADER) ?? headers.get("content-type") ?? "application/octet-stream";
    slot.blobUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
    publish(slot);
  } catch {
    if (slot.refs === 0) {
      slots.delete(key);
      return;
    }
    slot.failed = true;
    publish(slot);
  }
}

function retain(key: string, onReady: (url: string | undefined) => void): () => void {
  let slot = slots.get(key);
  if (!slot) {
    slot = { refs: 0, failed: false, waiters: new Set() };
    slots.set(key, slot);
    void load(key, slot);
  }
  slot.refs += 1;
  slot.waiters.add(onReady);
  if (slot.blobUrl || slot.failed) onReady(slot.blobUrl);
  return () => {
    slot.refs -= 1;
    slot.waiters.delete(onReady);
    if (slot.refs > 0) return;
    if (slot.blobUrl) URL.revokeObjectURL(slot.blobUrl);
    if (slot.blobUrl || slot.failed) slots.delete(key);
  };
}

/**
 * Web: the same string `source` already returns, with no fetch.
 * Native: a cached blob URL for that address, dropped when the last caller lets go.
 */
export function useAuthedSrc(source: Accessor<string | undefined>): Accessor<string | undefined> {
  if (!isNative()) return source;
  const [src, setSrc] = createSignal<string | undefined>();
  createEffect(() => {
    const key = source();
    if (!key) {
      setSrc(undefined);
      return;
    }
    const release = retain(key, setSrc);
    onCleanup(release);
  });
  return src;
}
