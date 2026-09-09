# Quickstart: 080-call-controls-restore

Validate leave-on-panel, voice-pane bottom bar, mid-call camera/blur, mic/deafen prefs, and blur menu stacking. Needs authenticated app + a voice/video channel.

## Prerequisites

- Frontend + backend running (`npm run dev` / `cargo run`)
- Account with speak+video permission on a voice channel
- Optional: second account; listen-only role for MD-06

## A — Leave from panel on stage

1. Join a voice/video call; stay on the voice pane (stage mode on if available).
2. Confirm **leave** on the user panel (bottom left of call controls).
3. Hang up via panel → call ends.
4. Rejoin; switch to a text channel (off-stage) → leave still on panel; hang up works.

**Expect**: [user-panel-controls.md](./contracts/user-panel-controls.md) UP80-02–03.

## B — Bottom bar: hang-up, mid-call camera, blur gate

1. Join with **camera off** (audio / JOIN without cam opt-in).
2. On voice pane, confirm bottom bar: hang-up + camera; **no** blur.
3. Turn camera **on** via bottom bar → local video publishes (or permission prompt then publish).
4. Blur control appears; open menu; pick an option (or see unavailable).
5. Hang up via bottom bar.

**Expect**: [voice-pane-bottom-bar.md](./contracts/voice-pane-bottom-bar.md) VB-01–05.

## C — Mic / deafen out of call → join respects

1. Out of call: mute mic on panel; optionally enable deafen.
2. Join a call.
3. Confirm session starts with mic off / deafened matching prefs (remotes silent if deafened).
4. Toggle mic/deafen in call → still works.
5. Hard-reload the page → prefs reset to defaults (mic on, deafen off).

**Expect**: [mic-deafen-session-prefs.md](./contracts/mic-deafen-session-prefs.md) MD-01–05, MD-07.

## D — Panel polish

1. Inspect mic/deafen: soft rounded corners, **no** chevron.
2. Confirm not full pill/circle; no camera/blur on panel.

**Expect**: UP80-01, UP80-06–07.

## E — Blur menu above header

1. In call with camera on (or pre-join with cam opted in), open blur near the top of the voice pane / preview.
2. Confirm menu is fully visible above the pane header; click an option successfully.

**Expect**: [blur-menu-visibility.md](./contracts/blur-menu-visibility.md) BM-01–03.

## F — Typecheck

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## G — Optional listen-only

1. As listen-only member, confirm mic cannot publish; panel behaviour coherent (disabled or non-publishing).
2. Leave still available when live.

**Expect**: MD-06; UP80-02.
