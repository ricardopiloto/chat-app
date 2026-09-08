---
description: "Task list for Botão de convite respeita permissão do papel"
---

# Tasks: Botão de convite respeita permissão do papel

**Input**: Design documents from `/specs/050-invite-permission-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/invite-button-visibility.md](./contracts/invite-button-visibility.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: [quickstart.md](./quickstart.md) + `cd frontend && ./node_modules/.bin/tsc --noEmit`. Optional backend contract smoke if gaps found.

**Organization**: Setup → Foundational (contrato + baseline Sidebar) → US1 botão com permissão → US2 sem permissão / dono → US3 refresh → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/Sidebar.tsx`, `frontend/src/api/client.ts`, `backend/src/api/invites.rs`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar alvo Speckit e baseline dono-only no header.

- [X] T001 Confirm `.specify/feature.json` points at `specs/050-invite-permission-ui` and skim owner-gated invite + roles buttons and `canCreateChannels` pattern in `frontend/src/shell/Sidebar.tsx`

**Checkpoint**: Baseline understood; feature dir correcto.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contrato de visibilidade + types — **bloqueia** US1–US3.

**⚠️ CRITICAL**: Não deixar Convite e Gerir papéis no mesmo `Show when={isOwner()}`.

- [X] T002 Re-read [contracts/invite-button-visibility.md](./contracts/invite-button-visibility.md) + [research.md](./research.md) R1–R2; verify `RoleCapabilities.can_create_invites` exists on `ServerRole` in `frontend/src/api/client.ts`
- [X] T003 [P] Spot-check `backend/src/api/invites.rs` still allows owner **or** aggregated `can_create_invites` for create (verify-only; change only if broken)

**Checkpoint**: Types + API gate confirmed; ready to split Sidebar chrome.

---

## Phase 3: User Story 1 - Membro com «Criar convites» vê o botão (Priority: P1) 🎯 MVP

**Goal**: Membro com capacidade vê Convite e completa o fluxo; Gerir papéis continua só dono.

**Independent Test**: [quickstart.md](./quickstart.md) A (+ D se multi-papel).

### Implementation for User Story 1

- [X] T004 [US1] Add `canCreateInvites()` in `frontend/src/shell/Sidebar.tsx` mirroring `canCreateChannels` but using `capabilities.can_create_invites` + `member_ids` + `isOwner()` per R1 / FR-001
- [X] T005 [US1] Split sidebar header chrome in `frontend/src/shell/Sidebar.tsx`: Gerir papéis under `isOwner()` only; Convite under `canCreateInvites()` per R2 / FR-005
- [X] T006 [US1] Confirm `createInvite` + invite dialog path in `frontend/src/shell/Sidebar.tsx` still works when the new Show mounts (FR-003); no dialog redesign

**Checkpoint**: Non-owner with cap sees invite and can create; no roles gear.

---

## Phase 4: User Story 2 - Sem permissão: sem botão (Priority: P1)

**Goal**: Sem capacidade → sem botão; dono sempre vê.

**Independent Test**: [quickstart.md](./quickstart.md) B + C.

### Implementation for User Story 2

- [X] T007 [US2] Verify `canCreateInvites()` is false for members without the cap so Convite stays unmounted in `frontend/src/shell/Sidebar.tsx` (FR-002 / SC-002)
- [X] T008 [US2] Verify owner still sees both Convite and Gerir papéis via `isOwner()` / `canCreateInvites()` in `frontend/src/shell/Sidebar.tsx` (SC-004)

**Checkpoint**: Matrix owner / with-cap / without-cap matches contract.

---

## Phase 5: User Story 3 - Perda da permissão actualiza a UI (Priority: P2)

**Goal**: Após refresco de papéis, o botão desaparece se a capacidade/atribuição for removida.

**Independent Test**: [quickstart.md](./quickstart.md) B after revoke.

### Implementation for User Story 3

- [X] T009 [US3] Confirm RolesPanel / role patch paths already call `refetchRoles` (or equivalent) used by Sidebar’s roles resource in `frontend/src/shell/Sidebar.tsx` + `frontend/src/components/RolesPanel.tsx`; wire refetch if missing (FR-006 / R4)

**Checkpoint**: Cap removal reflects after roles refresh without hard reload hacks.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Types, optional contract, docs de entrega.

- [X] T010 [P] Optionally add/extend contract assertion that non-owner with `can_create_invites` can `POST /api/servers/{id}/invites` in `backend/tests/contract/` if not already covered
- [X] T011 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and smoke [quickstart.md](./quickstart.md) A–D
- [X] T012 After successful implement: append `docs/daily/yyyy-mm-dd.md` Speckit section and `[Unreleased]` in `CHANGELOG.md` for `050-invite-permission-ui`

**Checkpoint**: Validação + docs.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None
- **Foundational (Phase 2)**: Depends on Setup
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After T004–T005 (same predicado)
- **US3 (Phase 5)**: After US1 (refetch path)
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1**: Introduce predicado + split Show
- **US2**: Validates negative/owner cases of same predicado
- **US3**: Ensures roles refetch updates visibility

### Parallel Opportunities

- T002 ‖ T003 (client types vs backend verify)
- T007 ‖ T008 after T005 (matrix checks)
- T010 ‖ T011 (contract vs tsc/smoke)

---

## Parallel Example: After foundational

```bash
Task: "T004 [US1] canCreateInvites() in Sidebar.tsx"
Task: "T003 [P] verify invites.rs gate"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1–2
2. Phase 3 US1 (predicado + split chrome)
3. **STOP**: quickstart A

### Incremental Delivery

1. + US2 → B/C matrix
2. + US3 → refetch
3. + Polish → tsc / daily / CHANGELOG

---

## Notes

- Prefer minimal Sidebar edit; no invite dialog redesign
- Do not show Gerir papéis for invite-only members
- Format: all tasks use `- [ ]`, Task ID, optional `[P]` / `[Story]`, and file paths
