# Contract: Voice lazy-load UX

**Feature**: 053-frontend-build-optimize  
**Surface**: Shell autenticada + canal voz/vídeo + PiP

## Load triggers (normative)

| Event | MAY load heavy voice stack? |
|-------|------------------------------|
| Open login / register | No |
| Open authenticated shell (no call) | No |
| Open text channel (no call) | No |
| First voice **join** (or equivalent connect) | Yes |
| Deep-link / navigate to voice channel needing stack | Yes (with loading UI) |
| Active call + navigate to text (PiP) | Stack MAY remain loaded |
| Hangup | Stack MAY stay cached in memory; MUST NOT force re-download on next join if browser cache allows |

## UI states

| State | Required UI |
|-------|-------------|
| Loading heavy module | Visible loading affordance; shell not “broken” |
| Load failure | Clear message + **Retry** action that re-attempts load |
| Ready | Existing voice/video behaviour (join media, leave, PiP, panel controls) |

## Non-goals

- Prefetch on login idle as the primary strategy
- Dropping PiP / in-call panel controls when on text routes during an active call
