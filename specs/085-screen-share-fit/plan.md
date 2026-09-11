# Implementation Plan: Partilha de ecrã sem o «zoom» das câmaras

**Branch**: `085-screen-share-fit` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/085-screen-share-fit/spec.md`

**Note**: `.specify/feature.json` → `specs/085-screen-share-fit`. Clarifications: Grade-only (remote + local + spotlight); letterbox neutro escuro / tipo slot. Layout from [083](../083-grade-screen-tiles/) unchanged.

## Summary

1. Grade **screen** tiles currently inherit webcam `object-fit: cover` (crop/fill) from `.slot-media video`.
2. Override screen tiles to **show the full frame** (`contain`) with a **neutral dark** letterbox background.
3. Keep camera tiles (Grade + Composition) on **cover**; do not change capture, 083 grid, chips, spotlight sizing, PiP, or Composition rules.
4. Ensure local screen preview in Grade gets the same fit (same DOM class path as remote screen tiles).

## Technical Context

**Language/Version**: TypeScript / SolidJS; CSS in `mesa-theme.css`. No backend/API/migration.

**Primary Dependencies**: `CameraGrid.tsx` (already marks `.grade-screen-tile`), `mesa-theme.css` (`.slot-media video` cover rule), optional tiny class on attached screen `<video>` if CSS specificity needs help.

**Storage**: N/A (pure presentation).

**Testing**: `cd frontend && ./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser voice pane Grade mode.

**Project Type**: FE-only CSS/presentation fix.

**Performance Goals**: No extra media cost; CSS-only preferred.

**Constraints**: Grade screen tiles only (FR-006). Cameras unchanged (FR-002). No user toggle. No PiP. No mirror on screen content.

**Scale/Scope**: One visual behavior split: camera fill vs screen contain inside existing unified Grade tiles.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contract + fit model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/085-screen-share-fit/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── grade-screen-fit.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/styles/mesa-theme.css         # .grade-screen-tile video: contain + dark letterbox bg
frontend/src/components/CameraGrid.tsx     # ensure screen slots keep .grade-screen-tile (already); optional video class if needed
# Touch VoiceChannel / VoiceSession only if attach path does not inherit tile class (prefer avoid)
```

**Structure Decision**: Prefer CSS scoped under `.grade-screen-tile` (083 already sets this class). Avoid JS unless a LiveKit-attached video fails to inherit (e.g. wrong parent).

## Complexity Tracking

N/A
