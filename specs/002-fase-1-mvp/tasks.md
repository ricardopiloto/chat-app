---

description: "Task list for Fase 1 — MVP (cliente web)"
---

# Tasks: Fase 1 — MVP (cliente web)

**Input**: Design documents from `/specs/002-fase-1-mvp/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included, scoped to what `plan.md` decided ([D8](./research.md#d8--testes-cargo-test-no-backend--validação-manual-multi-navegador)): `cargo test` contract/integration tests for backend rules; multi-browser E2E stays manual via `quickstart.md` (no browser-automation tasks generated).

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P1/P1/P2/P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- File paths are exact, per the Structure Decision in [plan.md](./plan.md)

## Path Conventions

Web application (Option 2, per plan.md): `backend/src/`, `backend/tests/`, `frontend/src/`, `infra/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create repository skeleton for `backend/`, `frontend/`, `infra/` per the Project Structure in [plan.md](./plan.md)
- [x] T002 [P] Initialize backend Rust project in `backend/Cargo.toml` with `axum`, `tokio`, `sqlx` (sqlite, runtime-tokio), `argon2`, `livekit-api`, `serde`/`serde_json`, `uuid`
- [x] T003 [P] Initialize frontend project in `frontend/package.json` with SolidJS, Vite, TypeScript, `livekit-client` (per [research.md D2](./research.md#d2--framework-de-frontend-solidjs)); add `frontend/vite.config.ts` and `frontend/tsconfig.json`
- [x] T004 [P] Create `infra/docker-compose.yml` (LiveKit self-hosted + embedded TURN, no separate coturn per [research.md D7](./research.md#d7--turn-usar-o-turn-embutido-do-livekit-não-coturn-separado)), `infra/livekit.yaml`, and `infra/.env.example`, adapted from `spike/infra/`
- [x] T005 [P] Configure lint/format: `rustfmt.toml` + clippy lint level in `backend/`, ESLint + Prettier config in `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Write SQLite schema migration for `account`, `session`, `server`, `membership`, `key_envelope`, `channel`, `message`, `invite`, `grid_slot` tables in `backend/migrations/0001_init.sql`, per [data-model.md](./data-model.md)
- [x] T007 Implement config loading (DB path, LiveKit URL/API key/secret, session cookie settings, bind address) and `sqlx::SqlitePool` bootstrap in `backend/src/db/mod.rs` and `backend/src/main.rs`
- [x] T008 [P] Implement axum router skeleton + shared JSON error type (`{"error": "..."}`) in `backend/src/api/mod.rs` and `backend/src/main.rs`
- [x] T009 [P] Implement WebSocket hub skeleton — per-account connection registry, broadcast-to-server-members, envelope `{event, server_id, payload}` — in `backend/src/ws/mod.rs`, per [contracts/ws-events.md](./contracts/ws-events.md)
- [x] T010 [P] Implement session middleware — read `Session` cookie, look up `token_hash`, reject if `revoked_at`/`expires_at` past — in `backend/src/api/auth/session.rs`, per [research.md D3](./research.md#d3--sessão-token-opaco-server-side-em-cookie-httponly)
- [x] T011 [P] Implement frontend REST client (fetch wrapper, `credentials: 'include'`, typed per [contracts/rest-api.yaml](./contracts/rest-api.yaml)) in `frontend/src/api/client.ts`
- [x] T012 [P] Implement frontend WebSocket client (connect, dispatch by `event` name per [contracts/ws-events.md](./contracts/ws-events.md)) in `frontend/src/api/ws.ts`
- [x] T013 [P] Implement frontend identity-keypair module — generate X25519 keypair on register, encrypt private key at rest in IndexedDB with an Argon2id-derived key from the password — in `frontend/src/crypto/identity.ts`, per [research.md D4](./research.md#d4--chave-de-identidade-do-usuário-gerada-e-mantida-só-no-navegador)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Subir a instância e criar conta (Priority: P1) 🎯 MVP

**Goal**: Um operador publica a instância; a primeira conta nasce livre; depois disso, cadastro exige convite; login/logout funcionam com sessão de verdade.

**Independent Test**: Subir a instância, criar a primeira conta sem convite, confirmar que um segundo cadastro só pelo endereço falha, e que logout exige novo login.

### Tests for User Story 1

- [x] T014 [P] [US1] Contract tests for `POST /auth/register` — succeeds without invite on an empty instance, rejects (403) a second open signup, rejects (409) a duplicate handle — in `backend/tests/contract/auth_register.rs`
- [x] T015 [P] [US1] Contract tests for `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` — wrong credentials (401), session cookie issued/revoked — in `backend/tests/contract/auth_session.rs`

### Implementation for User Story 1

- [x] T016 [P] [US1] Implement `Account` domain + queries (`create`, `find_by_handle`, `count`) in `backend/src/domain/account.rs` and `backend/src/db/account.rs`
- [x] T017 [P] [US1] Implement `Session` domain + queries (`create`, `validate`, `revoke`) in `backend/src/domain/session.rs` and `backend/src/db/session.rs`
- [x] T018 [US1] Implement `POST /auth/register` handler — first-account-free rule (FR-002), invite-required check hook (wired fully in US2), Argon2id hash, stores `identity_pubkey` — in `backend/src/api/auth/register.rs` (depends on T016, T017)
- [x] T019 [US1] Implement `POST /auth/login` handler in `backend/src/api/auth/login.rs` (depends on T016, T017)
- [x] T020 [US1] Implement `POST /auth/logout` and `GET /auth/me` handlers in `backend/src/api/auth/mod.rs` (depends on T017)
- [x] T021 [P] [US1] Implement frontend register/login page (handle + password form, triggers `identity.ts` keypair generation on register) in `frontend/src/pages/Auth.tsx` (depends on T013)
- [x] T022 [US1] Wire session-cookie awareness in the app shell (redirect to `/auth` on 401, hold current `Account` in app state) in `frontend/src/App.tsx` (depends on T011, T021)

**Checkpoint**: User Story 1 fully functional and testable independently — an operator can stand up the instance, self-register the first account, and log in/out.

---

## Phase 4: User Story 2 - Criar um Servidor, canal de texto e convite (Priority: P1)

**Goal**: Uma conta cria um Servidor, um canal de texto, gera um convite (com/sem histórico); outra conta aceita e as duas trocam mensagens cifradas ponta-a-ponta; Servidores ficam isolados entre si.

**Independent Test**: Conta A cria Servidor + canal + convite; conta B aceita e as duas trocam mensagens; convite sem histórico esconde o passado de B; convite com histórico revela; conta C sem convite não vê nada.

### Tests for User Story 2

- [x] T023 [P] [US2] Contract tests for `POST/GET /servers` — criação define dono, listagem só retorna Servidores com Membership — in `backend/tests/contract/servers.rs`
- [x] T024 [P] [US2] Contract tests for `POST/GET /servers/{id}/channels` (tipo `text`) — só dono/admin cria, todo membro lista — in `backend/tests/contract/channels.rs`
- [x] T025 [P] [US2] Contract tests for `POST/GET /servers/{id}/invites`, `POST /invites/{code}/revoke`, `GET /invites/{code}`, `POST /invites/{code}/accept` — expiração padrão, permanente, `include_history` default `false`, convite revogado/expirado recusado (410) — in `backend/tests/contract/invites.rs`
- [x] T026 [P] [US2] Contract tests for `GET/POST /channels/{id}/messages` — histórico filtrado por `Membership.joined_at` quando o convite não incluiu histórico, liberado quando incluiu — in `backend/tests/contract/messages.rs`
- [x] T027 [US2] Integration test: 3 contas, 2 Servidores — nenhum vazamento de lista nem mensagem entre membros exclusivos de cada um (SC-007) — in `backend/tests/integration/server_isolation.rs`

### Implementation for User Story 2

- [x] T028 [P] [US2] Implement `Server` domain + queries (`create`, `list_for_account`) in `backend/src/domain/server.rs` and `backend/src/db/server.rs`
- [x] T029 [P] [US2] Implement `Membership` domain + queries (`create`, `exists`, `list_by_server`) in `backend/src/domain/membership.rs` and `backend/src/db/membership.rs`
- [x] T030 [P] [US2] Implement `Channel` domain + queries for type `text` (`create`, `list_by_server`) in `backend/src/domain/channel.rs` and `backend/src/db/channel.rs`
- [x] T031 [P] [US2] Implement `Invite` domain + queries (`create` with expiry/`include_history`, `validate`, `revoke`) in `backend/src/domain/invite.rs` and `backend/src/db/invite.rs`
- [x] T032 [P] [US2] Implement `Message` domain + queries (`create` ciphertext, `list_since` filtered by `joined_at`) in `backend/src/domain/message.rs` and `backend/src/db/message.rs`
- [x] T033 [P] [US2] Implement `KeyEnvelope` domain + queries (`upsert`, `get_for_account`) in `backend/src/domain/key_envelope.rs` and `backend/src/db/key_envelope.rs`, per [data-model.md#keyenvelope](./data-model.md#keyenvelope)
- [x] T034 [US2] Implement `POST/GET /servers` handlers in `backend/src/api/servers.rs` (depends on T028, T029)
- [x] T035 [US2] Implement `POST/GET /servers/{id}/channels` handlers in `backend/src/api/channels.rs` (depends on T029, T030)
- [x] T036 [US2] Implement invite handlers (`POST/GET /servers/{id}/invites`, `POST /invites/{code}/revoke`, `GET /invites/{code}`, `POST /invites/{code}/accept` — wires register-via-invite into T018, creates `Membership` with `key_handoff_status=pending`, emits `invite.consumed`) in `backend/src/api/invites.rs` (depends on T029, T031, T018)
- [x] T037 [US2] Implement `GET/POST /channels/{id}/messages` handlers (history filter, broadcasts `message.new` over the WS hub) in `backend/src/api/messages.rs` (depends on T029, T030, T032, T009)
- [x] T038 [US2] Implement `POST /servers/{id}/key-envelopes` handler + `key_handoff.requested`/`key_handoff.completed` WS events, per [contracts/key-handoff.md](./contracts/key-handoff.md), in `backend/src/api/key_envelopes.rs` (depends on T029, T033, T009)
- [x] T039 [P] [US2] Implement frontend `server_key` generation (AES-256-GCM) + message encrypt/decrypt module in `frontend/src/crypto/serverKey.ts` (depends on T013)
- [x] T040 [P] [US2] Implement frontend key-handoff client logic — react to `key_handoff.requested` by sealing `server_key` for the requester and posting the envelope; react to `key_handoff.completed` by fetching and unsealing the caller's own envelope — in `frontend/src/crypto/keyHandoff.ts`, per [contracts/key-handoff.md](./contracts/key-handoff.md) (depends on T039, T012)
- [x] T041 [US2] Implement frontend Server list + create-Server page in `frontend/src/pages/Servers.tsx` (depends on T022, T039)
- [x] T042 [US2] Implement frontend text-channel view (send/receive, decrypt via `serverKey.ts`) in `frontend/src/pages/Channel.tsx` (depends on T041, T039)
- [x] T043 [US2] Implement frontend invite creation/accept UI (link, history toggle, accept flow including register-if-no-session) in `frontend/src/pages/Invite.tsx` (depends on T041)

**Checkpoint**: User Stories 1 AND 2 both work independently — text collaboration inside an isolated Server, E2E-encrypted.

---

## Phase 5: User Story 3 - Canal de voz/vídeo com grade de câmeras fixas (Priority: P1)

**Goal**: Dono cria um canal `voice_video` (grade nasce com 4 slots); membros publicam câmera/microfone e ocupam o primeiro slot vazio, persistente entre sessões; vídeo de proporção diferente cabe no slot sem distorcer a grade; um único dispositivo por conta publica A/V por vez.

**Independent Test**: Dois membros no mesmo canal de vídeo, A/V nos dois sentidos, primeiro slot vazio para cada um, rejoin no mesmo lugar, grade estável com fonte retrato e paisagem; segunda aba da mesma conta só o último publica.

### Tests for User Story 3

- [x] T044 [P] [US3] Contract test for `POST /channels/{id}/voice/join` — token nunca contém `secret`/`apiSecret`/`api_secret`, exige Membership, `identity`=`account_id`, `room`=`channel_id` — in `backend/tests/contract/voice_join.rs`, per [contracts/token-service.md](./contracts/token-service.md)
- [x] T045 [P] [US3] Contract test for `GET /channels/{id}/grid` auto-assignment — primeiro-slot-vazio na ordem correta, conta que já teve slot volta ao mesmo índice em vez de "primeiro vazio" — in `backend/tests/contract/grid.rs`, per [data-model.md#gridslot](./data-model.md#gridslot)

### Implementation for User Story 3

- [x] T046 [US3] Extend `Channel` domain/queries for type `voice_video` with `grid_slot_count` default 4 (FR-010) in `backend/src/domain/channel.rs` (depends on T030)
- [x] T047 [US3] Implement `GridSlot` domain + queries — auto-assign first-empty on first publish, retain slot on rejoin, no compaction — in `backend/src/domain/grid.rs` and `backend/src/db/grid.rs`, per [data-model.md#gridslot](./data-model.md#gridslot)
- [x] T048 [US3] Implement `token` module — LiveKit JWT issuance via `livekit-api`, `identity`=`account_id`, `room`=`channel_id`, secret only in this module — in `backend/src/token/mod.rs`, per [contracts/token-service.md](./contracts/token-service.md)
- [x] T049 [US3] Implement `POST /channels/{id}/voice/join` handler (Membership check, calls `token` module, triggers grid auto-assign) in `backend/src/api/voice.rs` (depends on T046, T047, T048)
- [x] T050 [US3] Implement `GET /channels/{id}/grid` handler + `grid.updated` WS broadcast in `backend/src/api/grid.rs` (depends on T047, T009)
- [x] T051 [P] [US3] Implement frontend camera-grid component — 2–4 slots, video fitted inside slot bounds regardless of source aspect ratio, empty slots stay visible without reflow (FR-013) — in `frontend/src/components/CameraGrid.tsx`
- [x] T052 [US3] Implement frontend LiveKit integration — join room with the issued token, publish/subscribe tracks, apply `server_key` via `ExternalE2EEKeyProvider` as the media frame key — in `frontend/src/video/liveClient.ts` (depends on T039, T051)
- [x] T053 [US3] Implement frontend voice-channel page wiring grid + `liveClient` + presence indicators in `frontend/src/pages/VoiceChannel.tsx` (depends on T042, T051, T052)

**Checkpoint**: User Stories 1–3 functional — this is the P1 MVP: text + fixed-grid video call, E2E-encrypted, on an isolated self-hosted instance.

---

## Phase 6: User Story 4 - Dono define as posições da grade (Priority: P2)

**Goal**: Dono (ou quem administra o canal) substitui o mapa automático por um mapa manual (2–4 slots, ocupação escolhida); persiste entre sessões; membros sem permissão não conseguem alterar.

**Independent Test**: Dono põe A no slot 0 e B no slot 1; ambos saem e voltam; posições permanecem; tentativa sem permissão não altera o layout para ninguém.

### Tests for User Story 4

- [x] T054 [P] [US4] Contract test for `PUT /channels/{id}/grid` — só dono/admin do canal altera, `slot_count` 2–4, mapa persiste, membro sem permissão recebe 403 e o layout não muda — in `backend/tests/contract/grid_admin.rs`

### Implementation for User Story 4

- [x] T055 [US4] Implement permission helper `is_channel_admin(account_id, channel_id)` (dono do Servidor ou papel de admin de canal) in `backend/src/domain/permissions.rs`
- [x] T056 [US4] Implement `PUT /channels/{id}/grid` handler — owner override, sets `assigned_by=owner`, resizes `slot_count` 2–4, drops slots `>= new_count` — in `backend/src/api/grid.rs` (depends on T047, T055)
- [x] T057 [P] [US4] Implement frontend grid-admin panel (set slot count, assign accounts to slots) in `frontend/src/components/GridAdmin.tsx`
- [x] T058 [US4] Wire the grid-admin panel into the voice-channel page, visible only to admins, calling `PUT /channels/{id}/grid` in `frontend/src/pages/VoiceChannel.tsx` (depends on T053, T057)

**Checkpoint**: User Stories 1–4 functional — automatic grid plus intentional composition.

---

## Phase 7: User Story 5 - Proteção ponta-a-ponta ligada por padrão (Priority: P2)

**Goal**: Confirmar e travar que texto, voz e vídeo saem sempre cifrados ponta-a-ponta por padrão, sem opção de desligar nesta fase, e que a instância não guarda nem encaminha conteúdo em claro.

**Independent Test**: Inspecionar o que a instância armazena (SQLite) e o que o LiveKit encaminha; nenhum dos dois revela conteúdo em claro; nenhum controle de "desligar proteção" existe na UI/API.

### Tests for User Story 5

- [x] T059 [P] [US5] Integration test asserting no plaintext is ever persisted — seed known plaintext through the real encrypt path, query SQLite directly, assert `message.content_ciphertext` and `key_envelope.sealed_key` never equal or contain the plaintext/key material — in `backend/tests/integration/no_plaintext_at_rest.rs`, per SC-006
- [x] T060 [P] [US5] Contract test asserting no "disable E2EE" route exists on any channel/server endpoint (guards FR-015's Acceptance Scenario 3) — in `backend/tests/contract/no_e2ee_toggle.rs`

### Implementation for User Story 5

- [x] T061 [US5] Document the Windows/macOS browser E2EE gap and the Linux/web-only scope of the "done" criteria for this phase, per spec Assumptions and FR-016/SC-006, in `docs/e2ee-gaps.md`

**Checkpoint**: All P1 + P2 user stories independently functional and testable — full spec scope delivered.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T062 [P] Write the operator setup guide (Docker Compose steps, required signaling/media ports, env vars) in `docs/operar-instancia.md`, per FR-017/SC-001
- [x] T063 [P] Add structured request/error logging across backend handlers in `backend/src/main.rs` and `backend/src/api/mod.rs`
- [x] T064 Run the full [quickstart.md](./quickstart.md) validation (US1–US5, SC-001–SC-007) and record results in `specs/002-fase-1-mvp/results.md`
- [x] T065 [P] Security review pass — session cookie flags, Argon2id parameters, invite-code entropy, confirm the LiveKit API secret never leaves `backend/src/token/` — across `backend/src/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; its invite-accept flow (T036) depends on US1's `POST /auth/register` (T018)
- **User Story 3 (Phase 5)**: Depends on Foundational; its media E2EE (T052) depends on US2's `server_key` module (T039)
- **User Story 4 (Phase 6)**: Depends on US3's `GridSlot` (T047)
- **User Story 5 (Phase 7)**: Depends on US2's encryption path (T032, T033, T039) and US3's media encryption (T052) already existing — it verifies/documents them rather than building new mechanism
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies (why this order, not strict isolation)

Unlike a typical spec-kit feature, US1→US2→US3 are all P1 and ship together as the MVP defined by the spec's own "Definição de done" — US2's Acceptance Scenario 6 and US3's media already require the E2EE mechanism that FR-015 mandates, so the crypto plumbing (identity keys in Foundational, `server_key`/handoff in US2, LiveKit frame key in US3) is built once, where each story's own acceptance criteria first requires it — not duplicated per story. US4 and US5 (P2) are additive on top of a working US1–US3 MVP.

### Within Each User Story

- Contract/integration tests (where included) before their corresponding handlers
- Domain + db modules before API handlers that use them
- Backend handlers before the frontend pages that call them
- Story complete before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] (T002–T005) run in parallel
- All Foundational tasks marked [P] (T008–T013) run in parallel once T006–T007 land
- Within US2, T028–T033 (six domain+db modules, six different file pairs) run in parallel
- Within US1/US2/US3, all `[P]`-marked contract test files run in parallel before their implementation tasks
- US4 and US5 can be staffed in parallel once US3's `GridSlot` (T047) and US2's crypto modules (T039) exist

---

## Parallel Example: User Story 2

```bash
# Domain + db modules (six independent file pairs):
Task: "Implement Server domain + queries in backend/src/domain/server.rs and backend/src/db/server.rs"
Task: "Implement Membership domain + queries in backend/src/domain/membership.rs and backend/src/db/membership.rs"
Task: "Implement Channel domain + queries in backend/src/domain/channel.rs and backend/src/db/channel.rs"
Task: "Implement Invite domain + queries in backend/src/domain/invite.rs and backend/src/db/invite.rs"
Task: "Implement Message domain + queries in backend/src/domain/message.rs and backend/src/db/message.rs"
Task: "Implement KeyEnvelope domain + queries in backend/src/domain/key_envelope.rs and backend/src/db/key_envelope.rs"

# Contract tests (four independent files):
Task: "Contract tests for POST/GET /servers in backend/tests/contract/servers.rs"
Task: "Contract tests for POST/GET /servers/{id}/channels in backend/tests/contract/channels.rs"
Task: "Contract tests for invites lifecycle in backend/tests/contract/invites.rs"
Task: "Contract tests for messages history filter in backend/tests/contract/messages.rs"
```

---

## Implementation Strategy

### MVP First (User Stories 1–3, all P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — **STOP and VALIDATE** (account creation, invite gate, login/logout)
4. Complete Phase 4: User Story 2 — **STOP and VALIDATE** (Server, text channel, invite, encrypted messages, isolation)
5. Complete Phase 5: User Story 3 — **STOP and VALIDATE** (video grid, A/V, rejoin-same-slot)
6. At this point the spec's own "Definição de done" is met — deploy/demo the MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → validate independently → demo (auth only)
3. US2 → validate independently → demo (text collaboration)
4. US3 → validate independently → demo (MVP complete per spec done-criteria)
5. US4 → validate independently → demo (intentional camera composition)
6. US5 → validate independently → demo (E2EE verified/documented)
7. Polish → operator docs, logging, full quickstart run, security review

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Backend tests are `cargo test` contract/integration tests per [research.md D8](./research.md#d8--testes-cargo-test-no-backend--validação-manual-multi-navegador); multi-browser E2E (US3 A/V, grid geometry) stays manual via [quickstart.md](./quickstart.md) — no task generated to build browser automation, matching the decision already recorded in research.md
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
