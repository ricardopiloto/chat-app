# Research: 069-idle-chat-stall

## R1 — Root cause of idle stall

**Decision**: Treat the primary defect as **client WebSocket without reconnect**.

Today (`frontend/src/api/ws.ts` + `App.tsx`):

- `connectWs` opens `/ws`, sends `"ping"` every 25s, clears interval on `close`.
- `App` creates one socket when `me` + `identity` are set; `onCleanup` closes it.
- On `close` / network drop / proxy idle kill: **no reconnect** → no further `message.new` → chat looks frozen until F5.
- F5 clears in-memory identity → unlock prompt (expected E2EE; out of scope to remove).

Server accepts text `"ping"` (`api/mod.rs` ws handler) but does not require app-level reconnect logic on the server for MVP.

**Rationale**: Matches reported symptom (idle without send → stop receiving; refresh “fixes” + unlock).

**Alternatives considered**: Only increase ping frequency — insufficient if socket already closed. Server-only keepalives without client reconnect — still leaves dead client sockets.

## R2 — Incremental catch-up without full refresh

**Decision (MVP)**:

1. On successful WS reconnect (and on `visibilitychange` → visible / `online`): for the **focused text channel**, fetch `GET /api/channels/{id}/messages` (latest page, existing API).
2. Decode/decrypt as today; **merge** rows whose `id` is not already in local state (and/or `created_at` after last visible), preserving order; do **not** wipe the loaded timeline.
3. Deduplicate by message `id`.

Optional follow-up (only if gaps > one page / 200 msgs are real): add `after: DateTime` (or `after_id`) to `MessageQuery` + `list_since` — not required for MVP if idle gaps are small.

**Rationale**: Spec FR-002a = incremental after last visible; existing list already returns recent history; avoids BE churn for the common case.

**Alternatives considered**: Full `setMessages(decoded)` reload — rejected (spec: no full view refresh). Wait only for live WS — rejected (missed events during downtime need catch-up).

## R3 — Connection status + banner UX

**Decision**:

- Maintain a small client status: `connected` | `reconnecting` | `disconnected` (names flexible).
- While not `connected` (after an initial grace if useful), Channel shows a **non-modal banner** in the chat area (FR-004); composer stays usable.
- Clear banner when connected **and** catch-up for the open channel has finished (or immediately on connect if no channel open).
- No mandatory «Tentar novamente» button (clarify Q1).

**Rationale**: Spec US2 + clarify A.

**Alternatives considered**: Toast that auto-dismisses — rejected (can miss). Modal — rejected. Icon-only — weaker against false silence.

## R4 — Background + focus

**Decision**:

- Reconnect loop continues while the tab exists (browser may throttle timers; best-effort).
- On `document.visibilityState === 'visible'` and/or `window` `online`: ensure socket reconnect attempt + channel catch-up if still needed (FR-008).
- SLA ≤10s measured from when the link is usable again (network + tab able to run JS), not from start of background idle.

**Rationale**: Clarify Q5 option B.

**Alternatives considered**: Catch-up only on focus — weaker for long background with working WS. Aggressive background polling HTTP — unnecessary if WS recovers.

## R5 — Unlock / identity

**Decision**: Do not persist unlocked keys across F5 in this feature. Reconnect/catch-up MUST NOT call unlock flows. Post-reload unlock remains product security (FR-005 / US3).

**Rationale**: Spec assumptions + clarify session.

**Alternatives considered**: SessionStorage unlock cache — security/scope expansion; out of scope.

## R6 — Where to implement reconnect

**Decision**: Prefer enhancing `connectWs` (or `createLiveWs`) to:

- accept `onStatus` / return `{ close, getStatus }`;
- on `close`, schedule reconnect with exponential backoff (cap ~10–15s) while session still authenticated;
- stop on intentional `close()` from App cleanup / logout.

`App.tsx` keeps fan-out to `listeners`; optionally pass status via Solid signal/context so Channel can subscribe without prop drilling every route — simplest path that fits current `onWs` is fine (signal in App + prop through ChannelRoute).

**Rationale**: Single place owns socket lifecycle; Channel owns catch-up + banner for open channel.

**Alternatives considered**: Reconnect only inside Channel — wrong (TopBar notifs / presence also need WS). Third-party reconnect library — YAGNI for one socket.
