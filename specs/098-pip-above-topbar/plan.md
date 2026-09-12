# Implementation Plan: Floating PiP Above Top Bar

**Branch**: `098-pip-above-topbar` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/098-pip-above-topbar/spec.md`

**Note**: Clarification (2026-09-11): PiP stacks above the **top bar chrome strip**; **open** top-bar menus (notif / search / account) stack **above** the PiP; full-screen dialogs remain above everything.

## Summary

Fix floating call PiP (`.voice-pip`) painting **under** the app top bar (`.topbar`) so overlap hides or steals clicks. Today `.topbar` is `z-index: 50` and `.voice-pip` is `z-index: 40`. Raise PiP above the strip while ensuring open top-bar menus still beat the PiP (FR-006). Because those menus are **descendants** of `.topbar`, a non-`auto` z-index on `.topbar` traps them in one stacking context—CSS-only fix requires clearing that trap (remove/auto `.topbar` z-index), then ordering: chrome &lt; PiP &lt; menus &lt; dialogs/context menus.

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; CSS in `mesa-theme.css` (primary). No backend.

**Primary Dependencies**: Existing `FloatingVoicePip` + `TopBar` shell; stacking via CSS `position` / `z-index` only.

**Storage**: N/A (PiP corner memory unchanged).

**Testing**: Manual overlap + menu-open checks per [quickstart.md](./quickstart.md); `cd frontend && npm run build`.

**Target Platform**: Modern browsers; desktop primary; narrow/drawer layouts still must stack correctly when PiP crosses the top bar.

**Project Type**: Web app — shell chrome layering fix.

**Performance Goals**: N/A beyond paint/hit-test correctness (no animation dependency).

**Constraints**: Chrome/layering only (FR-004); both themes (FR-005); do not hide/remove top bar (FR-003); dialogs (`.dialog-backdrop` ~100) and context menus (~80) stay above PiP.

**Scale/Scope**: Primarily `frontend/src/styles/mesa-theme.css` z-index on `.topbar`, `.voice-pip`, and top-bar menu panels; TS/portal only if CSS escape proves insufficient (see research).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Spec-driven / clarify before plan | Pass — FR-006 stacking locked |
| Prefer minimal FE CSS; no backend | Pass |
| No unrelated redesign / new PiP features | Pass |
| Manual + build validation | Pass |

**Post-design**: Still pass — UI stacking contract only; no new public APIs.

## Project Structure

### Documentation (this feature)

```text
specs/098-pip-above-topbar/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── shell-stacking.md
└── tasks.md              # /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
frontend/src/
├── styles/mesa-theme.css     # .topbar, .voice-pip, topbar menu z-index
├── shell/FloatingVoicePip.tsx  # reference only unless portal needed
├── shell/TopBar.tsx            # menu markup / anchors
├── shell/AppShell.tsx          # PiP mount site
└── styles/nocturne.css         # dialog z-index reference (~100)
```

**Structure Decision**: CSS stacking fix in `mesa-theme.css`; touch Solid components only if menus must portal out of `.topbar` (fallback).

## Complexity Tracking

> No constitution violations requiring justification.
