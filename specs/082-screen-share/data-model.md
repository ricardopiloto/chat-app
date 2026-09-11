# Data Model: 082-screen-share

## Entities

### VoiceOccupant (extended)

Existing voice occupancy row / in-memory occupant, plus screen share flag.

| Field | Type | Notes |
|-------|------|--------|
| account_id | UUID | PK part |
| channel_id | UUID | PK part |
| server_id | UUID | |
| mic_on | bool | existing |
| cam_on | bool | existing |
| screen_on | bool | **new**; default false |
| joined_at | datetime | existing |
| last_seen_at | datetime | existing |

**OccupantView** (API/WS): add `screen_on: bool` alongside `mic_on` / `cam_on`.

**Derived**: `active_screen_sharers(channel) = occupants.filter(o => o.screen_on)`.

### Channel occupancy snapshot

Unchanged envelope (`channel_id`, `call_started_at`, `occupants[]`) with extended occupant views. Clients derive indicator = `occupants.some(screen_on)`.

### Client view mode (unchanged)

| Field | Storage | Notes |
|-------|---------|--------|
| viewMode | `mesa.viewMode` localStorage | `"composition" \| "grid"`; not server-canonical; not mutated by share |

### Client local view prefs (session memory)

| Field | Type | Notes |
|-------|------|--------|
| spotlightedAccountId | UUID \| null | Only valid if that account has `screen_on`; clear when they stop or leave Grade |
| screenShareEnabled (local) | bool | Mirrors LiveKit local publication; sync to server start/stop |

No `follow_channel_layout` / `pre_share_scene_id` (removed from product).

## Relationships

- Account --occupies--> Channel (voice) with media flags including screen_on.
- LiveKit participant publications: Camera, Microphone, ScreenShare, ScreenShareAudio (optional) are media facts; server `screen_on` is the product truth for indicators and idempotent API.

## Validation / invariants

1. `screen_on` start/stop are **idempotent** (true→true / false→false = success).
2. Leave channel / stale occupant removal ⇒ `screen_on` cleared (occupant gone).
3. Setting `screen_on=true` does **not** require or change `cam_on`.
4. Server never writes client `viewMode`.
5. Spotlight target MUST be in active sharers set; else null.

## State transitions

```text
screen_on: false --start (auth, in channel)--> true
screen_on: true  --stop / leave / stale------> false
viewMode:  unchanged on all screen transitions
```

## Migration

- Add `screen_on BOOLEAN NOT NULL DEFAULT FALSE` to `voice_occupant` (or equivalent store).
- Backfill: all existing rows false.
