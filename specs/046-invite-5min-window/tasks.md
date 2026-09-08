---
description: "Task list for Janela de 5 minutos para códigos de convite"
---

# Tasks: Janela de 5 minutos para códigos de convite

**Input**: Design documents from `/specs/046-invite-5min-window/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/invite-ttl-uses.md](./contracts/invite-ttl-uses.md), [quickstart.md](./quickstart.md)

**Tests**: Pedidos no plano (`cargo test --test contract` invites + auth_register). Incluir tarefas de teste de contrato por história.

**Organization**: Setup → Foundational (migração, domínio, config, db) → US1 usos/teto → US2 TTL 5 min → US3 âmbito servidor → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/tests/contract/`, `backend/migrations/`, `frontend/src/`, `docs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar alvo Speckit e pontos de extensão no código existente.

- [X] T001 Confirm `.specify/feature.json` points at `specs/046-invite-5min-window` and skim create/accept/register paths in `backend/src/api/invites.rs`, `backend/src/api/auth/register.rs`, `backend/src/db/invite.rs`, `backend/src/domain/invite.rs`, `backend/src/config.rs`

**Checkpoint**: Feature dir correcto; mapa de ficheiros alinhado ao plano.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema `use_count`, predicado de usabilidade, TTL default 300, camada DB — **bloqueia** US1–US3.

**⚠️ CRITICAL**: Nenhuma user story até migração + domínio + config + db estarem prontos.

- [X] T002 Add migration `backend/migrations/0011_invite_use_count_and_legacy.sql`: `use_count INTEGER NOT NULL DEFAULT 0`; revoke still-usable rows (`revoked_at` null and (`expires_at` null or future)) per [research.md](./research.md) R5 / FR-011
- [X] T003 Update `InviteRecord` / `Invite` and `is_usable` (require `expires_at > now`, `use_count < INVITE_MAX_USES`, not revoked) plus `pub const INVITE_MAX_USES: i64 = 10` in `backend/src/domain/invite.rs` per [data-model.md](./data-model.md)
- [X] T004 Change `default_invite_ttl_secs` fallback from `604_800` to `300` in `backend/src/config.rs` (keep `DEFAULT_INVITE_TTL_SECS` env override)
- [X] T005 Map `use_count` on select/insert and add atomic `increment_use_count` (`UPDATE … SET use_count = use_count + 1 WHERE … AND use_count < 10`) in `backend/src/db/invite.rs` per [research.md](./research.md) R3

**Checkpoint**: Compila com schema novo; `is_usable` e increment API de db disponíveis (ainda sem wire completo nos handlers).

---

## Phase 3: User Story 1 - Convidado cria conta com link fresco (Priority: P1) 🎯 MVP

**Goal**: Registo/accept com convite fresco criam adesão ao servidor; até **10 usos**; 11.º recusado; já-membro não incrementa.

**Independent Test**: Dono gera convite → até 10 adesões → 11.ª falha; membership só no servidor do convite ([quickstart.md](./quickstart.md) B).

### Tests for User Story 1

- [X] T006 [P] [US1] Add contract coverage for 10 successful uses then 11th rejection and no increment on already-member accept in `backend/tests/contract/invites.rs` and/or `backend/tests/contract/auth_register.rs` per [contracts/invite-ttl-uses.md](./contracts/invite-ttl-uses.md) / SC-003 / SC-006

### Implementation for User Story 1

- [X] T007 [US1] After successful new membership via invite, call atomic `increment_use_count` (prefer same transaction as membership insert) in `backend/src/api/auth/register.rs`; fail join if increment loses race
- [X] T008 [US1] Same increment + usable check (including use cap) on accept path in `backend/src/api/invites.rs`; skip increment when already a member
- [X] T009 [US1] Surface exhausted/expired invite clearly on `frontend/src/pages/Invite.tsx` (and Auth invite errors if mapped there)

**Checkpoint**: SC-001 (dentro da janela), SC-003, SC-006; bootstrap 1.ª conta intacto.

---

## Phase 4: User Story 2 - Código morto após 5 minutos (Priority: P1)

**Goal**: Default de produto 5 min; UI omite TTL; API rejeita permanente; após expirar preview/registo/accept falham.

**Independent Test**: Create omite TTL → `expires_at` ≈ now+300s; `expires_in_seconds: null` → 400; after expiry all paths fail ([quickstart.md](./quickstart.md) A/C).

### Tests for User Story 2

- [X] T010 [P] [US2] Contract tests: omitted TTL → ~300s expiry; `expires_in_seconds: null` → 400; expired invite rejected on preview/register/accept in `backend/tests/contract/invites.rs` (and register if needed) per [contracts/invite-ttl-uses.md](./contracts/invite-ttl-uses.md) / SC-002 / SC-005

### Implementation for User Story 2

- [X] T011 [US2] Reject permanent create (`MaybeExpires::Value(None)` → 400) and keep omitted TTL → `now + default_invite_ttl_secs` in `backend/src/api/invites.rs` per [research.md](./research.md) R2 / FR-006 / FR-009
- [X] T012 [P] [US2] Optional product copy “válido 5 minutos · até 10 entradas” (no permanent control) in `frontend/src/shell/Sidebar.tsx` invite dialog; keep omitting `expires_in_seconds`

**Checkpoint**: SC-002, SC-005; sem permanente no fluxo de produto.

---

## Phase 5: User Story 3 - Convite continua só daquele servidor (Priority: P1)

**Goal**: Preservar e tornar explícito: uso bem-sucedido → membership **apenas** no `server_id` do convite.

**Independent Test**: Convite de S → adesão só a S; não a S′ ([quickstart.md](./quickstart.md) E / SC-004).

### Tests for User Story 3

- [X] T013 [P] [US3] Add/strengthen regression asserting register/accept via invite of server S creates membership only on S in `backend/tests/contract/invites.rs` and/or `backend/tests/contract/auth_register.rs` per FR-004 / SC-004

### Implementation for User Story 3

- [X] T014 [US3] Verify accept/register still bind membership exclusively to `invite.server_id` in `backend/src/api/invites.rs` and `backend/src/api/auth/register.rs`; fix only if regression fails (no model change expected)

**Checkpoint**: SC-004 verde; âmbito server-scoped intacto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Docs operacionais, arquitectura, validação rápida.

- [X] T015 [P] Update `DEFAULT_INVITE_TTL_SECS` default docs from 7d/`604800` to **300** / 5 min in `docs/operar-instancia.md` and `docs/deploy-producao.md`
- [X] T016 [P] Align invite TTL wording (no “admin pode gerar permanente” as product default) in `docs/arquitetura-tecnica.md`
- [X] T017 Run `cargo test --test contract` focusing invites + auth_register; smoke [quickstart.md](./quickstart.md) A–E as practical
- [X] T018 After successful implement: append `docs/daily/yyyy-mm-dd.md` Speckit section and `[Unreleased]` in `CHANGELOG.md` for `046-invite-5min-window`

**Checkpoint**: Docs + contract suite alinhados ao produto.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** US1–US3
- **US1 (Phase 3)**: After Foundational — MVP (usos + adesão)
- **US2 (Phase 4)**: After Foundational; benefits from US1 increment path but independently testable on create/expiry
- **US3 (Phase 5)**: After Foundational; regression after US1 paths preferred
- **Polish (Phase 6)**: After desired stories complete

### User Story Dependencies

- **US1**: Needs T002–T005; implements consumption + cap
- **US2**: Needs T004 (default 300) + create API; can parallel FE copy with tests
- **US3**: Mostly verification; run after register/accept still wire `server_id`

### Within Each Story

- Contract tests before or with implementation; ensure they fail until behaviour lands
- Increment before claiming US1 done
- Reject-permanent before claiming US2 done

### Parallel Opportunities

- T006 ‖ T010 ‖ T013 once foundational exists (different assertions; may share files — serialize edits to same test file)
- T012 ‖ T015 ‖ T016 (FE vs docs)
- T007 then T008 sequential (both touch invite consumption)

---

## Parallel Example: User Story 1

```bash
# After Phase 2:
Task: "T006 contract use-cap tests in backend/tests/contract/invites.rs"
# Then sequential:
Task: "T007 increment on register in backend/src/api/auth/register.rs"
Task: "T008 increment on accept in backend/src/api/invites.rs"
Task: "T009 Invite.tsx exhausted copy"
```

---

## Parallel Example: User Story 2

```bash
Task: "T010 TTL/permanent contract tests in backend/tests/contract/invites.rs"
Task: "T011 reject permanent in backend/src/api/invites.rs"
Task: "T012 Sidebar copy in frontend/src/shell/Sidebar.tsx"  # [P] with T011 if no shared files
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1–2 (migration + domain + config + db)
2. Phase 3 US1 (increment + cap + FE errors)
3. **STOP**: validate 10 uses / 11th fail

### Incremental Delivery

1. + US2 → default 5 min, no permanent
2. + US3 → server-scope regression
3. + Polish → docs + full contract run

### Parallel Team Strategy

- After Phase 2: A = US1 backend, B = US2 create/TTL + Sidebar, C = US3 tests / docs T015–T016

---

## Notes

- Next migration number is **0011** (after `0010_channel_read_state.sql`)
- Do not make `max_uses` env-configurable in this feature
- Bootstrap first account without invite stays unchanged
- Legacy wipe is one-shot in T002 only
- Format: all tasks use `- [ ]`, Task ID, optional `[P]` / `[Story]`, and file paths
