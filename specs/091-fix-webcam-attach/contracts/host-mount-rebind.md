# Contract: Host-mount rebind for camera (and screen) layout

**Feature**: 091-fix-webcam-attach  
**Surfaces**: `CameraGrid` refs → `attachSlot` / `attachGradeTile`, `VoiceChannel.layoutMedia`, Grade remount catalysts

## Principle

Track arrival and host mount are **unordered**. Layout MUST succeed when either happens second.

## Host registration

| Mode | Callback | Key |
|------|----------|-----|
| Composition | `attachSlot(index, el)` | slot index |
| Grade | `attachGradeTile(key, el)` | `cam:{id}` / `screen:{id}` |

On register (and when key’s element is replaced after remount):

1. Store element in the host map.
2. Schedule `layoutMedia()` (microtask / rAF as today).
3. Placement MUST be **idempotent** (safe to call repeatedly).

## Layout placement rules

### Grade (`viewMode === "grid"`)

- Remote cams: `remotesCam` → `cam:{identity}` host via `attachRemote`.
- Local cam: session/page preview → `cam:{me}` host.
- Screens: unchanged 082/083/088 behavior; cam placement MUST still run after screen remounts.

### Composition

- Remote cams → slot for `account_id`.
- Local cam → self slot.
- **No** screen video in Composition slots (082).

## Remount catalysts (FR-011, FR-013, SC-007)

Examples: start/stop screen share, spotlight toggle, Grade list refresh, Composition ↔ Grade switch.

- After remount, cameras that were on MUST be visible again.
- Transient blank **≤ ~1 s** that self-recovers is acceptable.
- Permanent blank or blank that needs leave/rejoin/share = failure.

## Remote budget (FR-015)

Once remote camera track is known **and** host is registered → visible within **~2 s**. Delay before track subscribe is outside this budget.

## Non-goals

- New LiveKit protocol or occupancy fields.
- PiP host map.
- Changing screen-tile clear rules (088) except ensuring cam rebind still runs after clear.
