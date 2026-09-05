---
description: "Task list for Blur de fundo da câmara"
---

# Tasks: Blur de fundo da câmara

**Input**: Design documents from `/specs/015-camera-background-blur/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) (duas contas + câmara real). Backend intocado.

**Organization**: Setup (npm + assets) → Foundational (preferência + processor + publish LocalVideoTrack) → US1 blur no feed enviado (P1, MVP) → US2 split/menu/seta (P1) → US3 primeiro frame + falha fechada + indisponível (P2) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/video/`, `frontend/src/blur/`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/`, `frontend/public/mediapipe/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependência LiveKit processors e modelos MediaPipe na origem da SPA.

- [X] T001 Add npm dependency `@livekit/track-processors` (peer `livekit-client` já presente) in `frontend/package.json`
- [X] T002 [P] Vendor MediaPipe WASM + modelo selfie segmenter into `frontend/public/mediapipe/` and document filenames; **no** default Google/jsDelivr CDN at runtime per [research.md](./research.md) §5

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistência, factory do processor e publicação via `LocalVideoTrack` — **bloqueia todas as user stories**.

**⚠️ CRITICAL**: Nenhuma US começa até T003–T005 estarem feitos.

- [X] T003 Implement `CameraBlurMode` plus `readBlurMode` / `writeBlurMode` (`mesa.cameraBlur`, default `off`) in `frontend/src/blur/blurPreference.ts` per [data-model.md](./data-model.md)
- [X] T004 Implement `supportsCameraBlur`, `BLUR_RADIUS` (`light: 12`, `strong: 32`), `createBlurProcessor` (`assetPaths` → `/mediapipe/`) and `applyBlurMode` (`switchTo` blur vs `disabled`) in `frontend/src/video/backgroundBlur.ts` per [contracts/background-blur-processor.md](./contracts/background-blur-processor.md)
- [X] T005 Extend `joinLiveRoom` in `frontend/src/video/liveClient.ts` to publish `LocalVideoTrack` (câmara) or keep `MediaStreamTrack` (vídeo de teste) without breaking E2EE attach/preview

**Checkpoint**: `tsc` no módulo de blur; join de teste ainda funciona; câmara pode publicar `LocalVideoTrack` sem processor.

---

## Phase 3: User Story 1 - Aplicar blur de fundo na própria câmara (Priority: P1) 🎯 MVP

**Goal**: Com modo `light`/`strong` (preferência persistida), a câmara **real** publica o feed já desfocada — o outro participante e o preview local vêem o fundo desfocada, pessoa nítida. Vídeo de teste intacto.

**Independent Test**: `localStorage.setItem('mesa.cameraBlur','strong')`, duas contas, A liga câmara (não teste) → B vê fundo desfocada; A põe `off` e recarrega/reaplica → nítido. [quickstart.md](./quickstart.md) §2 (efeito; o menu da seta pode ainda não existir).

### Implementation for User Story 1

- [X] T006 [US1] Use `createLocalVideoTrack` for the camera path in `frontend/src/pages/VoiceChannel.tsx` (`captureLocal` / `connect`); keep a `LocalVideoTrack` ref for the session (not only a raw `MediaStreamTrack`)
- [X] T007 [US1] On camera connect, if `readBlurMode()` is `light` or `strong`, call `applyBlurMode` on that track in `frontend/src/pages/VoiceChannel.tsx`; **never** set a processor on `createTestVideoTrack` in `frontend/src/video/liveClient.ts` / `VoiceChannel.tsx` (FR-012)
- [X] T008 [US1] Attach local preview from the published/processed track only in `frontend/src/pages/VoiceChannel.tsx` (`onLocalTrack` / `layoutMedia`) — no parallel raw `srcObject` of the webcam

**Checkpoint**: Preferência `strong` + duas contas: B vê blur; vídeo de teste sem blur. Flash do 1.º frame ainda pode existir (US3).

---

## Phase 4: User Story 2 - Escolher sem / leve / forte no botão Câmara (Priority: P1)

**Goal**: Controlo **partido**: área principal toggle da câmara; **seta** abre menu Sem blur / Blur leve / Blur forte; persistência; seta com **forma** distinta quando blur ligado; mudar de modo sem sair da chamada.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 2

- [X] T009 [P] [US2] Implement `IconChevronDown` and `IconChevronDownBlur` (forma extra pip/losango, `currentColor`, viewBox 24) in `frontend/src/components/icons/IconChevron.tsx` per [012 icon-system](../012-shell-iconography-typography/contracts/icon-system.md) and [data-model.md](./data-model.md)
- [X] T010 [P] [US2] Add `.call-ctrl-split`, `.call-ctrl-chevron` (min target ≥40px), `.camera-blur-menu` in `frontend/src/styles/mesa-theme.css` per [contracts/camera-split-control.md](./contracts/camera-split-control.md)
- [X] T011 [US2] Implement `CameraBlurMenu` (role=menu, three `menuitemradio`, Escape / clique fora como `AccountMenu`) in `frontend/src/components/CameraBlurMenu.tsx` with copy «Sem blur» / «Blur leve» / «Blur forte»
- [X] T012 [US2] Split the Câmara control in `frontend/src/pages/VoiceChannel.tsx`: main click → `toggleCam` only; chevron → menu only; selecting a mode writes preference, calls `applyBlurMode` if live camera, updates chevron icon + `aria-label` («Fundo: sem blur» / «Fundo: blur ligado»); label visível continua «Câmara»

**Checkpoint**: quickstart §1; leve↔forte visível ≤2 s sem desligar câmara (SC-003).

---

## Phase 5: User Story 3 - Primeiro frame, falha fechada, indisponível (Priority: P2)

**Goal**: Ligar a câmara com leve/forte já escolhido **sem** flash do quarto nítido; falha do efeito **pára o vídeo** (não abre o quarto); sem suporte → mensagem e modo não fica ligado.

**Independent Test**: [quickstart.md](./quickstart.md) §3–§5.

### Implementation for User Story 3

- [X] T013 [US3] Implement `waitUntilBlurred` in `frontend/src/video/backgroundBlur.ts`: wait until processor output is blurred; **discard** the known LiveKit first passthrough frame per [research.md](./research.md) §3 and [contracts/background-blur-processor.md](./contracts/background-blur-processor.md)
- [X] T014 [US3] Gate camera publish / unmute in `frontend/src/pages/VoiceChannel.tsx` and `frontend/src/video/liveClient.ts`: if mode is `light`/`strong`, mute or delay publish until `waitUntilBlurred`; same gate on `toggleCam` turning camera **on**; when enabling blur while already live, mute → `applyBlurMode` → wait → unmute
- [X] T015 [US3] Fail-closed in `frontend/src/video/backgroundBlur.ts` + `frontend/src/pages/VoiceChannel.tsx`: on processor failure with `light`/`strong`, mute/disable **video only** (áudio continua), keep stored mode, show «Blur de fundo falhou — o vídeo está em pausa»; «Sem blur» resumes sharp; recovery reuses T014 gate (FR-015)
- [X] T016 [US3] If `supportsCameraBlur()` is false, choosing leve/forte in `frontend/src/components/CameraBlurMenu.tsx` / `frontend/src/pages/VoiceChannel.tsx` shows «Blur de fundo não disponível» and **does not** persist `light`/`strong` (FR-010)

**Checkpoint**: quickstart §3 (zero frames nítidos ao ligar); §4 indisponível; §5 falha fechada se forçável.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 [P] Run `cd frontend && npx tsc --noEmit` and fix type errors from processor/LocalVideoTrack types
- [X] T018 Execute [quickstart.md](./quickstart.md) §1–§4 (e §5–§6 se Egress/falha forçável) and fix gaps
- [X] T019 [P] Grep to ensure no accidental backend changes under `backend/` for this feature
- [X] T020 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)** → **Foundational (T003–T005)** → **US1 (T006–T008)** → **US2 (T009–T012)** → **US3 (T013–T016)** → **Polish**
- T004 depends on T001–T002 (package + `/mediapipe/` assets)
- T007 depends on T004–T006
- T012 depends on T009–T011 and US1 track ref (T006)
- T014–T015 depend on T013; T016 depends on T011 menu existing

### User Story Dependencies

```text
Foundational (preference + processor + LocalVideoTrack publish)
    ├── US1 Published blur (MVP) — preference + applyBlurMode; UI can be localStorage
    ├── US2 Split + menu — needs US1 track ref to switchTo ao vivo
    └── US3 First-frame gate + fail-closed + FR-010 — needs US1 processor + US2 menu
```

### Parallel Opportunities

- T001 ‖ T002
- T009 ‖ T010 after Foundational (ícone ≠ CSS)
- T017 ‖ T019 in polish

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Preferência `strong` + duas contas; B vê blur; vídeo de teste sem blur |
| US2 | quickstart §1 (split, menu, seta com forma, persistência) |
| US3 | quickstart §3–§5 (1.º frame, indisponível, falha fechada) |

### Suggested MVP

**US1** after Setup + Foundational: blur no feed enviado via `mesa.cameraBlur`. Depois US2 (descoberta/UX) e US3 (privacidade do 1.º frame e fail-closed).

---

## Implementation Strategy

1. npm + assets locais MediaPipe.
2. Preferência + `BackgroundProcessor` + publish `LocalVideoTrack`.
3. Aplicar blur na câmara real (MVP demonstrável a duas contas).
4. Split Câmara + menu + seta.
5. Gate do 1.º frame, mute em falha, FR-010.
6. `tsc` + quickstart.

**Format validation**: All tasks use `- [ ]`, IDs T001–T020, `[P]`/`[USn]` where required, file paths included.
