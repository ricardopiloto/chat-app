---
description: "Task list for bordas mais arredondadas em todo o sistema"
---

# Tasks: Bordas mais arredondadas em todo o sistema

**Input**: Design documents from `/specs/044-rounded-borders/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/radius-scale.md](./contracts/radius-scale.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: `cd frontend && npx tsc --noEmit` + checklist [quickstart.md](./quickstart.md) + grep residual em `mesa-theme.css`.

**Organization**: Setup (baseline grep) → Foundational (tokens nocturne) → US1 (hardcodes caixa shell/tema) → US2 (preservar pill/circle) → US3 (auth/voz + nocturne literais) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inventário dos raios actuais antes de editar.

- [x] T001 Capture baseline inventory of `border-radius` literals and `var(--radius-*)` usages in `frontend/src/styles/mesa-theme.css` and `frontend/src/styles/nocturne.css` (note counts of `6|8|10|12|14|16px`, `50%`, `999px`) for comparison after alignment
- [x] T002 [P] Confirm no conflicting theme redefinition of `--radius-sm|md|lg` under `[data-theme="light"]` / dark in `frontend/src/styles/nocturne.css` and `frontend/src/styles/mesa-theme.css` (FR-004)

**Checkpoint**: Baseline known; themes share radius tokens.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Actualizar a escala canónica — **blocks** all stories.

**⚠️ CRITICAL**: Do not mass-edit hardcodes until tokens match [contracts/radius-scale.md](./contracts/radius-scale.md).

- [x] T003 Set `--radius-sm: 8px`, `--radius-md: 14px`, `--radius-lg: 22px` in `frontend/src/styles/nocturne.css`; leave `--radius-pill: 999px` unchanged per [research.md](./research.md) R2 / [contracts/radius-scale.md](./contracts/radius-scale.md)
- [x] T004 Update any `calc(var(--radius-*))` or fallbacks like `var(--radius-md, 10px)` in `frontend/src/styles/nocturne.css` and `frontend/src/styles/mesa-theme.css` so fallbacks match the new md/lg targets (avoid stale `10px` defaults)

**Checkpoint**: Components already on `var(--radius-md|lg)` look rounder in shell; pills unchanged.

---

## Phase 3: User Story 1 — Interface visualmente mais suave (Priority: P1) 🎯 MVP

**Goal**: Painéis, botões caixa, inputs, menus e diálogos da shell com cantos moderado–forte via hardcodes alinhados.

**Independent Test**: Abrir shell autenticada (sidebar, canal texto, diálogo, user panel) — caixas claramente mais redondas vs baseline; tema escuro.

### Implementation for User Story 1

- [x] T005 [US1] Map box hardcodes `6px` / `8px` / `10px` in `frontend/src/styles/mesa-theme.css` to `var(--radius-sm)` or `var(--radius-md)` per [research.md](./research.md) R3 (compact controls → md; tiny chrome → sm)
- [x] T006 [US1] Map box hardcodes `12px` / `14px` / `16px` in `frontend/src/styles/mesa-theme.css` to `var(--radius-md)` or `var(--radius-lg)` per R3 (panels/dialogs/cards → lg; compact chips-as-box → md)
- [x] T007 [US1] Convert asymmetric box radii in `frontend/src/styles/mesa-theme.css` (e.g. `0 4px 4px 0`) to preserve zeros and use `var(--radius-sm|md)` on rounded sides only
- [x] T008 [US1] Spot-check shell selectors (sidebar, rail chrome boxes, composer/inputs, dialogs, floating menus, user panel) in `frontend/src/styles/mesa-theme.css` still use tokens or mapped values — no leftover sharp `6|8|10px` boxes in those areas

**Checkpoint**: US1 MVP — shell boxes rounder; ready for visual smoke.

---

## Phase 4: User Story 2 — Formas especiais preservadas (Priority: P1)

**Goal**: Avatars, server icons e pílulas continuam círculo/pílula; nenhum bump acidental.

**Independent Test**: Rail avatars + unread/voice pills + round icon buttons still fully round; only rectangular surfaces changed.

### Implementation for User Story 2

- [x] T009 [P] [US2] Audit `frontend/src/styles/mesa-theme.css`: ensure every intentional circle keeps `border-radius: 50%` (no conversion to `--radius-lg`)
- [x] T010 [P] [US2] Audit `frontend/src/styles/mesa-theme.css` and `frontend/src/styles/nocturne.css`: ensure pills keep `999px` or `var(--radius-pill)`; do not replace with `--radius-md|lg`
- [x] T011 [US2] Fix any regression from T005–T008 where a pill/circle rule was incorrectly retargeted to sm/md/lg in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Circles/pills visually identical in kind; boxes only gained radius.

---

## Phase 5: User Story 3 — Coerência em chamada e auth (Priority: P2)

**Goal**: Auth/convite e voz partilham o mesmo grau (já via tokens + hardcodes restantes no tema).

**Independent Test**: Auth form + voice pre-join/controls boxes match shell rounding; no vendor CSS edits.

### Implementation for User Story 3

- [x] T012 [US3] Align remaining box `border-radius` literals in auth/invite-related rules within `frontend/src/styles/mesa-theme.css` and `frontend/src/styles/nocturne.css` to sm/md/lg tokens
- [x] T013 [US3] Align remaining box radii in voice/stage/pre-join/call-control **box** rules in `frontend/src/styles/mesa-theme.css` (skip round call buttons / `50%` / pill)
- [x] T014 [P] [US3] Grep `frontend/src` for inline `borderRadius` / style `border-radius` on Mesa box UI; align only obvious product surfaces (skip LiveKit/vendor) or leave with note if none

**Checkpoint**: Auth + voz boxes match shell; vendors untouched.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação, docs de entrega.

- [x] T015 Run residual grep `border-radius:\s*(6|8|10)px` on `frontend/src/styles/mesa-theme.css`; eliminate or document justified leftovers in the PR/commit message
- [x] T016 [P] Run `cd frontend && npx tsc --noEmit` (expect clean; CSS-only change)
- [x] T017 Execute visual checklist in [quickstart.md](./quickstart.md) (dark + light): shell, text, menus, pills, voice, auth; confirm no content clip (FR-006)
- [x] T018 [P] Update `docs/daily/2026-09-06.md` with Speckit implement subsection for [044-rounded-borders](./spec.md)
- [x] T019 [P] Update `CHANGELOG.md` `[Unreleased]` (Changed) noting system-wide moderate–strong corner radius (044)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: After Setup — **blocks** US1–US3
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After US1 hardcode pass (audit/fix regressions); can overlap late US1 if careful
- **US3 (Phase 5)**: After Foundational; best after US1 mapping patterns established
- **Polish (Phase 6)**: After US1–US3

### User Story Dependencies

- **US1**: Tokens (T003–T004) → hardcode mapping
- **US2**: Depends on US1 edits existing (verify no pill/circle damage)
- **US3**: Same files as US1; sequential on `mesa-theme.css` preferred (avoid parallel conflict)

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T009 ∥ T010 (US2 audits)
- T014 ∥ T013 careful (different concerns; same file → prefer sequential on mesa-theme)
- T016 ∥ T018 ∥ T019 (Polish)

### Parallel Example: User Story 2

```bash
Task: "Audit 50% circles in mesa-theme.css"
Task: "Audit 999px / --radius-pill in mesa-theme.css + nocturne.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1–2: inventory + tokens 8/14/22
2. Phase 3: map shell box hardcodes
3. **STOP**: visual smoke shell dark theme
4. Then US2 → US3 → Polish

### Incremental Delivery

1. Tokens alone already improve tokenized components
2. US1 completes shell perception (MVP)
3. US2 locks shape semantics
4. US3 closes auth/voz gaps
5. Polish: grep, tsc, quickstart, daily, CHANGELOG

---

## Notes

- Prefer `var(--radius-*)` over new literals when 1:1 with sm/md/lg
- Never convert `50%` / `999px` / `--radius-pill` to box tokens
- Same radius values in light and dark
- No backend / no new dependencies
- After implement success: daily + CHANGELOG mandatory (T018–T019)
