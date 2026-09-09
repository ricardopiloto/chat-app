# Research: 079-chat-image-zoom

## R1 — Full-resolution source without new API

**Decision**: Reuse the **same decrypted blob object URLs** already produced in `MessageAttachments` (`fetchAttachmentBlob` → `decryptBytes` → `URL.createObjectURL`). Lightbox shows that URL at natural/fit size — not a separate “thumb” asset (chat CSS already shrinks the `<img>`).

**Rationale**: Spec FR-002 / E2EE assumption — client already has the full plaintext image for inline display. No backend change; download can use the same blob URL.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Second GET with “original” query | No dual-resolution API today |
| Open `/api/attachments/...` in new tab | Ciphertext; breaks E2EE UX |
| Server-side signed CDN URLs | Out of architecture |

---

## R2 — Lightbox host and gallery scope

**Decision**: Open lightbox from `MessageAttachments` with `{ items: Decoded[], startIndex }`. Gallery = **that message’s** image list only. Parent `Channel.tsx` need not own global lightbox state unless Portal/z-index requires mounting at shell — prefer portal to `document.body` from the lightbox component.

**Rationale**: FR-007 — navigate only within the message. Keeps wiring local to attachments.

**Alternatives considered**: Channel-wide image playlist — out of scope. Global store — unnecessary for MVP.

---

## R3 — Fit, zoom, pan interaction

**Decision**:

1. On open / image change: compute **fit** scale = `min(1, viewportW/naturalW, viewportH/naturalH)` (no upscale beyond 1× on open).
2. Zoom in/out via wheel and/or +/- controls; clamp min = fit (or slightly below fit for “see all”), max = enough to inspect native pixels (e.g. up to `max(1, fit)` … `3–8×` natural or viewport-relative — pick a clear max in implement).
3. Pan when scaled content exceeds viewport (pointer drag); reset transform to fit on gallery navigate (FR-007).
4. Explicit “reset fit” control or double-click optional; at least zoom-out to fit (FR-003a).

**Rationale**: Clarification — fit on open + zoom/pan this release; reset on navigate.

**Alternatives considered**: CSS `object-fit` only without pan — insufficient for SC-002a. Third-party lightbox lib — avoid unless already in tree (prefer small Solid component).

---

## R4 — Close / a11y

**Decision**: Close on **Escape**, **backdrop click**, and visible **X**. Trap focus lightly (focus close or dialog root on open). Chat images: `button` wrapper or `role="button"` + keyboard Activate where feasible; `cursor: pointer`.

**Rationale**: FR-004–006.

---

## R5 — Download

**Decision**: Toolbar control that triggers download of the **current** blob: temporary `<a download href={blobUrl} download={filename}>` click, or `URL.createObjectURL` if needed. Filename: `mesa-image-{id}.{ext}` from `contentType` (jpeg/png/webp/gif). Disable while loading/error.

**Rationale**: FR-010; same plaintext blob as viewer.

**Alternatives considered**: “Open in new tab” only — rejected (clarify wants explicit download). Clipboard copy — out of scope.

---

## R6 — Prev/next ends

**Decision**: Disable or no-op prev on index 0 and next on last index; **no wrap**. Hide nav chrome entirely when `items.length === 1`.

**Rationale**: Clarification — stop at ends.

---

## R7 — Loading / error

**Decision**: If image `onError`, show muted error copy + keep close/download disabled. Opening uses already-loaded blobs when possible so loading is rare; if parent failed some attaches, only successful `Decoded` items enter the gallery.

**Rationale**: FR-009; matches current attach error banner pattern.
