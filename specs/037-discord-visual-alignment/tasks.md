---
description: "Task list for alinhamento visual com Discord (037)"
---

# Tasks: Alinhamento Visual com Discord

**Input**: Design documents from `/specs/037-discord-visual-alignment/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Contract BE para read-state / activity ([plan.md](./plan.md)); `tsc --noEmit`; validação visual [quickstart.md](./quickstart.md). Sem TDD FE.

**Organization**: Setup → Foundational (tokens CSS partilhados) → US1 tipografia → US2 call glyphs + unread/voz rail → US3 elevação → US4 motion → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/`, `frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar assets e mapear superfícies tocadas.

- [X] T001 Create `frontend/public/fonts/` and add Inter woff2 files (weights 400/500/600/700) plus license/NOTICE as required by OFL per [research.md](./research.md)
- [X] T002 [P] Inventory floating-menu selectors (`.context-menu`, `.account-menu-panel`, `.topbar-notif-panel`, `.camera-blur-menu-panel`, related popovers) and call-control icon imports in `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/shell/ServerRail.tsx` per [contracts/](./contracts/)

**Checkpoint**: Fontes no repo; alvos CSS/TS claros.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens CSS partilhados — **blocks** todas as user stories de estilo.

**⚠️ CRITICAL**: Sem tokens de fonte/elevação, US1/US3 colidem em `nocturne.css`.

- [X] T003 Define `--font-body` / `--font-heading` Inter stack placeholders and weight-related heading helpers in `frontend/src/styles/nocturne.css` per [contracts/typography-elevation-motion.md](./contracts/typography-elevation-motion.md) (full `@font-face` wiring lands in US1)
- [X] T004 [P] Add `--shadow-float` for `:root` (dark) and `[data-theme="light"]` in `frontend/src/styles/nocturne.css` (or light overrides in `frontend/src/styles/mesa-theme.css`) per FR-007 / research §5 — menus still on old shadows until US3

**Checkpoint**: Tokens existem; app ainda visualmente quase igual até US1/US3.

---

## Phase 3: User Story 1 - Identidade tipográfica consistente (Priority: P1) 🎯 MVP

**Goal**: Inter self-hosted + hierarquia de pesos em toda a UI; fallback sem FOIT.

**Independent Test**: [quickstart.md](./quickstart.md) §1 Tipografia; DevTools mostra Inter em título e corpo.

### Implementation for User Story 1

- [X] T005 [US1] Add `@font-face` rules (`font-display: swap`) for Inter weights in `frontend/src/styles/nocturne.css` (or dedicated `frontend/src/styles/fonts.css` imported from `frontend/src/styles.css`) pointing at `frontend/public/fonts/`
- [X] T006 [P] [US1] Optionally preload primary woff2 in `frontend/index.html` without blocking render
- [X] T007 [US1] Point `--font-body` and `--font-heading` at `"Inter", system-ui, sans-serif` and ensure `.app` / headings use intentional weights (body 400–500, titles 600–700) in `frontend/src/styles/nocturne.css` and `frontend/src/styles/mesa-theme.css` (FR-001, FR-002)
- [X] T008 [US1] Spot-check auth, settings, chat, voice panes inherit tokens (fix overrides of `system-ui` only) across `frontend/src/`

**Checkpoint**: SC-001 informal — mesma família independente do OS; texto legível se fonte atrasar (`swap`).

---

## Phase 4: User Story 2 - Controles de chamada e navegação com afordância (Priority: P2)

**Goal**: Glifos filled nos 3 call-controls; unread persistente + pill; voz na rail coexistente; morph hover da rail.

**Independent Test**: [quickstart.md](./quickstart.md) §§2–4; contract read-state.

### Tests for User Story 2

- [X] T009 [P] [US2] Add contract tests for mark-read + `has_unread` / `has_voice` aggregation in `backend/tests/contract/` (new or extend existing) per [contracts/channel-read-state-api.md](./contracts/channel-read-state-api.md)

### Implementation for User Story 2

- [X] T010 [US2] Create migration `backend/migrations/0010_channel_read_state.sql` for `channel_read_state` per [data-model.md](./data-model.md)
- [X] T011 [US2] Implement `backend/src/db/read_state.rs` (upsert `last_read_at`, channel unread predicate, aggregate `has_unread` per server) and wire module exports
- [X] T012 [US2] Implement `PUT /api/channels/{channel_id}/read` in `backend/src/api/messages.rs` (or dedicated handler) + route in `backend/src/api/mod.rs` (403/404 rules per contract)
- [X] T013 [US2] Extend `GET /api/servers` (or add `GET /api/me/server-activity`) with `has_unread` + `has_voice` in `backend/src/api/servers.rs` / `backend/src/db/server.rs` using `voice_occupant` EXISTS per research §3
- [X] T014 [P] [US2] Add filled glyph variants for mic / camera / hangup in `frontend/src/components/icons/IconMic.tsx`, `IconCamera.tsx`, `IconPhoneHangup.tsx` per [contracts/call-control-filled-glyphs.md](./contracts/call-control-filled-glyphs.md) (keep stroke defaults for rest of catalog)
- [X] T015 [US2] Switch call-controls in `frontend/src/pages/VoiceChannel.tsx` to filled variants; preserve button chrome / blur split / Sair label; distinct disabled vs off styles
- [X] T016 [US2] Extend server list client types + fetch in `frontend/src/api/client.ts` (or equivalent) for `has_unread` / `has_voice`
- [X] T017 [US2] Update `frontend/src/shell/ServerRail.tsx` + CSS in `frontend/src/styles/mesa-theme.css` for unread pill (no count) and distinct voice indicator; both visible when set ([contracts/server-rail-activity.md](./contracts/server-rail-activity.md))
- [X] T018 [US2] Add Discord-like `border-radius` morph + transition on `.server-rail-btn` hover/active in `frontend/src/styles/mesa-theme.css` (FR-005); respect reduced-motion hook added in US4 if already present, else temporary transition only
- [X] T019 [US2] Call mark-read when opening/viewing a text channel in `frontend/src/pages/ChannelRoute.tsx` (and/or message list mount); on send, mark-read same channel; refresh rail flags from API and/or WS `message.new` / `voice.occupancy` in `frontend/src/App.tsx` / `frontend/src/shell/Sidebar.tsx`
- [X] T020 [US2] Align or stop conflicting unread semantics in `frontend/src/preferences/notifications.ts` / TopBar so rail uses BE truth (topbar may keep session bell or bridge later — document choice in code comment if dual systems remain briefly)

**Checkpoint**: SC-006 + FR-013; glifos filled; morph perceptível.

---

## Phase 5: User Story 3 - Elevação visual consistente (Priority: P3)

**Goal**: Um `--shadow-float` tema-aware em todos os menus flutuantes do spec.

**Independent Test**: [quickstart.md](./quickstart.md) §5.

### Implementation for User Story 3

- [X] T021 [US3] Tune `--shadow-float` light/dark recipes for readable depth in `frontend/src/styles/nocturne.css` / `mesa-theme.css` (FR-006, FR-007)
- [X] T022 [US3] Replace ad hoc `box-shadow` on `.context-menu`, `.account-menu-panel`, `.topbar-notif-panel`, `.camera-blur-menu-panel` (and equivalent floaters inventoried in T002) with `var(--shadow-float)` in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: SC-003 — mesma sombra entre menus, distinta por tema.

---

## Phase 6: User Story 4 - Abertura de menus com transição suave (Priority: P4)

**Goal**: Entrada breve de menus; reduced-motion; sem regressão speaking/e2ee.

**Independent Test**: [quickstart.md](./quickstart.md) §6.

### Implementation for User Story 4

- [X] T023 [US4] Add shared float-enter animation/class (~120–160 ms) and apply to floating menus in `frontend/src/styles/mesa-theme.css` (FR-008)
- [X] T024 [US4] Expand `@media (prefers-reduced-motion: reduce)` to suppress **new** menu enter + rail morph transitions in `frontend/src/styles/mesa-theme.css` (FR-009); leave speaking/e2ee keyframes behavior unchanged (FR-010)
- [X] T025 [US4] Verify rapid open/close does not leave menus stuck mid-animation (CSS `animation-fill` / unmount) for context/account/notif/blur menus

**Checkpoint**: Menus animam; reduced-motion ok; speaking/e2ee iguais.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Validação e docs.

- [X] T026 [P] Run `cd backend && cargo test --test contract` for read-state/activity; fix failures
- [X] T027 [P] Run `cd frontend && ./node_modules/.bin/tsc --noEmit` (or `npx tsc --noEmit`); fix regressions
- [X] T028 Execute [quickstart.md](./quickstart.md) checklist §§1–6; note any manual skips
- [X] T029 [P] Update `CHANGELOG.md` `[Unreleased]` and `docs/daily/yyyy-mm-dd.md` when implement completes (per workspace rule)

**Checkpoint**: Feature pronta para merge/demo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: imediato
- **Foundational (Phase 2)**: após Setup — **blocks** US1–US4
- **US1 (P1)**: após Phase 2 — MVP tipografia
- **US2 (P2)**: após Phase 2 — pode paralelizar com US1/US3/US4 se ficheiros distintos; BE T010–T013 antes de FE rail T016–T019
- **US3 (P3)**: após T004; idealmente após T002 inventory
- **US4 (P4)**: após menus existem; coordenar reduced-motion com T018
- **Polish**: após stories desejadas

### User Story Dependencies

- **US1**: independente (só tipografia)
- **US2**: independente de US1 visualmente; precisa BE read-state
- **US3**: independente; partilha `--shadow-float` de T004
- **US4**: independente; não alterar animações 033/036/e2ee

### Parallel Opportunities

- T001 ∥ T002
- T003 ∥ T004
- T006 ∥ T005 (após fonts)
- T009 ∥ T014 (tests vs icons) após foundation
- T014 ∥ T010–T011 (icons vs migration) 
- T021–T022 ∥ late US2 FE se owners diferentes
- T026 ∥ T027

---

## Parallel Example: User Story 2

```bash
# Após T010–T011:
Task: "Contract tests in backend/tests/contract/…"
Task: "Filled glyphs in IconMic.tsx / IconCamera.tsx / IconPhoneHangup.tsx"

# Após API activity:
Task: "ServerRail unread+voice UI"
Task: "VoiceChannel filled call-controls"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1–2 → tokens
2. Phase 3 US1 → Inter live
3. **STOP** — validar tipografia
4. Depois US2 (maior fatia: unread BE)

### Incremental Delivery

1. US1 tipografia
2. US2 glyphs + rail activity
3. US3 elevação
4. US4 motion
5. Polish / changelog / daily

### Parallel Team Strategy

- A: US1 fonts
- B: US2 BE read-state + contracts
- C: US2 icons + US3/US4 CSS (evitar conflito em `mesa-theme.css` — sequenciar merges CSS)

---

## Notes

- Clarificações: unread real; qualquer msg de texto; pill sem número; unread∥voz; glifos filled / chrome intacto
- Não alterar `#161826` nem roles/cores por user
- Todas as tasks usam checkbox + ID + paths; stories com [USn]
- Format validation: OK
