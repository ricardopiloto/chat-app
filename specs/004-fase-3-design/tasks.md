---
description: "Task list for Fase 3 — Redesign visual (Mesa / Nocturne)"
---

# Tasks: Fase 3 — Redesign visual (Mesa / Nocturne)

**Input**: Design documents from `/specs/004-fase-3-design/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Não pedidos TDD na spec. Regressão: `cargo test` (F1+F2) + `npx tsc --noEmit`. Validação visual/manual em [quickstart.md](./quickstart.md) + [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md).

**Organization**: US1+US2 (P1) depois US3+US4 (P2). Trabalha sobretudo em `frontend/` — sem migrations.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 on user-story phases only
- File paths are exact, per [plan.md](./plan.md)

## Path Conventions

Web app: `frontend/src/`, `backend/` (só regressão).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pastas e tokens Nocturne no bundle Vite ([research.md D1](./research.md#d1--vender-nocturne-no-frontend-não-linkar-docs-em-runtime)).

- [x] T001 Create directories `frontend/src/styles/`, `frontend/src/shell/`, `frontend/src/theme/`, `frontend/src/preferences/` per [plan.md](./plan.md)
- [x] T002 [P] Vendor/adapt Nocturne tokens and base component classes from `docs/design-ref/_ds/nocturne-*/styles.css` into `frontend/src/styles/nocturne.css` (Inter, ramps, `.btn`, `.dialog`, focus ring)
- [x] T003 [P] Add prototype semantic tokens + `.app[data-theme="light"]` stage/panel variables in `frontend/src/styles/mesa-theme.css` per [contracts/ui-shell.md](./contracts/ui-shell.md) and `docs/design-ref/Mesa - Protótipo v2.dc.html`
- [x] T004 Import new styles from `frontend/src/index.tsx` (or `frontend/src/styles.css`) and retire conflicting legacy rules that fight Nocturne

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tema, preferências e shell mínima — bloqueia todas as US.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement theme read/write (`mesa.theme`, `prefers-color-scheme`, `data-theme` on `.app`) in `frontend/src/theme/theme.ts` per [contracts/ui-preferences.md](./contracts/ui-preferences.md) and [data-model.md](./data-model.md)
- [x] T006 [P] Implement preference helpers for `mesa.viewMode` / optional `mesa.stageMode` in `frontend/src/preferences/uiPrefs.ts` per [contracts/ui-preferences.md](./contracts/ui-preferences.md)
- [x] T007 [P] Implement `instanceLabel()` (`instância ·` + `location.hostname`) in `frontend/src/shell/instanceLabel.ts`
- [x] T008 Build `TopBar` (marca Mesa, instance label, theme toggle, user chip) in `frontend/src/shell/TopBar.tsx` (depends on T005, T007)
- [x] T009 Build `Sidebar` shell (server header placeholder, Texto/Voz sections structure, footer self-hosted) in `frontend/src/shell/Sidebar.tsx` per [contracts/ui-shell.md](./contracts/ui-shell.md)
- [x] T010 Build `AppShell` (top bar + sidebar|main grid, stage mode, narrow drawer overlay) in `frontend/src/shell/AppShell.tsx` (depends on T008, T009, T006)
- [x] T011 Wire authenticated routes in `frontend/src/App.tsx` to wrap with `AppShell` and apply theme on boot (depends on T010, T005)

**Checkpoint**: After login, shell Nocturne visible; theme toggle persists; narrow window uses overlay drawer; no rail of servers.

---

## Phase 3: User Story 1 - Shell e navegação no padrão Mesa (Priority: P1) 🎯 MVP

**Goal**: Sidebar única com troca de Servidor, listas de canais, criar servidor/canal actions no chrome, modo palco — navegação 1b do PRD.

**Independent Test**: [quickstart.md](./quickstart.md) US1 steps 2–6 (two servers, stage mode, narrow drawer, theme+hostname bar).

### Implementation for User Story 1

- [x] T012 [US1] Move server switcher + channel lists from `frontend/src/pages/Servers.tsx` into `frontend/src/shell/Sidebar.tsx` (sections Texto / Voz e vídeo, active styles) (depends on T011)
- [x] T013 [US1] Add “Criar canal” / “Criar servidor” pill actions in `frontend/src/shell/Sidebar.tsx` opening existing create flows (depends on T012)
- [x] T014 [US1] Implement stage mode toggle (“Modo palco” / “Mostrar canais”) in `frontend/src/shell/AppShell.tsx` and expose control from voice route chrome (depends on T010)
- [x] T015 [US1] Ensure narrow breakpoint forces overlay sidebar and stage mode closes drawer in `frontend/src/shell/AppShell.tsx` + `frontend/src/styles/mesa-theme.css` (depends on T014)
- [x] T016 [US1] Slim `frontend/src/pages/Servers.tsx` (or replace with channel outlet) so main pane is not a second nav competing with Sidebar (depends on T012)

**Checkpoint**: US1 independently testable — Mesa shell matches ui-shell contract without needing Composition/Grade or scene editor polish.

---

## Phase 4: User Story 2 - Canal de texto e voz com chrome do protótipo (Priority: P1)

**Goal**: Texto agrupado + E2EE chip; voz com palco, banco, Composição/Grade, controlos; sem UI de gravação/E2EE-off.

**Independent Test**: [quickstart.md](./quickstart.md) US2.

### Implementation for User Story 2

- [x] T017 [P] [US2] Restyle `frontend/src/pages/Channel.tsx` — author grouping, ~74ch measure, E2EE activa header, Nocturne composer
- [x] T018 [US2] Add view-mode toggle (Composição | Grade) reading/writing `mesa.viewMode` in `frontend/src/pages/VoiceChannel.tsx` (depends on T006)
- [x] T019 [US2] Implement CallBank derivation + bank UI strip in `frontend/src/pages/VoiceChannel.tsx` (or `frontend/src/components/CallBank.tsx`) per [data-model.md](./data-model.md) / [research.md D5](./research.md#d5--vista-grade--composição-local-de-participantes-livekit)
- [x] T020 [US2] Render Grade layout (all in-call participants) vs Composition (`CameraGrid` on active scene) in `frontend/src/pages/VoiceChannel.tsx` + `frontend/src/components/CameraGrid.tsx` (depends on T018, T019)
- [x] T021 [US2] Voice header: active scene name + `N de M em cena` + privacy line “E2EE activa”; confirm no Gravar / E2EE-off controls in `frontend/src/pages/VoiceChannel.tsx` ([research.md D7](./research.md#d7--omitir-do-protótipo-o-que-a-spec-exclui), D10)
- [x] T022 [US2] Restyle call controls (mic, camera, leave) for ≥40px touch targets and Nocturne chips on tiles in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/components/CameraGrid.tsx`

**Checkpoint**: US1+US2 — text and voice chrome match prototype; Grade/Composition persist globally.

---

## Phase 5: User Story 3 - Editor de cena e lista no visual do protótipo (Priority: P2)

**Goal**: Editor com rascunho local Salvar/Descartar, banco arrastável + teclado; lista/co-diretor no visual Nocturne; APIs F2 inalteradas no Salvar.

**Independent Test**: [quickstart.md](./quickstart.md) US3.

### Implementation for User Story 3

- [x] T023 [P] [US3] Implement `SceneDraft` state helpers (clone, dirty, discard) in `frontend/src/preferences/sceneDraft.ts` (or `frontend/src/components/sceneDraft.ts`) per [data-model.md](./data-model.md) / [research.md D4](./research.md#d4--rascunho-de-cena-só-no-cliente-salvar--apis-f2)
- [x] T024 [US3] Build scene editor UI (stage slots, layout thumbnails 2–4, bank drag targets, Salvar/Descartar) in `frontend/src/components/SceneEditor.tsx` (depends on T023)
- [x] T025 [US3] Keyboard path to assign account→slot and return to bank in `frontend/src/components/SceneEditor.tsx` (depends on T024)
- [x] T026 [US3] Dirty-exit confirm (save / discard / cancel) when leaving editor in `frontend/src/components/SceneEditor.tsx` (depends on T024)
- [x] T027 [US3] Replace/integrate `frontend/src/components/GridAdmin.tsx` flow with SceneEditor; Salvar calls existing PATCH/PUT scene/grid APIs (depends on T024, T016)
- [x] T028 [P] [US3] Restyle `frontend/src/components/SceneList.tsx` and `frontend/src/components/CoDirectorPanel.tsx` to Nocturne (co-director activate-only unchanged)
- [x] T029 [US3] Wire SceneEditor + SceneList into `frontend/src/pages/VoiceChannel.tsx` without remounting LiveKit on save/activate (depends on T027, T028)

**Checkpoint**: Discard leaves server map unchanged; Save on active updates all clients; keyboard assign works.

---

## Phase 6: User Story 4 - Auth, convite e diálogos (Priority: P2)

**Goal**: Login/registo/desbloqueio/convite e diálogos criar Servidor/canal/convite no Nocturne; crypto/fluxos F1 intactos.

**Independent Test**: [quickstart.md](./quickstart.md) US4.

### Implementation for User Story 4

- [x] T030 [P] [US4] Restyle `frontend/src/pages/Auth.tsx` (Mesa brand, Nocturne fields/buttons, unlock copy) per [research.md D8](./research.md#d8--authinvite-no-mesmo-sistema-de-tokens)
- [x] T031 [P] [US4] Restyle `frontend/src/pages/Invite.tsx` to Nocturne
- [x] T032 [US4] Restyle create-server / create-channel / invite copy dialogs (extract shared `frontend/src/components/Dialog.tsx` if needed) used from Sidebar / Servers flows — copy feedback “Copiado” (depends on T013)
- [x] T033 [US4] Ensure auth routes remain outside AppShell (or use minimal branded chrome) in `frontend/src/App.tsx` while matching Nocturne (depends on T030)

**Checkpoint**: First paint through auth matches SC-001 language; invite/create dialogs pass fidelity items 17–18.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Regressão, fidelidade, docs de operação se necessário.

- [x] T034 [P] Run `cargo test` in `backend/` and fix any accidental regressions (expect none from UI-only work)
- [x] T035 [P] Run `npx tsc --noEmit` in `frontend/` and fix type errors from shell refactor
- [x] T036 Complete [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md) (≥90%) against running SPA + prototype
- [x] T037 Execute [quickstart.md](./quickstart.md) US1–US4 end-to-end; note gaps
- [x] T038 [P] Add a short note to `docs/operar-instancia.md` that the SPA UI follows Mesa/Nocturne (no new ports) if operator-facing chrome changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP shell
- **US2 (Phase 4)**: After Foundational; practical dependency on US1 shell for voice chrome placement
- **US3 (Phase 5)**: After US2 voice page structure (editor lives in VoiceChannel)
- **US4 (Phase 6)**: After Foundational tokens (T002–T004); can parallel US1 once styles exist
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 only
- **US2 (P1)**: After Phase 2; integrate into AppShell main pane (US1)
- **US3 (P2)**: After US2 VoiceChannel chrome
- **US4 (P2)**: After Phase 1 styles; independent of US3; soft link to US1 for create dialogs from Sidebar

### Parallel Opportunities

- T002 ∥ T003
- T005 ∥ T006 ∥ T007 (then T008 ∥ T009 → T010)
- T017 ∥ T018 early work; T023 ∥ T028
- T030 ∥ T031
- T034 ∥ T035 ∥ T038

---

## Parallel Example: Foundational

```bash
Task: "theme.ts"
Task: "uiPrefs.ts"
Task: "instanceLabel.ts"
# then TopBar + Sidebar in parallel, then AppShell
```

## Parallel Example: US4

```bash
Task: "Restyle Auth.tsx"
Task: "Restyle Invite.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup (tokens)
2. Phase 2 Foundational (shell + theme)
3. Phase 3 US1 (nav 1b + stage mode)
4. **STOP** — validate quickstart US1 + fidelity items 1–10

### Incremental Delivery

1. MVP shell (US1)
2. Add US2 text/voice chrome + Composição/Grade
3. Add US3 scene editor draft
4. Add US4 auth/dialogs polish
5. Phase 7 fidelity ≥90% + cargo/tsc green

### Parallel Team Strategy

- After Phase 2: Dev A → US1/US2 shell+voice; Dev B → US4 auth (tokens ready); then Dev A/B → US3 editor

---

## Notes

- [P] = different files, no incomplete deps
- No backend API tasks — Salvar reuses F2 PATCH/PUT
- Do not port Gravar / E2EE-off from prototype ([research.md D7](./research.md#d7--omitir-do-protótipo-o-que-a-spec-exclui))
- Suggested MVP: **US1 only** (shell recognisable as Mesa)
