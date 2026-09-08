---
description: "Task list for Logo Mesa na topbar"
---

# Tasks: Logo Mesa na topbar

**Input**: Design documents from `/specs/051-topbar-logo-image/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/topbar-logo.md](./contracts/topbar-logo.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: [quickstart.md](./quickstart.md) A–D + `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Organization**: Setup → Foundational (asset + CSS mark) → US1 topbar → US2 temas → US3 auth → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`imgs/logo.png`, `frontend/public/mesa-logo.png`, `frontend/src/shell/TopBar.tsx`, `frontend/src/components/AuthShell.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar feature Speckit e baseline mark sólido.

- [X] T001 Confirm `.specify/feature.json` points at `specs/051-topbar-logo-image` and skim current `.topbar-brand` / `.topbar-mark` in `frontend/src/shell/TopBar.tsx`, `frontend/src/components/AuthShell.tsx`, and `.topbar-mark` rules in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Baseline understood; feature dir correcto.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Asset servido + estilos base do mark — **bloqueia** US1–US3.

**⚠️ CRITICAL**: Sem `/mesa-logo.png` a UI não cumpre o contrato.

- [X] T002 Copy `imgs/logo.png` to `frontend/public/mesa-logo.png` (stable URL `/mesa-logo.png` per [research.md](./research.md) R1 / [contracts/topbar-logo.md](./contracts/topbar-logo.md))
- [X] T003 Update `.topbar-mark` (and related) in `frontend/src/styles/mesa-theme.css`: size ~22px (auth via `.auth-mark` may be larger), `border-radius`, `object-fit: cover` (or contain), remove solid `background: var(--color-accent)` as the sole brand fill (FR-004 / R3)

**Checkpoint**: Asset 200 em `/mesa-logo.png`; CSS pronto para `<img class="topbar-mark">`.

---

## Phase 3: User Story 1 - Marca visual na topbar (Priority: P1) 🎯 MVP

**Goal**: Shell autenticada mostra imagem do logo + texto «Mesa»; mark de cor só desaparece.

**Independent Test**: [quickstart.md](./quickstart.md) A; probe `.topbar-brand img.topbar-mark`.

### Implementation for User Story 1

- [X] T004 [US1] Replace empty `<span class="topbar-mark">` with `<img class="topbar-mark" src="/mesa-logo.png" alt="" />` (decorative) in `frontend/src/shell/TopBar.tsx`; keep `.topbar-name` «Mesa»; add `aria-label="Mesa"` on `.topbar-brand` if needed (FR-001–FR-003 / contract)
- [X] T005 [US1] Smoke narrow topbar: logo fits without breaking search/theme actions in `frontend/src/shell/TopBar.tsx` + `frontend/src/styles/mesa-theme.css` (SC-004 / edge case)

**Checkpoint**: Topbar autenticada mostra logo + «Mesa»; sem bloco accent-only.

---

## Phase 4: User Story 2 - Tema claro e escuro (Priority: P2)

**Goal**: Logo reconhecível em claro e escuro com o mesmo PNG.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [X] T006 [US2] Verify / adjust light-theme contrast for `.topbar-mark` in `frontend/src/styles/mesa-theme.css` (ring, subtle backdrop, or leave as-is if SC-002 passes) per research R4 — no second asset variant (FR-005)

**Checkpoint**: Logo legível em ambos os temas.

---

## Phase 5: User Story 3 - Ecrã de autenticação alinhado (Priority: P2)

**Goal**: Auth usa a mesma imagem no bloco de marca.

**Independent Test**: [quickstart.md](./quickstart.md) C; probe `.auth-brand-row img.topbar-mark`.

### Implementation for User Story 3

- [X] T007 [US3] Replace solid mark with `<img class="topbar-mark auth-mark" src="/mesa-logo.png" alt="" />` in `frontend/src/components/AuthShell.tsx`; keep wordmark «Mesa» (FR-006)
- [X] T008 [P] [US3] Confirm `.auth-mark` sizing in `frontend/src/styles/mesa-theme.css` keeps proportions on the auth brand pane (no stretch)

**Checkpoint**: Login/registo mostram o mesmo logo que a topbar.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Types, quickstart, docs de entrega Speckit.

- [X] T009 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and smoke [quickstart.md](./quickstart.md) A–D (probes do contrato)
- [X] T010 [P] Update `docs/daily/2026-09-06.md` (secção Speckit implement 051) and `CHANGELOG.md` `[Unreleased]` for logo topbar/auth when implement completes
- [X] T011 Confirm favicon / PWA icons remain **out of scope** for this feature (spec Assumptions); do not block on `frontend/index.html` favicon work already done separately

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** all stories
- **US1 (Phase 3)**: After Phase 2 — MVP
- **US2 (Phase 4)**: After US1 CSS/img in topbar (same stylesheet refinements)
- **US3 (Phase 5)**: After Phase 2; can parallel with US2 once asset+CSS base exist (AuthShell vs theme tweak)
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: After Foundational
- **US2 (P2)**: After US1 mark is an image (theme polish on same CSS)
- **US3 (P2)**: After Foundational; independent of US2 except shared CSS conventions

### Parallel Opportunities

- After T002–T003: T007 (AuthShell) can proceed while T004–T005 finish if CSS base is stable
- T008 [P] with T007 after CSS auth rules known
- T010 [P] with T009 once code is done

---

## Parallel Example: After Foundational

```bash
# Topbar story:
Task: "T004 Replace mark with img in frontend/src/shell/TopBar.tsx"

# Auth story (same asset URL):
Task: "T007 Replace mark with img in frontend/src/components/AuthShell.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001–T003 (setup + asset + CSS)
2. T004–T005 (topbar)
3. **STOP** — validate quickstart A (+ D)
4. Then T006 themes, T007–T008 auth, T009–T011 polish

### Incremental Delivery

1. Foundational → `/mesa-logo.png` live
2. US1 → topbar brand = product logo
3. US2 → theme contrast if needed
4. US3 → auth parity
5. Docs + tsc

---

## Notes

- Favicon already generated ad-hoc is **not** a 051 deliverable (T011).
- Do not remove visible «Mesa» wordmark without replacing accessible name.
- Prefer CSS size over shipping full 1254×1254 display size.
- Format: all tasks use `- [ ]`, TaskID, optional `[P]` / `[Story]`, and file paths.
