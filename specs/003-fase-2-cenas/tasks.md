---
description: "Task list for Fase 2 — Cenas de câmera trocáveis"
---

# Tasks: Fase 2 — Cenas de câmera trocáveis

**Input**: Design documents from `/specs/003-fase-2-cenas/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included, scoped to [plan.md](./plan.md) / [research.md D8](./research.md#d8--testes-contrato-rust--quickstart-ao-vivo): `cargo test` de contrato no backend; E2E de dois navegadores fica manual no `quickstart.md` (sem Playwright).

**Organization**: US1 (P1) depois US2 (P2). A Fase 1 já está no ar — estas tarefas **estendem** `backend/` e `frontend/`, não criam projecto novo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 or US2 on user-story phases only
- File paths are exact, per [plan.md](./plan.md)

## Path Conventions

Web app: `backend/src/`, `backend/tests/`, `backend/migrations/`, `frontend/src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Declarações e tipos partilhados; stack (Rust/Solid/LiveKit) inalterada.

- [x] T001 [P] Add `Scene`, `SceneSummary`, and `ChannelRole` TypeScript types in `frontend/src/api/client.ts` matching [contracts/scene.json](./contracts/scene.json) and [contracts/scenes-api.yaml](./contracts/scenes-api.yaml)
- [x] T002 [P] Declare `pub mod scene;` and `pub mod channel_role;` in `backend/src/domain/mod.rs` and `backend/src/db/mod.rs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration + a grade F1 passa a ser a **cena activa**. Sem isto, `GET /grid` e a chamada de vídeo partem.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Write SQLite migration `backend/migrations/0003_scenes.sql`: tables `scene`, `scene_slot`, `channel_role`; column `channel.active_scene_id`; copy each `voice_video` `grid_slot` into a scene named `Cena padrão`; drop or stop using `grid_slot` — per [data-model.md](./data-model.md) and [research.md D1](./research.md#d1--cena-é-tabela-grid_slot-do-canal-migra-para-a-cena-padrão)
- [x] T004 Implement `Scene` / `SceneSlot` domain types and validation (slot_count 2–4, unique name rules) in `backend/src/domain/scene.rs`
- [x] T005 Implement scene persistence (`list_by_channel`, `get`, `insert`, `copy_slots`, `replace_slots`, `set_active`, `delete_if_inactive`) in `backend/src/db/scene.rs` (depends on T003, T004)
- [x] T006 Retarget `GET`/`PUT /channels/{id}/grid` in `backend/src/api/grid.rs` and auto first-empty in `backend/src/db/grid.rs` + `backend/src/api/voice.rs` to the **active** scene (`assigned_by=auto` only, [research.md D6](./research.md#d6--primeiro-vazio-só-na-cena-ativa-ainda-automática)) (depends on T005)
- [x] T007 Create the default scene (4 empty slots, `assigned_by=auto`) when inserting a `voice_video` channel in `backend/src/api/channels.rs` instead of `db::grid::init_empty` (depends on T005)
- [x] T008 Add `scene.changed` (and keep `grid.updated`) broadcast helpers in `backend/src/ws/mod.rs` per [contracts/ws-events.md](./contracts/ws-events.md)

**Checkpoint**: `cargo test` dos contratos F1 de `grid` / `voice/join` continua verde; canal novo e canal migrado têm cena activa.

---

## Phase 3: User Story 1 - Guardar e trocar cenas ao vivo (Priority: P1) 🎯 MVP

**Goal**: Admin cria cenas (cópia da activa ou duplicata da lista), edita mapas, activa ao vivo; criar/duplicar não troca o quadro; apagar a activa é recusado.

**Independent Test**: Duas contas na chamada; A copia o quadro para `Foco no mestre`, edita a cópia sem o live mudar, activa, os dois vêem o mesmo mapa; duplica da lista sem activar; recarregar mantém a activa; apagar a activa falha. Ver [quickstart.md](./quickstart.md) US1.

### Tests for User Story 1

- [x] T009 [P] [US1] Contract tests for `GET/POST /channels/{id}/scenes`, `POST .../duplicate`, `PATCH/DELETE .../scenes/{id}` — copy-from-active does not change `active_scene_id`; duplicate of inactive does not activate; unique name 409; delete active or last scene 409 — in `backend/tests/contract/scenes.rs`
- [x] T010 [P] [US1] Contract tests for `POST .../scenes/{id}/activate` — emits layout of new active on subsequent `GET /grid`; `PUT /grid` still edits the active scene — in `backend/tests/contract/scenes_activate.rs`

### Implementation for User Story 1

- [x] T011 [US1] Implement `GET` and `POST /channels/{channel_id}/scenes` (copy of active, require `name`, cap 32) in `backend/src/api/scenes.rs` (depends on T005, T008)
- [x] T012 [US1] Implement `GET`/`PATCH`/`DELETE /channels/{channel_id}/scenes/{scene_id}` and `POST .../duplicate` in `backend/src/api/scenes.rs` — `PATCH` of active emits `grid.updated`; inactive edit does not (depends on T011)
- [x] T013 [US1] Implement `POST .../scenes/{scene_id}/activate` — set `active_scene_id`, sync `grid_slot_count`, broadcast `grid.updated` + `scene.changed` — in `backend/src/api/scenes.rs` (depends on T011, T006)
- [x] T014 [US1] Mount scene routes in `backend/src/api/mod.rs`
- [x] T015 [P] [US1] Implement scene list / create (copy active) / duplicate / activate / delete UI in `frontend/src/components/SceneList.tsx`
- [x] T016 [US1] Wire `frontend/src/pages/VoiceChannel.tsx` to load scenes, handle `scene.changed`, keep `CameraGrid` on `grid.updated` without remounting tiles (depends on T015, T001)
- [x] T017 [US1] Point `frontend/src/components/GridAdmin.tsx` at the selected scene (`PATCH` when not active; `PUT /grid` or `PATCH` active when selected is active) so editing an inactive scene does not move the live frame (depends on T016)

**Checkpoint**: US1 independently testable — named scenes switch live without leaving the LiveKit room.

---

## Phase 4: User Story 2 - Co-diretor troca cenas (Priority: P2)

**Goal**: Quem administra o canal (dono do Servidor) concede/revoga co-direção por canal; co-diretor só activa; não CRUD nem delega.

**Independent Test**: A nomeia B; B activa uma cena; C sem papel falha; B não cria/apaga/nomeia; A revoga B. Ver [quickstart.md](./quickstart.md) US2.

### Tests for User Story 2

- [x] T018 [P] [US2] Contract tests for `GET`/`PUT /channels/{id}/roles` — only channel admin writes; non-member account_id 400; co-director `POST activate` 200; co-director `POST /scenes` and `PUT /roles` 403 — in `backend/tests/contract/channel_roles.rs`

### Implementation for User Story 2

- [x] T019 [P] [US2] Implement `ChannelRole` domain in `backend/src/domain/channel_role.rs`
- [x] T020 [P] [US2] Implement `channel_role` queries (`list`, `replace_co_directors`) in `backend/src/db/channel_role.rs`
- [x] T021 [P] [US2] Add `is_co_director` (async lookup) next to `is_channel_admin` in `backend/src/domain/permissions.rs`
- [x] T022 [US2] Implement `GET`/`PUT /channels/{channel_id}/roles` and `channel_role.changed` in `backend/src/api/channel_roles.rs`; mount in `backend/src/api/mod.rs` (depends on T020, T008)
- [x] T023 [US2] Allow activate for admin **or** co-director; keep scene CRUD and `PUT /roles` admin-only in `backend/src/api/scenes.rs` (depends on T013, T021)
- [x] T024 [P] [US2] Implement co-director picker (member list in/out) in `frontend/src/components/CoDirectorPanel.tsx`
- [x] T025 [US2] Wire `frontend/src/pages/VoiceChannel.tsx` so co-directors see activate-only controls and `channel_role.changed` updates the chrome (depends on T024, T016)

**Checkpoint**: US1 and US2 both work; member without role cannot switch scenes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Garantir o fora de escopo (sem E2EE-off / gravação) e validar o quickstart.

- [x] T026 [P] Extend `backend/tests/contract/no_e2ee_toggle.rs` so new scene/role routes do not introduce disable-E2EE or egress/record paths (SC-005, [research.md D7](./research.md#d7--sem-egress-sem-desligar-e2ee-sem-schema-de-captura))
- [x] T027 [P] Add a short “cenas” note to `docs/operar-instancia.md` (no installer, no new ports — layout-only)
- [x] T028 Run `cargo test` in `backend/` then execute [quickstart.md](./quickstart.md) US1 (and US2 if T025 done) with two browser profiles

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately (existing repo)
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** US1 and US2
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational + activate endpoint from US1 (T013)
- **Polish (Phase 5)**: After the stories you intend to ship

### User Story Dependencies

- **User Story 1 (P1)**: After Phase 2. No dependency on US2.
- **User Story 2 (P2)**: Needs US1 activate + scene list; independently testable as “B can switch, cannot CRUD”.

### Within Each User Story

- Contract tests before or alongside handlers (F1 convention; constitution not TDD-mandatory)
- Domain/db before API
- API before frontend
- Story complete before next priority

### Parallel Opportunities

- T001 // T002
- After T005: T006 and T007 still sequential with T005; T008 can overlap with T004
- T009 // T010 once routes exist (or write failing tests first)
- T015 // T011–T014 (UI against mocked API only if needed; otherwise after T014)
- T019 // T020 // T021
- T024 // T022
- T026 // T027

---

## Parallel Example: User Story 1

```bash
# After T014 (routes mounted):
Task: "Contract tests in backend/tests/contract/scenes.rs"
Task: "Contract tests in backend/tests/contract/scenes_activate.rs"

# Frontend after API is up:
Task: "SceneList in frontend/src/components/SceneList.tsx"
Task: "Wire VoiceChannel.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "ChannelRole domain in backend/src/domain/channel_role.rs"
Task: "Queries in backend/src/db/channel_role.rs"
Task: "is_co_director in backend/src/domain/permissions.rs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (migration; `/grid` = cena activa)
2. Phase 3 US1
3. **STOP**: [quickstart.md](./quickstart.md) US1 — duas pessoas trocam cenas ao vivo
4. Demo

### Incremental Delivery

1. Setup + Foundational → chamada F1 ainda funciona
2. US1 → cunha de cenas
3. US2 → co-diretor
4. Polish → SC-005 + quickstart completo

### Parallel Team Strategy

Solo (este repo): sequencial P1 → P2. Com duas pessoas: depois da Phase 2, uma no `api/scenes.rs`, outra no `SceneList.tsx` contra o contrato.

---

## Notes

- [P] = ficheiros diferentes, sem depender de tarefa incompleta no mesmo ficheiro
- Não reabrir LiveKit room ao activar cena
- Não implementar Egress / desligar E2EE
- Commit after each task or logical group if the operator asks
- Existing F1 tests in `backend/tests/contract/grid.rs` and `grid_admin.rs` must stay green after T006
