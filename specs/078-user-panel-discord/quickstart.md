# Quickstart: 078-user-panel-discord

Validate shell Discord user panel, collapse removal, and single JOIN opt-in. Needs authenticated app + a voice channel (ideally two accounts for bank/stage checks).

## Prerequisites

- Frontend + backend running (usual `npm run dev` / `cargo run`)
- Account with access to a server that has a voice/video channel
- Optional second account to observe banco vs slot

## A — Channel list never collapses

1. Open any server with channels.
2. Confirm there is **no** “hide channels” / collapse control.
3. If an older build left channels collapsed, hard-reload: list must be fully expanded.
4. Navigate stage and non-stage views: list stays expanded; no peek drawer.

**Expect**: [channels-collapse-defer.md](./contracts/channels-collapse-defer.md) CC-01–04.

## B — Idle user panel ≈ Discord

1. Out of call, inspect bottom user panel vs [reference-discord-user-panel.png](./reference-discord-user-panel.png).
2. Confirm: avatar + online; handle + “online”; mic▾, deafen▾, settings (no camera/blur).
3. Mic/deafen disabled; settings / identity open account menu.
4. Chevrons do not open device menus.

**Expect**: [user-panel-discord.md](./contracts/user-panel-discord.md) UP-01–07.

## C — In-call panel (off-stage vs stage)

1. Join a voice call, switch to a **text** channel (off-stage).
2. Panel: leave left of mic→deafen→settings; still no camera/blur on panel.
3. Hang up via panel leave.
4. Rejoin, stay on **stage**: panel has no leave; cam/blur/leave on stage chrome; mic/deafen still on panel.

**Expect**: UP-08–09, UP-01.

## D — Single JOIN, camera off → banco

1. Open voice channel while not live.
2. Confirm **one** primary JOIN (no dual “with/without camera” primaries).
3. Leave camera opt-in **off**; blur inactive/hidden.
4. JOIN → land on **banco**, camera off; no camera permission prompt before opt-in.

**Expect**: [voice-join-optin.md](./contracts/voice-join-optin.md) VJ-01–05, VJ-06; 032 bank rule.

## E — Opt-in camera + blur + lazy preview → palco rules

1. On pre-join, toggle camera **on**.
2. Confirm blur becomes available; optional local preview may appear only now.
3. Set blur if supported; JOIN.
4. Enter with camera on; slot/palco follows existing auto-assign rules (not forced bank).

**Expect**: VJ-03–04, VJ-06–08.

## F — Typecheck

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## G — Optional regression

If present, run existing contract tests for join `cam_on: false` → no slot / `cam_on: true` auto-assign (032):

```bash
cd backend && cargo test --test contract voice_occupancy -- --nocapture
```

(Adjust filter to the project’s actual 032 test module name if different.)
