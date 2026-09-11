# Contract: Client unload leave (087)

**ID prefix**: UL  
**Surface**: Browser tab owning the live call  
**Related**: [spec](../spec.md), existing `POST /api/channels/{id}/voice/leave`

## Rules

| ID | Rule |
|----|------|
| UL-01 | On `pagehide` while in a live call, the client MUST attempt `POST .../voice/leave` with a transport that can complete during unload (e.g. `fetch` + `keepalive: true`). |
| UL-02 | Unload leave MUST run **before** or without waiting on heavy async media release that would prevent the leave request from being sent. |
| UL-03 | After successful unload leave (or server stale clear), peers MUST see the user as not in the call; the unloader MUST NOT appear connected until a new join. |
| UL-04 | In-app Leave/`hangup` MUST remain functional and idempotent with unload leave. |
| UL-05 | Unload MUST NOT clear Mesa auth/session cookies as part of this feature. |
| UL-06 | At most one live call occupancy per account; unloading the call tab clears that occupancy globally. |

## Non-goals

- Guaranteed leave on forced process kill (covered by server stale contract)
- Changing join token / LiveKit room APIs beyond disconnect side effects of leave
