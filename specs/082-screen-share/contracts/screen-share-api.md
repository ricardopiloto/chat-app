# Contract: Screen share HTTP API

## Endpoints

Prefer dedicated routes (clear intent); alternatively extend `PATCH .../voice/media` with `screen_on`. Implementation may choose one — behaviour MUST match.

### Option A (preferred): dedicated

```http
POST /api/channels/{channel_id}/voice/screen-share/start
Authorization: Bearer …
```

```http
POST /api/channels/{channel_id}/voice/screen-share/stop
Authorization: Bearer …
```

**Auth**: Same as other voice routes — caller MUST be an occupant of `{channel_id}`.

**Start behaviour**:
1. If not occupant → 403/404 per existing voice conventions.
2. Set `screen_on = true` (idempotent if already true).
3. Broadcast updated channel occupancy snapshot.
4. Response: `200` + occupancy payload or empty OK (must be consistent with join/media style).

**Stop behaviour**:
1. Set `screen_on = false` (idempotent).
2. Broadcast occupancy.
3. `200`.

### Option B: media patch

```http
PATCH /api/channels/{channel_id}/voice/media
{ "mic_on"?: bool, "cam_on"?: bool, "screen_on"?: bool }
```

Partial update; omitted fields unchanged. `screen_on` idempotent.

## Errors

| Case | Behaviour |
|------|-----------|
| Cancelled getDisplayMedia (client never calls start) | No server change |
| Start without LiveKit publish | Client SHOULD only call start after successful enable; if server true but no track, remotes see indicator without video — client must stop on publish failure |
| Not in channel | Reject like other voice media calls |

## Occupancy GET

`GET .../voice-occupancy` (existing) MUST include `screen_on` on each occupant after migration.
