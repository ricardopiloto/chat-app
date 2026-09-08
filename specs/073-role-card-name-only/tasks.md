---
description: "Task list for Cabeçalho do papel — só o nome (073)"
---

# Tasks: Cabeçalho do papel — só o nome

**Input**: Design documents from `/specs/073-role-card-name-only/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–B + `tsc --noEmit`. No formal TDD requested.

**Organization**: Setup → US1 heading cleanup → US2 action regression check → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/RolesManagePage.tsx`, optionally `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current heading markup.

- [x] T001 Confirm `.specify/feature.json` → `specs/073-role-card-name-only` and locate `.permission-card-heading` (name + posição + sistema) in `frontend/src/pages/RolesManagePage.tsx` against [contracts/role-card-heading.md](./contracts/role-card-heading.md)

**Checkpoint**: Ready to edit heading only.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None beyond setup — no shared helpers/API required.

**⚠️ CRITICAL**: N/A — proceed to US1 after T001.

---

## Phase 3: User Story 1 - Ver só o nome no cartão (Priority: P1) 🎯 MVP

**Goal**: `.permission-card-heading` shows only the role name.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [x] T002 [US1] In `frontend/src/pages/RolesManagePage.tsx`, remove the muted «posição {role.position}» span and the «(sistema)» `Show` from `.permission-card-heading`, leaving only the role name (e.g. `<strong>{role.name}</strong>`) per [contracts/role-card-heading.md](./contracts/role-card-heading.md)
- [x] T003 [P] [US1] If heading layout looks broken after removal, adjust `.permission-card-heading` only in `frontend/src/styles/mesa-theme.css`; otherwise skip

**Checkpoint**: Headings show name only for system and custom roles.

---

## Phase 4: User Story 2 - Acções do cartão intactas (Priority: P2)

**Goal**: Reorder / Permissões / Apagar still work; `is_system` still gates delete.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [x] T004 [US2] Verify in `frontend/src/pages/RolesManagePage.tsx` that ↑/↓, Permissões, and Apagar (`!role.is_system`) are unchanged and still outside the heading
- [x] T005 [US2] Spot-check that `RolePermissionsPage.tsx` / `MembersManagePage.tsx` were **not** altered for this feature

**Checkpoint**: Actions behave as before; scope not leaked.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation and project docs.

- [x] T006 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`
- [x] T007 Walk [quickstart.md](./quickstart.md) A–B manually
- [x] T008 Update `docs/daily/2026-09-08.md` with Speckit implement subsection for 073
- [x] T009 Update `CHANGELOG.md` `[Unreleased]` for 073

**Checkpoint**: Feature ready for review.

---

## Dependencies & Execution Order

```text
T001 → T002 → T003 (optional) → T004–T005 → T006–T009
```

### Parallel Opportunities

- T003 only if CSS needed after T002
- T008 ∥ T009 after code done

### Suggested MVP

**T001–T002** — heading name-only; then US2 verify + polish.

---

## Implementation Strategy

1. Confirm markup.
2. Strip posição / sistema from heading.
3. Confirm actions unchanged.
4. tsc, quickstart, daily, CHANGELOG.

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | — | 0 |
| US1 | T002–T003 | 2 |
| US2 | T004–T005 | 2 |
| Polish | T006–T009 | 4 |
| **Total** | | **9** |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.
