# Quickstart: 081-panel-cam-header-blur

Validate panel camera, header blur select, removed bottom bar / stage / pre-join cam UI.

## Prerequisites

- Frontend + backend running (`npm run dev` / `cargo run`)
- Account with speak+video on a voice channel
- Optional listen-only account for PC-05

## A — Panel camera + JOIN respects pref

1. Out of call: toggle **camera** on the user panel (after deafen, before settings) — no blur menu.
2. Leave camera **off**; open voice channel; confirm pre-join has **JOIN** only (no cam opt-in / blur / preview).
3. JOIN → land without publishing camera (banco / audio path).
4. Out of call again: set camera **on** on panel; JOIN → enter with camera (or permission prompt then publish).

**Expect**: [user-panel-camera.md](./contracts/user-panel-camera.md) PC-01–06; [prejoin-join-only.md](./contracts/prejoin-join-only.md) PJ-01–03.

## B — In-call cam on panel; blur in header; no bottom bar

1. In call with camera off: enable camera from **panel** only.
2. Header shows blur **select** (none / light / strong); change options with cam on → effect or unavailable message.
3. Confirm **no** `voice-in-call-bar` at bottom.
4. Hang up from **panel** leave.

**Expect**: [header-blur-select.md](./contracts/header-blur-select.md) HB-01–05; FR-007; SC-003/005.

## C — Stage mode gone

1. In voice pane (pre-join or live): no «Modo palco» / Stage mode button.
2. After JOIN: shell is **not** in stage layout (no stage-mode chrome).

**Expect**: [stage-mode-retired.md](./contracts/stage-mode-retired.md) SM-01–04.

## D — Typecheck

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## E — Optional listen-only

Camera on panel disabled / non-publishing; leave still works when live.
