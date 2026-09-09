---
description: "Task list for 079-chat-image-zoom"
---

# Tasks: Zoom de imagens no chat

**Input**: Design documents from `/specs/079-chat-image-zoom/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–G + `tsc --noEmit`. No formal TDD / backend contracts (FE-only).

**Organization**: Setup → Foundational (i18n + shell component) → US1 open/fit/zoom → US2 close → US3 gallery → US4 download → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/{MessageAttachments,ImageLightbox}.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/i18n/catalogs/{en,pt-BR}.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and attach render path.

- [x] T001 Confirm `.specify/feature.json` → `specs/079-chat-image-zoom` and skim decrypt→blob `<img>` path in `frontend/src/components/MessageAttachments.tsx` against [research.md](./research.md) R1

**Checkpoint**: Understood full-blob URLs already available for lightbox.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: i18n keys + lightbox component scaffold — **blocks** story UI polish.

**⚠️ CRITICAL**: Complete before wiring open/close interactions that need labels.

- [x] T002 [P] Add lightbox i18n keys (close, download, next, prev, zoom, error, open image) in `frontend/src/i18n/catalogs/en.ts`
- [x] T003 [P] Mirror lightbox i18n keys in `frontend/src/i18n/catalogs/pt-BR.ts`
- [x] T004 Create `frontend/src/components/ImageLightbox.tsx` scaffold (props: `items`, `startIndex`, `onClose`; portal/overlay shell; empty stage) per [data-model.md](./data-model.md) and [contracts/image-lightbox-ui.md](./contracts/image-lightbox-ui.md)

**Checkpoint**: Component mounts; catalogs compile.

---

## Phase 3: User Story 1 - Abrir imagem + fit + zoom/pan (Priority: P1) 🎯 MVP

**Goal**: Click chat attachment → overlay with full blob, fit on open, zoom in/out + pan, reset to fit without closing.

**Independent Test**: [quickstart.md](./quickstart.md) A–B.

### Implementation for User Story 1

- [x] T005 [US1] Wire click/keyboard activate on attachment images in `frontend/src/components/MessageAttachments.tsx` to open `ImageLightbox` with that message’s decoded items + start index (pointer affordance)
- [x] T006 [US1] Implement initial **fit** rendering (no upscale beyond 1×; no distort) for current item in `frontend/src/components/ImageLightbox.tsx`
- [x] T007 [US1] Implement zoom in/out + pan when overflowing, and way to return to fit without closing, in `frontend/src/components/ImageLightbox.tsx` (FR-003a)
- [x] T008 [US1] Add lightbox stage / clickable `.msg-attach-img` styles in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Open overlay from chat; zoom/pan/fit work on one image.

---

## Phase 4: User Story 2 - Fechar o visualizador (Priority: P1)

**Goal**: Close via Escape, backdrop, and visible X; chat usable after.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 2

- [x] T009 [US2] Implement Escape, backdrop click, and visible close control in `frontend/src/components/ImageLightbox.tsx`; clear open state from `MessageAttachments.tsx`
- [x] T010 [US2] Ensure focus returns / no residual overlay blocking chat after close in `frontend/src/components/ImageLightbox.tsx` (+ CSS if needed in `frontend/src/styles/mesa-theme.css`)

**Checkpoint**: All three close paths restore chat interaction.

---

## Phase 5: User Story 3 - Galeria na mesma mensagem (Priority: P1)

**Goal**: Prev/next among images of the same message; stop at ends; reset zoom on change.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 3

- [x] T011 [US3] Add prev/next controls (+ optional arrow keys) scoped to `items` in `frontend/src/components/ImageLightbox.tsx`; disable/no-op at ends; hide nav when single image
- [x] T012 [US3] Reset scale/pan to fit whenever `index` changes in `frontend/src/components/ImageLightbox.tsx`
- [x] T013 [P] [US3] Style gallery nav controls in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Multi-image message navigable without wrap; zoom resets.

---

## Phase 6: User Story 4 - Download / guardar (Priority: P1)

**Goal**: Explicit download of current plaintext blob; disabled on error.

**Independent Test**: [quickstart.md](./quickstart.md) E.

### Implementation for User Story 4

- [x] T014 [US4] Add download/save control using current blob URL + sensible filename from `contentType`/`id` in `frontend/src/components/ImageLightbox.tsx`
- [x] T015 [US4] Handle image load error state (message + download disabled; close still works) in `frontend/src/components/ImageLightbox.tsx`
- [x] T016 [P] [US4] Style toolbar download control in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Download works for ready images; errors don’t trap the user.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and project docs.

- [x] T017 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`
- [x] T018 Walk [quickstart.md](./quickstart.md) A–F manually (incl. out-of-scope: avatars must not open lightbox)
- [x] T019 Update `docs/daily/2026-09-08.md` with Speckit implement subsection for 079 (after implement)
- [x] T020 [P] Update `CHANGELOG.md` `[Unreleased]` for 079 (after implement)

**Checkpoint**: Typecheck clean; quickstart green; docs ready post-implement.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** → stories
- **US1** first (MVP open/fit/zoom); shares `ImageLightbox.tsx` with later stories → prefer sequential US1→US2→US3→US4 on that file
- **Polish** after desired stories

### User Story Dependencies

| Story | Depends on |
|-------|------------|
| US1 open/zoom | Foundational |
| US2 close | US1 open path |
| US3 gallery | US1 fit/zoom (reset on navigate) |
| US4 download | US1 current item URL |

### Parallel Opportunities

- T002 ∥ T003 (catalogs)
- T013 ∥ T011–T012 after nav logic sketched
- T016 ∥ T014–T015
- T019 ∥ T020 after implement

### Parallel Example: Foundational

```bash
Task: T002 en.ts lightbox keys
Task: T003 pt-BR.ts lightbox keys
# then T004 ImageLightbox scaffold
```

---

## Implementation Strategy

### MVP First

1. Setup + Foundational  
2. **US1** (+ minimal close from US2 Escape/backdrop) → quickstart A–B  
3. Demo  

### Incremental Delivery

1. US1 open/fit/zoom  
2. US2 close polish  
3. US3 gallery  
4. US4 download  
5. Polish docs  

### Suggested MVP scope

**US1** (+ Escape/backdrop close) is the smallest useful slice; full release = US1–US4.

---

## Notes

- No backend tasks — reuse existing attachment blob URLs  
- Do not open lightbox for avatars / server icons / link previews  
- Gallery never wraps; zoom resets on image change  
- Mark tasks `[X]` during `/speckit-implement`
