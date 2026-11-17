# Design

## Context

`participantVolume.ts` clamps and persists 0–200% by handle. `tiles.tsx:156-190` renders a control only for non-local tiles with resolved handles and reapplies preferences reactively. `callSession.tsx:263-285` tags a LiveKit-attached audio element with its track SID and identity before adding it to `audioHost`; `applyVolumeForIdentity` searches that host. Thus an ordinary attach is not blocked by a missing dataset identity at initial tagging, but a preference can be missed when a subscription arrives after the tile's effect ran. Below 100%, volume is applied through `el.volume`; above 100%, `applyElementVolume` creates a `MediaElementAudioSourceNode` and `GainNode`. The shared `AudioContext` is never explicitly resumed, including in `resumeAudio()` (which only calls LiveKit `room.startAudio()`). A suspended context can make a successful slider update inaudible; this is a concrete code defect and leading explanation, but the reported browser-specific failure still requires live reproduction. These audio elements play `MediaStreamTrack` media; the code does not set `crossOrigin`, but a CORS explanation is unproven and should be checked in a real web session before adding that attribute. Boost graphs are keyed by track SID and removed on unsubscribe, so a replacement track needs the stored level reapplied. `snapshot()` sets `isLocal` from LiveKit's participant; `people.ts` joins roster handles by account ID. A tile labeled with the user's handle can therefore be a second remote session of the same account; the report of 0% on “my own user” does not establish that the local tile showed a slider. A persisted 0% entry is also possible. Verify identity, session, and persisted value in two clients.

`tiles.tsx:111-116` renders the “Speaking” chip, while `voice.css:60-61` separately supplies the tile's speaking ring. The bench uses its own visual `is-speaking` class. `Sidebar.tsx:32` still uses `call.speaking` for a tooltip, so the voice catalog keys remain in use. `AttachmentThumb.tsx:33` has the decrypted chip inside the image button; `chat.css:104-105` positions it absolutely, so its removal does not change flex spacing. The encrypted caption, zoom icon, and download action are separate. The chat catalog's `txt.attachment.decrypted` key has no other usage and can be removed. `CompositionView.tsx:33` places the bench icon and label in a plain `.mono-label` span. `components/ui.css:130` defines `.mono-label` only as typography and it is reused across voice, shell, and shared display components.

## Goals / Non-Goals

**Goals:** Reliable per-remote audio level, per-participant quality and deafened status, revealable tile information, less tile and thumbnail chrome, and a centered bench heading.

**Non-Goals:** LiveKit protocol changes, changing speaking detection, redesigning attachment handling, or changing all `.mono-label` uses.

## Decisions

### D1. Restore and verify the actual audio path

Keep native element volume for 0–100% and Web Audio gain for boosts; explicitly resume the boost context from a user interaction and when audio playback is resumed. Reapply the saved handle preference whenever a new remote audio track is attached and a handle is available, including after replacement. Keep graph teardown tied to the old element and track SID, and ensure a new element gets a new graph. Inspect context state, element identity/SID, and the actual heard result in web and Electron before deciding whether any CORS adjustment is needed. Never silently treat a failed graph as an effective boost.

*Alternative rejected:* Attribute the failure to CORS and set `crossOrigin` unconditionally. These are MediaStream-backed track elements, and the current evidence does not establish a CORS-tainted source.

### D2. Keep visual speaking feedback and remove only the tile chip

Remove the tile's visible `call-chip speaking` markup and its unused style, retaining `is-speaking` tile ring, bench border, and roster cue. Keep `call.speaking` translations because the sidebar tooltip still uses them.

*Alternative rejected:* Remove all speaking treatment. That would erase useful voice activity feedback and conflict with the existing voice-session requirement.

### D3. Remove the attachment overlay locally

Remove the decrypted chip markup, its now-unused CSS selectors, and unused `txt.attachment.decrypted` translations. Keep the encryption caption, zoom and download controls.

*Alternative rejected:* Rework the thumbnail layout. The removed chip is absolutely positioned, so no surrounding spacing change is needed.

### D4. Scope bench alignment to the composition footer

Give the bench heading a specific class or selector with inline-flex, align-items center, and a small gap. Do not change the shared `.mono-label` rule.

*Alternative rejected:* Add flex alignment globally to `.mono-label`, which would affect unrelated headings, time labels, and sidebar text.

### D5. Track connection quality per LiveKit participant identity

Replace the local-only quality gate in `callSession.tsx:847` with reactive quality keyed by LiveKit identity. Seed the map from the local and already connected remote participants, update only the event participant on `ConnectionQualityChanged`, remove a disconnected identity, and clear/reseed it on leave or room replacement. `Tile` in `tiles.tsx:85` reads its own identity and reuses `ConnectionQualityGlyph` for local and remote stage/grid tiles. Keep `.call-chip.quality` at `right:8px;top:34px`, below the top-right muted/you slot, without restyling. Keep the popout's local-only owner relay and viewer-room separation unchanged.

*Alternative rejected:* One shared quality signal for every tile. A remote event would overwrite unrelated participants' status.

### D6. Reveal tile overlays on hover, focus, or touch tap

Adapt the `CallPopoutWindow.tsx` hovering/focusWithin/visible pattern and `.call-popout-controls` opacity/pointer-events gating to each `Tile`. Hide all tile overlay chips/glyphs and the complete `figcaption.call-tile-caption` by default; reveal them on pointer hover or focus within on hover-capable devices. On no-hover touch devices, one tap toggles that tile's information; tapping another tile reveals that tile and closes the previous one, and tapping outside closes it. Keep captions in the focus order when visually hidden so keyboard focus can reveal their controls; use appropriate focus handling and avoid activating `props.onClick` or a caption action accidentally when the tap only reveals information. Scope styling to tile overlays, preserving video and figure geometry across `GridView`, `CompositionView`, and `FloatingPlayer`. The speaking ring remains visible; its removed chip stays removed.

*Alternative rejected:* CSS `:hover` alone. It has no reliable dismissal/toggle behavior on touch and cannot coordinate taps across tiles.

### D7. Carry deafened state through persisted voice occupancy

Add `deafened_on: bool` to `VoiceOccupant` and serialized `OccupantView` in `backend/src/domain/voice_occupancy.rs`, plus `deafened_on: Option<bool>` to `VoiceMediaBody` in `backend/src/api/voice.rs`. `voice_occupant` is a SQLite table (`backend/migrations/0008_voice_occupancy.sql`), so a new additive migration is required: `INTEGER NOT NULL DEFAULT 0`, following `0020_voice_occupant_screen_on.sql`. Extend `backend/src/db/voice_occupancy.rs` row mapping, insert/update/select and snapshot paths, and the API's join/upsert and PATCH call sites. Initialize false on join/rejoin; PATCH may update it independently of media permissions, including for listeners. Report the new flag whenever local `setDeafened` changes, including the main and popout-triggered toggle, and reset/initial report on joining or leaving as appropriate. Extend `frontend/src/api/types.ts` `MediaFlags` and `Occupant` (read `deafened_on` defensively as false if absent from an older server), and `frontend/src/voice/people.ts`/`tiles.tsx` `TileData`. Display `headset_off` only when deafened in the caption state row, including listeners beside their `hearing` icon; deafen is valid for listeners too, unlike mic/cam publication. Add an accessible label and any needed localization. Existing consumers of `OccupantView` receive an additive JSON field and optional PATCH input; the database default and frontend fallback support mixed versions. Check any strict schema/contract consumers before rollout.

*Alternative rejected:* Derive remote deafen from LiveKit microphone state. Deafen only mutes received audio locally and has no LiveKit publication signal.

## Risks / Trade-offs
- [Hidden tile overlays make muted and deafened status less visible at a glance in a busy grid] → Keep the speaking ring visible and verify hover, focus, and tap reveal affordances in every tile size; accept this visibility trade-off as requested.
- [Touch taps can conflict with tile selection and nested caption controls] → The first reveal tap does not invoke tile selection; nested slider/actions retain their own input behavior, and outside/other-tile taps dismiss predictably.
- [Older clients and servers may not know `deafened_on`] → Default stored and missing read values to false, keep PATCH optional and JSON responses additive, and test REST/WS occupancy plus an old-field PATCH.

- [The audio failure has no captured runtime trace, so a suspended context may not explain every report] → Require two-client web and Electron listening tests covering 0%, below 100%, 100%, and above 100%, track replacement, and output device. Capture context state and identity mapping if it still fails.
- [A second session of the same account may be mistaken for the local tile] → Check LiveKit identity and `isLocal` for both sessions; preserve the local tile exclusion and distinguish this case in the test.
- [Removing the speaking chip reduces visible emphasis] → Keep the existing tile ring and bench highlight; verify they remain discernible in stage, grid, strip, and mini views.
