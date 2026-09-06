---
description: "Task list for tratativa de falha ao entrar na sala de voz"
---

# Tasks: Tratativa de falha ao entrar na sala de voz

**Input**: Design documents from `/specs/031-voice-join-errors/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/voice-join-errors.md](./contracts/voice-join-errors.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Contract BE de ocupação existente — sem alteração obrigatória.

**Organization**: Setup → Foundational (error mapper + abort helper) → US1 abort/revert → US2 feedback categorias → US3 loading + cam soft-fail → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/VoiceChannel.tsx`, `frontend/src/voice/`, `frontend/src/api/client.ts`, `frontend/src/video/liveClient.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Módulo de erros de join e tipos partilhados.

- [x] T001 Create `frontend/src/voice/joinErrors.ts` with exported types `JoinErrorCategory` (`permission` \| `device` \| `connection` \| `generic`) and stub `categorizeJoinError(err: unknown): JoinErrorCategory` / `joinErrorMessage(category, opts?: { cameraOnly?: boolean }): string` per [contracts/voice-join-errors.md](./contracts/voice-join-errors.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Abort helper e limpeza de tracks — **blocks** US1–US3.

**⚠️ CRITICAL**: Nenhuma story de join deve deixar occupancy/tracks órfãs após falha.

- [x] T002 Implement `abortFailedJoin` in `frontend/src/voice/abortFailedJoin.ts` (or colocated helper): stop blur if any, `track.stop()` on local audio/video tracks, if `joined` then `leaveVoice(channelId)` via `frontend/src/api/client.ts`, clear local cam refs; never call `bindLive` — per [research.md](./research.md) R2
- [x] T003 Wire `leaveVoice` import path confirmed in `frontend/src/api/client.ts` (reuse existing; no BE change)

**Checkpoint**: Helper compilável; leave API reutilizada.

---

## Phase 3: User Story 1 - Não aparecer ligado se a ligação falhar (Priority: P1) 🎯 MVP

**Goal**: Falha de áudio/sala → leave + tracks stopped + não `live`; caminho feliz inalterado.

**Independent Test**: [quickstart.md](./quickstart.md) § Falha de áudio / Falha após join.

### Implementation for User Story 1

- [x] T004 [US1] In `frontend/src/pages/VoiceChannel.tsx` `connect()`, track whether `POST .../voice/join` succeeded; on any throw after that, call `abortFailedJoin` before/while setting error (replace bare `setError` catch)
- [x] T005 [US1] Ensure early failures **before** join API also release any tracks already obtained in `captureLocal` / `connect` via `abortFailedJoin` or equivalent stop path in `frontend/src/pages/VoiceChannel.tsx`
- [x] T006 [US1] Confirm failed path never calls `voice.bindLive` and does not leave persistent connected chrome (`live` false) in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/voice/VoiceSession.tsx`
- [x] T007 [US1] On channel **move** (`disconnectLivekitOnly` + `connect`): if new join API succeeded then LiveKit fails, abort leaves **new** channel occupancy in `frontend/src/pages/VoiceChannel.tsx` per [research.md](./research.md) R5

**Checkpoint**: Ghost occupancy cleared after failed join; happy path still binds live.

---

## Phase 4: User Story 2 - Feedback claro da falha (Priority: P1)

**Goal**: Mensagens PT por categoria; retry sem refresh.

**Independent Test**: [quickstart.md](./quickstart.md) § Falha de áudio — mensagem categoria + retry.

### Implementation for User Story 2

- [x] T008 [P] [US2] Complete `categorizeJoinError` + `joinErrorMessage` in `frontend/src/voice/joinErrors.ts` (map `NotAllowedError`, `NotFoundError`, `NotReadableError`, network/join/LiveKit failures) per [contracts/voice-join-errors.md](./contracts/voice-join-errors.md)
- [x] T009 [US2] Use categorized messages in `connect` catch / abort path in `frontend/src/pages/VoiceChannel.tsx` (`setError(joinErrorMessage(...))`) instead of raw `err.message` when possible
- [x] T010 [US2] Verify join CTA / «Entrar» remains usable after failure (no stuck `starting` / disabled forever) in `frontend/src/pages/VoiceChannel.tsx` `finally` block

**Checkpoint**: Permission vs connection errors distinguishable in UI; retry works.

---

## Phase 5: User Story 3 - Loading + limpeza + câmera soft-fail (Priority: P2)

**Goal**: Sair de «a ligar…» em erro; libertar média parcial; falha só de câmera → conectado com cam off + aviso.

**Independent Test**: [quickstart.md](./quickstart.md) § Loading + § Só câmera falha.

### Implementation for User Story 3

- [x] T011 [US3] Refactor `captureLocal` / media acquisition in `frontend/src/pages/VoiceChannel.tsx` to try A/V then fall back to **audio-only** when video fails but audio succeeds per [research.md](./research.md) R3
- [x] T012 [US3] When audio-only fallback used: join with `cam_on: false`, complete `bindLive`, set camera warning via `joinErrorMessage(..., { cameraOnly: true })` (or dedicated warning signal) without aborting join
- [x] T013 [US3] Ensure loading/connecting copy clears on both hard fail and soft cam warning in `frontend/src/pages/VoiceChannel.tsx` (US3 acceptance: not stuck «a ligar»)
- [x] T014 [US3] Align track release in abort with leave path patterns (`stopBlurProcessor` + `track.stop`) in `frontend/src/pages/VoiceChannel.tsx` so failed join leaves no orphan capture (035 FR-008)

**Checkpoint**: Cam-only fail → in call; audio fail → out + clean; loading never sticks.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Validação e notas de move edge.

- [x] T015 [P] Document move edge case (old channel occupancy if connect fails before new join) in `specs/031-voice-join-errors/quickstart.md` if not already clear
- [x] T016 Run `cd frontend && npx tsc --noEmit`; fix type errors from new helpers
- [x] T017 Manual pass [quickstart.md](./quickstart.md) (áudio fail, pós-join fail, cam soft-fail, retry)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after Setup; **blocks** stories
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after Foundational (can parallelize mapper T008 with US1 if careful; wire T009 after T004)
- **Phase 5 (US3)** → after US1 abort path exists (soft-fail builds on connect)
- **Phase 6** → after US1–US3

### User Story Dependencies

- **US1**: Abort + leave — core ghost fix
- **US2**: Needs abort surfacing errors; mapper can land early
- **US3**: Needs US1 abort + capture refactor

### Parallel Opportunities

- T001 alone then T002
- T008 ∥ T004–T007 (mapper vs connect wiring)
- T015 ∥ T016 in Polish

### Parallel example

```text
T001 → T002 → T003
T008 [P] while T004–T007 [US1]
T009–T010 [US2]
T011–T014 [US3]
T015 ∥ T016 → T017
```

---

## Implementation Strategy

### MVP (User Story 1)

1. Phase 1–2 (mapper stub + abort helper)  
2. Phase 3 — wire abort in `connect`  
3. Validate quickstart «Falha após join» + «Falha de áudio»  

### Incremental delivery

1. MVP (no ghost)  
2. US2 categorized PT copy  
3. US3 audio-only fallback + loading cleanup  
4. Polish (`tsc` + full quickstart)  

### Notes

- Do not reorder join-before-LiveKit (flash OK)  
- Do not add BE endpoints  
- Share abort cleanup with future 035 leave release  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T003 | 2 |
| US1 | T004–T007 | 4 |
| US2 | T008–T010 | 3 |
| US3 | T011–T014 | 4 |
| Polish | T015–T017 | 3 |
| **Total** | T001–T017 | **17** |

**Parallel opportunities**: T008 with US1; Polish T015∥T016.

**MVP scope**: Phases 1–3 (T001–T007) — abort + no ghost occupancy.

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
