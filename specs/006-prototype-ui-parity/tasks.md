---
description: "Task list for Fidelidade pixel ao Protótipo Mesa v2 (+ E2EE/gravar, rail, delete)"
---

# Tasks: Fidelidade pixel ao Protótipo Mesa v2

**Input**: Design documents from `/specs/006-prototype-ui-parity/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Actualizar/adicionar contract tests Rust quando a API mudar ([research.md D8](./research.md#d8--testes)); regressão `cargo test` + `npx tsc --noEmit`; validação manual quickstart + fidelity checklist.

**Organization**: Foundation (migração + tipos canal/E2EE/chave) bloqueia US1b e US2b. US1 (rail), US3 (reattach), US4 (cover) podem avançar cedo no frontend. US5/US6 polish de fidelidade.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US1b], [US2], [US2b], [US3], [US4], [US5], [US6]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`, `backend/` (migrations + api/db/tests).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tipos cliente e apontadores de contrato alinhados.

- [X] T001 [P] Extend `frontend/src/api/client.ts` with channel fields `created_by_account_id`, `e2ee_enabled`, `has_channel_key` and API helpers stubs for delete / e2ee / egress per [contracts/channels-servers-delete.md](./contracts/channels-servers-delete.md) and [contracts/voice-e2ee-egress.md](./contracts/voice-e2ee-egress.md)
- [X] T002 [P] Add brief ops note in `docs/operar-instancia.md` — recreate voice channels for Gravar; optional LiveKit egress env for artifacts (no new ports beyond existing)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + DB + domain for channel creator, E2EE state, channel key custody, audit — **bloqueia** US1b e US2b.

**⚠️ CRITICAL**: Delete auth and Gravar/Religar cannot ship correctly until this phase completes.

- [X] T003 Add SQLite migration `backend/migrations/0006_channel_e2ee_key_delete.sql` — `channel.created_by_account_id` (backfill owner), `channel.e2ee_enabled`, tables `channel_key`, `e2ee_audit_log`, optional `recording_session` per [data-model.md](./data-model.md)
- [X] T004 Wire channel create/read with `created_by`, `e2ee_enabled`, `has_channel_key` in `backend/src/db/channel.rs` (and related mappers)
- [X] T005 Implement `backend/src/db/channel_key.rs` (insert/get sealed blob by channel_id) and `backend/src/db/e2ee_audit.rs`
- [X] T006 Extend voice channel create API to require `custody_ack` + `channel_key_sealed` in `backend/src/api/channels.rs` (or create handler) per [contracts/channels-servers-delete.md](./contracts/channels-servers-delete.md)
- [X] T007 Add WS event payloads for `channel.deleted`, `server.deleted`, `channel.e2ee_changed` in backend WS broadcast helpers (existing hub module)
- [X] T008 Update Rust contract tests for voice create custody gate + channel list fields in `backend/tests/contract/` (new or extend channels tests)

**Checkpoint**: Migration applies; create voice without custody → 400; with custody → `has_channel_key: true`.

---

## Phase 3: User Story 1 - Shell Nocturne + rail de servidores (Priority: P1) 🎯 MVP

**Goal**: Rail de ícones + coluna de canais; troca de Servidor só pelo rail; modo palco esconde ambos.

**Independent Test**: [quickstart.md](./quickstart.md) US1.

### Implementation for User Story 1

- [X] T009 [US1] Create `frontend/src/shell/ServerRail.tsx` — vertical icon/initials list, active state, onSelect server
- [X] T010 [US1] Integrate rail into `frontend/src/shell/AppShell.tsx` grid (rail | sidebar | main); hide rail+sidebar in stage-mode; drawer includes rail on narrow
- [X] T011 [US1] Remove server switcher from channel-column header in `frontend/src/shell/Sidebar.tsx` — show server name only; keep create actions
- [X] T012 [P] [US1] Style rail + shell fidelity tokens in `frontend/src/styles/mesa-theme.css` per [contracts/ui-shell-media.md](./contracts/ui-shell-media.md) and prototype density

**Checkpoint**: ≥2 servers switch via rail only; stage mode hides chrome.

---

## Phase 4: User Story 1b - Apagar Servidor ou canal (Priority: P1)

**Goal**: Context menu Apagar; owner|creator channel; owner server; hard delete; last-channel blocked; kick voice.

**Independent Test**: [quickstart.md](./quickstart.md) US1b.

### Implementation for User Story 1b

- [X] T013 [US1b] Implement `DELETE /api/channels/{id}` with auth + last-channel 409 in `backend/src/api/channels.rs` + DB delete; broadcast `channel.deleted` per [contracts/channels-servers-delete.md](./contracts/channels-servers-delete.md)
- [X] T014 [US1b] Implement `DELETE /api/servers/{id}` owner-only in `backend/src/api/servers.rs` (or servers module); broadcast `server.deleted`
- [X] T015 [US1b] Contract tests delete auth / last_channel / server owner in `backend/tests/contract/` (e.g. `channels_delete.rs`, `servers_delete.rs`)
- [X] T016 [US1b] Add `frontend/src/shell/ContextMenu.tsx` (or components) — contextmenu + long-press, confirm dialog
- [X] T017 [US1b] Wire Apagar on channel rows + server rail in `frontend/src/shell/Sidebar.tsx` / `ServerRail.tsx` with permission checks; handle 409 last channel
- [X] T018 [US1b] On `channel.deleted` / `server.deleted` WS: navigate away, leave voice if needed in `frontend/src/pages/VoiceChannel.tsx` / app router shell

**Checkpoint**: Quickstart US1b passes; non-owner cannot delete.

---

## Phase 5: User Story 2 - Canal texto/voz fiéis (Priority: P1)

**Goal**: Chrome de texto e voz alinhado ao protótipo (sem chat/co-diretor no voz); controlos incluem espaço para Gravar (pode ficar desabilitado até US2b).

**Independent Test**: [quickstart.md](./quickstart.md) US2 / fidelity items 5–6, 13.

### Implementation for User Story 2

- [X] T019 [P] [US2] Align text channel header/list/composer markup & CSS in `frontend/src/pages/Channel.tsx` + `frontend/src/styles/mesa-theme.css` to prototype
- [X] T020 [US2] Align voice channel header, Comp/Grade, call controls, privacy line, bank chrome in `frontend/src/pages/VoiceChannel.tsx` + CSS (no text composer; no co-director)
- [X] T021 [P] [US2] Pass fidelity pass on dialogs already present (create server/channel chrome) in existing dialog components under `frontend/src/components/` / pages

**Checkpoint**: Side-by-side prototype recognizable for text+voice chrome.

---

## Phase 6: User Story 2b - Gravar cena + E2EE + custódia (Priority: P1)

**Goal**: Custody on create; Gravar → E2EE off + banner; Religar with channel key; egress best-effort.

**Independent Test**: [quickstart.md](./quickstart.md) US2b.

### Implementation for User Story 2b

- [X] T022 [US2b] Implement e2ee toggle + audit + WS in `backend/src/api/voice.rs` (or new `e2ee.rs`) per [contracts/voice-e2ee-egress.md](./contracts/voice-e2ee-egress.md)
- [X] T023 [US2b] Implement `egress/start` and `egress/stop` with compensation on failure in `backend/src/api/voice.rs` + LiveKit server client helper
- [X] T024 [US2b] Contract tests: custody create, e2ee toggle, egress unavailable 503, legacy without key 403 in `backend/tests/contract/`
- [X] T025 [US2b] Create-channel UI: show key, copy, custody checkbox gates submit in channel create dialog (`frontend/src/shell/Sidebar.tsx` or dialog component); generate+seal key client-side
- [X] T026 [US2b] Channel key storage/helpers in `frontend/src/crypto/` (or extend identity/key modules) — persist custodian material locally for Religar
- [X] T027 [US2b] Voice UI: Gravar dialog, banner E2EE off, Religar, disable when `!has_channel_key` in `frontend/src/pages/VoiceChannel.tsx`
- [X] T028 [US2b] Wire LiveKit `setE2EEEnabled` + channel key provider updates in `frontend/src/video/liveClient.ts` on `channel.e2ee_changed`

**Checkpoint**: New voice channel can Gravar/Religar when egress OK; clear error when not; legacy blocked.

---

## Phase 7: User Story 3 - Vídeo continua após Salvar (Priority: P1)

**Goal**: Reattach tracks after grid/layout updates without leave/rejoin.

**Independent Test**: [quickstart.md](./quickstart.md) US3.

### Implementation for User Story 3

- [X] T029 [US3] Harden `layoutMedia` in `frontend/src/pages/VoiceChannel.tsx` — clear orphan videos, reattach remotes/local, `play()` after move; run on `grid.updated`, layout_key change, editor close per [research.md D1](./research.md#d1--continuidade-de-vídeo-após-gridupdated--salvar-cena)
- [X] T030 [P] [US3] Ensure editor Salvar path still triggers grid/WS update without remounting LiveKit session in `frontend/src/pages/VoiceChannel.tsx` / `SceneEditor.tsx`

**Checkpoint**: 3× Salvar with 2 clients — 0 forced rejoin.

---

## Phase 8: User Story 4 - Enquadramento cover/centrado (Priority: P1)

**Goal**: Feeds fill tiles with cover + center.

**Independent Test**: [quickstart.md](./quickstart.md) US4.

### Implementation for User Story 4

- [X] T031 [US4] Set tile `video` to `object-fit: cover; object-position: center` in `frontend/src/styles/mesa-theme.css` (and remove conflicting `contain` rules)
- [X] T032 [P] [US4] Verify CameraGrid/grade containers fill height so cover works in `frontend/src/components/CameraGrid.tsx`

**Checkpoint**: Mestre/Faixa tiles filled, centered.

---

## Phase 9: User Story 5 - Editor + diálogos criar (Priority: P2)

**Goal**: Editor/dialog fidelity; custody block already in US2b — polish layout panel to prototype.

**Independent Test**: Spec US5 + fidelity checklist editor/dialogs.

### Implementation for User Story 5

- [X] T033 [P] [US5] Polish SceneEditor layout/bank/copy spacing to prototype in `frontend/src/components/SceneEditor.tsx` + CSS
- [X] T034 [P] [US5] Polish create-server dialog steps chrome in existing server create UI (omit G3 public directory field)

**Checkpoint**: Editor/dialogs match prototype for in-scope fields.

---

## Phase 10: User Story 6 - Matriz de desvios + Polish (Priority: P2)

**Goal**: Document deviations; fidelity ≥90%; cargo/tsc green.

**Independent Test**: [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md); [quickstart.md](./quickstart.md) regressão.

### Implementation for User Story 6 / Polish

- [X] T035 [P] [US6] Record accepted deviations (rail, no fake badges) in `specs/006-prototype-ui-parity/contracts/fidelity-checklist.md` notes + complete checklist ≥90%
- [X] T036 [P] Run `cargo test` in `backend/` and fix regressions from 0006 / delete / e2ee
- [X] T037 [P] Run `npx tsc --noEmit` in `frontend/` and fix type errors
- [X] T038 Execute [quickstart.md](./quickstart.md) US1–US4 + US2b; note gaps
- [X] T039 [P] Confirm backlog file still accurate for G3/G4/G7–G9 in `docs/backlog-prototype-v2-gaps.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1b, US2b
- **US1 (Phase 3)**: After Setup (CSS/shell); can parallel Foundation
- **US1b (Phase 4)**: After Foundation
- **US2 (Phase 5)**: After Setup; parallel US1
- **US2b (Phase 6)**: After Foundation (+ ideally US2 chrome)
- **US3 (Phase 7)**: After Setup; parallel; best after US2 VoiceChannel stable
- **US4 (Phase 8)**: After Setup; parallel US3
- **US5 (Phase 9)**: After US2/US2b custody UI
- **Polish (Phase 10)**: After desired stories

### User Story Dependencies

- **US1**: Independent of E2EE schema
- **US1b**: Needs Foundation (`created_by`)
- **US2**: Independent chrome
- **US2b**: Needs Foundation (channel_key, e2ee)
- **US3 / US4**: Frontend media; no migration required
- **US5 / US6**: Polish

### Parallel Opportunities

- T001 ∥ T002
- US1 ∥ Foundation (different owners)
- T019 ∥ T021; T031 ∥ T032
- T036 ∥ T037 ∥ T039

---

## Parallel Example: Foundation + Rail

```bash
# Dev A: T003–T008 migration + create custody API
# Dev B: T009–T012 ServerRail + AppShell
```

## Parallel Example: Media fixes

```bash
# After VoiceChannel stable: T029–T030 (reattach) ∥ T031–T032 (cover)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 3 US1 (rail)
2. **STOP** — validate quickstart US1

### Incremental Delivery

1. US1 rail
2. Foundation + US1b delete
3. US3 + US4 media fixes (high user pain)
4. US2 chrome + US2b Gravar/E2EE
5. US5/US6 polish + fidelity

### Suggested MVP

**US1 (rail)** for navigation; next highest value **US3+US4** (video continuity/framing) then **US1b** + **US2b**.

---

## Notes

- Next migration number: `0006_*` (after `0005_layout_key.sql`)
- Do not implement G3/G4/G7–G9
- Legacy voice without `channel_key`: Gravar/Religar disabled
- Format: all tasks use `- [ ] Txxx ...` with paths
