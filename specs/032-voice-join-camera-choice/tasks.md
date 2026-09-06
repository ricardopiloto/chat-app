---
description: "Task list for escolher câmera ao entrar na sala (ou ir para o banco)"
---

# Tasks: Escolher câmera ao entrar na sala (ou ir para o banco)

**Input**: Design documents from `/specs/032-voice-join-camera-choice/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/voice-join-camera.md](./contracts/voice-join-camera.md), [contracts/prejoin-ui.md](./contracts/prejoin-ui.md), [quickstart.md](./quickstart.md)

**Tests**: Pedidos no plano — contract join `cam_on: false` → sem slot; PATCH `cam_on: true` → auto-slot condicional ([contracts/voice-join-camera.md](./contracts/voice-join-camera.md)); `cargo test --test contract`; `npx tsc --noEmit`; [quickstart.md](./quickstart.md).

**Organization**: Setup → Foundational (BE skip auto-assign + LiveKit sem forçar cam) → US1 escolha com/sem câmera → US2 banco → US3 descoberta UI → Polish (FR-010 PATCH + validação).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/tests/contract/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar superfície de pré-join e labels; sem wiring ainda.

- [x] T001 [P] Sketch dual pre-join button labels (com câmera / sem câmera · banco) against [contracts/prejoin-ui.md](./contracts/prejoin-ui.md) in `frontend/src/pages/VoiceChannel.tsx` (comment or copy only if needed; keep existing single button until US1/US3)

**Checkpoint**: Contrato UI lido; botão único ainda no ecrã.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Join sem câmera **não** auto-assigna slot; LiveKit **não** liga câmera quando não há vídeo — **blocks** US1/US2.

**⚠️ CRITICAL**: Sem isto, «sem câmera» ainda ocupa slot ou pede vídeo.

- [x] T002 In `backend/src/api/voice.rs` `join`, call `auto_assign_first_empty` **only when** effective `cam_on` is true; when `cam_on` is false, skip assign and still emit occupancy / mint token per [contracts/voice-join-camera.md](./contracts/voice-join-camera.md)
- [x] T003 [P] In `frontend/src/video/liveClient.ts` `joinLiveRoom`, when `localVideo` is absent MUST NOT call `setCameraEnabled(true)`; publish mic only (research R4)
- [x] T004 [P] [US1] Extend contract tests in `backend/tests/contract/voice_occupancy.rs` (or dedicated join tests): join `{ "cam_on": false }` → occupant `cam_on: false` and account **not** in a grid slot; join with `cam_on: true` still auto-assigns when applicable ([contracts/voice-join-camera.md](./contracts/voice-join-camera.md))

**Checkpoint**: `cargo test` for T004 green after T002; FE LiveKit path safe for audio-only.

---

## Phase 3: User Story 1 - Escolher entrar com ou sem câmera (Priority: P1) 🎯 MVP

**Goal**: Pré-join com dois caminhos; estado inicial de câmera reflecte a escolha; mic default ligado; após join, toggle cam/mic continua.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 1 & 3 (escolha).

### Implementation for User Story 1

- [x] T005 [US1] Add `captureLocal` / connect mode `audio` (getUserMedia audio-only, no video permission) in `frontend/src/pages/VoiceChannel.tsx` per FR-007 / research R4
- [x] T006 [US1] Wire `connect("camera" | "audio" | "test")`: join body `cam_on` true/false; set local `camOn` accordingly; call `joinLiveRoom` with or without `localVideo` in `frontend/src/pages/VoiceChannel.tsx`
- [x] T007 [US1] Ensure `VoiceSession` / `bindLive` receives initial `camOn: false` on audio path in `frontend/src/voice/VoiceSession.tsx` (and `VoiceChannel.tsx` callers)
- [x] T008 [US1] After audio-only join, first toggle-cam-on acquires camera (setCameraEnabled / getUserMedia + publish) then `reportMedia(..., true)` in `frontend/src/pages/VoiceChannel.tsx` (SC-005)

**Checkpoint**: Entrar com/sem câmera reflecte estado local; sem caminho força vídeo no «sem câmera».

---

## Phase 4: User Story 2 - Sem câmera → banco por omissão (Priority: P1)

**Goal**: Join sem câmera → **No banco**; não ocupar slot; join com câmera mantém auto-slot actual.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 2 (banco).

### Implementation for User Story 2

- [x] T009 [US2] Verify `CallBank` / `deriveBank` shows the joiner after `cam_on: false` join (no code change if T002+FE suffice) in `frontend/src/components/CallBank.tsx` + composition view in `frontend/src/pages/VoiceChannel.tsx`
- [x] T010 [US2] Confirm join-with-camera still auto-assigns when scene is auto + free slot (regression of current behavior) via contract or manual note in T004 / quickstart

**Checkpoint**: Observador não vê quem entrou sem câmera num slot de câmera.

---

## Phase 5: User Story 3 - Descoberta da escolha no fluxo de entrada (Priority: P2)

**Goal**: Dois controlos distintos e rótulos inequívocos; remover o único «Ligar câmera e microfone» como única entrada.

**Independent Test**: Abrir canal fora da chamada → dois botões primários claros + vídeo de teste secundário.

### Implementation for User Story 3

- [x] T011 [US3] Replace single primary join button with two distinct actions (com câmera / sem câmera · banco) per [contracts/prejoin-ui.md](./contracts/prejoin-ui.md) in `frontend/src/pages/VoiceChannel.tsx`; keep «Vídeo de teste» secondary
- [x] T012 [US3] Gesture/permission copy: camera path may ask video; audio path only mic — update `needGesture` / error strings in `frontend/src/pages/VoiceChannel.tsx` so «sem câmera» does not say «câmera e microfone» incorrectly

**Checkpoint**: Pré-join óbvio; SC-004 (sem diálogo obrigatório de câmera no caminho banco).

---

## Phase 6: Polish & Cross-Cutting (FR-010 + validação)

**Purpose**: Ligar câmera depois → auto-slot condicional; testes e quickstart.

- [x] T013 In `backend/src/api/voice.rs` `patch_media`, when effective transition to `cam_on: true` and user has no slot, call `auto_assign_first_empty` and emit `grid.updated` if layout changes ([contracts/voice-join-camera.md](./contracts/voice-join-camera.md) / FR-010)
- [x] T014 [P] Contract tests: after join `cam_on: false`, PATCH `{ "cam_on": true }` with auto scene + free slot → account in a slot; with owner-lock or full grid → still no slot — in `backend/tests/contract/voice_occupancy.rs` (or grid/voice tests)
- [x] T015 Run `cd backend && cargo test --test contract` and `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T016 Manual pass [quickstart.md](./quickstart.md) (US1–3, FR-010); note if browser not available
- [x] T017 [P] On voice channel **move**, present the same dual pre-join actions on the destination channel (no persisted choice) in `frontend/src/pages/VoiceChannel.tsx` / shell navigation — default per spec edge case

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → no deps
- **Phase 2 (Foundational)** → after Setup; **blocks** US1–US2
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after T002 (+ FE join path from US1 for E2E)
- **Phase 5 (US3)** → can start after US1 connect wiring (same file; sequential with T011 after T006)
- **Phase 6 (Polish)** → after US1–US2; T013–T014 can follow foundational closely

### User Story Dependencies

- **US1**: Needs T002–T003; delivers choice + audio/camera paths
- **US2**: Needs T002; validates bank visually
- **US3**: Needs US1 connect modes; labels/buttons

### Parallel Opportunities

- T003 ∥ T002 (FE LiveKit vs BE join)
- T004 after T002 (tests)
- T014 after T013
- T017 ∥ polish docs if move UX already re-shows pre-join when `!live()`

### Parallel example (after Foundational)

```text
T005–T008 (US1 connect) → T011–T012 (US3 buttons)
T009–T010 (US2 bank check) while US3 polish copy
T013–T014 (FR-010) after T002
```

---

## Implementation Strategy

### MVP (User Story 1 + foundational)

1. Phase 2 (T002–T004)  
2. Phase 3 (T005–T008) + T011 dual buttons  
3. Stop: join com/sem câmera + contract `cam_on: false` sem slot  

### Incremental delivery

1. MVP  
2. US2 bank verification  
3. US3 copy/labels  
4. FR-010 PATCH auto-slot + T015–T016  

### Notes

- Sem migração  
- Não alterar filtro 028 da lista aninhada  
- Alinhar falhas do caminho «com câmera» a 031 se já existir no código  
- `CallBank` provavelmente sem mudança de API  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T004 | 3 |
| US1 | T005–T008 | 4 |
| US2 | T009–T010 | 2 |
| US3 | T011–T012 | 2 |
| Polish | T013–T017 | 5 |
| **Total** | T001–T017 | **17** |

**Parallel opportunities**: LiveKit fix ∥ BE join; contract PATCH ∥ tsc.

**MVP scope**: Phase 2–3 (+ dual buttons T011) — escolher com/sem câmera e não auto-slot no join sem câmera.

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
