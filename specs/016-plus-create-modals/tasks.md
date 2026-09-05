---
description: "Task list for Modais de criação (+) alinhados ao tema"
---

# Tasks: Modais de criação (+) alinhados ao tema

**Input**: Design documents from `/specs/016-plus-create-modals/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Backend intocado (FR-006).

**Organization**: Setup (audit CSS) → Foundational (Portal sob `.app`) → US1 look Mesa criar canal (P1, MVP) → US2 tema ao vivo (P1) → US3 criar servidor (P2) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/Dialog.tsx`, `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/src/theme/theme.ts`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/shell/AppShell.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar pontos de alteração e estado actual dos estilos Dialog/input.

- [X] T001 [P] Audit `.dialog*`, `.input`, `.field`, `.error` in `frontend/src/styles/nocturne.css` and light overrides in `frontend/src/styles/mesa-theme.css`; note gaps vs [contracts/dialog-surface.md](./contracts/dialog-surface.md) and [contracts/form-controls-theme.md](./contracts/form-controls-theme.md)
- [X] T002 [P] Confirm create-channel and create-server Dialog markup in `frontend/src/shell/Sidebar.tsx` already uses `.field` / `.input` / `.btn*` / `.error` (list any missing classes for US1/US3)

**Checkpoint**: Gaps de CSS e markup documentados mentalmente; sem código de feature ainda obrigatório.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Herança de tema no Dialog — **bloqueia US2** e a aceitação «tema no modal»; também desbloqueia look correcto no tema claro para US1/US3.

**⚠️ CRITICAL**: User stories de tema (e validação light) MUST wait for Portal mount (ou equivalente documentado em [research.md](./research.md)).

- [X] T003 Mount Solid `Portal` under `.app` in `frontend/src/components/Dialog.tsx` (e.g. `mount={document.querySelector(".app") ?? document.body}` or resolve after `AppShell` mounts) so dialog inherits `.app[data-theme]` CSS variables per [research.md](./research.md) and [contracts/dialog-surface.md](./contracts/dialog-surface.md)
- [X] T004 If T003 alone is insufficient (e.g. Dialog open before `.app` exists on auth pages), mirror `data-theme` onto `document.documentElement` in `applyTheme` in `frontend/src/theme/theme.ts` and ensure light token overrides remain reachable — only as needed fallback per [research.md](./research.md)

**Checkpoint**: Com tema claro no shell, abrir qualquer Dialog mostra tokens light (não `:root` escuro preso). Trocar tema com Dialog aberto actualiza variáveis CSS no overlay.

---

## Phase 3: User Story 1 - Modal de criar canal com o look da Mesa (Priority: P1) 🎯 MVP

**Goal**: Overlay + painel + título + campos + botões dos modais criar canal texto/voz alinhados ao sistema visual Mesa (não formulário genérico).

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T005 [US1] Restyle `.dialog-backdrop`, `.dialog`, `.dialog-title`, `.dialog-body`, `.dialog-actions` in `frontend/src/styles/nocturne.css` to Mesa surfaces (`--color-surface` / elev, `--radius-lg`, `--shadow-lg`, scrim theme-aware, heading typography) per [contracts/dialog-surface.md](./contracts/dialog-surface.md) and [data-model.md](./data-model.md)
- [X] T006 [P] [US1] Align shared `.input`, `.field > label`, and `.error` (if contrast gaps) in `frontend/src/styles/nocturne.css` and/or light tweaks in `frontend/src/styles/mesa-theme.css` to tokens (`--color-text`, surface/divider, accent focus) per [contracts/form-controls-theme.md](./contracts/form-controls-theme.md) (FR-005, FR-010)
- [X] T007 [US1] Apply any missing classes from T002 on the create-channel form in `frontend/src/shell/Sidebar.tsx` (nome, custody/ack if present, Cancelar/Criar) — **no new fields**, no API changes (FR-004, FR-009)
- [X] T008 [US1] Ensure dialog remains usable on narrow viewports (scrollable body / compact padding) via CSS on `.dialog` / `.dialog-body` in `frontend/src/styles/nocturne.css` (edge case)

**Checkpoint**: [quickstart.md](./quickstart.md) §1 passa em tema escuro; criar canal texto/voz visualmente Mesa.

---

## Phase 4: User Story 2 - Modal respeita o tema claro/escuro (Priority: P1)

**Goal**: Modais de criar canal legíveis em claro e escuro; **actualização ao vivo** ao alternar tema na topbar com o modal aberto.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T009 [US2] Verify/fix light-theme contrast for dialog + inputs under `.app[data-theme="light"]` in `frontend/src/styles/mesa-theme.css` (scrim, surface, text, borders, `.error`) so create-channel Dialog is readable in light mode per FR-002 / FR-008
- [X] T010 [US2] Confirm `applyTheme` in `frontend/src/theme/theme.ts` (and TopBar toggle from 013) updates the same root that Dialog inherits — no remount required for theme flip; adjust only if live update fails after T003–T004
- [X] T011 [US2] Smoke-check create-channel Dialog: open → toggle theme → open again in both themes; fix residual hardcoded colors in dialog/input CSS if any remain in `frontend/src/styles/nocturne.css` / `mesa-theme.css`

**Checkpoint**: [quickstart.md](./quickstart.md) §2 e SC-005 (tema ao vivo) passam.

---

## Phase 5: User Story 3 - Criar servidor via + com o mesmo tratamento (Priority: P2)

**Goal**: Modal «Criar servidor» (rail +) na mesma família visual/tema que criar canal.

**Independent Test**: [quickstart.md](./quickstart.md) §3.

### Implementation for User Story 3

- [X] T012 [US3] Apply any missing form classes from T002 on the create-server Dialog/form in `frontend/src/shell/Sidebar.tsx` (nome, custody block, Cancelar/Criar) — no new fields (FR-003, FR-004)
- [X] T013 [US3] Polish create-server-only chrome if needed (e.g. `.custody-block`, `.key-display`, `.check-line` contrast in both themes) in `frontend/src/styles/mesa-theme.css` or `nocturne.css` so they match Dialog/input tokens — without changing custody/E2EE flow

**Checkpoint**: [quickstart.md](./quickstart.md) §3 passa; parity visual com criar canal.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Acessibilidade leve, validação e docs pós-implement.

- [X] T014 [P] Add Escape-to-close `keydown` listener on open Dialog in `frontend/src/components/Dialog.tsx` (spec edge case) without changing create submit flows
- [X] T015 [P] Run `cd frontend && npx tsc --noEmit` and fix type errors from Dialog/theme changes
- [X] T016 Execute [quickstart.md](./quickstart.md) §1–§4 (visual + create smoke) and fix gaps
- [X] T017 [P] Grep to ensure no accidental backend changes under `backend/` for this feature
- [X] T018 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)** → **Foundational (T003–T004)** → **US1 (T005–T008)** → **US2 (T009–T011)** → **US3 (T012–T013)** → **Polish**
- US1 CSS can start after T003 (light theme needs inheritance); prefer T003 before claiming US1 done in light mode
- US2 depends on Foundational; refining light contrast after US1 dialog CSS is ideal
- US3 inherits Dialog/input from US1/US2; mostly markup/custody chrome polish

### User Story Dependencies

```text
Foundational (Portal under .app ± documentElement theme)
    ├── US1 Create-channel Mesa look (MVP) — dialog + input CSS + Sidebar channel form
    ├── US2 Live light/dark theme — needs Foundational; polish mesa-theme contrast
    └── US3 Create-server parity — same Dialog; Sidebar server form + custody chrome
```

### Within Each User Story

- Shared Dialog CSS before Sidebar class fixes
- Theme inheritance before claiming light-mode acceptance
- No new API fields; presentation only

### Parallel Opportunities

- T001 ∥ T002 (audit)
- T005 then T006 can overlap if careful (same CSS files — prefer sequential or one owner)
- T006 [P] marked parallel to T005 only if different sections / one editor
- T014 ∥ T015 ∥ T017 in Polish
- US3 after US1/US2 CSS settles (same Dialog component)

---

## Parallel Example: User Story 1

```bash
# After Foundational (T003):
Task: "Restyle .dialog* in frontend/src/styles/nocturne.css"
Task: "Align .input / .field / .error tokens in nocturne.css / mesa-theme.css"
# Then:
Task: "Fix create-channel classes in frontend/src/shell/Sidebar.tsx if missing"
```

---

## Parallel Example: Foundational

```bash
Task: "Portal mount under .app in frontend/src/components/Dialog.tsx"
# Only if needed:
Task: "Mirror data-theme on documentElement in frontend/src/theme/theme.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup T001–T002
2. Foundational T003 (Portal) — required even for MVP light look
3. US1 T005–T008 — create channel Mesa look
4. **STOP and VALIDATE**: quickstart §1
5. Then US2 (live theme) → US3 (server) → Polish

### Incremental Delivery

1. Setup + Foundational → theme inheritance works
2. US1 → create channel looks Mesa (MVP)
3. US2 → live light/dark on open modal
4. US3 → create server parity
5. Polish → Escape, tsc, quickstart, daily/CHANGELOG

### Parallel Team Strategy

- Dev A: T003 + US1 dialog CSS
- Dev B: US1 input tokens + Sidebar channel form (after T002)
- After US1: Dev A US2, Dev B US3

---

## Notes

- [P] = different files / no incomplete deps
- Aceitação focada em «+»; outros Dialogs herdam estilo sem trabalho extra de aceitação
- Não redesenhar logout/invite/E2EE copy — só herança do Dialog partilhado
- FR-006: zero backend
- Commit after each logical group if user requests commits
