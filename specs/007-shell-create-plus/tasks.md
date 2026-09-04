---
description: "Task list for Botões «+» criar servidor/canal + uma cena"
---

# Tasks: Botões «+» para criar servidor e canal

**Input**: Design documents from `/specs/007-shell-create-plus/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Actualizar contract tests Rust quando a API mudar; regressão `cargo test` + `npx tsc --noEmit`; validação manual [quickstart.md](./quickstart.md).

**Organization**: Foundation (DB count-by-type + helpers reutilizáveis de create channel) bloqueia US1/US4. US2/US3/US5 são sobretudo frontend e podem avançar após foundation (US2 depende do diálogo de canal existente; US1 do create-server bootstrap).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4], [US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`, `backend/src/`, `backend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tipos cliente e CSS hooks alinhados aos contratos.

- [X] T001 [P] Extend create-server request/response types in `frontend/src/api/client.ts` for `custody_ack`, `channel_key_sealed`, and optional `channels` bootstrap payload per [contracts/create-server-bootstrap.md](./contracts/create-server-bootstrap.md)
- [X] T002 [P] Add CSS hooks for rail sticky-plus and section-row «+» (`.server-rail`, `.sidebar-section`) in `frontend/src/styles/mesa-theme.css` per [contracts/shell-plus-ui.md](./contracts/shell-plus-ui.md) (layout may wire later)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Helpers DB/API partilhados — **bloqueia** bootstrap (US1) e last-of-type (US4).

**⚠️ CRITICAL**: User stories that touch create-server or delete MUST wait for this phase.

- [X] T003 Add `count_by_server_and_type` (and reuse existing create helpers as needed) in `backend/src/db/channel.rs`
- [X] T004 Extract or share voice-channel create logic (custody decode, channel_key insert, default scene) so `create_server` can call it without duplicating rules — refactor in `backend/src/api/channels.rs` and/or small helper module under `backend/src/`

**Checkpoint**: Unit/helper callable; `cargo check` passes.

---

## Phase 3: User Story 1 - Criar servidor pelo «+» do rail (Priority: P1) 🎯 MVP

**Goal**: «+» fixo no fundo do rail; create-server com custódia aprovisiona texto+voz; sem botão textual «Criar servidor».

**Independent Test**: [quickstart.md](./quickstart.md) — Criar servidor pelo «+» do rail (US1).

### Implementation for User Story 1

- [X] T005 [US1] Extend `POST /api/servers` in `backend/src/api/servers.rs` to require custody fields and atomically create text `geral` + voice `mesa` (key + default scene) per [contracts/create-server-bootstrap.md](./contracts/create-server-bootstrap.md) and [research.md](./research.md)
- [X] T006 [US1] Add/update Rust contract tests for create-server bootstrap (400 without custody; 201 with text+voice+key) in `backend/tests/contract/`
- [X] T007 [US1] Add pinned «+» create control to `frontend/src/shell/ServerRail.tsx` (`aria-label="Criar servidor"`, does not select server; `onCreate` callback)
- [X] T008 [US1] Wire rail «+» → create-server dialog; remove textual «Criar servidor» button; require custody UI + seal key on submit in `frontend/src/shell/Sidebar.tsx` (publish server envelope + `rememberChannelKey` for voice id)
- [X] T009 [P] [US1] Finish rail layout CSS (scrollable icons above, «+» always visible at bottom) in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: New server has ≥1 text + ≥1 voice with key; rail «+» sticky; no «Criar servidor» label in sidebar.

---

## Phase 4: User Story 2 - Criar canal pelo «+» das secções (Priority: P1)

**Goal**: «+» em Texto / Voz e vídeo (só dono); tipo implícito; sem «Criar canal» textual; secções sempre visíveis.

**Independent Test**: [quickstart.md](./quickstart.md) — Criar canal pelas secções (US2).

### Implementation for User Story 2

- [X] T010 [US2] Refactor section headers in `frontend/src/shell/Sidebar.tsx` — always show **Texto** / **Voz e vídeo**; owner-only trailing «+» with distinct `aria-label`s; `openCreateChannel(type)` without type picker in the form
- [X] T011 [US2] Remove textual «Criar canal» button and type `<select>` from create-channel dialog in `frontend/src/shell/Sidebar.tsx`; keep custody block for voice only
- [X] T012 [P] [US2] Style section label + «+» row in `frontend/src/styles/mesa-theme.css` per [contracts/shell-plus-ui.md](./contracts/shell-plus-ui.md)

**Checkpoint**: Owner creates typed channels via section «+»; non-owner sees labels without «+»; empty section still shows label.

---

## Phase 5: User Story 3 - Shell carrega sem erro de estilos (Priority: P1)

**Goal**: Tema Mesa válido; SPA carrega com chrome visível.

**Independent Test**: [quickstart.md](./quickstart.md) — Smoke CSS (US3).

### Implementation for User Story 3

- [X] T013 [US3] Audit and fix any orphan braces / invalid blocks in `frontend/src/styles/mesa-theme.css` so Vite/build parses cleanly
- [X] T014 [US3] Verify `cd frontend && npm run build` (or `npx tsc --noEmit` + Vite) succeeds without CSS parse failure; smoke-load SPA chrome

**Checkpoint**: No blank screen from theme CSS; build green for styles.

---

## Phase 6: User Story 4 - Invariante mínimo texto + voz (Priority: P1)

**Goal**: Não apagar o último canal de cada tipo; feedback claro.

**Independent Test**: [quickstart.md](./quickstart.md) — Invariante apagar (US4).

### Implementation for User Story 4

- [X] T015 [US4] Enforce last-of-type **409** (`last_channel_of_type`) in `DELETE` handler in `backend/src/api/channels.rs` using T003 helper per [contracts/delete-channel-last-of-type.md](./contracts/delete-channel-last-of-type.md)
- [X] T016 [US4] Add/update Rust contract tests for last text / last voice delete rejection in `backend/tests/contract/`
- [X] T017 [US4] Surface 409 message in channel delete confirm flow in `frontend/src/shell/Sidebar.tsx` (channel remains listed)

**Checkpoint**: Only text or only voice cannot be deleted; second text can be deleted.

---

## Phase 7: User Story 5 - Uma cena só; manter Editar cena (Priority: P1)

**Goal**: Sem UI multi-cena; **Editar cena** edita a cena activa.

**Independent Test**: [quickstart.md](./quickstart.md) — Uma cena + Editar cena (US5).

### Implementation for User Story 5

- [X] T018 [US5] Remove/hide `SceneList` panel and multi-scene actions from `frontend/src/pages/VoiceChannel.tsx` per [contracts/shell-plus-ui.md](./contracts/shell-plus-ui.md); keep composition/grid/controls/Gravar/E2EE
- [X] T019 [US5] Ensure **Editar cena** opens `SceneEditor` for the **active** scene only (not a list selection) in `frontend/src/pages/VoiceChannel.tsx`; simplify pane subtitle if it implied a scene picker
- [X] T020 [P] [US5] Confirm `docs/backlog-prototype-v2-gaps.md` G10 describes multi-cena deferred (not Editar cena)

**Checkpoint**: No Cenas list/create/switch UI; owner can edit and save active layout.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Regressão e validação end-to-end.

- [X] T021 [P] Run `cargo test` in `backend/` and fix regressions from create-server / delete changes
- [X] T022 [P] Run `npx tsc --noEmit` in `frontend/` and fix type errors from Sidebar/ServerRail/VoiceChannel
- [X] T023 Walk [quickstart.md](./quickstart.md) checklist (US1–US5) and note any gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1 (shared create helpers) and US4 (count-by-type)
- **US1**: After Phase 2 (needs create helper / channel create reuse)
- **US2**: After Setup; can parallel US1 if Sidebar merge coordinated (same file — prefer after or carefully with US1)
- **US3**: Can parallel after T002; finalize after US1/US2 CSS lands
- **US4**: After Phase 2 (+ T003)
- **US5**: Independent of backend stories; can parallel after Setup
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Phase 2 → T005–T009
- **US2**: Touches `Sidebar.tsx` with US1 — sequence US1 then US2, or single owner on Sidebar
- **US3**: CSS file shared — after T009/T012 preferred
- **US4**: Phase 2 → T015–T017
- **US5**: Independent (`VoiceChannel.tsx`)

### Parallel Opportunities

- T001 ∥ T002
- After Phase 2: US4 backend (T015–T016) ∥ US5 (T018–T019) ∥ US1 backend (T005–T006)
- T009 ∥ T012 careful on same CSS file — prefer sequential or one owner
- T021 ∥ T022 in polish

### Parallel Example: After Foundation

```bash
# Backend tracks in parallel:
Task: "Extend POST /api/servers bootstrap in backend/src/api/servers.rs"
Task: "Enforce last-of-type 409 in backend/src/api/channels.rs"
Task: "Hide SceneList; keep Editar cena in frontend/src/pages/VoiceChannel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2
2. Phase 3 (US1) — rail «+» + bootstrap server
3. **STOP** — validate quickstart US1
4. Then US2 → US4 → US5 → US3 polish as needed (US3 may be quick if CSS already valid)

### Incremental Delivery

1. Foundation ready
2. US1 MVP → demo create server via rail
3. US2 section «+»
4. US4 delete invariant
5. US5 single-scene chrome
6. US3 + polish gates

### Suggested MVP scope

**US1 only** (rail «+» + create-server bootstrap with custody).

---

## Notes

- Do not reintroduce multi-cena UI (G10).
- Create-channel API `type` field stays; UI stops asking for it.
- `SceneList.tsx` may remain unused for G10 — do not delete unless cleanup is desired in polish.
- Format validation: all tasks use `- [ ] Txxx …` with paths.
