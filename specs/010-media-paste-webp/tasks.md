---
description: "Task list for colar imagens, WebP e limite 5 MB"
---

# Tasks: Colar imagens, WebP e limite 5 MB

**Input**: Design documents from `/specs/010-media-paste-webp/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal na spec. Actualizar contract test de oversize (5 MiB); `cargo test` + `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup (módulo media) → Foundational (teto 5 MiB FE/BE) → US1 (paste no pane) → US2 (WebP + GIF anim) → US3 (política 5 MiB no seletor + feedback) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/tests/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estrutura cliente para helpers de paste/WebP (sem lógica completa ainda).

- [X] T001 Create `frontend/src/media/pasteWebp.ts` with exported stubs/types (`isAnimatedGif`, `staticImageToWebp`, `clipboardFilesFromPaste`) and `WEBP_QUALITY = 0.82` per [research.md](./research.md)
- [X] T002 [P] Export media helpers from a barrel or direct imports documented in `frontend/src/media/pasteWebp.ts` (no unused deps; keep tree minimal)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Alinhar **5 MiB** no servidor e constante FE — **bloqueia** validação correcta de US1–US3.

**⚠️ CRITICAL**: Nenhuma story de tamanho/paste deve assumir ainda 8 MiB após esta fase.

- [X] T003 [P] Set `MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024` in `backend/src/domain/attachment.rs`
- [X] T004 [P] Align Axum `DefaultBodyLimit` for attachments route in `backend/src/api/mod.rs` to `5 * 1024 * 1024 + 64 * 1024` (or equivalent)
- [X] T005 [P] Set `MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024` in `frontend/src/api/client.ts`
- [X] T006 Update oversize contract test in `backend/tests/contract/attachments.rs` to use `5 * 1024 * 1024 + 1` and expect **400** per [contracts/attachments-size.md](./contracts/attachments-size.md)

**Checkpoint**: `cargo test` passa com rejeição >5 MiB; FE constante alinhada.

---

## Phase 3: User Story 1 - Colar imagem no composer (Priority: P1) 🎯 MVP

**Goal**: Paste com imagem(ns) em **todo o painel** do canal → anexos pendentes; texto+imagem → pending + draft; só texto sem anexo fantasma; respeitar max 10.

**Independent Test**: [quickstart.md](./quickstart.md) §1 — Colar no painel sem foco no composer.

### Implementation for User Story 1

- [X] T007 [US1] Implement `clipboardFilesFromPaste(clipboardData)` in `frontend/src/media/pasteWebp.ts` to collect image `File`s and optional `text/plain` (no WebP conversion yet — pass-through MIME)
- [X] T008 [US1] Add `paste` listener on the text-channel pane root in `frontend/src/pages/Channel.tsx`: when images present, preventDefault for image handling, push to `pendingFiles` (cap 10 + clear errors), insert clipboard text into `draft`; plain-text-only paste must not create phantom attachments
- [X] T009 [US1] Reuse size/type checks when adding paste files in `frontend/src/pages/Channel.tsx` (ALLOWED_MEDIA_TYPES + `MAX_ATTACHMENT_BYTES`); show PT error if over cap or bad type

**Checkpoint**: Colar captura com foco na área de mensagens cria pending; colar só texto não cria anexo; enviar funciona como anexo 009.

---

## Phase 4: User Story 2 - Imagens coladas como WebP (Priority: P1)

**Goal**: Colagens estáticas → WebP (quality 0.82); GIF animado → manter GIF; GIF estático → WebP; falha → feedback sem pending inválido.

**Independent Test**: [quickstart.md](./quickstart.md) §2 — MIME WebP / GIF animado.

### Implementation for User Story 2

- [X] T010 [P] [US2] Implement `isAnimatedGif(bytes: Uint8Array): boolean` in `frontend/src/media/pasteWebp.ts` (multi Image Descriptor / Netscape) per [research.md](./research.md)
- [X] T011 [US2] Implement `staticImageToWebp(file: File, quality = WEBP_QUALITY): Promise<File>` in `frontend/src/media/pasteWebp.ts` (canvas `toBlob('image/webp')`; reject if unsupported/empty)
- [X] T012 [US2] Wire paste path in `frontend/src/pages/Channel.tsx` (or via helper in `pasteWebp.ts`): for each pasted image — if animated GIF keep GIF; else convert to WebP; then size-check and add pending; on conversion failure `setError` and skip that item
- [X] T013 [US2] Ensure upload uses converted `file.type` (`image/webp` or `image/gif`) in existing send path in `frontend/src/pages/Channel.tsx`

**Checkpoint**: PNG/JPEG colados enviam como WebP; GIF animado mantém animação; falha de conversão não envia lixo.

---

## Phase 5: User Story 3 - Limite 5 MB no seletor e colagens (Priority: P1)

**Goal**: Seletor e colagens rejeitam >5 MiB com mensagem clara; copy deixa de dizer 8 MiB; servidor já enforce via Phase 2.

**Independent Test**: [quickstart.md](./quickstart.md) §3 — seletor + API oversize.

### Implementation for User Story 3

- [X] T014 [US3] Update `onPickFiles` error copy in `frontend/src/pages/Channel.tsx` from «8 MiB» to «5 MiB» (or «5 MB») and keep reject when `file.size > MAX_ATTACHMENT_BYTES`
- [X] T015 [US3] After WebP conversion on paste, reject if result `size > MAX_ATTACHMENT_BYTES` with clear error in `frontend/src/pages/Channel.tsx` / `frontend/src/media/pasteWebp.ts`
- [X] T016 [P] [US3] Grep/update any remaining «8 MiB» / `8 * 1024 * 1024` attachment UX strings in `frontend/` related to chat attachments (leave unrelated docs unless clearly stale product copy in-app)

**Checkpoint**: Ficheiro >5 MiB no seletor e colagem oversized rejeitados; ≤5 MiB OK; API 400 em `5 MiB+1`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação transversal.

- [X] T017 Run `cd backend && cargo test` and fix attachment size regressions
- [X] T018 [P] Run `cd frontend && npx tsc --noEmit` and fix types in `pasteWebp.ts` / `Channel.tsx`
- [X] T019 Execute manual scenarios in [quickstart.md](./quickstart.md) (§1–§3) and fix gaps
- [X] T020 [P] Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful implement (per workspace rule)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **blocks correct size behaviour for all stories**
- **US1**: After Foundational (paste can land before WebP)
- **US2**: After US1 (converts files on the paste path)
- **US3**: After Foundational; ideally after US2 so oversize-after-convert is covered (T014 can run parallel to US1/US2 on copy only)
- **Polish**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — MVP paste
- **US2 (P1)**: After US1 paste wiring
- **US3 (P1)**: Phase 2 delivers server/FE constant; UI copy + post-convert check complete the story

### Parallel Opportunities

- T003, T004, T005 in parallel (Phase 2)
- T010 can start while T008/T009 finish if stubs exist
- T014/T016 parallel with late US2
- T017/T018 in polish

### Parallel Example: Phase 2

```bash
Task: "MAX_ATTACHMENT_BYTES in backend/src/domain/attachment.rs"
Task: "DefaultBodyLimit in backend/src/api/mod.rs"
Task: "MAX_ATTACHMENT_BYTES in frontend/src/api/client.ts"
```

### Parallel Example: User Story 2

```bash
Task: "isAnimatedGif in frontend/src/media/pasteWebp.ts"
# then staticImageToWebp → wire Channel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (5 MiB)
2. Phase 3 US1 (paste → pending → send)
3. **STOP**: validate quickstart §1
4. Then US2 (WebP) → US3 polish copy/convert size → Polish

### Incremental Delivery

1. Foundation 5 MiB → safer uploads immediately  
2. Paste MVP → daily UX win  
3. WebP on paste → size reduction  
4. Seletor copy + post-convert checks → policy complete  

---

## Notes

- No schema migration; no new HTTP endpoints
- Seletor **não** força WebP (só colagens)
- GIF animado colado **não** vai para WebP
- Format validation: all tasks use `- [X] Txxx …` with paths
