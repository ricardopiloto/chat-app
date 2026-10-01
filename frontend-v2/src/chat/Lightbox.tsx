import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import { t } from "../i18n";

export type LightboxItem = { id: string; url: string; contentType: string };

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

/** Full-size attachment viewer: zoom, download, previous/next, close by Esc, button or backdrop. */
export function Lightbox(props: {
  open: boolean;
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = createSignal(0);
  const [zoom, setZoom] = createSignal(1);
  const [failed, setFailed] = createSignal(false);
  createEffect(() => {
    if (!props.open) return;
    setIndex(props.startIndex);
    setZoom(1);
    setFailed(false);
  });
  const item = () => props.items[index()];
  const go = (delta: number) => {
    const n = props.items.length;
    if (n < 2) return;
    setIndex((i) => (i + delta + n) % n);
    setZoom(1);
    setFailed(false);
  };
  const zoomBy = (factor: number) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "+" || e.key === "=") zoomBy(1.25);
      else if (e.key === "-") zoomBy(0.8);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });
  const extension = () =>
    (item()?.contentType.split("/")[1] ?? "png").replace("jpeg", "jpg");
  return (
    <Show when={props.open && item()}>
      <div
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={t("channel.lightboxTitle")}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("img, button, a"))
            props.onClose();
        }}
      >
        <div class="lightbox-bar">
          <button
            type="button"
            aria-label={t("channel.lightboxZoomOut")}
            onClick={() => zoomBy(0.8)}
          >
            −
          </button>
          <button
            type="button"
            aria-label={t("channel.lightboxReset")}
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom() * 100)}%
          </button>
          <button
            type="button"
            aria-label={t("channel.lightboxZoomIn")}
            onClick={() => zoomBy(1.25)}
          >
            +
          </button>
          <a
            class="lightbox-download"
            href={item()!.url}
            download={`image-${item()!.id.slice(0, 8)}.${extension()}`}
            aria-label={t("channel.lightboxDownload")}
          >
            ⬇
          </a>
          <button
            type="button"
            aria-label={t("channel.lightboxClose")}
            onClick={props.onClose}
          >
            ✕
          </button>
        </div>
        <Show when={props.items.length > 1}>
          <button
            type="button"
            class="lightbox-nav prev"
            aria-label={t("channel.lightboxPrev")}
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            class="lightbox-nav next"
            aria-label={t("channel.lightboxNext")}
            onClick={() => go(1)}
          >
            ›
          </button>
        </Show>
        <div class="lightbox-stage">
          <Show
            when={!failed()}
            fallback={
              <p class="lightbox-error">{t("channel.lightboxError")}</p>
            }
          >
            <img
              src={item()!.url}
              alt=""
              style={{ transform: `scale(${zoom()})` }}
              onError={() => setFailed(true)}
            />
          </Show>
        </div>
        <Show when={props.items.length > 1}>
          <p class="lightbox-count">
            {index() + 1} / {props.items.length}
          </p>
        </Show>
      </div>
    </Show>
  );
}
