# Contract: Panel-only call controls (+ recording UI off)

**Feature**: 049-panel-only-call-controls  
**Surfaces**: `.user-panel-calls`, stage `.call-controls`, scene-record actions  
**Supersedes**: [043 panel-calls-visibility](../043-panel-calls-in-call-only/contracts/panel-calls-visibility.md) matrix rows for `onStage`; [042 user-panel-call-visibility](../042-panel-call-stage-ui/contracts/user-panel-call-visibility.md) “active site = stage”.

## Predicates

| Name | Definition |
|------|------------|
| `inCall` | Active voice/video session (`voice.live()`) |
| `showPanelCalls` | `inCall` |
| `showStageCallBar` | `false` (no stage personal call bar) |
| `showSceneRecordUi` | `false` (G1 suspended) |

## Visibility matrix

| Condition | `.user-panel-calls` | Stage `.call-controls` | Gravar / Parar |
|-----------|---------------------|------------------------|----------------|
| `!inCall` | **MUST NOT** exist | **MUST NOT** exist | **MUST NOT** exist |
| `inCall && onStage` | **MUST** exist (usable) | **MUST NOT** exist | **MUST NOT** exist |
| `inCall && !onStage` | **MUST** exist (usable) | **MUST NOT** exist | **MUST NOT** exist |

## Forbidden patterns

- `showPanelCalls = inCall && !onStage` (pre-049).
- Rendering stage mic/deafen/cam/leave bar while panel also has them (or at all).
- Idle / `is-disabled` call group on the panel when `!inCall`.
- Any visible «Gravar cena…» / «Parar gravação» (or equivalent record start/stop) in the shell.

## Allowed coexistence

- Identity row on `.user-panel` always.
- PiP when off-stage + panel call group when `inCall`.
- E2EE off banner + Religar E2EE (G2) on the voice pane — **not** scene-record controls.

## Acceptance probes (DOM)

**On stage, in call:**

1. `document.querySelector('.call-controls')` → `null`
2. `document.querySelector('.user-panel-calls')` → non-null
3. No button/label text matching /Gravar cena|Parar gravação/

**Not in call:**

1. `document.querySelector('.user-panel-calls')` → `null`
