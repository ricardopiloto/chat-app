---
description: "Task list for painel principal alinhado ao servidor seleccionado"
---

# Tasks: Painel principal alinhado ao servidor seleccionado

**Input**: Design documents from `/specs/041-server-scoped-pane/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/server-scoped-pane-ui.md](./contracts/server-scoped-pane-ui.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup (prefs + jokes) → Foundational (resolve + selectServer navigate) → US1 leave A’s pane → US2 open B’s channel + persist → US3 empty+joke → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/preferences/lastChannelByServer.ts`, `frontend/src/preferences/emptyServerJokes.ts`, `frontend/src/pages/EmptyServerPane.tsx`, `frontend/src/pages/ChannelRoute.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preferência de último canal e catálogo de piadas (sem wiring de navegação).

- [x] T001 [P] Add `frontend/src/preferences/lastChannelByServer.ts` with `readLastChannel(serverId)`, `writeLastChannel(serverId, channelId)`, `localStorage` key `mesa.lastChannelByServer` (JSON map) per [data-model.md](./data-model.md) / [research.md](./research.md) R4
- [x] T002 [P] Add `frontend/src/preferences/emptyServerJokes.ts` with ≥3 light PT-BR jokes and `pickEmptyServerJoke()` (random per call) per FR-005 / R5 — no offensive/political content

**Checkpoint**: Pref modules importable; no UI yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `resolveChannel` + `selectServer` navigation helper — **blocks** all stories.

**⚠️ CRITICAL**: Selecting a server MUST `navigate` (not only `setSelectedServerId`).

- [x] T003 Add `resolveChannelForServer(serverId, channels: Channel[]): Channel | null` (last valid → first text → first any) in `frontend/src/preferences/lastChannelByServer.ts` or small `frontend/src/shell/resolveServerChannel.ts` per FR-003 / R3
- [x] T004 Implement `selectServerAndNavigate(server, channels, navigate, onSelectServer)` flow in `frontend/src/shell/Sidebar.tsx`: set selected server; if 0 channels → `/servers/${id}`; else navigate to resolved `/channels/:id?server=&type=` per [contracts/server-scoped-pane-ui.md](./contracts/server-scoped-pane-ui.md) R2
- [x] T005 Wire `ServerRail` `onSelect` (and any other server-pick entry points in `Sidebar.tsx`) to use T004 instead of bare `onSelectServer` only

**Checkpoint**: Clicking another server changes the URL away from the previous server’s channel (or to empty route stub).

---

## Phase 3: User Story 1 - Trocar de servidor limpa o canal anterior (Priority: P1) 🎯 MVP

**Goal**: After selecting B, main pane no longer shows A’s channel content.

**Independent Test**: [quickstart.md](./quickstart.md) §1 — A→B pane is not A.

### Implementation for User Story 1

- [x] T006 [US1] Ensure `selectServerAndNavigate` always leaves `/channels/:idA` when selecting B (navigate to B’s target or empty) in `frontend/src/shell/Sidebar.tsx` — FR-001/FR-002
- [x] T007 [US1] Optional guard in `frontend/src/pages/ChannelRoute.tsx`: if loaded channel’s `server_id` ≠ query `server` (when both set), redirect via resolve for the query server so stale URLs cannot keep showing the wrong server — R6
- [x] T008 [US1] Confirm voice hangup is **not** triggered on server switch (no `hangup` in select path) — FR-008

**Checkpoint**: A→B never leaves A’s messages/stage as B’s main pane.

---

## Phase 4: User Story 2 - Servidor com canais abre canal de B (Priority: P1)

**Goal**: Auto-open resolved channel on B; remember last channel across visits and reload.

**Independent Test**: [quickstart.md](./quickstart.md) §2 — last channel + reload.

### Implementation for User Story 2

- [x] T009 [US2] On successful channel load in `frontend/src/pages/ChannelRoute.tsx`, call `writeLastChannel(ch.server_id, ch.id)`
- [x] T010 [US2] When clicking a channel link in `frontend/src/shell/Sidebar.tsx`, also `writeLastChannel` for that server (belt-and-suspenders with T009)
- [x] T011 [US2] Verify resolve uses persisted last channel when still in list (manual / code path) — FR-003/FR-009 / SC-005

**Checkpoint**: B→A→B and reload restore last channel on B.

---

## Phase 5: User Story 3 - Servidor sem canais: ecrã + piada (Priority: P1)

**Goal**: Blank main pane with random joke when server has zero channels.

**Independent Test**: [quickstart.md](./quickstart.md) §3 — blank + joke, not «Canal não encontrado».

### Implementation for User Story 3

- [x] T012 [US3] Create `frontend/src/pages/EmptyServerPane.tsx` — blank main layout + centered joke from `pickEmptyServerJoke()` on mount; `aria` friendly
- [x] T013 [US3] Register route `/servers/:serverId` → `EmptyServerPane` in `frontend/src/App.tsx` (inside authenticated shell like channels)
- [x] T014 [P] [US3] Add `.empty-server-pane` (or equivalent) styles in `frontend/src/styles/mesa-theme.css` — neutral blank, readable joke light/dark
- [x] T015 [US3] Ensure empty path never falls through to ChannelRoute «Canal não encontrado» for zero-channel servers — FR-004/SC-002
- [x] T016 [US3] After creating first channel on empty server (`createChannel` in `Sidebar.tsx`), navigate to that channel so joke pane disappears — FR-006 (likely already navigates; verify)

**Checkpoint**: Empty server shows joke; creating a channel leaves the joke view.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Voice coexistence, types, validation.

- [x] T017 [P] Re-check quickstart §4 (call on A, select B — pane B, call may continue) — FR-008
- [x] T018 Run `cd frontend && npx tsc --noEmit`; fix types
- [x] T019 Manual pass full [quickstart.md](./quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after Setup (T001 for resolve); **blocks** US1–US3
- **Phase 3 (US1)** → after Foundational navigate
- **Phase 4 (US2)** → after Foundational (+ T001 write); can parallel late US1
- **Phase 5 (US3)** → after Foundational empty navigate target
- **Phase 6** → after US1–US3

### User Story Dependencies

- **US1** needs navigate-away (Foundational)
- **US2** needs resolve + writeLastChannel
- **US3** needs empty route + jokes (T002)

### Parallel Opportunities

- T001 ∥ T002
- T012–T014 (US3 UI) can start once T004 empty path exists
- T017 ∥ polish docs

### Parallel example

```text
T001 ∥ T002
T003 → T004 → T005
T006 → T007 → T008
T009 → T010 → T011
T012 → T013 → T014 → T015 → T016
T017 ∥ T018 → T019
```

---

## Implementation Strategy

### MVP

1. Phase 1–3 (T001–T008) — switching servers leaves A’s pane  
2. Add US2 persistence + US3 empty joke  

### Incremental delivery

1. Prefs + jokes  
2. selectServer navigate  
3. US1 clear  
4. US2 last channel  
5. US3 empty pane  
6. `tsc` + quickstart  

### Notes

- Frontend-only.  
- Do not hang up on server switch.  
- Joke list curated in `emptyServerJokes.ts`.

---

## Task summary

| Metric | Count |
|--------|------:|
| **Total tasks** | 19 |
| **US1** | 3 (T006–T008) |
| **US2** | 3 (T009–T011) |
| **US3** | 5 (T012–T016) |
| **Setup + Foundational + Polish** | 8 |
| **Parallelizable marked [P]** | T001, T002, T014, T017 |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.

**Suggested MVP**: Phase 1–3 through T008 (server switch clears foreign pane).

**Next**: `/speckit-implement`

---

## Phase 7: Convergence

**Purpose**: Close gaps vs US4 / FR-010–012 (selection chrome vs main pane) after implement of T001–T019.

- [x] T020 CRITICAL Fix server-rail selection so the highlighted server matches the current route after AppShell remount (`/servers/:serverId` or `/channels/:id?server=`): do not lose `selectedServerId` or fall back to `servers[0]` for rail display — `frontend/src/shell/AppShell.tsx`, `frontend/src/shell/Sidebar.tsx` / `ServerRail` per FR-010, US4/AC1, SC-006 (`partial` / remount race)
- [x] T021 CRITICAL Stop Sidebar defaulting `onSelectServer(list[0])` / `selected()` fallback to first server when URL already identifies the target server (empty or `?server=`) so rail cannot re-highlight the previous/first server while EmptyServerPane shows another — `frontend/src/shell/Sidebar.tsx` per FR-010, FR-012, US4/AC2 (`contradicts`)
- [x] T022 Ensure channel-list `.active` never marks a channel from another server: on `/servers/:serverId` no channel id in params → no active item; when selected server is S, only highlight channels belonging to S — `frontend/src/shell/Sidebar.tsx` per FR-011, SC-006 (`partial`)
- [x] T023 Re-validate quickstart + US4 manually (empty B: rail=B, no stale A channel active; A→B with channels: rail+channel highlight = B) and `cd frontend && npx tsc --noEmit` per SC-006, SC-007 (`missing` validation)
