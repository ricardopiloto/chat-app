# Quickstart: 079-chat-image-zoom

Validate image lightbox on text-channel message attachments. Needs authenticated app + channel with image send permission (or existing image messages).

## Prerequisites

- Frontend + backend running
- Account in a text channel; ability to attach images (or history already has attachments)
- Prefer ≥1 message with **2+ images** for gallery tests

## A — Open fit overlay (US1)

1. Open a text channel with an image attachment in history (or send one).
2. Click the inline image.
3. Confirm dark overlay; image large/sharp (full blob, not blurry thumb crop); if larger than viewport, fits without distortion; if smaller, not stretched to fill.

**Expect**: [image-lightbox-ui.md](./contracts/image-lightbox-ui.md) entry + fit rules.

## B — Zoom / pan (US1)

1. With overlay open on a sufficiently large image, zoom in (wheel or controls) and pan.
2. Zoom back out / reset to fit without closing.

**Expect**: FR-003a / SC-002a.

## C — Close (US2)

1. Close via **Escape**, then reopen and close via **backdrop**, then via **X**.
2. Confirm chat usable each time (composer/history).

**Expect**: Escape + backdrop + X.

## D — Multi-image gallery (US3)

1. Message with ≥2 images; open first.
2. Next → second image; zoom in; Next/Prev as available.
3. Confirm zoom resets on navigate; at first image Prev disabled/no-op; at last Next disabled/no-op; **no wrap**.

**Expect**: Same-message gallery, stop at ends, reset fit.

## E — Download (US4)

1. Overlay on a loaded image; use download/save control.
2. Confirm browser download (or save dialog) of the image file.
3. Optional: with forced error state, control disabled or fails without killing overlay unexpectedly.

**Expect**: FR-010 / SC-007.

## F — Out of scope smoke

1. Click avatar / server icon — must **not** open this lightbox.
2. Send/receive images with lightbox closed — no regression.

## G — Typecheck

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```
