---
description: "Task list for Tela de login Mesa (estilo protótipo)"
---

# Tasks: Tela de login Mesa (estilo protótipo)

**Input**: Design documents from `/specs/027-auth-login-screen/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) vs [docs/screenshots/03-auth.jpg](../../docs/screenshots/03-auth.jpg).

**Organization**: Setup → Foundational (AuthShell + CSS + icons) → US1 Entrar → US2 Criar conta → US3 erros/unlock → US4 Invite → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/AuthShell.tsx`, `frontend/src/pages/Auth.tsx`, `frontend/src/pages/Invite.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/components/icons/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mapear auth actual vs referência.

- [X] T001 Compare current `.auth-card` markup in `frontend/src/pages/Auth.tsx` / `Invite.tsx` and styles in `frontend/src/styles/mesa-theme.css` against [docs/screenshots/03-auth.jpg](../../docs/screenshots/03-auth.jpg) and [contracts/auth-screen-visual.md](./contracts/auth-screen-visual.md) (no code change)

**Checkpoint**: Gaps de layout documentados mentalmente; pronto para shell.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Chrome partilhado, CSS de duas colunas, ícones de campo — **blocks** all stories.

- [X] T002 [P] Add field icons in `frontend/src/components/icons/IconAt.tsx` and `frontend/src/components/icons/IconEye.tsx` (open/closed or props) using `Icon` shell; confirm `IconLock` reuse path in `frontend/src/components/icons/IconLock.tsx` per [research.md](./research.md) R4
- [X] T003 [P] Replace single-column `.auth-card` styles with `.auth-shell` / `.auth-pane-brand` / `.auth-pane-form` (dark page bg, panel, responsive stack &lt;~720px) in `frontend/src/styles/mesa-theme.css` per [research.md](./research.md) R1
- [X] T004 Create shared `frontend/src/components/AuthShell.tsx` (brand pane: mark + Mesa + tagline + self-hosted note; form pane `children`) forcing dark theme on wrapper per [research.md](./research.md) R2 / R5

**Checkpoint**: Shell + CSS + ícones prontos para ligar páginas.

---

## Phase 3: User Story 1 - Entrar com visual do protótipo (Priority: P1) 🎯 MVP

**Goal**: `/auth` modo Entrar = duas colunas, campos com afixos, toggle senha, botão roxo; login funciona.

**Independent Test**: [quickstart.md](./quickstart.md) §1 + §3.

### Implementation for User Story 1

- [X] T005 [US1] Wrap `frontend/src/pages/Auth.tsx` in `AuthShell`; move login form into form pane; force dark auth chrome (stop relying on light `resolveTheme` for this screen)
- [X] T006 [US1] Add affix inputs (@ / lock) and password show/hide toggle in `frontend/src/pages/Auth.tsx` (+ CSS `.input-affix` in `frontend/src/styles/mesa-theme.css` if needed) per FR-010
- [X] T007 [US1] Style primary Entrar button as solid accent (purple) in auth form pane via `frontend/src/styles/mesa-theme.css` / button classes; omit «Esqueceu sua senha?» (FR-007)
- [X] T008 [US1] Verify successful login path still calls existing `onAuthed` / navigate in `frontend/src/pages/Auth.tsx` (no API changes)

**Checkpoint**: §1 visual + login OK.

---

## Phase 4: User Story 2 - Criar conta no mesmo layout (Priority: P1)

**Goal**: Abas + «ou» + outline Criar conta; registo no mesmo shell.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T009 [US2] Add Entrar / Criar conta tabs bound to `mode` in `frontend/src/pages/Auth.tsx` with active underline/accent styles in `frontend/src/styles/mesa-theme.css` per [research.md](./research.md) R3
- [X] T010 [US2] In login mode, add «ou» divider + outlined «Criar conta» button that sets `mode` to register; hide that block in register mode; keep register submit working in `frontend/src/pages/Auth.tsx`
- [X] T011 [US2] Confirm brand pane stays visible in register mode and register still posts to existing `/api/auth/register` flow in `frontend/src/pages/Auth.tsx`

**Checkpoint**: §2 passa.

---

## Phase 5: User Story 3 - Erros e desbloquear (Priority: P2)

**Goal**: Erros e unlock/recover no form pane do novo chrome.

**Independent Test**: [quickstart.md](./quickstart.md) §4.

### Implementation for User Story 3

- [X] T012 [US3] Render unlock / «Entrar com outra conta» / recover-keys UI inside `AuthShell` form pane in `frontend/src/pages/Auth.tsx` (same brand pane) per [research.md](./research.md) R6
- [X] T013 [US3] Ensure auth error text remains visible under the form in `frontend/src/pages/Auth.tsx` / auth CSS (invalid credentials path)

**Checkpoint**: §4 passa.

---

## Phase 6: User Story 4 - Convite com o mesmo chrome (Priority: P2)

**Goal**: `/invite/…` usa `AuthShell`; lógica de convite intacta.

**Independent Test**: [quickstart.md](./quickstart.md) §5.

### Implementation for User Story 4

- [X] T014 [US4] Refactor `frontend/src/pages/Invite.tsx` to use `AuthShell`; put invite preview + accept/register form in form pane; force dark theme like auth
- [X] T015 [US4] Reuse affix + password toggle patterns on invite register fields in `frontend/src/pages/Invite.tsx` where password/handle are shown; keep accept API behaviour unchanged

**Checkpoint**: §5 passa.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive, checklist visual, typecheck, daily/changelog on implement.

- [X] T016 Tune responsive stack and touch targets for auth/invite in `frontend/src/styles/mesa-theme.css` ([quickstart.md](./quickstart.md) §6 / FR-008)
- [X] T017 Run `cd frontend && npx tsc --noEmit`
- [X] T018 [P] Walk [contracts/auth-screen-visual.md](./contracts/auth-screen-visual.md) checklist (≥80%) against [docs/screenshots/03-auth.jpg](../../docs/screenshots/03-auth.jpg) via [quickstart.md](./quickstart.md)
- [X] T019 Mark completed tasks in `specs/027-auth-login-screen/tasks.md`; on successful implement, append `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` per project rules

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1–US4
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After US1 AuthShell wiring
- **US3 (Phase 5)**: After US1 (same `Auth.tsx`)
- **US4 (Phase 6)**: After Foundational (`AuthShell`); can follow US1
- **Polish (Phase 7)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: After Phase 2
- **US2 (P1)**: Depends on US1 Auth markup
- **US3 (P2)**: Depends on US1 shell in `Auth.tsx`
- **US4 (P2)**: Depends on Phase 2 `AuthShell`; independent of US2/US3 logically

### Parallel Opportunities

- T002 ∥ T003 after T001; T004 after T003 (uses CSS classes)
- US4 (T014–T015) can start after T004 while US2/US3 finish if staffing allows
- T018 after T017

---

## Parallel Example: Foundational

```bash
Task: "Add IconAt + IconEye"
Task: "Author .auth-shell CSS in mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (shell, CSS, icons)
2. US1 Entrar visual + login
3. **STOP** and validate §1 / checklist visual

### Incremental Delivery

1. US1 → Entrar  
2. US2 → tabs + Criar conta  
3. US3 → unlock/errors  
4. US4 → invite chrome  
5. Polish → responsive + `tsc` + daily/CHANGELOG

---

## Notes

- Do not implement password reset.
- Do not change invite/auth API contracts.
- Commit only if the user asks.
