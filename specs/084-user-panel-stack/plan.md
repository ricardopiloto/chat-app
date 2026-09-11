# Implementation Plan: User Panel Stack for Control Overflow

**Branch**: `084-user-panel-stack` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/084-user-panel-stack/spec.md`

**Note**: `.specify/feature.json` → `specs/084-user-panel-stack`. Clarifications (2026-09-10): panel height **reflows** shell-nav (push up); Settings stays on **identity row**; stack when name would fall below **min readable width**.

## Summary

1. When a single-row user panel would shrink the handle below a **minimum readable width**, switch to a **two-level** layout: centered **call/action** icons on an upper row; identity + **Settings** on the lower row.
2. Taller panel grows in normal document flow so `shell-nav` **reflows** (channel list cedes space)—no overlay.
3. Collapse back to single-row when the name fits again. Control behaviors unchanged; FE/CSS only.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); CSS in `mesa-theme.css`.

**Primary Dependencies**: `UserPanel.tsx`, `mesa-theme.css` (`.user-panel`, `.shell-nav`), existing voice session / call control handlers (unchanged semantics).

**Storage**: N/A — ephemeral layout class/state only; no prefs or server tables.

**Testing**: `tsc --noEmit`; manual [quickstart.md](./quickstart.md); UI contract checklist in [contracts/](./contracts/).

**Target Platform**: Browser — authenticated shell user panel.

**Project Type**: Web UI / shell chrome layout.

**Performance Goals**: Layout measure via `ResizeObserver` (or equivalent) without jank; no network; debounce/hysteresis to avoid row flicker at the threshold.

**Constraints**: No backend/API change; Settings never on upper row; no absolute overlay over channel list; stack trigger = min name width, not fixed icon count / always-in-call.

**Scale/Scope**: FE-only — `UserPanel` structure + CSS (+ optional tiny measure helper).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc + UI contract |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contracts + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/084-user-panel-stack/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── user-panel-stack.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx       # Two-row DOM when stacked; Settings beside identity; measure → stacked class
frontend/src/styles/mesa-theme.css     # .user-panel--stacked; upper centered actions; ensure flow height (no overlay)
# Optional: small measure helper colocated in UserPanel or shell/ if reused
```

**Structure Decision**: FE-only. Reuse existing `.shell-nav` grid (`1fr` / `auto`) so taller `.user-panel` on row 2 naturally shrinks row 1.

## Complexity Tracking

N/A
