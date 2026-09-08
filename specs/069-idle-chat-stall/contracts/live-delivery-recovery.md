# Contract: Live delivery recovery (client)

**Feature**: [069-idle-chat-stall](../spec.md)  
**Audience**: Implementers of WS lifecycle + Channel UI

## Scope

Client behavior for **automatic** WebSocket recovery, **incremental** history catch-up, and **delivery banner**. No change to post-F5 identity unlock. Voice channels out of scope.

## WebSocket lifecycle

| Event | Required behavior |
|-------|-------------------|
| Socket `open` | Status → `connected`; notify subscribers |
| Unexpected `close` / error while session unlocked | Status → `reconnecting`; schedule reconnect with backoff; **do not** prompt unlock |
| Reconnect success | Status → `connected`; trigger catch-up for focused text channel |
| Intentional close (logout / App cleanup) | Stop reconnect loop; no banner |

Keepalive: retain client `"ping"` (or equivalent) while `OPEN` so idle proxies are less likely to drop the socket; reconnect remains mandatory when drop still happens.

## Catch-up (focused text channel)

| Step | Behavior |
|------|----------|
| Trigger | WS reconnect success; and/or `visibility` visible; and/or `online` |
| Fetch | Existing `GET /api/channels/{channelId}/messages` (latest page) |
| Merge | Decode/decrypt; append messages whose `id` ∉ local timeline; sort/append in chrono order; **no full wipe** |
| Done | Banner may clear; live `message.new` continues |

SLA: from “link usable again” to messages visible / catch-up done ≤ **10 s** under normal test conditions ([spec SC-001](../spec.md)).

## Banner (US2 / FR-004)

| Rule | Requirement |
|------|-------------|
| Placement | Discrete strip in **text channel** chrome (not TopBar-only) |
| Modal | Forbidden |
| Composer | Remains usable |
| Visibility | Shown while delivery interrupted / reconnecting (after optional short grace) |
| Clear | When connected and catch-up for this channel finished |

Suggested copy (product PT; exact string flexible): «Actualizações interrompidas — a reconectar…» / «A recuperar mensagens…».

## Non-goals (this contract)

- Persisting unlocked identity across full page reload
- Requiring user send to resume receive
- Mandatory manual «Tentar novamente» control
- Changing `message.new` payload schema

## Validation

See [quickstart.md](../quickstart.md) scenarios A–F.
