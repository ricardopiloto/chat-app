---
description: "Task list for Menu de blur da câmara não abre"
---

# Tasks: Menu de blur da câmara não abre

**Input**: Design documents from `/specs/023-fix-blur-menu/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD na spec. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) §1–§3.

**Organization**: Setup → Foundational (CSS overflow) → US1 open → US2 close/select → US3 stage → Polish (+ Portal fallback se preciso).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/mesa-theme.css`, `frontend/src/components/CameraBlurMenu.tsx`, `frontend/src/pages/VoiceChannel.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar clipping.

- [X] T001 Confirm `.call-ctrl-split { overflow: hidden }` and `.camera-blur-menu` absolute positioning in `frontend/src/styles/mesa-theme.css` against [research.md](./research.md) R1 (no code yet)

**Checkpoint**: Root cause documented as overflow clip.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Unclip the menu while keeping Discord split chrome — **blocks** all stories.

- [X] T002 Change `.call-ctrl-split` in `frontend/src/styles/mesa-theme.css` to `overflow: visible` (or remove `hidden`) and restore pill corners via first/last child `border-radius` so the split still looks unified per [research.md](./research.md) R2 and [contracts/blur-menu-visibility.md](./contracts/blur-menu-visibility.md)

**Checkpoint**: Menu can paint outside the split bounds.

---

## Phase 3: User Story 1 - Abrir o menu pela seta (Priority: P1) 🎯 MVP

**Goal**: Clique na seta mostra as 3 opções.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T003 [US1] Verify chevron `onClick` still toggles `blurMenuOpen` in `frontend/src/pages/VoiceChannel.tsx`; ensure menu panel is not clipped after T002 (raise `.camera-blur-menu` z-index in `frontend/src/styles/mesa-theme.css` if covered)
- [X] T004 [US1] Confirm open works with `data-blur="on"` and `"off"` (no code change unless a regression is found) via `frontend/src/pages/VoiceChannel.tsx` / `CameraBlurMenu.tsx`

**Checkpoint**: §1 passa em layout normal.

---

## Phase 4: User Story 2 - Fechar e escolher (Priority: P1)

**Goal**: Opção / Escape / fora / toggle intactos; ícone câmara só toggle.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T005 [US2] Smoke-select Sem blur / Blur leve / Blur forte through `frontend/src/components/CameraBlurMenu.tsx` + `VoiceChannel.tsx` `selectBlurMode` — menu closes and mode applies (015 behaviour)
- [X] T006 [US2] Confirm Escape and outside `pointerdown` still close without breaking after overflow change; chevron remains inside `.camera-blur-anchor` exclusion in `frontend/src/components/CameraBlurMenu.tsx`

**Checkpoint**: §2 passa.

---

## Phase 5: User Story 3 - Modo palco (Priority: P2)

**Goal**: Mesmo comportamento em stage-mode.

**Independent Test**: [quickstart.md](./quickstart.md) §3.

### Implementation for User Story 3

- [X] T007 [US3] Validate menu visibility under `.shell.stage-mode` / `stage-channels-expanded` in `frontend/src/styles/mesa-theme.css`; if still clipped by `.pane` or stage stacking, escalate z-index or move menu via Portal/`VoiceChannel.tsx` per [research.md](./research.md) R2–R3
- [X] T008 [US3] Re-check select/close in stage mode (same as §2)

**Checkpoint**: §3 passa.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T009 [P] Run `cd frontend && npx tsc --noEmit` and fix errors
- [X] T010 Execute [quickstart.md](./quickstart.md) §1–§3
- [X] T011 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002)** → **US1** → **US2** → **US3** → **Polish**
- US3 may require Portal only if T002 insufficient

### User Story Dependencies

```text
Foundational (overflow visible + pill radii)
    ├── US1 menu visible on chevron click (MVP)
    ├── US2 select / Escape / outside
    └── US3 stage-mode stacking
```

### Parallel Opportunities

- Limited (mostly CSS + smoke). T009 after code stable.

---

## Parallel Example

```bash
Task: "Raise .camera-blur-menu z-index if needed in mesa-theme.css"
Task: "Smoke chevron toggle in VoiceChannel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. T002 overflow fix
2. Confirm open in normal layout
3. **STOP**: §1
4. Then close/select + stage

### Incremental Delivery

1. Unclip → verify interactions → stage → Polish (`tsc` + daily/CHANGELOG on implement)

---

## Notes

- Prefer CSS-only fix; Portal is fallback for US3
- Do not change blur option set or media pipeline
- Keep Discord split look without `overflow: hidden` on the menu ancestor
