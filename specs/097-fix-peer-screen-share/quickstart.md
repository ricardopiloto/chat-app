# Quickstart: Fix Peer Screen Share Visibility

**Feature**: 097-fix-peer-screen-share  
**Date**: 2026-09-11

Manual two-browser validation for [spec.md](./spec.md) SC-001–SC-006. See [contracts/](./contracts/).

## Prerequisites

- App running (FE + BE + LiveKit as usual).
- Two accounts / browsers (A and B), same voice channel, both in **Grade**.
- Prefer Chromium for system/tab audio checkbox when testing PSA.
- Product deafen **off** unless testing mute paths.

## Build

```bash
cd frontend && npm run build
```

## US1 / US2 — Peer live video + share audio (both directions)

1. A and B join voice; both switch to **Grade**.
2. A starts **screen share** (include system/tab audio if the picker offers it).
3. Within ~5s: **B** sees A’s screen tile with **live** content (not blank/black). A may still see self-preview (insufficient alone).
4. If share audio was included: **B hears** share/system audio.
5. A stops share → B’s screen tile clears; share audio stops (no ghost tile).
6. B starts share (with audio if possible) → **A** sees/hears B live within ~5s; B stops → clears for A.
7. Optional: while A is sharing, open Composition on B — **no** screen tile, but share audio still audible if included; return to Grade — live tile returns.

**Pass**: Four phases (A share / A stop / B share / B stop) all succeed for video; audio when included (SC-002/SC-006).

## Mid-share / Grade entry (FR-008)

1. A starts share; B is in Composition or joins late.
2. B switches to Grade (or joins then Grade) **without** A restarting share.
3. Within ~5s B sees live share (and hears share audio if included).

**Pass**: SC-003.

## US3 — Indicators smoke

1. With peer media working, confirm existing Grade/channel share indicators toggle on while sharing and clear on stop (no redesign).

## Regression

- [ ] Peer **camera** video still works both ways
- [ ] Call **mic** audio still works both ways
- [ ] Start/stop share does **not** flip camera
- [ ] Multiple sharers (if feasible): each peer sees the other’s live share
- [ ] Stop share: no empty ghost screen tile (088)

## Failure signals

| Symptom | See |
|---------|-----|
| Tile chip, no video element | [PSV](./contracts/peer-screen-video.md) attach/host |
| Video element black forever | PSV decode/E2EE |
| Mic OK, share silent | [PSA](./contracts/peer-share-audio.md) ScreenShareAudio |
| Only self works | Dual-path; ignore self-preview as proof |
