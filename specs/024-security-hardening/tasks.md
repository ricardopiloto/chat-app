---
description: "Task list for Endurecimento de segurança e higiene de código"
---

# Tasks: Endurecimento de segurança e higiene de código

**Input**: Design documents from `/specs/024-security-hardening/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Pedidos no plano (`cargo test --test contract`). Incluir tarefas de teste de contrato por história. Sem BFF. `TestApp` desliga ritmo.

**Organization**: Setup → Foundational (config, authz, rate_limit, headers, envelopes) → US1 boot → US2 unfurl → US3 auth abuse → US4 voz → US5 browser → US6 helpers/CSS → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US6]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/tests/`, `frontend/src/`, `docs/operar-instancia.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: `TestApp` e constantes de chaves de exemplo alinhadas ao contrato.

- [ ] T001 Add `rate_limit_disabled` (default true in tests) and production flags pass-through on `Config` usage in `backend/tests/common/mod.rs` so later stories can toggle `MESA_PRODUCTION` / ritmo without breaking existing contract tests

**Checkpoint**: `cargo test --test contract` still green on current code after TestApp fields exist (wire no-ops until Phase 2–3).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Módulos partilhados — **bloqueia** as user stories.

**⚠️ CRITICAL**: US1–US6 assumem `Config::validate`, `authz`, `rate_limit`, headers, política de envelopes.

- [ ] T002 Set `BIND` default to `127.0.0.1:8080`, parse `MESA_PRODUCTION` / `MESA_ENV=production`, example LiveKit key constants, and `rate_limit_disabled` from env in `backend/src/config.rs` per [contracts/production-boot.md](./contracts/production-boot.md)
- [ ] T003 Create `backend/src/api/authz.rs` with `require_member`; move implementation from `backend/src/api/channels.rs` and update callers in `backend/src/api/*.rs` so they compile
- [ ] T004 [P] Implement in-memory 10/60s IP limiter in `backend/src/rate_limit.rs` (not wired to routes yet) per [research.md](./research.md) R4
- [ ] T005 [P] Implement CSP / `X-Frame-Options` / nosniff / Referrer-Policy middleware in `backend/src/security_headers.rs` per [contracts/browser-headers.md](./contracts/browser-headers.md) (not wired yet)
- [ ] T006 Restrict `POST` in `backend/src/api/key_envelopes.rs` to self-upsert or pending-target + owner/synced caller per [contracts/key-envelopes.md](./contracts/key-envelopes.md)
- [ ] T007 Add contract tests for envelope 403 overwrite in `backend/tests/contract/key_envelopes.rs` and register the module in `backend/tests/contract/mod.rs`

**Checkpoint**: Helpers existem; boot/unfurl/auth/voz ainda não endurecidos.

---

## Phase 3: User Story 1 - Publicar sem chaves de fábrica (Priority: P1) 🎯 MVP

**Goal**: Perfil de produção recusa par de exemplo + cookie inseguro; bind loopback por omissão; docs de produção.

**Independent Test**: [quickstart.md](./quickstart.md) §1 e §6.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add `Config::validate` unit/contract coverage in `backend/tests/contract/production_boot.rs` (example keys fail only when production; cookie_secure required) per [contracts/production-boot.md](./contracts/production-boot.md)

### Implementation for User Story 1

- [ ] T009 [US1] Implement `Config::validate` in `backend/src/config.rs` and call it from `backend/src/main.rs` before bind
- [ ] T010 [US1] Document LAN `BIND=0.0.0.0:8080` explicit, production profile, unique LiveKit keys, and `LIVEKIT_WS_URL` in `docs/operar-instancia.md` (and `README.md` bind/examples so they do not present example keys as production)

**Checkpoint**: `MESA_PRODUCTION=1` + `instkey` não arranca; default bind loopback.

---

## Phase 4: User Story 2 - Unfurl não é proxy interno (Priority: P1)

**Goal**: DNS + IPs privados bloqueados; corpo ≤256 KiB; `image_url` validado; cliente sem `javascript:`.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Tests for User Story 2

- [ ] T011 [P] [US2] Extend unfurl cases in `backend/tests/contract/attachments.rs` (or new `backend/tests/contract/unfurl.rs`) for loopback, link-local, and oversize `Content-Length` per [contracts/unfurl.md](./contracts/unfurl.md)

### Implementation for User Story 2

- [ ] T012 [US2] Harden `validate_public_url` (resolve DNS, block private IPs after redirect) and cap body at 256 KiB in `backend/src/api/unfurl.rs`; validate OG `image_url` the same way
- [ ] T013 [US2] Skip non-http(s) `image_url` in `frontend/src/components/LinkPreviews.tsx`

**Checkpoint**: `POST /api/unfurl` a `127.0.0.1` / `169.254.169.254` → 400.

---

## Phase 5: User Story 3 - Ritmo e primeiro operador (Priority: P1)

**Goal**: 10/60s em login+registo; 429 genérico; um `is_initial_operator`; login 401 idêntico.

**Independent Test**: [quickstart.md](./quickstart.md) §3.

### Tests for User Story 3

- [ ] T014 [P] [US3] Add rate-limit 429 tests in `backend/tests/contract/auth_rate_limit.rs` (enable limit on that TestApp) and first-operator serialisation if practical; keep default TestApp unlimited

### Implementation for User Story 3

- [ ] T015 [US3] Wire `rate_limit` into `backend/src/api/auth/login.rs` and `backend/src/api/auth/register.rs`; default `rate_limit_disabled=true` in `backend/tests/common/mod.rs`
- [ ] T016 [US3] Use SQLite immediate transaction around account count + insert in `backend/src/api/auth/register.rs` so at most one initial operator per [research.md](./research.md) R5
- [ ] T017 [US3] Confirm login unknown-handle vs bad-password stay `{ "error": "invalid credentials" }` in `backend/src/api/auth/login.rs`

**Checkpoint**: martelo de login → 429; corrida de registo → ≤1 operador inicial.

---

## Phase 6: User Story 4 - URL de voz configurada (Priority: P1)

**Goal**: Join devolve só `LIVEKIT_WS_URL`; Host falso ignorado.

**Independent Test**: [quickstart.md](./quickstart.md) §4.

### Tests for User Story 4

- [ ] T018 [P] [US4] Assert `url` ignores `Host: evil.example` in `backend/tests/contract/voice_join.rs` per [contracts/voice-signaling.md](./contracts/voice-signaling.md)

### Implementation for User Story 4

- [ ] T019 [US4] Remove Host/`X-Forwarded-Host` rewrite in `backend/src/token/mod.rs`; set join `url` from `config.livekit_url` in `backend/src/api/voice.rs`

**Checkpoint**: `url` === config em 100% dos joins de teste.

---

## Phase 7: User Story 5 - Cabeçalhos e fontes (Priority: P2)

**Goal**: CSP/frame-ancestors; sem Google Fonts; chaves de canal intocadas.

**Independent Test**: [quickstart.md](./quickstart.md) §5.

### Implementation for User Story 5

- [ ] T020 [US5] Attach `security_headers` layer in `backend/src/main.rs` and `backend/src/lib.rs` `router()` (tests see headers); HSTS only when `cookie_secure` or production per [research.md](./research.md) R8
- [ ] T021 [US5] Remove Google Fonts `@import` and set `--font-body` / `--font-heading` to `system-ui, sans-serif` in `frontend/src/styles/nocturne.css`

**Checkpoint**: DevTools sem `fonts.googleapis.com`; API com `X-Frame-Options: DENY`.

---

## Phase 8: User Story 6 - Authz partilhado (Priority: P3)

**Goal**: `history_visible_since` único para mensagens e anexos.

**Independent Test**: SC-008 — um helper, dois sítios.

### Implementation for User Story 6

- [ ] T022 [US6] Move `history_visible_since` (invite include_history / joined_at) into `backend/src/api/authz.rs` and use it from `backend/src/api/messages.rs` and `backend/src/api/attachments.rs` (delete duplicate `history_since` functions)

**Checkpoint**: Contract tests de histórico/anexos existentes continuam a passar.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T023 Run `cargo test --test contract --test integration` in `backend/` and fix failures
- [ ] T024 [P] Run `npx tsc --noEmit` in `frontend/`
- [ ] T025 Execute [quickstart.md](./quickstart.md) §1–§6 (LAN bind note; production env)
- [ ] T026 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T007)** → **US1** → **US2** → **US3** → **US4** → **US5** → **US6** → **Polish**
- T004 ∥ T005 (ficheiros novos distintos)
- T008 pode preparar testes US1 em paralelo com T009 se o validate já existir; senão T009 antes de T008 passar
- US2–US4 after config/TestApp; envelopes (T006–T007) before polish

### User Story Dependencies

```text
Foundational (config, authz, limiter, headers, envelopes)
    ├── US1 production boot (MVP)
    ├── US2 unfurl
    ├── US3 rate limit + first operator
    ├── US4 voice URL
    ├── US5 CSP + fonts
    └── US6 history_since helper
```

### Parallel Opportunities

- T004 ∥ T005
- T008 ∥ T010 after T009 (docs vs tests)
- T011 ∥ T013 (tests vs frontend) after T012 starts
- T023 then T024; T024 ∥ docs polish

---

## Parallel Example: Foundational modules

```bash
Task: "rate_limit.rs in-memory limiter"
Task: "security_headers.rs CSP middleware"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001–T002, T008–T010 — perfil de produção + bind + docs
2. **STOP**: quickstart §1
3. Then unfurl → auth → voz → CSP → authz → Polish

### Incremental Delivery

1. Foundational modules
2. US1 deploy defaults (MVP)
3. US2 SSRF
4. US3 abuse
5. US4 signaling
6. US5 browser
7. US6 DRY authz
8. `cargo test` + daily/CHANGELOG on implement

---

## Notes

- [P] = different files / no incomplete deps
- TestApp MUST keep rate limit off by default
- Do not add a BFF process
- Do not move channel keys out of localStorage
- Commit only if user requests
