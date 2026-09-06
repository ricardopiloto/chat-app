---
description: "Task list for aura de a falar no botão de microfone dos call-controls"
---

# Tasks: Aura de «a falar» no botão de microfone dos call-controls

**Input**: Design documents from `/specs/036-mic-ctrl-speaking-aura/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/call-mic-speaking-aura.md](./contracts/call-mic-speaking-aura.md), [quickstart.md](./quickstart.md); depends on [033](../033-voice-speaking-indicator/)

**Tests**: Manual/quickstart + `tsc --noEmit` (plano). Sem contract BE.

**Organization**: Setup → Foundational (confirmar signal 033) → US1 aura no botão → US2 mute → US3 consistência visual/a11y → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar superfície do botão mic e CSS 033 a reutilizar.

- [X] T001 [P] Locate call-controls mic button markup in `frontend/src/pages/VoiceChannel.tsx` and roster aura rules (`.voice-roster-media-icon.is-speaking`, `@keyframes voice-roster-speak-aura`) in `frontend/src/styles/mesa-theme.css` per [contracts/call-mic-speaking-aura.md](./contracts/call-mic-speaking-aura.md)

**Checkpoint**: Alvos claros; sem wiring ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Garantir acesso ao estado speaking local — **blocks** US1.

**⚠️ CRITICAL**: Sem `speakingAccountIds` + `micOn` não há condição correcta.

- [X] T002 Confirm `useVoiceSession().speakingAccountIds` and `micOn` are available in the call-controls render path in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/voice/VoiceSession.tsx` (no new ActiveSpeakers listener — research R1); add a tiny local helper only if needed

**Checkpoint**: Dá para derivar `aura = micOn && speakingAccountIds.has(me.id)` no voice pane.

---

## Phase 3: User Story 1 - Aura no meu microfone enquanto falo (Priority: P1) 🎯 MVP

**Goal**: Botão inteiro de mic mostra aura quando eu falo com mic ligado.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 1.

### Implementation for User Story 1

- [X] T003 [US1] Apply speaking class on the **whole** mic button (not only the SVG) when local speaking + mic on in `frontend/src/pages/VoiceChannel.tsx` per FR-001 / research R2
- [X] T004 [US1] Add CSS for `.call-controls` mic button speaking aura (`position: relative`, `::before` around full button, reuse 033 keyframes/colors, scale for ~44–48px) in `frontend/src/styles/mesa-theme.css` per [contracts/call-mic-speaking-aura.md](./contracts/call-mic-speaking-aura.md)
- [X] T005 [US1] Ensure aura clears when speaking stops (rely on 033 debounce/set; no stuck class) in `frontend/src/pages/VoiceChannel.tsx`

**Checkpoint**: Falar → aura no botão ≤1 s; silêncio → sem aura ≤2 s.

---

## Phase 4: User Story 2 - Mute sem aura (Priority: P1)

**Goal**: Mic desligado nunca mostra aura; mute corta aura depressa.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 2.

### Implementation for User Story 2

- [X] T006 [US2] Gate speaking class with `micOn()` false → never `is-speaking` even if ActiveSpeakers still lists self in `frontend/src/pages/VoiceChannel.tsx` (FR-003 / research R4)
- [X] T007 [US2] Verify mute while speaking removes aura promptly (same gate as T006; adjust only if class lags) in `frontend/src/pages/VoiceChannel.tsx`

**Checkpoint**: SC-003 — ruído com mic off → sem aura.

---

## Phase 5: User Story 3 - Consistência visual e a11y (Priority: P2)

**Goal**: Mesma linguagem que a lista; rótulos inalterados; legível claro/escuro.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 3.

### Implementation for User Story 3

- [X] T008 [US3] Align call-ctrl speaking styles with roster accent/pulse (shared keyframes or mirrored tokens; light-theme overrides) in `frontend/src/styles/mesa-theme.css` (FR-004 / SC-004–005)
- [X] T009 [US3] Keep `aria-label` and `title` as only «Microfone ligado» / «Microfone desligado» (no «a falar» in accessible name) in `frontend/src/pages/VoiceChannel.tsx` (FR-007)

**Checkpoint**: Lado a lado com roster = mesma família; a11y labels estáveis.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Scope check e validação.

- [X] T010 Confirm no speaking aura classes on camera / blur / leave controls in `frontend/src/pages/VoiceChannel.tsx` (FR-006)
- [X] T011 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [X] T012 Manual pass [quickstart.md](./quickstart.md) US1–US3; note if browser unavailable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after Setup; **blocks** US1
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after T003 (same gate expression)
- **Phase 5 (US3)** → after T004 CSS exists
- **Phase 6** → after stories

### User Story Dependencies

- **US1**: Needs speaking signal + button class + CSS
- **US2**: Needs US1 class wiring + mic gate
- **US3**: Needs US1 CSS; polish tokens/labels

### Parallel Opportunities

- T004 (CSS) ∥ T003 (classList) after T002
- T008 ∥ T009 after US1
- T010 ∥ T011 in polish

### Parallel example

```text
T002 → T003 ∥ T004 → T005–T007 → T008 ∥ T009 → T010–T012
```

---

## Implementation Strategy

### MVP (User Story 1)

1. T001–T005 — aura no botão ao falar  
2. Stop: quickstart US1  

### Incremental delivery

1. MVP  
2. US2 mute gate  
3. US3 visual/a11y + polish  

### Notes

- Não duplicar ActiveSpeakers  
- Não mudar toggleMic behaviour  
- FE-only  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002 | 1 |
| US1 | T003–T005 | 3 |
| US2 | T006–T007 | 2 |
| US3 | T008–T009 | 2 |
| Polish | T010–T012 | 3 |
| **Total** | T001–T012 | **12** |

**Parallel opportunities**: classList ∥ CSS; visual ∥ a11y labels.

**MVP scope**: Phase 2–3 (T002–T005).

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
