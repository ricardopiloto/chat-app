# Contract: Grade layout + local spotlight

## Grade layout with shares

| ID | Rule |
|----|------|
| GL-01 | ScreenShare video tiles occupy primary area; camera tiles secondary row/band. |
| GL-02 | Multiple screens without spotlight: roughly equal split of primary area. |
| GL-03 | Local participant’s own ScreenShare appears as a screen tile (not only remotes). |
| GL-04 | Camera publication for an identity remains a camera tile even if they also screen-share (two surfaces). |

## Spotlight (local only)

| ID | Rule |
|----|------|
| SP-01 | Available only in Grade when ≥1 screen tile exists. |
| SP-02 | Targets only accounts with active screen share (`screen_on` / ScreenShare track). |
| SP-03 | Spotlight enlarges that screen; other screens + cameras reduced — **this client only**. |
| SP-04 | If spotlighted sharer stops → spotlight = null (no auto-pick next). |
| SP-05 | Leaving Grade may clear spotlight UI state (recommended); must not affect server. |

## Non-goals

- No server-synced spotlight.
- No «follow composition» / pre_share restore.
- No forced viewMode writes.
