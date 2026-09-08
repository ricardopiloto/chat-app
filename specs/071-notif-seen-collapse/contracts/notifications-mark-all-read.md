# Contract: Mark all notifications read

**Feature**: 071-notif-seen-collapse  
**Surface**: Backend HTTP + `frontend/src/api/client.ts`

## Endpoint

```http
POST /api/notifications/read-all
Authorization: session cookie (same as other /api/notifications)
```

### Response

- `204 No Content` on success (including when zero rows updated).
- `401` if unauthenticated (existing auth pattern).

### Semantics

- Sets `read_at = now` for **all** `user_notification` rows for the authenticated account where `read_at IS NULL`.
- Idempotent.

### Non-goals

- Partial clear by channel/kind (out of scope; Limpar = all durables).
- Returning the updated list (client clears local state / may refetch).

## Client helper

```ts
markAllNotificationsRead(): Promise<void>
```

Maps to the endpoint above; used by TopBar **Limpar** together with session `clearAllUnseen()`.

## Test sketch

- Seed ≥2 unread notifications for account A; POST read-all as A → list `unread_only=true` empty.
- Account B’s unread unchanged.
