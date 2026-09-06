---
description: "Task list for miniatura flutuante da chamada de voz (PiP)"
---

# Tasks: Miniatura flutuante da chamada de voz (PiP)

**Input**: Design documents from `/specs/038-floating-voice-pip/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/floating-voice-pip-ui.md](./contracts/floating-voice-pip-ui.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup (corner helper + CSS) → Foundational (corner state + shell mount shell) → US1 show PiP + vídeo → US2 drag/snap → US3 Voltar / stay-in-call → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/voice/pipCorner.ts`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/shell/FloatingVoicePip.tsx`, `frontend/src/shell/AppShell.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tipos de canto e estilos base do PiP (sem wiring de sessão).

- [x] T001 [P] Add `frontend/src/voice/pipCorner.ts` with `Corner` union, `DEFAULT_CORNER = 'top-right'`, `nearestCorner(rect, containerRect)`, and helper mapping corner → CSS inset classes/positions per [data-model.md](./data-model.md) / [research.md](./research.md) R5
- [x] T002 [P] Add `.voice-pip` / `.voice-pip-header` / `.voice-pip-media` / `.voice-pip-fallback` / corner modifier classes and z-index (above connected bar, below modals) in `frontend/src/styles/mesa-theme.css` per [contracts/floating-voice-pip-ui.md](./contracts/floating-voice-pip-ui.md) R7

**Checkpoint**: Corner math + CSS shell ready to mount.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estado de âncora na sessão + ponto de montagem na shell — **blocks** all stories.

**⚠️ CRITICAL**: Visibility = same predicate as `showConnectedBar`; no `localStorage` for corner.

- [x] T003 Expose in-memory `pipCorner` accessor + setter on `frontend/src/voice/VoiceSession.tsx` (default `top-right`); **reset to `top-right`** on hangup / dropped / when `live` clears per FR-010 / [research.md](./research.md) R6
- [x] T004 Create stub `frontend/src/shell/FloatingVoicePip.tsx` (channel name strip + empty media/fallback + `aria-label`) consuming `useVoiceSession` + `useNavigate` / `useParams` visibility; no drag yet
- [x] T005 Mount `<Show when={showPip}>` `FloatingVoicePip` in `frontend/src/shell/AppShell.tsx` beside the connected bar using the **same** visibility predicate as `showConnectedBar` (`live ∧ channelId ∧ params.id !== channelId`); do **not** hide the bar (FR-009)

**Checkpoint**: Opening text while in call shows a static top-right chrome shell; bar still visible.

---

## Phase 3: User Story 1 - Miniatura ao sair da vista da mesa (Priority: P1) 🎯 MVP

**Goal**: PiP aparece fora da mesa com identidade + preview de vídeo (ou fallback); some ao voltar à mesa / Sair.

**Independent Test**: [quickstart.md](./quickstart.md) §1, §5, §6, §7 — appear top-right ≤2 s; no PiP without call; video or fallback; Sair removes PiP.

### Implementation for User Story 1

- [x] T006 [US1] Apply `pipCorner()` positioning (default top-right) to `.voice-pip` in `frontend/src/shell/FloatingVoicePip.tsx` using `pipCorner.ts` + CSS modifiers
- [x] T007 [US1] Enumerate up to 4 LiveKit camera tracks from `voice.session()?.room` (local + remote) and attach into `.voice-pip-media` tiles via `attachRemote` / track.attach in `frontend/src/shell/FloatingVoicePip.tsx`; listen `TrackSubscribed`/`TrackUnsubscribed` (or rescan) while mounted per [research.md](./research.md) R3–R4
- [x] T008 [US1] When zero camera tracks, show `.voice-pip-fallback` with channel name / «Em chamada» — PiP MUST remain visible (FR-007) in `frontend/src/shell/FloatingVoicePip.tsx`
- [x] T009 [US1] On PiP unmount / hide, **detach DOM only** — do not `stop()` LiveKit/GUM tracks — in `frontend/src/shell/FloatingVoicePip.tsx` cleanup
- [x] T010 [US1] Confirm navigating back to active voice channel route or `hangup` unmounts PiP (route predicate + live clear) via `AppShell` / `FloatingVoicePip` — FR-004

**Checkpoint**: Text-while-in-call shows useful PiP; stage view has no PiP; hangup clears it.

---

## Phase 4: User Story 2 - Arrastar e grudar nos cantos (Priority: P1)

**Goal**: Arrastar o PiP; ao soltar, ancora no canto mais próximo dos quatro; memória só na sessão de chamada.

**Independent Test**: [quickstart.md](./quickstart.md) §3, §4 — four corners + center→nearest; session memory vs reload.

### Implementation for User Story 2

- [x] T011 [US2] Implement pointer drag on PiP chrome (pointer capture, free `left`/`top` while dragging, clamp to app bounds) in `frontend/src/shell/FloatingVoicePip.tsx` per R5
- [x] T012 [US2] On `pointerup`, compute `nearestCorner` and call VoiceSession `setPipCorner`; leave anchored (never free-float) in `frontend/src/shell/FloatingVoicePip.tsx` + `pipCorner.ts`
- [x] T013 [US2] On window resize, re-apply current corner insets so PiP stays in app rect (`frontend/src/shell/FloatingVoicePip.tsx`) — FR-008
- [x] T014 [US2] Verify hide→show same call keeps last corner; hangup resets to top-right (no localStorage) — FR-010 via `VoiceSession.tsx` + manual check

**Checkpoint**: Drag/snap works on all four corners; reload starts top-right.

---

## Phase 5: User Story 3 - Continuar a chamada e voltar (Priority: P2)

**Goal**: «Voltar à mesa» na miniatura; ler texto não termina a chamada.

**Independent Test**: [quickstart.md](./quickstart.md) §2, §6 — Voltar from PiP; stay in call until Sair on bar.

### Implementation for User Story 3

- [x] T015 [US3] Add «Voltar à mesa» button on PiP header navigating like the connected bar (`/channels/{id}?server=…&type=voice_video`) in `frontend/src/shell/FloatingVoicePip.tsx` — FR-006
- [x] T016 [US3] Ensure opening text / showing PiP does **not** call hangup or leaveVoice (regression guard in `AppShell` / navigation path) — FR-005
- [x] T017 [US3] Keep Sair only on connected bar; document in UI that PiP does not replace bar actions (`FloatingVoicePip.tsx` / no duplicate Sair) — FR-009

**Checkpoint**: Return-to-stage from PiP works; call persists while reading; Sair on bar ends call + PiP.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: A11y, z-order, themes, validation.

- [x] T018 [P] Keyboard-focusable «Voltar» + region `aria-label` with channel name; drag handle does not trap focus oddly in `frontend/src/shell/FloatingVoicePip.tsx`
- [x] T019 [P] Re-check z-index vs toasts/modals and light/dark readability of `.voice-pip*` in `frontend/src/styles/mesa-theme.css`
- [x] T020 Run `cd frontend && npx tsc --noEmit`; fix types
- [x] T021 Manual pass full [quickstart.md](./quickstart.md) (appear, corners, video/fallback, coexist bar, Voltar, Sair, no-call)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after Setup (T001–T002); **blocks** US1–US3
- **Phase 3 (US1)** → after Foundational
- **Phase 4 (US2)** → after US1 shell visible (needs mounted PiP)
- **Phase 5 (US3)** → after US1 (can parallel mid-US2 once header exists)
- **Phase 6** → after US1–US3

### User Story Dependencies

- **US1** MVP: show + video/fallback + visibility
- **US2** needs US1 mount for drag target
- **US3** needs US1 header/media shell; independent of snap polish

### Parallel Opportunities

- T001 ∥ T002
- T018 ∥ T019 in Polish
- T015–T017 (US3) can start once T004–T006 header exists, in parallel with late US2

### Parallel example

```text
T001 ∥ T002
T003 → T004 → T005
T006 → T007 → T008 → T009 → T010
T011 → T012 → T013 → T014
T015 → T016 → T017
T018 ∥ T019 → T020 → T021
```

---

## Implementation Strategy

### MVP

1. Phase 1–2 + US1 (T001–T010) — PiP appears with video/fallback and coexists with bar  
2. Validate quickstart §1, §5, §7  
3. Add US2 snap, then US3 Voltar polish  

### Incremental delivery

1. Setup corner + CSS  
2. Foundational mount  
3. US1 video  
4. US2 drag  
5. US3 return  
6. Polish + `tsc` + quickstart  

### Notes

- Frontend-only; no backend tasks.  
- Do not stop media tracks on PiP unmount.  
- No corner persistence across reload.

---

## Task summary

| Metric | Count |
|--------|------:|
| **Total tasks** | 21 |
| **US1** | 5 (T006–T010) |
| **US2** | 4 (T011–T014) |
| **US3** | 3 (T015–T017) |
| **Setup + Foundational + Polish** | 9 |
| **Parallelizable marked [P]** | T001, T002, T018, T019 |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.

**Suggested MVP**: Phase 1–3 (through T010 / User Story 1).

**Next**: `/speckit-implement`
