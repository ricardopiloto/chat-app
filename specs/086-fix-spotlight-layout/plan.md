# Implementation Plan: Destaque de ecrã visível na Grade

**Branch**: `086-fix-spotlight-layout` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/086-fix-spotlight-layout/spec.md`

**Note**: `.specify/feature.json` → `specs/086-fix-spotlight-layout`. Clarifications: spotlight = **main stage + bottom filmstrip**; off = unified 083 grid. Root cause of crush: `grid-row: span 2` with only one row track.

## Summary

1. **Remove** spotlight-via-`grid-column/row: span 2` on equal-grid cells (causes ~8px crushed tile off usable stage).
2. **When** `spotlightId` matches a screen tile: render Grade as **column layout** — large **main stage** (highlighted screen) on top + **bottom filmstrip** (cameras + other screens).
3. **When** spotlight off: keep current **unified equal grid** (083) + screen fit (085).
4. Keep attach-by-tile-key, chips, local spotlight toggle, Composition unchanged.

## Technical Context

**Language/Version**: TypeScript / SolidJS; CSS in `mesa-theme.css`. No backend.

**Primary Dependencies**: `CameraGrid.tsx` (Grade branch + `tileStyle` / spotlight UI), `mesa-theme.css` (stage / screen-tile rules), `VoiceChannel.tsx` only if props need tweak (prefer CameraGrid-local).

**Storage**: N/A (`spotlightId` already session-local).

**Testing**: `cd frontend && ./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser voice pane Grade mode.

**Project Type**: FE-only layout fix.

**Performance Goals**: Same attach cost; layout switch is DOM structure/CSS only.

**Constraints**: Do not reintroduce 082 screen/camera **priority bands as default Grade**. Spotlight-on layout is intentional main+strip only while spotlight active (FR-009). Preserve 085 contain on screen videos in both regions.

**Scale/Scope**: CameraGrid Grade spotlight layout + CSS; no capture/API changes.

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

UI contract + layout model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/086-fix-spotlight-layout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── spotlight-main-strip.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/components/CameraGrid.tsx   # dual Grade modes: unified grid vs main+bottom strip
frontend/src/styles/mesa-theme.css       # .grade-stage-spotlight / main / filmstrip; remove crush span reliance
# VoiceChannel.tsx — only if attach/spotlight wiring needs adjustment (prefer none)
```

**Structure Decision**: Branch Grade UI on `spotlightId`: if set and matching a screen tile in `gradeTiles`, render main+strip; else unified grid. Delete or stop using `tileStyle` span-2.

## Complexity Tracking

N/A
