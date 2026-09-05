---
description: "Task list for Número de câmeras na cena e re-layout"
---

# Tasks: Número de câmeras na cena e re-layout

**Input**: Design documents from `/specs/018-scene-camera-count/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `npx tsc --noEmit`, `cargo test --test contract`, manual [quickstart.md](./quickstart.md). Inclui contract tests BE para N variável.

**Organization**: Setup → Foundational (BE validate + FE geometry) → US1 controlo N (P1, MVP) → US2 Mestre (P1) → US3 Faixa (P1) → US4 Painel (P2) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/`, `frontend/src/preferences/`, `backend/src/domain/`, `backend/src/api/`, `backend/tests/contract/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Constantes partilhadas de intervalo N e pontos de toque.

- [X] T001 Add shared camera-count bounds `MIN_SCENE_SLOTS=2` / `MAX_SCENE_SLOTS=8` (or equivalent) in `frontend/src/components/sceneLayouts.ts` (export) and mirror in `backend/src/domain/grid.rs` comments/constants used by `validate_layout` per [data-model.md](./data-model.md)

**Checkpoint**: Bounds defined once on each side for 2–8.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Desacoplar `layout_key` ↔ `slot_count` no BE e motor de geometria paramétrica no FE — **bloqueia** save e pré-visualização.

**⚠️ CRITICAL**: User stories MUST wait for validate_layout + `layoutGeometry`.

- [X] T002 Update `validate_layout` in `backend/src/domain/grid.rs`: accept `slot_count` ∈ [2,8]; require `slots.len() == slot_count`; **remove** requirement that `slot_count == layout_key.slot_count()`; keep unique indices/accounts per [contracts/scene-slot-count-api.md](./contracts/scene-slot-count-api.md)
- [X] T003 Refactor `LayoutKey::slot_count` / `from_slot_count` in `backend/src/domain/grid.rs` (and call sites in `backend/src/db/scene.rs` if needed) so defaults no longer force catalog 4/5 equality; provision defaults remain explicit (e.g. quad+4)
- [X] T004 [P] Align voice `grid_slot_count` validation in `backend/src/api/channel_provision.rs` from 2–4 to **2–8** (default 4 OK) per [research.md](./research.md)
- [X] T005 Implement `layoutGeometry(layout_key, n)` (and update `cellStyle` to take `n`) in `frontend/src/components/sceneLayouts.ts` for `mestre` / `quad` / `faixa` per [contracts/parametric-layouts.md](./contracts/parametric-layouts.md) — mestre slot 0 featured; faixa `repeat(n,1fr)`; quad balanced grid
- [X] T006 Wire `CameraGrid.tsx` to use `props.grid.slot_count` with `cellStyle(key, index, n)` in `frontend/src/components/CameraGrid.tsx`
- [X] T007 Update `setNamedLayout` in `frontend/src/preferences/sceneDraft.ts` to **keep current** `slot_count` when changing family (regenerate slot array length = N, preserve assignments by index) instead of forcing catalog 4/5

**Checkpoint**: PATCH mestre+N=6 accepted by API; FE geometry returns n cells; switching layout family keeps N.

---

## Phase 3: User Story 1 - Definir quantas câmeras cabem na cena (Priority: P1) 🎯 MVP

**Goal**: Controlo N 2–8 no editor; rascunho actualiza já; palco ao vivo só após Guardar; discard restaura.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T008 [US1] Implement `setSlotCount(draft, n)` (increase: append empty slots; decrease empty-only path: auto-remove high-index empties + reindex) in `frontend/src/preferences/sceneDraft.ts` per [contracts/reduce-slot-count-ux.md](./contracts/reduce-slot-count-ux.md)
- [X] T009 [US1] Add N control (select/stepper 2–8) to `frontend/src/components/SceneEditor.tsx` panel; on change call draft helpers; preview uses `layoutGeometry` + draft `slot_count`
- [X] T010 [US1] Confirm save path in `frontend/src/pages/VoiceChannel.tsx` / `SceneEditor` `onSave` already sends full `draftLayout` including `slot_count`; discard/close without save restores base (no live PATCH until save) per FR-006/011
- [X] T011 [US1] Implement occupied-slot reduction picker UI in `frontend/src/components/SceneEditor.tsx`: when decrease would remove occupied slots, require selecting exactly `delta` slots; cancel keeps old N; confirm reindexes remaining per [contracts/reduce-slot-count-ux.md](./contracts/reduce-slot-count-ux.md)

**Checkpoint**: quickstart §1 e §4 (reduzir); N no rascunho sem afectar live até Guardar.

---

## Phase 4: User Story 2 - Mestre em destaque adapta-se a N (Priority: P1)

**Goal**: Mestre com N qualquer: 1 destaque (slot 0) + N−1 satélites; N=6 utilizável.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T012 [US2] Tune `mestre` branch of `layoutGeometry` in `frontend/src/components/sceneLayouts.ts` so N=2..8 keeps one dominant slot 0 and satellites fill remaining space (N=5 close to legacy look)
- [X] T013 [US2] Verify SceneEditor preview + live `CameraGrid` for mestre+N=6 after save in `frontend/src/components/SceneEditor.tsx` / `CameraGrid.tsx`; fix CSS grid gaps if needed in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: quickstart §2 passa.

---

## Phase 5: User Story 3 - Faixa torna-se N-up (Priority: P1)

**Goal**: Faixa com N tiles iguais; label `Faixa N-up`.

**Independent Test**: [quickstart.md](./quickstart.md) §3.

### Implementation for User Story 3

- [X] T014 [US3] Ensure `faixa` geometry is `repeat(n, 1fr)` / one row in `frontend/src/components/sceneLayouts.ts` for all n∈[2,8]
- [X] T015 [US3] Show dynamic label `Faixa ${n}-up` in layout picker / editor copy in `frontend/src/components/SceneEditor.tsx` (and `layoutGeometry` label helper) so UI never stuck on «5-up» when n≠5

**Checkpoint**: quickstart §3 passa.

---

## Phase 6: User Story 4 - Painel respeita N (Priority: P2)

**Goal**: Painel/quad = grelha equilibrada de N (sem destaque mestre).

**Independent Test**: [quickstart.md](./quickstart.md) §5.

### Implementation for User Story 4

- [X] T016 [US4] Finalize `quad` balanced grid (`ceil(sqrt(n))` cols) in `frontend/src/components/sceneLayouts.ts`; rename/display label away from hard-coded «2×2» when n≠4 in `frontend/src/components/SceneEditor.tsx`
- [X] T017 [US4] Smoke N=4 and N=6 painel in editor + after save via `CameraGrid.tsx`

**Checkpoint**: quickstart §5 passa.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Contract tests, types, docs.

- [X] T018 [P] Add/update contract tests in `backend/tests/contract/` (e.g. `scenes_activate.rs` / `grid_admin.rs` / new cases): accept mestre+6, faixa+3; reject slot_count 1 and 9; reject length mismatch per [contracts/scene-slot-count-api.md](./contracts/scene-slot-count-api.md)
- [X] T019 [P] Run `cd frontend && npx tsc --noEmit` and fix errors
- [X] T020 Run `cd backend && cargo test --test contract` and fix failures from validate_layout changes
- [X] T021 Execute [quickstart.md](./quickstart.md) §1–§5 and fix gaps
- [X] T022 [P] Update `docs/operar-instancia.md` note about max slots (was ≤5) to **2–8** if still outdated
- [X] T023 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T007)** → **US1 (T008–T011)** → **US2 (T012–T013)** → **US3 (T014–T015)** → **US4 (T016–T017)** → **Polish**
- US2–US4 mostly polish geometry/labels after US1 control exists
- BE T002 blocks meaningful save tests for N=6

### User Story Dependencies

```text
Foundational (validate_layout + layoutGeometry + setNamedLayout keeps N)
    ├── US1 N control + setSlotCount + reduce picker (MVP)
    ├── US2 Mestre geometry polish
    ├── US3 Faixa N-up + labels
    └── US4 Quad balanced grid
```

### Parallel Opportunities

- T002–T004 (BE) ∥ T005–T007 (FE) after T001
- T012 ∥ T014 ∥ T016 (geometry families) once US1 control works
- T018 ∥ T019 ∥ T022 in Polish

---

## Parallel Example: Foundational

```bash
Task: "Relax validate_layout in backend/src/domain/grid.rs"
Task: "Implement layoutGeometry(key,n) in frontend/src/components/sceneLayouts.ts"
```

---

## Parallel Example: Layout families (after US1)

```bash
Task: "Tune mestre geometry for N=2..8"
Task: "Faixa repeat(n,1fr) + Faixa N-up label"
Task: "Quad balanced grid for N"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Setup + Foundational (BE + geometry skeleton)
2. US1 control + setSlotCount + reduce picker
3. **STOP**: quickstart §1 + save N=6 with any layout
4. Then polish US2–US4 visuals + contract tests

### Incremental Delivery

1. Foundation → API accepts variable N
2. US1 → editor can set N (MVP)
3. US2 → Mestre looks right at 6
4. US3 → Faixa N-up
5. US4 → Painel scales
6. Polish → tests, docs, CHANGELOG

---

## Notes

- [P] = different files / no incomplete deps
- Destaque Mestre = always slot index 0
- Live stage only after Guardar
- Prefer reindex after slot removal to keep `0..N-1` contiguous for API
