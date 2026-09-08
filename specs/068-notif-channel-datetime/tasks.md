---
description: "Task list for Notificações nome + data/hora (068)"
---

# Tasks: Notificações com nome do canal e data/hora

**Input**: Design documents from `/specs/068-notif-channel-datetime/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–F; `cd frontend && npx tsc --noEmit`. FE-only (no backend contract tests).

**Organization**: Setup → Foundational (format helper + name cache) → US1 durable name+when → US2 Hoje/Ontem/short date → US3 click unchanged → US4 session name-only → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/TopBar.tsx`, `frontend/src/lib/notifFormat.ts`, `frontend/src/lib/daySeparators.ts`, `frontend/src/styles/mesa-theme.css`, `frontend/src/api/client.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current notif item copy.

- [X] T001 Confirm `.specify/feature.json` → `specs/068-notif-channel-datetime` and skim durable/session list rendering in `frontend/src/shell/TopBar.tsx` (`notifKindLabel`, `canal {id.slice…}`, session `Canal {id…}`) against [research.md](./research.md) R1

**Checkpoint**: Know exact strings to replace and click handlers to preserve.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure format helpers + channel-name resolve/cache utilities — **blocks** list wiring.

**⚠️ CRITICAL**: Do not change TopBar item markup until helpers exist.

- [X] T002 Add `formatNotifWhen(iso, now?)` in `frontend/src/lib/notifFormat.ts` per [data-model.md](./data-model.md) / [contracts/notif-list-labels.md](./contracts/notif-list-labels.md) (`Hoje HH:MM` / `Ontem HH:MM` / `DD mmm HH:MM`); reuse `civilDayKey` from `frontend/src/lib/daySeparators.ts` where practical
- [X] T003 [P] Add `channelDisplayName(name | null | undefined)` fallback «Canal indisponível» (no long UUID) in `frontend/src/lib/notifFormat.ts` (FR-005)
- [X] T004 [P] Add `.topbar-notif-when` (and optional name ellipsis) styles in `frontend/src/styles/mesa-theme.css` for one-line secondary time ([research.md](./research.md) R4)

**Checkpoint**: Helpers + CSS ready; TopBar still shows old labels.

---

## Phase 3: User Story 1 - Nome + momento na lista durável (Priority: P1) 🎯 MVP

**Goal**: Durable notif rows show channel **name** + when on one line; no type label / UUID.

**Independent Test**: [quickstart.md](./quickstart.md) A + C.

### Implementation for User Story 1

- [X] T005 [US1] In `frontend/src/shell/TopBar.tsx`, add channel-name cache (`Record`/`Map`) and resolve unique `channel_id`s via `api<Channel>(\`/api/channels/${id}\`)` with in-flight dedupe; on failure store unresolved ([research.md](./research.md) R2)
- [X] T006 [US1] Replace durable item link text with one-line `{channelName}` + `{whenLabel}` using cache + `formatNotifWhen(n.created_at)`; remove `notifKindLabel` / `canal {slice}` from the item line per [contracts/notif-list-labels.md](./contracts/notif-list-labels.md)
- [X] T007 [US1] Trigger name resolve when durable list loads / updates and when panel opens in `frontend/src/shell/TopBar.tsx`

**Checkpoint**: Durable items show name + time; no Menção/Resposta or uuid8 on the row.

---

## Phase 4: User Story 2 - Formato Hoje / Ontem / data curta (Priority: P1)

**Goal**: `whenLabel` follows local civil-day rules correctly.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [X] T008 [US2] Harden `formatNotifWhen` in `frontend/src/lib/notifFormat.ts` for today/yesterday/other-day + invalid ISO (empty or «—», never raw UTC dump)
- [X] T009 [US2] Spot-check TopBar durable rows against local clock cases (or temporary fixture times) in `frontend/src/shell/TopBar.tsx` usage — confirm PT short month style matches product language

**Checkpoint**: Hoje/Ontem/short date labels correct in local TZ.

---

## Phase 5: User Story 3 - Clique inalterado (Priority: P2)

**Goal**: Navigation / mark-read / href unchanged after label rewrite.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 3

- [X] T010 [US3] Verify `notifHref` + `onDurableNotifClick` / `markNotificationRead` paths in `frontend/src/shell/TopBar.tsx` still run on click with new markup (spans inside `<A>` ok); no new confirm steps (FR-004)

**Checkpoint**: Click still deep-links and marks read.

---

## Phase 6: User Story 4 - Sessão: só nome do canal (Priority: P2)

**Goal**: Session unseen rows show channel name only (no day/time).

**Independent Test**: [quickstart.md](./quickstart.md) E (+ F if possible).

### Implementation for User Story 4

- [X] T011 [US4] Include `unseenChannelIds()` in name-resolve batch in `frontend/src/shell/TopBar.tsx`
- [X] T012 [US4] Replace session item text `Canal {id.slice…}` with resolved `{channelName}` only (no `formatNotifWhen`) per [contracts/notif-list-labels.md](./contracts/notif-list-labels.md) FR-007

**Checkpoint**: Session section shows names; no invented timestamps.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and docs on implement.

- [X] T013 Run `cd frontend && npx tsc --noEmit` and fix errors from `notifFormat` / TopBar
- [X] T014 [P] Smoke [quickstart.md](./quickstart.md) A–F manually
- [X] T015 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when `/speckit-implement` completes

**Checkpoint**: Feature ready for implement completion report.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1–US4
- **US1 (Phase 3)**: After Foundational — MVP (name + when wired)
- **US2 (Phase 4)**: After T002; can refine in parallel with late US1 polish
- **US3 (Phase 5)**: After US1 markup change
- **US4 (Phase 6)**: After T005 cache exists; can follow US1 closely
- **Polish (Phase 7)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: Foundational — MVP
- **US2 (P1)**: Format helper (T002/T008); display already on US1
- **US3 (P2)**: US1 link structure
- **US4 (P2)**: Shared name cache from US1

### Parallel Opportunities

- T002 format ∥ T003 fallback ∥ T004 CSS  
- After T005: T006 durable labels and T011/T012 session names can proceed closely  
- T014 quickstart ∥ T015 docs (on implement)

### Parallel Example: Foundational

```bash
Task: "Add formatNotifWhen in frontend/src/lib/notifFormat.ts"
Task: "Add channelDisplayName fallback in frontend/src/lib/notifFormat.ts"
Task: "Add .topbar-notif-when in frontend/src/styles/mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (US1 + basic when)

1. Phase 1–2 → helpers + CSS  
2. Phase 3 US1 → TopBar durable labels + name cache  
3. **STOP** — validate quickstart A/C  

### Incremental Delivery

1. US1 name + when  
2. US2 format hardening  
3. US3 click verify  
4. US4 session names  
5. Polish + tsc + daily/CHANGELOG on implement  

### Suggested MVP scope

**US1** (T001–T007) — durable rows readable. Include working `formatNotifWhen` from T002 so when is not blank.

---

## Notes

- FE-only; no migrations / `cargo test` for Done  
- Keep section headings «Menções e respostas» / «Canais com mensagens novas»  
- Do not invent timestamps for session unseen  
- Format validation: all tasks use `- [ ]`, `Tnnn`, optional `[P]`, story `[USn]` on story phases, concrete paths
