---
description: "Task list for optimização frontend (dedupe + build) (053)"
---

# Tasks: Optimização do frontend (dedupe + build)

**Input**: Design documents from `/specs/053-frontend-build-optimize/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Spec pede gate de build + `tsc` + smoke quickstart (não TDD formal). Incluir validação de tamanho no polish / US1.

**Organization**: Setup → Foundational (lib/ + inventário) → US1 lazy voz/entry → US2 dedupe agressiva → US3 regressão → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`, `frontend/vite.config.ts`, `specs/053-frontend-build-optimize/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar feature dir e esqueleto de helpers/inventário.

- [x] T001 Confirm `.specify/feature.json` → `specs/053-frontend-build-optimize` and skim `frontend/src/App.tsx`, `frontend/src/voice/VoiceSession.tsx`, `frontend/vite.config.ts` against [plan.md](./plan.md)
- [x] T002 [P] Create `frontend/src/lib/` directory (placeholder `.gitkeep` or index) for shared helpers per [plan.md](./plan.md)
- [x] T003 [P] Create stub `specs/053-frontend-build-optimize/inventory.md` with status legend from [contracts/dedupe-inventory.md](./contracts/dedupe-inventory.md)

**Checkpoint**: Feature dir correcto; locais para inventário e helpers prontos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Inventário seed + tipos/estado de carga de voz — **bloqueia** US1–US3.

**⚠️ CRITICAL**: Não implementar lazy/dedupe completo até o inventário seed e o contrato de load state estarem definidos.

- [x] T004 Populate seed clusters C1–C8 in `specs/053-frontend-build-optimize/inventory.md` from [research.md](./research.md) R5 (files lists, status `pending`)
- [x] T005 [P] Add `VoiceLoadState` types/helpers in `frontend/src/voice/voiceLoadState.ts` (idle|loading|ready|failed) per [data-model.md](./data-model.md)
- [x] T006 [P] Add thin `frontend/src/lib/apiError.ts` skeleton (`errorMessage(err: unknown): string`) documented per FR-007 — consumers migrate in US2
- [x] T007 [P] Add thin `frontend/src/lib/capabilities.ts` skeleton (`hasCapability` / role aggregation helpers) per FR-007 — consumers migrate in US2
- [x] T008 [P] Add thin `frontend/src/lib/localPrefs.ts` skeleton (get/set JSON string keys) per FR-008 — consumers migrate in US2

**Checkpoint**: Inventário seed + lib skeletons + VoiceLoadState; stories podem começar.

---

## Phase 3: User Story 1 - Menor carga inicial / lazy voz (Priority: P1) 🎯 MVP

**Goal**: Entry JS &lt; 500 kB; LiveKit/voz só no join ou chamada activa; loading + retry; PiP intacto.

**Independent Test**: [quickstart.md](./quickstart.md) A–D; [contracts/build-entry-budget.md](./contracts/build-entry-budget.md); [contracts/voice-lazy-load-ux.md](./contracts/voice-lazy-load-ux.md).

### Implementation for User Story 1

- [x] T009 [US1] Split heavy LiveKit bind/session logic out of eager graph: extract module(s) under `frontend/src/voice/` (e.g. `voiceRuntime.ts` or equivalent) that statically import `livekit-client` / heavy `frontend/src/video/*` so they are **not** imported by the thin provider entry
- [x] T010 [US1] Refactor `frontend/src/voice/VoiceSession.tsx` into a **thin** provider (signals, PiP corner, mic/cam flags, public API) without top-level `livekit-client` import; load heavy module via `import()` on first join / when already live per FR-004
- [x] T011 [US1] Ensure `frontend/src/App.tsx` only mounts the thin provider; no static import path from App → `livekit-client`
- [x] T012 [US1] Wire join / connect paths in `frontend/src/pages/VoiceChannel.tsx` (and any join entry in shell) to trigger lazy load + set `VoiceLoadState` loading→ready|failed
- [x] T013 [US1] Add loading + **Tentar de novo** UI for voice module load failure (VoiceChannel and/or shared component under `frontend/src/voice/` or `frontend/src/components/`) per FR-004a; minimal CSS only if needed in `frontend/src/styles/mesa-theme.css`
- [x] T014 [US1] Verify `frontend/src/shell/FloatingVoicePip.tsx` and user-panel call controls keep working when live on text routes without re-importing LiveKit into the entry graph (dynamic import already resolved while call active) per FR-004b
- [x] T015 [US1] If entry still ≥500 kB after lazy split, add `build.rollupOptions.output.manualChunks` in `frontend/vite.config.ts` for `livekit-client` (optional crypto) per [research.md](./research.md) R4 — **do not** raise `chunkSizeWarningLimit`
- [x] T016 [US1] Run `cd frontend && npm run build` and record entry size in `specs/053-frontend-build-optimize/inventory.md` or plan note; confirm SC-001 (entry &lt; 500 kB, no entry warning)

**Checkpoint**: US1 / FR-003–004b; MVP deployable on size alone.

---

## Phase 4: User Story 2 - Dedupe agressiva (Priority: P1)

**Goal**: Inventário completo com todos os clusters terminal; unificação agressiva em helpers locais.

**Independent Test**: [contracts/dedupe-inventory.md](./contracts/dedupe-inventory.md); SC-002 / SC-005; `tsc --noEmit`.

### Implementation for User Story 2

- [x] T017 [US2] Complete inventory scan of `frontend/src` — add any clusters beyond C1–C8 to `specs/053-frontend-build-optimize/inventory.md` (no obvious cluster left `pending` without review)
- [x] T018 [US2] Finish `frontend/src/lib/apiError.ts` and migrate C1 call sites (`RolesPanel`, `ChannelAclPanel`, `SceneList`, `SceneEditor`, `Sidebar`, `GridAdmin`, `CoDirectorPanel`, `ImageUploadDialog`, `RolePermissionsPage`, and others listed in inventory)
- [x] T019 [P] [US2] Align C2 domain mappers: keep `frontend/src/pages/Auth.tsx`, `frontend/src/pages/Invite.tsx`, `frontend/src/voice/joinErrors.ts` as thin wrappers over shared base where safe; mark intentional divergences in inventory
- [x] T020 [US2] Finish `frontend/src/lib/capabilities.ts` and migrate C3 gates in `frontend/src/shell/Sidebar.tsx` (+ any invite/role UI gates) to shared helper
- [x] T021 [US2] Finish `frontend/src/lib/localPrefs.ts` and migrate C4 readers/writers in `frontend/src/theme/theme.ts`, `frontend/src/blur/blurPreference.ts`, `frontend/src/preferences/*` without changing storage keys (FR-008)
- [x] T022 [US2] Unify C5 panel load/error/saving patterns where cheap (`frontend/src/components/RolesPanel.tsx`, `ChannelAclPanel.tsx`, related Dialog consumers) via small helper or shared hook-style functions under `frontend/src/lib/`
- [x] T023 [US2] Reduce C6 duplicated `AppShell` route wrappers in `frontend/src/App.tsx` (factory/helper component in `frontend/src/shell/` or inline helper) without behaviour change
- [x] T024 [P] [US2] Unify C7 safe media play/attach helpers used by `frontend/src/video/liveClient.ts`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/shell/FloatingVoicePip.tsx` into `frontend/src/lib/safeMedia.ts` (or equivalent)
- [x] T025 [P] [US2] Unify C8 key-sync user-facing copy helper for `frontend/src/pages/Channel.tsx` and `frontend/src/pages/VoiceChannel.tsx` if still duplicated; else mark false-positive/intentional in inventory
- [x] T026 [US2] Mark every inventory cluster `unified` | `false-positive` | `intentional-divergence` with notes; zero `pending` left in `specs/053-frontend-build-optimize/inventory.md`

**Checkpoint**: US2 / FR-001–002 / SC-002.

---

## Phase 5: User Story 3 - Comportamento preservado (Priority: P2)

**Goal**: Sem regressão funcional observável após optimize + dedupe.

**Independent Test**: [quickstart.md](./quickstart.md) B–D + F; SC-003 / SC-004.

### Implementation for User Story 3

- [x] T027 [US3] Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and fix any type errors from lazy/dedupe refactors
- [x] T028 [US3] Smoke auth → text channel → voice join → PiP on text → hangup per [quickstart.md](./quickstart.md); note results in `specs/053-frontend-build-optimize/inventory.md` or daily
- [x] T029 [US3] Confirm API contracts unchanged (no backend edits unless strictly required); if any FE client signature drift, fix in `frontend/src/api/client.ts` without server changes

**Checkpoint**: US3 / FR-005–006.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Docs de entrega, changelog, daily.

- [x] T030 Re-run `cd frontend && npm run build` and paste final entry size vs baseline (~963 kB) into `specs/053-frontend-build-optimize/inventory.md`
- [x] T031 Execute remaining [quickstart.md](./quickstart.md) A–F; note skips
- [x] T032 [P] Update `CHANGELOG.md` `[Unreleased]` for `053-frontend-build-optimize`
- [x] T033 [P] Update `docs/daily/yyyy-mm-dd.md` Speckit implement section for 053

**Checkpoint**: Feature ready to demo / deploy frontend.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T003)** → none
- **Foundational (T004–T008)** → after Setup; **blocks all stories**
- **US1 (T009–T016)** → after Foundational (MVP size)
- **US2 (T017–T026)** → after Foundational; can follow US1 or overlap if different files — prefer after T010 so voice files stabilize
- **US3 (T027–T029)** → after US1 + US2
- **Polish** → after US3

### User story dependencies

- **US1** — entry budget + lazy voice (MVP)
- **US2** — inventory + aggressive dedupe (independent value; safest after voice split settles)
- **US3** — regression gate over US1+US2

### Parallel opportunities

- T002 ∥ T003
- T005 ∥ T006 ∥ T007 ∥ T008 after T004 started
- T019 ∥ T024 ∥ T025 within US2 after helpers exist
- T032 ∥ T033

### Parallel example: after Foundational

```text
T009–T011 US1 thin provider + extract heavy module
T017 inventory completion scan (read-only) can start early
```

### Implementation strategy

1. **MVP**: T001–T016 (entry &lt; 500 kB + loading/retry + PiP)
2. **Maintainability**: T017–T026 (full inventory unified)
3. **Prove safe**: T027–T033

### Notes

- CSS modularization **out of scope** (FR-006a); only minimal styles for loading/retry.
- Never “fix” SC-001 by raising `chunkSizeWarningLimit`.
- Do not merge intentional error-message divergences (auth vs voice join) without inventory justification.
- Crypto may stay on auth entry path if needed; prioritize LiveKit out of entry ([research.md](./research.md) R8).
