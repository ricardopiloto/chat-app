---
description: "Task list for Chrome Mesa — botões, composer, palco e membros"
---

# Tasks: Chrome Mesa — botões, composer, palco colapsado e membros

**Input**: Design documents from `/specs/008-shell-chrome-members/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Sem alterações Rust previstas.

**Organization**: Setup (tokens/prefs) → Foundational (shell state hooks) → US1/US2 (CSS independentes) → US3 (palco) → US4 (membros). US1–US2 podem correr em paralelo após Setup; US3/US4 após Foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`, `frontend/src/styles/`, `frontend/src/shell/`, `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/preferences/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tokens e preferências locais alinhados a [data-model.md](./data-model.md) / [research.md](./research.md).

- [X] T001 [P] Add `--radius-pill: 999px` (or equivalent) and document use for action `.btn` in `frontend/src/styles/mesa-theme.css` and/or `frontend/src/styles/nocturne.css` per [contracts/ui-chrome-stage-composer.md](./contracts/ui-chrome-stage-composer.md)
- [X] T002 [P] Add `readStageChannelsExpanded` / `writeStageChannelsExpanded` and optional `readMembersPanelOpen` / `writeMembersPanelOpen` in `frontend/src/preferences/uiPrefs.ts` (defaults: channels collapsed in stage; members panel closed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estado de chrome no shell — **bloqueia** US3 (palco) e US4 (membros). US1/US2 podem avançar em paralelo com esta fase se só tocarem CSS de botão/composer.

**⚠️ CRITICAL**: US3 e US4 MUST wait for this phase.

- [X] T003 Extend `AppShell` chrome state in `frontend/src/shell/AppShell.tsx`: `stageChannelsExpanded` signal (+ persist via T002); apply class e.g. `stage-channels-expanded` on `.shell` when stage + expanded; keep existing `mesa:stage-mode` on/off semantics
- [X] T004 Add members-panel chrome state in `frontend/src/shell/AppShell.tsx`: `membersPanelOpen` (+ optional persist); class e.g. `members-open` on `.shell`; expose toggle via custom event (e.g. `mesa:members-panel`) and/or Solid context so channel headers can open/close without owning the column
- [X] T005 [P] Stub CSS grid hooks for stage strip + members column (no final UX yet) in `frontend/src/styles/mesa-theme.css` — e.g. `.shell.stage-mode`, `.shell.stage-channels-expanded`, `.shell.members-open` — per [contracts/ui-chrome-stage-composer.md](./contracts/ui-chrome-stage-composer.md) / [contracts/members-panel.md](./contracts/members-panel.md)

**Checkpoint**: Shell can toggle classes for stage-expand and members-open; prefs round-trip; `tsc` clean.

---

## Phase 3: User Story 1 - Botões pílula (Priority: P1) 🎯 MVP

**Goal**: Botões de acção `.btn` / primary / secondary / ghost (chrome, voz, diálogos) com arredondamento pílula do protótipo.

**Independent Test**: [quickstart.md](./quickstart.md) §1 — Botões pílula.

### Implementation for User Story 1

- [X] T006 [US1] Set action-button `border-radius` to pill (`999px` / `var(--radius-pill)`) on `.btn` (and variants as needed) in `frontend/src/styles/nocturne.css` and/or override in `frontend/src/styles/mesa-theme.css` per [contracts/ui-chrome-stage-composer.md](./contracts/ui-chrome-stage-composer.md)
- [X] T007 [US1] Audit overrides (`.sidebar-actions .btn`, `.call-controls .btn`, `.auth-card .btn`, dialogs) in `frontend/src/styles/mesa-theme.css` — remove contradictory radii; keep rail avatars / channel list icons / video tiles non-pill if they are not action `.btn`s

**Checkpoint**: ≥10 action controls look pill-shaped; no mixed radii in the same button group.

---

## Phase 4: User Story 2 - Composer full width (Priority: P1)

**Goal**: `form.composer` ocupa a largura útil do pane (sem `max-width` 74ch).

**Independent Test**: [quickstart.md](./quickstart.md) §2 — Composer full width.

### Implementation for User Story 2

- [X] T008 [US2] Remove `max-width: calc(74ch + 48px)` (and any centering that shrinks the form) from `.composer` in `frontend/src/styles/mesa-theme.css`; keep padding aligned with `.text-scroll` / `.pane-header`
- [X] T009 [P] [US2] Confirm message list / `.text-measure` does not reintroduce a narrower composer parent in `frontend/src/styles/mesa-theme.css` and `frontend/src/pages/Channel.tsx` markup

**Checkpoint**: Viewport ≥1200px — composer width within ≤8px of message area (padding only).

---

## Phase 5: User Story 3 - Modo Palco colapsado (Priority: P1)

**Goal**: Rail visível; canais em faixa + «mostrar canais»; expandir ≠ sair do palco; desligar palco restaura layout.

**Independent Test**: [quickstart.md](./quickstart.md) §3 — Modo palco colapsado.

### Implementation for User Story 3

- [X] T010 [US3] Replace stage `display: none` on `.server-rail` / `.sidebar` with collapsed grid in `frontend/src/styles/mesa-theme.css` (rail ~68px stays; sidebar strip ~40–56px when stage + not expanded; ~238px when `stage-channels-expanded`) per [contracts/ui-chrome-stage-composer.md](./contracts/ui-chrome-stage-composer.md); update narrow/mobile stage rules in the same file
- [X] T011 [US3] Add «mostrar canais» / collapse affordance in `frontend/src/shell/Sidebar.tsx` (or thin strip chrome) that toggles `stageChannelsExpanded` via AppShell (T003) **without** dispatching stage off
- [X] T012 [US3] Ensure entering stage mode resets or respects collapsed default; exiting stage restores full chrome in `frontend/src/shell/AppShell.tsx` (and any VoiceChannel stage toggles remain on/off only)

**Checkpoint**: Stage on → rail visible + channel strip; expand channels stays in stage; stage off → normal grid.

---

## Phase 6: User Story 4 - Lista de membros à direita (Priority: P1)

**Goal**: Botão «Membros» no cabeçalho texto/voz; painel direito; refetch ao mudar servidor com painel aberto.

**Independent Test**: [quickstart.md](./quickstart.md) §4 — Membros.

### Implementation for User Story 4

- [X] T013 [P] [US4] Create `MembersPanel` in `frontend/src/components/MembersPanel.tsx` — fetch `GET /api/servers/{serverId}/members`, loading/empty/error copy per FR-008, list handles; props: `serverId`, `open` (or always mounted when open)
- [X] T014 [US4] Mount members column / overlay in `frontend/src/shell/AppShell.tsx` when `membersPanelOpen` — pass `selectedServerId`; on server change keep open and let panel refetch; style right column + narrow overlay in `frontend/src/styles/mesa-theme.css` per [contracts/members-panel.md](./contracts/members-panel.md)
- [X] T015 [P] [US4] Add «Membros» toggle (`aria-expanded`) to pane header in `frontend/src/pages/Channel.tsx` dispatching shell members toggle; hide/disable when no `server_id`
- [X] T016 [P] [US4] Add matching «Membros» toggle to pane header in `frontend/src/pages/VoiceChannel.tsx` (same pattern as text)
- [X] T017 [US4] Verify coexistence: stage mode + members open — main still usable; composer does not overlap members panel (`frontend/src/styles/mesa-theme.css` grid/flex)

**Checkpoint**: Text + voice headers open members; server switch keeps panel + updates list; non-owner can open.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação e limpeza transversal.

- [X] T018 [P] Run `cd frontend && npx tsc --noEmit` and fix any type errors from shell/members changes
- [X] T019 Execute manual scenarios in [quickstart.md](./quickstart.md) (buttons, composer, stage, members) and fix gaps
- [X] T020 [P] Spot-check DevTools: no CSS parse errors in Mesa theme; stage no longer uses `display: none` on `.server-rail`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **blocks US3, US4**
- **US1 / US2**: After Setup (CSS); can parallel Foundational if no AppShell conflicts
- **US3**: After Foundational (T003/T005)
- **US4**: After Foundational (T004/T005); benefits from US3 layout stable but independently testable
- **Polish**: After desired stories

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|--------|
| US1 Botões | Setup T001 | Independent of US2–US4 |
| US2 Composer | Setup | Independent CSS |
| US3 Palco | Foundational T003/T005 | Independent of members |
| US4 Membros | Foundational T004/T005 | Uses existing members API |

### Parallel Opportunities

- T001 ∥ T002
- T005 ∥ T003/T004 (CSS stubs vs shell wiring — coordinate class names)
- T006–T007 (US1) ∥ T008–T009 (US2) after Setup
- T013 ∥ T015 ∥ T016 after T004
- T018 ∥ T020 in Polish

### Within Each Story

- CSS tokens before visual audit
- Shell state before Sidebar/Channel wiring
- Panel component before mount + header toggles

---

## Parallel Example: After Setup

```bash
# US1 + US2 in parallel (CSS):
Task: "T006 [US1] Pill border-radius on .btn in nocturne.css / mesa-theme.css"
Task: "T008 [US2] Remove composer max-width in mesa-theme.css"

# Foundational in parallel where safe:
Task: "T003 AppShell stageChannelsExpanded"
Task: "T004 AppShell membersPanelOpen + event/context"
Task: "T005 [P] CSS grid stubs for stage + members"
```

## Parallel Example: User Story 4

```bash
Task: "T013 MembersPanel.tsx"
Task: "T015 Channel.tsx Membros button"
Task: "T016 VoiceChannel.tsx Membros button"
# Then T014 mount in AppShell + T017 layout coexistence
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 3 US1 (pill buttons)  
3. **STOP** — visual check vs protótipo  
4. Then US2 (quick CSS win) → US3 → US4  

### Incremental Delivery

1. Setup + Foundational  
2. US1 → demo chrome pílula  
3. US2 → composer full bleed  
4. US3 → stage collapse  
5. US4 → members panel  
6. Polish + quickstart  

### Suggested MVP scope

**US1** (botões pílula). Próximo incremento natural: **US2** (composer) no mesmo PR se pequeno.

---

## Notes

- No backend tasks unless `list_members` shape is insufficient (not expected).
- Do not hide `.server-rail` with `display: none` in stage-mode.
- Expanding channels MUST NOT set `stageMode = false`.
- Members button lives in **channel header**, not TopBar-only.
- [P] = different files / no incomplete deps; avoid simultaneous edits to the same CSS region without coordination.
