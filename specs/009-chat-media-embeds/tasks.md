---
description: "Task list for mídia e unfurl no chat de texto"
---

# Tasks: Mídia e resolução de links no chat de texto

**Input**: Design documents from `/specs/009-chat-media-embeds/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal na spec. Incluir contract tests Rust por [plan.md](./plan.md); `cargo test` + `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup (tipos/config) → Foundational (migração + DB + crypto bytes) → US1 (upload/bind/render anexos) → US2 (unfurl) → US3 (composer multi-anexo + layout). US2 pode paralelizar backend unfurl com frontend US1 após foundation; US3 estende UI de US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/migrations/`, `backend/tests/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Config, tipos cliente e constantes de política alinhados aos contratos.

- [X] T001 [P] Add `ATTACHMENTS_DIR` (default `./data/attachments`) to `backend/src/config.rs` and ensure directory creation on boot in `backend/src/lib.rs` or `backend/src/db/mod.rs`
- [X] T002 [P] Extend Message / attachment types and API helpers in `frontend/src/api/client.ts` (`attachment_ids`, `AttachmentMeta`, `unfurl`, upload helper) per [contracts/attachments-api.md](./contracts/attachments-api.md) and [contracts/unfurl-api.md](./contracts/unfurl-api.md)
- [X] T003 [P] Add `encryptBytes` / `decryptBytes` (AES-GCM IV‖CT, same packing as messages) in `frontend/src/crypto/serverKey.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + domain/DB layer — **bloqueia** US1 (e bind de mensagens).

**⚠️ CRITICAL**: US1 MUST wait for this phase.

- [X] T004 Create migration `backend/migrations/0007_message_attachments.sql` for `message_attachment` per [data-model.md](./data-model.md) (`message_id` nullable until linked; cascade on message/channel delete as appropriate)
- [X] T005 [P] Add domain type in `backend/src/domain/attachment.rs` and export from `backend/src/domain/mod.rs`
- [X] T006 Implement DB helpers in `backend/src/db/attachment.rs` (insert pending, list by message, bind to message, find by id, delete file+row) and wire `backend/src/db/mod.rs`
- [X] T007 Extend `Message` domain/DB/list queries in `backend/src/domain/message.rs` and `backend/src/db/message.rs` to expose ordered `attachment_ids` (join or secondary query)

**Checkpoint**: Migration applies; `cargo check` with new modules compiling (handlers may still be stubs).

---

## Phase 3: User Story 1 - Enviar imagem ou GIF (Priority: P1) 🎯 MVP

**Goal**: Upload cifrado → bind na mensagem → membros descarregam/decifram e vêem mídia; rejeição MIME/tamanho/ACL.

**Independent Test**: [quickstart.md](./quickstart.md) §1 — Enviar imagem/GIF + ACL disco/API.

### Implementation for User Story 1

- [X] T008 [US1] Implement `POST /api/channels/{channel_id}/attachments` and `GET /api/attachments/{attachment_id}` in `backend/src/api/attachments.rs`; register routes in `backend/src/api/mod.rs` per [contracts/attachments-api.md](./contracts/attachments-api.md) (text channel only; MIME allow-list; ≤8 MiB; membership ACL)
- [X] T009 [US1] Extend `POST`/`GET` messages in `backend/src/api/messages.rs` to accept/return `attachment_ids` (max 10; bind pending uploads; allow empty ciphertext when attachments present; WS `message.new` includes ids)
- [X] T010 [P] [US1] Add Rust contract tests for upload reject (bad MIME/oversize), GET deny non-member, and message bind in `backend/tests/contract/`
- [X] T011 [US1] Wire Channel send path in `frontend/src/pages/Channel.tsx`: encrypt file bytes → upload → post message with `attachment_ids` (+ optional text)
- [X] T012 [US1] Render decrypted attachments in history in `frontend/src/pages/Channel.tsx` (and/or `frontend/src/components/MessageAttachments.tsx`): fetch ciphertext, decrypt, show `<img>` (GIF animates when browser allows); handle WS `message.new` with attachments

**Checkpoint**: Two members see shared image/GIF; non-member GET denied; disk blob not clear image.

---

## Phase 4: User Story 2 - Resolução / preview de links (Priority: P1)

**Goal**: Unfurl lazy após decifrar; cartões link/imagem/vídeo; falha → só texto; sem unfurl no POST message.

**Independent Test**: [quickstart.md](./quickstart.md) §2 — Unfurl lazy.

### Implementation for User Story 2

- [X] T013 [US2] Implement `POST /api/unfurl` in `backend/src/api/unfurl.rs` (reqwest fetch, timeout, SSRF guards, OG/image detection) and register in `backend/src/api/mod.rs` per [contracts/unfurl-api.md](./contracts/unfurl-api.md); add `reqwest` (and light HTML parse dep if needed) to `backend/Cargo.toml`
- [X] T014 [P] [US2] Add Rust contract tests for unfurl 400 on non-http(s) / blocked hosts in `backend/tests/contract/`
- [X] T015 [US2] Add URL extract (first 5 http(s)) + lazy `unfurl` calls after decrypt in `frontend/src/pages/Channel.tsx` or `frontend/src/components/LinkPreviewCard.tsx`
- [X] T016 [P] [US2] Style link/image/video preview cards in `frontend/src/styles/mesa-theme.css` (responsive; failure = plain `<a>`)

**Checkpoint**: Viewing decrypted message with URLs triggers unfurl; send alone does not; failures degrade gracefully.

---

## Phase 5: User Story 3 - Composer e histórico legíveis (Priority: P2)

**Goal**: Até 10 anexos com preview/remove no composer; media-only; layout sem overflow; bloquear 11.º.

**Independent Test**: [quickstart.md](./quickstart.md) §3 — Composer / layout.

### Implementation for User Story 3

- [X] T017 [US3] Composer UX in `frontend/src/pages/Channel.tsx`: file picker (multi), pending thumb list, remove per file, block 11th with clear error, send media-only (empty text + attachments)
- [X] T018 [P] [US3] CSS for composer attachment chips and history images (`max-width: 100%`) in `frontend/src/styles/mesa-theme.css` — no page-level horizontal scroll at ~375px
- [X] T019 [US3] Enforce max-10 on server message bind (already in T009) and surface API errors in composer UI in `frontend/src/pages/Channel.tsx`

**Checkpoint**: 10 attachments OK; 11th blocked; media-only OK; narrow viewport layout OK.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação transversal e higiene.

- [X] T020 [P] Ensure `.gitignore` ignores `data/attachments/` (and document `ATTACHMENTS_DIR` in `docs/operar-instancia.md` if env vars are listed there)
- [X] T021 Run `cd backend && cargo test` and fix regressions from messages/attachments/unfurl
- [X] T022 [P] Run `cd frontend && npx tsc --noEmit` and fix types
- [X] T023 Execute manual scenarios in [quickstart.md](./quickstart.md) (US1–US3 + ACL) and fix gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **blocks US1**
- **US1**: After Foundational
- **US2**: After Setup for backend unfurl; frontend needs Channel decrypt path (can follow or parallel late US1)
- **US3**: After US1 composer send/render basics
- **Polish**: After desired stories

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|--------|
| US1 Anexos | Foundational T004–T007 | MVP |
| US2 Unfurl | Setup; Channel decrypt (US1 frontend helpful) | Independent API |
| US3 Composer UX | US1 send/render | Extends composer |

### Parallel Opportunities

- T001 ∥ T002 ∥ T003
- T005 ∥ T004 (domain vs migration)
- T010 ∥ T011 (tests vs frontend) after T008–T009
- T013–T014 (US2 backend) ∥ T011–T012 (US1 frontend) after foundation
- T016 ∥ T015
- T018 ∥ T017
- T020 ∥ T022 in Polish

---

## Parallel Example: Setup + Foundation

```bash
Task: "T001 ATTACHMENTS_DIR in config.rs"
Task: "T002 client.ts attachment/unfurl types"
Task: "T003 encryptBytes/decryptBytes in serverKey.ts"
# Then:
Task: "T004 migration 0007"
Task: "T005 domain/attachment.rs"
```

## Parallel Example: After US1 API

```bash
Task: "T010 contract tests attachments"
Task: "T011 Channel.tsx upload+send"
Task: "T013 unfurl.rs API"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US1 (encrypt → upload → message → decrypt render)  
4. **STOP** — validate quickstart §1  
5. Then US2 → US3 → Polish  

### Incremental Delivery

1. Setup + Foundational  
2. US1 → demo encrypted images  
3. US2 → link cards  
4. US3 → multi-attach composer polish  
5. Polish + cargo/tsc/quickstart  

### Suggested MVP scope

**US1** only (send/view encrypted image/GIF between two members).

---

## Notes

- Do **not** unfurl inside `post_message` from ciphertext.
- Voice channels: no attachment upload in this feature.
- Operator disk inspection must see opaque ciphertext only.
- [P] = different files / no incomplete deps.
