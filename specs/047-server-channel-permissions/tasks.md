---
description: "Task list for permissionamento de servidor e canais (047)"
---

# Tasks: Permissionamento de servidor e canais

**Input**: Design documents from `/specs/047-server-channel-permissions/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Plano pede `cargo test --test contract` + `tsc --noEmit` + quickstart. Incluir contract tests por história.

**Organization**: Setup → Foundational (migração + domínio + db + authz) → US1 kick → US6 público/privado → US2 texto → US3 voz → US4 papéis → US5 convite → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US6]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/migrations/`, `backend/tests/contract/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar feature dir e mapa de ficheiros actuais.

- [X] T001 Confirm `.specify/feature.json` → `specs/047-server-channel-permissions` and skim `backend/src/api/authz.rs`, `backend/src/domain/permissions.rs`, `backend/src/db/channel.rs`, `backend/src/db/membership.rs`, `frontend/src/shell/Sidebar.tsx` against [plan.md](./plan.md)

**Checkpoint**: Feature dir correcto; sem sobrecarregar `channel_role.co_director`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + resolução efectiva + camadas DB — **bloqueia** todas as stories.

**⚠️ CRITICAL**: Nenhuma user story até migração, domínio e helpers de authz estarem prontos.

- [X] T002 Add migration `backend/migrations/0012_server_channel_permissions.sql`: `channel.visibility`, `channel.visible_to_new_members`; tables `server_role`, `server_role_member`, `channel_acl`; backfill existing channels `public` + `visible_to_new_members=1` per [data-model.md](./data-model.md)
- [X] T003 [P] Add domain types/levels (`Visibility`, text/voice `Level`, ACL subject) in `backend/src/domain/channel_acl.rs` and/or extend `backend/src/domain/channel.rs` per [data-model.md](./data-model.md)
- [X] T004 [P] Add `ServerRole` domain in `backend/src/domain/server_role.rs` (`can_create_channels`) per [contracts/server-roles.md](./contracts/server-roles.md)
- [X] T005 Implement effective helpers `can_view_channel`, `can_write_text`, `can_listen_voice`, `can_speak_voice`, `can_create_channel`, `can_manage_channel_acl` in `backend/src/domain/permissions.rs` per [research.md](./research.md) R4–R5 and [contracts/effective-permission-api.md](./contracts/effective-permission-api.md) — owner bypass; do not use `channel_role`
- [X] T006 Implement DB CRUD for roles/ACL and `list_visible_for(account)` in `backend/src/db/server_role.rs`, `backend/src/db/channel_acl.rs`, update `backend/src/db/channel.rs` (+ wire `mod` in `backend/src/db/mod.rs`)
- [X] T007 Extend `backend/src/api/authz.rs` with `require_channel_view` / write / speak (404 when hidden to avoid leaking existence) per [contracts/effective-permission-api.md](./contracts/effective-permission-api.md)

**Checkpoint**: Compila; helpers + DB disponíveis; handlers ainda parcialmente no comportamento antigo.

---

## Phase 3: User Story 1 - Membership = acesso / kick (Priority: P1) 🎯 MVP

**Goal**: Membership continua a ser o gate do servidor; owner pode remover membro; removido perde acesso.

**Independent Test**: [quickstart.md](./quickstart.md) Scenario A.

### Tests for User Story 1

- [X] T008 [P] [US1] Contract tests: kick member removes access; cannot orphan sole owner — `backend/tests/contract/` (new `permissions_membership.rs` or extend servers) per [contracts/server-roles.md](./contracts/server-roles.md) kick section / SC-001

### Implementation for User Story 1

- [X] T009 [US1] Add `delete` membership in `backend/src/db/membership.rs` and `DELETE /api/servers/{id}/members/{account_id}` (owner-only; strip role memberships) in `backend/src/api/` (servers or new members handler) + route in `backend/src/api/mod.rs`
- [X] T010 [US1] FE: kick/remove control for owner in `frontend/src/components/MembersPanel.tsx` (or equivalent) + client helper in `frontend/src/api/client.ts`

**Checkpoint**: US1 / FR-001; SC-001.

---

## Phase 4: User Story 6 - Criar público/privado + ícone + lista filtrada (Priority: P1)

**Goal**: Create com `visibility`; privado seed ACL no criador; listagem só canais visíveis; ícone de privado; owner vê todos.

**Independent Test**: [quickstart.md](./quickstart.md) B + G.

### Tests for User Story 6

- [X] T011 [P] [US6] Contract tests: create private → other member list empty for that channel; owner sees it; public listed for members — `backend/tests/contract/` per [contracts/channel-visibility-acl.md](./contracts/channel-visibility-acl.md) / SC-007

### Implementation for User Story 6

- [X] T012 [US6] Extend create/list/get/patch channel APIs in `backend/src/api/channels.rs` (`visibility`, `visible_to_new_members`, `my_permission`; private seed ACL; filter list) per [contracts/channel-visibility-acl.md](./contracts/channel-visibility-acl.md)
- [X] T013 [US6] ACL GET/PUT routes for channel creators/owner in `backend/src/api/channels.rs` (or `channel_acl` API module) wired in `backend/src/api/mod.rs`
- [X] T014 [US6] Update `frontend/src/api/client.ts` Channel types + create/list/patch/acl helpers
- [X] T015 [US6] Create-channel dialog: público|privado in `frontend/src/shell/Sidebar.tsx`; show private lock icon via new `frontend/src/components/icons/` glyph on private rows (FR-017)
- [X] T016 [US6] Channel ACL settings UI (minimal panel) for creator/owner — new component under `frontend/src/components/` used from Sidebar or channel header

**Checkpoint**: SC-007/008; FR-014–018; FR-019 owner bypass.

---

## Phase 5: User Story 2 - Texto leitura vs escrita (Priority: P1)

**Goal**: Enforce read vs write on messages; composer reflects `my_permission`.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Tests for User Story 2

- [X] T017 [P] [US2] Contract tests: read-only POST message → 403; write succeeds; no-view → 404 — `backend/tests/contract/` per [contracts/effective-permission-api.md](./contracts/effective-permission-api.md) / SC-002

### Implementation for User Story 2

- [X] T018 [US2] Gate GET/POST messages with view/write in `backend/src/api/messages.rs` (PT error on 403)
- [X] T019 [US2] Disable/hide composer when `my_permission === 'read'` in `frontend/src/pages/Channel.tsx` (or ChannelRoute message UI)

**Checkpoint**: SC-002; FR-004/009.

---

## Phase 6: User Story 3 - Voz escuta vs fala (+ câmera) (Priority: P1)

**Goal**: Listen-only join without publish; speak required for mic/cam.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Tests for User Story 3

- [X] T020 [P] [US3] Contract tests: listen-only rejected on publish/mic-cam enable paths; speak allowed — `backend/tests/contract/` (voice) per [contracts/effective-permission-api.md](./contracts/effective-permission-api.md) / SC-003

### Implementation for User Story 3

- [X] T021 [US3] Enforce listen/speak on join and mic/cam toggles in `backend/src/api/voice.rs` (+ related) per FR-005
- [X] T022 [US3] Disable mic/cam UI when `my_permission === 'listen'` in `frontend/src/pages/VoiceChannel.tsx` and/or `frontend/src/shell/UserPanel.tsx` call controls

**Checkpoint**: SC-003; FR-005/009.

---

## Phase 7: User Story 4 - Papéis + pode criar canais (Priority: P2)

**Goal**: CRUD papéis; assign members; `can_create_channels` gates create.

**Independent Test**: [quickstart.md](./quickstart.md) E.

### Tests for User Story 4

- [X] T023 [P] [US4] Contract tests: role with `can_create_channels` may create; without → 403; ACL via role grants view — `backend/tests/contract/` per [contracts/server-roles.md](./contracts/server-roles.md) / SC-009

### Implementation for User Story 4

- [X] T024 [US4] Implement roles API in `backend/src/api/roles.rs` (GET/POST/PATCH/DELETE + members PUT) and register routes in `backend/src/api/mod.rs`
- [X] T025 [US4] Gate create channel with `can_create_channel` (owner | role flag) in `backend/src/api/channels.rs` (relax owner-only to FR-020)
- [X] T026 [US4] FE: roles management UI + client methods in `frontend/src/api/client.ts` and `frontend/src/components/` (e.g. RolesPanel); hide create in `Sidebar.tsx` when unauthorized
- [X] T027 [US4] Allow ACL subjects of type `role` in ACL UI (`frontend/src/components/`) and ensure effective permission uses role grants in `backend/src/domain/permissions.rs`

**Checkpoint**: FR-007/013/020; SC-004/009.

---

## Phase 8: User Story 5 - Convite + visível a novos (Priority: P2)

**Goal**: After invite, only public∩visible_to_new appear; private never auto; toggle flag on public only.

**Independent Test**: [quickstart.md](./quickstart.md) F.

### Tests for User Story 5

- [X] T028 [P] [US5] Contract tests: accept invite → sees flagged public only; private absent; public with flag off absent until ACL — `backend/tests/contract/` per [contracts/channel-visibility-acl.md](./contracts/channel-visibility-acl.md) / SC-006

### Implementation for User Story 5

- [X] T029 [US5] Ensure list/view rules for `visible_to_new_members` match [research.md](./research.md) R5 in `backend/src/domain/permissions.rs` + `backend/src/db/channel.rs` (invite accept itself may stay membership-only)
- [X] T030 [US5] UI to toggle `visible_to_new_members` on **public** channels only (create/settings) in `frontend/src/shell/Sidebar.tsx` / channel settings; reject on private in `backend/src/api/channels.rs` (FR-012/021)

**Checkpoint**: SC-006; FR-011/012/021.

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Suite completa, tipagem, docs.

- [X] T031 Register any new contract modules in `backend/tests/contract/mod.rs`; run `cd backend && cargo test --test contract`
- [X] T032 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix FE regressions
- [X] T033 Execute [quickstart.md](./quickstart.md) A–G; note skips
- [X] T034 [P] Update `CHANGELOG.md` `[Unreleased]` and `docs/daily/yyyy-mm-dd.md` for `047-server-channel-permissions`
- [X] T035 [P] Update backlog G4 status note in `docs/backlog-prototype-v2-gaps.md` if appropriate

**Checkpoint**: Feature ready to demo.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001)** → none
- **Foundational (T002–T007)** → after Setup; **blocks all stories**
- **US1 (T008–T010)** → after Foundational (kick)
- **US6 (T011–T016)** → after Foundational (visibility); can follow or parallel US1 after T007
- **US2 (T017–T019)** → after US6 (ACL + my_permission on channels)
- **US3 (T020–T022)** → after US6; parallelizable with US2
- **US4 (T023–T027)** → after US6 (create gate + role ACL)
- **US5 (T028–T030)** → after US6 visibility rules
- **Polish** → after US1–US6

### User story dependencies

- **US1** — membership kick (MVP server access)
- **US6** — visibility core (MVP channel privacy)
- **US2 / US3** — level enforcement on top of US6
- **US4** — roles scale ACL + create
- **US5** — invite onboarding flags

### Parallel opportunities

- T003 ∥ T004
- T008 ∥ T011 (different test files) after Foundational
- US2 ∥ US3 after US6
- T034 ∥ T035

### Parallel example: after Foundational

```text
T008+T009 US1 kick API
T011+T012 US6 create/list visibility
```

### Implementation strategy

1. **MVP**: T001–T016 (kick + public/private list/icon/ACL seed)
2. **Enforce levels**: US2 + US3
3. **Scale**: US4 roles + US5 invite flags
4. **Polish**: tests green + changelog/daily

### Notes

- Do **not** overload `channel_role` / `co_director`.
- Prefer **404** over 403 when channel is hidden (no existence leak).
- Owner always full bypass (FR-019).
- Public: no per-member hide — use private + ACL (FR-022).

---

## Phase 10: Convergence

**Purpose**: Close gaps vs amended spec (tarde): página dedicada de capacidades de **papel**, catálogo alargado, públicos sempre visíveis a membros, enforce FE/BE.

- [X] T036 CRITICAL: Replace modal-primary `RolesPanel` (`Dialog`) with a dedicated role-permissions **page** in the shell main pane (`empty-server-pane` / main) in `frontend/src/` (new page/route or main swap from `AppShell`/`Sidebar`); keep role list entry that opens this page — per FR-001, US1/AC1, SC-001 (contradicts)
- [X] T037 Remember the prior channel/route when opening the page and restore it after successful Save in the role-permissions page flow — per FR-002, SC-002 (missing)
- [X] T038 Extend `server_role` schema/domain/API beyond `can_create_channels` with the required capability flags (view channel, manage channels, manage roles, create invites, send messages, delete others' messages, attach files, remove members, voice listen, voice speak) via migration + `backend/src/domain/server_role.rs` + `backend/src/db/server_role.rs` + `backend/src/api/roles.rs` — per FR-004–007, FR-012–015 (missing)
- [X] T039 Build the role-permissions page UI: sections Geral/Texto/Voz with **toggle + title + short description** per capability; explicit Save (no silent auto-patch as sole flow); discard on leave without save — per FR-003, FR-010, SC-003 (missing/partial)
- [X] T040 Enforce new role capabilities in backend (and matching FE gates): invites (`backend/src/api/invites.rs`), manage channels/roles, `can_delete_text_message` role path (`backend/src/domain/permissions.rs` / `messages.rs`), attachments, kick, voice listen/speak — owner bypass retained — per FR-009, FR-013, FR-014, SC-005 (missing)
- [X] T041 Fix public-channel view so **all members** always see public channels; stop gating public view on `visible_to_new_members` alone in `backend/src/domain/permissions.rs` (+ list filter); keep `visible_to_new_members` for **invite/new-member** onboarding only — per FR-008, US3 (contradicts)
- [X] T042 Add/extend contract tests for expanded role flags, public visibility, delete-others-via-role, and invite create with role flag in `backend/tests/contract/`; run `cargo test --test contract` + `tsc --noEmit` — per SC-004, SC-005, SC-006 (missing)
