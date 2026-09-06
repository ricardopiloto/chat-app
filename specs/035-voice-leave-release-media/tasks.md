---
description: "Task list for libertar câmera e microfone ao sair da chamada"
---

# Tasks: Libertar câmera e microfone ao sair da chamada

**Input**: Design documents from `/specs/035-voice-leave-release-media/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/release-local-capture.md](./contracts/release-local-capture.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) (indicador de captura do browser).

**Organization**: Setup (módulo helper) → Foundational (`releaseLocalCapture`) → US1 Sair palco → US2 todos os exits → US4 join falhado → US3 leave remoto falha → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4] (labels match [spec.md](./spec.md))
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/voice/releaseLocalCapture.ts`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/video/backgroundBlur.ts`, `frontend/src/shell/AppShell.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ficheiro do helper e tipos de entrada.

- [x] T001 Create `frontend/src/voice/releaseLocalCapture.ts` with exported types for optional inputs (`localCamTrack?`, `audioTracks?`, `session?`) and stub `releaseLocalCapture(...)` returning `Promise<void>` per [contracts/release-local-capture.md](./contracts/release-local-capture.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implementação idempotente da libertação — **blocks** todas as stories.

**⚠️ CRITICAL**: Nenhum exit path deve libertar só ocupação sem hardware.

- [x] T002 Implement `releaseLocalCapture` in `frontend/src/voice/releaseLocalCapture.ts`: `stopBlurProcessor` via `frontend/src/video/backgroundBlur.ts`, `track.stop()` on live audio/video tracks, best-effort LiveKit cam/mic disable when `session` present; swallow per-step errors; second call is no-op (FR-005) — per [research.md](./research.md) R2
- [x] T003 Confirm `frontend/src/video/liveClient.ts` `disconnect` still uses `setCameraEnabled(false)` / `setMicrophoneEnabled(false)` + `room.disconnect(true)`; document that hangup may call release then disconnect without duplicating unsafe double-stop issues

**Checkpoint**: Helper compilável e idempotente.

---

## Phase 3: User Story 1 - Sair liberta câmera e microfone (Priority: P1) 🎯 MVP

**Goal**: Sair no palco liberta mic/câmera (blur incluído); UI fora da chamada.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — Sair no palco / só mic / só cam.

### Implementation for User Story 1

- [x] T004 [US1] Refactor `leave()` in `frontend/src/pages/VoiceChannel.tsx` to call `releaseLocalCapture` (blur + cam/mic tracks) **before** `voice.hangup()`, removing duplicated inline `stopBlurProcessor`/`track.stop` that only covered cam
- [x] T005 [US1] Ensure `hangup()` in `frontend/src/voice/VoiceSession.tsx` calls `releaseLocalCapture` **first** (using `localCamTrack` + current `session`), then `leaveVoice` best-effort, then `session.disconnect`, then clear UI state — per [research.md](./research.md) R3 / FR-007
- [x] T006 [US1] Clear `localCamTrack` / video el refs after release in `frontend/src/voice/VoiceSession.tsx` and `frontend/src/pages/VoiceChannel.tsx` so re-join can acquire fresh GUM (FR-006)

**Checkpoint**: Stage Sair → browser capture indicator off ≤2 s (SC-001).

---

## Phase 4: User Story 2 - Todos os fins de sessão libertam (Priority: P1)

**Goal**: Barra persistente, move, disconnect, unload usam o mesmo caminho.

**Independent Test**: [quickstart.md](./quickstart.md) § barra, move, disconnect, fecho de separador.

### Implementation for User Story 2

- [x] T007 [US2] Verify `AppShell` Sair already calls `voice.hangup()` in `frontend/src/shell/AppShell.tsx`; no duplicate leave needed once hangup releases capture (SC-002)
- [x] T008 [US2] Call `releaseLocalCapture` from `disconnectLivekitOnly()` in `frontend/src/voice/VoiceSession.tsx` before abandoning previous LiveKit session on channel move (SC-004)
- [x] T009 [US2] Call `releaseLocalCapture` from `dropped()` in `frontend/src/voice/VoiceSession.tsx` (unexpected disconnect) before/while clearing session refs and `leaveVoice` (FR-002)
- [x] T010 [US2] Confirm `pagehide` → `hangup` path in `frontend/src/voice/VoiceSession.tsx` still registered on `bindLive` and now inherits release via hangup; note best-effort unload in comments only if needed (SC-006)

**Checkpoint**: All documented exits free hardware; no ghost capture after move/drop.

---

## Phase 5: User Story 4 - Join falhado não deixa captura órfã (Priority: P1)

**Goal**: Join falhado com GUM parcial liberta via o mesmo helper (FR-008 / 031).

**Independent Test**: [quickstart.md](./quickstart.md) § Join falhado; alinhar a [031](../031-voice-join-errors/quickstart.md).

### Implementation for User Story 4

- [x] T011 [US4] Wire `abortFailedJoin` in `frontend/src/voice/abortFailedJoin.ts` (create if 031 not landed yet, or refactor existing) to call `releaseLocalCapture` for partial tracks instead of a parallel stop implementation — per [research.md](./research.md) R6
- [x] T012 [US4] Ensure `connect()` failure path in `frontend/src/pages/VoiceChannel.tsx` invokes abort/`releaseLocalCapture` so browser capture indicator is off ≤3 s without being `live` (SC-007)

**Checkpoint**: Failed join leaves no orphan mic/cam capture.

---

## Phase 6: User Story 3 - Feedback se a saída falhar a meio (Priority: P2)

**Goal**: Leave HTTP falha → captura local já libertada; UI fora sem captura activa.

**Independent Test**: [quickstart.md](./quickstart.md) § Leave remoto falha.

### Implementation for User Story 3

- [x] T013 [US3] Keep `leaveVoice(...).catch(() => undefined)` **after** `releaseLocalCapture` in `hangup` / leave paths in `frontend/src/voice/VoiceSession.tsx` so network failure cannot skip hardware release (FR-007 / SC-005)
- [x] T014 [US3] Ensure double Sair / concurrent `leave`+`hangup` remains idempotent (`leaving` guard in `VoiceChannel.tsx` + no-op release) without re-acquiring devices in `frontend/src/pages/VoiceChannel.tsx`

**Checkpoint**: UI «fora» never coexists with active capture >3 s.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Validação e alinhamento 031.

- [x] T015 [P] If 031 `abortFailedJoin` already stops tracks inline, dedupe so only `releaseLocalCapture` owns stop/blur in `frontend/src/voice/abortFailedJoin.ts` / `releaseLocalCapture.ts`
- [x] T016 Run `cd frontend && npx tsc --noEmit`; fix types
- [x] T017 Manual pass [quickstart.md](./quickstart.md) (palco, barra, move, drop, unload, re-join, join fail, leave HTTP fail)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after T001; **blocks** US1–US4
- **Phase 3 (US1)** → after Foundational (MVP)
- **Phase 4 (US2)** → after hangup has release (US1 T005) so bar/pagehide inherit
- **Phase 5 (US4)** → after Foundational; can parallel US2 once helper exists
- **Phase 6 (US3)** → after US1 hangup ordering
- **Phase 7** → after stories

### User Story Dependencies

- **US1** delivers stage + hangup release (MVP)
- **US2** extends same hangup/disconnect paths
- **US4** shares helper with 031 abort
- **US3** hardens ordering/idempotency on US1 paths

### Parallel Opportunities

- T011–T012 (US4) ∥ T008–T010 (US2) after T005
- T015 ∥ review while T016 prep

### Parallel example

```text
T001 → T002 → T003
T004 → T005 → T006
T007 (verify) ∥ T008 → T009 → T010
T011 → T012
T013 → T014
T015 ∥ T016 → T017
```

---

## Implementation Strategy

### MVP

1. T001–T003 helper  
2. T004–T006 stage Sair + hangup release first  
3. Validate quickstart palco (SC-001)

### Incremental delivery

1. Stage + hangup release  
2. Bar / move / dropped / pagehide  
3. Failed join shared path  
4. Remote leave failure + polish  

### Notes

- Do not change Sair button UI  
- Do not add BE endpoints  
- Prefer one cleanup module shared with 031  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T003 | 2 |
| US1 | T004–T006 | 3 |
| US2 | T007–T010 | 4 |
| US4 | T011–T012 | 2 |
| US3 | T013–T014 | 2 |
| Polish | T015–T017 | 3 |
| **Total** | T001–T017 | **17** |

**Parallel opportunities**: US2 ∥ US4 after hangup release; polish dedupe ∥ tsc.

**MVP scope**: Phases 1–3 (helper + stage/hangup release).

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
