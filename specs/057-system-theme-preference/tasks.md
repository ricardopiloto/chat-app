---
description: "Task list for tema alinhado ao sistema com override guardado (057)"
---

# Tasks: Tema alinhado ao sistema com override guardado

**Input**: Design documents from `/specs/057-system-theme-preference/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/theme-preference.md](./contracts/theme-preference.md), [contracts/theme-topbar-control.md](./contracts/theme-topbar-control.md), [quickstart.md](./quickstart.md)

**Tests**: Quickstart visual + `tsc --noEmit` (sem TDD formal).

**Organization**: Setup → Foundational (`theme.ts` preference API + listeners) → US1 follow system / auth apply → US2 cycle + persist → US3 explicit system + cross-tab polish → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/theme/`, `frontend/src/shell/`, `frontend/src/components/`, `frontend/index.html`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar feature dir e baseline actual (toggle binário + hardcodes).

- [x] T001 Confirm `.specify/feature.json` → `specs/057-system-theme-preference` and skim `theme.ts`, `TopBar.tsx`, `AuthShell.tsx`, `AppShell.tsx`, `App.tsx`, `index.html` against [plan.md](./plan.md) / [research.md](./research.md)

**Checkpoint**: Baseline entendido (binário dark↔light; Auth/AppShell `data-theme="dark"`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API de preferência + resolução + listeners — **bloqueia** US1–US3.

**⚠️ CRITICAL**: Sem `ThemePreference` / resolve / write correctos, login e TopBar não cumprem FR-001.

- [x] T002 Extend `frontend/src/theme/theme.ts` with `ThemePreference` (`system` \| `light` \| `dark`), `readThemePreference()`, `writeThemePreference()`, and `resolveEffectiveTheme()` / update `resolveTheme()` per [data-model.md](./data-model.md) and [contracts/theme-preference.md](./contracts/theme-preference.md) (legacy light/dark preserved; invalid → absent; load must not write)
- [x] T003 Add `applyTheme` + `bootTheme` using effective theme only; keep writing `data-theme` on `document.documentElement` and `.app` in `frontend/src/theme/theme.ts`
- [x] T004 Implement `startThemeListeners()` (or equivalent) in `frontend/src/theme/theme.ts`: `matchMedia` change when preference is system/absent; `storage` on `mesa.theme`; dispatch same-tab `mesa:theme-preference` (or similar) after local writes per [research.md](./research.md) R3–R4

**Checkpoint**: Module resolves/persists preference; listeners ready to wire from App.

---

## Phase 3: User Story 1 - Login e app seguem o tema do navegador (Priority: P1) 🎯 MVP

**Goal**: Sem override, login + app seguem o SO; sem seletor na auth; FOUC minimizado.

**Independent Test**: [quickstart.md](./quickstart.md) A (+ E parcialmente).

### Implementation for User Story 1

- [x] T005 [US1] Remove hardcoded `data-theme="dark"` from `frontend/src/components/AuthShell.tsx`; boot/apply resolved effective theme on auth mount
- [x] T006 [US1] Remove hardcoded `data-theme="dark"` from `frontend/src/shell/AppShell.tsx`; keep `bootTheme` with resolved effective theme
- [x] T007 [US1] Ensure `frontend/src/App.tsx` calls `bootTheme` + starts theme listeners for both auth and authenticated trees
- [x] T008 [US1] Add early inline theme boot script in `frontend/index.html` (minimal duplicate of resolve rules) to set `html[data-theme]` before paint per [research.md](./research.md) R2

**Checkpoint**: US1 / SC-001 / SC-005 — login + app match OS when key absent.

---

## Phase 4: User Story 2 - Escolher e guardar tema diferente do sistema (Priority: P1)

**Goal**: Topbar cicla e persiste `light`/`dark`; login reflecte override sem controlo.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [x] T009 [P] [US2] Add system-preference icon (e.g. `frontend/src/components/icons/IconSystem.tsx`) or document reuse of existing glyph for «sistema» state
- [x] T010 [US2] Replace binary toggle in `frontend/src/shell/TopBar.tsx` with cycle `system → light → dark → system` via `writeThemePreference` + `applyTheme`; track **preference** signal (absent ≡ system for display) per [contracts/theme-topbar-control.md](./contracts/theme-topbar-control.md)
- [x] T011 [US2] Update TopBar icon + `aria-label`/`title` from **preference** («Tema: sistema» / «Tema claro» / «Tema escuro»), not only effective theme
- [x] T012 [US2] Confirm auth surfaces still have **no** theme control while applying stored override on load (`AuthShell.tsx` / auth pages)

**Checkpoint**: US2 / SC-002 — override persists across reload + login.

---

## Phase 5: User Story 3 - Voltar a seguir o sistema + sync (Priority: P2)

**Goal**: Ciclar até `system` grava `system`; SO e outros tabs actualizam.

**Independent Test**: [quickstart.md](./quickstart.md) C–D.

### Implementation for User Story 3

- [x] T013 [US3] Ensure cycling to sistema persists `mesa.theme=system` (not key deletion) and effective theme follows OS in `theme.ts` + TopBar
- [x] T014 [US3] Wire TopBar (and any boot path) to refresh preference UI on `mesa:theme-preference` / `storage` so other tabs update icons/labels within ~2s (FR-009 / SC-006)
- [x] T015 [US3] Verify `matchMedia` listener updates effective theme when preference is `system` or absent without rewriting preference (`theme.ts` + manual check)

**Checkpoint**: US3 / SC-003 / SC-004 / SC-006.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Tipagem, quickstart, changelog, daily.

- [x] T016 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T017 Execute [quickstart.md](./quickstart.md) A–E; note skips
- [x] T018 [P] Update `CHANGELOG.md` `[Unreleased]` for `057-system-theme-preference`
- [x] T019 [P] Update `docs/daily/yyyy-mm-dd.md` Speckit implement section for 057

**Checkpoint**: Feature ready to demo.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001)** → none
- **Foundational (T002–T004)** → after Setup; **blocks all stories**
- **US1 (T005–T008)** → after Foundational (MVP follow-system + auth)
- **US2 (T009–T012)** → after Foundational; benefits from US1 boot fixes
- **US3 (T013–T015)** → after US2 cycle exists
- **Polish** → after US1–US3

### User story dependencies

- **US1** — follow system + remove hardcodes (MVP)
- **US2** — cycle + persist overrides (needs theme API)
- **US3** — explicit `system` + listeners UX (needs cycle)

### Parallel opportunities

- T009 ∥ T010 prep after T004
- T005 ∥ T006 after T003
- T018 ∥ T019

### Parallel example: after Foundational

```text
T005 AuthShell apply
T006 AppShell apply
T008 index.html early script
```

### Implementation strategy

1. **MVP**: T001–T008 (follow system everywhere; no FOUC hard dark)
2. **Override**: T009–T012 (TopBar cycle)
3. **System + sync**: T013–T019

### Notes

- Do not add theme control on login.
- Do not write preference on mere load when following OS.
- Preserve existing `light`/`dark` keys as overrides.
- No backend changes.
