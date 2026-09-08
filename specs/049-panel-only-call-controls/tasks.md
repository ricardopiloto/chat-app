---
description: "Task list for Controlos de chamada só no painel"
---

# Tasks: Controlos de chamada só no painel

**Input**: Design documents from `/specs/049-panel-only-call-controls/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/panel-only-call-controls.md](./contracts/panel-only-call-controls.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: [quickstart.md](./quickstart.md) + `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Organization**: Setup → Foundational (contrato + predicado baseline) → US1 remover barra/Gravar do palco → US2 painel na mesa → US3 altura palco → Polish (tsc/docs).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/UserPanel.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar alvo Speckit e baseline actual (042/043 predicado + barra do palco).

- [X] T001 Confirm `.specify/feature.json` points at `specs/049-panel-only-call-controls` and skim `showCallGroup` / `.call-controls` / Gravar UI in `frontend/src/shell/UserPanel.tsx` + `frontend/src/pages/VoiceChannel.tsx`

**Checkpoint**: Baseline understood; feature dir correcto.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Alinhar implementadores ao contrato de visibilidade — **bloqueia** US1–US3 se o predicado antigo permanecer sem plano.

**⚠️ CRITICAL**: Não afirmar US2 completo até `showCallGroup` deixar de usar `!onStage`; não deixar Gravar na barra ao «só esconder» CSS.

- [X] T002 Re-read [contracts/panel-only-call-controls.md](./contracts/panel-only-call-controls.md) + [research.md](./research.md) R1–R3 and note: `showPanelCalls = inCall`; stage bar absent; scene-record UI absent; keep E2EE/Religar in `VoiceChannel.tsx`

**Checkpoint**: Contrato claro; implementação pode começar.

---

## Phase 3: User Story 1 - Sem barra de chamada no palco (Priority: P1) 🎯 MVP

**Goal**: Remover `.call-controls` do palco e a UI de gravação de cena (G1 suspenso).

**Independent Test**: [quickstart.md](./quickstart.md) A + E — na mesa em chamada: sem `.call-controls`, sem «Gravar cena…» / «Parar gravação».

### Implementation for User Story 1

- [X] T003 [US1] Remove the stage `<div class="call-controls">…</div>` block (and its wrapping `Show` if empty) from `frontend/src/pages/VoiceChannel.tsx` per FR-001 / R2
- [X] T004 [US1] Remove scene-record UI from `frontend/src/pages/VoiceChannel.tsx`: «Gravar cena…» / «Parar gravação», Gravar dialog, and unused `confirmGravar` / `stopRecording` / related signals & `startEgress`/`stopEgress` imports if dead; keep E2EE banner + Religar (FR-006 / R3)
- [X] T005 [P] [US1] Optionally trim unused `.call-controls` rules in `frontend/src/styles/mesa-theme.css` if nothing else references them (polish-safe; skip if shared)

**Checkpoint**: Palco sem barra pessoal nem Gravar; E2EE/Religar intactos. **Nota**: até US2, na mesa o utilizador pode ficar sem controlos no painel — completar T006 a seguir.

---

## Phase 4: User Story 2 - Controlos no painel também na mesa (Priority: P1)

**Goal**: Painel mostra controlos sempre que `voice.live()`, inclusive na mesa; fora de chamada continua oculto.

**Independent Test**: [quickstart.md](./quickstart.md) A–C — mesa com grupo utilizável; texto com grupo; idle sem grupo.

### Implementation for User Story 2

- [X] T006 [US2] Change `showCallGroup` in `frontend/src/shell/UserPanel.tsx` to `voice.live()` only (drop `!onStage()`); remove unused `useParams` / `viewingActiveVoiceStage` imports if no longer needed (FR-002–FR-004 / R1)
- [X] T007 [US2] Spot-check panel controls still respect listen-only / leave / blur in `frontend/src/shell/UserPanel.tsx` while on stage (FR-007); no code change unless broken

**Checkpoint**: Único sítio de controlos = painel em chamada (mesa ou não).

---

## Phase 5: User Story 3 - Mais área útil no palco (Priority: P2)

**Goal**: Espaço da barra removida reverte para cena/slots.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 3

- [X] T008 [US3] Verify voice pane / stage flex in `frontend/src/pages/VoiceChannel.tsx` + `frontend/src/styles/mesa-theme.css` gains height after bar removal (SC-005 / R5); adjust only if a residual min-height/flex blocks the gain

**Checkpoint**: Palco visualmente mais alto em chamada.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Types, backlog note, docs de entrega.

- [X] T009 Confirm `docs/backlog-prototype-v2-gaps.md` still lists G1 as future backlog (049 clarify); tweak note only if stale
- [X] T010 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and smoke [quickstart.md](./quickstart.md) A–E
- [X] T011 After successful implement: append `docs/daily/yyyy-mm-dd.md` Speckit section and `[Unreleased]` in `CHANGELOG.md` for `049-panel-only-call-controls`

**Checkpoint**: Validação + docs.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None
- **Foundational (Phase 2)**: Depends on Setup — short contract read
- **US1 (Phase 3)**: After Foundational — remove stage bar + Gravar
- **US2 (Phase 4)**: After Foundational; **must follow or pair with US1** so mesa never lacks controls (T006 right after T003–T004)
- **US3 (Phase 5)**: After US1 bar removal (natural height gain)
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1**: Remove stage chrome (+ record UI)
- **US2**: Panel predicate — required for usable mesa after US1
- **US3**: Validates layout consequence of US1

### Parallel Opportunities

- T005 ‖ T006 after T003 (CSS trim vs panel predicate) — prefer finishing T006 before demo
- T009 ‖ T008 (backlog note vs height check)

---

## Parallel Example: After removing stage bar

```bash
Task: "T006 [US2] showCallGroup = voice.live() in UserPanel.tsx"
Task: "T005 [P] [US1] trim unused .call-controls CSS in mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1–2 (baseline + contract)
2. Phase 3 US1 (remove stage bar + Gravar)
3. Phase 4 US2 (panel on stage) — **do not ship US1 alone**
4. **STOP**: quickstart A–C

### Incremental Delivery

1. + US3 → height check
2. + Polish → tsc + daily/CHANGELOG

---

## Notes

- Prefer deleting JSX/handlers over CSS-only hide
- Do not remove backend egress APIs
- Keep E2EE banner + Religar
- Format: all tasks use `- [ ]`, Task ID, optional `[P]` / `[Story]`, and file paths
