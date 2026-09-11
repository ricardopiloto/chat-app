# Research: 091-fix-webcam-attach

## R1 — Root cause class: attach/rebind, not capture

**Decision**: Treat blank webcams as **scene attach / rebind** failures after 082-era layout forking, not dead camera hardware.

**Rationale**:
- Leave/rejoin rebuilds join `onLocalTrack` + fresh DOM hosts → video returns.
- Start screen share flips Grade tile list → remount → `attachGradeTile` + `layoutMedia` → video returns without changing cam capture.
- Cam-on UI / occupancy can be true while Composition/Grade surfaces stay empty.

**Alternatives considered**:
- “Always require share start to wake cams” — rejected by product (FR-002).
- Full room reconnect on every cam toggle — overkill and hurts UX.

## R2 — Split brain: session vs page `localVideoEl`

**Decision**: Make **session-owned** `VoiceSession.localVideoEl` the **canonical** local camera preview for on-stage layout; page must not rely on a divergent join-only copy.

**Rationale** (code):
- Join path: `liveClient` → `onLocalTrack` sets both `VoiceChannel.localVideoEl` and `voice.setLocalVideoEl`.
- Mid-call `toggleCam()`: creates/attaches a new element into **session** `localVideoEl` only; does **not** call `dispatchLocalTrack` / page handler.
- `layoutMedia()` reads the **page** `localVideoEl`. Effect on `voice.camOn()` refreshes Grade lists and queues layout but **does not** copy `voice.localVideoEl()` into the page var (except the “already in call on this channel” navigation effect).
- PiP already uses `voice.localVideoEl()` — explains why PiP can work while Composition/Grade stay blank (clarify: PiP out of scope / already OK).

**Alternatives considered**:
- A) `toggleCam` calls `dispatchLocalTrack(el)` after attach — necessary minimum; still leaves two writers.
- B) `layoutMedia` always uses `voice.localVideoEl()` (with optional page cache sync) — preferred coherence.
- C) Move all attach into VoiceChannel only — larger refactor; reject for 091.

**Chosen approach**: B + A — layout reads session getter; mid-call path still notifies handlers so any page cache / side effects stay aligned.

## R3 — Race: layout before host mount

**Decision**: Keep **re-layout on every host attach** (`attachSlot` / `attachGradeTile` → `queueMicrotask(layoutMedia)`); treat layout as **idempotent** and safe to call whenever tracks or hosts change—not one-shot at track arrival.

**Rationale**:
- `placeTrack` / `onLocalTrack` call `layoutMedia` immediately; if `gradeTileEls` / `slotEls` lack the key, video is skipped (`if (!node) continue`).
- Host refs register asynchronously after Solid mounts tiles. Attach already queues layout; verify this still runs after Grade remounts (share, spotlight, cam list change) and that stale map entries for unmounted nodes are overwritten or cleared.
- Share-start “fix” is explained as remount → re-attach → re-layout.

**Alternatives considered**:
- MutationObserver on grid — heavier than ref callbacks.
- Polling `layoutMedia` on interval — wasteful; reject.
- Only layout on track events — insufficient (current bug class).

## R4 — Composition and Grade

**Decision**: Same fix path for both modes; acceptance requires **both** (clarify).

**Rationale**: One `layoutMedia` branches on `viewMode`; different host maps (`slotEls` vs `gradeTileEls`). Mode switch and delayed occupancy hit the same host-before-layout gap. SC-001: 10/10 Composition **and** 10/10 Grade.

## R5 — Latency budgets (clarify)

**Decision**:
| Event | Budget |
|-------|--------|
| Local cam-on / join live → self-view | ≤ ~2 s |
| Grade remount transient blank | ≤ ~1 s then self-recover |
| Remote after track available **and** host mounted | ≤ ~2 s (network/SFU before track **out** of budget) |

**Rationale**: Product clarifications 2026-09-10; keeps tests measurable without blaming SFU latency for remote.

## R6 — Out of scope

**Decision**: Do not change Floating PiP behavior for acceptance; avoid regressions if shared helpers touch `localVideoEl`.

**Alternatives considered**: Unify PiP + stage attach in one module — defer; PiP already works.

## R7 — Screen share integrity

**Decision**: Fix must not remove Grade screen tiles / occupancy `screen_on` behavior (082/083/088). Cameras must work with **zero** shares; share remount must not permanently blank cams (≤1 s flash OK).

**Rationale**: FR-005, FR-011, SC-003/004/007.
