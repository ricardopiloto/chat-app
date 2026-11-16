# Design

## Context

Each remote participant's audio already gets its own `<audio>` element: `attachAudio()` in `frontend/src/voice/callSession.tsx:152-157` calls `track.attach()`, tags the element with `el.dataset.track = track.sid`, applies the chosen output device via `applyOutput(el)` (which calls `el.setSinkId(sink)` when the element supports it, `callSession.tsx:141-144`), and appends it to a shared `audioHost` container. Global deafen (`createEffect` at `callSession.tsx:147-150`) just sets `.muted` on every `<audio>` element in that container — there is no per-participant adjustment anywhere today.

`TileData` (`frontend/src/voice/tiles.tsx:36-46`) already carries an optional `handle?: string` for each person, populated from the matched account record in `frontend/src/voice/people.ts:22-23` (`known?.handle`) — the same stable identity already used to color-code a participant consistently (`seatTone(accountId)`). `Tile` (`tiles.tsx:48-114`) already accepts a generic `actions?: JSX.Element` slot, used today for other per-tile controls, and is the single component every view (grid, stage, strip, floating player) renders a person with, per that file's own header comment.

Camera blur already persists a local, per-device preference the same shape this change needs for volume, in `frontend/src/voice/devices.ts` and `frontend/src/lib/localPrefs.ts` (`readJson`/`writeJson` around a namespaced `localStorage` key). That existing `Saved` shape is a single flat object for the local user's own device/effect choices, not a map — this change needs a different, keyed shape (one entry per other participant's handle), so it is a new store alongside it, using the same underlying `readJson`/`writeJson` helpers, not a change to the existing `Saved` interface.

`HTMLMediaElement.volume` only accepts 0.0-1.0 — there is no built-in way to play an element louder than its source, which is why Discord-style boosting above 100% needs the Web Audio API: `audioContext.createMediaElementSource(el)` into a `GainNode` with `gain.value` above 1, into `audioContext.destination`. Creating a `MediaElementAudioSourceNode` from an element reroutes that element's output through the Web Audio graph instead of playing it directly — this only needs to happen for a participant actually boosted above 100%, not for every participant.

## Goals / Non-Goals

**Goals:**
- Let a person turn one remote participant up to 200% or down to 0%, locally, without touching global deafen or affecting anyone else.
- Remember the choice per participant (by account handle) on the same device across future calls.
- Keep the existing output-device choice working for the common (0-100%) case exactly as today.

**Non-Goals:**
- No backend or account-synced preference — confirmed with the user; this is local-device-only, the same scope as camera blur today. A follow-up change could add account-synced persistence later if wanted.
- No change to global deafen, to the output-device picker itself, or to any other participant's own volume as heard by other people in the call (this is a local-only adjustment, not something broadcast or negotiated).
- No audio limiter or clipping protection for boosted audio — same trade-off Discord's own feature has.
- No control for the local participant's own tile, and no control (or persisted preference) for a participant whose account handle has not resolved.

## Decisions

### D1. Range 0-200%, one control, matching the Discord precedent
A single 0-200% control (100% default) covers both quieting and boosting a participant, instead of building two separate features (a per-person mute plus a separate boost). This mirrors the exact control the user referenced, so the behavior is already familiar.

### D2. Local storage keyed by account handle, reusing the existing local-prefs helpers
A new per-handle map, stored via the same `readJson`/`writeJson` helpers already used by `frontend/src/voice/devices.ts` (own namespaced `localStorage` key, separate from the existing flat `Saved` shape there since this is a map, not a flat set of the local user's own choices). No backend/API change, confirmed with the user as the preferred scope over an account-synced alternative.

*Alternative rejected:* account-synced preference via a new backend endpoint and table. Would let the preference follow the person across devices, but is materially more scope (migration, API, auth) for a feature whose value is almost entirely realized by the local-only version; left as a possible follow-up, not part of this change.

### D3. 0-100% stays on the existing path; only >100% goes through Web Audio
For 0-100%, set the existing `<audio>` element's `.volume` directly — no new code path, and the existing `setSinkId`-based output-device routing (`applyOutput`, `callSession.tsx:141-144`) keeps working exactly as today. Only when a participant is boosted above 100% does that element get wrapped in a Web Audio graph (`MediaElementAudioSourceNode` → `GainNode` → `destination`), since `HTMLMediaElement.volume` cannot exceed 1.0. This keeps the common case (0-100%, likely most usage) on the simplest, already-proven path, and only pays the Web Audio complexity cost for the less common boosted case.

*Alternative rejected:* route every participant's audio through a Web Audio graph unconditionally, for a single consistent code path. Rejected because it would require re-deriving the output-device routing behavior for every participant (see D4) even for the common case that already works today without it, for no behavioral benefit.

### D4. Output-device routing for boosted audio: best-effort via `AudioContext.setSinkId()`, with a documented fallback
When a participant is boosted above 100%, the system SHALL attempt `audioContext.setSinkId()` (a newer Web Audio API, not yet universal) to keep that participant's audio on the person's chosen output device. On a browser without that API, the boosted participant's audio plays on the system's default output device instead of the explicitly chosen one, same as how camera blur already degrades gracefully with an inline notice when unsupported, rather than failing or muting the participant's audio.

## Risks / Trade-offs

- [Boosted audio may not follow the chosen output device on browsers without `AudioContext.setSinkId`] → Documented, scoped limitation (D4); audio still plays, just possibly on the default device rather than the explicitly chosen one.
- [High gain on an already-loud speaker can clip or distort] → Inherent to any gain-based boost, including Discord's own version of this feature; no limiter is planned in this change.
- [Preference does not follow the person across devices] → Accepted trade-off from choosing the local-only scope over an account-synced one (D2); documented in the spec's own scenario so it is an explicit, known behavior, not a silently missed case.
