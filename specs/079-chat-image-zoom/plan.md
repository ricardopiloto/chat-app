# Implementation Plan: Zoom de imagens no chat

**Branch**: `079-chat-image-zoom` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/079-chat-image-zoom/spec.md`

**Note**: `.specify/feature.json` → `specs/079-chat-image-zoom`. Clarifications: fit + zoom/pan; prev/next same message (no wrap); zoom reset on navigate; download control.

## Summary

Add a Discord/Teams/Slack-style **image lightbox** for **message attachment images** in text chat: click thumbnail → overlay with full client-available asset (already decrypted blob), initial **fit** (no upscale), then **zoom/pan**, **Escape / backdrop / X** to close, **prev/next** within the same message (stop at ends; reset zoom on change), and an explicit **download** control. FE-only — attachments are already full ciphertext→plaintext blobs in `MessageAttachments`; no new API.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); CSS in `mesa-theme.css`.

**Primary Dependencies**: `MessageAttachments.tsx`, `fetchAttachmentBlob` / decrypt (existing), `Channel.tsx` (host), i18n catalogs, optional Dialog/focus patterns from existing overlays.

**Storage**: N/A — uses in-memory blob object URLs already created for inline display.

**Testing**: `tsc --noEmit`; manual [quickstart.md](./quickstart.md). No backend contract tests required.

**Target Platform**: Browser — authenticated text channel history.

**Project Type**: Web UI overlay / lightbox.

**Performance Goals**: Overlay visible &lt;~1s when blob already loaded; loading/error states if needed; revoke URLs only as today (parent lifecycle).

**Constraints**: Image message attachments only (not avatars/server icons/link previews); E2EE — only what client can already decrypt/show; no wrap gallery; no new upload pipeline.

**Scale/Scope**: ~1 lightbox component + wire `MessageAttachments` + CSS + i18n; FE-only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contracts + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/079-chat-image-zoom/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── image-lightbox-ui.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/components/MessageAttachments.tsx  # click → open lightbox; cursor/button affordance
frontend/src/components/ImageLightbox.tsx       # NEW: overlay, fit/zoom/pan, nav, download, close
frontend/src/styles/mesa-theme.css              # lightbox + clickable attach styles
frontend/src/i18n/catalogs/en.ts                # lightbox strings
frontend/src/i18n/catalogs/pt-BR.ts             # lightbox strings
# Optional: tiny hook/helper for zoom transform math if kept out of component
```

**Structure Decision**: FE-only lightbox over existing decrypted attachment blobs; reuse `MessageAttachments` decoded list as gallery source for one message.

## Complexity Tracking

N/A
