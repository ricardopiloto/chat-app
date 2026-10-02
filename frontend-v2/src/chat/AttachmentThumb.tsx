import { Show, createResource } from "solid-js";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { formatSize, showAttachment } from "./attachments";

const EXTENSION: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export const attachmentFileName = (attachmentId: string, mediaType: string): string => `anexo-${attachmentId.slice(0, 8)}.${EXTENSION[mediaType] ?? "img"}`;

// One decrypted image in the thread: the picture, a zoom control, and a caption with its name,
// size and the note that it was encrypted before leaving the sender's device.
export function AttachmentThumb(props: { attachmentId: string; serverKey: Uint8Array | undefined; onOpen: () => void }) {
  const [image] = createResource(
    () => (props.serverKey ? props.attachmentId : undefined),
    (id) => showAttachment(id, props.serverKey!),
  );

  return (
    <figure class="ch-attachment">
      <Show
        when={image()}
        fallback={
          <div class="ch-attachment-wait" role="status">
            <Icon name={image.error ? "broken_image" : "lock_clock"} />
            <span>{image.error ? t("txt.attachment.failed") : t("txt.attachment.loading")}</span>
          </div>
        }
      >
        {(shown) => (
          <>
            <button type="button" class="ch-attachment-image" onClick={props.onOpen} aria-label={t("txt.attachment.zoom")}>
              <img src={shown().url} alt="" loading="lazy" />
              <span class="ch-attachment-chip"><Icon name="lock_open" />{t("txt.attachment.decrypted")}</span>
              <span class="ch-attachment-zoom"><Icon name="zoom_in" /></span>
            </button>
            <figcaption>
              <Icon name="image" />
              <span class="ch-attachment-meta">
                <strong>{attachmentFileName(props.attachmentId, shown().mediaType)}</strong>
                <small>{formatSize(shown().bytes)} · {t("txt.attachment.encrypted")}</small>
              </span>
              <a class="ch-icon-link" href={shown().url} download={attachmentFileName(props.attachmentId, shown().mediaType)} title={t("txt.attachment.download")} aria-label={t("txt.attachment.download")}>
                <Icon name="download" />
              </a>
            </figcaption>
          </>
        )}
      </Show>
    </figure>
  );
}
