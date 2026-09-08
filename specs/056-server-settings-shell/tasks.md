---
description: "Task list for Shell de configurações do servidor"
---

# Tasks: Shell de configurações do servidor

**Input**: Design documents from `/specs/056-server-settings-shell/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. No new backend contract tests (FE shell only).

**Organization**: Setup → Foundational (access helper, routes, settings mode detection) → US1 gear/name entry + placeholder → US2 grouped nav + pages → US3 TopBar X → Polish (rail cleanup, redirects, docs).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/App.tsx`, `frontend/src/shell/{AppShell,Sidebar,TopBar,ServerRail,SettingsNav}.tsx`, `frontend/src/pages/{SettingsHomePage,RolesManagePage,ServerImagePage,ServerDeletePage,MembersManagePage,RolePermissionsPage}.tsx`, `frontend/src/lib/settingsAccess.ts`, `frontend/src/components/RolesPanel.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature dir and baseline chrome.

- [x] T001 Confirm `.specify/feature.json` points at `specs/056-server-settings-shell` and skim server-name dropdown + rail context menu in `frontend/src/shell/Sidebar.tsx`, routes in `frontend/src/App.tsx`, and `RolesPanel` dialog usage

**Checkpoint**: Baseline understood.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Access helper, route prefix, settings-mode detection — **blocks** US1–US3.

**⚠️ CRITICAL**: Without `/settings` routes + mode detection, gear/nav/X cannot work.

- [x] T002 Create `visibleSettingsItems` / gear-gate helpers in `frontend/src/lib/settingsAccess.ts` per [data-model.md](./data-model.md) and [contracts/settings-nav-ia.md](./contracts/settings-nav-ia.md) (owner ∨ `can_manage_roles` for members/roles; owner-only image/delete)
- [x] T003 Add settings route tree + legacy redirects in `frontend/src/App.tsx` per [contracts/settings-routes.md](./contracts/settings-routes.md) (`/servers/:serverId/settings`, `/members`, `/roles`, `/roles/:roleId/permissions`, `/image`, `/delete`; redirect old `/members` and `/roles/:roleId/permissions`)
- [x] T004 Detect `settingsMode` from path in `frontend/src/shell/AppShell.tsx` (and pass serverId / exit handler props to Sidebar + TopBar as needed)
- [x] T005 [P] Add placeholder page `frontend/src/pages/SettingsHomePage.tsx` («Escolha uma definição» or equivalent) for `/settings` home
- [x] T006 [P] Add base styles for settings chrome/nav/placeholder in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Navigating to `/servers/:id/settings` renders home page; AppShell knows settings mode.

---

## Phase 3: User Story 1 - Entrar pelas engrenagem / nome (Priority: P1) 🎯 MVP

**Goal**: Gear + name open settings mode with settings sidebar shell and placeholder main; remove dropdown.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [x] T007 [US1] Create `frontend/src/shell/SettingsNav.tsx` grouped nav skeleton (can start with empty/minimal items) and render it from `frontend/src/shell/Sidebar.tsx` when `settingsMode` instead of Texto/Voz channel lists
- [x] T008 [US1] Replace server-name dropdown with **gear** button (+ clickable name) in `frontend/src/shell/Sidebar.tsx` that navigates to `/servers/:serverId/settings` when `settingsAccess` allows ≥1 item; hide both when none; remove `serverMenuOpen` Membros/Perfis menu
- [x] T009 [US1] Ensure entering settings does not leave chat as main content (router shows `SettingsHomePage` / settings outlet) wired via `frontend/src/App.tsx` + `frontend/src/shell/AppShell.tsx`

**Checkpoint**: Gear/name → settings home + settings sidebar; no legacy dropdown.

---

## Phase 4: User Story 2 - Submenus agrupados + páginas (Priority: P1)

**Goal**: Full IA (Membros, Perfis page, Imagem, Apagar) with permission filtering.

**Independent Test**: [quickstart.md](./quickstart.md) B + D.

### Implementation for User Story 2

- [x] T010 [US2] Complete `frontend/src/shell/SettingsNav.tsx` with groups Pessoas / Funções / Servidor and filtered items linking to settings child routes per [contracts/settings-nav-ia.md](./contracts/settings-nav-ia.md); highlight active path
- [x] T011 [US2] Point **Membros** at existing manage UI under `/settings/members` and adjust `frontend/src/pages/MembersManagePage.tsx` so exit relies on settings chrome (simplify/remove channel `returnTo` as sole exit)
- [x] T012 [US2] Create `frontend/src/pages/RolesManagePage.tsx` from `frontend/src/components/RolesPanel.tsx` body (list/create/delete + link to permissions) **without** Dialog as primary entry; route `/settings/roles`; stop opening RolesPanel modal from Sidebar
- [x] T013 [US2] Move/adapt `frontend/src/pages/RolePermissionsPage.tsx` under `/settings/roles/:roleId/permissions`; in-page back goes to roles list (not channel chat)
- [x] T014 [P] [US2] Create `frontend/src/pages/ServerImagePage.tsx` (owner) reusing put/delete server image flow from Sidebar/`ImageUploadDialog` patterns
- [x] T015 [P] [US2] Create `frontend/src/pages/ServerDeletePage.tsx` (owner) confirm + `deleteServer`; on success leave server/settings coherently
- [x] T016 [US2] Remove Imagem do servidor / Apagar servidor from rail context menu in `frontend/src/shell/Sidebar.tsx` (and `ServerRail` handlers if applicable) per FR-011

**Checkpoint**: All four item types work in settings; non-owner cannot use Servidor group; Perfis is a page.

---

## Phase 5: User Story 3 - Sair com X na topbar (Priority: P1)

**Goal**: Icon-only X closes settings and restores channel view.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 3

- [x] T017 [US3] Add close (X) control to `frontend/src/shell/TopBar.tsx` when `settingsMode` — icon only, `aria-label` (no «Sair» text label) per [contracts/settings-shell-chrome.md](./contracts/settings-shell-chrome.md)
- [x] T018 [US3] Wire X in `frontend/src/shell/AppShell.tsx` to navigate to last channel for server (`channelHref` / last-channel prefs) or `/servers/:serverId` fallback; restore channel sidebar
- [x] T019 [US3] Style topbar X in `frontend/src/styles/mesa-theme.css`; verify X hidden outside settings mode

**Checkpoint**: X exits settings predictably; re-open gear works.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Redirects, a11y, docs Speckit.

- [x] T020 Verify legacy redirects and deep-link refresh keep settings chrome ([quickstart.md](./quickstart.md) E) in `frontend/src/App.tsx`
- [x] T021 Ensure user-panel account gear unchanged in `frontend/src/shell/UserPanel.tsx` (FR-010); narrow drawer still usable in settings mode
- [x] T022 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and smoke [quickstart.md](./quickstart.md) A–E
- [x] T023 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: Immediate
- **Foundational**: After Setup — **BLOCKS** all stories
- **US1**: After Foundational — MVP entry + empty settings chrome
- **US2**: After US1 SettingsNav shell (needs mode + sidebar swap)
- **US3**: Can start after Foundational mode detection; ideally after US1 so exit is testable end-to-end
- **Polish**: After US1–US3

### User Story Dependencies

- **US1**: Needs T002–T006
- **US2**: Needs US1 sidebar swap (T007) + routes (T003)
- **US3**: Needs T004 settingsMode; independent of full US2 item set

### Parallel Opportunities

- T005 ∥ T006 after T003 sketched
- T014 ∥ T015 after T003
- T012 Roles page ∥ T011 Members path adjust (different files)
- T023 docs ∥ final smoke

---

## Parallel Example: After Foundational

```bash
Task: "T007 SettingsNav + Sidebar swap in frontend/src/shell/"
Task: "T017 TopBar X stub in frontend/src/shell/TopBar.tsx"
```

---

## Implementation Strategy

### MVP First (US1)

1. T001–T006 (access, routes, mode, home)
2. T007–T009 (gear/name + settings sidebar + placeholder)
3. **STOP** — quickstart A
4. Then US2 pages, US3 X, polish

### Incremental Delivery

1. Foundational → `/settings` loads
2. US1 → entry chrome
3. US2 → full nav + pages + rail cleanup
4. US3 → TopBar exit
5. Redirects + daily/CHANGELOG

---

## Notes

- Suggested MVP: Foundational + US1.
- No backend/migration tasks.
- Format: all tasks use `- [ ]`, TaskID, optional `[P]` / `[Story]`, and file paths.
