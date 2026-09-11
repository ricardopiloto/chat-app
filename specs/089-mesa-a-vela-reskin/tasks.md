---
description: "Task list for 089-mesa-a-vela-reskin"
---

# Tasks: Mesa à Vela — Visual Identity Renovation

**Input**: Design documents from `/specs/089-mesa-a-vela-reskin/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md), PRD [docs/layout-review-01.md](../../docs/layout-review-01.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + contrast AA checklist + `npx tsc --noEmit`. No formal TDD in spec.

**Organization**: Setup → Foundational (fonts + Nocturne/Mesa tokens + accent-2 audit) → US1 identity → US2 place type → US3 voice header → US4 seats/speaking → US5 text/Auth/uncovered → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/public/fonts/`, `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/shell/ServerRail.tsx`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/pages/Channel.tsx`, `frontend/src/pages/Auth.tsx`, `frontend/src/i18n/catalogs/en.ts`, `frontend/src/i18n/catalogs/pt-BR.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer, PRD seeds, and accent-2 audit gate (FR-010).

- [x] T001 Confirm `.specify/feature.json` → `specs/089-mesa-a-vela-reskin` and skim current `--color-accent` / fonts / voice header in `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx` against [research.md](./research.md) R1–R7
- [x] T002 Audit `color-accent-2` / `tag-accent-2` usage under `frontend/src` (TS/TSX + CSS); record remap-vs-`--color-security` decision in implement notes or [research.md](./research.md) per [contracts/design-tokens.md](./contracts/design-tokens.md) DT-02 / FR-010

**Checkpoint**: Accent-2 path chosen; clear map of token + header work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Self-hosted fonts + recalculated Nocturne/Mesa tokens — **blocks** all user-story surfaces.

**⚠️ CRITICAL**: No story polish until amber/jade/parchment tokens and fonts load without CDN.

- [x] T003 Add Fraunces (400/500/600) and Manrope (400/500/600/700/800) woff2 + OFL LICENSE files under `frontend/public/fonts/` (keep existing Inter files) per DT-04 / FR-002
- [x] T004 Add `@font-face` for Fraunces + Manrope (`font-display: swap`) and set `--font-body` to Manrope with Inter fallback; add `--font-place` (Fraunces stack) and `--radius-token: 20px` in `frontend/src/styles/nocturne.css` without globally assigning Fraunces to `--font-heading` (PT-01, DT-04, DT-05)
- [x] T005 Recalculate `--color-accent` + `--color-accent-100..900` amber ramp (OKLCH / existing lightness scale) and parchment/ink `--color-bg` / `--color-surface` / `--color-text` / `--color-divider` in `frontend/src/styles/nocturne.css`; leave `--color-danger*` unchanged (DT-01, DT-03, FR-009)
- [x] T006 Apply jade path from T002: remap `--color-accent-2` (+ ramp) **or** add `--color-security` short ramp in `frontend/src/styles/nocturne.css`; restyle `.e2ee-chip` (and related security chrome) in `frontend/src/styles/mesa-theme.css` to use jade tokens (DT-02; research R2)
- [x] T007 Recalculate Mesa skin aliases `--panel`, `--elev`, `--muted`, `--stage`, `--tile`, `--tile-line`, `--hover`, `--press`, `--chip`, `--on-stage`, `--input-bg`, `--sel-*` for dark `.app` and `.app[data-theme="light"]` in `frontend/src/styles/mesa-theme.css`; keep `--stage`/`--tile` dark in light theme (DT-03, DT-06)

**Checkpoint**: Theme toggle shows amber/parchment identity at token level; fonts load from `/fonts`.

---

## Phase 3: User Story 1 - Product feels Mesa à Vela in light and dark (Priority: P1) 🎯 MVP

**Goal**: Primary chrome (buttons, focus, seg, shell inheritance) reads amber/parchment—not blurple—in both themes.

**Independent Test**: [quickstart.md](./quickstart.md) §1; SC-001.

### Implementation for User Story 1

- [x] T008 [US1] Restyle shell rail / sidebar chrome (`.server-rail-btn` active/`has-voice`/`has-unread`, `.chan-row`, section labels weight/icon vs unsafe global uppercase, roster, `.sidebar-user` / user panel) in `frontend/src/styles/mesa-theme.css` (+ class tweaks in `frontend/src/shell/Sidebar.tsx` / `frontend/src/shell/ServerRail.tsx` only if required) so inherited accent/surfaces match Mesa à Vela (FR-001, FR-008)
- [x] T009 [US1] Verify primary shared Nocturne components (`.btn-primary`, `:focus-visible`, `.seg-opt`, inputs) inherit amber ramp in both themes; adjust Mesa overrides in `frontend/src/styles/mesa-theme.css` if focus on amber buttons is indistinguishable (PRD §8.3, FR-011)

**Checkpoint**: Dark + light walkthrough of shell no longer blurple-led.

---

## Phase 4: User Story 2 - Place typography vs utility typography (Priority: P1)

**Goal**: Fraunces only on voice title, server name, Auth brand; UI default Manrope.

**Independent Test**: Quickstart §2; SC-002; [contracts/place-typography.md](./contracts/place-typography.md).

### Implementation for User Story 2

- [x] T010 [P] [US2] Add `.font-place` (or equivalent) using `var(--font-place)` in `frontend/src/styles/nocturne.css` or `mesa-theme.css` and apply to voice channel title in `frontend/src/pages/VoiceChannel.tsx` (PT-02)
- [x] T011 [P] [US2] Apply place typography class to sidebar server name in `frontend/src/shell/Sidebar.tsx` (PT-02)
- [x] T012 [P] [US2] Apply place typography class to Auth brand in `frontend/src/pages/Auth.tsx` (PT-02)
- [x] T013 [US2] Confirm text channel names / dialog titles / settings headings remain Manrope (not Fraunces) via selectors in `frontend/src/styles/mesa-theme.css` / component classes—fix accidental global heading swap (PT-03, FR-003/004)

**Checkpoint**: Reviewers see Fraunces only on the three place contexts.

---

## Phase 5: User Story 3 - Voice header matches prototype chrome (Priority: P1)

**Goal**: Default header uncluttered; Editar cena + blur inside `⋯`.

**Independent Test**: Quickstart §3; SC-003; [contracts/voice-header-overflow.md](./contracts/voice-header-overflow.md).

### Implementation for User Story 3

- [x] T014 [US3] Move **Editar cena** and blur select from the default header row into a `⋯` overflow menu in `frontend/src/pages/VoiceChannel.tsx`; keep Composição/Grade, Members, and E2EE always visible (VH-01–VH-02, FR-005)
- [x] T015 [P] [US3] Add overflow menu styles in `frontend/src/styles/mesa-theme.css` and i18n a11y labels for the `⋯` control in `frontend/src/i18n/catalogs/en.ts` + `frontend/src/i18n/catalogs/pt-BR.ts`
- [x] T016 [US3] Verify blur preference and scene edit still function from the overflow; Grade ↔ Composition unchanged (VH-03; smoke with screen-share Grade rules)

**Checkpoint**: Header checklist matches PRD §9.3; overflow actions work.

---

## Phase 6: User Story 4 - Speaking ring and seat presence (Priority: P2)

**Goal**: Amber speaking (static under reduced motion); camera seat visuals; screen tiles unaffected.

**Independent Test**: Quickstart §4; SC-004, SC-006; [contracts/seat-speaking.md](./contracts/seat-speaking.md).

### Implementation for User Story 4

- [x] T017 [US4] Restyle speaking indicators (roster / user-panel / seat) to amber pulse in `frontend/src/styles/mesa-theme.css`; add static border treatment under `prefers-reduced-motion: reduce` (SS-01, FR-006)
- [x] T018 [US4] Apply camera seat tones (ember/plum/slate/wine/umber), nameplate gradient, and `border-radius: var(--radius-token)` in `frontend/src/styles/mesa-theme.css` (+ seat class hooks in `frontend/src/components/CameraGrid.tsx` if markup needed) (SS-02, FR-007, FR-013)
- [x] T019 [US4] Guard screen-share tiles against seat face-crop styling; preserve 085 contain + letterbox on `.grade-screen-tile` in `frontend/src/styles/mesa-theme.css` (SS-03)

**Checkpoint**: Speaking + seats look Mesa à Vela; video and screen tiles still correct.

---

## Phase 7: User Story 5 - Text, Auth, and uncovered screens (Priority: P2)

**Goal**: Chat composer/messages + Auth skin; settings/members/dialogs/toasts coherent via tokens.

**Independent Test**: Quickstart §5–§6; SC-005, SC-007; FR-012.

### Implementation for User Story 5

- [x] T020 [US5] Restyle text channel messages (avatar token, day separator) and pill composer + circular send in `frontend/src/styles/mesa-theme.css` (+ class hooks in `frontend/src/pages/Channel.tsx` if needed)
- [x] T021 [P] [US5] Restyle Auth two-column screen tokens/typography-only in `frontend/src/styles/mesa-theme.css` / `frontend/src/pages/Auth.tsx` without changing 027 layout (FR-001, US5)
- [x] T022 [US5] Visual QA pass on settings, members/roles, invite dialogs, and toasts in both themes; fix only token/contrast gaps in `frontend/src/styles/nocturne.css` / `mesa-theme.css` (FR-012, SC-007)

**Checkpoint**: Text/Auth match skin; uncovered screens legible via inheritance.

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: Contrast AA, regression smoke, docs.

- [x] T023 Document AA contrast spot-checks (body, muted, amber/jade small UI, both themes) in `specs/089-mesa-a-vela-reskin/quickstart.md` or a short checklist note under `specs/089-mesa-a-vela-reskin/checklists/` (FR-011, SC-005)
- [x] T024 Run regression smoke: Grade + Composition cameras; screen share present/clear; user-panel stack controls; theme toggle — fix regressions in touched CSS/TSX (SC-006)
- [x] T025 Run `cd frontend && npx tsc --noEmit`
- [x] T026 [P] Update `docs/daily/2026-09-10.md` Speckit implement subsection for 089 (when implement completes; leave note if tasks-only)
- [x] T027 [P] Update `CHANGELOG.md` `[Unreleased]` for Mesa à Vela reskin (089) when implement completes
- [x] T028 Mark all tasks `[x]` in `specs/089-mesa-a-vela-reskin/tasks.md` when implement completes

---

## Dependencies & Execution Order

```text
Phase 1 (T001–T002)
  → Phase 2 Foundational (T003–T007)  [BLOCKS all stories]
    → Phase 3 US1 (T008–T009) 🎯 MVP chrome
    → Phase 4 US2 (T010–T013)  [needs fonts from Phase 2]
    → Phase 5 US3 (T014–T016)  [behavior; can follow US1]
    → Phase 6 US4 (T017–T019)  [needs amber tokens]
    → Phase 7 US5 (T020–T022)
      → Phase 8 Polish (T023–T028)
```

- US2 place classes can start after T004; full look needs T005–T007.
- US3 is the only markup/behavior change; independent of seats (US4) once tokens exist.
- US4 must not break 085/086 (T019).
- T026–T028 are implement-completion chores (skip marking done during `/speckit-tasks` alone).

## Parallel Opportunities

- After T004: T010 / T011 / T012 in parallel (different files).
- After T007: US1 shell CSS vs starting US3 overflow markup (different concerns).
- T015 i18n parallel with T014 once menu structure known.
- T021 Auth parallel with T020 chat after tokens exist.
- T026 / T027 parallel after T025.

## Implementation Strategy

1. **MVP**: Phase 1–3 (audit + fonts/tokens + shell identity) → product already “feels” Mesa à Vela.
2. **Increment**: US2 place type → US3 header overflow → US4 seats/speaking → US5 text/Auth/QA.
3. **Stop rule**: Do not split `Sidebar.tsx` or modularize `mesa-theme.css` into many files (out of scope).

## MVP scope

**User Story 1** + Foundational tokens/fonts (T001–T009).

## Independent test criteria (summary)

| Story | Test |
|-------|------|
| US1 | Quickstart §1 — amber/parchment both themes |
| US2 | Quickstart §2 — Fraunces only on 3 place contexts |
| US3 | Quickstart §3 — `⋯` holds blur + Editar cena |
| US4 | Quickstart §4 — amber speaking + seats; screen tiles OK |
| US5 | Quickstart §5–§6 — chat/Auth + uncovered AA |

## Format validation

All tasks use `- [ ]`, sequential `T00N`, optional `[P]`, story labels only on US phases, and include concrete file paths.
