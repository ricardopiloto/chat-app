---
description: "Task list for Separadores de dia a largura total (064)"
---

# Tasks: Separadores de dia a largura total da área de scroll

**Input**: Design documents from `/specs/064-day-sep-full-width/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cd frontend && ./node_modules/.bin/tsc --noEmit`. No formal TDD requested.

**Organization**: Setup → Foundational (DOM/CSS baseline) → US1 inline full-width → US3 sticky flush → US2 message-width check → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/Channel.tsx`, `frontend/src/styles/mesa-theme.css` (logic in `frontend/src/lib/daySeparators.ts` unchanged unless markup forces a trivial touch)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current 061 layout constraint.

- [X] T001 Confirm `.specify/feature.json` → `specs/064-day-sep-full-width` and skim `.text-scroll` / `.text-measure` / `.day-sep` / `.day-sep-sticky*` in `frontend/src/pages/Channel.tsx` and `frontend/src/styles/mesa-theme.css` against [research.md](./research.md) R1–R3

**Checkpoint**: Baseline understood (sep inside 74ch; sticky has vertical padding/offset).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Agree DOM strategy before story CSS — **blocks** US1–US3.

**⚠️ CRITICAL**: Do not polish sticky or message width until the timeline render structure for full-width seps is chosen.

- [X] T002 Decide and sketch DOM change in `frontend/src/pages/Channel.tsx`: `.day-sep` **outside** `.text-measure` (or equivalent); apply `max-width: 74ch` only to message groups — per [research.md](./research.md) R2 and [data-model.md](./data-model.md)
- [X] T003 Confirm sticky host remains a direct child of `.text-scroll` and that `.day-sep` selectors used by sticky IO in `frontend/src/pages/Channel.tsx` still match after the restructure

**Checkpoint**: Clear restructure plan; no day-logic changes in `daySeparators.ts`.

---

## Phase 3: User Story 1 - Linha de dia a atravessar o painel (Priority: P1) 🎯 MVP

**Goal**: Inline `.day-sep` dash lines span the content width of `.text-scroll` (inside lateral padding), not the 74ch message column.

**Independent Test**: [quickstart.md](./quickstart.md) A (+ D narrow/no H-scroll).

### Implementation for User Story 1

- [X] T004 [US1] Restructure timeline render in `frontend/src/pages/Channel.tsx` so `day-separator` items render as full-width `.day-sep` siblings of the message column (remove wrapping seps inside `.text-measure`) per [contracts/day-sep-inline-full-width.md](./contracts/day-sep-inline-full-width.md)
- [X] T005 [US1] Keep `msg-group` items constrained to reading width (`.text-measure` wrapper per group/block or `max-width` on `.msg-group`) in `frontend/src/pages/Channel.tsx` / `frontend/src/styles/mesa-theme.css`
- [X] T006 [P] [US1] Ensure `.day-sep` / `.day-sep-line` styles in `frontend/src/styles/mesa-theme.css` fill 100% of scroll **content** width (within existing horizontal padding); no `100vw` / negative-margin breakout that causes horizontal scroll (FR-005)

**Checkpoint**: Wide panel → lines reach content edges inside padding; label centered; resize OK.

---

## Phase 4: User Story 3 - Sticky colado ao topo (Priority: P1)

**Goal**: Sticky day chip flush to the top of `.text-scroll`; pill only, no full-width dash.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 3

- [X] T007 [US3] Adjust `.day-sep-sticky-host` / `.day-sep-sticky` in `frontend/src/styles/mesa-theme.css` so the visible chip is **flush** with the top of the scroll area (remove perceptible top gap / top padding; keep optional bottom scrim) per [contracts/day-sep-sticky-flush.md](./contracts/day-sep-sticky-flush.md) and [research.md](./research.md) R3
- [X] T008 [US3] If `.text-scroll` vertical padding still offsets sticky, fix in `frontend/src/styles/mesa-theme.css` (and minimal `Channel.tsx` if needed) via negative margin / padding split so horizontal padding remains for FR-001 while sticky sits at the scrollport top
- [X] T009 [P] [US3] Confirm sticky remains chip/pill only (`.day-sep-sticky-label`) with **no** full-width dash line in `frontend/src/styles/mesa-theme.css` / `frontend/src/pages/Channel.tsx` (FR-008); show/hide IO rules unchanged

**Checkpoint**: Sticky visible → flush top; hide when inline at top still works.

---

## Phase 5: User Story 2 - Mensagens sem regressão de largura (Priority: P2)

**Goal**: Message reading column unchanged by full-bleed lines.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [X] T010 [US2] Verify message bubbles/groups still use the reading `max-width` (74ch or equivalent) in `frontend/src/styles/mesa-theme.css` / `frontend/src/pages/Channel.tsx` after US1; tighten CSS if messages accidentally went full-bleed
- [X] T011 [P] [US2] Spot-check long messages + multi-day history against [quickstart.md](./quickstart.md) B (no forced full-width message layout)

**Checkpoint**: Only dash lines span the panel content width.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Themes, overflow, 061 regression, docs.

- [X] T012 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and complete [quickstart.md](./quickstart.md) A–E (incl. light/dark, narrow panel, 061 sticky/labels checklist)
- [X] T013 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** (blocks all)
- **US1** after Foundational (MVP — full-width lines)
- **US3** after Foundational (can follow or briefly parallel US1 if CSS-only sticky; prefer after T004 so IO still finds `.day-sep`)
- **US2** after US1 (verification of message column)
- **Polish** last

### User Story Dependencies

- **US1**: Foundational DOM plan
- **US3**: Foundational + prefer after US1 DOM move
- **US2**: Depends on US1 layout choice

### Parallel Opportunities

- T006 ∥ T005 once structure in Channel started (CSS while TSX settles)
- T009 ∥ T007/T008 (form check vs flush CSS)
- T011 ∥ T010
- T013 ∥ T012

### Parallel Example: After Foundational

```bash
Task: "Restructure Channel.tsx so day-sep is outside text-measure"
Task: "CSS day-sep lines at 100% content width without H-scroll"
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1–2  
2. Phase 3 full-width inline seps  
3. **STOP** — visual check quickstart A  
4. Then US3 sticky flush → US2 verify → polish  

### Incremental Delivery

1. DOM: sep out of 74ch  
2. CSS: full content-width lines  
3. Sticky flush top  
4. Message-width regression check + docs  

---

## Notes

- No backend / migrations / `daySeparators.ts` day rules  
- Horizontal padding of `.text-scroll` stays the outer limit of dash lines  
- Sticky = chip only; full-width dash = inline only
