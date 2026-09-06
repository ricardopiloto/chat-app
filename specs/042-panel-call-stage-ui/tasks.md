---
description: "Task list for painel de chamada e espaço do palco (042)"
---

# Tasks: Painel de chamada e espaço do palco

**Input**: Design documents from `/specs/042-panel-call-stage-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. Sem TDD / BE.

**Organization**: Setup → Foundational (predicado visibilidade) → US1 hide idle → US2 icon size → US3 stage height → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar predicados e CSS actuais.

- [x] T001 [P] Inventory `showCallGroup` / `callEnabled` / `is-disabled` in `frontend/src/shell/UserPanel.tsx` against [contracts/user-panel-call-visibility.md](./contracts/user-panel-call-visibility.md)
- [x] T002 [P] Inventory `.user-panel-ctrl` icon `size` props and `.stage` / `.voice-pane .pane-header` / `.privacy-line` rules in `frontend/src/styles/mesa-theme.css` per [research.md](./research.md) §§2–3

**Checkpoint**: Alvos claros; sem UI nova ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Predicado canónico de visibilidade — **blocks** US1 cleanup.

**⚠️ CRITICAL**: Grupo só quando em chamada e fora da mesa.

- [x] T003 Define visibility as `voice.live() && !viewingActiveVoiceStage(...)` (rename helper if useful) in `frontend/src/shell/UserPanel.tsx` per [research.md](./research.md) §1 — do not change hangup/PiP behavior

**Checkpoint**: Predicado documentado no código; pronto para US1–US3.

---

## Phase 3: User Story 1 - Controlos só quando em chamada (Priority: P1) 🎯 MVP

**Goal**: Sem chamada → zero `.user-panel-calls`; em chamada off-stage → grupo activo; na mesa → oculto no painel.

**Independent Test**: [quickstart.md](./quickstart.md) §§1–3.

### Implementation for User Story 1

- [x] T004 [US1] Change `Show when={…}` so call group mounts only when `live && !onStage` in `frontend/src/shell/UserPanel.tsx` (FR-001–003)
- [x] T005 [US1] Remove disabled/idle chrome: drop `is-disabled` classList, unused `disabled={!callEnabled()}` paths for out-of-call (group absent), and dead `.user-panel-calls.is-disabled` rules in `frontend/src/styles/mesa-theme.css` if unused (FR-004)
- [x] T006 [US1] Confirm identity/settings remain when group hidden in `UserPanel.tsx` (FR-008)

**Checkpoint**: SC-001/002/005; no grey call buttons when idle.

---

## Phase 4: User Story 2 - Ícones com o mesmo tamanho (Priority: P1)

**Goal**: Mic / deafen / cam / hangup same visual size; base = panel mic; fit current panel.

**Independent Test**: [quickstart.md](./quickstart.md) §4.

### Implementation for User Story 2

- [x] T007 [US2] Introduce shared panel icon size constant (current mic `size={18}`) and apply to mic, deafen, camera primary, hangup in `frontend/src/shell/UserPanel.tsx` (FR-005)
- [x] T008 [P] [US2] Align stroke vs filled visual box if needed (`IconDeafenOff` / `IconHeadphones` vs filled) via CSS on `.user-panel-ctrl svg` in `frontend/src/styles/mesa-theme.css` or icon tweak under `frontend/src/components/icons/` — do **not** match stage sizes
- [x] T009 [US2] Keep blur chevron smaller; ensure `.user-panel-ctrl` hit boxes stay equal height in `mesa-theme.css`

**Checkpoint**: SC-003.

---

## Phase 5: User Story 3 - Mais espaço vertical no palco (Priority: P1)

**Goal**: ~40–80px more usable `.stage` height via margins/padding + header/privacy chrome.

**Independent Test**: [quickstart.md](./quickstart.md) §5.

### Implementation for User Story 3

- [x] T010 [US3] Reduce `.stage` vertical margin/padding in `frontend/src/styles/mesa-theme.css` per [contracts/stage-vertical-space.md](./contracts/stage-vertical-space.md)
- [x] T011 [P] [US3] Compact `.voice-pane .pane-header` and/or `.privacy-line` vertical spacing in `frontend/src/styles/mesa-theme.css` (FR-006)
- [x] T012 [US3] Verify stage call-controls remain usable; narrow/drawer stage not broken (FR-007) — adjust if overshoot

**Checkpoint**: SC-004.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, quickstart, docs.

- [x] T013 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T014 Execute [quickstart.md](./quickstart.md) §§1–5; note skips
- [x] T015 [P] Update `CHANGELOG.md` `[Unreleased]` and `docs/daily/yyyy-mm-dd.md` when implement completes (`042-panel-call-stage-ui`)

**Checkpoint**: Feature ready to demo.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T002)** → none
- **Foundational (T003)** → after Setup; **blocks** US1
- **US1 (T004–T006)** → after T003 (MVP)
- **US2 (T007–T009)** → after US1 preferred (group exists when testing icons)
- **US3 (T010–T012)** → independent of US1/US2 after Setup (CSS-only); can parallel with US2
- **Polish** → after US1–US3

### User story dependencies

```text
US1 (hide idle) ──► US2 (icon size)
US3 (stage height) ∥ US1/US2 (CSS-only)
```

### Parallel opportunities

- T001 ∥ T002
- T008 ∥ T007 (CSS vs TSX)
- T010 ∥ T011
- T015 ∥ docs while T013 runs locally

---

## Parallel Example: User Story 3

```text
Agent A: T010 .stage margin/padding
Agent B: T011 pane-header / privacy-line
# Then T012 verify
```

---

## Implementation Strategy

### MVP (User Story 1)

1. Setup + T003  
2. Hide idle call group  
3. Validate quickstart §§1–3  

### Incremental delivery

1. US1 visibility  
2. US2 icons  
3. US3 stage height  
4. Polish / changelog / daily  

### Suggested MVP scope

**US1 only** — removes confusing disabled call controls.

---

## Notes

- Sem testes automatizados (spec não pede TDD).
- Não alterar PiP hangup nem call-controls do palco além do espaço vertical.
- Format: checkbox + ID + [P]/[USn] + paths — OK
