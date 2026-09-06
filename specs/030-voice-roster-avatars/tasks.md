---
description: "Task list for avatares na lista de jogadores e nos canais de texto"
---

# Tasks: Avatares na lista de jogadores e nos canais de texto

**Input**: Design documents from `/specs/030-voice-roster-avatars/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/voice-occupancy-avatars.md](./contracts/voice-occupancy-avatars.md), [contracts/identity-icon-ui.md](./contracts/identity-icon-ui.md), [quickstart.md](./quickstart.md)

**Tests**: Pedidos no plano — contract `has_avatar` na ocupação ([contracts/voice-occupancy-avatars.md](./contracts/voice-occupancy-avatars.md)); `cargo test --test contract`; `npx tsc --noEmit`; [quickstart.md](./quickstart.md).

**Organization**: Setup (CSS) → Foundational (`has_avatar` na vista de ocupação) → US1 lista de voz → US2 fallback/onerror → US4 canal de texto → US3 regressão 028 → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/tests/contract/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estilos do círculo compacto na lista aninhada, sem wiring.

- [X] T001 Add compact circular identity styles for nested roster rows (flex item, overflow hidden, `object-fit: cover`) in `frontend/src/styles/mesa-theme.css` per [contracts/identity-icon-ui.md](./contracts/identity-icon-ui.md)

**Checkpoint**: Classes existem; a lista ainda só mostra o handle.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `has_avatar` no snapshot REST e no WS `voice.occupancy` — **blocks** US1 (foto no instante em que a linha aparece).

**⚠️ CRITICAL**: Sem este campo a Sidebar não sabe se deve pedir a foto.

- [X] T002 Add `has_avatar: bool` to `OccupantView` in `backend/src/domain/voice_occupancy.rs` per [data-model.md](./data-model.md)
- [X] T003 SELECT `account.avatar_filename` in the occupant view JOIN and map `has_avatar` in `backend/src/db/voice_occupancy.rs` (`list_views_for_channel` / `OccupantViewRow`)
- [X] T004 [P] Add `has_avatar?: boolean` to `VoiceOccupantView` in `frontend/src/api/client.ts`

**Checkpoint**: GET occupancy e WS serializam `has_avatar`; UI ainda não mostra o círculo.

---

## Phase 3: User Story 1 - Reconhecer quem transmite pelo ícone (Priority: P1) 🎯 MVP

**Goal**: Lista aninhada: ícone circular à esquerda do handle; foto se `has_avatar`, senão iniciais.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 1.

### Tests for User Story 1

- [X] T005 [P] [US1] Extend contract tests in `backend/tests/contract/voice_occupancy.rs` (or `avatars.rs`) so join-with-media as a user **with** avatar → occupant `has_avatar: true`, **without** → `false`, per [contracts/voice-occupancy-avatars.md](./contracts/voice-occupancy-avatars.md)

### Implementation for User Story 1

- [X] T006 [US1] Render `IdentityAvatar` (account id, handle, `has_avatar`) to the left of each nested roster handle in `frontend/src/shell/Sidebar.tsx`; keep filter `mic_on || cam_on` unchanged
- [X] T007 [US1] Wire roster item layout (circle + truncated handle, `title`/`aria-label` = handle completo) in `frontend/src/shell/Sidebar.tsx` + T001 classes in `frontend/src/styles/mesa-theme.css` per [contracts/identity-icon-ui.md](./contracts/identity-icon-ui.md)

**Checkpoint**: B em texto vê a foto de A na lista aninhada &lt;3 s após A transmitir com avatar já definido.

---

## Phase 4: User Story 2 - Sem foto, iniciais estáveis (Priority: P1)

**Goal**: Sem foto → mesmas iniciais que chip/membros; círculo nunca vazio; foto partida → iniciais.

**Independent Test**: Transmissor sem avatar → iniciais; lista mista com/sem foto, círculos do mesmo tamanho.

### Implementation for User Story 2

- [X] T008 [US2] On image load failure, fall back to initials (never an empty circle) in `frontend/src/components/IdentityAvatar.tsx` per [research.md](./research.md) R4
- [X] T009 [US2] Confirm roster rows with and without `has_avatar` share one circle size in `frontend/src/styles/mesa-theme.css` (no layout jump)

**Checkpoint**: Linha sem foto = iniciais; GET avatar 404 não deixa buraco.

---

## Phase 5: User Story 4 - Avatar nos grupos de mensagens de texto (Priority: P1)

**Goal**: Um ícone por grupo de mensagens, foto quando o grupo aparece (membros `has_avatar` no load do canal).

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 4.

### Implementation for User Story 4

- [X] T010 [US4] Ensure `Channel.tsx` loads server members (including `has_avatar`) before/with history and passes that map into `IdentityAvatar` on each message group in `frontend/src/pages/Channel.tsx` (one icon per group, not per line) per [contracts/identity-icon-ui.md](./contracts/identity-icon-ui.md)
- [X] T011 [US4] For WS `message.new`, resolve handle/`hasAvatar` from the same members map in `frontend/src/pages/Channel.tsx`; unknown sender → stable initials from the visible id (no empty circle)

**Checkpoint**: Histórico e mensagem nova mostram foto ou iniciais no sítio de `01-canal-texto.jpg`; sem lista de ocupação sob `#`.

---

## Phase 6: User Story 3 - Lista de voz continua a ser a de 028 (Priority: P2)

**Goal**: Ícone não muda quem aparece; Membros e cronómetro intactos; palco colapsado continua a ocultar a lista.

**Independent Test**: [quickstart.md](./quickstart.md) voz § 028 (mic+cam off some; Membros = N).

### Implementation for User Story 3

- [X] T012 [US3] Assert nested roster still lists only `mic_on || cam_on` in `frontend/src/shell/Sidebar.tsx` (icon must not add silent occupants)
- [X] T013 [US3] Confirm no occupancy/roster UI was added under text channels in `frontend/src/shell/Sidebar.tsx` (FR-011)

**Checkpoint**: SC-004 (M vs N) e canal `#` sem «jogadores» aninhados.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Sem WS de avatar; testes e quickstart.

- [X] T014 [P] Grep FE/BE: no `avatar.updated` / occupancy emit on PUT/DELETE avatar (`backend/src/api/avatars.rs`, `frontend/src/`)
- [X] T015 Run `cd backend && cargo test --test contract` and `cd frontend && npx tsc --noEmit`; fix regressions
- [X] T016 Manual pass [quickstart.md](./quickstart.md) (US1, US4, clarificação B — foto já visível não exige push)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → no deps
- **Phase 2 (Foundational)** → after Setup; **blocks** US1
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after US1 `IdentityAvatar` na lista (T006); T008 can start once IdentityAvatar is the roster renderer
- **Phase 5 (US4)** → after Foundational optional; can parallel US1 (different files: `Channel.tsx` vs `Sidebar.tsx`)
- **Phase 6 (US3)** → after US1 filter still in Sidebar
- **Phase 7 (Polish)** → after desired stories

### User Story Dependencies

- **US1**: Independent after Foundational (`has_avatar` occupancy + Sidebar)
- **US2**: Needs US1 renderer; onerror is shared with US4 via `IdentityAvatar`
- **US4**: Independent of occupancy field (members map); can parallel US1
- **US3**: Regression on US1 Sidebar

### Parallel Opportunities

- T004 ∥ T002–T003 (FE type vs BE)
- T005 ∥ T006 after T003 (tests vs Sidebar; prefer green tests after T003)
- T006 (Sidebar) ∥ T010 (Channel) after Foundational
- T008 benefits both US2 and US4
- T014 ∥ T015 in Polish if docs/grep vs tests split

### Parallel example (after Foundational)

```text
T005 (contracts) → T006–T007 (roster UI)
T010 ∥ T011 (texto) while roster UI proceeds
T008 after IdentityAvatar is used in at least one surface
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Phase 1 + Phase 2  
2. Phase 3 (lista de voz com ícone)  
3. Stop: quickstart US1 + contract `has_avatar`

### Incremental delivery

1. MVP (US1)  
2. US2 — iniciais / onerror  
3. US4 — grupos de texto  
4. US3 — regressão 028  
5. Polish  

### Notes

- Sem migração; sem `avatar.updated`  
- Não alterar filtro mic/câmera da lista  
- Texto: completar/verificar 029 em `Channel.tsx`, não duplicar upload  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T004 | 3 |
| US1 | T005–T007 | 3 |
| US2 | T008–T009 | 2 |
| US4 | T010–T011 | 2 |
| US3 | T012–T013 | 2 |
| Polish | T014–T016 | 3 |
| **Total** | T001–T016 | **16** |

**Parallel opportunities**: FE type ∥ BE view; Sidebar ∥ Channel; grep ∥ tests.

**MVP scope**: Phase 1–3 (T001–T007) — ícone na lista de jogadores.

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
