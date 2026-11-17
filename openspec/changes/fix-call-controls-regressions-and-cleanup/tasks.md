# Tasks

## 1. Per-participant volume

- [ ] 1.1 Make boost context playback reliably resume after user interaction and audio-unblock actions, handle graph failures without a misleading successful level, and reapply the saved volume to newly subscribed or replaced tracks once the handle is resolved. Verify: inspect graph/context state and hear 0%, 50%, 100%, and 150–200% on a real two-client web call, including reconnect and one unaffected second remote participant.
- [ ] 1.2 Confirm local versus same-account remote-session ownership in web and Electron, preserving no slider on the true local tile and the saved remote percentage across rejoin. Verify: use two devices signed into the same account plus a separate account, check LiveKit identities, `isLocal`, visible percentages, and actual audio; test a selected output device where supported.

## 2. Speaking chip

- [ ] 2.1 Remove only the visible “Speaking” chip from `tiles.tsx` and its unused chip CSS, retaining tile ring, bench highlight, sidebar tooltip, and used voice translations. Verify: build/lint and visually inspect speech in stage, grid, strip, mini, and bench views; confirm no text chip appears.

## 2a. Per-participant connection quality

- [ ] 2a.1 Replace the local-only quality event gate with reactive state keyed by LiveKit identity; seed connected participants, update only the affected identity, remove disconnected identities, and clear on leave/room replacement. Preserve the local-only popout owner relay. Verify: two-client LiveKit event and room-replacement checks show independent local/remote values without stale quality.
- [ ] 2a.2 Render each stage/grid participant's quality with the existing `ConnectionQualityGlyph` and unchanged `.call-chip.quality` top-right positioning. Verify: local and remote tiles show their own accessible level below the muted/you slot, with no CSS movement or popout viewer substitution.

## 2b. Tile information reveal

- [ ] 2b.1 Adapt the popout hover/focus visibility pattern to hide all tile top chips/glyphs and the whole caption by default, revealing them on desktop pointer hover or focus within. Verify: keyboard tabbing reveals every caption control, hidden controls do not catch pointer events, and video/figure geometry and speaking rings stay fixed.
- [ ] 2b.2 Add no-hover touch tap-toggle behavior: first tap reveals without selecting, second tap hides, another tile switches the reveal, and outside tap dismisses; preserve nested slider/actions. Verify: mobile web tap, slider drag, tile selection, and outside-tap behavior across composition, grid, and floating player.
- [ ] 2b.3 Check hover-capable desktop, keyboard-only, touch-only, and hybrid devices at stage/grid/strip/mini sizes, including the popout viewer. Verify: no device loses access to hidden information; overlay chips and caption appear together and disappear predictably.

## 2c. Deafened occupancy and tile state

- [ ] 2c.1 Add `deafened_on` to `VoiceOccupant`, `OccupantView`, `VoiceMediaBody`, and database row/query mapping; add a `voice_occupant` SQLite migration with `INTEGER NOT NULL DEFAULT 0`. Extend join/upsert and optional media PATCH without requiring speak permission for deafen. Verify: `backend/tests/contract/voice_occupancy.rs` covers default false, PATCH true/false, listener PATCH, REST and `voice.occupancy` snapshots, plus old-field PATCH compatibility; run targeted Rust contract tests.
- [ ] 2c.2 Add `deafened_on` to frontend `MediaFlags` and `Occupant`; report the local flag on both normal and popout-triggered toggles and on initial join/reset, keeping heartbeat and local audio muting intact. Verify: two clients observe prompt true/false occupancy updates after both toggle paths and correct state after rejoin.
- [ ] 2c.3 Join roster `deafened_on` to `TileData` in `people.ts`, default missing older-server values to false, and render an accessible `headset_off` state icon when deafened in the caption for talkers and listeners. Verify: two-client normal/listener cases show only the deafened person's icon, while existing mic/camera/hearing icons and localization remain correct.

## 3. Attachment thumbnail badge

- [ ] 3.1 Remove the decrypted badge from `AttachmentThumb.tsx`, its unused absolute-position CSS, and the unused English and Portuguese chat keys. Verify: build/lint and visually inspect loaded, loading, and failed thumbnails; zoom, encrypted caption, and download remain correctly positioned and usable.

## 4. Bench heading alignment

- [ ] 4.1 Align the bench icon and text through a composition-specific selector without changing shared `.mono-label`. Verify: build/lint and visually inspect the bench heading at wide and narrow widths with empty and occupied benches; other mono labels retain their layout.
