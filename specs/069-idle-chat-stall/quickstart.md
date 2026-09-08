# Quickstart: 069-idle-chat-stall

**Contract**: [live-delivery-recovery](./contracts/live-delivery-recovery.md)

## Prerequisites

- App running (`npm run dev` + `cargo run` or equivalent).
- Two accounts (A = observer, B = sender) in the same **text** channel.
- A unlocked and viewing the channel; B able to send.

## A — Idle without send still receives

1. As A, open the channel, unlock if needed, leave the tab open (optionally idle several minutes without sending).
2. As B, send 2–3 messages.

**Expect**: A sees the new messages **without F5** (live or after auto-recovery ≤ 10 s once the link is usable). No unlock prompt on A.

## B — Simulated WS drop + auto recovery

1. As A, open the channel.
2. Force the browser WebSocket to close (DevTools → Network → WS → close frame / disable network briefly then re-enable).
3. As B, send messages while A is disconnected; then restore A’s network.

**Expect**: A shows the **banner** while degraded; after reconnect, banner clears and missed messages appear via **catch-up** (no duplicate chaos); no unlock; no F5.

## C — Incremental merge (no full wipe)

1. As A, scroll up to load older history (`before`) if available.
2. Trigger reconnect + catch-up (B).

**Expect**: Older loaded messages remain; only newer missing messages append. Timeline order stays sensible.

## D — Background / focus

1. As A, switch to another tab for a few minutes; B sends messages.
2. Return to the Mesa tab.

**Expect**: Within ≤ 10 s of a usable link + focus, A has the missing messages (background reconnect best-effort + focus catch-up). No F5.

## E — Banner UX

1. With delivery interrupted (B), inspect the channel chrome.

**Expect**: Discrete **non-modal** banner in the chat area; composer still usable; banner gone after recovery.

## F — F5 unlock unchanged

1. As A (unlocked), hard-refresh the page.

**Expect**: Product may ask to **desbloquear** again (existing security). This is **not** a regression for 069.

## Validation commands

```bash
cd frontend && npx tsc --noEmit
```

Manual A–F above; no new backend contract suite required for reconnect MVP.
