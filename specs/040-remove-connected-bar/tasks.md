---
description: "Task list for remover barra ainda na chamada (040)"
---

# Tasks: Remover barra «ainda na chamada»; controlos só no PiP

**Input**: Design documents from `/specs/040-remove-connected-bar/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. Sem contract BE / TDD obrigatório.

**Organization**: Setup → Foundational (predicado PiP-only) → US1 remover barra → US2 Voltar no rodapé PiP → US3 hangup ícone → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar superfícies actuais antes de apagar/mover.

- [x] T001 [P] Inventory `voice-connected-bar` markup and `showConnectedBar` usage in `frontend/src/shell/AppShell.tsx` against [contracts/remove-connected-bar.md](./contracts/remove-connected-bar.md)
- [x] T002 [P] Inventory PiP header «Voltar à mesa» and drag handlers in `frontend/src/shell/FloatingVoicePip.tsx` against [contracts/pip-hangup-ui.md](./contracts/pip-hangup-ui.md); note `.voice-connected-bar*` CSS in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Alvos claros; sem UI nova ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Predicado off-stage só para PiP — **blocks** remoção limpa da barra sem perder o PiP.

**⚠️ CRITICAL**: Não remover o `<Show>` do PiP ao limpar a barra.

- [x] T003 Keep a single off-stage gate in `frontend/src/shell/AppShell.tsx` (`showConnectedBar` or rename to `showVoicePip`) that only mounts `FloatingVoicePip` when `voice.live() && voice.channelId() && params.id !== voice.channelId()` per [research.md](./research.md) §1 and [contracts/remove-connected-bar.md](./contracts/remove-connected-bar.md)
- [x] T004 [P] Confirm `voice.hangup()` on `frontend/src/voice/VoiceSession.tsx` leaves route unchanged and releases media (035) — to be called from PiP without `navigate`

**Checkpoint**: Um predicado; hangup contract known; ready for US1–US3.

---

## Phase 3: User Story 1 - Sem barra inferior ao navegar para texto (Priority: P1) 🎯 MVP

**Goal**: Fora da mesa, zero `voice-connected-bar`; PiP continua a representar a chamada.

**Independent Test**: [quickstart.md](./quickstart.md) §1 — `document.querySelector('.voice-connected-bar') === null` com PiP visível.

### Implementation for User Story 1

- [x] T005 [US1] Remove the `voice-connected-bar` `<Show>` block (info + Voltar/Sair) from `frontend/src/shell/AppShell.tsx`; leave only the PiP `<Show>` (FR-001, FR-010)
- [x] T006 [US1] Drop unused helpers props only used by the bar in `frontend/src/shell/AppShell.tsx` (e.g. `barTimer` if unused after removal); keep `navigate` only if still needed elsewhere in the file
- [x] T007 [P] [US1] Remove dead `.voice-connected-bar` / `-info` / `-name` / `-actions` rules from `frontend/src/styles/mesa-theme.css`; if PiP still uses `.voice-connected-bar-timer`, rename to `.voice-pip-timer` in CSS + `FloatingVoicePip.tsx` per [research.md](./research.md) §5

**Checkpoint**: SC-001 — barra ausente; PiP presente off-stage; call-controls do palco intactos (FR-007).

---

## Phase 4: User Story 2 - Voltar à mesa só no PiP (Priority: P1)

**Goal**: «Voltar à mesa» só no PiP, na fila de rodapé (esquerda); não depende da barra.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [x] T008 [US2] Move «Voltar à mesa» from `voice-pip-header` into a new footer `.voice-pip-actions` row in `frontend/src/shell/FloatingVoicePip.tsx` (left); header keeps title + timer as drag handle only per [contracts/pip-hangup-ui.md](./contracts/pip-hangup-ui.md)
- [x] T009 [US2] Add `.voice-pip-actions` flex styles (space-between / gap) in `frontend/src/styles/mesa-theme.css`; ensure Voltar remains usable after drag/snap (FR-006, FR-008)
- [x] T010 [US2] Verify no other shell «Voltar à mesa» for off-stage remains after US1 (grep `Voltar à mesa` in `frontend/src/shell/`)

**Checkpoint**: SC-002 — regresso à mesa só via PiP.

---

## Phase 5: User Story 3 - Sair da chamada no PiP (ícone vermelho) (Priority: P1)

**Goal**: Hangup só-ícone vermelho à direita do rodapé; sem navigate; sem mic/cam no PiP.

**Independent Test**: [quickstart.md](./quickstart.md) §§3–5.

### Implementation for User Story 3

- [x] T011 [US3] Add hangup button in `.voice-pip-actions` (right) in `frontend/src/shell/FloatingVoicePip.tsx`: `IconPhoneHangupFilled` from `frontend/src/components/icons/IconPhoneHangup.tsx`, danger styling, **no** visible «Sair» text (FR-004)
- [x] T012 [US3] Wire hangup to `void voice.hangup()` with **no** `navigate`; `aria-label` / `title` ≈ «Sair da chamada» (FR-003, FR-005)
- [x] T013 [US3] Stop pointer/drag propagation on footer action buttons in `FloatingVoicePip.tsx` so clicks do not start PiP drag (FR-008 edge case)
- [x] T014 [US3] Confirm PiP has **no** mic/camera controls (FR-009); do not alter stage leave in `frontend/src/pages/VoiceChannel.tsx` (FR-007)
- [x] T015 [US3] Note 039 coordination in implement notes if needed: PiP hangup is canonical off-stage leave until UserPanel ships ([research.md](./research.md) §6)

**Checkpoint**: SC-003/004 — sair pelo ícone; vista actual mantém-se; mídia libertada.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, quickstart, docs.

- [x] T016 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T017 Execute [quickstart.md](./quickstart.md) §§1–5; note any skips
- [x] T018 [P] Grep confirm no remaining `voice-connected-bar` class usage under `frontend/` (except intentional renames/comments)
- [x] T019 [P] Update `CHANGELOG.md` `[Unreleased]` and `docs/daily/yyyy-mm-dd.md` when implement completes (feature `040-remove-connected-bar`)

**Checkpoint**: Feature ready to demo.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T002)** → no blockers
- **Foundational (T003–T004)** → after Setup; **blocks** US1–US3
- **US1 (T005–T007)** → after Foundational (MVP: barra fora)
- **US2 (T008–T010)** → after US1 preferred (footer exists without bar confusion); can start after T003 if Voltar move is done carefully while bar still present — **prefer after US1**
- **US3 (T011–T015)** → after US2 (same `.voice-pip-actions` row)
- **Polish (T016–T019)** → after US1–US3

### User story dependencies

```text
US1 (remove bar) ──► US2 (Voltar footer) ──► US3 (hangup icon)
                         │
                         └── MVP ship after US1 is usable with existing header Voltar;
                             full acceptance needs US2+US3
```

### Within each story

- US1: T005 → T006; T007 [P] with T006
- US2: T008 → T009 → T010
- US3: T011 → T012 → T013; T014/T015 after hangup wired

### Parallel opportunities

- T001 ∥ T002 (Setup)
- T004 ∥ T003 (Foundational)
- T007 ∥ T006 (US1 CSS vs AppShell cleanup)
- T018 ∥ T019 (Polish)

---

## Parallel Example: User Story 1

```text
# After T003–T004:
Agent A: T005–T006 AppShell remove bar
Agent B: T007 mesa-theme.css dead rules + timer rename
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Setup + Foundational
2. Remove connected-bar; keep PiP (header Voltar still works from 038)
3. Validate quickstart §1
4. Stop / demo if needed — then US2+US3 for full FR-004 layout

### Incremental delivery

1. US1 → no bar
2. US2 → Voltar no rodapé
3. US3 → hangup ícone + stay on view
4. Polish → tsc, changelog, daily

### Suggested MVP scope

**US1** (remover barra) — unblocks altura do chat; Voltar já no PiP header até US2.

---

## Notes

- Sem tasks de teste automatizado (spec não pede TDD).
- Não alterar call-controls do palco.
- Coordenação 039: hangup no PiP agora; UserPanel pode tornar-se canónico depois — não triplicar Sair.
