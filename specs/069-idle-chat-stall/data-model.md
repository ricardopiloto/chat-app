# Data Model: 069-idle-chat-stall

Client-side presentation / delivery state only. No new persisted tables for MVP.

## Entities

### LiveDeliveryStatus

In-memory session state for the authenticated tab.

| Field | Meaning |
|-------|---------|
| `state` | `connected` \| `reconnecting` \| `disconnected` |
| `lastConnectedAt` | Optional timestamp of last successful open |
| `lastErrorAt` | Optional timestamp of last close/error |

**Rules**:

- Transitions to `reconnecting` on unexpected close while still logged in + unlocked.
- Transitions to `connected` on successful WebSocket `open`.
- Intentional teardown (logout / effect cleanup) stops the reconnect loop (no banner after logout).

### ChannelCatchUpCursor

Per open text channel (ephemeral).

| Field | Meaning |
|-------|---------|
| `channelId` | Channel in view |
| `lastVisibleMessageId` | Id of newest message already in local timeline (or null if empty) |
| `lastVisibleCreatedAt` | Optional ISO for ordering helpers |

**Rules**:

- Catch-up fetches recent history and **appends only** messages not already present (incremental).
- Must not clear older loaded pages (`before` pagination) as a side effect of catch-up.

### DeliveryBannerView

UI projection of FR-004.

| Field | Meaning |
|-------|---------|
| `visible` | True when delivery interrupted for the channel chrome |
| `copy` | Short PT string (e.g. actualizações interrompidas / a reconectar) |

**Rules**:

- Non-modal; composer remains interactive.
- Hidden when `connected` and catch-up for current channel complete (or no catch-up needed).

## Relationships

```text
App (auth + identity unlocked)
  └── LiveDeliveryStatus ──(WS)──► Hub events (message.new, …)
        └── Channel (in view)
              ├── ChannelCatchUpCursor
              └── DeliveryBannerView
```

## Validation / invariants

- Catch-up never requires identity unlock if already unlocked.
- Catch-up never depends on the user sending a message.
- Message list order remains chronological after merge (dedupe by `id`).
- Missed gap larger than one list page: document as known MVP limit unless `after=` is added later ([research.md](./research.md) R2).
