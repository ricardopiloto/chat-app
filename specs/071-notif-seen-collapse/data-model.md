# Data Model: 071-notif-seen-collapse

## Durable: `UserNotification` (unchanged schema)

| Field | Role in this feature |
|-------|----------------------|
| `id` | Mark read (single / all) |
| `kind` | `mention` \| `reply` — always full list rows |
| `channel_id` | Label + href |
| `message_id` | Viewport match → auto-read; deep-link |
| `created_at` | 068 `when` label |
| `read_at` | Null = pending |

### Transitions

```text
unread (read_at null)
  → mark_read(id)           // click item / Limpar single path
  → mark_all_read(account)  // Limpar
  → auto on viewport match message_id
```

## Session: channel unread item (client-only)

| Field | Type | Notes |
|-------|------|--------|
| `channelId` | string | Group key |
| `messageId` | string | Deep-link + viewport clear |
| `createdAt` | ISO / ms | Ordering; oldest for 5+ click; optional when label |

### Store shape

```text
Map<channelId, SessionUnreadItem[]>  // ordered oldest→newest or newest-first; document one
```

### Transitions

```text
message.new (channel not focused) → append item (dedupe messageId)
message in viewport → remove item
Limpar / clearAll → wipe map
channel.deleted → remove channel key
```

**Removed behavior**: `markSeen(channelId)` on route enter (no longer clears whole channel on open).

## Panel presentation rows

| Row kind | Source | Cap |
|----------|--------|-----|
| Durable detail | unread mention/reply | No 5+ collapse |
| Session detail | ≤5 items / channel | Show each |
| Session 5+ | >5 items / channel | Single aggregate row |

## Validation rules

- Mentions/replies never counted toward session 5+.
- Exactly 5 session items → detail; 6+ → only 5+ for that channel.
- Badge: presence of any durable unread **or** any session item → dot; no count.
- Limpar: all durables read_at set; session map empty.
