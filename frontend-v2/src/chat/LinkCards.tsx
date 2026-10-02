import { For, Show, createResource } from "solid-js";
import { links as linksApi, type LinkPreview } from "../api";
import { Badge, Icon } from "../components/ui";
import { t } from "../i18n";
import { extractUrls } from "./logic/links";

const previews = new Map<string, Promise<LinkPreview | undefined>>();

/** Previews are asked for once per address and kept for the session. */
function previewOf(url: string): Promise<LinkPreview | undefined> {
  const known = previews.get(url);
  if (known) return known;
  const pending = linksApi.preview(url).then(
    (found) => (found.error ? undefined : found),
    () => undefined,
  );
  previews.set(url, pending);
  return pending;
}

function LinkCard(props: { url: string }) {
  const [preview] = createResource(() => props.url, previewOf);
  const secureImage = (preview: LinkPreview) => (preview.image_url?.startsWith("https://") ? preview.image_url : undefined);
  return (
    <Show when={preview()}>
      {(found) => (
        <a class="ch-link-card" href={props.url} target="_blank" rel="noopener noreferrer nofollow" title={t("preview.open")}>
          <Show when={secureImage(found())}>{(src) => <img src={src()} alt="" loading="lazy" referrerpolicy="no-referrer" />}</Show>
          <span class="ch-link-text">
            <small>
              {found().site_name ?? new URL(props.url).hostname}
              <Show when={found().kind === "video"}><Badge tone="neutral" mono icon="play_circle">{t("txt.preview.video")}</Badge></Show>
            </small>
            <strong>{found().title ?? props.url}</strong>
          </span>
          <Icon name="open_in_new" />
        </a>
      )}
    </Show>
  );
}

// Up to five previews under a message, fetched after the text was decrypted.
export function LinkCards(props: { text: string }) {
  return (
    <div class="ch-link-cards">
      <For each={extractUrls(props.text)}>{(url) => <LinkCard url={url} />}</For>
    </div>
  );
}
