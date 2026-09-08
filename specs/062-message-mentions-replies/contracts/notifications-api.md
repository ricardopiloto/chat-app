# Contract: User notifications API & topbar

**Feature**: 062-message-mentions-replies  
**Surfaces**: `GET /api/notifications`, mark-read; TopBar Notificações; WS `notification.created`

## GET /api/notifications

Query: `?unread_only=true` (default true) optional `limit`.

```json
[
  {
    "id": "…",
    "kind": "mention",
    "channel_id": "…",
    "message_id": "…",
    "actor_account_id": "…",
    "created_at": "…",
    "read_at": null
  }
]
```

## Mark read

`POST /api/notifications/{id}/read` → 204  
Optional: `POST /api/notifications/read-all`

## Topbar UI

- Badge/dot when unread notifications **or** existing session unseen channels
- Panel sections or labeled rows: **Menção** / **Resposta** vs «Canal com atividade»
- Click mention/reply: navigate to channel + message; mark read; close panel
- Missing message: show «Mensagem indisponível» in channel chrome

## WS

`notification.created` → payload = notification object; FE bumps badge / list.
