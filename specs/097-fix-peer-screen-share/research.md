# Research: Fix Peer Screen Share Visibility

**Feature**: 097-fix-peer-screen-share  
**Date**: 2026-09-11

## R1 — Dual-path architecture (do not trust self-preview)

**Decision**: Treat “sharer sees self, peers blank/silent” as a **remote pipeline** failure until proven otherwise. Self-preview attaches from the **local** ScreenShare publication in `VoiceSession.toggleScreenShare`; peers use subscribe → `placeTrack` → Grade `attachRemote`.

**Rationale**: Self success never exercises SFU/E2EE/decode/peer DOM attach. Spec FR-003.

**Alternatives considered**: Assume capture broken (rejected — self works). Assume only indicators wrong (rejected — tile present but blank).

## R2 — Symptom class matches blank tile + silence

**Decision**: Acceptance = **live frames in the existing peer screen tile** + **audible ScreenShareAudio when included**. Chip/tile presence already implies `remotesScreen` / local `screenOn` refreshed Grade lists; focus on attach/decode/play and audio sink, not “missing tile.”

**Rationale**: Clarify session 2026-09-11.

**Alternatives considered**: “No tile at all” product bug (rejected by clarify).

## R3 — Ranked FE hypotheses

**Decision**: Investigate in order during implement:

1. **Remote Grade host-mount / rebind gap (091-class for screens)** — `layoutMedia` skips when `gradeTileEls` lacks `screen:{id}`; effects re-layout on **local** `screenOn` / cam / spotlight, not explicitly when **remote** `remotesScreen` keys change beyond the non-reactive map + one `scheduleLayout`. Verify `attachGradeTile` always requeues layout and that remote share list remounts bind hosts before attach. Prefer idempotent re-layout on host attach + after `setGradeScreenIds`.
2. **E2EE / SFU not delivering ScreenShare / ScreenShareAudio** — camera/mic work while screen sources stay undecodable (082 flagged verify gate). Confirm with DevTools: `<video>` present vs missing; `TrackSubscribed` sources; E2EE on/off comparison if feasible.
3. **Publish appears local-only** — `setScreenShareEnabled` + local attach succeed without peers getting decodable remote tracks (token/publish options).
4. **096 session audio host** — share audio shares mic sink (`.voice-audio-host--session`); if mic works, deprioritize host migration; if only share audio fails, focus `ScreenShareAudio` publish/subscribe, not host absence.
5. **`clearOrphanVideos` on screen tiles** — each layout clears then re-attaches; ensure attach always re-runs after clear for remote identities.

**Rationale**: Code map from VoiceChannel / VoiceSession / liveClient; 091 research R3 for race class; 097 clarifies leave/rejoin is **not** a reliable unlock (unlike 091 cams)—so pure one-shot race may be incomplete, but persistent attach miss or E2EE still fits.

**Alternatives considered**: Backend occupancy-only fix (rejected — tiles already appear). Indicator redesign (out of MVP).

## R4 — Fix strategy (minimal)

**Decision**:

1. Instrument/verify blank tile: missing `<video>` → attach/rebind; present black video → decode/E2EE/play.
2. Harden peer screen video: ensure every `remotesScreen` video attaches into mounted Grade hosts; re-run layout when Grade screen tile hosts mount and when remote screen identity set changes (reactive signal if needed).
3. Harden peer share audio: ensure `ScreenShareAudio` tracks hit `attachSessionRemoteAudio` / session host and `safePlay` (same as mic); re-attach on host mount if needed.
4. Preserve Composition: no screen **video** tiles; share **audio** still plays.
5. Touch backend only if subscribe never fires or publish permissions block screen sources.

**Rationale**: Spec FR-001/002/006/010; keep scope to media path.

**Alternatives considered**: Full media-layer rewrite (rejected). Force leave/rejoin UX (rejected by clarify).

## R5 — Out of scope / regression guards

**Decision**: No indicator redesign; smoke indicators on/off. Preserve stop-share cleanup (088), camera independence (082), cam/mic peer paths (FR-007), screen `object-fit` (085).

**Rationale**: FR-005/007/009; related specs.

## R6 — Validation

**Decision**: Two-browser quickstart: A→B and B→A live video + share audio; mid-share Grade join; Composition hears audio without screen tile; stop clears tile/audio; cam/mic smoke; `npm run build`.

**Rationale**: SC-001–SC-006.
