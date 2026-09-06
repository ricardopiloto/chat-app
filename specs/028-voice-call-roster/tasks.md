---
description: "Task list for Lista de participantes e duração da chamada de voz"
---

# Tasks: Lista de participantes e duração da chamada de voz

**Input**: Design documents from `/specs/028-voice-call-roster/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Pedidos no plano (`cargo test --test contract`). TDD nas histórias de ocupação REST/WS. `npx tsc --noEmit` no polish.

**Organization**: Setup (CSS) → Foundational (SQLite + join/leave/media/GET/WS) → US1 lista aninhada → US2 cronómetro → US3 mídia ao vivo → US5 sessão persistente / move → US4 vs Membros → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/migrations/`, `backend/tests/contract/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chrome CSS da lista aninhada / timer / barra, sem wiring.

- [X] T001 Add nested voice-roster, session-timer, and connected-bar layout styles in `frontend/src/styles/mesa-theme.css` per [contracts/voice-session-ui.md](./contracts/voice-session-ui.md)

**Checkpoint**: Classes existem; coluna ainda só mostra o nome do canal.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Occupancy no Axum — **bloqueia** US1–US5.

**⚠️ CRITICAL**: Sem GET/WS de ocupação a coluna não tem dados.

- [X] T002 Write failing contract tests for occupancy GET/join/leave/media/session/move in `backend/tests/contract/voice_occupancy.rs` and register the module in `backend/tests/contract/mod.rs` per [contracts/voice-occupancy.md](./contracts/voice-occupancy.md)
- [X] T003 Add SQLite migration `voice_occupant` + `channel.voice_session_started_at` in `backend/migrations/0008_voice_occupancy.sql` per [data-model.md](./data-model.md)
- [X] T004 [P] Add `VoiceOccupant` domain type in `backend/src/domain/voice_occupancy.rs` and export it from `backend/src/domain/mod.rs`
- [X] T005 Implement occupant CRUD, session 0→1 / 1→0, and stale `last_seen_at` sweep in `backend/src/db/voice_occupancy.rs`; register the module in `backend/src/db/mod.rs`
- [X] T006 On `POST .../voice/join` in `backend/src/api/voice.rs`, upsert occupant (move if already in another channel), set `voice_session_started_at`, broadcast `voice.occupancy` (and `grid.updated` on move) per [research.md](./research.md) R1–R2 R8
- [X] T007 Add `GET /api/servers/{server_id}/voice-occupancy` in `backend/src/api/voice.rs` (or new module) and route it in `backend/src/api/mod.rs` (member-only)
- [X] T008 Add `POST /api/channels/{channel_id}/voice/leave` in `backend/src/api/voice.rs`: remove occupant, free grid slot, `grid.updated`, clear session if last; wire the route in `backend/src/api/mod.rs`
- [X] T009 Add `PATCH /api/channels/{channel_id}/voice/media` (optional heartbeat / empty body updates `last_seen_at`) and expire occupants stale &gt;45s in `backend/src/api/voice.rs` per [research.md](./research.md) R4–R5

**Checkpoint**: Contract tests T002 passam; join/leave/media/GET/WS sem UI.

---

## Phase 3: User Story 1 - Ver quem está a transmitir (Priority: P1) 🎯 MVP

**Goal**: Lista aninhada na coluna: só `mic_on || cam_on`.

**Independent Test**: [quickstart.md](./quickstart.md) §1 passos 1–2 (sem exigir persistência em texto ainda).

### Implementation for User Story 1

- [X] T010 [US1] Fetch `GET /api/servers/{id}/voice-occupancy` when the selected server changes in `frontend/src/shell/Sidebar.tsx` (types in `frontend/src/api/client.ts`)
- [X] T011 [US1] Subscribe to WS `voice.occupancy` in `frontend/src/shell/Sidebar.tsx` and merge snapshots by `channel_id`
- [X] T012 [US1] Render nested handles under each voice channel in `frontend/src/shell/Sidebar.tsx` for occupants with `mic_on || cam_on` only, using T001 classes, per [contracts/voice-session-ui.md](./contracts/voice-session-ui.md)

**Checkpoint**: B em texto vê A aninhado quando A transmite; canal vazio sem lista.

---

## Phase 4: User Story 2 - Cronómetro da sessão (Priority: P1)

**Goal**: Timer = `now - call_started_at`; visível com lista vazia; some só com 0 ocupantes.

**Independent Test**: [quickstart.md](./quickstart.md) §2 e §5.

### Implementation for User Story 2

- [X] T013 [US2] Show `mm:ss` / `h:mm:ss` beside occupied voice channels in `frontend/src/shell/Sidebar.tsx` from `call_started_at` (tick ~1s); hide when `call_started_at` is null
- [X] T014 [P] [US2] Show the same session timer in the voice pane header in `frontend/src/pages/VoiceChannel.tsx` when `call_started_at` is set per FR-006

**Checkpoint**: Dois joins no mesmo canal partilham o tempo; último leave remove o timer; lista vazia + timer se só a ouvir (depois de US3).

---

## Phase 5: User Story 3 - Lista ao vivo (mídia / sair) (Priority: P1)

**Goal**: PATCH mídia no toggle; leave no Sair; a coluna actualiza sem refresh.

**Independent Test**: [quickstart.md](./quickstart.md) §1 passos 3–4.

### Implementation for User Story 3

- [X] T015 [US3] After voice join and on mic/cam toggles, `PATCH .../voice/media` from `frontend/src/pages/VoiceChannel.tsx` (and from `frontend/src/voice/VoiceSession.tsx` once it exists)
- [X] T016 [US3] Call `POST .../voice/leave` from the hangup path in `frontend/src/pages/VoiceChannel.tsx` (and later the shell bar)
- [X] T017 [US3] Start a ~20s occupancy heartbeat while in-call in `frontend/src/pages/VoiceChannel.tsx` or `frontend/src/voice/VoiceSession.tsx` per [research.md](./research.md) R5

**Checkpoint**: Ligar/desligar ambos os dispositivos some/reaparece o nome; Sair limpa ocupação.

---

## Phase 6: User Story 5 - Permanecer na mesa / mover canal (Priority: P1)

**Goal**: LiveKit no shell; texto não desliga; barra Sair/voltar; outro voice = move.

**Independent Test**: [quickstart.md](./quickstart.md) §3–§4.

### Implementation for User Story 5

- [X] T018 [US5] Create `frontend/src/voice/VoiceSession.tsx` context (LiveKit session, current `channel_id`, join/leave/move, occupancy heartbeat) per [research.md](./research.md) R3
- [X] T019 [US5] Wrap the authenticated tree with the provider in `frontend/src/App.tsx`
- [X] T020 [US5] Stop disconnecting LiveKit on route unmount in `frontend/src/pages/VoiceChannel.tsx`; use `VoiceSession` for join, media, hangup, and stage chrome
- [X] T021 [US5] Add connected bar (channel name, session timer, Voltar à mesa, Sair) in `frontend/src/shell/AppShell.tsx` when in-call and not on that voice route per [contracts/voice-session-ui.md](./contracts/voice-session-ui.md) FR-014
- [X] T022 [US5] In `frontend/src/pages/ChannelRoute.tsx` (or Sidebar navigation): opening **another** voice channel moves the session; opening **text** does not leave
- [X] T023 [US5] On LiveKit `onDisconnected` and `pagehide`, call leave in `frontend/src/voice/VoiceSession.tsx`

**Checkpoint**: A em `#geral` continua na lista de B; barra visível; Sair limpa; V1→V2 move ocupação.

---

## Phase 7: User Story 4 - Não confundir com Membros (Priority: P2)

**Goal**: Painel Membros intacto; roster ≠ lista do servidor.

**Independent Test**: [quickstart.md](./quickstart.md) §6.

### Implementation for User Story 4

- [X] T024 [US4] Keep `frontend/src/components/MembersPanel.tsx` listing all server members; do not reuse occupancy there
- [X] T025 [P] [US4] Ensure nested roster styles in `frontend/src/styles/mesa-theme.css` / `frontend/src/shell/Sidebar.tsx` read as channel occupants (indent, not a second members panel)

**Checkpoint**: N membros no painel, M na lista aninhada (M ≤ K).

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T026 Run `cargo test --test contract --test integration` in `backend/` and fix failures (including `voice_join` if join side-effects change)
- [X] T027 [P] Run `npx tsc --noEmit` in `frontend/`
- [X] T028 [P] Document `voice.occupancy` in `README.md` WS table
- [X] T029 Execute [quickstart.md](./quickstart.md) §1–§6 (two accounts)
- [X] T030 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T009)** → **US1** → **US2** → **US3** → **US5** → **US4** → **Polish**
- T004 ∥ T005 after T003 (domain vs db once tests exist)
- US2 timer can share occupancy state from US1
- US5 after US3 so leave/media already exist
- US4 is visual/verify; after roster exists

### User Story Dependencies

```text
Foundational (SQLite occupancy + REST/WS)
    ├── US1 nested transmitting list (MVP)
    ├── US2 session timer
    ├── US3 live media PATCH + leave
    ├── US5 persist call on text + move voice
    └── US4 members panel unchanged
```

### Parallel Opportunities

- T001 ∥ T002 (CSS vs tests)
- T004 ∥ first db sketches after T003
- T013 ∥ T014 (sidebar vs voice header)
- T024 ∥ T025
- T027 ∥ T028 after T026

---

## Parallel Example: Foundational API

```bash
Task: "domain VoiceOccupant in backend/src/domain/voice_occupancy.rs"
Task: "db CRUD in backend/src/db/voice_occupancy.rs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001–T012 — occupancy API + lista aninhada
2. **STOP**: quickstart §1 (A transmite, B vê na coluna)
3. Then timer → mídia ao vivo → sessão persistente → polish

### Incremental Delivery

1. Backend occupancy
2. Sidebar list (MVP)
3. Timer
4. Media/leave live
5. Shell session (texto + move)
6. `cargo test` + tsc + daily/CHANGELOG on implement

---

## Notes

- [P] = different files / no incomplete deps
- Do not add a BFF
- Do not use grid slots as occupancy
- Do not disconnect LiveKit on text navigation (US5)
- Commit only if the user requests
