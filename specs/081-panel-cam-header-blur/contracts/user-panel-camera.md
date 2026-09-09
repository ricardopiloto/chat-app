# Contract: User panel camera (081)

**Feature**: [081-panel-cam-header-blur](../spec.md)  
**Scope**: `UserPanel` + `VoiceSession` preferred cam. No HTTP API.  
**Supersedes (partial)**: 078 UP-01 (no cam on panel); 080 bottom-bar camera ownership.

## Layout (controls)

```text
[ identity ] [ leave? ] [ mic ] [ deafen ] [ camera ] [ settings ]
```

## MUST

| ID | Rule |
|----|------|
| PC-01 | Camera MUST appear after deafen and before settings |
| PC-02 | Camera MUST match mic/deafen visual model (simple icon button; no blur/chevron) |
| PC-03 | Out of call, camera MUST toggle session preferred cam (default false) |
| PC-04 | In call with publish permission, camera MUST call live toggle (enable/disable video) |
| PC-05 | Listen-only MUST NOT publish via this control (disabled or non-publishing) |
| PC-06 | JOIN MUST use preferred cam (`camera` vs `audio` / `cam_on`) |

## Non-goals

- Blur on the panel camera button
- Device pickers
