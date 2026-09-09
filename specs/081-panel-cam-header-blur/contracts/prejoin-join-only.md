# Contract: Pre-join JOIN-only (081)

**Feature**: [081-panel-cam-header-blur](../spec.md)  
**Scope**: `VoiceChannel` when `!live`.  
**Supersedes (partial)**: 078 voice-join-optin UI (camera opt-in + lazy preview + pre-join blur).

## MUST

| ID | Rule |
|----|------|
| PJ-01 | Pre-join MUST NOT show camera opt-in toggle |
| PJ-02 | Pre-join MUST NOT show blur controls or lazy camera preview |
| PJ-03 | Primary action MUST be JOIN using panel preferred camera (`voice.camOn()`) |
| PJ-04 | Listen-only join MAY remain as a single listen control |
| PJ-05 | Non-camera secondary (e.g. test video) MAY remain |

## Non-goals

- Dual join buttons (already removed in 078)
- Restoring pre-join blur menu
