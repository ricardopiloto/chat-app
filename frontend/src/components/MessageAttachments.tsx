import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { fetchAttachmentBlob } from "../api/client";
import { decryptBytes } from "../crypto/serverKey";

type Props = {
  attachmentIds: string[];
  serverKey: Uint8Array | undefined;
};

type Decoded = { id: string; url: string; contentType: string };

export default function MessageAttachments(props: Props) {
  const [items, setItems] = createSignal<Decoded[]>([]);
  const [failed, setFailed] = createSignal(false);

  createEffect(() => {
    const ids = props.attachmentIds;
    const key = props.serverKey;
    let cancelled = false;
    const objectUrls: string[] = [];

    async function load() {
      setFailed(false);
      setItems([]);
      if (!key || !ids.length) return;
      const decoded: Decoded[] = [];
      for (const id of ids) {
        try {
          const { bytes, contentType } = await fetchAttachmentBlob(id);
          if (cancelled) return;
          const plain = await decryptBytes(key, bytes);
          const blob = new Blob([plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength) as ArrayBuffer], {
            type: contentType,
          });
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

  return (
    <div class="msg-attachments">
      <Show when={failed()}>
        <p class="muted msg-attach-error">Alguns anexos não puderam ser carregados.</p>
      </Show>
      <For each={items()}>
        {(a) => <img class="msg-attach-img" src={a.url} alt="" loading="lazy" />}
      </For>
    </div>
  );
}
