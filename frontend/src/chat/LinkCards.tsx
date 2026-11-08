import { For, Show, createResource, createSignal } from "solid-js";
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
  const [playing, setPlaying] = createSignal(false);
  const secureImage = (preview: LinkPreview) => (preview.image_url?.startsWith("https://") ? preview.image_url : undefined);
  return (
    <Show when={preview()}>
      {(found) => (
        <Show when={found().kind === "embed" && found().embed_url} fallback={
          <Show when={found().kind === "video" && found().media_url} fallback={
            <a class="ch-link-card" href={props.url} target="_blank" rel="noopener noreferrer nofollow" title={t("txt.preview.open")}>
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
          }>
            <video class="ch-link-media" controls preload="metadata" src={found().media_url} />
          </Show>
        }>
          <Show when={playing()} fallback={
            <button type="button" class="ch-link-card ch-link-embed" onClick={() => setPlaying(true)} aria-label={`${t("txt.preview.play")}: ${found().title ?? found().provider ?? props.url}`}>
              <Show when={secureImage(found())}>{(src) => <img src={src()} alt="" loading="lazy" referrerpolicy="no-referrer" />}</Show>
              <span class="ch-link-text"><small>{found().provider ?? found().site_name ?? new URL(props.url).hostname} <Badge tone="neutral" mono icon="play_circle">{t("txt.preview.play")}</Badge></small><strong>{found().title ?? props.url}</strong><small>{t("txt.preview.clickToPlay")}</small></span>
              <Icon name="play_circle" />
            </button>
          }>
            <iframe class="ch-link-media" src={found().embed_url} title={found().title ?? found().provider ?? t("txt.preview.play")} sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" />
          </Show>
        </Show>
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
