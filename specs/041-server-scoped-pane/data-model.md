# Data Model: 041-server-scoped-pane

Sem alterações de schema backend. Estado de navegação + preferências no cliente.

## Entities

### Selected server (existing UI state)

| Field | Source | Notes |
|-------|--------|-------|
| `selectedServerId` | AppShell signal | Actualizado pela ServerRail |

### Channel list (existing API)

| Field | Notes |
|-------|-------|
| `id`, `server_id`, `type`, `name` | `GET /api/servers/:id/channels` |

### Last channel by server (new preference)

| Field | Type | Storage |
|-------|------|---------|
| map | `Record<serverId, channelId>` | `localStorage` key `mesa.lastChannelByServer` |

Validation: on resolve, channelId MUST exist in current channel list; else discard entry.

### Empty server view

| Field | Notes |
|-------|-------|
| `serverId` | from route `/servers/:serverId` |
| `joke` | string picked once per mount from curated list |

### Joke catalog

| Field | Notes |
|-------|-------|
| `jokes[]` | ≥3 PT-BR light jokes; static module |

## Relationships

```text
select(server) → channels(server)
  → length 0 → EmptyServerView(server)
  → else → ChannelView(resolve(server, channels))
ChannelView shown → writeLastChannel(server, channel)
```

## State transitions

```text
[viewing channel of A] --select B (has channels)--> [viewing resolved channel of B]
[viewing channel of A] --select B (0 channels)--> [empty joke pane for B]
[empty B] --first channel created + open--> [channel of B]
[any] --reload + select B--> [last channel of B if valid, else fallback]
```

## Validation

- Main pane channel's `server_id` MUST equal selected server when showing a channel.
- Empty pane ONLY when channel list length is 0.
- Last-channel map MUST NOT force navigation to another server's channel id.
