import { For, Show, createEffect, createMemo, createResource, createSignal, on, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { formatSize, showAttachment, type ShownImage } from "./attachments";
import { attachmentFileName } from "./AttachmentThumb";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 6;
const STEP = 1.25;
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

function Thumb(props: { id: string; serverKey: Uint8Array; index: number; active: boolean; onPick: () => void }) {
  const [image] = createResource(() => props.id, (id) => showAttachment(id, props.serverKey));
  return (
    <button type="button" class="ch-lb-thumb" classList={{ active: props.active }} onClick={props.onPick} aria-current={props.active ? "true" : undefined}>
      <Show when={image()} fallback={<span class="ch-lb-thumb-empty"><Icon name="image" /></span>}>
        {(shown) => <img src={shown().url} alt="" />}
      </Show>
      <span>
        <strong>{attachmentFileName(props.id, image()?.mediaType ?? "")}</strong>
        <small>{image() ? formatSize(image()!.bytes) : ""}</small>
      </span>
    </button>
  );
}

// Full-screen viewer for the images of one message. Zoom with the buttons, +/- or the wheel; drag
// to move a zoomed image; arrows or the side buttons change image. It closes with Escape, the
// Close button, or a press on the dark area around the image.
export function Lightbox(props: { ids: string[]; start: number; serverKey: Uint8Array; onClose: () => void }) {
  const [index, setIndex] = createSignal(props.start);
  const [zoom, setZoom] = createSignal(1);
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });
  const [fitted, setFitted] = createSignal(true);
  const [dragging, setDragging] = createSignal(false);
  const current = () => props.ids[index()]!;
  const [shown] = createResource(current, (id) => showAttachment(id, props.serverKey));

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setFitted(true);
  };
  const zoomBy = (factor: number) => {
    setFitted(false);
    setZoom((z) => clampZoom(z * factor));
  };
  const go = (step: number) => setIndex((i) => (i + step + props.ids.length) % props.ids.length);
  createEffect(on(index, reset, { defer: true }));

  createEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onClose();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "+" || event.key === "=") zoomBy(STEP);
      else if (event.key === "-") zoomBy(1 / STEP);
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    onCleanup(() => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    });
  });

  let origin: { x: number; y: number; from: { x: number; y: number } } | undefined;
  const startDrag = (event: PointerEvent) => {
    if (zoom() <= 1 && fitted()) return;
    origin = { x: event.clientX, y: event.clientY, from: offset() };
    setDragging(true);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent) => {
    if (origin) setOffset({ x: origin.from.x + event.clientX - origin.x, y: origin.from.y + event.clientY - origin.y });
  };
  const endDrag = () => {
    origin = undefined;
    setDragging(false);
  };

  const meta = createMemo(() => {
    const image: ShownImage | undefined = shown();
    if (!image) return "";
    const size = image.width && image.height ? ` · ${image.width}×${image.height}` : "";
    return `${formatSize(image.bytes)}${size}`;
  });

  return (
    <Portal>
      <div class="ch-lightbox" role="dialog" aria-modal="true" aria-label={t("txt.lightbox.label")}>
        <header class="ch-lb-bar">
          <div class="ch-lb-meta">
            <Icon name="image" />
            <span class="ch-lb-verified"><Icon name="verified_user" />{t("txt.lightbox.verified")}</span>
            <span>{meta()}</span>
          </div>
          <div class="ch-lb-tools">
            <button type="button" onClick={() => zoomBy(1 / STEP)} aria-label={t("txt.lightbox.zoomOut")}><Icon name="zoom_out" /></button>
            <output>{Math.round(zoom() * 100)}%</output>
            <button type="button" onClick={() => zoomBy(STEP)} aria-label={t("txt.lightbox.zoomIn")}><Icon name="zoom_in" /></button>
            <button type="button" class="ch-lb-text" onClick={reset}><Icon name="fit_screen" />{t("txt.lightbox.fit")}</button>
            <button type="button" class="ch-lb-text" onClick={() => { setFitted(false); setZoom(1); setOffset({ x: 0, y: 0 }); }}>{t("txt.lightbox.actual")}</button>
            <span class="ch-lb-hint"><Icon name="pan_tool" />{t("txt.lightbox.drag")}</span>
          </div>
          <div class="ch-lb-actions">
            <Show when={shown()}>
              {(image) => (
                <a class="ch-lb-download" href={image().url} download={attachmentFileName(current(), image().mediaType)}>
                  <Icon name="download" />{t("txt.lightbox.download")}
                </a>
              )}
            </Show>
            <button type="button" class="ch-lb-close" onClick={props.onClose}>
              <Icon name="close" />{t("txt.lightbox.close")}<kbd>Esc</kbd>
            </button>
          </div>
        </header>

        <div class="ch-lb-stage" onPointerDown={(event) => event.target === event.currentTarget && props.onClose()} onWheel={(event) => { event.preventDefault(); zoomBy(event.deltaY < 0 ? STEP : 1 / STEP); }}>
          <Show when={props.ids.length > 1}>
            <button type="button" class="ch-lb-arrow prev" onClick={() => go(-1)} aria-label={t("txt.lightbox.prev")}><Icon name="chevron_left" /></button>
          </Show>
          <Show when={shown()} fallback={<span class="ch-lb-loading"><Icon name={shown.error ? "broken_image" : "lock_clock"} /></span>}>
            {(image) => (
              <img
                class="ch-lb-image"
                classList={{ dragging: dragging(), fitted: fitted() }}
                src={image().url}
                alt=""
                draggable={false}
                style={{ transform: `translate(${offset().x}px, ${offset().y}px) scale(${zoom()})` }}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDblClick={reset}
              />
            )}
          </Show>
          <Show when={props.ids.length > 1}>
            <button type="button" class="ch-lb-arrow next" onClick={() => go(1)} aria-label={t("txt.lightbox.next")}><Icon name="chevron_right" /></button>
          </Show>
        </div>

        <footer class="ch-lb-foot">
          <div class="ch-lb-strip" role="group" aria-label={t("txt.lightbox.thumbs")}>
            <span class="ch-lb-count">{t("txt.lightbox.count", { n: index() + 1, m: props.ids.length })}</span>
            <For each={props.ids}>{(id, at) => <Thumb id={id} serverKey={props.serverKey} index={at()} active={at() === index()} onPick={() => setIndex(at())} />}</For>
          </div>
          <p class="ch-lb-keys">
            <span class="ch-lb-keys-title"><Icon name="keyboard" />{t("txt.lightbox.shortcuts")}</span>
            <span><kbd>←</kbd><kbd>→</kbd>{t("txt.lightbox.keyNav")}</span>
            <span><kbd>{t("txt.lightbox.scroll")}</kbd>{t("txt.lightbox.or")}<kbd>+</kbd><kbd>-</kbd>{t("txt.lightbox.keyZoom")}</span>
            <span><kbd>{t("txt.lightbox.doubleClick")}</kbd>{t("txt.lightbox.keyReset")}</span>
            <span><kbd>Esc</kbd>{t("txt.lightbox.keyClose")}</span>
          </p>
        </footer>
      </div>
    </Portal>
  );
}
