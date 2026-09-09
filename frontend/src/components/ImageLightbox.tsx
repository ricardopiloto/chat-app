import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import IconClose from "./icons/IconClose";
import { IconChevronDown } from "./icons/IconChevron";
import { t } from "../i18n";

export type LightboxItem = {
  id: string;
  url: string;
  contentType: string;
};

type Props = {
  open: boolean;
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
};

function dialogMount(): Node {
  return document.querySelector(".app") ?? document.body;
}

function extForType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

const MIN_ZOOM_FACTOR = 1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.2;

export default function ImageLightbox(props: Props): JSX.Element {
  const [index, setIndex] = createSignal(0);
  const [natural, setNatural] = createSignal({ w: 0, h: 0 });
  const [viewport, setViewport] = createSignal({ w: 0, h: 0 });
  const [scale, setScale] = createSignal(1);
  const [pan, setPan] = createSignal({ x: 0, y: 0 });
  const [imgError, setImgError] = createSignal(false);
  const [imgReady, setImgReady] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);

  let stageRef: HTMLDivElement | undefined;
  let dragOrigin: { x: number; y: number; panX: number; panY: number } | null = null;

  const item = createMemo(() => props.items[index()] ?? null);
  const count = () => props.items.length;
  const canPrev = () => index() > 0;
  const canNext = () => index() < count() - 1;

  const fitScale = createMemo(() => {
    const { w, h } = natural();
    const { w: vw, h: vh } = viewport();
    if (w <= 0 || h <= 0 || vw <= 0 || vh <= 0) return 1;
    return Math.min(1, vw / w, vh / h);
  });

  const minScale = () => fitScale() * MIN_ZOOM_FACTOR;

  function measureStage() {
    if (!stageRef) return;
    const r = stageRef.getBoundingClientRect();
    setViewport({ w: Math.max(0, r.width), h: Math.max(0, r.height) });
  }

  function resetToFit() {
    setPan({ x: 0, y: 0 });
    setScale(fitScale());
  }

  function goTo(next: number) {
    if (next < 0 || next >= count()) return;
    setIndex(next);
    setImgError(false);
    setImgReady(false);
    setNatural({ w: 0, h: 0 });
    setPan({ x: 0, y: 0 });
    setScale(1);
  }

  function clampPan(next: { x: number; y: number }, s: number) {
    const { w, h } = natural();
    const { w: vw, h: vh } = viewport();
    const dw = Math.max(0, (w * s - vw) / 2);
    const dh = Math.max(0, (h * s - vh) / 2);
    return {
      x: Math.min(dw, Math.max(-dw, next.x)),
      y: Math.min(dh, Math.max(-dh, next.y)),
    };
  }

  function setZoom(nextScale: number, originX?: number, originY?: number) {
    const min = minScale();
    const clamped = Math.min(MAX_SCALE, Math.max(min, nextScale));
    const prev = scale();
    if (clamped === prev) {
      setScale(clamped);
      setPan((p) => clampPan(p, clamped));
      return;
    }
    const { w: vw, h: vh } = viewport();
    const ox = originX ?? vw / 2;
    const oy = originY ?? vh / 2;
    const p = pan();
    const ratio = clamped / prev;
    const nx = ox - (ox - p.x) * ratio;
    const ny = oy - (oy - p.y) * ratio;
    setScale(clamped);
    setPan(clampPan({ x: nx, y: ny }, clamped));
  }

  function zoomBy(factor: number) {
    setZoom(scale() * factor);
  }

  function downloadCurrent() {
    const cur = item();
    if (!cur || imgError() || !imgReady()) return;
    const a = document.createElement("a");
    a.href = cur.url;
    a.download = `mesa-image-${cur.id}.${extForType(cur.contentType)}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  createEffect(() => {
    if (!props.open) return;
    const start = Math.min(Math.max(0, props.startIndex), Math.max(0, props.items.length - 1));
    setIndex(start);
    setImgError(false);
    setImgReady(false);
    setNatural({ w: 0, h: 0 });
    setPan({ x: 0, y: 0 });
    setScale(1);
    queueMicrotask(() => measureStage());
  });

  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        props.onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (canPrev()) goTo(index() - 1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (canNext()) goTo(index() + 1);
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy(ZOOM_STEP);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy(1 / ZOOM_STEP);
        return;
      }
      if (e.key === "0") {
        e.preventDefault();
        resetToFit();
      }
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  createEffect(() => {
    if (!props.open) return;
    const onResize = () => {
      measureStage();
      const min = minScale();
      setScale((s) => {
        const next = Math.max(min, s);
        setPan((p) => clampPan(p, next));
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    onCleanup(() => window.removeEventListener("resize", onResize));
  });

  return (
    <Show when={props.open && props.items.length > 0}>
      <Portal mount={dialogMount()}>
        <div
          class="img-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("channel.lightboxTitle")}
        >
          <button
            type="button"
            class="img-lightbox-backdrop"
            aria-label={t("channel.lightboxClose")}
            onClick={() => props.onClose()}
          />
          <div class="img-lightbox-chrome">
            <div class="img-lightbox-toolbar">
              <button
                type="button"
                class="btn btn-secondary pane-icon-btn"
                disabled={!imgReady() || imgError()}
                aria-label={t("channel.lightboxZoomOut")}
                title={t("channel.lightboxZoomOut")}
                onClick={() => zoomBy(1 / ZOOM_STEP)}
              >
                −
              </button>
              <button
                type="button"
                class="btn btn-secondary pane-icon-btn"
                disabled={!imgReady() || imgError()}
                aria-label={t("channel.lightboxZoomIn")}
                title={t("channel.lightboxZoomIn")}
                onClick={() => zoomBy(ZOOM_STEP)}
              >
                +
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                disabled={!imgReady() || imgError()}
                onClick={() => resetToFit()}
              >
                {t("channel.lightboxReset")}
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                disabled={!imgReady() || imgError()}
                aria-label={t("channel.lightboxDownload")}
                title={t("channel.lightboxDownload")}
                onClick={() => downloadCurrent()}
              >
                {t("channel.lightboxDownload")}
              </button>
              <Show when={count() > 1}>
                <span class="img-lightbox-counter muted">
                  {index() + 1} / {count()}
                </span>
              </Show>
              <button
                type="button"
                class="btn btn-secondary pane-icon-btn img-lightbox-close"
                aria-label={t("channel.lightboxClose")}
                title={t("channel.lightboxClose")}
                onClick={() => props.onClose()}
              >
                <IconClose size={18} />
              </button>
            </div>

            <div class="img-lightbox-stage-wrap">
              <Show when={count() > 1}>
                <button
                  type="button"
                  class="btn btn-secondary pane-icon-btn img-lightbox-nav img-lightbox-prev"
                  disabled={!canPrev()}
                  aria-label={t("channel.lightboxPrev")}
                  title={t("channel.lightboxPrev")}
                  onClick={() => goTo(index() - 1)}
                >
                  <span class="img-lightbox-chevron-left">
                    <IconChevronDown size={20} />
                  </span>
                </button>
              </Show>

              <div
                class="img-lightbox-stage"
                ref={(el) => {
                  stageRef = el;
                  measureStage();
                }}
                onWheel={(e) => {
                  if (!imgReady() || imgError()) return;
                  e.preventDefault();
                  const rect = stageRef?.getBoundingClientRect();
                  const ox = rect ? e.clientX - rect.left : undefined;
                  const oy = rect ? e.clientY - rect.top : undefined;
                  setZoom(scale() * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP), ox, oy);
                }}
                onPointerDown={(e) => {
                  if (!imgReady() || imgError()) return;
                  if (scale() <= minScale() + 0.001) return;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setDragging(true);
                  dragOrigin = {
                    x: e.clientX,
                    y: e.clientY,
                    panX: pan().x,
                    panY: pan().y,
                  };
                }}
                onPointerMove={(e) => {
                  if (!dragging() || !dragOrigin) return;
                  const nx = dragOrigin.panX + (e.clientX - dragOrigin.x);
                  const ny = dragOrigin.panY + (e.clientY - dragOrigin.y);
                  setPan(clampPan({ x: nx, y: ny }, scale()));
                }}
                onPointerUp={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {
                    /* ignore */
                  }
                  setDragging(false);
                  dragOrigin = null;
                }}
                onPointerCancel={() => {
                  setDragging(false);
                  dragOrigin = null;
                }}
              >
                <Show when={imgError()}>
                  <p class="muted img-lightbox-error" role="alert">
                    {t("channel.lightboxError")}
                  </p>
                </Show>
                <Show when={item() && !imgError()}>
                  <img
                    class="img-lightbox-img"
                    classList={{ "is-dragging": dragging() }}
                    src={item()!.url}
                    alt=""
                    draggable={false}
                    style={{
                      transform: `translate(${pan().x}px, ${pan().y}px) scale(${scale()})`,
                      width: natural().w ? `${natural().w}px` : undefined,
                      height: natural().h ? `${natural().h}px` : undefined,
                    }}
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                      setImgReady(true);
                      setImgError(false);
                      queueMicrotask(() => {
                        measureStage();
                        setScale(fitScale());
                        setPan({ x: 0, y: 0 });
                      });
                    }}
                    onError={() => {
                      setImgError(true);
                      setImgReady(false);
                    }}
                  />
                </Show>
              </div>

              <Show when={count() > 1}>
                <button
                  type="button"
                  class="btn btn-secondary pane-icon-btn img-lightbox-nav img-lightbox-next"
                  disabled={!canNext()}
                  aria-label={t("channel.lightboxNext")}
                  title={t("channel.lightboxNext")}
                  onClick={() => goTo(index() + 1)}
                >
                  <span class="img-lightbox-chevron-right">
                    <IconChevronDown size={20} />
                  </span>
                </button>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
