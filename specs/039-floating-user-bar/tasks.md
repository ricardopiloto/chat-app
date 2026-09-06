---
description: "Task list for barra de utilizador flutuante (039)"
---

# Tasks: Barra de Usuário Flutuante

**Input**: Design documents from `/specs/039-floating-user-bar/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. Sem contract BE.

**Organization**: Setup → Foundational (VoiceSession APIs + predicado sítio activo) → US1 painel identidade → US2 mic/deafen → US3 câmara/sair + sítio único → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Mapear shell actual e superfícies a mover.

- [x] T001 [P] Inventory TopBar account chip/`AccountMenu` usage in `frontend/src/shell/TopBar.tsx` and Sidebar footer region in `frontend/src/shell/Sidebar.tsx` per [contracts/user-panel-ui.md](./contracts/user-panel-ui.md)
- [x] T002 [P] Document current mic/cam/leave paths in `frontend/src/pages/VoiceChannel.tsx` and `frontend/src/voice/VoiceSession.tsx` (reportMedia, hangUp/leave) for later extraction

**Checkpoint**: Alvos claros; sem UI nova ainda.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Predicado de sítio activo + APIs partilhadas de mídia — **blocks** US2/US3 (e facilita US1 wiring).

**⚠️ CRITICAL**: Sem `onActiveVoiceStage` e toggles no `VoiceSession`, a barra e o palco divergem.

- [x] T003 Add helper `viewingActiveVoiceStage(paramsChannelId, voice)` (or equivalent) used by `frontend/src/shell/AppShell.tsx` / panel — same idea as PiP off-stage check (`connected && params.id === voice.channelId()` for voice channel view) per [contracts/call-controls-active-site.md](./contracts/call-controls-active-site.md) and [research.md](./research.md)
- [x] T004 Centralize `toggleMic` / `toggleCam` / `hangUp` (or rename existing leave) on `frontend/src/voice/VoiceSession.tsx` so stage and panel share one implementation (call `reportMedia` + LiveKit enable/disable as today)
- [x] T005 [P] Add `deafened` signal + `setDeafened` / `toggleDeafen` stubs on `frontend/src/voice/VoiceSession.tsx` (clear on hangup); full remote-silence logic lands in US2

**Checkpoint**: Context exposes shared toggles + deafened flag; predicate available to shell.

---

## Phase 3: User Story 1 - Identidade e conta no painel (Priority: P1) 🎯 MVP

**Goal**: Painel fixo no fundo da sidebar com avatar, online, handle; menu de conta; TopBar sem conta duplicada.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [x] T006 [US1] Create `frontend/src/shell/UserPanel.tsx` with avatar (`IdentityAvatar`), online dot, handle, settings button; open `AccountMenu` (or shared account menu) on avatar/name/settings click — props: `me`, `identity`, `onLogout`, `onAccountPatch` as needed per [contracts/user-panel-ui.md](./contracts/user-panel-ui.md)
- [x] T007 [US1] Mount `UserPanel` at bottom of sidebar column in `frontend/src/shell/Sidebar.tsx` (or `AppShell.tsx` if cleaner); ensure it stays mounted across channel/server navigation (FR-001, FR-016 with drawer)
- [x] T008 [US1] Add Discord-like `.user-panel*` styles in `frontend/src/styles/mesa-theme.css` (compact strip, online indicator)
- [x] T009 [US1] Remove account chip / `AccountMenu` from `frontend/src/shell/TopBar.tsx`; drop unused props from `AppShell.tsx` → TopBar if any (FR-004, SC-004)
- [x] T010 [US1] Wire `AppShell.tsx` to pass `me` / logout / account patch into Sidebar → UserPanel

**Checkpoint**: Conta só no painel inferior; visível em texto/voz/outros ecrãs autenticados.

---

## Phase 4: User Story 2 - Mic e deafen fora do palco (Priority: P2)

**Goal**: Na barra (off-stage, em chamada): mic + deafen activos; no palco: deafen+mic no palco e grupo oculto na barra; fora de chamada: disabled.

**Independent Test**: [quickstart.md](./quickstart.md) §§2–4 (mic/deafen parts).

### Implementation for User Story 2

- [x] T011 [US2] Implement deafen behavior in `frontend/src/voice/VoiceSession.tsx`: enable → mute local mic + silence remote audio; disable → restore remote audio (mic stays off); unmute mic while deafened → clear deafen; clear on hangup per [contracts/deafen-behavior.md](./contracts/deafen-behavior.md)
- [x] T012 [P] [US2] Add deafen icon component (e.g. `frontend/src/components/icons/IconDeafen.tsx` or headphones-off) for on/off states
- [x] T013 [US2] Render mic + deafen controls on `UserPanel` when `connected && !onActiveVoiceStage` (enabled) and when `!connected` (visible disabled); **hide** call-control group when `onActiveVoiceStage` (FR-005, FR-009, FR-010)
- [x] T014 [US2] Refactor `VoiceChannel.tsx` mic toggle to use `VoiceSession.toggleMic`; add deafen control on stage call-controls when on stage; ensure speaking aura (036) still gates on micOn + speaking (FR-012)
- [x] T015 [US2] Verify deafen↔mic coupling (deafen mutes mic; unmute clears deafen) from both panel and stage

**Checkpoint**: SC-001; SC-007 parcial (mic/deafen só num sítio).

---

## Phase 5: User Story 3 - Câmara, blur e sair no sítio activo (Priority: P3)

**Goal**: Câmara (+blur) e sair no palco ou na barra conforme a vista; nunca duplicados activos.

**Independent Test**: [quickstart.md](./quickstart.md) §§3–5.

### Implementation for User Story 3

- [x] T016 [US3] Add camera (+ `CameraBlurMenu`) and leave (hangup) to `UserPanel` call group when off-stage enabled; disabled when not connected; hidden when on stage (FR-008, FR-011, FR-013)
- [x] T017 [US3] Gate stage call-controls in `VoiceChannel.tsx` so they remain the active site only while viewing active voice stage; use shared `toggleCam` / `hangUp` from VoiceSession
- [x] T018 [US3] Ensure blur menu only mounts on the active site (no double menus) — `CameraBlurMenu.tsx` / panel vs stage
- [x] T019 [US3] On hangup from panel: leave call, clear deafen, panel returns to disabled controls without full page reload (FR-017); coordinate with PiP/040 so leave is not confusingly triplicated (research §6 — prefer panel as canonical off-stage leave if 040 hangup also present)
- [x] T020 [US3] Run five palco↔texto transitions; confirm single active control site (SC-007)

**Checkpoint**: US3 + SC-002/006/007.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: a11y, viewport, docs.

- [x] T021 [P] Aria-labels / titles for panel mic, deafen, cam, leave (incl. disabled state) in `UserPanel.tsx`
- [x] T022 Confirm narrow/drawer layout still shows UserPanel with sidebar in `frontend/src/styles/mesa-theme.css` / shell (FR-016)
- [x] T023 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T024 Execute [quickstart.md](./quickstart.md) §§1–5; note skips
- [x] T025 [P] Update `CHANGELOG.md` `[Unreleased]` and `docs/daily/yyyy-mm-dd.md` when implement completes

**Checkpoint**: Feature ready to demo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: imediato
- **Foundational**: após Setup — **blocks** US2/US3; US1 pode começar após T001 em paralelo parcial, mas T010 precisa AppShell
- **US1**: após Setup (+ T010 wiring)
- **US2**: após Foundational (T003–T005)
- **US3**: após US2 (reutiliza grupo de controlos na barra)
- **Polish**: após stories desejadas

### User Story Dependencies

- **US1**: independente de deafen/cam
- **US2**: depende de VoiceSession toggles + panel shell (US1)
- **US3**: depende de US2 panel call-group pattern

### Parallel Opportunities

- T001 ∥ T002
- T012 ∥ T011
- T006–T008 podem avançar enquanto T004–T005 terminam
- T021 ∥ T022

---

## Parallel Example: User Story 2

```bash
Task: "Implement deafen in VoiceSession.tsx"
Task: "Add IconDeafen.tsx"
# Then:
Task: "Wire mic+deafen on UserPanel"
Task: "Add deafen on VoiceChannel stage controls"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1–2 (mínimo: predicado pode esperar)
2. Phase 3 US1 — painel + remover TopBar account
3. **STOP** — validar identidade/conta
4. Depois US2 → US3

### Incremental Delivery

1. US1 painel conta
2. US2 mic/deafen + sítio activo
3. US3 cam/blur/leave
4. Polish / changelog

### Parallel Team Strategy

- A: UserPanel + CSS + TopBar
- B: VoiceSession deafen + toggles
- C: VoiceChannel gate + blur site

---

## Notes

- Coordenar com [040](../040-remove-connected-bar/) no leave off-stage (research §6)
- Sem BE/migrations
- Format: checkbox + ID + [P]/[USn] + paths — OK
