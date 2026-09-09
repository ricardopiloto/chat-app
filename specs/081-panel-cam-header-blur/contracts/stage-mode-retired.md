# Contract: Stage mode retired (081)

**Feature**: [081-panel-cam-header-blur](../spec.md)  
**Scope**: Shell stage layout + voice header toggle.

## MUST

| ID | Rule |
|----|------|
| SM-01 | «Modo palco» / Stage mode button MUST NOT appear on the voice pane header |
| SM-02 | Shell MUST NOT apply stage-mode layout (class/state always off) |
| SM-03 | Joining or focusing a voice call MUST NOT turn stage mode on |
| SM-04 | Legacy stage preference MUST NOT re-enable stage layout |

## Allowed

- PiP “return to call / channel” navigation without enabling stage layout
- Dead code cleanup of stage helpers in a follow-up if not fully deleted

## Non-goals

- Redesigning composition/grid beyond living without stage chrome
