import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { fetchAttachmentBlob } from "../api/client";
import { decryptBytes } from "../crypto/serverKey";
import { t } from "../i18n";
import { Lightbox, type LightboxItem } from "./Lightbox";

/** Downloads, decrypts locally and shows image attachments as thumbnails with a lightbox. */
export function Attachments(props: {
  attachmentIds: string[];
  serverKey: Uint8Array | undefined;
}) {
  const [items, setItems] = createSignal<LightboxItem[]>([]);
  const [failed, setFailed] = createSignal(false);
  const [open, setOpen] = createSignal(false);
  const [start, setStart] = createSignal(0);
  createEffect(() => {
    const ids = props.attachmentIds;
    const key = props.serverKey;
    let cancelled = false;
    const urls: string[] = [];
    setFailed(false);
    setItems([]);
    setOpen(false);
    void (async () => {
      if (!key || ids.length === 0) return;
      const decoded: LightboxItem[] = [];
      for (const id of ids) {
        try {
          const { bytes, contentType } = await fetchAttachmentBlob(id);
          const plain = await decryptBytes(key, bytes);
          if (cancelled) return;
          const url = URL.createObjectURL(
            new Blob([plain.slice().buffer], { type: contentType }),
          );
          urls.push(url);
          decoded.push({ id, url, contentType });
        } catch {
          setFailed(true);
        }
      }
      if (!cancelled) setItems(decoded);
    })();
    onCleanup(() => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    });
  });
  return (
    <div class="msg-attachments">
      <Show when={failed()}>
        <p class="muted">{t("channel.attachLoadError")}</p>
      </Show>
      <For each={items()}>
        {(a, i) => (
          <button
            type="button"
            class="msg-attach-open"
            aria-label={t("channel.lightboxOpen")}
            onClick={() => {
              setStart(i());
              setOpen(true);
            }}
          >
            <img class="msg-attach-img" src={a.url} alt="" loading="lazy" />
          </button>
        )}
      </For>
      <Lightbox
        open={open()}
        items={items()}
        startIndex={start()}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
