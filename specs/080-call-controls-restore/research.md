# Research: 080-call-controls-restore

## R1 — Leave on user panel during stage

**Decision**: Show hang-up on `UserPanel` whenever `voice.live()` is true — **including stage mode**. Remove `showLeave = live && !stageMode`.

**Rationale**: Spec FR-001/002 and clarify Q1 — users trapped on stage with no panel leave after 078 gated leave off-stage only. Duplicate hang-up on voice-pane bottom bar and PiP remains OK (FR-002a).

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Leave only on voice-pane / PiP in stage | Spec requires panel leave always while in call |
| Keep stage gate; add header hang-up | Extra chrome; contradicts clarify |

**Supersedes**: 078 contract UP-09 (“when stage: leave MUST NOT appear on the panel”).

---

## R2 — Restore voice-pane bottom in-call bar

**Decision**: When `live()` on the current channel’s `VoiceChannel`, render a bottom control bar in the `voice-pane` (replace/repurpose the empty error footer region pattern) with:

- Hang-up → `voice.hangup()` (and existing leave navigation semantics as today)
- Camera toggle → `voice.toggleCam()` (enables mid-call camera including after audio-only join)
- Blur split/menu → visible **only when** `voice.camOn()`; reuse `CameraBlurMenu` + `blurPreference` + runtime `applyBlurMode` on local track

**Rationale**: Spec US2/US3/FR-004–007 / clarify — camera/blur ownership stays off UserPanel (078 UP-01) but must live on restored voice-pane chrome; current VoiceChannel has pre-join controls only and an empty `<p class="error">` after stage content.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Put cam/blur back on UserPanel | Explicitly out of scope / 078 amendment |
| Header-only cam controls | Spec restores **bottom** bar location |
| Rely solely on `toggleCam` from nowhere | No discoverable UI today mid-call |

---

## R3 — Mic / deafen outside call + join inherits

**Decision**:

1. Treat `micOn` / `deafened` (or dedicated preferred signals) in `VoiceSession` as **browser-session preferences** when `!live()`.
2. `toggleMic` / `toggleDeafen` MUST update those prefs when there is no LiveKit session (today they no-op / clear deafen).
3. On join (`VoiceChannel.connect` → `bindLive`), pass/apply preferred mic; after bind, if preferred deafened, call `setDeafened(true)` so remote volumes mute and mic stays off as today.
4. `UserPanel`: stop disabling mic/deafen solely because `!live()`; keep listen-only mic disabled when `permission() === "listen"` (in session). Out of call, allow toggles (permission unknown until join).
5. Persistence: **memory only** — full reload / new tab resets to defaults (clarify A / FR-017).

**Rationale**: Spec US6 / FR-015–017. Current `setDeafened` forces `false` when `!live`; `toggleMic` returns if `!session`; `bindLive` always `setDeafenedSignal(false)`; connect uses local `micOn()` default true, not panel prefs.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| localStorage durable prefs | Clarify: session-only |
| Disable UI until live (078) | Superseded by clarify |
| Separate “prefs” store outside VoiceSession | Extra indirection; session already owns mic/deafen |

**Supersedes**: 078 UP-03 (mic/deafen disabled when not live).

---

## R4 — Remove decorative mic/deafen chevrons; rounded (not pill)

**Decision**: Remove `user-panel-ctrl-chevron` spans from mic/deafen. Style as single 32×32 (or split-container without chevron) buttons with **soft `border-radius`** (existing `--radius-md` / similar) — **not** `border-radius: 50%` / full pill. Keep speaking ring behaviour.

**Rationale**: Spec US5 / FR-012–014; clarify — chevrons were decorative only (078); shape is rounded rectangle not capsule.

**Alternatives considered**: Keep chevrons — rejected. Full circle Discord pills — rejected by clarify.

**Supersedes**: 078 UP-05 (icon + chevron visual required).

---

## R5 — Blur menu above pane header

**Decision**: Fix stacking so `.camera-blur-menu` (z-index ~80 today) is not clipped or covered by `.pane-header` / stage overflow. Prefer: raise menu z-index above header stacking contexts, ensure ancestors (`voice-pane`, stage host, grid) use `overflow: visible` where the menu opens, and/or open menu **downward** when near the top. Apply to pre-join and in-call bottom-bar blur anchors; same component.

**Rationale**: Spec US4 / FR-010–011 — reported menu hidden behind header when opened from camera preview / nearby controls.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Portal to `document.body` only | Heavier; try CSS/overflow first |
| Lower header z-index globally | Risk side effects on other chrome |
| Ignore for bottom-bar-only menus | Spec still covers preview/header-adjacent opens |

---

## R6 — Backend / API

**Decision**: No API or schema changes. Join already sends `mic_on` / `cam_on`; mid-call `patchVoiceMedia` already exists. Preferred mic feeds those existing fields.

**Rationale**: All gaps are client UI + session state.

**Alternatives considered**: Server-side “preferred media” — unnecessary for session-scoped prefs.
