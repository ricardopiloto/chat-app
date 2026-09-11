# Contract: Screen share WebSocket

## Event

Reuse **`voice.occupancy`** (existing) with extended occupant objects:

```json
{
  "type": "voice.occupancy",
  "payload": {
    "channels": [
      {
        "channel_id": "…",
        "call_started_at": "…",
        "occupants": [
          {
            "account_id": "…",
            "handle": "…",
            "mic_on": true,
            "cam_on": false,
            "screen_on": true,
            "has_avatar": false
          }
        ]
      }
    ]
  }
}
```

(Exact envelope MUST match current hub serialization; only `screen_on` is additive.)

## Client duties

1. On snapshot: update occupancy map; `channelHasScreenShare = occupants.some(o => o.screen_on)`.
2. Drive Grade seg indicator + sidebar channel-item indicator from that flag.
3. Clear local spotlight if spotlighted id no longer has `screen_on`.
4. No layout mode mutation on occupancy changes.

## Optional alias

A dedicated `voice.screen_share_changed` with `{ channel_id, active_participants: [] }` is **not required** if occupancy always carries `screen_on`. If added for clarity, it MUST still be a full snapshot and stay consistent with occupancy.
