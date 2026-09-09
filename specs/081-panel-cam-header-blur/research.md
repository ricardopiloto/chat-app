# Research: 081-panel-cam-header-blur

## R1 — Preferred camera on VoiceSession (like mic)

**Decision**: Extend session signals so `camOn` when `!live` is a **browser-session preference** (default **`false`**). `toggleCam` when idle flips preference only; when live keeps existing LiveKit publish path. `VoiceChannel.connect` uses `voice.camOn()` to choose `camera` vs `audio` (and join `cam_on`), not local `cameraIntent`.

**Rationale**: Spec FR-004a/b; clarify — panel is source of truth. Default off preserves 078 JOIN default (camera off until opted in) without a separate opt-in control.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Default cam preferred `true` | Surprises users with camera on JOIN |
| Keep `cameraIntent` signal separate | Dual state; clarify removed pre-join opt-in |
| localStorage for cam pref | Spec: session only |

---

## R2 — Camera on UserPanel (supersedes 078/080 “no cam on panel”)

**Decision**: Render camera toggle after deafen, before settings; same `.user-panel-ctrl` styling; no blur/chevron. Disabled when `permission() === "listen"` (in call) or listen-only channel context when known. Out of call: always toggleable (preference). In call: `voice.toggleCam()`.

**Rationale**: Spec US1 / FR-001–003. 080 put cam on bottom bar; 081 moves it to panel and deletes the bar.

**Alternatives considered**: Cam only when live — rejected by clarify A. Cam + blur split on panel — rejected by FR-003.

---

## R3 — Header blur as native `<select>`

**Decision**: When `live()` on the voice pane, show a labeled `<select>` in `.pane-header` with values `off` | `light` | `strong`, bound to `readBlurMode` / `writeBlurMode`. On change: persist + if `voice.camOn()` and local track exists, `applyBlurMode`. When cam off, select still writable (preference for next cam on). No `CameraBlurMenu` popup for this surface.

**Rationale**: Spec US2 / FR-005–006 — “select box” with three options. Reuses durable blur pref already in product.

**Alternatives considered**: Keep CameraBlurMenu in header — not a select. Hide select until cam on — Assumptions say keep usable when cam off.

---

## R4 — Remove voice-in-call-bar

**Decision**: Delete the in-call bottom toolbar markup/CSS usage from `VoiceChannel`. Hang-up remains on `UserPanel` + FloatingVoicePip.

**Rationale**: Spec US3 / FR-007 / FR-009.

**Alternatives considered**: Keep hang-up only on bar — rejected; panel already has leave.

---

## R5 — Retire stage mode from product UI

**Decision**:

1. Remove «Modo palco» button from `VoiceChannel` header.
2. Stop calling `requestStageMode(true)` on join / channel focus; call `requestStageMode(false)` (or no-op force off) on connect/leave.
3. `AppShell`: never apply `stage-mode` class — `readStageMode()` returns false / ignore pref; `toggleStageMode` / `requestStageMode(true)` become no-ops or force false.
4. Optionally stop writing `mesa.stageMode`; leave key orphaned.

**Rationale**: Clarify B — always off stage. PiP “back to stage” copy MAY remain as navigate-to-voice-channel without enabling stage layout (plan: keep navigation; do not set stage).

**Alternatives considered**: Always-on stage — rejected. Keep last pref without UI — rejected.

---

## R6 — Pre-join: JOIN only (no cam opt-in / blur / lazy preview)

**Decision**: Remove `cameraIntent` UI, pre-join blur split, and lazy preview video from pre-join row. Primary: JOIN → `connect(voice.camOn() ? "camera" : "audio")`. Keep listen-only join and optional **test video** secondary. Remove preview `getUserMedia` effect tied to intent.

**Rationale**: Spec FR-004c / SC-001b.

**Alternatives considered**: Sync pre-join toggle to panel — rejected (clarify remove). Independent dual controls — rejected.

---

## R7 — Backend / API

**Decision**: No API changes. Join/media patch still use `cam_on` / `mic_on`.

**Rationale**: All scope is chrome + client session state.
