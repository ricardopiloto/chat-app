---
description: "Task list for Fase 3 — Correções de UI (palco, editor, escala)"
---

# Tasks: Fase 3 — Correções de UI (palco, editor, escala)

**Input**: Design documents from `/specs/005-fase3-ui-corrections/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Actualizar contract tests Rust quando a API mudar ([research.md D9](./research.md#d9--testes)); regressão `cargo test` + `npx tsc --noEmit`; validação manual quickstart + fidelity checklist.

**Organization**: Foundation (migration + `layout_key`) bloqueia US2. US1 (palco móvel) e US3 (escala) são sobretudo CSS/shell. US4 remove UI + owner-only API.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4] on user-story phases only
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`, `backend/` (migration + domain/api/tests).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Módulo de catálogo partilhado no cliente e pasta/contratos alinhados.

- [x] T001 Create layout catalog module `frontend/src/components/sceneLayouts.ts` encoding `mestre` / `quad` / `faixa` (slot counts + CSS grid cells) per [contracts/layout-catalog.md](./contracts/layout-catalog.md)
- [x] T002 [P] Extend TypeScript types with `layout_key` on grid/scene payloads in `frontend/src/api/client.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistência `layout_key`, validação 2–5, owner-only activate/edit — **bloqueia** US2 e parte de US4.

**⚠️ CRITICAL**: US2 (editor/layouts) cannot begin until this phase completes API/types roundtrip.

- [x] T003 Add SQLite migration `backend/migrations/0005_layout_key.sql` — `layout_key` on `scene` (+ channel active grid mirror if needed) with backfill per [research.md D1](./research.md#d1--persistir-layout_key--slot_count-25) / [data-model.md](./data-model.md)
- [x] T004 Extend `GridLayout` + `validate_layout` for `layout_key` and slot_count matching catalog (allow 5) in `backend/src/domain/grid.rs`
- [x] T005 Wire `layout_key` through scene/grid DB read/write in `backend/src/db/scene.rs` and `backend/src/db/grid.rs` (and channel active scene helpers in `backend/src/db/channel.rs` as needed)
- [x] T006 Expose `layout_key` on GET/PUT grid and scene list/PATCH responses in `backend/src/api/grid.rs` and `backend/src/api/scenes.rs` (or equivalent scene handlers) per [contracts/scenes-grid.md](./contracts/scenes-grid.md)
- [x] T007 Enforce **owner-only** on scene activate, scene PATCH layout, and PUT grid in `backend/src/api/scenes.rs` / `backend/src/api/grid.rs` (co_director → 403) per [research.md D4](./research.md#d4--activação-e-edição-só-dono)
- [x] T008 Update Rust contract tests for `layout_key` roundtrip, 5-slot layouts, and non-owner/co_director activate 403 in `backend/tests/contract/scenes*.rs`, `backend/tests/contract/grid*.rs`, `backend/tests/contract/channel_roles.rs`

**Checkpoint**: `cargo test` green with new migration; GET grid returns `layout_key`.

---

## Phase 3: User Story 1 - Modo palco no telemóvel mostra o vídeo (Priority: P1) 🎯 MVP

**Goal**: Em viewport estreita, Modo palco mantém palco/tiles/vídeo visíveis (não ecrã vazio).

**Independent Test**: [quickstart.md](./quickstart.md) US1.

### Implementation for User Story 1

- [x] T009 [US1] Fix narrow + stage-mode CSS so `.shell-main` / `.stage` keep usable height (min-height / flex chain) in `frontend/src/styles/mesa-theme.css` per [research.md D3](./research.md#d3--modo-palco-vazio-no-telemóvel) and [contracts/ui-corrections.md](./contracts/ui-corrections.md)
- [x] T010 [US1] Adjust stage-mode / drawer behavior for narrow viewports in `frontend/src/shell/AppShell.tsx` so stage mode closes drawer without collapsing main pane
- [x] T011 [US1] Re-run media layout after stage-mode toggle (dispatch or effect) from `frontend/src/pages/VoiceChannel.tsx` so tiles reattach after shell resize

**Checkpoint**: Quickstart US1 — vídeo visível em modo palco no telemóvel.

---

## Phase 4: User Story 2 - Editor de cena fiel ao protótipo (Priority: P1)

**Goal**: Layouts nomeados, geometria CSS, banco = room, Salvar/Descartar, empilhado + toque 2 passos; Composição usa mesma geometria.

**Independent Test**: [quickstart.md](./quickstart.md) US2.

### Implementation for User Story 2

- [x] T012 [US2] Extend `SceneDraft` helpers for `layout_key` + resize on layout change in `frontend/src/preferences/sceneDraft.ts`
- [x] T013 [US2] Rewrite `frontend/src/components/SceneEditor.tsx` — named layout thumbnails (`mestre`/`quad`/`faixa`), stacked layout &lt;900px, bank = in-call only, two-tap assign + optional drag, Salvar/Descartar per [contracts/ui-corrections.md](./contracts/ui-corrections.md)
- [x] T014 [US2] Render catalog geometry (`grid-column`/`grid-row`) in `frontend/src/components/CameraGrid.tsx` from `layout_key` via `sceneLayouts.ts`
- [x] T015 [US2] Persist `layout_key` on Salvar (PATCH scene / PUT grid) and load it into editor/live grid in `frontend/src/pages/VoiceChannel.tsx`
- [x] T016 [US2] Gate edit/activate UI to server owner only in `frontend/src/pages/VoiceChannel.tsx` + `frontend/src/components/SceneList.tsx` (no co-director activate)

**Checkpoint**: Mestre/Faixa/2×2 roundtrip; 2º cliente vê Composição correcta.

---

## Phase 5: User Story 3 - Tipografia e controlos à escala (Priority: P1)

**Goal**: Tipo e botões próximos do protótipo; alvos ≥40px.

**Independent Test**: [quickstart.md](./quickstart.md) US3.

### Implementation for User Story 3

- [x] T017 [P] [US3] Bump authenticated SPA base type scale and pane/sidebar hierarchy in `frontend/src/styles/mesa-theme.css` (+ `frontend/src/styles/nocturne.css` overrides if needed) per [contracts/ui-corrections.md](./contracts/ui-corrections.md)
- [x] T018 [P] [US3] Ensure call controls, channel items, primary pills use min-height ≥40px in `frontend/src/styles/mesa-theme.css` and voice/chrome markup in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/shell/Sidebar.tsx`
- [x] T019 [US3] Align auth/invite card control sizing with the same scale in `frontend/src/pages/Auth.tsx` and `frontend/src/pages/Invite.tsx` if still undersized

**Checkpoint**: Side-by-side with prototype — no “miniature” UI.

---

## Phase 6: User Story 4 - Remover co-diretor e texto no canal de vídeo (Priority: P2)

**Goal**: Sem painel co-diretor; sem chat no ecrã de voz; API owner-only já em T007 — UI deixa de chamar roles.

**Independent Test**: [quickstart.md](./quickstart.md) US4.

### Implementation for User Story 4

- [x] T020 [US4] Remove text message list + composer from `frontend/src/pages/VoiceChannel.tsx` (keep text channels in `frontend/src/pages/Channel.tsx`)
- [x] T021 [US4] Remove `CoDirectorPanel` usage and roles fetch/UI from `frontend/src/pages/VoiceChannel.tsx` (leave `frontend/src/components/CoDirectorPanel.tsx` unused or delete if unused elsewhere)
- [x] T022 [US4] Confirm SceneList has no co-director activate path for non-owners in `frontend/src/components/SceneList.tsx` (align with T016)

**Checkpoint**: Voice screen = palco + controlos + cenas; texto só em canais de texto.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Regressão, fidelidade, docs.

- [x] T023 [P] Run `cargo test` in `backend/` and fix remaining regressions from layout_key / auth changes
- [x] T024 [P] Run `npx tsc --noEmit` in `frontend/` and fix type errors
- [x] T025 Complete [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md) (≥90%) against SPA + prototype
- [x] T026 Execute [quickstart.md](./quickstart.md) US1–US4; note gaps
- [x] T027 [P] Add brief note to `docs/operar-instancia.md` that scene layouts include named patterns (mestre/quad/faixa) and slot_count may be 5 — no new ports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: After Setup types/catalog — **BLOCKS** US2 (and hardens US4 auth)
- **US1 (Phase 3)**: After Setup optional; can parallel Foundational (CSS-only) once shell exists
- **US2 (Phase 4)**: After Foundational (T003–T008) + T001
- **US3 (Phase 5)**: After Setup; parallel US1/US2 CSS-wise
- **US4 (Phase 6)**: After T007; practical after VoiceChannel editor stable (US2)
- **Polish (Phase 7)**: After desired stories

### User Story Dependencies

- **US1**: Independent of backend `layout_key` (CSS/shell)
- **US2**: Requires Foundational API + `sceneLayouts.ts`
- **US3**: Independent scale pass (coordinate with US1 CSS file edits — serialize mesa-theme edits)
- **US4**: Requires T007; remove UI from VoiceChannel after/with US2

### Parallel Opportunities

- T001 ∥ T002
- T009–T011 (US1) ∥ T003–T008 (Foundational) if different owners
- T017 ∥ T018 (careful: same CSS file — prefer sequential on `mesa-theme.css`)
- T023 ∥ T024 ∥ T027

---

## Parallel Example: Foundation + US1

```bash
# Dev A: migration + domain + API (T003–T008)
# Dev B: mesa-theme stage-mode fix + AppShell (T009–T010)
```

## Parallel Example: US3 vs US4 cleanup

```bash
# After US2: scale CSS (T017–T019) || remove voice text/codirector (T020–T021)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (catalog types optional for US1)
2. Phase 3 US1 — fix empty stage on mobile
3. **STOP** — validate quickstart US1

### Incremental Delivery

1. US1 palco móvel
2. Foundational + US2 editor/layouts
3. US3 escala
4. US4 remoções
5. Polish cargo/tsc/fidelity

### Parallel Team Strategy

- After Phase 1: A → Foundational+US2; B → US1+US3; then A/B → US4 + polish

---

## Notes

- [P] = different files, no incomplete deps
- Next migration number: `0005_layout_key.sql` (after `0004_scene_timestamps.sql`)
- Do not re-enable co-director UI or voice-channel text chat
- Suggested MVP: **US1** (palco visível); full value needs **Foundational + US2**
