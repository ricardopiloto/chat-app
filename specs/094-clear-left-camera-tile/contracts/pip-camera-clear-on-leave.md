# Contract: PIP camera clear on leave

**Feature**: [094-clear-left-camera-tile](../spec.md)  
**Surface**: `FloatingVoicePip`

## MUST

| ID | Rule |
|----|------|
| PIP-01 | When a remote participant leaves the call, their camera MUST disappear from the PIP within ~2s — no frozen last frame |
| PIP-02 | Listen to LiveKit disconnect and/or track teardown such that PIP tile list drops departed remotes (not only subscribe events) |
| PIP-03 | Hosts for removed tile ids MUST detach/remove media elements; prune stale host map entries |
| PIP-04 | Local hangup MUST NOT leave the local user’s frozen camera in PIP after the call is over |
| PIP-05 | Camera-off while still connected may remove live video from PIP but MUST NOT be confused with full leave cleanup for other products surfaces (PIP may simply show fewer tiles) |

## Non-goals

- Redesigning PIP chrome or corner drag behavior.
- Showing screen-share tiles in PIP (unless already product behavior—out of 094 scope).
