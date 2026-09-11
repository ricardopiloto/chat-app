---
description: "Task list for 090-revert-mesa-vela"
---

# Tasks: Revert Mesa à Vela Reskin

**Input**: Design documents from `/specs/090-revert-mesa-vela/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `npx tsc --noEmit` + regression smoke for 082–088. No formal TDD in spec.

**Organization**: Setup → Foundational (token/font restore) → US1 identity → US2 voice header → US3 seats/place/composer → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/components/AuthShell.tsx`, `frontend/src/i18n/catalogs/en.ts`, `frontend/src/i18n/catalogs/pt-BR.ts`, `frontend/public/fonts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and 089 revert hotspots.

- [x] T001 Confirm `.specify/feature.json` → `specs/090-revert-mesa-vela` and skim amber/Manrope/`⋯`/seat hotspots in `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx` against [research.md](./research.md) R1–R7

**Checkpoint**: Clear map of 089 deltas vs 082–088 CSS to preserve.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Restore pre-089 Nocturne tokens + Inter fonts; remove Mesa à Vela font load — **blocks** US1 steady-state identity.

**⚠️ CRITICAL**: Do not wholesale-checkout `mesa-theme.css` (would drop 082–088). Surgical token restore first.

- [x] T002 Restore pre-089 `--color-accent` (+ ramp), `--color-accent-2` (+ lavender ramp), `--color-bg` / `--color-surface` / `--color-text` / `--color-divider` / neutral ramp in `frontend/src/styles/nocturne.css` per [contracts/identity-restore.md](./contracts/identity-restore.md) IR-01; leave danger semantics intact (FR-009)
- [x] T003 Restore `--font-heading` / `--font-body` to Inter-only stacks; remove `--font-place`, `--radius-token`, Manrope/Fraunces `@font-face` blocks, and `.font-place` helper from `frontend/src/styles/nocturne.css` (IR-02, FR-002)
- [x] T004 Delete `Manrope*` and `Fraunces*` (woff2 + LICENSE) under `frontend/public/fonts/`; keep Inter files (IR-03, FR-008)
- [x] T005 Restore pre-089 Mesa `.app` and `.app[data-theme="light"]` aliases (`--panel`, `--elev`, `--muted`, `--stage`, `--tile`, `--sel-*`, etc.) in `frontend/src/styles/mesa-theme.css`; remove 089 `--seat-*` CSS variables (IR-01; research R2)

**Checkpoint**: Theme toggle shows blurple/cool-grey + Inter without Manrope/Fraunces dependency.

---

## Phase 3: User Story 1 - Product looks like pre–Mesa à Vela again (Priority: P1) 🎯 MVP

**Goal**: Shared chrome inherits restored identity in both themes.

**Independent Test**: [quickstart.md](./quickstart.md) §1; SC-001.

### Implementation for User Story 1

- [x] T006 [US1] Revert 089 shell chrome tweaks that fight blurple/cool greys (e.g. sidebar-section label style if changed) in `frontend/src/styles/mesa-theme.css` while keeping rail/chan-row structure and 082–088 indicators (FR-001, FR-007)
- [x] T007 [US1] Spot-check `.btn-primary`, `:focus-visible`, `.seg-opt` inherit restored accent; adjust only Mesa overrides that still force amber/jade in `frontend/src/styles/mesa-theme.css` (SC-001)

**Checkpoint**: Dark + light walkthrough no longer reads as Mesa à Vela.

---

## Phase 4: User Story 2 - Voice header chrome restored (Priority: P1)

**Goal**: Editar cena + blur back in default header; remove `⋯` overflow.

**Independent Test**: Quickstart §2; SC-002; [contracts/voice-header-restore.md](./contracts/voice-header-restore.md).

### Implementation for User Story 2

- [x] T008 [US2] Restore free-standing Editar cena + blur select in default header; remove `⋯` overflow UI, `headerMenuOpen` state, and click-outside effect in `frontend/src/pages/VoiceChannel.tsx` (VH-R01–VH-R02, FR-003)
- [x] T009 [P] [US2] Remove unused `voice.headerMore` keys from `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts`
- [x] T010 [P] [US2] Remove `.voice-header-overflow*` styles from `frontend/src/styles/mesa-theme.css` (VH-R02)

**Checkpoint**: Blur + Editar cena work without overflow; Grade/Composition unchanged.

---

## Phase 5: User Story 3 - Place type, seats, and chat chrome undone (Priority: P2)

**Goal**: Strip 089 place/seat/composer/speaking/E2EE skins.

**Independent Test**: Quickstart §3; SC-003, SC-004, SC-006; [contracts/surface-rollback.md](./contracts/surface-rollback.md).

### Implementation for User Story 3

- [x] T011 [P] [US3] Remove `.font-place` from voice title in `frontend/src/pages/VoiceChannel.tsx`, server name in `frontend/src/shell/Sidebar.tsx`, and Auth brand in `frontend/src/components/AuthShell.tsx` (SR-04)
- [x] T012 [US3] Remove `seatToneFor` / seat tone exports and `grade-cam-tile` / `seat-*` classList from `frontend/src/components/CameraGrid.tsx` (SR-01, FR-004)
- [x] T013 [US3] Remove seat/nameplate/`--radius-token` CSS and restore pre-089 speaking + `.e2ee-chip` treatments in `frontend/src/styles/mesa-theme.css` (SR-01–SR-02, FR-006)
- [x] T014 [US3] Restore pre-089 composer chrome (undo pill input + circular filled send) in `frontend/src/styles/mesa-theme.css` (SR-03, FR-005)
- [x] T015 [P] [US3] Remove leftover `.font-place` / 089 appendix rules at end of `frontend/src/styles/mesa-theme.css` if still present after T013–T014

**Checkpoint**: No Fraunces place face, no seat tones, pre-089 composer; screen tiles still contain (085).

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Regression, typecheck, docs.

- [x] T016 Run regression smoke from [quickstart.md](./quickstart.md) §4 (screen share clear, user-panel, theme toggle, Grade ↔ Composition); fix only accidental regressions in touched CSS/TSX (FR-007, SC-004–SC-005)
- [x] T017 Run `cd frontend && npx tsc --noEmit`
- [x] T018 [P] Update `docs/daily/2026-09-10.md` Speckit implement subsection for 090 (or today’s date from session)
- [x] T019 [P] Update `CHANGELOG.md` `[Unreleased]` noting revert of 089 Mesa à Vela identity
- [x] T020 Mark all tasks `[x]` in `specs/090-revert-mesa-vela/tasks.md`

---

## Dependencies & Execution Order

```text
Phase 1 (T001)
  → Phase 2 Foundational (T002–T005)  [BLOCKS US1 look]
    → Phase 3 US1 (T006–T007) 🎯 MVP
    → Phase 4 US2 (T008–T010)  [header; can parallel US3 after T005]
    → Phase 5 US3 (T011–T015)
      → Phase 6 Polish (T016–T020)
```

- US2 and US3 can proceed in parallel after foundational tokens if file conflicts are respected (`mesa-theme.css` sequential for T010/T013–T015).
- T011 can run in parallel across three TSX files.

## Parallel Opportunities

- T009 + T010 after T008 structure known
- T011 (three files) in parallel
- T018 / T019 after T017

## Implementation Strategy

1. **MVP**: T001–T007 (tokens + Inter + shell identity).
2. **Increment**: US2 header restore → US3 surface rollback → polish/regression.
3. **Stop rule**: Never delete 082–088 Grade/screen/user-panel CSS while cleaning 089 blocks.

## MVP scope

User Story 1 + Foundational token/font restore (T001–T007).

## Independent test criteria (summary)

| Story | Test |
|-------|------|
| US1 | Quickstart §1 — blurple/cool greys both themes |
| US2 | Quickstart §2 — Editar cena + blur without `⋯` |
| US3 | Quickstart §3 — no place/seats; pre-089 composer |

## Format validation

All tasks use `- [ ]`, sequential `T00N`, optional `[P]`, `[USn]` on story phases only, and concrete file paths.
