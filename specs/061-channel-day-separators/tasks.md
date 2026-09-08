---
description: "Task list for Separadores de dia no canal de texto (061)"
---

# Tasks: Separadores de dia no canal de texto

**Input**: Design documents from `/specs/061-channel-day-separators/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cd frontend && ./node_modules/.bin/tsc --noEmit`. No formal TDD requested; optional pure-helper checks can be manual or ad-hoc.

**Organization**: Setup → Foundational (`daySeparators.ts` timeline) → US1 inline day change → US2 no empty-day lines → US3 label format + CSS → US4 sticky → Polish (midnight, a11y, docs).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/lib/daySeparators.ts`, `frontend/src/pages/Channel.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature dir and current message list baseline.

- [X] T001 Confirm `.specify/feature.json` points at `specs/061-channel-day-separators` and skim `groupMessages` / `.text-scroll` render in `frontend/src/pages/Channel.tsx` plus `.text-scroll` styles in `frontend/src/styles/mesa-theme.css` against [plan.md](./plan.md) / [research.md](./research.md)

**Checkpoint**: Baseline understood (sender-only grouping; no day separators yet).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure helpers for civil day key + timeline — **blocks** all stories.

**⚠️ CRITICAL**: User stories need `buildTimeline` / day-key helpers before Channel wiring.

- [X] T002 Create `frontend/src/lib/daySeparators.ts` with `civilDayKey(date: Date | string): string | null` (`YYYY-MM-DD` local) and types for timeline items (`day-separator` | `msg-group`) per [data-model.md](./data-model.md)
- [X] T003 Implement `buildTimeline(rows: { id; sender; createdAt?; … }[]): TimelineItem[]` in `frontend/src/lib/daySeparators.ts`: emit one `day-separator` before the first message of each distinct civil day; group consecutive same-sender rows **only within the same day** (breaks current cross-midnight merge) per [research.md](./research.md) R3 and [contracts/day-separator-inline.md](./contracts/day-separator-inline.md)
- [X] T004 [P] Implement placeholder `formatDayLabel(dayKey: string, now?: Date): string` in `frontend/src/lib/daySeparators.ts` returning absolute `DD Mês AAAA` for all days (Hoje/Ontem filled in US3) so US1 can render text

**Checkpoint**: Pure timeline builder callable; no empty-day keys invented (adjacency only).

---

## Phase 3: User Story 1 - Ver separador ao mudar de dia (Priority: P1) 🎯 MVP

**Goal**: Inline day separators appear at day boundaries (and before the first day block) in the text channel history.

**Independent Test**: [quickstart.md](./quickstart.md) A + C (two days; single day; no sep mid-same-day).

### Implementation for User Story 1

- [X] T005 [US1] Replace `groupMessages(messages())` usage in `frontend/src/pages/Channel.tsx` with `buildTimeline(messages())` (or equivalent memo/derived signal)
- [X] T006 [US1] Render `day-separator` items as `.day-sep` elements (label from `formatDayLabel`) before each day’s msg-groups inside `.text-measure` / `.text-scroll` in `frontend/src/pages/Channel.tsx` per [contracts/day-separator-inline.md](./contracts/day-separator-inline.md)
- [X] T007 [US1] Keep existing `.msg-group` / message block rendering for `msg-group` timeline items in `frontend/src/pages/Channel.tsx` (avatar, meta, delete, attachments unchanged)
- [X] T008 [P] [US1] Add minimal `.day-sep` layout styles in `frontend/src/styles/mesa-theme.css` (horizontal rule + centered label; theme tokens) so separators are visible for MVP

**Checkpoint**: Multi-day channels show one inline sep per day with messages; same-day messages have no mid-list sep.

---

## Phase 4: User Story 2 - Sem linhas para dias sem mensagens (Priority: P1)

**Goal**: No separators for calendar days with zero loaded messages (gaps stay blank).

**Independent Test**: [quickstart.md](./quickstart.md) B (D1 + D3, no D2).

### Implementation for User Story 2

- [X] T009 [US2] Verify/assert `buildTimeline` in `frontend/src/lib/daySeparators.ts` never emits separators for days absent from the loaded row set (gap between D1 and D3 → only two seps); add a short comment or pure self-check examples in-module if helpful
- [X] T010 [US2] Confirm pagination/WS merge paths in `frontend/src/pages/Channel.tsx` rebuild timeline from full `messages()` so newly loaded older days gain separators without inventing empty days ([quickstart.md](./quickstart.md) F)

**Checkpoint**: Empty intermediate calendar days never get a line.

---

## Phase 5: User Story 3 - Formato legível do rótulo (Priority: P2)

**Goal**: Labels use Hoje / Ontem / `DD Mês AAAA` (pt) with readable dash-line chrome.

**Independent Test**: [quickstart.md](./quickstart.md) D; inspect absolute date example `08 Setembro 2026`.

### Implementation for User Story 3

- [X] T011 [US3] Complete `formatDayLabel` in `frontend/src/lib/daySeparators.ts` per [contracts/day-label-format.md](./contracts/day-label-format.md) (`Hoje`, `Ontem`, padded day + PT month names + year)
- [X] T012 [P] [US3] Polish `.day-sep` dash-line visual (side lines + centered label, muted contrast light/dark) in `frontend/src/styles/mesa-theme.css` per FR-002 / US3
- [X] T013 [P] [US3] Set `role="separator"` and accessible label text on inline `.day-sep` in `frontend/src/pages/Channel.tsx` per [research.md](./research.md) R7

**Checkpoint**: Today/yesterday show relative labels; older days show absolute PT date; a11y text present.

---

## Phase 6: User Story 4 - Separador sticky ao scroll (Priority: P2)

**Goal**: Sticky day label at top of scroll while mid-block; hidden when matching inline is visible at top.

**Independent Test**: [quickstart.md](./quickstart.md) E.

### Implementation for User Story 4

- [X] T014 [US4] Add sticky overlay element `.day-sep-sticky` at the top of `.text-scroll` in `frontend/src/pages/Channel.tsx` driven by sticky state (dayKey / label / visible) per [data-model.md](./data-model.md) and [contracts/day-separator-sticky.md](./contracts/day-separator-sticky.md)
- [X] T015 [US4] Wire scroll/`IntersectionObserver` (or equivalent) in `frontend/src/pages/Channel.tsx` to set day-in-view and hide sticky when that day’s inline `.day-sep` is visible at the top; update on day boundary cross
- [X] T016 [P] [US4] Style `.day-sep-sticky` in `frontend/src/styles/mesa-theme.css` (scrim/opaque bar, same label rules, readable over messages)
- [X] T017 [US4] Ensure empty channel shows neither inline nor sticky; single-day sticky only after inline scrolls away in `frontend/src/pages/Channel.tsx`

**Checkpoint**: Sticky complements inline without duplicate stacked labels.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Midnight label refresh, validation, Speckit docs.

- [X] T018 Schedule local-midnight (and/or `visibilitychange`/focus) refresh so Hoje/Ontem update without full reload in `frontend/src/pages/Channel.tsx` / `frontend/src/lib/daySeparators.ts` per FR-006 / [research.md](./research.md) R6
- [X] T019 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and smoke [quickstart.md](./quickstart.md) A–F
- [X] T020 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None
- **Foundational (Phase 2)**: After Setup — **blocks** US1–US4
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After US1 (validates adjacency; same timeline)
- **US3 (Phase 5)**: After US1 (labels/CSS polish; can start after T006 once placeholder labels exist)
- **US4 (Phase 6)**: After US1 inline seps exist (needs `.day-sep` in DOM); ideally after US3 for shared labels
- **Polish (Phase 7)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: Foundational only — MVP
- **US2 (P1)**: Relies on US1 timeline (verification / pagination)
- **US3 (P2)**: Extends `formatDayLabel` + CSS/a11y on US1 markup
- **US4 (P2)**: Requires inline `.day-sep` from US1; uses US3 labels

### Parallel Opportunities

- T004 parallelizable within Phase 2 after T002 types exist
- T008 CSS can parallel T005–T007 once class names agreed
- T012 / T013 parallel within US3 after T011
- T016 CSS parallel with T014–T015 once class name fixed
- T020 docs parallel with T019

### Parallel Example: User Story 3

```bash
# After T011 formatDayLabel lands:
Task: "Polish .day-sep dash-line in frontend/src/styles/mesa-theme.css"
Task: "Set role=separator on inline .day-sep in frontend/src/pages/Channel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1–2 → helpers
2. Phase 3 US1 → inline seps visible
3. **STOP** — validate quickstart A/C
4. Then US2 → US3 → US4 → polish

### Incremental Delivery

1. Setup + Foundational
2. US1 MVP (inline)
3. US2 gap guarantee
4. US3 Hoje/Ontem + polish CSS
5. US4 sticky anti-dupe
6. Midnight + tsc + daily/CHANGELOG

---

## Notes

- Frontend only — no backend/migrations
- Sticky MUST NOT count toward SC-001 inline separator count
- Do not invent calendar days between message gaps
- Commit after each logical group when implementing
