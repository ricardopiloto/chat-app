---
description: "Task list for Versão do produto (076-app-version-label)"
---

# Tasks: Versão do produto (público no rodapé; autenticado sob o nome)

**Input**: Design documents from `/specs/076-app-version-label/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–C + `tsc --noEmit`. No formal TDD in plan.

**Organization**: Setup → Foundational (version source + helper) → US1 Auth footer → US2 TopBar → US3 polish hierarchy/a11y → Polish docs.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/package.json`, `backend/Cargo.toml`, `frontend/vite.config.ts`, `frontend/src/lib/appVersion.ts`, `frontend/src/components/AuthShell.tsx`, `frontend/src/shell/TopBar.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and brand touch points.

- [x] T001 Confirm `.specify/feature.json` → `specs/076-app-version-label` and skim brand markup in `frontend/src/components/AuthShell.tsx` (`.auth-brand-footer`) and `frontend/src/shell/TopBar.tsx` (`.topbar-brand` / `.topbar-name`) against [contracts/app-version-display.md](./contracts/app-version-display.md)

**Checkpoint**: Understood public footer vs TopBar under-name placements.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Product version aligned + build-time inject + shared helper — **blocks** US1–US2.

**⚠️ CRITICAL**: Complete before story UI wiring.

- [x] T002 Set `version` in `frontend/package.json` to the product release in CHANGELOG (currently `0.5.0`) per [research.md](./research.md) R1
- [x] T003 [P] Set `version` in `backend/Cargo.toml` to the same product release (`0.5.0`) per CHANGELOG alignment policy
- [x] T004 Wire Vite inject from `frontend/package.json` version in `frontend/vite.config.ts` (define / env) per [research.md](./research.md) R2
- [x] T005 Create `frontend/src/lib/appVersion.ts` exporting `APP_VERSION` (display `X.Y.Z`, no required `v` prefix) per [data-model.md](./data-model.md)

**Checkpoint**: `APP_VERSION` importable and matches package.json.

---

## Phase 3: User Story 1 - Versão na área não autenticada (Priority: P1) 🎯 MVP

**Goal**: Small version in AuthShell brand **footer** (login + invite); not under hero name.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [x] T006 [US1] Render `APP_VERSION` in `.auth-brand-footer` in `frontend/src/components/AuthShell.tsx` (after instance note; not under `.auth-brand-name`) per [contracts/app-version-display.md](./contracts/app-version-display.md)
- [x] T007 [US1] Add muted small styles for auth footer version (e.g. `.auth-app-version` / `.app-version`) in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Login/invite show version in brand footer only.

---

## Phase 4: User Story 2 - Versão na área autenticada (Priority: P1)

**Goal**: Same `APP_VERSION` immediately under TopBar «Mesa».

**Independent Test**: [quickstart.md](./quickstart.md) B–C.

### Implementation for User Story 2

- [x] T008 [US2] Restructure `.topbar-brand` text into a column (name + version under name) in `frontend/src/shell/TopBar.tsx` using `APP_VERSION` per contract
- [x] T009 [US2] Style TopBar version (smaller than `.topbar-name`, muted) in `frontend/src/styles/mesa-theme.css`; keep brand row with logo intact

**Checkpoint**: Authenticated TopBar shows version under name; string matches public.

---

## Phase 5: User Story 3 - Discrição e acessibilidade (Priority: P2)

**Goal**: Secondary hierarchy; brand name remains primary for assistive tech.

**Independent Test**: Visual + aria review (spec US3).

### Implementation for User Story 3

- [x] T010 [US3] Ensure TopBar/`AuthShell` brand labelling keeps «Mesa» as primary name; version as secondary (e.g. `aria-label` / not merging into product name) in `frontend/src/shell/TopBar.tsx` and `frontend/src/components/AuthShell.tsx`
- [x] T011 [P] [US3] Confirm light/dark contrast for `.app-version` / auth+topbar version classes in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Name dominant; version discreet and readable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and project docs.

- [x] T012 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`
- [x] T013 Walk [quickstart.md](./quickstart.md) A–C manually
- [x] T014 Update `docs/daily/2026-09-08.md` with Speckit implement subsection for 076
- [x] T015 Update `CHANGELOG.md` `[Unreleased]` for 076

**Checkpoint**: Feature ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T005)** → stories
- **US1** and **US2** both need T005; can proceed in parallel after foundation if different files (AuthShell vs TopBar); CSS shared — serialize style edits or batch T007+T009
- **US3** after US1–US2 markup exists
- **Polish** last

### User Story Dependencies

```text
Foundation → US1 (auth footer) ─┐
           → US2 (TopBar)     ─┼→ US3 (a11y/hierarchy) → Polish
```

### Parallel Opportunities

- T002 ∥ T003 (manifest versions)
- T006 ∥ T008 after T005 (AuthShell vs TopBar)
- T010–T011 after both surfaces exist

### Suggested MVP

**T001–T007 (Foundation + US1)** — version visible on public auth chrome; then US2 for authenticated parity.

---

## Implementation Strategy

1. Align package versions + Vite inject + `appVersion.ts`.
2. Auth footer (US1).
3. TopBar under-name (US2).
4. Hierarchy / a11y polish (US3).
5. tsc, quickstart, daily, CHANGELOG.

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T005 | 4 |
| US1 | T006–T007 | 2 |
| US2 | T008–T009 | 2 |
| US3 | T010–T011 | 2 |
| Polish | T012–T015 | 4 |
| **Total** | | **15** |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.
