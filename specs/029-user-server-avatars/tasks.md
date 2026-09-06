---
description: "Task list for avatares de utilizador e de servidor"
---

# Tasks: Avatares de utilizador e de servidor

**Input**: Design documents from `/specs/029-user-server-avatars/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/avatars-api.md](./contracts/avatars-api.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal na spec. Incluir contract tests API per [contracts/avatars-api.md](./contracts/avatars-api.md); `cargo test` + `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup → Foundational (schema + `AVATARS_DIR` + domain) → US1 avatar conta → US2 imagem servidor → US3 exibição identidade → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/`, `backend/src/`, `backend/tests/contract/`, `frontend/src/`, `docs/operar-instancia.md`, `.gitignore`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Constantes, gitignore e stubs de domínio partilhados.

- [X] T001 [P] Add `data/avatars/` and `backend/data/avatars/` to `.gitignore`
- [X] T002 [P] Add `MAX_AVATAR_BYTES = 1 * 1024 * 1024` and avatar MIME allowlist helpers in `backend/src/domain/` (new `avatar.rs` or extend existing module) per [research.md](./research.md) R4
- [X] T003 [P] Export `MAX_AVATAR_BYTES = 1 * 1024 * 1024` in `frontend/src/api/client.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, config, DB projections e wiring de rotas — **blocks** US1–US3.

**⚠️ CRITICAL**: Nenhuma story de upload/UI deve assumir colunas ou `AVATARS_DIR` antes desta fase.

- [X] T004 Create migration `backend/migrations/0009_user_server_avatars.sql` adding `account.avatar_filename`, `account.avatar_content_type`, `server.image_filename`, `server.image_content_type` (nullable TEXT) per [data-model.md](./data-model.md) (`0008` is voice occupancy)
- [X] T005 Add `avatars_dir: PathBuf` from `AVATARS_DIR` (default `./data/avatars`) in `backend/src/config.rs`; mkdir on boot in `backend/src/lib.rs` (mirror attachments)
- [X] T006 Extend account DB/domain types and queries in `backend/src/db/account.rs` and `backend/src/domain/account.rs` for avatar columns + `has_avatar` in public/auth projections
- [X] T007 Extend server DB/domain types and queries in `backend/src/db/server.rs` and `backend/src/domain/server.rs` for image columns + `has_image` on `Server`
- [X] T008 Extend `MemberView` / list members in `backend/src/api/channel_roles.rs` (or members handler) to include `has_avatar`
- [X] T009 Register avatar/server-image route stubs (or empty handlers) with body limit ≈ `1 MiB + 64 KiB` in `backend/src/api/mod.rs` per [contracts/avatars-api.md](./contracts/avatars-api.md)

**Checkpoint**: Migration aplica; boot cria `AVATARS_DIR`; listagens compilam com `has_avatar` / `has_image`.

---

## Phase 3: User Story 1 - Definir o meu avatar (Priority: P1) 🎯 MVP

**Goal**: Conta autenticada PUT/DELETE avatar; GET serve imagem; UI no menu da conta; chip da topbar mostra imagem ou iniciais.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 1; contract tests avatar.

### Tests for User Story 1

- [X] T010 [P] [US1] Add contract tests in `backend/tests/contract/` (e.g. `avatars.rs`) for PUT ≤1 MiB OK, PUT >1 MiB → 400, bad MIME → 400, DELETE → GET 404, `has_avatar` on me — per [contracts/avatars-api.md](./contracts/avatars-api.md); wire module in `backend/tests/contract/mod.rs`

### Implementation for User Story 1

- [X] T011 [US1] Implement `PUT /api/auth/avatar` and `DELETE /api/auth/avatar` (validate MIME/size, write/replace/delete file under `avatars_dir`, update account row) in `backend/src/api/auth/` (new module or extend existing)
- [X] T012 [US1] Implement `GET /api/accounts/{account_id}/avatar` (session required; 404 if missing) in `backend/src/api/` per [research.md](./research.md) R5
- [X] T013 [US1] Update FE types (`Account` / me) with `has_avatar` and helper URL `/api/accounts/{id}/avatar` in `frontend/src/api/client.ts`
- [X] T014 [US1] Add avatar settings entry + dialog/panel (pick file, save, remove, error feedback) from `frontend/src/components/AccountMenu.tsx` (new component OK under `frontend/src/components/`)
- [X] T015 [US1] Show avatar image with `object-fit: cover` (fallback initials) on chip in `frontend/src/shell/TopBar.tsx` + CSS in `frontend/src/styles/mesa-theme.css`; refresh local `me` state immediately after save/remove

**Checkpoint**: US1 quickstart + contract avatar tests passam; chip actualiza sem reload completo.

---

## Phase 4: User Story 2 - Avatar do servidor / só criador (Priority: P1)

**Goal**: Dono PUT/DELETE imagem do servidor; GET para membros; UI junto aos controlos de dono; rail mostra imagem.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 2; contract owner/member.

### Tests for User Story 2

- [X] T016 [P] [US2] Extend contract tests in `backend/tests/contract/` for owner PUT/GET image OK, non-owner PUT → 403, non-member GET → 403, DELETE clears `has_image` — per [contracts/avatars-api.md](./contracts/avatars-api.md)

### Implementation for User Story 2

- [X] T017 [US2] Implement `PUT` / `DELETE` / `GET /api/servers/{server_id}/image` with owner checks on mutate and `require_member` on GET in `backend/src/api/servers.rs` (or dedicated module) mirroring delete-server authz
- [X] T018 [US2] Update FE `Server` type with `has_image` and image URL helper in `frontend/src/api/client.ts`
- [X] T019 [US2] Add owner-only «Imagem do servidor» (set/replace/remove) in `frontend/src/shell/Sidebar.tsx` next to invite/delete / server context menu; hide or reject for non-owners
- [X] T020 [US2] Render server image (or initials fallback) on rail glyph in `frontend/src/shell/ServerRail.tsx` + CSS `object-fit` in `frontend/src/styles/mesa-theme.css`; refresh local servers list after save/remove

**Checkpoint**: Dono define imagem; rail actualiza; membro não altera; contracts US2 passam.

---

## Phase 5: User Story 3 - Ver avatares onde já há identidade (Priority: P2)

**Goal**: Avatares de utilizador na lista de membros e nas mensagens de texto; fallback estável sem layout partido.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 3 (membros + mensagens; rail já coberto em US2).

### Implementation for User Story 3

- [X] T021 [P] [US3] Show member avatar (`has_avatar` → `<img>`) with initials fallback in `frontend/src/components/MembersPanel.tsx` + CSS if needed in `frontend/src/styles/mesa-theme.css`
- [X] T022 [US3] Show sender avatar from members map (`has_avatar`) on message groups in `frontend/src/pages/Channel.tsx` with initials fallback; keep layout when missing
- [X] T023 [US3] Confirm refetch path: after navigation/refetch of members/servers, other clients see updated avatars without WS push (document/verify against FR-009 in shell data loaders if any)

**Checkpoint**: Topbar + membros + mensagens + rail cobertos; sem avatar → iniciais.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Ops docs e validação final.

- [X] T024 [P] Document `AVATARS_DIR` (default `./data/avatars`) in `docs/operar-instancia.md`
- [X] T025 [P] Grep/fix FE/BE for leftover gaps: GIF not accepted, 1 MiB copy in error strings, `has_avatar`/`has_image` on login/register if they return account
- [X] T026 Run `cd backend && cargo test` and `cd frontend && npx tsc --noEmit`; fix regressions
- [X] T027 Manual pass [quickstart.md](./quickstart.md) (US1–US3 + refetch note)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → no deps
- **Phase 2 (Foundational)** → after Setup; **blocks** all stories
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after Foundational (can start after US1 API patterns exist; ideally after T011–T012 for shared upload helpers)
- **Phase 5 (US3)** → after US1 projections (`has_avatar` on members) and preferably after US2 rail (display polish)
- **Phase 6 (Polish)** → after US1–US3 desired scope

### User Story Dependencies

- **US1**: Independent after Foundational (avatar API + AccountMenu + TopBar)
- **US2**: Independent after Foundational (server image API + Sidebar + ServerRail); may reuse upload helper from US1
- **US3**: Needs members `has_avatar` (Foundational T008 + US1 GET); Channel/MembersPanel display only

### Parallel Opportunities

- T001 ∥ T002 ∥ T003
- T006 ∥ T007 after T004–T005
- T010 ∥ T011 (tests vs impl) with care — prefer impl then green tests
- T021 ∥ T022 within US3
- T024 ∥ T025 in Polish

### Parallel example (after Foundational)

```text
# US1 core API
T011 → T012 → T013 → T014 → T015
# US2 can follow same upload pattern
T017 → T018 → T019 → T020
# US3 display
T021 ∥ T022 → T023
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Phase 1 + Phase 2  
2. Phase 3 (US1) — avatar próprio + chip  
3. Stop and validate quickstart US1 + `cargo test` avatar contracts  

### Incremental delivery

1. MVP (US1)  
2. US2 — imagem servidor + rail  
3. US3 — membros + mensagens  
4. Polish (docs + full quickstart)  

### Notes

- Do not reuse `ATTACHMENTS_DIR` / message attachment ciphertext APIs  
- No cropper; no WS push for avatar updates  
- Remoção (DELETE) obrigatória no MVP para conta e servidor  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001–T003 | 3 |
| Foundational | T004–T009 | 6 |
| US1 | T010–T015 | 6 |
| US2 | T016–T020 | 5 |
| US3 | T021–T023 | 3 |
| Polish | T024–T027 | 4 |
| **Total** | T001–T027 | **27** |

**Parallel opportunities**: Setup trio; Foundational DB extensions; US3 display pair; Polish docs.

**MVP scope**: Phase 1–3 (T001–T015) — user avatar end-to-end.

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
