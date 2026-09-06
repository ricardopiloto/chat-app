# Contract: Panel call controls visibility (in-call only)

**Feature**: 043-panel-calls-in-call-only  
**Surface**: User panel call group (`.user-panel-calls`)  
**Related**: [042 user-panel-call-visibility](../042-panel-call-stage-ui/contracts/user-panel-call-visibility.md) — same visibility matrix; 043 focuses on forbidding idle/disabled chrome.

## Predicates

| Name | Definition |
|------|------------|
| `inCall` | Active voice/video session (`voice.live()`) |
| `onStage` | Viewing the active call’s voice channel route (`viewingActiveVoiceStage`) |
| `showPanelCalls` | `inCall && !onStage` |

## Visibility matrix

| Condition | `.user-panel-calls` |
|-----------|---------------------|
| `!inCall` | **MUST NOT** exist in DOM (no disabled / empty group) |
| `inCall && onStage` | **MUST NOT** exist in DOM |
| `inCall && !onStage` | **MUST** exist; controls **enabled** (usable leave included) |

## Forbidden patterns

- Rendering the group with `is-disabled` (or equivalent) when `!inCall`.
- Keeping a zero-height / aria-hidden placeholder for «layout reserve» of call controls when idle.
- Showing leave (or mic/deafen/cam) in the panel when not in a call.

## Allowed coexistence

- Identity / account / settings row always present.
- Floating voice PiP may show when off-stage; panel call group may show at the same time when `showPanelCalls`.
- Stage call-controls remain the active site when `onStage`.

## Acceptance probe (DOM)

Sem chamada, após hard refresh:

1. Query `document.querySelector('.user-panel-calls')` → `null`.
2. Nenhum botão com aria-label «Sair da chamada» (ou equivalente) dentro de `.user-panel`.
