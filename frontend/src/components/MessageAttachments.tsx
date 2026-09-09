import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { fetchAttachmentBlob } from "../api/client";
import { decryptBytes } from "../crypto/serverKey";
import { t } from "../i18n";
import ImageLightbox, { type LightboxItem } from "./ImageLightbox";

type Props = {
  attachmentIds: string[];
  serverKey: Uint8Array | undefined;
};

type Decoded = LightboxItem;

export default function MessageAttachments(props: Props) {
  const [items, setItems] = createSignal<Decoded[]>([]);
  const [failed, setFailed] = createSignal(false);
  const [lightboxOpen, setLightboxOpen] = createSignal(false);
  const [lightboxIndex, setLightboxIndex] = createSignal(0);

  createEffect(() => {
    const ids = props.attachmentIds;
    const key = props.serverKey;
    let cancelled = false;
    const objectUrls: string[] = [];

    async function load() {
      setFailed(false);
      setItems([]);
      setLightboxOpen(false);
      if (!key || !ids.length) return;
      const decoded: Decoded[] = [];
      for (const id of ids) {
        try {
          const { bytes, contentType } = await fetchAttachmentBlob(id);
          if (cancelled) return;
          const plain = await decryptBytes(key, bytes);
          const blob = new Blob(
            [plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength) as ArrayBuffer],
            { type: contentType },
          );
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          decoded.push({ id, url, contentType });
        } catch {
          setFailed(true);
        }
      }
      if (!cancelled) setItems(decoded);
    }

    void load();
    onCleanup(() => {
      cancelled = true;
      for (const u of objectUrls) URL.revokeObjectURL(u);
    });
  });

  function openAt(id: string) {
    const list = items();
    const i = list.findIndex((a) => a.id === id);
    if (i < 0) return;
    setLightboxIndex(i);
    setLightboxOpen(true);
  }

  return (
    <div class="msg-attachments">
      <Show when={failed()}>
        <p class="muted msg-attach-error">{t("channel.attachLoadError")}</p>
      </Show>
      <For each={items()}>
        {(a) => (
          <button
            type="button"
            class="msg-attach-open"
            aria-label={t("channel.lightboxOpen")}
            onClick={() => openAt(a.id)}
          >
            <img class="msg-attach-img" src={a.url} alt="" loading="lazy" />
          </button>
        )}
      </For>
      <ImageLightbox
        open={lightboxOpen()}
        items={items()}
        startIndex={lightboxIndex()}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
