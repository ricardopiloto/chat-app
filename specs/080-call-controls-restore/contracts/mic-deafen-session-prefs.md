# Contract: Mic / deafen session preferences (080)

**Feature**: [080-call-controls-restore](../spec.md)  
**Scope**: `VoiceSession` + join path in `VoiceChannel`. No durable storage. No new HTTP shapes (reuse `mic_on` on join / media patch).

## MUST

| ID | Rule |
|----|------|
| MD-01 | Toggling mic out of call MUST change session preferred mic and panel UI |
| MD-02 | Toggling deafen out of call MUST change session preferred deafen and panel UI |
| MD-03 | Joining a call MUST apply preferred mic to the live session (and join `mic_on` when publishing) |
| MD-04 | Joining with preferred deafen on MUST apply deafen to remotes and keep mic off per existing live deafen semantics |
| MD-05 | Prefs MUST NOT be required to survive full page reload or a new browser tab |
| MD-06 | Listen-only members MUST NOT publish audio even if preferred mic is on; UI MUST stay coherent |
| MD-07 | In-call mic/deafen toggles MUST continue to affect the LiveKit session as today |

## Defaults (new browser session)

| Pref | Default |
|------|---------|
| mic preferred | on (`true`) |
| deafen preferred | off (`false`) |

## Non-goals

- Cross-device sync
- Server-stored media preferences
- Changing deafen-vs-mic coupling beyond existing live behaviour
