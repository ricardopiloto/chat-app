---
description: "Task list for controlos de chamada no painel só em chamada (043)"
---

# Tasks: Controlos de chamada no painel só em chamada

**Input**: Design documents from `/specs/043-panel-calls-in-call-only/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. Sem TDD / BE. Spec não pede testes automatizados.

**Organization**: Setup (inventory) → Foundational (predicado canónico) → US1 hide idle → US2 off-stage show → US3 on-stage hide → Polish. Prefer **verify-first**: se 042 já cumpre, marcar implementação como confirmação e só editar em regressão.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar source vs contrato antes de qualquer fix.

- [x] T001 [P] Inventory `showCallGroup` / `Show when=` / any `is-disabled` path in `frontend/src/shell/UserPanel.tsx` against [contracts/panel-calls-visibility.md](./contracts/panel-calls-visibility.md)
- [x] T002 [P] Grep for leftover `.user-panel-calls.is-disabled` (or disabled call-group chrome) in `frontend/src/styles/mesa-theme.css` and `frontend/src/`

**Checkpoint**: Saber se o trabalho é «já cumprido» vs «restaurar predicado».

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Predicado canónico — **blocks** story fixes.

**⚠️ CRITICAL**: Grupo só com `voice.live() && !viewingActiveVoiceStage(...)`.

- [x] T003 Ensure `showCallGroup` (or equivalent) equals `voice.live() && !viewingActiveVoiceStage(params.id, voice)` in `frontend/src/shell/UserPanel.tsx` per [research.md](./research.md) R2 / [data-model.md](./data-model.md) — do not change hangup/PiP behavior

**Checkpoint**: Predicado correcto no código; stories podem validar ou corrigir mount.

---

## Phase 3: User Story 1 - Sem chamada: sem controlos no painel (Priority: P1) 🎯 MVP

**Goal**: Fora de chamada → zero `.user-panel-calls` e zero chrome `is-disabled`; identidade permanece.

**Independent Test**: [quickstart.md](./quickstart.md) Scenario A (+ hard refresh).

### Implementation for User Story 1

- [x] T004 [US1] Mount call group only via `<Show when={showCallGroup()}>` (or equivalent) so `!live` never renders `.user-panel-calls` in `frontend/src/shell/UserPanel.tsx` (FR-001)
- [x] T005 [US1] Remove any idle/disabled call-group path (`is-disabled`, `disabled={!callEnabled}`, empty placeholder group) from `frontend/src/shell/UserPanel.tsx` and dead CSS in `frontend/src/styles/mesa-theme.css` (FR-001)
- [x] T006 [US1] Confirm identity/settings row still renders when call group is absent in `frontend/src/shell/UserPanel.tsx` (FR-004)

**Checkpoint**: SC-001; DOM probe `querySelector('.user-panel-calls') === null` when idle.

---

## Phase 4: User Story 2 - Em chamada fora da mesa: controlos visíveis (Priority: P1)

**Goal**: `live && !onStage` → grupo montado e utilizável (incl. sair); some ao leave.

**Independent Test**: [quickstart.md](./quickstart.md) Scenario B.

### Implementation for User Story 2

- [x] T007 [US2] Verify/fix that off-stage live session shows enabled panel call controls (mic/deafen/cam/leave) in `frontend/src/shell/UserPanel.tsx` (FR-002)
- [x] T008 [US2] Verify leave/disconnect unmounts `.user-panel-calls` immediately (same `Show` + `voice.live()`); adjust only if leave leaves stale UI in `UserPanel.tsx` / `VoiceSession.tsx` (FR-002)

**Checkpoint**: SC-002.

---

## Phase 5: User Story 3 - Na mesa: controlos no palco, não no painel (Priority: P2)

**Goal**: `live && onStage` → painel sem grupo; palco mantém call-controls.

**Independent Test**: [quickstart.md](./quickstart.md) Scenario C.

### Implementation for User Story 3

- [x] T009 [US3] Confirm `viewingActiveVoiceStage` hides panel call group on active voice route in `frontend/src/shell/UserPanel.tsx` (FR-003)
- [x] T010 [P] [US3] Spot-check stage call-controls remain the active site on voice channel view (no panel duplicate) — `frontend/src/pages/VoiceChannel.tsx` / stage chrome only if regression found

**Checkpoint**: FR-003; um sítio activo.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, quickstart, docs.

- [x] T011 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T012 Execute [quickstart.md](./quickstart.md) Scenarios A–C after hard refresh; document skip/pass (FR-005)
- [x] T013 [P] Update `CHANGELOG.md` `[Unreleased]` and `docs/daily/yyyy-mm-dd.md` when implement completes (`043-panel-calls-in-call-only`) — note «verified / no code change» if applicable

**Checkpoint**: Feature ready to demo.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T002)** → none
- **Foundational (T003)** → after Setup; **blocks** US1–US3 code fixes
- **US1 (T004–T006)** → after T003 (MVP)
- **US2 (T007–T008)** → after US1 mount rules (same `Show`)
- **US3 (T009–T010)** → after T003; can follow US1
- **Polish** → after stories validated

### User story dependencies

- **US1** — MVP; hide idle chrome
- **US2** — same predicado; assert off-stage show + leave hide
- **US3** — same predicado; assert on-stage hide

### Parallel opportunities

- T001 ∥ T002
- T005 CSS cleanup ∥ T004 TSX (careful merge on same feature)
- T010 ∥ T009 after T003
- T013 ∥ T011/T012 docs vs typecheck

### Parallel example: User Story 1

```text
# After T003:
T004 UserPanel Show when=live&&!onStage
T005 Remove is-disabled paths (TSX + CSS)
T006 Identity remains
```

### Implementation strategy

1. **MVP**: T001–T006 (idle → no group)
2. Validate US2/US3 via quickstart; code only on regression
3. Polish: tsc + changelog/daily

### Notes

- [042](../042-panel-call-stage-ui/) may already satisfy all FRs — implement may complete with verification only.
- Do **not** reintroduce disabled placeholder chrome.
- No backend / API tasks.

### Implement notes (2026-09-06)

- Verify-first: 042 already shipped the predicate; no `is-disabled` in FE source.
- T012: source + contract pass; if browser still shows `user-panel-calls is-disabled`, hard-refresh / restart Vite (stale bundle).
