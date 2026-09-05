---
description: "Task list for Ícones e split da barra de chamada"
---

# Tasks: Ícones e split da barra de chamada

**Input**: Design documents from `/specs/020-call-control-icons/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD na spec. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) §1–§4.

**Organization**: Setup → Foundational (CSS danger + icon sizing) → US1 Mic → US2 Câmara split → US3 Sair vermelho → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/VoiceChannel.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/styles/nocturne.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar pontos de toque do contrato.

- [X] T001 Review [contracts/call-control-chrome.md](./contracts/call-control-chrome.md) against current `.call-controls` markup in `frontend/src/pages/VoiceChannel.tsx` and note spans / classes to change (no code yet)

**Checkpoint**: Touch points listed (mic, cam split, leave).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens CSS partilhados — icon-only sizing + danger — antes das stories.

**⚠️ CRITICAL**: US1–US3 dependem destas classes existirem (ou stubs) para evitar regressão de layout.

- [X] T002 [P] Add `.btn-danger` (fill vermelho, texto/ícone claro, hover/active) in `frontend/src/styles/nocturne.css` and/or theme tokens in `frontend/src/styles/mesa-theme.css` for light+dark per [research.md](./research.md) R3
- [X] T003 [P] Add `.call-ctrl-icon` (or equivalent) sizing in `frontend/src/styles/mesa-theme.css`: ~44–48px min-width/height for icon-only call controls; keep `.call-controls .btn` touch target ≥44px per [research.md](./research.md) R4 — do **not** force 148px min-width on icon-only

**Checkpoint**: Classes CSS disponíveis; ainda sem alterar markup da barra.

---

## Phase 3: User Story 1 - Microfone só com ícone (Priority: P1) 🎯 MVP

**Goal**: Mic icon-only + `title` ≡ `aria-label`.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T004 [US1] In `frontend/src/pages/VoiceChannel.tsx` remove visible «Microfone» `<span>`; apply `call-ctrl-icon` (or equivalent); set `title` to the same dynamic string as `aria-label` (ligado/desligado) per [contracts/call-control-chrome.md](./contracts/call-control-chrome.md)
- [X] T005 [US1] Smoke: toggle mic still works; no split on mic (FR-006)

**Checkpoint**: §1 passa (icon + tooltip; toggle OK).

---

## Phase 4: User Story 2 - Câmara icon-only + split Discord (Priority: P1)

**Goal**: Câmara sem texto; contentor unificado Discord (divider + chevron); tooltip no toggle; blur inalterado.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T006 [US2] Restyle `.call-ctrl-split` / children in `frontend/src/styles/mesa-theme.css` as one rounded container with subtle vertical divider between toggle and chevron (Discord model) per [contracts/call-control-chrome.md](./contracts/call-control-chrome.md) and [research.md](./research.md) R2
- [X] T007 [US2] In `frontend/src/pages/VoiceChannel.tsx` remove «Câmara» `<span>`; icon-only toggle; `title` ≡ `aria-label` on camera toggle; keep chevron + `CameraBlurMenu` behaviour (015) unchanged
- [X] T008 [US2] Verify blur menu open/select and blur-on chevron indicator still work with new chrome in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/components/CameraBlurMenu.tsx` (no logic change unless CSS break)

**Checkpoint**: §2 passa; menu blur intacto.

---

## Phase 5: User Story 3 - Sair em vermelho (Priority: P1)

**Goal**: Hangup + «Sair» com fundo vermelho.

**Independent Test**: [quickstart.md](./quickstart.md) §3.

### Implementation for User Story 3

- [X] T009 [US3] In `frontend/src/pages/VoiceChannel.tsx` keep `IconPhoneHangup` + «Sair» text; replace `btn-primary` with `btn-danger` (or `call-ctrl-leave`) per FR-003 / clarificação A
- [X] T010 [US3] Check contrast of leave button in light and dark themes via `frontend/src/styles/mesa-theme.css` overrides if needed

**Checkpoint**: §3 passa; leave still calls `leave()`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação e docs de feature.

- [X] T011 [P] Run `cd frontend && npx tsc --noEmit` and fix errors from VoiceChannel/CSS class usage
- [X] T012 Execute [quickstart.md](./quickstart.md) §1–§4 (incl. regressão Gravar/E2EE; mic/sair sem split)
- [X] T013 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T003)** → **US1 (T004–T005)** → **US2 (T006–T008)** → **US3 (T009–T010)** → **Polish**
- US1–US3 all touch `VoiceChannel.tsx` → prefer **sequential** on that file; CSS T002/T003/T006 can overlap with care

### User Story Dependencies

```text
Foundational (btn-danger + call-ctrl-icon)
    ├── US1 Mic icon-only + title (MVP)
    ├── US2 Cam icon-only + Discord split CSS
    └── US3 Leave danger (needs T002)
```

### Parallel Opportunities

- T002 ∥ T003 (CSS files / sections)
- After markup stable: T011 (tsc) while manual § quickstart

---

## Parallel Example: Foundational

```bash
Task: "Add .btn-danger in nocturne.css / mesa-theme.css"
Task: "Add .call-ctrl-icon sizing in mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Setup + Foundational CSS
2. US1 mic icon-only + title
3. **STOP**: quickstart §1
4. Then US2 split + US3 leave

### Incremental Delivery

1. Mic polish → Cam Discord split → Leave red → Polish (`tsc` + quickstart + daily/CHANGELOG on implement)

---

## Notes

- [P] = different files / no incomplete deps
- Do not change blur media pipeline or Gravar
- `title` mirrors `aria-label` (R1)
- Sair keeps visible «Sair» text
