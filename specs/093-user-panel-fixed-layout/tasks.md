---
description: "Task list for 093-user-panel-fixed-layout"
---

# Tasks: User Panel Always Stacked with Channel Label

**Input**: Design documents from `/specs/093-user-panel-fixed-layout/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `npx tsc --noEmit`. No formal TDD requested in spec.

**Organization**: Setup → Foundational (remove 084 measure; always-stack CSS) → US1 permanent layout → US2 channel label → US3 icon/account guardrails → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/UserPanel.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/i18n/catalogs/en.ts`, `frontend/src/i18n/catalogs/pt-BR.ts`, `frontend/src/voice/VoiceSession.tsx` (read-only)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current 084 stack hotspots.

- [x] T001 Confirm `.specify/feature.json` → `specs/093-user-panel-fixed-layout` and skim `measureStack` / `user-panel--stacked` / call-control visibility in `frontend/src/shell/UserPanel.tsx` + `.user-panel` rules in `frontend/src/styles/mesa-theme.css` against [research.md](./research.md) R1–R5 and [contracts/user-panel-fixed-layout.md](./contracts/user-panel-fixed-layout.md)

**Checkpoint**: Clear map of overflow measure to remove and CSS to make permanent.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Kill dynamic stack/unstack — **blocks** permanent layout (US1) and stable lower-row label slot (US2).

**⚠️ CRITICAL**: No story work until measure hysteresis is gone and stacked is the only layout mode.

- [x] T002 Remove `stacked` signal, `measureStack`, `measureCallsIntrinsic`, `cssLengthToPx`, and `ResizeObserver` stack hysteresis from `frontend/src/shell/UserPanel.tsx` (FR-009; research R1)
- [x] T003 Always apply `user-panel--stacked` (or equivalent permanent class) on the panel root in `frontend/src/shell/UserPanel.tsx` (UPF-01, FR-001)
- [x] T004 Update `.user-panel` / `.user-panel--stacked` in `frontend/src/styles/mesa-theme.css` so stacked grid is the default layout; drop CSS that assumes single-row overflow switching; keep shell-nav reflow when taller (UPF-06, FR-008)
- [x] T005 [P] Add CSS to **collapse** `.user-panel-calls` when it has no visible controls (no tall empty upper strip) in `frontend/src/styles/mesa-theme.css` (FR-011, UPF-04; research R2)

**Checkpoint**: Panel is always stacked; empty upper row collapses; no measure-driven flicker.

---

## Phase 3: User Story 1 - Panel always uses the two-row call layout (Priority: P1) 🎯 MVP

**Goal**: Controls (except Settings) stay on the upper centered row whenever visible; identity + Settings on the lower row; icons never migrate mid-session.

**Independent Test**: [quickstart.md](./quickstart.md) §1–§2; SC-001, SC-008.

### Implementation for User Story 1

- [x] T006 [US1] Verify DOM order in `frontend/src/shell/UserPanel.tsx`: upper `.user-panel-calls`, lower identity, Settings — Settings never inside the calls row (FR-002, FR-003, UPF-02–UPF-03)
- [x] T007 [US1] Confirm idle vs in-call control **visibility** unchanged (leave/screen share `Show` rules, etc.) in `frontend/src/shell/UserPanel.tsx` — placement only (FR-004, UPF-05, SC-005)
- [x] T008 [US1] Manually validate narrow sidebar: taller panel reflows channel list without overlay (FR-008; quickstart §6)

**Checkpoint**: Idle and in-call share the same two-row structure; icons do not jump beside the handle.

---

## Phase 4: User Story 2 - Current channel label between name and Settings (Priority: P1)

**Goal**: Read-only channel display name between name/status and Settings; live call channel wins; else open/selected; else empty.

**Independent Test**: Quickstart §1, §3–§5; SC-002–SC-004, SC-007; [contracts/panel-channel-label.md](./contracts/panel-channel-label.md).

### Implementation for User Story 2

- [x] T009 [US2] Derive open/selected channel **display name** (or `null`) in `frontend/src/shell/Sidebar.tsx` from `activeChannelId` + `channels()` and pass as prop into `UserPanel` (e.g. `openChannelName`) (research R3; PCL-02–PCL-03)
- [x] T010 [US2] Extend `UserPanel` props and compute label: `voice.live() ? voice.channelName() : openChannelName` in `frontend/src/shell/UserPanel.tsx` (FR-005–FR-006, PCL-01, PCL-06–PCL-07)
- [x] T011 [US2] Render non-interactive channel label (`span`, not button/link) between identity and Settings on the lower row in `frontend/src/shell/UserPanel.tsx` — name only, no mandatory `#` (FR-010, PCL-04–PCL-05)
- [x] T012 [US2] Style `.user-panel-channel` (or equivalent) in `frontend/src/styles/mesa-theme.css`: ellipsis truncation; must not crush handle below usable min or push Settings off (PCL-08, FR identity-row constraints)
- [x] T013 [P] [US2] Optional i18n `aria-label` for the channel context region in `frontend/src/i18n/catalogs/en.ts` + `frontend/src/i18n/catalogs/pt-BR.ts` if the label region needs an accessible name

**Checkpoint**: Label follows live-vs-open rules; click does nothing; hangup/browse-while-live behave per clarify.

---

## Phase 5: User Story 3 - Icon rules and account entry unchanged (Priority: P2)

**Goal**: Guardrail — visibility rules and account/Settings entry still work after layout + label.

**Independent Test**: Quickstart §1 (Settings/identity); SC-005; FR-007.

### Implementation for User Story 3

- [x] T014 [US3] Verify identity click and Settings still open `AccountMenu` / account path in `frontend/src/shell/UserPanel.tsx` with the new lower-row DOM (channel label outside identity button) (FR-007, UPF-07)
- [x] T015 [US3] Spot-check listen-only / disabled control appearance still on upper row in `frontend/src/shell/UserPanel.tsx` (edge cases in spec)

**Checkpoint**: Account entry and icon disable rules unchanged.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, manual quickstart, docs for implement handoff.

- [x] T016 Run `cd frontend && npx tsc --noEmit`
- [x] T017 Walk [quickstart.md](./quickstart.md) scenarios 1–6 against UPF-* / PCL-* contracts
- [x] T018 [P] Update `docs/daily/yyyy-mm-dd.md` Speckit implement subsection for 093 (use session calendar date on implement)
- [x] T019 [P] Update `CHANGELOG.md` `[Unreleased]` for 093 fixed/always-stacked panel + channel label
- [x] T020 Mark all tasks `[x]` in `specs/093-user-panel-fixed-layout/tasks.md` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** (blocks all stories) → **Phase 3 (US1 MVP)** → **Phase 4 (US2)** → **Phase 5 (US3)** → **Phase 6**
- US2 depends on permanent lower-row grid from Phase 2 / US1
- US3 is verification after US1+US2 DOM settle

### User Story Dependencies

- **US1**: After Phase 2 only
- **US2**: After US1 layout slot exists (T006–T007 recommended before T011)
- **US3**: After US1+US2

### Parallel Opportunities

- T005 CSS collapse can proceed alongside T002–T003 once class name is known
- T013 i18n parallel to T012
- T018 / T019 after T016–T017

---

## Parallel Example: User Story 2

```bash
# After T009–T011 structure exists:
Task: "Style .user-panel-channel in frontend/src/styles/mesa-theme.css"
Task: "Optional aria-label in frontend/src/i18n/catalogs/en.ts + pt-BR.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1–2: remove measure; always stack; collapse empty upper
2. Phase 3: confirm control placement
3. **STOP** — validate idle + in-call two-row layout (quickstart §2)

### Incremental Delivery

1. MVP = permanent stack (US1)
2. Add channel label (US2) → validate live vs open/selected
3. Guardrail pass (US3) + polish

### Notes

- Supersedes 084 dynamic stack; keep reflow + Settings-on-identity-row
- No backend tasks
- Label: `voice.live() ? voice.channelName() : openChannelName` only
