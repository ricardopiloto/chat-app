---
description: "Task list for Paridade de permissionamento — Fase 1"
---

# Tasks: Paridade de permissionamento — Fase 1

**Input**: Design documents from `/specs/060-permissions-parity-phase1/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md), [gap-analysis.md](./gap-analysis.md)

**Tests**: Backend contract tests (hierarchy, overwrites, explain/inspect, ACL migration regression) per plan Testing + [quickstart.md](./quickstart.md). Frontend: `tsc --noEmit`.

**Organization**: Setup → Foundational (migration + domain/DB + `AccessDecision` + error `code`) → US1 hierarchy → US2 overwrites → US3 explain/inspect → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/0017_permissions_parity_phase1.sql`, `backend/src/domain/{permissions,channel_acl,server_role}.rs`, `backend/src/db/{channel_acl,server_role}.rs`, `backend/src/api/{authz,roles,mute,channels,messages,voice,mod}.rs`, `backend/src/error.rs`, `backend/tests/contract/`, `frontend/src/api/client.ts`, `frontend/src/components/ChannelAclPanel.tsx`, `frontend/src/pages/{RolesManagePage,MembersManagePage}.tsx`, `frontend/src/components/MembersPanel.tsx`, `frontend/src/lib/apiError.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin feature dir and skim authz/ACL baseline.

- [X] T001 Confirm `.specify/feature.json` → `specs/060-permissions-parity-phase1` and skim `effective_channel_access` in `backend/src/domain/permissions.rs`, `channel_access` in `backend/src/api/authz.rs`, ACL in `backend/src/db/channel_acl.rs` / `backend/src/api/channels.rs`, kick/mute/assign in `backend/src/api/roles.rs` + `backend/src/api/mute.rs`, FE `ChannelAclPanel.tsx` / `RolesManagePage.tsx`

**Checkpoint**: Baseline understood; feature pointer correct.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + domain/DB plumbing + shared decision types — **blocks** all user stories.

**⚠️ CRITICAL**: No US work until migration + `position`/`effect`/`everyone` + `AccessDecision` skeleton + optional API `code` exist.

- [X] T002 Add migration `backend/migrations/0017_permissions_parity_phase1.sql`: `server_role.position` + Dono/backfill; `channel_acl.effect` default `allow`; allow `subject_type=everyone` + nil UUID; replace unique key per [data-model.md](./data-model.md)
- [X] T003 Extend `ServerRole` with `position` in `backend/src/domain/server_role.rs` and persist create-at-bottom / list / update in `backend/src/db/server_role.rs`
- [X] T004 [P] Extend `AclSubjectType` (`Everyone`), `effect` on `ChannelAclEntry`, and parsers in `backend/src/domain/channel_acl.rs`; update load/save in `backend/src/db/channel_acl.rs`
- [X] T005 Add `AccessDecision` / factor structs and hierarchy helpers (`can_moderate_member`, `can_manage_role_target`) stubs in `backend/src/domain/permissions.rs` (resolver body filled in US1/US2)
- [X] T006 [P] Extend `ApiError` JSON with optional `code` in `backend/src/error.rs` (e.g. `hierarchy_denied`, `channel_overwrite_deny`, `missing_capability`)
- [X] T007 [P] Extend FE types `ServerRole.position`, `ChannelAclEntry.effect` / `subject_type: everyone` in `frontend/src/api/client.ts`

**Checkpoint**: Migrated DB; domain/DB round-trip for position + allow/deny rows; errors can carry `code`.

---

## Phase 3: User Story 1 - Hierarquia impede abusar de quem está acima (Priority: P1) 🎯 MVP

**Goal**: Kick, mute, assign, and role edit/reorder respect role position; new roles spawn at bottom; owner exempt.

**Independent Test**: [quickstart.md](./quickstart.md) Hierarchy section; [contracts/role-hierarchy.md](./contracts/role-hierarchy.md).

### Tests for User Story 1

- [X] T008 [P] [US1] Add contract tests for hierarchy on kick/mute/assign/reorder + new-role-at-bottom in `backend/tests/contract/` (e.g. `hierarchy.rs`); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 1

- [X] T009 [US1] Implement position comparison helpers and wire owner bypass in `backend/src/domain/permissions.rs`
- [X] T010 [US1] Enforce hierarchy on `delete_member`, `put_member_role` / role edit/delete in `backend/src/api/roles.rs` with `code: hierarchy_denied`
- [X] T011 [US1] Enforce hierarchy on mute create/unmute-target paths in `backend/src/api/mute.rs` (same denial code)
- [X] T012 [US1] Add `PUT /api/servers/{server_id}/roles/positions` handler + route in `backend/src/api/roles.rs` / `backend/src/api/mod.rs` per [contracts/role-hierarchy.md](./contracts/role-hierarchy.md); create_role inserts at bottom
- [X] T013 [US1] Expose `position` in role JSON responses from `backend/src/api/roles.rs` / DB mapping
- [X] T014 [US1] Add `putRolePositions` client helper in `frontend/src/api/client.ts`
- [X] T015 [US1] Reorder UI (up/down or drag) respecting actor rank in `frontend/src/pages/RolesManagePage.tsx`
- [X] T016 [P] [US1] Disable or explain blocked kick/mute/assign when hierarchy fails in `frontend/src/components/MembersPanel.tsx` and/or `frontend/src/pages/MembersManagePage.tsx`

**Checkpoint**: Lower role cannot moderate equal/higher; reorder limited; new roles at bottom.

---

## Phase 4: User Story 2 - Overwrites Allow/Deny no canal (Priority: P1)

**Goal**: Channel ACL supports everyone/role/member Allow|Deny; resolve order base → todos → perfil → membro → dono; Deny view only on private.

**Independent Test**: [quickstart.md](./quickstart.md) Overwrites section; [contracts/channel-overwrites.md](./contracts/channel-overwrites.md).

### Tests for User Story 2

- [X] T017 [P] [US2] Add contract tests for Deny view private, Allow member over role Deny, everyone+role resolve, public Deny-view rejected, legacy allow migration in `backend/tests/contract/` (e.g. `channel_overwrites.rs`); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 2

- [X] T018 [US2] Implement overwrite resolution → `AccessDecision` in `backend/src/domain/permissions.rs` per [research.md](./research.md) R3–R4; keep owner full access
- [X] T019 [US2] Wire `channel_access` / list/view/write/speak gates through new resolver in `backend/src/api/authz.rs` (and call sites in `backend/src/api/messages.rs`, `backend/src/api/voice.rs`, channel list in `backend/src/db/channel.rs` / `backend/src/api/channels.rs` as needed)
- [X] T020 [US2] Extend GET/PUT ACL in `backend/src/api/channels.rs` for `effect` + `everyone`; reject public Deny-view (`400`)
- [X] T021 [US2] Update `frontend/src/components/ChannelAclPanel.tsx`: subject «Todos os membros», Allow/Deny controls; hide Deny-view on public channels
- [X] T022 [US2] Ensure `putChannelAcl` / `fetchChannelAcl` send/parse `effect` in `frontend/src/api/client.ts`

**Checkpoint**: Private Deny-view hides channel; public Deny-write works without hiding; member Allow beats role Deny.

---

## Phase 5: User Story 3 - Explicar por que o acesso foi negado (Priority: P2)

**Goal**: Denial messages include clear PT + `code`; admin inspect screen for member×channel uses same resolver.

**Independent Test**: [quickstart.md](./quickstart.md) Explain / inspect; [contracts/access-explain.md](./contracts/access-explain.md).

### Tests for User Story 3

- [X] T023 [P] [US3] Add contract tests for denial `code` on hierarchy/overwrite and `GET …/access/{account_id}` factor coherence in `backend/tests/contract/` (e.g. `access_explain.rs`); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 3

- [X] T024 [US3] Return PT messages + `code` from hierarchy/overwrite denial paths in `backend/src/api/{roles,mute,messages,authz}.rs` (and voice if applicable)
- [X] T025 [US3] Implement `GET /api/channels/{channel_id}/access/{account_id}` in `backend/src/api/channels.rs` + route in `backend/src/api/mod.rs` using shared `AccessDecision` factors; auth owner ∪ `can_manage_channels` ∪ `can_manage_roles`
- [X] T026 [US3] Add `fetchChannelAccess(accountId)` helper in `frontend/src/api/client.ts`
- [X] T027 [US3] Build inspect UI (panel or settings subview) showing view/level + factors — e.g. `frontend/src/components/AccessInspectPanel.tsx` wired from `ChannelAclPanel.tsx` and/or settings pages
- [X] T028 [P] [US3] Surface API `error` strings (and optional `code`) cleanly in `frontend/src/lib/apiError.ts` for kick/mute/send failures

**Checkpoint**: Errors explain cause; inspect matches live allow/deny.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, docs Speckit, regression.

- [X] T029 Confirm FR-008: no duplicate ad-hoc hierarchy/overwrite checks outside `permissions`/`authz` for new gates (spot-check `backend/src/api/`)
- [X] T030 Run `cargo test --test contract` and `cd frontend && ./node_modules/.bin/tsc --noEmit`; smoke [quickstart.md](./quickstart.md)
- [X] T031 [P] Update `docs/daily/2026-09-08.md` (`## Speckit implement` / `### [060-permissions-parity-phase1]`) and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **US1 / US2 / US3** (US2 needs resolver foundation from T005; US1 can proceed on hierarchy helpers once T002–T003/T005–T006 done; US3 needs US2 resolver + T006)
- **Practical order**: Foundational → US1 (MVP) → US2 → US3 → Polish
- **US3** depends on US2 overwrite factors for meaningful inspect; hierarchy denial codes can land with US1

### User Story Dependencies

- **US1**: Needs T002–T003, T005–T007 (position + helpers + error code + FE types)
- **US2**: Needs T002, T004–T007 (ACL shape + AccessDecision + FE types); shares T005 with US1
- **US3**: Needs US1/US2 denial paths + full `AccessDecision` factors from T018

### Parallel Opportunities

- After T002: T003 ∥ T004 ∥ T006 ∥ T007
- US1: T008 ∥ early FE types; T014–T016 after API positions
- US2: T017 ∥ FE panel once types ready; T021 after T020
- US3: T023 ∥ T026–T028 after inspect API sketched

### Parallel Example: Foundational

```bash
# After T002:
# T003 server_role position DB
# T004 channel_acl effect/everyone
# T006 ApiError code
# T007 FE types
```

### Parallel Example: US1

```bash
# T008 contract tests (can draft against contracts)
# T009–T013 backend hierarchy
# Then T014–T016 FE
```

### Parallel Example: US2

```bash
# T017 contracts ∥ T018 domain resolve
# T019–T020 API
# T021–T022 FE
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1–2  
2. Deliver US1 hierarchy gates + reorder  
3. Validate with hierarchy quickstart + T008  
4. Stop / demo before overwrites if needed  

### Incremental Delivery

1. Foundational → schema live  
2. US1 → safe moderation hierarchy  
3. US2 → GM-secret Deny / everyone layer  
4. US3 → explain + inspect  
5. Polish → contract suite green + daily/CHANGELOG  

### Suggested MVP Scope

**US1 only** (hierarchy) — highest security social risk from gap analysis.

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T007 | 6 |
| US1 Hierarchy | T008–T016 | 9 |
| US2 Overwrites | T017–T022 | 6 |
| US3 Explain | T023–T028 | 6 |
| Polish | T029–T031 | 3 |
| **Total** | | **31** |

| Story | Task IDs | Count |
|-------|----------|-------|
| US1 | T008–T016 | 9 |
| US2 | T017–T022 | 6 |
| US3 | T023–T028 | 6 |

**Format validation**: All tasks use `- [ ]`, sequential `Tnnn`, optional `[P]`, story `[USn]` on story phases only, and include concrete file paths.

**Independent tests**:
- US1: hierarchy quickstart + role-hierarchy contract  
- US2: overwrites quickstart + channel-overwrites contract  
- US3: explain/inspect quickstart + access-explain contract  

**Next**: `/speckit-implement`
