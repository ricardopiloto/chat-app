---
description: "Task list for 095-mesa-vela-reskin"
---

# Tasks: Mesa à Vela — Full-App Visual Reskin

**Input**: Design documents from `/specs/095-mesa-vela-reskin/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md), PRD [docs/design-ref/prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + contrast AA + `npx tsc --noEmit`. No formal TDD in spec.

**Organization**: Setup → Foundational (Delivery Phase 1: fonts+tokens) → US1 shell (Phase 2) → US2 place type → US3 header + US4 seats (Phase 3) → US5 text/Auth (Phase 4) → Polish QA (Phase 5). **Mandatory stakeholder pause after each delivery phase** (FR-015).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/public/fonts/`, `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/shell/ServerRail.tsx`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/pages/Channel.tsx`, `frontend/src/pages/Auth.tsx`, `frontend/src/i18n/catalogs/en.ts`, `frontend/src/i18n/catalogs/pt-BR.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock feature pointer and skim hotspots against research/PRD.

- [X] T001 Confirm `.specify/feature.json` → `specs/095-mesa-vela-reskin` and skim `--color-accent` / fonts / voice header / seats in `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CameraGrid.tsx` against [research.md](./research.md) and [prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md)

**Checkpoint**: Clear map of token, font, header, and seat work.

---

## Phase 2: Foundational — Delivery Phase 1 tokens/fonts (Blocking)

**Purpose**: Self-hosted fonts + recalculated Nocturne/Mesa tokens + jade accent-2 — **blocks** all story surfaces.

**⚠️ CRITICAL**: No story polish until amber/jade/parchment tokens and fonts load without CDN.

- [X] T002 Add Fraunces (400/500/600) and Manrope (400/500/600/700/800) woff2 + OFL LICENSE files under `frontend/public/fonts/` (keep existing Inter) per [contracts/design-tokens.md](./contracts/design-tokens.md) DT-04 / FR-004
- [X] T003 Add `@font-face` for Fraunces + Manrope (`font-display: swap`); set `--font-body` to Manrope with Inter fallback; add `--font-place` (Fraunces) and `--radius-token: 20px` in `frontend/src/styles/nocturne.css` **without** setting `--font-heading` to Fraunces (PT-01, DT-04, DT-05, FR-005)
- [X] T004 Recalculate `--color-accent` + `--color-accent-100..900` amber ramp (OKLCH / existing lightness scale) and parchment/ink `--color-bg` / `--color-surface` / `--color-text` / `--color-divider` in `frontend/src/styles/nocturne.css`; leave `--color-danger*` unchanged (DT-01, DT-03)
- [X] T005 Remap `--color-accent-2` + `--color-accent-2-100..900` to jade in `frontend/src/styles/nocturne.css`; restyle `.e2ee-chip` (and related security chrome) in `frontend/src/styles/mesa-theme.css` to consume jade/accent-2—not primary amber (DT-02, FR-011, research R2)
- [X] T006 Recalculate Mesa skin aliases `--panel`, `--elev`, `--muted`, `--stage`, `--tile`, `--tile-line`, `--hover`, `--press`, `--chip`, `--on-stage`, `--input-bg`, `--sel-*` for dark `.app` and `.app[data-theme="light"]` in `frontend/src/styles/mesa-theme.css`; keep `--stage`/`--tile` dark in light theme (DT-03, DT-06)
- [X] T007 Stakeholder **pause**: Delivery Phase 1 review (tokens/fonts load; limited chrome polish OK)—do **not** start Phase 3 until approved (FR-015)

**Checkpoint**: Theme toggle shows amber/parchment at token level; fonts from `/fonts`; jade remapped; **paused for review**.

---

## Phase 3: User Story 1 - Product feels Mesa à Vela (shell) (Priority: P1) 🎯 MVP · Delivery Phase 2

**Goal**: Shell chrome (rail/sidebar/top) reads Mesa à Vela in light and dark—not blurple-led.

**Independent Test**: [quickstart.md](./quickstart.md) §1; SC-001 (shell subset).

### Implementation for User Story 1

- [X] T008 [US1] Restyle shell rail / sidebar chrome (`.server-rail-btn` active/`has-voice`/`has-unread`, `.chan-row`, section labels weight/icon vs unsafe global uppercase, roster, user-panel token restyle only) in `frontend/src/styles/mesa-theme.css` (+ class tweaks in `frontend/src/shell/Sidebar.tsx` / `frontend/src/shell/ServerRail.tsx` only if required) (FR-001, FR-006, FR-008)
- [X] T009 [US1] Verify shared Nocturne components (`.btn-primary`, `:focus-visible`, `.seg-opt`, inputs) inherit amber ramp in both themes; fix Mesa overrides in `frontend/src/styles/mesa-theme.css` if focus on amber buttons is weak (PRD §8.3, FR-013)
- [X] T010 [US1] Grep hardcoded colors on shell-touched paths under `frontend/src` and move onto tokens where found (FR-014)
- [X] T011 [US1] Stakeholder **pause**: Delivery Phase 2 review (shell light+dark)—do not start voice header/seats until approved (FR-015)

**Checkpoint**: Shell walkthrough both themes; **paused**.

---

## Phase 4: User Story 2 - Place typography (Priority: P1)

**Goal**: Fraunces only on voice title, server name, Auth brand.

**Independent Test**: Quickstart §2; SC-002; [contracts/place-typography.md](./contracts/place-typography.md).

### Implementation for User Story 2

- [X] T012 [P] [US2] Add `.font-place` using `var(--font-place)` in `frontend/src/styles/nocturne.css` or `mesa-theme.css` and apply to voice channel title in `frontend/src/pages/VoiceChannel.tsx` (PT-02)
- [X] T013 [P] [US2] Apply `.font-place` to sidebar server name in `frontend/src/shell/Sidebar.tsx` (PT-02)
- [X] T014 [P] [US2] Apply `.font-place` to Auth brand in `frontend/src/pages/Auth.tsx` (PT-02)
- [X] T015 [US2] Confirm text channel names / dialog titles / settings headings are **not** Fraunces; fix accidental global heading swap in `frontend/src/styles/mesa-theme.css` / components (PT-03, FR-005)

**Checkpoint**: Fraunces only on the three place contexts. (Can complete before or with US1; must finish before claiming US2 Done.)

---

## Phase 5: User Story 3 - Voice header overflow (Priority: P1) · Delivery Phase 3 (part A)

**Goal**: Editar cena + blur inside `⋯`; E2EE/mode/Members stay visible.

**Independent Test**: Quickstart §3; SC-003; [contracts/voice-header-overflow.md](./contracts/voice-header-overflow.md).

### Implementation for User Story 3

- [X] T016 [US3] Move **Editar cena** and blur select into a `⋯` overflow menu in `frontend/src/pages/VoiceChannel.tsx`; keep Composição/Grade, Members, and E2EE always visible (VH-01–VH-02, FR-007)
- [X] T017 [P] [US3] Add overflow menu styles in `frontend/src/styles/mesa-theme.css` and i18n a11y labels for `⋯` in `frontend/src/i18n/catalogs/en.ts` + `frontend/src/i18n/catalogs/pt-BR.ts`
- [X] T018 [US3] Verify blur preference and scene edit still work from overflow; Composition ↔ Grade unchanged; screen-share Grade contain (085) still OK (VH-03, FR-008)

**Checkpoint**: Header matches PRD chrome; overflow actions work.

---

## Phase 6: User Story 4 - Seats + speaking (Priority: P2) · Delivery Phase 3 (part B)

**Goal**: Five seat tones + nameplate; amber speaking with reduced-motion static variant.

**Independent Test**: Quickstart §4; SC-004, SC-008; [contracts/seat-speaking.md](./contracts/seat-speaking.md).

### Implementation for User Story 4

- [X] T019 [US4] Implement five seat tone classes (`c-ember` / `c-plum` / `c-slate` / `c-wine` / `c-umber`) + nameplate + `--radius-token` frames in `frontend/src/styles/mesa-theme.css` and wire assignment in `frontend/src/components/CameraGrid.tsx` (SS-01–SS-02, FR-010)
- [X] T020 [US4] Restyle speaking indicator to amber pulse; add static non-animated variant under `prefers-reduced-motion: reduce` in `frontend/src/styles/mesa-theme.css` (reuse 033/036 state) (SS-03, FR-009)
- [X] T021 [US4] Confirm screen tiles keep contain/letterbox (085)—no camera seat crop on screens—in `frontend/src/styles/mesa-theme.css` / Grade paths (SS-04)
- [X] T022 [US4] Stakeholder **pause**: Delivery Phase 3 review (header ⋯ + seats + speaking)—do not start text/Auth restyle until approved (FR-015)

**Checkpoint**: Five tones distinguishable; speaking a11y OK; **paused**.

---

## Phase 7: User Story 5 - Text chat + Auth (Priority: P2) · Delivery Phase 4

**Goal**: Messages/composer/Auth use Mesa à Vela skin; layouts unchanged.

**Independent Test**: Quickstart §5; SC-006 text/Auth subset.

### Implementation for User Story 5

- [X] T023 [US5] Restyle text channel messages, day separators, and composer (pill + circular send per PRD intent) in `frontend/src/styles/mesa-theme.css` (+ `frontend/src/pages/Channel.tsx` class hooks only if needed)—behavior unchanged (FR-008)
- [X] T024 [P] [US5] Restyle Auth tokens/type in `frontend/src/styles/mesa-theme.css` / `frontend/src/pages/Auth.tsx` while keeping two-column structure (027)
- [X] T025 [US5] Stakeholder **pause**: Delivery Phase 4 review—do not start final QA checklist until approved (FR-015)

**Checkpoint**: Text + Auth identity match; **paused**.

---

## Phase 8: Polish — Delivery Phase 5 QA + docs

**Purpose**: Uncovered screens, contrast AA, regression, docs.

- [X] T026 Run `cd frontend && npx tsc --noEmit`
- [X] T027 Visual QA of settings, members/roles, dialogs, toasts under new tokens (both themes); fix token inheritance / hardcoded colors in touched CSS (FR-014, SC-005 path)
- [X] T028 Contrast AA spot-checks (body, muted, amber-as-small, jade chip) both themes; record results in `specs/095-mesa-vela-reskin/checklists/` or quickstart notes (FR-013, SC-005)
- [X] T029 Regression smoke: join voice, Composition/Grade, members panel, theme toggle, user panel as shipped, screen share if available (SC-006, FR-008)
- [X] T030 [P] Update `docs/daily/2026-09-11.md` Speckit implement subsection for 095 (on implement complete)
- [X] T031 [P] Update `CHANGELOG.md` `[Unreleased]` for 095 Mesa à Vela reskin
- [X] T032 Stakeholder **pause** / final sign-off Delivery Phase 5; then mark all tasks `[x]` in `specs/095-mesa-vela-reskin/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup → Phase 2 Foundational (Delivery 1) → **PAUSE**
- US1 (shell / Delivery 2) depends on Foundational → **PAUSE**
- US2 (place type) depends on Foundational; can overlap US1; Auth/voice title need those pages
- US3 → US4 share Delivery Phase 3 → **PAUSE** after T022
- US5 (Delivery 4) after voice phase pause → **PAUSE**
- Polish (Delivery 5) last → final pause / Done

### User Story Dependencies

- **US1**: After T002–T007
- **US2**: After T003 (`--font-place`); apply on pages as available
- **US3 / US4**: After shell pause preferred (tokens stable); US4 after or with US3
- **US5**: After Delivery Phase 3 pause

### Parallel Opportunities

- T012 / T013 / T014 (different files)
- T017 vs T016 (styles/i18n vs markup once menu structure known)
- T024 vs T023
- T030 / T031 after T026

---

## Parallel Example: User Story 2

```bash
Task: "T012 .font-place on VoiceChannel title"
Task: "T013 .font-place on Sidebar server name"
Task: "T014 .font-place on Auth brand"
```

---

## Implementation Strategy

### MVP First

1. Phase 1–2 (T001–T007) + stakeholder pause  
2. US1 shell (T008–T011) + pause → **demo identity**  
3. Continue US2–US5 with pauses  

### Suggested MVP Scope

**T001–T011** (Setup + tokens + shell + pause): Mesa à Vela readable on chrome both themes.

### Incremental Delivery (mandatory pauses)

1. Tokens/fonts → pause  
2. Shell → pause  
3. Voice header + seats → pause  
4. Text/Auth → pause  
5. QA/contrast/docs → final sign-off  

---

## Notes

- Visual Done = identity + PRD chrome (**not** pixel-perfect prototype) (FR-017)
- Do not split Sidebar.tsx or mesa-theme.css (out of scope)
- Do not reintroduce stage mode
- Preserve shipped user-panel / screen-share / Grade behaviors—token restyle only except FR-007
- No Google Fonts CDN
