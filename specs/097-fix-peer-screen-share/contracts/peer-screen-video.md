# Contract: Peer screen video (Grade)

**Feature**: 097-fix-peer-screen-share  
**Date**: 2026-09-11  
**Type**: FE media / layout behavior

## Parties

- **Sharer**: publishes `Track.Source.ScreenShare`
- **Peer viewer**: Grade mode in same call
- **Layout**: `VoiceChannel.layoutMedia` + `CameraGrid` `screen:{id}` hosts

## Guarantees

### PSV-01 — Live peer tile

When a remote ScreenShare video track is subscribed, the peer’s Grade screen tile for that identity MUST show **live** shared content (updating frames), not a blank/black cell, within ~5s of share start on a normal local setup.

### PSV-02 — Bidirectional

PSV-01 MUST hold A→B and B→A under the same conditions without leave/rejoin or stop/start as a workaround.

### PSV-03 — Mid-share arrival

A viewer who joins the call or switches to Grade while a peer is already sharing MUST get live content in that screen tile without the sharer restarting solely for them.

### PSV-04 — Stop clears peers

When the sharer stops (in-app or OS), peers MUST lose that screen tile/content (088); no ghost empty screen cell.

### PSV-05 — Grade-only video

Composition MUST NOT gain screen video tiles as part of this fix.

### PSV-06 — Camera independence

Starting/stopping share MUST NOT flip camera on/off as a side effect; peer camera video that already works MUST remain usable.

## Failure signals

| Symptom | Likely area |
|---------|-------------|
| Chip present, no `<video>` in host | attach / host-mount race / `layoutMedia` skip |
| `<video>` present, forever black | decode / E2EE / play / SFU |
| Only self live | local-publication path masking remote failure |
