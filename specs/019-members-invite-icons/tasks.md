---
description: "Task list for Ícones de Membros e Convite"
---

# Tasks: Ícones de Membros e Convite

**Input**: Design documents from `/specs/019-members-invite-icons/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Backend intocado.

**Organization**: Setup (CSS do botão-ícone) → Foundational (`IconUsers` + `IconUserPlus`) → US1 membros no canal (P1, MVP) → US2 convite no header do servidor (P1) → US3 distinção das metáforas (P2) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/icons/`, `frontend/src/pages/Channel.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chrome de botão-ícone (hit-target + estado seleccionado) reutilizável no canal e no header do servidor.

- [X] T001 Add compact icon-button styles (reuse `.topbar-icon-btn` or add `.pane-icon-btn`) with selected/pressed chrome via `[aria-expanded="true"]` using `var(--press)` (not icon-stroke hue only) in `frontend/src/styles/mesa-theme.css` per [contracts/members-trigger.md](./contracts/members-trigger.md) and [research.md](./research.md)

**Checkpoint**: Classe de botão-ícone existe; estado aberto visível no CSS (ainda sem wiring).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pictogramas 012 — **bloqueia** US1–US3.

**⚠️ CRITICAL**: US1 precisa de `IconUsers`; US2 de `IconUserPlus`; US3 compara os dois.

- [X] T002 [P] Create `frontend/src/components/icons/IconUsers.tsx` (two-person silhouettes, `Icon` shell, stroke 1.75, viewBox 24) per [research.md](./research.md)
- [X] T003 [P] Create `frontend/src/components/icons/IconUserPlus.tsx` (single person + plus, same `Icon` shell) per [research.md](./research.md) and [contracts/invite-trigger.md](./contracts/invite-trigger.md)

**Checkpoint**: Ambos os ícones importáveis; grupo ≠ pessoa+ à vista.

---

## Phase 3: User Story 1 - Abrir membros pelo ícone no canal (Priority: P1) 🎯 MVP

**Goal**: Cabeçalho de texto e voz com ícone de grupo; toggle do painel; botão seleccionado enquanto aberto; sem a palavra «Membros» no botão.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T004 [US1] Replace the textual «Membros» control in `frontend/src/pages/Channel.tsx` with `IconUsers` icon-only button (`aria-label`/`title` «Membros», `aria-expanded={membersOpen()}`, T001 selected chrome); keep `toggleMembersPanel()` and header order per [contracts/members-trigger.md](./contracts/members-trigger.md)
- [X] T005 [P] [US1] Same members icon-button swap in `frontend/src/pages/VoiceChannel.tsx` (same relative position: do not reorder composição/grade, editar cena, modo palco, E2EE) per [contracts/members-trigger.md](./contracts/members-trigger.md)

**Checkpoint**: quickstart §1 em texto e voz; painel 008 inalterado; título «Membros» dentro do painel pode ficar.

---

## Phase 4: User Story 2 - Convidar a partir do cabeçalho do servidor (Priority: P1)

**Goal**: Pessoa+ à direita do nome do servidor, só dono; remover «Convite» do fundo da lista; mesmo diálogo.

**Independent Test**: [quickstart.md](./quickstart.md) §2–§3.

### Implementation for User Story 2

- [X] T006 [US2] In `frontend/src/shell/Sidebar.tsx` `sidebar-header`, lay out server name left (ellipsis) and `IconUserPlus` icon-only button right (`aria-label`/`title` «Convite»); render **only** when `selected()` and `isOwner()`; `onClick` keeps existing `createInvite(false)` + dialog per [contracts/invite-trigger.md](./contracts/invite-trigger.md) and [data-model.md](./data-model.md)
- [X] T007 [US2] Remove the textual «Convite» button and unused `.sidebar-actions` block from `frontend/src/shell/Sidebar.tsx` (no duplicate trigger) per FR-006 / [contracts/invite-trigger.md](./contracts/invite-trigger.md)

**Checkpoint**: Dono vê pessoa+ e abre o diálogo; não-dono e «Sem servidor» sem ícone; fundo da lista sem «Convite».

---

## Phase 5: User Story 3 - Distinguir «ver membros» de «convidar» (Priority: P2)

**Goal**: Grupo no canal vs pessoa+ no servidor; dicas «Membros» / «Convite»; não-dono só vê membros.

**Independent Test**: [quickstart.md](./quickstart.md) §4.

### Implementation for User Story 3

- [X] T008 [US3] Compare `frontend/src/components/icons/IconUsers.tsx` vs `IconUserPlus.tsx` at ~20px so the two metaphors stay distinct; adjust paths only if they read as the same glyph; confirm labels on Channel/VoiceChannel vs Sidebar per FR-008

**Checkpoint**: Como dono, dois ícones em sítios diferentes; como não-dono, só o de membros.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tipos, regressão visual (claro/escuro, voz denso), docs pós-implement.

- [X] T009 [P] Run `cd frontend && npx tsc --noEmit` and fix type errors
- [X] T010 Execute [quickstart.md](./quickstart.md) §1–§4 (incl. tema claro/escuro e wrapping do cabeçalho de voz) and fix gaps
- [X] T011 [P] Confirm no backend changes; `git diff -- backend/` empty for this feature
- [X] T012 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T003)** → **US1 (T004–T005)** → **US2 (T006–T007)** → **US3 (T008)** → **Polish**
- US1 e US2 são independentes após os ícones; US3 valida a distinção
- T007 after T006 (mesmo `Sidebar.tsx`)

### User Story Dependencies

```text
Foundational (IconUsers + IconUserPlus + CSS)
    ├── US1 Members icon in channel headers (MVP)
    ├── US2 Invite icon in server header (owner-only)
    └── US3 Distinct metaphors — needs both icons in place
```

### Within Each User Story

- CSS + ícone antes do wiring
- Header do servidor: layout + visibilidade dono antes de apagar o botão antigo
- Distinção visual depois de ambos os gatilhos existirem

### Parallel Opportunities

- T002 ∥ T003 (ícones, ficheiros diferentes)
- T004 ∥ T005 após T001–T002 (Channel vs VoiceChannel)
- T009 ∥ T011 no Polish
- US1 ∥ US2 após Foundational (devs diferentes)

---

## Parallel Example: Foundational

```bash
Task: "Create IconUsers.tsx two-person silhouettes"
Task: "Create IconUserPlus.tsx person plus plus"
```

---

## Parallel Example: User Story 1

```bash
# After IconUsers + CSS:
Task: "Channel.tsx members icon button"
Task: "VoiceChannel.tsx members icon button (same slot)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup CSS + IconUsers
2. US1 T004–T005 — membros ícone no canal
3. **STOP and VALIDATE**: quickstart §1
4. Then US2 convite → US3 distinção → Polish

### Incremental Delivery

1. Setup + Foundational → ícones + chrome
2. US1 → membros no canal (MVP)
3. US2 → convite no header, só dono
4. US3 → confirmação visual das metáforas
5. Polish → tsc, quickstart, daily/CHANGELOG

### Parallel Team Strategy

- Dev A: IconUsers + Channel/VoiceChannel
- Dev B: IconUserPlus + Sidebar header/remoção do botão

---

## Notes

- [P] = different files / no incomplete deps
- Sem TDD; sem alterações de backend
- Não reordenar controlos do cabeçalho de voz
- Commit only if user requests
