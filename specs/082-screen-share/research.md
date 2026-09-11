# Research: 082-screen-share

## R1 — Canonical share set via occupancy (`screen_on`)

**Decision**: Add boolean `screen_on` to `voice_occupant` / `OccupantView` and include it in existing `voice.occupancy` snapshots. Idempotent start = set `screen_on=true`; stop = `false`. Leave/stale cleanup clears it. Derive «active sharers» as occupants with `screen_on`.

**Rationale**: Spec FR-006/007/018 need a server set + full snapshot. Occupancy already broadcasts channel snapshots to sidebar and voice UI; extending it avoids a parallel WS event and keeps join/leave consistency.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Separate `active_screen_shares[]` + `voice.screen_share_changed` only | Duplicates occupancy lifecycle; PRD name optional |
| Infer shares only from LiveKit track events (no server) | Spec requires canonical server set; indicators for users not subscribed to room media still need WS |
| Server `channel_layout` + pre_share restore | Superseded by clarifications |

---

## R2 — No automatic Grade/Composição switch

**Decision**: Do **not** change `mesa.viewMode` (or any server layout) on share start/stop. No `pre_share_scene_id`. Mode remains client preference via existing header seg.

**Rationale**: Clarify session 2 — B: mode does not change alone; tiles only in Grade; indicators replace forced navigation.

**Alternatives considered**: PRD 0→1 force grid + N→0 restore — rejected by product.

---

## R3 — Publish via LiveKit screen share API

**Decision**: Use LiveKit `localParticipant.setScreenShareEnabled(true, { audio: true })` (or equivalent SDK options) so video uses `Track.Source.ScreenShare` and optional system/tab audio uses `ScreenShareAudio`. After enable, set `contentHint = 'detail'` on the screen video track when the browser allows. Camera stays on `Track.Source.Camera` independently. On stop / hangup / OS revoke: `setScreenShareEnabled(false)` + server stop.

**Rationale**: Spec FR-002–004; LiveKit already used for cam/mic in `liveClient.ts`. Source tags let `layoutMedia` / PiP keep camera-only filters.

**Alternatives considered**: Manual `getDisplayMedia` + `publishTrack` — more code, same outcome; OK as fallback if SDK options insufficient.

---

## R4 — E2EE covers screen tracks (verify)

**Decision**: Treat room-level Insertable Streams (`ExternalE2EEKeyProvider` + worker in `joinLiveRoom`) as applying to all published tracks including ScreenShare. **Gate**: short spike/manual check on an `e2ee_enabled` channel that remote peers decrypt screen video/audio. If not, extend worker/sender hooks before calling the feature done for encrypted channels.

**Rationale**: Spec Assumptions; encryption is room-scoped today, not camera-specific — likely OK, must not ship blind.

**Alternatives considered**: Defer E2EE for screen entirely — rejected for encrypted channels.

---

## R5 — Grade-only control + shared viewMode for UserPanel

**Decision**: Screen share toggle lives on `UserPanel` call controls (near cam), visible only when `voice.live()` and `viewMode === 'grid'`. Ensure UserPanel observes view mode changes from `VoiceChannel.setMode` (reactive store, custom event, or lift signal — prefer thin shared accessor in `uiPrefs` / session). Switching to Composição hides the control but **does not** stop an active share; stop via OS chrome or return to Grade.

**Rationale**: Clarify — control only in Grade; cam independent; share may continue while viewing composition.

**Alternatives considered**: Control only inside VoiceChannel pane — less discoverable vs panel pattern (081). Disable start in Composition but keep stop always — nicer UX but clarify said control unavailable in Composition; OS stop remains.

---

## R6 — Layout: screen tiles Grade-only; audio always

**Decision**: In `layoutMedia` / `CameraGrid` grade path: separate ScreenShare video into screen tiles with priority over cameras; optional local spotlight enlarges one sharer’s screen. In composition path: **do not** attach screen video to slots/bank; keep subscribing/playing ScreenShareAudio (and mic) so composition users still hear share audio. `FloatingVoicePip` stays camera-only.

**Rationale**: Spec FR-010, FR-003 (audio in composition), FR-015–017 (spotlight), FR-017 visual priority.

**Alternatives considered**: Mute share audio in composition — rejected (clarify A). Show screens in composition — rejected.

---

## R7 — Indicators (presence, not forced navigation)

**Decision**: When any occupant in that channel has `screen_on`, show a compact presence indicator on (1) the Grade `seg-opt` in the voice pane header and (2) the voice `channel-item` in the sidebar. Clear when count → 0. Exact glyph (icon/dot) is UI detail in implementation; must be perceivable and i18n-labelled (`aria-label`).

**Rationale**: Spec US4 / FR-012.

**Alternatives considered**: Numeric badge of sharer count — optional later; presence sufficient for MVP. Auto-switch to Grade on click — out of scope unless trivial; click already selects Grade seg.

---

## R8 — Supersede PRD auto-layout sections

**Decision**: `docs/screen-share.md` §§5.3–5.4 (pre_share, follow_channel_layout) are **not** implementation targets. Spec + this research win on conflict.

**Rationale**: Clarifications explicitly removed restore and local composition opt-out.
