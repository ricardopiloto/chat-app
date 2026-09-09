# Implementation Plan: Controlo de câmara do painel — tamanho e alinhamento

**Branch**: `075-panel-cam-ctrl-align` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/075-panel-cam-ctrl-align/spec.md`

**Note**: `.specify/feature.json` → `specs/075-panel-cam-ctrl-align`. Clarifications: keep horizontal camera+chevron split (compact); center call icons **only** in narrow column (stage + channels collapsed).

## Summary

Bring the **user-panel camera/blur split** to the same **32×32 exterior height** as mic / deafen / leave, keep a **compact horizontal** chevron split that **fits** the narrow panel without overflow, and **center** the call-control row when `.shell.stage-mode.channels-collapsed`. Prefer **CSS specificity under `.user-panel`** so stage/header `.call-ctrl-split` sizes stay unchanged.

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; CSS in `mesa-theme.css`.

**Primary Dependencies**: `frontend/src/shell/UserPanel.tsx` (markup/classes); `frontend/src/styles/mesa-theme.css` (`.user-panel-calls`, `.user-panel-ctrl`, `.user-panel-cam-split`, `.call-ctrl-split`); shell classes `stage-mode` / `channels-collapsed` from `AppShell.tsx`.

**Storage**: N/A (layout/CSS only).

**Testing**: Manual [quickstart.md](./quickstart.md) A–D; `cd frontend && npx tsc --noEmit` if TS/markup touched. No new BE contracts.

**Target Platform**: Browser — authenticated shell, voice call with user panel visible.

**Project Type**: Frontend UI polish (layout/CSS).

**Performance Goals**: Negligible; static CSS rules.

**Constraints**: Do not enlarge mic/deafen/leave to match camera (FR-006); keep blur on chevron (FR-003); open blur menu overlay MAY escape the card; closed split MUST stay inside panel.

**Scale/Scope**: Small — primarily CSS overrides scoped to user panel + one narrow-column centering rule. Optional tiny class tweak in `UserPanel.tsx` only if needed for selectors.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual + tsc if markup changes |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI layout contract + view-state model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/075-panel-cam-ctrl-align/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── panel-call-ctrl-layout.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/styles/mesa-theme.css
  # Primary: override .call-ctrl-split when inside .user-panel
  # Center .user-panel-calls under .shell.stage-mode.channels-collapsed
frontend/src/shell/UserPanel.tsx
  # Markup already has user-panel-cam-split / user-panel-ctrl — touch only if needed
frontend/src/shell/AppShell.tsx
  # Already toggles stage-mode + channels-collapsed — no API change expected
frontend/src/components/CameraBlurMenu.tsx
  # Overlay behavior unchanged (MAY escape card)
```

**Structure Decision**: **CSS-first** fix under `.user-panel` / `.shell.stage-mode.channels-collapsed`. Avoid changing global stage call-control split sizes used elsewhere. No backend.

## Complexity Tracking

N/A
