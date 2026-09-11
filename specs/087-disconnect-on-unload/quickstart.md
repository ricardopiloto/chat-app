# Quickstart: 087-disconnect-on-unload

Validate that refresh/tab close clear voice occupancy, with server stale backup.

## Prerequisites

- App running (`cargo run` + `npm run dev`)
- Two browsers/profiles, same voice channel, both in call
- DevTools Network helpful for leave on unload

## 1 — Refresh clears presence (UL-01–UL-03, SC-001)

1. User A and B in the same call.
2. A refreshes the page.
3. **Expect** (within ~10s): B’s sidebar / channel occupants / stage no longer show A as in the call.
4. **Expect**: After reload, A is not “still connected” until A joins again.

## 2 — Tab close clears presence (SC-002)

1. A and B in call.
2. A closes the call tab (B watches).
3. **Expect** (within ~10s): B no longer sees A connected.

## 3 — Multi-tab (UL-06)

1. A has two Mesa tabs; only one is in the live call.
2. Close/refresh the **call** tab.
3. **Expect**: A is not shown as in-call anywhere; the other tab does not keep ghost presence.

## 4 — Intentional leave still works (UL-04, SC-004)

1. A leaves via Leave / hang-up without closing the tab.
2. **Expect**: B sees A leave immediately as today; no errors on later unload.

## 5 — Abrupt kill / stale safety net (SO-01–SO-04, SC-005/006)

1. Simulate failed unload leave (e.g. DevTools block leave URL, or kill tab without keepalive if reproducible).
2. **Expect**: Within ~1 minute, B’s UI stops listing A (sweeper + WS), without B refreshing.

## Automated

```bash
cd backend && cargo test --test voice_occupancy
cd frontend && ./node_modules/.bin/tsc --noEmit
```
