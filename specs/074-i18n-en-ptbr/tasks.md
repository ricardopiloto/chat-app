---
description: "Task list for Multi-idioma EN + PT-BR (074)"
---

# Tasks: Multi-idioma EN + PT-BR (0.6.0)

**Input**: Design documents from `/specs/074-i18n-en-ptbr/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–F; `cd frontend && npx tsc --noEmit`. No new BE contract suite.

**Organization**: Setup → Foundational (i18n core) → US2 detect + Account menu → US1 full UI chrome migration → US3 extensibility guardrails → US4 user content / system roles → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/i18n/`, `frontend/src/App.tsx`, `frontend/src/components/AccountMenu.tsx`, `frontend/src/pages/*`, `frontend/src/shell/*`, `frontend/src/lib/daySeparators.ts`, `frontend/src/lib/notifFormat.ts`, `frontend/src/lib/localPrefs.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature pointer and string-surface inventory baseline.

- [X] T001 Confirm `.specify/feature.json` → `specs/074-i18n-en-ptbr` and skim hardcoded PT chrome in `frontend/src/pages/Auth.tsx`, `frontend/src/shell/TopBar.tsx`, `frontend/src/components/AccountMenu.tsx` against [research.md](./research.md) R4

**Checkpoint**: Know entry points for i18n core and first migrations.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Locale types, detect, prefs, catalogs, `t()`, app wiring — **blocks** all stories.

**⚠️ CRITICAL**: Do not migrate screens until `t()` + provider exist.

- [X] T002 Add `AppLocale`, `SUPPORTED_LOCALES` in `frontend/src/i18n/types.ts` (`pt-BR` \| `en` only) per [data-model.md](./data-model.md)
- [X] T003 [P] Implement `detectLocale()` in `frontend/src/i18n/detect.ts` (`en*` → `en`, `pt*` → `pt-BR`, else `pt-BR`) per [contracts/i18n-ui.md](./contracts/i18n-ui.md)
- [X] T004 [P] Implement read/write `mesa.locale` in `frontend/src/i18n/preference.ts` using `frontend/src/lib/localPrefs.ts`
- [X] T005 Create catalog scaffolds `frontend/src/i18n/catalogs/pt-BR.ts` and `frontend/src/i18n/catalogs/en.ts` with shared key tree (start with `auth.*`, `account.*`, `common.*`)
- [X] T006 Implement `t()`, `getLocale` / `setLocale`, fallback missing key → pt-BR → key path in `frontend/src/i18n/index.ts` (Solid-reactive) per [research.md](./research.md) R3
- [X] T007 Wire locale bootstrap (stored else detect+persist) and provide reactivity in `frontend/src/App.tsx` so all routes see locale changes without logout

**Checkpoint**: `t("common.loading")` works in both locales; F5 keeps stored locale.

---

## Phase 3: User Story 2 - Auto-detect auth + Account menu control (Priority: P1)

**Goal**: Auth follows detection/preference; authenticated users change language in Account menu.

**Independent Test**: [quickstart.md](./quickstart.md) A–C.

### Implementation for User Story 2

- [X] T008 [US2] Migrate product strings in `frontend/src/pages/Auth.tsx` (and auth shell if any) to `t()` — **no** language picker required on auth
- [X] T009 [US2] Add language control (exactly EN + PT-BR) to `frontend/src/components/AccountMenu.tsx`; on change call `setLocale` + persist; accessible name; no logout/unlock
- [X] T010 [US2] Ensure `frontend/src/shell/UserPanel.tsx` / AccountMenu open path exposes the new control; migrate nearby chrome strings in AccountMenu (`Ligado como`, logout, avatar) to `t()`

**Checkpoint**: Quickstart A–C pass with auth detect + Account menu switch.

---

## Phase 4: User Story 1 - Full product UI in EN / PT-BR (Priority: P1) 🎯 MVP+ 

**Goal**: All visible product chrome uses catalogs (100% product UI strings).

**Independent Test**: [quickstart.md](./quickstart.md) D (+ A–C).

### Implementation for User Story 1

- [X] T011 [P] [US1] Migrate shell chrome strings in `frontend/src/shell/TopBar.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/shell/ServerRail.tsx`, `frontend/src/shell/AppShell.tsx` to `t()`; expand catalogs
- [X] T012 [P] [US1] Migrate `frontend/src/shell/SettingsNav.tsx`, `frontend/src/shell/ContextMenu.tsx`, `frontend/src/shell/FloatingVoicePip.tsx`, `frontend/src/shell/UserPanel.tsx` remaining chrome to `t()`
- [X] T013 [US1] Migrate `frontend/src/pages/Servers.tsx`, `frontend/src/pages/EmptyServerPane.tsx`, `frontend/src/preferences/emptyServerJokes.ts` (per-locale jokes or keys) to `t()` / locale-aware lists
- [X] T014 [US1] Migrate text channel chrome in `frontend/src/pages/Channel.tsx`, `frontend/src/pages/ChannelRoute.tsx` (composer placeholders, banners, buttons, errors of product — **not** message bodies / channel names)
- [X] T015 [US1] Migrate voice UI chrome in `frontend/src/pages/VoiceChannel.tsx` and related voice chrome components under `frontend/src/voice/` / `frontend/src/components/` used by voice (product labels only)
- [X] T016 [P] [US1] Migrate settings/roles/members pages: `frontend/src/pages/SettingsHomePage.tsx`, `RolesManagePage.tsx`, `RolePermissionsPage.tsx`, `MembersManagePage.tsx`, `ServerImagePage.tsx`, `ServerDeletePage.tsx`
- [X] T017 [P] [US1] Migrate `frontend/src/pages/Invite.tsx` and remaining shared dialogs/toasts under `frontend/src/components/` / `frontend/src/ui/` product copy to `t()`
- [X] T018 [US1] Make `frontend/src/lib/daySeparators.ts` and `frontend/src/lib/notifFormat.ts` locale-aware (Hoje/Today, months, notif when) via `t()` or locale param per FR-009
- [X] T019 [US1] Map common FE-facing API/product errors in `frontend/src/lib/apiError.ts` (or call sites) to catalog keys where practical; leave unmapped raw errors as-is per [research.md](./research.md) R7

**Checkpoint**: Spot-check tour in EN and PT-BR shows no leftover product chrome in the other language.

---

## Phase 5: User Story 3 - Extensible multi-idioma base (Priority: P2)

**Goal**: Only two locales offered; structure ready for a third catalog later.

**Independent Test**: Selector = 2 options; adding a locale = new catalog + register (documented in code comment / i18n README stub optional).

### Implementation for User Story 3

- [X] T020 [US3] Keep `SUPPORTED_LOCALES` as single source for AccountMenu options in `frontend/src/i18n/types.ts` + `AccountMenu.tsx` (no phantom locales)
- [X] T021 [P] [US3] Add short extension note in `frontend/src/i18n/index.ts` (or `frontend/src/i18n/README.md`) describing how to add a locale (catalog file + register) per FR-007

**Checkpoint**: Exactly two languages in UI; extension path documented.

---

## Phase 6: User Story 4 - User content vs system labels (Priority: P2)

**Goal**: Messages/channel names/custom roles unchanged; system roles translate.

**Independent Test**: [quickstart.md](./quickstart.md) E–F.

### Implementation for User Story 4

- [X] T022 [US4] Add `roles.system.*` keys and display helper (e.g. `frontend/src/i18n/systemRoleLabel.ts` or inline) used where roles render (`RolesManagePage.tsx`, `MembersManagePage.tsx`, members panel) — `is_system` → `t(...)`, else raw `role.name`
- [X] T023 [US4] Verify Channel message list / channel title / custom role pickers still bind raw user content (no `t()` wrapping message text or channel.name) in `frontend/src/pages/Channel.tsx`, `Sidebar.tsx`, role UIs

**Checkpoint**: Quickstart E passes; system «Dono» label flips with locale.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Inventory sweep, validation, docs on implement.

- [X] T024 Sweep remaining hardcoded Portuguese product chrome under `frontend/src/` (grep common UI words) and migrate stragglers into catalogs
- [X] T025 Run `cd frontend && npx tsc --noEmit` and fix i18n-related errors
- [X] T026 [P] Smoke [quickstart.md](./quickstart.md) A–F manually
- [X] T027 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when `/speckit-implement` completes (note 0.6.0 milestone capability; do **not** bump version/tag unless release is explicitly requested)

**Checkpoint**: Feature ready for implement completion report.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** all US
- **US2 (Phase 3)**: After Foundational — detect + Account menu (+ auth strings)
- **US1 (Phase 4)**: After T006/T007; can start after US2 auth migration or in parallel on other files
- **US3 (Phase 5)**: After AccountMenu language control exists
- **US4 (Phase 6)**: After catalogs include roles keys; with or after US1 settings migration
- **Polish (Phase 7)**: After desired stories

### User Story Dependencies

- **US2 (P1)**: Foundational — first usable language switch
- **US1 (P1)**: Foundational (+ ideally US2 control) — full coverage
- **US3 (P2)**: Selector + docs on top of US2
- **US4 (P2)**: Catalog + role list UIs

### Parallel Opportunities

- T003 detect ∥ T004 preference ∥ T005 catalogs (after T002)
- T011 ∥ T012 ∥ T016 ∥ T017 after provider exists
- T021 ∥ T022 late
- T026 ∥ T027 on implement

### Parallel Example: Foundational

```bash
Task: "detectLocale in frontend/src/i18n/detect.ts"
Task: "mesa.locale prefs in frontend/src/i18n/preference.ts"
Task: "Catalog scaffolds pt-BR.ts + en.ts"
```

---

## Implementation Strategy

### MVP First (US2 + core chrome)

1. Phase 1–2 → i18n core  
2. Phase 3 US2 → Auth `t()` + AccountMenu language control  
3. **STOP** — validate quickstart A–C  

### Incremental Delivery

1. US2 switcher + auth  
2. US1 shell → channels → settings → dates/errors  
3. US3/US4 polish  
4. Sweep + tsc + daily/CHANGELOG on implement  

### Suggested MVP scope

**Foundational + US2** (T001–T010) — language works end-to-end. Then complete **US1** for 0.6.0 “full UI” Done criteria.

---

## Notes

- Do **not** translate message bodies, channel/server names, custom role names, handles  
- Do **not** add account-synced locale API  
- Do **not** bump to 0.6.0 tag in this feature unless user asks for release  
- Format validation: all tasks use `- [ ]`, `Tnnn`, optional `[P]`, story `[USn]` on story phases, concrete paths
