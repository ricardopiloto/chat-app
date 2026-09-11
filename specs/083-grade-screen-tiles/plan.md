# Implementation Plan: Telas partilhadas como tiles iguais na Grade

**Branch**: `083-grade-screen-tiles` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/083-grade-screen-tiles/spec.md`

**Note**: `.specify/feature.json` → `specs/083-grade-screen-tiles`. Layout-only fix on top of [082-screen-share](../082-screen-share/). Clarifications: spotlight **screen-only** on unified grid; order **cameras then screens**; screen chip = handle + share indicator.

## Summary

1. **Remove** the 082 split Grade layout (`grade-stage-split` / screen band + camera band).
2. **Unify** Grade into one CSS grid of equal-weight tiles: camera tiles first, then screen-share tiles (same cell sizing as pre-share Grade).
3. **Keep** dual tiles per person (cam + screen), Composition rules, indicators, and panel share control from 082.
4. **Adapt** local spotlight so it enlarges a **screen** tile inside the unified grid (no band layout).
5. **Label** screen tiles with handle + share affordance (icon and/or i18n “tela”).

## Technical Context

**Language/Version**: TypeScript / SolidJS; CSS in `mesa-theme.css`. No backend/API/migration.

**Primary Dependencies**: `CameraGrid.tsx`, `VoiceChannel.tsx` (`layoutMedia`, `gradeScreenIds` / `gradeCameraIds`, spotlight), i18n catalogs, existing `IconScreenShare` if useful on chips.

**Storage**: N/A (layout + session-local spotlight only).

**Testing**: `cd frontend && ./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser voice pane Grade mode.

**Project Type**: FE-only UI layout adjustment.

**Performance Goals**: Same attach/detach cost as today; no extra media pubs.

**Constraints**: Do not change capture, occupancy `screen_on`, Composition (no screen video), or auto-mode rules. Do not reintroduce priority bands.

**Scale/Scope**: Grade layout + chip chrome + spotlight behavior; supersedes 082 visual contracts for Grade bands ([contracts/grade-layout-spotlight.md](../082-screen-share/contracts/grade-layout-spotlight.md) GL-01 band priority).

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

UI contracts + tile model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/083-grade-screen-tiles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── unified-grade-grid.md
│   ├── screen-tile-chip.md
│   └── spotlight-unified.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/components/CameraGrid.tsx     # single equal grid; cam then screen; spotlight span; screen chip
frontend/src/pages/VoiceChannel.tsx        # build ordered tile list; attach by tile key; spotlight API
frontend/src/styles/mesa-theme.css         # remove/retire grade-screen-band / grade-camera-band split; spotlight cell
frontend/src/i18n/catalogs/{en,pt-BR}.ts   # screen chip label / aria
# Optional: reuse IconScreenShare on chip
```

**Structure Decision**: FE-only. Prefer one `gradeTiles: { key, kind: 'camera'|'screen', accountId }[]` (or concat lists into one Index) over maintaining two separate stage bands.

## Complexity Tracking

N/A
