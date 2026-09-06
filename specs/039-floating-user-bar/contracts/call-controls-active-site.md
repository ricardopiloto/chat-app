# Contract: Call-controls active site

## Rule

Exactly one **active** site for call actions (mic, deafen, camera/blur, leave):

1. **Stage** — user is connected and viewing the voice channel of the active call (`VoiceChannel` call-controls, including speaking aura on mic when on stage).
2. **User panel** — user is connected and **not** viewing that stage.
3. Never both active.

## Shared state

All sites read/write the same `VoiceSession` fields (`micOn`, `camOn`, `deafened`, hangup). No divergent local copies except ephemeral UI (menus open).

## Blur

`CameraBlurMenu` mounts next to the camera control on the **active** site only.

## Stage chrome

Do not delete stage call-controls permanently; hide or skip rendering their interactive group when site ≠ stage (or simply don't show VoiceChannel when off-stage — when on-stage, panel hides its group).
