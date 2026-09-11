# Implementation Plan: User Panel Always Stacked with Channel Label

**Branch**: `093-user-panel-fixed-layout` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/093-user-panel-fixed-layout/spec.md`

**Note**: User requested plan for `093` while `.specify/feature.json` had briefly pointed at `094`; this plan targets **093** and resets `feature.json` accordingly. Clarifications (2026-09-11): label = voice-call channel when live else open/selected; label read-only; display name only; collapse empty upper row.

## Summary

1. Make the user panel **always** use the two-row stacked layout (controls upper, identity + Settings lower)—**remove** 084 overflow measure / stack-unstack switching.
2. When no upper-row controls are visible, **collapse** that row (no tall empty band).
3. On the identity row, between name/status and Settings, show a **read-only channel display name**: live call’s voice channel if in call; otherwise open/selected channel; empty if neither.
4. Keep existing icon **visibility** rules and account/Settings entry; taller panel still **reflows** `.shell-nav` (no overlay). FE/CSS only.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); CSS in `mesa-theme.css`.

**Primary Dependencies**: `UserPanel.tsx`, `Sidebar.tsx` (or equivalent) for open-channel name, `VoiceSession` (`live`, `channelName`), existing call control handlers.

**Storage**: N/A — ephemeral UI; no prefs or server tables.

**Testing**: `tsc --noEmit`; manual [quickstart.md](./quickstart.md); UI contracts in [contracts/](./contracts/).

**Target Platform**: Browser — authenticated shell user panel.

**Project Type**: Web UI / shell chrome layout.

**Performance Goals**: No continuous layout measuring for stack hysteresis; label updates with route/voice signals only.

**Constraints**: No backend/API change; Settings never on upper row; channel label not clickable; no `#`/type icon required on label; no overlay over channel list; supersede 084 dynamic stack/unstack.

**Scale/Scope**: FE-only — `UserPanel` + CSS (+ thin prop/wiring from Sidebar for open channel name).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc + UI contracts |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contracts + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/093-user-panel-fixed-layout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── user-panel-fixed-layout.md
│   └── panel-channel-label.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx       # Always stacked; remove measureStack; channel label slot
frontend/src/shell/Sidebar.tsx         # Pass open/selected channel display name (or null)
frontend/src/styles/mesa-theme.css     # Always-stacked grid; collapse empty calls row; channel label truncates
frontend/src/i18n/catalogs/*.ts        # Optional aria-label for channel context if needed
frontend/src/voice/VoiceSession.tsx    # Read-only use of live + channelName (already exists)
```

**Structure Decision**: FE-only. Reuse `.user-panel--stacked` CSS as the permanent layout; drop ResizeObserver stack hysteresis. Label source: `voice.live() ? voice.channelName() : openChannelNameProp`.

## Complexity Tracking

> No unjustified complexity. Removes measurement logic; adds one display-only label + prop wiring.
