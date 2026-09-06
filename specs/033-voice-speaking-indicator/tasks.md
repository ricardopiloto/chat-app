---
description: "Task list for indicador animado de a falar na lista do canal de voz"
---

# Tasks: Indicador animado de «a falar» na lista do canal de voz

**Input**: Design documents from `/specs/033-voice-speaking-indicator/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/voice-speaking-roster-ui.md](./contracts/voice-speaking-roster-ui.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup (ícone + CSS) → Foundational (ActiveSpeakers em VoiceSession) → US1 aura → US2 ícones estáveis → US3 self + mute gate → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/voice/VoiceSession.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/components/icons/`, `frontend/src/styles/mesa-theme.css`, `frontend/src/video/liveClient.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ícone de saída e estilos base da aura (sem wiring ainda).

- [x] T001 [P] Add `frontend/src/components/icons/IconHeadphones.tsx` (listening/headphones glyph via `Icon` shell; `aria`-friendly) per [research.md](./research.md) R5 — no deafen variant
- [x] T002 [P] Add `.voice-roster-media-icon` and `.voice-roster-media-icon.is-speaking` aura styles (same treatment for mic + headphones) in `frontend/src/styles/mesa-theme.css` per [contracts/voice-speaking-roster-ui.md](./contracts/voice-speaking-roster-ui.md); verify contrast tokens for light/dark

**Checkpoint**: Icon + CSS ready to mount in roster rows.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sinal de speaking a partir da Room LiveKit — **blocks** aura stories.

**⚠️ CRITICAL**: Sem API/WS nova; identity = `account_id` UUID string.

- [x] T003 Register `RoomEvent.ActiveSpeakersChanged` on the active LiveKit `Room` (in `frontend/src/voice/VoiceSession.tsx` and/or `frontend/src/video/liveClient.ts`) and map `participant.identity` → speaking set per [research.md](./research.md) R1–R2
- [x] T004 Expose `speakingAccountIds` accessor on VoiceSession context and **clear** it on hangup / disconnect / leave in `frontend/src/voice/VoiceSession.tsx`

**Checkpoint**: In-call client can read who LiveKit marks as speaking by account id.

---

## Phase 3: User Story 1 - Ver quem está a falar (Priority: P1) 🎯 MVP

**Goal**: Participantes na mesma chamada vêem aura nos ícones de quem fala; para ao silêncio.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — Aura entre participantes.

### Implementation for User Story 1

- [x] T005 [US1] In `frontend/src/shell/Sidebar.tsx` roster rows, compute `speaking` = `voice.live() && speakingAccountIds.has(account_id) && occupant.mic_on` per [contracts/voice-speaking-roster-ui.md](./contracts/voice-speaking-roster-ui.md) / FR-010
- [x] T006 [US1] Apply `is-speaking` class to **both** mic and headphones icon wrappers when `speaking` in `frontend/src/shell/Sidebar.tsx`
- [x] T007 [US1] Ensure viewers **not** in call (`!voice.live()`) never get `is-speaking` even if roster shows transmitters in `frontend/src/shell/Sidebar.tsx`

**Checkpoint**: Two-in-call aura works; out-of-call observer sees no aura.

---

## Phase 4: User Story 2 - Ícones presentes e legíveis (Priority: P1)

**Goal**: Cada linha da lista mostra mic (on/off) + headphones «a ouvir».

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — Ícones.

### Implementation for User Story 2

- [x] T008 [US2] Render `IconMicOn` / `IconMicOff` from `mic_on` with PT `aria-label` on each `.voice-roster-item` in `frontend/src/shell/Sidebar.tsx`
- [x] T009 [US2] Render `IconHeadphones` with `aria-label` «A ouvir» (always listening visual; no deafen control) in `frontend/src/shell/Sidebar.tsx`
- [x] T010 [P] [US2] Tweak roster layout spacing for avatar + handle + two icons in `frontend/src/styles/mesa-theme.css` without breaking stage-collapsed roster rules

**Checkpoint**: Icons visible and distinguishable; mute shows mic-off.

---

## Phase 5: User Story 3 - Eu próprio a falar (Priority: P2)

**Goal**: Linha própria anima; mute bloqueia aura.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — Eu próprio.

### Implementation for User Story 3

- [x] T011 [US3] Confirm local participant identity is included in ActiveSpeakers / speaking set when self speaks (adjust listener in `frontend/src/voice/VoiceSession.tsx` if local-only gap) per FR-006
- [x] T012 [US3] Enforce `mic_on` (and local `micOn()` if needed) gate so muted self never shows aura despite ambient noise in `frontend/src/shell/Sidebar.tsx` / VoiceSession per FR-004

**Checkpoint**: Self feedback works; mute stops aura.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Temas, flicker, validação.

- [x] T013 [P] If ActiveSpeakers flickers, add short debounce/hysteresis (100–300 ms) in `frontend/src/voice/VoiceSession.tsx` per [research.md](./research.md) R6 — only if quickstart shows flicker
- [x] T014 [P] Re-check light/dark aura contrast on `.is-speaking` in `frontend/src/styles/mesa-theme.css` (SC-005)
- [x] T015 Run `cd frontend && npx tsc --noEmit`; fix types
- [x] T016 Manual pass [quickstart.md](./quickstart.md) (icons, aura, self, out-of-call, themes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after Setup icons optional; **blocks** US1/US3 speaking
- **Phase 3 (US1)** → after Foundational (+ icons from US2 can land same time)
- **Phase 4 (US2)** → can start after Setup (T001–T002); ideally before or with US1 for visible aura targets
- **Phase 5 (US3)** → after US1 speaking wire
- **Phase 6** → after US1–US3

### User Story Dependencies

- **US2** icons can ship before speaking signal (static icons)
- **US1** needs Foundational speaking + icon wrappers (US2)
- **US3** refines US1 for local participant

### Parallel Opportunities

- T001 ∥ T002
- T008–T010 (US2) ∥ T003–T004 (Foundational)
- T013 ∥ T014 in Polish

### Parallel example

```text
T001 ∥ T002
T003 → T004
T008 ∥ T009 → T010
T005 → T006 → T007
T011 → T012
T015 → T016
```

---

## Implementation Strategy

### MVP

1. Phase 1 icons + CSS  
2. Phase 2 ActiveSpeakers  
3. Phase 3 + Phase 4 — aura + icons for others in call  
4. Validate quickstart aura section  

### Incremental delivery

1. Static mic/headphones on roster  
2. Speaking aura for remotes  
3. Self + mute gate  
4. Polish themes / debounce  

### Notes

- Do not add deafen or speaking WS API  
- Do not change 028 list membership filter  
- LiveKit identity must remain `account_id` string  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001–T002 | 2 |
| Foundational | T003–T004 | 2 |
| US1 | T005–T007 | 3 |
| US2 | T008–T010 | 3 |
| US3 | T011–T012 | 2 |
| Polish | T013–T016 | 4 |
| **Total** | T001–T016 | **16** |

**Parallel opportunities**: Setup pair; US2 ∥ Foundational; Polish contrast/debounce.

**MVP scope**: Phases 1–4 (icons + speaking aura for others in call).

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
